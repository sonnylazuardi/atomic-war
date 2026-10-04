import type { HeroArt } from '../types.ts';
import { clamp01, lerp } from '../types.ts';
import { Frame, Glow, Limb, OL, arm, dirPt, legs, olp, pose, pts, r2 } from './parts2.tsx';

const SKIN = '#8a5bc4';
const SKIN_D = '#64409a';
const SKIN_L = '#a982e0';
const ROBE = '#3b2a55';
const ROBE_D = '#271b3a';
const TRIM = '#ff4fb8';
const BONE = '#ece2c6';
const BONE_D = '#bfae86';
const PINK = '#ff6ad0';

type P = [number, number];

function feather(bx: number, by: number, a: number, len: number, c: string, w = 2.6) {
  const [tx, ty] = dirPt(bx, by, a, len);
  const [l1x, l1y] = dirPt(bx, by, a - 12, len * 0.55);
  const [l2x, l2y] = dirPt(bx, by, a + 12, len * 0.55);
  const mx = (bx + tx) / 2;
  const my = (by + ty) / 2;
  return (
    <g>
      <path d={`M${r2(bx)},${r2(by)} Q${r2(l1x + (l1x - mx) * w * 0.2)},${r2(l1y + (l1y - my) * w * 0.2)} ${r2(tx)},${r2(ty)} Q${r2(l2x + (l2x - mx) * w * 0.2)},${r2(l2y + (l2y - my) * w * 0.2)} ${r2(bx)},${r2(by)}Z`} {...olp(c, 1.3)} />
      <line x1={r2(bx)} y1={r2(by)} x2={r2(lerp(bx, tx, 0.85))} y2={r2(lerp(by, ty, 0.85))} stroke={OL} strokeWidth={0.6} opacity={0.6} />
    </g>
  );
}

function glyph(cx: number, cy: number, R: number, rot: number, o: number) {
  if (o <= 0.01 || R <= 0.2) return null;
  const tri = (off: number, rr: number): P[] => [0, 1, 2].map((i) => dirPt(cx, cy, rot + off + i * 120, rr));
  const marks = [0, 1, 2, 3, 4, 5].map((i) => dirPt(cx, cy, -rot * 0.7 + i * 60, R * 1.05));
  return (
    <g opacity={r2(o)} fill="none" stroke={PINK} strokeLinejoin="round">
      <circle cx={r2(cx)} cy={r2(cy)} r={r2(R * 1.25)} strokeWidth={1.4} />
      <circle cx={r2(cx)} cy={r2(cy)} r={r2(R * 0.95)} strokeWidth={0.7} strokeDasharray="1.5 1.5" />
      <path d={`M${pts(tri(0, R * 0.9))}Z`} strokeWidth={1.3} />
      <path d={`M${pts(tri(180, R * 0.9))}Z`} strokeWidth={1.3} />
      <circle cx={r2(cx)} cy={r2(cy)} r={r2(R * 0.22)} fill={PINK} />
      {marks.map(([x, y], i) => (
        <path key={i} d={`M${r2(x - 1.2)},${r2(y - 1.5)} L${r2(x + 1.2)},${r2(y)} L${r2(x - 1.2)},${r2(y + 1.5)}`} strokeWidth={1} />
      ))}
    </g>
  );
}

