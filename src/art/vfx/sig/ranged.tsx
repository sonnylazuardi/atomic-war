// Signature VFX: medusa, drow ranger, sniper, crystal maiden, dazzle.
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { ProjectileArt, VfxArt, ZoneArt } from '../../types.ts';
import { bump, clamp01, easeIn, easeOut, lerp } from '../../types.ts';
import { Glow, GlowPath, Ring, Sparks, TAU, angleDeg, dir, dist, envelope, f, pathOf, polar, prog, rnd, seg, srnd } from './fxkit.tsx';

const CHEST = 40;
const HAND = 46;

const Arrow = ({ x, y, rot, color, glow, opacity = 1, len = 30 }: { x: number; y: number; rot: number; color: string; glow: string; opacity?: number; len?: number }): ReactNode => (
  <g transform={`translate(${f(x)},${f(y)}) rotate(${f(rot)})`} opacity={f(opacity)}>
    <path d={`M${-len * 2.2} 0 L0 0`} stroke={glow} strokeWidth={8} strokeOpacity={0.18} strokeLinecap="round" />
    <path d={`M${-len * 1.6} 0 L0 0`} stroke={glow} strokeWidth={3.5} strokeOpacity={0.45} strokeLinecap="round" />
    <path d={`M${-len} 0 L0 0`} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <path d="M6 0 L-5 -5 L-3 0 L-5 5 Z" fill="#ffffff" stroke={color} strokeWidth={1} />
    <path d={`M${-len} 0 l-5 -5 M${-len} 0 l-5 5`} stroke={color} strokeWidth={2} />
  </g>
);

