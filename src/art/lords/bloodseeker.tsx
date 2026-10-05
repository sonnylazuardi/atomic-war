// Bloodseeker lord: lean red troll hunter, horned bone mask, twin curved blades, bandages, blood drops,
// pulsing crimson rage aura. Idle = predatory crouch sway.
import { Limb, olp, pose, r2 } from '../heroes/parts2.tsx';
import type { HeroArt } from '../types.ts';
import { loop } from '../types.ts';
import { SoftGlow } from './soft.tsx';

const SKIN = '#c4473a';
const SKIN_D = '#8e2a22';
const BONE = '#ece2c8';
const BONE_D = '#b8ab8a';
const CLOTH = '#9a1f1f';
const CLOTH_D = '#661414';
const BAND = '#d8c69c';
const STEEL = '#dfe6ee';
const BLOOD = '#d0101a';
const RAGE = '#ff2a2a';

function Glaive({ x, y, a }: { x: number; y: number; a: number }) {
  return (
    <g transform={`translate(${r2(x)},${r2(y)}) rotate(${r2(a)})`}>
      <path d="M0,-2 Q10,-12 24,-8 Q14,-6 4,2 Z" {...olp(STEEL, 1.3)} />
      <path d="M3,-3 Q11,-10 21,-8" fill="none" stroke={BLOOD} strokeWidth={1} opacity={0.8} />
      <rect x={-6} y={-1.4} width={7} height={2.8} rx={0.8} {...olp('#3a2418', 0.9)} />
    </g>
  );
}

