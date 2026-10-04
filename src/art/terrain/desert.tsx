// Sunscorch Ruins — desert courtyard: cracked sandstone tiles half buried in drifting sand, a
// turquoise sun mosaic, crumbling sandstone walls with broken pillars, palms, cacti and dunes beyond.
// Ambient: wind-blown sand wisps, dust motes, heat shimmer and braziers.
import { memo } from 'react';
import type { ReactElement } from 'react';
import type { TerrainDef } from '../types.ts';
import {
  Banner,
  Barrel,
  Cactus,
  Crate,
  FLOOR,
  FallenColumn,
  Flame,
  Mosaic,
  Palm,
  Rock,
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

const SAND = '#e2c690';
const ROCK: Leafy = { dark: '#8a6440', mid: '#b08456', light: '#d2a978' };
const STONE: Leafy = { dark: '#9a7a52', mid: '#c4a274', light: '#e2c79a' };
const WALL: WallStyle = { cap: '#cfae7c', face: '#b08a5c', mortar: '#6a5032', topping: SAND };

/** braziers on top of the top wall pillars + corner towers */
const FIRES: [number, number][] = [
  [34, 20],
  [966, 20],
  [140, 58],
  [370, 58],
  [630, 58],
  [860, 58],
];

/** wall-mounted bowl (static) for the desert fires */
function Bowl({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <path d="M-2,4 L2,4 L1,16 L-1,16 Z" fill="#5a4026" />
      <path d="M-9,-2 L9,-2 L6,5 L-6,5 Z" fill="#7a5a34" />
      <rect x={-10} y={-3} width={20} height={2.5} rx={1} fill="#a07a48" />
      <ellipse cx={0} cy={-2} rx={8} ry={2} fill="#2a1408" />
    </g>
  );
}

const Ground = memo(function DesertGround() {
  const { x0, y0, x1, y1 } = FLOOR;
  const tiles = tileGrid(x0, y0, x1, y1, 66, 44, 4101, 0.2);

  // sand drifts burying the tiles: big ones at the walls, swirls across the floor
  const sand: ReactElement[] = [];
  for (let i = 0; i < 24; i++) {
    const side = i % 4;
    const u = hash(i, 4201);
    const [cx, cy, rx, ry] =
      side === 0
        ? [x0 + u * (x1 - x0), y0 + 10, 50 + hash(i, 4202) * 60, 14 + hash(i, 4203) * 10]
        : side === 1
          ? [x0 + u * (x1 - x0), y1 - 6, 50 + hash(i, 4202) * 60, 10 + hash(i, 4203) * 8]
          : side === 2
            ? [x0 + 6, y0 + u * (y1 - y0), 18 + hash(i, 4202) * 14, 36 + hash(i, 4203) * 30]
            : [x1 - 6, y0 + u * (y1 - y0), 18 + hash(i, 4202) * 14, 36 + hash(i, 4203) * 30];
    sand.push(softPatch(cx, cy, rx, ry, SAND, 4300 + i * 3, 0.95, `sd${i}`));
  }
  for (let i = 0; i < 18; i++) {
    const cx = 100 + hash(i, 4401) * 800;
    const cy = 110 + hash(i, 4402) * 430;
    if (Math.abs(cx - 500) < 150 && Math.abs(cy - 325) < 90) continue;
    sand.push(softPatch(cx, cy, 30 + hash(i, 4403) * 60, 8 + hash(i, 4404) * 12, SAND, 4500 + i * 3, 0.45 + hash(i, 4405) * 0.3, `sp${i}`));
  }
  // wind ripples in the sand drifts
  const ripples: ReactElement[] = [];
  for (let i = 0; i < 40; i++) {
    const x = x0 + hash(i, 4601) * (x1 - x0);
    const edge = hash(i, 4602);
    const y = edge < 0.5 ? y0 + 6 + hash(i, 4603) * 16 : y1 - 4 - hash(i, 4603) * 10;
    const w = 14 + hash(i, 4604) * 20;
    ripples.push(<path key={`rp${i}`} d={`M${f1(x - w)},${f1(y)} Q${f1(x)},${f1(y - 3)} ${f1(x + w)},${f1(y)}`} stroke="#b8945e" strokeWidth={1.2} fill="none" opacity={0.5} />);
  }

  // dunes + scenery beyond the walls
  const back: ReactElement[] = [];
  for (let i = 0; i < 10; i++) {
    const x = -40 + i * 120 + hash(i, 4701) * 40;
    back.push(<path key={`dn${i}`} d={blobPath(x, 14, 90, 26, 4710 + i, 9, 0.2)} fill={i % 2 ? '#d8b77c' : '#e8cc96'} />);
  }
  const palms = [30, 160, 330, 420, 600, 680, 840, 960];
  palms.forEach((x, i) => {
    back.push(<Palm key={`pm${i}`} x={x + hash(i, 4801) * 30} y={100 + hash(i, 4802) * 8} s={1.05 + hash(i, 4803) * 0.25} lean={(hash(i, 4804) - 0.5) * 30} />);
  });
  const front: ReactElement[] = [];
  front.push(<Cactus key="c1" x={6} y={190} s={0.8} seed={1} />);
  front.push(<Cactus key="c2" x={994} y={420} s={0.8} seed={2} />);
  front.push(<Palm key="p1" x={0} y={612} s={0.9} lean={14} />);
  front.push(<Palm key="p2" x={1000} y={614} s={0.9} lean={-14} />);
  front.push(<Rock key="r1" x={150} y={606} s={1.2} c={ROCK} seed={11} />);
  front.push(<Rock key="r2" x={560} y={604} s={1} c={ROCK} seed={12} />);
  front.push(<Cactus key="c3" x={350} y={612} s={0.75} seed={3} />);
  front.push(<Cactus key="c4" x={820} y={612} s={0.7} seed={4} />);
  front.push(<FallenColumn key="fc" x={690} y={606} s={0.9} c={STONE} rot={-4} />);
  front.push(<Crate key="cr" x={260} y={606} s={0.85} wood="#8a6238" />);
  front.push(<Barrel key="bl" x={920} y={604} s={0.85} wood="#8a6238" />);

  const decor = (
    <g>
      {FIRES.slice(2).map(([x, y]) => (
        <Bowl key={`b${x}`} x={x} y={y + 8} />
      ))}
      <Banner x={196} y={40} color="#b0452a" trim="#3ec4c0" emblem="sun" />
      <Banner x={304} y={40} color="#b0452a" trim="#3ec4c0" emblem="sun" />
      <Banner x={696} y={40} color="#b0452a" trim="#3ec4c0" emblem="sun" />
      <Banner x={804} y={40} color="#b0452a" trim="#3ec4c0" emblem="sun" />
      {/* crumbled wall gaps */}
      {[90, 580, 905].map((x, i) => (
        <g key={`cg${i}`}>
          <path d={`M${x - 22},36 L${x - 14},48 L${x - 4},42 L${x + 6},52 L${x + 18},40 L${x + 24},36 Z`} fill="#6a5032" />
          <path d={`M${x - 22},36 L${x - 14},46 L${x - 4},40 L${x + 6},50 L${x + 18},38 L${x + 24},36`} fill="none" stroke="#e2c79a" strokeWidth={1.5} opacity={0.6} />
        </g>
      ))}
    </g>
  );

  return (
    <g>
      <defs>
        <radialGradient id="desert-sun" cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#fff2c8" stopOpacity={0.12} />
          <stop offset="0.55" stopColor="#fff2c8" stopOpacity={0} />
          <stop offset="1" stopColor="#6a3a10" stopOpacity={0.25} />
        </radialGradient>
      </defs>
      <rect x={-80} y={-80} width={1160} height={760} fill="#dcbc84" />
      {back}
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="#8a6a44" />
      {flagstones(tiles, ['#c09a68', '#b8925f', '#c6a06c', '#b48c5c', '#c29862'], 0.06, 'df', { gap: 1.7, rx: 3, hi: 0.12, lo: 0.14 })}
      {cracks(x0, y0, x1, y1, 46, 4901, '#5a4026', 0.45)}
      {speckles(200, [x0, y0, x1, y1], 4980, ['#8a6a44', '#e8d0a0', '#a07a4c'], 0.7, 2, 0.5, 'dd')}
      {sand}
      {ripples}
      <Mosaic cx={500} cy={325} r={118} stone="#caa674" inlay="#2fb8b4" rim="#9a7448" mortar="#6a4e30" seed={41} glyph="sun" />
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="url(#desert-sun)" />
      <Walls st={WALL} seed={47} faceDecor={decor} brokenAt={[250, 966]} />
      {front}
    </g>
  );
});

const Ambient = ({ t }: { t: number }) => {
  // wind-blown sand wisps (long faint curves streaming right)
  const wisps = particles(14, t, 4991, { vy: 0, vx: 120, sway: 0, speedVar: 0.8, x0: -200, x1: 1200, y0: 90, y1: 560 });
  const dust = particles(34, t, 4992, { vy: -6, vx: 40, sway: 10, swayHz: 0.8, speedVar: 0.9 });
  return (
    <g pointerEvents="none">
      {/* heat shimmer: a few slow, faint horizontal bands */}
      {[0, 1, 2, 3].map((i) => {
        const y = 140 + i * 115 + Math.sin(t * 0.6 + i) * 10;
        const a = 4 + Math.sin(t * 2.3 + i * 1.7) * 3;
        return (
          <path
            key={`h${i}`}
            d={`M40,${f1(y)} Q170,${f1(y - a)} 300,${f1(y)} T560,${f1(y)} T820,${f1(y)} T1080,${f1(y)}`}
            stroke="#fff4d8"
            strokeWidth={10}
            fill="none"
            opacity={f1((0.05 + 0.03 * Math.sin(t * 1.4 + i)) * 1000) / 1000}
          />
        );
      })}
      {wisps.map((p) => {
        const len = 60 + p.r * 90;
        const wav = Math.sin(t * 2 + p.ph) * 6;
        return (
          <path
            key={`w${p.i}`}
            d={`M${f1(p.x - len)},${f1(p.y)} q${f1(len * 0.5)},${f1(-8 + wav)} ${f1(len)},${f1(-2)}`}
            stroke="#f2dcae"
            strokeWidth={f1(1.2 + p.k * 1.4)}
            strokeLinecap="round"
            fill="none"
            opacity={f1((0.18 + p.k * 0.16) * 100) / 100}
          />
        );
      })}
      {dust.map((p) => (
        <circle key={`d${p.i}`} cx={f1(p.x)} cy={f1(p.y)} r={f1(0.8 + p.k * 1.3)} fill="#f6e2b6" opacity={f1((0.35 + p.k * 0.3) * 100) / 100} />
      ))}
      {FIRES.map(([x, y], i) => (
        <Flame key={`f${i}`} x={x} y={y + 6} t={t} seed={i + 3} s={i < 2 ? 1 : 0.85} color="#ff8a2a" />
      ))}
    </g>
  );
};

export const desertTerrain: TerrainDef = {
  id: 'desert',
  name: 'Sunscorch Ruins',
  accent: '#e8b04a',
  Ground,
  Ambient,
};
