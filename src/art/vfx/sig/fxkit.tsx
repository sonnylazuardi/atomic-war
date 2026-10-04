// Shared helpers for signature VFX: deterministic pseudo-random, glow strokes, bolts, slashes, sparks.
// Everything is a pure function of its inputs (no hooks, timers or CSS animation).
import type { ReactNode } from 'react';
import type { Team, Vec } from '../../../core/types.ts';
import { clamp01 } from '../../types.ts';

/** deterministic hash -> [0,1) */
export const rnd = (i: number, seed = 0): number => {
  const s = Math.sin(i * 127.1 + seed * 311.7 + 74.7) * 43758.5453;
  return s - Math.floor(s);
};
/** deterministic hash -> [-1,1) */
export const srnd = (i: number, seed = 0): number => rnd(i, seed) * 2 - 1;

/** round for compact SVG output; guards non-finite values */
export const f = (v: number): number => (Number.isFinite(v) ? Math.round(v * 100) / 100 : 0);

export const TAU = Math.PI * 2;

/** normalized progress t/duration in [0,1] (safe for duration 0) */
export const prog = (t: number, duration: number): number => (duration > 0 ? clamp01(t / duration) : 1);

/** sub-progress of k within window [a,b] */
export const seg = (k: number, a: number, b: number): number => (b > a ? clamp01((k - a) / (b - a)) : k >= b ? 1 : 0);

/** fade in over first `inn`, fade out over last `out` (fractions of k) */
export const envelope = (k: number, inn = 0.1, out = 0.3): number =>
  Math.min(inn > 0 ? clamp01(k / inn) : 1, out > 0 ? clamp01((1 - k) / out) : 1);

export const dist = (a: Vec, b: Vec): number => Math.hypot(b.x - a.x, b.y - a.y);

