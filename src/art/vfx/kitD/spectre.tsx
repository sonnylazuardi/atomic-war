// Kit-D VFX: spectre — spectral_dagger (shadow path + dagger projectile), desolate, dispersion, haunt.
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { ProjectileArt, VfxArt } from '../../types.ts';
import { bump, easeIn, easeOut, lerp } from '../../types.ts';
import { Glow, Ring, Slash, Sparks, TAU, angleDeg, f, pathOf, polar, prog, rnd, seg, srnd } from '../sig/fxkit.tsx';
import { CHEST, HAND, aim } from '../kitC/kit.tsx';
import { Ghost, daggerPath } from './kit.tsx';

const VIOLET = '#8a5cff';
const DEEP = '#2a1250';
const PALE = '#e4d8ff';

// ------------------------------------------------------------------ spectral_dagger (shadow path trailing the thrown dagger)
export const SpectralDaggerVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = aim(from, to, team);
  const n: Vec = { x: -d.y, y: d.x };
  const o: Vec = { x: from.x + d.x * 16, y: from.y - HAND };
  const L = 560;
  const head = easeOut(seg(k, 0, 0.7)) * L;
  const fade = 1 - seg(k, 0.55, 1);
  // ribbon path with gentle sway
  const pts: Vec[] = [];
  const pts2: Vec[] = [];
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * head;
    const sw = Math.sin(s * 0.03 + t * 6) * 6 * Math.min(1, s / 60);
    pts.push({ x: o.x + d.x * s + n.x * sw, y: o.y + d.y * s + n.y * sw });
    pts2.push({ x: o.x + d.x * s - n.x * sw * 0.6, y: o.y + d.y * s - n.y * sw * 0.6 });
  }
  const wisps: ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const s = rnd(i, 501) * head;
    const ph = (rnd(i, 502) + k * 2) % 1;
    const side = srnd(i, 503) * 18;
    wisps.push(<circle key={i} cx={f(o.x + d.x * s + n.x * side)} cy={f(o.y + d.y * s + n.y * side - ph * 18)} r={f(3 + ph * 5)} fill={VIOLET} opacity={f(bump(ph) * 0.45 * fade)} />);
  }
  const tip: Vec = { x: o.x + d.x * head, y: o.y + d.y * head };
  return (
    <g opacity={f(fade)}>
      <path d={pathOf(pts)} fill="none" stroke={DEEP} strokeWidth={26} strokeOpacity={0.35} strokeLinecap="round" />
      <path d={pathOf(pts)} fill="none" stroke={VIOLET} strokeWidth={12} strokeOpacity={0.35} strokeLinecap="round" />
      <path d={pathOf(pts2)} fill="none" stroke={PALE} strokeWidth={2} strokeOpacity={0.6} strokeLinecap="round" strokeDasharray="16 10" strokeDashoffset={f(-t * 200)} />
      {wisps}
      <Glow x={o.x} y={o.y} r={26} color={VIOLET} opacity={bump(seg(k, 0, 0.3))} core="#ffffff" />
      {k < 0.7 ? <Glow x={tip.x} y={tip.y} r={22} color={VIOLET} opacity={0.8} core={PALE} /> : null}
    </g>
  );
};

export const SpectralDaggerProjectile: ProjectileArt = ({ t }) => {
  const spin = (t * 1100) % 360;
  return (
    <g>
      <ellipse cx={-26} rx={40} ry={9} fill={VIOLET} opacity={0.25} />
      <ellipse cx={-12} rx={20} ry={5} fill={PALE} opacity={0.35} />
      <circle r={14} fill={DEEP} opacity={0.35} />
      <g transform={`rotate(${f(spin)})`}>
        <path d={daggerPath(16, 6)} fill={PALE} stroke={VIOLET} strokeWidth={1.2} />
        <path d={daggerPath(16, 6)} fill={PALE} stroke={VIOLET} strokeWidth={1.2} transform="rotate(180)" />
        <rect x={-3} y={-5} width={6} height={10} rx={1.5} fill="#4a2a8a" />
      </g>
      <circle r={3} fill="#ffffff" />
    </g>
  );
};

