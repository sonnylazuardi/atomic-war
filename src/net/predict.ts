// Optimistic UI (MULTIPLAYER.md #21): deterministic intents are applied locally at once with the same core
// reducers the server runs, then reconciled with each authoritative snapshot (act.seq / state.ackSeq):
// server state = truth, still-unacknowledged predictions are re-applied on top. Anything that draws from the
// RNG (shop refresh, hero uids, extra offers) is never predicted — views carry rngState 0 — it just waits.
import * as G from '../core/game/index.ts';
import type { BoardSlot, GameState, LordId } from '../core/types.ts';
import type { ActName } from './protocol.ts';

type Reducer = (s: GameState, pid: number, args: unknown[]) => GameState;
// args come from our own typed GameActions, so the casts below are safe
const a = <T extends unknown[]>(args: unknown[]) => args as unknown as T;

export const PREDICTORS: Partial<Record<ActName, Reducer>> = {
  pickLord: (s, pid, args) => G.pickLord(s, args[0] as LordId, pid),
  buyHero: (s, pid, args) => G.buyHero(s, pid, ...a<[number]>(args)),
  buySpell: (s, pid, args) => G.buySpell(s, pid, ...a<[number]>(args)),
  buyItem: (s, pid, args) => G.buyItem(s, pid, ...a<[number]>(args)),
  sellHero: (s, pid, args) => G.sellHero(s, pid, ...a<[string]>(args)),
  sellSpell: (s, pid, args) => G.sellSpell(s, pid, ...a<[number]>(args)),
  sellItem: (s, pid, args) => G.sellItem(s, pid, ...a<[number]>(args)),
  upgradeHero: (s, pid, args) => G.upgradeHero(s, pid, ...a<[string]>(args)),
  assignSpell: (s, pid, args) => G.assignSpell(s, pid, ...a<[string, number, number]>(args)),
  unassignSpell: (s, pid, args) => G.unassignSpell(s, pid, ...a<[string, number]>(args)),
  swapSpellSlots: (s, pid, args) => G.swapSpellSlots(s, pid, ...a<[string, number, number]>(args)),
  equipItem: (s, pid, args) => G.equipItem(s, pid, ...a<[string, number, number]>(args)),
  unequipItem: (s, pid, args) => G.unequipItem(s, pid, ...a<[string, number]>(args)),
  placeHero: (s, pid, args) => G.placeHero(s, pid, ...a<[string, BoardSlot | null]>(args)),
  upgradeShop: (s, pid) => G.upgradeShop(s, pid),
  toggleLock: (s, pid) => G.toggleLock(s, pid),
  useLordAbility: (s, pid, args) => G.useLordAbility(s, pid, ...a<[string | undefined]>(args)),
};

/** Apply one predicted intent; null when it can't be predicted (unknown, throws, or touched the RNG). */
export function predictOne(s: GameState, pid: number, name: ActName, args: unknown[]): GameState | null {
  const fn = PREDICTORS[name];
  if (!fn) return null;
  try {
    const next = fn(s, pid, args);
    return next.rngState === s.rngState ? next : null;
  } catch {
    return null;
  }
}

export interface PendingAct {
  seq: number;
  name: ActName;
  args: unknown[];
}

export class Predictor {
  private seq = 0;
  pending: PendingAct[] = [];

  /** a new intent: returns its seq and the predicted state (null = just send and wait for the server) */
  act(s: GameState, pid: number, name: ActName, args: unknown[]): { seq: number; next: GameState | null } {
    const seq = ++this.seq;
    const next = predictOne(s, pid, name, args);
    if (next) this.pending.push({ seq, name, args });
    return { seq, next };
  }

  /** authoritative snapshot: drop acknowledged (applied OR rejected) intents, re-apply the rest on top */
  reconcile(server: GameState, pid: number, ackSeq: number | undefined): GameState {
    // a server without seq support: its state is all we can trust (re-applying could double-apply)
    if (ackSeq === undefined) {
      this.pending = [];
      return server;
    }
    this.pending = this.pending.filter((p) => p.seq > ackSeq);
    if (!this.pending.length) return server;
    let s = server;
    const kept: PendingAct[] = [];
    for (const p of this.pending) {
      const next = predictOne(s, pid, p.name, p.args);
      if (!next) continue;
      s = next;
      kept.push(p);
    }
    this.pending = kept;
    return s;
  }

  reset() {
    this.pending = [];
  }
}

/** connection quality from round-trip ms */
export type PingLevel = 'good' | 'ok' | 'bad';
export function pingLevel(ms: number): PingLevel {
  return ms < 120 ? 'good' : ms < 250 ? 'ok' : 'bad';
}
