// Runtime unit model for the battle sim.
import type {
  AnimState,
  Attr,
  BuffStat,
  CombatStats,
  DamageType,
  HeroClass,
  HeroDef,
  HeroId,
  ItemDef,
  ItemId,
  OwnedHero,
  PassiveDef,
  SpellDef,
  SpellId,
  Team,
  TeamMods,
  Vec,
} from '../types.ts';
import { asPct, computeFromLoadout, isStatKey, loadout, spellMult, type PassiveEntry } from '../stats.ts';

export type CurKey =
  | BuffStat
  | 'maxHp'
  | 'maxMana'
  | 'bat'
  | 'attackInterval'
  | 'projectileSpeed'
  | 'slow'
  | 'blind';
export type Cur = Record<CurKey, number>;

export interface Buff {
  stat: BuffStat;
  value: number;
  until: number; // Infinity = rest of battle
  show: boolean; // counts as 'buffed' status
}

export interface Dot {
  dps: number;
  dmgType: DamageType;
  until: number;
  next: number;
  src: Unit | null;
  spell: boolean;
}

export interface Timed {
  pct: number;
  until: number;
}

export interface SpellSlot {
  def: SpellDef;
  cd: number;
  mult: number;
  radius: number; // for cast event VFX
}

export interface ItemSlot {
  def: ItemDef;
  cd: number;
  used: boolean;
}

export interface Tgt {
  primary: Unit | null;
  units: Unit[];
  point: Vec;
}

export type Action =
  | { k: 'none' }
  | { k: 'attack'; target: Unit; t: number; point: number }
  | { k: 'cast'; spell: SpellSlot; tgt: Tgt; t: number }
  | { k: 'channel'; zoneId: number }
  | {
      k: 'omni';
      left: number;
      next: number;
      interval: number;
      attackMult: number;
      spellId: SpellId | null;
      itemId: ItemId | null;
    };

export interface Unit {
  i: number;
  uid: string;
  heroId: HeroId;
  def: HeroDef;
  team: Team;
  level: number;
  cls: HeroClass;
  primary: Attr;
  base: CombatStats;
  cur: Cur;
  x: number;
  y: number;
  facing: 1 | -1;
  hp: number;
  mana: number;
  alive: boolean;

  spells: SpellSlot[]; // active spells in priority order
  items: ItemSlot[];
  passives: PassiveEntry[];
  crits: PassiveEntry[];
  onAttack: PassiveEntry[];
  onAttacked: PassiveEntry[];
  auras: PassiveEntry[];
  killStacks: PassiveEntry[];
  steals: PassiveEntry[];
  splits: PassiveEntry[];
  bonusDmg: PassiveEntry[];
  cleaves: PassiveEntry[];
  furyPerStack: number;
  furySpell: SpellId | null;
  berserkAS: number;
  berserkRegen: number;
  trueStrike: boolean;
  perm: { damagePct: number; damageReduction: number; attackSpeedPct: number };

  buffs: Buff[];
  auraAcc: Buff[]; // recomputed every tick
  dots: Dot[];
  slows: Timed[];
  blinds: Timed[];
  stunUntil: number;
  silenceUntil: number;
  rootUntil: number;
  hexUntil: number;
  immuneUntil: number;
  invulnUntil: number;
  graveUntil: number;
  swipes: Map<number, number>;

  action: Action;
  attackCd: number;
  target: Unit | null;
  retargetAt: number;
  lockTarget: boolean;
  moved: boolean;

  anim: AnimState;
  animT: number;
  animDur: number;
  animLockUntil: number;
}

const spellRadius = (s: SpellDef): number => {
  if (s.aoeRadius) return s.aoeRadius;
  for (const e of s.effects ?? []) {
    if ('area' in e && e.area) return e.area.shape === 'circle' ? e.area.radius : e.area.width;
    if (e.t === 'zone') return e.radius;
    if (e.t === 'projectile' && e.line) return e.line.width;
    if (e.t === 'bounce') return e.range;
  }
  return 0;
};

