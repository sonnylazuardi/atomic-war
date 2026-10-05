// Riki lord: small purple satyr assassin with a dagger, half-faded inside a drifting smoke cloud.
import { Limb, Sparkle, olp, pose, r2 } from '../heroes/parts2.tsx';
import type { HeroArt } from '../types.ts';
import { bump, loop } from '../types.ts';
import { SoftGlow } from './soft.tsx';

const SKIN = '#8a5fb8';
const SKIN_D = '#5f3e86';
const FUR = '#4a3358';
const CLOTH = '#2e2a3a';
const CLOTH_L = '#4a4560';
const HORN = '#d9cdb8';
const STEEL = '#dfe6ee';
const SMOKE = '#8a7fa0';

export const RikiLord: HeroArt = ({ anim, t, dur }) => {
  const p = pose(anim, t, dur, 1.3);
  const tt = p.t;
  const br = p.breathe;
  const fade = 0.62 + 0.25 * Math.sin(tt * 1.4);
  const tw = Math.sin(tt * 3);
  const smoke = (front: boolean) =>
    [0, 1, 2, 3, 4, 5].map((i) => {
      const q = loop(tt * 0.6 + i * 0.37, 1);
      const a = (i / 6) * Math.PI * 2 + tt * 0.5;
      const x = Math.cos(a) * (18 + q * 8);
      const y = -12 - q * 22 + Math.sin(a) * 4;
      if (front !== Math.sin(a) > 0) return null;
      return <SoftGlow key={i} x={x} y={y} r={10 + q * 8} ry={7 + q * 6} c={SMOKE} o={0.7 * bump(q)} />;
    });

  return (
    <g>
      <ellipse cx={0} cy={0} rx={22} ry={4.2} fill="#000" opacity={0.3} />
      <SoftGlow x={0} y={-16} r={34} ry={22} c="#5a4a78" o={0.55} />
      {smoke(false)}
      <g opacity={r2(fade)} transform={`translate(0,${r2(br * 0.8)})`}>
        {/* tail */}
        <path d={`M-8,-26 Q-16,-30 ${r2(-18 + tw * 2)},-38`} fill="none" stroke="#14110f" strokeWidth={3} strokeLinecap="round" />
        <path d={`M-8,-26 Q-16,-30 ${r2(-18 + tw * 2)},-38`} fill="none" stroke={SKIN_D} strokeWidth={1.4} strokeLinecap="round" />
        {/* goat legs: backward knees, hooves */}
        <Limb p={[[-4, -24], [-6, -14], [-11, -9], [-9, -2]]} w={5.4} c={FUR} />
        <path d="M-13,0 L-11,-3.5 L-6,-3.5 L-6,0 Z" {...olp('#1e1a24', 1.1)} />
        {/* back arm */}
        <Limb p={[[-4, -40], [-10, -32], [-8, -26]]} w={3.6} c={SKIN_D} />
        {/* torso hunched */}
        <path d="M-8,-44 Q-10,-34 -6,-23 L7,-23 Q10,-34 7,-44 Q0,-48 -8,-44 Z" {...olp(CLOTH, 1.7)} />
        <path d="M-6,-44 L6,-26" stroke={CLOTH_L} strokeWidth={2} />
        <path d="M-7,-26 L8,-26 L8,-22 L-7,-22 Z" {...olp('#5a3a24', 1.1)} />
        <Limb p={[[4, -24], [7, -14], [11, -9], [10, -2]]} w={5.6} c={FUR} />
        <path d="M7,0 L8,-3.5 L13,-3.5 L15,0 Z" {...olp('#1e1a24', 1.1)} />
        {/* head: hood, horns, long ears, glowing eyes */}
        <path d="M-2,-56 Q-12,-60 -18,-56 Q-10,-54 -3,-51 Z" {...olp(SKIN, 1.3)} />
        <circle cx={3} cy={-52} r={7.4} {...olp(SKIN, 1.6)} />
        <path d="M-5,-54 Q-2,-62 6,-61 Q12,-60 11,-53 L9,-55 Q3,-58 -3,-52 Z" {...olp(CLOTH, 1.3)} />
        <path d="M2,-60 Q0,-67 -5,-68 Q-2,-63 -1,-59 Z" {...olp(HORN, 1.1)} />
        <path d="M7,-60 Q8,-67 13,-68 Q10,-63 9,-59 Z" {...olp(HORN, 1.1)} />
        <path d="M-3,-50 Q4,-47 11,-50 L10,-46 Q4,-43 -2,-46 Z" {...olp(CLOTH, 1.1)} />
        <path d="M5,-53.4 L9.5,-53" stroke="#ffe066" strokeWidth={1.4} strokeLinecap="round" />
        <SoftGlow x={7.5} y={-53} r={3.4} c="#ffe066" o={0.8} />
        {/* front arm with reverse-grip dagger */}
        <Limb p={[[4, -40], [12, -36], [15, -42 + tw * 0.8]]} w={3.8} c={SKIN} />
        <g transform={`translate(15,${r2(-42 + tw * 0.8)}) rotate(${r2(60 + tw * 4)})`}>
          <path d="M0,-1.3 L14,-0.4 L16,0.4 L0,1.3 Z" {...olp(STEEL, 1.1)} />
          <rect x={-1} y={-2.6} width={1.6} height={5.2} {...olp('#c9a45c', 0.8)} />
          <rect x={-6} y={-1} width={5} height={2} rx={0.6} {...olp('#3a2a20', 0.8)} />
        </g>
        <circle cx={15} cy={r2(-42 + tw * 0.8)} r={2.4} {...olp(SKIN, 1)} />
      </g>
      {smoke(true)}
      <Sparkle x={24} y={r2(-46 + tw)} s={2 * bump(loop(tt, 1.6))} c="#fff" />
    </g>
  );
};
