// Rubick lord: green-robed grand magus, golden horned mask, curled staff, telekinetic sparkles. Floats.
import { Limb, Sparkle, olp, pose, r2 } from '../heroes/parts2.tsx';
import { SoftGlow } from './soft.tsx';
import type { HeroArt } from '../types.ts';
import { bump, loop } from '../types.ts';

const ROBE = '#2f8a4a';
const ROBE_D = '#1d5e31';
const ROBE_L = '#4fb06a';
const TRIM = '#e3c35a';
const MASK = '#e8c25a';
const MASK_D = '#a8822a';
const SKIN = '#8fb06a';
const STAFF = '#5a3a24';
const MAGIC = '#7dffb0';

export const RubickLord: HeroArt = ({ anim, t, dur }) => {
  const p = pose(anim, t, dur, 2.2);
  const tt = p.t;
  const hover = -5 + Math.sin(tt * 1.9) * 2.2;
  const sway = Math.sin(tt * 1.9 - 0.8);
  const rw = (k: number) => Math.sin(tt * 2.6 - k) * (1 + k);
  const orbit = [0, 1, 2, 3, 4].map((i) => {
    const a = tt * 1.6 + (i * Math.PI * 2) / 5;
    const x = -18 + Math.cos(a) * 9;
    const y = -50 + Math.sin(a) * 4 - i * 0.6;
    return <Sparkle key={i} x={r2(x)} y={r2(y)} s={r2(1.6 + 1.2 * bump(loop(tt + i * 0.3, 1)))} c={MAGIC} o={0.6 + 0.4 * Math.sin(a)} />;
  });
  const rq = loop(tt, 2.6);

  return (
    <g>
      <ellipse cx={0} cy={0} rx={r2(20 + hover * 0.6)} ry={4} fill="#000" opacity={0.3} />
      <SoftGlow x={0} y={-1} r={24} ry={6} c={MAGIC} o={0.45} />
      <g transform={`translate(0,${r2(hover)})`}>
        {/* cape trailing behind */}
        <path d={`M-6,-60 Q-22,-40 ${r2(-28 + rw(2))},-6 Q-18,${r2(-2 + rw(1))} -8,-6 Z`} {...olp(ROBE_D, 1.8)} />
        {/* back arm raised: telekinesis */}
        <Limb p={[[-6, -56], [-15, -52], [-18, -58 + sway]]} w={4.4} c={ROBE_D} />
        <circle cx={-18} cy={r2(-59 + sway)} r={2.6} {...olp(SKIN, 1.2)} />
        <SoftGlow x={-18} y={-52} r={12 + Math.sin(tt * 3) * 2} c={MAGIC} o={0.55} />
        {/* levitating rock */}
        <g transform={`translate(-18,${r2(-46 - bump(rq) * 3)}) rotate(${r2(tt * 40)})`}>
          <path d="M-3.4,-1 L-1,-3.6 L3,-2.4 L3.6,1.4 L0.4,3.4 L-3,2 Z" {...olp('#8a8478', 1.1)} />
        </g>
        {orbit}
        {/* robe */}
        <path
          d={`M-9,-60 Q-13,-36 ${r2(-18 + rw(1) * 0.6)},-4 Q0,${r2(0 + rw(0) * 0.4)} 17,-5 Q12,-34 10,-60 Q0,-64 -9,-60 Z`}
          {...olp(ROBE, 2)}
        />
        <path d={`M-9,-60 Q-13,-36 ${r2(-18 + rw(1) * 0.6)},-4 Q-11,-3 -6,-3 Q-7,-34 -3,-62 Z`} fill={ROBE_D} />
        <path d="M5,-56 Q9,-40 12,-12" fill="none" stroke={ROBE_L} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
        <path d={`M${r2(-18 + rw(1) * 0.6)},-4 Q0,${r2(0 + rw(0) * 0.4)} 17,-5`} fill="none" stroke={TRIM} strokeWidth={2.2} />
        <path d="M1,-60 L2,-6" stroke={TRIM} strokeWidth={1.6} />
        <path d="M-9,-36 Q1,-32 11,-36 L11,-32 Q1,-28 -9,-32 Z" {...olp('#3a2a1c', 1.2)} />
        <circle cx={1} cy={-33} r={2} {...olp(TRIM, 1)} />
        {/* hood + horned mask */}
        <path d="M-9,-60 Q-13,-76 -2,-82 Q10,-82 12,-70 L10,-60 Q0,-56 -9,-60 Z" {...olp(ROBE_D, 1.8)} />
        <path d="M-1,-79 Q-13,-90 -10,-104 Q-6,-95 2,-84 Z" {...olp(MASK, 1.5)} />
        <path d="M5,-79 Q2,-92 10,-102 Q10,-92 9,-82 Z" {...olp(MASK, 1.5)} />
        <path d="M-1,-80 Q-9,-88 -9,-98" fill="none" stroke={MASK_D} strokeWidth={1} />
        <path d="M-3,-76 Q3,-82 11,-77 L12,-66 Q7,-60 1,-63 Q-3,-67 -3,-76 Z" {...olp(MASK, 1.6)} />
        <path d="M-3,-76 Q-1,-79 1,-79 Q-1,-70 1,-63 Q-3,-67 -3,-76 Z" fill={MASK_D} />
        <path d="M4,-73 L10,-72.5 L9,-70.5 L4.5,-71 Z" fill="#14110f" />
        <path d="M5,-72.6 L9.2,-72.2 L8.8,-71.2 L5.2,-71.4 Z" fill={MAGIC} />
        <SoftGlow x={7} y={-72} r={3.6} c={MAGIC} o={0.7} />
        <path d="M6,-67 L11,-66.5" stroke={MASK_D} strokeWidth={1} />
        {/* staff */}
        <g transform={`rotate(${r2(sway * 2)},20,-40)`}>
          <Limb p={[[20, 2], [21, -40], [20, -84]]} w={2.8} c={STAFF} />
          <path d="M20,-84 Q27,-92 23,-98 Q18,-100 17,-94 Q17,-90 21,-90" fill="none" stroke="#14110f" strokeWidth={4.4} strokeLinecap="round" />
          <path d="M20,-84 Q27,-92 23,-98 Q18,-100 17,-94 Q17,-90 21,-90" fill="none" stroke={TRIM} strokeWidth={2.4} strokeLinecap="round" />
          <circle cx={21} cy={-92} r={2.8} {...olp(MAGIC, 1.2)} />
          <SoftGlow x={21} y={-92} r={8 + Math.sin(tt * 4) * 1.5} c={MAGIC} o={0.8} />
        </g>
        {/* front arm holding staff */}
        <Limb p={[[6, -56], [14, -46], [20, -50]]} w={4.8} c={ROBE} />
        <path d="M11,-49 Q14,-44 18,-47 L16,-52 Z" {...olp(ROBE_D, 1.1)} />
        <circle cx={20.4} cy={-50} r={2.8} {...olp(SKIN, 1.2)} />
      </g>
    </g>
  );
};
