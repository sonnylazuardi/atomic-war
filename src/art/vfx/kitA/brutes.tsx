// Kit-A VFX: Pudge (Dismember), Axe (Berserker's Call), Ursa (Earthshock, Overpower),
// Juggernaut (Blade Fury, Healing Ward, Blade Dance). Pure t-driven, ARENA coordinates.
import type { ReactNode } from 'react';
import type { VfxArt, ZoneArt } from '../../types.ts';
import { bump, clamp01, easeIn, easeOut, lerp } from '../../types.ts';
import { Glow, GlowPath, Ring, Slash, Sparks, TAU, angleDeg, dir, envelope, f, pathOf, polar, prog, rnd, seg, srnd } from '../sig/fxkit.tsx';

const CHEST = 40;

/** ground ellipse ring (3/4 camera squash) */
const GRing = ({ x, y, r, color, width, opacity = 1, squash = 0.55, dash }: { x: number; y: number; r: number; color: string; width: number; opacity?: number; squash?: number; dash?: string }): ReactNode => {
  if (r <= 0 || opacity <= 0.001 || width <= 0) return null;
  return (
    <g fill="none" opacity={f(opacity)}>
      <ellipse cx={f(x)} cy={f(y)} rx={f(r)} ry={f(r * squash)} stroke={color} strokeWidth={f(width * 2.6)} strokeOpacity={0.18} strokeDasharray={dash} />
      <ellipse cx={f(x)} cy={f(y)} rx={f(r)} ry={f(r * squash)} stroke={color} strokeWidth={f(width)} strokeDasharray={dash} />
    </g>
  );
};

/** zone fade in/out envelope from seconds alive */
const zoneEnv = (t: number, duration: number, inn = 0.2, out = 0.35): number =>
  Math.min(clamp01(t / inn), duration > 0 ? clamp01((duration - t) / out) : 1);

// ------------------------------------------------------------------ dismember (pudge R)
// cast: cleaver slashes + gore burst on the victim
export const DismemberVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const cx = to.x;
  const cy = to.y - CHEST;
  const d = dir(from, to, team);
  const rot = angleDeg(d);
  const fade = 1 - seg(k, 0.6, 1);
  const flash = bump(seg(k, 0, 0.3));
  const drops: ReactNode[] = [];
  const bk = seg(k, 0.1, 0.95);
  if (bk > 0 && bk < 1) {
    for (let i = 0; i < 20; i++) {
      const a = rnd(i, 501) * TAU;
      const sp = 30 + rnd(i, 502) * 70;
      const x = cx + Math.cos(a) * sp * easeOut(bk);
      const y = cy + Math.sin(a) * sp * easeOut(bk) * 0.6 - 30 * bk + 110 * bk * bk;
      const r = (2 + rnd(i, 503) * 4) * (1 - bk * 0.5);
      drops.push(<circle key={i} cx={f(x)} cy={f(y)} r={f(r)} fill={i % 3 ? '#9a0c18' : '#ff3a48'} opacity={f(1 - bk)} />);
    }
  }
  // meat chunks torn toward the caster
  const chunks: ReactNode[] = [];
  const ck = seg(k, 0.15, 0.85);
  if (ck > 0 && ck < 1) {
    for (let i = 0; i < 5; i++) {
      const p = easeIn(ck) * 0.7 + ck * 0.3;
      const x = lerp(cx, from.x, p * 0.6) + srnd(i, 504) * 18;
      const y = lerp(cy, from.y - CHEST, p * 0.6) - Math.sin(Math.PI * ck) * (20 + rnd(i, 505) * 25);
      const s = 4 + rnd(i, 506) * 4;
      chunks.push(
        <g key={i} transform={`translate(${f(x)},${f(y)}) rotate(${f(k * 540 + i * 70)})`} opacity={f(1 - ck)}>
          <path d={`M${f(-s)} 0 Q0 ${f(-s * 1.2)} ${f(s)} ${f(-s * 0.2)} Q${f(s * 0.6)} ${f(s)} ${f(-s * 0.4)} ${f(s * 0.8)} Z`} fill="#b8323e" stroke="#ff8a8a" strokeWidth={1} />
        </g>,
      );
    }
  }
  const splat = easeOut(seg(k, 0.15, 0.45));
  return (
    <g pointerEvents="none">
      <ellipse cx={f(cx)} cy={f(to.y)} rx={f(44 * splat)} ry={f(12 * splat)} fill="#5a0610" opacity={f(0.75 * fade)} />
      <Glow x={cx} y={cy} r={80} color="#c3102a" opacity={flash} core="#ffd8d8" />
      <Slash x={cx} y={cy} rot={rot - 50} L={120} w={15} p={easeOut(seg(k, 0, 0.14))} color="#d0142a" opacity={fade} bend={0.18} />
      <Slash x={cx} y={cy - 6} rot={rot + 40} L={110} w={13} p={easeOut(seg(k, 0.1, 0.26))} color="#d0142a" opacity={fade} bend={0.18} />
      <Slash x={cx} y={cy + 8} rot={rot + 180} L={95} w={11} p={easeOut(seg(k, 0.2, 0.36))} color="#a30d20" opacity={fade} bend={0.2} />
      {chunks}
      {drops}
      <Sparks x={cx} y={cy} n={10} seed={507} k={seg(k, 0.05, 0.5)} reach={70} color="#ffb0b0" width={2} />
    </g>
  );
};

