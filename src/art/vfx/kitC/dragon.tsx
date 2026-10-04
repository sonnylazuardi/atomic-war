// Kit-C VFX: dragon knight — breathe_fire (cone + projectile front), dragon_tail, dragon_blood.
// Also exports the shared cone helper used by jakiro's dual_breath.
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { ProjectileArt, VfxArt } from '../../types.ts';
import { bump, clamp01, easeOut, lerp } from '../../types.ts';
import { Glow, Ring, Sparks, TAU, angleDeg, envelope, f, polar, prog, rnd, seg, srnd } from '../sig/fxkit.tsx';
import { CHEST, HEAD, StunStars, aim, flamePath, tonguePath } from './kit.tsx';

export interface ConeStyle {
  outer: string;
  mid: string;
  core: string;
  ember: string;
}
export const FIRE: ConeStyle = { outer: '#c8320a', mid: '#ff7a1a', core: '#ffe08a', ember: '#ffcf5a' };
export const ICE: ConeStyle = { outer: '#2a7ac8', mid: '#7ad0ff', core: '#eaffff', ember: '#cdf3ff' };

/**
 * Breath cone in LOCAL space (origin = mouth, +x = forward). `reach` 0..1 of `L`, `hw` = half width at
 * full length, `fade` 0..1 opacity, `seed` for deterministic flicker, `t` for flicker frames.
 */
export const BreathCone = ({ L, hw, reach, fade, t, seed, s }: { L: number; hw: number; reach: number; fade: number; t: number; seed: number; s: ConeStyle }): ReactNode => {
  if (reach <= 0 || fade <= 0) return null;
  const x = L * reach;
  const w = 6 + hw * reach;
  const fl = Math.floor(t * 24);
  const body = `M0 -5 Q${f(x * 0.55)} ${f(-w * 0.7)} ${f(x)} ${f(-w)} Q${f(x + w * 0.55)} 0 ${f(x)} ${f(w)} Q${f(x * 0.55)} ${f(w * 0.7)} 0 5Z`;
  const inner = `M0 -3 Q${f(x * 0.5)} ${f(-w * 0.38)} ${f(x * 0.92)} ${f(-w * 0.5)} Q${f(x * 0.92 + w * 0.3)} 0 ${f(x * 0.92)} ${f(w * 0.5)} Q${f(x * 0.5)} ${f(w * 0.38)} 0 3Z`;
  const tongues: ReactNode[] = [];
  for (let j = 0; j < 7; j++) {
    const yy = (j / 6 - 0.5) * w * 1.5;
    const base = x - 40 - rnd(j, seed + fl) * 30;
    const len = 34 + rnd(j, seed + fl + 3) * 30;
    tongues.push(<path key={j} d={tonguePath(len, 14, srnd(j, seed + fl + 5) * 6)} transform={`translate(${f(Math.max(0, base))},${f(yy)})`} fill={j % 2 ? s.mid : s.core} opacity={0.8} />);
  }
  const embers: ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    const p = (rnd(i, seed + 7) + t * 1.8) % 1;
    const ex = p * x;
    if (ex < 10) continue;
    const spread = (ex / L) * hw;
    const ey = srnd(i, seed + 8) * spread;
    embers.push(<circle key={i} cx={f(ex)} cy={f(ey)} r={f(1.4 + rnd(i, seed + 9) * 2.2)} fill={s.ember} opacity={f(bump(p))} />);
  }
  return (
    <g opacity={f(fade)}>
      <path d={body} fill={s.outer} opacity={0.28} transform="scale(1.06,1.25)" />
      <path d={body} fill={s.mid} opacity={0.55} />
      <path d={inner} fill={s.core} opacity={0.7} />
      {tongues}
      {embers}
    </g>
  );
};