export const Dazzle: HeroArt = ({ anim, t, dur, team }) => {
  const p = pose(anim, t, dur, 1.6, 0.6);
  const tt = p.t;
  const fs = Math.sin(tt * 3) * 4 + (p.walking ? -8 : 0) + (p.hurt ? Math.sin(tt * 16) * 8 : 0);
  const [bl, fl] = legs(p, { hipY: -24, spread: 6, w: 3.4, c: SKIN, cBack: SKIN_D, boot: SKIN_D, bootW: 6, stride: 8, lift: 5 });

  // front arm holds staff; staff angle sa (0 = vertical, + tips forward)
  let a1 = 30 + p.breathe * 3;
  let a2 = 80;
  let sa = 6 + p.breathe * 2;
  let ba1 = -15;
  let ba2 = 20;
  if (p.walking) {
    a1 = 25 - Math.sin(p.wph) * 15;
    a2 = 75;
    sa = 14;
    ba1 = -8 + Math.sin(p.wph) * 22;
    ba2 = ba1 + 30;
  } else if (anim === 'attack') {
    a1 = 30 - 40 * p.charge + 60 * p.strike;
    a2 = 80 - 30 * p.charge + 10 * p.strike;
    sa = 6 - 30 * p.charge + 74 * p.strike;
    ba1 = -15 + 20 * p.charge;
    ba2 = 20 + 60 * p.charge;
  } else if (anim === 'cast') {
    a1 = lerp(30, 160, p.raise);
    a2 = lerp(80, 170, p.raise);
    sa = lerp(6, -8, p.raise);
    ba1 = lerp(-15, 140, p.raise);
    ba2 = lerp(20, 110, p.raise);
  } else if (p.hurt) {
    a1 = -15;
    a2 = 25;
    sa = -35;
    ba1 = -45;
    ba2 = -15;
  }
  const fa = arm(6, -42, a1, a2, 10, 9);
  const ba = arm(-3, -43, ba1, ba2, 10, 9);
  const [tx, ty] = dirPt(fa.hx, fa.hy, 180 - sa, 26);
  const [sbx, sby] = dirPt(fa.hx, fa.hy, -sa, 14);

  const wave = anim === 'attack' && p.k > 0.48 && p.k < 0.95 ? clamp01((p.k - 0.48) / 0.47) : -1;
  const castG = anim === 'cast' ? p.glow : 0;
  const hunch = 6;

  const robeD = (s: number) =>
    `M-8,-27 L10,-27 L13,-18 L${r2(15 + s)},-10 L${r2(11 + s)},-12 L${r2(9 + s)},-8 L${r2(5 + s)},-11 L${r2(1 + s)},-7 L${r2(-3 + s)},-11 L${r2(-7 + s)},-8 L${r2(-9 + s)},-12 L${r2(-12 + s)},-9 L-11,-18 Z`;
  const rs = p.walking ? Math.sin(p.wph) * 1.5 - 1 : Math.sin(tt * 2) * 0.6;

  return (
    <Frame p={p} team={team} headY={-84}>
      {castG > 0 ? <Glow x={4} y={-40} r={18 + castG * 18} c={PINK} o={0.35 + p.cflash * 0.5} /> : null}
      {bl}
      {fl}
      <g transform={`translate(0,${r2(p.bob)}) rotate(${r2(p.lean + hunch)},0,-24)`}>
        {/* back arm */}
        <Limb p={[[ba.sx, ba.sy], [ba.ex, ba.ey], [ba.hx, ba.hy]]} w={3.4} c={SKIN_D} />
        <circle cx={r2(ba.hx)} cy={r2(ba.hy)} r={2.2} {...olp(SKIN_D, 1.1)} />
        {anim === 'cast' ? <Glow x={ba.hx} y={ba.hy} r={4 + castG * 5} c={PINK} /> : null}
        {/* robe skirt */}
        <path d={robeD(rs)} {...olp(ROBE)} />
        <path d={`M-8,-27 L-3,-27 L-4,-11 L-7,-8 L-9,-12 L-12,-9 L-11,-18 Z`} fill={ROBE_D} />
        <path d="M-9,-27 L11,-27 L11.5,-24 L-9.5,-24 Z" {...olp(TRIM, 1.2)} />
        <path d="M0,-24 L3,-24 L4,-12 L1,-14 Z" fill={TRIM} opacity={0.8} />
        {/* torso (bare, lanky) */}
        <path d="M-6,-45 Q2,-48 9,-44 Q10,-35 8,-27 L-7,-27 Q-8,-36 -6,-45 Z" {...olp(SKIN)} />
        <path d="M-6,-45 Q-8,-36 -7,-27 L-3,-27 Q-4,-36 -2,-46 Z" fill={SKIN_D} />
        <path d="M3,-38 Q6,-36 8,-37 M2,-34 Q5,-32 8,-33" fill="none" stroke={SKIN_D} strokeWidth={0.9} />
        {/* bone necklace */}
        {[-4, -1, 2, 5, 8].map((x, i) => (
          <ellipse key={i} cx={x} cy={-42 + Math.abs(i - 2) * -0.8 + 1.6} rx={1.2} ry={1.9} {...olp(BONE, 0.8)} />
        ))}
        {/* bone shoulder pad */}
        <path d="M-9,-44 Q-6,-50 1,-48 Q-2,-44 -6,-41 Z" {...olp(BONE, 1.3)} />
        <path d="M-7,-46 L-3,-47" stroke={TRIM} strokeWidth={1} />
        {/* head + ear */}
        <path d="M-1,-56 L-15,-63 L-2,-50 Z" {...olp(SKIN, 1.4)} />
        <path d="M-3,-55 L-11,-60 L-3,-52 Z" fill={SKIN_D} />
        <circle cx={4} cy={-54} r={8} {...olp(SKIN)} />
        {/* headdress feathers */}
        {feather(2, -61, 205 + fs * 0.3, 21, '#e86a3c')}
        {feather(2, -61, 228 + fs * 0.5, 19, '#5bc0be')}
        {feather(2, -61, 183 + fs * 0.2, 22, '#f2c14e')}
        {feather(2, -61, 162 + fs * 0.15, 18, TRIM)}
        {feather(2, -61, 250 + fs * 0.6, 15, '#f2c14e')}
        {/* mask */}
        <path d="M1,-63 Q9,-67 14,-60 Q16,-52 12,-46 Q7,-42 3,-46 Q-1,-54 1,-63 Z" {...olp(BONE, 1.6)} />
        <path d="M1,-63 Q-1,-54 3,-46 Q4,-45 6,-44.5 Q2,-53 4,-64 Z" fill={BONE_D} />
        <path d="M8.5,-65 L9,-59 M11.5,-52 Q13,-49 12,-47 M5,-52 Q5.5,-49 5,-47" fill="none" stroke={TRIM} strokeWidth={1.4} strokeLinecap="round" />
        <ellipse cx={7} cy={-56} rx={1.6} ry={1.2} fill={OL} />
        <ellipse cx={12} cy={-56.4} rx={1.3} ry={1.1} fill={OL} />
        <circle cx={7.2} cy={-56} r={0.7} fill={PINK} />
        <circle cx={12} cy={-56.4} r={0.6} fill={PINK} />
        <Glow x={9.5} y={-56} r={4 + castG * 5} c={PINK} o={anim === 'dead' ? 0 : 0.5} />
        <path d="M5,-49 L12,-49.5" stroke={OL} strokeWidth={1} />
        <path d="M10,-46 Q13,-46 13.5,-49 Q12,-47.5 10.5,-47.5 Z" {...olp('#fff', 0.8)} />
        <path d="M0,-63 Q7,-67 14,-61" fill="none" stroke={OL} strokeWidth={3.2} strokeLinecap="round" />
        <path d="M0,-63 Q7,-67 14,-61" fill="none" stroke="#f2c14e" strokeWidth={1.6} strokeLinecap="round" />
        {/* staff */}
        <Limb p={[[sbx, sby], [tx, ty]]} w={2.2} c={BONE} />
        {[0.25, 0.55].map((f, i) => (
          <circle key={i} cx={r2(lerp(sbx, tx, f))} cy={r2(lerp(sby, ty, f))} r={1.8} {...olp(BONE_D, 1)} />
        ))}
        {/* skull */}
        <g transform={`translate(${r2(tx)},${r2(ty)}) rotate(${r2(sa)})`}>
          <path d="M-4,-1 Q-4.5,-7 0,-7.5 Q4.5,-7 4.5,-2 L3,1.5 L-2.5,1.5 Z" {...olp(BONE, 1.3)} />
          <circle cx={-1.3} cy={-3.5} r={1.1} fill={OL} />
          <circle cx={2} cy={-3.5} r={1.1} fill={OL} />
          <path d="M-1.5,1.5 L-1.5,3 M0.5,1.5 L0.5,3 M2.3,1.5 L2.3,3" stroke={OL} strokeWidth={0.7} />
        </g>
        {/* dangling feathers */}
        {feather(tx - 1, ty + 2, -10 + fs * 0.8, 9, TRIM, 2)}
        {feather(tx + 1, ty + 2, 12 + fs * 0.6, 8, '#5bc0be', 2)}
        <Glow x={tx} y={ty - 3} r={4 + (anim === 'attack' ? p.charge * 6 : 0) + castG * 8} c={PINK} o={anim === 'dead' ? 0 : 0.7} />
        {/* front arm */}
        <Limb p={[[fa.sx, fa.sy], [fa.ex, fa.ey], [fa.hx, fa.hy]]} w={3.4} c={SKIN} />
        <circle cx={r2(fa.hx)} cy={r2(fa.hy)} r={2.3} {...olp(SKIN_L, 1.1)} />
        <path d={`M${r2(fa.ex)},${r2(fa.ey)} L${r2(lerp(fa.ex, fa.hx, 0.4))},${r2(lerp(fa.ey, fa.hy, 0.4))}`} stroke={TRIM} strokeWidth={1.4} />
        {/* attack shadow wave */}
        {wave >= 0 ? (
          <g opacity={r2(1 - wave)}>
            {[0, 0.18, 0.36].map((d, i) => {
              const q = Math.max(0, wave - d);
              if (q <= 0) return null;
              const cx = tx + 4 + q * 34;
              const R = 6 + q * 10;
              return (
                <path
                  key={i}
                  d={`M${r2(cx - R * 0.4)},${r2(ty - R)} Q${r2(cx + R * 0.8)},${r2(ty)} ${r2(cx - R * 0.4)},${r2(ty + R)}`}
                  fill="none"
                  stroke={i === 0 ? '#2a1240' : '#b24bd6'}
                  strokeWidth={r2(3.4 - i * 0.8)}
                  strokeLinecap="round"
                />
              );
            })}
            <Glow x={tx + 6 + wave * 26} y={ty} r={8} c="#9b3fd0" />
          </g>
        ) : null}
      </g>
      {/* cast voodoo glyph */}
      {castG > 0 ? (
        <g>
          <Glow x={6} y={-88} r={10 + castG * 10 + p.cflash * 10} c={PINK} o={0.8} />
          {glyph(6, -88, 6 + castG * 6, tt * 140, castG)}
          <g transform="translate(4,-1) scale(1,0.32)">{glyph(0, 0, 10 + castG * 10, -tt * 90, castG * 0.8)}</g>
        </g>
      ) : null}
      {anim === 'cast' && p.cflash > 0.05 ? <circle cx={6} cy={-88} r={r2(14 + p.cflash * 14)} fill="none" stroke="#ffd1f0" strokeWidth={r2(3 * p.cflash)} opacity={r2(p.cflash)} /> : null}
    </Frame>
  );
};
