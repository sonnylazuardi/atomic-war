// Temple terrain — "Sanctum of the Sun": an ancient golden temple courtyard. Polished sandstone and
// marble tiles around a huge gold-inlaid lapis mosaic with glowing runes, sandstone walls with a gold
// frieze, fluted columns with violet banners, guardian statues, braziers and a rune-lit doorway.
// Ambient: floating rune motes + brazier flicker. Arena 1000 x 600; playable x 60..940, y 90..560 kept clear.
import { cloneElement, memo } from 'react';
import type { ReactElement } from 'react';
import type { TerrainDef } from '../types.ts';

const P = 't2temple-';
type Els = ReactElement[];
// generated arrays are re-keyed by index at render so generator keys can never collide
const keyed = (els: Els) => els.map((e, i) => cloneElement(e, { key: i }));

const rnd = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const r1 = (n: number) => Math.round(n * 10) / 10;
const pick = <T,>(arr: readonly T[], i: number): T => arr[Math.floor(rnd(i) * arr.length) % arr.length] as T;

const C = {
  void: '#120f1c',
  outside: '#1c1830',
  grout: '#4e4232',
  tileA: ['#a08a68', '#a58f6c', '#9b8564', '#a99372'] as const,
  tileB: ['#8e7a5c', '#937e60', '#8a7658', '#97825f'] as const,
  tileHi: '#cdb58c',
  tileLo: '#5e4e38',
  vein: '#e6d6b4',
  gold: '#e0b54a',
  goldHi: '#fff0a8',
  goldLo: '#8a6420',
  lapis: '#24306a',
  lapisHi: '#3c4c9a',
  rune: '#9b8cff',
  runeHi: '#d8d0ff',
  sand: ['#b39a70', '#ab9268', '#b9a077', '#a68d64'] as const,
  sandHi: '#d8c094',
  sandLo: '#6e5a3c',
  face: ['#94805c', '#8c7856', '#9a865f', '#857152', '#a08b64'] as const,
  banner: '#4b2a7e',
  bannerLo: '#2e1952',
  marbleCol: '#d9cdb4',
  marbleColLo: '#a8997c',
  bronze: '#8a5a2a',
};

// ---------------------------------------------------------------- floor

const TW = 64;
const TH = 46; // tiles foreshortened by the tilted camera
const MOS = { cx: 500, cy: 328, rx: 196, ry: 148 };

function floorTiles(out: Els) {
  const x0 = 52;
  const y0 = 86;
  for (let gy = 0; gy * TH < 478; gy++) {
    for (let gx = 0; gx * TW < 896; gx++) {
      const x = x0 + gx * TW;
      const y = y0 + gy * TH;
      const w = Math.min(TW, 948 - x);
      const h = Math.min(TH, 564 - y);
      if (w < 3 || h < 3) continue;
      const s = gx * 37 + gy * 101;
      const checker = (gx + gy) % 2 === 0;
      const fill = checker ? pick(C.tileA, s) : pick(C.tileB, s);
      out.push(<rect key={`t${s}`} x={x + 1.2} y={y + 1.2} width={r1(w - 2.4)} height={r1(h - 2.4)} fill={fill} />);
      // polished bevel
      out.push(<path key={`th${s}`} d={`M${x + 1.2},${r1(y + h - 1.2)} L${x + 1.2},${y + 1.2} L${r1(x + w - 1.2)},${y + 1.2}`} stroke={C.tileHi} strokeWidth={1.2} fill="none" opacity={0.55} />);
      out.push(<path key={`tl${s}`} d={`M${r1(x + w - 1.2)},${y + 1.2} L${r1(x + w - 1.2)},${r1(y + h - 1.2)} L${x + 1.2},${r1(y + h - 1.2)}`} stroke={C.tileLo} strokeWidth={1.2} fill="none" opacity={0.6} />);
      // marble veins
      if (rnd(s + 3) > 0.45) {
        const vx = x + 6 + rnd(s + 4) * (w - 12);
        out.push(
          <path key={`tv${s}`} d={`M${r1(vx)},${y + 2} q${r1((rnd(s + 5) - 0.5) * 16)},${r1(h * 0.4)} ${r1((rnd(s + 6) - 0.5) * 20)},${r1(h * 0.65)} t${r1((rnd(s + 7) - 0.5) * 14)},${r1(h * 0.3)}`} stroke={C.vein} strokeWidth={0.8} fill="none" opacity={0.35} />,
        );
      }
      // soft polish reflection
      if (rnd(s + 8) > 0.7) out.push(<rect key={`tr${s}`} x={x + 5} y={y + 4} width={r1(w * 0.4)} height={3} rx={1.5} fill="#fff" opacity={0.08} />);
      // small gold rivet at tile corners
      if (gx > 0 && gy > 0 && (gx + gy) % 2 === 0) out.push(<rect key={`tg${s}`} x={x - 2.5} y={y - 2.5} width={5} height={5} transform={`rotate(45,${x},${y})`} fill={C.gold} opacity={0.75} />);
    }
  }
}

