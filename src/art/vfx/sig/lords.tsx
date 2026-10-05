// Lord-granted spell VFX: charge_of_darkness (Spirit Breaker), sleight_of_fist (Ember Spirit).
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { VfxArt } from '../../types.ts';
import { bump, easeIn, easeOut, lerp } from '../../types.ts';
import { Glow, GlowPath, Ring, Slash, Sparks, TAU, dir, dist, envelope, f, pathOf, prog, rnd, seg, srnd } from './fxkit.tsx';

const CHEST = 40;

// ------------------------------------------------------------------ charge_of_darkness
/** bull silhouette at origin, facing +x, feet at y=0 */
const bullPath =
  'M-34 -8 Q-38 -30 -20 -38 Q0 -46 16 -40 Q22 -50 30 -52 Q28 -44 26 -40 Q36 -38 40 -30 L44 -22 Q40 -16 32 -18 Q28 -10 24 -6 L22 0 L14 0 L14 -10 Q0 -12 -14 -10 L-16 0 L-24 0 L-24 -8 Z';

export const ChargeOfDarkness: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = dir(from, to, team);
  const end: Vec = dist(from, to) < 1 ? { x: from.x + d.x * 300, y: from.y } : to;
  const run = seg(k, 0, 0.55);
  const e = easeIn(run) * 0.5 + run * 0.5;
  const head: Vec = { x: lerp(from.x, end.x, e), y: lerp(from.y, end.y, e) };
  const flip = d.x < 0 ? -1 : 1;
  const tilt = (Math.atan2(d.y, Math.abs(d.x) || 1e-3) * 180) / Math.PI * flip;
  const shadows: ReactNode[] = [];
  if (run < 1) {
    for (let i = 5; i >= 0; i--) {
      const ek = Math.max(0, e - i * 0.06);
      const p: Vec = { x: lerp(from.x, end.x, ek), y: lerp(from.y, end.y, ek) };
      shadows.push(
        <g key={i} transform={`translate(${f(p.x)},${f(p.y)}) scale(${flip},1) rotate(${f(tilt)})`} opacity={f((i === 0 ? 0.85 : 0.5 - i * 0.07) * Math.min(1, run * 8))}>
          <path d={bullPath} fill={i === 0 ? '#2a1a6a' : '#4a3aa8'} stroke={i === 0 ? '#9a8aff' : 'none'} strokeWidth={2} transform={`scale(${f(1.45 + i * 0.05)})`} />
        </g>,
      );
    }
  }
  // streaks behind the charging bull
  const streaks: ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const off = srnd(i, 301) * 30 - 30;
    const back = Math.max(0, e - 0.2 - rnd(i, 302) * 0.2);
    const a: Vec = { x: lerp(from.x, end.x, back), y: lerp(from.y, end.y, back) + off };
    const b: Vec = { x: head.x - d.x * 10, y: head.y + off };
    streaks.push(<path key={i} d={pathOf([a, b])} stroke={i % 2 ? '#6a5aff' : '#b8b0ff'} strokeWidth={f(i % 2 ? 4 : 2)} strokeOpacity={f(0.5 * (1 - seg(k, 0.5, 0.7)))} strokeLinecap="round" />);
  }
  const hit = seg(k, 0.52, 1);
  const tgt: Vec = { x: end.x, y: end.y - CHEST };
  const stars: ReactNode[] = [];
  if (hit > 0 && hit < 1) {
    for (let i = 0; i < 3; i++) {
      const a = t * 6 + (i * TAU) / 3;
      const sx = tgt.x + Math.cos(a) * 18;
      const sy = end.y - 88 + Math.sin(a) * 5;
      stars.push(<path key={i} d="M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5 Z" transform={`translate(${f(sx)},${f(sy)})`} fill="#fff6a8" opacity={f(envelope(hit, 0.1, 0.3))} />);
    }
  }
  return (
    <g>
      {run > 0 && run < 1 ? <ellipse cx={f(head.x)} cy={f(head.y)} rx={30} ry={8} fill="#1a0a40" opacity={0.35} /> : null}
      {streaks}
      {shadows}
      {run > 0 && run < 1 ? <Glow x={head.x + d.x * 30} y={head.y - 28} r={30} color="#7a6aff" opacity={0.7} /> : null}
      {hit > 0 && hit < 1 ? (
        <g>
          <Glow x={tgt.x} y={tgt.y} r={80} color="#6a5aff" opacity={1 - hit} core="#ffffff" />
          <ellipse cx={f(end.x)} cy={f(end.y)} rx={f(20 + easeOut(hit) * 110)} ry={f(7 + easeOut(hit) * 32)} fill="none" stroke="#b8b0ff" strokeWidth={f(8 * (1 - hit))} opacity={f(1 - hit)} />
          <Ring x={tgt.x} y={tgt.y} r={14 + easeOut(hit) * 60} color="#8a7aff" width={6 * (1 - hit)} opacity={1 - hit} />
          <Sparks x={tgt.x} y={tgt.y} n={16} seed={303} k={seg(hit, 0, 0.6)} reach={90} color="#e0dcff" width={3} />
          {stars}
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ sleight_of_fist
export const SleightOfFist: VfxArt = ({ t, duration, from, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 120;
  const cx = to.x;
  const cy = to.y;
  const env = envelope(k, 0.06, 0.25);
  const N = 6;
  const visits: ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const t0 = (i / N) * 0.8;
    const p = seg(k, t0, t0 + 0.22);
    if (p <= 0 || p >= 1) continue;
    const a = rnd(i, 311) * TAU;
    const rr = Math.sqrt(rnd(i, 312)) * R * 0.85;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr * 0.5;
    const side = rnd(i, 313) > 0.5 ? 1 : -1;
    visits.push(
      <g key={i}>
        {/* fiery afterimage of Ember Spirit */}
        <g transform={`translate(${f(x - side * 34)},${f(y)}) scale(${side},1)`} opacity={f(bump(p) * 0.7)}>
          <ellipse cx={0} cy={-34} rx={13} ry={26} fill="#ff6a1a" opacity={0.45} />
          <circle cx={2} cy={-66} r={9} fill="#ffb04a" opacity={0.6} />
          <path d="M6 -42 L40 -50" stroke="#fff0b0" strokeWidth={3} strokeLinecap="round" />
        </g>
        <Glow x={x} y={y - CHEST} r={45} color="#ff6a1a" opacity={bump(p)} core="#fff6d0" />
        <Slash x={x} y={y - CHEST} rot={side * (25 + rnd(i, 314) * 40) + (side < 0 ? 180 : 0)} L={95} w={10} p={easeOut(p * 1.5)} color="#ff7a1a" opacity={1 - easeIn(p)} bend={0.15} />
        <Sparks x={x} y={y - CHEST} n={8} seed={315 + i} k={p} reach={45} color="#ffd070" width={2} gravity={25} />
      </g>,
    );
  }
  const embers: ReactNode[] = [];
  for (let i = 0; i < 24; i++) {
    const ph = (rnd(i, 321) + t * (0.8 + rnd(i, 322) * 0.6)) % 1;
    const a = rnd(i, 323) * TAU;
    const rr = Math.sqrt(rnd(i, 324)) * R;
    embers.push(<circle key={i} cx={f(cx + Math.cos(a) * rr)} cy={f(cy + Math.sin(a) * rr * 0.5 - ph * 80)} r={f(1.3 + (1 - ph) * 1.5)} fill={i % 3 ? '#ffa040' : '#fff0a0'} opacity={f(env * bump(ph))} />);
  }
  // ember trail from the caster's launch point into the area
  const launch = 1 - seg(k, 0, 0.2);
  return (
    <g>
      <ellipse cx={f(cx)} cy={f(cy)} rx={f(R)} ry={f(R * 0.5)} fill="#ff5a10" opacity={f(env * 0.1)} />
      <ellipse cx={f(cx)} cy={f(cy)} rx={f(R)} ry={f(R * 0.5)} fill="none" stroke="#ff8a2a" strokeWidth={2} strokeOpacity={f(env * 0.5)} strokeDasharray="12 8" strokeDashoffset={f(-t * 60)} />
      {launch > 0 && dist(from, to) > 1 ? <GlowPath d={pathOf([{ x: from.x, y: from.y - CHEST }, { x: cx, y: cy - CHEST }])} color="#ff6a1a" core="#fff0c0" width={3 * launch} opacity={launch * 0.8} layers={2} /> : null}
      {embers}
      {visits}
    </g>
  );
};
