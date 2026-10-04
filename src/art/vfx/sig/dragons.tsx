// Signature VFX: dragon knight (elder_dragon_form), windranger (focus_fire), jakiro (macropyre).
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { VfxArt, ZoneArt } from '../../types.ts';
import { bump, clamp01, easeOut, lerp } from '../../types.ts';
import { Glow, GlowPath, Ring, Sparks, TAU, dir, dist, envelope, f, pathOf, polar, prog, rnd, seg, srnd } from './fxkit.tsx';

const CHEST = 40;
const HAND = 46;

/** teardrop flame centered at base (x,y), height h, width w, leaning by `lean` */
const flamePath = (x: number, y: number, w: number, h: number, lean: number): string =>
  `M${f(x - w / 2)} ${f(y)} Q${f(x - w * 0.6 + lean * 0.4)} ${f(y - h * 0.55)} ${f(x + lean)} ${f(y - h)} Q${f(x + w * 0.6 + lean * 0.4)} ${f(y - h * 0.55)} ${f(x + w / 2)} ${f(y)} Q${f(x)} ${f(y + w * 0.3)} ${f(x - w / 2)} ${f(y)}Z`;

// ------------------------------------------------------------------ elder_dragon_form
const wingPath = (span: number, open: number): string => {
  // wing drawn to the right of the shoulder (0,0); `open` 0..1 unfurls it upward/outward
  const s = span * (0.25 + 0.75 * open);
  const lift = -span * 0.7 * open;
  const tip = { x: s, y: lift - span * 0.15 };
  const p1 = { x: s * 0.62, y: lift * 0.8 + span * 0.32 };
  const p2 = { x: s * 0.82, y: lift * 0.4 + span * 0.42 };
  const p3 = { x: s * 0.4, y: span * 0.36 };
  return `M0 0 Q${f(s * 0.35)} ${f(lift * 0.9 - span * 0.1)} ${f(tip.x)} ${f(tip.y)} L${f(p2.x)} ${f(p2.y)} Q${f(p2.x - 8)} ${f(p2.y - 10)} ${f(p1.x)} ${f(p1.y)} Q${f(p1.x - 8)} ${f(p1.y)} ${f(p3.x)} ${f(p3.y)} Q${f(s * 0.15)} ${f(span * 0.15)} 0 ${f(span * 0.2)}Z`;
};

export const ElderDragonForm: VfxArt = ({ t, duration, from }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const cx = from.x;
  const cy = from.y - CHEST;
  const open = easeOut(seg(k, 0.05, 0.45));
  const env = envelope(k, 0.06, 0.35);
  const flap = Math.sin(seg(k, 0.4, 1) * Math.PI * 2) * 0.08;
  const wings: ReactNode[] = [];
  for (const side of [-1, 1]) {
    wings.push(
      <g key={side} transform={`translate(${f(cx + side * 6)},${f(cy - 18)}) scale(${side},1)`} opacity={f(env)}>
        <path d={wingPath(110, clamp01(open - flap))} fill="#3fae4a" opacity={0.18} transform="scale(1.12)" />
        <path d={wingPath(110, clamp01(open - flap))} fill="#1f6a2c" opacity={0.55} stroke="#e8c84a" strokeWidth={2.5} strokeLinejoin="round" />
        <path d={wingPath(110, clamp01(open - flap))} fill="none" stroke="#fff2a8" strokeWidth={0.8} strokeOpacity={0.8} />
      </g>,
    );
  }
  // dragon head silhouette rising above the caster
  const headK = easeOut(seg(k, 0.15, 0.5));
  const headOp = env * headK * 0.85;
  const hy = cy - 50 - headK * 30;
  // fire swirl: particles spiralling up around the body
  const swirl: ReactNode[] = [];
  for (let i = 0; i < 22; i++) {
    const ph = (rnd(i, 201) + k * 1.4) % 1;
    const a = rnd(i, 202) * TAU + ph * TAU * 1.6;
    const r = 26 + ph * 30;
    const x = cx + Math.cos(a) * r;
    const y = from.y - 6 - ph * 100 + Math.sin(a) * r * 0.3;
    const s = (1 - ph) * (4 + rnd(i, 203) * 4);
    swirl.push(<circle key={i} cx={f(x)} cy={f(y)} r={f(s)} fill={i % 3 === 0 ? '#ffe36a' : i % 3 === 1 ? '#7dff5a' : '#ff8a2a'} opacity={f(env * bump(ph))} />);
  }
  const shock = seg(k, 0.1, 0.6);
  return (
    <g>
      <Glow x={cx} y={cy} r={110} color="#5adf4a" opacity={env * 0.5 + bump(seg(k, 0, 0.3)) * 0.4} core="#fff6c0" />
      {wings}
      <g transform={`translate(${f(cx)},${f(hy)})`} opacity={f(headOp)}>
        <path d="M-14 22 Q-18 0 -6 -14 L-16 -30 L-2 -20 Q4 -24 10 -20 L18 -32 L12 -12 Q22 -2 30 2 Q20 8 8 6 Q4 16 14 22 Z" fill="#2c8a3a" stroke="#ffd94a" strokeWidth={2} strokeLinejoin="round" />
        <circle cx={10} cy={-6} r={2.6} fill="#fff59a" />
        <circle cx={10} cy={-6} r={6} fill="#ffe36a" opacity={0.35} />
      </g>
      {shock > 0 && shock < 1 ? (
        <g>
          <ellipse cx={f(cx)} cy={f(from.y)} rx={f(20 + easeOut(shock) * 150)} ry={f(8 + easeOut(shock) * 50)} fill="none" stroke="#b6ff6a" strokeWidth={f(8 * (1 - shock))} opacity={f(1 - shock)} />
          <ellipse cx={f(cx)} cy={f(from.y)} rx={f(14 + easeOut(shock) * 120)} ry={f(6 + easeOut(shock) * 40)} fill="none" stroke="#ffd94a" strokeWidth={f(4 * (1 - shock))} opacity={f(1 - shock)} />
        </g>
      ) : null}
      {swirl}
      <Sparks x={cx} y={cy} n={18} seed={204} k={seg(k, 0.05, 0.55)} reach={130} color="#ffe36a" width={3} />
    </g>
  );
};

