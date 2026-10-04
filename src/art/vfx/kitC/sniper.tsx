// Kit-C VFX: sniper — shrapnel (volley + persistent zone), headshot, take_aim.
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { VfxArt, ZoneArt } from '../../types.ts';
import { bump, clamp01, easeIn, easeOut, lerp } from '../../types.ts';
import { Glow, Ring, Sparks, TAU, angleDeg, envelope, f, polar, prog, rnd, seg, srnd } from '../sig/fxkit.tsx';
import { CHEST, HAND, HEAD, aim, teamFwd, twinkle } from './kit.tsx';

// ------------------------------------------------------------------ shrapnel (cast: shell fired skyward, volley lands)
export const ShrapnelVfx: VfxArt = ({ t, duration, from, to, radius, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 140;
  const d = aim(from, to, team);
  const muzzle: Vec = { x: from.x + d.x * 22, y: from.y - HAND };
  const flash = bump(seg(k, 0, 0.2));
  // tracer climbing out of frame
  const up = easeIn(seg(k, 0, 0.35));
  const tracerTop: Vec = { x: lerp(muzzle.x, muzzle.x + d.x * 60, up), y: lerp(muzzle.y, muzzle.y - 260, up) };
  const tracerTail: Vec = { x: lerp(muzzle.x, tracerTop.x, 0.6), y: lerp(muzzle.y, tracerTop.y, 0.6) };
  const shells: ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const land = 0.35 + rnd(i, 11) * 0.4;
    const fall = seg(k, land - 0.18, land);
    const a = rnd(i, 12) * TAU;
    const rr = Math.sqrt(rnd(i, 13)) * R * 0.85;
    const gx = to.x + Math.cos(a) * rr;
    const gy = to.y + Math.sin(a) * rr;
    if (fall > 0 && fall < 1) {
      const sy = gy - 220 * (1 - fall);
      shells.push(
        <g key={`s${i}`}>
          <line x1={f(gx + 6)} y1={f(sy - 34)} x2={f(gx)} y2={f(sy)} stroke="#ffd27a" strokeWidth={2} strokeOpacity={0.55} strokeLinecap="round" />
          <circle cx={f(gx)} cy={f(sy)} r={2.6} fill="#fff4c8" />
        </g>,
      );
    }
    const boom = seg(k, land, land + 0.28);
    if (boom > 0 && boom < 1) {
      shells.push(
        <g key={`b${i}`}>
          <Glow x={gx} y={gy - 6} r={34 * (0.6 + boom)} color="#ff8a2a" opacity={1 - boom} core="#fff1c0" />
          <Sparks x={gx} y={gy - 4} n={6} seed={i + 20} k={boom} reach={40} color="#ffd27a" width={1.6} arc={Math.PI} heading={-Math.PI / 2} gravity={14} />
        </g>,
      );
    }
  }
  const mark = envelope(k, 0.15, 0.3);
  return (
    <g>
      <circle cx={f(to.x)} cy={f(to.y)} r={f(R)} fill="#ff9a3a" opacity={f(mark * 0.08)} />
      <circle cx={f(to.x)} cy={f(to.y)} r={f(R * (1.15 - 0.15 * easeOut(seg(k, 0, 0.4))))} fill="none" stroke="#ffc46a" strokeWidth={2} strokeDasharray="10 7" opacity={f(mark * 0.8)} />
      <Glow x={muzzle.x} y={muzzle.y} r={24} color="#ffb347" opacity={flash} core="#fffbe6" />
      {up > 0 && up < 1 ? <line x1={f(tracerTail.x)} y1={f(tracerTail.y)} x2={f(tracerTop.x)} y2={f(tracerTop.y)} stroke="#fff0b8" strokeWidth={3} strokeLinecap="round" opacity={f(1 - up * 0.5)} /> : null}
      {shells}
    </g>
  );
};

