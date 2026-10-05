// Shared drawing + pose helpers for hero art group 2. Everything is a pure function of (anim, t, dur).
import type { ReactNode } from 'react';
import type { AnimState, Team } from '../../core/types.ts';
import { TEAM_COLORS, bump, clamp01, easeOut, loop } from '../types.ts';

export const OL = '#14110f';
const D2R = Math.PI / 180;
const TAU = Math.PI * 2;

/** round for compact, NaN-free SVG strings */
export const r2 = (n: number) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : 0);
export const pts = (p: [number, number][]) => p.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ');
export const easeInOut = (k: number) => {
  const x = clamp01(k);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};
export const hash = (n: number) => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// ------------------------------------------------------------------ pose

export interface Pose {
  anim: AnimState;
  t: number;
  /** normalized progress of one-shot anims */
  k: number;
  breathe: number;
  walking: boolean;
  /** walk phase in radians */
  wph: number;
  bob: number;
  lean: number;
  /** attack: 0→1 wind-up, snapping back to 0 right after release */
  charge: number;
  /** attack: follow-through extension after release */
  strike: number;
  /** attack: release flash 0..1..0 around k=0.5 */
  flash: number;
  /** cast: arms-up amount */
  raise: number;
  /** cast: growing glow */
  glow: number;
  /** cast: climax flash */
  cflash: number;
  hurt: boolean;
  wobble: number;
  fall: number;
  opacity: number;
}

export function pose(anim: AnimState, t: number, dur: number, idleP = 1.6, walkP = 0.6): Pose {
  const D = dur > 0 ? dur : 0.6;
  const tt = Number.isFinite(t) && t > 0 ? t : 0;
  const k = clamp01(tt / D);
  const breathe = Math.sin((tt / idleP) * TAU);
  const walking = anim === 'walk';
  const wph = walking ? loop(tt, walkP) * TAU : 0;
  const isA = anim === 'attack';
  const isC = anim === 'cast';
  const charge = isA ? (k < 0.5 ? easeOut(k / 0.5) : 1 - easeOut((k - 0.5) / 0.12)) : 0;
  const strike = isA ? (k < 0.5 ? 0 : k < 0.6 ? easeOut((k - 0.5) / 0.1) : 1 - easeInOut((k - 0.6) / 0.4)) : 0;
  const flash = isA ? bump((k - 0.46) / 0.26) : 0;
  const raise = isC ? (k < 0.82 ? easeOut(k / 0.35) : 1 - easeOut((k - 0.82) / 0.18)) : 0;
  const glow = isC ? clamp01(k / 0.6) * (k < 0.85 ? 1 : 1 - (k - 0.85) / 0.15) : 0;
  const cflash = isC ? bump((k - 0.52) / 0.3) : 0;
  const hurt = anim === 'hurt';
  const recoil = hurt ? easeOut(tt / 0.15) : 0;
  const wobble = hurt ? -9 * recoil + Math.sin(tt * 13) * 3.5 : 0;
  const fk = anim === 'dead' ? clamp01(tt / 0.6) : 0;
  const fall = fk * fk;
  const opacity = anim === 'dead' ? 1 - 0.65 * fk : 1;
  let bob = 0;
  let lean = 0;
  if (anim === 'idle') bob = breathe * 0.9;
  else if (walking) {
    bob = -Math.abs(Math.sin(wph)) * 2.6 + 1;
    lean = 6;
  } else if (isA) {
    bob = charge * 1.2;
    lean = -6 * charge + 9 * strike;
  } else if (isC) {
    bob = -raise * 1.5;
    lean = -5 * raise;
  } else if (hurt) bob = 1.5;
  return { anim, t: tt, k, breathe, walking, wph, bob, lean, charge, strike, flash, raise, glow, cflash, hurt, wobble, fall, opacity };
}

// ------------------------------------------------------------------ skeleton helpers

/** angle convention: degrees, 0 = straight down, 90 = forward (+x), 180 = up, -90 = back */
export function dirPt(x: number, y: number, ang: number, len: number): [number, number] {
  const a = ang * D2R;
  return [x + Math.sin(a) * len, y + Math.cos(a) * len];
}

