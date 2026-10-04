// Jungle terrain — "Verdant Ruins": a Radiant jungle courtyard. Mossy grass with a ruined stone plaza
// and a leaf-sigil circle, mossy stone walls draped in vines, a crumbled wall breach, a shallow stream
// with a plank bridge in the bottom-right, huge leafy canopies and ferns outside. Ambient: fireflies,
// drifting leaves, soft sunbeams. Arena coordinates 1000 x 600; playable x 60..940, y 90..560 kept clear.
import { cloneElement, memo } from 'react';
import type { ReactElement } from 'react';
import type { TerrainDef } from '../types.ts';

const P = 't2jungle-';
type Els = ReactElement[];
// generated arrays are re-keyed by index at render so generator keys can never collide
const keyed = (els: Els) => els.map((e, i) => cloneElement(e, { key: i }));

const rnd = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const r1 = (n: number) => Math.round(n * 10) / 10;
const pick = <T,>(arr: readonly T[], i: number): T => arr[Math.floor(rnd(i) * arr.length) % arr.length] as T;

function blob(cx: number, cy: number, rx: number, ry: number, seed: number, lumps = 10, amp = 0.2): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < lumps; i++) {
    const a = (i / lumps) * Math.PI * 2;
    const k = 1 + (rnd(seed * 13.7 + i * 3.1) - 0.5) * 2 * amp;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  let d = '';
  for (let i = 0; i <= lumps; i++) {
    const p = pts[i % lumps]!;
    const q = pts[(i + 1) % lumps]!;
    const mx = r1((p[0] + q[0]) / 2);
    const my = r1((p[1] + q[1]) / 2);
    d += i === 0 ? `M${mx},${my}` : ` Q${r1(p[0])},${r1(p[1])} ${mx},${my}`;
  }
  return d + 'Z';
}

const C = {
  void: '#0f1f12',
  outside: '#1a3319',
  grass: '#3b5b2b',
  grassDark: '#2c4721',
  grassLight: '#55803a',
  tuft: ['#4f7a34', '#5f8d3d', '#3f6a2c', '#6c9a45'] as const,
  stones: ['#6f7564', '#676d5c', '#767c69', '#5f6555', '#7c8170'] as const,
  stoneHi: '#9ba08a',
  stoneLo: '#3a3f32',
  moss: '#557f2f',
  mossLight: '#78a63e',
  face: ['#4f574a', '#555e4e', '#4a5244', '#5a6352', '#47503f'] as const,
  faceHi: '#7d8670',
  mortar: '#262b22',
  leaf: { dark: '#1d4a22', mid: '#2c6a2e', light: '#4c9440', hi: '#7cc155' },
  trunk: '#4a3524',
  water: '#2a6670',
  waterLight: '#4aa0a0',
  bank: '#4a4a30',
  wood: '#8a6238',
  woodDark: '#5e4026',
  flowers: ['#f2d14a', '#f08aa8', '#ffffff', '#c38bff'] as const,
};

// ---------------------------------------------------------------- pieces

function flagstones(out: Els, x0: number, y0: number, x1: number, y1: number, seed: number, keep: (x: number, y: number) => boolean) {
  let y = y0;
  let row = 0;
  while (y < y1 - 2) {
    const h = Math.min(y1 - y, 30 + rnd(seed + row * 7.3) * 12);
    let x = x0 - rnd(seed + row * 1.7) * 40;
    let k = 0;
    while (x < x1) {
      const w = 36 + rnd(seed + row * 31 + k * 3.7) * 40;
      const xa = Math.max(x0, x);
      const xb = Math.min(x1, x + w);
      const s = seed + row * 97 + k * 13;
      if (xb - xa > 6 && keep((xa + xb) / 2, y + h / 2) && rnd(s + 40) > 0.08) {
        const j = (n: number) => (rnd(s + n) - 0.5) * 4;
        const g = 2;
        const ax = r1(xa + g + j(1)), ay = r1(y + g + j(2));
        const bx = r1(xb - g + j(3)), by = r1(y + g + j(4));
        const cx = r1(xb - g + j(5)), cy = r1(y + h - g + j(6));
        const dx = r1(xa + g + j(7)), dy = r1(y + h - g + j(8));
        out.push(<path key={`fs${s}`} d={`M${ax},${ay}L${bx},${by}L${cx},${cy}L${dx},${dy}Z`} fill={pick(C.stones, s + 9)} />);
        out.push(<path key={`fh${s}`} d={`M${dx},${dy}L${ax},${ay}L${bx},${by}`} stroke={C.stoneHi} strokeWidth={1.2} fill="none" opacity={0.45} />);
        out.push(<path key={`fl${s}`} d={`M${bx},${by}L${cx},${cy}L${dx},${dy}`} stroke={C.stoneLo} strokeWidth={1.6} fill="none" opacity={0.6} />);
        if (rnd(s + 50) > 0.55) {
          // moss creeping over the stone
          const mx = (ax + bx) / 2 + (rnd(s + 51) - 0.5) * (xb - xa) * 0.6;
          out.push(<path key={`fm${s}`} d={blob(mx, (ay + cy) / 2 + (rnd(s + 52) - 0.5) * h * 0.5, 6 + rnd(s + 53) * 9, 4 + rnd(s + 54) * 5, s, 8, 0.3)} fill={C.moss} opacity={0.75} />);
        }
      }
      x += w;
      k++;
    }
    y += h;
    row++;
  }
}

