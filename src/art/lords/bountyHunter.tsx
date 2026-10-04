// Bounty Hunter lord: small crouched goblin hunter, twin curved blades, flowing scarf, tossed gold coin.
import { Glow, Limb, Sparkle, olp, pose, r2 } from '../heroes/parts2.tsx';
import type { HeroArt } from '../types.ts';
import { bump, loop } from '../types.ts';

const SKIN = '#c08a5c';
const SKIN_D = '#946440';
const WRAP = '#d8c69c';
const WRAP_D = '#a8956b';
const LEATHER = '#6b4528';
const LEATHER_D = '#4a2e1a';
const SCARF = '#b8352a';
const SCARF_D = '#7e2018';
const STEEL = '#c9d0da';
const STEEL_D = '#7d8794';
const GOLD = '#f2c14e';
const GOLD_D = '#b8842a';

function Blade({ x, y, a, len = 22 }: { x: number; y: number; a: number; len?: number }) {
  return (
    <g transform={`translate(${r2(x)},${r2(y)}) rotate(${r2(a)})`}>
      <path d={`M0,-1.5 Q${len * 0.5},-6 ${len},-1 Q${len * 0.55},1.5 0,2 Z`} {...olp(STEEL, 1.5)} />
      <path d={`M2,-1.2 Q${len * 0.5},-4.8 ${len - 2},-1.2`} fill="none" stroke="#fff" strokeWidth={0.8} opacity={0.8} />
      <rect x={-6} y={-1.6} width={6} height={3.2} rx={1} {...olp(LEATHER, 1.1)} />
      <path d="M0,-4 L1.5,-4 L1.5,4 L0,4 Z" {...olp(GOLD, 1)} />
    </g>
  );
}

