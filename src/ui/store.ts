// Zustand store: thin wrapper over the pure core/game reducers for the human (player 0).
import { create } from 'zustand';
import type { GameActions, GameState } from '../core/types.ts';
import { PREP_TIME, RESULTS_TIME } from '../core/constants.ts';
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

/** preparation length in seconds; `?prep=N` overrides it (tests use a short one) */
function prepSeconds(): number {
  try {
    const v = new URLSearchParams(globalThis.location?.search ?? '').get('prep');
    const n = v === null || v === '' ? NaN : Number(v);
    return Number.isFinite(n) && n > 0 ? n : PREP_TIME;
  } catch {
    return PREP_TIME;
  }
}

/** The store is the clock authority (a multiplayer server would be): a phase deadline is set whenever the
 *  phase or round changes; the UI just counts down to it and fires the auto-advance. */
function deadlineFor(phase: GameState['phase']): number | null {
  if (phase === 'prep') return Date.now() + prepSeconds() * 1000;
  if (phase === 'results') return Date.now() + RESULTS_TIME * 1000;
  return null;
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
    const prev = get();
    const next = fn(stateOf(prev)) as GameState & G.MatchExtras;
    const phaseDeadline =
      next.phase !== prev.phase || next.round !== prev.round ? deadlineFor(next.phase) : (prev.phaseDeadline ?? null);
    // explicitly reset pending fields so stale data never lingers in the store
    set({
      ...next,
      phaseDeadline,
      pendingGains: next.pendingGains,
      pendingDamage: next.pendingDamage,
      pendingResult: next.pendingResult,
    } as Partial<GameStore>);
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
    cheatShop: () => apply((s) => G.cheatShop(s, HUMAN)),
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
