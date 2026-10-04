// Dire terrain — "Blighted Bastion": corrupted Dire fortress courtyard. Dark red-brown cracked flagstones
// split by glowing lava fissures, black fortress walls with iron spikes, banners and a sealed gate,
// dead twisted trees, bone spikes and blood-red crystals outside. Ambient: rising embers, lava pulse,
// torch flicker. Arena coordinates 1000 x 600; playable floor x 60..940, y 90..560 kept clear.
import { cloneElement, memo } from 'react';
import type { ReactElement } from 'react';
import type { TerrainDef } from '../types.ts';

const P = 't2dire-'; // svg id prefix (two terrains can be on screen during a cross-fade)

const rnd = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const r1 = (n: number) => Math.round(n * 10) / 10;
const pick = <T,>(arr: readonly T[], i: number): T => arr[Math.floor(rnd(i) * arr.length) % arr.length] as T;

// ------------------------------------------------------------------ palette
const C = {
  void: '#130908',
  outside: '#1f100d',
  mortar: '#160b09',
  stones: ['#3d2520', '#43281f', '#39221d', '#482c24', '#3f2520', '#4c2f26', '#352019'] as const,
  stoneHi: '#6e4636',
  stoneLo: '#170b09',
  wallCap: ['#3b2b28', '#37282a', '#3f2f2b', '#33251f', '#423029'] as const,
  wallFace: ['#2a1d1c', '#261a19', '#2f2120', '#231817', '#2c1f1d'] as const,
  wallHi: '#5a423c',
  iron: '#1a1414',
  ironHi: '#5b4c4a',
  lava: '#ff6a1a',
  lavaCore: '#ffd36a',
  lavaGlow: '#ff3c0a',
  bone: '#d6c9ad',
  boneLo: '#9b8c70',
  crystal: '#c42c5c',
  crystalLo: '#6e1438',
  crystalHi: '#ff9cc0',
  banner: '#6e1218',
  bannerLo: '#3e080c',
  gold: '#b8893a',
};

type Els = ReactElement[];
// generated arrays are re-keyed by index at render so generator keys can never collide
const keyed = (els: Els) => els.map((e, i) => cloneElement(e, { key: i }));

// irregular stone flagstones filling a rect
function flagstones(out: Els, x0: number, y0: number, x1: number, y1: number, seed: number) {
  let y = y0;
  let row = 0;
  while (y < y1 - 2) {
    const h = Math.min(y1 - y, 32 + rnd(seed + row * 7.3) * 16);
    let x = x0 - rnd(seed + row * 1.7) * 50;
    let k = 0;
    while (x < x1) {
      const w = 42 + rnd(seed + row * 31 + k * 3.7) * 52;
      const xa = Math.max(x0, x);
      const xb = Math.min(x1, x + w);
      if (xb - xa > 5) {
        const s = seed + row * 97 + k * 13;
        const j = (n: number) => (rnd(s + n) - 0.5) * 3.2;
        const g = 1.7;
        const ax = r1(xa + g + j(1)), ay = r1(y + g + j(2));
        const bx = r1(xb - g + j(3)), by = r1(y + g + j(4));
        const cx = r1(xb - g + j(5)), cy = r1(y + h - g + j(6));
        const dx = r1(xa + g + j(7)), dy = r1(y + h - g + j(8));
        out.push(<path key={`fs${s}`} d={`M${ax},${ay}L${bx},${by}L${cx},${cy}L${dx},${dy}Z`} fill={pick(C.stones, s + 9)} />);
        out.push(<path key={`fh${s}`} d={`M${dx},${dy}L${ax},${ay}L${bx},${by}`} stroke={C.stoneHi} strokeWidth={1.1} fill="none" opacity={0.35} />);
        out.push(<path key={`fl${s}`} d={`M${bx},${by}L${cx},${cy}L${dx},${dy}`} stroke={C.stoneLo} strokeWidth={1.4} fill="none" opacity={0.7} />);
        // hairline crack in some stones
        if (rnd(s + 21) > 0.72) {
          const sx = r1(xa + (xb - xa) * (0.2 + rnd(s + 22) * 0.6));
          out.push(
            <path key={`fc${s}`} d={`M${sx},${r1(y + g)}l${r1(rnd(s + 23) * 8 - 4)},${r1(h * 0.35)}l${r1(rnd(s + 24) * 10 - 5)},${r1(h * 0.3)}`} stroke={C.stoneLo} strokeWidth={1} fill="none" opacity={0.8} />,
          );
        }
        // worn speckle
        if (rnd(s + 31) > 0.6) {
          out.push(<ellipse key={`fw${s}`} cx={r1((ax + bx) / 2)} cy={r1((ay + cy) / 2)} rx={r1((xb - xa) * 0.28)} ry={r1(h * 0.22)} fill="#000" opacity={0.12} />);
        }
      }
      x += w;
      k++;
    }
    y += h;
    row++;
  }
}

