// Kit-B VFX: Zeus (lightning_bolt, static_field) and Enigma (malefice, demonic_conversion, midnight_pulse).
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { VfxArt, ZoneArt } from '../../types.ts';
import { bump, clamp01, easeIn, easeOut, lerp } from '../../types.ts';
import { Glow, GlowPath, Ring, Sparks, TAU, boltPoints, envelope, f, pathOf, polar, prog, rnd, seg, srnd } from '../sig/fxkit.tsx';

const CHEST = 40;

// ------------------------------------------------------------------ lightning_bolt
export const LightningBoltVfx: VfxArt = ({ t, duration, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const top: Vec = { x: to.x + 30, y: Math.max(-30, to.y - 430) };
  const foot: Vec = { x: to.x, y: to.y - 6 };
  const strike = seg(k, 0, 0.1);
  const fade = 1 - seg(k, 0.25, 0.85);
  const flick = 0.75 + 0.25 * Math.sin(t * 90);
  const seed = Math.floor(t / 0.04);
  const tip: Vec = { x: lerp(top.x, foot.x, easeIn(strike)), y: lerp(top.y, foot.y, easeIn(strike)) };
  const out: ReactNode[] = [];
  // storm cloud
  const cloudO = envelope(k, 0.08, 0.4);
  for (let i = 0; i < 6; i++) {
    out.push(
      <circle
        key={`lb-c${i}`}
        cx={f(top.x + (i - 2.5) * 16 + srnd(i, 3) * 6)}
        cy={f(top.y - 6 + rnd(i, 4) * 10)}
        r={f(16 + rnd(i, 5) * 10)}
        fill={i % 2 ? '#3a4a6a' : '#4c5f86'}
        opacity={f(cloudO * 0.75)}
      />,
    );
  }
  if (strike > 0 && fade > 0) {
    const segs = Math.max(8, Math.round(Math.abs(tip.y - top.y) / 28));
    out.push(<GlowPath key="lb-m" d={pathOf(boltPoints(top, tip, segs, 22, seed))} color="#6fc8ff" core="#ffffff" width={6 * fade * flick + 1} opacity={fade} />);
    out.push(<GlowPath key="lb-s" d={pathOf(boltPoints(top, tip, segs, 34, seed + 7))} color="#9fdcff" width={1.6} opacity={fade * 0.6} layers={2} />);
    for (let i = 0; i < 3; i++) {
      const m = 0.3 + 0.5 * rnd(i, seed + 2);
      const s: Vec = { x: lerp(top.x, tip.x, m), y: lerp(top.y, tip.y, m) };
      const e = polar(s.x, s.y, 30 + 30 * rnd(i, seed + 3), Math.PI / 2 + srnd(i, seed + 4) * 1.2);
      out.push(<GlowPath key={`lb-f${i}`} d={pathOf(boltPoints(s, e, 4, 8, seed + 10 + i))} color="#8fd3ff" width={1.4} opacity={fade * 0.8} layers={1} />);
    }
  }
  const hit = seg(k, 0.1, 0.9);
  if (hit > 0) {
    out.push(<Glow key="lb-g" x={foot.x} y={foot.y - CHEST * 0.6} r={60 * (1 - hit * 0.5)} color="#7fd0ff" opacity={1 - hit} core="#ffffff" />);
    out.push(<ellipse key="lb-sc" cx={f(foot.x)} cy={f(to.y)} rx={f(28 + 30 * easeOut(hit))} ry={f(10 + 10 * easeOut(hit))} fill="#1a2440" opacity={f(0.45 * (1 - hit))} />);
    out.push(<Ring key="lb-r" x={foot.x} y={to.y} r={10 + 70 * easeOut(hit)} color="#9fdcff" width={4 * (1 - hit) + 0.3} opacity={1 - hit} />);
    out.push(<Sparks key="lb-sp" x={foot.x} y={to.y - 10} n={12} seed={17} k={seg(k, 0.1, 0.6)} reach={70} color="#d6f1ff" width={2.4} arc={Math.PI * 1.3} heading={-Math.PI / 2} gravity={40} />);
  }
  if (k < 0.12) out.push(<rect key="lb-fl" x={0} y={0} width={1000} height={600} fill="#cfeaff" opacity={f(0.12 * (1 - k / 0.12))} />);
  return <g pointerEvents="none">{out}</g>;
};

// ------------------------------------------------------------------ static_field
export const StaticFieldVfx: VfxArt = ({ t, duration, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 180;
  const c: Vec = { x: to.x, y: to.y - CHEST * 0.5 };
  const grow = easeOut(seg(k, 0, 0.45));
  const fade = 1 - seg(k, 0.35, 1);
  const seed = Math.floor(t / 0.05);
  const arcs: ReactNode[] = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + srnd(i, 21) * 0.3;
    const e = polar(c.x, c.y, R * grow * (0.75 + 0.25 * rnd(i, 22)), a);
    if (grow < 0.05) continue;
    arcs.push(<GlowPath key={`sf-a${i}`} d={pathOf(boltPoints(c, e, 5, 10, seed + i * 3))} color="#7fd8ff" width={1.6} opacity={fade * 0.85} layers={1} />);
    arcs.push(<circle key={`sf-n${i}`} cx={f(e.x)} cy={f(e.y)} r={f(3.5 * fade)} fill="#e8f8ff" opacity={f(fade)} />);
  }
  return (
    <g pointerEvents="none">
      <circle cx={f(c.x)} cy={f(c.y)} r={f(R * grow)} fill="#5ab8ff" opacity={f(0.12 * fade)} />
      <Ring x={c.x} y={c.y} r={R * grow} color="#8fdcff" width={3 * fade + 0.3} opacity={fade} dash="10 6" />
      {arcs}
      <Glow x={c.x} y={c.y} r={34} color="#7fd8ff" opacity={fade} core="#ffffff" />
      <path
        d={`M${f(c.x - 6)} ${f(c.y - 16)} L${f(c.x + 4)} ${f(c.y - 2)} L${f(c.x - 2)} ${f(c.y - 2)} L${f(c.x + 6)} ${f(c.y + 14)}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={f(bump(seg(k, 0, 0.6)))}
      />
    </g>
  );
};

// ------------------------------------------------------------------ malefice
export const MaleficeVfx: VfxArt = ({ t, duration, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const c: Vec = { x: to.x, y: to.y - CHEST };
  const o = envelope(k, 0.08, 0.2);
  const out: ReactNode[] = [];
  // ground sigil
  const sig = 34 + 6 * Math.sin(t * 4);
  const spokes: ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + t * 1.5;
    const p0 = polar(to.x, to.y, sig, a);
    const p1 = polar(to.x, to.y, sig * 0.45, a + 0.5);
    spokes.push(<line key={`mf-sp${i}`} x1={f(p0.x)} y1={f(p0.y * 1)} x2={f(p1.x)} y2={f(p1.y)} stroke="#a46bff" strokeWidth={2} strokeLinecap="round" />);
  }
  out.push(
    <g key="mf-sig" opacity={f(o * 0.85)} transform={`translate(0 ${f(to.y * 0.55)}) scale(1 0.45)`}>
      <circle cx={f(to.x)} cy={f(to.y)} r={f(sig + 8)} fill="#1a0833" opacity={0.6} />
      <circle cx={f(to.x)} cy={f(to.y)} r={f(sig)} fill="none" stroke="#8a4dff" strokeWidth={3} />
      {spokes}
    </g>,
  );
  // three curse pulses (one stun each in Dota)
  for (let p = 0; p < 3; p++) {
    const pk = seg(k, p * 0.3, p * 0.3 + 0.32);
    if (pk <= 0 || pk >= 1) continue;
    const r = 70 * (1 - easeOut(pk)) + 8;
    out.push(<Ring key={`mf-r${p}`} x={c.x} y={c.y} r={r} color="#9b5cff" width={4 * bump(pk) + 0.5} opacity={bump(pk)} />);
    out.push(<Glow key={`mf-g${p}`} x={c.x} y={c.y} r={40 * bump(seg(pk, 0.5, 1))} color="#7a3cff" opacity={bump(seg(pk, 0.5, 1))} core="#f2e6ff" />);
    // inward motes
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + p;
      const pp = polar(c.x, c.y, 80 * (1 - easeIn(pk)) + 6, a);
      out.push(<circle key={`mf-m${p}-${i}`} cx={f(pp.x)} cy={f(pp.y)} r={f(2.5 + 1.5 * pk)} fill="#d4b8ff" opacity={f(bump(pk))} />);
    }
  }
  // dark orb hovering over head
  const orbY = c.y - 52 + Math.sin(t * 6) * 3;
  out.push(<Glow key="mf-orb-g" x={c.x} y={orbY} r={26} color="#6a2fd6" opacity={o} />);
  out.push(<circle key="mf-orb" cx={f(c.x)} cy={f(orbY)} r={f(9 * o)} fill="#0d0420" stroke="#b07cff" strokeWidth={2} opacity={f(o)} />);
  out.push(<circle key="mf-orb-c" cx={f(c.x)} cy={f(orbY)} r={f(3 * o)} fill="#e2ccff" opacity={f(o)} />);
  return <g pointerEvents="none">{out}</g>;
};

// ------------------------------------------------------------------ demonic_conversion
const eidolon = (x: number, y: number, s: number, o: number, key: string, flip: number): ReactNode => (
  <g key={key} transform={`translate(${f(x)} ${f(y)}) scale(${f(s * flip)} ${f(s)})`} opacity={f(o)}>
    <path d="M0 -16 C10 -16 13 -6 12 4 C11 12 6 14 4 20 C2 14 -2 17 -4 22 C-6 15 -11 12 -12 4 C-13 -6 -10 -16 0 -16 Z" fill="#3a1670" stroke="#a97bff" strokeWidth={1.6} />
    <path d="M-5 -6 L-2 -3 M5 -6 L2 -3" stroke="#e7d8ff" strokeWidth={2} strokeLinecap="round" />
    <circle cx={-3.5} cy={-4} r={1.8} fill="#d9ff7a" />
    <circle cx={3.5} cy={-4} r={1.8} fill="#d9ff7a" />
  </g>
);

export const DemonicConversionVfx: VfxArt = ({ t, duration, from }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const rift = envelope(k, 0.12, 0.3);
  const out: ReactNode[] = [];
  out.push(
    <g key="dc-rift" transform={`translate(0 ${f(from.y * 0.55)}) scale(1 0.45)`} opacity={f(rift)}>
      <circle cx={f(from.x)} cy={f(from.y)} r={f(56 * easeOut(seg(k, 0, 0.2)))} fill="#12052a" opacity={0.75} />
      <circle cx={f(from.x)} cy={f(from.y)} r={f(56 * easeOut(seg(k, 0, 0.2)))} fill="none" stroke="#8a4dff" strokeWidth={4} strokeDasharray="14 8" transform={`rotate(${f(t * 120)} ${f(from.x)} ${f(from.y)})`} />
    </g>,
  );
  // three eidolons rise from the rift then dive into Enigma
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i - 1) * 1.2;
    const rise = easeOut(seg(k, 0.05 + i * 0.07, 0.4 + i * 0.07));
    const dive = easeIn(seg(k, 0.55 + i * 0.06, 0.85 + i * 0.05));
    if (rise <= 0) continue;
    const home = polar(from.x, from.y - 30, 52, a);
    const sx = lerp(from.x + Math.cos(a) * 30, home.x, rise);
    const sy = lerp(from.y, home.y - 10, rise) + Math.sin(t * 9 + i) * 3;
    const x = lerp(sx, from.x, dive);
    const y = lerp(sy, from.y - CHEST, dive);
    const o = 1 - dive;
    if (o <= 0.01) continue;
    out.push(<Glow key={`dc-g${i}`} x={x} y={y} r={22} color="#7b4bd6" opacity={o * 0.8} />);
    out.push(eidolon(x, y, 1 - dive * 0.6, o, `dc-e${i}`, i === 0 ? -1 : 1));
  }
  const absorb = seg(k, 0.75, 1);
  if (absorb > 0) {
    out.push(<Glow key="dc-burst" x={from.x} y={from.y - CHEST} r={50} color="#9b5cff" opacity={bump(absorb)} core="#f0e2ff" />);
    out.push(<Ring key="dc-ring" x={from.x} y={from.y - CHEST} r={20 + 40 * absorb} color="#c49bff" width={3 * (1 - absorb) + 0.3} opacity={1 - absorb} />);
  }
  // spiral motes
  for (let i = 0; i < 12; i++) {
    const ph = clamp01(k * 1.4 - rnd(i, 31) * 0.4);
    if (ph <= 0 || ph >= 1) continue;
    const a = rnd(i, 32) * TAU + ph * 4;
    const r = 60 * (1 - ph);
    const p = polar(from.x, from.y - CHEST, r, a);
    out.push(<circle key={`dc-m${i}`} cx={f(p.x)} cy={f(p.y)} r={2.2} fill="#cbb0ff" opacity={f(bump(ph))} />);
  }
  return <g pointerEvents="none">{out}</g>;
};

// ------------------------------------------------------------------ midnight_pulse
export const MidnightPulseVfx: VfxArt = ({ t, duration, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 180;
  const implode = seg(k, 0, 0.35);
  const burst = seg(k, 0.3, 1);
  return (
    <g pointerEvents="none">
      {implode < 1 ? <Ring x={to.x} y={to.y} r={R * 1.3 * (1 - easeIn(implode)) + 6} color="#7a45e0" width={3} opacity={bump(implode)} /> : null}
      <Glow x={to.x} y={to.y - 20} r={46} color="#4b1f9a" opacity={bump(seg(k, 0.15, 0.6))} core="#e8dcff" />
      {burst > 0 ? <Ring x={to.x} y={to.y} r={R * easeOut(burst)} color="#a77bff" width={5 * (1 - burst) + 0.4} opacity={1 - burst} /> : null}
      <Sparks x={to.x} y={to.y - 10} n={14} seed={41} k={burst} reach={R * 0.8} color="#cdb4ff" width={2} />
    </g>
  );
};

export const MidnightPulseZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const R = radius > 0 ? radius : 180;
  const life = duration > 0 ? clamp01(Math.min(t / 0.35, (duration - t) / 0.5)) : clamp01(t / 0.35);
  if (life <= 0) return null;
  const out: ReactNode[] = [];
  out.push(<circle key="mp-bg" cx={f(x)} cy={f(y)} r={f(R)} fill="#160a33" opacity={f(0.42 * life)} />);
  out.push(<circle key="mp-in" cx={f(x)} cy={f(y)} r={f(R * 0.6)} fill="#2a1260" opacity={f(0.3 * life)} />);
  // slow-turning constellation rings
  for (let i = 0; i < 3; i++) {
    const r = R * (0.35 + i * 0.3);
    out.push(
      <circle
        key={`mp-r${i}`}
        cx={f(x)}
        cy={f(y)}
        r={f(r)}
        fill="none"
        stroke="#8a5cff"
        strokeWidth={1.5}
        strokeDasharray={i === 2 ? '18 10' : '4 10'}
        opacity={f(life * (0.35 + 0.15 * i))}
        transform={`rotate(${f(t * (i % 2 ? -14 : 10))} ${f(x)} ${f(y)})`}
      />,
    );
  }
  // twinkling stars
  for (let i = 0; i < 22; i++) {
    const a = rnd(i, 51) * TAU + t * 0.15;
    const d = R * Math.sqrt(rnd(i, 52)) * 0.92;
    const p = polar(x, y, d, a);
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (1.5 + rnd(i, 53) * 2) + i));
    out.push(<circle key={`mp-s${i}`} cx={f(p.x)} cy={f(p.y)} r={f(1 + rnd(i, 54) * 1.6)} fill="#efe6ff" opacity={f(life * tw)} />);
  }
  // per-second pulse (damage tick)
  const ph = t % 1;
  out.push(<circle key="mp-pulse" cx={f(x)} cy={f(y)} r={f(R * easeOut(ph))} fill="none" stroke="#b896ff" strokeWidth={f(4 * (1 - ph) + 0.5)} opacity={f(life * (1 - ph) * 0.8)} />);
  out.push(<circle key="mp-edge" cx={f(x)} cy={f(y)} r={f(R)} fill="none" stroke="#6a3fcf" strokeWidth={2.5} opacity={f(life * 0.75)} />);
  out.push(<Glow key="mp-core" x={x} y={y} r={26 + 8 * bump(ph)} color="#6a2fd6" opacity={life * 0.8} core="#ffffff" />);
  return <g pointerEvents="none">{out}</g>;
};
