// Kit-D VFX: clinkz — strafe (frenzy aura + arrow fan), tar_bomb (cast + tar projectile), death_pact, burning_army (skeleton archer ring).
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { ProjectileArt, VfxArt, ZoneArt } from '../../types.ts';
import { bump, clamp01, easeIn, easeOut, lerp } from '../../types.ts';
import { Glow, Ring, Sparks, TAU, angleDeg, f, polar, prog, rnd, seg, srnd } from '../sig/fxkit.tsx';
import { Arrow, CHEST, HAND, HEAD, aim, flamePath } from '../kitC/kit.tsx';
import { Skull } from './kit.tsx';

const FIRE = '#ff7a1a';
const FIRE_HOT = '#ffd36a';
const BONE = '#efe4c8';

/** a ring of flame tongues around (x,y), base on the ground */
const FlameRing = ({ x, y, r, n, t, h, seed, opacity }: { x: number; y: number; r: number; n: number; t: number; h: number; seed: number; opacity: number }): ReactNode => {
  if (opacity <= 0) return null;
  const out: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rnd(i, seed) * 0.4;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r * 0.45;
    const fl = 0.75 + 0.25 * Math.sin(t * 14 + i * 2.1);
    out.push(
      <g key={i}>
        <path d={flamePath(px, py, 9, h * fl, Math.sin(t * 9 + i) * 3)} fill={FIRE} opacity={0.8} />
        <path d={flamePath(px, py, 5, h * fl * 0.6, Math.sin(t * 9 + i) * 2)} fill={FIRE_HOT} />
      </g>,
    );
  }
  return <g opacity={f(opacity)}>{out}</g>;
};

// ------------------------------------------------------------------ strafe (buff: fiery frenzy, arrow volley flicking forward)
export const StrafeVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = aim(from, to, team);
  const deg = angleDeg(d);
  const env = 1 - seg(k, 0.6, 1);
  const arrows: ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const st = i * 0.08;
    const p = seg(k, st, st + 0.35);
    if (p <= 0 || p >= 1) continue;
    const spread = srnd(i, 401) * 0.35;
    const ang = Math.atan2(d.y, d.x) + spread;
    const dd = 20 + easeIn(p) * 160;
    const px = from.x + Math.cos(ang) * dd;
    const py = from.y - HAND + Math.sin(ang) * dd;
    arrows.push(<Arrow key={i} x={px} y={py} rot={(ang * 180) / Math.PI} color={FIRE_HOT} glow={FIRE} len={20} opacity={1 - p} />);
  }
  const rise: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const ph = (rnd(i, 402) + k * 1.6) % 1;
    rise.push(<circle key={i} cx={f(from.x + srnd(i, 403) * 22)} cy={f(from.y - 6 - ph * 70)} r={f(1.5 + rnd(i, 404) * 2)} fill={FIRE_HOT} opacity={f(bump(ph) * env)} />);
  }
  const speed: ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const p = (k * 3 + i * 0.25) % 1;
    const a = (i / 4) * TAU + k * 8;
    speed.push(<ellipse key={i} cx={f(from.x)} cy={f(from.y - 34)} rx={f(26 + p * 10)} ry={f(10 + p * 4)} fill="none" stroke={FIRE_HOT} strokeWidth={1.4} strokeOpacity={f((1 - p) * env)} strokeDasharray="10 20" strokeDashoffset={f(a * 10)} />);
  }
  return (
    <g>
      <Glow x={from.x} y={from.y - CHEST} r={46} color={FIRE} opacity={bump(seg(k, 0, 0.5)) * 0.8} core="#fff3d0" />
      <FlameRing x={from.x} y={from.y} r={22} n={6} t={t} h={22} seed={405} opacity={env * 0.9} />
      {speed}
      {rise}
      <g transform={`translate(${f(from.x)},${f(from.y - HAND)}) rotate(${f(deg)})`} opacity={f(env)}>
        <path d="M6 -16 Q20 0 6 16" fill="none" stroke={FIRE_HOT} strokeWidth={2.4} />
      </g>
      {arrows}
    </g>
  );
};

