// Kit-C VFX: windranger — shackleshot, powershot (cast burst + glowing arrow projectile), windrun.
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { ProjectileArt, VfxArt } from '../../types.ts';
import { bump, easeIn, easeOut, lerp } from '../../types.ts';
import { Glow, GlowPath, Ring, Sparks, TAU, angleDeg, envelope, f, pathOf, polar, prog, rnd, seg, srnd } from '../sig/fxkit.tsx';
import { Arrow, CHEST, HAND, HEAD, StunStars, aim } from './kit.tsx';

// ------------------------------------------------------------------ shackleshot
export const ShackleshotVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const a: Vec = { x: from.x, y: from.y - HAND };
  const b: Vec = { x: to.x, y: to.y - CHEST };
  const d = aim(a, b, team);
  const far = Math.hypot(b.x - a.x, b.y - a.y) > 4;
  const fly = far ? easeIn(seg(k, 0, 0.28)) * 0.3 + seg(k, 0, 0.28) * 0.7 : 1;
  const head: Vec = { x: lerp(a.x, b.x, fly), y: lerp(a.y, b.y, fly) };
  const hit = seg(k, 0.26, 1);
  const env = 1 - seg(k, 0.75, 1);
  // rope trails behind the arrow while flying
  const ropeTail: Vec = { x: lerp(a.x, b.x, Math.max(0, fly - 0.45)), y: lerp(a.y, b.y, Math.max(0, fly - 0.45)) };
  // anchor: the shackle pulls taut past the target along the shot line
  const pull = easeOut(seg(hit, 0, 0.3));
  const anchor: Vec = { x: b.x + d.x * 80 * pull, y: b.y + d.y * 80 * pull };
  const coils: ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const c = easeOut(seg(hit, i * 0.08, 0.3 + i * 0.08));
    if (c <= 0) continue;
    const cy = b.y - 10 + i * 12;
    const rx = lerp(30, 15, c);
    coils.push(<ellipse key={i} cx={f(b.x)} cy={f(cy)} rx={f(rx)} ry={f(rx * 0.32)} fill="none" stroke="#d9c27a" strokeWidth={3} strokeDasharray="5 2" opacity={f(c)} transform={`rotate(${f(srnd(i, 221) * 10)} ${f(b.x)} ${f(cy)})`} />);
  }
  const links: ReactNode[] = [];
  if (hit > 0) {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const s = (i + 0.5) / n;
      const p: Vec = { x: lerp(b.x, anchor.x, s), y: lerp(b.y, anchor.y, s) };
      links.push(<ellipse key={i} cx={f(p.x)} cy={f(p.y)} rx={5} ry={2.6} fill="none" stroke="#f2e2a8" strokeWidth={1.6} transform={`rotate(${f(angleDeg(d) + (i % 2 ? 90 : 0))} ${f(p.x)} ${f(p.y)})`} />);
    }
  }
  return (
    <g opacity={f(env)}>
      {hit <= 0 && far ? (
        <g>
          <path d={pathOf([ropeTail, head])} fill="none" stroke="#c8a85a" strokeWidth={2} strokeDasharray="4 3" />
          <Arrow x={head.x} y={head.y} rot={angleDeg(d)} color="#f2e2a8" glow="#d9c27a" len={22} />
        </g>
      ) : null}
      {hit > 0 ? (
        <g>
          <Glow x={b.x} y={b.y} r={36} color="#d9c27a" opacity={(1 - seg(hit, 0, 0.5)) * 0.9} core="#ffffff" />
          <path d={pathOf([b, anchor])} stroke="#8a6a2a" strokeWidth={4} strokeOpacity={0.5} />
          {links}
          {coils}
          <g transform={`translate(${f(anchor.x)},${f(anchor.y)}) rotate(${f(angleDeg(d))})`} opacity={f(pull)}>
            <path d="M8 0 L-4 -6 L-2 0 L-4 6 Z" fill="#ffffff" stroke="#d9c27a" strokeWidth={1.2} />
          </g>
          <Sparks x={b.x} y={b.y} n={8} seed={222} k={seg(hit, 0, 0.5)} reach={34} color="#fff0b0" width={2} />
          <StunStars x={to.x} y={to.y - HEAD - 12} t={t} opacity={seg(hit, 0.1, 0.3)} color="#f2e2a8" />
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ powershot (charge release + wind wake along the line)
export const PowershotVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = aim(from, to, team);
  const n: Vec = { x: -d.y, y: d.x };
  const o: Vec = { x: from.x + d.x * 20, y: from.y - HAND };
  const L = 750;
  const deg = angleDeg(d);
  const release = bump(seg(k, 0, 0.25));
  const wake = seg(k, 0, 0.75);
  const reach = easeOut(wake) * L;
  const fade = 1 - seg(k, 0.55, 1);
  const streaks: ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const off = srnd(i, 231) * 34;
    const s0 = rnd(i, 232) * 0.3;
    const st: Vec = { x: o.x + d.x * reach * s0 + n.x * off, y: o.y + d.y * reach * s0 + n.y * off };
    const en: Vec = { x: o.x + d.x * reach * (0.55 + rnd(i, 233) * 0.45) + n.x * off * 0.4, y: o.y + d.y * reach * (0.55 + rnd(i, 233) * 0.45) + n.y * off * 0.4 };
    streaks.push(<line key={i} x1={f(st.x)} y1={f(st.y)} x2={f(en.x)} y2={f(en.y)} stroke={i % 2 ? '#e6ffd8' : '#9be36a'} strokeWidth={f(1.2 + rnd(i, 234) * 1.6)} strokeOpacity={0.7} strokeLinecap="round" />);
  }
  // shockwave crescents at the bow
  const cres: ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const p = seg(k, i * 0.07, 0.35 + i * 0.07);
    if (p <= 0 || p >= 1) continue;
    const r = 12 + easeOut(p) * 46;
    const c: Vec = { x: o.x + d.x * easeOut(p) * 50, y: o.y + d.y * easeOut(p) * 50 };
    const p0 = polar(c.x, c.y, r, Math.atan2(d.y, d.x) - 1.1);
    const p1 = polar(c.x, c.y, r, Math.atan2(d.y, d.x) + 1.1);
    cres.push(<path key={i} d={`M${f(p0.x)} ${f(p0.y)} A${f(r)} ${f(r)} 0 0 1 ${f(p1.x)} ${f(p1.y)}`} fill="none" stroke="#dfffd0" strokeWidth={f(4 * (1 - p))} opacity={f(1 - p)} strokeLinecap="round" />);
  }
  const leaves: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const s = rnd(i, 235);
    if (s * L > reach) continue;
    const off = srnd(i, 236) * 50;
    const drift = (k - s * 0.6) * 40;
    const x = o.x + d.x * s * L + n.x * (off + drift);
    const y = o.y + d.y * s * L + n.y * (off + drift);
    leaves.push(<ellipse key={i} cx={f(x)} cy={f(y)} rx={4} ry={1.8} fill="#7dd04a" transform={`rotate(${f(t * 400 + i * 50)} ${f(x)} ${f(y)})`} opacity={f(fade)} />);
  }
  const tip: Vec = { x: o.x + d.x * reach, y: o.y + d.y * reach };
  return (
    <g>
      <g opacity={f(fade)}>
        <GlowPath d={pathOf([o, tip])} color="#9be36a" core="#f4ffe8" width={3} opacity={0.55} layers={2} />
        {streaks}
        {leaves}
      </g>
      <Glow x={o.x} y={o.y} r={44} color="#b6ff8a" opacity={release} core="#ffffff" />
      {cres}
      <g transform={`translate(${f(o.x)},${f(o.y)}) rotate(${f(deg)})`} opacity={f(release)}>
        <path d="M-6 -26 Q10 0 -6 26" fill="none" stroke="#c8a85a" strokeWidth={3} />
        <path d="M-6 -26 L-6 26" stroke="#f4ffe8" strokeWidth={1} />
      </g>
    </g>
  );
};

