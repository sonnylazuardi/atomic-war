// Kit-B VFX: Medusa (mystic_snake, mana_shield, stone_gaze).
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { VfxArt, ZoneArt } from '../../types.ts';
import { bump, clamp01, easeIn, easeOut, lerp } from '../../types.ts';
import { Glow, Ring, Sparks, TAU, dir, dist, envelope, f, pathOf, polar, prog, rnd, seg, srnd } from '../sig/fxkit.tsx';

const CHEST = 40;

// ------------------------------------------------------------------ mystic_snake
export const MysticSnakeVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = dir(from, to, team);
  const n = { x: -d.y, y: d.x };
  const a: Vec = { x: from.x + d.x * 16, y: from.y - 46 };
  const b: Vec = dist(from, to) < 1 ? { x: a.x + d.x * 160, y: a.y } : { x: to.x, y: to.y - CHEST };
  const L = dist(a, b);
  const travel = easeOut(seg(k, 0, 0.55));
  const hit = seg(k, 0.5, 1);
  const out: ReactNode[] = [];
  const at = (s: number): Vec => {
    const w = Math.sin(s * L * 0.06 - t * 18) * 12 * Math.sin(Math.PI * s);
    return { x: lerp(a.x, b.x, s) + n.x * w, y: lerp(a.y, b.y, s) + n.y * w };
  };
  if (hit < 1) {
    const segs = 16;
    const body: Vec[] = [];
    const tail = Math.max(0, travel - 0.45);
    for (let i = 0; i <= segs; i++) body.push(at(lerp(tail, travel, i / segs)));
    const bo = 1 - seg(k, 0.5, 0.75);
    out.push(<path key="ms-glow" d={pathOf(body)} fill="none" stroke="#1fd8a0" strokeWidth={14} strokeOpacity={f(0.18 * bo)} strokeLinecap="round" strokeLinejoin="round" />);
    for (let i = 0; i < segs; i++) {
      const p = body[i + 1]!;
      const q = body[i]!;
      out.push(<line key={`ms-b${i}`} x1={f(q.x)} y1={f(q.y)} x2={f(p.x)} y2={f(p.y)} stroke={i % 2 ? '#3fe0b0' : '#2bb88f'} strokeWidth={f(2 + (i / segs) * 6)} strokeLinecap="round" opacity={f(bo)} />);
    }
    const head = body[segs]!;
    const hdir = Math.atan2(head.y - body[segs - 1]!.y, head.x - body[segs - 1]!.x);
    out.push(
      <g key="ms-head" transform={`translate(${f(head.x)} ${f(head.y)}) rotate(${f((hdir * 180) / Math.PI)})`} opacity={f(bo)}>
        <path d="M-4 -6 Q8 -7 11 0 Q8 7 -4 6 Z" fill="#3fe0b0" stroke="#0e6a50" strokeWidth={1} />
        <circle cx={5} cy={-3} r={1.6} fill="#ffef6a" />
        <circle cx={5} cy={3} r={1.6} fill="#ffef6a" />
        <path d="M11 0 L16 -2 M11 0 L16 2" stroke="#ff5a7a" strokeWidth={1} />
      </g>,
    );
  }
  if (hit > 0) {
    out.push(<Glow key="ms-g" x={b.x} y={b.y} r={44} color="#3fe0b0" opacity={1 - hit} core="#eafff7" />);
    out.push(<Ring key="ms-r" x={b.x} y={b.y} r={12 + 40 * easeOut(hit)} color="#58f0c4" width={3 * (1 - hit) + 0.3} opacity={1 - hit} />);
    out.push(<Sparks key="ms-sp" x={b.x} y={b.y} n={10} seed={91} k={seg(hit, 0, 0.6)} reach={50} color="#b6ffe6" width={2} />);
    // stolen mana motes flowing back to Medusa
    for (let i = 0; i < 7; i++) {
      const p = seg(hit, rnd(i, 92) * 0.35, 0.65 + rnd(i, 93) * 0.35);
      if (p <= 0 || p >= 1) continue;
      const e = easeIn(p);
      const x = lerp(b.x, a.x, e) + n.x * srnd(i, 94) * 30 * Math.sin(Math.PI * p);
      const y = lerp(b.y, a.y, e) + n.y * srnd(i, 94) * 30 * Math.sin(Math.PI * p) - 18 * Math.sin(Math.PI * p);
      out.push(<circle key={`ms-m${i}`} cx={f(x)} cy={f(y)} r={3} fill="#5aa8ff" opacity={f(bump(p))} />);
      out.push(<circle key={`ms-mc${i}`} cx={f(x)} cy={f(y)} r={1.3} fill="#e6f2ff" opacity={f(bump(p))} />);
    }
  }
  return <g pointerEvents="none">{out}</g>;
};

