import type { HeroArt } from '../types.ts';
import { bump, lerp, loop } from '../types.ts';
import { Frame, Glow, Limb, OL, arm, legs, olp, pose, pts, r2 } from './parts2.tsx';

const SKIN = '#d9b49a';
const PAINT = '#f2ece0';
const HAT = '#1e1a2a';
const HAT_L = '#3a3450';
const PONCHO = '#8a2a3a';
const PONCHO_D = '#5e1a28';
const GOLD = '#f2c14e';
const HAIR = '#1a1420';
const GHOST = '#3ae0b8';
const GHOST_L = '#b8fff0';
const SILVER = '#c9cfd6';

function flashPath(x: number, y: number, r: number) {
  const p: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const rr = i % 2 === 0 ? r * (i === 0 ? 1.8 : 1) : r * 0.4;
    p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8]);
  }
  return `M${pts(p)}Z`;
}
function gun(x: number, y: number, ang: number, flash: number, glow: number) {
  return (
    <g transform={`translate(${r2(x)},${r2(y)}) rotate(${r2(ang)}) scale(1.35)`}>
      {glow > 0.02 ? <Glow x={5} y={-1} r={6 + glow * 5} c={GHOST} o={glow} /> : null}
      <path d="M-1,-0.5 L1.5,-0.5 L-0.5,5.5 Q-3,6 -3.5,4.5 Z" {...olp('#5a3a22', 1)} />
      <rect x={-1.5} y={-3.4} width={13} height={2.6} rx={0.6} {...olp(SILVER, 1)} />
      <line x1={0} y1={-2.8} x2={11} y2={-2.8} stroke="#ffffff" strokeWidth={0.5} opacity={0.8} />
      <rect x={0.5} y={-4} width={4.5} height={4.2} rx={1.2} {...olp('#9aa3ad', 1)} />
      <circle cx={2.75} cy={-1.9} r={0.6} fill={GHOST} />
      <path d="M1.5,0.5 Q2.5,2.5 4,0.5" fill="none" stroke={OL} strokeWidth={0.7} />
      {flash > 0.03 ? (
        <g>
          <Glow x={14} y={-2.1} r={9 * flash} c={GHOST} />
          <path d={flashPath(14.5, -2.1, 4 * flash)} fill="#ffe08a" stroke={GHOST} strokeWidth={0.8} />
          <path d={flashPath(14, -2.1, 2 * flash)} fill="#fffbe6" />
        </g>
      ) : null}
    </g>
  );
}

