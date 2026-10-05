import type { HeroArt } from '../types.ts';
import { bump, clamp01, lerp, loop } from '../types.ts';
import { Blob, Frame, Limb, OL, arm, dirPt, legs, olp, pose, pts, r2 } from './parts2.tsx';

const SKIN = '#7a5ac8';
const SKIN_D = '#553d96';
const SKIN_L = '#a28ae6';
const FUR = '#5e4636';
const FUR_D = '#3e2c22';
const HAIR = '#2b1d47';
const HAIR_L = '#c06bff';
const LEATHER = '#3a2f4f';
const SCARF = '#2c3f73';
const STEEL = '#dfe5ec';
const STEEL_D = '#8d98a6';
const SMOKE = '#9b7fd0';

function dagger(hx: number, hy: number, ang: number, len: number) {
  const [tx, ty] = dirPt(hx, hy, ang, len);
  const [b1x, b1y] = dirPt(hx, hy, ang + 90, 2);
  const [b2x, b2y] = dirPt(hx, hy, ang - 90, 1.2);
  const [m1x, m1y] = dirPt(hx, hy, ang + 12, len * 0.6);
  const [px, py] = dirPt(hx, hy, ang + 180, 3.5);
  const [g1x, g1y] = dirPt(hx, hy, ang + 90, 3.4);
  const [g2x, g2y] = dirPt(hx, hy, ang - 90, 3.4);
  return (
    <g>
      <path d={`M${pts([[b1x, b1y], [m1x, m1y], [tx, ty], [b2x, b2y]])}Z`} {...olp(STEEL, 1.3)} />
      <path d={`M${pts([[hx, hy], [tx, ty]])}`} stroke={STEEL_D} strokeWidth={0.7} />
      <Limb p={[[g1x, g1y], [g2x, g2y]]} w={1.6} c={HAIR_L} ow={2.2} />
      <Limb p={[[hx, hy], [px, py]]} w={1.8} c={LEATHER} ow={2.2} />
    </g>
  );
}

