// Kit-A VFX: Slark (Dark Pact, Pounce, Shadow Dance), Phantom Assassin (Stifling Dagger, Phantom Strike, Blur).
// Pure t-driven, ARENA coordinates.
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { ProjectileArt, VfxArt, ZoneArt } from '../../types.ts';
import { bump, clamp01, easeIn, easeOut, lerp } from '../../types.ts';
import { Glow, GlowPath, Ring, Slash, Sparks, TAU, angleDeg, boltPoints, dir, dist, envelope, f, pathOf, polar, prog, rnd, seg, srnd } from '../sig/fxkit.tsx';

const CHEST = 40;

/** translucent hero-sized silhouette (afterimage) at feet (x,y) */
const Ghost = ({ x, y, color, opacity, lean = 0 }: { x: number; y: number; color: string; opacity: number; lean?: number }): ReactNode => {
  if (opacity <= 0.001) return null;
  return (
    <g transform={`translate(${f(x)},${f(y)}) skewX(${f(lean)})`} opacity={f(opacity)}>
      <ellipse cx={0} cy={-34} rx={15} ry={27} fill={color} />
      <circle cx={0} cy={-68} r={10} fill={color} />
      <path d="M-12 -40 Q-24 -30 -20 -16 M12 -40 Q24 -30 20 -16" stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" />
    </g>
  );
};

// ------------------------------------------------------------------ dark_pact (slark Q)
// cast: purge — dark tendrils contract into Slark and burst off
export const DarkPactVfx: VfxArt = ({ t, duration, from }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const cx = from.x;
  const cy = from.y - CHEST;
  const tend: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + srnd(i, 1101) * 0.3;
    const p = easeIn(seg(k, rnd(i, 1102) * 0.2, 0.7));
    if (p >= 1) continue;
    const r0 = lerp(70, 6, p);
    const pts: Vec[] = [];
    for (let s = 0; s <= 6; s++) {
      const q = s / 6;
      const rr = r0 + q * 30 * (1 - p);
      const aa = a + q * 0.8 + Math.sin(k * 10 + i) * 0.1;
      pts.push(polar(cx, cy, rr, aa));
    }
    tend.push(<GlowPath key={i} d={pathOf(pts)} color="#7b3fe0" core="#d8c0ff" width={3} opacity={1 - p * 0.5} layers={2} />);
  }
  const pop = seg(k, 0.6, 1);
  return (
    <g pointerEvents="none">
      <Glow x={cx} y={cy} r={45} color="#3a1a6a" opacity={0.8 * (1 - pop)} core="#b48aff" />
      {tend}
      <Ring x={cx} y={cy} r={10 + 50 * easeOut(pop)} color="#b48aff" width={4} opacity={bump(pop)} />
      <Sparks x={cx} y={cy} n={10} seed={1103} k={pop} reach={60} color="#e0d0ff" width={2} />
    </g>
  );
};

