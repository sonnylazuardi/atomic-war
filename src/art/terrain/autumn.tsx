// Amberleaf Grove — autumn courtyard: leaf-strewn flagstones with moss, a wooden palisade on stone
// pillars, blazing orange/red forest beyond, leaf piles, pumpkins and lanterns. Ambient: falling
// leaves tumbling in the wind + torch flicker.
import { memo } from 'react';
import type { ReactElement } from 'react';
import type { TerrainDef } from '../types.ts';
import {
  Banner,
  Barrel,
  Bush,
  FLOOR,
  Flame,
  Mosaic,
  Rock,
  Sconce,
  Tree,
  Walls,
  blobPath,
  cracks,
  f1,
  flagstones,
  hash,
  leafPath,
  leafPile,
  particles,
  pick,
  softPatch,
  speckles,
  tileGrid,
} from './kit.tsx';
import type { Leafy, WallStyle } from './kit.tsx';

const LEAF_COLORS = ['#d9622b', '#e8902f', '#b8382a', '#f0b43c', '#9c4a22'];
const TREES: Leafy[] = [
  { dark: '#8a2a1c', mid: '#b8432a', light: '#e0703a' },
  { dark: '#a14f16', mid: '#d97a22', light: '#f2a83a' },
  { dark: '#8c6a14', mid: '#c49a22', light: '#ecc84a' },
  { dark: '#6e2a1e', mid: '#963826', light: '#c4532e' },
];
const ROCK: Leafy = { dark: '#4f4a44', mid: '#6e665c', light: '#8f8678' };
const BUSH: Leafy = { dark: '#5e3a1c', mid: '#8a5424', light: '#b8782e' };
const WALL: WallStyle = { cap: '#7a5634', face: '#6b4a2b', mortar: '#2e1f14', kind: 'wood' };
const PILLAR: WallStyle = { cap: '#8d8578', face: '#6f685e', mortar: '#3a3530', topping: '#c4632a' };

const SCONCES = [140, 370, 630, 860];

function Pumpkin({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={2} cy={1} rx={13} ry={4} fill="#000" opacity={0.3} />
      <ellipse cx={-5} cy={-8} rx={7} ry={8} fill="#c4561c" />
      <ellipse cx={5} cy={-8} rx={7} ry={8} fill="#c4561c" />
      <ellipse cx={0} cy={-8} rx={7} ry={9} fill="#e0702a" />
      <ellipse cx={-2} cy={-11} rx={2.5} ry={4} fill="#f39a4a" opacity={0.7} />
      <path d="M0,-16 Q1,-21 4,-22" stroke="#4a5a22" strokeWidth={2.5} fill="none" strokeLinecap="round" />
    </g>
  );
}

