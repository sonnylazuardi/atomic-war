import type { HeroArt } from '../types.ts';
import { clamp01, easeOut, lerp } from '../types.ts';
import { Bow, Flame, Frame, Glow, Limb, OL, legs, olp, pose, r2 } from './parts2.tsx';

const BONE = '#ece2c8';
const BONE_D = '#b8ab8a';
const CLOTH = '#5a1f1a';
const CLOTH_D = '#3a1210';
const WOOD = '#4a2c1c';
const WOOD_D = '#2a170e';
const EMBER = '#ff8a2a';

type P = [number, number];

export const Clinkz: HeroArt = ({ anim, t, dur, team }) => {
  const p = pose(anim, t, dur, 1.5, 0.58);
  const tt = p.t;
  const atk = anim === 'attack';
  const cast = anim === 'cast';
  const [bl, fl] = legs(p, { hipY: -24, spread: 5, w: 2.6, c: BONE, cBack: BONE_D, boot: '#3b2a22', bootW: 4.5, stride: 8, lift: 4.5 });

  const gx = 17;
  const gy = -42;
  const rest: P = [-5, -30];
  const drawX = atk && p.k < 0.5 ? lerp(gx - 7, gx - 25, p.charge) : gx - 7;
  let bowRot = 20 + p.breathe * 2;
  if (p.walking) bowRot = 28 + Math.sin(p.wph) * 4;
  else if (atk) bowRot = p.k < 0.6 ? lerp(20, 0, clamp01(p.k / 0.15)) : lerp(0, 20, (p.k - 0.6) / 0.4);
  else if (cast) bowRot = lerp(20, 40, p.raise);
  else if (p.hurt) bowRot = 48;
  let hand: P = rest;
  if (atk) hand = p.k < 0.5 ? [lerp(rest[0], drawX, easeOut(p.k / 0.12)), lerp(rest[1], gy, easeOut(p.k / 0.12))] : [lerp(rest[0], gx - 16, p.strike), lerp(rest[1], gy - 3, p.strike)];
  else if (cast) hand = [lerp(rest[0], -12, p.raise), lerp(rest[1], -54, p.raise)];
  else if (p.hurt) hand = [-11, -36];
  else if (p.walking) hand = [-5 + Math.sin(p.wph) * 5, -30];
  const nocked = atk && p.k < 0.5;
  const sh: P = [-4, -43];
  const el: P = [lerp(sh[0], hand[0], 0.5) - 3, lerp(sh[1], hand[1], 0.5) + 2];
  const fsh: P = [5, -43];
  const fel: P = [lerp(fsh[0], gx, 0.5), lerp(fsh[1], gy, 0.5) + 3];

  const flare = cast ? p.glow : 0;
  const live = anim !== 'dead' ? 1 : 1 - p.fall;
  const hairH = (9 + flare * 8) * live;

  return (
    <Frame p={p} team={team} headY={-82}>
      {flare > 0 ? <Glow x={0} y={-38} r={22 + flare * 18} c={EMBER} o={0.5 + p.cflash * 0.4} /> : null}
      {/* flare ring of flames */}
      {flare > 0
        ? [-14, -9, -4, 3, 9, 14].map((x, i) => <Flame key={i} x={x} y={-1} h={(8 + (i % 3) * 4) * flare + p.cflash * 6} w={3} t={tt} seed={i} />)
        : null}
      <g transform={`translate(0,${r2(p.bob)}) rotate(${r2(p.lean)},0,-24)`}>
        {/* back flaming hair */}
        <Flame x={-3} y={-58} h={hairH * 1.1} w={4} t={tt} seed={1} lean={-4} />
        <Limb p={[sh, el, hand]} w={2.4} c={BONE_D} />
        {atk || cast ? null : <circle cx={r2(hand[0])} cy={r2(hand[1])} r={1.8} {...olp(BONE_D, 1)} />}
      </g>
      {bl}
      {fl}
      <g transform={`translate(0,${r2(p.bob)}) rotate(${r2(p.lean)},0,-24)`}>
        {/* tattered loincloth */}
        <path d="M-6,-26 L7,-26 L8,-17 L5,-19 L3,-14 L0,-18 L-3,-13 L-5,-18 L-7,-16 Z" {...olp(CLOTH, 1.4)} />
        <path d="M-6,-26 L-2,-26 L-3,-14 L-5,-18 L-7,-16 Z" fill={CLOTH_D} />
        {/* spine + pelvis */}
        <Limb p={[[0, -44], [-1, -36], [0, -26]]} w={2.6} c={BONE} />
        <path d="M-5,-28 Q0,-31 6,-28 L5,-24 Q0,-26 -4,-24 Z" {...olp(BONE, 1.3)} />
        {/* ribcage */}
        <path d="M-6,-45 Q1,-48 8,-45 Q9,-38 6,-33 Q1,-31 -5,-33 Q-8,-38 -6,-45 Z" {...olp(BONE)} />
        {[-42, -39, -36].map((y) => (
          <path key={y} d={`M-4.5,${y} Q1.5,${y + 2} 7,${y}`} fill="none" stroke={OL} strokeWidth={1.1} />
        ))}
        <path d="M-6,-45 Q-8,-38 -5,-33 L-3,-33 Q-5,-39 -3,-46 Z" fill={BONE_D} />
        {/* shoulder pad */}
        <path d="M-1,-46 Q6,-51 12,-44 Q9,-41 5,-40 Q2,-43 -1,-46 Z" {...olp('#3b2a22', 1.4)} />
        <path d="M1,-46 Q6,-49 10,-44" fill="none" stroke={EMBER} strokeWidth={0.9} />
        {/* skull */}
        <circle cx={5} cy={-54} r={7.4} {...olp(BONE)} />
        <path d="M-1,-50 Q1,-47 5,-47 Q0,-49 -1,-54 Z" fill={BONE_D} />
        <path d="M3,-50 L12,-50.5 L11,-46 L4,-46.5 Z" {...olp(BONE, 1.2)} />
        <path d="M5.5,-50 L5.5,-47 M7.5,-50 L7.5,-47 M9.5,-50 L9.5,-47" stroke={OL} strokeWidth={0.7} />
        <ellipse cx={8.6} cy={-55} rx={2.3} ry={2.1} fill={OL} />
        <circle cx={8.8} cy={-55} r={1.1} fill="#ffd23d" />
        <Glow x={8.8} y={-55} r={3.5 + flare * 3} c={EMBER} o={live} />
        <path d="M11.3,-52.5 L12.3,-51.5 L11,-51.4 Z" fill={OL} />
        {/* front flaming hair */}
        <Flame x={2} y={-59} h={hairH} w={4.5} t={tt} seed={2} lean={-3} />
        <Flame x={6.5} y={-60} h={hairH * 0.8} w={3.2} t={tt} seed={3} lean={-2} />
        {/* burning bow + front arm */}
        <Bow gx={gx} gy={gy} h={36} drawX={drawX} wood={WOOD} woodDark={WOOD_D} str="#ffcf8a" rot={bowRot} arrow={nocked ? { color: '#3b2418', tip: '#ffb347' } : null} />
        <g transform={`rotate(${r2(bowRot)},${gx},${gy})`}>
          <Flame x={gx - 3} y={gy - 12} h={5 * live} w={1.8} t={tt} seed={5} />
          <Flame x={gx - 3} y={gy + 14} h={5 * live} w={1.8} t={tt} seed={6} />
          {nocked ? <Flame x={gx + 12} y={gy + 1} h={5 + p.charge * 3} w={2} t={tt} seed={7} /> : null}
        </g>
        <Limb p={[fsh, fel, [gx, gy]]} w={2.6} c={BONE} />
        <circle cx={gx} cy={gy} r={2} {...olp(BONE, 1)} />
        {atk || cast ? <circle cx={r2(hand[0])} cy={r2(hand[1])} r={1.8} {...olp(BONE_D, 1)} /> : null}
        {cast ? <Flame x={hand[0]} y={hand[1]} h={6 + flare * 6} w={2.6} t={tt} seed={9} /> : null}
        {atk && p.k > 0.47 && p.flash > 0.05 ? (
          <g opacity={r2(p.flash)}>
            <line x1={gx} y1={gy} x2={gx + 34} y2={gy} stroke={EMBER} strokeWidth={2.4} strokeLinecap="round" />
            <line x1={gx} y1={gy} x2={gx + 34} y2={gy} stroke="#ffe14d" strokeWidth={0.9} strokeLinecap="round" />
            <Glow x={gx + 6} y={gy} r={9} c={EMBER} />
          </g>
        ) : null}
      </g>
      {cast && p.cflash > 0.05 ? <circle cx={0} cy={-40} r={r2(24 + p.cflash * 18)} fill="none" stroke="#ffd27a" strokeWidth={r2(3 * p.cflash)} opacity={r2(p.cflash)} /> : null}
    </Frame>
  );
};