// ------------------------------------------------------------------ focus_fire
const WindArrow = ({ x, y, rot, op }: { x: number; y: number; rot: number; op: number }): ReactNode => (
  <g transform={`translate(${f(x)},${f(y)}) rotate(${f(rot)}) scale(1.35)`} opacity={f(op)}>
    <path d="M-46 0 L0 0" stroke="#6bff9a" strokeWidth={7} strokeOpacity={0.15} strokeLinecap="round" />
    <path d="M-30 0 L0 0" stroke="#b8ffcf" strokeWidth={2.5} strokeOpacity={0.6} strokeLinecap="round" />
    <path d="M-20 0 L4 0" stroke="#f2fff6" strokeWidth={1.6} />
    <path d="M9 0 L2 -3.5 L3 0 L2 3.5 Z" fill="#ffffff" stroke="#3ad06a" strokeWidth={0.8} />
    <path d="M-20 0 l-5 -4 M-20 0 l-5 4" stroke="#3ad06a" strokeWidth={1.6} />
  </g>
);

export const FocusFire: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = dir(from, to, team);
  const a: Vec = { x: from.x + d.x * 20, y: from.y - HAND };
  const b: Vec = dist(from, to) < 1 ? { x: a.x + d.x * 300, y: a.y } : { x: to.x, y: to.y - CHEST };
  const rot = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  const nrm = { x: -d.y, y: d.x };
  const fly = 0.16; // seconds per arrow flight
  const gap = 0.055;
  const stopAt = Math.max(0, duration - fly - 0.02);
  const arrows: ReactNode[] = [];
  const hits: ReactNode[] = [];
  const first = Math.max(0, Math.ceil((t - fly - 0.12) / gap));
  for (let j = first; j * gap <= Math.min(t, stopAt); j++) {
    const p = (t - j * gap) / fly;
    const off = srnd(j, 211) * 10;
    if (p < 1) {
      const e = p;
      const x = lerp(a.x, b.x, e) + nrm.x * off * (1 - e);
      const y = lerp(a.y, b.y, e) + nrm.y * off * (1 - e);
      arrows.push(<WindArrow key={j} x={x} y={y} rot={rot} op={Math.min(1, p * 6)} />);
    } else {
      const h = (p - 1) / 0.75; // short hit puff
      if (h < 1) hits.push(<Ring key={`h${j}`} x={b.x + srnd(j, 212) * 8} y={b.y + srnd(j, 213) * 10} r={6 + h * 18} color="#9affb8" width={2.5 * (1 - h)} opacity={1 - h} />);
    }
  }
  // wind swirl at the caster
  const env = envelope(k, 0.08, 0.2);
  const swirl: ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const pts: Vec[] = [];
    for (let s = 0; s <= 16; s++) {
      const u = s / 16;
      const ang = t * 10 + i * (TAU / 3) + u * 3.2;
      const r = 14 + u * 22;
      pts.push({ x: from.x + Math.cos(ang) * r, y: from.y - 34 + Math.sin(ang) * r * 0.45 - u * 14 });
    }
    swirl.push(<GlowPath key={i} d={pathOf(pts)} color="#5af08a" core="#eafff0" width={2} opacity={env * 0.7} layers={1} />);
  }
  const ground: ReactNode[] = [];
  for (let i = 0; i < 2; i++) {
    const ph = (t * 3 + i * 0.5) % 1;
    ground.push(<ellipse key={i} cx={f(from.x)} cy={f(from.y)} rx={f(16 + ph * 28)} ry={f(5 + ph * 8)} fill="none" stroke="#9affb8" strokeWidth={1.5} opacity={f(env * (1 - ph) * 0.8)} />);
  }
  return (
    <g>
      {ground}
      {swirl}
      <Glow x={a.x} y={a.y} r={22} color="#4ae07a" opacity={env * 0.8} core="#ffffff" />
      <path d={pathOf([a, b])} stroke="#7dffa8" strokeWidth={10} strokeOpacity={f(env * 0.07)} strokeLinecap="round" />
      {arrows}
      {hits}
      <Glow x={b.x} y={b.y} r={26} color="#4ae07a" opacity={env * 0.45} />
    </g>
  );
};

