import type { HeroArt } from '../types.ts';
import { clamp01, easeOut, lerp } from '../types.ts';
import { Bow, Frame, Glow, Limb, OL, legs, olp, pose, pts, r2 } from './parts2.tsx';

const SKIN = '#f3cba6';
const SKIN_D = '#d49f78';
const HAIR = '#d8452c';
const HAIR_D = '#9c2a1c';
const HAIR_L = '#f07a4a';
const GREEN = '#4f9a4a';
const GREEN_D = '#356e33';
const LEATHER = '#8a5a32';
const LEATHER_D = '#5e3a1e';
const WOOD = '#b57c3e';
const WOOD_D = '#6e4420';
const WIND = '#c8ffd8';

type P = [number, number];

/** a swirling wind streak: partial ellipse arc around (cx,cy) */
function streak(cx: number, cy: number, rx: number, ry: number, a0: number, span: number, w: number, c: string, o: number) {
  const n = 8;
  const p: P[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (span * i) / n;
    p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return <polyline points={pts(p)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" opacity={r2(o)} />;
}

export const Windranger: HeroArt = ({ anim, t, dur, team }) => {
  const p = pose(anim, t, dur, 1.5, 0.46);
  const tt = p.t;
  const atk = anim === 'attack';
  const cast = anim === 'cast';
  const [bl, fl] = legs(p, { hipY: -25, spread: 5, w: 3.6, c: '#4a5a2e', cBack: '#33401f', boot: LEATHER, bootW: 5, stride: 9, lift: 6 });
  const hairF = Math.sin(tt * 3) * 1.6 + (p.walking ? 5 + Math.sin(p.wph * 2) * 1.5 : 0) + (cast ? 4 : 0);

  // bow rig; cast = 3 rapid draws
  const gx = 18;
  const gy = -43;
  const rest: P = [-5, -31];
  let pull = 0;
  let snap = 0;
  if (atk) {
    pull = p.k < 0.5 ? p.charge : 0;
    snap = p.flash;
  } else if (cast) {
    const cyc = (p.k * 3.2) % 1;
    const live = p.k > 0.1 && p.k < 0.95;
    pull = live ? (cyc < 0.6 ? easeOut(cyc / 0.6) : 0) : 0;
    snap = live && cyc >= 0.6 ? 1 - (cyc - 0.6) / 0.4 : 0;
  }
  const drawX = lerp(gx - 7, gx - 27, pull);
  const aiming = atk || (cast && p.k > 0.08 && p.k < 0.95);
  let bowRot = 20 + p.breathe * 2;
  if (p.walking) bowRot = 28 + Math.sin(p.wph) * 4;
  else if (atk) bowRot = p.k < 0.6 ? lerp(20, 0, clamp01(p.k / 0.15)) : lerp(0, 20, (p.k - 0.6) / 0.4);
  else if (cast) bowRot = aiming ? -4 : 20;
  else if (p.hurt) bowRot = 48;
  let hand: P = rest;
  if (aiming) hand = pull > 0.02 || (atk && p.k < 0.5) ? [lerp(gx - 8, drawX, 1), gy] : [lerp(gx - 8, gx - 16, snap), gy - 3 * snap];
  else if (p.hurt) hand = [-11, -36];
  else if (p.walking) hand = [-5 + Math.sin(p.wph) * 6, -31];
  if (atk && p.k < 0.12) hand = [lerp(rest[0], drawX, easeOut(p.k / 0.12)), lerp(rest[1], gy, easeOut(p.k / 0.12))];
  const nocked = (atk && p.k < 0.5) || (cast && pull > 0.05);
  const sh: P = [-3, -45];
  const el: P = [lerp(sh[0], hand[0], 0.5) - 3, lerp(sh[1], hand[1], 0.5) + 2];
  const fsh: P = [5, -45];
  const fel: P = [lerp(fsh[0], gx, 0.5), lerp(fsh[1], gy, 0.5) + 3];

  const hairD = `M-3,-63 Q-10,-60 -11,-50 Q${r2(-14 - hairF)},-40 ${r2(-18 - hairF)},-31 Q${r2(-13 - hairF * 0.6)},-33 ${r2(-12 - hairF * 0.5)},-30 Q-8,-40 -4,-46 Z`;
  const ws = tt * (p.walking ? 9 : 5);
  const spin = cast ? p.glow : 0;

  return (
    <Frame p={p} team={team} headY={-80}>
      {/* back wind streaks */}
      {anim !== 'dead' ? (
        <g>
          {streak(0, -8, 11, 3.2, ws, 2.2, 1.4, WIND, 0.45)}
          {streak(0, -16, 9, 2.6, ws * 1.2 + 2, 2, 1.1, WIND, 0.35)}
        </g>
      ) : null}
      {spin > 0 ? <Glow x={0} y={-40} r={20 + spin * 16} c="#7dff9a" o={0.4 + p.cflash * 0.3} /> : null}
      <g transform={`translate(0,${r2(p.bob)}) rotate(${r2(p.lean)},0,-25)`}>
        {/* long red hair behind */}
        <path d={hairD} {...olp(HAIR, 1.6)} />
        <path d={`M-8,-52 Q${r2(-12 - hairF * 0.8)},-41 ${r2(-15 - hairF)},-34`} fill="none" stroke={HAIR_D} strokeWidth={1.3} />
        {/* back arm */}
        <Limb p={[sh, el, hand]} w={3.2} c={GREEN_D} />
        {aiming ? null : <circle cx={r2(hand[0])} cy={r2(hand[1])} r={2} {...olp(SKIN_D, 1.1)} />}
      </g>
      {bl}
      {fl}
      <g transform={`translate(0,${r2(p.bob)}) rotate(${r2(p.lean)},0,-25)`}>
        {/* tunic */}
        <path d="M-6,-46 Q1,-48 8,-46 L7,-33 Q8,-28 9,-20 Q1,-18 -7,-20 Q-6,-28 -5,-33 Z" {...olp(GREEN)} />
        <path d="M-6,-46 L-5,-33 Q-6,-28 -7,-20 Q-4,-19.5 -2,-19.5 Q-2,-33 -1,-46 Z" fill={GREEN_D} />
        <path d="M-6.5,-29 L8,-29 L8.3,-26 L-6.6,-26 Z" {...olp(LEATHER, 1.1)} />
        <path d="M-5,-46 L8,-30" stroke={OL} strokeWidth={2.6} />
        <path d="M-5,-46 L8,-30" stroke={LEATHER} strokeWidth={1.2} />
        {/* hood cowl around neck */}
        <path d="M-8,-47 Q0,-51 9,-47 Q8,-43 1,-43 Q-6,-43 -8,-47 Z" {...olp(GREEN_D, 1.4)} />
        {/* face */}
        <circle cx={5} cy={-55} r={7.6} {...olp(SKIN)} />
        <path d="M-1,-51 Q1,-48 5,-47.5 Q0,-50 0,-55 Z" fill={SKIN_D} />
        <ellipse cx={9.3} cy={-55.3} rx={1.1} ry={1.4} fill="#2f6b34" />
        <circle cx={9.6} cy={-55.8} r={0.4} fill="#fff" />
        <path d="M8,-57.6 L11,-57.8" stroke={HAIR_D} strokeWidth={0.9} strokeLinecap="round" />
        <path d="M9.6,-50.6 Q10.8,-50.2 11.6,-50.8" fill="none" stroke="#a5544f" strokeWidth={0.9} strokeLinecap="round" />
        {/* hair top + bangs */}
        <path d="M-4,-55 Q-5,-64 3,-65 Q11,-65 13,-58 Q10,-60 8,-58.5 Q6,-61 3,-59 Q1,-56 0,-50 Q-3,-50 -4,-55 Z" {...olp(HAIR, 1.4)} />
        <path d="M1,-63 Q6,-64 10,-61" fill="none" stroke={HAIR_L} strokeWidth={1.1} strokeLinecap="round" />
        {/* bow + front arm */}
        <Bow gx={gx} gy={gy} h={42} drawX={drawX} wood={WOOD} woodDark={WOOD_D} rot={bowRot} arrow={nocked ? { color: '#e8dcc0', tip: '#cfd6dd' } : null} />
        <Limb p={[fsh, fel, [gx, gy]]} w={3.4} c={GREEN} />
        <path d={`M${r2(lerp(fel[0], gx, 0.3))},${r2(lerp(fel[1], gy, 0.3))} L${r2(lerp(fel[0], gx, 0.8))},${r2(lerp(fel[1], gy, 0.8))}`} stroke={LEATHER} strokeWidth={3.6} strokeLinecap="round" />
        <circle cx={gx} cy={gy} r={2.2} {...olp(SKIN, 1.1)} />
        {aiming ? <circle cx={r2(hand[0])} cy={r2(hand[1])} r={2} {...olp(SKIN_D, 1.1)} /> : null}
        {snap > 0.05 ? (
          <g opacity={r2(snap)}>
            <line x1={gx} y1={gy} x2={gx + 34} y2={gy} stroke="#f4fff0" strokeWidth={1.6} strokeLinecap="round" />
            {streak(gx + 14, gy, 10, 4, tt * 20, 2.4, 1, '#7dff9a', 0.9)}
          </g>
        ) : null}
      </g>
      {/* front wind streaks around legs */}
      {anim !== 'dead' ? (
        <g>
          {streak(0, -8, 11, 3.2, ws + Math.PI, 1.8, 1.6, WIND, 0.7)}
          {streak(0, -16, 9, 2.6, ws * 1.2 + 2 + Math.PI, 1.6, 1.2, WIND, 0.55)}
        </g>
      ) : null}
      {/* cast green wind spiral */}
      {spin > 0
        ? [0, 1, 2].map((i) => (
            <g key={i}>{streak(0, -12 - i * 14, 12 + i * 3 + spin * 4, 3.4 + i, tt * 12 + i * 2, 3.2, 2 - i * 0.3, i % 2 ? '#7dff9a' : WIND, spin * 0.9)}</g>
          ))
        : null}
    </Frame>
  );
};
