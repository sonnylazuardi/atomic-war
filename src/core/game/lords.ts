// Lord logic. Data in core/data/lords.ts.
import {
  BOARD_COLS,
  BOARD_ROWS,
  ITEM_SLOTS,
  MAX_HERO_LEVEL,
  PLAYER_START_HP,
  REFRESH_COST,
  SPELL_COST,
  SPELL_SLOTS,
  spellSlotsForLevel,
} from '../constants.ts';
import { HEROES } from '../data/heroes.ts';
import { HERO_KITS } from '../ids.ts';
import type { GameState, HeroMods, ItemId, LordId, OwnedHero, PlayerState, SpellId, TeamMods } from '../types.ts';
import { say, fail, findHero, fighters, pure, type GS } from './util.ts';
import { rollExtraOffers } from './shop.ts';

/** Ember Spirit forge: Broken Sword -> Flame Sword at 9 forges -> Divine Sword of the Sun at 18. */
export const FORGES_FOR_FLAME = 9;
export const FORGES_FOR_DIVINE = 18;
export const FORGE_COST = 1;
export const OMNI_LEVELS = 12;
export const OMNI_COST = 1;
export const PUDGE_LORD_HP = 150;
export const RUBICK_EVERY = 6;
export const ZEUS_BOLT_COST = 1;
export const ZEUS_BOLT_BASE = 90;
export const ZEUS_BOLT_PER_CAST = 45;
export const ZEUS_BOLT_TARGETS = 2;
export const LUNA_COST = 1;
export const LUNA_DAMAGE = 11;
export const AXE_CULL_PCT = 45;
export const INVOKER_REFUND_PCT = 25;

/** Current Zeus opening bolt damage. */
export const zeusBoltDamage = (p: PlayerState) => ZEUS_BOLT_BASE + ZEUS_BOLT_PER_CAST * (p.lordState.bolts ?? 0);

/** Battle-wide modifiers from a player's lord. */
export function teamModsFor(p: PlayerState): TeamMods {
  switch (p.lordId) {
    case 'axe_lord':
      return { cullThresholdPct: AXE_CULL_PCT };
    case 'invoker':
      return { refundChance: INVOKER_REFUND_PCT };
    case 'zeus_lord':
      return { openingStrike: { targets: ZEUS_BOLT_TARGETS, damage: zeusBoltDamage(p) } };
    case 'phantom_assassin_lord':
      return { blinkBuff: { damagePct: 50, spellImmune: true, duration: 4 } };
    default:
      return {};
  }
}

/** Per-hero battle modifiers from a player's lord, keyed by OwnedHero.uid. */
export function heroModsFor(p: PlayerState, _round: number): Record<string, HeroMods> {
  const out: Record<string, HeroMods> = {};
  const add = (uid: string, m: HeroMods) => (out[uid] = { ...out[uid], ...m });
  const target = p.lordTarget ? findHero(p, p.lordTarget) : undefined;
  switch (p.lordId) {
    case 'naga_siren':
      if (target) add(target.uid, { hypnotize: { seconds: 4, hpPctPerSec: 6, damagePct: 80, immuneAfter: 6 } });
      break;
    case 'spirit_breaker':
      if (target) add(target.uid, { grantSpells: ['charge_of_darkness'] });
      break;
    case 'riki':
      for (const h of p.heroes) if (HEROES[h.heroId] && !HEROES[h.heroId].ranged) add(h.uid, { agiDamageMult: 1, moveSpeed: 20, invisibleOnKill: 3 });
      break;
    case 'sniper_lord':
      for (const h of p.heroes)
        if (HEROES[h.heroId]?.cls === 'hunter') add(h.uid, { attackRange: 150, damagePct: 15, headshot: { chance: 40, damage: 60, knockback: 30 } });
      break;
  }
  return out;
}

// ---------------------------------------------------------------- Juggernaut summon

/** items the Heroic Reinforcement carries: one more every 4 rounds (max 4) */
const SUMMON_ITEMS: readonly ItemId[] = ['broadsword', 'blade_of_alacrity', 'desolator', 'daedalus'];
export const summonLevel = (round: number) => Math.min(12, round);

/** Juggernaut lord's battle-only summon (never stored in PlayerState.heroes). */
export function lordSummon(p: PlayerState, round: number): OwnedHero | null {
  if (p.lordId !== 'juggernaut_lord' || round < 3) return null; // joins from round 3 (balance)
  const nItems = round < 8 ? 0 : 1;
  const items: (ItemId | null)[] = SUMMON_ITEMS.slice(0, nItems);
  while (items.length < ITEM_SLOTS) items.push(null);
  // summon fights with Blade Fury + Healing Ward only (no Omnislash): balance — a free extra unit is strong
  const spells: (SpellId | null)[] = [...HERO_KITS.juggernaut].slice(0, 2);
  while (spells.length < SPELL_SLOTS) spells.push(null);
  const occupied = fighters(p, round);
  const free = (col: number, row: number) => !occupied.some((h) => h.slot?.col === col && h.slot.row === row);
  let slot = { col: BOARD_COLS - 1, row: 0 };
  search: for (let col = BOARD_COLS - 1; col >= 0; col--)
    for (let row = 0; row < BOARD_ROWS; row++)
      if (free(col, row)) {
        slot = { col, row };
        break search;
      }
  return {
    uid: `summon-${p.id}-${round}`,
    heroId: 'juggernaut',
    level: summonLevel(round),
    pendingUpgrades: 0,
    spells,
    items,
    stacks: { str: 0, agi: 0, int: 0 },
    slot,
    kills: 0,
    summon: true,
  };
}