// channel: blood pool, pulsing gore at the chest each 0.5s tick, sinew strands
export const DismemberZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const env = zoneEnv(t, duration, 0.15, 0.3);
  if (env <= 0) return null;
  const R = Math.max(30, radius);
  const cy = y - CHEST;
  const tick = (t % 0.5) / 0.5;
  const tickN = Math.floor(t / 0.5);
  const beat = Math.exp(-tick * 5);
  const strands: ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const a0 = (i / 5) * TAU + t * 1.6;
    const pts = [];
    for (let s = 0; s <= 8; s++) {
      const q = s / 8;
      const a = a0 + q * 2.2;
      const rr = 14 + q * 26 + Math.sin(t * 6 + i + q * 4) * 4;
      pts.push({ x: x + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * 0.75 - q * 6 });
    }
    strands.push(<path key={i} d={pathOf(pts)} fill="none" stroke={i % 2 ? '#7a0a16' : '#c42838'} strokeWidth={3 - (i % 2)} strokeOpacity={f(0.85 * env)} strokeLinecap="round" />);
  }
  const drops: ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const period = 0.6 + rnd(i, 511) * 0.5;
    const ph = ((t + rnd(i, 512) * period) % period) / period;
    const a = srnd(i, 513) * 1.2 - Math.PI / 2;
    const sp = 30 + rnd(i, 514) * 30;
    const dx = x + Math.cos(a) * sp * ph;
    const dy = cy + Math.sin(a) * sp * ph + 70 * ph * ph;
    drops.push(<circle key={i} cx={f(dx)} cy={f(dy)} r={f(2 + rnd(i, 515) * 2.5)} fill={i % 3 ? '#a10e1c' : '#ff4050'} opacity={f(env * (1 - ph))} />);
  }
  const pool = 0.6 + 0.4 * clamp01(t / 1.5);
  return (
    <g pointerEvents="none">
      <ellipse cx={f(x)} cy={f(y)} rx={f(R * 1.5 * pool)} ry={f(R * 0.5 * pool)} fill="#4a0510" opacity={f(0.7 * env)} />
      <ellipse cx={f(x - 6)} cy={f(y - 2)} rx={f(R * 0.8 * pool)} ry={f(R * 0.22 * pool)} fill="#8a1020" opacity={f(0.55 * env)} />
      <GRing x={x} y={y} r={R * 1.3} color="#ff3040" width={1.5} opacity={env * (0.3 + 0.5 * beat)} squash={0.35} />
      <Glow x={x} y={cy} r={46 + beat * 18} color="#c0102a" opacity={env * (0.45 + 0.5 * beat)} core="#ffd0d0" />
      {strands}
      <Slash x={x} y={cy} rot={(tickN * 67) % 360} L={70} w={9} p={easeOut(seg(tick, 0, 0.3))} color="#e0142c" opacity={env * (1 - seg(tick, 0.3, 0.8))} bend={0.2} />
      {drops}
    </g>
  );
};