export interface ArmPts {
  sx: number;
  sy: number;
  ex: number;
  ey: number;
  hx: number;
  hy: number;
}
export function arm(sx: number, sy: number, a1: number, a2: number, l1: number, l2: number): ArmPts {
  const [ex, ey] = dirPt(sx, sy, a1, l1);
  const [hx, hy] = dirPt(ex, ey, a2, l2);
  return { sx, sy, ex, ey, hx, hy };
}

/** 2-bone IK, knee bends forward (+x) */
export function knee(hx: number, hy: number, fx: number, fy: number, l1: number, l2: number): [number, number] {
  const dx = fx - hx;
  const dy = fy - hy;
  let d = Math.hypot(dx, dy) || 0.001;
  d = Math.min(d, l1 + l2 - 0.01);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / d;
  const uy = dy / d;
  const px = hx + a * ux;
  const py = hy + a * uy;
  // perpendicular that points forward for a downward leg
  return [px + uy * h, py - ux * h];
}

/** foot target for a walk cycle */
export function foot(hipX: number, phase: number, stride: number, lift: number): [number, number] {
  return [hipX + Math.sin(phase) * stride, -Math.max(0, Math.cos(phase)) * lift];
}

// ------------------------------------------------------------------ primitives

/** outlined thick stroke (limb / staff / tail). Outline is drawn first then fill so joints merge. */
export function Limb({ p, w, c, ol = OL, ow = 3 }: { p: [number, number][]; w: number; c: string; ol?: string; ow?: number }) {
  const s = pts(p);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={s} stroke={ol} strokeWidth={w + ow} />
      <polyline points={s} stroke={c} strokeWidth={w} />
    </g>
  );
}

/** union of circles with a single merged outline (hair, beards, fur, smoke) */
export function Blob({ c, fill, ow = 3, shade }: { c: [number, number, number][]; fill: string; ow?: number; shade?: string }) {
  return (
    <g>
      {c.map(([x, y, r], i) => (
        <circle key={`o${i}`} cx={r2(x)} cy={r2(y)} r={r2(r)} fill={OL} stroke={OL} strokeWidth={ow} />
      ))}
      {c.map(([x, y, r], i) => (
        <circle key={`f${i}`} cx={r2(x)} cy={r2(y)} r={r2(r)} fill={fill} />
      ))}
      {shade
        ? c.map(([x, y, r], i) => <circle key={`s${i}`} cx={r2(x - r * 0.25)} cy={r2(y + r * 0.3)} r={r2(r * 0.6)} fill={shade} opacity={0.55} />)
        : null}
    </g>
  );
}

/** soft glow made of stacked translucent circles (no gradient ids needed) */
export function Glow({ x, y, r, c, o = 1 }: { x: number; y: number; r: number; c: string; o?: number }) {
  if (r <= 0.05 || o <= 0.01) return null;
  return (
    <g>
      <circle cx={r2(x)} cy={r2(y)} r={r2(r)} fill={c} opacity={r2(0.16 * o)} />
      <circle cx={r2(x)} cy={r2(y)} r={r2(r * 0.66)} fill={c} opacity={r2(0.26 * o)} />
      <circle cx={r2(x)} cy={r2(y)} r={r2(r * 0.36)} fill={c} opacity={r2(0.5 * o)} />
    </g>
  );
}

export function sparklePath(x: number, y: number, s: number) {
  const q = s * 0.18;
  return `M${r2(x)},${r2(y - s)} Q${r2(x + q)},${r2(y - q)} ${r2(x + s)},${r2(y)} Q${r2(x + q)},${r2(y + q)} ${r2(x)},${r2(y + s)} Q${r2(x - q)},${r2(y + q)} ${r2(x - s)},${r2(y)} Q${r2(x - q)},${r2(y - q)} ${r2(x)},${r2(y - s)}Z`;
}
export function Sparkle({ x, y, s, c = '#fff', o = 1 }: { x: number; y: number; s: number; c?: string; o?: number }) {
  if (s <= 0.05 || o <= 0.01) return null;
  return <path d={sparklePath(x, y, s)} fill={c} opacity={r2(o)} />;
}

export function Snowflake({ x, y, r, rot = 0, c = '#e8f7ff', o = 1 }: { x: number; y: number; r: number; rot?: number; c?: string; o?: number }) {
  if (r <= 0.05 || o <= 0.01) return null;
  const arms = [0, 60, 120].map((a) => a + rot);
  return (
    <g opacity={r2(o)} stroke={c} strokeWidth={r2(Math.max(0.6, r * 0.22))} strokeLinecap="round">
      {arms.map((a) => {
        const [x1, y1] = dirPt(x, y, a, r);
        const [x2, y2] = dirPt(x, y, a + 180, r);
        return <line key={a} x1={r2(x1)} y1={r2(y1)} x2={r2(x2)} y2={r2(y2)} />;
      })}
      <circle cx={r2(x)} cy={r2(y)} r={r2(r * 0.25)} fill={c} stroke="none" />
    </g>
  );
}