export const Riki: HeroArt = ({ anim, t, dur, team }) => {
  const p = pose(anim, t, dur, 1.4, 0.5);
  const tt = p.t;
  const atk = anim === 'attack';
  const cast = anim === 'cast';
  const lunge = atk ? -4 * p.charge + 13 * p.strike : 0;
  const crouch = atk ? 3 * p.charge : 0;
  // vanish: fade out 0.1-0.35, invisible, reappear 0.7-0.9
  const vis = cast ? (p.k < 0.1 ? 1 : p.k < 0.35 ? 1 - (p.k - 0.1) / 0.25 : p.k < 0.7 ? 0 : clamp01((p.k - 0.7) / 0.2)) : 1;
  const bodyO = 0.08 + 0.92 * vis;

  const [bl, fl] = legs(p, { hipY: -17, hipX: lunge, spread: 6, w: 4.4, c: FUR, cBack: FUR_D, boot: '#1e1a22', bootW: 3.5, stride: 8, lift: 5 });

  let a1 = 60 + p.breathe * 4;
  let a2 = 100;
  let dang = 140;
  let ba1 = 20;
  let ba2 = 70;
  let bang = -20;
  if (p.walking) {
    a1 = 55 - Math.sin(p.wph) * 15;
    a2 = 95;
    ba1 = 15 + Math.sin(p.wph) * 15;
    ba2 = 60;
  } else if (atk) {
    a1 = 60 - 70 * p.charge + 30 * p.strike;
    a2 = 100 - 60 * p.charge - 10 * p.strike;
    dang = 140 - 40 * p.charge - 50 * p.strike;
    ba1 = 20 + 40 * p.strike;
    ba2 = 70 + 30 * p.strike;
  } else if (cast) {
    a1 = lerp(60, 20, 1 - vis);
    ba1 = lerp(20, -10, 1 - vis);
  } else if (p.hurt) {
    a1 = -10;
    a2 = 30;
    dang = 200;
    ba1 = -30;
    ba2 = -10;
  }
  const fa = arm(4, -33, a1, a2, 7, 7);
  const ba = arm(-3, -34, ba1, ba2, 7, 7);

  const mh = Math.sin(tt * 3) * 0.6;
  const smoke = cast ? [bump(clamp01((p.k - 0.05) / 0.45)), bump(clamp01((p.k - 0.62) / 0.38))] : [0, 0];

  const body = (
    <g opacity={r2(bodyO)}>
      {bl}
      <g transform={`translate(${r2(lunge)},${r2(p.bob + crouch)}) rotate(${r2(p.lean + 12 + crouch * 2)},0,-17)`}>
        {/* back arm + reverse-grip dagger */}
        <Limb p={[[ba.sx, ba.sy], [ba.ex, ba.ey], [ba.hx, ba.hy]]} w={3.4} c={SKIN_D} />
        {dagger(ba.hx, ba.hy, bang, 11)}
        <circle cx={r2(ba.hx)} cy={r2(ba.hy)} r={2} {...olp(SKIN_D, 1.1)} />
        {/* tail */}
        <path d={`M-6,-18 Q-14,-20 ${r2(-15 + mh * 3)},-27`} fill="none" stroke={OL} strokeWidth={3} strokeLinecap="round" />
        <path d={`M-6,-18 Q-14,-20 ${r2(-15 + mh * 3)},-27`} fill="none" stroke={FUR} strokeWidth={1.4} strokeLinecap="round" />
        {/* torso */}
        <path d="M-6,-35 Q1,-38 7,-35 Q8,-26 6,-17 L-6,-17 Q-8,-26 -6,-35 Z" {...olp(SKIN)} />
        <path d="M-6,-35 Q-8,-26 -6,-17 L-2,-17 Q-4,-26 -2,-36 Z" fill={SKIN_D} />
        <path d="M-6,-34 L6,-20 M6,-34 L-5,-21" stroke={OL} strokeWidth={2.6} />
        <path d="M-6,-34 L6,-20 M6,-34 L-5,-21" stroke={LEATHER} strokeWidth={1.3} />
        <path d="M-7,-20 L7,-20 L8,-15 L-7,-15 Z" {...olp(FUR_D, 1.2)} />
        {/* head: horns, ears, mohawk */}
        <path d="M0,-49 Q-4,-55 -9,-54 Q-5,-52 -2,-46 Z" {...olp('#d8c8a0', 1.1)} />
        <path d="M-2,-45 L-14,-49 L-3,-41 Z" {...olp(SKIN, 1.3)} />
        <path d="M-4,-44.5 L-11,-47.5 L-4,-42.5 Z" fill="#e58cc8" />
        <path
          d={`M-2,-51 Q-3,-60 ${r2(1 + mh)},-64 Q${r2(4 + mh)},-58 5,-56 Q${r2(7 + mh)},-62 ${r2(10 + mh)},-62 Q9,-56 9,-51 Z`}
          {...olp(HAIR, 1.4)}
        />
        <path d={`M${r2(1 + mh)},-62 Q2,-57 3,-53 M${r2(9.5 + mh)},-60.5 Q8.5,-56 8,-52`} fill="none" stroke={HAIR_L} strokeWidth={1} />
        <circle cx={4.5} cy={-45} r={7.2} {...olp(SKIN)} />
        <path d="M-1.5,-42 Q0,-39 4,-38.5 Q-1,-40 -1,-45 Z" fill={SKIN_D} />
        <path d="M6,-48 L11,-47 L10.5,-45.8 Q8,-45.6 6,-48 Z" fill="#ffe14d" stroke={OL} strokeWidth={0.6} />
        <path d="M5.5,-49 L11,-48" stroke={OL} strokeWidth={1.1} strokeLinecap="round" />
        {/* scarf mask */}
        <path d="M-1,-44 Q5,-42 12,-44 Q12,-40 9,-38.5 Q3,-37.5 -1,-40 Z" {...olp(SCARF, 1.3)} />
        <path d={`M-1,-41 Q-6,-40 ${r2(-10 - Math.sin(tt * 4) * 1.5)},-37 Q-6,-38 -1,-39 Z`} {...olp(SCARF, 1.1)} />
        {/* front arm + dagger */}
        <Limb p={[[fa.sx, fa.sy], [fa.ex, fa.ey], [fa.hx, fa.hy]]} w={3.4} c={SKIN} />
        {dagger(fa.hx, fa.hy, dang, 13)}
        <circle cx={r2(fa.hx)} cy={r2(fa.hy)} r={2.1} {...olp(SKIN_L, 1.1)} />
        {atk && p.flash > 0.05 && p.k > 0.45 ? (
          <path d={`M${r2(fa.hx - 4)},${r2(fa.hy - 6)} Q${r2(fa.hx + 18)},${r2(fa.hy - 2)} ${r2(fa.hx + 14)},${r2(fa.hy + 8)}`} fill="none" stroke="#f0e6ff" strokeWidth={2} strokeLinecap="round" opacity={r2(p.flash)} />
        ) : null}
      </g>
      {fl}
    </g>
  );

  return (
    <Frame p={p} team={team} headY={-70} rx={14}>
      {/* idle smoke wisps */}
      {anim !== 'dead'
        ? [0, 1, 2].map((i) => {
            const q = loop(tt * 0.7 + i / 3, 1);
            return <circle key={i} cx={r2(-8 + i * 7 + Math.sin(q * 6 + i) * 2)} cy={r2(-2 - q * 16)} r={r2(1.5 + q * 3)} fill={SMOKE} opacity={r2(bump(q) * 0.35)} />;
          })
        : null}
      {body}
      {smoke.map((s, j) =>
        s > 0.02 ? (
          <g key={j} opacity={r2(s * 0.85)}>
            <Blob
              c={[
                [0, -24 - s * 4, 8 + s * 5] as [number, number, number],
                ...[0, 1, 2, 3, 4, 5, 6].map((i) => {
                  const a = i * 0.9 + j + tt * 1.5;
                  const R = 6 + s * 9 + (i % 3) * 1.5;
                  return [Math.cos(a) * R, -24 + Math.sin(a) * R * 0.9 - s * 4 - (i % 2) * 3, 4 + s * 4 + (i % 3)] as [number, number, number];
                }),
              ]}
              fill={SMOKE}
              shade="#6a4c9c"
              ow={1.5}
            />
          </g>
        ) : null,
      )}
    </Frame>
  );
};
