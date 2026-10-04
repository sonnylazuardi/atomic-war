// Shared helpers for hero art group 1. Everything is a pure function of (anim, t, dur).
import type { ReactNode } from 'react';
import type { AnimState, Team } from '../../core/types.ts';
import { TEAM_COLORS, bump, clamp01, easeOut, lerp, loop } from '../types.ts';

export const OUT = '#14110f';
export const SW = 1.6;
export const TAU = Math.PI * 2;

export const smooth = (k: number) => {
  const c = clamp01(k);
  return c * c * (3 - 2 * c);
};
/** 0 → 1 over [a, b] */
export const seg = (k: number, a: number, b: number) => clamp01((k - a) / (b - a));
export const f = (n: number) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : 0);

/** Common outline props */
export const ol = { stroke: OUT, strokeWidth: SW, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

export interface Motion {
  /** vertical body offset (negative = up) */
  bob: number;
  /** body lean in degrees (positive = forward / clockwise) */
  lean: number;
  /** leg swing angles (deg) for back / front legs */
  legA: number;
  legB: number;
  /** 0..1 progress of attack / cast (0 when not in that anim) */
  atk: number;
  cast: number;
  /** idle secondary-motion phase in radians */
  ph: number;
  /** generic sway -1..1 */
  sway: number;
  walking: boolean;
}

export function motion(anim: AnimState, t: number, dur: number, idlePeriod = 1.6, walkPeriod = 0.6): Motion {
  const d = dur > 0 ? dur : 0.6;
  const ph = loop(t, idlePeriod) * TAU;
  const m: Motion = { bob: 0, lean: 0, legA: 0, legB: 0, atk: 0, cast: 0, ph, sway: Math.sin(ph), walking: false };
  if (anim === 'idle') {
    m.bob = Math.sin(ph) * 1.2;
  } else if (anim === 'walk') {
    const w = loop(t, walkPeriod) * TAU;
    m.ph = w;
    m.sway = Math.sin(w);
    m.legA = Math.sin(w) * 28;
    m.legB = -Math.sin(w) * 28;
    m.bob = -Math.abs(Math.cos(w)) * 2.6 + 1;
    m.lean = 7;
    m.walking = true;
  } else if (anim === 'attack') {
    m.atk = clamp01(t / d);
    m.ph = 0;
    m.sway = 0;
  } else if (anim === 'cast') {
    m.cast = clamp01(t / d);
    m.ph = t * 6;
    m.sway = 0;
  } else if (anim === 'hurt') {
    m.ph = t * 9;
    m.sway = Math.sin(t * 9);
  }
  return m;
}

/** Generic swing curve: rest → back (wind-up, 0..0.42) → fwd (strike, 0.42..0.55) → rest (recover). */
export function swing(k: number, rest: number, back: number, fwd: number) {
  if (k <= 0) return rest;
  if (k < 0.42) return lerp(rest, back, easeOut(k / 0.42));
  if (k < 0.55) return lerp(back, fwd, smooth((k - 0.42) / 0.13));
  return lerp(fwd, rest, smooth((k - 0.55) / 0.45));
}
/** Opacity of a strike trail: appears at strike start, fades during recovery. */
export const trailAlpha = (k: number) => (k < 0.42 ? 0 : k < 0.56 ? 1 : 1 - seg(k, 0.56, 0.8));
/** Strike flash bump around the hit frame. */
export const hitFlash = (k: number) => bump(seg(k, 0.44, 0.68));
/** Body lunge forward during attack (units). */
export const lunge = (k: number, amt: number) =>
  k <= 0 ? 0 : k < 0.42 ? -0.3 * amt * easeOut(k / 0.42) : k < 0.5 ? lerp(-0.3 * amt, amt, seg(k, 0.42, 0.5)) : lerp(amt, 0, smooth(seg(k, 0.5, 1)));

/** Arc point in the "limb" convention: angle 0 points down (+y), 90 = back (-x), -90 = forward (+x). */
export function arcPt(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx - r * Math.sin(a), cy + r * Math.cos(a)];
}

/** Crescent motion-trail between two limb angles. Thick at the end (current position). */
export function Swoosh(p: { cx: number; cy: number; r: number; a0: number; a1: number; width: number; color: string; core?: string; opacity: number }) {
  if (p.opacity <= 0.01 || Math.abs(p.a1 - p.a0) < 2) return null;
  const N = 14;
  const outer: string[] = [];
  const inner: string[] = [];
  for (let i = 0; i <= N; i++) {
    const k = i / N;
    const a = lerp(p.a0, p.a1, k);
    const [ox, oy] = arcPt(p.cx, p.cy, p.r, a);
    const [ix, iy] = arcPt(p.cx, p.cy, p.r - p.width * k * k, a);
    outer.push(`${f(ox)},${f(oy)}`);
    inner.unshift(`${f(ix)},${f(iy)}`);
  }
  const d = `M${outer.join(' L')} L${inner.join(' L')}Z`;
  const coreOuter: string[] = [];
  for (let i = 0; i <= N; i++) {
    const a = lerp(p.a0, p.a1, i / N);
    const [x, y] = arcPt(p.cx, p.cy, p.r - 1, a);
    coreOuter.push(`${f(x)},${f(y)}`);
  }
  return (
    <g opacity={f(p.opacity)}>
      <path d={d} fill={p.color} opacity={0.75} />
      <path d={`M${coreOuter.join(' L')}`} fill="none" stroke={p.core ?? '#fff'} strokeWidth={1.4} strokeLinecap="round" opacity={0.9} />
    </g>
  );
}