export function createUnit(
  hero: OwnedHero,
  uid: string,
  i: number,
  team: Team,
  mods: TeamMods,
  pos: Vec,
): Unit {
  const lo = loadout(hero);
  const base = computeFromLoadout(hero, lo, mods);
  const ps = lo.passives;
  const of = (t: PassiveDef['t']) => ps.filter((pe) => pe.p.t === t);
  const customs = (id: string) => ps.filter((pe) => pe.p.t === 'custom' && pe.p.id === id);
  let furyPerStack = 0;
  let furySpell: SpellId | null = null;
  let berserkAS = 0;
  let berserkRegen = 0;
  const perm = { damagePct: 0, damageReduction: 0, attackSpeedPct: 0 };
  for (const pe of ps) {
    const p = pe.p;
    if (p.t === 'fury_swipes') {
      furyPerStack += p.perStack * pe.mult;
      furySpell = pe.spellId;
    } else if (p.t === 'berserkers_blood') {
      berserkAS += p.maxAttackSpeed * pe.mult;
      berserkRegen += p.maxRegen * pe.mult;
    } else if (p.t === 'stat' && !isStatKey(p.stat)) {
      perm[p.stat as keyof typeof perm] += p.value * pe.mult;
    }
  }
  const spells: SpellSlot[] = [];
  for (const s of lo.spells) {
    if (s.kind !== 'active' || !s.effects || s.effects.length === 0) continue;
    spells.push({ def: s, cd: 0, mult: spellMult(s, lo.level), radius: spellRadius(s) });
  }
  const items: ItemSlot[] = lo.items.map((def) => ({
    def,
    cd: def.active?.when === 'cooldown' ? Math.max(0.5, def.active.cooldown ?? 10) : 0,
    used: false,
  }));
  const u: Unit = {
    i,
    uid,
    heroId: hero.heroId,
    def: lo.def,
    team,
    level: lo.level,
    cls: lo.def.cls,
    primary: lo.def.primary,
    base,
    cur: {} as Cur,
    x: pos.x,
    y: pos.y,
    facing: team === 'left' ? 1 : -1,
    hp: base.maxHp,
    mana: base.maxMana * 0.5,
    alive: true,
    spells,
    items,
    passives: ps,
    crits: of('crit'),
    onAttack: of('on_attack'),
    onAttacked: of('on_attacked'),
    auras: of('aura'),
    killStacks: of('on_kill_stack'),
    steals: of('on_hit_steal'),
    splits: of('split_shot'),
    bonusDmg: of('bonus_attack_damage'),
    cleaves: customs('cleave'),
    furyPerStack,
    furySpell,
    berserkAS,
    berserkRegen,
    trueStrike: customs('true_strike').length > 0,
    perm,
    buffs: [],
    auraAcc: [],
    dots: [],
    slows: [],
    blinds: [],
    stunUntil: 0,
    silenceUntil: 0,
    rootUntil: 0,
    hexUntil: 0,
    immuneUntil: 0,
    invulnUntil: 0,
    graveUntil: 0,
    swipes: new Map(),
    action: { k: 'none' },
    attackCd: 0,
    target: null,
    retargetAt: 0,
    lockTarget: false,
    moved: false,
    anim: 'idle',
    animT: 0,
    animDur: 0,
    animLockUntil: 0,
  };
  refreshStats(u, 0);
  return u;
}

const ATTR_KEYS: Attr[] = ['str', 'agi', 'int'];