// ------------------------------------------------------------------ mana_shield
export const ManaShieldVfx: VfxArt = ({ t, duration, from }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const c: Vec = { x: from.x, y: from.y - CHEST };
  const o = envelope(k, 0.1, 0.4);
  const R = 46 + 6 * easeOut(seg(k, 0, 0.3));
  const scales: ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + t * 0.8;
    const p = polar(c.x, c.y, R, a);
    const lit = bump(seg(k, i / 24, i / 24 + 0.5));
    scales.push(
      <path
        key={`mn-s${i}`}
        d={`M${f(p.x)} ${f(p.y - 6)} Q${f(p.x + 6)} ${f(p.y)} ${f(p.x)} ${f(p.y + 6)} Q${f(p.x - 6)} ${f(p.y)} ${f(p.x)} ${f(p.y - 6)} Z`}
        fill="#7ab8ff"
        opacity={f(0.3 + 0.6 * lit)}
        transform={`rotate(${f((a * 180) / Math.PI)} ${f(p.x)} ${f(p.y)})`}
      />,
    );
  }
  return (
    <g pointerEvents="none" opacity={f(o)}>
      <circle cx={f(c.x)} cy={f(c.y)} r={f(R)} fill="#2a6fff" opacity={0.16} />
      <Ring x={c.x} y={c.y} r={R} color="#5aa0ff" width={2.5} />
      {scales}
      <path d={`M${f(c.x - R * 0.6)} ${f(c.y - R * 0.6)} A${f(R)} ${f(R)} 0 0 1 ${f(c.x + R * 0.2)} ${f(c.y - R * 0.95)}`} fill="none" stroke="#e6f2ff" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
    </g>
  );
};

// ------------------------------------------------------------------ stone_gaze
const eye = (key: string, x: number, y: number, open: number, s: number, o: number): ReactNode => {
  const h = 9 * clamp01(open);
  return (
    <g key={key} transform={`translate(${f(x)} ${f(y)}) scale(${f(s)})`} opacity={f(o)}>
      <path d={`M-16 0 Q0 ${f(-h - 2)} 16 0 Q0 ${f(h + 2)} -16 0 Z`} fill="#f4ffb0" stroke="#2c3a10" strokeWidth={1.5} />
      {open > 0.15 ? <ellipse cx={0} cy={0} rx={2.6} ry={f(Math.min(8, h))} fill="#1e2a06" /> : null}
    </g>
  );
};

export const StoneGazeVfx: VfxArt = ({ t, duration, from, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 250;
  const c: Vec = { x: from.x, y: from.y - 60 };
  const open = easeOut(seg(k, 0.05, 0.3));
  const o = envelope(k, 0.05, 0.3);
  const wave = seg(k, 0.25, 0.95);
  const rays: ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU + 0.1;
    const p0 = polar(c.x, c.y, 26, a);
    const p1 = polar(from.x, from.y - 20, R * easeOut(wave), a);
    rays.push(<line key={`sg-ray${i}`} x1={f(p0.x)} y1={f(p0.y)} x2={f(p1.x)} y2={f(p1.y)} stroke="#d4ff6a" strokeWidth={f(3 * (1 - wave) + 0.5)} strokeOpacity={f(0.5 * bump(wave))} strokeLinecap="round" />);
  }
  return (
    <g pointerEvents="none">
      {wave > 0 && wave < 1 ? rays : null}
      {wave > 0 ? <Ring x={from.x} y={from.y} r={R * easeOut(wave)} color="#b6e35a" width={5 * (1 - wave) + 0.4} opacity={1 - wave} /> : null}
      <Glow x={c.x} y={c.y} r={50} color="#a6d83a" opacity={o * 0.9} />
      {eye('sg-l', c.x - 15, c.y, open, 0.9, o)}
      {eye('sg-r', c.x + 15, c.y, open, 0.9, o)}
    </g>
  );
};

