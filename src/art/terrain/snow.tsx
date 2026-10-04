// Frostbite Hollow — snowy courtyard: frosted cobblestones with a glowing ice-rune mosaic, grey stone
// walls capped with snow and icicles, snowy pine forest beyond. Ambient: drifting snowfall + torches.
import { memo } from 'react';
import type { ReactElement } from 'react';
import type { TerrainDef } from '../types.ts';
import {
  Banner,
  Bush,
  Crate,
  FLOOR,
  Flame,
  Mosaic,
  Pine,
  Rock,
  Sconce,
  Walls,
  blobPath,
  cracks,
  f1,
  flagstones,
  hash,
  particles,
  softPatch,
  speckles,
  tileGrid,
} from './kit.tsx';
import type { Leafy, WallStyle } from './kit.tsx';

const SNOW = '#eef4fa';
const PINE: Leafy = { dark: '#1d3b36', mid: '#2a5148', light: '#3d6b5c' };
const ROCK: Leafy = { dark: '#4c5663', mid: '#6b7684', light: '#8e9aa8' };
const FROST_BUSH: Leafy = { dark: '#3d5a5a', mid: '#58787a', light: '#9fc0c4' };
const WALL: WallStyle = { cap: '#8a94a0', face: '#6a7380', mortar: '#3a414b', topping: SNOW };

const SCONCES = [140, 370, 630, 860];

function Icicles() {
  const out: ReactElement[] = [];
  for (let i = 0; i < 70; i++) {
    const x = 20 + i * 14 + hash(i, 501) * 8;
    if (Math.abs(x - 500) < 44 || Math.abs(x - 250) < 22 || Math.abs(x - 750) < 22) continue;
    const l = 4 + hash(i, 502) * 11;
    out.push(<path key={i} d={`M${f1(x - 2.5)},36 L${f1(x + 2.5)},36 L${f1(x + 0.3)},${f1(36 + l)} Z`} fill="#d8ecfa" opacity={0.85} />);
  }
  return <g>{out}</g>;
}

