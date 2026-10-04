import type { HeroArt } from '../types.ts';
import { clamp01, easeOut, lerp, loop } from '../types.ts';
import { Bow, Frame, Glow, Limb, OL, RuneRing, Sparkle, legs, olp, pose, r2 } from './parts2.tsx';

const SKIN = '#9cc3e8';
const SKIN_D = '#6d93c4';
const CLOAK = '#2c3f73';
const CLOAK_D = '#1b2749';
const CLOAK_L = '#4a63a8';
const HAIR = '#f2f5ff';
const HAIR_D = '#b9c5dc';
const BOW = '#c8f0ff';
const BOW_D = '#5fa8d8';
const FROST = '#9fe6ff';

type P = [number, number];

export const DrowRanger: HeroArt = ({ anim, t, dur, team }) => {
  const p = pose(anim, t, dur, 1.7, 0.6);
  const tt = p.t;
  const flutter = Math.sin(tt * 3.1) * 1.5 + (p.walking ? 5 + Math.sin(p.wph * 2) * 2 : 0) + (anim === 'cast' ? p.raise * 3 : 0);
  const [bl, fl] = legs(p, { hipY: -24, spread: 5, w: 3.8, c: '#24345e', cBack: CLOAK_D, boot: '#5a6f9a', bootW: 5, stride: 8, lift: 4.5 });

  // bow + arms (same archer rig as medusa)
  const gx = 17;
  const gy = -42;
  const atk = anim === 'attack';
  const rest: P = [-6, -30];
  const drawX = atk && p.k < 0.5 ? lerp(gx - 7, gx - 26, p.charge) : gx - 7;
  let bowRot = 22 + p.breathe * 2;
  if (p.walking) bowRot = 30 + Math.sin(p.wph) * 4;
  else if (atk) bowRot = p.k < 0.6 ? lerp(22, 0, clamp01(p.k / 0.15)) : lerp(0, 22, (p.k - 0.6) / 0.4);
  else if (anim === 'cast') bowRot = lerp(22, -20, p.raise);
  else if (p.hurt) bowRot = 50;
  let hand: P = rest;
  if (atk) hand = p.k < 0.5 ? [lerp(rest[0], drawX, easeOut(p.k / 0.12)), lerp(rest[1], gy, easeOut(p.k / 0.12))] : [lerp(rest[0], gx - 16, p.strike), lerp(rest[1], gy - 3, p.strike)];
  else if (anim === 'cast') hand = [lerp(rest[0], -10, p.raise), lerp(rest[1], -60, p.raise)];
  else if (p.hurt) hand = [-12, -36];
  else if (p.walking) hand = [-6 + Math.sin(p.wph) * 5, -30];
  const nocked = atk && p.k < 0.5;
  const sh: P = [-4, -44];
  const el: P = [lerp(sh[0], hand[0], 0.5) - 3, lerp(sh[1], hand[1], 0.5) + 2];
  const fsh: P = [5, -44];
  const fgx = anim === 'cast' ? gx - p.raise * 2 : gx;
  const fgy = anim === 'cast' ? gy - p.raise * 6 : gy;
  const fel: P = [lerp(fsh[0], fgx, 0.5), lerp(fsh[1], fgy, 0.5) + 3];

  const capeD = `M3,-46 Q-6,-47 -8,-41 Q-12,-26 ${r2(-19 - flutter)},-9 L${r2(-14 - flutter * 0.7)},-12 L${r2(-11 - flutter * 0.5)},-7 L${r2(-7 - flutter * 0.3)},-11 L-3,-8 Q-3,-30 3,-46 Z`;
  const castRing = anim === 'cast' ? p.glow : 0;

  return (
    <Frame p={p} team={team} headY={-80}>
      {castRing > 0 ? (
        <g>
          <Glow x={0} y={-35} r={22 + castRing * 18} c={FROST} o={0.5 + p.cflash * 0.6} />
          <RuneRing x={0} y={-1} r={12 + castRing * 14} rot={tt * -90} c={FROST} o={castRing} ry={0.3} ticks={6} />
        </g>
      ) : null}
      <g transform={`translate(0,${r2(p.bob)}) rotate(${r2(p.lean)},0,-24)`}>
        {/* cape */}
        <path d={capeD} {...olp(CLOAK_D, 1.7)} />
        <path d={`M-3,-44 Q-8,-30 ${r2(-14 - flutter * 0.7)},-12`} fill="none" stroke={CLOAK} strokeWidth={1.3} />
        {/* back hair spill */}
        <path d="M-4,-50 Q-11,-44 -10,-34 Q-7,-38 -5,-40 Q-6,-36 -4,-33 Q-2,-40 -1,-47 Z" {...olp(HAIR, 1.4)} />
        {/* back arm */}
        <Limb p={[sh, el, hand]} w={3.2} c={SKIN_D} />
        {atk || anim === 'cast' ? null : <circle cx={r2(hand[0])} cy={r2(hand[1])} r={2} {...olp(SKIN_D, 1.1)} />}
      </g>
      {bl}
      {fl}
      <g transform={`translate(0,${r2(p.bob)}) rotate(${r2(p.lean)},0,-24)`}>
        {/* torso */}
        <path d="M-6,-45 Q1,-47 8,-45 L6,-32 Q7,-27 7,-23 L-6,-23 Q-5,-28 -5,-32 Z" {...olp(CLOAK)} />
        <path d="M-6,-45 L-5,-32 Q-5,-28 -6,-23 L-2,-23 L-1,-45 Z" fill={CLOAK_D} />
        <path d="M2,-45 L4,-34" stroke={CLOAK_L} strokeWidth={1} />
        <path d="M-6.5,-27 L7.5,-27 L7.5,-24.5 L-6.5,-24.5 Z" {...olp('#6b4a2e', 1.1)} />
        <path d="M-7,-24 L8,-24 L10,-17 Q1,-15 -8,-17 Z" {...olp(CLOAK, 1.4)} />
        <path d="M-7,-24 L-2,-24 L-3,-16 Q-6,-16 -8,-17 Z" fill={CLOAK_D} />
        {/* quiver strap */}
        <path d="M-5,-45 L7,-28" stroke={OL} strokeWidth={2.6} />
        <path d="M-5,-45 L7,-28" stroke="#8a6440" strokeWidth={1.2} />
        {/* hood back */}
        <path d="M-12,-63 Q-6,-68 2,-67 Q11,-66 13,-57 Q12,-51 8,-47 L-4,-46 Q-9,-52 -12,-63 Z" {...olp(CLOAK)} />
        <path d="M-12,-63 Q-9,-52 -4,-46 L0,-46 Q-6,-54 -7,-63 Z" fill={CLOAK_D} />
        {/* face */}
        <circle cx={5.5} cy={-54} r={7.2} {...olp(SKIN)} />
        <path d="M0,-50 Q2,-47 6,-47 Q1,-49 0,-54 Z" fill={SKIN_D} />
        <path d="M7.5,-55.2 L11.5,-55.8 L11,-54.2 Q9,-53.6 7.5,-55.2 Z" fill="#eaf6ff" stroke={OL} strokeWidth={0.7} />
        <circle cx={10} cy={-54.9} r={0.7} fill="#3b6fb0" />
        <path d="M10,-49.6 Q11.4,-49.3 12,-50" fill="none" stroke="#2d4b80" strokeWidth={1} strokeLinecap="round" />
        {/* hair framing face */}
        <path d="M-1,-61 Q6,-63 11,-60 Q8,-60 6,-58 Q4,-56 3,-50 Q2,-46 3,-41 Q-1,-45 -1,-52 Z" {...olp(HAIR, 1.3)} />
        <path d="M2,-58 Q1,-52 2,-44" fill="none" stroke={HAIR_D} strokeWidth={0.9} />
        {/* hood rim */}
        <path d="M-2,-63 Q8,-67 13.5,-57" fill="none" stroke={OL} strokeWidth={4.2} strokeLinecap="round" />
        <path d="M-2,-63 Q8,-67 13.5,-57" fill="none" stroke={CLOAK_L} strokeWidth={2.2} strokeLinecap="round" />
        {/* bow + front arm */}
        <Bow gx={fgx} gy={fgy} h={36} drawX={drawX} wood={BOW} woodDark={BOW_D} str="#e8fbff" rot={bowRot} arrow={nocked ? { color: '#dfe8ef', tip: FROST } : null} />
        <Glow x={fgx} y={fgy} r={6 + (atk ? p.charge * 6 : 0) + castRing * 6} c={FROST} o={anim === 'dead' ? 0 : 0.55} />
        <Limb p={[fsh, fel, [fgx, fgy]]} w={3.4} c={SKIN} />
        <circle cx={r2(fgx)} cy={r2(fgy)} r={2.2} {...olp(SKIN, 1.1)} />
        {atk || anim === 'cast' ? <circle cx={r2(hand[0])} cy={r2(hand[1])} r={2} {...olp(SKIN_D, 1.1)} /> : null}
        {/* idle frost glints on bow */}
        {anim !== 'dead'
          ? [0, 1].map((i) => {
              const q = loop(tt * 0.8 + i * 0.5, 1);
              return <Sparkle key={i} x={fgx + 3 - i * 2} y={fgy - 14 + i * 26 - q * 4} s={2 * Math.sin(q * Math.PI)} c="#ffffff" o={0.9} />;
            })
          : null}
        {atk && p.k > 0.47 && p.flash > 0.05 ? (
          <g>
            <line x1={gx} y1={gy} x2={gx + 32} y2={gy} stroke={FROST} strokeWidth={1.6} strokeLinecap="round" opacity={r2(p.flash)} />
            {[0, 1, 2, 3, 4].map((i) => (
              <Sparkle key={i} x={gx + 4 + i * 6} y={gy + (i % 2 ? -4 : 4) * p.flash} s={2.6 * p.flash} c={i % 2 ? '#fff' : FROST} />
            ))}
            <Glow x={gx + 4} y={gy} r={9 * p.flash} c={FROST} />
          </g>
        ) : null}
        {castRing > 0
          ? [0, 1, 2, 3, 4, 5].map((i) => {
              const q = loop(tt * 1.4 + i / 6, 1);
              const x = Math.cos(i * 2.3) * 16;
              return <Sparkle key={i} x={x} y={-4 - q * 50} s={2.4 * Math.sin(q * Math.PI) * castRing} c={i % 2 ? '#fff' : FROST} />;
            })
          : null}
      </g>
      {anim === 'cast' && p.cflash > 0.05 ? <circle cx={0} cy={-38} r={r2(24 + p.cflash * 18)} fill="none" stroke="#e8fbff" strokeWidth={r2(3 * p.cflash)} opacity={r2(p.cflash)} /> : null}
    </Frame>
  );
};