export const Muerta: HeroArt = ({ anim, t, dur, team }) => {
  const p = pose(anim, t, dur, 1.7, 0.6);
  const tt = p.t;
  const atk = anim === 'attack';
  const cast = anim === 'cast';
  const [bl, fl] = legs(p, { hipY: -24, spread: 5, w: 3.8, c: '#2a2238', cBack: '#1c1626', boot: '#4a3226', bootW: 5, stride: 8, lift: 4.5 });
  const sway = Math.sin(tt * 2.4) * 1.3 + (p.walking ? -2.5 + Math.sin(p.wph * 2) * 1.5 : 0) + (atk ? -1.5 * p.flash : 0);

  let a1 = 20 + p.breathe * 3;
  let a2 = 45;
  let gang = 70;
  let ba1 = 28 - p.breathe * 2;
  let ba2 = 52;
  let bgang = 78;
  if (p.walking) {
    a1 = 18 - Math.sin(p.wph) * 18;
    a2 = a1 + 28;
    gang = 72;
    ba1 = 26 + Math.sin(p.wph) * 16;
    ba2 = ba1 + 26;
    bgang = 80;
  } else if (atk) {
    a1 = 20 + 70 * p.charge + 75 * p.strike + 12 * p.flash;
    a2 = 45 + 45 * p.charge + 45 * p.strike + 12 * p.flash;
    gang = 70 - 70 * p.charge - 70 * p.strike - 28 * p.flash;
  } else if (cast) {
    a1 = lerp(20, 160, p.raise);
    a2 = lerp(45, 172, p.raise);
    gang = lerp(70, -80, p.raise);
    ba1 = lerp(28, 195, p.raise);
    ba2 = lerp(52, 184, p.raise);
    bgang = lerp(78, -100, p.raise);
  } else if (p.hurt) {
    a1 = -20;
    a2 = 0;
    gang = 120;
    ba1 = -35;
    ba2 = -15;
    bgang = 110;
  }
  const fa = arm(5, -43, a1, a2, 9, 8.5);
  const ba = arm(-4, -43, ba1, ba2, 9, 8.5);
  const gl = cast ? p.glow : 0;
  const castShot = cast ? p.cflash : 0;
  const atkFlash = atk && p.k > 0.45 ? p.flash : 0;
  const live = anim === 'dead' ? 1 - p.fall : 1;

  // poncho geometry (wide triangle, sways at the hem)
  const s = sway;
  const L: [number, number] = [-15 + s, -30];
  const R: [number, number] = [19 + s * 0.8, -30];
  const B: [number, number] = [2 + s * 1.2, -20];
  const ponchoD = `M-6,-47.5 Q2,-50.5 10,-47.5 L${r2(R[0])},${r2(R[1])} Q${r2((R[0] + B[0]) / 2 + 1)},${r2((R[1] + B[1]) / 2 + 1)} ${r2(B[0])},${r2(B[1])} Q${r2((L[0] + B[0]) / 2 - 1)},${r2((L[1] + B[1]) / 2 + 1)} ${r2(L[0])},${r2(L[1])} Z`;
  const edge = (a: [number, number], b: [number, number], n: number) =>
    Array.from({ length: n }, (_, i) => {
      const f = (i + 0.5) / n;
      const x = lerp(a[0], b[0], f);
      const y = lerp(a[1], b[1], f) + 0.5;
      const sw = Math.sin(tt * 5 + i * 1.3) * 0.6 - s * 0.15;
      return <line key={`${a[0]}${i}`} x1={r2(x)} y1={r2(y)} x2={r2(x + sw)} y2={r2(y + 2.8)} stroke={GOLD} strokeWidth={1.1} strokeLinecap="round" />;
    });
  const zig: [number, number][] = Array.from({ length: 11 }, (_, i) => {
    const f = i / 10;
    return [lerp(-11.5 + s * 0.6, 15.5 + s * 0.5, f), -37 + (i % 2 ? -1.6 : 0.8)];
  });

  return (
    <Frame p={p} team={team} headY={-86}>
      {/* ghostly aura */}
      <Glow x={0} y={-40} r={18 + gl * 22} c={GHOST} o={anim === 'dead' ? 0 : 0.18 + gl * 0.5 + castShot * 0.3} />
      {anim !== 'dead'
        ? [0, 1, 2, 3].map((i) => {
            const q = loop(tt * (0.6 + gl * 0.8) + i / 4, 1);
            const x = -12 + i * 8 + Math.sin(q * 7 + i) * 2;
            return <path key={i} d={`M${r2(x)},${r2(-4 - q * 30)} q2,-3 0,-6`} fill="none" stroke={GHOST_L} strokeWidth={1.2} strokeLinecap="round" opacity={r2(bump(q) * (0.4 + gl * 0.6))} />;
          })
        : null}
      <g transform={`translate(0,${r2(p.bob)}) rotate(${r2(p.lean)},0,-24)`}>
        {/* long hair behind */}
        <path d={`M-4,-60 Q-11,-54 -11,-44 Q${r2(-13 + s)},-38 ${r2(-14 + s)},-32 Q-8,-35 -6,-38 Q-4,-46 -1,-52 Z`} {...olp(HAIR, 1.4)} />
        {/* back arm (upper part shows when raised) */}
        <Limb p={[[ba.sx, ba.sy], [ba.ex, ba.ey], [ba.hx, ba.hy]]} w={3.4} c={PONCHO_D} />
      </g>
      {bl}
      {fl}
      <g transform={`translate(0,${r2(p.bob)}) rotate(${r2(p.lean)},0,-24)`}>
        {/* torso + belt with holsters */}
        <path d="M-6,-44 L8,-44 L7,-24 L-6,-24 Z" {...olp('#2a2238')} />
        <path d="M-7,-26 L8,-26 L8.4,-22.5 L-7.4,-22.5 Z" {...olp('#4a3226', 1.2)} />
        <circle cx={1} cy={-24.3} r={1.5} {...olp(SILVER, 0.9)} />
        {/* poncho */}
        <path d={ponchoD} {...olp(PONCHO)} />
        <path d={`M-6,-47.5 L${r2(L[0])},${r2(L[1])} Q${r2((L[0] + B[0]) / 2 - 1)},${r2((L[1] + B[1]) / 2 + 1)} ${r2(B[0])},${r2(B[1])} Q${r2(-2 + s * 0.6)},-34 -1,-48.5 Z`} fill={PONCHO_D} />
        <polyline points={pts(zig)} fill="none" stroke={OL} strokeWidth={2.8} strokeLinejoin="round" />
        <polyline points={pts(zig)} fill="none" stroke={GOLD} strokeWidth={1.4} strokeLinejoin="round" />
        <path d={`M-9,-31.5 Q2,-29 ${r2(15 + s * 0.6)},-31.5`} fill="none" stroke={GHOST} strokeWidth={0.9} opacity={0.7} />
        {edge(L, B, 6)}
        {edge(B, R, 6)}
        <path d="M-5,-48 Q2,-45 9,-48 L8,-46 Q2,-43.5 -4,-46 Z" {...olp(PONCHO_D, 1.1)} />
        {/* skull-painted face */}
        <circle cx={5.5} cy={-54.5} r={7.6} {...olp(PAINT)} />
        <path d="M-1,-50 Q1,-47 5,-46.8 Q0,-49 -1,-54 Z" fill="#cfc6b6" />
        <circle cx={6} cy={-55.3} r={2} fill={OL} />
        <circle cx={10.4} cy={-55.3} r={1.8} fill={OL} />
        <circle cx={6.2} cy={-55.3} r={0.8} fill={GHOST_L} />
        <circle cx={10.5} cy={-55.3} r={0.7} fill={GHOST_L} />
        <Glow x={8.3} y={-55.3} r={4 + gl * 3} c={GHOST} o={0.9 * live} />
        <path d="M11.8,-52.6 L13,-51 L11.2,-50.8 Z" fill={OL} />
        <path d="M6.5,-48.6 L12.2,-48.6" stroke={OL} strokeWidth={0.9} />
        {[7.5, 9.2, 10.9].map((x) => (
          <line key={x} x1={x} y1={-49.7} x2={x} y2={-47.5} stroke={OL} strokeWidth={0.6} />
        ))}
        <path d="M2.2,-51 Q1.8,-49 3.2,-48" fill="none" stroke="#e05a8a" strokeWidth={0.8} />
        <circle cx={3} cy={-58.6} r={0.8} fill="#e05a8a" />
        {/* wide sombrero with ghostly glow */}
        <Glow x={4} y={-63} r={14 + gl * 6} c={GHOST} o={0.55 * live} />
        <ellipse cx={4} cy={-61} rx={18} ry={3.8} {...olp(HAT, 1.7)} />
        <path d="M-13.6,-62 Q4,-66 21.6,-62" fill="none" stroke={GHOST} strokeWidth={1.1} opacity={0.9 * live} />
        <path d="M-2.5,-61.5 Q-2.5,-71.5 4,-73.5 Q10.5,-71.5 10.5,-61.5 Q4,-60 -2.5,-61.5 Z" {...olp(HAT, 1.6)} />
        <path d="M-2.5,-64.5 Q4,-63 10.5,-64.5 L10.5,-62.3 Q4,-60.8 -2.5,-62.3 Z" fill={GHOST} stroke={OL} strokeWidth={0.8} />
        {[-0.5, 2.5, 5.5, 8.5].map((x) => (
          <circle key={x} cx={x} cy={-63.4} r={0.55} fill="#ffffff" />
        ))}
        <path d="M0.5,-70.5 Q4,-72 7.5,-70.5" fill="none" stroke={HAT_L} strokeWidth={1} />
        {/* back revolver (hand emerges under poncho) */}
        {gun(ba.hx, ba.hy, bgang, castShot, gl)}
        <circle cx={r2(ba.hx)} cy={r2(ba.hy)} r={2} {...olp(SKIN, 1)} />
        {/* front arm + revolver */}
        <Limb p={[[fa.sx, fa.sy], [fa.ex, fa.ey], [fa.hx, fa.hy]]} w={3.5} c={PONCHO} />
        {gun(fa.hx, fa.hy, gang, atkFlash + castShot, gl)}
        <circle cx={r2(fa.hx)} cy={r2(fa.hy)} r={2.1} {...olp(SKIN, 1)} />
        {atkFlash > 0.05 ? <line x1={r2(fa.hx + 18)} y1={r2(fa.hy - 3)} x2={r2(fa.hx + 48)} y2={r2(fa.hy - 5)} stroke={GHOST_L} strokeWidth={1.3} strokeLinecap="round" opacity={r2(atkFlash)} /> : null}
      </g>
      {cast && p.cflash > 0.05 ? <circle cx={0} cy={-44} r={r2(24 + p.cflash * 20)} fill="none" stroke={GHOST_L} strokeWidth={r2(3 * p.cflash)} opacity={r2(p.cflash)} /> : null}
    </Frame>
  );
};
