import type { HeroArt } from '../types.ts';
import { lerp } from '../types.ts';
import { Frame, Glow, Limb, OL, arm, dirPt, legs, olp, pose, pts, r2 } from './parts2.tsx';

const ARM = '#d9542e';
const ARM_D = '#9c3420';
const ARM_L = '#f08a4a';
const GOLD = '#f2c14e';
const GOLD_D = '#b8862b';
const CAPE = '#7a1f24';
const CAPE_D = '#521418';
const STEEL = '#dfe5ec';
const STEEL_D = '#8d98a6';
const SKIN = '#f0c39c';
const WING = '#3f9a4a';
const WING_D = '#24622d';
const MEMB = '#7ccf6e';
const FIRE = '#ff8a2a';

type P = [number, number];

/** draconic wing rooted at (0,0), extending up/back; s = 0..1 grow */
function wing(s: number, flap: number, dark: boolean) {
  if (s <= 0.02) return null;
  const tip: P = [-30, -36];
  const f1: P = [-36, -6];
  const f2: P = [-26, 6];
  const f3: P = [-12, 10];
  const elbow: P = [-14, -26];
  const memb = `M0,0 L${pts([elbow, tip])} Q-30,-18 ${pts([f1])} Q-28,0 ${pts([f2])} Q-18,4 ${pts([f3])} Q-6,6 0,0 Z`;
  return (
    <g transform={`scale(${r2(s)}) rotate(${r2(flap)})`}>
      <path d={memb} {...olp(dark ? WING_D : MEMB, 1.6)} />
      {[f1, f2, f3].map(([x, y], i) => (
        <line key={i} x1={elbow[0]} y1={elbow[1]} x2={x} y2={y} stroke={dark ? '#173f1d' : WING_D} strokeWidth={1.2} />
      ))}
      <Limb p={[[0, 0], elbow, tip]} w={2.6} c={dark ? WING_D : WING} ow={2.2} />
      <path d={`M${tip[0]},${tip[1]} l-3,-4 l4,1 Z`} {...olp(GOLD, 1)} />
    </g>
  );
}