function runeGlyph(i: number, s: number): string {
  const k = i % 6;
  if (k === 0) return `M0,${-s} L${s * 0.7},${s * 0.6} L${-s * 0.7},${s * 0.6} Z`;
  if (k === 1) return `M0,${-s} L0,${s} M${-s * 0.6},${-s * 0.3} L${s * 0.6},${s * 0.3}`;
  if (k === 2) return `M${-s * 0.6},${-s} L${s * 0.6},${-s} L0,${s} Z M0,${-s * 0.2} L0,${s * 0.3}`;
  if (k === 3) return `M${-s * 0.7},0 A${s * 0.7},${s * 0.7} 0 1 1 ${s * 0.7},0 M0,${-s} L0,${s}`;
  if (k === 4) return `M${-s * 0.6},${-s} L${s * 0.6},${s} M${s * 0.6},${-s} L${-s * 0.6},${s} M${-s * 0.8},0 L${s * 0.8},0`;
  return `M0,${-s} L${s * 0.6},0 L0,${s} L${-s * 0.6},0 Z`;
}

function Mosaic() {
  const { rx, ry } = MOS;
  const sy = ry / rx;
  const els: Els = [];
  // outer ring of wedge tiles
  const ring = (r0: number, r1v: number, n: number, colors: readonly string[], key: string, off = 0) => {
    for (let i = 0; i < n; i++) {
      const a0 = ((i + off) / n) * Math.PI * 2;
      const a1 = ((i + 1 + off) / n) * Math.PI * 2 - 0.012;
      const p = (r: number, a: number) => `${r1(Math.cos(a) * r)},${r1(Math.sin(a) * r)}`;
      els.push(<path key={`${key}${i}`} d={`M${p(r0, a0)} L${p(r1v, a0)} A${r1v},${r1v} 0 0 1 ${p(r1v, a1)} L${p(r0, a1)} A${r0},${r0} 0 0 0 ${p(r0, a0)} Z`} fill={pick(colors, i * 7 + n)} />);
    }
  };
  els.push(<circle key="base" r={rx + 8} fill="#3a2e1e" />);
  els.push(<circle key="goldOuter" r={rx + 6} fill={C.goldLo} />);
  els.push(<circle key="goldOuter2" r={rx + 4} fill={C.gold} />);
  ring(rx - 26, rx, 48, ['#c9b48a', '#bfa97c', '#d3bf96', '#b8a275'], 'o');
  els.push(<circle key="gb1" r={rx - 26} fill="none" stroke={C.gold} strokeWidth={4} />);
  ring(rx - 66, rx - 28, 40, [C.lapis, '#1f2a5e', '#2a3878', '#273370'], 'l', 0.5);
  // gold star points on the lapis band
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rm = rx - 47;
    els.push(<path key={`sp${i}`} d="M0,-9 L3,0 L0,9 L-3,0 Z" transform={`translate(${r1(Math.cos(a) * rm)},${r1(Math.sin(a) * rm)}) rotate(${r1((a * 180) / Math.PI + 90)})`} fill={C.gold} />);
  }
  els.push(<circle key="gb2" r={rx - 68} fill="none" stroke={C.gold} strokeWidth={4} />);
  els.push(<circle key="inner" r={rx - 70} fill="#c2ab80" />);
  ring(rx - 108, rx - 70, 24, ['#cbb58a', '#b9a379', '#d4c099', '#c0aa7f'], 'i', 0.25);
  // rune glyphs in the inner band
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.13;
    const rm = rx - 89;
    els.push(<path key={`rg${i}`} d={runeGlyph(i, 9)} transform={`translate(${r1(Math.cos(a) * rm)},${r1(Math.sin(a) * rm)}) rotate(${r1((a * 180) / Math.PI + 90)})`} fill="none" stroke={C.rune} strokeWidth={2.4} strokeLinejoin="round" />);
  }
  els.push(<circle key="gb3" r={rx - 110} fill="none" stroke={C.gold} strokeWidth={3} />);
  // central sun medallion
  els.push(<circle key="cen" r={rx - 112} fill={C.lapis} />);
  const star = (n: number, ro: number, ri: number) => {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 ? ri : ro;
      d += `${i ? 'L' : 'M'}${r1(Math.cos(a) * r)},${r1(Math.sin(a) * r)}`;
    }
    return d + 'Z';
  };
  els.push(<path key="st1" d={star(16, rx - 118, rx - 140)} fill={C.gold} />);
  els.push(<path key="st2" d={star(8, rx - 138, rx - 160)} fill={C.goldHi} opacity={0.9} />);
  els.push(<circle key="core" r={rx - 168} fill={C.lapisHi} stroke={C.gold} strokeWidth={2.5} />);
  els.push(<circle key="core2" r={8} fill={C.rune} />);
  els.push(<circle key="core3" r={3.5} fill={C.runeHi} />);
  // spokes in gold through the outer ring
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    els.push(<line key={`sk${i}`} x1={r1(Math.cos(a) * (rx - 24))} y1={r1(Math.sin(a) * (rx - 24))} x2={r1(Math.cos(a) * rx)} y2={r1(Math.sin(a) * rx)} stroke={C.gold} strokeWidth={3} />);
  }
  return (
    <g transform={`translate(${MOS.cx},${MOS.cy}) scale(1,${r1(sy * 1000) / 1000})`}>
      <circle r={rx + 22} fill={`url(#${P}mglow)`} />
      <g opacity={0.9}>{els}</g>
      <circle r={rx + 4} fill={`url(#${P}msheen)`} />
    </g>
  );
}

