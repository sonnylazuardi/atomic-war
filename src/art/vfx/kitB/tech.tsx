// Kit-B VFX: Tinker (heat_seeking_missile, defense_matrix, rearm).
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { ProjectileArt, VfxArt } from '../../types.ts';
import { bump, easeOut, lerp } from '../../types.ts';
import { Glow, Ring, Sparks, TAU, dir, envelope, f, polar, prog, rnd, seg, srnd } from '../sig/fxkit.tsx';

const CHEST = 40;

// ------------------------------------------------------------------ heat_seeking_missile
const rocket = (key: string, x: number, y: number, rot: number, s: number, o: number, flick: number): ReactNode => (
  <g key={key} transform={`translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`} opacity={f(o)}>
    <path d={`M-9 -2.5 L${f(-18 - 8 * flick)} 0 L-9 2.5 Z`} fill="#ffb03a" />
    <path d={`M-9 -1.2 L${f(-14 - 4 * flick)} 0 L-9 1.2 Z`} fill="#fff3c0" />
    <rect x={-9} y={-3} width={14} height={6} rx={2} fill="#c9ced6" stroke="#4a4f5a" strokeWidth={0.8} />
    <path d="M5 -3 Q11 0 5 3 Z" fill="#e5484d" />
    <path d="M-9 -3 L-12 -6 L-6 -3 Z M-9 3 L-12 6 L-6 3 Z" fill="#e5484d" />
  </g>
);

export const HeatSeekingMissileVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = dir(from, to, team);
  const back: Vec = { x: from.x - d.x * 14, y: from.y - 58 };
  const out: ReactNode[] = [];
  // shoulder launcher flash
  out.push(<Glow key="hs-fl" x={back.x} y={back.y} r={28} color="#ff8a3a" opacity={1 - seg(k, 0, 0.4)} core="#fff3c0" />);
  // smoke puffs drifting up and back
  for (let i = 0; i < 9; i++) {
    const p = seg(k, rnd(i, 61) * 0.3, 0.6 + rnd(i, 62) * 0.4);
    if (p <= 0 || p >= 1) continue;
    const x = back.x + srnd(i, 63) * 18 - d.x * 26 * p;
    const y = back.y - 12 * p - rnd(i, 64) * 14 * p;
    out.push(<circle key={`hs-s${i}`} cx={f(x)} cy={f(y)} r={f(5 + 11 * easeOut(p))} fill={i % 2 ? '#8a8f99' : '#b8bcc4'} opacity={f(0.5 * (1 - p))} />);
  }
  // two rockets pop up out of the launcher before homing in
  for (let i = 0; i < 2; i++) {
    const p = seg(k, i * 0.12, 0.45 + i * 0.12);
    if (p <= 0 || p >= 1) continue;
    const side = i === 0 ? -1 : 1;
    const x = back.x + side * 14 * p + d.x * 30 * p * p;
    const y = back.y - 46 * easeOut(p);
    const rot = -90 + side * 20 + 90 * p * p * (d.x >= 0 ? 1 : -1);
    out.push(rocket(`hs-r${i}`, x, y, rot, 1.1, 1 - seg(p, 0.75, 1), Math.abs(Math.sin(t * 50 + i))));
  }
  out.push(<Sparks key="hs-sp" x={back.x} y={back.y} n={8} seed={66} k={seg(k, 0, 0.35)} reach={30} color="#ffd27a" width={2} arc={Math.PI} heading={-Math.PI / 2} />);
  return <g pointerEvents="none">{out}</g>;
};

export const HeatSeekingMissileProjectile: ProjectileArt = ({ t }) => {
  const flick = Math.abs(Math.sin(t * 47));
  const wob = Math.sin(t * 22) * 3;
  const puffs: ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const ph = (t * 3 + i / 5) % 1;
    puffs.push(<circle key={`hp-p${i}`} cx={f(-22 - ph * 34)} cy={f(Math.sin(t * 9 + i * 1.7) * 4 * ph)} r={f(3 + ph * 6)} fill="#a9aeb8" opacity={f(0.45 * (1 - ph))} />);
  }
  return (
    <g transform={`rotate(${f(wob)})`}>
      {puffs}
      <circle cx={-14} cy={0} r={f(7 + 2 * flick)} fill="#ff8a3a" opacity={0.35} />
      {rocket('hp-r', 0, 0, 0, 1.25, 1, flick)}
    </g>
  );
};

// ------------------------------------------------------------------ defense_matrix
const hexPath = (cx: number, cy: number, r: number): string => {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const p = polar(cx, cy, r, (i / 6) * TAU + Math.PI / 6);
    d += `${i === 0 ? 'M' : 'L'}${f(p.x)} ${f(p.y)} `;
  }
  return `${d}Z`;
};

