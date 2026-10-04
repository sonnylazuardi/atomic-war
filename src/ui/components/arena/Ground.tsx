// Static arena floor: stone tiles, radiant/dire tint, center rune circle, edge decor, vignette.
// Drawn once (React.memo, no props).
import { memo } from 'react';
import type { ReactElement } from 'react';
import { ARENA_H, ARENA_W } from '../../../core/constants.ts';

const W = ARENA_W;
const H = ARENA_H;

// deterministic pseudo-random for decor placement
const rand = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function Tree({ x, y, s, dire }: { x: number; y: number; s: number; dire: boolean }) {
  const leaf = dire ? '#3b2a2a' : '#1f4a2c';
  const leaf2 = dire ? '#55302c' : '#2c6b3a';
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={0} cy={2} rx={22} ry={7} fill="#000" opacity={0.35} />
      <rect x={-3} y={-18} width={6} height={20} fill="#3a2718" />
      <path d="M0,-70 L22,-24 L-22,-24 Z" fill={leaf} />
      <path d="M0,-58 L18,-14 L-18,-14 Z" fill={leaf2} />
      <path d="M0,-80 L14,-46 L-14,-46 Z" fill={leaf2} opacity={0.9} />
    </g>
  );
}

function Rock({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={0} cy={3} rx={16} ry={5} fill="#000" opacity={0.3} />
      <path d="M-14,2 L-10,-9 L-2,-14 L9,-10 L14,0 Z" fill="#4a4f5a" />
      <path d="M-10,-9 L-2,-14 L9,-10 L0,-6 Z" fill="#646b78" />
    </g>
  );
}

function Brazier({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={0} cy={2} rx={14} ry={5} fill="#000" opacity={0.4} />
      <circle cx={0} cy={-24} r={28} fill={color} opacity={0.12} />
      <path d="M-9,0 L9,0 L6,-14 L-6,-14 Z" fill="#2b2b33" stroke="#555" strokeWidth={1} />
      <path d="M-11,-14 L11,-14 L9,-18 L-9,-18 Z" fill="#3c3c46" />
      <path d="M-7,-18 Q-4,-34 0,-40 Q4,-30 7,-18 Z" fill={color} opacity={0.85} className="aw-flicker" />
      <path d="M-3,-18 Q0,-28 3,-18 Z" fill="#fff3c0" />
    </g>
  );
}