const Ground = memo(function AutumnGround() {
  const { x0, y0, x1, y1 } = FLOOR;
  const tiles = tileGrid(x0, y0, x1, y1, 62, 40, 2101, 0.24);

  // scattered fallen leaves
  const leaves: ReactElement[] = [];
  for (let i = 0; i < 260; i++) {
    // denser near the walls
    const edge = hash(i, 2201) < 0.45;
    let x = x0 + hash(i, 2202) * (x1 - x0);
    let y = y0 + hash(i, 2203) * (y1 - y0);
    if (edge) {
      const side = Math.floor(hash(i, 2204) * 4);
      const d = hash(i, 2205) ** 2 * 50;
      if (side === 0) y = y0 + 4 + d;
      else if (side === 1) y = y1 - 4 - d;
      else if (side === 2) x = x0 + 4 + d;
      else x = x1 - 4 - d;
    }
    const l = 3 + hash(i, 2206) * 2.5;
    leaves.push(<path key={`l${i}`} d={leafPath(l)} transform={`translate(${f1(x)},${f1(y)}) rotate(${Math.round(hash(i, 2207) * 360)})`} fill={pick(hash(i, 2208), LEAF_COLORS)} opacity={0.75 + hash(i, 2209) * 0.25} />);
  }
  // leaf piles + moss
  const piles: ReactElement[] = [];
  const pileSpots: [number, number, number, number][] = [
    [90, 100, 50, 14],
    [300, 96, 60, 12],
    [690, 98, 64, 13],
    [905, 104, 46, 16],
    [70, 300, 18, 46],
    [930, 380, 18, 50],
    [180, 552, 70, 12],
    [560, 554, 80, 11],
    [850, 550, 60, 13],
  ];
  pileSpots.forEach(([cx, cy, rx, ry], i) => {
    piles.push(<path key={`ps${i}`} d={blobPath(cx, cy + 2, rx * 0.9, ry * 0.9, 2340 + i, 9, 0.25)} fill="#000" opacity={0.15} />);
    piles.push(<path key={`pb${i}`} d={blobPath(cx, cy, rx * 0.7, ry * 0.7, 2350 + i, 9, 0.25)} fill="#8a3a1a" opacity={0.9} />);
    piles.push(...leafPile(cx, cy, rx, ry, Math.round((rx * ry) / 3.5), 2310 + i * 7, LEAF_COLORS, 5, `pl${i}-`));
  });
  for (let i = 0; i < 14; i++) {
    const cx = 90 + hash(i, 2401) * 820;
    const cy = 110 + hash(i, 2402) * 420;
    piles.push(<path key={`m${i}`} d={blobPath(cx, cy, 20 + hash(i, 2403) * 30, 7 + hash(i, 2404) * 8, 2410 + i, 9, 0.3)} fill="#5f6a2a" opacity={0.22} />);
  }

  // forest beyond the walls
  const back: ReactElement[] = [];
  for (let i = 0; i < 24; i++) {
    const x = -10 + i * 44 + hash(i, 2501) * 18;
    back.push(<Tree key={`bt${i}`} x={x} y={62 + hash(i, 2502) * 14} s={0.95 + hash(i, 2503) * 0.3} c={TREES[i % TREES.length]!} seed={i * 5} trunk="#3e2a1a" />);
  }
  const front: ReactElement[] = [];
  const side: [number, number, number][] = [
    [6, 160, 0.6],
    [8, 420, 0.65],
    [2, 612, 0.9],
    [994, 200, 0.6],
    [992, 460, 0.65],
    [998, 612, 0.9],
  ];
  side.forEach(([x, y, s], i) => front.push(<Tree key={`st${i}`} x={x} y={y} s={s} c={TREES[(i + 1) % TREES.length]!} seed={80 + i * 5} trunk="#3e2a1a" />));
  [
    [130, 604],
    [420, 606],
    [640, 603],
    [870, 606],
  ].forEach(([x, y], i) => front.push(<Bush key={`bb${i}`} x={x!} y={y!} s={1.05} c={BUSH} seed={120 + i * 4} />));
  front.push(<Rock key="r1" x={270} y={606} s={1.1} c={ROCK} seed={5} moss="#6e7a2c" />);
  front.push(<Pumpkin key="pk1" x={760} y={600} s={1.1} />);
  front.push(<Pumpkin key="pk2" x={784} y={604} s={0.8} />);

  const decor = (
    <g>
      {SCONCES.map((x) => (
        <Sconce key={`s${x}`} x={x} y={68} />
      ))}
      <Banner x={196} y={40} color="#8a2a1c" trim="#f0b43c" emblem="leaf" />
      <Banner x={304} y={40} color="#8a2a1c" trim="#f0b43c" emblem="leaf" />
      <Banner x={696} y={40} color="#8a2a1c" trim="#f0b43c" emblem="leaf" />
      <Banner x={804} y={40} color="#8a2a1c" trim="#f0b43c" emblem="leaf" />
      {/* ivy on the palisade */}
      {[90, 420, 580, 905].map((x, i) => (
        <g key={`iv${i}`}>
          {leafPile(x, 46, 28, 10, 70, 2600 + i * 9, ['#8a2a1c', '#b8432a', '#d9622b'], 4, `iv${i}a`)}
          {leafPile(x + (i % 2 ? 6 : -6), 64, 13, 15, 40, 2700 + i * 9, ['#8a2a1c', '#b8432a', '#e8902f'], 3.6, `iv${i}b`)}
        </g>
      ))}
    </g>
  );

  return (
    <g>
      <defs>
        <radialGradient id="autumn-warm" cx="0.5" cy="0.5" r="0.65">
          <stop offset="0.5" stopColor="#3a1a08" stopOpacity={0} />
          <stop offset="1" stopColor="#3a1a08" stopOpacity={0.3} />
        </radialGradient>
      </defs>
      <rect x={-80} y={-80} width={1160} height={760} fill="#5a3a1e" />
      {back}
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="#4d4236" />
      {flagstones(tiles, ['#8a7b66', '#827360', '#8f806a', '#7e705c', '#8d7d6c'], 0.06, 'af', { gap: 1.6, rx: 4, hi: 0.08, lo: 0.13 })}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={`lv${i}`} d={blobPath(150 + hash(i, 2950) * 700, 140 + hash(i, 2951) * 380, 120 + hash(i, 2952) * 90, 60 + hash(i, 2953) * 50, 2960 + i, 9, 0.3)} fill={i % 2 ? '#000' : '#f2c27a'} opacity={0.06} />
      ))}
      {cracks(x0, y0, x1, y1, 24, 2901, '#2e261c', 0.4)}
      {speckles(120, [x0, y0, x1, y1], 2980, ['#3c3226', '#9a8a70'], 0.8, 2, 0.4, 'ad')}
      {piles}
      <Mosaic cx={500} cy={325} r={118} stone="#93846e" inlay="#f0a03a" rim="#6e604e" mortar="#3a3026" seed={21} glyph="leaf" />
      {leaves}
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="url(#autumn-warm)" />
      <Walls st={WALL} pillar={PILLAR} seed={27} faceDecor={decor} />
      <Barrel x={30} y={606} s={0.9} wood="#7a5030" />
      {front}
    </g>
  );
});

const Ambient = ({ t }: { t: number }) => {
  const falling = particles(36, t, 2777, { vy: 30, vx: 22, sway: 26, swayHz: 1.4, speedVar: 0.8 });
  return (
    <g pointerEvents="none">
      {SCONCES.map((x, i) => (
        <Flame key={`f${i}`} x={x} y={54} t={t} seed={i + 1} s={0.9} />
      ))}
      <Flame x={34} y={20} t={t} seed={7} />
      <Flame x={966} y={20} t={t} seed={8} />
      {falling.map((p) => {
        const rot = (p.ph * 57 + t * (90 + p.r * 160) * (p.i % 2 ? 1 : -1)) % 360;
        const flip = Math.cos(t * (2 + p.r * 2) + p.ph); // tumbling: squash in one axis
        return (
          <path
            key={p.i}
            d={leafPath(3 + p.k * 2.5)}
            transform={`translate(${f1(p.x)},${f1(p.y)}) rotate(${f1(rot)}) scale(1,${f1(0.25 + Math.abs(flip) * 0.75)})`}
            fill={LEAF_COLORS[p.i % LEAF_COLORS.length]}
            opacity={0.9}
          />
        );
      })}
    </g>
  );
};

export const autumnTerrain: TerrainDef = {
  id: 'autumn',
  name: 'Amberleaf Grove',
  accent: '#e8902f',
  Ground,
  Ambient,
};
