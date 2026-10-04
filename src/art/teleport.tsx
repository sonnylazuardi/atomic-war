// Dota town-portal teleport, drawn at a unit's feet in ARENA coordinates. Pure function of t.
//   dir 'out': a swirling rune ring opens at the feet, a light column rises, sparks spiral upward,
//              the column narrows and shoots up (the world fades the unit sprite meanwhile).
//   dir 'in' : a column of light descends from above, the ring spins and contracts, a flash lands.
// Tinted by team: left = cyan/green-blue, right = orange/red, always with a white-hot core.
import type { FC, ReactElement } from 'react';
import type { Team } from '../core/types.ts';
import type { TeleportFxProps } from './types.ts';
import { bump, clamp01, easeIn, easeOut } from './types.ts';

const PAL: Record<Team, { main: string; accent: string; deep: string }> = {
  left: { main: '#6fdcff', accent: '#86ffcc', deep: '#1f7fb0' },
  right: { main: '#ffa070', accent: '#ffd27a', deep: '#b0402a' },
};

const r1 = (v: number) => Math.round(v * 10) / 10;
const r2 = (v: number) => Math.round(v * 100) / 100;
const fract = (v: number) => v - Math.floor(v);
const hash = (i: number, s: number) => fract(Math.sin(i * 127.1 + s * 311.7) * 43758.5453);

const COL_H = 150; // column height
const SPARKS = 16;

