import type { HeroArt } from '../types.ts';
import { bump, lerp, loop } from '../types.ts';
import { Frame, Glow, Limb, arm, dirPt, olp, pose, pts, r2 } from './parts2.tsx';

const BODY = '#241b42';
const BODY_D = '#120d24';
const BODY_L = '#3f3170';
const VIOLET = '#b77cff';
const CORE = '#ecd6ff';

// starfield specks inside the body (local torso coords)
const STARS: [number, number][] = [
  [-6, -42], [4, -45], [8, -36], [-3, -34], [-8, -37], [6, -42], [0, -28], [-4, -22], [2, -18], [-2, -13], [5, -31], [-7, -27],
];

function hornPath(bx: number, by: number, w: number, tx: number, ty: number, bend: number) {
  return `M${r2(bx - w)},${r2(by)} Q${r2((bx + tx) / 2 - w + bend)},${r2((by + ty) / 2)} ${r2(tx)},${r2(ty)} Q${r2((bx + tx) / 2 + w * 0.6 + bend)},${r2((by + ty) / 2 + 1)} ${r2(bx + w)},${r2(by)} Z`;
}

function claw(hx: number, hy: number, ang: number) {
  return [-28, 0, 28].map((o, i) => {
    const [x1, y1] = dirPt(hx, hy, ang + o, 2);
    const [x2, y2] = dirPt(hx, hy, ang + o * 0.8, 6.5);
    const [x3, y3] = dirPt(hx, hy, ang + o + 18, 2.5);
    return <path key={i} d={`M${pts([[x1, y1], [x2, y2], [x3, y3]])}Z`} {...olp('#d9c8ff', 1)} />;
  });
}