const Ground = memo(function SnowGround() {
  const { x0, y0, x1, y1 } = FLOOR;
  const tiles = tileGrid(x0, y0, x1, y1, 58, 38, 1101, 0.22);
  const drifts: ReactElement[] = [];
  // snow drifts piled against the walls + random patches on the floor
  for (let i = 0; i < 26; i++) {
    const side = i % 4;
    const u = hash(i, 1201);
    const [cx, cy, rx, ry] =
      side === 0
        ? [x0 + u * (x1 - x0), y0 + 8, 40 + hash(i, 1202) * 50, 10 + hash(i, 1203) * 8]
        : side === 1
          ? [x0 + u * (x1 - x0), y1 - 4, 40 + hash(i, 1202) * 50, 8 + hash(i, 1203) * 6]
          : side === 2
            ? [x0 + 4, y0 + u * (y1 - y0), 14 + hash(i, 1202) * 10, 30 + hash(i, 1203) * 30]
            : [x1 - 4, y0 + u * (y1 - y0), 14 + hash(i, 1202) * 10, 30 + hash(i, 1203) * 30];
    drifts.push(softPatch(cx, cy, rx, ry, SNOW, 1300 + i * 3, 0.95, `d${i}`));
  }
  for (let i = 0; i < 22; i++) {
    const cx = 100 + hash(i, 1401) * 800;
    const cy = 110 + hash(i, 1402) * 430;
    if (Math.abs(cx - 500) < 150 && Math.abs(cy - 325) < 90) continue;
    drifts.push(softPatch(cx, cy, 16 + hash(i, 1403) * 34, 6 + hash(i, 1404) * 10, SNOW, 1500 + i * 3, 0.35 + hash(i, 1405) * 0.3, `p${i}`));
  }
  // frozen puddles
  const ice: ReactElement[] = [];
  for (let i = 0; i < 5; i++) {
    const cx = 140 + hash(i, 1601) * 720;
    const cy = 140 + hash(i, 1602) * 380;
    if (Math.abs(cx - 500) < 170 && Math.abs(cy - 325) < 100) continue;
    ice.push(
      <g key={`i${i}`}>
        <path d={blobPath(cx, cy, 26 + hash(i, 1603) * 20, 9 + hash(i, 1604) * 6, 1700 + i, 8, 0.2)} fill="#a9d4ee" opacity={0.42} />
        <path d={`M${f1(cx - 12)},${f1(cy - 3)} L${f1(cx + 4)},${f1(cy - 5)}`} stroke="#fff" strokeWidth={1.6} opacity={0.6} strokeLinecap="round" />
      </g>,
    );
  }

  // scenery outside the walls (behind the top wall, peeking around the sides and corners)
  const back: ReactElement[] = [];
  for (let i = 0; i < 26; i++) {
    const x = -20 + i * 42 + hash(i, 1801) * 20;
    back.push(<Pine key={`bp${i}`} x={x} y={70 + hash(i, 1802) * 14} s={1.05 + hash(i, 1803) * 0.3} c={PINE} snow={SNOW} seed={i} />);
  }
  const front: ReactElement[] = [];
  const sidePines: [number, number, number][] = [
    [8, 150, 0.75],
    [10, 260, 0.65],
    [6, 430, 0.8],
    [2, 610, 1.05],
    [992, 170, 0.75],
    [990, 300, 0.65],
    [994, 470, 0.8],
    [998, 612, 1.05],
  ];
  sidePines.forEach(([x, y, s], i) => front.push(<Pine key={`sp${i}`} x={x} y={y} s={s} c={PINE} snow={SNOW} seed={40 + i} />));
  const bushes: [number, number][] = [
    [120, 604],
    [330, 606],
    [610, 603],
    [800, 606],
    [930, 604],
  ];
  bushes.forEach(([x, y], i) => front.push(<Bush key={`bb${i}`} x={x} y={y} s={1.1} c={FROST_BUSH} snow={SNOW} seed={60 + i} />));
  front.push(<Rock key="r1" x={220} y={606} s={1.2} c={ROCK} snow={SNOW} seed={3} />);
  front.push(<Rock key="r2" x={700} y={604} s={1} c={ROCK} snow={SNOW} seed={4} />);

  const decor = (
    <g>
      <Icicles />
      {SCONCES.map((x) => (
        <Sconce key={`s${x}`} x={x} y={68} />
      ))}
      <Banner x={196} y={42} color="#2f5f8f" trim="#cfe6ff" emblem="diamond" />
      <Banner x={304} y={42} color="#2f5f8f" trim="#cfe6ff" emblem="diamond" />
      <Banner x={696} y={42} color="#2f5f8f" trim="#cfe6ff" emblem="diamond" />
      <Banner x={804} y={42} color="#2f5f8f" trim="#cfe6ff" emblem="diamond" />
    </g>
  );

  return (
    <g>
      <defs>
        <radialGradient id="snow-frost" cx="0.5" cy="0.5" r="0.62">
          <stop offset="0.55" stopColor="#eef4fa" stopOpacity={0} />
          <stop offset="1" stopColor="#eef4fa" stopOpacity={0.4} />
        </radialGradient>
      </defs>
      <rect x={-80} y={-80} width={1160} height={760} fill="#dfe9f2" />
      {back}
      {/* floor */}
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="#4f5a66" />
      {flagstones(tiles, ['#77838f', '#717d8a', '#7c8692', '#748090', '#7d8590'], 0.06, 'sf', { gap: 1.5, rx: 4, hi: 0.09, lo: 0.12 })}
      {/* large-scale light variation */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={`lv${i}`} d={blobPath(150 + hash(i, 1950) * 700, 140 + hash(i, 1951) * 380, 120 + hash(i, 1952) * 90, 60 + hash(i, 1953) * 50, 1960 + i, 9, 0.3)} fill={i % 2 ? '#000' : '#cfe3f5'} opacity={0.07} />
      ))}
      {speckles(220, [x0, y0, x1, y1], 1980, ['#ffffff', '#e4eef8'], 0.6, 1.8, 0.55, 'sd')}
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="url(#snow-frost)" />
      {cracks(x0, y0, x1, y1, 26, 1901, '#2a3038', 0.4)}
      {drifts}
      {ice}
      <Mosaic cx={500} cy={325} r={118} stone="#8794a3" inlay="#8fd8ff" rim="#5d6977" mortar="#353d47" seed={11} glyph="rune" />
      <Walls st={WALL} seed={17} faceDecor={decor} />
      {front}
    </g>
  );
});

const Ambient = ({ t }: { t: number }) => {
  const flakes = particles(54, t, 77, { vy: 34, vx: -10, sway: 14, swayHz: 0.9, speedVar: 0.9 });
  return (
    <g pointerEvents="none">
      {/* faint glow of the central rune */}
      <ellipse cx={500} cy={325} rx={f1(70 + 6 * Math.sin(t * 1.3))} ry={f1(42 + 4 * Math.sin(t * 1.3))} fill="#8fd8ff" opacity={f1((0.08 + 0.03 * Math.sin(t * 1.3)) * 1000) / 1000} />
      {SCONCES.map((x, i) => (
        <Flame key={`f${i}`} x={x} y={54} t={t} seed={i + 1} s={0.9} />
      ))}
      <Flame x={34} y={20} t={t} seed={7} color="#7fd0ff" core="#ffffff" />
      <Flame x={966} y={20} t={t} seed={8} color="#7fd0ff" core="#ffffff" />
      {flakes.map((p) => (
        <circle key={p.i} cx={f1(p.x)} cy={f1(p.y)} r={f1(0.8 + p.k * 1.6)} fill="#fff" opacity={f1((0.45 + p.k * 0.35) * 100) / 100} />
      ))}
    </g>
  );
};

export const snowTerrain: TerrainDef = {
  id: 'snow',
  name: 'Frostbite Hollow',
  accent: '#8fd8ff',
  Ground,
  Ambient,
};