/** Extra coins each round from lord. */
export function lordIncomeBonus(p: PlayerState): number {
  return p.lordId === 'alchemist' ? 1 : 0;
}

export function spellCostFor(_p: PlayerState): number {
  return SPELL_COST;
}

/** Cost of the next refresh (Tinker lord: first two refreshes per round are free). */
export function refreshCostFor(p: PlayerState): number {
  if (p.lordId === 'tinker_lord' && (p.lordState.freeRefreshUsed ?? 0) < 2) return 0;
  return REFRESH_COST;
}

/** The sword the next forge works on (broken below 9 forges, flame below 18), if the player still owns it. */
function forgeableSword(p: PlayerState): ItemId | null {
  const forges = p.lordState.forges ?? 0;
  if (forges >= FORGES_FOR_DIVINE) return null;
  const want: ItemId = forges < FORGES_FOR_FLAME ? 'broken_sword' : 'flame_sword';
  const owned = p.itemInventory.includes(want) || p.heroes.some((h) => h.items.includes(want));
  return owned ? want : null;
}

/** Replace the first `from` (inventory first, then hero slots) with `to`. */
function transformItem(p: PlayerState, from: ItemId, to: ItemId) {
  const inv = p.itemInventory.indexOf(from);
  if (inv >= 0) {
    p.itemInventory[inv] = to;
    return;
  }
  for (const h of p.heroes) {
    const i = h.items.indexOf(from);
    if (i >= 0) {
      h.items[i] = to;
      return;
    }
  }
}

/** Coins one use of the lord's active costs. */
export function lordCost(p: PlayerState): number {
  switch (p.lordId) {
    case 'ember_spirit':
      return FORGE_COST;
    case 'omniknight':
      return OMNI_COST;
    case 'zeus_lord':
      return ZEUS_BOLT_COST;
    case 'luna':
      return LUNA_COST;
    default:
      return 0;
  }
}

/** Whether the lord's active button should be enabled right now (prep phase). */
export function lordActiveAvailable(p: PlayerState): boolean {
  if (!p.alive) return false;
  const cost = lordCost(p);
  if (p.coins < cost) return false;
  switch (p.lordId) {
    case 'ember_spirit':
      return forgeableSword(p) !== null;
    case 'bounty_hunter':
      return (p.lordState.bank ?? 0) > 0;
    case 'omniknight':
      return !p.lordState.used && p.heroes.some((h) => h.level < MAX_HERO_LEVEL);
    case 'naga_siren':
    case 'spirit_breaker':
    case 'luna':
      return p.heroes.length > 0;
    case 'zeus_lord':
      return true;
    default:
      return false;
  }
}

/** Raise a hero's level (spell slots stay SPELL_SLOTS). */
export function addLevels(h: OwnedHero, levels: number) {
  h.level = Math.min(MAX_HERO_LEVEL, h.level + levels);
  const slots = spellSlotsForLevel(h.level);
  while (h.spells.length < slots) h.spells.push(null);
}

/** Apply one-time effects when a lord is chosen. Mutates. */
export function applyLordPick(s: GameState, p: PlayerState, lordId: LordId) {
  p.lordId = lordId;
  p.lordState = {};
  p.lordTarget = null;
  switch (lordId) {
    case 'ember_spirit':
      p.itemInventory.push('broken_sword');
      p.lordState.forges = 0;
      break;
    case 'pudge_lord':
      p.maxHp = PUDGE_LORD_HP;
      p.hp = PUDGE_LORD_HP - (PLAYER_START_HP - p.hp);
      break;
    case 'bounty_hunter':
      p.lordState.bank = 0;
      break;
    case 'omniknight':
      p.lordState.used = 0;
      break;
    case 'zeus_lord':
      p.lordState.bolts = 0;
      break;
    case 'luna':
      p.lordState.blessings = 0;
      break;
    case 'tinker_lord':
      if (p.shopLevel < 2) {
        const before = p.shopLevel;
        p.shopLevel = 2;
        rollExtraOffers(s, p, before, 2);
      }
      p.lordState.freeRefreshUsed = 0;
      break;
    case 'alchemist':
      p.coins += lordIncomeBonus(p);
      break;
  }
}

