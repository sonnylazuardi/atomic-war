import type { HeroArt } from '../types.ts';
import { clamp01, easeOut, lerp } from '../types.ts';
import { Bow, Frame, Glow, Limb, OL, olp, pose, pts, r2 } from './parts2.tsx';

const SKIN = '#4fb8a4';
const SKIN_D = '#2f8578';
const SKIN_L = '#8be0cc';
const SCALE = '#3d9c78';
const SCALE_D = '#23664f';
const BELLY = '#d9d48a';
const SNAKE = '#6cc24a';
const SNAKE_D = '#3c8a2e';
const GOLD = '#f2c14e';
const GOLD_D = '#b8862b';
const EYE = '#ffe14d';

type P = [number, number];
const qb = (a: P, c: P, b: P, s: number): P => [
  (1 - s) * (1 - s) * a[0] + 2 * (1 - s) * s * c[0] + s * s * b[0],
  (1 - s) * (1 - s) * a[1] + 2 * (1 - s) * s * c[1] + s * s * b[1],
];

// serpent tail centerline (waist -> ground -> curled tip)
function tailLine(): P[] {
  const segs: [P, P, P][] = [
    [[0, -24], [4, -9], [-5, -4]],
    [[-5, -4], [-20, 1], [-30, -5]],
    [[-30, -5], [-38, -11], [-32, -15]],
  ];
  const out: P[] = [];
  segs.forEach(([a, c, b], si) => {
    const n = si === 2 ? 4 : 7;
    for (let i = si === 0 ? 0 : 1; i <= n; i++) out.push(qb(a, c, b, i / n));
  });
  return out;
}
const BASE = tailLine();