function tufts(out: Els, n: number, x0: number, y0: number, x1: number, y1: number, seed: number, keep?: (x: number, y: number) => boolean, size = 1) {
  for (let i = 0; i < n; i++) {
    const x = x0 + rnd(seed + i * 2.13) * (x1 - x0);
    const y = y0 + rnd(seed + i * 3.71 + 1) * (y1 - y0);
    if (keep && !keep(x, y)) continue;
    const h = (5 + rnd(seed + i * 5.3) * 6) * size;
    out.push(
      <path
        key={`tf${seed}-${i}`}
        d={`M${r1(x - 3)},${r1(y)} L${r1(x - 5)},${r1(y - h * 0.75)} L${r1(x - 1)},${r1(y)} L${r1(x)},${r1(y - h)} L${r1(x + 1.4)},${r1(y)} L${r1(x + 5)},${r1(y - h * 0.7)} L${r1(x + 3)},${r1(y)} Z`}
        fill={pick(C.tuft, seed + i * 7)}
      />,
    );
  }
}

// top-down leafy canopy (big jungle tree)
function canopy(out: Els, x: number, y: number, r: number, seed: number) {
  const L = C.leaf;
  out.push(
    <g key={`cn${seed}`}>
      <path d={blob(x + r * 0.25, y + r * 0.3, r * 1.02, r * 0.86, seed + 1, 11, 0.16)} fill="#000" opacity={0.35} />
      <path d={blob(x, y, r, r * 0.85, seed + 2, 12, 0.18)} fill={L.dark} />
      <path d={blob(x - r * 0.08, y - r * 0.08, r * 0.82, r * 0.68, seed + 3, 11, 0.2)} fill={L.mid} />
      <path d={blob(x - r * 0.2, y - r * 0.2, r * 0.52, r * 0.42, seed + 4, 9, 0.24)} fill={L.light} />
      <path d={blob(x - r * 0.3, y - r * 0.3, r * 0.22, r * 0.17, seed + 5, 7, 0.3)} fill={L.hi} opacity={0.75} />
      {Array.from({ length: 5 }, (_, i) => {
        const a = rnd(seed + i * 9) * Math.PI * 2;
        const d = r * (0.35 + rnd(seed + i * 4) * 0.45);
        return <path key={i} d={blob(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.85, r * 0.2, r * 0.16, seed + 20 + i, 7, 0.3)} fill={i % 2 ? L.light : L.mid} opacity={0.85} />;
      })}
    </g>,
  );
}

function fern(out: Els, x: number, y: number, s: number, seed: number) {
  const fronds: ReactElement[] = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + ((i / (n - 1)) - 0.5) * 2.6 + (rnd(seed + i) - 0.5) * 0.2;
    const L = 22 + rnd(seed + i * 3) * 10;
    const ex = Math.cos(a) * L;
    const ey = Math.sin(a) * L * 0.8;
    const mx = Math.cos(a - 0.25) * L * 0.55;
    const my = Math.sin(a - 0.25) * L * 0.55 - 4;
    fronds.push(<path key={i} d={`M0,0 Q${r1(mx)},${r1(my)} ${r1(ex)},${r1(ey)}`} stroke={i % 2 ? '#3f8a35' : '#5aa844'} strokeWidth={5} strokeLinecap="round" fill="none" strokeDasharray="2.5 1.2" />);
    fronds.push(<path key={`c${i}`} d={`M0,0 Q${r1(mx)},${r1(my)} ${r1(ex)},${r1(ey)}`} stroke="#2a5a25" strokeWidth={0.8} fill="none" />);
  }
  out.push(
    <g key={`fe${seed}`} transform={`translate(${r1(x)},${r1(y)}) scale(${s})`}>
      <ellipse cx={0} cy={1} rx={18} ry={5} fill="#000" opacity={0.3} />
      {keyed(fronds)}
    </g>,
  );
}