// ------------------------------------------------------------------ tar_bomb (cast flash + sticky splash on landing)
export const TarBombVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = aim(from, to, team);
  const hand: Vec = { x: from.x + d.x * 16, y: from.y - HAND };
  const flash = bump(seg(k, 0, 0.25));
  const hit = seg(k, 0.55, 1);
  const splats: ReactNode[] = [];
  if (hit > 0) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + srnd(i, 411) * 0.4;
      const rr = (14 + rnd(i, 412) * 18) * easeOut(seg(hit, 0, 0.4));
      splats.push(<ellipse key={i} cx={f(to.x + Math.cos(a) * rr)} cy={f(to.y + Math.sin(a) * rr * 0.45)} rx={f(4 + rnd(i, 413) * 4)} ry={f(2.5 + rnd(i, 414) * 2)} fill="#1c120c" />);
    }
  }
  return (
    <g>
      <Glow x={hand.x} y={hand.y} r={22} color={FIRE} opacity={flash} core="#fff3d0" />
      {hit > 0 ? (
        <g opacity={f(1 - seg(hit, 0.7, 1))}>
          <ellipse cx={f(to.x)} cy={f(to.y)} rx={f(30 * easeOut(seg(hit, 0, 0.3)))} ry={f(13 * easeOut(seg(hit, 0, 0.3)))} fill="#24160e" opacity={0.85} />
          <ellipse cx={f(to.x - 6)} cy={f(to.y - 2)} rx={f(12 * easeOut(seg(hit, 0, 0.3)))} ry={4} fill="#5a3a20" opacity={0.6} />
          {splats}
          <Glow x={to.x} y={to.y - CHEST} r={40} color={FIRE} opacity={1 - seg(hit, 0, 0.5)} core="#fff3d0" />
          <Sparks x={to.x} y={to.y - CHEST} n={9} seed={415} k={seg(hit, 0, 0.6)} reach={46} color={FIRE_HOT} width={2} gravity={20} />
          <FlameRing x={to.x} y={to.y} r={18} n={4} t={t} h={18} seed={416} opacity={bump(seg(hit, 0.1, 1))} />
          {Array.from({ length: 3 }, (_, i) => (
            <circle key={i} cx={f(to.x + srnd(i, 417) * 12)} cy={f(to.y - CHEST + 6 + easeIn(seg(hit, i * 0.1, 0.8)) * 34)} r={f(2.5 - i * 0.5)} fill="#1c120c" opacity={f(1 - seg(hit, 0.6, 1))} />
          ))}
        </g>
      ) : null}
    </g>
  );
};

export const TarBombProjectile: ProjectileArt = ({ t }) => {
  const wob = Math.sin(t * 20) * 1.5;
  const trail: ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const ph = (t * 5 + i / 5) % 1;
    trail.push(<circle key={i} cx={f(-8 - ph * 34)} cy={f(Math.sin(t * 13 + i) * 4)} r={f(5 * (1 - ph) + 1)} fill={i % 2 ? FIRE : '#3a2414'} opacity={f((1 - ph) * 0.7)} />);
  }
  return (
    <g>
      {trail}
      <path d={`M-14 0 Q-6 -12 6 -${f(9 + wob)} Q16 -4 14 2 Q10 11 -2 ${f(10 - wob)} Q-12 8 -14 0Z`} fill="#1a100a" stroke="#ff9a3c" strokeWidth={1.4} />
      <ellipse cx={3} cy={-4} rx={4} ry={2} fill="#6a4a2a" opacity={0.8} />
      <path d={flamePath(0, -6, 8, 14 + wob * 2, -4)} fill={FIRE} opacity={0.9} transform="rotate(-70 0 -6)" />
      <path d={flamePath(0, -6, 4, 8 + wob, -2)} fill={FIRE_HOT} transform="rotate(-70 0 -6)" />
    </g>
  );
};