export const Ground = memo(function Ground() {
  const tiles: ReactElement[] = [];
  const TS = 50;
  for (let gx = 0; gx < W / TS; gx++) {
    for (let gy = 0; gy < H / TS; gy++) {
      const r = rand(gx * 31 + gy * 7);
      if (r < 0.28) {
        tiles.push(
          <rect key={`t${gx}-${gy}`} x={gx * TS + 1} y={gy * TS + 1} width={TS - 2} height={TS - 2} fill={r < 0.12 ? '#ffffff' : '#000000'} opacity={0.035} />,
        );
      }
      if (r > 0.93) {
        // a crack
        const cx = gx * TS + 10 + r * 20;
        const cy = gy * TS + 12;
        tiles.push(
          <path key={`c${gx}-${gy}`} d={`M${cx},${cy} l6,8 l-3,7 l7,9`} stroke="#0c0e14" strokeWidth={1.2} fill="none" opacity={0.6} />,
        );
      }
    }
  }

  const decor: ReactElement[] = [];
  // tree lines along the top and bottom edges, a few on the sides
  for (let i = 0; i < 16; i++) {
    const x = 20 + i * 64 + rand(i) * 20;
    decor.push(<Tree key={`tt${i}`} x={x} y={36 + rand(i + 50) * 12} s={0.55 + rand(i + 3) * 0.2} dire={x > W / 2} />);
  }
  for (let i = 0; i < 9; i++) {
    const x = 70 + i * 110 + rand(i + 9) * 30;
    decor.push(<Rock key={`rb${i}`} x={x} y={H - 14 - rand(i + 70) * 10} s={0.8 + rand(i + 2) * 0.6} />);
  }

  return (
    <g>
      <defs>
        <pattern id="aw-tiles" width={50} height={50} patternUnits="userSpaceOnUse">
          <rect width={50} height={50} fill="#262a33" />
          <rect x={1} y={1} width={48} height={48} fill="#2d323d" />
          <path d="M1,1 L49,1 L48,2 L2,2 Z" fill="#3a404d" opacity={0.6} />
          <path d="M1,49 L49,49 L49,1 L48,2 L48,48 L2,48 Z" fill="#1b1e25" opacity={0.6} />
        </pattern>
        <linearGradient id="aw-sides" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2f8a45" stopOpacity={0.32} />
          <stop offset="0.42" stopColor="#2f8a45" stopOpacity={0.06} />
          <stop offset="0.5" stopColor="#000000" stopOpacity={0} />
          <stop offset="0.58" stopColor="#a8302f" stopOpacity={0.06} />
          <stop offset="1" stopColor="#a8302f" stopOpacity={0.34} />
        </linearGradient>
        <radialGradient id="aw-vignette" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.75} />
        </radialGradient>
        <radialGradient id="aw-rune" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#7fc8ff" stopOpacity={0.18} />
          <stop offset="1" stopColor="#7fc8ff" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-40} y={-40} width={W + 80} height={H + 80} fill="#14161c" />
      <rect width={W} height={H} fill="url(#aw-tiles)" />
      {tiles}
      <rect width={W} height={H} fill="url(#aw-sides)" />
      {/* river-ish divider */}
      <path d={`M${W / 2 - 14},0 Q${W / 2 + 18},${H * 0.3} ${W / 2 - 6},${H * 0.55} T${W / 2 + 10},${H}`} stroke="#3c6f8f" strokeWidth={10} fill="none" opacity={0.12} />
      {/* center rune circle */}
      <g transform={`translate(${W / 2},${H / 2})`}>
        <circle r={120} fill="url(#aw-rune)" />
        <circle r={92} fill="none" stroke="#8fb8d8" strokeOpacity={0.22} strokeWidth={2} />
        <circle r={78} fill="none" stroke="#8fb8d8" strokeOpacity={0.14} strokeWidth={6} strokeDasharray="4 10" />
        <circle r={46} fill="none" stroke="#8fb8d8" strokeOpacity={0.2} strokeWidth={1.5} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <path
              key={i}
              d="M0,-6 L4,0 L0,6 L-4,0 Z"
              transform={`translate(${Math.cos(a) * 62},${Math.sin(a) * 62}) rotate(${(a * 180) / Math.PI})`}
              fill="#a8d4ff"
              opacity={0.22}
            />
          );
        })}
        <path d="M0,-30 L26,15 L-26,15 Z M0,30 L-26,-15 L26,-15 Z" fill="none" stroke="#8fb8d8" strokeOpacity={0.16} strokeWidth={1.5} />
      </g>
      {/* spawn plates */}
      <rect x={60} y={90} width={340} height={420} rx={18} fill="none" stroke="#5fd068" strokeOpacity={0.07} strokeWidth={2} strokeDasharray="10 8" />
      <rect x={W - 400} y={90} width={340} height={420} rx={18} fill="none" stroke="#e5484d" strokeOpacity={0.07} strokeWidth={2} strokeDasharray="10 8" />
      {decor}
      <Brazier x={26} y={110} color="#7dff8a" />
      <Brazier x={26} y={H - 70} color="#7dff8a" />
      <Brazier x={W - 26} y={110} color="#ff6a4d" />
      <Brazier x={W - 26} y={H - 70} color="#ff6a4d" />
    </g>
  );
});

/** drawn above units; relies on the gradient defined in <Ground/> */
export const Vignette = memo(function Vignette() {
  return <rect x={-40} y={-40} width={W + 80} height={H + 80} fill="url(#aw-vignette)" pointerEvents="none" />;
});