/** jagged polyline points between two points; seed changes flicker the bolt */
export function boltPts(x1: number, y1: number, x2: number, y2: number, seed: number, segs = 6, jit = 4): [number, number][] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  const out: [number, number][] = [[x1, y1]];
  for (let i = 1; i < segs; i++) {
    const f = i / segs;
    const o = (hash(seed * 7.1 + i * 3.3) - 0.5) * 2 * jit * Math.sin(Math.PI * f);
    out.push([x1 + dx * f + nx * o, y1 + dy * f + ny * o]);
  }
  out.push([x2, y2]);
  return out;
}

export function Lightning({
  x1,
  y1,
  x2,
  y2,
  seed,
  jit = 4,
  segs = 6,
  w = 1.4,
  glow = '#6fd3ff',
  core = '#f2fdff',
  o = 1,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  seed: number;
  jit?: number;
  segs?: number;
  w?: number;
  glow?: string;
  core?: string;
  o?: number;
}) {
  if (o <= 0.01) return null;
  const s = pts(boltPts(x1, y1, x2, y2, seed, segs, jit));
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={r2(o)}>
      <polyline points={s} stroke={glow} strokeWidth={w * 3.5} opacity={0.35} />
      <polyline points={s} stroke={glow} strokeWidth={w * 1.8} />
      <polyline points={s} stroke={core} strokeWidth={w * 0.8} />
    </g>
  );
}

function starPath(x: number, y: number, r: number) {
  const p: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return `M${pts(p)}Z`;
}

/** three stars orbiting above the head */
export function Dizzy({ x, y, t }: { x: number; y: number; t: number }) {
  const stars = [0, 1, 2].map((i) => {
    const a = t * 5 + (i * TAU) / 3;
    const depth = Math.sin(a);
    return { i, sx: x + Math.cos(a) * 11, sy: y + depth * 3.5, s: 2.6 + depth * 0.7, depth };
  });
  stars.sort((a, b) => a.depth - b.depth);
  return (
    <g>
      <ellipse cx={x} cy={y} rx={11} ry={3.5} fill="none" stroke="#fff3b0" strokeWidth={0.6} opacity={0.35} />
      {stars.map((s) => (
        <path key={s.i} d={starPath(s.sx, s.sy, s.s)} fill="#ffe14d" stroke={OL} strokeWidth={0.8} strokeLinejoin="round" opacity={r2(0.75 + s.depth * 0.25)} />
      ))}
    </g>
  );
}

/** team-tinted ground ring + shadow */
export function Shadow({ team, rx = 16, fall = 0 }: { team: Team; rx?: number; fall?: number }) {
  const cx = -16 * fall;
  const R = rx + 14 * fall;
  return (
    <g>
      <ellipse cx={r2(cx)} cy={0} rx={r2(R)} ry={4.5} fill="#000" opacity={0.32} />
      <ellipse cx={r2(cx)} cy={0} rx={r2(R + 2.5)} ry={5.8} fill="none" stroke={TEAM_COLORS[team]} strokeWidth={1.4} opacity={0.85} />
    </g>
  );
}

/**
 * Wraps a hero body: ground shadow, hurt wobble + dizzy stars, death collapse + fade.
 * Children are drawn in local hero coords (feet at origin, facing right).
 */
export function Frame({ p, team, headY, rx = 16, children }: { p: Pose; team: Team; headY: number; rx?: number; children: ReactNode }) {
  let tr = '';
  if (p.anim === 'dead') tr = `translate(${r2(-3 * p.fall)},${r2(-5 * p.fall)}) rotate(${r2(-84 * p.fall)})`;
  else if (p.hurt) tr = `translate(-2,0) rotate(${r2(p.wobble)})`;
  return (
    <g opacity={r2(p.opacity)}>
      <Shadow team={team} rx={rx} fall={p.fall} />
      <g transform={tr || undefined}>
        {children}
        {p.hurt ? <Dizzy x={-2} y={headY - 5} t={p.t} /> : null}
      </g>
    </g>
  );
}

