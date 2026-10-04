// Swamp terrain — "Murkwater Bog": a teal-green bog courtyard. Muddy floor with dark puddles, lily
// pads and reeds, an old round plank deck in the middle, wooden palisade walls lashed with rope,
// gnarled mangroves with hanging moss and glowing mushrooms outside. Ambient: rolling fog wisps,
// puddle bubbles, lantern glow. Arena coordinates 1000 x 600; playable x 60..940, y 90..560 kept clear.
import { cloneElement, memo } from 'react';
import type { ReactElement } from 'react';
import type { TerrainDef } from '../types.ts';

const P = 't2swamp-';
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
  void: '#0c1614',
  outsideWater: '#173431',
  mud: '#36463a',
  mudDark: '#2f3226',
  mudBrown: '#463d2c',
  mudLight: '#56604a',
  water: '#1c3b3a',
  waterLight: '#3f7a72',
  waterRim: '#59654a',
  logs: ['#5b4631', '#634c34', '#54402c', '#6a5238', '#4f3c2a'] as const,
  logHi: '#8a7050',
  logLo: '#2e2216',
  rope: '#b49a68',
  plank: ['#6b5638', '#73603f', '#5f4c31', '#7a6644'] as const,
  moss: '#5f7a3a',
  hangMoss: '#7f906a',
  leaf: { dark: '#1f3529', mid: '#2d4a36', light: '#466a46' },
  reed: ['#6b7b3c', '#58682f', '#8a8f4a'] as const,
  shroomTeal: '#5fe0c0',
  shroomPurple: '#b07ae0',
};

// ---------------------------------------------------------------- pieces