// ------------------------------------------------------------------ macropyre (cast + zone)
export const MacropyreCast: VfxArt = ({ t, duration, from, to, team, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = dir(from, to, team);
  const base = Math.atan2(d.y, d.x);
  const o: Vec = { x: from.x + d.x * 22, y: from.y - HAND };
  const L = Math.max(160, Math.min(420, dist(from, to) + (radius > 0 ? radius * 0.5 : 60)));
  const env = envelope(k, 0.08, 0.4);
  const reachK = easeOut(seg(k, 0, 0.35));
  const half = 0.32;
  const cone = (len: number, h: number): string => {
    const p1 = polar(o.x, o.y, len, base - h);
    const p2 = polar(o.x, o.y, len, base + h);
    return `M${f(o.x)} ${f(o.y)} L${f(p1.x)} ${f(p1.y)} Q${f(polar(o.x, o.y, len * 1.12, base).x)} ${f(polar(o.x, o.y, len * 1.12, base).y)} ${f(p2.x)} ${f(p2.y)}Z`;
  };
  const puffs: ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const ph = (rnd(i, 221) + t * 2.2) % 1;
    const a = base + srnd(i, 222) * half * 0.9;
    const r = ph * L * reachK;
    const p = polar(o.x, o.y, r, a);
    const s = 5 + ph * 22;
    const col = ph < 0.3 ? '#fff2b0' : ph < 0.6 ? '#ff9a2a' : i % 2 ? '#ff4a1a' : '#5ac8ff';
    puffs.push(<circle key={i} cx={f(p.x)} cy={f(p.y - ph * 18)} r={f(s)} fill={col} opacity={f(env * (1 - ph) * 0.55)} />);
  }
  return (
    <g>
      <path d={cone(L * reachK, half)} fill="#ff5a1a" opacity={f(env * 0.22)} />
      <path d={cone(L * reachK * 0.85, half * 0.6)} fill="#ffa03a" opacity={f(env * 0.3)} />
      <path d={cone(L * reachK * 0.6, half * 0.3)} fill="#fff0b0" opacity={f(env * 0.4)} />
      {puffs}
      <Glow x={o.x} y={o.y} r={36} color="#ff7a2a" opacity={env} core="#ffffff" />
      <Glow x={o.x + d.x * 6} y={o.y - 10} r={18} color="#5ac8ff" opacity={env * 0.6} />
    </g>
  );
};