export const DragonKnight: HeroArt = ({ anim, t, dur, team }) => {
  const p = pose(anim, t, dur, 1.7, 0.62);
  const tt = p.t;
  const capeF = Math.sin(tt * 2.6) * 1.4 + (p.walking ? 5 + Math.sin(p.wph * 2) * 1.5 : 0) + (anim === 'cast' ? p.raise * 4 : 0);
  const [bl, fl] = legs(p, { hipY: -23, spread: 6, w: 5, c: ARM, cBack: ARM_D, boot: '#4a3226', bootW: 6, stride: 7, lift: 4 });

  // sword arm
  let a1 = 28 + p.breathe * 3;
  let a2 = 85;
  let sang = 150 + p.breathe * 3;
  let ba1 = 30;
  let ba2 = 60;
  if (p.walking) {
    a1 = 20 - Math.sin(p.wph) * 18;
    a2 = 75;
    sang = 140;
    ba1 = 35;
    ba2 = 65;
  } else if (anim === 'attack') {
    a1 = 28 + 140 * p.charge + 52 * p.strike;
    a2 = 85 + 110 * p.charge - 5 * p.strike;
    sang = 150 + 70 * p.charge - 80 * p.strike;
    ba1 = 30 - 10 * p.charge;
    ba2 = 60;
  } else if (anim === 'cast') {
    a1 = lerp(28, 155, p.raise);
    a2 = lerp(85, 175, p.raise);
    sang = lerp(150, 182, p.raise);
    ba1 = lerp(30, 60, p.raise);
    ba2 = lerp(60, 100, p.raise);
  } else if (p.hurt) {
    a1 = -15;
    a2 = 30;
    sang = 210;
    ba1 = 10;
    ba2 = 40;
  }
  const fa = arm(6, -43, a1, a2, 9, 8.5);
  const ba = arm(-4, -43, ba1, ba2, 9, 8);
  const [stx, sty] = dirPt(fa.hx, fa.hy, sang, 32);
  const [pmx, pmy] = dirPt(fa.hx, fa.hy, sang + 180, 4.5);
  const [g1x, g1y] = dirPt(fa.hx, fa.hy, sang + 90, 4.5);
  const [g2x, g2y] = dirPt(fa.hx, fa.hy, sang - 90, 4.5);
  const [b0x, b0y] = dirPt(fa.hx, fa.hy, sang, 2);
  const [bl1x, bl1y] = dirPt(b0x, b0y, sang + 90, 1.8);
  const [bl2x, bl2y] = dirPt(b0x, b0y, sang - 90, 1.8);
  const [bt1x, bt1y] = dirPt(stx, sty, sang + 180, 3);
  const [bt1ax, bt1ay] = dirPt(bt1x, bt1y, sang + 90, 1.8);
  const [bt1bx, bt1by] = dirPt(bt1x, bt1y, sang - 90, 1.8);
  const blade = `M${pts([
    [bl1x, bl1y],
    [bt1ax, bt1ay],
    [stx, sty],
    [bt1bx, bt1by],
    [bl2x, bl2y],
  ])}Z`;

  const dragon = anim === 'cast' ? p.raise : 0;
  const flap = Math.sin(tt * 9) * 10 * dragon;
  const slash = anim === 'attack' && p.k > 0.46 && p.k < 0.8 ? 1 - (p.k - 0.46) / 0.34 : 0;
  const capeD = `M-6,-46 Q-11,-36 -13,-26 Q${r2(-16 - capeF)},-14 ${r2(-19 - capeF)},-4 Q-11,-2 -4,-5 L0,-44 Z`;

  return (
    <Frame p={p} team={team} headY={-80} rx={17}>
      {dragon > 0 ? <Glow x={-4} y={-44} r={20 + dragon * 26 + p.cflash * 12} c={FIRE} o={0.55 + p.cflash * 0.4} /> : null}
      <g transform={`translate(0,${r2(p.bob)}) rotate(${r2(p.lean)},0,-23)`}>
        {/* wings (dragon form) */}
        {dragon > 0 ? (
          <g>
            <g transform="translate(-1,-45) rotate(14)">{wing(dragon, flap * 0.8, true)}</g>
            <g transform="translate(-4,-43)">{wing(dragon * 1.05, -flap, false)}</g>
          </g>
        ) : null}
        <path d={capeD} {...olp(CAPE, 1.7)} />
        <path d={`M-9,-36 Q-13,-24 ${r2(-15 - capeF * 0.7)},-6`} fill="none" stroke={CAPE_D} strokeWidth={1.6} />
      </g>
      {bl}
      {fl}
      <g transform={`translate(0,${r2(p.bob)}) rotate(${r2(p.lean)},0,-23)`}>
        {/* tasset / skirt */}
        <path d="M-9,-27 L11,-27 L13,-16 Q2,-13 -10,-16 Z" {...olp(ARM_D, 1.5)} />
        <path d="M-3,-27 L-3,-15 M4,-27 L5,-14" stroke={OL} strokeWidth={0.9} />
        {/* breastplate */}
        <path d="M-8,-46 Q2,-49 11,-45 Q12,-35 10,-27 L-8,-27 Q-10,-36 -8,-46 Z" {...olp(ARM)} />
        <path d="M-8,-46 Q-10,-36 -8,-27 L-3,-27 Q-5,-37 -3,-47 Z" fill={ARM_D} />
        <path d="M3,-46 Q8,-40 7,-31" fill="none" stroke={ARM_L} strokeWidth={1.6} strokeLinecap="round" />
        <path d="M-9,-29 L11,-29 L11,-26 L-9,-26 Z" {...olp(GOLD, 1.2)} />
        <circle cx={2} cy={-27.5} r={2} {...olp(GOLD_D, 1)} />
        {/* helmet with gold crest */}
        <path d="M-6,-60 Q-14,-70 -20,-68 Q-15,-64 -9,-56 Z" {...olp(GOLD, 1.4)} />
        <path d="M-4,-63 Q-10,-76 -17,-77 Q-12,-70 -7,-60 Z" {...olp(GOLD, 1.4)} />
        <circle cx={3.5} cy={-55.5} r={9} {...olp(ARM)} />
        <path d="M-5,-52 Q-4,-48 0,-47 Q-4,-50 -4,-56 Z" fill={ARM_D} />
        <path d="M6,-57 Q10,-59 13,-57 L13,-49 Q10,-47 7,-49 Z" fill={SKIN} stroke={OL} strokeWidth={1.3} strokeLinejoin="round" />
        <path d="M6,-55 L13.4,-55" stroke={OL} strokeWidth={1.4} />
        <circle cx={10.5} cy={-53.5} r={0.8} fill={OL} />
        <path d="M6,-57 L6,-48" stroke={GOLD_D} strokeWidth={1.4} />
        <path d="M-2,-64 Q4,-66 10,-63" fill="none" stroke={GOLD} strokeWidth={1.6} strokeLinecap="round" />
        {/* back arm + dragon-crest shield */}
        <Limb p={[[ba.sx, ba.sy], [ba.ex, ba.ey], [ba.hx, ba.hy]]} w={4.4} c={ARM_D} />
        <g transform={`translate(${r2(ba.hx - 3)},${r2(ba.hy - 2)})`}>
          <path d="M-8,-12 Q0,-15 8,-12 L8,0 Q7,9 0,14 Q-7,9 -8,0 Z" {...olp(ARM_D, 1.8)} />
          <path d="M-6,-10 Q0,-12.5 6,-10 L6,0 Q5,7 0,11 Q-5,7 -6,0 Z" fill={ARM} />
          <path d="M-6,-10 Q0,-12.5 6,-10 L6,0 Q5,7 0,11 Q-5,7 -6,0 Z" fill="none" stroke={GOLD} strokeWidth={1.3} />
          {/* dragon crest */}
          <path d="M-3.5,4 Q-4,-2 0,-5 Q-1,-8 2,-9 Q4,-7 3,-5 L5,-3 L2.5,-2.5 Q3,1 0,3 Q2,5 0.5,8 Q-1,5 -3.5,4 Z" {...olp(GOLD, 0.9)} />
          <path d="M-5,-3 Q-7,-7 -4,-8 M5,-6 Q7,-8 6,-11" fill="none" stroke={GOLD} strokeWidth={1.2} strokeLinecap="round" />
        </g>
        {/* pauldron */}
        <path d="M0,-47 Q8,-52 14,-45 Q12,-40 7,-39 Q3,-42 0,-47 Z" {...olp(ARM)} />
        <path d="M2,-47 Q8,-50 12,-45" fill="none" stroke={GOLD} strokeWidth={1.3} />
        {/* sword */}
        <path d={blade} {...olp(STEEL, 1.4)} />
        <path d={`M${pts([[b0x, b0y], [bt1x, bt1y]])}`} stroke={STEEL_D} strokeWidth={0.8} />
        <Limb p={[[g1x, g1y], [g2x, g2y]]} w={2} c={GOLD} ow={2.4} />
        <Limb p={[[fa.hx, fa.hy], [pmx, pmy]]} w={1.8} c="#5a3a22" ow={2.4} />
        <circle cx={r2(pmx)} cy={r2(pmy)} r={1.4} {...olp(GOLD, 0.9)} />
        {/* front arm */}
        <Limb p={[[fa.sx, fa.sy], [fa.ex, fa.ey], [fa.hx, fa.hy]]} w={4.4} c={ARM} />
        <circle cx={r2(fa.hx)} cy={r2(fa.hy)} r={2.6} {...olp('#5a3a22', 1.2)} />
        {/* slash trail */}
        {slash > 0.02 ? (
          <g opacity={r2(slash)}>
            <path d="M8,-80 Q46,-60 34,-14 Q38,-52 8,-80 Z" fill="#fff4dc" />
            <path d="M8,-80 Q46,-60 34,-14" fill="none" stroke={FIRE} strokeWidth={1.2} opacity={0.7} />
          </g>
        ) : null}
        {dragon > 0 ? (
          <g>
            <Glow x={stx} y={sty} r={5 + dragon * 6} c={FIRE} />
            {[0, 1, 2, 3].map((i) => {
              const q = (tt * 1.8 + i * 0.25) % 1;
              return <circle key={i} cx={r2(-8 + i * 6 + Math.sin(q * 8 + i) * 3)} cy={r2(-20 - q * 40)} r={r2(1.6 * (1 - q) + 0.3)} fill={i % 2 ? FIRE : '#ffd23d'} opacity={r2((1 - q) * dragon)} />;
            })}
          </g>
        ) : null}
      </g>
      {anim === 'cast' && p.cflash > 0.05 ? <circle cx={-4} cy={-46} r={r2(24 + p.cflash * 22)} fill="none" stroke="#ffd27a" strokeWidth={r2(3.5 * p.cflash)} opacity={r2(p.cflash)} /> : null}
    </Frame>
  );
};