export const Medusa: HeroArt = ({ anim, t, dur, team }) => {
  const p = pose(anim, t, dur, 1.8, 0.7);
  const tt = p.t;
  const slither = p.walking;
  const amp = slither ? 2.6 : 1.1;
  const phase = slither ? p.wph * 2 : tt * 2.5;
  const sway = slither ? Math.sin(p.wph) * 1.8 : Math.sin(tt * 2) * 0.6;

  // tail polygon with travelling wave
  const n = BASE.length;
  const cl: P[] = [];
  const nrm: P[] = [];
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1);
    const a = BASE[Math.max(0, i - 1)];
    const b = BASE[Math.min(n - 1, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const L = Math.hypot(tx, ty) || 1;
    const nx = ty / L;
    const ny = -tx / L;
    const w = Math.sin(s * 11 - phase) * amp * Math.min(1, s * 2.5);
    const top = i === 0 ? sway : sway * (1 - s);
    cl.push([BASE[i][0] + nx * w + top, BASE[i][1] + ny * w]);
    nrm.push([nx, ny]);
  }
  const width = (s: number) => 7.5 * (1 - s) + 0.9;
  const L1: P[] = cl.map(([x, y], i) => [x - nrm[i][0] * width(i / (n - 1)), y - nrm[i][1] * width(i / (n - 1))]);
  const L2: P[] = cl.map(([x, y], i) => [x + nrm[i][0] * width(i / (n - 1)), y + nrm[i][1] * width(i / (n - 1))]);
  const tailD = `M${pts(L1)} L${pts([...L2].reverse())}Z`;

  // bow + arms
  const gx = 17;
  const gy = -39;
  const atk = anim === 'attack';
  const rest: P = [-5, -27];
  const drawX = atk && p.k < 0.5 ? lerp(gx - 7, gx - 25, p.charge) : gx - 7;
  let bowRot = 18 + p.breathe * 2;
  if (slither) bowRot = 24;
  else if (atk) bowRot = lerp(18, 0, clamp01(p.k / 0.15)) * (p.k < 0.8 ? 1 : 1) + (p.k > 0.6 ? lerp(0, 18, (p.k - 0.6) / 0.4) : 0);
  else if (anim === 'cast') bowRot = lerp(18, 40, p.raise);
  else if (p.hurt) bowRot = 45;
  let hand: P = rest;
  if (atk) {
    hand = p.k < 0.5 ? [lerp(rest[0], drawX, easeOut(p.k / 0.12)), lerp(rest[1], gy, easeOut(p.k / 0.12))] : [lerp(rest[0], gx - 15, p.strike), lerp(rest[1], gy - 3, p.strike)];
  } else if (anim === 'cast') hand = [lerp(rest[0], 4, p.raise), lerp(rest[1], -50, p.raise)];
  else if (p.hurt) hand = [-10, -32];
  const nocked = atk && p.k < 0.5;
  const sh: P = [-3, -41];
  const el: P = [lerp(sh[0], hand[0], 0.5) - 3, lerp(sh[1], hand[1], 0.5) + 3 - (atk ? 2 : 0)];
  const fsh: P = [5, -41];
  const fel: P = [lerp(fsh[0], gx, 0.5), lerp(fsh[1], gy, 0.5) + 3];

  // snake hair
  const hiss = anim === 'cast' ? 1 + p.raise * 1.5 : p.hurt ? 2 : 1;
  const snakes = [
    { bx: -4, by: -57, a: -150, len: 13 },
    { bx: -1, by: -60, a: -165, len: 13 },
    { bx: 3, by: -61, a: 175, len: 12 },
    { bx: 7, by: -60, a: 155, len: 11 },
    { bx: -6, by: -52, a: -120, len: 12 },
    { bx: -5, by: -48, a: -95, len: 10 },
  ].map((s, i) => {
    const seg: P[] = [[s.bx, s.by]];
    let x = s.bx;
    let y = s.by;
    for (let j = 1; j <= 4; j++) {
      const a = ((s.a + Math.sin(tt * 4 * hiss + i * 1.3 + j * 0.9) * 22 * hiss) * Math.PI) / 180;
      x += Math.sin(a) * (s.len / 4);
      y += Math.cos(a) * (s.len / 4);
      seg.push([x, y]);
    }
    const [px, py] = seg[3];
    const ang = (Math.atan2(y - py, x - px) * 180) / Math.PI;
    return { seg, x, y, ang, i };
  });

  const gaze = anim === 'cast' ? p.glow : 0;

  return (
    <Frame p={p} team={team} headY={-78} rx={17}>
      {/* back snakes */}
      <g transform={`translate(${r2(sway)},${r2(p.bob)}) rotate(${r2(p.lean * 0.6)},0,-24)`}>
        {snakes.slice(3).map((s) => (
          <SnakeHead key={s.i} {...s} back />
        ))}
      </g>
      {/* tail */}
      <path d={tailD} {...olp(SCALE, 1.8)} />
      {cl.slice(0, -1).map(([x, y], i) => {
        const s = i / (n - 1);
        const w = width(s);
        const [nx, ny] = nrm[i];
        const [x2, y2] = cl[i + 1];
        return (
          <line
            key={i}
            x1={r2(x + nx * w * 0.5)}
            y1={r2(y + ny * w * 0.5)}
            x2={r2(x2 + nx * w * 0.5)}
            y2={r2(y2 + ny * w * 0.5)}
            stroke={BELLY}
            strokeWidth={r2(w * 0.75)}
            strokeLinecap="round"
          />
        );
      })}
      {cl.slice(1, -2).map(([x, y], i) =>
        i % 2 === 0 ? <circle key={i} cx={r2(x - nrm[i + 1][0] * 2)} cy={r2(y - nrm[i + 1][1] * 2)} r={r2(width((i + 1) / (n - 1)) * 0.3)} fill={SCALE_D} /> : null,
      )}
      <g transform={`translate(${r2(sway)},${r2(p.bob)}) rotate(${r2(p.lean * 0.6)},0,-24)`}>
        {/* back arm */}
        <Limb p={[sh, el, hand]} w={3.6} c={SKIN_D} />
        {atk || anim === 'cast' ? null : <circle cx={r2(hand[0])} cy={r2(hand[1])} r={2.2} {...olp(SKIN_D, 1.2)} />}
        {/* torso */}
        <path d="M-6,-42 Q1,-45 8,-42 Q6,-34 5,-27 Q6,-23 7,-20 L-7,-20 Q-5,-25 -5,-29 Q-8,-35 -6,-42 Z" {...olp(SKIN)} />
        <path d="M-6,-42 Q-8,-35 -5,-29 Q-5,-25 -7,-20 L-3,-20 Q-3,-30 -2,-42 Z" fill={SKIN_D} />
        <path d="M-6,-38 Q1,-35 8,-38 L7,-33 Q1,-30 -5,-33 Z" {...olp(GOLD, 1.3)} />
        <path d="M-7,-24 Q0,-21 8,-24 L8,-21 Q0,-18 -7,-21 Z" {...olp(GOLD, 1.2)} />
        <circle cx={1} cy={-22} r={1.6} {...olp('#e5484d', 0.9)} />
        {/* head */}
        <circle cx={3} cy={-52} r={8.5} {...olp(SKIN)} />
        <path d="M-4,-48 Q-2,-44 3,-43.5 Q-3,-47 -3,-52 Z" fill={SKIN_D} />
        <path d="M5,-55.5 Q8,-57 11,-55.5" fill="none" stroke={OL} strokeWidth={1.2} strokeLinecap="round" />
        <path d="M5.5,-53.5 Q8,-55 10.5,-53.5 Q8,-52.3 5.5,-53.5 Z" fill={EYE} stroke={OL} strokeWidth={0.6} />
        <line x1={8} y1={-54.6} x2={8} y2={-52.5} stroke={OL} strokeWidth={0.8} />
        <path d="M9,-48 Q10.5,-47.4 11,-48.3" fill="none" stroke="#8a1f3a" strokeWidth={1.2} strokeLinecap="round" />
        <path d="M11,-51 L12.2,-50" stroke={SKIN_D} strokeWidth={1} />
        {gaze > 0.02 ? (
          <g>
            <Glow x={8} y={-53.5} r={4 + gaze * 8 + p.cflash * 6} c={EYE} />
            <path d={`M10,-54 L${r2(10 + 40 * gaze)},${r2(-54 - 12 * gaze)} L${r2(10 + 40 * gaze)},${r2(-54 + 14 * gaze)} Z`} fill={EYE} opacity={r2(0.25 * gaze + p.cflash * 0.35)} />
            <circle cx={8} cy={-53.5} r={1.6} fill="#fffbe0" />
          </g>
        ) : null}
        {/* front snakes */}
        {snakes.slice(0, 3).map((s) => (
          <SnakeHead key={s.i} {...s} />
        ))}
        <path d="M-4,-58 Q3,-63 10,-58" fill="none" stroke={OL} strokeWidth={3.4} strokeLinecap="round" />
        <path d="M-4,-58 Q3,-63 10,-58" fill="none" stroke={GOLD} strokeWidth={1.8} strokeLinecap="round" />
        {/* bow + front arm */}
        <Bow gx={gx} gy={gy} h={34} drawX={drawX} wood={GOLD} woodDark={GOLD_D} rot={bowRot} arrow={nocked ? { color: '#d8c8a0', tip: '#cfd6dd' } : null} />
        <Limb p={[fsh, fel, [gx, gy]]} w={3.8} c={SKIN} />
        <circle cx={gx} cy={gy} r={2.4} {...olp(SKIN_L, 1.2)} />
        {atk || anim === 'cast' ? <circle cx={r2(hand[0])} cy={r2(hand[1])} r={2.2} {...olp(SKIN_D, 1.2)} /> : null}
        {atk && p.flash > 0.05 && p.k > 0.48 ? (
          <g opacity={r2(p.flash)}>
            <line x1={gx} y1={gy} x2={gx + 30} y2={gy} stroke="#fff6c8" strokeWidth={1.5} strokeLinecap="round" />
            <line x1={gx + 4} y1={gy - 3} x2={gx + 20} y2={gy - 3} stroke="#fff6c8" strokeWidth={0.8} strokeLinecap="round" />
          </g>
        ) : null}
      </g>
    </Frame>
  );
};

function SnakeHead({ seg, x, y, ang, back }: { seg: P[]; x: number; y: number; ang: number; back?: boolean }) {
  return (
    <g>
      <Limb p={seg} w={2.4} c={back ? SNAKE_D : SNAKE} ow={2.4} />
      <ellipse cx={r2(x)} cy={r2(y)} rx={2.6} ry={1.8} transform={`rotate(${r2(ang)},${r2(x)},${r2(y)})`} {...olp(back ? SNAKE_D : SNAKE, 1.2)} />
      {back ? null : <circle cx={r2(x + Math.cos((ang * Math.PI) / 180) * 0.8)} cy={r2(y + Math.sin((ang * Math.PI) / 180) * 0.8 - 0.6)} r={0.55} fill={EYE} />}
    </g>
  );
}
