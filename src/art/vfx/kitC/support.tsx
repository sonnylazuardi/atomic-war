// Kit-C VFX: crystal maiden arcane_aura; dazzle poison_touch, shadow_wave, bad_juju.
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { VfxArt } from '../../types.ts';
import { bump, easeIn, easeOut, lerp } from '../../types.ts';
import { Glow, GlowPath, Ring, Sparks, TAU, envelope, f, pathOf, polar, prog, rnd, seg, srnd } from '../sig/fxkit.tsx';
import { CHEST, HAND, aim, twinkle } from './kit.tsx';

/** quadratic arc points a -> b lifted by `lift` */
const arcPts = (a: Vec, b: Vec, lift: number, n = 14): Vec[] => {
  const out: Vec[] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    out.push({ x: lerp(a.x, b.x, s), y: lerp(a.y, b.y, s) - Math.sin(Math.PI * s) * lift });
  }
  return out;
};
const along = (pts: Vec[], s: number): Vec => {
  const fi = Math.max(0, Math.min(pts.length - 1, s * (pts.length - 1)));
  const i = Math.floor(fi);
  const j = Math.min(pts.length - 1, i + 1);
  const r = fi - i;
  return { x: lerp(pts[i]!.x, pts[j]!.x, r), y: lerp(pts[i]!.y, pts[j]!.y, r) };
};
const slice = (pts: Vec[], s0: number, s1: number, n = 10): Vec[] => {
  const out: Vec[] = [];
  for (let i = 0; i <= n; i++) out.push(along(pts, lerp(s0, s1, i / n)));
  return out;
};

// ------------------------------------------------------------------ arcane_aura
export const ArcaneAuraVfx: VfxArt = ({ t, duration, from }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const env = envelope(k, 0.1, 0.4);
  const cx = from.x;
  const cy = from.y;
  const grow = easeOut(seg(k, 0, 0.5));
  const rx = 30 + grow * 46;
  const ry = rx * 0.38;
  const runes: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + k * 1.6;
    const px = cx + Math.cos(a) * rx * 0.86;
    const py = cy + Math.sin(a) * ry * 0.86;
    runes.push(<path key={i} d={twinkle(4)} transform={`translate(${f(px)},${f(py)}) rotate(45)`} fill="#dff2ff" opacity={0.9} />);
  }
  const motes: ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const ph = (rnd(i, 81) * 0.6 + k) % 1;
    const a = rnd(i, 82) * TAU;
    const rr = rnd(i, 83) * rx;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr * 0.38 - ph * 90;
    motes.push(<path key={i} d={twinkle(2.5 + rnd(i, 84) * 3)} transform={`translate(${f(x)},${f(y)})`} fill={i % 3 ? '#8fd0ff' : '#ffffff'} opacity={f(bump(ph) * env)} />);
  }
  const pulse = seg(k, 0.1, 0.8);
  return (
    <g>
      <ellipse cx={f(cx)} cy={f(cy)} rx={f(rx)} ry={f(ry)} fill="#3a8cff" opacity={f(env * 0.16)} />
      <ellipse cx={f(cx)} cy={f(cy)} rx={f(rx)} ry={f(ry)} fill="none" stroke="#8fd0ff" strokeWidth={2.4} opacity={f(env)} />
      <ellipse cx={f(cx)} cy={f(cy)} rx={f(rx * 0.72)} ry={f(ry * 0.72)} fill="none" stroke="#dff2ff" strokeWidth={1} strokeDasharray="5 4" opacity={f(env * 0.8)} />
      {pulse > 0 && pulse < 1 ? (
        <ellipse cx={f(cx)} cy={f(cy)} rx={f(rx + easeOut(pulse) * 120)} ry={f((rx + easeOut(pulse) * 120) * 0.38)} fill="none" stroke="#6ab8ff" strokeWidth={f(3 * (1 - pulse))} opacity={f(1 - pulse)} />
      ) : null}
      <g opacity={f(env)}>{runes}</g>
      {/* diamond crest over the head */}
      <g transform={`translate(${f(cx)},${f(cy - 92 - bump(k) * 8)}) scale(${f(0.6 + 0.4 * grow)})`} opacity={f(env)}>
        <path d="M0 -14 L10 0 L0 14 L-10 0 Z" fill="#3a8cff" opacity={0.35} transform="scale(1.6)" />
        <path d="M0 -14 L10 0 L0 14 L-10 0 Z" fill="#6ab8ff" stroke="#e6f6ff" strokeWidth={1.6} />
        <path d="M0 -14 L4 0 L0 14 L-4 0 Z" fill="#e6f6ff" opacity={0.8} />
      </g>
      {motes}
    </g>
  );
};

