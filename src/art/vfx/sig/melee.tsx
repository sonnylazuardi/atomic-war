// Signature VFX: pudge, axe, ursa, slark, phantom assassin, juggernaut.
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { VfxArt } from '../../types.ts';
import { bump, clamp01, easeIn, easeOut, lerp } from '../../types.ts';
import { Glow, GlowPath, Ring, Slash, Sparks, TAU, dir, dist, envelope, f, pathOf, polar, prog, rnd, seg, srnd } from './fxkit.tsx';

const CHEST = 40; // hero chest height above feet

// ------------------------------------------------------------------ flesh_heap
// green meat chunks burst from the victim (or around Pudge on a proc) and get absorbed; "+STR" glow.
export const FleshHeap: VfxArt = ({ t, duration, from, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const self = dist(from, to) < 1;
  const cx = from.x;
  const cy = from.y - CHEST;
  const chunks: ReactNode[] = [];
  const N = 12;
  for (let i = 0; i < N; i++) {
    const a = rnd(i, 3) * TAU;
    const start: Vec = self ? polar(cx, cy, 70 + rnd(i, 4) * 30, a) : { x: to.x + srnd(i, 5) * 12, y: to.y - CHEST + srnd(i, 6) * 12 };
    const ctrl: Vec = self
      ? polar(cx, cy - 40, 110 + rnd(i, 7) * 30, a + 0.8)
      : { x: start.x + srnd(i, 8) * 70, y: start.y - 60 - rnd(i, 9) * 60 };
    const delay = rnd(i, 10) * 0.25;
    const p = easeIn(seg(k, delay, delay + 0.6)) ** 0.6;
    if (p >= 1) continue;
    const q = 1 - p;
    const x = q * q * start.x + 2 * q * p * ctrl.x + p * p * cx;
    const y = q * q * start.y + 2 * q * p * ctrl.y + p * p * cy;
    const s = (5 + rnd(i, 11) * 6) * (1 - p * 0.6);
    const rot = (k * 720 + i * 47) % 360;
    chunks.push(
      <g key={i} transform={`translate(${f(x)},${f(y)}) rotate(${f(rot)})`} opacity={f(seg(k, delay, delay + 0.05))}>
        <ellipse rx={f(s * 1.5)} ry={f(s * 1.5)} fill="#7dff5a" opacity={0.18} />
        <path d={`M${f(-s)} ${f(-s * 0.4)} Q0 ${f(-s * 1.2)} ${f(s)} ${f(-s * 0.3)} Q${f(s * 1.1)} ${f(s * 0.6)} 0 ${f(s * 0.8)} Q${f(-s * 1.2)} ${f(s * 0.5)} ${f(-s)} ${f(-s * 0.4)}Z`} fill="#5c8f2a" stroke="#b6ff6a" strokeWidth={1.5} />
        <circle cx={f(s * 0.2)} cy={f(-s * 0.1)} r={f(s * 0.35)} fill="#c2485a" />
      </g>,
    );
  }
  const absorb = bump(seg(k, 0.45, 1));
  const txt = seg(k, 0.55, 1);
  return (
    <g>
      {!self ? <Sparks x={to.x} y={to.y - CHEST} n={10} seed={2} k={seg(k, 0, 0.35)} reach={50} color="#6bdc3c" width={3} gravity={30} /> : null}
      <Glow x={cx} y={cy} r={60 * absorb + 10} color="#6bff4a" opacity={absorb * 0.9} core="#eaffd8" />
      <Ring x={cx} y={cy} r={lerp(70, 20, seg(k, 0.4, 0.9))} color="#8dff5a" width={3} opacity={bump(seg(k, 0.4, 0.95)) * 0.8} />
      {chunks}
      {txt > 0 ? (
        <text
          x={f(cx)}
          y={f(cy - 50 - easeOut(txt) * 30)}
          textAnchor="middle"
          fontSize={22}
          fontWeight={900}
          fontFamily="sans-serif"
          fill="#c9ff8a"
          stroke="#1f4a0c"
          strokeWidth={3}
          paintOrder="stroke"
          opacity={f(Math.min(1, txt * 5) * (1 - seg(txt, 0.7, 1)))}
        >
          +STR
        </text>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ counter_helix
// spinning red axe-blur ring around Axe.
const ellArc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, steps = 14): string => {
  const pts: Vec[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = lerp(a0, a1, i / steps);
    pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return pathOf(pts);
};

export const CounterHelix: VfxArt = ({ t, duration, from, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 95;
  const cx = from.x;
  const cy = from.y - 28;
  const ry = R * 0.42;
  const spin = easeOut(k) * TAU * 2.2; // two+ turns, slowing down
  const env = envelope(k, 0.08, 0.35);
  const grow = 0.55 + 0.45 * easeOut(seg(k, 0, 0.25));
  const rx = R * grow;
  const ryy = ry * grow;
  const blades: ReactNode[] = [];
  for (let b = 0; b < 2; b++) {
    const lead = spin + b * Math.PI;
    for (let j = 0; j < 4; j++) {
      const len = 1.6 - j * 0.3;
      blades.push(
        <path
          key={`${b}-${j}`}
          d={ellArc(cx, cy, rx * (1 - j * 0.07), ryy * (1 - j * 0.07), lead - len, lead)}
          fill="none"
          stroke={j === 0 ? '#ff2a1a' : '#b3120a'}
          strokeWidth={f((14 - j * 3) * env)}
          strokeOpacity={f(env * (0.75 - j * 0.15))}
          strokeLinecap="round"
        />,
      );
    }
    // axe head at leading edge
    const hx = cx + Math.cos(lead) * rx;
    const hy = cy + Math.sin(lead) * ryy;
    const tang = (Math.atan2(Math.cos(lead) * ryy, -Math.sin(lead) * rx) * 180) / Math.PI;
    blades.push(
      <g key={`h${b}`} transform={`translate(${f(hx)},${f(hy)}) rotate(${f(tang)})`} opacity={f(env)}>
        <path d="M-6 -4 Q8 -18 18 -2 Q10 2 18 8 Q6 16 -6 4 Z" fill="#d9d2c7" stroke="#ff4b2b" strokeWidth={2} />
        <path d="M2 -6 Q10 -12 16 -2" fill="none" stroke="#fff" strokeWidth={1.5} />
      </g>,
    );
  }
  return (
    <g>
      <ellipse cx={f(cx)} cy={f(from.y)} rx={f(rx * 1.05)} ry={f(ryy * 0.7)} fill="#ff2a1a" opacity={f(0.12 * env)} />
      <ellipse cx={f(cx)} cy={f(cy)} rx={f(rx)} ry={f(ryy)} fill="none" stroke="#ff5a3a" strokeWidth={2} strokeOpacity={f(0.35 * env)} strokeDasharray="10 14" strokeDashoffset={f(-spin * 40)} />
      {blades}
      <Sparks x={cx} y={cy} n={14} seed={9} k={seg(k, 0.05, 0.6)} reach={R * 1.2} color="#ff7a4a" width={2.5} />
    </g>
  );
};

// ------------------------------------------------------------------ enrage
export const Enrage: VfxArt = ({ t, duration, from }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const cx = from.x;
  const cy = from.y - CHEST;
  const env = envelope(k, 0.05, 0.4);
  const rings: ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const p = seg(k, i * 0.1, 0.45 + i * 0.1);
    if (p <= 0 || p >= 1) continue;
    rings.push(<Ring key={i} x={cx} y={cy} r={20 + easeOut(p) * (110 + i * 20)} color={i === 0 ? '#ff3b2a' : '#ff7b3a'} width={8 * (1 - p)} opacity={1 - p} />);
  }
  // burning aura flames rising around the body
  const flames: ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const phase = (t * 1.8 + rnd(i, 21)) % 1;
    const ox = srnd(i, 22) * 30;
    const h = 18 + rnd(i, 23) * 18;
    const fx = cx + ox;
    const fy = from.y - 10 - phase * 70;
    const s = 1 - phase;
    flames.push(
      <path
        key={i}
        d={`M${f(fx - 6 * s)} ${f(fy)} Q${f(fx)} ${f(fy - h * s * 1.4)} ${f(fx + 6 * s)} ${f(fy)} Q${f(fx)} ${f(fy + 5)} ${f(fx - 6 * s)} ${f(fy)}Z`}
        fill={i % 2 ? '#ff4a1a' : '#ff9a3a'}
        opacity={f(env * s * 0.85)}
      />,
    );
  }
  // claw burst: three raking slashes on each side
  const claw = seg(k, 0.05, 0.4);
  const claws: ReactNode[] = [];
  for (let side = -1; side <= 1; side += 2) {
    for (let j = 0; j < 3; j++) {
      claws.push(
        <Slash
          key={`${side}${j}`}
          x={cx + side * (22 + j * 2)}
          y={cy - 10 + j * 13}
          rot={side * 62 + 180 * (side < 0 ? 1 : 0)}
          L={60}
          w={8}
          p={easeOut(claw)}
          color="#ff2a1a"
          opacity={bump(clamp01(claw * 0.9 + 0.1)) * 1}
          bend={0.12}
        />,
      );
    }
  }
  const roar = bump(seg(k, 0, 0.3));
  return (
    <g>
      <Glow x={cx} y={cy} r={80} color="#ff2a1a" opacity={env * 0.6 + roar * 0.4} core="#ffd2b0" />
      {rings}
      {flames}
      {claws}
      <Sparks x={cx} y={cy} n={16} seed={31} k={seg(k, 0, 0.5)} reach={120} color="#ffb070" width={3} />
    </g>
  );
};

// ------------------------------------------------------------------ essence_shift
// blue-green wisps fly from the hit target (to) into Slark (from).
export const EssenceShift: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const end: Vec = { x: from.x, y: from.y - CHEST };
  const d0 = dir(from, to, team);
  const start: Vec = dist(from, to) < 1 ? { x: from.x + d0.x * 90, y: from.y - CHEST - 10 } : { x: to.x, y: to.y - CHEST };
  const n = { x: -(end.y - start.y), y: end.x - start.x };
  const nl = Math.hypot(n.x, n.y) || 1;
  const wisps: ReactNode[] = [];
  for (let w = 0; w < 3; w++) {
    const delay = w * 0.12;
    const p = seg(k, delay, delay + 0.65);
    if (p <= 0 || p >= 1) continue;
    const pos = (pp: number): Vec => {
      const e = easeIn(pp) * 0.6 + pp * 0.4;
      const wob = Math.sin(pp * Math.PI * 2 + w * 2) * 28 * Math.sin(Math.PI * pp);
      return { x: lerp(start.x, end.x, e) + (n.x / nl) * wob, y: lerp(start.y, end.y, e) + (n.y / nl) * wob - Math.sin(Math.PI * pp) * 30 };
    };
    const tail: Vec[] = [];
    for (let i = 0; i <= 8; i++) tail.push(pos(Math.max(0, p - i * 0.035)));
    const head = tail[0]!;
    wisps.push(
      <g key={w}>
        <GlowPath d={pathOf(tail)} color="#3ce0c8" core="#d8fff6" width={4} opacity={0.8} layers={2} />
        <Glow x={head.x} y={head.y} r={16} color="#4af0ff" core="#ffffff" />
      </g>,
    );
  }
  const arrive = bump(seg(k, 0.6, 1));
  return (
    <g>
      <Glow x={start.x} y={start.y} r={26} color="#2fa6c8" opacity={bump(seg(k, 0, 0.35))} />
      {wisps}
      <Ring x={end.x} y={end.y} r={20 + arrive * 20} color="#5af0d8" width={3} opacity={arrive * 0.8} />
      <Glow x={end.x} y={end.y} r={36} color="#3cd0e8" opacity={arrive * 0.7} />
    </g>
  );
};

// ------------------------------------------------------------------ coup_de_grace
export const CoupDeGrace: VfxArt = ({ t, duration, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const cx = to.x;
  const cy = to.y - CHEST;
  const fade = 1 - seg(k, 0.6, 1);
  const s1 = easeOut(seg(k, 0, 0.12));
  const s2 = easeOut(seg(k, 0.08, 0.2));
  const flash = bump(seg(k, 0.06, 0.3));
  const drops: ReactNode[] = [];
  const bk = seg(k, 0.08, 0.85);
  if (bk > 0 && bk < 1) {
    for (let i = 0; i < 18; i++) {
      const a = rnd(i, 41) * TAU;
      const sp = 40 + rnd(i, 42) * 70;
      const x = cx + Math.cos(a) * sp * easeOut(bk);
      const y = cy + Math.sin(a) * sp * easeOut(bk) * 0.7 + 90 * bk * bk;
      const r = (2 + rnd(i, 43) * 4) * (1 - bk * 0.5);
      drops.push(<circle key={i} cx={f(x)} cy={f(y)} r={f(r)} fill={i % 3 ? '#b50d16' : '#ff3340'} opacity={f(1 - bk)} />);
    }
  }
  // blood splat on ground
  const splat = easeOut(seg(k, 0.15, 0.4));
  return (
    <g>
      <rect x={0} y={0} width={1000} height={600} fill="#ff1020" opacity={f(flash * 0.12)} />
      <ellipse cx={f(cx)} cy={f(to.y)} rx={f(36 * splat)} ry={f(9 * splat)} fill="#7a0a10" opacity={f(0.7 * fade)} />
      <Glow x={cx} y={cy} r={90} color="#ff1a2a" opacity={flash} core="#fff0f0" />
      <Slash x={cx} y={cy} rot={-40} L={130} w={16} p={s1} color="#ff1a2a" opacity={fade} bend={0.12} />
      <Slash x={cx} y={cy} rot={40} L={130} w={16} p={s2} color="#ff1a2a" opacity={fade} bend={0.12} />
      {drops}
      <Sparks x={cx} y={cy} n={12} seed={44} k={seg(k, 0.08, 0.45)} reach={80} color="#ffd0d0" width={2} />
      {k > 0.08 ? (
        <text
          x={f(cx)}
          y={f(cy - 50 - easeOut(seg(k, 0.1, 0.5)) * 20)}
          textAnchor="middle"
          fontSize={24}
          fontWeight={900}
          fontFamily="sans-serif"
          fontStyle="italic"
          fill="#ff3340"
          stroke="#2a0004"
          strokeWidth={3}
          paintOrder="stroke"
          opacity={f(fade)}
        >
          CRIT!
        </text>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ omnislash
export const Omnislash: VfxArt = ({ t, duration, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const cx = to.x;
  const cy = to.y - CHEST;
  const n = Math.max(10, Math.round(duration * 12));
  const life = 0.14;
  const span = Math.max(0.01, duration * 0.92 - life);
  const slashes: ReactNode[] = [];
  const ghosts: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = (i / n) * span;
    const p = (t - t0) / life;
    if (p <= 0 || p >= 1) continue;
    const rot = rnd(i, 51) * 360;
    const ox = srnd(i, 52) * 22;
    const oy = srnd(i, 53) * 26;
    slashes.push(
      <Slash key={i} x={cx + ox} y={cy + oy} rot={rot} L={90 + rnd(i, 54) * 40} w={7} p={easeOut(p * 1.6)} color={i % 2 ? '#8fd8ff' : '#ffffff'} opacity={1 - easeIn(p)} bend={0.1} />,
    );
    // afterimage of juggernaut blinking around the target
    const ga = rnd(i, 55) * TAU;
    const gx = cx + Math.cos(ga) * 55;
    const gy = to.y + Math.sin(ga) * 14;
    const gs = Math.cos(ga) > 0 ? -1 : 1;
    ghosts.push(
      <g key={`g${i}`} transform={`translate(${f(gx)},${f(gy)}) scale(${gs},1)`} opacity={f((1 - p) * 0.55)}>
        <ellipse cx={0} cy={-34} rx={14} ry={26} fill="#6cc8ff" opacity={0.5} />
        <circle cx={2} cy={-66} r={9} fill="#a8e4ff" opacity={0.6} />
        <path d="M8 -40 L46 -58" stroke="#e8f8ff" strokeWidth={3} strokeLinecap="round" />
      </g>,
    );
  }
  const env = envelope(k, 0.05, 0.15);
  return (
    <g>
      <Glow x={cx} y={cy} r={70} color="#5ab8ff" opacity={env * 0.55} />
      <Ring x={cx} y={to.y} r={60} color="#8fd8ff" width={2} opacity={env * 0.5} dash="4 10" />
      {ghosts}
      {slashes}
      <Sparks x={cx} y={cy} n={8} seed={Math.floor(t / 0.1)} k={(t % 0.1) / 0.1} reach={60} color="#e8f8ff" width={2} />
    </g>
  );
};