// ------------------------------------------------------------------ berserkers_call (axe Q)
export const BerserkersCallVfx: VfxArt = ({ t, duration, from, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 170;
  const cx = from.x;
  const hy = from.y - 62;
  const rings: ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const p = seg(k, i * 0.12, 0.55 + i * 0.12);
    if (p <= 0 || p >= 1) continue;
    rings.push(<GRing key={i} x={cx} y={from.y} r={20 + easeOut(p) * R} color={i === 0 ? '#ff3a22' : '#ff7a3a'} width={7 * (1 - p) + 1} opacity={1 - p} squash={0.5} />);
  }
  // roar sound-wave arcs bursting from the mouth
  const arcs: ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const p = seg(k, i * 0.08, 0.5 + i * 0.08);
    if (p <= 0 || p >= 1) continue;
    const r = 14 + easeOut(p) * 70;
    for (const side of [-1, 1]) {
      const a0 = side > 0 ? -0.7 : Math.PI - 0.7;
      const a1 = a0 + 1.4;
      const p0 = polar(cx, hy, r, a0);
      const p1 = polar(cx, hy, r, a1);
      arcs.push(
        <path key={`${i}${side}`} d={`M${f(p0.x)} ${f(p0.y)} A${f(r)} ${f(r)} 0 0 1 ${f(p1.x)} ${f(p1.y)}`} fill="none" stroke="#ffd0a0" strokeWidth={f(4 * (1 - p) + 1)} strokeOpacity={f(1 - p)} strokeLinecap="round" />,
      );
    }
  }
  // taunt marks over enemies in range (indicative, deterministic around the ring)
  const marks: ReactNode[] = [];
  const mk = seg(k, 0.25, 1);
  if (mk > 0 && mk < 1) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.4;
      const p = polar(cx, from.y - 40, R * 0.75, a);
      const py = from.y - 40 + (p.y - (from.y - 40)) * 0.5 - 30 - easeOut(mk) * 12;
      marks.push(
        <text key={i} x={f(p.x)} y={f(py)} textAnchor="middle" fontSize={18} fontWeight={900} fontFamily="sans-serif" fill="#ff4a2a" stroke="#2a0400" strokeWidth={3} paintOrder="stroke" opacity={f(bump(mk) * 0.9)}>
          !
        </text>,
      );
    }
  }
  // armor shield pop over Axe
  const sh = seg(k, 0.15, 1);
  const shS = 0.6 + 0.4 * easeOut(seg(sh, 0, 0.3));
  const shY = hy - 30 - easeOut(sh) * 10;
  return (
    <g pointerEvents="none">
      <ellipse cx={f(cx)} cy={f(from.y)} rx={f(R)} ry={f(R * 0.5)} fill="#ff2a12" opacity={f(0.1 * bump(seg(k, 0, 0.7)))} />
      {rings}
      <Glow x={cx} y={hy} r={50} color="#ff3a1a" opacity={bump(seg(k, 0, 0.4))} core="#fff0d0" />
      {arcs}
      {marks}
      {sh > 0 && sh < 1 ? (
        <g transform={`translate(${f(cx)},${f(shY)}) scale(${f(shS)})`} opacity={f(envelope(sh, 0.1, 0.35))}>
          <path d="M0 -16 L13 -11 Q13 6 0 16 Q-13 6 -13 -11 Z" fill="#7a2416" stroke="#ffb070" strokeWidth={2.5} />
          <path d="M0 -10 L0 10 M-7 -2 L7 -2" stroke="#ffd8a8" strokeWidth={2} />
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ earthshock (ursa Q)
export const EarthshockVfx: VfxArt = ({ t, duration, from, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 200;
  const cx = from.x;
  const cy = from.y;
  const fade = 1 - seg(k, 0.55, 1);
  const crack = easeOut(seg(k, 0.02, 0.3));
  const cracks: ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + srnd(i, 601) * 0.25;
    const len = R * (0.55 + rnd(i, 602) * 0.4) * crack;
    const pts = [{ x: cx, y: cy }];
    for (let s = 1; s <= 5; s++) {
      const q = s / 5;
      const aa = a + srnd(i * 7 + s, 603) * 0.18;
      pts.push({ x: cx + Math.cos(aa) * len * q, y: cy + Math.sin(aa) * len * q * 0.55 });
    }
    cracks.push(<GlowPath key={i} d={pathOf(pts)} color="#ff9a3a" core="#ffe0a0" width={2.5} opacity={fade} layers={2} />);
  }
  const rocks: ReactNode[] = [];
  const rk = seg(k, 0.05, 0.85);
  if (rk > 0 && rk < 1) {
    for (let i = 0; i < 14; i++) {
      const a = rnd(i, 604) * TAU;
      const sp = R * (0.3 + rnd(i, 605) * 0.6);
      const up = 50 + rnd(i, 606) * 60;
      const x = cx + Math.cos(a) * sp * rk;
      const y = cy + Math.sin(a) * sp * rk * 0.55 - up * 4 * rk * (1 - rk);
      const s = 3 + rnd(i, 607) * 5;
      rocks.push(
        <rect key={i} x={f(x - s / 2)} y={f(y - s / 2)} width={f(s)} height={f(s * 0.8)} fill={i % 2 ? '#7a5532' : '#a8743a'} stroke="#3a2614" strokeWidth={1} transform={`rotate(${f(rk * 400 + i * 40)},${f(x)},${f(y)})`} opacity={f(1 - rk * rk)} />,
      );
    }
  }
  const dust = seg(k, 0.05, 0.9);
  const puffs: ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const p = polar(cx, cy, R * (0.4 + 0.6 * easeOut(dust)), a);
    puffs.push(<circle key={i} cx={f(p.x)} cy={f(cy + (p.y - cy) * 0.55 - 8)} r={f(14 + 16 * dust)} fill="#c9a678" opacity={f(0.3 * (1 - dust))} />);
  }
  // paw print at impact
  const paw = bump(seg(k, 0, 0.6));
  return (
    <g pointerEvents="none">
      <ellipse cx={f(cx)} cy={f(cy)} rx={f(R * easeOut(seg(k, 0, 0.35)))} ry={f(R * 0.55 * easeOut(seg(k, 0, 0.35)))} fill="#ff8a2a" opacity={f(0.14 * fade)} />
      {cracks}
      <GRing x={cx} y={cy} r={R * easeOut(seg(k, 0, 0.45))} color="#ffb060" width={6 * (1 - seg(k, 0, 0.6)) + 1} opacity={fade} />
      {puffs}
      <g transform={`translate(${f(cx)},${f(cy)}) scale(1,0.55)`} opacity={f(paw * 0.9)}>
        <ellipse cx={0} cy={6} rx={16} ry={12} fill="#5a3418" />
        {[-1, 0, 1].map((j) => (
          <ellipse key={j} cx={j * 14} cy={-14 - (j === 0 ? 4 : 0)} rx={6} ry={8} fill="#5a3418" />
        ))}
      </g>
      {rocks}
      <Glow x={cx} y={cy - 10} r={60} color="#ff9a3a" opacity={bump(seg(k, 0, 0.3))} core="#fff0c0" />
    </g>
  );
};

// ------------------------------------------------------------------ overpower (ursa W)
export const OverpowerVfx: VfxArt = ({ t, duration, from }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const cx = from.x;
  const cy = from.y - CHEST;
  const env = envelope(k, 0.08, 0.4);
  const streaks: ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const ph = (k * 2.2 + rnd(i, 701)) % 1;
    const x = cx + srnd(i, 702) * 30;
    const y = from.y - 6 - ph * 85;
    const L = 12 + rnd(i, 703) * 14;
    streaks.push(<line key={i} x1={f(x)} y1={f(y)} x2={f(x)} y2={f(y + L)} stroke={i % 3 ? '#ff8a2a' : '#ffe08a'} strokeWidth={2.5} strokeOpacity={f(env * (1 - ph))} strokeLinecap="round" />);
  }
  const claw = seg(k, 0.05, 0.45);
  const claws: ReactNode[] = [];
  for (let j = 0; j < 3; j++) {
    claws.push(<Slash key={j} x={cx + 6 + j * 8} y={cy - 12 + j * 12} rot={-35} L={56} w={7} p={easeOut(claw)} color="#ff5a1a" opacity={bump(clamp01(claw * 0.9 + 0.1))} bend={0.1} />);
  }
  // rising chevrons = attack speed
  const chev: ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const p = seg(k, 0.1 + i * 0.12, 0.7 + i * 0.12);
    if (p <= 0 || p >= 1) continue;
    const yy = from.y - 70 - easeOut(p) * 40;
    chev.push(<path key={i} d={`M${f(cx - 11)} ${f(yy + 7)} L${f(cx)} ${f(yy - 3)} L${f(cx + 11)} ${f(yy + 7)}`} fill="none" stroke="#ffd060" strokeWidth={3.5} strokeOpacity={f(bump(p))} strokeLinecap="round" strokeLinejoin="round" />);
  }
  return (
    <g pointerEvents="none">
      <GRing x={cx} y={from.y} r={26 + 22 * easeOut(seg(k, 0, 0.4))} color="#ff7a2a" width={3} opacity={env} squash={0.4} />
      <Glow x={cx} y={cy} r={55} color="#ff6a1a" opacity={env * 0.6} core="#fff0c8" />
      {streaks}
      {claws}
      {chev}
    </g>
  );
};

