// Zustand store: thin wrapper over the pure core/game reducers for the human (player 0).
import { create } from 'zustand';
import type { GameActions, GameState } from '../core/types.ts';
import * as G from '../core/game/index.ts';

export type GameStore = GameState & GameActions;

const HUMAN = 0;

/** Strip action functions so reducers receive plain state. */
function stateOf(s: GameStore): GameState {
  return {
    seed: s.seed,
    rngState: s.rngState,
    phase: s.phase,
    round: s.round,
    players: s.players,
    lordChoices: s.lordChoices,
    lordRerollUsed: s.lordRerollUsed,
    pairings: s.pairings,
    reports: s.reports,
    humanBattle: s.humanBattle,
    humanSide: s.humanSide,
    log: s.log,
    ...extras(s),
  };
}

function extras(s: GameStore): G.MatchExtras {
  const x = s as unknown as G.MatchExtras;
  return { pendingGains: x.pendingGains, pendingDamage: x.pendingDamage, pendingResult: x.pendingResult };
}

function seedFromUrl(): number | undefined {
  try {
    const v = new URLSearchParams(globalThis.location?.search ?? '').get('seed');
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) ? n >>> 0 : undefined;
  } catch {
    return undefined;
  }
}

export const useGame = create<GameStore>()((set, get) => {
  const apply = (fn: (st: GameState) => GameState) => {
    const next = fn(stateOf(get())) as GameState & G.MatchExtras;
    // explicitly reset pending fields so stale data never lingers in the store
    set({ ...next, pendingGains: next.pendingGains, pendingDamage: next.pendingDamage, pendingResult: next.pendingResult } as Partial<GameStore>);
  };
  return {
    ...G.newGame(seedFromUrl()),

    newGame: (seed) => apply(() => G.newGame(seed)),
    pickLord: (lordId) => apply((s) => G.pickLord(s, lordId, HUMAN)),
    rerollLords: () => apply((s) => G.rerollLords(s, HUMAN)),

    buyHero: (i) => apply((s) => G.buyHero(s, HUMAN, i)),
    buySpell: (i) => apply((s) => G.buySpell(s, HUMAN, i)),
    buyItem: (i) => apply((s) => G.buyItem(s, HUMAN, i)),
    refreshShop: () => apply((s) => G.refreshShop(s, HUMAN)),
    upgradeShop: () => apply((s) => G.upgradeShop(s, HUMAN)),
    toggleLock: () => apply((s) => G.toggleLock(s, HUMAN)),

    upgradeHero: (uid) => apply((s) => G.upgradeHero(s, HUMAN, uid)),
    sellHero: (uid) => apply((s) => G.sellHero(s, HUMAN, uid)),
    sellSpell: (i) => apply((s) => G.sellSpell(s, HUMAN, i)),
    sellItem: (i) => apply((s) => G.sellItem(s, HUMAN, i)),

    assignSpell: (uid, slot, inv) => apply((s) => G.assignSpell(s, HUMAN, uid, slot, inv)),
    unassignSpell: (uid, slot) => apply((s) => G.unassignSpell(s, HUMAN, uid, slot)),
    swapSpellSlots: (uid, a, b) => apply((s) => G.swapSpellSlots(s, HUMAN, uid, a, b)),
    equipItem: (uid, slot, inv) => apply((s) => G.equipItem(s, HUMAN, uid, slot, inv)),
    unequipItem: (uid, slot) => apply((s) => G.unequipItem(s, HUMAN, uid, slot)),
    placeHero: (uid, slot) => apply((s) => G.placeHero(s, HUMAN, uid, slot)),

    useLordAbility: (targetUid) => apply((s) => G.useLordAbility(s, HUMAN, targetUid)),

    readyForBattle: () => apply((s) => G.readyForBattle(s)),
    finishBattle: () => apply((s) => G.finishBattle(s)),
    nextRound: () => apply((s) => G.nextRound(s)),
  };
});