/** follows Medusa; the gaze petrifies on each tick (first at 1.2s, then every 2s) */
export const StoneGazeZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const R = radius > 0 ? radius : 250;
  const life = clamp01(Math.min(t / 0.3, duration > 0 ? (duration - t) / 0.5 : 1));
  if (life <= 0) return null;
  const out: ReactNode[] = [];
  out.push(<circle key="sz-bg" cx={f(x)} cy={f(y)} r={f(R)} fill="#8fb33a" opacity={f(0.1 * life)} />);
  out.push(
    <circle key="sz-edge" cx={f(x)} cy={f(y)} r={f(R)} fill="none" stroke="#b6e35a" strokeWidth={2.5} strokeDasharray="22 10" opacity={f(0.7 * life)} transform={`rotate(${f(t * 20)} ${f(x)} ${f(y)})`} />,
  );
  // sweeping gaze beams
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + t * 0.9;
    const p0 = polar(x, y - 50, 18, a);
    const p1 = polar(x, y, R * 0.95, a);
    const p2 = polar(x, y, R * 0.95, a + 0.22);
    out.push(<path key={`sz-b${i}`} d={pathOf([p0, p1, p2], true)} fill="#d4ff6a" opacity={f(0.09 * life)} />);
  }
  // petrify pulse
  const since = t - 1.2;
  if (since >= 0) {
    const ph = clamp01((since % 2) / 0.7);
    if (ph < 1) {
      out.push(<circle key="sz-pf" cx={f(x)} cy={f(y)} r={f(R * easeOut(ph))} fill="#8c8f84" opacity={f(0.22 * (1 - ph) * life)} />);
      out.push(<Ring key="sz-pr" x={x} y={y} r={R * easeOut(ph)} color="#c9cdbd" width={5 * (1 - ph) + 0.4} opacity={(1 - ph) * life} />);
      const pulse = Math.floor(since / 2);
      for (let i = 0; i < 10; i++) {
        const a = rnd(i, 101 + pulse) * TAU;
        const d = R * (0.3 + 0.65 * rnd(i, 102 + pulse));
        const p = polar(x, y, d, a);
        const hgt = 10 + rnd(i, 103) * 12;
        const rise = easeOut(seg(ph, 0, 0.4)) * (1 - seg(ph, 0.7, 1));
        out.push(
          <path
            key={`sz-rk${i}`}
            d={`M${f(p.x - 5)} ${f(p.y)} L${f(p.x - 2 + srnd(i, 104) * 2)} ${f(p.y - hgt * rise)} L${f(p.x + 5)} ${f(p.y)} Z`}
            fill="#9a9d90"
            stroke="#4a4c42"
            strokeWidth={1}
            opacity={f(life * rise)}
          />,
        );
      }
    }
  }
  // the watching eye overhead blinks open on each pulse
  const blink = since < 0 ? seg(t, 0, 1.2) : 1 - 0.6 * bump(clamp01(((since + 1.7) % 2) / 0.3));
  out.push(<Glow key="sz-eg" x={x} y={y - 112} r={22} color="#a6d83a" opacity={life * 0.7} />);
  out.push(eye('sz-eye', x, y - 112, blink, 0.8, life));
  return <g pointerEvents="none">{out}</g>;
};