/** unit direction a->b; when degenerate, falls back to team facing (left team faces right) */
export const dir = (a: Vec, b: Vec, team: Team = 'left'): Vec => {
  const d = dist(a, b);
  if (d < 1e-3) return { x: team === 'left' ? 1 : -1, y: 0 };
  return { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
};

export const angleDeg = (v: Vec): number => (Math.atan2(v.y, v.x) * 180) / Math.PI;

export const polar = (cx: number, cy: number, r: number, a: number): Vec => ({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });

/** polyline/path from points */
export const pathOf = (pts: Vec[], close = false): string =>
  pts.length === 0 ? '' : `M${pts.map((p) => `${f(p.x)} ${f(p.y)}`).join(' L')}${close ? ' Z' : ''}`;

/** jagged lightning points between a and b */
export const boltPoints = (a: Vec, b: Vec, segments: number, jitter: number, seed: number): Vec[] => {
  const d = dir(a, b);
  const n = { x: -d.y, y: d.x };
  const pts: Vec[] = [];
  for (let i = 0; i <= segments; i++) {
    const k = i / segments;
    const off = i === 0 || i === segments ? 0 : srnd(i, seed) * jitter * Math.sin(Math.PI * k) ** 0.5;
    pts.push({ x: a.x + (b.x - a.x) * k + n.x * off, y: a.y + (b.y - a.y) * k + n.y * off });
  }
  return pts;
};

/** layered glow stroke along a path: wide faint -> narrow bright core */
export const GlowPath = ({
  d,
  color,
  core = '#fff',
  width,
  opacity = 1,
  layers = 3,
}: {
  d: string;
  color: string;
  core?: string;
  width: number;
  opacity?: number;
  layers?: number;
}): ReactNode => {
  const out: ReactNode[] = [];
  for (let i = layers; i >= 1; i--) {
    out.push(
      <path
        key={i}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={f(width * (1 + i * 1.3))}
        strokeOpacity={f(opacity * (0.12 + 0.08 * (layers - i)))}
        strokeLinecap="round"
        strokeLinejoin="round"
      />,
    );
  }
  out.push(<path key="c" d={d} fill="none" stroke={color} strokeWidth={f(width)} strokeOpacity={f(opacity)} strokeLinecap="round" strokeLinejoin="round" />);
  out.push(<path key="w" d={d} fill="none" stroke={core} strokeWidth={f(width * 0.4)} strokeOpacity={f(opacity)} strokeLinecap="round" strokeLinejoin="round" />);
  return <g>{out}</g>;
};

/** soft glow disc made of stacked translucent circles */
export const Glow = ({ x, y, r, color, opacity = 1, core }: { x: number; y: number; r: number; color: string; opacity?: number; core?: string }): ReactNode => {
  if (r <= 0 || opacity <= 0) return null;
  return (
    <g>
      <circle cx={f(x)} cy={f(y)} r={f(r)} fill={color} opacity={f(opacity * 0.15)} />
      <circle cx={f(x)} cy={f(y)} r={f(r * 0.65)} fill={color} opacity={f(opacity * 0.25)} />
      <circle cx={f(x)} cy={f(y)} r={f(r * 0.35)} fill={color} opacity={f(opacity * 0.5)} />
      {core ? <circle cx={f(x)} cy={f(y)} r={f(r * 0.15)} fill={core} opacity={f(opacity)} /> : null}
    </g>
  );
};

/** expanding ring */
export const Ring = ({ x, y, r, color, width, opacity = 1, dash }: { x: number; y: number; r: number; color: string; width: number; opacity?: number; dash?: string }): ReactNode => {
  if (r <= 0 || opacity <= 0 || width <= 0) return null;
  return (
    <g>
      <circle cx={f(x)} cy={f(y)} r={f(r)} fill="none" stroke={color} strokeWidth={f(width * 2.6)} strokeOpacity={f(opacity * 0.2)} strokeDasharray={dash} />
      <circle cx={f(x)} cy={f(y)} r={f(r)} fill="none" stroke={color} strokeWidth={f(width)} strokeOpacity={f(opacity)} strokeDasharray={dash} />
    </g>
  );
};

/** radial burst of spark streaks. k = progress 0..1 */
export const Sparks = ({
  x,
  y,
  n,
  seed,
  k,
  reach,
  color,
  width = 2,
  arc = TAU,
  heading = 0,
  gravity = 0,
}: {
  x: number;
  y: number;
  n: number;
  seed: number;
  k: number;
  reach: number;
  color: string;
  width?: number;
  arc?: number;
  heading?: number;
  gravity?: number;
}): ReactNode => {
  if (k <= 0 || k >= 1) return null;
  const out: ReactNode[] = [];
  const e = 1 - (1 - k) ** 2;
  for (let i = 0; i < n; i++) {
    const a = heading + (rnd(i, seed) - 0.5) * arc;
    const sp = 0.5 + rnd(i, seed + 1) * 0.6;
    const r1 = reach * sp * e;
    const r0 = Math.max(0, r1 - reach * 0.25 * (1 - k));
    const g = gravity * k * k;
    const p0 = polar(x, y, r0, a);
    const p1 = polar(x, y, r1, a);
    out.push(
      <line
        key={i}
        x1={f(p0.x)}
        y1={f(p0.y + g * 0.6)}
        x2={f(p1.x)}
        y2={f(p1.y + g)}
        stroke={color}
        strokeWidth={f(width * (1 - k * 0.7))}
        strokeOpacity={f(1 - k)}
        strokeLinecap="round"
      />,
    );
  }
  return <g>{out}</g>;
};

/** crescent slash shape centered at (x,y), rotated `rot` deg, length L, thickness w, drawn progress p (0..1) */
export const slashPath = (L: number, w: number, p: number, bend = 0.35): string => {
  const h = L / 2;
  const x0 = -h;
  const x1 = -h + L * clamp01(p);
  const mid = (x0 + x1) / 2;
  const sag = L * bend;
  const thick = w * clamp01(p);
  return `M${f(x0)} 0 Q${f(mid)} ${f(-sag)} ${f(x1)} 0 Q${f(mid)} ${f(-sag + thick)} ${f(x0)} 0 Z`;
};

export const Slash = ({
  x,
  y,
  rot,
  L,
  w,
  p,
  color,
  opacity = 1,
  bend = 0.25,
}: {
  x: number;
  y: number;
  rot: number;
  L: number;
  w: number;
  p: number;
  color: string;
  opacity?: number;
  bend?: number;
}): ReactNode => {
  if (opacity <= 0 || p <= 0) return null;
  const d = slashPath(L, w, p, bend);
  return (
    <g transform={`translate(${f(x)},${f(y)}) rotate(${f(rot)})`} opacity={f(opacity)}>
      <path d={d} fill={color} opacity={0.35} transform="scale(1.15,1.6)" />
      <path d={d} fill={color} />
      <path d={slashPath(L * 0.92, w * 0.35, p, bend)} fill="#fff" />
    </g>
  );
};