function bricks(out: Els, x0: number, y0: number, x1: number, y1: number, seed: number, rowH = 11.5) {
  out.push(<rect key={`bm${seed}`} x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={C.mortar} />);
  let row = 0;
  for (let y = y0; y < y1 - 1; y += rowH, row++) {
    const h = Math.min(rowH, y1 - y);
    let x = x0 - (row % 2) * 14 - rnd(seed + row) * 8;
    let k = 0;
    while (x < x1) {
      const w = 24 + rnd(seed + row * 17 + k * 5.3) * 22;
      const xa = Math.max(x0, x) + 0.9;
      const xb = Math.min(x1, x + w) - 0.9;
      if (xb > xa) {
        const s = seed + row * 53 + k;
        out.push(<rect key={`br${out.length}`} x={r1(xa)} y={r1(y + 0.9)} width={r1(xb - xa)} height={r1(h - 1.8)} rx={1.5} fill={pick(C.face, s)} />);
        out.push(<rect key={`bh${out.length}`} x={r1(xa)} y={r1(y + 0.9)} width={r1(xb - xa)} height={1.3} fill={C.faceHi} opacity={0.35} />);
        if (rnd(s + 3) > 0.8) out.push(<rect key={`bg${s}`} x={r1(xa)} y={r1(y + 0.9)} width={r1(xb - xa)} height={r1(h - 1.8)} fill={C.moss} opacity={0.35} />);
      }
      x += w;
      k++;
    }
  }
}

function capSlabs(out: Els, x0: number, y0: number, x1: number, y1: number, seed: number, vertical: boolean) {
  out.push(<rect key={`cm${seed}`} x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={C.mortar} />);
  const len = vertical ? y1 - y0 : x1 - x0;
  let p = 0;
  let k = 0;
  while (p < len) {
    const L = Math.min(len - p, 28 + rnd(seed + k * 3.1) * 24);
    const s = seed + k * 7;
    const col = pick(C.stones, s);
    const rect = vertical
      ? { x: x0 + 1, y: r1(y0 + p + 1), width: x1 - x0 - 2, height: r1(L - 2) }
      : { x: r1(x0 + p + 1), y: y0 + 1, width: r1(L - 2), height: y1 - y0 - 2 };
    out.push(<rect key={`cs${s}`} {...rect} rx={1.5} fill={col} />);
    out.push(<rect key={`ch${s}`} x={rect.x} y={rect.y} width={vertical ? rect.width : rect.width} height={1.4} fill={C.stoneHi} opacity={0.5} />);
    // moss on the caps
    if (rnd(s + 5) > 0.35) {
      const cx = vertical ? (x0 + x1) / 2 + (rnd(s + 6) - 0.5) * 10 : x0 + p + L * rnd(s + 6);
      const cy = vertical ? y0 + p + L * rnd(s + 7) : (y0 + y1) / 2 + (rnd(s + 7) - 0.5) * 4;
      out.push(<path key={`cmo${s}`} d={blob(cx, cy, 9 + rnd(s + 8) * 10, 5 + rnd(s + 9) * 5, s, 8, 0.3)} fill={rnd(s + 10) > 0.5 ? C.moss : C.mossLight} opacity={0.9} />);
    }
    p += L;
    k++;
  }
}

// a vine hanging down a wall face from (x, y)
function vine(out: Els, x: number, y: number, len: number, seed: number) {
  const sway = (rnd(seed) - 0.5) * 14;
  const d = `M${x},${y} C${r1(x + sway)},${r1(y + len * 0.35)} ${r1(x - sway)},${r1(y + len * 0.65)} ${r1(x + sway * 0.4)},${r1(y + len)}`;
  const leaves: ReactElement[] = [];
  const n = Math.floor(len / 7);
  for (let i = 1; i <= n; i++) {
    const k = i / n;
    // approximate point along the curve
    const px = x + sway * (3 * k * (1 - k) * (1 - k) - 3 * k * k * (1 - k)) + sway * 0.4 * k * k * k;
    const py = y + len * k;
    const side = i % 2 ? 1 : -1;
    leaves.push(<path key={i} d={`M${r1(px)},${r1(py)} q${side * 5},-4 ${side * 7},1 q${-side * 4},3 ${-side * 7},-1 Z`} fill={i % 3 ? '#4f9a3c' : '#6dba4a'} />);
  }
  out.push(
    <g key={`vn${seed}`}>
      <path d={d} stroke="#2f5a22" strokeWidth={2} fill="none" />
      {keyed(leaves)}
    </g>,
  );
}

