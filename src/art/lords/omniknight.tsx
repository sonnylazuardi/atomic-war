// Omniknight lord: holy armored knight leaning on a great hammer, golden halo, rising motes.
import { Blob, Limb, Sparkle, olp, pose, r2 } from '../heroes/parts2.tsx';
import { SoftGlow } from './soft.tsx';
import type { HeroArt } from '../types.ts';
import { bump, loop } from '../types.ts';

const PLATE = '#c8cfd9';
const PLATE_D = '#8a94a3';
const PLATE_L = '#eef2f7';
const GOLD = '#f2c14e';
const GOLD_D = '#b8842a';
const CLOTH = '#f1ead6';
const CLOTH_D = '#c9bd9a';
const BLUE = '#3d6fb8';
const BLUE_D = '#28497d';
const SKIN = '#e6b98f';
const BEARD = '#f4f1ea';
const HOLY = '#ffe9a0';

export const OmniknightLord: HeroArt = ({ anim, t, dur }) => {
  const p = pose(anim, t, dur, 2);
  const tt = p.t;
  const br = p.breathe;
  const pulse = 0.5 + 0.5 * Math.sin(tt * 2.2);
  const cw = (k: number) => Math.sin(tt * 2.4 - k) * (1 + k * 0.8);

  const motes = [0, 1, 2, 3, 4].map((i) => {
    const q = loop(tt + i * 0.71, 3.5);
    return <Sparkle key={i} x={-20 + ((i * 17) % 46)} y={r2(-6 - q * 70)} s={r2(1.4 + (i % 2) * 0.8)} c={HOLY} o={bump(q)} />;
  });

  return (
    <g>
      <ellipse cx={0} cy={0} rx={28} ry={5} fill="#000" opacity={0.35} />
      <SoftGlow x={0} y={-2} r={34} ry={9} c={HOLY} o={0.5 + pulse * 0.3} />
      {/* halo behind head */}
      <SoftGlow x={-3} y={-80} r={20 + pulse * 3} c={HOLY} o={0.55} />
      <ellipse cx={-3} cy={-80} rx={13} ry={13} fill="none" stroke="#14110f" strokeWidth={4.2} opacity={0.6} />
      <ellipse cx={-3} cy={-80} rx={13} ry={13} fill="none" stroke={GOLD} strokeWidth={2.4} />
      <ellipse cx={-3} cy={-80} rx={13} ry={13} fill="none" stroke="#fff6c8" strokeWidth={0.9} />
      {/* cape */}
      <path
        d={`M-10,-62 Q-20,-40 ${r2(-24 + cw(2))},-4 Q-12,${r2(-1 + cw(1))} -2,-4 L0,-56 Z`}
        {...olp(BLUE, 1.8)}
      />
      <path d={`M-12,-58 Q-19,-36 ${r2(-20 + cw(2))},-5`} fill="none" stroke={BLUE_D} strokeWidth={3} />
      <g transform={`translate(0,${r2(br * 0.7)})`}>
        {/* back leg */}
        <Limb p={[[-5, -24], [-9, -12], [-10, -3]]} w={8} c={PLATE_D} />
        <path d="M-16,0 L-15,-5 L-5,-5 L-3,0 Z" {...olp(PLATE_D, 1.4)} />
        {/* back arm on hip */}
        <Limb p={[[-8, -54], [-17, -42], [-9, -32]]} w={6.4} c={PLATE_D} />
        <circle cx={-17} cy={-42} r={3} {...olp(GOLD_D, 1.2)} />
        <circle cx={-9} cy={-32} r={3.6} {...olp(PLATE_D, 1.3)} />
        {/* tabard skirt */}
        <path d="M-11,-30 L11,-30 L13,-10 Q0,-6 -12,-10 Z" {...olp(CLOTH, 1.6)} />
        <path d="M-11,-30 L-4,-30 L-5,-8 Q-9,-8.5 -12,-10 Z" fill={CLOTH_D} />
        <path d="M-1,-28 L3,-28 L3,-9 L-1,-9 Z" fill={BLUE} />
        {/* breastplate */}
        <path d="M-12,-58 Q-14,-44 -10,-30 L11,-30 Q15,-44 12,-58 Q0,-62 -12,-58 Z" {...olp(PLATE, 2)} />
        <path d="M-12,-58 Q-14,-44 -10,-30 L-5,-30 Q-8,-44 -6,-60 Z" fill={PLATE_D} />
        <path d="M3,-56 Q9,-52 9,-40" fill="none" stroke={PLATE_L} strokeWidth={2} strokeLinecap="round" />
        <path d="M-10,-31 L11,-31 L11,-27 L-10,-27 Z" {...olp(GOLD, 1.2)} />
        {/* holy sun emblem */}
        <circle cx={1} cy={-45} r={4.6} {...olp(GOLD, 1.3)} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line key={a} x1={1} y1={-45} x2={r2(1 + Math.sin((a * Math.PI) / 180) * 7.5)} y2={r2(-45 + Math.cos((a * Math.PI) / 180) * 7.5)} stroke={GOLD} strokeWidth={1} opacity={0.9} />
        ))}
        <circle cx={1} cy={-45} r={2} fill="#fff6c8" opacity={0.6 + pulse * 0.4} />
        {/* front leg */}
        <Limb p={[[5, -24], [9, -12], [9, -3]]} w={8.4} c={PLATE} />
        <circle cx={9} cy={-12} r={3.4} {...olp(GOLD, 1.3)} />
        <path d="M3,0 L4,-5 L14,-5 L17,0 Z" {...olp(PLATE, 1.4)} />
        {/* pauldrons */}
        <Blob c={[[-9, -57, 6], [-13, -54, 4]]} fill={PLATE_D} ow={2.4} />
        <path d="M-15,-56 Q-9,-63 -3,-58" fill="none" stroke={GOLD} strokeWidth={1.4} />
        {/* head: helmet with gold wings, white beard */}
        <Blob c={[[3, -63, 6.5], [7, -60, 5], [-1, -61, 4.6]]} fill={BEARD} ow={2.4} shade="#d8d2c4" />
        <circle cx={3} cy={-70} r={7.6} {...olp(SKIN, 1.6)} />
        <path d="M-5,-70 Q-5,-81 3,-81 Q11,-81 11,-72 L7,-72 Q6,-75 3,-75 Q-1,-75 -2,-70 Z" {...olp(PLATE, 1.6)} />
        <path d="M-3,-80 Q-12,-86 -15,-80 Q-11,-80 -8,-77 Q-12,-78 -13,-74 Q-7,-75 -4,-74 Z" {...olp(GOLD, 1.3)} />
        <path d="M5,-71 L8.4,-71" stroke="#14110f" strokeWidth={1.5} strokeLinecap="round" />
        <path d="M5,-73.4 L9,-73" stroke="#7a5a3a" strokeWidth={1.2} strokeLinecap="round" />
        <Blob c={[[6, -65, 2.6], [9, -66, 2]]} fill={BEARD} ow={1.6} />
        {/* great hammer: head on the ground in front, hand on the haft */}
        <g transform={`rotate(${r2(Math.sin(tt * 1.1) * 1.2)},24,-4)`}>
          <SoftGlow x={24} y={-8} r={10 + pulse * 6} c={HOLY} o={0.6} />
          <Limb p={[[24, -10], [22, -52]]} w={3.4} c="#7a5634" />
          <circle cx={22} cy={-54} r={2.6} {...olp(GOLD, 1.2)} />
          <path d="M14,-15 L34,-15 L35,-4 L13,-4 Z" {...olp(PLATE, 1.8)} />
          <path d="M14,-15 L19,-15 L18,-4 L13,-4 Z" fill={PLATE_D} />
          <path d="M12,-12 L36,-12 L36,-8 L12,-8 Z" {...olp(GOLD, 1.3)} />
          <circle cx={24} cy={-10} r={2.4} fill="#fff6c8" opacity={0.7 + pulse * 0.3} />
        </g>
        {/* front arm gripping the haft */}
        <Limb p={[[8, -54], [16, -44], [22, -40]]} w={6.6} c={PLATE} />
        <circle cx={16} cy={-44} r={3} {...olp(GOLD, 1.2)} />
        <circle cx={22.5} cy={-40} r={3.8} {...olp(PLATE_D, 1.3)} />
        <Blob c={[[9, -57, 6], [13, -54, 4]]} fill={PLATE} ow={2.4} />
        <path d="M5,-58 Q11,-63 16,-56" fill="none" stroke={GOLD} strokeWidth={1.4} />
      </g>
      {motes}
    </g>
  );
};