// ------------------------------------------------------------------ desolate (pure-damage proc: violet rend)
export const DesolateVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = aim(from, to, team);
  const hx = to.x;
  const hy = to.y - CHEST;
  const fade = 1 - seg(k, 0.4, 1);
  const shards: ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.atan2(d.y, d.x) + srnd(i, 511) * 1.3;
    const p = easeOut(seg(k, 0.1, 0.9));
    const pt = polar(hx, hy, 8 + p * (24 + rnd(i, 512) * 18), a);
    shards.push(<path key={i} d="M0 -4 L2 0 L0 4 L-2 0Z" fill={PALE} transform={`translate(${f(pt.x)},${f(pt.y)}) rotate(${f((a * 180) / Math.PI)})`} opacity={f(1 - p)} />);
  }
  return (
    <g>
      <Glow x={hx} y={hy} r={28} color={DEEP} opacity={fade} />
      <Slash x={hx} y={hy} rot={angleDeg(d) + 90} L={44} w={9} p={easeOut(seg(k, 0, 0.3))} color={VIOLET} opacity={fade} bend={0.3} />
      <Ring x={hx} y={hy} r={6 + easeOut(k) * 22} color={VIOLET} width={2 * fade} opacity={fade} />
      {shards}
    </g>
  );
};

// ------------------------------------------------------------------ dispersion (reflected damage ripples outward as mirror shards)
export const DispersionVfx: VfxArt = ({ t, duration, from }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = 180;
  const cx = from.x;
  const cy = from.y - 30;
  const w = easeOut(k);
  const fade = 1 - seg(k, 0.35, 1);
  const shards: ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + srnd(i, 521) * 0.15;
    const p = polar(cx, cy, 16 + w * (R - 16) * (0.8 + rnd(i, 522) * 0.2), a);
    const deg = (a * 180) / Math.PI;
    shards.push(<path key={i} d="M6 0 L-3 -3.5 L-5 0 L-3 3.5Z" fill={PALE} stroke={VIOLET} strokeWidth={0.8} transform={`translate(${f(p.x)},${f(p.y)}) rotate(${f(deg)})`} opacity={f(fade)} />);
  }
  return (
    <g>
      <ellipse cx={f(from.x)} cy={f(from.y - 36)} rx={22} ry={38} fill="none" stroke={VIOLET} strokeWidth={2} strokeOpacity={f(bump(seg(k, 0, 0.5)) * 0.8)} />
      <Ring x={cx} y={cy} r={16 + w * (R - 16)} color={VIOLET} width={2.5 * fade} opacity={fade * 0.8} />
      <Ring x={cx} y={cy} r={10 + w * (R - 16) * 0.7} color={PALE} width={1.2 * fade} opacity={fade * 0.5} dash="6 6" />
      {shards}
    </g>
  );
};

// ------------------------------------------------------------------ haunt (an apparition rises from the shadows beside the target)
export const HauntVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const self = Math.hypot(to.x - from.x, to.y - from.y) < 4;
  const side = team === 'left' ? 1 : -1;
  const pool: Vec = self ? { x: from.x, y: from.y } : { x: to.x - side * 26, y: to.y + 4 };
  const rise = easeOut(seg(k, 0.1, 0.5));
  const fade = 1 - seg(k, 0.75, 1);
  const lunge = easeIn(seg(k, 0.55, 0.8));
  const gx = lerp(pool.x, to.x, lunge * 0.6);
  const gy = pool.y - rise * 14;
  const wob = Math.sin(t * 9) * 6;
  const tendrils: ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + t * 1.5;
    const p = polar(pool.x, pool.y, 22 * easeOut(seg(k, 0, 0.3)), a);
    tendrils.push(<path key={i} d={`M${f(pool.x)} ${f(pool.y)} Q${f((pool.x + p.x) / 2 + srnd(i, 531) * 6)} ${f(p.y - 8)} ${f(p.x)} ${f(p.y)}`} stroke={DEEP} strokeWidth={3} fill="none" opacity={f(0.7 * fade)} strokeLinecap="round" />);
  }
  return (
    <g>
      {!self ? (
        <g>
          <ellipse cx={f(pool.x)} cy={f(pool.y)} rx={f(28 * easeOut(seg(k, 0, 0.3)))} ry={f(9 * easeOut(seg(k, 0, 0.3)))} fill={DEEP} opacity={f(0.75 * fade)} />
          {tendrils}
          <Ghost x={gx} y={gy} w={26} h={56 * rise + 4} wob={wob} color={VIOLET} core={PALE} opacity={rise * fade * 0.9} />
          <Sparks x={to.x} y={to.y - CHEST} n={7} seed={532} k={seg(k, 0.75, 1)} reach={30} color={PALE} width={1.6} />
        </g>
      ) : null}
      <Glow x={from.x} y={from.y - CHEST} r={50} color={VIOLET} opacity={bump(seg(k, 0, 0.4)) * 0.8} core="#ffffff" />
      <Ring x={from.x} y={from.y} r={20 + easeOut(seg(k, 0, 0.6)) * 120} color={VIOLET} width={3 * (1 - seg(k, 0, 0.6))} opacity={1 - seg(k, 0, 0.6)} dash="10 6" />
    </g>
  );
};