// zone: 1.5s charge on Slark's back, then rapid electric-dark pulses
export const DarkPactZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const R = Math.max(60, radius);
  const delay = Math.min(1.5, Math.max(0, duration - 0.2));
  const cy = y - CHEST;
  const out = duration > 0 ? clamp01((duration - t) / 0.25) : 1;
  if (out <= 0) return null;
  if (t < delay) {
    const c = t / Math.max(0.01, delay);
    const motes: ReactNode[] = [];
    for (let i = 0; i < 10; i++) {
      const ph = (t * 1.6 + rnd(i, 1111)) % 1;
      const a = rnd(i, 1112) * TAU + t;
      const p = polar(x, cy, lerp(R * 0.7, 8, easeIn(ph)), a);
      motes.push(<circle key={i} cx={f(p.x)} cy={f(cy + (p.y - cy) * 0.6)} r={f(2.5 + 2 * ph)} fill="#b48aff" opacity={f(bump(ph) * clamp01(t * 4))} />);
    }
    const pulse = 0.5 + 0.5 * Math.sin(t * (8 + c * 18));
    return (
      <g pointerEvents="none">
        <circle cx={f(x)} cy={f(y)} r={f(R * (1 - c * 0.15))} fill="none" stroke="#7b3fe0" strokeWidth={1.5} strokeOpacity={f(0.15 + 0.25 * c)} strokeDasharray="4 8" strokeDashoffset={f(-t * 40)} />
        {motes}
        <Glow x={x - 4} y={cy - 6} r={14 + c * 22 + pulse * 5} color="#4a1a8a" opacity={0.5 + 0.5 * c} core={c > 0.6 ? '#e8d8ff' : '#9a6ae0'} />
      </g>
    );
  }
  const pt = t - delay;
  const ph = (pt % 0.2) / 0.2;
  const n = Math.floor(pt / 0.2);
  const bolts: ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + rnd(n * 7 + i, 1113) * 0.9;
    const end = polar(x, y, R * (0.6 + 0.4 * rnd(n * 7 + i, 1114)), a);
    const b = { x: end.x, y: y + (end.y - y) * 0.6 - 10 };
    bolts.push(<GlowPath key={i} d={pathOf(boltPoints({ x, y: cy }, b, 6, 12, n * 13 + i))} color="#8a4aff" core="#f0e8ff" width={2} opacity={out * (1 - ph)} layers={2} />);
  }
  return (
    <g pointerEvents="none">
      <circle cx={f(x)} cy={f(y)} r={f(R * easeOut(ph))} fill="#2a0a4a" opacity={f(0.25 * (1 - ph) * out)} />
      <circle cx={f(x)} cy={f(y)} r={f(R * easeOut(ph))} fill="none" stroke="#b48aff" strokeWidth={f(5 * (1 - ph) + 1)} strokeOpacity={f(out * (1 - ph))} />
      {bolts}
      <Glow x={x} y={cy} r={40} color="#7b3fe0" opacity={out * (0.5 + 0.5 * (1 - ph))} core="#ffffff" />
    </g>
  );
};