export const Enigma: HeroArt = ({ anim, t, dur, team }) => {
  const p = pose(anim, t, dur, 2, 0.7);
  const tt = p.t;
  let float = -7 + Math.sin((tt / 2) * Math.PI * 2) * 2.5;
  let lean = p.lean;
  if (p.walking) {
    float = -9 + Math.sin(p.wph) * 1.5;
    lean = 12;
  }
  float = lerp(float, 0, p.fall);
  const trail = p.walking ? 1 : 0;

  // tail as tapered wavy polygon
  const N = 12;
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  const ph = tt * 5;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const cx = Math.sin(s * Math.PI * 1.6 - ph) * 2.8 * s - s * 7 - trail * s * s * 10;
    const cy = -30 + s * 25 - trail * s * s * 3;
    const w = 10 * (1 - s) ** 0.85 + 0.4;
    const nx = 1;
    left.push([cx - w * nx, cy]);
    right.push([cx + w * nx * 0.9, cy]);
  }
  const tailD = `M${pts(left)} L${pts(right.reverse())}Z`;

  // arms
  let fa1 = 32 + p.breathe * 6;
  let fa2 = 62 + p.breathe * 4;
  let ba1 = -18 - p.breathe * 4;
  let ba2 = 4;
  if (p.walking) {
    fa1 = 48 + Math.sin(p.wph) * 6;
    fa2 = 78;
    ba1 = -40;
    ba2 = -25;
  } else if (anim === 'attack') {
    fa1 = 32 - 62 * p.charge + 63 * p.strike;
    fa2 = 62 - 50 * p.charge + 33 * p.strike;
    ba1 = -18 + 10 * p.charge;
    ba2 = 4;
  } else if (anim === 'cast') {
    fa1 = lerp(32, 125, p.raise);
    fa2 = lerp(62, 140, p.raise);
    ba1 = lerp(-18, -125, p.raise);
    ba2 = lerp(4, -140, p.raise);
  } else if (p.hurt) {
    fa1 = -10;
    fa2 = 30;
    ba1 = -50;
    ba2 = -30;
  }
  const fa = arm(8, -44, fa1, fa2, 12, 12);
  const ba = arm(-8, -45, ba1, ba2, 12, 12);

  const corePulse = 0.75 + Math.sin(tt * 4) * 0.25;
  const coreR = 3.6 + (anim === 'cast' ? p.glow * 3 : 0) + (anim === 'attack' ? p.charge * 1.5 : 0);
  const eyeO = anim === 'dead' ? 0.2 : 1;

  // wisps drifting off the tail
  const wisps = [0, 1, 2].map((i) => {
    const q = loop(tt * 0.9 + i * 0.33, 1);
    const x = -8 - q * 14 - trail * 6;
    const y = -18 + i * 4 - q * 8;
    return <path key={i} d={`M${r2(x)},${r2(y)} q-3,-2 -6,0 t-6,0`} fill="none" stroke={VIOLET} strokeWidth={1.3} strokeLinecap="round" opacity={r2(bump(q) * 0.7)} />;
  });

  // attack void pulse
  const pulse =
    anim === 'attack' && p.k > 0.45 && p.k < 0.95
      ? (() => {
          const q = (p.k - 0.45) / 0.5;
          const x = fa.hx + 4 + q * 34;
          const y = fa.hy;
          return (
            <g>
              {[0, 0.22, 0.44].map((d, i) => {
                const qq = Math.max(0, q - d);
                return qq > 0 ? <ellipse key={i} cx={r2(fa.hx + 4 + qq * 30)} cy={r2(y)} rx={r2(3 + qq * 6)} ry={r2(5 + qq * 12)} fill="none" stroke={VIOLET} strokeWidth={1.6} opacity={r2(1 - qq)} /> : null;
              })}
              <Glow x={x} y={y} r={10 * (1 - q * 0.5)} c={VIOLET} o={1 - q} />
              <circle cx={r2(x)} cy={r2(y)} r={r2(4.5 * (1 - q * 0.6))} fill="#07040f" stroke={CORE} strokeWidth={1.2} opacity={r2(1 - q * 0.8)} />
            </g>
          );
        })()
      : null;

  // cast singularity at chest
  const sing =
    anim === 'cast'
      ? (() => {
          const R = 6 + p.glow * 16;
          const arms = [0, 1, 2, 3].map((i) => {
            const a0 = tt * 420 + i * 90;
            const ptsArr: [number, number][] = [];
            for (let j = 0; j <= 8; j++) {
              const f = j / 8;
              ptsArr.push(dirPt(2, -38, a0 + f * 200, R * (1 - f * 0.85)));
            }
            return <polyline key={i} points={pts(ptsArr)} fill="none" stroke={i % 2 ? VIOLET : CORE} strokeWidth={1.6 - (i % 2) * 0.4} strokeLinecap="round" opacity={r2(0.4 + p.glow * 0.6)} />;
          });
          return (
            <g>
              <Glow x={2} y={-38} r={R * 1.6 + p.cflash * 14} c={VIOLET} o={0.8 + p.cflash * 0.4} />
              {arms}
              <circle cx={2} cy={-38} r={r2(2.5 + p.glow * 3.5)} fill="#05030b" stroke={CORE} strokeWidth={1.2} />
            </g>
          );
        })()
      : null;

  return (
    <Frame p={p} team={team} headY={-84} rx={15}>
      <g transform={`translate(0,${r2(float + p.bob)}) rotate(${r2(lean)},0,-30)`}>
        {wisps}
        {/* back arm */}
        <Limb p={[[ba.sx, ba.sy], [ba.ex, ba.ey], [ba.hx, ba.hy]]} w={4} c={BODY_D} />
        {claw(ba.hx, ba.hy, ba2)}
        {/* tail */}
        <path d={tailD} {...olp(BODY, 1.8)} />
        <path d={tailD} fill={BODY_D} opacity={0.5} transform="translate(-2.5,0) scale(0.75,1) translate(-1,0)" />
        {/* torso */}
        <path d="M-11,-47 Q0,-53 13,-47 Q16,-38 9,-29 L-9,-29 Q-15,-38 -11,-47 Z" {...olp(BODY, 1.8)} />
        <path d="M-11,-47 Q-15,-38 -9,-29 L-4,-29 Q-9,-38 -6,-48 Z" fill={BODY_D} opacity={0.8} />
        <path d="M-3,-49 Q6,-51 12,-46" fill="none" stroke={BODY_L} strokeWidth={1.4} strokeLinecap="round" />
        {/* stars */}
        {STARS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 0.8 : 0.5} fill={i % 2 ? '#fff' : CORE} opacity={r2(0.3 + 0.7 * Math.abs(Math.sin(tt * 2.5 + i * 1.7)))} />
        ))}
        {/* shoulder plates */}
        <path d="M-15,-44 Q-14,-52 -6,-51 Q-8,-46 -12,-42 Z" {...olp(BODY_L, 1.5)} />
        <path d="M17,-43 Q17,-52 8,-51.5 Q10,-46 14,-41 Z" {...olp(BODY_L, 1.5)} />
        {/* core */}
        <Glow x={2} y={-38} r={coreR * 3.2} c={VIOLET} o={corePulse * eyeO} />
        <circle cx={2} cy={-38} r={r2(coreR)} fill={CORE} stroke={VIOLET} strokeWidth={1.2} opacity={eyeO} />
        {sing}
        {/* head + crown horns */}
        <path d={hornPath(-4, -59, 2.2, -12, -72, -2)} {...olp(BODY_L, 1.4)} />
        <path d={hornPath(0, -61, 2.4, -2, -80, -3)} {...olp(BODY_L, 1.4)} />
        <path d={hornPath(5, -61, 2.2, 9, -77, -2)} {...olp(BODY_L, 1.4)} />
        <path d={hornPath(8, -58, 1.8, 15, -68, 0)} {...olp(BODY_L, 1.4)} />
        <path d="M-3,-52 Q-5,-60 2,-63 Q10,-63 11,-56 Q12,-50 6,-48 Q0,-47 -3,-52 Z" {...olp(BODY, 1.8)} />
        <path d="M-3,-52 Q-5,-60 2,-63 Q-1,-57 1,-49 Q-1,-49 -3,-52 Z" fill={BODY_D} />
        <path d="M5,-57 L11,-58.5 L10,-56 Z" fill={CORE} opacity={eyeO} />
        <Glow x={8} y={-57} r={5 + (anim === 'cast' ? p.glow * 4 : 0)} c={VIOLET} o={eyeO} />
        {/* front arm */}
        <Limb p={[[fa.sx, fa.sy], [fa.ex, fa.ey], [fa.hx, fa.hy]]} w={4.2} c={BODY} />
        {claw(fa.hx, fa.hy, fa2)}
        <Glow x={fa.hx} y={fa.hy} r={3 + (anim === 'attack' ? p.charge * 7 : 0)} c={VIOLET} o={anim === 'dead' ? 0 : 0.8} />
        {pulse}
        {anim === 'cast' && p.cflash > 0.05 ? <circle cx={2} cy={-38} r={r2(10 + p.cflash * 26)} fill="none" stroke={CORE} strokeWidth={r2(3 * p.cflash)} opacity={r2(p.cflash)} /> : null}
      </g>
    </Frame>
  );
};
