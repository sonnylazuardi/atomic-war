// Frame interpolation for battle playback. Pure helpers, no React.
import type { BattleEvent, BattleFrame, ProjectileSnapshot, UnitSnapshot, ZoneSnapshot } from '../../../core/types.ts';
import { SIM_DT } from '../../../core/constants.ts';

export interface Interp {
  units: UnitSnapshot[];
  projectiles: ProjectileSnapshot[];
  zones: ZoneSnapshot[];
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** lerp angles the short way round */
const lerpAngle = (a: number, b: number, k: number) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
};

/** units that jump further than this between frames (blink, leap, hook) snap instead of sliding */
const TELEPORT_DIST = 90;

export class FramePlayer {
  private frames: BattleFrame[];
  private step: number;
  private t0: number;
  private unitMaps = new Map<number, Map<string, UnitSnapshot>>();
  private projMaps = new Map<number, Map<number, ProjectileSnapshot>>();

  constructor(frames: BattleFrame[]) {
    this.frames = frames;
    this.t0 = frames.length ? frames[0]!.t : 0;
    const s = frames.length > 1 ? frames[1]!.t - frames[0]!.t : SIM_DT;
    this.step = s > 0 ? s : SIM_DT;
  }

  get empty() {
    return this.frames.length === 0;
  }

  private indexAt(t: number) {
    const f = this.frames;
    let i = Math.floor((t - this.t0) / this.step);
    if (i < 0) i = 0;
    if (i > f.length - 1) i = f.length - 1;
    // correct for non-uniform recording
    while (i > 0 && f[i]!.t > t) i--;
    while (i < f.length - 1 && f[i + 1]!.t <= t) i++;
    return i;
  }

  private unitMap(i: number) {
    let m = this.unitMaps.get(i);
    if (!m) {
      m = new Map();
      for (const u of this.frames[i]!.units) m.set(u.uid, u);
      this.unitMaps.set(i, m);
    }
    return m;
  }

  private projMap(i: number) {
    let m = this.projMaps.get(i);
    if (!m) {
      m = new Map();
      for (const p of this.frames[i]!.projectiles) m.set(p.id, p);
      this.projMaps.set(i, m);
    }
    return m;
  }

  at(t: number): Interp {
    if (!this.frames.length) return { units: [], projectiles: [], zones: [] };
    const i = this.indexAt(t);
    const a = this.frames[i]!;
    const hasNext = i < this.frames.length - 1;
    const b = hasNext ? this.frames[i + 1]! : a;
    const span = b.t - a.t;
    const into = Math.max(0, t - a.t);
    const k = hasNext && span > 0 ? Math.min(1, into / span) : 0;
    const nextUnits = hasNext ? this.unitMap(i + 1) : null;
    const nextProj = hasNext ? this.projMap(i + 1) : null;

    const units: UnitSnapshot[] = a.units.map((u) => {
      const n = nextUnits?.get(u.uid);
      const animT = u.animT + Math.min(into, span > 0 ? span : into);
      if (!n) return { ...u, animT };
      const dx = n.x - u.x;
      const dy = n.y - u.y;
      const snap = dx * dx + dy * dy > TELEPORT_DIST * TELEPORT_DIST;
      return {
        ...u,
        x: snap ? u.x : lerp(u.x, n.x, k),
        y: snap ? u.y : lerp(u.y, n.y, k),
        hp: lerp(u.hp, n.hp, k),
        mana: lerp(u.mana, n.mana, k),
        animT,
      };
    });

    const projectiles: ProjectileSnapshot[] = a.projectiles.map((p) => {
      const n = nextProj?.get(p.id);
      if (!n) return p;
      return { ...p, x: lerp(p.x, n.x, k), y: lerp(p.y, n.y, k), angle: lerpAngle(p.angle, n.angle, k) };
    });

    const zones: ZoneSnapshot[] = a.zones.map((z) => ({ ...z, t: z.t + into }));
    return { units, projectiles, zones };
  }
}

/** events sorted by time, consumed by a cursor as playback advances */
export class EventCursor {
  private events: BattleEvent[];
  private idx = 0;
  constructor(events: BattleEvent[]) {
    this.events = [...events].sort((a, b) => a.t - b.t);
  }
  /** returns every event with t <= now not yet returned */
  take(now: number): BattleEvent[] {
    const out: BattleEvent[] = [];
    while (this.idx < this.events.length && this.events[this.idx]!.t <= now) out.push(this.events[this.idx++]!);
    return out;
  }
}
