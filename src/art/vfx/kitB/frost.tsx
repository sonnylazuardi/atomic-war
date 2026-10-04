// Kit-B VFX: Drow Ranger (frost_arrows, gust, multishot).
import type { ReactNode } from 'react';
import type { Team, Vec } from '../../../core/types.ts';
import type { ProjectileArt, VfxArt, ZoneArt } from '../../types.ts';
import { bump, clamp01, easeIn, easeOut, lerp } from '../../types.ts';
import { Glow, Ring, Sparks, TAU, dir, dist, envelope, f, polar, prog, rnd, seg, srnd } from '../sig/fxkit.tsx';

const CHEST = 40;

const flake = (key: string, x: number, y: number, r: number, rot: number, o: number, color = '#e6f8ff'): ReactNode => {
  const arms: ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const p = polar(0, 0, r, a);
    const b1 = polar(0, 0, r * 0.55, a);
    const b2 = polar(b1.x, b1.y, r * 0.3, a + 0.8);
    const b3 = polar(b1.x, b1.y, r * 0.3, a - 0.8);
    arms.push(<path key={i} d={`M0 0 L${f(p.x)} ${f(p.y)} M${f(b1.x)} ${f(b1.y)} L${f(b2.x)} ${f(b2.y)} M${f(b1.x)} ${f(b1.y)} L${f(b3.x)} ${f(b3.y)}`} />);
  }
  return (
    <g key={key} transform={`translate(${f(x)} ${f(y)}) rotate(${f(rot)})`} opacity={f(o)} stroke={color} strokeWidth={1.6} strokeLinecap="round" fill="none">
      {arms}
    </g>
  );
};

// ------------------------------------------------------------------ frost_arrows
export const FrostArrowsVfx: VfxArt = ({ t, duration, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const c: Vec = { x: to.x, y: to.y - CHEST };
  const burst = easeOut(seg(k, 0, 0.5));
  const fade = 1 - seg(k, 0.3, 1);
  const shards: ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + srnd(i, 111) * 0.3;
    const p0 = polar(c.x, c.y, 4, a);
    const p1 = polar(c.x, c.y, 10 + 18 * burst * (0.7 + 0.3 * rnd(i, 112)), a);
    const w = polar(0, 0, 3, a + Math.PI / 2);
    shards.push(<path key={`fa-s${i}`} d={`M${f(p0.x + w.x)} ${f(p0.y + w.y)} L${f(p1.x)} ${f(p1.y)} L${f(p0.x - w.x)} ${f(p0.y - w.y)} Z`} fill="#bfeaff" stroke="#ffffff" strokeWidth={0.6} opacity={f(fade)} />);
  }
  return (
    <g pointerEvents="none">
      <Glow x={c.x} y={c.y} r={28} color="#6fc8ff" opacity={fade} core="#ffffff" />
      {shards}
      {flake('fa-fl', c.x, c.y - 26 - 10 * burst, 8, t * 120, fade)}
      <Ring x={to.x} y={to.y} r={10 + 18 * burst} color="#8fdcff" width={2 * fade + 0.3} opacity={fade * 0.8} />
    </g>
  );
};

