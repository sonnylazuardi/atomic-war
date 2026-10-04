// Safe content lookups + formatting helpers. Fallbacks keep the UI alive while data is incomplete.
import { HEROES, ITEMS, LORDS, SPELLS } from '../../core/data/index.ts';
import { SIGNATURE_SPELLS } from '../../core/ids.ts';
import { computeStats } from '../../core/stats.ts';
import type {
  Attr,
  CombatStats,
  HeroClass,
  HeroDef,
  HeroId,
  ItemDef,
  ItemId,
  LordDef,
  LordId,
  OwnedHero,
  SpellDef,
  SpellId,
  StatBlock,
  TeamMods,
} from '../../core/types.ts';

export const pretty = (id: string) =>
  id
    .split('_')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');

export function heroDef(id: HeroId): HeroDef {
  const d = (HEROES as Partial<Record<HeroId, HeroDef>>)[id];
  if (d) return d;
  return {
    id,
    name: pretty(id),
    stars: 1,
    cls: 'warrior',
    primary: 'str',
    ranged: false,
    attackRange: 60,
    projectileSpeed: 0,
    baseStr: 20,
    baseAgi: 15,
    baseInt: 15,
    gainStr: 2,
    gainAgi: 2,
    gainInt: 2,
    baseDamage: 40,
    baseArmor: 2,
    bat: 1.7,
    moveSpeed: 110,
    signature: SIGNATURE_SPELLS[id],
    palette: { primary: '#888', secondary: '#555', accent: '#ccc' },
    blurb: '',
  };
}

export function spellDef(id: SpellId): SpellDef {
  const d = (SPELLS as Partial<Record<SpellId, SpellDef>>)[id];
  if (d) return d;
  return {
    id,
    name: pretty(id),
    stars: 1,
    glyph: '✦',
    description: '',
    kind: 'active',
    ultimate: false,
    manaCost: 0,
    cooldown: 0,
    castRange: 0,
    castPoint: 0,
    target: 'nearest_enemy',
    effects: [],
    levelScaling: 0,
    vfx: { kind: 'at_target', duration: 0.5, color: '#fff' },
  };
}

export function itemDef(id: ItemId): ItemDef {
  const d = (ITEMS as Partial<Record<ItemId, ItemDef>>)[id];
  if (d) return d;
  return { id, name: pretty(id), glyph: '◆', tier: 1, cost: 3, description: '', stats: {} };
}

export function lordDef(id: LordId): LordDef {
  const d = (LORDS as Partial<Record<LordId, LordDef>>)[id];
  if (d) return d;
  return { id, name: pretty(id), title: '', glyph: '👑', color: '#c9a45c', description: '', kind: 'passive' };
}

export function safeStats(h: OwnedHero, mods?: TeamMods): CombatStats | null {
  try {
    return computeStats(h, mods);
  } catch {
    return null;
  }
}

export const CLASS_INFO: Record<HeroClass, { icon: string; color: string; label: string }> = {
  warrior: { icon: '⚔', color: '#d08a4a', label: 'Warrior' },
  assassin: { icon: '🗡', color: '#b06ad8', label: 'Assassin' },
  mage: { icon: '✷', color: '#5aa8ff', label: 'Mage' },
  hunter: { icon: '➶', color: '#7fcf5a', label: 'Hunter' },
  support: { icon: '✚', color: '#5fd6c4', label: 'Support' },
  mechanic: { icon: '⚙', color: '#c8b26a', label: 'Mechanic' },
};

export const ATTR_INFO: Record<Attr, { label: string; color: string }> = {
  str: { label: 'STR', color: '#e5484d' },
  agi: { label: 'AGI', color: '#5fd068' },
  int: { label: 'INT', color: '#4da3ff' },
};

/** ★ colors: 1 white/grey, 2 green, 3 blue, 4 purple, 5 orange, 6 red. */
export const TIER_COLORS: Record<number, string> = {
  1: '#d3d8de',
  2: '#5fd068',
  3: '#4da3ff',
  4: '#b46cff',
  5: '#ff9f2e',
  6: '#ff4040',
};
export const starColor = (n: number) => TIER_COLORS[Math.max(1, Math.min(6, Math.round(n)))]!;

const STAT_LABELS: Record<keyof StatBlock, [string, boolean]> = {
  str: ['STR', false],
  agi: ['AGI', false],
  int: ['INT', false],
  damage: ['Damage', false],
  armor: ['Armor', false],
  attackSpeed: ['Attack Speed', false],
  hp: ['HP', false],
  mana: ['Mana', false],
  hpRegen: ['HP Regen', false],
  manaRegen: ['Mana Regen', false],
  spellAmp: ['Spell Amp', true],
  lifesteal: ['Lifesteal', true],
  spellLifesteal: ['Spell Lifesteal', true],
  evasion: ['Evasion', true],
  magicResist: ['Magic Resist', true],
  moveSpeed: ['Move Speed', false],
  attackRange: ['Attack Range', false],
  cooldownReduction: ['Cooldown Red.', true],
};

export function statLines(stats: Partial<StatBlock>): string[] {
  const out: string[] = [];
  for (const k of Object.keys(stats) as (keyof StatBlock)[]) {
    const v = stats[k];
    if (!v) continue;
    const [label, pct] = STAT_LABELS[k] ?? [k, false];
    const n = Math.round(v * 10) / 10;
    out.push(`${n > 0 ? '+' : ''}${n}${pct ? '%' : ''} ${label}`);
  }
  return out;
}

export const ordinal = (n: number) => ['1st', '2nd', '3rd', '4th', '5th', '6th'][n - 1] ?? `${n}th`;
export const fmt = (n: number) => (Math.abs(n) >= 100 ? Math.round(n).toString() : (Math.round(n * 10) / 10).toString());