/** persistent shrapnel field: dusty ring, pellets raining in deterministic slots, puffs of smoke */
export const ShrapnelZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const R = radius > 0 ? radius : 140;
  const life = duration > 0 ? clamp01(t / duration) : 0;
  const env = Math.min(clamp01(t / 0.3), clamp01((duration - t) / 0.5));
  if (env <= 0) return null;
  const items: ReactNode[] = [];
  const slot = 0.08; // a new pellet every slot
  const fallT = 0.22;
  const boomT = 0.3;
  const n0 = Math.floor((t - fallT - boomT) / slot);
  const n1 = Math.floor(t / slot);
  for (let n = Math.max(0, n0); n <= n1; n++) {
    const born = n * slot;
    const age = t - born;
    if (age < 0) continue;
    const a = rnd(n, 31) * TAU;
    const rr = Math.sqrt(rnd(n, 32)) * R * 0.9;
    const gx = x + Math.cos(a) * rr;
    const gy = y + Math.sin(a) * rr;
    if (age < fallT) {
      const p = age / fallT;
      const sy = gy - 160 * (1 - p);
      items.push(<line key={`p${n}`} x1={f(gx + 4)} y1={f(sy - 22)} x2={f(gx)} y2={f(sy)} stroke="#ffe0a0" strokeWidth={1.8} strokeOpacity={0.7} strokeLinecap="round" />);
    } else if (age < fallT + boomT) {
      const p = (age - fallT) / boomT;
      items.push(
        <g key={`b${n}`}>
          <circle cx={f(gx)} cy={f(gy - 4)} r={f(5 + p * 20)} fill="#ff9a3a" opacity={f((1 - p) * 0.55)} />
          <circle cx={f(gx)} cy={f(gy - 4)} r={f(3 + p * 8)} fill="#fff2c4" opacity={f(1 - p)} />
          <Sparks x={gx} y={gy - 3} n={4} seed={n} k={p} reach={28} color="#ffc46a" width={1.4} arc={Math.PI * 1.2} heading={-Math.PI / 2} />
        </g>,
      );
    }
  }
  // drifting smoke puffs
  const smoke: ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const ph = (rnd(i, 41) + t * 0.25) % 1;
    const a = rnd(i, 42) * TAU + t * 0.2;
    const rr = R * (0.2 + rnd(i, 43) * 0.6);
    smoke.push(<circle key={i} cx={f(x + Math.cos(a) * rr)} cy={f(y + Math.sin(a) * rr - ph * 30)} r={f(12 + ph * 16)} fill="#6b5a4a" opacity={f(bump(ph) * 0.18)} />);
  }
  const rot = t * 25;
  return (
    <g pointerEvents="none" opacity={f(env)}>
      <circle cx={f(x)} cy={f(y)} r={f(R)} fill="#5a3a1a" opacity={0.16} />
      <circle cx={f(x)} cy={f(y)} r={f(R)} fill="none" stroke="#ffb347" strokeWidth={2} strokeOpacity={0.55} strokeDasharray="6 10" transform={`rotate(${f(rot)} ${f(x)} ${f(y)})`} />
      <circle cx={f(x)} cy={f(y)} r={f(R * 0.97)} fill="none" stroke="#3a2412" strokeWidth={5} strokeOpacity={0.25} />
      {/* scorch pocks accumulate over the zone's life */}
      {Array.from({ length: 14 }, (_, i) => {
        if (rnd(i, 51) > life * 1.4 + 0.1) return null;
        const a = rnd(i, 52) * TAU;
        const rr = Math.sqrt(rnd(i, 53)) * R * 0.85;
        return <ellipse key={i} cx={f(x + Math.cos(a) * rr)} cy={f(y + Math.sin(a) * rr)} rx={f(5 + rnd(i, 54) * 5)} ry={f(2.5 + rnd(i, 55) * 2)} fill="#2a1a0c" opacity={0.4} />;
      })}
      {smoke}
      {items}
    </g>
  );
};

