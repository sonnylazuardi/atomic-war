// Naga Siren lord: serpent-tailed siren, teal scales, long red hair, twin swords, singing glow + notes.
import { Blob, Limb, olp, pose, r2 } from '../heroes/parts2.tsx';
import type { HeroArt } from '../types.ts';
import { bump, loop } from '../types.ts';
import { SoftGlow } from './soft.tsx';

const SCALE = '#2fa59a';
const SCALE_D = '#1d6f6a';
const SCALE_L = '#6fd6c4';
const BELLY = '#e8d9a0';
const SKIN = '#8fd0c4';
const SKIN_D = '#5fa69a';
const HAIR = '#d0342a';
const HAIR_D = '#8e1f18';
const GOLD = '#f2c14e';
const STEEL = '#dfe6ee';
const SONG = '#9ff5ff';

function Sword({ x, y, a }: { x: number; y: number; a: number }) {
  return (
    <g transform={`translate(${r2(x)},${r2(y)}) rotate(${r2(a)})`}>
      <path d="M0,-1.6 Q12,-5 22,-2 Q12,1 0,1.6 Z" {...olp(STEEL, 1.3)} />
      <path d="M-1,-4 L1,-4 L1,4 L-1,4 Z" {...olp(GOLD, 1)} />
      <rect x={-6} y={-1.2} width={5} height={2.4} rx={0.8} {...olp(SCALE_D, 0.9)} />
    </g>
  );
}

export const NagaSirenLord: HeroArt = ({ anim, t, dur }) => {
  const p = pose(anim, t, dur, 2);
  const tt = p.t;
  const br = p.breathe;
  const sw = Math.sin(tt * 1.8);
  const hw = (k: number) => Math.sin(tt * 2.2 - k) * (1 + k * 0.9);
  const tailTip = Math.sin(tt * 2.6) * 4;
  const notes = [0, 1, 2].map((i) => {
    const q = loop(tt + i * 0.8, 2.4);
    const x = 14 + q * 20 + Math.sin(q * 8 + i) * 3;
    const y = -66 - q * 22;
    return (
      <g key={i} transform={`translate(${r2(x)},${r2(y)})`} opacity={r2(bump(q))}>
        <ellipse cx={0} cy={0} rx={2.2} ry={1.6} fill={SONG} transform="rotate(-20)" />
        <path d="M1.8,-0.6 L1.8,-8 Q4,-7 5,-5" fill="none" stroke={SONG} strokeWidth={1} />
      </g>
    );
  });
  const rings = [0, 1].map((i) => {
    const q = loop(tt + i * 1.1, 2.2);
    return <ellipse key={i} cx={r2(14 + q * 10)} cy={-64} rx={r2(3 + q * 12)} ry={r2(4 + q * 14)} fill="none" stroke={SONG} strokeWidth={1.2} opacity={r2((1 - q) * 0.7)} />;
  });

  return (
    <g>
      <ellipse cx={0} cy={0} rx={30} ry={5} fill="#000" opacity={0.35} />
      <SoftGlow x={10} y={-62} r={22} c={SONG} o={0.3 + 0.2 * Math.sin(tt * 3)} />
      {/* hair mass behind */}
      <path
        d={`M-6,-76 Q-18,-70 ${r2(-20 + hw(1))},-54 Q${r2(-24 + hw(2))},-40 ${r2(-18 + hw(3))},-30 Q-12,-42 -6,-50 Z`}
        {...olp(HAIR, 1.6)}
      />
      <path d={`M-10,-68 Q${r2(-18 + hw(1.5))},-52 ${r2(-17 + hw(3))},-34`} fill="none" stroke={HAIR_D} strokeWidth={1.4} />
      {/* serpent tail: coil on ground, rising to the waist */}
      <path
        d={`M-6,-30 Q-18,-16 -10,-5 Q4,4 22,-2 Q32,-6 ${r2(30 + tailTip * 0.3)},-14 Q${r2(26 + tailTip)},-20 ${r2(34 + tailTip)},-24 Q${r2(30 + tailTip)},-12 22,-8 Q8,-4 0,-10 Q-4,-16 6,-30 Z`}
        {...olp(SCALE, 2)}
      />
      <path d="M-4,-28 Q-12,-15 -6,-7 Q4,0 20,-4" fill="none" stroke={BELLY} strokeWidth={3} strokeLinecap="round" opacity={0.9} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${-12 + i * 7},${r2(-14 + Math.abs(i - 1) * 3)} q2,-2 4,0`} fill="none" stroke={SCALE_D} strokeWidth={1} />
      ))}
      <path d="M2,-28 Q-6,-18 0,-12" fill="none" stroke={SCALE_L} strokeWidth={1.2} opacity={0.7} />
      <g transform={`translate(0,${r2(br * 0.8)}) rotate(${r2(sw * 1.5)},0,-30)`}>
        {/* back arm + sword */}
        <Limb p={[[-4, -56], [-12, -48], [-18, -44]]} w={4} c={SKIN_D} />
        <Sword x={-18} y={-44} a={150 + sw * 4} />
        <circle cx={-18} cy={-44} r={2.4} {...olp(SKIN_D, 1.1)} />
        {/* torso with scale armor */}
        <path d="M-7,-60 Q-9,-44 -6,-30 L7,-30 Q10,-44 8,-60 Q0,-63 -7,-60 Z" {...olp(SKIN, 1.7)} />
        <path d="M-7,-60 Q-9,-44 -6,-30 L-3,-30 Q-5,-44 -3,-61 Z" fill={SKIN_D} />
        <path d="M-7,-56 Q0,-50 8,-56 L8,-48 Q0,-44 -7,-48 Z" {...olp(SCALE, 1.3)} />
        <circle cx={0.5} cy={-50} r={1.6} {...olp(GOLD, 0.9)} />
        <path d="M-7,-34 Q0,-30 8,-34 L8,-29 Q0,-26 -7,-29 Z" {...olp(GOLD, 1.1)} />
        {/* head + crown fin */}
        <circle cx={2} cy={-68} r={7.4} {...olp(SKIN, 1.6)} />
        <path d="M-3,-74 Q2,-84 9,-80 Q6,-77 8,-73 Z" {...olp(SCALE_L, 1.2)} />
        <path d="M-5,-70 Q-8,-62 -4,-58" fill="none" stroke={SKIN_D} strokeWidth={1.2} />
        <path d="M4,-70 L8,-69.6" stroke="#14110f" strokeWidth={1.4} strokeLinecap="round" />
        <ellipse cx={7} cy={-64} rx={1.4} ry={r2(1 + 0.6 * Math.abs(Math.sin(tt * 3)))} fill="#5a1e2a" />
        <Blob c={[[-4, -73, 4], [0, -76, 3.6], [-7, -68, 3]]} fill={HAIR} ow={2} />
        <path d={`M-6,-66 Q${r2(-10 + hw(1))},-56 ${r2(-8 + hw(2))},-48`} fill="none" stroke="#14110f" strokeWidth={4.6} strokeLinecap="round" />
        <path d={`M-6,-66 Q${r2(-10 + hw(1))},-56 ${r2(-8 + hw(2))},-48`} fill="none" stroke={HAIR} strokeWidth={2.8} strokeLinecap="round" />
        {/* front arm + sword raised */}
        <Limb p={[[4, -56], [12, -50], [18, -56]]} w={4.2} c={SKIN} />
        <Sword x={18} y={-56} a={-55 + sw * 6} />
        <circle cx={18} cy={-56} r={2.6} {...olp(SKIN, 1.1)} />
      </g>
      {rings}
      {notes}
    </g>
  );
};