/** Rotated limb: group at (x,y) rotated by angle; children are drawn in limb space (limb points +y). */
export function Rot(p: { x: number; y: number; a: number; children?: ReactNode }) {
  return <g transform={`translate(${f(p.x)},${f(p.y)}) rotate(${f(p.a)})`}>{p.children}</g>;
}

/** Simple tapered limb capsule from (0,0) to (0,len) */
export function Limb(p: { len: number; w0: number; w1: number; fill: string; shade?: string }) {
  const { len, w0, w1 } = p;
  const d = `M${-w0 / 2},0 L${-w1 / 2},${len} A${w1 / 2},${w1 / 2} 0 0 0 ${w1 / 2},${len} L${w0 / 2},0 A${w0 / 2},${w0 / 2} 0 0 0 ${-w0 / 2},0Z`;
  return (
    <g>
      <path d={d} fill={p.fill} {...ol} />
      {p.shade && <path d={`M${w0 / 2 - 1.2},1 L${w1 / 2 - 1},${len}`} stroke={p.shade} strokeWidth={1.6} strokeLinecap="round" />}
    </g>
  );
}

export function DizzyStars(p: { t: number; x: number; y: number; r?: number }) {
  const r = p.r ?? 11;
  const out: ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const a = p.t * 5 + (i * TAU) / 3;
    const x = p.x + Math.cos(a) * r;
    const y = p.y + Math.sin(a) * r * 0.32;
    const s = 2.2 + Math.sin(a) * 0.8;
    out.push(
      <path
        key={i}
        transform={`translate(${f(x)},${f(y)}) rotate(${f(p.t * 200 + i * 40)}) scale(${f(s / 3)})`}
        d="M0,-4 L1.2,-1.2 L4,-1.2 L1.8,0.6 L2.6,3.6 L0,1.8 L-2.6,3.6 L-1.8,0.6 L-4,-1.2 L-1.2,-1.2Z"
        fill="#ffe14d"
        stroke={OUT}
        strokeWidth={0.8}
        strokeLinejoin="round"
        opacity={Math.sin(a) > -0.2 ? 1 : 0.6}
      />,
    );
  }
  return <g>{out}</g>;
}

/** Glowing rune circle (cast). k = cast progress 0..1 */
export function RuneCircle(p: { x: number; y: number; r: number; k: number; color: string; spin?: number; sides?: number }) {
  const grow = easeOut(seg(p.k, 0, 0.6));
  const flash = bump(seg(p.k, 0.5, 0.85));
  const fade = 1 - seg(p.k, 0.85, 1);
  if (grow <= 0.01 || fade <= 0) return null;
  const r = p.r * grow;
  const sides = p.sides ?? 6;
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i * TAU) / sides + (p.spin ?? 0);
    pts.push(`${f(p.x + Math.cos(a) * r * 0.82)},${f(p.y + Math.sin(a) * r * 0.82 * 0.36)}`);
  }
  return (
    <g opacity={f(fade)}>
      <ellipse cx={p.x} cy={p.y} rx={f(r)} ry={f(r * 0.36)} fill={p.color} opacity={f(0.12 + flash * 0.25)} />
      <ellipse cx={p.x} cy={p.y} rx={f(r)} ry={f(r * 0.36)} fill="none" stroke={p.color} strokeWidth={f(1.5 + flash * 1.5)} />
      <polygon points={pts.join(' ')} fill="none" stroke={p.color} strokeWidth={1} opacity={0.85} />
      <ellipse cx={p.x} cy={p.y} rx={f(r * 0.55)} ry={f(r * 0.55 * 0.36)} fill="none" stroke="#fff" strokeWidth={0.8} opacity={f(0.4 + flash * 0.6)} />
    </g>
  );
}

/** Glow orb with soft halo (no gradient needed). */
export function Glow(p: { x: number; y: number; r: number; color: string; core?: string; opacity?: number }) {
  if (p.r <= 0.05) return null;
  const o = p.opacity ?? 1;
  return (
    <g opacity={f(o)}>
      <circle cx={f(p.x)} cy={f(p.y)} r={f(p.r * 2)} fill={p.color} opacity={0.18} />
      <circle cx={f(p.x)} cy={f(p.y)} r={f(p.r * 1.35)} fill={p.color} opacity={0.35} />
      <circle cx={f(p.x)} cy={f(p.y)} r={f(p.r)} fill={p.color} />
      <circle cx={f(p.x)} cy={f(p.y)} r={f(p.r * 0.5)} fill={p.core ?? '#fff'} opacity={0.9} />
    </g>
  );
}