// ---------------------------------------------------------------- walls & props

function sandBlocks(out: Els, x0: number, y0: number, x1: number, y1: number, seed: number, rowH = 15) {
  out.push(<rect key={`bm${seed}`} x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={C.sandLo} />);
  let row = 0;
  for (let y = y0; y < y1 - 1; y += rowH, row++) {
    const h = Math.min(rowH, y1 - y);
    let x = x0 - (row % 2) * 22;
    let k = 0;
    while (x < x1) {
      const w = 40 + rnd(seed + row * 17 + k * 5.3) * 14;
      const xa = Math.max(x0, x) + 0.8;
      const xb = Math.min(x1, x + w) - 0.8;
      if (xb > xa) {
        const s = seed + row * 53 + k;
        out.push(<rect key={`br${out.length}`} x={r1(xa)} y={r1(y + 0.8)} width={r1(xb - xa)} height={r1(h - 1.6)} fill={pick(C.face, s)} />);
        out.push(<rect key={`bh${out.length}`} x={r1(xa)} y={r1(y + 0.8)} width={r1(xb - xa)} height={1.4} fill={C.sandHi} opacity={0.45} />);
      }
      x += w;
      k++;
    }
  }
}

function capStrip(out: Els, x0: number, y0: number, x1: number, y1: number, seed: number, vertical: boolean) {
  out.push(<rect key={`cm${seed}`} x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={C.sandLo} />);
  const len = vertical ? y1 - y0 : x1 - x0;
  let p = 0;
  let k = 0;
  while (p < len) {
    const L = Math.min(len - p, 44);
    const s = seed + k * 7;
    const rect = vertical
      ? { x: x0 + 1, y: r1(y0 + p + 1), width: x1 - x0 - 2, height: r1(L - 2) }
      : { x: r1(x0 + p + 1), y: y0 + 1, width: r1(L - 2), height: y1 - y0 - 2 };
    out.push(<rect key={`cs${s}`} {...rect} fill={pick(C.sand, s)} />);
    out.push(<rect key={`ch${s}`} x={rect.x} y={rect.y} width={rect.width} height={1.5} fill={C.sandHi} opacity={0.6} />);
    p += L;
    k++;
  }
  // gold inlay line along the cap
  if (vertical) out.push(<rect key={`cg${seed}`} x={(x0 + x1) / 2 - 1.5} y={y0} width={3} height={y1 - y0} fill={C.gold} opacity={0.85} />);
  else out.push(<rect key={`cg${seed}`} x={x0} y={(y0 + y1) / 2 - 1} width={x1 - x0} height={2.4} fill={C.gold} opacity={0.85} />);
}