// random-walk crack path
function crackD(seed: number, x: number, y: number, steps: number, ang: number, stepLen = 16): string {
  let d = `M${r1(x)},${r1(y)}`;
  let a = ang;
  for (let i = 0; i < steps; i++) {
    a += (rnd(seed + i * 1.31) - 0.5) * 1.3;
    const L = stepLen * (0.6 + rnd(seed + i * 2.9) * 0.8);
    x += Math.cos(a) * L;
    y += Math.sin(a) * L * 0.8;
    d += `L${r1(x)},${r1(y)}`;
  }
  return d;
}

function Lava({ d, w = 1 }: { d: string; w?: number }) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={d} stroke={C.lavaGlow} strokeWidth={11 * w} opacity={0.13} />
      <path d={d} stroke="#120604" strokeWidth={5 * w} />
      <path d={d} stroke={C.lava} strokeWidth={3 * w} opacity={0.95} />
      <path d={d} stroke={C.lavaCore} strokeWidth={1.1 * w} opacity={0.9} />
    </g>
  );
}

// twisted dead tree, trunk base at (x,y)
function deadTree(out: Els, x: number, y: number, s: number, seed: number) {
  const parts: ReactElement[] = [];
  const branch = (bx: number, by: number, ang: number, len: number, wid: number, depth: number, sd: number) => {
    const bend = (rnd(sd) - 0.5) * 0.9;
    const mx = bx + Math.cos(ang + bend) * len * 0.5;
    const my = by + Math.sin(ang + bend) * len * 0.5;
    const ex = bx + Math.cos(ang) * len;
    const ey = by + Math.sin(ang) * len;
    parts.push(<path key={`b${sd}`} d={`M${r1(bx)},${r1(by)}Q${r1(mx)},${r1(my)} ${r1(ex)},${r1(ey)}`} stroke="#1a100e" strokeWidth={r1(wid)} strokeLinecap="round" fill="none" />);
    if (wid > 3) parts.push(<path key={`h${sd}`} d={`M${r1(bx - wid * 0.25)},${r1(by)}Q${r1(mx - wid * 0.25)},${r1(my)} ${r1(ex)},${r1(ey)}`} stroke="#3c2620" strokeWidth={r1(wid * 0.3)} strokeLinecap="round" fill="none" opacity={0.8} />);
    if (depth > 0) {
      const n = 2;
      for (let i = 0; i < n; i++) {
        const na = ang + (i === 0 ? -1 : 1) * (0.35 + rnd(sd + i * 5) * 0.5);
        branch(ex, ey, na, len * (0.62 + rnd(sd + i * 7) * 0.2), wid * 0.62, depth - 1, sd * 3 + i + 1);
      }
    }
  };
  branch(0, 0, -Math.PI / 2 + (rnd(seed) - 0.5) * 0.4, 34, 9, 4, seed);
  out.push(
    <g key={`dt${seed}`} transform={`translate(${r1(x)},${r1(y)}) scale(${r1(s * 100) / 100})`}>
      <ellipse cx={0} cy={1} rx={16} ry={5} fill="#000" opacity={0.4} />
      <path d="M-8,2 Q-4,-6 -3,-14 L3,-14 Q4,-6 9,2 Z" fill="#1a100e" />
      {keyed(parts)}
    </g>,
  );
}

function crystals(out: Els, x: number, y: number, s: number, seed: number) {
  const shards: ReactElement[] = [];
  const n = 3 + Math.floor(rnd(seed) * 3);
  for (let i = 0; i < n; i++) {
    const a = (rnd(seed + i * 3) - 0.5) * 70;
    const h = 18 + rnd(seed + i * 7) * 22 - (i > 0 ? 6 : 0);
    const w = 6 + rnd(seed + i * 11) * 4;
    const ox = (i - (n - 1) / 2) * 5;
    shards.push(
      <g key={i} transform={`translate(${r1(ox)},0) rotate(${r1(a)})`}>
        <path d={`M${-w / 2},0 L${-w / 2},${r1(-h * 0.72)} L0,${r1(-h)} L0,0 Z`} fill={C.crystal} />
        <path d={`M0,0 L0,${r1(-h)} L${w / 2},${r1(-h * 0.72)} L${w / 2},0 Z`} fill={C.crystalLo} />
        <path d={`M${r1(-w * 0.3)},${r1(-h * 0.15)} L${r1(-w * 0.3)},${r1(-h * 0.7)} L0,${r1(-h * 0.92)}`} stroke={C.crystalHi} strokeWidth={1} fill="none" opacity={0.7} />
      </g>,
    );
  }
  out.push(
    <g key={`cr${seed}`} transform={`translate(${r1(x)},${r1(y)}) scale(${r1(s * 100) / 100})`}>
      <ellipse cx={0} cy={0} rx={30} ry={12} fill={`url(#${P}cglow)`} />
      <ellipse cx={0} cy={1} rx={13} ry={4} fill="#000" opacity={0.45} />
      {keyed(shards)}
    </g>,
  );
}

