// Ember Spirit lord: fiery monk with flame hair, flowing scarf, twin katanas, a burning remnant behind.
import { Flame } from '../heroes/parts1.tsx';
import { Blob, Limb, Sparkle, olp, pose, r2 } from '../heroes/parts2.tsx';
import type { HeroArt } from '../types.ts';
import { bump, loop } from '../types.ts';
import { SoftGlow } from './soft.tsx';

const SKIN = '#e0a070';
const SKIN_D = '#b37548';
const GI = '#c2401f';
const GI_D = '#8a2a14';
const SASH = '#f2c14e';
const SCARF = '#ff8a2a';
const SCARF_D = '#c8551a';
const STEEL = '#e8edf2';
const FIRE = '#ff6a1f';

function Katana({ x, y, a, glow }: { x: number; y: number; a: number; glow: number }) {
  return (
    <g transform={`translate(${r2(x)},${r2(y)}) rotate(${r2(a)})`}>
      <path d="M0,-1.2 L26,-2.4 Q29,-1 26,0.6 L0,1.2 Z" {...olp(STEEL, 1.3)} />
      <path d="M2,-0.2 L25,-1.2" stroke={FIRE} strokeWidth={0.9} opacity={r2(0.5 + glow * 0.5)} />
      <rect x={-1} y={-2.6} width={1.8} height={5.2} {...olp(SASH, 0.9)} />
      <rect x={-7} y={-1.2} width={6} height={2.4} rx={0.8} {...olp('#2a1a12', 0.9)} />
    </g>
  );
}

function Body({ tt, br, ghost }: { tt: number; br: number; ghost?: boolean }) {
  const sc = (k: number) => Math.sin(tt * 3.6 - k * 1.3) * (1.5 + k * 1.4);
  const glow = 0.5 + 0.5 * Math.sin(tt * 4);
  const hair = ghost
    ? null
    : [0, 1, 2, 3].map((i) => <Flame key={i} x={-4 + i * 3} y={-76 + Math.abs(i - 1.5) * 1.5} s={10 - Math.abs(i - 1.5) * 2} t={tt} seed={i} lean={-4} />);
  return (
    <g transform={`translate(0,${r2(br * 0.8)})`}>
      {/* scarf streaming back */}
      <path
        d={`M-4,-58 Q-16,${r2(-62 + sc(0))} -28,${r2(-58 + sc(1))} Q-38,${r2(-54 + sc(2))} -46,${r2(-60 + sc(3))} L-44,${r2(-53 + sc(3))} Q-36,${r2(-48 + sc(2))} -26,${r2(-51 + sc(1))} Q-14,${r2(-54 + sc(0))} -3,-52 Z`}
        {...olp(SCARF, 1.5)}
      />
      <path d={`M-14,${r2(-57 + sc(0))} Q-28,${r2(-54 + sc(1.5))} -40,${r2(-56 + sc(3))}`} fill="none" stroke={SCARF_D} strokeWidth={1.2} />
      {/* back leg (wide stance) */}
      <Limb p={[[-4, -26], [-13, -14], [-16, -3]]} w={8} c={GI_D} />
      <path d="M-21,0 L-19,-4 L-12,-4 L-11,0 Z" {...olp('#2a1a12', 1.2)} />
      {/* back arm + sword low behind */}
      <Limb p={[[-5, -52], [-14, -44], [-20, -38]]} w={5} c={SKIN_D} />
      <Katana x={-20} y={-38} a={160} glow={glow} />
      <circle cx={-20} cy={-38} r={2.8} {...olp(SKIN_D, 1.2)} />
      {/* torso: bare chest, open gi */}
      <path d="M-10,-58 Q-12,-42 -8,-27 L9,-27 Q12,-42 10,-58 Q0,-62 -10,-58 Z" {...olp(SKIN, 1.8)} />
      <path d="M-10,-58 Q-12,-42 -8,-27 L-4,-27 Q-7,-42 -5,-60 Z" fill={SKIN_D} />
      <path d="M-1,-50 Q3,-48 7,-50 M0,-42 Q3,-40 6,-42" fill="none" stroke={SKIN_D} strokeWidth={1} strokeLinecap="round" />
      <path d="M-10,-58 L-3,-58 L-6,-27 L-9,-27 Z" fill={GI} stroke="#14110f" strokeWidth={1.3} />
      <path d="M-9,-30 L10,-30 L10,-25 L-9,-25 Z" {...olp(SASH, 1.2)} />
      <path d="M8,-27 L12,-17 L9,-16 L6,-25 Z" {...olp(SASH, 1)} />
      {/* front leg */}
      <Limb p={[[4, -26], [13, -15], [13, -3]]} w={8.6} c={GI} />
      <path d="M9,0 L10,-4 L17,-4 L20,0 Z" {...olp('#2a1a12', 1.2)} />
      {/* head */}
      {hair}
      <circle cx={2} cy={-66} r={8} {...olp(SKIN, 1.7)} />
      <path d="M-6,-64 Q-4,-60 1,-59 Q-4,-62 -4,-67 Z" fill={SKIN_D} />
      <path d="M-6,-70 Q2,-76 10,-69 Q4,-72 -6,-68 Z" {...olp('#7a1e0e', 1.1)} />
      <path d="M4,-68 L9,-67.6" stroke="#14110f" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M5,-68.4 L8.5,-68" stroke="#ffd84a" strokeWidth={0.8} strokeLinecap="round" />
      <Blob c={[[5, -59.5, 2.4], [8, -60.5, 1.8]]} fill="#7a1e0e" ow={1.4} />
      {/* front arm + sword raised forward */}
      <Limb p={[[5, -52], [14, -46], [21, -52]]} w={5.2} c={SKIN} />
      <Katana x={21} y={-52} a={-40 + Math.sin(tt * 2) * 3} glow={glow} />
      <circle cx={21} cy={-52} r={3} {...olp(SKIN, 1.2)} />
    </g>
  );
}