export const DefenseMatrixVfx: VfxArt = ({ t, duration, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const c: Vec = { x: to.x, y: to.y - CHEST };
  const R = 48;
  const form = easeOut(seg(k, 0, 0.35));
  const o = envelope(k, 0.05, 0.35);
  const cells: ReactNode[] = [];
  const hr = 9;
  const dx = hr * Math.sqrt(3);
  for (let row = -5; row <= 5; row++) {
    for (let col = -4; col <= 4; col++) {
      const x = c.x + col * dx + (row % 2 ? dx / 2 : 0);
      const y = c.y + row * hr * 1.5;
      const dd = Math.hypot(x - c.x, y - c.y);
      if (dd > R * form - 4) continue;
      const lit = 0.25 + 0.75 * bump(seg(k, dd / R * 0.4, dd / R * 0.4 + 0.4));
      cells.push(<path key={`dm-h${row}-${col}`} d={hexPath(x, y, hr - 1.2)} fill="#4fd6ff" fillOpacity={f(0.12 * lit)} stroke="#9feaff" strokeWidth={1} strokeOpacity={f(0.7 * lit)} />);
    }
  }
  const scanY = c.y - R + 2 * R * seg(k, 0.1, 0.6);
  const halfW = Math.sqrt(Math.max(0, R * R - (scanY - c.y) ** 2));
  return (
    <g pointerEvents="none" opacity={f(o)}>
      <circle cx={f(c.x)} cy={f(c.y)} r={f(R * form)} fill="#1a8fd0" opacity={0.18} />
      {cells}
      <Ring x={c.x} y={c.y} r={R * form} color="#4fd6ff" width={2.5} />
      {k > 0.1 && k < 0.6 ? <line x1={f(c.x - halfW)} y1={f(scanY)} x2={f(c.x + halfW)} y2={f(scanY)} stroke="#ffffff" strokeWidth={2} opacity={0.85} /> : null}
      <path d={`M${f(c.x - R * 0.7)} ${f(c.y - R * 0.55)} A${f(R)} ${f(R)} 0 0 1 ${f(c.x + R * 0.3)} ${f(c.y - R * 0.9)}`} fill="none" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" opacity={f(0.6 * form)} />
      <Sparks x={c.x} y={c.y} n={10} seed={71} k={seg(k, 0.3, 0.8)} reach={R + 20} color="#bff2ff" width={1.8} />
    </g>
  );
};

// ------------------------------------------------------------------ rearm
const cog = (key: string, cx: number, cy: number, r: number, rot: number, color: string, o: number): ReactNode => {
  const teeth = 8;
  let d = '';
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * TAU;
    const a1 = ((i + 1) / (teeth * 2)) * TAU;
    const rr = i % 2 === 0 ? r : r * 0.78;
    const p0 = polar(0, 0, rr, a0);
    const p1 = polar(0, 0, rr, a1);
    d += `${i === 0 ? 'M' : 'L'}${f(p0.x)} ${f(p0.y)} L${f(p1.x)} ${f(p1.y)} `;
  }
  return (
    <g key={key} transform={`translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})`} opacity={f(o)}>
      <path d={`${d}Z`} fill={color} stroke="#5a3b0a" strokeWidth={1.2} />
      <circle r={f(r * 0.32)} fill="#2a1a05" />
      <circle r={f(r * 0.14)} fill="#ffe7a0" />
    </g>
  );
};

export const RearmVfx: VfxArt = ({ t, duration, from }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const c: Vec = { x: from.x, y: from.y - CHEST };
  const o = envelope(k, 0.08, 0.25);
  const spin = t * 260;
  const done = seg(k, 0.6, 1);
  const out: ReactNode[] = [];
  out.push(<circle key="ra-bg" cx={f(c.x)} cy={f(c.y)} r={58} fill="#3a2605" opacity={f(0.22 * o)} />);
  // circular "reload" arrow filling up
  const fill = easeOut(seg(k, 0.05, 0.6));
  const a0 = -Math.PI / 2;
  const a1 = a0 + fill * TAU * 0.92;
  const R = 54;
  const p0 = polar(c.x, c.y, R, a0);
  const p1 = polar(c.x, c.y, R, a1);
  if (fill > 0.01) {
    out.push(
      <path key="ra-arc" d={`M${f(p0.x)} ${f(p0.y)} A${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${f(p1.x)} ${f(p1.y)}`} fill="none" stroke="#ffc04a" strokeWidth={5} strokeLinecap="round" opacity={f(o)} />,
    );
    const tip = polar(c.x, c.y, R, a1 + 0.12);
    const l = polar(c.x, c.y, R - 8, a1 - 0.05);
    const r = polar(c.x, c.y, R + 8, a1 - 0.05);
    out.push(<path key="ra-tip" d={`M${f(tip.x)} ${f(tip.y)} L${f(l.x)} ${f(l.y)} L${f(r.x)} ${f(r.y)} Z`} fill="#fff1c0" opacity={f(o)} />);
  }
  // orbiting cogs
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + t * 3;
    const p = polar(c.x, c.y - 4, 34, a);
    out.push(cog(`ra-c${i}`, p.x, p.y * 1, 9 + (i % 2) * 3, i % 2 ? -spin : spin, i === 1 ? '#d9a441' : '#c48a2a', o));
  }
  // big cog over the head
  out.push(cog('ra-big', c.x, c.y - 66 - 6 * bump(seg(k, 0, 0.4)), 15, spin * 0.6, '#e8b54a', o));
  // completion flash
  if (done > 0) {
    out.push(<Glow key="ra-g" x={c.x} y={c.y} r={70} color="#ffc04a" opacity={bump(done)} core="#fffbe8" />);
    out.push(<Ring key="ra-r" x={c.x} y={c.y} r={30 + 60 * easeOut(done)} color="#ffd36b" width={4 * (1 - done) + 0.3} opacity={1 - done} />);
  }
  out.push(<Sparks key="ra-sp" x={c.x} y={c.y - 10} n={12} seed={81} k={seg(k, 0.6, 1)} reach={80} color="#ffe7a0" width={2} />);
  // small sparks from welding during the retool
  for (let i = 0; i < 6; i++) {
    const ph = (t * 4 + rnd(i, 82)) % 1;
    const sp = polar(c.x + srnd(i, 83) * 14, c.y + 6, 6 + 22 * ph, -Math.PI / 2 + srnd(i, 84) * 1.2);
    out.push(<circle key={`ra-w${i}`} cx={f(sp.x)} cy={f(lerp(sp.y, sp.y + 20, ph * ph))} r={1.6} fill="#fff1a0" opacity={f(o * (1 - ph) * (1 - done))} />);
  }
  return <g pointerEvents="none">{out}</g>;
};
