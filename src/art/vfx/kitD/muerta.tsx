// Kit-D VFX: muerta — dead_shot (ricochet + spectral bullet), the_calling (revenant ring), gunslinger, pierce_the_veil.
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { ProjectileArt, VfxArt, ZoneArt } from '../../types.ts';
import { bump, clamp01, easeOut, lerp } from '../../types.ts';
import { Glow, Ring, Sparks, TAU, angleDeg, f, pathOf, polar, prog, rnd, seg, srnd } from '../sig/fxkit.tsx';
import { CHEST, HAND, HEAD, aim, flamePath, twinkle } from '../kitC/kit.tsx';
import { Ghost, Marigold, Skull } from './kit.tsx';

const TEAL = '#3fffb0';
const MINT = '#c8fff0';
const SPIRIT = '#5fe3b0';

// ------------------------------------------------------------------ dead_shot (muzzle flash, spectral tracer, ricochet + fear skull)
export const DeadShotVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = aim(from, to, team);
  const muzzle: Vec = { x: from.x + d.x * 24, y: from.y - HAND };
  const hitP: Vec = { x: to.x, y: to.y - CHEST };
  const fly = seg(k, 0, 0.3);
  const head: Vec = { x: lerp(muzzle.x, hitP.x, fly), y: lerp(muzzle.y, hitP.y, fly) };
  const tail: Vec = { x: lerp(muzzle.x, hitP.x, Math.max(0, fly - 0.35)), y: lerp(muzzle.y, hitP.y, Math.max(0, fly - 0.35)) };
  const hit = seg(k, 0.3, 1);
  // ricochet glances off at an angle
  const ra = Math.atan2(d.y, d.x) + (team === 'left' ? 0.9 : -0.9);
  const rb = easeOut(seg(hit, 0, 0.45));
  const ric = polar(hitP.x, hitP.y, rb * 150, ra);
  const ricTail = polar(hitP.x, hitP.y, Math.max(0, rb - 0.4) * 150, ra);
  const fear = seg(k, 0.35, 1);
  return (
    <g>
      <Glow x={muzzle.x} y={muzzle.y} r={26} color={TEAL} opacity={bump(seg(k, 0, 0.2))} core="#ffffff" />
      <path d={twinkle(14 * bump(seg(k, 0, 0.2)))} transform={`translate(${f(muzzle.x)},${f(muzzle.y)})`} fill={MINT} />
      {fly > 0 && fly < 1 ? (
        <g>
          <path d={pathOf([tail, head])} stroke={TEAL} strokeWidth={6} strokeOpacity={0.3} strokeLinecap="round" />
          <path d={pathOf([tail, head])} stroke={MINT} strokeWidth={2} strokeLinecap="round" />
        </g>
      ) : null}
      {hit > 0 ? (
        <g>
          <Glow x={hitP.x} y={hitP.y} r={34} color={TEAL} opacity={1 - seg(hit, 0, 0.4)} core="#ffffff" />
          <Sparks x={hitP.x} y={hitP.y} n={8} seed={601} k={seg(hit, 0, 0.5)} reach={34} color={MINT} width={1.8} />
          {rb < 1 ? (
            <g opacity={f(1 - seg(hit, 0.3, 0.5))}>
              <path d={pathOf([ricTail, ric])} stroke={TEAL} strokeWidth={5} strokeOpacity={0.3} strokeLinecap="round" />
              <path d={pathOf([ricTail, ric])} stroke={MINT} strokeWidth={1.8} strokeLinecap="round" />
            </g>
          ) : null}
          <g opacity={f(bump(fear))}>
            <Skull x={to.x} y={to.y - HEAD - 18 - fear * 10} r={8} color={MINT} eyes="#0a3a2a" />
            <Glow x={to.x} y={to.y - HEAD - 18 - fear * 10} r={18} color={TEAL} opacity={0.6} />
          </g>
        </g>
      ) : null}
    </g>
  );
};

export const DeadShotProjectile: ProjectileArt = ({ t }) => {
  const trail: ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const pts: Vec[] = [];
    for (let j = 0; j <= 10; j++) pts.push({ x: -j * 5, y: Math.sin(j * 0.8 + t * 30 + (i * TAU) / 3) * j * 0.6 });
    trail.push(<path key={i} d={pathOf(pts)} fill="none" stroke={i === 0 ? MINT : TEAL} strokeWidth={1.5} strokeOpacity={0.7} strokeLinecap="round" />);
  }
  return (
    <g>
      <ellipse cx={-22} rx={34} ry={7} fill={TEAL} opacity={0.22} />
      {trail}
      <circle r={9} fill={TEAL} opacity={0.35} />
      <path d="M8 0 Q6 -4 -2 -3.5 L-6 -3 L-6 3 L-2 3.5 Q6 4 8 0Z" fill={MINT} stroke={TEAL} strokeWidth={1} />
      <circle cx={2} r={1.6} fill="#ffffff" />
    </g>
  );
};