export const BloodseekerLord: HeroArt = ({ anim, t, dur }) => {
  const p = pose(anim, t, dur, 1.6);
  const tt = p.t;
  const sway = Math.sin(tt * 2.1);
  const crouch = 1.5 + Math.sin(tt * 4.2) * 1;
  const pulse = 0.5 + 0.5 * Math.sin(tt * 3.4);
  const drops = [0, 1, 2, 3].map((i) => {
    const q = loop(tt + i * 0.45, 1.8);
    const x = (i % 2 ? 22 : -20) + Math.sin(i * 2.3) * 4;
    const y = -36 + q * 34;
    if (q > 0.95) return null;
    return <path key={i} d={`M${r2(x)},${r2(y - 2.6)} Q${r2(x + 1.6)},${r2(y)} ${r2(x)},${r2(y + 1.4)} Q${r2(x - 1.6)},${r2(y)} ${r2(x)},${r2(y - 2.6)} Z`} fill={BLOOD} opacity={r2(1 - q * 0.6)} />;
  });

  return (
    <g>
      <ellipse cx={0} cy={0} rx={26} ry={4.6} fill="#000" opacity={0.35} />
      <SoftGlow x={0} y={-30} r={30 + pulse * 6} ry={38 + pulse * 6} c={RAGE} o={0.28 + pulse * 0.25} />
      <SoftGlow x={0} y={-1} r={30} ry={7} c={BLOOD} o={0.6} />
      <g transform={`translate(${r2(sway * 1.5)},${r2(crouch)}) rotate(${r2(sway * 2)},0,-20)`}>
        {/* loincloth tail behind */}
        <path d={`M-6,-24 Q-12,-14 ${r2(-16 + sway * 2)},-6 L${r2(-10 + sway)},-8 Q-6,-14 -2,-22 Z`} {...olp(CLOTH_D, 1.2)} />
        {/* back leg (crouched, bandaged) */}
        <Limb p={[[-4, -24], [-14, -14], [-12, -3]]} w={6} c={SKIN_D} />
        <path d="M-15,-12 L-11,-9 M-14,-8 L-10,-6" stroke={BAND} strokeWidth={1.4} />
        <path d="M-17,0 L-15,-4 L-8,-4 L-7,0 Z" {...olp('#3a2418', 1.1)} />
        {/* back arm + blade low behind */}
        <Limb p={[[-4, -44], [-13, -36], [-18, -30]]} w={4.4} c={SKIN_D} />
        <Glaive x={-18} y={-30} a={170 + sway * 5} />
        <circle cx={-18} cy={-30} r={2.6} {...olp(SKIN_D, 1.1)} />
        {/* lean torso hunched forward */}
        <path d="M-8,-48 Q-11,-36 -6,-23 L7,-23 Q11,-36 8,-46 Q0,-52 -8,-48 Z" {...olp(SKIN, 1.7)} />
        <path d="M-8,-48 Q-11,-36 -6,-23 L-3,-23 Q-6,-36 -3,-50 Z" fill={SKIN_D} />
        <path d="M0,-40 Q3,-38 6,-40 M0,-34 Q3,-32 6,-34" fill="none" stroke={SKIN_D} strokeWidth={1} strokeLinecap="round" />
        <path d="M-6,-47 L7,-28" stroke="#14110f" strokeWidth={3.6} strokeLinecap="round" />
        <path d="M-6,-47 L7,-28" stroke={BAND} strokeWidth={2} strokeLinecap="round" />
        {/* loincloth front */}
        <path d="M-7,-25 L8,-25 L8,-21 L-7,-21 Z" {...olp('#3a2418', 1.1)} />
        <path d={`M0,-22 L7,-22 L${r2(6 + sway)},-11 L4,-13 L${r2(2 + sway)},-9 Z`} {...olp(CLOTH, 1.2)} />
        {/* front leg */}
        <Limb p={[[4, -23], [14, -15], [13, -3]]} w={6.4} c={SKIN} />
        <path d="M11,-13 L15,-11 M11,-8 L15,-7" stroke={BAND} strokeWidth={1.4} />
        <path d="M8,0 L10,-4 L17,-4 L20,0 Z" {...olp('#3a2418', 1.1)} />
        {/* head: bone mask with horns, glowing eyes */}
        <g transform={`rotate(${r2(sway * 3)},5,-52)`}>
          <path d="M-4,-54 Q-12,-62 -12,-72 Q-6,-64 0,-58 Z" {...olp(BONE, 1.3)} />
          <path d="M6,-58 Q6,-70 14,-76 Q12,-66 10,-57 Z" {...olp(BONE, 1.3)} />
          <circle cx={3} cy={-52} r={7.6} {...olp(SKIN, 1.6)} />
          <path d="M-3,-57 Q4,-62 12,-56 L13,-50 Q10,-45 6,-44 L5,-48 L3,-44 Q-1,-47 -3,-52 Z" {...olp(BONE, 1.4)} />
          <path d="M-3,-57 Q0,-58 2,-58 Q-1,-52 2,-45 Q-1,-47 -3,-52 Z" fill={BONE_D} />
          <path d="M5,-53.6 L10.6,-53" stroke="#14110f" strokeWidth={2} strokeLinecap="round" />
          <path d="M5.6,-53.6 L10,-53.1" stroke={RAGE} strokeWidth={1} strokeLinecap="round" />
          <SoftGlow x={8} y={-53} r={4 + pulse * 1.5} c={RAGE} o={0.9} />
          <path d="M-4,-56 Q-8,-50 -6,-44" fill="none" stroke="#14110f" strokeWidth={3.2} strokeLinecap="round" />
          <path d="M-4,-56 Q-8,-50 -6,-44" fill="none" stroke="#5a1a14" strokeWidth={1.8} strokeLinecap="round" />
        </g>
        {/* front arm + blade raised forward */}
        <Limb p={[[5, -44], [14, -38], [20, -44 + sway]]} w={4.6} c={SKIN} />
        <Glaive x={20} y={-44 + sway} a={-30 + sway * 6} />
        <circle cx={20} cy={r2(-44 + sway)} r={2.8} {...olp(SKIN, 1.1)} />
      </g>
      {drops}
    </g>
  );
};