/** two legs with walk cycle. Returns [backLeg, frontLeg] elements so callers can layer them. */
export function legs(
  p: Pose,
  o: { hipY: number; hipX?: number; spread?: number; len?: number; stride?: number; lift?: number; w: number; c: string; cBack?: string; boot?: string; bootW?: number },
) {
  const hipX = o.hipX ?? 0;
  const spread = o.spread ?? 3;
  const len = o.len ?? -o.hipY;
  const stride = o.stride ?? 7;
  const lift = o.lift ?? 4;
  const l1 = len * 0.52;
  const l2 = len * 0.52;
  const mk = (side: number) => {
    const hx = hipX + side * spread * 0.5;
    const hy = o.hipY + p.bob;
    let fx: number;
    let fy: number;
    if (p.walking) [fx, fy] = foot(hx, p.wph + (side > 0 ? 0 : Math.PI), stride, lift);
    else {
      fx = hx + side * 1.5 + (p.anim === 'attack' ? side * 2 * p.charge : 0);
      fy = 0;
    }
    const [kx, ky] = knee(hx, hy, fx, fy, l1, l2);
    const col = side > 0 ? o.c : (o.cBack ?? o.c);
    return (
      <g>
        <Limb p={[[hx, hy], [kx, ky], [fx, fy - 1]]} w={o.w} c={col} />
        {o.boot ? (
          <path
            d={`M${r2(fx - 3)},${r2(fy - 4)} L${r2(fx + 2)},${r2(fy - 4)} Q${r2(fx + (o.bootW ?? 6))},${r2(fy - 3)} ${r2(fx + (o.bootW ?? 6))},${r2(fy)} L${r2(fx - 3.5)},${r2(fy)} Z`}
            fill={o.boot}
            stroke={OL}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        ) : null}
      </g>
    );
  };
  return [mk(-1), mk(1)] as const;
}

/** quick outlined path props */
export const olp = (fill: string, sw = 1.6) => ({ fill, stroke: OL, strokeWidth: sw, strokeLinejoin: 'round' as const });