// ------------------------------------------------------------------ gust
const GUST_LEN = 450;
export const GustVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = dir(from, to, team);
  const n = { x: -d.y, y: d.x };
  const ang = (Math.atan2(d.y, d.x) * 180) / Math.PI;
  const o = envelope(k, 0.05, 0.4);
  const out: ReactNode[] = [];
  // swirl at Drow's bow
  const s: Vec = { x: from.x + d.x * 20, y: from.y - 44 };
  for (let i = 0; i < 3; i++) {
    const r = 10 + i * 7 + 14 * easeOut(seg(k, 0, 0.5));
    out.push(
      <path
        key={`gu-sw${i}`}
        d={`M${f(s.x - r)} ${f(s.y)} A${f(r)} ${f(r * 0.6)} 0 1 1 ${f(s.x + r * 0.6)} ${f(s.y + r * 0.45)}`}
        fill="none"
        stroke="#e2f4ff"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={f(o * (1 - seg(k, 0.2 + i * 0.1, 0.7)))}
        transform={`rotate(${f(ang + t * 400 + i * 50)} ${f(s.x)} ${f(s.y)})`}
      />,
    );
  }
  // wind streaks racing along the 450-long lane
  for (let i = 0; i < 14; i++) {
    const p = seg(k, rnd(i, 121) * 0.35, 0.55 + rnd(i, 122) * 0.45);
    if (p <= 0 || p >= 1) continue;
    const off = srnd(i, 123) * 75;
    const along = GUST_LEN * easeOut(p);
    const len = 30 + 40 * rnd(i, 124);
    const x1 = from.x + d.x * along + n.x * off;
    const y1 = from.y - 30 + d.y * along + n.y * off;
    const x0 = x1 - d.x * len;
    const y0 = y1 - d.y * len;
    out.push(<line key={`gu-l${i}`} x1={f(x0)} y1={f(y0)} x2={f(x1)} y2={f(y1)} stroke={i % 3 ? '#cfeeff' : '#ffffff'} strokeWidth={f(1.5 + rnd(i, 125) * 2)} strokeLinecap="round" opacity={f(0.75 * bump(p))} />);
  }
  // drifting leaves
  for (let i = 0; i < 5; i++) {
    const p = seg(k, 0.05 + i * 0.06, 0.8 + i * 0.04);
    if (p <= 0 || p >= 1) continue;
    const along = GUST_LEN * 0.9 * p;
    const off = srnd(i, 126) * 60 + Math.sin(t * 12 + i) * 8;
    const x = from.x + d.x * along + n.x * off;
    const y = from.y - 30 + d.y * along + n.y * off;
    out.push(<ellipse key={`gu-lf${i}`} cx={f(x)} cy={f(y)} rx={4} ry={2} fill="#9fd8a0" opacity={f(bump(p))} transform={`rotate(${f(t * 700 + i * 60)} ${f(x)} ${f(y)})`} />);
  }
  return <g pointerEvents="none">{out}</g>;
};

/** wide crescent wave of wind, origin = wave front, pointing +x */
export const GustProjectile: ProjectileArt = ({ t }) => {
  const out: ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const back = i * 14;
    const w = 80 - i * 12;
    const wob = Math.sin(t * 30 + i) * 3;
    out.push(
      <path
        key={`gp-c${i}`}
        d={`M${f(-back - 26)} ${f(-w)} Q${f(-back + 14 + wob)} 0 ${f(-back - 26)} ${f(w)}`}
        fill="none"
        stroke={i === 0 ? '#ffffff' : '#bfe6ff'}
        strokeWidth={f(i === 0 ? 5 : 3)}
        strokeLinecap="round"
        opacity={f(0.85 - i * 0.25)}
      />,
    );
  }
  out.push(<path key="gp-fill" d="M-26 -80 Q14 0 -26 80 Q-6 0 -26 -80 Z" fill="#dff3ff" opacity={0.28} />);
  for (let i = 0; i < 7; i++) {
    const y = (i - 3) * 20 + Math.sin(t * 20 + i) * 3;
    const ph = (t * 4 + rnd(i, 131)) % 1;
    const x = -30 - ph * 50;
    out.push(<line key={`gp-l${i}`} x1={f(x)} y1={f(y)} x2={f(x - 22)} y2={f(y)} stroke="#e8f6ff" strokeWidth={2} strokeLinecap="round" opacity={f(0.6 * (1 - ph))} />);
  }
  return <g>{out}</g>;
};

// ------------------------------------------------------------------ multishot
const arrow = (key: string, x: number, y: number, rot: number, o: number, s = 1): ReactNode => (
  <g key={key} transform={`translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`} opacity={f(o)}>
    <line x1={-22} y1={0} x2={-4} y2={0} stroke="#bfeaff" strokeWidth={4} strokeOpacity={0.35} strokeLinecap="round" />
    <line x1={-18} y1={0} x2={2} y2={0} stroke="#e8f6ff" strokeWidth={1.6} strokeLinecap="round" />
    <path d="M2 -3 L9 0 L2 3 Z" fill="#9fe2ff" stroke="#ffffff" strokeWidth={0.6} />
    <path d="M-18 0 L-22 -3 M-18 0 L-22 3" stroke="#7fbfe0" strokeWidth={1.2} />
  </g>
);