// ------------------------------------------------------------------ headshot (proc at the target's head)
export const HeadshotVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = aim(from, to, team);
  const hx = to.x;
  const hy = to.y - HEAD + 6;
  const snap = easeOut(seg(k, 0, 0.3));
  const r = lerp(46, 18, snap);
  const env = envelope(k, 0.05, 0.4);
  const hit = seg(k, 0.25, 1);
  const ticks: ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + Math.PI / 4 * (1 - snap);
    const p0 = polar(hx, hy, r * 0.5, a);
    const p1 = polar(hx, hy, r * 1.3, a);
    ticks.push(<line key={i} x1={f(p0.x)} y1={f(p0.y)} x2={f(p1.x)} y2={f(p1.y)} stroke="#ff3a2a" strokeWidth={2.4} strokeLinecap="round" />);
  }
  // knock streak behind the target, along the shot direction
  const kb = seg(k, 0.25, 0.7);
  return (
    <g>
      <g opacity={f(env)}>
        <circle cx={f(hx)} cy={f(hy)} r={f(r)} fill="none" stroke="#ff3a2a" strokeWidth={2} />
        {ticks}
      </g>
      {hit > 0 && hit < 1 ? (
        <g>
          <Glow x={hx} y={hy} r={44} color="#ffd34a" opacity={1 - hit} core="#ffffff" />
          <Sparks x={hx} y={hy} n={9} seed={61} k={hit} reach={58} color="#ffe27a" width={2.2} arc={1.6} heading={Math.atan2(d.y, d.x)} />
          <Ring x={hx} y={hy} r={10 + easeOut(hit) * 36} color="#fff2b0" width={3 * (1 - hit)} opacity={1 - hit} />
          <g transform={`translate(${f(hx)},${f(hy)}) rotate(${f(angleDeg(d))})`} opacity={f(1 - kb)}>
            <line x1={10} y1={-6} x2={f(10 + 30 * easeOut(kb))} y2={-6} stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
            <line x1={14} y1={4} x2={f(14 + 36 * easeOut(kb))} y2={4} stroke="#ffe27a" strokeWidth={2} strokeLinecap="round" />
          </g>
          <path d={twinkle(16 * bump(seg(hit, 0, 0.6)))} transform={`translate(${f(hx)},${f(hy)}) rotate(15)`} fill="#ffffff" />
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ take_aim (scope reticle + laser sight)
export const TakeAimVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = Math.hypot(to.x - from.x, to.y - from.y) < 1 ? teamFwd(team) : aim(from, to, team);
  const eye: Vec = { x: from.x + d.x * 10, y: from.y - HEAD + 10 };
  const env = envelope(k, 0.1, 0.35);
  const zoom = easeOut(seg(k, 0, 0.5));
  const R = lerp(50, 22, zoom);
  const laserLen = 120 + 200 * easeOut(seg(k, 0.1, 0.6));
  const end: Vec = { x: eye.x + d.x * laserLen, y: eye.y + d.y * laserLen };
  const rings: ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const p = seg(k, i * 0.12, 0.5 + i * 0.12);
    if (p <= 0 || p >= 1) continue;
    rings.push(<circle key={i} cx={f(eye.x)} cy={f(eye.y)} r={f(14 + easeOut(p) * 50)} fill="none" stroke="#d8f07a" strokeWidth={f(2 * (1 - p))} opacity={f(1 - p)} />);
  }
  const ticks: ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + zoom * (Math.PI / 2);
    const p0 = polar(eye.x, eye.y, R * 0.55, a);
    const p1 = polar(eye.x, eye.y, R * 1.25, a);
    ticks.push(<line key={i} x1={f(p0.x)} y1={f(p0.y)} x2={f(p1.x)} y2={f(p1.y)} stroke="#e8ff9a" strokeWidth={2} strokeLinecap="round" />);
  }
  return (
    <g opacity={f(env)}>
      <line x1={f(eye.x)} y1={f(eye.y)} x2={f(end.x)} y2={f(end.y)} stroke="#c9e36a" strokeWidth={6} strokeOpacity={0.15} strokeLinecap="round" />
      <line x1={f(eye.x)} y1={f(eye.y)} x2={f(end.x)} y2={f(end.y)} stroke="#f2ffb0" strokeWidth={1.4} strokeOpacity={0.85} strokeLinecap="round" strokeDasharray="14 6" strokeDashoffset={f(-t * 120)} />
      <circle cx={f(end.x)} cy={f(end.y)} r={3} fill="#ff4a3a" />
      <circle cx={f(end.x)} cy={f(end.y)} r={8} fill="#ff4a3a" opacity={0.25} />
      {rings}
      <circle cx={f(eye.x)} cy={f(eye.y)} r={f(R)} fill="#c9e36a" fillOpacity={0.08} stroke="#e8ff9a" strokeWidth={2} />
      {ticks}
      <circle cx={f(eye.x)} cy={f(eye.y)} r={2} fill="#fff" />
      {Array.from({ length: 5 }, (_, i) => {
        const p = (rnd(i, 71) + k) % 1;
        const sx = from.x + srnd(i, 72) * 24;
        return <circle key={i} cx={f(sx)} cy={f(from.y - 10 - p * 70)} r={f(1.5 + rnd(i, 73) * 1.5)} fill="#e8ff9a" opacity={f(bump(p) * 0.9)} />;
      })}
      <Glow x={from.x} y={from.y - CHEST} r={36} color="#c9e36a" opacity={bump(seg(k, 0, 0.4)) * 0.5} />
    </g>
  );
};
