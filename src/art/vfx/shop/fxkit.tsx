// Shared helpers for shop-spell VFX. Pure, deterministic, no hooks.
import type { Vec } from '../../../core/types.ts';
import { clamp01 } from '../../types.ts';

/** deterministic pseudo-random in [0,1) from an index + seed */
export const h = (i: number, seed = 0): number => {
  const x = Math.sin(i * 127.1 + seed * 311.7 + 0.5) * 43758.5453;
  return x - Math.floor(x);
};
/** signed variant in [-1,1) */
export const hs = (i: number, seed = 0): number => h(i, seed) * 2 - 1;

/** format a number for SVG attribute strings (never NaN) */
export const f = (n: number): string => (Number.isFinite(n) ? Math.round(n * 10) / 10 : 0).toString();

/** normalized progress, safe for duration 0 */
export const prog = (t: number, duration: number): number => clamp01(t / Math.max(duration, 0.001));

/** 0 before a, 1 after b, linear in between */
export const span = (k: number, a: number, b: number): number => clamp01((k - a) / Math.max(b - a, 1e-6));

/** fade in over [0,a], out over [b,1] */
export const fadeIO = (k: number, a = 0.1, b = 0.75): number => Math.min(span(k, 0, a), 1 - span(k, b, 1));

export const dirOf = (from: Vec, to: Vec): { ux: number; uy: number; len: number; deg: number } => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-3) return { ux: 1, uy: 0, len: 0, deg: 0 };
  return { ux: dx / len, uy: dy / len, len, deg: (Math.atan2(dy, dx) * 180) / Math.PI };
};

/** jagged lightning-style polyline between two points */
export const jagged = (ax: number, ay: number, bx: number, by: number, segs: number, amp: number, seed: number): string => {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  let d = `M${f(ax)},${f(ay)}`;
  for (let i = 1; i < segs; i++) {
    const k = i / segs;
    const o = hs(i, seed) * amp * Math.sin(Math.PI * k) * 1.4;
    d += ` L${f(ax + dx * k + nx * o)},${f(ay + dy * k + ny * o)}`;
  }
  return `${d} L${f(bx)},${f(by)}`;
};

/** n-pointed star */
export const star = (cx: number, cy: number, ro: number, ri: number, n: number, rot = 0): string => {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n;
    const r = i % 2 === 0 ? ro : ri;
    d += `${i === 0 ? 'M' : 'L'}${f(cx + Math.cos(a) * r)},${f(cy + Math.sin(a) * r)} `;
  }
  return `${d}Z`;
};

/** polygon helper from point list */
export const poly = (pts: [number, number][]): string => pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');

/** glowing stroke: wide faint halo, mid colored, bright core */
export function GlowPath({
  d,
  color,
  core = '#ffffff',
  width,
  opacity = 1,
  dash,
  dashOffset,
}: {
  d: string;
  color: string;
  core?: string;
  width: number;
  opacity?: number;
  dash?: string;
  dashOffset?: number;
}) {
  if (opacity <= 0.001 || width <= 0) return null;
  const common = { d, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeDasharray: dash, strokeDashoffset: dashOffset };
  return (
    <g opacity={f(opacity)}>
      <path {...common} stroke={color} strokeWidth={f(width * 3)} opacity={0.18} />
      <path {...common} stroke={color} strokeWidth={f(width * 1.6)} opacity={0.45} />
      <path {...common} stroke={color} strokeWidth={f(width)} />
      <path {...common} stroke={core} strokeWidth={f(Math.max(width * 0.35, 0.6))} opacity={0.9} />
    </g>
  );
}

/** glowing ring */
export function GlowRing({ cx, cy, r, color, width, opacity = 1, core = '#ffffff' }: { cx: number; cy: number; r: number; color: string; width: number; opacity?: number; core?: string }) {
  if (opacity <= 0.001 || r <= 0 || width <= 0) return null;
  return (
    <g opacity={f(opacity)} fill="none">
      <circle cx={f(cx)} cy={f(cy)} r={f(r)} stroke={color} strokeWidth={f(width * 3)} opacity={0.15} />
      <circle cx={f(cx)} cy={f(cy)} r={f(r)} stroke={color} strokeWidth={f(width * 1.6)} opacity={0.4} />
      <circle cx={f(cx)} cy={f(cy)} r={f(r)} stroke={color} strokeWidth={f(width)} />
      <circle cx={f(cx)} cy={f(cy)} r={f(r)} stroke={core} strokeWidth={f(Math.max(width * 0.3, 0.5))} opacity={0.8} />
    </g>
  );
}

/** ground-plane (squashed) glowing ring for footprint effects */
export function GroundRing({ cx, cy, r, color, width, opacity = 1, squash = 0.42 }: { cx: number; cy: number; r: number; color: string; width: number; opacity?: number; squash?: number }) {
  if (opacity <= 0.001 || r <= 0 || width <= 0) return null;
  const ry = r * squash;
  return (
    <g opacity={f(opacity)} fill="none">
      <ellipse cx={f(cx)} cy={f(cy)} rx={f(r)} ry={f(ry)} stroke={color} strokeWidth={f(width * 3)} opacity={0.15} />
      <ellipse cx={f(cx)} cy={f(cy)} rx={f(r)} ry={f(ry)} stroke={color} strokeWidth={f(width * 1.5)} opacity={0.45} />
      <ellipse cx={f(cx)} cy={f(cy)} rx={f(r)} ry={f(ry)} stroke={color} strokeWidth={f(width)} />
    </g>
  );
}

/** radial burst of short spark lines */
export function Sparks({ cx, cy, n, r0, r1, k, color, seed, width = 2 }: { cx: number; cy: number; n: number; r0: number; r1: number; k: number; color: string; seed: number; width?: number }) {
  if (k <= 0 || k >= 1) return null;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hs(i, seed) * 0.4;
    const reach = r0 + (r1 - r0) * (0.6 + h(i, seed + 1) * 0.4) * k;
    const tail = reach - (r1 - r0) * 0.25 * (1 - k);
    out.push(
      <line
        key={i}
        x1={f(cx + Math.cos(a) * Math.max(r0, tail))}
        y1={f(cy + Math.sin(a) * Math.max(r0, tail))}
        x2={f(cx + Math.cos(a) * reach)}
        y2={f(cy + Math.sin(a) * reach)}
        stroke={color}
        strokeWidth={f(width * (1 - k * 0.6))}
        strokeLinecap="round"
        opacity={f(1 - k)}
      />,
    );
  }
  return <g>{out}</g>;
}
