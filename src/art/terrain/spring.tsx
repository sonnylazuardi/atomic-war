// Blossom Vale — spring courtyard: lush grass with wildflowers, a flagstone path ring around a
// flower mosaic, mossy low stone walls, cherry blossoms and green trees beyond. Ambient: drifting
// petals, butterflies and lanterns.
import { memo } from 'react';
import type { ReactElement } from 'react';
import type { TerrainDef } from '../types.ts';
import {
  Banner,
  Bush,
  FLOOR,
  Flame,
  Mosaic,
  Rock,
  Sconce,
  Tree,
  Walls,
  blobPath,
  f1,
  flagstones,
  grassTufts,
  hash,
  leafPath,
  leafPile,
  particles,
  pick,
  speckles,
} from './kit.tsx';
import type { FloorTile, Leafy, WallStyle } from './kit.tsx';

const BLOSSOM: Leafy = { dark: '#c8608a', mid: '#e58fb0', light: '#f8c4d8' };
const GREEN: Leafy = { dark: '#2f5e2a', mid: '#467e34', light: '#6ea446' };
const LIME: Leafy = { dark: '#3c6a24', mid: '#5e9232', light: '#8cc04c' };
const ROCK: Leafy = { dark: '#5a5e58', mid: '#7c8078', light: '#a0a498' };
const WALL: WallStyle = { cap: '#a39e8e', face: '#86806f', mortar: '#4a473e', topping: '#5f8f36' };
const FLOWERS = ['#ffffff', '#ffe066', '#ff9ec4', '#c79bff', '#ff8a5c'];
const PETALS = ['#f8c4d8', '#f4a6c4', '#ffe0ec', '#ffffff'];

const SCONCES = [140, 370, 630, 860];

/** stepping-stone tiles along a path ring + spokes (perspective ellipse) */
function pathTiles(): FloorTile[] {
  const out: FloorTile[] = [];
  // ring
  const n = 34;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = 500 + Math.cos(a) * 172;
    const y = 325 + Math.sin(a) * 108;
    out.push({ x: x - 13, y: y - 9, w: 26, h: 18, r: hash(i, 3001) });
  }
  // spokes: to the gate (top), left and right, bottom
  const spokes: [number, number, number, number, number][] = [
    [500, 214, 500, 92, 6],
    [500, 436, 500, 556, 6],
    [326, 325, 66, 325, 11],
    [674, 325, 934, 325, 11],
  ];
  spokes.forEach(([ax, ay, bx, by, m], si) => {
    for (let k = 0; k <= m; k++) {
      const u = k / m;
      const x = ax + (bx - ax) * u + (hash(k, 3010 + si) - 0.5) * 8;
      const y = ay + (by - ay) * u + (hash(k, 3020 + si) - 0.5) * 6;
      out.push({ x: x - 14, y: y - 9, w: 28, h: 18, r: hash(k, 3030 + si) });
    }
  });
  return out;
}