export const MultishotVfx: VfxArt = ({ t, duration, from, to, team, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = dir(from, to, team);
  const L = Math.max(60, dist(from, to));
  const R = radius > 0 ? radius : 160;
  const base = Math.atan2(d.y, d.x);
  const spread = Math.atan2(R, L);
  const o = envelope(k, 0.08, 0.35);
  const s: Vec = { x: from.x + d.x * 16, y: from.y - 42 };
  const out: ReactNode[] = [];
  // cone outline from Drow to the target area
  const l = polar(s.x, s.y + 30, L, base - spread);
  const r = polar(s.x, s.y + 30, L, base + spread);
  out.push(<path key="mu-cone" d={`M${f(s.x)} ${f(s.y)} L${f(l.x)} ${f(l.y)} L${f(r.x)} ${f(r.y)} Z`} fill="#9fd8ff" opacity={f(0.1 * o)} />);
  // fan of arrows leaving the bow
  for (let i = 0; i < 5; i++) {
    const a = base + (i - 2) * spread * 0.45;
    const p = seg(k, i * 0.04, 0.55 + i * 0.04);
    if (p <= 0 || p >= 1) continue;
    const q = polar(s.x, s.y, 20 + 140 * easeIn(p), a);
    out.push(arrow(`mu-a${i}`, q.x, q.y, (a * 180) / Math.PI, 1 - seg(p, 0.7, 1)));
  }
  out.push(<Glow key="mu-g" x={s.x} y={s.y} r={24} color="#8fdcff" opacity={bump(seg(k, 0, 0.5))} core="#ffffff" />);
  out.push(<Ring key="mu-tr" x={to.x} y={to.y} r={R} color="#9fd8ff" width={1.5} opacity={o * 0.6} dash="8 8" />);
  return <g pointerEvents="none">{out}</g>;
};

const teamUp = (team: Team): number => (team === 'left' ? 1 : -1); // left team fires from below

export const MultishotZone: ZoneArt = ({ t, duration, x, y, radius, team }) => {
  const R = radius > 0 ? radius : 160;
  const life = clamp01(Math.min(t / 0.15, duration > 0 ? (duration - t) / 0.3 + 0.0001 : 1));
  if (life <= 0) return null;
  const up = teamUp(team);
  const out: ReactNode[] = [];
  out.push(<circle key="mz-bg" cx={f(x)} cy={f(y)} r={f(R)} fill="#6fbfff" opacity={f(0.08 * life)} />);
  out.push(<circle key="mz-e" cx={f(x)} cy={f(y)} r={f(R)} fill="none" stroke="#bfeaff" strokeWidth={1.5} strokeDasharray="6 8" opacity={f(0.6 * life)} />);
  // three volleys (one per tick)
  for (let v = 0; v < 3; v++) {
    const vt = t - v * 0.5;
    if (vt < 0 || vt > 0.6) continue;
    const fly = clamp01(vt / 0.25);
    const imp = clamp01((vt - 0.25) / 0.35);
    for (let i = 0; i < 7; i++) {
      const a = rnd(i, 141 + v) * TAU;
      const dd = R * Math.sqrt(rnd(i, 142 + v)) * 0.85;
      const p = polar(x, y, dd, a);
      const sx = p.x + srnd(i, 143) * 40;
      const sy = p.y + up * 170;
      if (fly < 1) {
        const ax = lerp(sx, p.x, easeIn(fly));
        const ay = lerp(sy, p.y, easeIn(fly)) - 20 * Math.sin(Math.PI * fly);
        const rot = (Math.atan2(p.y - sy, p.x - sx) * 180) / Math.PI;
        out.push(arrow(`mz-a${v}-${i}`, ax, ay, rot, life * clamp01(fly * 4)));
      } else if (imp < 1) {
        out.push(<circle key={`mz-i${v}-${i}`} cx={f(p.x)} cy={f(p.y)} r={f(4 + 14 * easeOut(imp))} fill="none" stroke="#cfefff" strokeWidth={f(2 * (1 - imp) + 0.3)} opacity={f(life * (1 - imp))} />);
        out.push(flake(`mz-f${v}-${i}`, p.x, p.y - 8 - 8 * imp, 5, i * 30 + imp * 90, life * (1 - imp)));
        // stuck arrow shaft
        out.push(<line key={`mz-sh${v}-${i}`} x1={f(p.x)} y1={f(p.y)} x2={f(p.x - (sx - p.x) * 0.08)} y2={f(p.y - (sy - p.y) * 0.08)} stroke="#e8f6ff" strokeWidth={1.6} opacity={f(life * (1 - imp))} />);
      }
    }
    if (fly >= 1 && imp < 1) out.push(<Sparks key={`mz-sp${v}`} x={x} y={y} n={10} seed={150 + v} k={imp} reach={R * 0.6} color="#dff4ff" width={1.6} />);
  }
  return <g pointerEvents="none">{out}</g>;
};