function Column({ x, top, bottom }: { x: number; top: number; bottom: number }) {
  const h = bottom - top;
  return (
    <g>
      <ellipse cx={x + 4} cy={bottom + 2} rx={20} ry={5} fill="#000" opacity={0.35} />
      {/* base */}
      <rect x={x - 16} y={bottom - 8} width={32} height={8} fill={C.marbleColLo} />
      <rect x={x - 16} y={bottom - 8} width={32} height={2} fill="#efe6d2" />
      <rect x={x - 13} y={bottom - 13} width={26} height={5} fill={C.gold} />
      {/* shaft with fluting */}
      <rect x={x - 11} y={top + 10} width={22} height={h - 23} fill={C.marbleCol} />
      <rect x={x - 11} y={top + 10} width={6} height={h - 23} fill="#f2ead8" opacity={0.8} />
      <rect x={x + 5} y={top + 10} width={6} height={h - 23} fill={C.marbleColLo} />
      {[-5, 0, 5].map((dx) => (
        <path key={dx} d={`M${x + dx},${top + 12} L${x + dx},${bottom - 15}`} stroke="#b3a487" strokeWidth={1} />
      ))}
      {/* capital */}
      <rect x={x - 14} y={top + 4} width={28} height={7} fill={C.gold} />
      <rect x={x - 14} y={top + 4} width={28} height={2} fill={C.goldHi} />
      <rect x={x - 17} y={top} width={34} height={5} fill={C.marbleColLo} />
      <rect x={x - 17} y={top} width={34} height={1.5} fill="#efe6d2" />
      <circle cx={x - 12} cy={top + 8} r={3} fill={C.goldLo} />
      <circle cx={x + 12} cy={top + 8} r={3} fill={C.goldLo} />
    </g>
  );
}

function Banner({ x }: { x: number }) {
  return (
    <g transform={`translate(${x},36)`}>
      <rect x={-17} y={-2} width={34} height={4} rx={2} fill={C.goldLo} />
      <circle cx={-17} cy={0} r={2.6} fill={C.gold} />
      <circle cx={17} cy={0} r={2.6} fill={C.gold} />
      <path d="M-14,2 L14,2 L14,44 L0,52 L-14,44 Z" fill={C.banner} />
      <path d="M4,2 L14,2 L14,44 L4,48 Z" fill={C.bannerLo} opacity={0.7} />
      <path d="M-14,2 L-14,44 L0,52 L14,44 L14,2" stroke={C.gold} strokeWidth={1.6} fill="none" />
      <circle cx={0} cy={22} r={7} fill={C.gold} />
      <circle cx={0} cy={22} r={11} fill="none" stroke={C.gold} strokeWidth={1.2} strokeDasharray="2 2" />
      <circle cx={0} cy={22} r={3} fill={C.banner} />
    </g>
  );
}

