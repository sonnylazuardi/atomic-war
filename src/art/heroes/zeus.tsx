import type { HeroArt } from '../types.ts';
import { lerp } from '../types.ts';
import { Blob, Frame, Glow, Lightning, Limb, OL, RuneRing, arm, hash, legs, olp, pose, r2 } from './parts2.tsx';

const SKIN = '#ecc49c';
const SKIN_D = '#c9976d';
const TOGA = '#f6f2e6';
const TOGA_D = '#cfc6b0';
const GOLD = '#f2c14e';
const GOLD_D = '#b8862b';
const HAIR = '#ffffff';
const HAIR_D = '#d2dce8';
const BOLT = '#6fd3ff';

export const Zeus: HeroArt = ({ anim, t, dur, team }) => {
  const p = pose(anim, t, dur, 1.8, 0.62);
  const sw = Math.sin(p.wph);
  const seed = Math.floor(p.t * 14);

  // ---- arms
  let fa1 = 18 + p.breathe * 3;
  let fa2 = 58;
  let ba1 = -12 - p.breathe * 2;
  let ba2 = 8;
  if (p.walking) {
    fa1 = 10 - sw * 28;
    fa2 = fa1 + 35;
    ba1 = -4 + sw * 26;
    ba2 = ba1 + 25;
  } else if (anim === 'attack') {
    fa1 = 18 + 142 * p.charge + 77 * p.strike;
    fa2 = 58 + 142 * p.charge + 34 * p.strike;
    ba1 = -12 - 25 * p.charge - 20 * p.strike;
    ba2 = ba1 + 25;
  } else if (anim === 'cast') {
    fa1 = lerp(18, 158, p.raise);
    fa2 = lerp(58, 182, p.raise);
    ba1 = lerp(-12, 196, p.raise);
    ba2 = lerp(8, 172, p.raise);
  } else if (p.hurt) {
    fa1 = -25;
    fa2 = 5;
    ba1 = -40;
    ba2 = -20;
  }
  const fa = arm(5, -42, fa1, fa2, 10, 10);
  const ba = arm(-5, -43, ba1, ba2, 10, 10);
  const [bl, fl] = legs(p, { hipY: -20, spread: 6, w: 4.6, c: SKIN, cBack: SKIN_D, boot: '#7a4b2a', bootW: 5, stride: 7 });

  const hairSway = Math.sin(p.t * 2.4) * 0.8 + (p.walking ? -1 : 0);
  const beardSway = Math.sin(p.t * 2.2 + 1) * 0.9 + (p.walking ? -1.5 : 0) - p.strike * 1.5;

  // crackle around hands
  const crackle = (hx: number, hy: number, n: number, len: number, s: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = hash(s + i * 5.7) * Math.PI * 2;
      const l = len * (0.6 + hash(s + i * 2.1) * 0.6);
      return hash(s * 3 + i) > 0.25 ? (
        <Lightning key={i} x1={hx} y1={hy} x2={hx + Math.cos(a) * l} y2={hy + Math.sin(a) * l} seed={s + i} jit={l * 0.25} segs={3} w={0.8} glow={BOLT} />
      ) : null;
    });

  const handGlow = 3 + (anim === 'attack' ? p.charge * 6 + p.flash * 6 : 0) + (anim === 'cast' ? p.glow * 6 : 0);
  const boltLen = 62;

  return (
    <Frame p={p} team={team} headY={-80}>
      {/* cast aura behind body */}
      {anim === 'cast' ? (
        <g>
          <Glow x={0} y={-48} r={20 + p.glow * 22} c={BOLT} o={0.5 + p.cflash * 0.5} />
          <RuneRing x={0} y={-2} r={14 + p.glow * 12} rot={p.t * 120} c="#bfefff" o={p.glow} ry={0.3} ticks={6} />
        </g>
      ) : null}
      {bl}
      {fl}
      <g transform={`translate(0,${r2(p.bob)}) rotate(${r2(p.lean)},0,-20)`}>
        {/* back arm */}
        <Limb p={[[ba.sx, ba.sy], [ba.ex, ba.ey], [ba.hx, ba.hy]]} w={4.8} c={SKIN_D} />
        <circle cx={r2(ba.hx)} cy={r2(ba.hy)} r={2.8} {...olp(SKIN_D, 1.4)} />
        {/* hair (behind head) */}
        <Blob
          c={[
            [-6 + hairSway, -60, 8],
            [-3 + hairSway * 0.6, -67, 8],
            [5, -69.5, 7],
            [11, -66, 5],
            [-10 + hairSway, -53, 6],
            [-9 + hairSway * 1.2, -46, 4.5],
          ]}
          fill={HAIR}
          shade={HAIR_D}
        />
        {/* toga */}
        <path d="M-9,-45 Q1,-49.5 11,-45 L13,-30 Q15,-20 16,-11 Q2,-8 -13,-11 Q-13,-22 -11,-30 Z" {...olp(TOGA)} />
        <path d="M-9,-45 L-10,-30 Q-12,-22 -12,-11 Q-8,-10 -4,-10 Q-5,-25 -2,-44 Z" fill={TOGA_D} />
        <path d="M2,-28 Q6,-20 6,-10" fill="none" stroke={TOGA_D} strokeWidth={1.2} />
        <path d="M10,-45 Q4,-36 -9,-28" fill="none" stroke={GOLD_D} strokeWidth={3.2} strokeLinecap="round" />
        <path d="M10,-45 Q4,-36 -9,-28" fill="none" stroke={GOLD} strokeWidth={1.8} strokeLinecap="round" />
        <path d="M-11,-28 L13,-28 L13.4,-25 L-11.4,-25 Z" {...olp(GOLD, 1.2)} />
        <circle cx={1} cy={-26.5} r={2.2} {...olp('#7fe0ff', 1)} />
        <path d="M-12,-11 Q2,-8 15,-11" fill="none" stroke={GOLD} strokeWidth={1.6} />
        {/* head */}
        <circle cx={4} cy={-57} r={10} {...olp(SKIN)} />
        <path d="M-5,-54 Q-4,-50 0,-48 L-2,-56 Z" fill={SKIN_D} opacity={0.7} />
        {/* beard */}
        <Blob
          c={[
            [0, -50, 5.5],
            [6, -49, 6.5],
            [12, -51.5, 4.2],
            [3 + beardSway * 0.4, -43, 6],
            [9 + beardSway * 0.4, -43.5, 4.8],
            [5 + beardSway * 0.7, -37, 4.4],
            [3 + beardSway, -32.5, 3],
          ]}
          fill={HAIR}
          shade={HAIR_D}
        />
        {/* mustache, nose, brow, eye */}
        <path d="M6,-52.5 Q10,-55.5 15,-51.5 Q11.5,-50.5 9.5,-51.2 Q7.5,-50 6,-52.5 Z" {...olp(HAIR, 1)} />
        <circle cx={13.3} cy={-55.5} r={1.8} {...olp(SKIN, 1)} />
        <ellipse cx={10} cy={-58.6} rx={1.8} ry={1.1} fill="#bff4ff" />
        <ellipse cx={10} cy={-58.6} rx={3} ry={2} fill={BOLT} opacity={0.35 + (anim === 'cast' ? p.glow * 0.5 : 0)} />
        <Limb p={[[5.5, -61], [9.5, -62.8], [14, -60.5]]} w={2.2} c={HAIR} ow={2} />
        {/* golden laurel circlet */}
        <Limb p={[[-5, -64.5], [3, -67.5], [11.5, -65]]} w={1.6} c={GOLD} ow={2} />
        <ellipse cx={-6} cy={-63} rx={2.6} ry={1.3} transform="rotate(-35,-6,-63)" {...olp(GOLD, 1)} />
        <ellipse cx={-6.5} cy={-66} rx={2.6} ry={1.3} transform="rotate(25,-6.5,-66)" {...olp(GOLD, 1)} />
        {/* front arm with gold bracer */}
        <Limb p={[[fa.sx, fa.sy], [fa.ex, fa.ey], [fa.hx, fa.hy]]} w={4.8} c={SKIN} />
        <Limb p={[[lerp(fa.ex, fa.hx, 0.45), lerp(fa.ey, fa.hy, 0.45)], [lerp(fa.ex, fa.hx, 0.75), lerp(fa.ey, fa.hy, 0.75)]]} w={5} c={GOLD} ow={2.4} />
        <circle cx={r2(fa.hx)} cy={r2(fa.hy)} r={3} {...olp(SKIN, 1.4)} />
        {/* lightning in hands */}
        <Glow x={fa.hx} y={fa.hy} r={handGlow} c={BOLT} o={anim === 'dead' ? 0 : 0.9} />
        {anim !== 'dead' && crackle(fa.hx, fa.hy, anim === 'attack' ? 4 : 2, anim === 'attack' ? 6 + p.charge * 6 : 5, seed)}
        {anim === 'cast' || anim === 'idle' ? crackle(ba.hx, ba.hy, 2, 4 + p.glow * 5, seed + 50) : null}
        {/* attack bolt */}
        {anim === 'attack' && p.flash > 0.02 ? (
          <g>
            <Lightning x1={fa.hx} y1={fa.hy} x2={fa.hx + boltLen} y2={fa.hy + 6} seed={seed} jit={6} segs={8} w={1.8} o={p.flash} />
            <Lightning x1={fa.hx + 25} y1={fa.hy + 2} x2={fa.hx + 42} y2={fa.hy + 16} seed={seed + 9} jit={3} segs={4} w={1} o={p.flash} />
            <Glow x={fa.hx + boltLen} y={fa.hy + 6} r={9 * p.flash} c={BOLT} />
          </g>
        ) : null}
        {/* cast arcs between hands and sky */}
        {anim === 'cast' && p.raise > 0.3 ? (
          <g>
            <Lightning x1={fa.hx} y1={fa.hy} x2={ba.hx} y2={ba.hy} seed={seed + 3} jit={5} segs={6} w={1.3} o={p.raise} />
            <Lightning x1={fa.hx} y1={fa.hy} x2={fa.hx + 6} y2={fa.hy - 26} seed={seed + 4} jit={5} segs={5} w={1.4} o={p.glow} />
            <Lightning x1={ba.hx} y1={ba.hy} x2={ba.hx - 8} y2={ba.hy - 24} seed={seed + 5} jit={5} segs={5} w={1.4} o={p.glow} />
            <Glow x={(fa.hx + ba.hx) / 2} y={Math.min(fa.hy, ba.hy) - 4} r={6 + p.glow * 8 + p.cflash * 10} c="#cdf5ff" o={1} />
          </g>
        ) : null}
      </g>
      {anim === 'cast' && p.cflash > 0.05 ? <circle cx={0} cy={-45} r={r2(30 + p.cflash * 20)} fill="#e8fbff" opacity={r2(p.cflash * 0.35)} /> : null}
    </Frame>
  );
};