// ------------------------------------------------------------------ split_shot
export const SplitShot: VfxArt = ({ t, duration, from, to, team, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = dir(from, to, team);
  const base = Math.atan2(d.y, d.x);
  const reach = Math.max(220, radius > 0 ? radius : 0, Math.min(400, dist(from, to)));
  const o: Vec = { x: from.x + d.x * 18, y: from.y - HAND };
  const arrows: ReactNode[] = [];
  const N = 4;
  for (let i = 0; i < N; i++) {
    const spread = (i / (N - 1) - 0.5) * 0.9;
    const a = base + spread;
    const p = seg(k, i * 0.04, 0.7 + i * 0.04);
    if (p <= 0 || p >= 1) continue;
    const r = easeOut(p) * reach;
    const pos = polar(o.x, o.y, r, a);
    arrows.push(<Arrow key={i} x={pos.x} y={pos.y} rot={(a * 180) / Math.PI} color="#7dff6a" glow="#2fd06a" opacity={1 - easeIn(seg(p, 0.6, 1))} />);
  }
  const muzzle = bump(seg(k, 0, 0.25));
  return (
    <g>
      <Glow x={o.x} y={o.y} r={30} color="#3ae07a" opacity={muzzle} core="#eaffea" />
      <path
        d={`M${f(o.x)} ${f(o.y)} L${f(polar(o.x, o.y, 70, base - 0.5).x)} ${f(polar(o.x, o.y, 70, base - 0.5).y)} A70 70 0 0 1 ${f(polar(o.x, o.y, 70, base + 0.5).x)} ${f(polar(o.x, o.y, 70, base + 0.5).y)} Z`}
        fill="#4af08a"
        opacity={f(muzzle * 0.18)}
      />
      {arrows}
    </g>
  );
};

// ------------------------------------------------------------------ marksmanship
export const Marksmanship: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const tgt: Vec = { x: to.x, y: to.y - CHEST };
  const d = dist(from, to) < 1 ? dir(from, { x: from.x + (team === 'left' ? 1 : -1), y: from.y }, team) : dir(from, to, team);
  const fly = easeIn(seg(k, 0, 0.25)) * 0.4 + seg(k, 0, 0.25) * 0.6;
  const start: Vec = { x: tgt.x - d.x * 130, y: tgt.y - d.y * 130 };
  const head: Vec = { x: lerp(start.x, tgt.x, fly), y: lerp(start.y, tgt.y, fly) };
  const hit = seg(k, 0.25, 1);
  const trailA = Math.max(0, fly - 0.6);
  const trail: Vec = { x: lerp(start.x, tgt.x, trailA), y: lerp(start.y, tgt.y, trailA) };
  const trailEnv = 1 - seg(k, 0.25, 0.6);
  const shards: ReactNode[] = [];
  if (hit > 0 && hit < 1) {
    for (let i = 0; i < 7; i++) {
      const a = rnd(i, 101) * TAU;
      const r = 10 + easeOut(hit) * (25 + rnd(i, 102) * 25);
      const p = polar(tgt.x, tgt.y, r, a);
      const s = 5 + rnd(i, 103) * 4;
      shards.push(
        <path key={i} d={`M0 ${-s} L${s * 0.4} 0 L0 ${s} L${-s * 0.4} 0 Z`} transform={`translate(${f(p.x)},${f(p.y)}) rotate(${f((a * 180) / Math.PI + 90)})`} fill="#dff6ff" stroke="#6ac8ff" strokeWidth={1} opacity={f(1 - hit)} />,
      );
    }
  }
  const star = bump(seg(k, 0.22, 0.6));
  return (
    <g>
      {trailEnv > 0 ? <GlowPath d={pathOf([trail, head])} color="#7ad0ff" core="#ffffff" width={3 * trailEnv} opacity={trailEnv} layers={2} /> : null}
      {hit <= 0 ? <Arrow x={head.x} y={head.y} rot={angleDeg(d)} color="#bfeaff" glow="#4ab8ff" len={24} /> : null}
      {hit > 0 ? (
        <g>
          <Glow x={tgt.x} y={tgt.y} r={45} color="#4ab8ff" opacity={1 - hit} core="#ffffff" />
          <Ring x={tgt.x} y={tgt.y} r={12 + easeOut(hit) * 40} color="#a8e4ff" width={4 * (1 - hit)} opacity={1 - hit} />
          {shards}
          <g transform={`translate(${f(tgt.x)},${f(tgt.y)}) rotate(${f(k * 90)}) scale(${f(star)})`}>
            <path d="M0 -30 L4 -4 L30 0 L4 4 L0 30 L-4 4 L-30 0 L-4 -4 Z" fill="#ffffff" opacity={0.9} />
            <path d="M0 -14 L2 -2 L14 0 L2 2 L0 14 L-2 2 L-14 0 L-2 -2 Z" fill="#bfeaff" transform="rotate(45)" />
          </g>
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ assassinate (reticle vfx + bullet projectile)
export const AssassinateReticle: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = dir(from, to, team);
  const tgt: Vec = dist(from, to) < 1 ? { x: from.x + d.x * 300, y: from.y - CHEST } : { x: to.x, y: to.y - CHEST };
  const close = easeOut(seg(k, 0, 0.7));
  const locked = k >= 0.7;
  const r = lerp(80, 24, close);
  const rot = lerp(-120, 0, close);
  const env = envelope(k, 0.08, 0.15);
  const col = locked ? (Math.floor(t * 20) % 2 ? '#ff2a2a' : '#ffffff') : '#ff4a3a';
  const laserOp = env * (0.25 + 0.35 * close);
  const o: Vec = { x: from.x + d.x * 20, y: from.y - HAND };
  const ticks: ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU;
    const p0 = polar(0, 0, r * 0.55, a);
    const p1 = polar(0, 0, r * 1.25, a);
    ticks.push(<line key={i} x1={f(p0.x)} y1={f(p0.y)} x2={f(p1.x)} y2={f(p1.y)} stroke={col} strokeWidth={2.5} strokeLinecap="round" />);
  }
  return (
    <g>
      <line x1={f(o.x)} y1={f(o.y)} x2={f(tgt.x)} y2={f(tgt.y)} stroke="#ff2a2a" strokeWidth={4} strokeOpacity={f(laserOp * 0.3)} />
      <line x1={f(o.x)} y1={f(o.y)} x2={f(tgt.x)} y2={f(tgt.y)} stroke="#ff5a4a" strokeWidth={1.2} strokeOpacity={f(laserOp)} strokeDasharray="6 4" strokeDashoffset={f(-t * 120)} />
      <g transform={`translate(${f(tgt.x)},${f(tgt.y)}) rotate(${f(rot)})`} opacity={f(env)}>
        <circle r={f(r)} fill="none" stroke={col} strokeWidth={8} strokeOpacity={0.15} />
        <circle r={f(r)} fill="none" stroke={col} strokeWidth={2.5} strokeDasharray={`${f(r * 0.9)} ${f(r * 0.67)}`} />
        <circle r={f(r * 0.45)} fill="none" stroke={col} strokeWidth={1.5} strokeOpacity={0.7} />
        {ticks}
        <circle r={3} fill={col} />
      </g>
      {locked ? <Glow x={tgt.x} y={tgt.y} r={40} color="#ff2a2a" opacity={bump(seg(k, 0.7, 1)) * 0.7} /> : null}
      <Glow x={o.x} y={o.y} r={8} color="#ff3a2a" opacity={env} core="#ffffff" />
    </g>
  );
};

export const AssassinateBullet: ProjectileArt = ({ t }) => {
  const fl = 0.8 + 0.2 * Math.sin(t * 80);
  return (
    <g>
      <defs>
        <linearGradient id="asn-tracer" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff8a2a" stopOpacity={0} />
          <stop offset="0.7" stopColor="#ffb04a" stopOpacity={0.5} />
          <stop offset="1" stopColor="#fff6d0" stopOpacity={1} />
        </linearGradient>
      </defs>
      <path d="M-140 0 L0 -4 L0 4 Z" fill="url(#asn-tracer)" opacity={f(fl * 0.6)} />
      <path d="M-90 0 L0 -2 L0 2 Z" fill="url(#asn-tracer)" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${-30 - i * 22} 0 m-3 -${6 + i * 2} a${6 + i * 2} ${6 + i * 2} 0 0 1 0 ${12 + i * 4}`} fill="none" stroke="#ffd080" strokeWidth={1.5} strokeOpacity={f(0.5 - i * 0.15)} />
      ))}
      <circle r={f(12 * fl)} fill="#ff8a2a" opacity={0.25} />
      <circle r={f(7 * fl)} fill="#ffb04a" opacity={0.5} />
      <path d="M-8 -3 L3 -3 Q9 0 3 3 L-8 3 Z" fill="#fff4d8" stroke="#ffcf6a" strokeWidth={1} />
    </g>
  );
};

// ------------------------------------------------------------------ freezing_field (cast + zone)
export const FreezingFieldCast: VfxArt = ({ t, duration, from, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 200;
  const p = easeOut(seg(k, 0, 0.7));
  const env = 1 - seg(k, 0.4, 1);
  const flakes: ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const pp = polar(from.x, from.y - CHEST, 26 * p + 6, a);
    flakes.push(<line key={i} x1={f(from.x)} y1={f(from.y - CHEST)} x2={f(pp.x)} y2={f(pp.y)} stroke="#e8f8ff" strokeWidth={3} strokeLinecap="round" />);
  }
  return (
    <g opacity={f(env)}>
      <ellipse cx={f(from.x)} cy={f(from.y)} rx={f(R * p)} ry={f(R * p * 0.55)} fill="#bfe8ff" opacity={0.18} />
      <ellipse cx={f(from.x)} cy={f(from.y)} rx={f(R * p)} ry={f(R * p * 0.55)} fill="none" stroke="#e0f6ff" strokeWidth={f(6 * (1 - p) + 1)} />
      <Glow x={from.x} y={from.y - CHEST} r={60} color="#7ad0ff" opacity={bump(k)} core="#ffffff" />
      <g transform={`rotate(${f(k * 60)},${f(from.x)},${f(from.y - CHEST)})`}>{flakes}</g>
      <Sparks x={from.x} y={from.y - CHEST} n={16} seed={111} k={seg(k, 0, 0.7)} reach={R * 0.6} color="#dff6ff" width={2.5} />
    </g>
  );
};

const IceBurst = ({ x, y, p, seed }: { x: number; y: number; p: number; seed: number }): ReactNode => {
  if (p <= 0 || p >= 1) return null;
  const spikes: ReactNode[] = [];
  const grow = easeOut(seg(p, 0, 0.3));
  const fade = 1 - seg(p, 0.45, 1);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + srnd(i, seed) * 1.1;
    const h = (22 + rnd(i, seed + 1) * 26) * grow;
    const tip = polar(x, y, h, a);
    const l = polar(x, y, 5, a - Math.PI / 2);
    const r = polar(x, y, 5, a + Math.PI / 2);
    spikes.push(<path key={i} d={`M${f(l.x)} ${f(l.y)} L${f(tip.x)} ${f(tip.y)} L${f(r.x)} ${f(r.y)} Z`} fill={i % 2 ? '#dff6ff' : '#9ad8ff'} stroke="#ffffff" strokeWidth={0.8} opacity={f(fade)} />);
  }
  return (
    <g>
      <ellipse cx={f(x)} cy={f(y)} rx={f(10 + easeOut(p) * 40)} ry={f(4 + easeOut(p) * 14)} fill="none" stroke="#e8f8ff" strokeWidth={f(4 * (1 - p))} opacity={f(1 - p)} />
      <Glow x={x} y={y - 12} r={44 * (1 - p * 0.5)} color="#7ad0ff" opacity={bump(seg(p, 0, 0.5))} core="#ffffff" />
      {spikes}
      <Sparks x={x} y={y - 10} n={8} seed={seed + 7} k={seg(p, 0, 0.8)} reach={50} color="#ffffff" width={2} arc={Math.PI * 1.2} heading={-Math.PI / 2} gravity={30} />
    </g>
  );
};

export const FreezingFieldZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const R = radius > 0 ? radius : 200;
  const env = Math.min(1, t / 0.35) * (duration > 0 ? clamp01((duration - t) / 0.5) : 1);
  if (env <= 0) return null;
  const sq = 0.55;
  const snow: ReactNode[] = [];
  for (let i = 0; i < 40; i++) {
    const a = rnd(i, 121) * TAU;
    const rr = Math.sqrt(rnd(i, 122)) * R;
    const fall = (rnd(i, 123) + t * (0.5 + rnd(i, 124) * 0.4)) % 1;
    const sx = x + Math.cos(a) * rr + Math.sin(t * 2 + i) * 6;
    const gy = y + Math.sin(a) * rr * sq;
    const sy = gy - 90 * (1 - fall);
    snow.push(<circle key={i} cx={f(sx)} cy={f(sy)} r={f(1.2 + rnd(i, 125) * 1.8)} fill="#ffffff" opacity={f(0.85 * bump(fall))} />);
  }
  // ice explosions at deterministic pseudo-random spots: one every `gap` seconds, each lives `life`
  const gap = 0.11;
  const life = 0.55;
  const bursts: ReactNode[] = [];
  const last = Math.floor(t / gap);
  const first = Math.max(0, Math.ceil((t - life) / gap));
  const stopAt = duration > 0 ? duration - 0.3 : Number.POSITIVE_INFINITY;
  for (let j = first; j <= last; j++) {
    const t0 = j * gap;
    if (t0 > stopAt) continue;
    const a = rnd(j, 131) * TAU;
    const rr = (0.25 + 0.75 * Math.sqrt(rnd(j, 132))) * R * 0.95;
    bursts.push(<IceBurst key={j} x={x + Math.cos(a) * rr} y={y + Math.sin(a) * rr * sq} p={(t - t0) / life} seed={j * 3 + 1} />);
  }
  return (
    <g opacity={f(env)}>
      <defs>
        <radialGradient id="ff-ground">
          <stop offset="0" stopColor="#e8f8ff" stopOpacity={0.45} />
          <stop offset="0.75" stopColor="#9ad8ff" stopOpacity={0.25} />
          <stop offset="1" stopColor="#6ab8ff" stopOpacity={0.05} />
        </radialGradient>
      </defs>
      <ellipse cx={f(x)} cy={f(y)} rx={f(R)} ry={f(R * sq)} fill="url(#ff-ground)" />
      <ellipse cx={f(x)} cy={f(y)} rx={f(R)} ry={f(R * sq)} fill="none" stroke="#e8f8ff" strokeWidth={2.5} strokeOpacity={0.7} strokeDasharray="18 8 4 8" strokeDashoffset={f(t * 25)} />
      <ellipse cx={f(x)} cy={f(y)} rx={f(R * 0.97)} ry={f(R * sq * 0.97)} fill="none" stroke="#7ad0ff" strokeWidth={8} strokeOpacity={0.15} />
      {snow}
      {bursts}
    </g>
  );
};

// ------------------------------------------------------------------ shallow_grave
export const ShallowGrave: VfxArt = ({ t, duration, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const env = Math.min(1, t / 0.25) * clamp01((duration - t) / Math.min(0.4, duration * 0.3 || 0.4));
  const cx = to.x;
  const cy = to.y;
  const R = 48;
  const rise = easeOut(seg(t, 0, 0.35));
  const runes: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + t * 0.8;
    const p = { x: cx + Math.cos(a) * R * 0.82, y: cy + Math.sin(a) * R * 0.82 * 0.38 };
    runes.push(<path key={i} d={`M${f(p.x - 3)} ${f(p.y - 3)} L${f(p.x + 3)} ${f(p.y + 3)} M${f(p.x + 3)} ${f(p.y - 3)} L${f(p.x)} ${f(p.y)}`} stroke="#e6b8ff" strokeWidth={1.6} strokeLinecap="round" />);
  }
  // skull wisp bobbing up from the grave
  const bob = Math.sin(t * 3.2) * 5;
  const skY = cy - 70 - rise * 25 + bob;
  const skX = cx + Math.sin(t * 1.7) * 10;
  const tailPts: Vec[] = [];
  for (let i = 0; i <= 6; i++) tailPts.push({ x: skX + Math.sin(t * 4 - i * 0.7) * (3 + i * 1.5), y: skY + 10 + i * 7 });
  return (
    <g opacity={f(env)}>
      {/* ground sigil */}
      <ellipse cx={f(cx)} cy={f(cy)} rx={f(R * 1.2)} ry={f(R * 0.48)} fill="#7a2cc8" opacity={0.18} />
      <ellipse cx={f(cx)} cy={f(cy)} rx={f(R)} ry={f(R * 0.38)} fill="none" stroke="#c48bff" strokeWidth={2.5} />
      <ellipse cx={f(cx)} cy={f(cy)} rx={f(R * 0.65)} ry={f(R * 0.25)} fill="none" stroke="#9b4dff" strokeWidth={1.5} strokeDasharray="5 4" strokeDashoffset={f(-t * 20)} />
      {runes}
      {/* tomb rising behind the unit */}
      <g transform={`translate(${f(cx)},${f(cy - 4)}) scale(1,${f(rise)})`}>
        <path d="M-18 0 L-18 -38 Q-18 -54 0 -54 Q18 -54 18 -38 L18 0 Z" fill="#3a1a5a" opacity={0.55} stroke="#d9a8ff" strokeWidth={2} />
        <path d="M0 -46 L0 -18 M-9 -36 L9 -36" stroke="#f0d8ff" strokeWidth={3} strokeLinecap="round" opacity={0.9} />
      </g>
      <Glow x={cx} y={cy - 30} r={50} color="#9b4dff" opacity={0.35 + 0.15 * Math.sin(t * 5)} />
      {/* skull wisp */}
      <GlowPath d={pathOf(tailPts)} color="#b07bff" core="#f0e2ff" width={4} opacity={0.6} layers={2} />
      <g transform={`translate(${f(skX)},${f(skY)})`}>
        <circle r={16} fill="#a259ff" opacity={0.25} />
        <path d="M-9 2 Q-10 -11 0 -11 Q10 -11 9 2 L6 4 L6 8 L-6 8 L-6 4 Z" fill="#efe2ff" stroke="#7a2cc8" strokeWidth={1.2} />
        <circle cx={-3.8} cy={-2} r={2.6} fill="#5a10a0" />
        <circle cx={3.8} cy={-2} r={2.6} fill="#5a10a0" />
        <path d="M-3 8 L-3 5 M0 8 L0 5 M3 8 L3 5" stroke="#7a2cc8" strokeWidth={1} />
      </g>
      <Sparks x={cx} y={cy - 10} n={10} seed={141} k={seg(k, 0, 0.25)} reach={60} color="#e6b8ff" width={2} arc={Math.PI} heading={-Math.PI / 2} />
    </g>
  );
};