const Ground = memo(function SpringGround() {
  const { x0, y0, x1, y1 } = FLOOR;
  const floor: [number, number, number, number] = [x0, y0 + 4, x1, y1];

  // grass shading patches
  const patches: ReactElement[] = [];
  for (let i = 0; i < 18; i++) {
    const cx = x0 + hash(i, 3101) * (x1 - x0);
    const cy = y0 + hash(i, 3102) * (y1 - y0);
    patches.push(<path key={`gp${i}`} d={blobPath(cx, cy, 50 + hash(i, 3103) * 90, 26 + hash(i, 3104) * 40, 3110 + i, 10, 0.3)} fill={i % 3 ? '#6c9a40' : '#3f6a2a'} opacity={0.35} />);
  }
  // flower clusters
  const flowers: ReactElement[] = [];
  for (let c = 0; c < 26; c++) {
    const cx = x0 + 20 + hash(c, 3201) * (x1 - x0 - 40);
    const cy = y0 + 16 + hash(c, 3202) * (y1 - y0 - 30);
    if (Math.abs(cx - 500) < 200 && Math.abs(cy - 325) < 125) continue;
    const col = pick(hash(c, 3203), FLOWERS);
    for (let i = 0; i < 9; i++) {
      const x = cx + (hash(i, 3210 + c) - 0.5) * 40;
      const y = cy + (hash(i, 3240 + c) - 0.5) * 18;
      flowers.push(
        <g key={`fl${c}-${i}`}>
          <circle cx={f1(x)} cy={f1(y)} r={2.1} fill={col} />
          <circle cx={f1(x)} cy={f1(y)} r={0.8} fill={col === '#ffe066' ? '#c87a1a' : '#ffe066'} />
        </g>,
      );
    }
  }
  const path = pathTiles();

  // scenery beyond the walls
  const back: ReactElement[] = [];
  for (let i = 0; i < 24; i++) {
    const x = -10 + i * 44 + hash(i, 3501) * 18;
    const blossom = i % 3 !== 1;
    back.push(<Tree key={`bt${i}`} x={x} y={62 + hash(i, 3502) * 14} s={0.95 + hash(i, 3503) * 0.3} c={blossom ? BLOSSOM : GREEN} seed={i * 5 + 3} trunk="#4a3020" fruit={blossom ? undefined : '#ffd84a'} />);
  }
  const front: ReactElement[] = [];
  (
    [
      [6, 160, 0.6, BLOSSOM],
      [8, 420, 0.65, GREEN],
      [2, 612, 0.9, BLOSSOM],
      [994, 200, 0.6, GREEN],
      [992, 460, 0.65, BLOSSOM],
      [998, 612, 0.9, BLOSSOM],
    ] as const
  ).forEach(([x, y, s, c], i) => front.push(<Tree key={`st${i}`} x={x} y={y} s={s} c={c} seed={90 + i * 5} trunk="#4a3020" />));
  [
    [130, 604],
    [330, 606],
    [640, 603],
    [870, 606],
  ].forEach(([x, y], i) => front.push(<Bush key={`bb${i}`} x={x!} y={y!} s={1.05} c={LIME} seed={130 + i * 4} flowers={pick(hash(i, 3601), FLOWERS)} />));
  front.push(<Rock key="r1" x={240} y={606} s={1.05} c={ROCK} seed={8} moss="#6c9a40" />);
  front.push(<Rock key="r2" x={760} y={604} s={0.9} c={ROCK} seed={9} moss="#6c9a40" />);

  const decor = (
    <g>
      {SCONCES.map((x) => (
        <Sconce key={`s${x}`} x={x} y={68} />
      ))}
      <Banner x={196} y={40} color="#3d7a3a" trim="#f8c4d8" emblem="circle" />
      <Banner x={304} y={40} color="#3d7a3a" trim="#f8c4d8" emblem="circle" />
      <Banner x={696} y={40} color="#3d7a3a" trim="#f8c4d8" emblem="circle" />
      <Banner x={804} y={40} color="#3d7a3a" trim="#f8c4d8" emblem="circle" />
      {/* climbing roses / ivy on the wall face */}
      {[90, 420, 580, 905].map((x, i) => (
        <g key={`iv${i}`}>
          {leafPile(x, 46, 28, 10, 60, 3700 + i * 9, ['#2f5e2a', '#467e34', '#6ea446'], 4, `iv${i}a`)}
          {leafPile(x + (i % 2 ? 6 : -6), 64, 12, 15, 34, 3800 + i * 9, ['#2f5e2a', '#467e34'], 3.6, `iv${i}b`)}
          {leafPile(x, 52, 24, 14, 10, 3900 + i * 9, ['#ff9ec4', '#ffffff'], 2.4, `iv${i}c`)}
        </g>
      ))}
    </g>
  );

  return (
    <g>
      <defs>
        <radialGradient id="spring-light" cx="0.5" cy="0.45" r="0.65">
          <stop offset="0" stopColor="#fff6c8" stopOpacity={0.1} />
          <stop offset="0.6" stopColor="#fff6c8" stopOpacity={0} />
          <stop offset="1" stopColor="#14300c" stopOpacity={0.28} />
        </radialGradient>
      </defs>
      <rect x={-80} y={-80} width={1160} height={760} fill="#3d6a2a" />
      {back}
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="#557f37" />
      {patches}
      {speckles(260, floor, 3301, ['#3f6a2a', '#7aa84a', '#4a7530'], 1, 3, 0.55, 'gs')}
      {grassTufts(520, floor, 3401, ['#466f2c', '#6c9a40', '#7fae4c', '#3c6326'], 'gt')}
      {/* path */}
      {path.map((t, i) => (
        <ellipse key={`ps${i}`} cx={f1(t.x + t.w / 2 + 1)} cy={f1(t.y + t.h / 2 + 2)} rx={f1(t.w / 2)} ry={f1(t.h / 2)} fill="#000" opacity={0.2} />
      ))}
      {flagstones(path, ['#a6a08e', '#9a9483', '#aea896'], 0.06, 'pt', { gap: 1, rx: 8, hi: 0.15, lo: 0.15 })}
      {flowers}
      <Mosaic cx={500} cy={325} r={118} stone="#b0a894" inlay="#e86a9a" rim="#8a8472" mortar="#5a5648" seed={31} glyph="flower" />
      {leafPile(500, 325, 150, 95, 30, 3950, PETALS, 2.6, 'fp')}
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="url(#spring-light)" />
      <Walls st={WALL} seed={37} faceDecor={decor} />
      {front}
    </g>
  );
});