// ------------------------------------------------------------------ breathe_fire
export const BreatheFireVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = aim(from, to, team);
  const mouth: Vec = { x: from.x + d.x * 20, y: from.y - CHEST - 6 };
  const reach = easeOut(seg(k, 0, 0.6));
  const fade = 1 - seg(k, 0.6, 1);
  const L = 420;
  // scorched ground streak along the path, lingering
  const scorch: ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const s = 0.15 + rnd(i, 121) * 0.85;
    if (s > reach) continue;
    const p: Vec = { x: from.x + d.x * L * s, y: from.y + d.y * L * s };
    const side = srnd(i, 122) * 60 * s;
    const fx = p.x - d.y * side;
    const fy = p.y + d.x * side;
    const age = clamp01((reach - s) / 0.4);
    const fl = 0.7 + 0.3 * Math.sin(t * 30 + i);
    scorch.push(<path key={i} d={flamePath(fx, fy, 10 + rnd(i, 123) * 6, (18 + rnd(i, 124) * 14) * fl, srnd(i, 125) * 4)} fill={i % 2 ? '#ff7a1a' : '#ffb636'} opacity={f((1 - age * 0.5) * fade * 0.85)} />);
  }
  return (
    <g>
      {scorch}
      <g transform={`translate(${f(mouth.x)},${f(mouth.y)}) rotate(${f(angleDeg(d))})`}>
        <BreathCone L={L} hw={75} reach={reach} fade={fade} t={t} seed={130} s={FIRE} />
      </g>
      <Glow x={mouth.x} y={mouth.y} r={34} color="#ff8a2a" opacity={bump(seg(k, 0, 0.5))} core="#fff4c0" />
    </g>
  );
};

/** fire-front puff riding the line projectile */
export const BreatheFireProjectile: ProjectileArt = ({ t }) => {
  const fl = Math.floor(t * 24);
  const out: ReactNode[] = [];
  for (let j = 0; j < 5; j++) {
    const y = (j - 2) * 10;
    out.push(<path key={j} d={tonguePath(-(26 + rnd(j, fl) * 20), 12, srnd(j, fl + 1) * 4)} transform={`translate(6,${y})`} fill={j % 2 ? '#ff7a1a' : '#ffcf5a'} opacity={0.75} />);
  }
  return (
    <g>
      <circle r={20} fill="#ff6a00" opacity={0.25} />
      {out}
      <circle r={9} fill="#ffe08a" opacity={0.9} />
    </g>
  );
};

// ------------------------------------------------------------------ dragon_tail (shield bash + stun)
export const DragonTailVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = aim(from, to, team);
  const hx = to.x;
  const hy = to.y - CHEST;
  const swing = easeOut(seg(k, 0, 0.3));
  const hit = seg(k, 0.25, 1);
  const base = angleDeg(d);
  // shield arcs in from the side
  const sa = ((base - 80 + swing * 80) * Math.PI) / 180;
  const sp = polar(hx, hy, lerp(42, 14, swing), sa + Math.PI);
  const shieldOp = 1 - seg(k, 0.4, 0.7);
  const arcPath = (() => {
    const r = 44;
    const a0 = ((base - 80) * Math.PI) / 180 + Math.PI;
    const a1 = sa + Math.PI;
    const p0 = polar(hx, hy, r, a0);
    const p1 = polar(hx, hy, r, a1);
    return `M${f(p0.x)} ${f(p0.y)} A${r} ${r} 0 0 1 ${f(p1.x)} ${f(p1.y)}`;
  })();
  return (
    <g>
      {swing < 1 || shieldOp > 0 ? <path d={arcPath} fill="none" stroke="#ffe08a" strokeWidth={6} strokeOpacity={f(0.5 * shieldOp)} strokeLinecap="round" /> : null}
      {shieldOp > 0 ? (
        <g transform={`translate(${f(sp.x)},${f(sp.y)}) rotate(${f(base)}) scale(1.6)`} opacity={f(shieldOp)}>
          <path d="M-6 -16 L8 -12 Q12 0 8 12 L-6 16 Q-10 0 -6 -16Z" fill="#8a5a2a" stroke="#ffcf5a" strokeWidth={2.4} />
          <circle cx={1} cy={0} r={4} fill="#ffcf5a" />
          <path d="M-2 -10 L4 -8 M-2 10 L4 8" stroke="#ffe8a8" strokeWidth={1.2} />
        </g>
      ) : null}
      {hit > 0 && hit < 1 ? (
        <g>
          <Glow x={hx} y={hy} r={54} color="#ffcf5a" opacity={1 - hit} core="#ffffff" />
          <Ring x={hx} y={hy} r={12 + easeOut(hit) * 52} color="#ffe08a" width={5 * (1 - hit)} opacity={1 - hit} />
          <Sparks x={hx} y={hy} n={12} seed={141} k={seg(hit, 0, 0.7)} reach={66} color="#fff0b0" width={2.6} />
          <ellipse cx={f(to.x)} cy={f(to.y)} rx={f(16 + easeOut(hit) * 24)} ry={f(5 + easeOut(hit) * 7)} fill="none" stroke="#c89a4a" strokeWidth={f(3 * (1 - hit))} opacity={f(1 - hit)} />
        </g>
      ) : null}
      <StunStars x={to.x} y={to.y - HEAD - 12} t={t} opacity={seg(k, 0.3, 0.45) * (1 - seg(k, 0.85, 1))} />
    </g>
  );
};