// ------------------------------------------------------------------ the_calling
/** cast: marigold burst + revenants clawing up from the ground */
export const TheCallingVfx: VfxArt = ({ t, duration, from, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 200;
  const w = easeOut(seg(k, 0, 0.6));
  const fade = 1 - seg(k, 0.6, 1);
  const petals: ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + srnd(i, 611) * 0.2;
    const p = polar(from.x, from.y - 10, w * R * (0.6 + rnd(i, 612) * 0.4), a);
    petals.push(<ellipse key={i} cx={f(p.x)} cy={f(p.y - bump(w) * 20)} rx={4} ry={2} fill={i % 2 ? '#ffb020' : '#ff8a10'} transform={`rotate(${f(a * 57 + t * 400)} ${f(p.x)} ${f(p.y - bump(w) * 20)})`} opacity={f(fade)} />);
  }
  return (
    <g>
      <Glow x={from.x} y={from.y - CHEST} r={50} color={SPIRIT} opacity={bump(seg(k, 0, 0.4))} core="#ffffff" />
      <Ring x={from.x} y={from.y} r={R * w} color={SPIRIT} width={4 * fade} opacity={fade} />
      <Ring x={from.x} y={from.y} r={R * w * 0.8} color="#ffb020" width={1.5 * fade} opacity={fade * 0.7} dash="4 8" />
      {petals}
    </g>
  );
};

/** zone: four revenants circling Muerta, marigolds dotting the ring */
export const TheCallingZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const R = radius > 0 ? radius : 200;
  const env = Math.min(clamp01(t / 0.3), clamp01((duration - t) / 0.5));
  if (env <= 0) return null;
  const ghosts: ReactNode[] = [];
  const N = 4;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU + t * 1.3;
    const rr = R * 0.78;
    const p = polar(x, y, rr, a);
    const py = p.y * 1 - 6 + Math.sin(t * 4 + i) * 4;
    // faint trail behind each revenant
    const trail: Vec[] = [];
    for (let j = 1; j <= 7; j++) trail.push(polar(x, y, rr, a - j * 0.08));
    ghosts.push(
      <g key={i}>
        <path d={pathOf(trail.map((q) => ({ x: q.x, y: q.y - 32 })))} fill="none" stroke={SPIRIT} strokeWidth={10} strokeOpacity={0.14} strokeLinecap="round" />
        <Ghost x={p.x} y={py} w={22} h={46} wob={-Math.sin(a) * 8} color={SPIRIT} core={MINT} eyes="#063a2a" opacity={0.9} />
      </g>,
    );
  }
  const flowers: ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + 0.2;
    const p = polar(x, y, R * (0.96 + srnd(i, 621) * 0.04), a);
    flowers.push(<Marigold key={i} x={p.x} y={p.y} r={5 + rnd(i, 622) * 2} rot={t * 20 + i * 30} opacity={0.9} />);
  }
  const motes: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const ph = (rnd(i, 631) + t * 0.5) % 1;
    const a = rnd(i, 632) * TAU;
    const rr = Math.sqrt(rnd(i, 633)) * R * 0.9;
    motes.push(<circle key={i} cx={f(x + Math.cos(a) * rr)} cy={f(y + Math.sin(a) * rr - ph * 36)} r={1.8} fill={MINT} opacity={f(bump(ph) * 0.8)} />);
  }
  return (
    <g pointerEvents="none" opacity={f(env)}>
      <circle cx={f(x)} cy={f(y)} r={f(R)} fill="#0a4a36" opacity={0.16} />
      <circle cx={f(x)} cy={f(y)} r={f(R)} fill="none" stroke={SPIRIT} strokeWidth={2} strokeOpacity={0.5} strokeDasharray="2 10" transform={`rotate(${f(t * 20)} ${f(x)} ${f(y)})`} />
      {flowers}
      {motes}
      {ghosts}
    </g>
  );
};

