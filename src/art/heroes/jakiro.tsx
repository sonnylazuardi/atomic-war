import type { ReactNode } from 'react';
import type { HeroArt } from '../types.ts';
import { clamp01, easeOut, loop } from '../types.ts';
import { Frame, Glow, Limb, OL, Sparkle, legs, olp, pose, r2 } from './parts2.tsx';

const ICE = '#5fb3e8';
const ICE_D = '#3a7fb8';
const ICE_L = '#bfe8ff';
const FIRE = '#ef6a2e';
const FIRE_D = '#b8401c';
const FIRE_L = '#ffb070';
const BELLY = '#f0d9a8';
const WING = '#6a4c8a';
const WING_D = '#45305c';

type Kind = 'ice' | 'fire';

/** breath particles in head-local coords (mouth at x=11) */
function breath(kind: Kind, parts: { q: number; i: number }[], L: number, spread: number, size: number) {
  const outer = kind === 'fire' ? '#ff8a2a' : '#8fd6ff';
  const inner = kind === 'fire' ? '#ffe14d' : '#f2fbff';
  return parts.map(({ q, i }) => {
    if (q <= 0 || q >= 1) return null;
    const x = 11 + q * L;
    const y = Math.sin(i * 2.3) * q * spread + q * 2;
    const r = (1.4 + q * 4.5) * size;
    return (
      <g key={i} opacity={r2(1 - q * q)}>
        <circle cx={r2(x)} cy={r2(y)} r={r2(r)} fill={outer} opacity={0.7} />
        <circle cx={r2(x)} cy={r2(y)} r={r2(r * 0.55)} fill={inner} />
        {kind === 'ice' && i % 2 === 0 ? <Sparkle x={x + r * 0.6} y={y - r * 0.6} s={r * 0.6} /> : null}
      </g>
    );
  });
}

function head(kind: Kind, x: number, y: number, ang: number, open: number, extra: ReactNode) {
  const c = kind === 'ice' ? ICE : FIRE;
  const cd = kind === 'ice' ? ICE_D : FIRE_D;
  const cl = kind === 'ice' ? ICE_L : FIRE_L;
  return (
    <g transform={`translate(${r2(x)},${r2(y)}) rotate(${r2(ang)})`}>
      {kind === 'ice' ? (
        <g>
          <path d="M-4,-4 L-12,-11 L-3,-7 Z" {...olp(ICE_L, 1.2)} />
          <path d="M-1,-5.5 L-5,-14 L1,-6.5 Z" {...olp('#e8f8ff', 1.2)} />
        </g>
      ) : (
        <g>
          <path d="M-4,-4 Q-9,-8 -12,-5 Q-8,-11 -2,-7 Z" {...olp('#3b2a22', 1.2)} />
          <path d="M-1,-5.5 Q-4,-12 -8,-12 Q-3,-15 1,-6.5 Z" {...olp('#3b2a22', 1.2)} />
        </g>
      )}
      {/* lower jaw */}
      <g transform={`rotate(${r2(open)},-3,0)`}>
        <path d="M-4,0 L9,0.8 Q9.5,2.8 7,3.4 L-2,4 Z" {...olp(cd, 1.3)} />
        <path d="M2,0.6 L3,-0.6 L4,0.7 M5.5,0.7 L6.5,-0.5 L7.5,0.8" fill="#fff" stroke="none" />
      </g>
      {/* skull + snout */}
      <path d="M-6,-1 Q-6,-7 1,-7 Q6,-6.5 10,-3.8 Q12.5,-2.2 11.4,-0.4 L2,0.4 L-4,2 Z" {...olp(c, 1.5)} />
      <path d="M-6,-1 Q-6,-5 -2,-6.4 Q-3,-2 -2,1.2 L-4,2 Z" fill={cd} />
      <path d="M2,-5.6 Q6,-5 9.5,-3" fill="none" stroke={cl} strokeWidth={1} strokeLinecap="round" />
      <circle cx={10.2} cy={-2.6} r={0.55} fill={OL} />
      <ellipse cx={2.2} cy={-3.6} rx={1.6} ry={1.3} fill={kind === 'ice' ? '#eaffff' : '#ffe14d'} stroke={OL} strokeWidth={0.7} />
      <line x1={2.4} y1={-4.6} x2={2.4} y2={-2.6} stroke={OL} strokeWidth={0.7} />
      {extra}
    </g>
  );
}