export const TeleportFx: FC<TeleportFxProps> = ({ t, duration, x, y, team, dir }) => {
  if (!(duration > 0) || t < 0 || t > duration) return null;
  const k = clamp01(t / duration);
  const p = PAL[team];
  const out = dir === 'out';

  // ---- timing curves (0..1)
  // ring radius & alpha
  const ringR = out ? 14 + 26 * easeOut(k / 0.35) - 30 * easeIn((k - 0.75) / 0.25) : 40 * (1 - easeIn((k - 0.35) / 0.65)) + 6 * easeOut(k / 0.2);
  const ringA = out ? clamp01(k / 0.12) * (1 - clamp01((k - 0.85) / 0.15)) : clamp01(k / 0.15) * (1 - clamp01((k - 0.9) / 0.1));
  // column: height above ground (top end) and bottom end, width, alpha
  let colTop: number;
  let colBot: number;
  let colW: number;
  if (out) {
    colTop = y - COL_H * easeOut(k / 0.4) - 160 * easeIn((k - 0.7) / 0.3);
    colBot = y - 150 * easeIn((k - 0.72) / 0.28);
    colW = 30 * clamp01(k / 0.25) * (1 - 0.75 * clamp01((k - 0.6) / 0.4));
  } else {
    colTop = y - COL_H - 200 * (1 - easeOut(k / 0.35));
    colBot = y - (COL_H + 40) * (1 - easeOut(k / 0.45));
    colW = 8 + 22 * clamp01((k - 0.2) / 0.35) - 26 * easeIn((k - 0.75) / 0.25);
  }
  colW = Math.max(0, colW);
  const colA = out ? clamp01(k / 0.15) * (1 - clamp01((k - 0.88) / 0.12)) : clamp01(k / 0.1) * (1 - clamp01((k - 0.92) / 0.08));
  const spin = t * 260 * (out ? 1 : -1);
  const pulse = 0.85 + 0.15 * Math.sin(t * 22);
  const gid = `tpcol-${team}`;

  // ---- sparks spiralling (up for out, down for in)
  const sparks: ReactElement[] = [];
  for (let i = 0; i < SPARKS; i++) {
    const off = hash(i, 1);
    const life = fract(k * 1.8 + off);
    const u = out ? life : 1 - life;
    const vis = bump(life) * ringA;
    if (vis < 0.03) continue;
    const ang = off * Math.PI * 2 + t * (5 + hash(i, 2) * 3) * (out ? 1 : -1);
    const rad = (ringR + 4) * (1 - u * 0.6);
    const sx = x + Math.cos(ang) * rad;
    const sy = y + Math.sin(ang) * rad * 0.38 - u * (COL_H * 0.9);
    const front = Math.sin(ang) > 0;
    sparks.push(
      <circle key={i} cx={r1(sx)} cy={r1(sy)} r={r1(1.2 + hash(i, 3) * 1.8)} fill={i % 3 === 0 ? p.accent : front ? '#ffffff' : p.main} opacity={r2(vis)} />,
    );
  }

  // ---- runes on the ring
  const runes: ReactElement[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + (spin * Math.PI) / 180 * 0.5;
    const rx = ringR * 0.8;
    runes.push(
      <rect key={i} x={r1(x + Math.cos(a) * rx - 1.5)} y={r1(y + Math.sin(a) * rx * 0.38 - 1.5)} width={3} height={3} fill={p.accent} opacity={r2(ringA * 0.9)} transform={`rotate(45,${r1(x + Math.cos(a) * rx)},${r1(y + Math.sin(a) * rx * 0.38)})`} />,
    );
  }

  // ---- landing / departure flash
  const flashK = out ? clamp01((k - 0.7) / 0.18) : clamp01((k - 0.78) / 0.2);
  const flash = bump(flashK);
  const circ = 2 * Math.PI * Math.max(ringR, 0.1);

  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.main} stopOpacity={0} />
          <stop offset="0.45" stopColor={p.main} stopOpacity={0.55} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0.95} />
        </linearGradient>
      </defs>
      {ringR > 0.5 && (
        <g opacity={r2(ringA)}>
          {/* ground glow */}
          <ellipse cx={x} cy={y} rx={r1(ringR * 1.5)} ry={r1(ringR * 0.55)} fill={p.main} opacity={0.18} />
          <ellipse cx={x} cy={y} rx={r1(ringR)} ry={r1(ringR * 0.38)} fill={p.deep} opacity={0.35} />
          {/* outer ring + counter-rotating dashed rings (dash offset = spin) */}
          <ellipse cx={x} cy={y} rx={r1(ringR)} ry={r1(ringR * 0.38)} fill="none" stroke={p.main} strokeWidth={3} opacity={r2(pulse)} />
          <ellipse cx={x} cy={y} rx={r1(ringR * 1.15)} ry={r1(ringR * 0.44)} fill="none" stroke={p.accent} strokeWidth={1.5} strokeDasharray={`${r1(circ * 0.06)} ${r1(circ * 0.05)}`} strokeDashoffset={r1((spin / 360) * circ)} />
          <ellipse cx={x} cy={y} rx={r1(ringR * 0.62)} ry={r1(ringR * 0.24)} fill="none" stroke="#ffffff" strokeWidth={1.6} strokeDasharray={`${r1(circ * 0.1)} ${r1(circ * 0.06)}`} strokeDashoffset={r1((-spin / 360) * circ * 0.8)} opacity={0.85} />
          {runes}
        </g>
      )}
      {colW > 0.3 && colA > 0.01 && colBot > colTop && (
        <g opacity={r2(colA)}>
          <rect x={r1(x - colW * 1.1)} y={r1(colTop)} width={r1(colW * 2.2)} height={r1(colBot - colTop)} fill={`url(#${gid})`} opacity={0.35} />
          <rect x={r1(x - colW / 2)} y={r1(colTop)} width={r1(colW)} height={r1(colBot - colTop)} fill={`url(#${gid})`} />
          <rect x={r1(x - colW * 0.18)} y={r1(colTop)} width={r1(colW * 0.36)} height={r1(colBot - colTop)} fill={`url(#${gid})`} opacity={r2(pulse)} />
          {colBot > y - 4 && <ellipse cx={x} cy={y} rx={r1(colW * 0.75)} ry={r1(colW * 0.28)} fill="#ffffff" opacity={0.8} />}
        </g>
      )}
      {sparks}
      {flash > 0.01 && (
        <g opacity={r2(flash)}>
          <ellipse cx={x} cy={r1(y - (out ? 50 : 30))} rx={r1(26 + 30 * flashK)} ry={r1(40 + 26 * flashK)} fill={p.main} opacity={0.35} />
          <ellipse cx={x} cy={r1(y - (out ? 50 : 30))} rx={r1(10 + 12 * flashK)} ry={r1(22 + 14 * flashK)} fill="#ffffff" opacity={0.8} />
          {!out && <ellipse cx={x} cy={y} rx={r1(20 + 50 * flashK)} ry={r1(8 + 18 * flashK)} fill="none" stroke="#ffffff" strokeWidth={2} />}
        </g>
      )}
    </g>
  );
};