// ------------------------------------------------------------------ dragon_blood (scale shimmer + red regen)
export const DragonBloodVfx: VfxArt = ({ t, duration, from }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const env = envelope(k, 0.1, 0.4);
  const cx = from.x;
  const cy = from.y - CHEST;
  const scales: ReactNode[] = [];
  // hexagonal scale plates shimmering around the body
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + 0.3;
    const p = polar(cx, cy, 32, a);
    const sh = bump(seg(k, i * 0.04, 0.45 + i * 0.04));
    scales.push(
      <path
        key={i}
        d="M0 -7 L6 -3.5 L6 3.5 L0 7 L-6 3.5 L-6 -3.5Z"
        transform={`translate(${f(p.x)},${f(p.y * 1 - Math.sin(a) * 6)}) scale(${f(0.6 + 0.6 * sh)})`}
        fill="#7a1a10"
        stroke="#ffb07a"
        strokeWidth={1.2}
        opacity={f(env * (0.35 + 0.65 * sh))}
      />,
    );
  }
  const drops: ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const ph = (rnd(i, 151) * 0.5 + k) % 1;
    const x = cx + srnd(i, 152) * 26;
    const y = from.y - 6 - ph * 90;
    drops.push(<path key={i} d={`M${f(x)} ${f(y - 5)} Q${f(x + 3.4)} ${f(y + 1)} ${f(x)} ${f(y + 3)} Q${f(x - 3.4)} ${f(y + 1)} ${f(x)} ${f(y - 5)}Z`} fill={i % 3 ? '#ff4a3a' : '#ffb07a'} opacity={f(bump(ph) * env)} />);
  }
  const pulse = seg(k, 0, 0.6);
  return (
    <g>
      <Glow x={cx} y={cy} r={56} color="#d4452a" opacity={env * 0.55} />
      {pulse > 0 && pulse < 1 ? <ellipse cx={f(cx)} cy={f(from.y)} rx={f(20 + easeOut(pulse) * 40)} ry={f(7 + easeOut(pulse) * 14)} fill="none" stroke="#ff7a5a" strokeWidth={f(3 * (1 - pulse))} opacity={f(1 - pulse)} /> : null}
      {scales}
      {drops}
      <g transform={`translate(${f(cx)},${f(cy - 56 - bump(k) * 6)})`} opacity={f(env)}>
        <path d="M0 -11 L10 -6 L9 5 Q5 11 0 13 Q-5 11 -9 5 L-10 -6Z" fill="#8a1a10" stroke="#ffcf9a" strokeWidth={1.6} />
        <path d="M0 -5 Q4 0 0 6 Q-4 0 0 -5Z" fill="#ff6a4a" />
      </g>
    </g>
  );
};