export const Jakiro: HeroArt = ({ anim, t, dur, team }) => {
  const p = pose(anim, t, dur, 1.8, 0.62);
  const tt = p.t;
  const atk = anim === 'attack';
  const cast = anim === 'cast';
  const [bl, fl] = legs(p, { hipY: -13, spread: 9, w: 6, c: FIRE, cBack: ICE_D, boot: '#3b2a22', bootW: 6, stride: 5, lift: 3.5 });
  const waddle = p.walking ? Math.sin(p.wph) * 4 : 0;

  const rear = cast ? (p.k < 0.45 ? easeOut(p.k / 0.45) : 1 - easeOut((p.k - 0.45) / 0.15)) : 0;
  const castBreath = cast && p.k > 0.45 && p.k < 0.94 ? Math.min(1, (p.k - 0.45) / 0.08, (0.94 - p.k) / 0.08) : 0;

  // fire head (front)
  let fx = 14 + Math.sin(tt * 2.2) * 1.2;
  let fy = -48 + Math.cos(tt * 2.2) * 1;
  let fang = 6;
  let fopen = 4;
  // ice head (back, higher)
  let ix = -3 + Math.sin(tt * 2.2 + 1.7) * 1.2;
  let iy = -60 + Math.cos(tt * 2.2 + 1.7) * 1;
  let iang = -4;
  let iopen = 4;
  if (p.walking) {
    fy += Math.sin(p.wph * 2) * 1.5;
    iy += Math.sin(p.wph * 2 + 1) * 1.5;
    fx += 2;
    ix += 2;
  }
  if (atk) {
    fx += -5 * p.charge + 4 * p.strike;
    fy += -2 * p.charge;
    fang += -22 * p.charge + 14 * p.strike;
    fopen = 4 + 26 * p.charge + 24 * p.strike;
    const ik = clamp01((p.k - 0.5) / 0.2);
    iopen = 4 + 20 * Math.sin(Math.PI * clamp01((p.k - 0.45) / 0.45));
    iang += -12 * Math.sin(Math.PI * clamp01((p.k - 0.4) / 0.25)) + 8 * ik * (1 - ik);
  }
  if (cast) {
    fx += -7 * rear + castBreath * 3;
    fy += -6 * rear;
    fang += -32 * rear + castBreath * 8;
    ix += -7 * rear + castBreath * 4;
    iy += -4 * rear;
    iang += -32 * rear + castBreath * 12;
    fopen = 4 + 24 * rear + 26 * castBreath;
    iopen = 4 + 24 * rear + 26 * castBreath;
  }
  if (p.hurt) {
    fang = 30 + Math.sin(tt * 9) * 10;
    iang = -30 + Math.sin(tt * 9 + 2) * 10;
    fopen = iopen = 12;
  }
  if (anim === 'dead') {
    fang = 40 * p.fall;
    iang = 30 * p.fall;
    fopen = iopen = 10 * p.fall;
  }

  // breath particles
  const N = 7;
  let fireParts: { q: number; i: number }[] = [];
  let iceParts: { q: number; i: number }[] = [];
  let fireL = 30;
  let iceL = 26;
  let size = 1;
  if (atk) {
    const fq = (p.k - 0.47) / 0.45;
    fireParts = Array.from({ length: N }, (_, i) => ({ q: fq * 1.4 - i * 0.07, i }));
    const iq = (p.k - 0.6) / 0.38;
    iceParts = Array.from({ length: 5 }, (_, i) => ({ q: iq * 1.4 - i * 0.08, i }));
    iceL = 20;
    size = 0.9;
  } else if (castBreath > 0) {
    fireParts = Array.from({ length: 10 }, (_, i) => ({ q: loop(tt * 3 + i / 10, 1), i }));
    iceParts = Array.from({ length: 10 }, (_, i) => ({ q: loop(tt * 3 + i / 10 + 0.05, 1), i }));
    fireL = 42;
    iceL = 42;
    size = 1.15 * castBreath;
  }

  const flap = Math.sin(tt * (p.walking ? 12 : 6)) * 14 + (cast ? -20 * rear : 0);
  const tailSw = Math.sin(tt * 2.5) * 3 + (p.walking ? Math.sin(p.wph) * 3 : 0);

  return (
    <Frame p={p} team={team} headY={-82} rx={19}>
      {cast ? (
        <g>
          <Glow x={-1} y={-58} r={8 + rear * 8 + castBreath * 8} c={ICE} o={0.7} />
          <Glow x={14} y={-48} r={8 + rear * 8 + castBreath * 8} c={FIRE} o={0.7} />
        </g>
      ) : null}
      {/* tail */}
      <g transform={`translate(0,${r2(p.bob)}) rotate(${r2(waddle)},0,0)`}>
        <path
          d={`M-8,-25 Q-20,-20 ${r2(-27 + tailSw * 0.3)},-9 L${r2(-35 + tailSw)},${r2(-6 - tailSw * 0.3)} L${r2(-27 + tailSw * 0.5)},-4 Q-18,-10 -7,-13 Z`}
          {...olp(ICE_D, 1.6)}
        />
        <path d={`M${r2(-35 + tailSw)},${r2(-6 - tailSw * 0.3)} l5,-4 l0,6 Z`} {...olp(ICE_L, 1.1)} />
        {/* back wing */}
        <g transform={`translate(-3,-31) rotate(${r2(-flap)})`}>
          <path d="M0,0 L-6,-13 L-16,-12 Q-13,-8 -15,-4 Q-10,-5 -9,-1 Q-5,-2 0,0 Z" {...olp(WING_D, 1.4)} />
        </g>
      </g>
      {bl}
      {fl}
      <g transform={`translate(0,${r2(p.bob)}) rotate(${r2(waddle + p.lean * 0.4)},0,0)`}>
        {/* necks */}
        <Limb p={[[-4, -30], [-7 + (ix + 3) * 0.3, -44 + (iy + 60) * 0.3], [ix - 3, iy + 1]]} w={5.5} c={ICE} />
        <Limb p={[[5, -29], [10 + (fx - 14) * 0.3, -37 + (fy + 48) * 0.3], [fx - 3, fy + 1]]} w={5.5} c={FIRE} />
        {/* body: icy back half, fiery front half */}
        <ellipse cx={0} cy={-22} rx={13} ry={12.5} {...olp(ICE)} />
        <path d="M0,-34.5 A13,12.5 0 0 1 0,-9.5 Q-3,-22 0,-34.5 Z" fill={FIRE} />
        <path d="M-12,-20 A13,12.5 0 0 0 -4,-10.5 Q-10,-14 -12,-20 Z" fill={ICE_D} />
        <path d="M5,-31 Q12,-24 8,-12 Q4,-10 1,-11 Q6,-20 2,-31 Z" fill={BELLY} stroke={OL} strokeWidth={1} />
        {[-26, -21, -16].map((y) => (
          <path key={y} d={`M${r2(3.4 + (y + 26) * 0.1)},${y} L${r2(8.4 - (y + 26) * 0.06)},${y + 1}`} stroke="#c8ab74" strokeWidth={0.8} />
        ))}
        <ellipse cx={0} cy={-22} rx={13} ry={12.5} fill="none" stroke={OL} strokeWidth={1.8} />
        {/* front wing */}
        <g transform={`translate(-1,-32) rotate(${r2(-flap * 0.8 + 8)})`}>
          <path d="M0,0 L-5,-14 L-15,-14 Q-12,-10 -14,-6 Q-9,-7 -8,-2 Q-4,-3 0,0 Z" {...olp(WING, 1.5)} />
          <path d="M0,0 L-10,-11 M0,0 L-9,-5" stroke={WING_D} strokeWidth={0.9} />
        </g>
        {/* heads */}
        {head('ice', ix, iy, iang, iopen, breath('ice', iceParts, iceL, 5, size))}
        {head('fire', fx, fy, fang, fopen, breath('fire', fireParts, fireL, 6, size))}
      </g>
      {cast && p.cflash > 0.05 ? <circle cx={8} cy={-50} r={r2(16 + p.cflash * 16)} fill="#fff1d8" opacity={r2(p.cflash * 0.3)} /> : null}
    </Frame>
  );
};