// ------------------------------------------------------------------ gunslinger (double tap: two quick tracers)
export const GunslingerVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = aim(from, to, team);
  const n: Vec = { x: -d.y, y: d.x };
  const out: ReactNode[] = [];
  for (let i = 0; i < 2; i++) {
    const st = i * 0.25;
    const p = seg(k, st, st + 0.4);
    if (p <= 0 || p >= 1) continue;
    const side = i ? -1 : 1;
    const m: Vec = { x: from.x + d.x * 22 + n.x * 6 * side, y: from.y - HAND + n.y * 6 * side };
    const e: Vec = { x: to.x + n.x * 4 * side, y: to.y - CHEST };
    const hd = easeOut(seg(p, 0, 0.5));
    const h: Vec = { x: lerp(m.x, e.x, hd), y: lerp(m.y, e.y, hd) };
    const tl: Vec = { x: lerp(m.x, e.x, Math.max(0, hd - 0.4)), y: lerp(m.y, e.y, Math.max(0, hd - 0.4)) };
    out.push(
      <g key={i}>
        <Glow x={m.x} y={m.y} r={22} color={TEAL} opacity={1 - seg(p, 0, 0.6)} core="#ffffff" />
        <path d={twinkle(10 * (1 - seg(p, 0, 0.5)))} transform={`translate(${f(m.x)},${f(m.y)})`} fill={MINT} />
        <path d={pathOf([tl, h])} stroke={TEAL} strokeWidth={7} strokeOpacity={0.3} strokeLinecap="round" opacity={f(1 - seg(p, 0.5, 1))} />
        <path d={pathOf([tl, h])} stroke={MINT} strokeWidth={2.4} strokeLinecap="round" opacity={f(1 - seg(p, 0.5, 1))} />
        {hd >= 1 ? <Glow x={e.x} y={e.y} r={20} color={TEAL} opacity={1 - seg(p, 0.5, 1)} core="#ffffff" /> : null}
        {hd >= 1 ? <Sparks x={e.x} y={e.y} n={6} seed={640 + i} k={seg(p, 0.5, 1)} reach={26} color={MINT} width={1.8} arc={1.6} heading={Math.atan2(d.y, d.x) + Math.PI} /> : null}
      </g>,
    );
  }
  return (
    <g>
      <g transform={`translate(${f(from.x)},${f(from.y - HAND)}) rotate(${f(angleDeg(d))})`} opacity={f(bump(k))}>
        <path d="M14 -10 L22 -10 M14 10 L22 10" stroke={MINT} strokeWidth={1.5} strokeLinecap="round" />
      </g>
      {out}
    </g>
  );
};

// ------------------------------------------------------------------ pierce_the_veil (ethereal transformation)
export const PierceTheVeilVfx: VfxArt = ({ t, duration, from }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const env = 1 - seg(k, 0.65, 1);
  const burst = seg(k, 0, 0.45);
  const flames: ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU;
    const px = from.x + Math.cos(a) * 24;
    const py = from.y + Math.sin(a) * 8;
    const h = (30 + rnd(i, 651) * 20) * bump(seg(k, 0.05 + i * 0.03, 0.9)) * (0.85 + 0.15 * Math.sin(t * 16 + i));
    flames.push(
      <g key={i}>
        <path d={flamePath(px, py, 12, h, Math.sin(t * 8 + i) * 4)} fill={TEAL} opacity={0.55} />
        <path d={flamePath(px, py, 6, h * 0.6, 0)} fill={MINT} opacity={0.8} />
      </g>,
    );
  }
  const spirits: ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const ph = (rnd(i, 652) + k * 1.4) % 1;
    const sx = from.x + srnd(i, 653) * 30 + Math.sin(ph * 8 + i) * 5;
    spirits.push(<circle key={i} cx={f(sx)} cy={f(from.y - 20 - ph * 80)} r={f(2 + ph * 2)} fill={MINT} opacity={f(bump(ph) * env)} />);
  }
  const halo = easeOut(seg(k, 0.1, 0.5));
  return (
    <g>
      <Glow x={from.x} y={from.y - CHEST} r={60} color={TEAL} opacity={bump(burst)} core="#ffffff" />
      <Ring x={from.x} y={from.y - 6} r={14 + easeOut(burst) * 70} color={TEAL} width={3 * (1 - burst)} opacity={1 - burst} />
      {flames}
      {spirits}
      <g opacity={f(halo * env)}>
        <ellipse cx={f(from.x)} cy={f(from.y - HEAD - 14)} rx={18} ry={5} fill="none" stroke={TEAL} strokeWidth={2} />
        <Skull x={from.x} y={from.y - HEAD - 26} r={7} color={MINT} eyes="#063a2a" />
        <Marigold x={from.x - 16} y={from.y - HEAD - 18} r={4} rot={t * 40} />
        <Marigold x={from.x + 16} y={from.y - HEAD - 18} r={4} rot={-t * 40} />
      </g>
    </g>
  );
};
