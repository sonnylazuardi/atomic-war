// Lord logic. Data in core/data/lords.ts.
import { MAX_HERO_LEVEL, PLAYER_START_HP, REFRESH_COST, SPELL_COST, spellSlotsForLevel } from '../constants.ts';
import type { GameState, LordId, OwnedHero, PlayerState, TeamMods } from '../types.ts';
import { fail, findHero, log, pure, type GS } from './util.ts';
import { rollExtraOffers } from './shop.ts';

export const FORGES_FOR_DIVINE = 8;
export const OMNI_LEVELS = 12;
export const PUDGE_LORD_HP = 150;

/** Battle-wide modifiers from a player's lord. */
export function teamModsFor(p: PlayerState): TeamMods {
  if (p.lordId === 'axe_lord') return { hpPct: 15 };
  return {};
}

/** Extra coins each round from lord. */
export function lordIncomeBonus(p: PlayerState): number {
  return p.lordId === 'alchemist' ? 2 : 0;
}

export function spellCostFor(p: PlayerState): number {
  return p.lordId === 'rubick' ? 2 : SPELL_COST;
}

/** Cost of the next refresh (Tinker lord: first refresh per round is free). */
export function refreshCostFor(p: PlayerState): number {
  if (p.lordId === 'tinker_lord' && !p.lordState.freeRefreshUsed) return 0;
  return REFRESH_COST;
}

function hasBrokenSword(p: PlayerState): boolean {
  return p.itemInventory.includes('broken_sword') || p.heroes.some((h) => h.items.includes('broken_sword'));
}

/** Whether the lord's active button should be enabled right now (prep phase). */
export function lordActiveAvailable(p: PlayerState): boolean {
  if (!p.alive) return false;
  switch (p.lordId) {
    case 'ursa_lord':
      return p.coins >= 1 && (p.lordState.forges ?? 0) < FORGES_FOR_DIVINE && hasBrokenSword(p);
    case 'bounty_hunter':
      return (p.lordState.bank ?? 0) > 0;
    case 'omniknight':
      return !p.lordState.used && p.heroes.some((h) => h.level < MAX_HERO_LEVEL);
    default:
      return false;
  }
}

/** Raise a hero's level, growing spell slots with nulls. */
export function addLevels(h: OwnedHero, levels: number) {
  h.level = Math.min(MAX_HERO_LEVEL, h.level + levels);
  const slots = spellSlotsForLevel(h.level);
  while (h.spells.length < slots) h.spells.push(null);
}

/** Apply one-time effects when a lord is chosen. Mutates. */
export function applyLordPick(s: GameState, p: PlayerState, lordId: LordId) {
  p.lordId = lordId;
  p.lordState = {};
  switch (lordId) {
    case 'ursa_lord':
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

/** Called at the start of every prep phase (after coins are set). */
export function onRoundStart(p: PlayerState) {
  if (p.lordId === 'tinker_lord') p.lordState.freeRefreshUsed = 0;
}

export function useLordAbilityM(s: GS, pid: number, targetUid?: string) {
  const p = s.players[pid];
  if (!p) return;
  if (s.phase !== 'prep') return fail(s, p, 'Lord abilities can only be used during prep.');
  switch (p.lordId) {
    case 'ursa_lord': {
      if (!hasBrokenSword(p)) return fail(s, p, 'No Broken Sword to forge.');
      const forges = p.lordState.forges ?? 0;
      if (forges >= FORGES_FOR_DIVINE) return fail(s, p, 'The sword is already forged.');
      if (p.coins < 1) return fail(s, p, 'Not enough coins to forge.');
      p.coins -= 1;
      p.lordState.forges = forges + 1;
      if (p.lordState.forges >= FORGES_FOR_DIVINE) {
        const inv = p.itemInventory.indexOf('broken_sword');
        if (inv >= 0) p.itemInventory[inv] = 'divine_sword_of_the_sun';
        else {
          for (const h of p.heroes) {
            const i = h.items.indexOf('broken_sword');
            if (i >= 0) {
              h.items[i] = 'divine_sword_of_the_sun';
              break;
            }
          }
        }
        if (p.isHuman) log(s, 'The Divine Sword of the Sun is forged!');
      } else if (p.isHuman) log(s, `Forged (${p.lordState.forges}/${FORGES_FOR_DIVINE}).`);
      return;
    }
    case 'bounty_hunter': {
      const bank = p.lordState.bank ?? 0;
      if (bank <= 0) return fail(s, p, 'Bank is empty.');
      p.coins += bank;
      p.lordState.bank = 0;
      if (p.isHuman) log(s, `Withdrew ${bank} coins from the bank.`);
      return;
    }
    case 'omniknight': {
      if (p.lordState.used) return fail(s, p, 'Purification was already used.');
      const h = targetUid ? findHero(p, targetUid) : undefined;
      if (!h) return fail(s, p, 'Choose one of your heroes.');
      if (h.level >= MAX_HERO_LEVEL) return fail(s, p, 'That hero is already max level.');
      addLevels(h, OMNI_LEVELS);
      p.lordState.used = 1;
      if (p.isHuman) log(s, `Purification! Hero is now level ${h.level}.`);
      return;
    }
    default:
      return fail(s, p, 'Your lord has no active ability.');
  }
}

export const useLordAbility = pure(useLordAbilityM);