function boneSpike(out: Els, x: number, y: number, s: number, flip: boolean, key: string) {
  out.push(
    <g key={key} transform={`translate(${r1(x)},${r1(y)}) scale(${flip ? -s : s},${s})`}>
      <ellipse cx={0} cy={1} rx={9} ry={3} fill="#000" opacity={0.4} />
      <path d="M-5,0 Q-7,-18 6,-36 Q1,-18 5,0 Z" fill={C.bone} />
      <path d="M1,0 Q0,-18 6,-36 Q3,-16 5,0 Z" fill={C.boneLo} />
      <path d="M-5,-3 L5,-3" stroke="#5b4c3a" strokeWidth={1} />
      <path d="M-6,-10 L4,-10" stroke="#5b4c3a" strokeWidth={0.8} opacity={0.7} />
    </g>,
  );
}

function skull(out: Els, x: number, y: number, s: number, key: string, rot = 0) {
  out.push(
    <g key={key} transform={`translate(${r1(x)},${r1(y)}) rotate(${rot}) scale(${s})`}>
      <ellipse cx={0} cy={3} rx={7} ry={2.5} fill="#000" opacity={0.35} />
      <path d="M-6,0 Q-7,-10 0,-11 Q7,-10 6,0 L4,3 L-4,3 Z" fill={C.bone} />
      <circle cx={-2.6} cy={-4} r={1.8} fill="#1a0d0a" />
      <circle cx={2.6} cy={-4} r={1.8} fill="#1a0d0a" />
      <path d="M-2,2 L2,2" stroke="#1a0d0a" strokeWidth={0.8} />
    </g>,
  );
}

// a run of wall-face bricks (top wall face / tower faces)
function bricks(out: Els, x0: number, y0: number, x1: number, y1: number, seed: number, rowH = 11.5) {
  out.push(<rect key={`bm${seed}`} x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="#120a09" />);
  let row = 0;
  for (let y = y0; y < y1 - 1; y += rowH, row++) {
    const h = Math.min(rowH, y1 - y);
    let x = x0 - (row % 2) * 16 - rnd(seed + row) * 8;
    let k = 0;
    while (x < x1) {
      const w = 26 + rnd(seed + row * 17 + k * 5.3) * 22;
      const xa = Math.max(x0, x) + 0.8;
      const xb = Math.min(x1, x + w) - 0.8;
      if (xb > xa) {
        const s = seed + row * 53 + k;
        out.push(<rect key={`br${out.length}`} x={r1(xa)} y={r1(y + 0.8)} width={r1(xb - xa)} height={r1(h - 1.6)} fill={pick(C.wallFace, s)} />);
        out.push(<rect key={`bh${out.length}`} x={r1(xa)} y={r1(y + 0.8)} width={r1(xb - xa)} height={1.2} fill={C.wallHi} opacity={0.35} />);
      }
      x += w;
      k++;
    }
  }
}

// wall top surface seen from above: slabs along a strip
function capSlabs(out: Els, x0: number, y0: number, x1: number, y1: number, seed: number, vertical: boolean) {
  out.push(<rect key={`cm${seed}`} x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="#140c0b" />);
  const len = vertical ? y1 - y0 : x1 - x0;
  let p = 0;
  let k = 0;
  while (p < len) {
    const L = Math.min(len - p, 30 + rnd(seed + k * 3.1) * 26);
    const s = seed + k * 7;
    const col = pick(C.wallCap, s);
    if (vertical) {
      out.push(<rect key={`cs${s}`} x={x0 + 1} y={r1(y0 + p + 1)} width={x1 - x0 - 2} height={r1(L - 2)} fill={col} />);
      out.push(<rect key={`ch${s}`} x={x0 + 1} y={r1(y0 + p + 1)} width={x1 - x0 - 2} height={1.2} fill={C.wallHi} opacity={0.5} />);
    } else {
      out.push(<rect key={`cs${s}`} x={r1(x0 + p + 1)} y={y0 + 1} width={r1(L - 2)} height={y1 - y0 - 2} fill={col} />);
      out.push(<rect key={`ch${s}`} x={r1(x0 + p + 1)} y={y0 + 1} width={r1(L - 2)} height={1.2} fill={C.wallHi} opacity={0.5} />);
    }
    p += L;
    k++;
  }
}