// ------------------------------------------------------------------ blade_fury (jugg Q)
export const BladeFuryVfx: VfxArt = ({ t, duration, from, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 150;
  const p = easeOut(k);
  return (
    <g pointerEvents="none">
      <GRing x={from.x} y={from.y} r={20 + R * p} color="#ffb04a" width={6 * (1 - k) + 1} opacity={1 - k} squash={0.45} />
      <Glow x={from.x} y={from.y - CHEST} r={60} color="#ffcf6a" opacity={bump(seg(k, 0, 0.6))} core="#ffffff" />
      <Sparks x={from.x} y={from.y - 30} n={16} seed={801} k={seg(k, 0, 0.8)} reach={R} color="#ffd890" width={2.5} />
    </g>
  );
};

const ellArc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, steps = 12): string => {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = lerp(a0, a1, i / steps);
    pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return pathOf(pts);
};

export const BladeFuryZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const env = zoneEnv(t, duration, 0.2, 0.35);
  if (env <= 0) return null;
  const R = Math.max(60, radius);
  const spin = t * TAU * 2.6;
  // whirlwind: stacked spinning ellipses from feet to head, narrowing upward
  const layers: ReactNode[] = [];
  for (let l = 0; l < 5; l++) {
    const q = l / 4;
    const ly = y - 6 - q * 70;
    const rx = lerp(R * 0.62, 26, q);
    const ry = rx * 0.32;
    const lead = spin * (1 + q * 0.3) + l * 1.1;
    layers.push(
      <path key={`a${l}`} d={ellArc(x, ly, rx, ry, lead - 2.2, lead)} fill="none" stroke={l % 2 ? '#ffb24a' : '#ffe2a0'} strokeWidth={f(4 - q * 2)} strokeOpacity={f(env * (0.75 - q * 0.3))} strokeLinecap="round" />,
      <path key={`b${l}`} d={ellArc(x, ly, rx, ry, lead + Math.PI - 1.6, lead + Math.PI)} fill="none" stroke="#ff8a2a" strokeWidth={f(3 - q * 1.5)} strokeOpacity={f(env * (0.6 - q * 0.25))} strokeLinecap="round" />,
    );
  }
  // the sword: a bright blade sweeping around at waist height
  const ba = spin * 1.15;
  const bx = x + Math.cos(ba) * R * 0.55;
  const by = y - 28 + Math.sin(ba) * R * 0.55 * 0.32;
  const tang = (Math.atan2(Math.cos(ba) * 0.32, -Math.sin(ba)) * 180) / Math.PI;
  const swordTrail = ellArc(x, y - 28, R * 0.55, R * 0.55 * 0.32, ba - 1.4, ba, 10);
  // dust kicked up at the ring edge
  const dust: ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const ph = (t * 1.4 + rnd(i, 811)) % 1;
    const a = rnd(i, 812) * TAU + t * 3;
    const p = polar(x, y, R * (0.7 + 0.3 * ph), a);
    dust.push(<circle key={i} cx={f(p.x)} cy={f(y + (p.y - y) * 0.4 - ph * 14)} r={f(5 + ph * 8)} fill="#d8b888" opacity={f(env * 0.3 * (1 - ph))} />);
  }
  const shimmer = 0.5 + 0.5 * Math.sin(t * 9);
  return (
    <g pointerEvents="none">
      <circle cx={f(x)} cy={f(y)} r={f(R)} fill="#ff9a2a" opacity={f(0.08 * env)} />
      <circle cx={f(x)} cy={f(y)} r={f(R)} fill="none" stroke="#ffc060" strokeWidth={2} strokeOpacity={f(0.45 * env)} strokeDasharray="14 10" strokeDashoffset={f(-t * 120)} />
      {dust}
      {/* spell-immune golden shell */}
      <ellipse cx={f(x)} cy={f(y - 40)} rx={34} ry={50} fill="#ffd36a" opacity={f(env * (0.1 + 0.06 * shimmer))} stroke="#ffe7a8" strokeWidth={1.5} strokeOpacity={f(env * 0.4)} />
      {layers}
      <GlowPath d={swordTrail} color="#ffcf6a" core="#ffffff" width={4} opacity={env * 0.85} layers={2} />
      <g transform={`translate(${f(bx)},${f(by)}) rotate(${f(tang)})`} opacity={f(env)}>
        <path d="M-4 -2 L22 -1 L28 0 L22 1 L-4 2 Z" fill="#eef4ff" stroke="#ffcf6a" strokeWidth={1} />
        <rect x={-8} y={-5} width={3} height={10} fill="#8a5a2a" />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ healing_ward (jugg W)
export const HealingWardVfx: VfxArt = ({ t, duration, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 220;
  const drop = easeIn(seg(k, 0, 0.35));
  const land = seg(k, 0.35, 1);
  const wy = lerp(to.y - 260, to.y, drop);
  return (
    <g pointerEvents="none">
      <rect x={f(to.x - 10 * (1 - land))} y={f(to.y - 300)} width={f(20 * (1 - land))} height={300} fill="#8affb0" opacity={f(0.35 * (1 - land))} />
      {land <= 0 ? <Glow x={to.x} y={wy - 20} r={22} color="#6aff9a" core="#ffffff" /> : null}
      <GRing x={to.x} y={to.y} r={20 + R * easeOut(land)} color="#6aff9a" width={5 * (1 - land) + 1} opacity={land > 0 ? 1 - land : 0} squash={1} />
      <Glow x={to.x} y={to.y - 20} r={50} color="#4af08a" opacity={bump(land)} core="#e8ffe8" />
      <Sparks x={to.x} y={to.y - 10} n={12} seed={901} k={land} reach={70} color="#b8ffc8" width={2} />
    </g>
  );
};

const plus = (x: number, y: number, s: number): string =>
  `M${f(x - s)} ${f(y)} L${f(x + s)} ${f(y)} M${f(x)} ${f(y - s)} L${f(x)} ${f(y + s)}`;

export const HealingWardZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const env = zoneEnv(t, duration, 0.25, 0.4);
  if (env <= 0) return null;
  const R = Math.max(60, radius);
  const pulses: ReactNode[] = [];
  for (let i = 0; i < 2; i++) {
    const ph = (t + i * 0.5) % 1;
    pulses.push(<circle key={i} cx={f(x)} cy={f(y)} r={f(18 + ph * (R - 18))} fill="none" stroke="#7affa8" strokeWidth={f(4 * (1 - ph) + 0.5)} strokeOpacity={f(env * 0.7 * (1 - ph))} />);
  }
  const crosses: ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const period = 1.2 + rnd(i, 911) * 0.8;
    const ph = ((t + rnd(i, 912) * period) % period) / period;
    const a = rnd(i, 913) * TAU;
    const d = R * Math.sqrt(rnd(i, 914)) * 0.9;
    const cx = x + Math.cos(a) * d;
    const cy = y + Math.sin(a) * d - ph * 40;
    crosses.push(<path key={i} d={plus(cx, cy, 4 + rnd(i, 915) * 2)} stroke="#b8ffcc" strokeWidth={2.5} strokeLinecap="round" opacity={f(env * bump(ph) * 0.9)} />);
  }
  // the ward totem
  const bob = Math.sin(t * 3) * 2;
  const flame = 1 + 0.15 * Math.sin(t * 13);
  const wy = y - 4;
  return (
    <g pointerEvents="none">
      <circle cx={f(x)} cy={f(y)} r={f(R)} fill="#3adf7a" opacity={f(0.08 * env)} />
      <circle cx={f(x)} cy={f(y)} r={f(R)} fill="none" stroke="#7affa8" strokeWidth={2} strokeOpacity={f(0.45 * env)} strokeDasharray="6 8" strokeDashoffset={f(t * 20)} />
      {pulses}
      {crosses}
      <g opacity={f(env)}>
        <ellipse cx={f(x)} cy={f(y)} rx={14} ry={5} fill="#000" opacity={0.3} />
        <path d={`M${f(x - 9)} ${f(wy)} Q${f(x - 12)} ${f(wy - 16)} ${f(x - 5)} ${f(wy - 22)} L${f(x + 5)} ${f(wy - 22)} Q${f(x + 12)} ${f(wy - 16)} ${f(x + 9)} ${f(wy)} Z`} fill="#6a4a2a" stroke="#c9a46a" strokeWidth={1.5} />
        <path d={`M${f(x - 10)} ${f(wy - 11)} L${f(x + 10)} ${f(wy - 11)}`} stroke="#3adf7a" strokeWidth={2} />
        <Glow x={x} y={wy - 30 + bob} r={22} color="#4af08a" core="#f0fff0" />
        <path
          d={`M${f(x - 6 * flame)} ${f(wy - 24 + bob)} Q${f(x)} ${f(wy - 24 - 22 * flame + bob)} ${f(x + 6 * flame)} ${f(wy - 24 + bob)} Q${f(x)} ${f(wy - 18 + bob)} ${f(x - 6 * flame)} ${f(wy - 24 + bob)} Z`}
          fill="#9affb8"
          stroke="#ffffff"
          strokeWidth={1}
        />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ blade_dance (jugg E, crit proc)
export const BladeDanceVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const self = Math.hypot(to.x - from.x, to.y - from.y) < 1;
  const d = dir(from, to, team);
  const cx = self ? from.x + d.x * 40 : to.x;
  const cy = (self ? from.y : to.y) - CHEST;
  const rot = angleDeg(d);
  const fade = 1 - seg(k, 0.55, 1);
  return (
    <g pointerEvents="none">
      <Glow x={cx} y={cy} r={60} color="#ff8a2a" opacity={bump(seg(k, 0, 0.5))} core="#fffbe8" />
      <Slash x={cx} y={cy} rot={rot - 30} L={100} w={13} p={easeOut(seg(k, 0, 0.25))} color="#ff8a2a" opacity={fade} bend={0.2} />
      <Slash x={cx} y={cy} rot={rot + 30} L={100} w={13} p={easeOut(seg(k, 0.12, 0.38))} color="#ffb04a" opacity={fade} bend={0.2} />
      <Ring x={cx} y={cy} r={14 + 40 * easeOut(seg(k, 0.1, 0.7))} color="#ffd070" width={3} opacity={1 - seg(k, 0.1, 0.7)} />
      <Sparks x={cx} y={cy} n={12} seed={1001} k={seg(k, 0.05, 0.7)} reach={75} color="#fff0b0" width={2.5} />
    </g>
  );
};