function Statue({ x, y, s, flip }: { x: number; y: number; s: number; flip: boolean }) {
  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
      <ellipse cx={4} cy={2} rx={26} ry={7} fill="#000" opacity={0.4} />
      {/* plinth */}
      <rect x={-20} y={-14} width={40} height={14} fill="#8c7856" />
      <rect x={-20} y={-14} width={40} height={3} fill={C.sandHi} />
      <rect x={-20} y={-6} width={40} height={2.5} fill={C.gold} />
      {/* robed guardian holding a staff */}
      <path d="M-12,-14 L-9,-48 Q-8,-56 0,-58 Q8,-56 9,-48 L12,-14 Z" fill="#c9b994" />
      <path d="M3,-14 L5,-50 Q8,-54 9,-48 L12,-14 Z" fill="#9c8c6a" />
      <path d="M-9,-40 Q0,-34 9,-40" stroke="#9c8c6a" strokeWidth={1.5} fill="none" />
      <circle cx={0} cy={-64} r={7} fill="#c9b994" />
      <path d="M-7,-66 Q0,-76 7,-66 L7,-62 Q0,-70 -7,-62 Z" fill="#a89772" />
      <path d="M-13,-50 L-14,-86" stroke={C.gold} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={-14} cy={-89} r={4.5} fill={C.rune} />
      <circle cx={-14} cy={-89} r={9} fill={`url(#${P}rglow)`} />
      <path d="M-12,-46 Q-8,-40 -4,-44" stroke="#c9b994" strokeWidth={4} fill="none" strokeLinecap="round" />
    </g>
  );
}

function BrazierBowl({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={3} cy={2} rx={14} ry={4.5} fill="#000" opacity={0.4} />
      <path d="M-4,0 L4,0 L2,-10 L-2,-10 Z" fill={C.bronze} />
      <path d="M-8,0 L8,0 L6,-3 L-6,-3 Z" fill="#6a4420" />
      <path d="M-12,-10 L12,-10 Q10,-20 0,-20 Q-10,-20 -12,-10 Z" fill={C.bronze} />
      <path d="M-12,-10 L12,-10 Q10,-14 0,-14 Q-10,-14 -12,-10 Z" fill="#b07a3a" />
      <ellipse cx={0} cy={-17} rx={10} ry={3} fill="#3a1a08" />
      <ellipse cx={0} cy={-17} rx={7} ry={2} fill="#ff8a2a" opacity={0.8} />
    </g>
  );
}

function RunePlate({ x, y, i }: { x: number; y: number; i: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-12} y={-12} width={24} height={24} transform="rotate(45)" fill="#2a2244" stroke={C.gold} strokeWidth={1.8} />
      <circle r={12} fill={`url(#${P}rglow)`} />
      <path d={runeGlyph(i, 6)} fill="none" stroke={C.runeHi} strokeWidth={1.6} strokeLinejoin="round" />
    </g>
  );
}

// ---------------------------------------------------------------- layout

const BRAZIERS = [
  [32, 120],
  [32, 330],
  [32, 488],
  [968, 120],
  [968, 330],
  [968, 488],
] as const;