function spikesRow(out: Els, x0: number, x1: number, yBase: number, step: number, hgt: number, seed: number) {
  for (let x = x0; x <= x1; x += step) {
    const h = hgt * (0.8 + rnd(seed + x) * 0.4);
    out.push(
      <g key={`sp${seed}-${x}`}>
        <path d={`M${x - 4},${yBase} L${x},${r1(yBase - h)} L${x + 4},${yBase} Z`} fill={C.iron} />
        <path d={`M${x - 4},${yBase} L${x},${r1(yBase - h)} L${x - 0.6},${yBase} Z`} fill={C.ironHi} opacity={0.6} />
      </g>,
    );
  }
}

function tower(out: Els, x0: number, y0: number, x1: number, capY: number, y1: number, seed: number) {
  // body face
  bricks(out, x0, capY, x1, y1, seed + 500, 12);
  out.push(<rect key={`tfs${seed}`} x={x0} y={capY} width={x1 - x0} height={y1 - capY} fill={`url(#${P}faceAO)`} />);
  // top
  out.push(<rect key={`tt${seed}`} x={x0 - 3} y={y0} width={x1 - x0 + 6} height={capY - y0 + 2} fill="#2e2120" />);
  out.push(<rect key={`tti${seed}`} x={x0 + 6} y={y0 + 6} width={x1 - x0 - 12} height={capY - y0 - 10} fill="#1e1413" />);
  out.push(<rect key={`ttl${seed}`} x={x0 - 3} y={capY} width={x1 - x0 + 6} height={2.5} fill={C.wallHi} opacity={0.6} />);
  // merlons
  for (let i = 0; i < 4; i++) {
    const mx = x0 - 3 + i * ((x1 - x0 + 6 - 10) / 3);
    out.push(<rect key={`tm${seed}-${i}`} x={r1(mx)} y={y0 - 6} width={10} height={9} fill="#3c2c29" />);
    out.push(<rect key={`tmh${seed}-${i}`} x={r1(mx)} y={y0 - 6} width={10} height={2} fill={C.wallHi} />);
  }
}

function Banner({ x }: { x: number }) {
  return (
    <g transform={`translate(${x},40)`}>
      <rect x={-21} y={-3} width={42} height={5} rx={2} fill={C.iron} />
      <path d="M-17,2 L17,2 L17,40 L9,34 L0,46 L-9,34 L-17,40 Z" fill={C.banner} />
      <path d="M5,2 L17,2 L17,40 L9,34 L5,40 Z" fill={C.bannerLo} opacity={0.8} />
      <path d="M-17,6 L17,6" stroke={C.gold} strokeWidth={1.5} opacity={0.8} />
      {/* dire emblem: horned skull-ish sigil */}
      <path d="M-8,14 Q-12,10 -11,4 Q-7,10 -4,12 Z M8,14 Q12,10 11,4 Q7,10 4,12 Z" fill={C.gold} />
      <path d="M-6,13 Q0,8 6,13 Q7,22 2,26 L-2,26 Q-7,22 -6,13 Z" fill={C.bone} opacity={0.92} />
      <circle cx={-2.3} cy={17} r={1.5} fill={C.bannerLo} />
      <circle cx={2.3} cy={17} r={1.5} fill={C.bannerLo} />
    </g>
  );
}