/**
 * Wraps a hero body: team ground ring + shadow, death fall/fade, hurt tilt + dizzy stars.
 * `headY` is where the stars orbit (local y above feet).
 */
export function HeroFrame(p: { anim: AnimState; t: number; team: Team; headY: number; width?: number; children?: ReactNode }) {
  const w = p.width ?? 22;
  const dead = p.anim === 'dead' ? easeOut(p.t / 0.6) : 0;
  const hurt = p.anim === 'hurt';
  const tilt = hurt ? -9 + Math.sin(p.t * 14) * 3 * Math.exp(-p.t * 2) : 0;
  const shakeX = hurt ? Math.sin(p.t * 47) * 1.2 * Math.max(0.3, Math.exp(-p.t * 3)) : 0;
  // fall backward: rotate counter-clockwise about a point slightly behind the feet
  const fall = -84 * dead;
  const sink = dead * 4;
  const bounce = p.anim === 'dead' ? Math.max(0, Math.sin(seg(p.t, 0.6, 0.85) * Math.PI)) * -2 : 0;
  const op = 1 - dead * 0.65;
  const tc = TEAM_COLORS[p.team];
  return (
    <g opacity={f(op)}>
      <ellipse cx={0} cy={0} rx={w * (1 + dead * 0.9)} ry={6} fill="#000" opacity={0.28}  />
      <ellipse cx={0} cy={0} rx={w + 2} ry={6.6} fill="none" stroke={tc} strokeWidth={1.6} opacity={0.85} />
      <g transform={`translate(${f(shakeX - p.headY * 0.5 * dead)},${f(sink + bounce)}) rotate(${f(fall + tilt)},-4,0)`}>{p.children}</g>
      {hurt && <DizzyStars t={p.t} x={0} y={p.headY - 8} />}
    </g>
  );
}

export { bump, clamp01, easeOut, lerp, loop };

/** Teardrop flame pointing up from (0,0) base; `s` = height. Flickers with t + seed. */
export function Flame(p: { x: number; y: number; s: number; t: number; seed?: number; color?: string; core?: string; lean?: number }) {
  const sd = p.seed ?? 0;
  const fl = 1 + Math.sin(p.t * 17 + sd * 3.1) * 0.12 + Math.sin(p.t * 29 + sd) * 0.06;
  const h = p.s * fl;
  const w = p.s * 0.42;
  const lx = (p.lean ?? 0) + Math.sin(p.t * 11 + sd * 2) * p.s * 0.12;
  const d = `M${f(-w)},0 C${f(-w)},${f(-h * 0.45)} ${f(lx - w * 0.2)},${f(-h * 0.6)} ${f(lx)},${f(-h)} C${f(lx + w * 0.3)},${f(-h * 0.6)} ${f(w)},${f(-h * 0.45)} ${f(w)},0 C${f(w)},${f(w * 0.9)} ${f(-w)},${f(w * 0.9)} ${f(-w)},0Z`;
  const di = `M${f(-w * 0.5)},0 C${f(-w * 0.5)},${f(-h * 0.3)} ${f(lx * 0.6)},${f(-h * 0.4)} ${f(lx * 0.6)},${f(-h * 0.6)} C${f(lx * 0.6 + w * 0.2)},${f(-h * 0.4)} ${f(w * 0.5)},${f(-h * 0.3)} ${f(w * 0.5)},0 C${f(w * 0.5)},${f(w * 0.5)} ${f(-w * 0.5)},${f(w * 0.5)} ${f(-w * 0.5)},0Z`;
  return (
    <g transform={`translate(${f(p.x)},${f(p.y)})`}>
      <path d={d} fill={p.color ?? '#ff6a1f'} stroke={OUT} strokeWidth={0.9} strokeLinejoin="round" />
      <path d={di} fill={p.core ?? '#ffd84a'} />
    </g>
  );
}

/** Three parallel claw-scratch trails */
export function ClawTrail(p: { cx: number; cy: number; r: number; a0: number; a1: number; opacity: number; color: string }) {
  if (p.opacity <= 0.01) return null;
  return (
    <g>
      {[0, 4.5, 9].map((dr, i) => (
        <Swoosh key={i} cx={p.cx} cy={p.cy} r={p.r - dr} a0={p.a0 + i * 6} a1={p.a1} width={2.6} color={p.color} opacity={p.opacity} />
      ))}
    </g>
  );
}

/** Expanding shockwave rings on the ground / around a point */
export function Rings(p: { x: number; y: number; k: number; r: number; color: string; n?: number; flat?: number }) {
  const n = p.n ?? 3;
  const out: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const kk = seg(p.k, i * 0.15, i * 0.15 + 0.55);
    if (kk <= 0 || kk >= 1) continue;
    const r = p.r * easeOut(kk);
    out.push(
      <ellipse key={i} cx={p.x} cy={p.y} rx={f(r)} ry={f(r * (p.flat ?? 0.4))} fill="none" stroke={p.color} strokeWidth={f(4 * (1 - kk) + 0.5)} opacity={f(1 - kk)} />,
    );
  }
  return <g>{out}</g>;
}