const TempleGround = memo(function TempleGround() {
  const floor: Els = [];
  floorTiles(floor);
  // gold inlay lines radiating from the mosaic to the gates/corners
  const inlay: Els = [];
  [
    [500, 88],
    [56, 330],
    [944, 330],
    [500, 562],
  ].forEach(([x, y], i) => {
    inlay.push(<line key={`il${i}`} x1={MOS.cx} y1={MOS.cy} x2={x} y2={y} stroke={C.goldLo} strokeWidth={7} opacity={0.65} />);
    inlay.push(<line key={`ig${i}`} x1={MOS.cx} y1={MOS.cy} x2={x} y2={y} stroke={C.gold} strokeWidth={3} />);
    inlay.push(<line key={`ih${i}`} x1={MOS.cx} y1={MOS.cy} x2={x} y2={y} stroke={C.goldHi} strokeWidth={0.8} opacity={0.8} />);
  });
  // small corner mosaics (diamonds) in the four floor quadrants
  [
    [190, 175],
    [810, 175],
    [190, 480],
    [810, 480],
  ].forEach(([x, y], i) => {
    inlay.push(
      <g key={`cd${i}`} transform={`translate(${x},${y}) scale(1,0.74)`}>
        <rect x={-30} y={-30} width={60} height={60} transform="rotate(45)" fill={C.goldLo} />
        <rect x={-27} y={-27} width={54} height={54} transform="rotate(45)" fill={C.lapis} />
        <rect x={-17} y={-17} width={34} height={34} transform="rotate(45)" fill="none" stroke={C.gold} strokeWidth={2.5} />
        <path d={runeGlyph(i + 2, 10)} fill="none" stroke={C.rune} strokeWidth={2.4} strokeLinejoin="round" />
      </g>,
    );
  });

  // ---- outside top band: dusk sky glow + distant temple roofs
  const back: Els = [];
  back.push(<rect key="ob" x={-40} y={-40} width={1080} height={80} fill={C.outside} />);
  back.push(<rect key="obg" x={-40} y={-40} width={1080} height={80} fill={`url(#${P}dusk)`} />);
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * 115 + rnd(i) * 20;
    const w = 40 + rnd(i + 3) * 30;
    back.push(<path key={`rf${i}`} d={`M${r1(x - w / 2)},30 L${r1(x - w / 2)},12 L${x},${r1(-2 - rnd(i + 5) * 8)} L${r1(x + w / 2)},12 L${r1(x + w / 2)},30 Z`} fill="#2c2440" />);
    back.push(<path key={`rfg${i}`} d={`M${r1(x - w / 2)},12 L${x},${r1(-2 - rnd(i + 5) * 8)} L${r1(x + w / 2)},12`} stroke={C.goldLo} strokeWidth={1.4} fill="none" />);
  }

  // ---- top wall
  const walls: Els = [];
  capStrip(walls, 0, 24, 1000, 40, 201, false);
  sandBlocks(walls, 0, 40, 1000, 88, 301, 16);
  // carved gold frieze band
  walls.push(<rect key="fz" x={0} y={44} width={1000} height={9} fill="#5e4a2a" />);
  for (let x = 4; x < 1000; x += 16) walls.push(<path key={`fz${x}`} d={`M${x},51 L${x},46 L${x + 10},46 L${x + 10},50 L${x + 5},50`} stroke={C.gold} strokeWidth={1.4} fill="none" />);
  walls.push(<rect key="tao" x={0} y={40} width={1000} height={48} fill={`url(#${P}faceAO)`} />);
  // great doorway with rune arch
  walls.push(
    <g key="door">
      <rect x={446} y={22} width={108} height={68} fill="#8c7856" />
      <path d="M462,90 L462,56 Q500,24 538,56 L538,90 Z" fill="#14102a" />
      <path d="M462,90 L462,56 Q500,24 538,56 L538,90 Z" fill={`url(#${P}door)`} />
      <path d="M462,56 Q500,24 538,56" stroke={C.gold} strokeWidth={4} fill="none" />
      <path d="M455,56 Q500,16 545,56" stroke={C.goldLo} strokeWidth={2} fill="none" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = Math.PI + (i + 0.5) * (Math.PI / 5);
        return <path key={i} d={runeGlyph(i, 3.6)} transform={`translate(${r1(500 + Math.cos(a) * 34)},${r1(58 + Math.sin(a) * 26)})`} fill="none" stroke={C.runeHi} strokeWidth={1.4} />;
      })}
      <circle cx={500} cy={70} r={6} fill={C.rune} opacity={0.9} />
      <circle cx={500} cy={70} r={16} fill={`url(#${P}rglow)`} />
    </g>,
  );
  // banners between columns + columns
  [195, 345, 655, 805].forEach((x, i) => walls.push(<Banner key={`bn${i}`} x={x} />));
  [120, 270, 420, 580, 730, 880].forEach((x, i) => walls.push(<Column key={`co${i}`} x={x} top={8} bottom={90} />));

  // ---- side walls
  for (const side of [0, 1]) {
    const xc0 = side ? 948 : 12;
    const xc1 = side ? 988 : 52;
    walls.push(<rect key={`so${side}`} x={side ? 988 : -40} y={40} width={52} height={560} fill={C.outside} />);
    capStrip(walls, xc0, 40, xc1, 566, 400 + side * 50, true);
    walls.push(<rect key={`sf${side}`} x={side ? 942 : 52} y={42} width={6} height={520} fill={C.sandLo} />);
    walls.push(<rect key={`ss${side}`} x={side ? 920 : 58} y={88} width={22} height={474} fill={`url(#${P}${side ? 'shR' : 'shL'})`} />);
    [225, 425].forEach((y, i) => walls.push(<RunePlate key={`rp${side}${i}`} x={side ? 968 : 32} y={y} i={i + side * 2} />));
  }
  BRAZIERS.forEach(([x, y], i) => walls.push(<BrazierBowl key={`bz${i}`} x={x} y={y} />));

  // ---- bottom wall
  const bottom: Els = [];
  capStrip(bottom, 0, 560, 1000, 576, 601, false);
  sandBlocks(bottom, 0, 576, 1000, 600, 701, 12);
  bottom.push(<rect key="bgl" x={0} y={575} width={1000} height={3} fill={C.gold} opacity={0.8} />);
  bottom.push(<rect key="bao" x={0} y={578} width={1000} height={22} fill="#000" opacity={0.2} />);
  bottom.push(<rect key="bsh" x={56} y={552} width={888} height={8} fill={`url(#${P}shB)`} />);
  [250, 750].forEach((x, i) => bottom.push(<BrazierBowl key={`bbz${i}`} x={x} y={572} />));

  // ---- corner statues on plinths
  const corners: Els = [];
  for (const [x, y, flip] of [
    [0, 0, false],
    [936, 0, true],
  ] as const) {
    corners.push(<rect key={`cp${x}`} x={x} y={y + 22} width={64} height={70} fill="#8c7856" />);
    sandBlocks(corners, x, y + 50, x + 64, y + 92, 900 + x, 14);
    corners.push(<rect key={`cpt${x}`} x={x - 2} y={y + 18} width={68} height={34} fill={C.sand[0]} />);
    corners.push(<rect key={`cpg${x}`} x={x - 2} y={y + 48} width={68} height={3} fill={C.gold} />);
    corners.push(<Statue key={`stt${x}`} x={x + 32} y={y + 46} s={0.5} flip={flip} />);
  }
  for (const x of [0, 936]) {
    corners.push(<rect key={`bp${x}`} x={x} y={540} width={64} height={60} fill={C.sand[2]} />);
    corners.push(<rect key={`bpg${x}`} x={x} y={540} width={64} height={2} fill={C.sandHi} />);
    corners.push(<rect key={`bpi${x}`} x={x + 10} y={550} width={44} height={22} fill="none" stroke={C.gold} strokeWidth={2} />);
    corners.push(<BrazierBowl key={`bpb${x}`} x={x + 32} y={566} />);
  }

  return (
    <g>
      <defs>
        <linearGradient id={`${P}faceAO`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={0.1} />
          <stop offset="0.4" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.45} />
        </linearGradient>
        <linearGradient id={`${P}shT`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={0.45} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${P}shB`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.35} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${P}shL`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.4} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${P}shR`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.4} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${P}dusk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.4" stopColor="#6a4aa0" stopOpacity={0} />
          <stop offset="1" stopColor="#f0a050" stopOpacity={0.35} />
        </linearGradient>
        <radialGradient id={`${P}light`} cx="0.5" cy="0.5" r="0.65">
          <stop offset="0" stopColor="#fff2c8" stopOpacity={0.08} />
          <stop offset="0.6" stopColor="#000" stopOpacity={0.06} />
          <stop offset="1" stopColor="#0a0614" stopOpacity={0.5} />
        </radialGradient>
        <radialGradient id={`${P}mglow`}>
          <stop offset="0.85" stopColor="#9b8cff" stopOpacity={0.25} />
          <stop offset="1" stopColor="#9b8cff" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${P}msheen`} cx="0.35" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity={0.14} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${P}rglow`}>
          <stop offset="0" stopColor="#b8a8ff" stopOpacity={0.6} />
          <stop offset="1" stopColor="#9b8cff" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${P}door`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#9b8cff" stopOpacity={0.55} />
          <stop offset="1" stopColor="#4a3a9a" stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <rect x={-40} y={-40} width={1080} height={680} fill={C.void} />
      <rect x={50} y={86} width={900} height={478} fill={C.grout} />
      {keyed(floor)}
      {keyed(inlay)}
      <Mosaic />
      <rect x={52} y={86} width={896} height={478} fill={`url(#${P}light)`} />
      <rect x={52} y={88} width={896} height={22} fill={`url(#${P}shT)`} />
      {keyed(back)}
      {keyed(walls)}
      {keyed(bottom)}
      {keyed(corners)}
    </g>
  );
});