function rock(out: Els, x: number, y: number, s: number, seed: number) {
  out.push(
    <g key={`rk${seed}`} transform={`translate(${r1(x)},${r1(y)}) scale(${s})`}>
      <ellipse cx={2} cy={2} rx={15} ry={5} fill="#000" opacity={0.35} />
      <path d={blob(0, -5, 13, 8, seed, 7, 0.22)} fill="#5d6455" />
      <path d={blob(-2, -8, 9, 5, seed + 1, 7, 0.25)} fill="#7b8270" />
      <path d={blob(3, -10, 6, 3, seed + 2, 6, 0.3)} fill={C.moss} />
    </g>,
  );
}

function lilyPad(out: Els, x: number, y: number, r: number, seed: number, flower: boolean) {
  const a = rnd(seed) * 360;
  out.push(
    <g key={`lp${seed}`} transform={`translate(${r1(x)},${r1(y)}) rotate(${r1(a)})`}>
      <path d={`M0,0 L${r},-2 A${r},${r * 0.75} 0 1 1 ${r},2 Z`} fill="#4d8f3a" />
      <path d={`M0,0 L${r},-2 A${r},${r * 0.75} 0 0 0 ${-r * 0.6},${-r * 0.5} Z`} fill="#62a748" opacity={0.7} />
      {flower && <circle cx={-r * 0.2} cy={0} r={r * 0.35} fill="#f6b6d0" />}
      {flower && <circle cx={-r * 0.2} cy={0} r={r * 0.14} fill="#ffe680" />}
    </g>,
  );
}

function statueHead(out: Els, x: number, y: number, s: number, key: string) {
  out.push(
    <g key={key} transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={3} cy={2} rx={22} ry={7} fill="#000" opacity={0.35} />
      <path d="M-16,0 L-17,-24 Q-16,-36 0,-38 Q16,-36 17,-24 L16,0 Z" fill="#7a806e" />
      <path d="M6,0 L8,-30 Q14,-30 17,-24 L16,0 Z" fill="#5d6455" />
      <path d="M-11,-22 L-4,-22 M4,-22 L11,-22" stroke="#3a3f32" strokeWidth={2.4} />
      <path d="M-2,-18 L0,-10 L2,-18" stroke="#3a3f32" strokeWidth={1.4} fill="none" />
      <path d="M-6,-6 L6,-6" stroke="#3a3f32" strokeWidth={1.8} />
      <path d="M-17,-26 Q0,-44 17,-26 Q10,-34 0,-35 Q-10,-34 -17,-26 Z" fill={C.moss} />
      <path d="M-14,-12 Q-18,-4 -15,0" stroke="#4f9a3c" strokeWidth={2} fill="none" />
    </g>,
  );
}

// ---------------------------------------------------------------- layout constants

const STREAM = 'M955,330 C905,360 880,400 875,440 S840,520 800,575';
const PLAZA = { cx: 500, cy: 330, rx: 250, ry: 175 };
const inPlaza = (x: number, y: number) => ((x - PLAZA.cx) / PLAZA.rx) ** 2 + ((y - PLAZA.cy) / PLAZA.ry) ** 2 < 1 - rnd(x * 0.37 + y) * 0.35;
const nearStream = (x: number, y: number) => {
  // rough distance check against the stream polyline
  const pts = [
    [955, 330],
    [905, 370],
    [878, 420],
    [868, 470],
    [840, 520],
    [800, 575],
  ];
  for (const [px, py] of pts) if ((x - px!) ** 2 + (y - py!) ** 2 < 32 * 32) return true;
  return false;
};

const FIREFLY_ZONES = [
  [140, 160],
  [860, 160],
  [140, 480],
  [700, 480],
  [500, 120],
] as const;