export const BountyHunterLord: HeroArt = ({ anim, t, dur }) => {
  const p = pose(anim, t, dur, 1.3);
  const tt = p.t;
  const br = p.breathe;
  const sw = Math.sin(tt * 3.1);
  const sc = (k: number) => Math.sin(tt * 4 - k * 1.4) * (2 + k * 1.6);
  const scarf = `M-6,-45 Q-16,${r2(-46 + sc(0))} -24,${r2(-43 + sc(1))} Q-32,${r2(-40 + sc(2))} -40,${r2(-44 + sc(3))} L-38,${r2(-38 + sc(3))} Q-30,${r2(-34 + sc(2))} -22,${r2(-37 + sc(1))} Q-14,${r2(-39 + sc(0))} -5,-39 Z`;
  // coin toss
  const cq = loop(tt, 1.5);
  const coinY = -54 - bump(cq) * 22;
  const coinRx = Math.abs(Math.cos(tt * 9)) * 3 + 0.4;

  return (
    <g>
      <ellipse cx={0} cy={0} rx={24} ry={4.5} fill="#000" opacity={0.35} />
      {/* scarf tail */}
      <path d={scarf} {...olp(SCARF, 1.6)} />
      <path d={`M-14,${r2(-41 + sc(0))} Q-26,${r2(-38 + sc(1.5))} -36,${r2(-40 + sc(3))}`} fill="none" stroke={SCARF_D} strokeWidth={1.2} />
      <g transform={`translate(0,${r2(br * 0.9)})`}>
        {/* back leg (crouched) */}
        <Limb p={[[-4, -22], [-13, -12], [-10, -2]]} w={6} c={WRAP_D} />
        <path d="M-16,0 L-14,-5 L-6,-5 L-4,0 Z" {...olp(LEATHER_D, 1.3)} />
        {/* back arm with blade held low behind */}
        <Limb p={[[-4, -40], [-13, -33], [-17, -27]]} w={4.4} c={SKIN_D} />
        <Blade x={-17} y={-27} a={155 + sw * 4} len={20} />
        <circle cx={-17} cy={-27} r={2.6} {...olp(SKIN_D, 1.2)} />
        {/* gold sack at hip */}
        <path d="M-15,-26 Q-21,-18 -15,-13 Q-8,-11 -7,-18 Q-8,-24 -12,-27 Z" {...olp('#8a6a3c', 1.5)} />
        <path d="M-14,-27 L-10,-27" stroke={GOLD} strokeWidth={1.6} />
        <circle cx={-12} cy={-18} r={1.8} {...olp(GOLD, 0.9)} />
        {/* torso leaning forward */}
        <path d="M-8,-44 Q-11,-34 -7,-21 L8,-20 Q12,-30 9,-42 Q0,-48 -8,-44 Z" {...olp(LEATHER, 1.8)} />
        <path d="M-8,-44 Q-11,-34 -7,-21 L-3,-21 Q-6,-33 -3,-45 Z" fill={LEATHER_D} />
        <path d="M-6,-43 L8,-24" stroke="#14110f" strokeWidth={4} strokeLinecap="round" />
        <path d="M-6,-43 L8,-24" stroke={WRAP} strokeWidth={2.2} strokeLinecap="round" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={-3 + i * 4.2} cy={-38 + i * 5.6} r={1.3} {...olp(GOLD, 0.8)} />
        ))}
        <path d="M-8,-23 L9,-22 L9,-19 L-8,-20 Z" {...olp(LEATHER_D, 1.2)} />
        <rect x={-1} y={-24} width={4} height={4} rx={0.8} {...olp(GOLD, 1)} />
        {/* front leg */}
        <Limb p={[[4, -21], [14, -14], [12, -3]]} w={6.4} c={WRAP} />
        <path d="M7,0 L9,-5 L17,-5 L20,0 Z" {...olp(LEATHER_D, 1.3)} />
        {/* head: huge ears, wrapped mask, yellow eyes */}
        <g transform={`rotate(${r2(sw * 2)},4,-48)`}>
          <path d="M-2,-56 Q-14,-66 -24,-66 Q-15,-58 -3,-50 Z" {...olp(SKIN, 1.5)} />
          <path d="M-3,-55 Q-12,-62 -19,-63 Q-12,-57 -3,-52 Z" fill={SKIN_D} />
          <path d="M8,-58 Q14,-70 22,-74 Q20,-63 12,-54 Z" {...olp(SKIN, 1.5)} />
          <path d="M10,-58 Q15,-67 19,-70 Q17,-63 12,-56 Z" fill="#d9a07a" />
          <circle cx={4} cy={-52} r={8.6} {...olp(SKIN, 1.8)} />
          <path d="M-4,-56 Q4,-63 12,-56 L12,-58 Q4,-66 -4,-58 Z" {...olp(LEATHER_D, 1.2)} />
          <path d="M-3,-50 Q5,-52 13,-50 L12,-44 Q5,-41 -2,-44 Z" {...olp(WRAP, 1.4)} />
          <path d="M2,-49 L11,-48.5" stroke={WRAP_D} strokeWidth={0.9} />
          <path d="M4,-55 L11,-55.5 L10,-53 L5,-53 Z" fill="#14110f" />
          <path d="M6,-54.6 L10,-54.8 L9.4,-53.6 L6.4,-53.6 Z" fill="#ffd23d" />
          <Glow x={8} y={-54} r={3.5} c="#ffd23d" o={0.6} />
        </g>
        {/* scarf knot */}
        <path d="M-6,-46 Q2,-43 10,-46 L10,-41 Q2,-38 -6,-41 Z" {...olp(SCARF, 1.4)} />
        {/* front arm with blade raised forward */}
        <Limb p={[[5, -40], [14, -34 + sw * 0.6], [20, -40 + sw]]} w={4.6} c={SKIN} />
        <Blade x={20} y={-40 + sw} a={-62 + sw * 5} len={22} />
        <circle cx={20} cy={r2(-40 + sw)} r={2.8} {...olp(SKIN, 1.2)} />
        <rect x={11} y={-37} width={5} height={4} rx={1} transform="rotate(-30,13,-35)" {...olp(WRAP, 1)} />
      </g>
      {/* tossed coin */}
      <g transform={`translate(${r2(27 - cq * 4)},${r2(coinY)})`}>
        <ellipse cx={0} cy={0} rx={r2(coinRx)} ry={3.4} {...olp(GOLD, 1.1)} />
        <ellipse cx={0} cy={0} rx={r2(coinRx * 0.55)} ry={2} fill={GOLD_D} opacity={0.6} />
      </g>
      <Sparkle x={-12} y={-30} s={2.6 * bump(loop(tt, 1.1))} c="#fff6c8" />
      <Sparkle x={26} y={r2(coinY - 4)} s={2 * bump(loop(tt + 0.3, 0.7))} c="#fff6c8" />
    </g>
  );
};