/** a bow held vertically at grip (gx,gy), string pulled to drawX (absolute x). */
export function Bow({
  gx,
  gy,
  h,
  drawX,
  wood,
  woodDark,
  str = '#f4efe0',
  arrow,
  rot = 0,
}: {
  gx: number;
  gy: number;
  h: number;
  drawX: number;
  wood: string;
  woodDark: string;
  str?: string;
  arrow?: { color: string; tip: string } | null;
  rot?: number;
}) {
  const pull = clamp01((gx - drawX - 4) / 20);
  const tipX = gx - 5 - pull * 3;
  const half = h / 2 - pull * 1.5;
  const t1: [number, number] = [tipX, gy - half];
  const t2: [number, number] = [tipX, gy + half];
  const d = `M${r2(t1[0])},${r2(t1[1])} Q${r2(gx + 7)},${r2(gy - half * 0.55)} ${r2(gx)},${r2(gy)} Q${r2(gx + 7)},${r2(gy + half * 0.55)} ${r2(t2[0])},${r2(t2[1])}`;
  const sx = Math.min(drawX, tipX - 0.5);
  return (
    <g transform={rot ? `rotate(${r2(rot)},${r2(gx)},${r2(gy)})` : undefined}>
      <polyline points={pts([t1, [sx, gy], t2])} fill="none" stroke={str} strokeWidth={0.9} />
      {arrow ? (
        <g>
          <line x1={r2(sx - 2)} y1={r2(gy)} x2={r2(gx + 9)} y2={r2(gy)} stroke={OL} strokeWidth={2.6} strokeLinecap="round" />
          <line x1={r2(sx - 2)} y1={r2(gy)} x2={r2(gx + 9)} y2={r2(gy)} stroke={arrow.color} strokeWidth={1.2} strokeLinecap="round" />
          <path d={`M${r2(gx + 13)},${r2(gy)} L${r2(gx + 8)},${r2(gy - 2.4)} L${r2(gx + 8)},${r2(gy + 2.4)}Z`} {...olp(arrow.tip, 1)} />
          <path d={`M${r2(sx - 3)},${r2(gy)} l3,-2.5 l2,0 l-2,2.5 l2,2.5 l-2,0Z`} fill={arrow.tip} opacity={0.9} />
        </g>
      ) : null}
      <path d={d} fill="none" stroke={OL} strokeWidth={4.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={wood} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={woodDark} strokeWidth={0.9} strokeLinecap="round" opacity={0.6} transform="translate(-0.6,0)" />
    </g>
  );
}

/** rotating rune ring (cast circles) */
export function RuneRing({ x, y, r, rot, c, o = 1, ry = 1, ticks = 8 }: { x: number; y: number; r: number; rot: number; c: string; o?: number; ry?: number; ticks?: number }) {
  if (r <= 0.1 || o <= 0.01) return null;
  const marks = Array.from({ length: ticks }, (_, i) => rot + (i * 360) / ticks);
  return (
    <g opacity={r2(o)} transform={`translate(${r2(x)},${r2(y)}) scale(1,${r2(ry)})`}>
      <circle r={r2(r)} fill="none" stroke={c} strokeWidth={1.3} />
      <circle r={r2(r * 0.78)} fill="none" stroke={c} strokeWidth={0.7} strokeDasharray="2 2" />
      {marks.map((a, i) => {
        const [mx, my] = dirPt(0, 0, a, r * 0.89);
        return <path key={i} d={sparklePath(mx, my, r * 0.09)} fill={c} />;
      })}
    </g>
  );
}

/**
 * Aghanim's upgrade glyph: a small blue crown with a scepter gem, centered at the origin, ~14 units wide.
 * Pure SVG; `size` scales it (14 = default width), `glow` 0..1 adds a soft halo.
 */
export function AghanimCrown({ size = 14, glow = 0 }: { size?: number; glow?: number }) {
  const s = size / 14;
  return (
    <g transform={s !== 1 ? `scale(${r2(s)})` : undefined}>
      {glow > 0.01 ? <Glow x={0} y={0} r={10} c="#6fc3ff" o={glow} /> : null}
      <path d="M-7,4 L-7,-2 L-4,1 L-2,-5 L0,-1 L2,-5 L4,1 L7,-2 L7,4 Z" fill="#3d8fe0" stroke={OL} strokeWidth={1.3} strokeLinejoin="round" />
      <path d="M-7,4 L7,4 L7,6 L-7,6 Z" fill="#f2c14e" stroke={OL} strokeWidth={1.1} strokeLinejoin="round" />
      <path d="M-5.5,2 L-5.5,-0.5 L-4,1 Z M5.5,2 L5.5,-0.5 L4,1 Z" fill="#9fdcff" />
      <path d="M0,-4 L2.2,0.2 L0,4.2 L-2.2,0.2 Z" fill="#bfeaff" stroke={OL} strokeWidth={1} strokeLinejoin="round" />
      <path d="M0,-4 L2.2,0.2 L0,0.6 Z" fill="#ffffff" opacity={0.85} />
      <circle cx={-2} cy={-5.6} r={0.9} fill="#f2c14e" stroke={OL} strokeWidth={0.6} />
      <circle cx={2} cy={-5.6} r={0.9} fill="#f2c14e" stroke={OL} strokeWidth={0.6} />
    </g>
  );
}

/** flickering flame tongue standing on (x,y), height h, half-width w */
export function Flame({ x, y, h, w, t, seed = 0, o = 1, lean = 0 }: { x: number; y: number; h: number; w: number; t: number; seed?: number; o?: number; lean?: number }) {
  if (h <= 0.2 || o <= 0.01) return null;
  const hh = h * (0.85 + 0.15 * Math.sin(t * 17 + seed * 3.1));
  const sw = Math.sin(t * 11 + seed * 1.7) * w * 0.6 + lean;
  const d = (k: number) =>
    `M${r2(x - w * k)},${r2(y)} Q${r2(x - w * k * 1.1)},${r2(y - hh * k * 0.55)} ${r2(x + sw * k)},${r2(y - hh * k)} Q${r2(x + w * k * 1.1)},${r2(y - hh * k * 0.5)} ${r2(x + w * k)},${r2(y)} Q${r2(x)},${r2(y + w * k * 0.6)} ${r2(x - w * k)},${r2(y)}Z`;
  return (
    <g opacity={r2(o)}>
      <path d={d(1)} fill="#ff5a12" />
      <path d={d(0.68)} fill="#ff9a2e" />
      <path d={d(0.38)} fill="#ffe14d" />
    </g>
  );
}
