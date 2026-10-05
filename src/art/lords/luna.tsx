// Luna lord: moon rider on a white panther, crescent glaive, crescent moon glow behind.
import { Blob, Limb, Sparkle, olp, pose, r2 } from '../heroes/parts2.tsx';
import type { HeroArt } from '../types.ts';
import { bump, loop } from '../types.ts';
import { SoftGlow } from './soft.tsx';

const CAT = '#eef0f6';
const CAT_D = '#b9bfd0';
const CAT_M = '#8a92ad';
const ARMOR = '#5a74b8';
const ARMOR_D = '#3a4f86';
const SILVER = '#d6dde6';
const SKIN = '#cfd8f0';
const HAIR = '#e8ecf8';
const MOON = '#cfe4ff';

export const LunaLord: HeroArt = ({ anim, t, dur }) => {
  const p = pose(anim, t, dur, 1.8);
  const tt = p.t;
  const br = p.breathe;
  const tail = Math.sin(tt * 2.4);
  const gl = tt * 50;
  const hw = (k: number) => Math.sin(tt * 2.2 - k) * (1 + k);
  const stars = [0, 1, 2, 3].map((i) => {
    const q = loop(tt + i * 0.6, 2.4);
    return <Sparkle key={i} x={-30 + i * 14} y={-78 - (i % 2) * 10} s={2.4 * bump(q)} c="#fff" />;
  });

  return (
    <g>
      <ellipse cx={0} cy={0} rx={34} ry={5} fill="#000" opacity={0.35} />
      {/* crescent moon */}
      <SoftGlow x={-14} y={-76} r={26} c={MOON} o={0.55} />
      <path d="M-14,-96 A20,20 0 1 0 -14,-56 A15,15 0 1 1 -14,-96 Z" fill={MOON} opacity={0.55} />
      {stars}
      {/* panther tail */}
      <path d={`M-26,-24 Q-38,-24 ${r2(-40 + tail * 3)},-34 Q${r2(-40 + tail * 5)},-42 ${r2(-34 + tail * 4)},-44`} fill="none" stroke="#14110f" strokeWidth={5.4} strokeLinecap="round" />
      <path d={`M-26,-24 Q-38,-24 ${r2(-40 + tail * 3)},-34 Q${r2(-40 + tail * 5)},-42 ${r2(-34 + tail * 4)},-44`} fill="none" stroke={CAT_D} strokeWidth={3.2} strokeLinecap="round" />
      {/* far legs */}
      <Limb p={[[-20, -22], [-22, -12], [-20, -3]]} w={6} c={CAT_M} />
      <Limb p={[[18, -24], [20, -12], [21, -3]]} w={6} c={CAT_M} />
      <g transform={`translate(0,${r2(br * 0.6)})`}>
        {/* panther body */}
        <path d="M-28,-30 Q-30,-18 -20,-15 L18,-16 Q28,-18 28,-30 Q14,-38 -10,-36 Q-24,-36 -28,-30 Z" {...olp(CAT, 2)} />
        <path d="M-26,-22 Q-10,-14 22,-18" fill="none" stroke={CAT_D} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
        {[-18, -8, 2].map((x) => (
          <path key={x} d={`M${x},-35 q2,4 0,8`} fill="none" stroke={CAT_M} strokeWidth={1.4} strokeLinecap="round" />
        ))}
        {/* saddle armor */}
        <path d="M-14,-36 Q-4,-40 6,-36 L6,-28 Q-4,-26 -14,-28 Z" {...olp(ARMOR, 1.4)} />
        {/* panther head */}
        <g transform={`rotate(${r2(br * 2)},26,-32)`}>
          <path d="M22,-38 L24,-46 L28,-40 Z" {...olp(CAT, 1.2)} />
          <path d="M28,-40 L32,-46 L33,-38 Z" {...olp(CAT, 1.2)} />
          <path d="M20,-34 Q22,-42 30,-41 Q38,-38 39,-31 Q36,-25 28,-26 Q21,-27 20,-34 Z" {...olp(CAT, 1.7)} />
          <path d="M32,-32 Q38,-31 39,-31" fill="none" stroke="#14110f" strokeWidth={1} />
          <circle cx={38.4} cy={-32.6} r={1.2} fill="#3a3f55" />
          <path d="M29,-36 L33,-35.4" stroke="#14110f" strokeWidth={1.6} strokeLinecap="round" />
          <path d="M29.6,-36 L32.6,-35.6" stroke="#7fd0ff" strokeWidth={0.8} strokeLinecap="round" />
          <path d="M34,-28 L35,-25 L36,-28" {...olp('#fff', 0.7)} />
        </g>
        {/* near legs */}
        <Limb p={[[-16, -20], [-14, -10], [-15, -3]]} w={7} c={CAT} />
        <Limb p={[[14, -20], [16, -10], [15, -3]]} w={7} c={CAT} />
        <ellipse cx={-14} cy={-2.4} rx={4} ry={2.4} {...olp(CAT, 1.2)} />
        <ellipse cx={16} cy={-2.4} rx={4} ry={2.4} {...olp(CAT, 1.2)} />
        {/* Luna riding */}
        <g transform={`translate(-4,${r2(br * 0.6)})`}>
          {/* hair streaming */}
          <path d={`M-2,-70 Q-14,-66 ${r2(-20 + hw(1))},-58 Q${r2(-24 + hw(2))},-50 ${r2(-20 + hw(3))},-46 Q-12,-54 -2,-58 Z`} {...olp(HAIR, 1.4)} />
          {/* leg over the panther */}
          <Limb p={[[-2, -40], [6, -34], [6, -26]]} w={5} c={ARMOR_D} />
          <path d="M3,-26 L10,-26 L10,-23 L3,-23 Z" {...olp(SILVER, 1)} />
          {/* torso */}
          <path d="M-6,-60 Q-8,-50 -5,-40 L6,-40 Q8,-50 6,-60 Q0,-63 -6,-60 Z" {...olp(ARMOR, 1.6)} />
          <path d="M-6,-60 Q-8,-50 -5,-40 L-2,-40 Q-4,-50 -2,-61 Z" fill={ARMOR_D} />
          <path d="M-5,-54 Q0,-50 6,-54" fill="none" stroke={SILVER} strokeWidth={1.4} />
          {/* head with crescent helm */}
          <circle cx={1} cy={-67} r={6.6} {...olp(SKIN, 1.5)} />
          <path d="M-6,-68 Q-4,-77 3,-77 Q9,-76 9,-69 Q4,-73 -6,-68 Z" {...olp(SILVER, 1.3)} />
          <path d="M-2,-76 Q-6,-86 2,-90 Q-2,-84 2,-78 Z" {...olp(SILVER, 1.1)} />
          <path d="M3,-68 L7,-67.6" stroke="#14110f" strokeWidth={1.3} strokeLinecap="round" />
          <Blob c={[[-5, -66, 2.6], [-4, -62, 2.2]]} fill={HAIR} ow={1.4} />
          {/* glaive arm */}
          <Limb p={[[3, -57], [11, -58], [15, -66]]} w={3.6} c={ARMOR} />
          <g transform={`translate(19,-77) rotate(${r2(gl)})`}>
            <SoftGlow x={0} y={0} r={11} c={MOON} o={0.6} />
            <path d="M0,-9 A9,9 0 1 1 -8,4 A6,6 0 1 0 0,-9 Z" {...olp(SILVER, 1.2)} />
            <path d="M0,9 A9,9 0 1 1 8,-4 A6,6 0 1 0 0,9 Z" {...olp(SILVER, 1.2)} />
            <circle r={2} {...olp(MOON, 0.9)} />
          </g>
          <circle cx={15} cy={-66} r={2.2} {...olp(SKIN, 1)} />
        </g>
      </g>
    </g>
  );
};