/** Recompute dynamic stats from base + buffs + auras + slows. Also expires timed entries. */
export function refreshStats(u: Unit, t: number): void {
  const b = u.base;
  const prevMax = u.cur.maxHp;
  const c: Cur = {
    str: b.str,
    agi: b.agi,
    int: b.int,
    damage: b.damage,
    armor: b.armor,
    attackSpeed: 100 + (b.attackSpeed - 100), // unclamped copy
    hp: 0,
    mana: 0,
    hpRegen: b.hpRegen,
    manaRegen: b.manaRegen,
    spellAmp: b.spellAmp,
    lifesteal: b.lifesteal,
    spellLifesteal: b.spellLifesteal,
    evasion: b.evasion,
    magicResist: b.magicResist,
    moveSpeed: b.moveSpeed,
    attackRange: b.attackRange,
    cooldownReduction: b.cooldownReduction,
    damagePct: u.perm.damagePct,
    damageReduction: u.perm.damageReduction,
    attackSpeedPct: u.perm.attackSpeedPct,
    maxHp: b.maxHp,
    maxMana: b.maxMana,
    bat: b.bat,
    attackInterval: b.attackInterval,
    projectileSpeed: b.projectileSpeed,
    slow: 0,
    blind: 0,
  };
  if (u.buffs.length) u.buffs = u.buffs.filter((x) => x.until > t);
  for (const x of u.buffs) c[x.stat] += x.value;
  for (const x of u.auraAcc) c[x.stat] += x.value;
  // attribute deltas -> derived stats
  const dStr = c.str - b.str;
  const dAgi = c.agi - b.agi;
  const dInt = c.int - b.int;
  c.maxHp += dStr * 20 + c.hp;
  c.hpRegen += dStr * 0.1;
  c.armor += dAgi * 0.17;
  c.attackSpeed += dAgi;
  c.maxMana += dInt * 12 + c.mana;
  c.manaRegen += dInt * 0.05;
  c.spellAmp += dInt * 0.07;
  c.damage += u.primary === 'str' ? dStr : u.primary === 'agi' ? dAgi : dInt;
  void ATTR_KEYS;
  // berserker's blood
  if (u.berserkAS || u.berserkRegen) {
    const missing = Math.max(0, Math.min(1, 1 - u.hp / Math.max(1, b.maxHp)));
    c.attackSpeed += u.berserkAS * missing;
    c.hpRegen += u.berserkRegen * missing;
  }
  // slows / blinds (strongest applies)
  if (u.slows.length) {
    u.slows = u.slows.filter((x) => x.until > t);
    for (const x of u.slows) c.slow = Math.max(c.slow, x.pct);
  }
  if (u.blinds.length) {
    u.blinds = u.blinds.filter((x) => x.until > t);
    for (const x of u.blinds) c.blind = Math.max(c.blind, x.pct);
  }
  c.slow = Math.min(90, c.slow);
  c.blind = Math.min(100, c.blind);
  c.attackSpeed *= 1 + c.attackSpeedPct / 100;
  c.attackSpeed *= 1 - c.slow / 100;
  c.attackSpeed = Math.max(20, Math.min(700, c.attackSpeed));
  c.attackInterval = c.bat / (c.attackSpeed / 100);
  c.moveSpeed = Math.max(0, c.moveSpeed * (1 - c.slow / 100));
  if (u.rootUntil > t) c.moveSpeed = 0;
  if (u.hexUntil > t) c.moveSpeed = Math.min(c.moveSpeed, 70);
  c.damage = Math.max(1, c.damage * (1 + c.damagePct / 100));
  c.evasion = Math.max(0, Math.min(85, c.evasion));
  c.magicResist = Math.min(95, c.magicResist);
  c.damageReduction = Math.min(90, c.damageReduction);
  c.maxHp = Math.max(1, c.maxHp);
  c.maxMana = Math.max(0, c.maxMana);
  u.cur = c;
  if (u.alive) {
    if (prevMax !== undefined && prevMax !== c.maxHp && prevMax > 0) {
      u.hp = Math.max(1, (u.hp * c.maxHp) / prevMax);
    }
    if (u.hp > c.maxHp) u.hp = c.maxHp;
    if (u.mana > c.maxMana) u.mana = c.maxMana;
  }
}

export const pctOf = asPct;
