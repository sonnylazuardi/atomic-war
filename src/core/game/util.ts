// Shared helpers for core/game reducers.
import { createRng, type Rng } from '../rng.ts';
import { BENCH_SIZE, BOARD_COLS, BOARD_ROWS, boardCap } from '../constants.ts';
import { HEROES } from '../data/heroes.ts';
import type { BattleResult, BoardSlot, GameState, HeroId, OwnedHero, PlayerState } from '../types.ts';

/** Gains from this round's battles, applied in finishBattle. Extra field carried on GameState. */
export type PendingGains = Record<string, { str: number; agi: number; int: number; kills: number }>;
export interface MatchExtras {
  /** playerId -> uid -> gains (non-ghost sides only) */
  pendingGains?: Record<number, PendingGains>;
  /** playerId -> damage to take in finishBattle */
  pendingDamage?: Record<number, number>;
  /** playerId -> result of this round */
  pendingResult?: Record<number, 'win' | 'loss' | 'draw'>;
}
export type GS = GameState & MatchExtras;

const MAX_LOG = 80;

/** Deep clone, but keep the (large, immutable) humanBattle recording by reference. */
export function cloneState(state: GameState): GS {
  const { humanBattle, ...rest } = state;
  const c = structuredClone(rest) as GS;
  c.humanBattle = humanBattle as BattleResult | null;
  return c;
}

/** Wrap an in-place mutator into a pure reducer. */
export function pure<A extends unknown[]>(fn: (s: GS, ...args: A) => void) {
  return (state: GameState, ...args: A): GameState => {
    const s = cloneState(state);
    fn(s, ...args);
    return s;
  };
}

export function log(s: GameState, msg: string) {
  s.log.push(msg);
  if (s.log.length > MAX_LOG) s.log.splice(0, s.log.length - MAX_LOG);
}

/** Log only for the human player (bots fail silently). */
export function fail(s: GameState, p: PlayerState | undefined, msg: string) {
  if (p?.isHuman) log(s, msg);
}

export function withRng<T>(s: GameState, fn: (rng: Rng) => T): T {
  const rng = createRng(s.rngState);
  const r = fn(rng);
  s.rngState = rng.state();
  return r;
}

export function heroName(id: HeroId): string {
  return HEROES[id]?.name ?? id;
}

export const onBoard = (p: PlayerState) => p.heroes.filter((h) => h.slot !== null);
export const onBench = (p: PlayerState) => p.heroes.filter((h) => h.slot === null);
export const boardCount = (p: PlayerState) => onBoard(p).length;
export const benchCount = (p: PlayerState) => onBench(p).length;
export const findHero = (p: PlayerState, uid: string) => p.heroes.find((h) => h.uid === uid);

export function slotFree(p: PlayerState, slot: BoardSlot, exceptUid?: string) {
  return !p.heroes.some((h) => h.uid !== exceptUid && h.slot && h.slot.col === slot.col && h.slot.row === slot.row);
}

export function validSlot(slot: BoardSlot) {
  return (
    Number.isInteger(slot.col) &&
    Number.isInteger(slot.row) &&
    slot.col >= 0 &&
    slot.col < BOARD_COLS &&
    slot.row >= 0 &&
    slot.row < BOARD_ROWS
  );
}

const ROW_ORDER = [1, 0, 2];

/** Preferred column order for a hero: melee front, ranged back. */
export function preferredCols(heroId: HeroId): number[] {
  const def = HEROES[heroId];
  const cls = def?.cls;
  if (cls === 'warrior') return [0, 1, 2, 3];
  if (cls === 'assassin') return [1, 0, 2, 3];
  if (def?.ranged || cls === 'mage' || cls === 'hunter' || cls === 'support') return [3, 2, 1, 0];
  return [1, 2, 0, 3];
}

export function firstFreeSlot(p: PlayerState, heroId: HeroId): BoardSlot | null {
  for (const col of preferredCols(heroId)) {
    for (const row of ROW_ORDER) {
      const slot = { col, row };
      if (slotFree(p, slot)) return slot;
    }
  }
  return null;
}

/** Board heroes in "board order" (front col first, then row). */
export function boardOrder(p: PlayerState): OwnedHero[] {
  return onBoard(p).sort((a, b) => a.slot!.col - b.slot!.col || a.slot!.row - b.slot!.row);
}

/** Heroes that actually fight this round (board cap enforced by board order). */
export function fighters(p: PlayerState, round: number): OwnedHero[] {
  return boardOrder(p).slice(0, boardCap(round));
}

export const canBench = (p: PlayerState) => benchCount(p) < BENCH_SIZE;
