// Spirit Breaker lord: huge armored blue-purple bull, swinging ball-and-chain mace, spectral aura.
import { Blob, Limb, olp, pose, r2 } from '../heroes/parts2.tsx';
import type { HeroArt } from '../types.ts';
import { bump, loop } from '../types.ts';
import { SoftGlow } from './soft.tsx';

const FUR = '#4f5aa8';
const FUR_D = '#353d7a';
const FUR_L = '#7682cc';
const HORN = '#e9e2cc';
const HORN_D = '#b0a88e';
const ARMOR = '#8a6a3c';
const ARMOR_L = '#c9a45c';
const IRON = '#5b616c';
const IRON_L = '#9aa3b0';
const AURA = '#9c7bff';

export const SpiritBreakerLord: HeroArt = ({ anim, t, dur }) => {
  const p = pose(anim, t, dur, 1.7);
  const tt = p.t;
  const br = p.breathe;
  // the ball swings like a pendulum from the front fist
  const sw = Math.sin(tt * 2.2);
  const hx = 26;
  const hy = -30 + br;
  const len = 18;
  const ang = sw * 0.5;
  const bx = hx + Math.sin(ang) * len;
  const by = hy + Math.cos(ang) * len;
  const links = [0.25, 0.5, 0.75].map((k) => [hx + (bx - hx) * k, hy + (by - hy) * k] as const);
  const wisps = [0, 1, 2, 3].map((i) => {
    const q = loop(tt + i * 0.6, 2.4);
    const x = -26 + i * 17 + Math.sin(q * 5 + i) * 3;
    return <path key={i} d={`M${r2(x)},${r2(-4 - q * 30)} q3,-6 0,-12`} fill="none" stroke={AURA} strokeWidth={2} strokeLinecap="round" opacity={r2(bump(q) * 0.7)} />;
  });

  return (
    <g>
      <ellipse cx={0} cy={0} rx={32} ry={5} fill="#000" opacity={0.38} />
      <SoftGlow x={0} y={-2} r={38} ry={9} c={AURA} o={0.55 + 0.25 * Math.sin(tt * 2.5)} />
      {wisps}
      <g transform={`translate(0,${r2(br * 0.9)})`}>
        {/* tail */}
        <path d={`M-16,-30 Q-26,-28 ${r2(-28 + sw * 2)},-16`} fill="none" stroke="#14110f" strokeWidth={4} strokeLinecap="round" />
        <path d={`M-16,-30 Q-26,-28 ${r2(-28 + sw * 2)},-16`} fill="none" stroke={FUR_D} strokeWidth={2.2} strokeLinecap="round" />
        <Blob c={[[r2(-28 + sw * 2), -14, 2.6]]} fill="#2a2a44" ow={1.6} />
        {/* back leg (hoof) */}
        <Limb p={[[-9, -28], [-14, -15], [-12, -4]]} w={11} c={FUR_D} />
        <path d="M-18,0 L-17,-5 L-7,-5 L-6,0 Z" {...olp('#2a2a34', 1.4)} />
        {/* back arm */}
        <Limb p={[[-12, -60], [-22, -44], [-18, -30]]} w={10} c={FUR_D} />
        <circle cx={-18} cy={-28} r={6} {...olp(FUR_D, 1.6)} />
        {/* massive torso */}
        <path d="M-20,-62 Q-28,-44 -16,-24 Q0,-18 14,-26 Q22,-42 18,-62 Q0,-72 -20,-62 Z" {...olp(FUR, 2.2)} />
        <path d="M-20,-62 Q-28,-44 -16,-24 Q-10,-21 -6,-21 Q-17,-40 -10,-66 Z" fill={FUR_D} />
        <path d="M4,-56 Q12,-50 12,-36" fill="none" stroke={FUR_L} strokeWidth={2.6} strokeLinecap="round" />
        {/* chest armor straps + belt */}
        <path d="M-14,-62 L12,-30" stroke="#14110f" strokeWidth={6} strokeLinecap="round" />
        <path d="M-14,-62 L12,-30" stroke={ARMOR} strokeWidth={4} strokeLinecap="round" />
        <path d="M-17,-28 Q0,-21 15,-29 L15,-22 Q0,-15 -16,-21 Z" {...olp(ARMOR, 1.6)} />
        <circle cx={0} cy={-22} r={3.6} {...olp(ARMOR_L, 1.2)} />
        {/* front leg */}
        <Limb p={[[7, -26], [12, -14], [11, -4]]} w={12} c={FUR} />
        <path d="M4,0 L5,-5 L16,-5 L18,0 Z" {...olp('#2a2a34', 1.4)} />
        {/* head: low, horns, nose ring */}
        <g transform={`rotate(${r2(br * 2)},10,-64)`}>
          <path d="M2,-72 Q-6,-82 -18,-86 Q-14,-80 -6,-74 Z" {...olp(HORN, 1.5)} />
          <path d="M14,-74 Q22,-86 18,-96 Q26,-88 22,-74 Z" {...olp(HORN, 1.5)} />
          <path d="M16,-80 Q20,-88 19,-92" fill="none" stroke={HORN_D} strokeWidth={1} />
          <path d="M0,-72 Q10,-80 20,-72 Q26,-64 26,-56 Q20,-50 12,-52 Q2,-56 0,-72 Z" {...olp(FUR, 1.8)} />
          <path d="M18,-62 Q28,-62 29,-55 Q26,-50 18,-52 Z" {...olp('#8a8fc8', 1.4)} />
          <circle cx={24} cy={-56} r={1} fill="#14110f" />
          <circle cx={22} cy={r2(-50.5)} r={3} fill="none" stroke="#14110f" strokeWidth={2.4} />
          <circle cx={22} cy={r2(-50.5)} r={3} fill="none" stroke={ARMOR_L} strokeWidth={1.2} />
          <path d="M12,-67 L18,-66" stroke="#14110f" strokeWidth={2} strokeLinecap="round" />
          <circle cx={16} cy={-66.5} r={1.1} fill="#e6dcff" />
          <SoftGlow x={16} y={-66.5} r={4} c={AURA} o={0.8} />
        </g>
        {/* shoulder pauldron */}
        <path d="M-2,-66 Q8,-74 18,-64 L14,-56 Q6,-62 -2,-58 Z" {...olp(ARMOR, 1.6)} />
        <path d="M2,-66 Q8,-70 14,-64" fill="none" stroke={ARMOR_L} strokeWidth={1.4} />
        {/* front arm holding the chain */}
        <Limb p={[[10, -58], [22, -44 + br], [hx, hy]]} w={11} c={FUR} />
        <path d="M17,-44 L27,-44 L27,-38 L17,-38 Z" {...olp(IRON, 1.3)} />
        {links.map(([x, y], i) => (
          <ellipse key={i} cx={r2(x)} cy={r2(y)} rx={1.6} ry={2.4} fill="none" stroke="#14110f" strokeWidth={2.2} />
        ))}
        {links.map(([x, y], i) => (
          <ellipse key={`l${i}`} cx={r2(x)} cy={r2(y)} rx={1.6} ry={2.4} fill="none" stroke={IRON_L} strokeWidth={0.9} />
        ))}
        <circle cx={hx} cy={hy} r={6.4} {...olp(FUR, 1.6)} />
        {/* spiked mace ball */}
        <g transform={`translate(${r2(bx)},${r2(by)}) rotate(${r2(tt * 30)})`}>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path key={a} transform={`rotate(${a})`} d="M-2,-6 L0,-11 L2,-6 Z" {...olp(IRON_L, 1)} />
          ))}
          <circle r={7} {...olp(IRON, 1.6)} />
          <circle cx={-2} cy={-2} r={2} fill={IRON_L} opacity={0.7} />
        </g>
      </g>
    </g>
  );
};