/** glowing wind arrow (drawn at origin pointing +x) */
export const PowershotProjectile: ProjectileArt = ({ t }) => {
  const sp = t * 30;
  const swirl: ReactNode[] = [];
  for (let i = 0; i < 2; i++) {
    const pts: Vec[] = [];
    for (let j = 0; j <= 12; j++) {
      const x = -j * 7;
      const y = Math.sin(j * 0.9 + sp + i * Math.PI) * (4 + j * 0.9);
      pts.push({ x, y });
    }
    swirl.push(<path key={i} d={pathOf(pts)} fill="none" stroke={i ? '#e6ffd8' : '#7dd04a'} strokeWidth={2} strokeOpacity={0.75} strokeLinecap="round" />);
  }
  return (
    <g>
      <ellipse cx={-30} rx={56} ry={12} fill="#9be36a" opacity={0.2} />
      <ellipse cx={-14} rx={30} ry={6} fill="#dfffd0" opacity={0.45} />
      {swirl}
      <Arrow x={10} y={0} rot={0} color="#f4ffe8" glow="#9be36a" len={34} scale={1.25} />
      <circle cx={12} r={7} fill="#ffffff" opacity={0.5} />
    </g>
  );
};

// ------------------------------------------------------------------ windrun
export const WindrunVfx: VfxArt = ({ t, duration, from }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const env = envelope(k, 0.08, 0.35);
  const cx = from.x;
  const cy = from.y;
  // spiral ribbons
  const ribbons: ReactNode[] = [];
  for (let r = 0; r < 3; r++) {
    const pts: Vec[] = [];
    const base = r * (TAU / 3) + t * 9;
    for (let j = 0; j <= 14; j++) {
      const s = j / 14;
      const a = base + s * 3.2;
      const rad = 22 + s * 10;
      pts.push({ x: cx + Math.cos(a) * rad, y: cy - 8 - s * 66 + Math.sin(a) * rad * 0.3 });
    }
    ribbons.push(<GlowPath key={r} d={pathOf(pts)} color="#a8f0c0" core="#ffffff" width={2.2} opacity={env * 0.9} layers={1} />);
  }
  // ground gust ring = slow radius 200
  const gust = seg(k, 0, 0.7);
  const R = 30 + easeOut(gust) * 170;
  const leaves: ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const ph = (rnd(i, 241) + k * 1.3) % 1;
    const a = rnd(i, 242) * TAU + ph * 5;
    const rad = 20 + ph * 70;
    const x = cx + Math.cos(a) * rad;
    const y = cy - 20 - ph * 40 + Math.sin(a) * rad * 0.35;
    leaves.push(<ellipse key={i} cx={f(x)} cy={f(y)} rx={4.5} ry={2} fill={i % 3 ? '#7dd04a' : '#d8ff9a'} transform={`rotate(${f(t * 500 + i * 40)} ${f(x)} ${f(y)})`} opacity={f(bump(ph) * env)} />);
  }
  const lines: ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.4;
    const p0 = polar(cx, cy - CHEST, 34 + easeOut(gust) * 30, a);
    const p1 = polar(cx, cy - CHEST, 50 + easeOut(gust) * 50, a);
    lines.push(<line key={i} x1={f(p0.x)} y1={f(p0.y)} x2={f(p1.x)} y2={f(p1.y)} stroke="#e6fff0" strokeWidth={2} strokeLinecap="round" opacity={f((1 - gust) * 0.8)} />);
  }
  return (
    <g>
      {gust < 1 ? (
        <g>
          <ellipse cx={f(cx)} cy={f(cy)} rx={f(R)} ry={f(R * 0.36)} fill="#a8f0c0" opacity={f((1 - gust) * 0.12)} />
          <ellipse cx={f(cx)} cy={f(cy)} rx={f(R)} ry={f(R * 0.36)} fill="none" stroke="#a8f0c0" strokeWidth={f(3 * (1 - gust))} strokeDasharray="18 8" opacity={f(1 - gust)} />
        </g>
      ) : null}
      <Glow x={cx} y={cy - CHEST} r={50} color="#a8f0c0" opacity={env * 0.35} />
      {ribbons}
      {lines}
      {leaves}
      <Ring x={cx} y={cy - CHEST} r={20 + easeOut(seg(k, 0, 0.4)) * 30} color="#e6fff0" width={2.5 * (1 - seg(k, 0, 0.4))} opacity={1 - seg(k, 0, 0.4)} />
      <Sparks x={cx} y={cy - CHEST} n={8} seed={243} k={seg(k, 0, 0.45)} reach={60} color="#e6fff0" width={1.8} />
    </g>
  );
};
