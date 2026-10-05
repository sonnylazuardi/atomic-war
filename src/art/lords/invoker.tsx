// Invoker lord: proud arch-mage in purple/gold robes with Quas, Wex and Exort orbs circling.
import { Blob, Limb, olp, pose, r2 } from '../heroes/parts2.tsx';
import type { HeroArt } from '../types.ts';
import { SoftGlow } from './soft.tsx';

const ROBE = '#6b3fa0';
const ROBE_D = '#46286e';
const ROBE_L = '#9466c8';
const GOLD = '#f2c14e';
const GOLD_D = '#b8842a';
const SKIN = '#f0c9a0';
const SKIN_D = '#c99a72';
const HAIR = '#f1ece0';
const ORBS = [
  { c: '#6fd3ff', core: '#e6f8ff' }, // quas
  { c: '#d07bff', core: '#f6e6ff' }, // wex
  { c: '#ff9a3a', core: '#fff0d0' }, // exort
];

export const InvokerLord: HeroArt = ({ anim, t, dur }) => {
  const p = pose(anim, t, dur, 2.2);
  const tt = p.t;
  const br = p.breathe;
  const rw = (k: number) => Math.sin(tt * 2 - k) * (0.8 + k * 0.8);
  // orbs orbit around the head (depth-sorted against the body)
  const orbs = ORBS.map((o, i) => {
    const a = tt * 1.5 + (i * Math.PI * 2) / 3;
    return { ...o, i, x: 2 + Math.cos(a) * 20, y: -78 + Math.sin(a) * 6, front: Math.sin(a) > 0 };
  });
  const drawOrb = (o: (typeof orbs)[number]) => (
    <g key={o.i}>
      <SoftGlow x={o.x} y={o.y} r={9} c={o.c} o={0.85} />
      <circle cx={r2(o.x)} cy={r2(o.y)} r={3.6} fill={o.c} stroke="#14110f" strokeWidth={1.1} />
      <circle cx={r2(o.x - 1)} cy={r2(o.y - 1)} r={1.4} fill={o.core} />
    </g>
  );

  return (
    <g>
      <ellipse cx={0} cy={0} rx={24} ry={4.5} fill="#000" opacity={0.35} />
      {orbs.filter((o) => !o.front).map(drawOrb)}
      <g transform={`translate(0,${r2(br * 0.7)})`}>
        {/* flared robe */}
        <path d={`M-10,-56 Q-14,-30 ${r2(-20 + rw(1))},-2 Q0,${r2(2 + rw(0) * 0.5)} 18,-2 Q14,-30 10,-56 Q0,-60 -10,-56 Z`} {...olp(ROBE, 2)} />
        <path d={`M-10,-56 Q-14,-30 ${r2(-20 + rw(1))},-2 Q-12,-1 -6,-1 Q-8,-30 -4,-58 Z`} fill={ROBE_D} />
        <path d={`M${r2(-20 + rw(1))},-2 Q0,${r2(2 + rw(0) * 0.5)} 18,-2`} fill="none" stroke={GOLD} strokeWidth={2.4} />
        <path d="M2,-56 L3,-2" stroke={GOLD} strokeWidth={2} />
        <path d="M6,-50 Q10,-30 13,-8" fill="none" stroke={ROBE_L} strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />
        <path d="M-9,-36 Q1,-32 11,-36 L11,-31 Q1,-27 -9,-31 Z" {...olp(GOLD, 1.2)} />
        <path d="M-2,-33 L4,-33 L1,-28 Z" {...olp('#d0342a', 0.8)} />
        {/* back arm: hand on the back (proud) */}
        <Limb p={[[-7, -52], [-14, -42], [-9, -36]]} w={5.4} c={ROBE_D} />
        {/* high collar */}
        <path d="M-12,-56 Q-14,-70 -8,-74 L-4,-60 Z" {...olp(ROBE_D, 1.4)} />
        <path d="M-12,-56 Q-14,-70 -8,-74" fill="none" stroke={GOLD} strokeWidth={1.2} />
        {/* head: long white hair, proud chin */}
        <Blob c={[[-4, -66, 5], [-6, -60, 4], [-3, -56, 3.4]]} fill={HAIR} ow={2} shade="#cfc8b6" />
        <circle cx={3} cy={-67} r={7.2} {...olp(SKIN, 1.6)} />
        <path d="M-4,-64 Q-2,-60 3,-59.6 Q-2,-62 -2,-67 Z" fill={SKIN_D} />
        <Blob c={[[0, -73, 4.4], [5, -74.5, 3.6], [-4, -71, 3.4]]} fill={HAIR} ow={2} />
        <path d="M5,-68 L9,-68.4" stroke="#14110f" strokeWidth={1.4} strokeLinecap="round" />
        <path d="M5,-70.4 L9.4,-71.4" stroke="#8a7a60" strokeWidth={1.1} strokeLinecap="round" />
        <path d="M7,-63 L10,-63" stroke="#14110f" strokeWidth={0.9} strokeLinecap="round" />
        {/* shoulder mantle */}
        <path d="M-10,-58 Q0,-64 12,-58 L11,-52 Q0,-56 -10,-52 Z" {...olp(GOLD_D, 1.3)} />
        {/* front arm raised, conducting the orbs */}
        <Limb p={[[6, -54], [16, -58 + br], [20, -66 + br]]} w={5.6} c={ROBE} />
        <path d="M13,-60 Q17,-54 21,-58 L19,-63 Z" {...olp(GOLD, 1)} />
        <circle cx={20.5} cy={r2(-67 + br)} r={2.6} {...olp(SKIN, 1.1)} />
        <SoftGlow x={21} y={-70 + br} r={6} c="#fff3c0" o={0.5 + 0.3 * Math.sin(tt * 4)} />
      </g>
      {orbs.filter((o) => o.front).map(drawOrb)}
    </g>
  );
};