function Gate() {
  return (
    <g>
      <rect x={444} y={28} width={112} height={62} fill="#160d0c" />
      {/* arch opening with infernal glow */}
      <path d="M464,88 L464,60 Q500,32 536,60 L536,88 Z" fill="#0a0404" />
      <path d="M464,88 L464,60 Q500,32 536,60 L536,88 Z" fill={`url(#${P}gate)`} />
      {[472, 482, 492, 502, 512, 522, 530].map((x) => (
        <path key={x} d={`M${x},${x < 480 || x > 520 ? 56 : 46} L${x},88`} stroke="#2a1d1b" strokeWidth={2.4} />
      ))}
      <path d="M466,66 L534,66 M466,78 L534,78" stroke="#2a1d1b" strokeWidth={2} />
      <path d="M464,60 Q500,32 536,60" stroke="#4a3430" strokeWidth={4} fill="none" />
      {/* gate pillars */}
      {[446, 538].map((x) => (
        <g key={x}>
          <rect x={x} y={20} width={16} height={70} fill="#2c1f1d" />
          <rect x={x} y={20} width={5} height={70} fill="#3e2c28" />
          <rect x={x - 3} y={14} width={22} height={8} fill="#3d2b28" />
          <rect x={x - 3} y={14} width={22} height={2} fill={C.wallHi} />
          <path d={`M${x + 1},14 L${x + 8},-2 L${x + 15},14 Z`} fill={C.iron} />
        </g>
      ))}
      <g transform="translate(500,36)">
        <path d="M-12,4 Q-20,-4 -18,-14 Q-12,-4 -7,-1 Z M12,4 Q20,-4 18,-14 Q12,-4 7,-1 Z" fill={C.bone} />
        <path d="M-8,0 Q0,-8 8,0 Q9,10 3,13 L-3,13 Q-9,10 -8,0 Z" fill={C.bone} />
        <circle cx={-3} cy={4} r={2.2} fill="#ff4a10" />
        <circle cx={3} cy={4} r={2.2} fill="#ff4a10" />
      </g>
    </g>
  );
}

function Sconce({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={0} cy={-6} r={18} fill={`url(#${P}torch)`} />
      <path d="M-2,10 L2,10 L3,0 L-3,0 Z" fill={C.iron} />
      <path d="M-6,0 L6,0 L4,-5 L-4,-5 Z" fill="#2a2020" stroke={C.ironHi} strokeWidth={0.6} />
    </g>
  );
}

// ------------------------------------------------------------------ Ground
const TORCHES = [
  [150, 66],
  [360, 66],
  [640, 66],
  [850, 66],
] as const;
const FISSURES = [
  { x: 500, y: 325 },
  { x: 140, y: 150 },
  { x: 860, y: 470 },
  { x: 860, y: 150 },
  { x: 150, y: 480 },
] as const;

