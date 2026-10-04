// Alchemist lord: Razzil the goblin riding on Mauler the ogre, waving a golden flask, chemical haze.
// HeroArtProps contract: local coords, feet at origin, facing right, pure function of t.
import { Blob, Limb, olp, pose, r2 } from '../heroes/parts2.tsx';
import { SoftGlow } from './soft.tsx';
import type { HeroArt } from '../types.ts';
import { bump, loop } from '../types.ts';

const OGRE = '#b9876a';
const OGRE_D = '#8c5f47';
const OGRE_L = '#d6a587';
const IRON = '#5b616c';
const IRON_L = '#9aa3b0';
const LEATHER = '#5a3a24';
const COPPER = '#b8682e';
const COPPER_L = '#e09a55';
const GOB = '#8fb34a';
const GOB_D = '#678a2f';
const VEST = '#8a2f24';
const GOLD = '#f2c14e';
const GOLD_D = '#b8842a';
const CHEM = '#9be33a';

export const AlchemistLord: HeroArt = ({ anim, t, dur }) => {
  const p = pose(anim, t, dur, 1.9);
  const tt = p.t;
  const br = p.breathe;
  const cast = p.raise;
  // goblin waves the flask
  const wave = Math.sin(tt * 2.6);
  const fx = 17 + wave * 2.5 + cast * 3;
  const fy = -86 - Math.max(0, wave) * 3 - cast * 8 + br * 0.6;
  const slosh = Math.sin(tt * 5.2) * 0.9;

  const haze = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const q = loop(tt + i * 0.53, 3.7);
    const x = -34 + ((i * 11 + q * 30) % 70);
    const y = -3 - q * 16 - (i % 3) * 2;
    const r = 5 + (i % 3) * 2 + q * 5;
    return <SoftGlow key={i} x={x} y={y} r={r * 1.4} ry={r} c={i % 2 ? CHEM : '#c9e86a'} o={0.55 * bump(q)} />;
  });
  const bubbles = [0, 1, 2].map((i) => {
    const q = loop(tt + i * 0.4, 1.2);
    return <circle key={i} cx={r2(fx + Math.sin(q * 9 + i) * 1.5)} cy={r2(fy - 9 - q * 12)} r={r2(1 + q * 1.4)} fill="none" stroke={CHEM} strokeWidth={0.8} opacity={r2(1 - q)} />;
  });

  return (
    <g>
      <ellipse cx={0} cy={0} rx={30} ry={5} fill="#000" opacity={0.35} />
      {haze.slice(0, 3)}
      <g transform={`translate(0,${r2(br * 0.8)})`}>
        {/* back leg + back arm */}
        <Limb p={[[-8, -18], [-10, -9], [-10, -3]]} w={11} c={OGRE_D} />
        <path d="M-17,0 Q-17,-6 -10,-6 Q-3,-6 -3,0 Z" {...olp(LEATHER)} />
        <Limb p={[[-15, -48], [-24, -32 + br], [-22, -16 + br]]} w={9} c={OGRE_D} />
        <circle cx={-22} cy={r2(-14 + br)} r={6} {...olp(OGRE_D)} />
        {/* chemical tank on the back */}
        <rect x={-34} y={-62} width={14} height={30} rx={5} {...olp(COPPER, 1.8)} />
        <rect x={-32} y={-59} width={4} height={24} rx={2} fill={COPPER_L} opacity={0.7} />
        <rect x={-35} y={-50} width={16} height={4} {...olp(IRON, 1.2)} />
        <path d="M-27,-62 Q-27,-72 -16,-70" fill="none" stroke="#14110f" strokeWidth={3.6} strokeLinecap="round" />
        <path d="M-27,-62 Q-27,-72 -16,-70" fill="none" stroke={IRON_L} strokeWidth={1.8} strokeLinecap="round" />
        <circle cx={-27} cy={-40} r={2.6} fill={CHEM} opacity={r2(0.6 + 0.4 * Math.sin(tt * 4))} />
        {/* body */}
        <path d="M-17,-52 Q-27,-34 -17,-15 Q0,-9 17,-17 Q25,-32 19,-49 Q4,-60 -17,-52 Z" {...olp(OGRE, 2)} />
        <path d="M-17,-52 Q-27,-34 -17,-15 Q-10,-12 -4,-12 Q-15,-30 -9,-53 Z" fill={OGRE_D} opacity={0.7} />
        <path d="M2,-44 Q14,-42 17,-30" fill="none" stroke={OGRE_L} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
        <path d="M-2,-28 Q5,-24 12,-27" fill="none" stroke={OGRE_D} strokeWidth={1.2} strokeLinecap="round" />
        {/* loincloth + belt */}
        <path d="M-18,-19 Q0,-12 18,-20 L16,-14 Q0,-7 -17,-13 Z" {...olp(LEATHER, 1.5)} />
        <path d="M-4,-14 L8,-15 L6,-3 L-2,-4 Z" {...olp('#7d5634', 1.4)} />
        <rect x={-2} y={-19} width={6} height={5} rx={1} {...olp(GOLD, 1.2)} />
        {/* chest strap */}
        <path d="M-14,-50 L16,-22" stroke="#14110f" strokeWidth={5.5} strokeLinecap="round" />
        <path d="M-14,-50 L16,-22" stroke={LEATHER} strokeWidth={3.5} strokeLinecap="round" />
        {/* ogre head: low and forward, iron muzzle */}
        <circle cx={18} cy={-50} r={9} {...olp(OGRE, 1.8)} />
        <path d="M12,-56 Q19,-61 26,-55" fill="none" stroke="#14110f" strokeWidth={2.4} strokeLinecap="round" />
        <circle cx={21.5} cy={-52.5} r={1.4} fill="#ffdd55" />
        <path d="M14,-47 L28,-48 L27,-40 Q20,-37 14,-40 Z" {...olp(IRON, 1.5)} />
        {[17, 20.5, 24].map((x) => (
          <line key={x} x1={x} y1={-47.5} x2={x} y2={-39.5} stroke="#14110f" strokeWidth={1} />
        ))}
        <path d="M25,-46 L28,-51 L27,-45 Z" {...olp('#f1e9d6', 0.9)} />
        {/* front leg */}
        <Limb p={[[8, -18], [10, -9], [10, -3]]} w={12} c={OGRE} />
        <path d="M3,0 Q3,-7 11,-7 Q19,-7 19,0 Z" {...olp(LEATHER)} />
        {/* goblin: legs dangling over the ogre's front shoulder */}
        <Limb p={[[-3, -60], [7, -57], [9, -50]]} w={4} c={GOB_D} />
        <path d="M6,-50 L13,-50 L12,-47 L6,-47 Z" {...olp(LEATHER, 1.1)} />
        <g transform={`translate(0,${r2(Math.abs(Math.sin(tt * 2.6)) * -1.2)})`}>
          <path d="M-9,-60 Q-11,-72 -3,-75 Q5,-75 6,-66 L5,-58 Q-2,-55 -9,-60 Z" {...olp(VEST, 1.6)} />
          <path d="M-3,-74 L-1,-58" stroke={GOLD} strokeWidth={1.2} />
          {/* back arm holding a coin */}
          <Limb p={[[-6, -70], [-12, -64], [-15, -69]]} w={3.4} c={GOB_D} />
          <ellipse cx={-16} cy={-71} rx={r2(Math.abs(Math.cos(tt * 4)) * 2.6 + 0.4)} ry={2.6} {...olp(GOLD, 1)} />
          {/* head: big ears, goggles, grin */}
          <path d="M-5,-80 Q-15,-84 -19,-80 Q-13,-77 -5,-76 Z" {...olp(GOB, 1.4)} />
          <circle cx={1} cy={-79} r={7} {...olp(GOB, 1.6)} />
          <path d="M-5,-77 Q-3,-73 2,-72.5 Q-3,-76 -3,-80 Z" fill={GOB_D} />
          <path d="M6,-79 Q12,-78 11,-75 Q8,-76 6,-76 Z" {...olp(GOB, 1.2)} />
          <path d="M1,-74.5 Q5,-73 8,-75" fill="none" stroke="#14110f" strokeWidth={1.1} strokeLinecap="round" />
          <Blob c={[[-3, -86, 2.2], [0, -87.5, 2.4], [3, -86.5, 1.8]]} fill="#e8762c" ow={2} />
          <path d="M-5,-82.5 Q1,-85 8,-82" fill="none" stroke="#14110f" strokeWidth={3} />
          <path d="M-5,-82.5 Q1,-85 8,-82" fill="none" stroke={LEATHER} strokeWidth={1.6} />
          <circle cx={4} cy={-82.6} r={2.6} {...olp(GOLD_D, 1.2)} />
          <circle cx={4} cy={-82.6} r={1.5} fill="#7fe9ff" />
          <circle cx={4.6} cy={-81} r={1} fill="#14110f" />
          {/* flask arm */}
          <Limb p={[[3, -70], [10, -74], [r2(fx - 2), r2(fy + 4)]]} w={3.4} c={GOB} />
          <SoftGlow x={fx} y={fy} r={10 + cast * 8 + Math.sin(tt * 3) * 1.5} c={CHEM} o={0.75} />
          <g transform={`translate(${r2(fx)},${r2(fy)}) rotate(${r2(wave * 8)})`}>
            <path d="M-1.6,-8 L1.6,-8 L1.6,-4 Q6,-2 6,2.5 Q6,7 0,7 Q-6,7 -6,2.5 Q-6,-2 -1.6,-4 Z" {...olp('#d9f2ff', 1.4)} opacity={0.95} />
            <path d={`M-5.2,${r2(1.5 + slosh)} Q0,${r2(0 - slosh)} 5.2,${r2(1.5 + slosh)} Q5.4,6.2 0,6.2 Q-5.4,6.2 -5.2,${r2(1.5 + slosh)} Z`} fill={CHEM} />
            <rect x={-2.4} y={-10} width={4.8} height={2.6} rx={0.8} {...olp(GOLD, 1)} />
            <path d="M-6,1 Q0,3 6,1" fill="none" stroke={GOLD} strokeWidth={1.4} />
            <circle cx={-2.5} cy={0} r={1} fill="#fff" opacity={0.8} />
          </g>
          {bubbles}
        </g>
        {/* front arm: big fist */}
        <Limb p={[[13, -46], [25, -30 + br], [25, -15 + br]]} w={10} c={OGRE} />
        <path d="M20,-28 L30,-28 L30,-23 L20,-23 Z" {...olp(IRON, 1.3)} />
        <circle cx={25} cy={r2(-12 + br)} r={7} {...olp(OGRE, 1.8)} />
        <path d={`M21,${r2(-14 + br)} L29,${r2(-14 + br)}`} stroke={OGRE_D} strokeWidth={1.2} />
      </g>
      {haze.slice(3)}
    </g>
  );
};
