import type { HeroArt } from '../types.ts';
import { bump, lerp, loop } from '../types.ts';
import { Frame, Glow, Limb, OL, RuneRing, arm, olp, pose, r2 } from './parts2.tsx';

interface Pal {
  robe: string;
  robeD: string;
  robeL: string;
  skin: string;
  blade: string;
  eye: string;
  fade: string;
}
const MAIN: Pal = { robe: '#3a2a6a', robeD: '#24184a', robeL: '#5b47a0', skin: '#b9a8f0', blade: '#d9c8ff', eye: '#efe6ff', fade: 'url(#spectre-fade)' };
const SHADOW: Pal = { robe: '#2a1450', robeD: '#1a0a36', robeL: '#4a2a80', skin: '#6a4aa8', blade: '#9b6aff', eye: '#ff7bff', fade: 'url(#spectre-shade-fade)' };
const GLOW = '#b98cff';

export const Spectre: HeroArt = ({ anim, t, dur, team }) => {
  const p = pose(anim, t, dur, 2, 0.75);
  const tt = p.t;
  const atk = anim === 'attack';
  const cast = anim === 'cast';
  let float = -3 + Math.sin(tt * Math.PI) * 1.8;
  let lean = p.lean;
  if (p.walking) {
    float = -4 + Math.sin(p.wph) * 1.2;
    lean = 10;
  }
  float = lerp(float, 0, p.fall);
  const trail = (p.walking ? 8 : 0) + Math.sin(tt * 2.4) * 2;

  let a1 = 30 + p.breathe * 4;
  let a2 = 70;
  let bang = 25 + p.breathe * 3;
  let ba1 = -15;
  let ba2 = 5;
  if (p.walking) {
    a1 = 40;
    a2 = 80;
    bang = 60;
    ba1 = -35;
    ba2 = -20;
  } else if (atk) {
    a1 = 30 + 120 * p.charge + 60 * p.strike;
    a2 = 70 + 110 * p.charge + 20 * p.strike;
    bang = 25 - 70 * p.charge + 110 * p.strike;
    ba1 = -15 - 20 * p.strike;
    ba2 = 5;
  } else if (cast) {
    a1 = lerp(30, 120, p.raise);
    a2 = lerp(70, 140, p.raise);
    bang = lerp(25, 50, p.raise);
    ba1 = lerp(-15, -120, p.raise);
    ba2 = lerp(5, -140, p.raise);
  } else if (p.hurt) {
    a1 = -10;
    a2 = 20;
    bang = -40;
    ba1 = -40;
    ba2 = -20;
  }
  const fa = arm(7, -50, a1, a2, 11, 10);
  const ba = arm(-5, -50, ba1, ba2, 11, 10);

  const blade = (ang: number, c: string, o: number, key?: number) => (
    <g key={key} transform={`translate(${r2(fa.hx)},${r2(fa.hy)}) rotate(${r2(ang)})`} opacity={r2(o)}>
      <path d="M-1,1 Q9,-12 3,-30 Q14,-14 4,2 Z" fill={c} stroke={OL} strokeWidth={1.3} strokeLinejoin="round" />
      <path d="M1,-2 Q8,-12 4,-24" fill="none" stroke="#ffffff" strokeWidth={0.8} opacity={0.8} />
      <Limb p={[[1, 1], [0, 6]]} w={2} c="#2a1d47" ow={2.2} />
    </g>
  );

  const hem = (k: number) => Math.sin(tt * 4 + k) * 1.5;
  const robeD = `M-8,-52 Q1,-56 10,-52 Q13,-30 14,-8 L${r2(10 + hem(0))},-3 L6,-7 L${r2(2 + hem(1))},-1 L-3,-6 L${r2(-9 + hem(2) - trail * 0.4)},-1 L${r2(-16 - trail)},${r2(-5 + hem(3))} Q-12,-30 -8,-52 Z`;

  const body = (pal: Pal, ghost: boolean) => (
    <g>
      {/* trailing wisps */}
      {[0, 1, 2].map((i) => {
        const q = loop(tt * 0.8 + i / 3, 1);
        const x = -12 - trail - q * 14;
        const y = -10 - i * 7 - q * 4;
        return <path key={i} d={`M${r2(x)},${r2(y)} q-4,-2 -8,0 t-7,0`} fill="none" stroke={pal.robeL} strokeWidth={1.6} strokeLinecap="round" opacity={r2(bump(q) * 0.8)} />;
      })}
      <Limb p={[[ba.sx, ba.sy], [ba.ex, ba.ey], [ba.hx, ba.hy]]} w={3} c={pal.robeD} />
      <circle cx={r2(ba.hx)} cy={r2(ba.hy)} r={1.9} {...olp(pal.skin, 1)} />
      {/* robe with fading hem */}
      <path d={robeD} fill={pal.fade} stroke={OL} strokeWidth={1.6} strokeLinejoin="round" />
      <path d={`M-8,-52 Q-12,-30 ${r2(-16 - trail)},${r2(-5 + hem(3))} L-9,-4 Q-6,-28 -3,-54 Z`} fill={pal.robeD} opacity={0.6} />
      <path d="M3,-52 Q7,-34 8,-10" fill="none" stroke={pal.robeL} strokeWidth={1.2} opacity={0.8} />
      <path d="M-8,-40 Q2,-37 12,-40" fill="none" stroke={pal.robeL} strokeWidth={1.4} />
      {/* hood with spiked crest */}
      <path d="M-5,-53 Q-11,-66 -12,-82 Q-4,-77 2,-77 Q10,-75 13,-66 Q14,-59 11,-54 Z" {...olp(pal.robe, 1.7)} />
      <path d="M-5,-53 Q-11,-66 -12,-82 Q-6,-72 -1,-54 Z" fill={pal.robeD} />
      <ellipse cx={8} cy={-63} rx={4.4} ry={6.2} fill="#0d0820" stroke={OL} strokeWidth={1} />
      <path d="M6.5,-65 L9.5,-64.4 M10.6,-64.6 L12.6,-65.4" stroke={pal.eye} strokeWidth={1.4} strokeLinecap="round" />
      {ghost ? null : <Glow x={9.5} y={-64.8} r={4 + (cast ? p.glow * 4 : 0)} c={GLOW} o={anim === 'dead' ? 0.2 : 0.9} />}
      <path d="M-2,-76 Q4,-74 10,-70" fill="none" stroke={pal.robeL} strokeWidth={1.1} />
      {/* blade + ghost trail */}
      {atk && p.strike > 0.05 ? [1, 2, 3].map((i) => blade(bang - i * 22, GLOW, (0.45 / i) * p.strike, i)) : null}
      {blade(bang, pal.blade, 1)}
      <Limb p={[[fa.sx, fa.sy], [fa.ex, fa.ey], [fa.hx, fa.hy]]} w={3.1} c={pal.robe} />
      <circle cx={r2(fa.hx)} cy={r2(fa.hy)} r={2} {...olp(pal.skin, 1)} />
    </g>
  );

  const shadowO = cast ? p.glow * 0.55 : 0;

  return (
    <Frame p={p} team={team} headY={-88}>
      <defs>
        <linearGradient id="spectre-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={MAIN.robe} stopOpacity={0.95} />
          <stop offset="1" stopColor={MAIN.robe} stopOpacity={0.3} />
        </linearGradient>
        <linearGradient id="spectre-shade-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SHADOW.robe} stopOpacity={0.95} />
          <stop offset="1" stopColor={SHADOW.robe} stopOpacity={0.2} />
        </linearGradient>
      </defs>
      {cast ? (
        <g>
          <Glow x={0} y={-44} r={24 + p.glow * 20} c={GLOW} o={0.45 + p.cflash * 0.5} />
          <RuneRing x={0} y={-1} r={12 + p.glow * 14} rot={-tt * 70} c="#d9c8ff" o={p.glow} ry={0.3} ticks={5} />
        </g>
      ) : null}
      {shadowO > 0.01 ? (
        <g opacity={r2(shadowO)} transform={`translate(${r2(-14 - p.glow * 6)},${r2(float - 2)})`}>
          {body(SHADOW, true)}
        </g>
      ) : null}
      <g transform={`translate(0,${r2(float + p.bob)}) rotate(${r2(lean)},0,-30)`}>{body(MAIN, false)}</g>
      {cast && p.cflash > 0.05 ? <circle cx={0} cy={-46} r={r2(24 + p.cflash * 20)} fill="none" stroke="#e8dcff" strokeWidth={r2(3 * p.cflash)} opacity={r2(p.cflash)} /> : null}
    </Frame>
  );
};