export const MacropyreZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const R = radius > 0 ? radius : 160;
  const env = Math.min(1, t / 0.3) * (duration > 0 ? clamp01((duration - t) / 0.5) : 1);
  if (env <= 0) return null;
  const sq = 0.5;
  // flames on a deterministic jittered grid across the ellipse; each flickers on its own phase
  const flames: { y: number; el: ReactNode }[] = [];
  const N = Math.max(14, Math.min(40, Math.round(R / 7)));
  for (let i = 0; i < N; i++) {
    const a = rnd(i, 231) * TAU;
    const rr = Math.sqrt(rnd(i, 232)) * R * 0.92;
    const fx = x + Math.cos(a) * rr;
    const fy = y + Math.sin(a) * rr * sq;
    const ph = t * (5 + rnd(i, 233) * 4) + rnd(i, 234) * TAU;
    const flick = 0.7 + 0.3 * Math.sin(ph) * Math.sin(ph * 1.7 + 1);
    const h = (26 + rnd(i, 235) * 30) * flick * (1 - (rr / R) * 0.35);
    const w = 12 + rnd(i, 236) * 10;
    const lean = Math.sin(ph * 0.6) * 5;
    flames.push({
      y: fy,
      el: (
        <g key={i}>
          <path d={flamePath(fx, fy, w * 1.3, h * 1.15, lean)} fill="#ff3a10" opacity={0.45} />
          <path d={flamePath(fx, fy, w, h, lean)} fill="#ff8a1a" opacity={0.75} />
          <path d={flamePath(fx, fy, w * 0.5, h * 0.55, lean * 0.6)} fill="#ffe07a" opacity={0.9} />
        </g>
      ),
    });
  }
  flames.sort((p, q) => p.y - q.y);
  const embers: ReactNode[] = [];
  for (let i = 0; i < 30; i++) {
    const ph = (rnd(i, 241) + t * (0.5 + rnd(i, 242) * 0.5)) % 1;
    const a = rnd(i, 243) * TAU;
    const rr = Math.sqrt(rnd(i, 244)) * R;
    const ex = x + Math.cos(a) * rr + Math.sin(t * 3 + i) * 8 * ph;
    const ey = y + Math.sin(a) * rr * sq - ph * 110;
    embers.push(<circle key={i} cx={f(ex)} cy={f(ey)} r={f(1.2 + (1 - ph) * 1.6)} fill={i % 4 ? '#ffb040' : '#fff0a0'} opacity={f(bump(ph) * 0.9)} />);
  }
  const heat = 0.5 + 0.12 * Math.sin(t * 7);
  return (
    <g opacity={f(env)}>
      <defs>
        <radialGradient id="mpy-ground">
          <stop offset="0" stopColor="#ff7a1a" stopOpacity={0.55} />
          <stop offset="0.55" stopColor="#5a1a08" stopOpacity={0.6} />
          <stop offset="0.9" stopColor="#1a0a05" stopOpacity={0.45} />
          <stop offset="1" stopColor="#1a0a05" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* scorched ground + molten glow */}
      <ellipse cx={f(x)} cy={f(y)} rx={f(R * 1.05)} ry={f(R * sq * 1.05)} fill="url(#mpy-ground)" />
      <ellipse cx={f(x)} cy={f(y)} rx={f(R * 0.7)} ry={f(R * sq * 0.7)} fill="#ff5a10" opacity={f(heat * 0.25)} />
      <ellipse cx={f(x)} cy={f(y)} rx={f(R)} ry={f(R * sq)} fill="none" stroke="#ff6a1a" strokeWidth={3} strokeOpacity={0.5} strokeDasharray="20 10" strokeDashoffset={f(-t * 30)} />
      {/* cracks */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = rnd(i, 251) * TAU;
        const pts: Vec[] = [];
        for (let s = 0; s <= 4; s++) {
          const rr = (s / 4) * R * 0.85;
          const aa = a + srnd(i * 5 + s, 252) * 0.25;
          pts.push({ x: x + Math.cos(aa) * rr, y: y + Math.sin(aa) * rr * sq });
        }
        return <path key={`c${i}`} d={pathOf(pts)} fill="none" stroke="#ffb040" strokeWidth={1.6} strokeOpacity={f(0.4 + 0.3 * Math.sin(t * 4 + i))} />;
      })}
      {flames.map((p) => p.el)}
      {embers}
    </g>
  );
};