// ------------------------------------------------------------------ death_pact (a skeleton's soul is torn into clinkz)
export const DeathPactVfx: VfxArt = ({ t, duration, from, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const side = team === 'left' ? 1 : -1;
  const start: Vec = { x: from.x + 70 * side, y: from.y - 20 };
  const end: Vec = { x: from.x, y: from.y - CHEST };
  const pull = easeIn(seg(k, 0, 0.5));
  const sk: Vec = { x: lerp(start.x, end.x, pull), y: lerp(start.y, end.y, pull) - Math.sin(Math.PI * pull) * 30 };
  const absorb = seg(k, 0.45, 1);
  const crosses: ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const p = seg(absorb, i * 0.1, 0.55 + i * 0.1);
    if (p <= 0 || p >= 1) continue;
    const cx = from.x + srnd(i, 421) * 24;
    const cy = from.y - 20 - easeOut(p) * 50;
    crosses.push(<path key={i} d={`M${f(cx - 4)} ${f(cy)} h8 M${f(cx)} ${f(cy - 4)} v8`} stroke="#ffb07a" strokeWidth={2.4} strokeLinecap="round" opacity={f(1 - p)} />);
  }
  const tendrils: ReactNode[] = [];
  if (pull < 1) {
    for (let i = 0; i < 3; i++) {
      const off = srnd(i, 422) * 14;
      tendrils.push(<path key={i} d={`M${f(sk.x)} ${f(sk.y)} Q${f((sk.x + end.x) / 2 + off)} ${f((sk.y + end.y) / 2 - 20 + off)} ${f(end.x)} ${f(end.y)}`} fill="none" stroke={FIRE} strokeWidth={1.6} strokeOpacity={f(0.6 * (1 - pull))} strokeDasharray="4 4" strokeDashoffset={f(-t * 80)} />);
    }
  }
  return (
    <g>
      {tendrils}
      {pull < 1 ? (
        <g>
          <Glow x={sk.x} y={sk.y} r={22} color={FIRE} opacity={0.9} />
          <Skull x={sk.x} y={sk.y} r={9 * (1 - pull * 0.5)} color={BONE} eyes="#ff5a1a" />
        </g>
      ) : null}
      {absorb > 0 ? (
        <g>
          <Glow x={end.x} y={end.y} r={55} color="#ff5a2a" opacity={bump(seg(absorb, 0, 0.6))} core="#fff0d0" />
          <Ring x={from.x} y={from.y - 30} r={18 + easeOut(absorb) * 40} color={FIRE_HOT} width={3 * (1 - absorb)} opacity={1 - absorb} />
          <FlameRing x={from.x} y={from.y} r={20} n={5} t={t} h={26} seed={423} opacity={bump(absorb)} />
          {crosses}
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ burning_army
/** a little skeleton archer, feet at (x,y), drawing a bow towards angle `aimDeg` */
const Archer = ({ x, y, aimDeg, t, seed, scale = 1 }: { x: number; y: number; aimDeg: number; t: number; seed: number; scale?: number }): ReactNode => {
  const flip = Math.cos((aimDeg * Math.PI) / 180) < 0 ? -1 : 1;
  const draw = 0.5 + 0.5 * Math.sin(t * 6 + seed);
  return (
    <g transform={`translate(${f(x)},${f(y)}) scale(${f(scale)})`}>
      <ellipse cx={0} cy={0} rx={10} ry={3} fill="#000" opacity={0.3} />
      <g transform={`scale(${flip},1)`}>
        <path d="M-4 0 L-1 -12 L3 0 M-1 -12 L0 -24" stroke={BONE} strokeWidth={2} fill="none" strokeLinecap="round" />
        <path d="M-5 -22 h9 M-5 -19 h9 M-4 -16 h7" stroke={BONE} strokeWidth={1.2} />
        <path d={`M0 -21 L9 -20 M0 -21 L${f(3 - draw * 3)} -19`} stroke={BONE} strokeWidth={1.6} strokeLinecap="round" />
        <path d="M9 -30 Q15 -20 9 -10" stroke="#8a4a1a" strokeWidth={1.8} fill="none" />
        <path d={`M9 -30 L${f(4 - draw * 3)} -20 L9 -10`} stroke="#ffe6b0" strokeWidth={0.7} fill="none" />
      </g>
      <Skull x={0} y={-29} r={4.5} color={BONE} eyes="#ff5a1a" />
      <path d={flamePath(0, -33, 7, 10 + Math.sin(t * 15 + seed) * 3, Math.sin(t * 8 + seed) * 2)} fill={FIRE} opacity={0.9} />
      <path d={flamePath(0, -33, 3.5, 6, 0)} fill={FIRE_HOT} />
    </g>
  );
};

/** cast: flame pillars erupt around the circle where the army rises */
export const BurningArmyVfx: VfxArt = ({ t, duration, from, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 170;
  const cast = bump(seg(k, 0, 0.35));
  const pillars: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const st = 0.1 + i * 0.05;
    const p = seg(k, st, st + 0.5);
    if (p <= 0 || p >= 1) continue;
    const a = (i / 8) * TAU;
    const px = to.x + Math.cos(a) * R;
    const py = to.y + Math.sin(a) * R * 0.8;
    const h = 70 * bump(p);
    pillars.push(
      <g key={i}>
        <path d={flamePath(px, py, 18, h, Math.sin(t * 10 + i) * 4)} fill={FIRE} opacity={0.75} />
        <path d={flamePath(px, py, 9, h * 0.65, 0)} fill={FIRE_HOT} />
        <Sparks x={px} y={py - 8} n={4} seed={430 + i} k={p} reach={30} color={FIRE_HOT} width={1.5} arc={1.2} heading={-Math.PI / 2} />
      </g>,
    );
  }
  return (
    <g>
      <Glow x={from.x} y={from.y - HEAD} r={34} color={FIRE} opacity={cast} core="#fff3d0" />
      <Ring x={to.x} y={to.y} r={R * easeOut(seg(k, 0, 0.5))} color={FIRE} width={4 * (1 - seg(k, 0.4, 1))} opacity={1 - seg(k, 0.4, 1)} />
      {pillars}
    </g>
  );
};

/** zone: six skeleton archers ringing the area, fire arrows raining onto enemies inside, burning ground */
export const BurningArmyZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const R = radius > 0 ? radius : 170;
  const env = Math.min(clamp01(t / 0.35), clamp01((duration - t) / 0.5));
  if (env <= 0) return null;
  const N = 6;
  const archers: ReactNode[] = [];
  const pos: Vec[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU + 0.3;
    const p: Vec = { x: x + Math.cos(a) * R * 1.02, y: y + Math.sin(a) * R * 0.82 };
    pos.push(p);
    const rise = easeOut(clamp01((t - i * 0.06) / 0.4));
    archers.push(
      <g key={i} opacity={f(rise)}>
        <Archer x={p.x} y={p.y + (1 - rise) * 10} aimDeg={(Math.atan2(y - p.y, x - p.x) * 180) / Math.PI} t={t} seed={i * 1.7} />
      </g>,
    );
  }
  // volleys: each archer looses an arrow every `slot` seconds towards a random spot inside
  const shots: ReactNode[] = [];
  const slot = 0.45;
  const fly = 0.28;
  const boom = 0.25;
  for (let i = 0; i < N; i++) {
    const off = (i / N) * slot;
    const tt = t - off;
    if (tt < 0) continue;
    const n1 = Math.floor(tt / slot);
    for (let n = Math.max(0, n1 - 1); n <= n1; n++) {
      const age = tt - n * slot;
      if (age < 0 || age > fly + boom) continue;
      const seed = n * 13 + i;
      const a = rnd(seed, 441) * TAU;
      const rr = Math.sqrt(rnd(seed, 442)) * R * 0.75;
      const gx = x + Math.cos(a) * rr;
      const gy = y + Math.sin(a) * rr * 0.85;
      const s: Vec = { x: pos[i]!.x, y: pos[i]!.y - 22 };
      if (age < fly) {
        const p = age / fly;
        const px = lerp(s.x, gx, p);
        const py = lerp(s.y, gy - 10, p) - Math.sin(Math.PI * p) * 40;
        const vx = gx - s.x;
        const vy = gy - 10 - s.y - Math.cos(Math.PI * p) * Math.PI * 40;
        shots.push(<Arrow key={`a${i}-${n}`} x={px} y={py} rot={angleDeg({ x: vx, y: vy })} color={FIRE_HOT} glow={FIRE} len={14} scale={0.8} />);
      } else {
        const p = (age - fly) / boom;
        shots.push(
          <g key={`b${i}-${n}`}>
            <circle cx={f(gx)} cy={f(gy - 6)} r={f(4 + p * 16)} fill={FIRE} opacity={f((1 - p) * 0.6)} />
            <circle cx={f(gx)} cy={f(gy - 6)} r={f(2 + p * 6)} fill="#fff0c8" opacity={f(1 - p)} />
          </g>,
        );
      }
    }
  }
  const embers: ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const ph = (rnd(i, 451) + t * 0.6) % 1;
    const a = rnd(i, 452) * TAU;
    const rr = Math.sqrt(rnd(i, 453)) * R * 0.85;
    embers.push(<circle key={i} cx={f(x + Math.cos(a) * rr + Math.sin(ph * 7) * 4)} cy={f(y + Math.sin(a) * rr * 0.85 - ph * 40)} r={1.6} fill={FIRE_HOT} opacity={f(bump(ph) * 0.8)} />);
  }
  return (
    <g pointerEvents="none" opacity={f(env)}>
      <ellipse cx={f(x)} cy={f(y)} rx={f(R)} ry={f(R * 0.82)} fill="#5a1a06" opacity={0.18} />
      <ellipse cx={f(x)} cy={f(y)} rx={f(R)} ry={f(R * 0.82)} fill="none" stroke={FIRE} strokeWidth={2.5} strokeOpacity={0.55} strokeDasharray="12 8" strokeDashoffset={f(-t * 30)} />
      {embers}
      {archers}
      {shots}
    </g>
  );
};
