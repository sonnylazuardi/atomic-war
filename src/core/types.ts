// Contracts shared by every module. Pure types, no runtime code (except type re-exports).
// core/ must never import from ui/ or art/.

import type { HeroId, ItemId, LordId, SpellId } from './ids.ts';
export type { HeroId, ItemId, LordId, SpellId };

// ---------------------------------------------------------------- basics

export type Attr = 'str' | 'agi' | 'int';
export type HeroClass = 'warrior' | 'assassin' | 'mage' | 'hunter' | 'support' | 'mechanic';
export type Team = 'left' | 'right';
export type DamageType = 'physical' | 'magical' | 'pure';
/** Rarity shown as ★. Tavern level sets the odds of each star (TAVERN_ODDS). 6★ exists for items only. */
export type Stars = 1 | 2 | 3 | 4 | 5 | 6;
export interface Vec {
  x: number;
  y: number;
}

/** Flat stat bonuses granted by items / buffs. All optional, all additive. */
export interface StatBlock {
  str: number;
  agi: number;
  int: number;
  damage: number;
  armor: number;
  attackSpeed: number; // +X attack speed (Dota scale, 100 = base)
  hp: number;
  mana: number;
  hpRegen: number; // per second
  manaRegen: number; // per second
  spellAmp: number; // percent, 10 = +10%
  lifesteal: number; // percent of attack damage
  spellLifesteal: number; // percent of spell damage
  evasion: number; // percent
  magicResist: number; // percent
  moveSpeed: number;
  attackRange: number;
  cooldownReduction: number; // percent
}

/** Fully resolved numbers a unit fights with. Produced by core/stats.ts computeStats(). */
export interface CombatStats extends StatBlock {
  maxHp: number;
  maxMana: number;
  bat: number; // base attack time, seconds
  attackInterval: number; // seconds between attacks = bat / (attackSpeed/100), attackSpeed clamped 20..700
  ranged: boolean;
  projectileSpeed: number;
}

// ---------------------------------------------------------------- heroes

export interface HeroPalette {
  primary: string;
  secondary: string;
  accent: string;
}

export interface HeroDef {
  id: HeroId;
  name: string;
  cls: HeroClass;
  primary: Attr;
  ranged: boolean;
  attackRange: number; // arena units; melee ~ 60, ranged 250..450
  projectileSpeed: number; // arena units/s, 0 for melee
  baseStr: number;
  baseAgi: number;
  baseInt: number;
  gainStr: number; // per level
  gainAgi: number;
  gainInt: number;
  baseDamage: number;
  baseArmor: number;
  bat: number; // usually 1.7
  moveSpeed: number; // arena units/s, ~ 90..130
  signature: SpellId;
  stars: Stars; // 1..5 rarity in the Mystery shop
  palette: HeroPalette;
  blurb: string;
}

// ---------------------------------------------------------------- spells & effects

/** Who a spell (or an effect without explicit area) is aimed at. */
export type TargetRule =
  | 'self'
  | 'current_target' // the unit the caster is attacking / would attack
  | 'nearest_enemy'
  | 'farthest_enemy'
  | 'lowest_hp_enemy'
  | 'highest_hp_enemy'
  | 'random_enemy'
  | 'enemy_cluster' // point maximizing enemies within aoeRadius
  | 'backline_enemy' // enemy farthest from its own team's front
  | 'lowest_hp_ally'
  | 'all_enemies'
  | 'all_allies';

export type BuffStat = keyof StatBlock | 'damagePct' | 'damageReduction' | 'attackSpeedPct';

export type Area =
  | { shape: 'circle'; radius: number; center: 'target' | 'caster' }
  | { shape: 'line'; width: number; length: number }; // from caster towards target

export type Affects = 'enemies' | 'allies' | 'all';

/**
 * Effect primitives. The sim implements each once (core/sim/effects.ts).
 * Numeric magnitudes are at hero level 1 and are multiplied by the spell's level scaling.
 * If `area` is omitted the effect hits the spell's resolved target(s).
 */