// ------------------------------------------------------------------ pounce (slark W)
export const PounceVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const D = dist(from, to);
  const d = dir(from, to, team);
  const end: Vec = D < 1 ? { x: from.x + d.x * 120, y: from.y } : { x: to.x - d.x * 30, y: to.y - d.y * 30 };
  const H = 50 + Math.min(80, D * 0.2);
  const at = (q: number): Vec => ({ x: lerp(from.x, end.x, q), y: lerp(from.y, end.y, q) - CHEST - H * 4 * q * (1 - q) });
  const fly = easeOut(seg(k, 0, 0.35));
  const trail: Vec[] = [];
  for (let i = 0; i <= 14; i++) trail.push(at(Math.max(0, fly - i * 0.04)));
  const head = at(fly);
  const trailOp = 1 - seg(k, 0.3, 0.7);
  // leash ring around target
  const lk = seg(k, 0.3, 1);
  const lr = 58;
  const leash = envelope(lk, 0.15, 0.25);
  const links: ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + k * 1.5;
    const p = polar(to.x, to.y, lr * (0.8 + 0.2 * easeOut(seg(lk, 0, 0.3))), a);
    links.push(<ellipse key={i} cx={f(p.x)} cy={f(to.y + (p.y - to.y) * 0.45)} rx={5} ry={2.6} fill="none" stroke="#9af0ff" strokeWidth={1.8} transform={`rotate(${f((a * 180) / Math.PI + 90)},${f(p.x)},${f(to.y + (p.y - to.y) * 0.45)})`} />);
  }
  return (
    <g pointerEvents="none">
      <GlowPath d={pathOf(trail)} color="#3fb6c7" core="#e0ffff" width={5} opacity={trailOp} layers={2} />
      {fly < 1 ? <Glow x={head.x} y={head.y} r={22} color="#3fd0e0" core="#ffffff" /> : null}
      <Sparks x={to.x} y={to.y - CHEST} n={10} seed={1201} k={seg(k, 0.3, 0.7)} reach={55} color="#bff8ff" width={2} />
      {lk > 0 ? (
        <g opacity={f(leash)}>
          <ellipse cx={f(to.x)} cy={f(to.y)} rx={lr} ry={f(lr * 0.45)} fill="#1a5a6a" opacity={0.2} />
          {links}
          <line x1={f(to.x)} y1={f(to.y)} x2={f(to.x)} y2={f(to.y - CHEST)} stroke="#9af0ff" strokeWidth={2} strokeDasharray="4 3" opacity={0.7} />
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ shadow_dance (slark R)
export const ShadowDanceVfx: VfxArt = ({ t, duration, from }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const cx = from.x;
  const env = envelope(k, 0.12, 0.35);
  const puffs: ReactNode[] = [];
  for (let i = 0; i < 18; i++) {
    const ph = (k * 1.5 + rnd(i, 1301)) % 1;
    const a = rnd(i, 1302) * TAU + k * 3 * (i % 2 ? 1 : -1);
    const rr = 18 + rnd(i, 1303) * 20;
    const px = cx + Math.cos(a) * rr;
    const py = from.y - 10 - rnd(i, 1304) * 70 - ph * 20;
    const r = 12 + rnd(i, 1305) * 12 + ph * 8;
    puffs.push(<circle key={i} cx={f(px)} cy={f(py)} r={f(r)} fill={i % 3 ? '#140c26' : '#2a1f4a'} opacity={f(env * (0.55 + 0.3 * (1 - ph)))} />);
  }
  const rim: ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const ph = (k * 2 + i / 6) % 1;
    const a = (i / 6) * TAU + k * 4;
    const p = polar(cx, from.y - 40, 34 + ph * 10, a);
    rim.push(<circle key={i} cx={f(p.x)} cy={f(p.y - ph * 30)} r={2} fill="#9a8aff" opacity={f(env * (1 - ph))} />);
  }
  const eyes = env * (0.5 + 0.5 * Math.sin(k * 30) ** 2);
  return (
    <g pointerEvents="none">
      <ellipse cx={f(cx)} cy={f(from.y)} rx={50} ry={16} fill="#0a0614" opacity={f(0.5 * env)} />
      <Ring x={cx} y={from.y - 40} r={20 + 50 * easeOut(seg(k, 0, 0.3))} color="#6b5bd6" width={3} opacity={1 - seg(k, 0, 0.3)} />
      {puffs}
      {rim}
      <circle cx={f(cx - 5)} cy={f(from.y - 64)} r={2.2} fill="#8affff" opacity={f(eyes)} />
      <circle cx={f(cx + 5)} cy={f(from.y - 64)} r={2.2} fill="#8affff" opacity={f(eyes)} />
    </g>
  );
};

// ------------------------------------------------------------------ stifling_dagger (PA Q)
const Dagger = (): ReactNode => (
  <g>
    <path d="M-10 -3.5 L10 -2.5 L22 0 L10 2.5 L-10 3.5 Z" fill="#e8f2ff" stroke="#6a8ab0" strokeWidth={1} />
    <path d="M-8 0 L18 0" stroke="#ffffff" strokeWidth={1} />
    <rect x={-13} y={-6} width={3} height={12} rx={1} fill="#5a6a8a" />
    <rect x={-22} y={-2} width={9} height={4} rx={1.5} fill="#2a3448" />
  </g>
);

export const StiflingDaggerProjectile: ProjectileArt = ({ t }) => (
  <g>
    <path d="M-60 0 L-14 0" stroke="#9fd8ff" strokeWidth={8} strokeOpacity={0.15} strokeLinecap="round" />
    <path d="M-44 0 L-14 0" stroke="#d8f0ff" strokeWidth={2.5} strokeOpacity={0.6} strokeLinecap="round" />
    {[-1, 1].map((s) => (
      <line key={s} x1={-16} y1={s * 5} x2={f(-36 - 6 * Math.sin(t * 40 + s))} y2={s * 7} stroke="#bfe6ff" strokeWidth={1.2} strokeOpacity={0.6} />
    ))}
    <circle cx={14} cy={0} r={f(9 + Math.sin(t * 35) * 1.5)} fill="#9fd8ff" opacity={0.25} />
    <Dagger />
  </g>
);

export const StiflingDaggerVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = dir(from, to, team);
  const hx = from.x + d.x * 18;
  const hy = from.y - CHEST - 6 + d.y * 18;
  const whoosh = seg(k, 0, 0.6);
  const L = Math.min(dist(from, to), 220);
  const a = easeOut(whoosh) * L;
  const b = Math.max(0, a - 90);
  return (
    <g pointerEvents="none">
      <Glow x={hx} y={hy} r={26} color="#9fd8ff" opacity={bump(seg(k, 0, 0.4))} core="#ffffff" />
      <Sparks x={hx} y={hy} n={6} seed={1401} k={seg(k, 0, 0.5)} reach={30} color="#e0f4ff" width={1.5} arc={1.4} heading={Math.atan2(d.y, d.x)} />
      {whoosh > 0 && whoosh < 1 ? (
        <line x1={f(hx + d.x * b)} y1={f(hy + d.y * b)} x2={f(hx + d.x * a)} y2={f(hy + d.y * a)} stroke="#cfeaff" strokeWidth={2} strokeOpacity={f(1 - whoosh)} strokeLinecap="round" />
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ phantom_strike (PA W)
export const PhantomStrikeVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = dir(from, to, team);
  const self = dist(from, to) < 1;
  const end: Vec = self ? { x: from.x + d.x * 100, y: from.y } : { x: to.x - d.x * 45, y: to.y - d.y * 45 };
  const dissolve = seg(k, 0, 0.5);
  const motes: ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const p = easeOut(dissolve);
    const mx = from.x + srnd(i, 1501) * 14 + d.x * p * 30;
    const my = from.y - 10 - rnd(i, 1502) * 65 - p * 25;
    motes.push(<circle key={i} cx={f(mx)} cy={f(my)} r={f(2 + rnd(i, 1503) * 2)} fill="#c8b8ff" opacity={f(1 - dissolve)} />);
  }
  const streak = seg(k, 0, 0.3);
  const fade = 1 - seg(k, 0.25, 0.7);
  const s0 = { x: from.x, y: from.y - CHEST };
  const s1 = { x: lerp(from.x, end.x, easeOut(streak)), y: lerp(from.y, end.y, easeOut(streak)) - CHEST };
  const arrive = seg(k, 0.15, 0.8);
  const chev: ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const p = seg(k, 0.25 + i * 0.1, 0.75 + i * 0.1);
    if (p <= 0 || p >= 1) continue;
    const yy = end.y - 85 - easeOut(p) * 30;
    chev.push(<path key={i} d={`M${f(end.x - 9)} ${f(yy + 6)} L${f(end.x)} ${f(yy - 2)} L${f(end.x + 9)} ${f(yy + 6)}`} fill="none" stroke="#c8a8ff" strokeWidth={3} strokeOpacity={f(bump(p))} strokeLinecap="round" strokeLinejoin="round" />);
  }
  return (
    <g pointerEvents="none">
      <Ghost x={from.x} y={from.y} color="#7a5cff" opacity={0.45 * (1 - dissolve)} lean={-d.x * 10 * dissolve} />
      {motes}
      <GlowPath d={pathOf([s0, s1])} color="#7a5cff" core="#efe8ff" width={6} opacity={fade} layers={3} />
      <Ring x={end.x} y={end.y - CHEST} r={10 + 45 * easeOut(arrive)} color="#a88aff" width={4} opacity={1 - arrive} />
      <Glow x={end.x} y={end.y - CHEST} r={50} color="#7a5cff" opacity={bump(arrive)} core="#ffffff" />
      {!self ? <Slash x={to.x} y={to.y - CHEST} rot={angleDeg(d) - 20} L={70} w={9} p={easeOut(seg(k, 0.2, 0.45))} color="#9a7aff" opacity={1 - seg(k, 0.45, 0.9)} bend={0.2} /> : null}
      {chev}
    </g>
  );
};

// ------------------------------------------------------------------ blur (PA E, passive)
export const BlurVfx: VfxArt = ({ t, duration, from }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const env = envelope(k, 0.15, 0.45);
  const ghosts: ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const off = Math.sin(k * TAU * 1.5 + i * 2.1) * (14 + i * 8);
    ghosts.push(<Ghost key={i} x={from.x + off} y={from.y} color={i === 1 ? '#a8c0ee' : '#7a90c8'} opacity={env * (0.45 - i * 0.1)} lean={off * 0.4} />);
  }
  const mist: ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const ph = (k * 1.2 + rnd(i, 1601)) % 1;
    const mx = from.x + srnd(i, 1602) * 36 + ph * 10 * (i % 2 ? 1 : -1);
    const my = from.y - 8 - rnd(i, 1603) * 70 - ph * 12;
    mist.push(<circle key={i} cx={f(mx)} cy={f(my)} r={f(8 + ph * 10)} fill="#c8d8ff" opacity={f(env * 0.35 * (1 - ph))} />);
  }
  return (
    <g pointerEvents="none">
      {mist}
      {ghosts}
      <ellipse cx={f(from.x)} cy={f(from.y)} rx={f(30 + 10 * k)} ry={9} fill="#8fa7d6" opacity={f(0.25 * env)} />
    </g>
  );
};