const JungleGround = memo(function JungleGround() {
  // ---- floor
  const floor: Els = [];
  // grass patches
  for (let i = 0; i < 40; i++) {
    const x = 60 + rnd(i * 3.3 + 1) * 880;
    const y = 95 + rnd(i * 7.1 + 2) * 460;
    floor.push(<path key={`gp${i}`} d={blob(x, y, 30 + rnd(i) * 50, 16 + rnd(i + 1) * 26, i + 300, 9, 0.28)} fill={i % 3 ? C.grassDark : C.grassLight} opacity={i % 3 ? 0.5 : 0.35} />);
  }
  // dirt paths from gates to plaza
  floor.push(<path key="dp1" d="M60,330 C160,320 220,350 270,330" stroke="#5a4a30" strokeWidth={34} strokeLinecap="round" fill="none" opacity={0.5} />);
  floor.push(<path key="dp2" d="M500,88 C510,120 490,140 500,165" stroke="#5a4a30" strokeWidth={30} strokeLinecap="round" fill="none" opacity={0.45} />);
  floor.push(<path key="dp3" d="M730,330 C800,340 850,320 900,345" stroke="#5a4a30" strokeWidth={28} strokeLinecap="round" fill="none" opacity={0.45} />);
  // ruined plaza flagstones
  floor.push(<ellipse key="pl" cx={PLAZA.cx} cy={PLAZA.cy} rx={PLAZA.rx * 0.95} ry={PLAZA.ry * 0.95} fill="#2f3a26" opacity={0.35} />);
  flagstones(floor, 240, 150, 760, 510, 77, inPlaza);
  // leaf sigil circle
  floor.push(
    <g key="sig" transform="translate(500,330)">
      <ellipse rx={92} ry={70} fill="#5f6655" />
      <ellipse rx={92} ry={70} fill="none" stroke="#3a3f32" strokeWidth={3} />
      <ellipse rx={84} ry={64} fill="none" stroke="#8a9078" strokeWidth={1.5} />
      <ellipse rx={66} ry={50} fill="#6b7261" stroke="#3a3f32" strokeWidth={2} />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <path key={i} d={`M${r1(Math.cos(a) * 66)},${r1(Math.sin(a) * 50)} L${r1(Math.cos(a) * 92)},${r1(Math.sin(a) * 70)}`} stroke="#3a3f32" strokeWidth={2} />;
      })}
      {/* radiant tree-leaf glyph */}
      <path d="M0,-38 Q30,-14 0,30 Q-30,-14 0,-38 Z" fill="#7fbf4a" opacity={0.85} />
      <path d="M0,-30 L0,24 M0,-12 L-12,-20 M0,-2 L14,-12 M0,8 L-14,0" stroke="#3d6a2a" strokeWidth={2} fill="none" />
      <ellipse rx={56} ry={42} fill="none" stroke="#a6e07a" strokeWidth={1.5} strokeDasharray="5 7" opacity={0.6} />
      <path d={blob(-60, 30, 22, 10, 9, 8, 0.3)} fill={C.moss} opacity={0.85} />
      <path d={blob(70, -30, 16, 8, 10, 8, 0.3)} fill={C.moss} opacity={0.85} />
    </g>,
  );
  // stream (bottom-right): bank, water, shimmer, rocks, lily pads, bridge
  floor.push(<path key="sb" d={STREAM} stroke="#3b3a25" strokeWidth={52} strokeLinecap="round" fill="none" opacity={0.75} />);
  floor.push(<path key="sb2" d={STREAM} stroke="#53633a" strokeWidth={44} strokeLinecap="round" fill="none" />);
  floor.push(<path key="sw" d={STREAM} stroke={C.water} strokeWidth={34} strokeLinecap="round" fill="none" />);
  floor.push(<path key="sw2" d={STREAM} stroke="#1f4f58" strokeWidth={14} strokeLinecap="round" fill="none" opacity={0.6} />);
  floor.push(<path key="sw3" d={STREAM} stroke={C.waterLight} strokeWidth={2} strokeDasharray="10 16" fill="none" opacity={0.7} transform="translate(-7,0)" />);
  floor.push(<path key="sw4" d={STREAM} stroke="#bfe8e0" strokeWidth={1.4} strokeDasharray="4 22" fill="none" opacity={0.6} transform="translate(6,-2)" />);
  [
    [930, 350],
    [895, 395],
    [850, 455],
    [905, 470],
    [830, 548],
    [865, 525],
  ].forEach(([x, y], i) => rock(floor, x!, y!, 0.55 + rnd(i) * 0.3, 900 + i));
  lilyPad(floor, 884, 420, 6, 11, true);
  lilyPad(floor, 868, 500, 5, 12, false);
  lilyPad(floor, 826, 548, 6, 13, false);
  // plank bridge across the stream
  floor.push(
    <g key="bridge" transform="translate(872,446) rotate(-14)">
      <ellipse cx={4} cy={6} rx={46} ry={20} fill="#000" opacity={0.3} />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={-40 + i * 10} y={-16 + (rnd(i + 70) - 0.5) * 2} width={9} height={32} rx={1.5} fill={i % 2 ? C.wood : '#97703f'} stroke={C.woodDark} strokeWidth={0.8} />
      ))}
      <rect x={-44} y={-19} width={88} height={4} rx={2} fill={C.woodDark} />
      <rect x={-44} y={15} width={88} height={4} rx={2} fill={C.woodDark} />
      {[-44, 40].map((x) => (
        <g key={x}>
          <rect x={x} y={-24} width={5} height={10} fill="#4a321c" />
          <rect x={x} y={12} width={5} height={10} fill="#4a321c" />
        </g>
      ))}
    </g>,
  );
  // grass tufts, flowers, pebbles
  tufts(floor, 260, 60, 92, 940, 560, 5, (x, y) => !inPlaza(x, y) && !nearStream(x, y));
  for (let i = 0; i < 70; i++) {
    const x = 64 + rnd(i * 9.1 + 400) * 872;
    const y = 96 + rnd(i * 4.7 + 401) * 460;
    if (inPlaza(x, y) || nearStream(x, y)) continue;
    floor.push(<circle key={`fl${i}`} cx={r1(x)} cy={r1(y)} r={r1(1.4 + rnd(i) * 1.2)} fill={pick(C.flowers, i + 402)} opacity={0.9} />);
  }
  // roots creeping in from the walls
  [
    [60, 140, 0.3],
    [60, 470, -0.2],
    [940, 200, Math.PI - 0.2],
    [300, 90, 1.3],
    [690, 90, 1.7],
  ].forEach(([x, y, a], i) => {
    let d = `M${x},${y}`;
    let px = x!;
    let py = y!;
    let ang = a!;
    for (let s = 0; s < 4; s++) {
      ang += (rnd(i * 10 + s) - 0.5) * 0.8;
      px += Math.cos(ang) * 14;
      py += Math.sin(ang) * 11;
      d += ` L${r1(px)},${r1(py)}`;
    }
    floor.push(<path key={`ro${i}`} d={d} stroke="#4a3524" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.85} />);
    floor.push(<path key={`roh${i}`} d={d} stroke="#6e5236" strokeWidth={1} fill="none" opacity={0.8} transform="translate(-0.8,-0.8)" />);
  });

  // ---- outside top band: dense canopy behind the wall
  const back: Els = [];
  back.push(<rect key="ob" x={-40} y={-40} width={1080} height={80} fill={C.outside} />);
  for (let i = 0; i < 14; i++) {
    const x = -20 + i * 78 + rnd(i * 3) * 30;
    canopy(back, x, -4 + rnd(i * 5) * 12, 40 + rnd(i * 7) * 16, 100 + i * 11);
  }
  for (let i = 0; i < 12; i++) fern(back, 40 + i * 84 + rnd(i + 30) * 30, 30, 0.8 + rnd(i + 31) * 0.3, 200 + i);

  // ---- top wall (with a crumbled breach at x 640..700)
  const walls: Els = [];
  capSlabs(walls, 0, 26, 640, 42, 201, false);
  capSlabs(walls, 702, 26, 1000, 42, 202, false);
  bricks(walls, 0, 42, 640, 88, 301);
  bricks(walls, 702, 42, 1000, 88, 302);
  walls.push(<rect key="tao" x={0} y={42} width={1000} height={46} fill={`url(#${P}faceAO)`} />);
  // breach: lower broken stub + rubble, jungle visible
  walls.push(<path key="brc" d="M640,42 L640,88 L702,88 L702,42 L690,56 L676,62 L662,58 L650,64 Z" fill="#3e4637" />);
  bricks(walls, 640, 66, 702, 88, 303);
  walls.push(<path key="brt" d="M640,66 L650,62 L662,66 L676,63 L690,67 L702,64 L702,68 L640,70 Z" fill={C.stones[0]} />);
  fern(walls, 670, 66, 0.9, 77);
  rock(walls, 652, 94, 0.55, 91);
  rock(walls, 690, 96, 0.45, 92);
  walls.push(<rect key="tcl" x={0} y={41} width={640} height={2} fill={C.stoneHi} opacity={0.6} />);
  walls.push(<rect key="tcl2" x={702} y={41} width={298} height={2} fill={C.stoneHi} opacity={0.6} />);
  // ruin pillars on the top wall (one broken)
  [
    [180, false],
    [380, false],
    [500, true],
    [820, false],
  ].forEach(([x, broken], i) => {
    const px = x as number;
    const top = broken ? 30 : 14;
    walls.push(
      <g key={`pl${i}`}>
        <rect x={px - 11} y={top} width={22} height={90 - top} fill="#69705f" />
        <rect x={px - 11} y={top} width={6} height={90 - top} fill="#858b77" />
        <rect x={px + 6} y={top} width={5} height={90 - top} fill="#4a5143" />
        {broken ? (
          <path d={`M${px - 13},${top} L${px - 6},${top - 8} L${px + 2},${top - 3} L${px + 8},${top - 10} L${px + 13},${top} Z`} fill="#7a806e" />
        ) : (
          <>
            <rect x={px - 14} y={top - 6} width={28} height={8} fill="#7a806e" />
            <rect x={px - 14} y={top - 6} width={28} height={2} fill={C.stoneHi} />
          </>
        )}
        <path d={blob(px - 4, top + 2, 12, 5, 600 + i, 8, 0.3)} fill={C.moss} />
      </g>,
    );
    vine(walls, px - 4, top + 2, 40 + rnd(i) * 30, 700 + i);
  });
  // vines over the wall face
  for (let i = 0; i < 16; i++) {
    const x = 30 + i * 62 + rnd(i * 2.2) * 20;
    if (x > 630 && x < 710) continue;
    vine(walls, r1(x), 40, 18 + rnd(i * 4.4) * 34, 800 + i);
    walls.push(<path key={`vm${i}`} d={blob(x, 40, 16 + rnd(i) * 10, 5, 850 + i, 8, 0.3)} fill={i % 2 ? C.moss : C.mossLight} />);
  }

  // ---- side walls
  for (const side of [0, 1]) {
    const xc0 = side ? 950 : 12;
    const xc1 = side ? 988 : 50;
    walls.push(<rect key={`so${side}`} x={side ? 988 : -40} y={40} width={52} height={560} fill={C.outside} />);
    capSlabs(walls, xc0, 42, xc1, 566, 400 + side * 50, true);
    walls.push(<rect key={`sf${side}`} x={side ? 944 : 50} y={43} width={6} height={520} fill="#30372b" />);
    walls.push(<rect key={`ss${side}`} x={side ? 920 : 56} y={88} width={24} height={474} fill={`url(#${P}${side ? 'shR' : 'shL'})`} />);
  }
  // culvert where the stream leaves through the right wall
  walls.push(<path key="culv" d="M944,306 L944,354 L988,354 L988,306 Q966,296 944,306 Z" fill="#1d3a3f" />);
  walls.push(<path key="culv2" d="M944,306 Q966,296 988,306" stroke="#7a806e" strokeWidth={4} fill="none" />);

  // ---- bottom wall
  const bottom: Els = [];
  capSlabs(bottom, 0, 560, 1000, 576, 601, false);
  bricks(bottom, 0, 576, 1000, 600, 701, 12);
  bottom.push(<rect key="bao" x={0} y={576} width={1000} height={24} fill="#000" opacity={0.22} />);
  bottom.push(<rect key="bsh" x={56} y={552} width={888} height={8} fill={`url(#${P}shB)`} />);
  // stream passes under the bottom wall
  bottom.push(<path key="bculv" d="M780,560 L822,560 L822,600 L780,600 Z" fill="#1d3a3f" />);
  bottom.push(<path key="bculv2" d="M776,560 L826,560" stroke="#7a806e" strokeWidth={4} />);

  // ---- outside scenery overlapping the side & bottom walls
  const scen: Els = [];
  // canopies leaning over side walls (stay left of x 60 / right of x 940)
  [
    [-18, 170, 44],
    [-24, 300, 50],
    [-16, 440, 42],
    [1018, 150, 46],
    [1024, 260, 40],
    [1022, 460, 50],
  ].forEach(([x, y, r], i) => canopy(scen, x!, y!, r!, 1000 + i * 17));
  [
    [30, 230],
    [28, 380],
    [30, 520],
    [972, 210],
    [970, 400],
    [972, 520],
  ].forEach(([x, y], i) => fern(scen, x!, y!, 0.75, 1100 + i));
  statueHead(scen, 40, 118, 0.62, 'sh1');
  [120, 330, 560, 700, 920].forEach((x, i) => fern(scen, x, 588, 0.6 + rnd(i) * 0.2, 1200 + i));
  // corner giants
  canopy(scen, 4, 20, 62, 1300);
  canopy(scen, 996, 18, 64, 1310);
  canopy(scen, 0, 600, 58, 1320);
  canopy(scen, 1000, 600, 60, 1330);

  return (
    <g>
      <defs>
        <linearGradient id={`${P}faceAO`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={0.2} />
          <stop offset="0.35" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.5} />
        </linearGradient>
        <linearGradient id={`${P}shT`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={0.5} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${P}shB`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.4} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${P}shL`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.45} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${P}shR`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.45} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${P}light`} cx="0.5" cy="0.5" r="0.65">
          <stop offset="0" stopColor="#fff6c0" stopOpacity={0.1} />
          <stop offset="0.6" stopColor="#000" stopOpacity={0.04} />
          <stop offset="1" stopColor="#001000" stopOpacity={0.4} />
        </radialGradient>
      </defs>
      <rect x={-40} y={-40} width={1080} height={680} fill={C.void} />
      <rect x={50} y={86} width={900} height={478} fill={C.grass} />
      {keyed(floor)}
      <rect x={56} y={86} width={888} height={478} fill={`url(#${P}light)`} />
      <rect x={56} y={88} width={888} height={24} fill={`url(#${P}shT)`} />
      {keyed(back)}
      {keyed(walls)}
      {keyed(bottom)}
      {keyed(scen)}
    </g>
  );
});