export type Effect =
  | {
      t: 'damage';
      amount: number;
      dmgType: DamageType;
      area?: Area;
      /** extra damage = attrMult * caster's attr value */
      scaleAttr?: Attr;
      attrMult?: number;
      /** extra damage = pctMissingHp% of target's missing hp (laguna-style executes) */
      pctMissingHp?: number;
      /** extra damage = attackMult x caster attack damage (omnislash, blink strike) */
      attackMult?: number;
    }
  | { t: 'heal'; amount: number; area?: Area; affects?: Affects; scaleAttr?: Attr; attrMult?: number }
  | { t: 'stun'; duration: number; area?: Area }
  | { t: 'silence'; duration: number; area?: Area }
  | { t: 'root'; duration: number; area?: Area }
  | { t: 'slow'; pct: number; duration: number; area?: Area } // move + attack speed
  | { t: 'blind'; pct: number; duration: number; area?: Area } // miss chance
  | { t: 'buff'; stat: BuffStat; value: number; duration: number; area?: Area; affects?: Affects }
  | { t: 'dot'; dps: number; duration: number; dmgType: DamageType; area?: Area }
  | {
      t: 'zone'; // persistent area (black hole, freezing field, rot, light strike delay)
      radius: number;
      duration: number;
      tickEvery: number;
      at: 'target' | 'caster';
      follow?: boolean; // zone moves with caster (rot, freezing field)
      affects: Affects;
      effects: Effect[]; // applied each tick to units inside (no area on inner effects)
      channel?: boolean; // caster is locked casting while zone lives; stun on caster cancels
      pullStrength?: number; // units/s toward center (black hole)
      delay?: number; // seconds before first tick (light strike array)
    }
  | { t: 'leap'; to: 'behind_target' | 'target' } // instant reposition of caster
  | { t: 'pull'; distance: number } // target dragged toward caster (meat hook)
  | { t: 'knockback'; distance: number }
  | {
      t: 'bounce'; // arc lightning, chain frost
      count: number;
      range: number;
      falloff: number; // multiplier per bounce, 1 = none
      allowRepeat: boolean;
      effects: Effect[];
    }
  | {
      t: 'projectile'; // effects land on hit. line=true -> travels full length hitting all in path
      speed: number;
      effects: Effect[];
      line?: { width: number; length: number };
    }
  | { t: 'execute'; thresholdPct: number; damage: number } // culling blade
  | { t: 'grave'; duration: number; affects?: Affects } // shallow grave: hp can't drop below 1
  | { t: 'omnislash'; jumps: number; interval: number; attackMult: number } // caster invulnerable while slashing
  | { t: 'dispel'; area?: Area; affects?: Affects }
  | { t: 'mana'; amount: number; area?: Area; affects?: Affects } // +/- mana
  | { t: 'custom'; id: string; params?: Record<string, number> };

/** When the AI is allowed to cast an active spell. All present conditions must hold. */
export interface AiCondition {
  minEnemiesInRange?: number; // within castRange (+ aoeRadius around chosen point)
  targetHpBelowPct?: number;
  selfHpBelowPct?: number;
  allyHpBelowPct?: number;
  minBattleTime?: number;
}

export type PassiveDef =
  | { t: 'on_attack'; chance: number; effects: Effect[] } // effects hit attack target (bash, maelstrom)
  | { t: 'on_attacked'; chance: number; effects: Effect[] } // effects with area around self (counter helix)
  | { t: 'crit'; chance: number; mult: number }
  | { t: 'aura'; stat: BuffStat; value: number; radius: number; affects: Affects }
  | { t: 'on_kill_stack'; attr: Attr; amount: number } // PERMANENT stat gain, persists across rounds
  | { t: 'on_hit_steal'; attr: Attr; amount: number; duration: number } // temp steal (essence shift)
  | { t: 'fury_swipes'; perStack: number }
  | { t: 'berserkers_blood'; maxAttackSpeed: number; maxRegen: number } // scales with missing hp
  | { t: 'split_shot'; extraTargets: number; dmgPct: number }
  | { t: 'bonus_attack_damage'; dmgType: DamageType; attr: Attr; mult: number } // glaives
  | { t: 'stat'; stat: BuffStat; value: number } // flat permanent-in-battle bonus
  | { t: 'evasion'; pct: number }
  | { t: 'custom'; id: string; params?: Record<string, number> };