const DireGround = memo(function DireGround() {
  const floor: Els = [];
  flagstones(floor, 56, 88, 944, 562, 11);

  // decals
  const decals: Els = [];
  for (let i = 0; i < 70; i++) {
    const x = 70 + rnd(i * 4.1 + 3) * 860;
    const y = 100 + rnd(i * 6.7 + 9) * 450;
    decals.push(<ellipse key={`pb${i}`} cx={r1(x)} cy={r1(y)} rx={r1(1.5 + rnd(i) * 2.5)} ry={r1(1 + rnd(i + 1) * 1.6)} fill={i % 3 ? '#59392d' : '#24130f'} opacity={0.8} />);
  }
  for (let i = 0; i < 9; i++) {
    const x = 90 + rnd(i * 9.3 + 40) * 820;
    const y = 110 + rnd(i * 3.3 + 41) * 430;
    decals.push(<ellipse key={`sc${i}`} cx={r1(x)} cy={r1(y)} rx={r1(26 + rnd(i + 5) * 30)} ry={r1(14 + rnd(i + 6) * 14)} fill={`url(#${P}scorch)`} />);
  }
  skull(decals, 92, 540, 1, 'sk1', -12);
  skull(decals, 905, 112, 0.9, 'sk2', 18);
  skull(decals, 930, 530, 1.1, 'sk3', 6);
  skull(decals, 74, 300, 0.8, 'sk4', -30);
  for (let i = 0; i < 8; i++) {
    const x = 80 + rnd(i * 13.1 + 70) * 840;
    const y = 120 + rnd(i * 5.9 + 71) * 420;
    decals.push(<path key={`bf${i}`} d={`M${r1(x)},${r1(y)} l${r1(6 + rnd(i) * 5)},${r1(rnd(i + 2) * 4 - 2)}`} stroke={C.boneLo} strokeWidth={2.2} strokeLinecap="round" opacity={0.75} />);
  }

  // lava fissures
  const lava: Els = [];
  FISSURES.forEach((f, fi) => {
    const arms = fi === 0 ? 7 : 3;
    for (let a = 0; a < arms; a++) {
      const ang = (a / arms) * Math.PI * 2 + rnd(fi * 10 + a) * 0.6;
      const steps = fi === 0 ? 6 + Math.floor(rnd(fi + a * 3) * 4) : 3 + Math.floor(rnd(fi + a * 3) * 3);
      const sx = f.x + Math.cos(ang) * (fi === 0 ? 46 : 4);
      const sy = f.y + Math.sin(ang) * (fi === 0 ? 36 : 3);
      const d = crackD(fi * 100 + a * 17, sx, sy, steps, ang, fi === 0 ? 18 : 14);
      lava.push(<Lava key={`lv${fi}-${a}`} d={d} w={fi === 0 ? 1 : 0.8} />);
      if (rnd(fi * 7 + a) > 0.4) {
        lava.push(<Lava key={`lb${fi}-${a}`} d={crackD(fi * 300 + a * 7, sx + Math.cos(ang) * 30, sy + Math.sin(ang) * 24, 3, ang + 0.9, 11)} w={0.6} />);
      }
    }
  });
  // edge cracks leaking from under the walls
  [
    [90, 92, 1.4],
    [300, 92, 1.7],
    [720, 92, 1.5],
    [60, 380, 0.2],
    [940, 300, 3.1],
    [420, 560, -1.5],
    [640, 560, -1.7],
  ].forEach(([x, y, a], i) => lava.push(<Lava key={`le${i}`} d={crackD(900 + i * 41, x!, y!, 4, a!, 13)} w={0.7} />));

  // center corrupted sigil
  const sigil = (
    <g transform="translate(500,325)">
      <ellipse rx={130} ry={100} fill={`url(#${P}pit)`} />
      <ellipse rx={118} ry={91} fill="none" stroke="#120706" strokeWidth={7} opacity={0.75} />
      <ellipse rx={118} ry={91} fill="none" stroke="#ff5a1e" strokeWidth={1.2} opacity={0.35} />
      <ellipse rx={98} ry={76} fill="none" stroke="#ff5a1e" strokeWidth={2} strokeDasharray="3 9" opacity={0.3} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <path key={i} d="M0,-5 L3,0 L0,5 L-3,0 Z" transform={`translate(${r1(Math.cos(a) * 108)},${r1(Math.sin(a) * 83)})`} fill="#ff7a2a" opacity={0.45} />;
      })}
      <ellipse rx={46} ry={35} fill="#140807" opacity={0.85} />
      <ellipse rx={38} ry={29} fill={`url(#${P}core)`} />
    </g>
  );

  // ---- walls
  const back: Els = [];
  // outside strip behind the top wall: lava streams + rocks
  back.push(<rect key="ob" x={-40} y={-40} width={1080} height={80} fill={C.outside} />);
  back.push(<rect key="oh" x={-40} y={-40} width={1080} height={80} fill={`url(#${P}haze)`} />);
  back.push(<Lava key="ol1" d="M-20,18 Q120,4 240,16 T480,10 T720,20 T1020,8" w={1.6} />);
  back.push(<Lava key="ol2" d="M60,32 Q140,24 210,30 M760,30 Q840,22 940,32" w={0.8} />);
  [40, 120, 250, 350, 590, 660, 840, 930].forEach((x, i) => deadTree(back, x + rnd(i) * 20, 34, 0.85 + rnd(i + 3) * 0.3, 50 + i * 3));
  [160, 410, 620, 890].forEach((x, i) => crystals(back, x, 30, 0.65 + rnd(i + 8) * 0.2, 80 + i * 7));

  const walls: Els = [];
  // top wall
  capSlabs(walls, 0, 26, 1000, 42, 201, false);
  walls.push(<rect key="tcl" x={0} y={41} width={1000} height={2.2} fill={C.wallHi} opacity={0.7} />);
  spikesRow(walls, 70, 430, 33, 24, 15, 7);
  spikesRow(walls, 574, 930, 33, 24, 15, 9);
  bricks(walls, 0, 43, 1000, 89, 301);
  walls.push(<rect key="tao" x={0} y={43} width={1000} height={46} fill={`url(#${P}faceAO)`} />);
  // pillars on the top wall
  [210, 300, 700, 790].forEach((x, i) => {
    walls.push(
      <g key={`pl${i}`}>
        <rect x={x - 9} y={22} width={18} height={68} fill="#2c1f1d" />
        <rect x={x - 9} y={22} width={5} height={68} fill="#3f2d29" />
        <rect x={x + 5} y={22} width={4} height={68} fill="#1a1110" />
        <rect x={x - 12} y={18} width={24} height={7} fill="#3d2b28" />
        <rect x={x - 12} y={18} width={24} height={1.6} fill={C.wallHi} />
        <path d={`M${x - 5},18 L${x},2 L${x + 5},18 Z`} fill={C.iron} />
      </g>,
    );
  });
  walls.push(<Banner key="bn1" x={255} />, <Banner key="bn2" x={745} />);
  walls.push(<Gate key="gate" />);
  TORCHES.forEach(([x, y], i) => walls.push(<Sconce key={`to${i}`} x={x} y={y} />));

  // side walls
  for (const side of [0, 1]) {
    const xc0 = side ? 950 : 12;
    const xc1 = side ? 988 : 50;
    walls.push(<rect key={`so${side}`} x={side ? 988 : -40} y={40} width={52} height={560} fill={C.outside} />);
    walls.push(<Lava key={`sl${side}`} d={side ? 'M996,90 Q992,200 998,330 T994,560' : 'M4,120 Q8,240 2,360 T6,580'} w={0.7} />);
    capSlabs(walls, xc0, 42, xc1, 566, 400 + side * 50, true);
    walls.push(<rect key={`sf${side}`} x={side ? 944 : 50} y={43} width={6} height={520} fill="#1c1312" />);
    walls.push(<rect key={`sfl${side}`} x={side ? 949 : 50} y={43} width={1.4} height={520} fill={C.wallHi} opacity={0.5} />);
    walls.push(<rect key={`ss${side}`} x={side ? 920 : 56} y={88} width={24} height={474} fill={`url(#${P}${side ? 'shR' : 'shL'})`} />);
  }
  // props on side walls
  const props: Els = [];
  [150, 300, 450].forEach((y, i) => {
    crystals(props, 31, y + 6, 0.7, 120 + i);
    boneSpike(props, 969, y - 30, 0.9, true, `bsR${i}`);
    boneSpike(props, 975, y - 14, 0.7, false, `bsR2${i}`);
    crystals(props, 969, y + 70, 0.6, 140 + i);
    boneSpike(props, 26, y + 72, 0.8, false, `bsL${i}`);
  });

  // bottom wall
  const bottom: Els = [];
  capSlabs(bottom, 0, 560, 1000, 576, 601, false);
  bottom.push(<rect key="bcl" x={0} y={560} width={1000} height={1.6} fill={C.wallHi} opacity={0.6} />);
  bricks(bottom, 0, 576, 1000, 600, 701, 12);
  bottom.push(<rect key="bao" x={0} y={576} width={1000} height={24} fill="#000" opacity={0.25} />);
  [120, 260, 400, 600, 740, 880].forEach((x, i) => {
    boneSpike(bottom, x, 572, 0.55, i % 2 === 0, `bb${i}`);
    skull(bottom, x + 30, 571, 0.8, `bk${i}`);
  });
  // floor shadow under bottom wall's lip
  bottom.push(<rect key="bsh" x={56} y={552} width={888} height={8} fill={`url(#${P}shB)`} />);

  // corner towers
  const towers: Els = [];
  tower(towers, 0, 2, 64, 44, 92, 1);
  tower(towers, 936, 2, 1000, 44, 92, 2);
  tower(towers, 0, 538, 64, 578, 600, 3);
  tower(towers, 936, 538, 1000, 578, 600, 4);
  crystals(towers, 32, 32, 1.05, 160);
  crystals(towers, 968, 32, 1.05, 170);
  crystals(towers, 30, 566, 0.9, 177);
  crystals(towers, 970, 566, 0.9, 191);
  boneSpike(towers, 46, 574, 0.8, true, 'tb1');
  boneSpike(towers, 954, 574, 0.8, false, 'tb2');

  return (
    <g>
      <defs>
        <linearGradient id={`${P}faceAO`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={0.25} />
          <stop offset="0.35" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.55} />
        </linearGradient>
        <linearGradient id={`${P}shT`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={0.6} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${P}shB`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.5} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${P}shL`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.5} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${P}shR`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.5} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${P}light`} cx="0.5" cy="0.55" r="0.62">
          <stop offset="0" stopColor="#ff8a4a" stopOpacity={0.1} />
          <stop offset="0.6" stopColor="#000" stopOpacity={0.05} />
          <stop offset="1" stopColor="#000" stopOpacity={0.45} />
        </radialGradient>
        <radialGradient id={`${P}scorch`}>
          <stop offset="0" stopColor="#0a0403" stopOpacity={0.55} />
          <stop offset="1" stopColor="#0a0403" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${P}pit`}>
          <stop offset="0" stopColor="#ff4a10" stopOpacity={0.22} />
          <stop offset="0.45" stopColor="#3a0c06" stopOpacity={0.3} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${P}core`}>
          <stop offset="0" stopColor="#ffd36a" stopOpacity={0.95} />
          <stop offset="0.35" stopColor="#ff6a1a" stopOpacity={0.85} />
          <stop offset="0.8" stopColor="#7a1a06" stopOpacity={0.6} />
          <stop offset="1" stopColor="#140807" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${P}cglow`}>
          <stop offset="0" stopColor="#ff3c78" stopOpacity={0.45} />
          <stop offset="1" stopColor="#ff3c78" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${P}torch`}>
          <stop offset="0" stopColor="#ff9a3a" stopOpacity={0.4} />
          <stop offset="1" stopColor="#ff9a3a" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${P}haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.3" stopColor="#ff5a1a" stopOpacity={0.05} />
          <stop offset="1" stopColor="#ff5a1a" stopOpacity={0.3} />
        </linearGradient>
        <linearGradient id={`${P}gate`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff4a10" stopOpacity={0.7} />
          <stop offset="0.6" stopColor="#7a1206" stopOpacity={0.3} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={-40} y={-40} width={1080} height={680} fill={C.void} />
      <rect x={56} y={86} width={888} height={478} fill={C.mortar} />
      {keyed(floor)}
      {keyed(decals)}
      {sigil}
      {keyed(lava)}
      <rect x={56} y={86} width={888} height={478} fill={`url(#${P}light)`} />
      <rect x={56} y={88} width={888} height={26} fill={`url(#${P}shT)`} />
      {keyed(back)}
      {keyed(walls)}
      {keyed(props)}
      {keyed(bottom)}
      {keyed(towers)}
    </g>
  );
});