// ---------------------------------------------------------------- ambient

const FIREFLIES = 22;
const LEAVES = 14;
function JungleAmbient({ t }: { t: number }) {
  const els: Els = [];
  // sunbeams
  [
    [260, 0.0],
    [520, 1.7],
    [780, 3.1],
  ].forEach(([x, ph], i) => {
    const op = 0.05 + 0.03 * Math.sin(t * 0.6 + ph!);
    els.push(<path key={`sb${i}`} d={`M${x! - 40},-10 L${x! + 30},-10 L${x! + 170},610 L${x! + 60},610 Z`} fill={`url(#${P}beam)`} opacity={r1(op * 100) / 100} />);
  });
  // fireflies wander around zones near the edges and over the plaza
  for (let i = 0; i < FIREFLIES; i++) {
    const z = FIREFLY_ZONES[i % FIREFLY_ZONES.length]!;
    const ph = rnd(i * 3.7) * 6.28;
    const sp = 0.3 + rnd(i * 1.9) * 0.4;
    const x = z[0] + Math.sin(t * sp + ph) * (60 + rnd(i) * 70) + Math.sin(t * sp * 2.3 + ph * 2) * 18;
    const y = z[1] + Math.cos(t * sp * 0.8 + ph * 1.3) * (40 + rnd(i + 5) * 40) + Math.sin(t * sp * 3.1 + ph) * 10;
    const blink = Math.max(0, Math.sin(t * (1.5 + rnd(i * 2.1) * 1.5) + ph * 3));
    const op = 0.25 + blink * 0.75;
    els.push(
      <circle key={`ff${i}`} cx={r1(x)} cy={r1(y)} r={6} fill={`url(#${P}ff)`} opacity={r1(op * 100) / 100} />,
    );
  }
  // drifting leaves
  for (let i = 0; i < LEAVES; i++) {
    const span = 700;
    const sp = 22 + rnd(i * 4.3) * 20;
    const ph = (t * sp + rnd(i * 8.1) * span) % span;
    const y = -30 + ph;
    const x = ((rnd(i * 2.9) * 1100 + ph * 0.35 + Math.sin(t * 1.3 + i) * 24) % 1100) - 50;
    const rot = r1((t * (60 + rnd(i) * 80) + i * 40) % 360);
    const flip = r1(Math.cos(t * 2.4 + i) * 100) / 100;
    els.push(
      <g key={`lf${i}`} transform={`translate(${r1(x)},${r1(y)}) rotate(${rot}) scale(${flip || 0.05},1)`}>
        <path d="M-5,0 Q0,-4 5,0 Q0,4 -5,0 Z" fill={i % 3 ? '#6aa83e' : '#a8c94a'} stroke="#3d6a2a" strokeWidth={0.5} />
      </g>,
    );
  }
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id={`${P}ff`}>
          <stop offset="0" stopColor="#fbffd0" stopOpacity={1} />
          <stop offset="0.22" stopColor="#e6ff7a" stopOpacity={0.9} />
          <stop offset="0.45" stopColor="#d4ff5a" stopOpacity={0.3} />
          <stop offset="1" stopColor="#c8ff4a" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${P}beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6c0" stopOpacity={1} />
          <stop offset="1" stopColor="#fff6c0" stopOpacity={0} />
        </linearGradient>
      </defs>
      {keyed(els)}
    </g>
  );
}

export const jungleTerrain: TerrainDef = {
  id: 'jungle',
  name: 'Verdant Ruins',
  accent: '#7bd35a',
  Ground: JungleGround,
  Ambient: JungleAmbient,
};