export type VfxKind = 'at_target' | 'at_caster' | 'projectile' | 'line' | 'zone' | 'chain' | 'proc' | 'buff';

export interface SpellDef {
  id: SpellId;
  name: string;
  glyph: string; // single emoji used as icon in UI
  description: string;
  kind: 'active' | 'passive';
  ultimate: boolean;
  stars: Stars; // 1..5 rarity in the Mystery shop
  manaCost: number;
  cooldown: number; // seconds
  castRange: number; // arena units, 0 = self/global
  castPoint: number; // seconds of cast animation before effects land
  target: TargetRule;
  aoeRadius?: number; // used by enemy_cluster targeting + AI
  ai?: AiCondition;
  effects: Effect[]; // active spells
  passives?: PassiveDef[]; // passive spells (actives may also carry passives)
  /** magnitude multiplier = 1 + levelScaling * (heroLevel - 1). ~0.04..0.08 */
  levelScaling: number;
  /**
   * Aghanim's Scepter upgrade (like Dota). Applies while the caster has `aghanims_scepter` equipped:
   * every field in `patch` REPLACES the base field (e.g. new effects list, lower cooldown, extra passives).
   * Every hero signature spell has one; shop spells may too.
   */
  aghanim?: {
    description: string; // shown in tooltips, e.g. "Hook pierces: hits every enemy in a line"
    patch: Partial<Pick<SpellDef, 'effects' | 'passives' | 'cooldown' | 'manaCost' | 'castRange' | 'castPoint' | 'aoeRadius' | 'target' | 'ai'>>;
  };
  vfx: { kind: VfxKind; duration: number; color: string };
}

// ---------------------------------------------------------------- items

export interface ItemDef {
  id: ItemId;
  name: string;
  glyph: string;
  tier: Stars; // == stars, 1..6
  cost: number;
  description: string;
  stats: Partial<StatBlock>;
  passives?: PassiveDef[];
  /** fires automatically in battle */
  active?: { when: 'battle_start' | 'low_hp' | 'cooldown'; cooldown?: number; target: TargetRule; effects: Effect[] };
  lordOnly?: boolean; // never appears in shop
}

// ---------------------------------------------------------------- lords

export interface LordDef {
  id: LordId;
  name: string;
  title: string; // ability name
  glyph: string;
  color: string;
  description: string;
  /** 'passive' lords act automatically; 'active' lords expose a button in prep phase */
  kind: 'passive' | 'active';
  activeLabel?: string; // button text, e.g. "Forge (1)"
  needsTarget?: boolean; // active ability targets one of your heroes
}

/** Battle-wide modifiers a lord (or anything else) applies to one team. */
export interface TeamMods {
  hpPct?: number; // +% max hp
  damagePct?: number;
  armor?: number;
  attackSpeed?: number;
  spellAmp?: number;
}

// ---------------------------------------------------------------- owned state (persists across rounds)

export interface BoardSlot {
  col: number; // 0 = front line .. BOARD_COLS-1 = back line
  row: number; // 0 .. BOARD_ROWS-1
}

export interface OwnedHero {
  uid: string;
  heroId: HeroId;
  level: number; // 1..MAX_HERO_LEVEL
  pendingUpgrades: number; // from buying duplicates; spend via upgradeHero()
  spells: (SpellId | null)[]; // length = spellSlotsForLevel(level); [0] = signature, fixed. Order = cast priority.
  items: (ItemId | null)[]; // length ITEM_SLOTS
  stacks: { str: number; agi: number; int: number }; // permanent gains (flesh heap, essence shift, glaives)
  slot: BoardSlot | null; // null = on bench
  kills: number;
}