/** Called when a player leaves the prep phase (Bounty Hunter banking). */
export function onLeavePrep(p: PlayerState) {
  if (p.lordId === 'bounty_hunter' && p.coins > 0) {
    p.lordState.bank = (p.lordState.bank ?? 0) + p.coins;
    p.coins = 0;
  }
}

/** Called at the start of every prep phase from round 2 on (after coins are set). */
export function onRoundStart(s: GameState, p: PlayerState) {
  if (p.lordId === 'tinker_lord') p.lordState.freeRefreshUsed = 0;
  if (p.lordId === 'rubick' && s.round > 0 && s.round % RUBICK_EVERY === 0) {
    p.itemInventory.push('aghanims_scepter');
    p.lordState.scepters = (p.lordState.scepters ?? 0) + 1;
    if (p.isHuman) say(s, p, "Father's Promise: a free Aghanim's Scepter!");
  }
  // a bound hero that was sold no longer holds the lord's song/charge
  if (p.lordTarget && !findHero(p, p.lordTarget)) p.lordTarget = null;
}

export function useLordAbilityM(s: GS, pid: number, targetUid?: string) {
  const p = s.players[pid];
  if (!p) return;
  if (s.phase !== 'prep') return fail(s, p, 'Lord abilities can only be used during prep.');
  const cost = lordCost(p);
  const target = targetUid ? findHero(p, targetUid) : undefined;
  switch (p.lordId) {
    case 'ember_spirit': {
      const sword = forgeableSword(p);
      if ((p.lordState.forges ?? 0) >= FORGES_FOR_DIVINE) return fail(s, p, 'The sword is already fully forged.');
      if (!sword) return fail(s, p, 'No sword to forge.');
      if (p.coins < cost) return fail(s, p, 'Not enough coins to forge.');
      p.coins -= cost;
      const forges = (p.lordState.forges = (p.lordState.forges ?? 0) + 1);
      if (forges === FORGES_FOR_FLAME) {
        transformItem(p, 'broken_sword', 'flame_sword');
        if (p.isHuman) say(s, p, 'The Flame Sword is forged!');
      } else if (forges === FORGES_FOR_DIVINE) {
        transformItem(p, 'flame_sword', 'divine_sword_of_the_sun');
        if (p.isHuman) say(s, p, 'The Divine Sword of the Sun is forged!');
      } else if (p.isHuman) {
        const goal = forges < FORGES_FOR_FLAME ? FORGES_FOR_FLAME : FORGES_FOR_DIVINE;
        say(s, p, `Forged (${forges}/${goal}).`);
      }
      return;
    }
    case 'bounty_hunter': {
      const bank = p.lordState.bank ?? 0;
      if (bank <= 0) return fail(s, p, 'Bank is empty.');
      p.coins += bank;
      p.lordState.bank = 0;
      if (p.isHuman) say(s, p, `Withdrew ${bank} coins from the bank.`);
      return;
    }
    case 'omniknight': {
      if (p.lordState.used) return fail(s, p, 'Purification was already used.');
      if (!target) return fail(s, p, 'Choose one of your heroes.');
      if (target.level >= MAX_HERO_LEVEL) return fail(s, p, 'That hero is already max level.');
      if (p.coins < cost) return fail(s, p, 'Not enough coins.');
      p.coins -= cost;
      addLevels(target, OMNI_LEVELS);
      p.lordState.used = 1;
      if (p.isHuman) say(s, p, `Purification! Hero is now level ${target.level}.`);
      return;
    }
    case 'naga_siren':
    case 'spirit_breaker': {
      if (!target) return fail(s, p, 'Choose one of your heroes.');
      p.lordTarget = target.uid;
      if (p.isHuman) {
        const what = p.lordId === 'naga_siren' ? 'Song of the Siren' : 'Charge of Darkness';
        say(s, p, `${what} bound to ${HEROES[target.heroId]?.name ?? target.heroId}.`);
      }
      return;
    }
    case 'zeus_lord': {
      if (p.coins < cost) return fail(s, p, 'Not enough coins.');
      p.coins -= cost;
      p.lordState.bolts = (p.lordState.bolts ?? 0) + 1;
      if (p.isHuman) say(s, p, `Lightning Bolt now deals ${zeusBoltDamage(p)} damage.`);
      return;
    }
    case 'luna': {
      if (!target) return fail(s, p, 'Choose one of your heroes.');
      if (p.coins < cost) return fail(s, p, 'Not enough coins.');
      p.coins -= cost;
      target.bonus = { ...target.bonus, damage: (target.bonus?.damage ?? 0) + LUNA_DAMAGE };
      p.lordState.blessings = (p.lordState.blessings ?? 0) + 1;
      if (p.isHuman) say(s, p, `Lunar Blessing: ${HEROES[target.heroId]?.name ?? target.heroId} +${target.bonus.damage} damage.`);
      return;
    }
    default:
      return fail(s, p, 'Your lord has no active ability.');
  }
}

export const useLordAbility = pure(useLordAbilityM);
