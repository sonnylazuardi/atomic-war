// Display-space transform for a recorded battle: the human is ALWAYS drawn on the BOTTOM half in the
// left (green) team colors. When the human is the visitor (humanSide 'right', spawned on top) every y is
// mirrored (y -> ARENA_H - y), projectile angles flip vertically and the two teams swap. Facing (a
// left/right sprite flip) is unaffected by a vertical mirror.
import type { BattleEvent, BattleResult, Team, Vec } from '../../../core/types.ts';
import { ARENA_H } from '../../../core/constants.ts';

const my = (y: number) => ARENA_H - y;
const mv = (v: Vec): Vec => ({ x: v.x, y: my(v.y) });
const swap = (t: Team): Team => (t === 'left' ? 'right' : 'left');

function mirrorEvent(ev: BattleEvent): BattleEvent {
  switch (ev.kind) {
    case 'cast':
      return { ...ev, from: mv(ev.from), to: mv(ev.to) };
    case 'proc':
    case 'item':
      return { ...ev, at: mv(ev.at) };
    case 'end':
      return { ...ev, winner: ev.winner === 'draw' ? 'draw' : swap(ev.winner) };
    default:
      return ev;
  }
}

/** returns the battle as it should be displayed (human = 'left' = bottom). Identity when humanSide is 'left'. */
export function toDisplay(battle: BattleResult, humanSide: Team): BattleResult {
  if (humanSide === 'left') return battle;
  return {
    ...battle,
    winner: battle.winner === 'draw' ? 'draw' : swap(battle.winner),
    survivors: { left: battle.survivors.right, right: battle.survivors.left },
    frames: battle.frames.map((f) => ({
      t: f.t,
      units: f.units.map((u) => ({ ...u, y: my(u.y), team: swap(u.team) })),
      projectiles: f.projectiles.map((p) => ({ ...p, y: my(p.y), angle: -p.angle, team: swap(p.team) })),
      zones: f.zones.map((z) => ({ ...z, y: my(z.y), team: swap(z.team) })),
    })),
    events: battle.events.map(mirrorEvent),
  };
}