export interface ShopState {
  heroOffers: (HeroId | null)[]; // null = bought
  spellOffers: (SpellId | null)[];
  itemOffers: (ItemId | null)[];
  locked: boolean;
}

export interface PlayerState {
  id: number; // 0 = human
  name: string;
  isHuman: boolean;
  hp: number;
  maxHp: number;
  alive: boolean;
  placement: number | null; // 8 = first eliminated ... 1 = winner
  lordId: LordId | null;
  lordState: Record<string, number>; // per-lord counters (forges, banked coins, used flags)
  coins: number;
  shopLevel: number; // TAVERN level 1..MAX_SHOP_LEVEL (shown as ★ on the F key)
  shop: ShopState;
  heroes: OwnedHero[];
  spellInventory: SpellId[];
  itemInventory: ItemId[];
  streak: number; // + win streak / - loss streak
  lastResult: 'win' | 'loss' | 'draw' | null;
}

export interface Pairing {
  left: number; // player id
  right: number; // player id
  ghost: boolean; // right side is a ghost copy (takes no damage)
}

export interface RoundReport {
  round: number;
  pairing: Pairing;
  winner: Team | 'draw';
  damageToLoser: number;
  duration: number;
}

export type Phase = 'lord_select' | 'prep' | 'battle' | 'results' | 'game_over';

export interface GameState {
  seed: number;
  rngState: number; // advanced by economy/shop rolls (core/rng.ts)
  phase: Phase;
  round: number; // 1-based
  players: PlayerState[]; // length PLAYER_COUNT, index = id
  lordChoices: LordId[]; // offered to human in lord_select
  lordRerollUsed: boolean;
  pairings: Pairing[];
  reports: RoundReport[]; // this round's results (all battles)
  humanBattle: BattleResult | null; // full recording of the human's battle, for the arena
  humanSide: Team; // which side the human is on in humanBattle
  log: string[]; // short human-readable messages, newest last
}

// ---------------------------------------------------------------- battle sim I/O

export interface BattleTeamInput {
  playerId: number;
  heroes: OwnedHero[]; // only heroes on board (slot !== null)
  mods: TeamMods;
}

export type AnimState = 'idle' | 'walk' | 'attack' | 'cast' | 'hurt' | 'dead';

export type StatusKind =
  | 'stunned'
  | 'silenced'
  | 'rooted'
  | 'slowed'
  | 'blinded'
  | 'hexed'
  | 'spell_immune'
  | 'grave'
  | 'invulnerable'
  | 'buffed'
  | 'channeling'
  | 'burning'
  | 'aghanim'; // carries Aghanim's Scepter (spells upgraded) — drawn as a blue crown/glow

export interface UnitSnapshot {
  uid: string;
  heroId: HeroId;
  team: Team;
  level: number;
  x: number;
  y: number;
  facing: 1 | -1; // 1 = looking right
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  anim: AnimState;
  animT: number; // seconds since this anim state started
  animDur: number; // nominal length of current anim (attack = attack point*2, cast = castPoint+0.2), 0 = looping
  alive: boolean;
  statuses: StatusKind[];
}

export interface ProjectileSnapshot {
  id: number;
  x: number;
  y: number;
  angle: number; // radians
  team: Team;
  /** art key: hero id for basic attacks, spell id for spell projectiles */
  art: { kind: 'attack'; heroId: HeroId } | { kind: 'spell'; spellId: SpellId };
}

export interface ZoneSnapshot {
  id: number;
  spellId: SpellId | null; // null for item zones (radiance)
  itemId: ItemId | null;
  x: number;
  y: number;
  radius: number;
  t: number; // seconds alive
  duration: number;
  team: Team;
}

export interface BattleFrame {
  t: number; // seconds
  units: UnitSnapshot[];
  projectiles: ProjectileSnapshot[];
  zones: ZoneSnapshot[];
}