function reeds(out: Els, x: number, y: number, s: number, seed: number) {
  const parts: ReactElement[] = [];
  const n = 5 + Math.floor(rnd(seed) * 4);
  for (let i = 0; i < n; i++) {
    const dx = (i - n / 2) * 2.6 + (rnd(seed + i) - 0.5) * 3;
    const h = 16 + rnd(seed + i * 3) * 16;
    const lean = (rnd(seed + i * 5) - 0.5) * 10;
    parts.push(<path key={i} d={`M${r1(dx)},0 Q${r1(dx + lean * 0.3)},${r1(-h * 0.6)} ${r1(dx + lean)},${r1(-h)}`} stroke={pick(C.reed, seed + i)} strokeWidth={1.6} fill="none" strokeLinecap="round" />);
    if (rnd(seed + i * 7) > 0.6) parts.push(<rect key={`c${i}`} x={r1(dx + lean * 0.8 - 1.6)} y={r1(-h * 0.92)} width={3.2} height={7} rx={1.6} fill="#5a3a22" />);
  }
  out.push(
    <g key={`rd${seed}`} transform={`translate(${r1(x)},${r1(y)}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={9} ry={2.5} fill="#000" opacity={0.3} />
      {keyed(parts)}
    </g>,
  );
}

function lilyPad(out: Els, x: number, y: number, r: number, seed: number, flower: boolean) {
  const a = rnd(seed) * 360;
  out.push(
    <g key={`lp${seed}`} transform={`translate(${r1(x)},${r1(y)}) rotate(${r1(a)}) scale(1,0.78)`}>
      <path d={`M0,0 L${r},-2 A${r},${r} 0 1 1 ${r},2 Z`} fill="#4b7f3a" />
      <path d={`M0,0 L${r},-2 A${r},${r} 0 0 0 ${-r * 0.6},${-r * 0.6} Z`} fill="#62994a" opacity={0.7} />
      {flower && <circle cx={-r * 0.25} cy={0} r={r * 0.36} fill="#e8b4d8" />}
      {flower && <circle cx={-r * 0.25} cy={0} r={r * 0.14} fill="#ffe680" />}
    </g>,
  );
}

function mushrooms(out: Els, x: number, y: number, s: number, seed: number, color: string) {
  const parts: ReactElement[] = [];
  const n = 3 + Math.floor(rnd(seed) * 3);
  for (let i = 0; i < n; i++) {
    const dx = (i - (n - 1) / 2) * 7 + (rnd(seed + i) - 0.5) * 4;
    const h = 6 + rnd(seed + i * 3) * 9;
    const r = 4 + rnd(seed + i * 5) * 4;
    parts.push(
      <g key={i} transform={`translate(${r1(dx)},${r1((rnd(seed + i * 9) - 0.5) * 4)})`}>
        <rect x={-1.4} y={r1(-h)} width={2.8} height={r1(h)} rx={1} fill="#d8d0b8" />
        <path d={`M${r1(-r)},${r1(-h + 1)} Q0,${r1(-h - r * 1.3)} ${r1(r)},${r1(-h + 1)} Z`} fill={color} />
        <path d={`M${r1(-r * 0.6)},${r1(-h - r * 0.2)} Q${r1(-r * 0.2)},${r1(-h - r * 0.9)} ${r1(r * 0.2)},${r1(-h - r * 0.75)}`} stroke="#fff" strokeWidth={1} fill="none" opacity={0.5} />
        <circle cx={r1(r * 0.3)} cy={r1(-h - r * 0.35)} r={0.9} fill="#fff" opacity={0.8} />
      </g>,
    );
  }
  out.push(
    <g key={`ms${seed}`} transform={`translate(${r1(x)},${r1(y)}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={22} ry={11} fill={`url(#${P}${color === C.shroomTeal ? 'gTeal' : 'gPurp'})`} />
      <ellipse cx={0} cy={1} rx={14} ry={3} fill="#000" opacity={0.3} />
      {keyed(parts)}
    </g>,
  );
}

// gnarled mangrove: arched roots + murky canopy + hanging moss. (x, y) = canopy centre
function mangrove(out: Els, x: number, y: number, r: number, seed: number) {
  const roots: ReactElement[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rnd(seed + i) * 0.5;
    const ex = x + Math.cos(a) * r * 1.15;
    const ey = y + r * 0.35 + Math.sin(a) * r * 0.55;
    const mx = (x + ex) / 2 + Math.cos(a) * 8;
    const my = Math.min(y, ey) - 14;
    roots.push(<path key={i} d={`M${r1(x)},${r1(y + 6)} Q${r1(mx)},${r1(my)} ${r1(ex)},${r1(ey)}`} stroke="#3b2e22" strokeWidth={4.5} fill="none" strokeLinecap="round" />);
    roots.push(<path key={`h${i}`} d={`M${r1(x)},${r1(y + 6)} Q${r1(mx)},${r1(my)} ${r1(ex)},${r1(ey)}`} stroke="#5e4a36" strokeWidth={1.3} fill="none" transform="translate(-1,-1)" />);
  }
  const L = C.leaf;
  const moss: ReactElement[] = [];
  for (let i = 0; i < 7; i++) {
    const mx = x + (rnd(seed + i * 11) - 0.5) * r * 1.5;
    const my = y + (rnd(seed + i * 13) - 0.2) * r * 0.6;
    const len = 10 + rnd(seed + i * 17) * 16;
    moss.push(<path key={i} d={`M${r1(mx)},${r1(my)} q2,${r1(len * 0.5)} -1,${r1(len)} M${r1(mx + 3)},${r1(my)} q-2,${r1(len * 0.4)} 1,${r1(len * 0.75)}`} stroke={C.hangMoss} strokeWidth={1.4} fill="none" opacity={0.85} />);
  }
  out.push(
    <g key={`mg${seed}`}>
      <ellipse cx={r1(x + 6)} cy={r1(y + r * 0.5)} rx={r1(r * 1.3)} ry={r1(r * 0.5)} fill="#000" opacity={0.3} />
      {keyed(roots)}
      <path d={blob(x + r * 0.15, y + r * 0.2, r, r * 0.8, seed + 1, 11, 0.2)} fill="#000" opacity={0.3} />
      <path d={blob(x, y, r, r * 0.78, seed + 2, 12, 0.22)} fill={L.dark} />
      <path d={blob(x - r * 0.1, y - r * 0.1, r * 0.78, r * 0.6, seed + 3, 10, 0.25)} fill={L.mid} />
      <path d={blob(x - r * 0.25, y - r * 0.22, r * 0.42, r * 0.32, seed + 4, 9, 0.28)} fill={L.light} />
      {keyed(moss)}
    </g>,
  );
}

function puddle(out: Els, x: number, y: number, rx: number, ry: number, seed: number) {
  out.push(
    <g key={`pd${seed}`}>
      <path d={blob(x, y, rx + 7, ry + 5, seed, 11, 0.16)} fill={C.mudDark} opacity={0.9} />
      <path d={blob(x, y, rx + 3, ry + 2, seed + 1, 11, 0.16)} fill={C.waterRim} opacity={0.6} />
      <path d={blob(x, y, rx, ry, seed + 2, 11, 0.18)} fill={C.water} />
      <path d={blob(x - rx * 0.15, y - ry * 0.2, rx * 0.7, ry * 0.55, seed + 3, 9, 0.2)} fill="#24504c" opacity={0.6} />
      <path d={`M${r1(x - rx * 0.55)},${r1(y - ry * 0.35)} q${r1(rx * 0.3)},${r1(-ry * 0.25)} ${r1(rx * 0.6)},${r1(-ry * 0.1)}`} stroke="#9fd8c8" strokeWidth={1.4} fill="none" opacity={0.45} strokeLinecap="round" />
      <path d={`M${r1(x + rx * 0.1)},${r1(y + ry * 0.35)} l${r1(rx * 0.35)},-2`} stroke="#9fd8c8" strokeWidth={1} fill="none" opacity={0.3} strokeLinecap="round" />
    </g>,
  );
}

// palisade (vertical sharpened logs), face from capY to y1
function palisade(out: Els, x0: number, x1: number, tipY: number, y1: number, seed: number) {
  let x = x0;
  let k = 0;
  while (x < x1) {
    const w = 12 + rnd(seed + k * 2.3) * 5;
    const s = seed + k * 7;
    const top = tipY + rnd(s + 1) * 6;
    const xb = Math.min(x1, x + w);
    const mid = (x + xb) / 2;
    const col = pick(C.logs, s);
    out.push(
      <g key={`lg${s}`}>
        <path d={`M${r1(x + 0.6)},${y1} L${r1(x + 0.6)},${r1(top + 8)} L${r1(mid)},${r1(top)} L${r1(xb - 0.6)},${r1(top + 8)} L${r1(xb - 0.6)},${y1} Z`} fill={col} />
        <path d={`M${r1(x + 0.6)},${y1} L${r1(x + 0.6)},${r1(top + 8)} L${r1(mid)},${r1(top)} L${r1(mid - 1)},${y1} Z`} fill={C.logHi} opacity={0.28} />
        <path d={`M${r1(xb - 3.5)},${y1} L${r1(xb - 3.5)},${r1(top + 9)} L${r1(xb - 0.6)},${r1(top + 8)} L${r1(xb - 0.6)},${y1} Z`} fill={C.logLo} opacity={0.6} />
        <path d={`M${r1(mid)},${r1(top + 14 + rnd(s + 3) * 10)} l0,${r1(6 + rnd(s + 4) * 10)}`} stroke={C.logLo} strokeWidth={0.8} opacity={0.6} />
      </g>,
    );
    x = xb;
    k++;
  }
}

// side walls: palisade seen from above = a row of log ends
function logEnds(out: Els, xc: number, y0: number, y1: number, seed: number) {
  let y = y0;
  let k = 0;
  while (y < y1) {
    const r = 6.5 + rnd(seed + k) * 2;
    const cx = xc + (rnd(seed + k * 3) - 0.5) * 3;
    const s = seed + k * 5;
    out.push(
      <g key={`le${s}`}>
        <circle cx={r1(cx + 1)} cy={r1(y + r + 1.5)} r={r1(r)} fill="#000" opacity={0.4} />
        <circle cx={r1(cx)} cy={r1(y + r)} r={r1(r)} fill={pick(C.logs, s)} />
        <circle cx={r1(cx)} cy={r1(y + r)} r={r1(r * 0.72)} fill="#8a7252" />
        <circle cx={r1(cx)} cy={r1(y + r)} r={r1(r * 0.45)} fill="none" stroke="#5e4a32" strokeWidth={0.8} />
        <circle cx={r1(cx)} cy={r1(y + r)} r={0.9} fill="#5e4a32" />
      </g>,
    );
    y += r * 2 - 0.5;
    k++;
  }
}

function lantern(out: Els, x: number, y: number, key: string) {
  out.push(
    <g key={key} transform={`translate(${x},${y})`}>
      <circle cx={0} cy={8} r={20} fill={`url(#${P}gLamp)`} />
      <path d="M0,-6 L0,0" stroke="#2a2018" strokeWidth={1.2} />
      <rect x={-4.5} y={0} width={9} height={2} fill="#2a2018" />
      <rect x={-4} y={2} width={8} height={10} rx={1.5} fill="#b8f0a0" opacity={0.85} />
      <rect x={-4} y={2} width={8} height={10} rx={1.5} fill="none" stroke="#2a2018" strokeWidth={1.2} />
      <path d="M0,2 L0,12" stroke="#2a2018" strokeWidth={0.8} />
      <rect x={-4.5} y={12} width={9} height={2} fill="#2a2018" />
    </g>,
  );
}

// ---------------------------------------------------------------- layout

const PUDDLES = [
  [160, 170, 46, 22],
  [330, 470, 54, 24],
  [800, 190, 50, 22],
  [690, 480, 42, 20],
  [110, 400, 30, 16],
  [895, 400, 34, 18],
  [520, 135, 28, 12],
] as const;
const LANTERNS = [
  [140, 52],
  [380, 52],
  [620, 52],
  [860, 52],
] as const;

const SwampGround = memo(function SwampGround() {
  const floor: Els = [];
  // mud mottling
  for (let i = 0; i < 46; i++) {
    const x = 60 + rnd(i * 3.3 + 1) * 880;
    const y = 95 + rnd(i * 7.1 + 2) * 460;
    const c = i % 3 === 0 ? C.mudBrown : i % 3 === 1 ? C.mudDark : C.mudLight;
    floor.push(<path key={`mm${i}`} d={blob(x, y, 28 + rnd(i) * 54, 14 + rnd(i + 1) * 26, i + 300, 10, 0.3)} fill={c} opacity={i % 3 === 2 ? 0.35 : 0.55} />);
  }
  // wet streaks / footprints-ish ripples in mud
  for (let i = 0; i < 40; i++) {
    const x = 70 + rnd(i * 5.9 + 50) * 860;
    const y = 100 + rnd(i * 2.3 + 51) * 450;
    floor.push(<path key={`ws${i}`} d={`M${r1(x)},${r1(y)} q${r1(8 + rnd(i) * 10)},-3 ${r1(18 + rnd(i) * 16)},0`} stroke="#6f7d62" strokeWidth={1.2} fill="none" opacity={0.35} strokeLinecap="round" />);
  }
  // puddles + lily pads + reeds
  PUDDLES.forEach(([x, y, rx, ry], i) => {
    puddle(floor, x, y, rx, ry, 100 + i * 9);
    if (rx > 40) {
      lilyPad(floor, x - rx * 0.3, y + ry * 0.1, 6.5, 200 + i, i % 2 === 0);
      lilyPad(floor, x + rx * 0.35, y - ry * 0.2, 5, 220 + i, false);
    }
  });
  // central round plank deck
  const deck: ReactElement[] = [];
  const R = 104;
  deck.push(<ellipse key="dsh" cx={4} cy={12} rx={R + 6} ry={(R + 6) * 0.72} fill="#000" opacity={0.35} />);
  deck.push(<ellipse key="dbase" cx={0} cy={0} rx={R} ry={R * 0.72} fill="#3e3020" />);
  for (let i = -R; i < R; i += 13) {
    const half = Math.sqrt(Math.max(0, R * R - (i + 6.5) ** 2)) * 0.72;
    const s = 500 + i;
    deck.push(<rect key={`pk${i}`} x={i + 0.8} y={r1(-half + 1)} width={11.4} height={r1(Math.max(0, half * 2 - 2))} rx={2} fill={pick(C.plank, s)} />);
    deck.push(<rect key={`ph${i}`} x={i + 0.8} y={r1(-half + 1)} width={2.4} height={r1(Math.max(0, half * 2 - 2))} fill="#a08a62" opacity={0.3} />);
    // nails & grain
    deck.push(<circle key={`n1${i}`} cx={i + 6.5} cy={r1(-half * 0.55)} r={0.9} fill="#2a2018" />);
    deck.push(<circle key={`n2${i}`} cx={i + 6.5} cy={r1(half * 0.55)} r={0.9} fill="#2a2018" />);
    if (rnd(s) > 0.7) deck.push(<rect key={`gap${i}`} x={i + 0.8} y={r1(-half * 0.1)} width={11.4} height={r1(half * 0.25)} fill="#2a2216" opacity={0.75} />);
  }
  deck.push(<ellipse key="drim" cx={0} cy={0} rx={R} ry={R * 0.72} fill="none" stroke="#2e2216" strokeWidth={6} />);
  deck.push(<ellipse key="drim2" cx={0} cy={-1} rx={R - 3} ry={R * 0.72 - 3} fill="none" stroke="#8a7050" strokeWidth={1.2} opacity={0.6} />);
  // posts around the rim with rope
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    deck.push(<circle key={`dp${i}`} cx={r1(Math.cos(a) * R)} cy={r1(Math.sin(a) * R * 0.72)} r={5} fill="#4f3c2a" stroke="#2e2216" strokeWidth={1.2} />);
    deck.push(<circle key={`dpt${i}`} cx={r1(Math.cos(a) * R)} cy={r1(Math.sin(a) * R * 0.72)} r={2.6} fill="#8a7252" />);
  }
  // a faded swamp-rune painted in the middle
  deck.push(<ellipse key="rune" cx={0} cy={0} rx={40} ry={29} fill="none" stroke="#5fe0c0" strokeWidth={2} opacity={0.35} strokeDasharray="10 5" />);
  deck.push(<path key="rune2" d="M0,-20 L14,8 L-14,8 Z M0,14 L0,-6" stroke="#5fe0c0" strokeWidth={2} fill="none" opacity={0.35} />);
  floor.push(
    <g key="deck" transform="translate(500,330)">
      {keyed(deck)}
    </g>,
  );
  // plank walkways from deck to the side gates
  const walk = (x0: number, x1: number, y: number, key: string) => {
    for (let x = x0; x < x1; x += 11) {
      const s = x * 3 + y;
      floor.push(<rect key={`${key}${x}`} x={x} y={r1(y - 12 + (rnd(s) - 0.5) * 3)} width={10} height={24} rx={1.5} fill={pick(C.plank, s)} stroke="#2e2216" strokeWidth={0.8} transform={`rotate(${r1((rnd(s + 1) - 0.5) * 6)},${x + 5},${y})`} />);
    }
  };
  walk(58, 210, 330, 'wl');
  walk(792, 944, 330, 'wr');
  // reeds & grass clumps around the floor edges and puddles
  for (let i = 0; i < 26; i++) {
    const side = i % 4;
    const u = rnd(i * 7.7 + 600);
    const x = side === 0 ? 64 + u * 20 : side === 1 ? 916 + u * 20 : 80 + u * 840;
    const y = side < 2 ? 110 + rnd(i * 3.1 + 601) * 430 : side === 2 ? 102 + u * 8 : 548 + u * 8;
    if (Math.abs(y - 330) < 28 && side < 2) continue;
    reeds(floor, x, y, 0.65 + rnd(i) * 0.3, 700 + i);
  }
  PUDDLES.forEach(([x, y, rx, ry], i) => {
    reeds(floor, x + rx * 0.85, y + ry * 0.3, 0.7, 800 + i);
    if (i % 2) reeds(floor, x - rx * 0.9, y - ry * 0.1, 0.6, 820 + i);
  });

  // ---- outside top band: dark water, stumps and mangroves behind the palisade
  const back: Els = [];
  back.push(<rect key="ob" x={-40} y={-40} width={1080} height={80} fill={C.outsideWater} />);
  for (let i = 0; i < 12; i++) back.push(<path key={`ow${i}`} d={`M${i * 90 + 10},${6 + (i % 3) * 7} q16,-3 32,0`} stroke="#4f8a80" strokeWidth={1.2} fill="none" opacity={0.35} />);
  [70, 250, 450, 700, 900].forEach((x, i) => mangrove(back, x + rnd(i) * 30, 0, 40 + rnd(i + 2) * 12, 900 + i * 13));
  [170, 340, 560, 800].forEach((x, i) => reeds(back, x, 28, 0.9, 950 + i));

  // ---- walls
  const walls: Els = [];
  // top palisade
  walls.push(<rect key="tb" x={0} y={34} width={1000} height={56} fill="#21180f" />);
  palisade(walls, 0, 1000, 22, 89, 301);
  walls.push(<rect key="tao" x={0} y={30} width={1000} height={60} fill={`url(#${P}faceAO)`} />);
  // lashing beams + rope
  [48, 76].forEach((y, i) => {
    walls.push(<rect key={`bm${i}`} x={0} y={y - 3} width={1000} height={6} rx={3} fill="#4a3826" />);
    walls.push(<rect key={`bmh${i}`} x={0} y={y - 3} width={1000} height={1.5} fill={C.logHi} opacity={0.5} />);
    for (let x = 30; x < 1000; x += 60) walls.push(<path key={`rp${i}-${x}`} d={`M${x - 3},${y - 4} l6,8 M${x + 3},${y - 4} l-6,8`} stroke={C.rope} strokeWidth={1.4} />);
  });
  // moss creeping up the bottom of the palisade
  for (let i = 0; i < 26; i++) walls.push(<path key={`pm${i}`} d={blob(i * 40 + rnd(i) * 20, 88, 16 + rnd(i + 1) * 10, 6 + rnd(i + 2) * 4, 1000 + i, 8, 0.3)} fill={C.moss} opacity={0.8} />);
  // gate in the middle: swinging double doors of planks
  walls.push(
    <g key="gate">
      <rect x={462} y={34} width={76} height={56} fill="#140e08" />
      <path d="M466,90 L466,48 L498,44 L498,90 Z" fill="#5f4c31" />
      <path d="M502,90 L502,44 L534,48 L534,90 Z" fill="#54402c" />
      {[474, 482, 490, 510, 518, 526].map((x) => (
        <path key={x} d={`M${x},47 L${x},90`} stroke="#2e2216" strokeWidth={1} />
      ))}
      <path d="M466,58 L498,54 M502,54 L534,58 M466,80 L498,78 M502,78 L534,80" stroke="#3a2c1c" strokeWidth={3} />
      <path d="M466,58 L498,78 M534,58 L502,78" stroke="#3a2c1c" strokeWidth={2.4} />
      {[456, 536].map((x) => (
        <g key={x}>
          <rect x={x} y={12} width={10} height={78} fill="#4a3826" />
          <rect x={x} y={12} width={3} height={78} fill={C.logHi} opacity={0.4} />
          <circle cx={x + 5} cy={12} r={6} fill="#5b4631" />
          <circle cx={x + 5} cy={12} r={3.6} fill="#8a7252" />
        </g>
      ))}
      <path d="M461,22 Q500,34 541,22" stroke={C.rope} strokeWidth={2} fill="none" />
      {/* hanging skull totem */}
      <path d="M500,30 L500,36" stroke={C.rope} strokeWidth={1} />
      <path d="M494,36 Q500,32 506,36 Q507,43 503,45 L497,45 Q493,43 494,36 Z" fill="#d6cdb0" />
      <circle cx={498} cy={39.5} r={1.4} fill="#1a1410" />
      <circle cx={502} cy={39.5} r={1.4} fill="#1a1410" />
    </g>,
  );
  LANTERNS.forEach(([x, y], i) => lantern(walls, x, y, `ln${i}`));

  // side walls: two rows of log ends + rope walkway
  for (const side of [0, 1]) {
    walls.push(<rect key={`so${side}`} x={side ? 988 : -40} y={40} width={52} height={560} fill={C.outsideWater} />);
    walls.push(<rect key={`sb${side}`} x={side ? 946 : 14} y={40} width={40} height={526} fill="#21180f" />);
    logEnds(walls, side ? 958 : 25, 36, 566, 400 + side * 50);
    logEnds(walls, side ? 975 : 42, 42, 566, 430 + side * 50);
    walls.push(<rect key={`ss${side}`} x={side ? 916 : 52} y={88} width={32} height={474} fill={`url(#${P}${side ? 'shR' : 'shL'})`} />);
    walls.push(<path key={`sr${side}`} d={side ? 'M950,40 L950,566' : 'M50,40 L50,566'} stroke={C.rope} strokeWidth={1.3} opacity={0.7} strokeDasharray="5 3" />);
  }

  // bottom wall: log tips pointing up, logs running down out of frame
  const bottom: Els = [];
  bottom.push(<rect key="bb" x={0} y={566} width={1000} height={40} fill="#21180f" />);
  palisade(bottom, 0, 1000, 558, 600, 601);
  bottom.push(<rect key="bbm" x={0} y={582} width={1000} height={6} rx={3} fill="#4a3826" />);
  bottom.push(<rect key="bao" x={0} y={566} width={1000} height={34} fill="#000" opacity={0.18} />);
  bottom.push(<rect key="bsh" x={56} y={548} width={888} height={12} fill={`url(#${P}shB)`} />);

  // outside scenery: mangroves at corners, mushrooms, moss over the side walls
  const scen: Els = [];
  mangrove(scen, 6, 30, 56, 1300);
  mangrove(scen, 994, 28, 58, 1310);
  mangrove(scen, 2, 588, 52, 1320);
  mangrove(scen, 998, 590, 54, 1330);
  [
    [24, 170, C.shroomTeal],
    [36, 300, C.shroomPurple],
    [26, 460, C.shroomTeal],
    [970, 200, C.shroomPurple],
    [962, 330, C.shroomTeal],
    [972, 470, C.shroomPurple],
    [70, 96, C.shroomTeal],
    [930, 96, C.shroomPurple],
    [260, 590, C.shroomPurple],
    [740, 592, C.shroomTeal],
  ].forEach(([x, y, c], i) => mushrooms(scen, x as number, y as number, 0.85, 1400 + i * 7, c as string));
  [
    [-14, 240, 32],
    [-12, 390, 30],
    [1014, 260, 30],
    [1012, 420, 34],
  ].forEach(([x, y, r], i) => mangrove(scen, x!, y!, r!, 1500 + i * 11));

  return (
    <g>
      <defs>
        <linearGradient id={`${P}faceAO`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={0.1} />
          <stop offset="0.4" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.5} />
        </linearGradient>
        <linearGradient id={`${P}shT`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={0.55} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${P}shB`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.4} />
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
        <radialGradient id={`${P}light`} cx="0.5" cy="0.52" r="0.65">
          <stop offset="0" stopColor="#bff0d8" stopOpacity={0.08} />
          <stop offset="0.6" stopColor="#000" stopOpacity={0.05} />
          <stop offset="1" stopColor="#001410" stopOpacity={0.45} />
        </radialGradient>
        <radialGradient id={`${P}gTeal`}>
          <stop offset="0" stopColor="#5fe0c0" stopOpacity={0.4} />
          <stop offset="1" stopColor="#5fe0c0" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${P}gPurp`}>
          <stop offset="0" stopColor="#b07ae0" stopOpacity={0.4} />
          <stop offset="1" stopColor="#b07ae0" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${P}gLamp`}>
          <stop offset="0" stopColor="#c8ff9a" stopOpacity={0.45} />
          <stop offset="1" stopColor="#c8ff9a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-40} y={-40} width={1080} height={680} fill={C.void} />
      <rect x={50} y={86} width={900} height={478} fill={C.mud} />
      {keyed(floor)}
      <rect x={56} y={86} width={888} height={478} fill={`url(#${P}light)`} />
      <rect x={56} y={88} width={888} height={26} fill={`url(#${P}shT)`} />
      {keyed(back)}
      {keyed(walls)}
      {keyed(bottom)}
      {keyed(scen)}
    </g>
  );
});

// ---------------------------------------------------------------- ambient

const WISPS = 9;
const BUBBLES = 18;
function SwampAmbient({ t }: { t: number }) {
  const els: Els = [];
  // rolling fog wisps drifting right, wrapping
  for (let i = 0; i < WISPS; i++) {
    const sp = 8 + rnd(i * 3.1) * 10;
    const span = 1400;
    const x = ((rnd(i * 7.3) * span + t * sp) % span) - 200;
    const y = 80 + rnd(i * 5.7) * 470 + Math.sin(t * 0.3 + i) * 12;
    const rx = 140 + rnd(i * 2.2) * 120;
    const ry = 26 + rnd(i * 4.4) * 22;
    const op = 0.35 + 0.2 * Math.sin(t * 0.4 + i * 1.3);
    els.push(<ellipse key={`fw${i}`} cx={r1(x)} cy={r1(y)} rx={r1(rx)} ry={r1(ry)} fill={`url(#${P}fog)`} opacity={r1(op * 100) / 100} />);
  }
  // bubbles rising & popping in the puddles
  for (let i = 0; i < BUBBLES; i++) {
    const pd = PUDDLES[i % PUDDLES.length]!;
    const per = 1.6 + rnd(i * 3.9) * 1.8;
    const ph = (t + rnd(i * 6.1) * per) % per;
    const k = ph / per; // 0..1 life
    const bx = pd[0] + (rnd(i * 2.7) - 0.5) * pd[2] * 1.2;
    const by = pd[1] + (rnd(i * 8.3) - 0.5) * pd[3] * 1.0;
    if (k < 0.8) {
      const r = 1 + k * 3.2;
      els.push(<circle key={`bb${i}`} cx={r1(bx)} cy={r1(by)} r={r1(r)} fill="#7fc8b4" fillOpacity={0.25} stroke="#bff0e0" strokeWidth={0.8} opacity={0.8} />);
    } else {
      const q = (k - 0.8) / 0.2;
      els.push(<ellipse key={`bb${i}`} cx={r1(bx)} cy={r1(by)} rx={r1(4 + q * 8)} ry={r1((4 + q * 8) * 0.45)} fill="none" stroke="#bff0e0" strokeWidth={0.8} opacity={r1((1 - q) * 70) / 100} />);
    }
  }
  // lantern glow pulse + glowing spores
  LANTERNS.forEach(([x, y], i) => {
    const f = 0.75 + 0.15 * Math.sin(t * 3.1 + i * 2) + 0.1 * Math.sin(t * 7.7 + i);
    els.push(<circle key={`lg${i}`} cx={x} cy={y + 8} r={r1(30 * f)} fill={`url(#${P}lamp)`} opacity={r1(f * 100) / 100} />);
  });
  for (let i = 0; i < 12; i++) {
    const x = 40 + rnd(i * 4.9) * 920 + Math.sin(t * 0.5 + i * 2) * 20;
    const y = 560 - ((t * (6 + rnd(i) * 6) + rnd(i * 9.9) * 480) % 480);
    els.push(<circle key={`sp${i}`} cx={r1(x)} cy={r1(y)} r={1.4} fill={i % 2 ? '#5fe0c0' : '#c8a0ff'} opacity={r1((0.35 + 0.35 * Math.sin(t * 2 + i)) * 100) / 100} />);
  }
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id={`${P}fog`}>
          <stop offset="0" stopColor="#d6eee4" stopOpacity={0.42} />
          <stop offset="0.6" stopColor="#b4d4c8" stopOpacity={0.2} />
          <stop offset="1" stopColor="#b4d4c8" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${P}lamp`}>
          <stop offset="0" stopColor="#d8ffb0" stopOpacity={0.5} />
          <stop offset="1" stopColor="#c8ff9a" stopOpacity={0} />
        </radialGradient>
      </defs>
      {keyed(els)}
    </g>
  );
}

export const swampTerrain: TerrainDef = {
  id: 'swamp',
  name: 'Murkwater Bog',
  accent: '#4fc1a6',
  Ground: SwampGround,
  Ambient: SwampAmbient,
};
