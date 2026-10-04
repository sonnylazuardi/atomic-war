// Kit-C VFX: jakiro — dual_breath (ice + fire cones), ice_path (ice line + frozen zone), liquid_fire.
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { ProjectileArt, VfxArt, ZoneArt } from '../../types.ts';
import { bump, clamp01, easeIn, easeOut, lerp } from '../../types.ts';
import { Glow, Ring, Sparks, TAU, angleDeg, envelope, f, prog, rnd, seg, srnd } from '../sig/fxkit.tsx';
import { CHEST, HAND, aim, flamePath, shardPath, twinkle } from './kit.tsx';
import { BreathCone, FIRE, ICE } from './dragon.tsx';

// ------------------------------------------------------------------ dual_breath
export const DualBreathVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = aim(from, to, team);
  const n: Vec = { x: -d.y, y: d.x };
  const L = 450;
  // two heads: ice from one side, fire from the other, fire trails the ice
  const iceMouth: Vec = { x: from.x + d.x * 18 + n.x * 12, y: from.y - CHEST - 10 + n.y * 12 };
  const fireMouth: Vec = { x: from.x + d.x * 18 - n.x * 12, y: from.y - CHEST - 10 - n.y * 12 };
  const iceReach = easeOut(seg(k, 0, 0.55));
  const iceFade = 1 - seg(k, 0.45, 0.85);
  const fireReach = easeOut(seg(k, 0.18, 0.75));
  const fireFade = 1 - seg(k, 0.7, 1);
  const deg = angleDeg(d);
  // frost crystals left on the ground where the ice passed
  const frost: ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const s = 0.15 + rnd(i, 161) * 0.85;
    if (s > iceReach) continue;
    const side = srnd(i, 162) * 70 * s;
    const gx = from.x + d.x * L * s + n.x * side;
    const gy = from.y + d.y * L * s + n.y * side;
    frost.push(<path key={i} d={shardPath(7, 14 + rnd(i, 163) * 8)} transform={`translate(${f(gx)},${f(gy)}) rotate(${f(srnd(i, 164) * 20)})`} fill="#dff6ff" stroke="#6ab8ff" strokeWidth={1} opacity={f(fireFade * 0.85)} />);
  }
  return (
    <g>
      {frost}
      <g transform={`translate(${f(iceMouth.x)},${f(iceMouth.y)}) rotate(${f(deg - 3)})`}>
        <BreathCone L={L} hw={70} reach={iceReach} fade={iceFade} t={t} seed={170} s={ICE} />
      </g>
      <g transform={`translate(${f(fireMouth.x)},${f(fireMouth.y)}) rotate(${f(deg + 3)})`}>
        <BreathCone L={L * 0.95} hw={70} reach={fireReach} fade={fireFade} t={t} seed={180} s={FIRE} />
      </g>
      <Glow x={iceMouth.x} y={iceMouth.y} r={26} color="#7ad0ff" opacity={bump(seg(k, 0, 0.45))} core="#ffffff" />
      <Glow x={fireMouth.x} y={fireMouth.y} r={26} color="#ff8a2a" opacity={bump(seg(k, 0.15, 0.6))} core="#fff4c0" />
    </g>
  );
};

/** twin ice/fire orbs riding the breath's line projectile */
export const DualBreathProjectile: ProjectileArt = ({ t }) => {
  const w = Math.sin(t * 20) * 3;
  return (
    <g>
      <circle cy={-9} r={16} fill="#7ad0ff" opacity={0.25} />
      <circle cy={9} r={16} fill="#ff7a1a" opacity={0.25} />
      <path d={`M6 -9 Q-16 ${f(-15 + w)} -34 -9 Q-16 ${f(-3 + w)} 6 -9Z`} fill="#bfeaff" opacity={0.8} />
      <path d={`M6 9 Q-16 ${f(3 - w)} -34 9 Q-16 ${f(15 - w)} 6 9Z`} fill="#ffb636" opacity={0.8} />
      <circle cy={-9} r={6} fill="#eaffff" />
      <circle cy={9} r={6} fill="#ffe08a" />
    </g>
  );
};

