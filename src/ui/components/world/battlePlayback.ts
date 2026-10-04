// Mutable battle playback state (frames interpolation, events -> effects, HP bar chip fx, shake).
// Lives in a ref; the World's RAF clock advances it — no per-entity React state.
import type { BattleResult, UnitSnapshot, Vec } from '../../../core/types.ts';
import { EventCursor, FramePlayer } from '../arena/playback.ts';
import type { Interp } from '../arena/playback.ts';
import { effectsForEvent, pruneEffects } from '../arena/effects.tsx';
import type { Effect } from '../arena/effects.tsx';
import type { BarFx } from '../arena/UnitView.tsx';

export interface UnitFx extends BarFx {
  lastHit: number;
  prevHp: number;
}

export interface Playback {
  player: FramePlayer;
  cursor: EventCursor;
  end: number;
  t: number;
  view: Interp;
  effects: Effect[];
  fx: Map<string, UnitFx>;
  idSeq: number;
  shakeAmp: number;
  shakeStart: number;
}

export function makePlayback(battle: BattleResult): Playback {
  const player = new FramePlayer(battle.frames);
  const lastT = battle.frames.length ? battle.frames[battle.frames.length - 1]!.t : 0;
  const end = player.empty ? 0 : battle.duration > 0 ? Math.min(battle.duration, lastT + 0.5) : lastT;
  return {
    player,
    cursor: new EventCursor(battle.events),
    end,
    t: 0,
    view: player.at(0),
    effects: [],
    fx: new Map(),
    idSeq: 1,
    shakeAmp: 0,
    shakeStart: 0,
  };
}

export function currentShake(pb: Playback) {
  const k = 1 - (pb.t - pb.shakeStart) / 0.45;
  return k > 0 ? pb.shakeAmp * k : 0;
}

/** advance derived state (events -> effects, bar fx) to pb.t */
export function advance(pb: Playback, dtBattle: number) {
  const view = pb.player.at(pb.t);
  pb.view = view;
  const byUid = new Map<string, UnitSnapshot>();
  for (const u of view.units) byUid.set(u.uid, u);

  const events = pb.cursor.take(pb.t);
  if (events.length) {
    const ctx = {
      pos: (uid: string): Vec | undefined => {
        const u = byUid.get(uid);
        return u ? { x: u.x, y: u.y } : undefined;
      },
      team: (uid: string) => byUid.get(uid)?.team,
      nextId: () => pb.idSeq++,
      shake: (amount: number) => {
        pb.shakeAmp = Math.max(amount, currentShake(pb));
        pb.shakeStart = pb.t;
      },
    };
    for (const ev of events) {
      try {
        for (const e of effectsForEvent(ev, ctx)) pb.effects.push(e);
      } catch {
        // a malformed event must never break playback
      }
    }
  }
  pb.effects = pruneEffects(pb.effects, pb.t);

  for (const u of view.units) {
    let f = pb.fx.get(u.uid);
    if (!f) {
      f = { chip: u.hp, flash: 0, lastHit: -9, prevHp: u.hp };
      pb.fx.set(u.uid, f);
    }
    if (u.hp < f.prevHp - 0.5) f.lastHit = pb.t;
    f.flash = Math.max(0, 1 - (pb.t - f.lastHit) / 0.18);
    if (pb.t - f.lastHit > 0.35) f.chip -= u.maxHp * 0.9 * dtBattle;
    if (f.chip < u.hp) f.chip = u.hp;
    f.prevHp = u.hp;
  }
}

/** jump straight to the end (skip): final frame, no effects spawned for skipped events */
export function jumpToEnd(pb: Playback) {
  pb.t = pb.end;
  pb.view = pb.player.at(pb.end);
  pb.effects = [];
  pb.shakeAmp = 0;
  for (const u of pb.view.units) pb.fx.set(u.uid, { chip: u.hp, flash: 0, lastHit: -9, prevHp: u.hp });
}
