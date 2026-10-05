// Owned by sim agent. OwnedHero (+ items, equipped spell passives, team mods) -> CombatStats.
import type {
  Attr,
  BuffStat,
  CombatStats,
  HeroDef,
  HeroId,
  ItemDef,
  HeroMods,
  ItemId,
  OwnedHero,
  PassiveDef,
  SpellDef,
  SpellId,
  StatBlock,
  TeamMods,
} from './types.ts';
import { HEROES, ITEMS, SPELLS } from './data/index.ts';
import { MAX_HERO_LEVEL } from './constants.ts';

export const STAT_KEYS: readonly (keyof StatBlock)[] = [
  'str',
  'agi',
  'int',
  'damage',
  'armor',
  'attackSpeed',
  'hp',
  'mana',
  'hpRegen',
  'manaRegen',
  'spellAmp',
  'lifesteal',
  'spellLifesteal',
  'evasion',
  'magicResist',
  'moveSpeed',
  'attackRange',
  'cooldownReduction',
];
const STAT_KEY_SET = new Set<string>(STAT_KEYS);
export const isStatKey = (k: BuffStat | string): k is keyof StatBlock => STAT_KEY_SET.has(k);

export const BASE_HP = 200;
export const BASE_MANA = 75;
export const BASE_MAGIC_RESIST = 25;

export function zeroStats(): StatBlock {
  return {
    str: 0,
    agi: 0,
    int: 0,
    damage: 0,
    armor: 0,
    attackSpeed: 0,
    hp: 0,
    mana: 0,
    hpRegen: 0,
    manaRegen: 0,
    spellAmp: 0,
    lifesteal: 0,
    spellLifesteal: 0,
    evasion: 0,
    magicResist: 0,
    moveSpeed: 0,
    attackRange: 0,
    cooldownReduction: 0,
  };
}

/** Normalise a "percent" number that content may have written as a fraction (0.25) or a percent (25). */
export const asPct = (v: number | undefined): number => {
  const n = v ?? 0;
  return n > 0 && n <= 1 ? n * 100 : n;
};

const FALLBACK_HERO: Omit<HeroDef, 'id'> = {
  name: 'Unknown',
  stars: 1,
  cls: 'warrior',
  primary: 'str',
  ranged: false,
  attackRange: 60,
  projectileSpeed: 0,
  baseStr: 20,
  baseAgi: 15,
  baseInt: 15,
  gainStr: 2.5,
  gainAgi: 1.5,
  gainInt: 1.5,
  baseDamage: 30,
  baseArmor: 2,
  bat: 1.7,
  moveSpeed: 110,
  signature: 'flesh_heap',
  palette: { primary: '#888', secondary: '#555', accent: '#ccc' },
  blurb: '',
};

/** HeroDef lookup that never returns undefined (falls back to a generic melee hero). */
export function getHeroDef(id: HeroId): HeroDef {
  return HEROES[id] ?? ({ ...FALLBACK_HERO, id } as HeroDef);
}

export const spellMult = (spell: SpellDef, level: number): number =>
  1 + (Number.isFinite(spell.levelScaling) ? spell.levelScaling : 0.05) * (Math.max(1, level) - 1);

export interface PassiveEntry {
  p: PassiveDef;
  mult: number; // level magnitude multiplier (1 for items)
  spellId: SpellId | null;
  itemId: ItemId | null;
}

export interface Loadout {
  def: HeroDef;
  level: number;
  spells: SpellDef[]; // equipped, in slot order (cast priority), unknown ids dropped
  items: ItemDef[];
  passives: PassiveEntry[];
  aghanim: boolean; // carries Aghanim's Scepter: spells are the patched versions
}

export const hasAghanim = (hero: OwnedHero): boolean => (hero.items ?? []).includes('aghanims_scepter');

/** Spell as upgraded by Aghanim's Scepter (shallow merge of the patch over the base def). */
export function applyAghanim(s: SpellDef): SpellDef {
  const patch = s.aghanim?.patch;
  if (!patch) return s;
  const out: SpellDef = { ...s };
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) (out as unknown as Record<string, unknown>)[k] = v;
  return out;
}

export function loadout(hero: OwnedHero, heroMods?: HeroMods): Loadout {
  const def = getHeroDef(hero.heroId);
  const level = Math.max(1, Math.min(MAX_HERO_LEVEL, Math.floor(hero.level || 1)));
  const aghanim = hasAghanim(hero);
  const spells: SpellDef[] = [];
  for (const id of hero.spells ?? []) {
    if (!id) continue;
    const s = SPELLS[id];
    if (s) spells.push(aghanim ? applyAghanim(s) : s);
  }
  const items: ItemDef[] = [];
  for (const id of hero.items ?? []) {
    if (!id) continue;
    const it = ITEMS[id];
    if (it) items.push(it);
  }
  // spells granted for this battle (lord HeroMods, items) go after the hero's own spells
  const granted: SpellId[] = [...(heroMods?.grantSpells ?? [])];
  for (const it of items) granted.push(...(it.grantsSpells ?? []));
  for (const id of granted) {
    const s = SPELLS[id];
    if (!s || spells.some((x) => x.id === id)) continue;
    spells.push(aghanim ? applyAghanim(s) : s);
  }
  const passives: PassiveEntry[] = [];
  for (const s of spells) {
    const m = spellMult(s, level);
    for (const p of s.passives ?? []) passives.push({ p, mult: m, spellId: s.id, itemId: null });
  }
  for (const it of items) {
    for (const p of it.passives ?? []) passives.push({ p, mult: 1, spellId: null, itemId: it.id });
  }
  return { def, level, spells, items, passives, aghanim };
}