// ------------------------------------------------------------------ ice_path (cast: ice ridge races from jakiro to the target)
export const IcePathVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = aim(from, to, team);
  const n: Vec = { x: -d.y, y: d.x };
  const len = Math.max(60, Math.hypot(to.x - from.x, to.y - from.y));
  const grow = easeOut(seg(k, 0, 0.6));
  const fade = 1 - seg(k, 0.65, 1);
  const spikes: ReactNode[] = [];
  const N = Math.max(6, Math.min(22, Math.round(len / 22)));
  for (let i = 0; i < N; i++) {
    const s = (i + 0.5) / N;
    if (s > grow) continue;
    const age = clamp01((grow - s) / 0.25);
    const side = srnd(i, 191) * 12;
    const gx = from.x + d.x * len * s + n.x * side;
    const gy = from.y + d.y * len * s + n.y * side;
    const h = (20 + rnd(i, 192) * 20) * easeOut(age);
    spikes.push(<path key={i} d={shardPath(12, h)} transform={`translate(${f(gx)},${f(gy)}) rotate(${f(srnd(i, 193) * 18)})`} fill="#cdf3ff" stroke="#3a9ae0" strokeWidth={1.1} opacity={0.9} />);
  }
  const head: Vec = { x: from.x + d.x * len * grow, y: from.y + d.y * len * grow };
  return (
    <g opacity={f(fade)}>
      <line x1={f(from.x)} y1={f(from.y)} x2={f(head.x)} y2={f(head.y)} stroke="#7ad0ff" strokeWidth={22} strokeOpacity={0.18} strokeLinecap="round" />
      <line x1={f(from.x)} y1={f(from.y)} x2={f(head.x)} y2={f(head.y)} stroke="#eaffff" strokeWidth={3} strokeOpacity={0.7} strokeLinecap="round" />
      {spikes}
      <Glow x={head.x} y={head.y - 8} r={24} color="#9fe6ff" opacity={grow < 1 ? 1 : 0} core="#ffffff" />
      <Glow x={from.x} y={from.y - HAND} r={28} color="#9fe6ff" opacity={bump(seg(k, 0, 0.35))} />
    </g>
  );
};

/** telegraphed frost circle, then a glacier of ice spikes that holds enemies frozen */
export const IcePathZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const R = radius > 0 ? radius : 110;
  const te = Math.min(0.5, Math.max(duration, 0.2) * 0.4);
  if (t < te) {
    const p = clamp01(t / te);
    return (
      <g pointerEvents="none">
        <circle cx={f(x)} cy={f(y)} r={f(R)} fill="#7ad0ff" opacity={f(0.05 + 0.15 * p)} />
        <circle cx={f(x)} cy={f(y)} r={f(R)} fill="none" stroke="#bfeaff" strokeWidth={2} strokeDasharray="8 6" strokeDashoffset={f(t * 80)} opacity={f(0.4 + 0.6 * p)} />
        <circle cx={f(x)} cy={f(y)} r={f(R * (1 - p) + 6)} fill="none" stroke="#eaffff" strokeWidth={f(1 + 2.5 * p)} opacity={f(0.4 + 0.5 * p)} />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * TAU;
          return <line key={i} x1={f(x)} y1={f(y)} x2={f(x + Math.cos(a) * R * p)} y2={f(y + Math.sin(a) * R * p)} stroke="#dff6ff" strokeWidth={1.4} opacity={f(0.7 * p)} />;
        })}
      </g>
    );
  }
  const e = clamp01((t - te) / Math.max(duration - te, 0.2));
  const rise = easeOut(clamp01((t - te) / 0.15));
  const fade = 1 - seg(e, 0.75, 1);
  const spikes: { x: number; y: number; h: number; w: number; r: number; i: number }[] = [];
  for (let i = 0; i < 16; i++) {
    const a = rnd(i, 201) * TAU;
    const rr = Math.sqrt(rnd(i, 202)) * R * 0.88;
    spikes.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr, h: (30 + rnd(i, 203) * 30) * (1 - (rr / R) * 0.4), w: 12 + rnd(i, 204) * 9, r: srnd(i, 205) * 22, i });
  }
  spikes.sort((p, q) => p.y - q.y);
  const glints: ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const ph = (rnd(i, 206) + t * 1.5) % 1;
    const s = spikes[i * 2]!;
    glints.push(<path key={i} d={twinkle(4 + 3 * bump(ph))} transform={`translate(${f(s.x)},${f(s.y - s.h * rise * 0.8)})`} fill="#ffffff" opacity={f(bump(ph) * fade)} />);
  }
  const shatter = seg(e, 0.8, 1);
  return (
    <g pointerEvents="none" opacity={f(fade + shatter * 0.6 * (1 - shatter))}>
      <circle cx={f(x)} cy={f(y)} r={f(R)} fill="#bfeaff" opacity={0.16} />
      <circle cx={f(x)} cy={f(y)} r={f(R)} fill="none" stroke="#eaffff" strokeWidth={2.5} opacity={0.85} />
      <circle cx={f(x)} cy={f(y)} r={f(R * 0.7)} fill="none" stroke="#7ad0ff" strokeWidth={1.2} opacity={0.6} />
      {spikes.map((s) => (
        <g key={s.i} transform={`translate(${f(s.x)},${f(s.y)}) rotate(${f(s.r)})`}>
          <path d={shardPath(s.w, s.h * rise)} fill="#9fdcff" stroke="#2a7ac8" strokeWidth={1.2} opacity={0.92} />
          <path d={shardPath(s.w * 0.4, s.h * rise * 0.9)} fill="#f2ffff" opacity={0.85} />
        </g>
      ))}
      {glints}
      {rise < 1 ? <Ring x={x} y={y} r={R * (0.6 + rise * 0.5)} color="#eaffff" width={4 * (1 - rise)} opacity={1 - rise} /> : null}
      {shatter > 0 ? <Sparks x={x} y={y - 16} n={12} seed={207} k={shatter} reach={R * 0.9} color="#dff6ff" width={2.2} gravity={30} /> : null}
    </g>
  );
};