// ---------------------------------------------------------------- ambient

const MOTES = 30;
function TempleAmbient({ t }: { t: number }) {
  const els: Els = [];
  // brazier flames (side walls, bottom wall, bottom corners)
  const flames: [number, number][] = [...BRAZIERS.map(([x, y]) => [x, y - 18] as [number, number]), [250, 554], [750, 554], [32, 548], [968, 548]];
  flames.forEach(([x, y], i) => {
    const f = 0.85 + 0.1 * Math.sin(t * 12 + i * 1.7) + 0.06 * Math.sin(t * 21.7 + i * 3.1);
    const sway = Math.sin(t * 5 + i) * 1.5;
    const h = 18 * f;
    els.push(
      <g key={`fl${i}`} transform={`translate(${x},${y})`}>
        <circle cx={0} cy={-6} r={r1(26 * f)} fill={`url(#${P}fire)`} />
        <path d={`M-7,0 Q-8,${r1(-h * 0.5)} ${r1(sway)},${r1(-h)} Q8,${r1(-h * 0.45)} 7,0 Q0,3 -7,0 Z`} fill="#ff8a2a" opacity={0.92} />
        <path d={`M-3.5,0 Q-3.5,${r1(-h * 0.35)} ${r1(sway * 0.6)},${r1(-h * 0.62)} Q3.5,${r1(-h * 0.3)} 3.5,0 Z`} fill="#fff1b8" />
      </g>,
    );
  });
  // floating rune motes rising from the mosaic and drifting outward
  for (let i = 0; i < MOTES; i++) {
    const per = 5 + rnd(i * 2.9) * 4;
    const k = ((t + rnd(i * 6.3) * per) % per) / per;
    const a = rnd(i * 4.1) * Math.PI * 2;
    const r = 30 + rnd(i * 3.7) * 170 + k * 30;
    const x = MOS.cx + Math.cos(a) * r + Math.sin(t * 0.9 + i) * 6;
    const y = MOS.cy + Math.sin(a) * r * 0.75 - k * 70;
    const op = Math.sin(Math.PI * k) * (0.6 + 0.4 * Math.sin(t * 4 + i * 2));
    const s = 2.4 + rnd(i * 1.3) * 2.2;
    els.push(
      <path
        key={`m${i}`}
        d={i % 3 === 0 ? runeGlyph(i, s) : `M0,${r1(-s)} L${r1(s * 0.6)},0 L0,${r1(s)} L${r1(-s * 0.6)},0 Z`}
        transform={`translate(${r1(x)},${r1(y)})`}
        fill={i % 3 === 0 ? 'none' : i % 2 ? '#b8a8ff' : '#8ab8ff'}
        stroke={i % 3 === 0 ? '#d8d0ff' : 'none'}
        strokeWidth={1.2}
        opacity={r1(Math.max(0, op) * 100) / 100}
      />,
    );
  }
  // gentle pulse on the doorway rune
  const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
  els.push(<circle key="door" cx={500} cy={64} r={r1(26 + pulse * 6)} fill={`url(#${P}arune)`} opacity={r1((0.5 + pulse * 0.4) * 100) / 100} />);
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id={`${P}fire`}>
          <stop offset="0" stopColor="#ffb050" stopOpacity={0.45} />
          <stop offset="1" stopColor="#ff8a2a" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${P}arune`}>
          <stop offset="0" stopColor="#b8a8ff" stopOpacity={0.5} />
          <stop offset="1" stopColor="#9b8cff" stopOpacity={0} />
        </radialGradient>
      </defs>
      {keyed(els)}
    </g>
  );
}

export const templeTerrain: TerrainDef = {
  id: 'temple',
  name: 'Sanctum of the Sun',
  accent: '#e8c35a',
  Ground: TempleGround,
  Ambient: TempleAmbient,
};