export type BattleEvent =
  | { t: number; kind: 'attack'; src: string; dst: string }
  | { t: number; kind: 'damage'; src: string | null; dst: string; amount: number; dmgType: DamageType; crit: boolean }
  | { t: number; kind: 'heal'; dst: string; amount: number }
  | { t: number; kind: 'miss'; src: string; dst: string }
  | {
      t: number;
      kind: 'cast';
      src: string;
      spellId: SpellId;
      dst: string | null;
      /** where the VFX should play: caster pos at cast and target point */
      from: Vec;
      to: Vec;
      radius: number;
    }
  | { t: number; kind: 'proc'; src: string; dst: string | null; spellId: SpellId | null; itemId: ItemId | null; at: Vec }
  | { t: number; kind: 'item'; src: string; itemId: ItemId; at: Vec }
  | { t: number; kind: 'status'; dst: string; status: StatusKind; duration: number }
  | { t: number; kind: 'stack'; dst: string; attr: Attr; amount: number } // permanent gain happened
  | { t: number; kind: 'death'; dst: string; killer: string | null }
  | { t: number; kind: 'end'; winner: Team | 'draw' };

export interface BattleResult {
  winner: Team | 'draw';
  duration: number;
  seed: number;
  frames: BattleFrame[]; // empty unless opts.record
  events: BattleEvent[]; // empty unless opts.record
  survivors: { left: string[]; right: string[] }; // uids
  /** permanent stat/kill gains to write back onto OwnedHeroes, keyed by uid */
  gains: Record<string, { str: number; agi: number; int: number; kills: number }>;
  damageDealt: Record<string, number>; // uid -> total damage dealt
}

export interface BattleOptions {
  record: boolean; // collect frames + events (human battle only)
  maxDuration?: number; // default BATTLE_TIME_LIMIT
}

/** Signature of core/sim/battle.ts runBattle */
export type RunBattle = (left: BattleTeamInput, right: BattleTeamInput, seed: number, opts: BattleOptions) => BattleResult;

// ---------------------------------------------------------------- actions (implemented by ui/store.ts over core/game)

export interface GameActions {
  newGame(seed?: number): void;
  pickLord(lordId: LordId): void;
  rerollLords(): void;

  buyHero(offerIdx: number): void;
  buySpell(offerIdx: number): void;
  buyItem(offerIdx: number): void;
  refreshShop(): void;
  upgradeShop(): void;
  toggleLock(): void;

  upgradeHero(uid: string): void; // spend one pendingUpgrade
  sellHero(uid: string): void;
  sellSpell(invIdx: number): void;
  sellItem(invIdx: number): void;

  /** move inventory spell into hero slot (slot >= 1). A displaced spell returns to inventory. */
  assignSpell(uid: string, slotIdx: number, invIdx: number): void;
  unassignSpell(uid: string, slotIdx: number): void;
  /** reorder cast priority, slots >= 1 only */
  swapSpellSlots(uid: string, a: number, b: number): void;
  equipItem(uid: string, slotIdx: number, invIdx: number): void;
  unequipItem(uid: string, slotIdx: number): void;
  /** put hero on board (swaps with occupant) or bench (null). Respects board cap. */
  placeHero(uid: string, slot: BoardSlot | null): void;

  useLordAbility(targetUid?: string): void;

  /** prep -> battle: resolves every pairing, records the human's battle */
  readyForBattle(): void;
  /** battle -> results (or game_over): apply damage, gains, eliminations */
  finishBattle(): void;
  /** results -> prep: next round income, shop roll unless locked */
  nextRound(): void;
}

// ---------------------------------------------------------------- world / terrain

/** Each player's arena has its own terrain. Battles happen in the HOST's arena (pairing.left). */
export type TerrainId = 'snow' | 'autumn' | 'spring' | 'desert' | 'dire' | 'jungle' | 'swamp' | 'temple';