// ------------------------------------------------------------------ liquid_fire (lobbed glob splashes into a burning puddle)
export const LiquidFireVfx: VfxArt = ({ t, duration, from, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 100;
  const a: Vec = { x: from.x, y: from.y - CHEST - 6 };
  const b: Vec = { x: to.x, y: to.y - 20 };
  const far = Math.hypot(b.x - a.x, b.y - a.y) > 4;
  const fly = far ? seg(k, 0, 0.3) : 1;
  const lift = far ? 50 : 0;
  const head: Vec = { x: lerp(a.x, b.x, fly), y: lerp(a.y, b.y, fly) - Math.sin(Math.PI * fly) * lift };
  const hit = far ? seg(k, 0.3, 1) : k;
  const splash = easeOut(seg(hit, 0, 0.35));
  const fade = 1 - seg(hit, 0.6, 1);
  const flames: ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const ang = rnd(i, 211) * TAU;
    const rr = Math.sqrt(rnd(i, 212)) * R * 0.75 * splash;
    const fx = to.x + Math.cos(ang) * rr;
    const fy = to.y + Math.sin(ang) * rr * 0.45;
    const fl = 0.75 + 0.25 * Math.sin(t * 28 + i * 2);
    flames.push(<path key={i} d={flamePath(fx, fy, 9 + rnd(i, 213) * 6, (14 + rnd(i, 214) * 16) * fl * bump(seg(hit, 0.05, 1)), srnd(i, 215) * 4)} fill={i % 2 ? '#ff7a1a' : '#ffcf5a'} opacity={0.9} />);
  }
  const drops: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const p = seg(hit, 0, 0.5);
    if (p <= 0 || p >= 1) continue;
    const ang = -Math.PI / 2 + srnd(i, 216) * 1.4;
    const sp = 30 + rnd(i, 217) * 40;
    const dx = Math.cos(ang) * sp * p;
    const dy = Math.sin(ang) * sp * p + 90 * p * p;
    drops.push(<circle key={i} cx={f(to.x + dx)} cy={f(to.y - 20 + dy)} r={f(3 * (1 - p) + 1)} fill="#ffb636" />);
  }
  return (
    <g>
      {fly < 1 ? (
        <g>
          <circle cx={f(head.x)} cy={f(head.y)} r={11} fill="#ff6a00" opacity={0.3} />
          <circle cx={f(head.x)} cy={f(head.y)} r={6} fill="#ffb636" />
          <circle cx={f(head.x - 1.5)} cy={f(head.y - 1.5)} r={2.5} fill="#fff4c0" />
        </g>
      ) : null}
      {hit > 0 ? (
        <g opacity={f(fade)}>
          <ellipse cx={f(to.x)} cy={f(to.y)} rx={f(R * splash)} ry={f(R * 0.45 * splash)} fill="#c8320a" opacity={0.35} />
          <ellipse cx={f(to.x)} cy={f(to.y)} rx={f(R * 0.65 * splash)} ry={f(R * 0.28 * splash)} fill="#ff8a2a" opacity={0.45} />
          <ellipse cx={f(to.x)} cy={f(to.y)} rx={f(R * splash)} ry={f(R * 0.45 * splash)} fill="none" stroke="#ffcf5a" strokeWidth={2} opacity={0.7} />
          {flames}
          {drops}
          <Glow x={to.x} y={to.y - 16} r={38} color="#ff8a2a" opacity={bump(seg(hit, 0, 0.5))} core="#fff4c0" />
          {/* attack-speed-down chevrons */}
          <g transform={`translate(${f(to.x + 26)},${f(to.y - 70 + easeIn(seg(hit, 0.2, 1)) * 14)})`} opacity={f(bump(seg(hit, 0.15, 1)))}>
            <path d="M-6 -6 L0 0 L6 -6 M-6 0 L0 6 L6 0" fill="none" stroke="#ff7a1a" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      ) : null}
    </g>
  );
};
