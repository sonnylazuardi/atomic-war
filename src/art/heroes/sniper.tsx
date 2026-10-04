import type { HeroArt } from '../types.ts';
import { clamp01, easeOut, lerp } from '../types.ts';
import { Blob, Frame, Glow, Limb, OL, legs, olp, pose, pts, r2 } from './parts2.tsx';

const SKIN = '#f0c8a0';
const SKIN_D = '#cf9f74';
const TUNIC = '#6e7d3a';
const TUNIC_D = '#4f5b28';
const CAP = '#8a5a32';
const CAP_D = '#6a4224';
const STACHE = '#f1ead8';
const STACHE_D = '#cfc4a8';
const WOOD = '#9a6634';
const WOOD_D = '#6e4420';
const STEEL = '#8d96a0';
const STEEL_D = '#4d545c';

type P = [number, number];

function flashPath(x: number, y: number, r: number) {
  const p: P[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const rr = i % 2 === 0 ? r * (i % 4 === 0 ? 1.6 : 1) : r * 0.4;
    p.push([x + Math.cos(a) * rr * (Math.cos(a) > 0 ? 1.4 : 0.8), y + Math.sin(a) * rr * 0.75]);
  }
  return `M${pts(p)}Z`;
}

export const Sniper: HeroArt = ({ anim, t, dur, team }) => {
  const p = pose(anim, t, dur, 1.5, 0.45);
  const tt = p.t;
  const atk = anim === 'attack';
  const cast = anim === 'cast';
  const aim = atk ? clamp01(p.k / 0.3) : cast ? easeOut(clamp01(p.k / 0.4)) * (p.k < 0.88 ? 1 : 1 - (p.k - 0.88) / 0.12) : 0;
  const aimE = easeOut(aim);

  let ang = -28 + p.breathe * 2;
  if (p.walking) ang = -38 + Math.sin(p.wph * 2) * 3;
  else if (p.hurt) ang = -50;
  ang = lerp(ang, -1, aimE);
  const kick = atk ? p.flash : 0;
  ang -= kick * 12;
  if (anim === 'dead') ang = lerp(-28, 84, p.fall);
  const back = -5 * kick;
  const crouch = aimE * 2;

  const px = 5 + back;
  const py = -24 + crouch;
  const ra = (ang * Math.PI) / 180;
  const rot = (lx: number, ly: number): P => [px + lx * Math.cos(ra) - ly * Math.sin(ra), py + lx * Math.sin(ra) + ly * Math.cos(ra)];
  const grip = rot(0, 2.5);
  const support = rot(15, 2);

  const [bl, fl] = legs(p, { hipY: -13, spread: 6, w: 4.6, c: '#5a4030', cBack: '#46301f', boot: '#3b2a1e', bootW: 5, stride: 5, lift: 3.5 });
  const headDx = aimE * 2 - kick * 2;
  const headDy = aimE * 2;
  const laserO = cast ? aim * (0.75 + Math.sin(tt * 40) * 0.25) : 0;
  const castShot = cast ? p.cflash * (p.k > 0.55 ? 1 : 0) : 0;

  return (
    <Frame p={p} team={team} headY={-66} rx={15}>
      {bl}
      {fl}
      <g transform={`translate(0,${r2(p.bob + crouch * 0.5)}) rotate(${r2(p.lean * 0.5 - kick * 6)},0,-13)`}>
        {/* back arm to trigger grip */}
        <Limb p={[[-3, -27], [lerp(-3, grip[0], 0.5) - 1, lerp(-27, grip[1], 0.5) + 3], grip]} w={4.2} c={TUNIC_D} />
        {/* body */}
        <path d="M-8,-30 Q1,-34 9,-30 Q13,-22 10,-12 Q1,-9 -9,-12 Q-12,-22 -8,-30 Z" {...olp(TUNIC)} />
        <path d="M-8,-30 Q-12,-22 -9,-12 Q-6,-11 -4,-11 Q-7,-20 -3,-31 Z" fill={TUNIC_D} />
        <path d="M-10,-17 Q1,-14 11,-17 L11,-14 Q1,-11 -10,-14 Z" {...olp('#5e3d22', 1.2)} />
        <rect x={0} y={-17.3} width={4} height={3.6} rx={0.8} {...olp('#d9b35a', 0.9)} />
        {/* ammo bandolier */}
        <path d="M-6,-30 L8,-17" stroke={OL} strokeWidth={3.4} />
        <path d="M-6,-30 L8,-17" stroke="#6b4a2e" strokeWidth={2} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={-4 + i * 3.2} y={-28 + i * 2.9} width={1.4} height={2.6} fill="#e3b748" transform={`rotate(-42,${-3.3 + i * 3.2},${-26.7 + i * 2.9})`} />
        ))}
        {/* rifle */}
        <g transform={`translate(${r2(px)},${r2(py)}) rotate(${r2(ang)})`}>
          {/* stock */}
          <path d="M-16,-1 L-3,-2 L-1,3.5 L-6,4 Q-11,6.5 -16,6 Z" {...olp(WOOD, 1.6)} />
          <path d="M-16,3.6 Q-11,4.4 -6,2.8 L-6,4 Q-11,6.5 -16,6 Z" fill={WOOD_D} />
          {/* receiver */}
          <rect x={-3} y={-2.4} width={15} height={5} rx={1} {...olp(STEEL_D, 1.6)} />
          <path d="M1,2.5 L4,2.5 L3,6 L1.5,6 Z" {...olp(STEEL_D, 1)} />
          {/* barrel */}
          <rect x={11} y={-1.3} width={45} height={2.6} rx={0.8} {...olp(STEEL, 1.4)} />
          <line x1={12} y1={-0.4} x2={55} y2={-0.4} stroke="#c6ccd3" strokeWidth={0.7} />
          <rect x={55} y={-2.2} width={6} height={4.4} rx={0.8} {...olp(STEEL_D, 1.3)} />
          {/* wooden fore-end */}
          <path d="M11,1 L28,1 Q29,3.5 26,4 L12,4 Z" {...olp(WOOD, 1.3)} />
          {/* scope */}
          <rect x={0} y={-7} width={15} height={3.4} rx={1.4} {...olp('#2e3238', 1.4)} />
          <rect x={14} y={-7.8} width={3} height={5} rx={0.8} {...olp('#2e3238', 1.2)} />
          <rect x={-2} y={-7.6} width={3} height={4.6} rx={0.8} {...olp('#2e3238', 1.2)} />
          <circle cx={17} cy={-5.3} r={1.4} fill={laserO > 0 ? '#ff3b3b' : '#7fd3ff'} />
          <line x1={5} y1={-3.6} x2={5} y2={-2.4} stroke={OL} strokeWidth={1.4} />
          {/* laser sight */}
          {laserO > 0.02 ? (
            <g opacity={r2(laserO)}>
              <line x1={17} y1={-5.3} x2={200} y2={-5.3} stroke="#ff3b3b" strokeWidth={2.6} opacity={0.3} />
              <line x1={17} y1={-5.3} x2={200} y2={-5.3} stroke="#ff5050" strokeWidth={0.8} />
              <Glow x={17} y={-5.3} r={4} c="#ff3b3b" />
            </g>
          ) : null}
          {/* muzzle flash */}
          {kick + castShot > 0.05 ? (
            <g>
              <Glow x={66} y={0} r={14 * (kick + castShot)} c="#ffb547" />
              <path d={flashPath(66, 0, 7 * (kick + castShot))} fill="#ffd23d" stroke="#ff8a1f" strokeWidth={1} strokeLinejoin="round" />
              <path d={flashPath(64, 0, 3.5 * (kick + castShot))} fill="#fffbe6" />
            </g>
          ) : null}
          {atk && p.k > 0.55 ? (
            <g opacity={r2(0.8 * (1 - (p.k - 0.55) / 0.45))}>
              <Blob c={[[60 + (p.k - 0.55) * 30, -2 - (p.k - 0.55) * 18, 2 + (p.k - 0.55) * 9], [55 + (p.k - 0.55) * 20, -1 - (p.k - 0.55) * 10, 1.5 + (p.k - 0.55) * 6]]} fill="#d8d4cc" ow={0.8} />
            </g>
          ) : null}
        </g>
        {/* head */}
        <g transform={`translate(${r2(headDx)},${r2(headDy)})`}>
          <path d="M-7,-43 L-15,-50 L-8,-38 Z" {...olp(SKIN, 1.4)} />
          <path d="M-8,-42 L-12,-47 L-8,-40 Z" fill={SKIN_D} />
          <circle cx={3} cy={-40} r={10} {...olp(SKIN)} />
          <path d="M-6,-36 Q-3,-31 3,-30 Q-4,-34 -4,-40 Z" fill={SKIN_D} />
          {/* beard + moustache */}
          <Blob c={[[6, -32, 3.4], [9, -31, 3], [3, -33, 2.6]]} fill={STACHE_D} ow={2.4} />
          <Blob
            c={[
              [6, -36, 3.6],
              [11, -36.5, 3.6],
              [15.5, -35.2, 3],
              [18.5, -33, 2.4],
              [2.5, -35, 2.8],
              [0, -32.5, 2],
            ]}
            fill={STACHE}
            shade={STACHE_D}
            ow={2.4}
          />
          <circle cx={13} cy={-40} r={3.2} {...olp('#e9a98a', 1.3)} />
          {/* eye */}
          {aimE > 0.5 ? (
            <path d="M6.5,-43.5 L10.5,-43.8" stroke={OL} strokeWidth={1.3} strokeLinecap="round" />
          ) : (
            <g>
              <ellipse cx={8.5} cy={-43.5} rx={1.5} ry={1.7} fill="#fff" stroke={OL} strokeWidth={0.8} />
              <circle cx={9.1} cy={-43.4} r={0.7} fill={OL} />
            </g>
          )}
          <path d="M6,-46.5 L11,-46" stroke={STACHE_D} strokeWidth={1.4} strokeLinecap="round" />
          {/* cap with ear flap */}
          <path d="M-9,-43 Q-9,-56 3,-56 Q13,-56 13.5,-47 L-9,-43 Z" {...olp(CAP)} />
          <path d="M-9,-43 Q-9,-56 3,-56 Q-3,-52 -3,-44 Z" fill={CAP_D} />
          <path d="M11,-48 Q17,-48.5 21,-46 Q16,-45 11,-45.5 Z" {...olp(CAP_D, 1.3)} />
          <path d="M-9,-44 L-6,-44 L-5,-36 Q-8,-36 -9,-38 Z" {...olp(CAP_D, 1.3)} />
          <circle cx={3} cy={-56.2} r={1.6} {...olp('#c33', 1)} />
        </g>
        {/* front arm supporting barrel */}
        <Limb p={[[4, -27], [lerp(4, support[0], 0.55), lerp(-27, support[1], 0.55) + 3.5], support]} w={4.4} c={TUNIC} />
        <circle cx={r2(support[0])} cy={r2(support[1])} r={2.4} {...olp(SKIN, 1.2)} />
        <circle cx={r2(grip[0])} cy={r2(grip[1])} r={2.2} {...olp(SKIN_D, 1.1)} />
      </g>
    </Frame>
  );
};