const combinePct = (base: number, sources: number[]): number => {
  // independent multiplicative stacking: 1 - prod(1 - x)
  let keep = 1 - base / 100;
  for (const s of sources) keep *= 1 - Math.max(-100, Math.min(100, s)) / 100;
  return 100 * (1 - keep);
};

export function computeStats(hero: OwnedHero, mods?: TeamMods, heroMods?: HeroMods): CombatStats {
  return computeFromLoadout(hero, loadout(hero, heroMods), mods ?? {}, heroMods);
}

export function computeFromLoadout(hero: OwnedHero, lo: Loadout, mods: TeamMods, hm: HeroMods = {}): CombatStats {
  const def = lo.def;
  const lv = lo.level;
  const add = zeroStats();
  const evSrc: number[] = [];
  const mrSrc: number[] = [];
  const addStat = (k: keyof StatBlock, v: number) => {
    if (!v || !Number.isFinite(v)) return;
    if (k === 'evasion') evSrc.push(asPct(v));
    else if (k === 'magicResist') mrSrc.push(v);
    else add[k] += v;
  };
  for (const it of lo.items) {
    for (const k of STAT_KEYS) addStat(k, it.stats?.[k] ?? 0);
  }
  for (const pe of lo.passives) {
    const p = pe.p;
    if (p.t === 'stat' && isStatKey(p.stat)) addStat(p.stat, p.value * pe.mult);
    else if (p.t === 'evasion') evSrc.push(asPct(p.pct));
  }
  // permanent flat bonuses on the owned hero (lord abilities)
  if (hero.bonus) for (const k of STAT_KEYS) addStat(k, hero.bonus[k] ?? 0);
  add.attackRange += hm.attackRange ?? 0;
  add.moveSpeed += hm.moveSpeed ?? 0;
  const stacks = hero.stacks ?? { str: 0, agi: 0, int: 0 };
  const str = def.baseStr + def.gainStr * (lv - 1) + (stacks.str || 0) + add.str;
  const agi = def.baseAgi + def.gainAgi * (lv - 1) + (stacks.agi || 0) + add.agi;
  const int = def.baseInt + def.gainInt * (lv - 1) + (stacks.int || 0) + add.int;
  const attrs: Record<Attr, number> = { str, agi, int };

  let damage = def.baseDamage + attrs[def.primary] + add.damage;
  if (hm.agiDamageMult) damage += Math.floor(hm.agiDamageMult * agi);
  damage *= (1 + (mods.damagePct ?? 0) / 100) * (1 + (hm.damagePct ?? 0) / 100);
  const armor = def.baseArmor + agi * 0.17 + add.armor + (mods.armor ?? 0);
  const attackSpeed = Math.max(20, Math.min(700, 100 + agi + add.attackSpeed + (mods.attackSpeed ?? 0)));
  const maxHp = Math.max(1, (BASE_HP + str * 20 + add.hp) * (1 + (mods.hpPct ?? 0) / 100));
  const maxMana = Math.max(0, BASE_MANA + int * 12 + add.mana);
  const bat = def.bat > 0 ? def.bat : 1.7;
  const ranged = !!def.ranged;
  return {
    str,
    agi,
    int,
    damage: Math.max(1, damage),
    armor,
    attackSpeed,
    hp: maxHp,
    mana: maxMana,
    hpRegen: str * 0.1 + add.hpRegen,
    manaRegen: int * 0.05 + add.manaRegen,
    spellAmp: int * 0.07 + add.spellAmp + (mods.spellAmp ?? 0),
    lifesteal: add.lifesteal,
    spellLifesteal: add.spellLifesteal,
    evasion: Math.min(85, combinePct(0, evSrc)),
    magicResist: Math.min(95, combinePct(BASE_MAGIC_RESIST, mrSrc)),
    moveSpeed: Math.max(30, (def.moveSpeed || 110) + add.moveSpeed),
    attackRange: Math.max(40, (def.attackRange || (ranged ? 350 : 60)) + add.attackRange),
    cooldownReduction: Math.max(0, Math.min(60, add.cooldownReduction)),
    maxHp,
    maxMana,
    bat,
    attackInterval: bat / (attackSpeed / 100),
    ranged,
    projectileSpeed: ranged ? def.projectileSpeed || 900 : 0,
  };
}

/** Physical damage multiplier for a given armor value. */
export const armorMult = (a: number): number => 1 - (0.06 * a) / (1 + 0.06 * Math.abs(a));

/** Rough strength estimate (bots / UI). ~ sqrt(effective hp * dps) with a bonus for spells & items. */
export function heroPower(hero: OwnedHero): number {
  const lo = loadout(hero);
  const s = computeFromLoadout(hero, lo, {});
  const ehp = (s.maxHp / Math.max(0.2, armorMult(s.armor))) / (1 - (s.evasion / 100) * 0.6);
  const dps = (s.damage / s.attackInterval) * (1 + s.lifesteal / 200);
  const spellBonus = 1 + 0.12 * lo.spells.length + (s.spellAmp / 100) * 0.5;
  return Math.round(Math.sqrt(ehp * dps) * spellBonus);
}