const Ambient = ({ t }: { t: number }) => {
  const petals = particles(34, t, 3777, { vy: 22, vx: 26, sway: 20, swayHz: 1.2, speedVar: 0.8 });
  const flies: ReactElement[] = [];
  for (let i = 0; i < 6; i++) {
    const ph = hash(i, 3880) * 100;
    const cx = 120 + hash(i, 3881) * 760;
    const cy = 130 + hash(i, 3882) * 380;
    const x = cx + Math.sin(t * 0.37 + ph) * 90 + Math.sin(t * 1.1 + ph * 2) * 18;
    const y = cy + Math.sin(t * 0.53 + ph * 1.3) * 50 + Math.cos(t * 1.7 + ph) * 8 - 30;
    const dx = Math.cos(t * 0.37 + ph) * 0.37 * 90;
    const flap = 0.25 + Math.abs(Math.sin(t * 16 + ph));
    const col = pick(hash(i, 3883), ['#ffd84a', '#ff9ec4', '#9fd8ff', '#ffffff', '#ffa64a']);
    flies.push(
      <g key={`b${i}`} transform={`translate(${f1(x)},${f1(y)}) scale(${dx < 0 ? -1 : 1},1)`}>
        <ellipse cx={0} cy={34} rx={5} ry={1.6} fill="#000" opacity={0.12} />
        <g transform={`scale(${f1(flap * 100) / 100},1)`}>
          <path d="M0,0 Q-8,-9 -9,-2 Q-7,3 0,0 Z M0,0 Q8,-9 9,-2 Q7,3 0,0 Z" fill={col} />
          <path d="M0,0 Q-6,6 -4,8 Q-1,6 0,0 Z M0,0 Q6,6 4,8 Q1,6 0,0 Z" fill={col} opacity={0.8} />
        </g>
        <rect x={-0.8} y={-3} width={1.6} height={7} rx={0.8} fill="#2a1a10" />
      </g>,
    );
  }
  return (
    <g pointerEvents="none">
      {SCONCES.map((x, i) => (
        <Flame key={`f${i}`} x={x} y={54} t={t} seed={i + 1} s={0.85} />
      ))}
      <Flame x={34} y={20} t={t} seed={7} />
      <Flame x={966} y={20} t={t} seed={8} />
      {petals.map((p) => {
        const rot = (p.ph * 57 + t * (60 + p.r * 120) * (p.i % 2 ? 1 : -1)) % 360;
        const flip = Math.cos(t * (2.2 + p.r * 2) + p.ph);
        return (
          <path
            key={p.i}
            d={leafPath(2.2 + p.k * 1.6)}
            transform={`translate(${f1(p.x)},${f1(p.y)}) rotate(${f1(rot)}) scale(1,${f1(0.35 + Math.abs(flip) * 0.65)})`}
            fill={PETALS[p.i % PETALS.length]}
            opacity={0.9}
          />
        );
      })}
      {flies}
    </g>
  );
};

export const springTerrain: TerrainDef = {
  id: 'spring',
  name: 'Blossom Vale',
  accent: '#f08fb4',
  Ground,
  Ambient,
};