export const EmberSpiritLord: HeroArt = ({ anim, t, dur }) => {
  const p = pose(anim, t, dur, 1.5);
  const tt = p.t;
  const embers = [0, 1, 2, 3, 4, 5].map((i) => {
    const q = loop(tt + i * 0.47, 2.2);
    return <Sparkle key={i} x={-26 + ((i * 13) % 48) + Math.sin(q * 6 + i) * 3} y={r2(-4 - q * 60)} s={1.4 + (i % 2)} c={i % 2 ? '#ffd84a' : FIRE} o={bump(q)} />;
  });
  const ghostO = 0.22 + 0.1 * Math.sin(tt * 3);
  return (
    <g>
      <ellipse cx={0} cy={0} rx={26} ry={4.5} fill="#000" opacity={0.35} />
      <SoftGlow x={0} y={-2} r={30} ry={7} c={FIRE} o={0.55} />
      {/* burning remnant: a fiery afterimage behind */}
      <g transform="translate(-18,0)" opacity={r2(ghostO + 0.1)}>
        <SoftGlow x={0} y={-36} r={20} ry={36} c={FIRE} o={0.7} />
        <path d="M-12,-1 L-8,-26 L-10,-56 Q-2,-62 8,-56 L14,-46 L8,-48 L8,-26 L12,-1 L4,-1 L0,-22 L-4,-1 Z M-3,-60 a7,7 0 1 1 0.1,0 Z" fill={FIRE} stroke="#ffd84a" strokeWidth={1} />
        {[-6, 0, 6].map((x, i) => (
          <Flame key={i} x={x} y={-64} s={9} t={tt + 0.3} seed={i + 3} color="#ff8a2a" />
        ))}
      </g>
      {[-24, -14, -6].map((x, i) => (
        <Flame key={i} x={x} y={-1} s={9 + i * 2} t={tt} seed={i + 7} />
      ))}
      <Body tt={tt} br={p.breathe} />
      {embers}
    </g>
  );
};
