import type { HeroArt } from '../types.ts';
import { clamp01, lerp, loop } from '../types.ts';
import { Blob, Frame, Glow, Limb, OL, RuneRing, Snowflake, Sparkle, arm, dirPt, legs, olp, pose, pts, r2 } from './parts2.tsx';

const DRESS = '#4a7fd0';
const DRESS_D = '#335fa8';
const DRESS_L = '#7fb0f0';
const FUR = '#f4f8ff';
const FUR_D = '#c9d6ea';
const SKIN = '#f7dccb';
const SKIN_D = '#dcb39c';
const HAIR = '#f3dc8a';
const STAFF = '#dfe6ee';
const STAFF_D = '#8d9bb0';
const ICE = '#9fe6ff';
const ICE_D = '#3fa8e0';

export const CrystalMaiden: HeroArt = ({ anim, t, dur, team }) => {
  const p = pose(anim, t, dur, 1.8, 0.62);
  const tt = p.t;
  const sway = Math.sin(tt * 2.2) * 0.8 + (p.walking ? Math.sin(p.wph) * 2 - 1.5 : 0);
  const capeF = Math.sin(tt * 2.6) * 1.2 + (p.walking ? 4 : 0) + (anim === 'cast' ? p.raise * 3 : 0);
  const [bl, fl] = legs(p, { hipY: -18, spread: 5, w: 3.6, c: SKIN, cBack: SKIN_D, boot: FUR, bootW: 5, stride: 6, lift: 3.5 });

  // front arm & staff
  let a1 = 25 + p.breathe * 3;
  let a2 = 75;
  let sa = 8 + p.breathe * 2;
  let ba1 = -10;
  let ba2 = 10;
  if (p.walking) {
    a1 = 20 - Math.sin(p.wph) * 12;
    a2 = 70;
    sa = 14 - Math.sin(p.wph) * 5;
    ba1 = -5 + Math.sin(p.wph) * 20;
    ba2 = ba1 + 20;
  } else if (anim === 'attack') {
    a1 = 25 + 70 * p.charge + 50 * p.strike;
    a2 = 75 + 75 * p.charge + 20 * p.strike;
    sa = 8 - 40 * p.charge + 45 * p.strike;
    ba1 = -10 - 15 * p.strike;
    ba2 = 10;
  } else if (anim === 'cast') {
    a1 = lerp(25, 165, p.raise);
    a2 = lerp(75, 175, p.raise);
    sa = lerp(8, -4, p.raise);
    ba1 = lerp(-10, 120, p.raise);
    ba2 = lerp(10, 150, p.raise);
  } else if (p.hurt) {
    a1 = -10;
    a2 = 30;
    sa = -30;
    ba1 = -40;
    ba2 = -20;
  }
  const fa = arm(5, -42, a1, a2, 8.5, 8);
  const ba = arm(-4, -42, ba1, ba2, 8.5, 8);
  // staff: grip at hand, crystal 26 above along staff axis
  const [ctx, cty] = dirPt(fa.hx, fa.hy, 180 - sa, 26);
  const [sbx, sby] = dirPt(fa.hx, fa.hy, -sa, 16);
  const crystal = `M${pts([
    [ctx, cty - 7],
    [ctx + 3.6, cty - 1],
    [ctx, cty + 3.5],
    [ctx - 3.6, cty - 1],
  ])}Z`;

  const shard = anim === 'attack' && p.k > 0.48 && p.k < 0.9 ? clamp01((p.k - 0.48) / 0.42) : -1;
  const castG = anim === 'cast' ? p.glow : 0;

  const capeD = `M-4,-45 Q-10,-38 -12,-28 Q${r2(-15 - capeF)},-16 ${r2(-17 - capeF)},-6 Q-8,-4 -2,-6 L0,-40 Z`;
  const hem = 15 + sway;
  const dressD = `M-6,-34 Q1,-36 8,-34 L11,-20 Q14,-10 ${r2(hem)},-5 Q2,-2 ${r2(-12 + sway)},-5 Q-10,-18 -7,-34 Z`;

  return (
    <Frame p={p} team={team} headY={-80}>
      {castG > 0 ? (
        <g>
          <Glow x={0} y={-40} r={20 + castG * 22} c={ICE} o={0.45 + p.cflash * 0.5} />
          <RuneRing x={0} y={-1} r={12 + castG * 14} rot={tt * 80} c="#e3f7ff" o={castG} ry={0.3} ticks={6} />
        </g>
      ) : null}
      <g transform={`translate(0,${r2(p.bob)}) rotate(${r2(p.lean * 0.7)},0,-18)`}>
        {/* cape */}
        <path d={capeD} {...olp(DRESS_D, 1.7)} />
        {/* back arm */}
        <Limb p={[[ba.sx, ba.sy], [ba.ex, ba.ey], [ba.hx, ba.hy]]} w={3.6} c={DRESS_D} />
        <circle cx={r2(ba.hx)} cy={r2(ba.hy)} r={2} {...olp(SKIN_D, 1.1)} />
      </g>
      {bl}
      {fl}
      <g transform={`translate(0,${r2(p.bob)}) rotate(${r2(p.lean * 0.7)},0,-18)`}>
        {/* dress */}
        <path d={dressD} {...olp(DRESS)} />
        <path d={`M-7,-34 Q-10,-18 ${r2(-12 + sway)},-5 Q-8,-4 -5,-4 Q-6,-20 -2,-35 Z`} fill={DRESS_D} />
        <path d={`M3,-33 Q6,-18 ${r2(8 + sway * 0.6)},-4`} fill="none" stroke={DRESS_L} strokeWidth={1.2} />
        <path d={`M${r2(-12 + sway)},-5 Q2,-2 ${r2(hem)},-5`} fill="none" stroke={OL} strokeWidth={5} strokeLinecap="round" />
        <path d={`M${r2(-12 + sway)},-5 Q2,-2 ${r2(hem)},-5`} fill="none" stroke={FUR} strokeWidth={3} strokeLinecap="round" />
        {/* bodice */}
        <path d="M-6,-45 Q1,-47 8,-45 L7,-33 Q1,-31 -6,-33 Z" {...olp(DRESS_L, 1.6)} />
        <path d="M-6,-45 L-6,-33 L-2,-32.5 L-1,-46 Z" fill={DRESS} />
        <path d="M-7,-34 Q1,-31 8,-34" fill="none" stroke="#e3f0ff" strokeWidth={1.4} />
        {/* hood back */}
        <path d="M-11,-61 Q-6,-68 3,-67 Q12,-66 13.5,-56 Q12,-50 8,-47 L-4,-46 Q-10,-52 -11,-61 Z" {...olp(DRESS)} />
        <path d="M-11,-61 Q-9,-52 -4,-46 L0,-46 Q-6,-54 -6,-63 Z" fill={DRESS_D} />
        {/* face + hair */}
        <circle cx={5.5} cy={-54} r={7.3} {...olp(SKIN)} />
        <path d="M0,-49 Q2,-47 6,-46.8 Q1,-49 0,-54 Z" fill={SKIN_D} />
        <path d="M0,-60 Q7,-63 12,-58 Q9,-58.5 8,-56 Q6,-58 4,-57 Q3,-55 1,-53 Z" {...olp(HAIR, 1.2)} />
        <ellipse cx={9.5} cy={-54} rx={1.2} ry={1.5} fill="#2a4c86" />
        <circle cx={9.9} cy={-54.5} r={0.45} fill="#fff" />
        <ellipse cx={8.5} cy={-51} rx={1.4} ry={0.8} fill="#f4a3a3" opacity={0.7} />
        <path d="M10,-49.4 Q11,-48.9 11.8,-49.6" fill="none" stroke="#a5544f" strokeWidth={0.9} strokeLinecap="round" />
        {/* fur trim: hood rim + collar */}
        <Blob
          c={[
            [-2, -62, 2.6],
            [2.5, -64.5, 2.6],
            [7.5, -64.6, 2.6],
            [11.8, -61.5, 2.5],
            [13.5, -57, 2.2],
          ]}
          fill={FUR}
          shade={FUR_D}
          ow={2.4}
        />
        <Blob
          c={[
            [-6, -45, 3],
            [-1.5, -46.5, 3.2],
            [3.5, -46.5, 3.2],
            [8, -45, 2.8],
          ]}
          fill={FUR}
          shade={FUR_D}
          ow={2.4}
        />
        {/* staff */}
        <Limb p={[[sbx, sby], [ctx, cty]]} w={2.2} c={STAFF} />
        <path d={`M${r2(ctx - 4)},${r2(cty + 3)} Q${r2(ctx - 6)},${r2(cty - 5)} ${r2(ctx)},${r2(cty - 9)} M${r2(ctx + 4)},${r2(cty + 3)} Q${r2(ctx + 6)},${r2(cty - 5)} ${r2(ctx)},${r2(cty - 9)}`} fill="none" stroke={OL} strokeWidth={2.8} strokeLinecap="round" />
        <path d={`M${r2(ctx - 4)},${r2(cty + 3)} Q${r2(ctx - 6)},${r2(cty - 5)} ${r2(ctx)},${r2(cty - 9)} M${r2(ctx + 4)},${r2(cty + 3)} Q${r2(ctx + 6)},${r2(cty - 5)} ${r2(ctx)},${r2(cty - 9)}`} fill="none" stroke={STAFF_D} strokeWidth={1.2} strokeLinecap="round" />
        <Glow x={ctx} y={cty - 1.5} r={7 + castG * 9 + (anim === 'attack' ? p.charge * 5 : 0) + Math.sin(tt * 3) * 0.8} c={ICE} o={anim === 'dead' ? 0.2 : 0.9} />
        <path d={crystal} {...olp(ICE, 1.3)} />
        <path d={`M${pts([[ctx, cty - 7], [ctx + 3.6, cty - 1], [ctx, cty + 3.5]])}Z`} fill={ICE_D} opacity={0.6} />
        <Sparkle x={ctx - 1.2} y={cty - 3} s={1.5} />
        {/* front arm */}
        <Limb p={[[fa.sx, fa.sy], [fa.ex, fa.ey], [fa.hx, fa.hy]]} w={3.6} c={DRESS} />
        <circle cx={r2(fa.hx)} cy={r2(fa.hy)} r={2.1} {...olp(SKIN, 1.1)} />
        {/* idle drifting snowflakes */}
        {anim !== 'dead' && anim !== 'cast'
          ? [0, 1, 2].map((i) => {
              const q = loop(tt * 0.35 + i / 3, 1);
              return <Snowflake key={i} x={ctx - 12 + i * 10 + Math.sin(q * 6 + i) * 3} y={cty - 8 + q * 30} r={1.6} rot={q * 180} o={Math.sin(q * Math.PI) * 0.9} />;
            })
          : null}
        {/* attack ice shard */}
        {shard >= 0 ? (
          <g opacity={r2(1 - shard * 0.6)}>
            <path
              d={`M${pts([
                [ctx + 4 + shard * 34, cty + shard * 10],
                [ctx - 4 + shard * 34, cty - 2.6 + shard * 10],
                [ctx - 1 + shard * 34, cty + shard * 10],
                [ctx - 4 + shard * 34, cty + 2.6 + shard * 10],
              ])}Z`}
              {...olp('#e8fbff', 1.1)}
            />
            <Glow x={ctx + shard * 34} y={cty + shard * 10} r={7} c={ICE} />
            <Sparkle x={ctx + shard * 20} y={cty - 3 + shard * 6} s={2.2 * (1 - shard)} />
            <Sparkle x={ctx + shard * 26} y={cty + 4 + shard * 6} s={1.6 * (1 - shard)} c={ICE} />
          </g>
        ) : null}
        {/* cast swirling snowflakes */}
        {castG > 0
          ? [0, 1, 2, 3, 4, 5, 6].map((i) => {
              const a = tt * 3 + (i * Math.PI * 2) / 7;
              const R = 10 + castG * 14 + (i % 2) * 4;
              return <Snowflake key={i} x={Math.cos(a) * R} y={-40 + Math.sin(a) * R * 0.55 - i * 2} r={1.8 + castG * 1.2} rot={tt * 120 + i * 20} o={castG} />;
            })
          : null}
      </g>
      {anim === 'cast' && p.cflash > 0.05 ? <circle cx={0} cy={-40} r={r2(24 + p.cflash * 18)} fill="#e8fbff" opacity={r2(p.cflash * 0.3)} /> : null}
    </Frame>
  );
};