// ------------------------------------------------------------------ Ambient
const EMBERS = 42;
function DireAmbient({ t }: { t: number }) {
  const els: Els = [];
  // lava glow pulses over fissures + central pit
  FISSURES.forEach((f, i) => {
    const k = 0.5 + 0.5 * Math.sin(t * (1.3 + i * 0.21) + i * 1.7);
    const big = i === 0;
    els.push(<ellipse key={`g${i}`} cx={f.x} cy={f.y} rx={big ? 150 : 70} ry={big ? 112 : 52} fill={`url(#${P}aglow)`} opacity={r1((0.25 + k * 0.4) * 100) / 100} />);
  });
  // torch flames
  TORCHES.forEach(([x, y], i) => {
    const f1 = Math.sin(t * 13 + i * 2.1) * 0.5 + Math.sin(t * 7.3 + i) * 0.5;
    const sy = 1 + f1 * 0.14;
    const sx = 1 - f1 * 0.08;
    els.push(
      <g key={`t${i}`} transform={`translate(${x},${y - 5}) scale(${r1(sx * 100) / 100},${r1(sy * 100) / 100})`}>
        <circle cx={0} cy={-6} r={r1(22 + f1 * 3)} fill={`url(#${P}aglow)`} opacity={0.55} />
        <path d="M-5,0 Q-6,-9 0,-18 Q6,-9 5,0 Z" fill="#ff5a14" />
        <path d="M-3,0 Q-3,-7 0,-12 Q3,-7 3,0 Z" fill="#ffb347" />
        <path d="M-1.5,0 Q0,-5 1.5,0 Z" fill="#fff1b8" />
      </g>,
    );
  });
  // rising embers
  for (let i = 0; i < EMBERS; i++) {
    const speed = 18 + rnd(i * 3.3) * 30;
    const span = 640;
    const ph = (t * speed + rnd(i * 7.7) * span) % span;
    const y = 610 - ph;
    const x0 = rnd(i * 5.1 + 2) * 1000;
    const x = x0 + Math.sin(t * (0.8 + rnd(i) * 1.2) + i) * 14 + ph * 0.05;
    const life = ph / span;
    const op = Math.min(1, life * 6) * (1 - life) * (0.55 + 0.45 * Math.sin(t * 9 + i * 3));
    const r = 0.9 + rnd(i * 2.2) * 1.8;
    els.push(<circle key={`e${i}`} cx={r1(x)} cy={r1(y)} r={r1(r * 10) / 10} fill={i % 4 === 0 ? '#ffe08a' : '#ff8a2a'} opacity={r1(Math.max(0, op) * 100) / 100} />);
  }
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id={`${P}aglow`}>
          <stop offset="0" stopColor="#ff6a1a" stopOpacity={0.35} />
          <stop offset="1" stopColor="#ff3c0a" stopOpacity={0} />
        </radialGradient>
      </defs>
      {keyed(els)}
    </g>
  );
}

export const direTerrain: TerrainDef = {
  id: 'dire',
  name: 'Blighted Bastion',
  accent: '#ff5a2a',
  Ground: DireGround,
  Ambient: DireAmbient,
};