// ------------------------------------------------------------------ poison_touch (green glob arcs, splash at target)
export const PoisonTouchVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const a: Vec = { x: from.x, y: from.y - HAND };
  const b: Vec = { x: to.x, y: to.y - CHEST };
  const far = Math.hypot(b.x - a.x, b.y - a.y) > 4;
  const pts = arcPts(a, b, far ? 40 : 0);
  const fly = easeIn(seg(k, 0, 0.35)) * 0.4 + seg(k, 0, 0.35) * 0.6;
  const hit = seg(k, 0.35, 1);
  const head = along(pts, fly);
  const trail = slice(pts, Math.max(0, fly - 0.35), fly);
  const d = aim(a, b, team);
  const drips: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const p = seg(hit, rnd(i, 91) * 0.3, 0.7 + rnd(i, 92) * 0.3);
    if (p <= 0 || p >= 1) continue;
    const x = b.x + srnd(i, 93) * 22;
    const y = b.y - 20 + srnd(i, 94) * 10 + easeIn(p) * 50;
    drips.push(<path key={i} d={`M${f(x)} ${f(y - 6)} Q${f(x + 3)} ${f(y)} ${f(x)} ${f(y + 2)} Q${f(x - 3)} ${f(y)} ${f(x)} ${f(y - 6)}Z`} fill="#7fe04a" opacity={f(1 - p)} />);
  }
  const bubbles: ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const p = seg(hit, 0.1 + rnd(i, 95) * 0.3, 1);
    if (p <= 0 || p >= 1) continue;
    const x = b.x + srnd(i, 96) * 18;
    const y = b.y + 10 - p * 50;
    bubbles.push(<circle key={i} cx={f(x)} cy={f(y)} r={f(2 + rnd(i, 97) * 3)} fill="none" stroke="#b6ff7a" strokeWidth={1.2} opacity={f(bump(p))} />);
  }
  return (
    <g>
      {fly > 0 && hit <= 0 ? (
        <g>
          <GlowPath d={pathOf(trail)} color="#5ac83a" core="#d8ff9a" width={4} opacity={0.85} layers={2} />
          <circle cx={f(head.x)} cy={f(head.y)} r={7} fill="#3f9a2a" />
          <circle cx={f(head.x)} cy={f(head.y)} r={4.5} fill="#9be05a" />
          <circle cx={f(head.x - 1.5)} cy={f(head.y - 1.5)} r={1.6} fill="#f0ffd0" />
        </g>
      ) : null}
      {hit > 0 && hit < 1 ? (
        <g>
          <Glow x={b.x} y={b.y} r={50} color="#6ad03a" opacity={(1 - hit) * 0.8} />
          <Sparks x={b.x} y={b.y} n={10} seed={98} k={seg(hit, 0, 0.6)} reach={48} color="#9be05a" width={2.4} arc={2.4} heading={Math.atan2(d.y, d.x)} gravity={20} />
          <ellipse cx={f(b.x)} cy={f(to.y)} rx={f(14 + easeOut(hit) * 16)} ry={f(5 + easeOut(hit) * 5)} fill="#4a9a2a" opacity={f((1 - hit) * 0.45)} />
          {/* skull wisp */}
          <g transform={`translate(${f(b.x)},${f(b.y - 40 - hit * 18)}) scale(1.5)`} opacity={f(bump(seg(hit, 0, 0.9)) * 0.85)}>
            <path d="M-7 -2 Q-7 -11 0 -11 Q7 -11 7 -2 Q7 3 4 4 L4 7 L-4 7 L-4 4 Q-7 3 -7 -2Z" fill="#9be05a" stroke="#2f6a1a" strokeWidth={1} />
            <circle cx={-2.8} cy={-3} r={1.8} fill="#1f3a12" />
            <circle cx={2.8} cy={-3} r={1.8} fill="#1f3a12" />
          </g>
          {drips}
          {bubbles}
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ shadow_wave (dark wave to an ally, heal + dark burst)
export const ShadowWaveVfx: VfxArt = ({ t, duration, from, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const a: Vec = { x: from.x, y: from.y - HAND };
  const b: Vec = { x: to.x, y: to.y - CHEST };
  const far = Math.hypot(b.x - a.x, b.y - a.y) > 4;
  const pts = arcPts(a, b, far ? 18 : 0, 18);
  const fly = easeOut(seg(k, 0, 0.3));
  const hit = seg(k, 0.28, 1);
  const R = radius > 0 ? radius : 120;
  // wave = two braided wavy strands
  const strand = (ph: number): Vec[] => {
    const out: Vec[] = [];
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const s = (i / n) * fly;
      const p = along(pts, s);
      const nx = -(b.y - a.y);
      const ny = b.x - a.x;
      const nl = Math.hypot(nx, ny) || 1;
      const off = Math.sin(s * 14 + ph + t * 12) * 7 * Math.sin(Math.PI * Math.min(1, s / Math.max(fly, 0.01)));
      out.push({ x: p.x + (nx / nl) * off, y: p.y + (ny / nl) * off });
    }
    return out;
  };
  const trailOp = 1 - seg(k, 0.3, 0.6);
  const shards: ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const p = seg(hit, 0, 0.7);
    if (p <= 0 || p >= 1) continue;
    const ang = rnd(i, 101) * TAU;
    const r = easeOut(p) * R * (0.6 + rnd(i, 102) * 0.4);
    const q = polar(to.x, to.y - 10, r, ang);
    shards.push(<path key={i} d="M0 -6 L3 0 L0 6 L-3 0Z" transform={`translate(${f(q.x)},${f(q.y)}) rotate(${f((ang * 180) / Math.PI + 90)})`} fill="#2a0a3a" stroke="#c88aff" strokeWidth={1} opacity={f(1 - p)} />);
  }
  const heals: ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const p = seg(hit, 0.1 + rnd(i, 103) * 0.3, 1);
    if (p <= 0 || p >= 1) continue;
    const x = to.x + srnd(i, 104) * 20;
    const y = to.y - 20 - p * 60;
    heals.push(
      <g key={i} transform={`translate(${f(x)},${f(y)})`} opacity={f(bump(p))}>
        <path d="M-1.6 -5 h3.2 v3.4 h3.4 v3.2 h-3.4 v3.4 h-3.2 v-3.4 h-3.4 v-3.2 h3.4z" fill="#d6b0ff" />
      </g>,
    );
  }
  const burst = seg(hit, 0, 0.7);
  return (
    <g>
      {trailOp > 0 && fly > 0 ? (
        <g opacity={f(trailOp)}>
          <GlowPath d={pathOf(strand(0))} color="#7a2acf" core="#e0c0ff" width={3.5} layers={2} />
          <GlowPath d={pathOf(strand(Math.PI))} color="#3a0a6a" core="#b06aff" width={2.5} layers={1} />
        </g>
      ) : null}
      {hit > 0 && hit < 1 ? (
        <g>
          <circle cx={f(to.x)} cy={f(to.y)} r={f(R * easeOut(burst))} fill="#2a0a3a" opacity={f((1 - burst) * 0.25)} />
          <Ring x={to.x} y={to.y} r={R * easeOut(burst)} color="#b06aff" width={4 * (1 - burst)} opacity={1 - burst} />
          <Glow x={b.x} y={b.y} r={40} color="#b06aff" opacity={(1 - hit) * 0.9} core="#f2e4ff" />
          {shards}
          {heals}
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ bad_juju (voodoo mask + armor-rending curse aura)
export const BadJujuVfx: VfxArt = ({ t, duration, from }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const env = envelope(k, 0.08, 0.35);
  const cx = from.x;
  const cy = from.y;
  const rise = easeOut(seg(k, 0, 0.4));
  const my = cy - 96 - rise * 14;
  const wave = seg(k, 0.15, 0.85);
  const W = 70 + easeOut(wave) * 160;
  const sig: ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU - k * 2.2;
    const px = cx + Math.cos(a) * W * 0.95;
    const py = cy + Math.sin(a) * W * 0.95 * 0.36;
    sig.push(<path key={i} d="M0 -5 L4 0 L0 5 L-4 0Z M-7 0 h3 M4 0 h3" transform={`translate(${f(px)},${f(py)})`} fill="#e0a0ff" stroke="#e0a0ff" strokeWidth={1} opacity={f((1 - wave) * 0.9)} />);
  }
  const wisps: ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const ph = (rnd(i, 111) + k * 1.2) % 1;
    const a = rnd(i, 112) * TAU + ph * 3;
    const r = 18 + ph * 26;
    const x = cx + Math.cos(a) * r;
    const y = cy - 10 - ph * 80 + Math.sin(a) * r * 0.3;
    wisps.push(<circle key={i} cx={f(x)} cy={f(y)} r={f(2 + (1 - ph) * 4)} fill={i % 2 ? '#c45aff' : '#4a1a6a'} opacity={f(bump(ph) * env)} />);
  }
  const eyes = 0.6 + 0.4 * Math.sin(t * 22);
  return (
    <g>
      <ellipse cx={f(cx)} cy={f(cy)} rx={f(W)} ry={f(W * 0.36)} fill="#3a0a5a" opacity={f((1 - wave) * 0.18 * (wave > 0 ? 1 : 0))} />
      {wave > 0 && wave < 1 ? <ellipse cx={f(cx)} cy={f(cy)} rx={f(W)} ry={f(W * 0.36)} fill="none" stroke="#c45aff" strokeWidth={f(3.5 * (1 - wave))} opacity={f(1 - wave)} strokeDasharray="16 6" /> : null}
      {sig}
      {wisps}
      <Glow x={cx} y={my} r={46} color="#8a2acf" opacity={env * 0.7} />
      {/* voodoo mask */}
      <g transform={`translate(${f(cx)},${f(my)}) scale(${f(0.7 + 0.3 * rise)})`} opacity={f(env)}>
        <path d="M-15 -16 Q0 -26 15 -16 Q20 0 12 16 Q0 26 -12 16 Q-20 0 -15 -16Z" fill="#2a0e3a" stroke="#e0a0ff" strokeWidth={2} />
        <path d="M-8 -22 L-12 -34 M0 -24 L0 -38 M8 -22 L12 -34" stroke="#c45aff" strokeWidth={3} strokeLinecap="round" />
        <path d="M-11 -4 L-3 -2 L-11 2Z M11 -4 L3 -2 L11 2Z" fill="#7dff5a" opacity={f(eyes)} />
        <path d="M-7 10 Q0 16 7 10" fill="none" stroke="#e0a0ff" strokeWidth={1.8} />
        <path d="M-5 9 v3 M0 10 v4 M5 9 v3" stroke="#e0a0ff" strokeWidth={1} />
        <path d="M-14 -8 Q-8 -12 -2 -8 M14 -8 Q8 -12 2 -8" fill="none" stroke="#c45aff" strokeWidth={1.4} />
      </g>
      <Sparks x={cx} y={my} n={10} seed={113} k={seg(k, 0.05, 0.5)} reach={60} color="#e0a0ff" width={2} />
      {/* cracked-shield glyph: armor torn away */}
      {wave > 0 && wave < 1 ? (
        <g transform={`translate(${f(cx + 46)},${f(cy - 70)})`} opacity={f(bump(wave))}>
          <path d="M0 -10 L8 -6 L7 4 Q4 10 0 12 Q-4 10 -7 4 L-8 -6Z" fill="#3a1a4a" stroke="#c45aff" strokeWidth={1.4} />
          <path d="M-1 -9 L2 -2 L-2 2 L1 10" fill="none" stroke="#ff6a8a" strokeWidth={1.6} />
        </g>
      ) : null}
    </g>
  );
};
