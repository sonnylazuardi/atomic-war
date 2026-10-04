// Shared terrain drawing kit: deterministic randomness, colour helpers, walls, floors, props and
// ambient particles. Everything is drawn in ARENA coordinates (1000 x 600) and is a pure function of
// its props. Props (trees, rocks, crates...) are drawn in local coords with the origin at the ground
// contact point, then placed with `x`, `y`, `s` (scale).
//
// Arena layout used by every terrain (3/4 top-down camera, looking "north"):
//   top wall    : cap y 20..36, inner face (visible, facing camera) y 36..85
//   side walls  : caps x 14..54 and 946..986
//   bottom wall : cap y 562..576, outer face y 576..600
//   floor       : x 54..946, y 85..562   (playable x 60..940, y 90..560 is never covered)
import type { ReactElement, ReactNode } from 'react';

export const W = 1000;
export const H = 600;
export const FLOOR = { x0: 54, y0: 85, x1: 946, y1: 562 } as const;

// ---------------------------------------------------------------- randomness

/** deterministic hash -> [0, 1) */
export function hash(i: number, salt = 0): number {
  let h = Math.imul((i | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((salt | 0) + 0x632be5ab, 0xc2b2ae35);
  h ^= h >>> 13;
  h = Math.imul(h, 0x27d4eb2f);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** seeded generator (mulberry32) -> () => [0, 1) */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T,>(r: number, arr: readonly T[]): T => arr[Math.min(arr.length - 1, Math.floor(r * arr.length))]!;
export const f1 = (v: number) => Math.round(v * 10) / 10;

// ---------------------------------------------------------------- colour

const hex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
function parse(c: string): [number, number, number] {
  const h = c.replace('#', '');
  const v = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
/** mix two hex colours, k = 0 -> a, 1 -> b */
export function mix(a: string, b: string, k: number): string {
  const A = parse(a);
  const B = parse(b);
  return `#${hex2(A[0] + (B[0] - A[0]) * k)}${hex2(A[1] + (B[1] - A[1]) * k)}${hex2(A[2] + (B[2] - A[2]) * k)}`;
}
/** k > 0 lightens towards white, k < 0 darkens towards black */
export const shade = (c: string, k: number) => (k >= 0 ? mix(c, '#ffffff', k) : mix(c, '#000000', -k));

// ---------------------------------------------------------------- basic shapes

/** soft contact shadow */
export const Shadow = ({ x, y, rx, ry, o = 0.35 }: { x: number; y: number; rx: number; ry: number; o?: number }) => (
  <ellipse cx={f1(x)} cy={f1(y)} rx={f1(rx)} ry={f1(ry)} fill="#000" opacity={o} />
);

/** a lumpy blob path (closed) around (cx, cy) — used for canopies, bushes, snow drifts, sand piles */
export function blobPath(cx: number, cy: number, rx: number, ry: number, seed: number, lumps = 9, amp = 0.18): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < lumps; i++) {
    const a = (i / lumps) * Math.PI * 2;
    const k = 1 + (hash(i, seed) - 0.5) * 2 * amp;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  // smooth closed curve through midpoints
  let d = '';
  for (let i = 0; i < lumps; i++) {
    const p = pts[i]!;
    const q = pts[(i + 1) % lumps]!;
    const mx = (p[0] + q[0]) / 2;
    const my = (p[1] + q[1]) / 2;
    d += i === 0 ? `M${f1(mx)},${f1(my)}` : ` Q${f1(p[0])},${f1(p[1])} ${f1(mx)},${f1(my)}`;
  }
  const p0 = pts[0]!;
  const q0 = pts[1 % lumps]!;
  d += ` Q${f1(p0[0])},${f1(p0[1])} ${f1((p0[0] + q0[0]) / 2)},${f1((p0[1] + q0[1]) / 2)} Z`;
  // the first segment starts at the midpoint of p0-p1, so close via p0 from the last midpoint
  return d;
}

// ---------------------------------------------------------------- walls

export interface WallStyle {
  cap: string; // top surface of the wall
  face: string; // vertical face
  mortar: string; // gaps between stones
  /** optional covering on top of the caps (snow, moss, sand) */
  topping?: string;
  kind?: 'stone' | 'wood';
}

/** irregular course of stones filling a rect: returns rects (fills vary around `base`) */
export function stoneCourse(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  courseH: number,
  minW: number,
  maxW: number,
  base: string,
  seed: number,
  vary = 0.12,
  key = 'sc',
): ReactElement[] {
  const out: ReactElement[] = [];
  const r = rng(seed);
  let row = 0;
  for (let y = y0; y < y1 - 0.5; y += courseH, row++) {
    const h = Math.min(courseH, y1 - y);
    let x = x0 - (row % 2 ? r() * maxW * 0.5 : 0);
    let i = 0;
    while (x < x1) {
      const w = minW + r() * (maxW - minW);
      const xa = Math.max(x, x0);
      const xb = Math.min(x + w, x1);
      if (xb - xa > 2) {
        const c = shade(base, (r() - 0.5) * 2 * vary);
        out.push(<rect key={`${key}${row}-${i}`} x={f1(xa + 0.7)} y={f1(y + 0.7)} width={f1(Math.max(0, xb - xa - 1.4))} height={f1(h - 1.4)} rx={1.5} fill={c} />);
        // top highlight
        out.push(<rect key={`${key}${row}-${i}h`} x={f1(xa + 1.5)} y={f1(y + 0.9)} width={f1(Math.max(0, xb - xa - 3))} height={1.2} fill="#fff" opacity={0.12} />);
      }
      x += w;
      i++;
    }
  }
  return out;
}

/** vertical course (stones stacked along y), for side wall caps */
export function stoneColumn(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  minH: number,
  maxH: number,
  base: string,
  seed: number,
  vary = 0.12,
  key = 'sv',
): ReactElement[] {
  const out: ReactElement[] = [];
  const r = rng(seed);
  const cols = 2;
  const cw = (x1 - x0) / cols;
  for (let c = 0; c < cols; c++) {
    let y = y0 - (c % 2 ? r() * maxH * 0.5 : 0);
    let i = 0;
    while (y < y1) {
      const h = minH + r() * (maxH - minH);
      const ya = Math.max(y, y0);
      const yb = Math.min(y + h, y1);
      if (yb - ya > 2) {
        const col = shade(base, (r() - 0.5) * 2 * vary);
        out.push(<rect key={`${key}${c}-${i}`} x={f1(x0 + c * cw + 0.8)} y={f1(ya + 0.8)} width={f1(Math.max(0, cw - 1.6))} height={f1(yb - ya - 1.6)} rx={2} fill={col} />);
        out.push(<rect key={`${key}${c}-${i}h`} x={f1(x0 + c * cw + 1.5)} y={f1(ya + 1)} width={f1(Math.max(0, cw - 3))} height={1.3} fill="#fff" opacity={0.13} />);
      }
      y += h;
      i++;
    }
  }
  return out;
}

/** wooden planks: vertical boards across a rect (wall face) */
export function planks(x0: number, y0: number, x1: number, y1: number, base: string, seed: number, key = 'pk'): ReactElement[] {
  const out: ReactElement[] = [];
  const r = rng(seed);
  let x = x0;
  let i = 0;
  while (x < x1) {
    const w = 9 + r() * 6;
    const xb = Math.min(x + w, x1);
    const top = y0 + (r() < 0.5 ? 0 : -3 - r() * 3);
    const c = shade(base, (r() - 0.5) * 0.25);
    out.push(
      <path key={`${key}${i}`} d={`M${f1(x + 0.6)},${f1(y1)} L${f1(x + 0.6)},${f1(top + 3)} L${f1((x + xb) / 2)},${f1(top)} L${f1(xb - 0.6)},${f1(top + 3)} L${f1(xb - 0.6)},${f1(y1)} Z`} fill={c} />,
    );
    out.push(<rect key={`${key}${i}l`} x={f1(x + 0.6)} y={f1(top + 3)} width={1.2} height={f1(y1 - top - 3)} fill="#fff" opacity={0.1} />);
    x = xb;
    i++;
  }
  return out;
}

/**
 * A square pillar / tower: `x` horizontal centre, `y` ground line (bottom of the face), `w` width,
 * `h` visible face height, cap drawn on top. `top` optional covering (snow) on the cap.
 */
export function Pillar({ x, y, w, h, st, seed = 1, broken = false }: { x: number; y: number; w: number; h: number; st: WallStyle; seed?: number; broken?: boolean }) {
  const capH = Math.round(w * 0.42);
  const x0 = x - w / 2;
  const faceTop = y - h;
  const brokenPath = broken
    ? `M${f1(x0 - 3)},${f1(faceTop)} L${f1(x0 + w * 0.3)},${f1(faceTop - capH * 0.4)} L${f1(x0 + w * 0.5)},${f1(faceTop + 4)} L${f1(x0 + w * 0.75)},${f1(faceTop - capH * 0.7)} L${f1(x0 + w + 3)},${f1(faceTop - 2)} L${f1(x0 + w + 3)},${f1(faceTop + 6)} L${f1(x0 - 3)},${f1(faceTop + 6)} Z`
    : '';
  return (
    <g>
      <Shadow x={x + 4} y={y + 2} rx={w * 0.75} ry={w * 0.22} o={0.4} />
      <rect x={f1(x0)} y={f1(faceTop)} width={w} height={h} fill={st.mortar} />
      {stoneCourse(x0, faceTop, x0 + w, y, 11, w * 0.35, w * 0.7, st.face, seed, 0.1, `p${seed}`)}
      <rect x={f1(x0)} y={f1(faceTop)} width={4} height={h} fill="#fff" opacity={0.07} />
      <rect x={f1(x0 + w - 6)} y={f1(faceTop)} width={6} height={h} fill="#000" opacity={0.2} />
      <rect x={f1(x0)} y={f1(y - 5)} width={w} height={5} fill="#000" opacity={0.2} />
      {broken ? (
        <>
          <path d={brokenPath} fill={st.cap} />
          <path d={brokenPath} fill="#000" opacity={0.15} transform="translate(0,3)" />
        </>
      ) : (
        <>
          <rect x={f1(x0 - 4)} y={f1(faceTop - capH)} width={w + 8} height={capH} rx={2} fill={st.cap} />
          <rect x={f1(x0 - 4)} y={f1(faceTop - capH)} width={w + 8} height={2} fill="#fff" opacity={0.25} />
          <rect x={f1(x0 - 4)} y={f1(faceTop - 4)} width={w + 8} height={4} fill="#000" opacity={0.25} />
          <rect x={f1(x0 + 3)} y={f1(faceTop - capH + 4)} width={w - 6} height={f1(capH - 9)} rx={2} fill="#000" opacity={0.08} />
          {st.topping && <path d={blobPath(x, faceTop - capH * 0.55, w * 0.5 + 3, capH * 0.48, seed + 5, 8, 0.14)} fill={st.topping} />}
        </>
      )}
    </g>
  );
}

/**
 * The courtyard walls: side caps, top wall (cap + visible inner face), bottom wall (cap + outer face),
 * corner towers, intermediate pillars and an optional gate in the middle of the top wall.
 * `faceDecor` is drawn on top of the top wall face (banners, torches, ivy) — before the pillars.
 */
export function Walls({ st, seed = 7, gate = true, faceDecor, brokenAt = [], pillar }: { st: WallStyle; seed?: number; gate?: boolean; faceDecor?: ReactNode; brokenAt?: number[]; pillar?: WallStyle }) {
  const pst = pillar ?? st;
  const wood = st.kind === 'wood';
  const capTop = 20;
  const faceTop = 36;
  const faceBot = FLOOR.y0;
  const sideL0 = 14;
  const sideL1 = 54;
  const sideR0 = 946;
  const sideR1 = 986;
  const botCap = FLOOR.y1;
  const botFace = 576;
  const els: ReactElement[] = [];

  // floor shadow cast by the top wall and the left wall (light from upper-left)
  els.push(<rect key="sh1" x={sideL1} y={faceBot} width={sideR0 - sideL1} height={16} fill="#000" opacity={0.18} />);
  els.push(<rect key="sh2" x={sideL1} y={faceBot} width={sideR0 - sideL1} height={7} fill="#000" opacity={0.16} />);
  els.push(<rect key="sh3" x={sideL1} y={faceBot} width={12} height={botCap - faceBot} fill="#000" opacity={0.16} />);
  els.push(<rect key="sh4" x={sideR0 - 5} y={faceBot} width={5} height={botCap - faceBot} fill="#000" opacity={0.1} />);
  els.push(<rect key="sh5" x={sideL1} y={botCap - 6} width={sideR0 - sideL1} height={6} fill="#000" opacity={0.12} />);

  // side walls (caps seen from above) + thin inner face sliver
  for (const [x0, x1, s] of [
    [sideL0, sideL1, seed + 11],
    [sideR0, sideR1, seed + 23],
  ] as const) {
    els.push(<rect key={`sw${s}`} x={x0 - 2} y={capTop} width={x1 - x0 + 4} height={600 - capTop + 20} fill={st.mortar} />);
    if (wood) {
      // logs running along y
      els.push(...stoneColumn(x0, capTop, x1, 620, 120, 200, st.cap, s, 0.08, `sl${s}`));
      for (let k = 0; k < 2; k++)
        els.push(<rect key={`lg${s}${k}`} x={x0 + k * ((x1 - x0) / 2) + 3} y={capTop} width={2} height={600} fill="#000" opacity={0.12} />);
    } else {
      els.push(...stoneColumn(x0, capTop, x1, 620, 26, 46, st.cap, s, 0.12, `sl${s}`));
    }
    const inner = x0 < 500 ? x1 : x0 - 4;
    els.push(<rect key={`si${s}`} x={inner} y={capTop} width={4} height={botCap - capTop} fill={st.face} />);
    els.push(<rect key={`sj${s}`} x={inner} y={capTop} width={4} height={botCap - capTop} fill="#000" opacity={x0 < 500 ? 0.35 : 0.15} />);
    if (st.topping) {
      for (let i = 0; i < 9; i++) {
        const yy = 60 + i * 62 + hash(i, s) * 30;
        els.push(<path key={`stp${s}${i}`} d={blobPath((x0 + x1) / 2, yy, 15 + hash(i, s + 1) * 6, 14 + hash(i, s + 2) * 14, s + i, 8, 0.2)} fill={st.topping} opacity={0.9} />);
      }
    }
  }

  // top wall: face then cap
  els.push(<rect key="tf" x={sideL0} y={faceTop} width={sideR1 - sideL0} height={faceBot - faceTop} fill={st.mortar} />);
  if (wood) els.push(...planks(sideL0, faceTop + 4, sideR1, faceBot, st.face, seed + 3, 'tfp'));
  else els.push(...stoneCourse(sideL0, faceTop, sideR1, faceBot, 12.25, 26, 50, st.face, seed + 3, 0.13, 'tfs'));
  // gradient-free shading: darker towards the ground
  els.push(<rect key="tfd1" x={sideL0} y={faceBot - 14} width={sideR1 - sideL0} height={14} fill="#000" opacity={0.14} />);
  els.push(<rect key="tfd2" x={sideL0} y={faceBot - 6} width={sideR1 - sideL0} height={6} fill="#000" opacity={0.16} />);
  if (wood) {
    els.push(<rect key="rail1" x={sideL0} y={52} width={sideR1 - sideL0} height={5} fill={shade(st.face, -0.25)} />);
    els.push(<rect key="rail2" x={sideL0} y={72} width={sideR1 - sideL0} height={5} fill={shade(st.face, -0.25)} />);
  }
  els.push(<rect key="tc" x={sideL0 - 2} y={capTop} width={sideR1 - sideL0 + 4} height={faceTop - capTop} fill={st.mortar} />);
  els.push(...stoneCourse(sideL0 - 2, capTop, sideR1 + 2, faceTop, 16, 40, 72, st.cap, seed + 5, 0.1, 'tcs'));
  els.push(<rect key="tcl" x={sideL0 - 2} y={faceTop - 3} width={sideR1 - sideL0 + 4} height={3} fill="#000" opacity={0.3} />);
  if (st.topping) {
    for (let i = 0; i < 16; i++) {
      const xx = 30 + i * 62 + hash(i, seed + 40) * 30;
      els.push(<path key={`ttp${i}`} d={blobPath(xx, 27, 18 + hash(i, seed + 41) * 16, 7 + hash(i, seed + 42) * 3, seed + 60 + i, 8, 0.2)} fill={st.topping} />);
    }
  }

  // bottom wall: cap then outer face
  els.push(<rect key="bc" x={sideL0 - 2} y={botCap} width={sideR1 - sideL0 + 4} height={40} fill={st.mortar} />);
  els.push(...stoneCourse(sideL0 - 2, botCap, sideR1 + 2, botFace, 14, 40, 70, st.cap, seed + 9, 0.1, 'bcs'));
  if (wood) els.push(...planks(sideL0, botFace + 3, sideR1, 610, st.face, seed + 13, 'bfp'));
  else els.push(...stoneCourse(sideL0 - 2, botFace, sideR1 + 2, 610, 12, 26, 50, st.face, seed + 13, 0.13, 'bfs'));
  els.push(<rect key="bfd" x={sideL0 - 2} y={botFace} width={sideR1 - sideL0 + 4} height={4} fill="#000" opacity={0.3} />);
  els.push(<rect key="bci" x={sideL0 - 2} y={botCap} width={sideR1 - sideL0 + 4} height={2} fill="#fff" opacity={0.18} />);
  if (st.topping) {
    for (let i = 0; i < 16; i++) {
      const xx = 30 + i * 62 + hash(i, seed + 50) * 30;
      els.push(<path key={`btp${i}`} d={blobPath(xx, 569, 16 + hash(i, seed + 51) * 16, 5 + hash(i, seed + 52) * 2, seed + 80 + i, 8, 0.2)} fill={st.topping} />);
    }
  }

  return (
    <g>
      {els}
      {gate && <Gate x={500} st={st} />}
      {faceDecor}
      {[250, 750].map((px, i) => (
        <Pillar key={`tp${px}`} x={px} y={faceBot + 2} w={34} h={66} st={pst} seed={seed + 100 + i} broken={brokenAt.includes(px)} />
      ))}
      {[34, 966].map((px, i) => (
        <Pillar key={`cp${px}`} x={px} y={faceBot + 4} w={50} h={74} st={pst} seed={seed + 200 + i} />
      ))}
      {[34, 966].map((px, i) => (
        <Pillar key={`sp${px}`} x={px} y={330} w={44} h={18} st={pst} seed={seed + 300 + i} broken={brokenAt.includes(px)} />
      ))}
      {[34, 966].map((px, i) => (
        <Pillar key={`bp${px}`} x={px} y={606} w={50} h={36} st={pst} seed={seed + 400 + i} />
      ))}
    </g>
  );
}

/** an arched gate with wooden doors, in the top wall */
export function Gate({ x, st }: { x: number; st: WallStyle }) {
  const y = FLOOR.y0;
  return (
    <g>
      <path d={`M${x - 34},${y} L${x - 34},${y - 34} Q${x},${y - 64} ${x + 34},${y - 34} L${x + 34},${y} Z`} fill={shade(st.mortar, -0.3)} />
      <path d={`M${x - 28},${y} L${x - 28},${y - 32} Q${x},${y - 56} ${x + 28},${y - 32} L${x + 28},${y} Z`} fill="#3a2818" />
      {[-21, -13, -5, 3, 11, 19].map((dx) => (
        <rect key={dx} x={x + dx} y={y - 50} width={7} height={50} fill="#5a3d24" opacity={0.75} />
      ))}
      <rect x={x - 1} y={y - 52} width={2} height={52} fill="#1c120a" />
      <rect x={x - 28} y={y - 30} width={56} height={4} fill="#2a2a2e" />
      <rect x={x - 28} y={y - 12} width={56} height={4} fill="#2a2a2e" />
      <circle cx={x - 6} cy={y - 18} r={2} fill="#c9a45c" />
      <circle cx={x + 6} cy={y - 18} r={2} fill="#c9a45c" />
      {/* arch stones */}
      {Array.from({ length: 9 }, (_, i) => {
        const a = Math.PI + (i / 8) * Math.PI;
        const cx = x + Math.cos(a) * 32;
        const cy = y - 34 + Math.sin(a) * 26;
        return <rect key={i} x={f1(cx - 5)} y={f1(cy - 4)} width={10} height={8} rx={1.5} fill={shade(st.cap, (hash(i, 3) - 0.5) * 0.2)} transform={`rotate(${f1((a * 180) / Math.PI + 90)},${f1(cx)},${f1(cy)})`} />;
      })}
      <rect x={x - 40} y={y - 2} width={80} height={5} fill={shade(st.cap, -0.15)} />
    </g>
  );
}

// ---------------------------------------------------------------- floors

export interface FloorTile {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number; // per-tile random
}

/** a running-bond grid of tiles over a rect with jittered widths; caller decides how to draw them */
export function tileGrid(x0: number, y0: number, x1: number, y1: number, tw: number, th: number, seed: number, split = 0.18): FloorTile[] {
  const out: FloorTile[] = [];
  const r = rng(seed);
  let row = 0;
  for (let y = y0; y < y1; y += th, row++) {
    let x = x0 - (row % 2 ? tw * 0.5 : r() * tw * 0.3);
    const h = Math.min(th, y1 - y);
    while (x < x1) {
      const w = tw * (0.7 + r() * 0.6);
      const q = r();
      if (q < split && h > 8) {
        // split into two half-height stones (one possibly offset) to break the running bond
        const cut = w * (0.35 + r() * 0.3);
        out.push({ x, y, w, h: h / 2, r: r() });
        out.push({ x, y: y + h / 2, w: cut, h: h / 2, r: r() });
        out.push({ x: x + cut, y: y + h / 2, w: w - cut, h: h / 2, r: r() });
      } else if (q < split * 1.6) {
        const cut = w * (0.4 + r() * 0.2);
        out.push({ x, y, w: cut, h, r: r() });
        out.push({ x: x + cut, y, w: w - cut, h, r: r() });
      } else out.push({ x, y, w, h, r: r() });
      x += w;
    }
  }
  return out;
}

/** draw stone flagstones (mortar background is caller's rect) */
export function flagstones(tiles: FloorTile[], base: string | string[], vary: number, key: string, opts: { gap?: number; rx?: number; hi?: number; lo?: number } = {}): ReactElement[] {
  const gap = opts.gap ?? 1.6;
  const rx = opts.rx ?? 3;
  const hi = opts.hi ?? 0.07;
  const lo = opts.lo ?? 0.12;
  const out: ReactElement[] = [];
  tiles.forEach((t, i) => {
    const b = typeof base === 'string' ? base : pick(hash(i, 777), base);
    const c = shade(b, (t.r - 0.5) * 2 * vary);
    out.push(<rect key={`${key}${i}`} x={f1(t.x + gap)} y={f1(t.y + gap)} width={f1(t.w - gap * 2)} height={f1(t.h - gap * 2)} rx={rx} fill={c} />);
    if (hi > 0) out.push(<rect key={`${key}${i}h`} x={f1(t.x + gap + 1)} y={f1(t.y + gap)} width={f1(t.w - gap * 2 - 2)} height={1.6} fill="#fff" opacity={hi} />);
    if (lo > 0) out.push(<rect key={`${key}${i}l`} x={f1(t.x + gap + 1)} y={f1(t.y + t.h - gap - 2)} width={f1(t.w - gap * 2 - 2)} height={2} fill="#000" opacity={lo} />);
  });
  return out;
}

/** tiny dots (snow dust, sand grains, dirt, pebbles) */
export function speckles(n: number, area: [number, number, number, number], seed: number, colors: string[], rMin: number, rMax: number, o: number, key = 'spk'): ReactElement[] {
  const out: ReactElement[] = [];
  const [x0, y0, x1, y1] = area;
  for (let i = 0; i < n; i++) {
    out.push(
      <ellipse key={`${key}${i}`} cx={f1(x0 + hash(i, seed) * (x1 - x0))} cy={f1(y0 + hash(i, seed + 1) * (y1 - y0))} rx={f1(rMin + hash(i, seed + 2) * (rMax - rMin))} ry={f1((rMin + hash(i, seed + 2) * (rMax - rMin)) * 0.65)} fill={pick(hash(i, seed + 3), colors)} opacity={o} />,
    );
  }
  return out;
}

/** soft layered patch (drift / pile / puddle): 3 stacked blobs, outer faint, inner solid */
export function softPatch(cx: number, cy: number, rx: number, ry: number, color: string, seed: number, o = 1, key = 'pt'): ReactElement {
  return (
    <g key={key} opacity={o}>
      <path d={blobPath(cx, cy, rx * 1.18, ry * 1.25, seed, 10, 0.22)} fill={color} opacity={0.3} />
      <path d={blobPath(cx, cy, rx, ry, seed + 1, 10, 0.24)} fill={color} opacity={0.55} />
      <path d={blobPath(cx - rx * 0.08, cy - ry * 0.1, rx * 0.72, ry * 0.66, seed + 2, 9, 0.25)} fill={color} opacity={0.9} />
    </g>
  );
}

/** hairline cracks scattered over a rect */
export function cracks(x0: number, y0: number, x1: number, y1: number, n: number, seed: number, color = '#000', o = 0.35): ReactElement[] {
  const out: ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + hash(i, seed) * (x1 - x0);
    const y = y0 + hash(i, seed + 1) * (y1 - y0);
    let d = `M${f1(x)},${f1(y)}`;
    let cx = x;
    let cy = y;
    const segs = 3 + Math.floor(hash(i, seed + 2) * 3);
    for (let s = 0; s < segs; s++) {
      cx += (hash(i * 7 + s, seed + 3) - 0.5) * 16;
      cy += 3 + hash(i * 7 + s, seed + 4) * 7;
      d += ` L${f1(cx)},${f1(cy)}`;
    }
    out.push(<path key={`ck${seed}-${i}`} d={d} fill="none" stroke={color} strokeWidth={1} opacity={o} strokeLinecap="round" />);
  }
  return out;
}

/** n-pointed star path centred on 0,0 */
export function starPath(n: number, ro: number, ri: number): string {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? ri : ro;
    d += `${i ? 'L' : 'M'}${f1(Math.cos(a) * r)},${f1(Math.sin(a) * r)} `;
  }
  return d + 'Z';
}

const annular = (r0: number, r1: number, a0: number, a1: number) => {
  const p = (r: number, a: number) => `${f1(Math.cos(a) * r)},${f1(Math.sin(a) * r)}`;
  return `M${p(r0, a0)} L${p(r1, a0)} A${r1},${r1} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} A${r0},${r0} 0 0 0 ${p(r0, a0)} Z`;
};

/**
 * Circular mosaic / rune circle on the floor (perspective-squashed). `stone` ring tiles colour,
 * `inlay` accent colour for the rune glyphs, `rim` outer ring.
 */
export function Mosaic({ cx, cy, r, stone, inlay, rim, mortar, seed = 3, glyph = 'rune' }: { cx: number; cy: number; r: number; stone: string; inlay: string; rim: string; mortar: string; seed?: number; glyph?: 'rune' | 'sun' | 'flower' | 'leaf' }) {
  const rings: [number, number, number, string, number][] = [
    // r0, r1, segments, colour, vary
    [r * 0.0, r * 0.22, 1, shade(mortar, 0.18), 0],
    [r * 0.22, r * 0.42, 10, stone, 0.1],
    [r * 0.42, r * 0.6, 16, shade(stone, -0.08), 0.12],
    [r * 0.6, r * 0.82, 24, stone, 0.1],
    [r * 0.82, r, 36, rim, 0.12],
  ];
  const els: ReactElement[] = [];
  rings.forEach(([r0, r1, n, col, vary], ri) => {
    if (n === 1) {
      els.push(<circle key={`mc${ri}`} r={f1(r1 - 1)} fill={col} />);
      return;
    }
    const off = hash(ri, seed) * Math.PI;
    for (let i = 0; i < n; i++) {
      const a0 = off + (i / n) * Math.PI * 2 + 0.012;
      const a1 = off + ((i + 1) / n) * Math.PI * 2 - 0.012;
      els.push(<path key={`ms${ri}-${i}`} d={annular(r0 + 1, r1 - 1, a0, a1)} fill={shade(col, (hash(i, seed + ri) - 0.5) * 2 * vary)} />);
    }
  });
  // glyphs on the ring between 0.6 and 0.82
  const gR = r * 0.71;
  const glyphs: ReactElement[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const gx = f1(Math.cos(a) * gR);
    const gy = f1(Math.sin(a) * gR);
    const s = r * 0.07;
    const d =
      glyph === 'sun'
        ? `M0,${-s} L${s * 0.5},0 L0,${s} L${-s * 0.5},0 Z M${-s},0 L${s},0`
        : glyph === 'flower'
          ? `M0,${-s} Q${s},${-s} 0,0 Q${s},${s} 0,${s} Q${-s},${s} 0,0 Q${-s},${-s} 0,${-s} Z`
          : glyph === 'leaf'
            ? `M0,${-s} Q${s * 0.9},0 0,${s} Q${-s * 0.9},0 0,${-s} Z M0,${-s} L0,${s}`
            : i % 2
              ? `M0,${-s} L${s * 0.7},${s * 0.6} L${-s * 0.7},${s * 0.6} Z`
              : `M${-s * 0.6},${-s} L${s * 0.6},${-s} L0,${s} Z M0,${-s * 0.3} L0,${s * 0.4}`;
    glyphs.push(
      <path key={`g${i}`} d={d} transform={`translate(${gx},${gy}) rotate(${f1((a * 180) / Math.PI + 90)})`} fill="none" stroke={inlay} strokeWidth={2.2} strokeLinejoin="round" opacity={0.9} />,
    );
  }
  // star/lines in the centre
  const star: ReactElement[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    star.push(<line key={`st${i}`} x1={0} y1={0} x2={f1(Math.cos(a) * r * 0.42)} y2={f1(Math.sin(a) * r * 0.42)} stroke={inlay} strokeWidth={1.6} opacity={0.6} />);
  }
  return (
    <g transform={`translate(${cx},${cy}) scale(1,0.62)`}>
      <circle r={r + 6} fill="#000" opacity={0.18} />
      <circle r={r + 2} fill={mortar} />
      {els}
      {star}
      <circle r={r * 0.22} fill="none" stroke={shade(inlay, 0.3)} strokeWidth={2} opacity={0.8} />
      <path d={starPath(8, r * 0.19, r * 0.08)} fill={inlay} opacity={0.85} />
      <circle r={r * 0.05} fill={shade(inlay, 0.6)} />
      <circle r={r * 0.6} fill="none" stroke={inlay} strokeWidth={1.4} opacity={0.5} />
      <circle r={r * 0.82} fill="none" stroke={inlay} strokeWidth={1.4} opacity={0.5} />
      {glyphs}
      <circle r={r + 2} fill="none" stroke="#000" strokeWidth={2} opacity={0.25} />
    </g>
  );
}

// ---------------------------------------------------------------- props (local coords, origin = ground)

export interface Leafy {
  dark: string;
  mid: string;
  light: string;
}

/** conifer. `snow` adds white tops to each tier */
export function Pine({ x, y, s = 1, c, snow, seed = 1 }: { x: number; y: number; s?: number; c: Leafy; snow?: string; seed?: number }) {
  const tiers = 4;
  const els: ReactElement[] = [];
  for (let i = 0; i < tiers; i++) {
    const k = i / (tiers - 1); // 0 bottom .. 1 top
    const by = -14 - i * 20;
    const hw = 30 - i * 6.5;
    const ty = by - 30;
    const j = (hash(i, seed) - 0.5) * 4;
    els.push(<path key={`d${i}`} d={`M${-hw},${by} Q${-hw * 0.4},${by - 6} ${j},${ty} Q${hw * 0.4},${by - 6} ${hw},${by} Q0,${by + 5} ${-hw},${by} Z`} fill={c.dark} />);
    els.push(<path key={`m${i}`} d={`M${-hw * 0.85},${by - 2} Q${-hw * 0.4},${by - 8} ${j},${ty + 1} Q${hw * 0.1},${by - 10} ${hw * 0.15},${by + 1} Z`} fill={c.mid} />);
    els.push(<path key={`l${i}`} d={`M${-hw * 0.7},${by - 4} Q${-hw * 0.35},${by - 9} ${j - 1},${ty + 3} L${-hw * 0.05},${by - 4} Z`} fill={c.light} opacity={0.8} />);
    if (snow) {
      els.push(
        <path key={`s${i}`} d={`M${-hw * 0.75},${by - 3 - k} Q${-hw * 0.3},${by - 12} ${j},${ty} Q${hw * 0.35},${by - 11} ${hw * 0.7},${by - 4} Q${hw * 0.3},${by - 9} ${j},${ty + 9} Q${-hw * 0.3},${by - 8} ${-hw * 0.75},${by - 3} Z`} fill={snow} />,
      );
    }
  }
  return (
    <g transform={`translate(${f1(x)},${f1(y)}) scale(${f1(s * 100) / 100})`}>
      <ellipse cx={6} cy={2} rx={30} ry={9} fill="#000" opacity={0.32} />
      <rect x={-4} y={-18} width={8} height={20} fill="#3b2817" />
      {els}
    </g>
  );
}

/** broadleaf tree: lumpy canopy of 3 layers */
export function Tree({ x, y, s = 1, c, trunk = '#4a3220', seed = 1, fruit }: { x: number; y: number; s?: number; c: Leafy; trunk?: string; seed?: number; fruit?: string }) {
  const dots: ReactElement[] = [];
  if (fruit) {
    for (let i = 0; i < 9; i++) {
      dots.push(<circle key={i} cx={f1((hash(i, seed + 9) - 0.5) * 50)} cy={f1(-62 + (hash(i, seed + 10) - 0.5) * 36)} r={f1(2 + hash(i, seed + 11) * 1.6)} fill={fruit} />);
    }
  }
  return (
    <g transform={`translate(${f1(x)},${f1(y)}) scale(${f1(s * 100) / 100})`}>
      <ellipse cx={8} cy={2} rx={34} ry={10} fill="#000" opacity={0.32} />
      <path d="M-5,2 L-3,-34 L-12,-48 M-3,-34 L3,-30 L10,-50 M3,-30 L5,2 Z" stroke={trunk} strokeWidth={4} fill={trunk} strokeLinejoin="round" />
      <path d={blobPath(0, -62, 36, 30, seed, 10, 0.2)} fill={c.dark} />
      <path d={blobPath(-5, -67, 29, 23, seed + 1, 9, 0.22)} fill={c.mid} />
      <path d={blobPath(-11, -74, 16, 12, seed + 2, 8, 0.25)} fill={c.light} />
      {dots}
    </g>
  );
}

export function Bush({ x, y, s = 1, c, seed = 1, flowers, snow }: { x: number; y: number; s?: number; c: Leafy; seed?: number; flowers?: string; snow?: string }) {
  const fl: ReactElement[] = [];
  if (flowers) {
    for (let i = 0; i < 6; i++) {
      fl.push(<circle key={i} cx={f1((hash(i, seed + 4) - 0.5) * 34)} cy={f1(-12 + (hash(i, seed + 5) - 0.5) * 14)} r={2.2} fill={flowers} />);
    }
  }
  return (
    <g transform={`translate(${f1(x)},${f1(y)}) scale(${f1(s * 100) / 100})`}>
      <ellipse cx={3} cy={1} rx={22} ry={6} fill="#000" opacity={0.3} />
      <path d={blobPath(0, -10, 22, 13, seed, 9, 0.22)} fill={c.dark} />
      <path d={blobPath(-3, -13, 16, 9, seed + 1, 8, 0.25)} fill={c.mid} />
      <path d={blobPath(-7, -17, 8, 5, seed + 2, 7, 0.25)} fill={c.light} />
      {snow && <path d={blobPath(-1, -19, 15, 5, seed + 3, 8, 0.25)} fill={snow} />}
      {fl}
    </g>
  );
}

export function Rock({ x, y, s = 1, c, seed = 1, snow, moss }: { x: number; y: number; s?: number; c: Leafy; seed?: number; snow?: string; moss?: string }) {
  const j = (i: number) => (hash(i, seed) - 0.5) * 5;
  return (
    <g transform={`translate(${f1(x)},${f1(y)}) scale(${f1(s * 100) / 100})`}>
      <ellipse cx={3} cy={2} rx={19} ry={6} fill="#000" opacity={0.35} />
      <path d={`M-17,2 L${-15 + j(1)},-9 L${-6 + j(2)},-17 L${7 + j(3)},-15 L${16 + j(4)},-6 L17,2 Z`} fill={c.dark} />
      <path d={`M${-15 + j(1)},-9 L${-6 + j(2)},-17 L${7 + j(3)},-15 L${2},-7 L-8,-4 Z`} fill={c.mid} />
      <path d={`M${-6 + j(2)},-17 L${7 + j(3)},-15 L${1},-11 Z`} fill={c.light} />
      {moss && <path d={`M${-15 + j(1)},-9 L${-6 + j(2)},-17 L-3,-12 L-10,-6 Z`} fill={moss} opacity={0.85} />}
      {snow && <path d={`M${-14 + j(1)},-10 L${-6 + j(2)},-17 L${7 + j(3)},-15 L${12},-10 Q2,-13 -14,-10 Z`} fill={snow} />}
    </g>
  );
}

export function Crate({ x, y, s = 1, wood = '#7a5530', seed = 1, snow }: { x: number; y: number; s?: number; wood?: string; seed?: number; snow?: string }) {
  const lo = shade(wood, -0.3);
  const hi = shade(wood, 0.18);
  return (
    <g transform={`translate(${f1(x)},${f1(y)}) scale(${f1(s * 100) / 100})`}>
      <ellipse cx={4} cy={1} rx={19} ry={5} fill="#000" opacity={0.35} />
      {/* front face */}
      <rect x={-14} y={-22} width={28} height={22} fill={wood} />
      <rect x={-14} y={-22} width={28} height={22} fill="none" stroke={lo} strokeWidth={2} />
      <path d="M-13,-21 L13,-1 M13,-21 L-13,-1" stroke={lo} strokeWidth={2} opacity={0.8} />
      {/* top face */}
      <path d="M-14,-22 L-8,-31 L20,-31 L14,-22 Z" fill={hi} />
      <path d="M-14,-22 L-8,-31 L20,-31 L14,-22 Z" fill="none" stroke={lo} strokeWidth={1.4} />
      {/* side face */}
      <path d="M14,-22 L20,-31 L20,-9 L14,0 Z" fill={shade(wood, -0.18)} />
      {snow && <path d={blobPath(3, -28, 15, 4, seed, 7, 0.2)} fill={snow} />}
    </g>
  );
}

export function Barrel({ x, y, s = 1, wood = '#7a5530', band = '#3a3a40' }: { x: number; y: number; s?: number; wood?: string; band?: string }) {
  return (
    <g transform={`translate(${f1(x)},${f1(y)}) scale(${f1(s * 100) / 100})`}>
      <ellipse cx={3} cy={1} rx={15} ry={5} fill="#000" opacity={0.35} />
      <path d="M-11,0 Q-14,-12 -11,-24 L11,-24 Q14,-12 11,0 Z" fill={wood} />
      <path d="M-11,0 Q-14,-12 -11,-24 L-6,-24 Q-8,-12 -6,0 Z" fill="#fff" opacity={0.12} />
      <path d="M6,0 Q8,-12 6,-24 L11,-24 Q14,-12 11,0 Z" fill="#000" opacity={0.2} />
      <rect x={-13} y={-7} width={26} height={2.5} fill={band} />
      <rect x={-13} y={-19} width={26} height={2.5} fill={band} />
      <ellipse cx={0} cy={-24} rx={11} ry={4} fill={shade(wood, 0.15)} stroke={band} strokeWidth={1.5} />
    </g>
  );
}

/** wall-mounted torch sconce (static part). The flame is drawn by <Flame/> in the Ambient layer at (x, y - 14*s). */
export function Sconce({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${f1(x)},${f1(y)}) scale(${s})`}>
      <path d="M-3,0 L3,0 L5,-12 L-5,-12 Z" fill="#2c2620" />
      <rect x={-6} y={-14} width={12} height={3} fill="#4a3a2a" />
      <rect x={-2} y={0} width={4} height={6} fill="#1c1814" />
      <path d="M-4,-14 Q0,-20 4,-14 Z" fill="#1a1410" />
    </g>
  );
}

/** standing brazier (static part). Flame at (x, y - 24*s). */
export function Brazier({ x, y, s = 1, metal = '#3a3a44' }: { x: number; y: number; s?: number; metal?: string }) {
  return (
    <g transform={`translate(${f1(x)},${f1(y)}) scale(${s})`}>
      <ellipse cx={3} cy={1} rx={15} ry={5} fill="#000" opacity={0.4} />
      <path d="M-8,0 L-3,-14 M8,0 L3,-14 M0,1 L0,-14" stroke={shade(metal, -0.3)} strokeWidth={2.4} />
      <path d="M-13,-24 L13,-24 L8,-14 L-8,-14 Z" fill={metal} />
      <path d="M-13,-24 L13,-24 L11,-21 L-11,-21 Z" fill={shade(metal, 0.25)} />
      <ellipse cx={0} cy={-24} rx={13} ry={3.5} fill="#1a0d06" />
      <ellipse cx={0} cy={-24} rx={9} ry={2.2} fill="#ff7a2a" opacity={0.7} />
    </g>
  );
}

/** banner hanging on the top wall face */
export function Banner({ x, y, w = 22, h = 40, color, trim = '#c9a45c', emblem = 'circle' }: { x: number; y: number; w?: number; h?: number; color: string; trim?: string; emblem?: 'circle' | 'diamond' | 'leaf' | 'sun' }) {
  const hw = w / 2;
  const em =
    emblem === 'diamond' ? (
      <path d={`M0,${h * 0.28} L${hw * 0.45},${h * 0.45} L0,${h * 0.62} L${-hw * 0.45},${h * 0.45} Z`} fill={trim} />
    ) : emblem === 'leaf' ? (
      <path d={`M0,${h * 0.25} Q${hw * 0.6},${h * 0.45} 0,${h * 0.66} Q${-hw * 0.6},${h * 0.45} 0,${h * 0.25} Z`} fill={trim} />
    ) : emblem === 'sun' ? (
      <g>
        <circle cx={0} cy={h * 0.45} r={hw * 0.3} fill={trim} />
        <circle cx={0} cy={h * 0.45} r={hw * 0.52} fill="none" stroke={trim} strokeWidth={1.4} strokeDasharray="2 2" />
      </g>
    ) : (
      <circle cx={0} cy={h * 0.45} r={hw * 0.4} fill="none" stroke={trim} strokeWidth={2} />
    );
  return (
    <g transform={`translate(${f1(x)},${f1(y)})`}>
      <rect x={-hw - 3} y={-2} width={w + 6} height={3} rx={1.5} fill="#2a1d12" />
      <path d={`M${-hw},0 L${hw},0 L${hw},${h} L0,${h - 7} L${-hw},${h} Z`} fill={color} />
      <path d={`M${-hw},0 L${-hw + 4},0 L${-hw + 4},${h - 2} L${-hw},${h} Z`} fill="#fff" opacity={0.12} />
      <path d={`M${hw - 4},0 L${hw},0 L${hw},${h} L${hw - 4},${h - 2} Z`} fill="#000" opacity={0.22} />
      <path d={`M${-hw},${h} L0,${h - 7} L${hw},${h}`} fill="none" stroke={trim} strokeWidth={1.5} />
      {em}
    </g>
  );
}

/** a fallen column piece lying on the ground */
export function FallenColumn({ x, y, s = 1, c, rot = 0 }: { x: number; y: number; s?: number; c: Leafy; rot?: number }) {
  return (
    <g transform={`translate(${f1(x)},${f1(y)}) rotate(${rot}) scale(${s})`}>
      <ellipse cx={2} cy={3} rx={28} ry={6} fill="#000" opacity={0.3} />
      <rect x={-24} y={-12} width={44} height={14} rx={3} fill={c.mid} />
      <rect x={-24} y={-12} width={44} height={4} rx={2} fill={c.light} opacity={0.7} />
      <rect x={-24} y={-3} width={44} height={5} rx={2} fill={c.dark} opacity={0.6} />
      <ellipse cx={20} cy={-5} rx={5} ry={7.5} fill={c.light} />
      <ellipse cx={20} cy={-5} rx={3} ry={5} fill={c.mid} />
    </g>
  );
}

/** clusters of grass blades */
export function grassTufts(n: number, area: [number, number, number, number], seed: number, colors: string[], key = 'gt', size = 1): ReactElement[] {
  const out: ReactElement[] = [];
  const [x0, y0, x1, y1] = area;
  for (let i = 0; i < n; i++) {
    const x = x0 + hash(i, seed) * (x1 - x0);
    const y = y0 + hash(i, seed + 1) * (y1 - y0);
    const c = pick(hash(i, seed + 2), colors);
    const h = (5 + hash(i, seed + 3) * 5) * size;
    out.push(
      <path key={`${key}${i}`} d={`M${f1(x - 3)},${f1(y)} L${f1(x - 4)},${f1(y - h * 0.8)} L${f1(x - 1)},${f1(y)} L${f1(x)},${f1(y - h)} L${f1(x + 1.5)},${f1(y)} L${f1(x + 4)},${f1(y - h * 0.7)} L${f1(x + 3.5)},${f1(y)} Z`} fill={c} />,
    );
  }
  return out;
}

export function Cactus({ x, y, s = 1, c = { dark: '#3f6b3a', mid: '#58894b', light: '#7fb06a' }, seed = 1 }: { x: number; y: number; s?: number; c?: Leafy; seed?: number }) {
  const armL = 0.5 + hash(1, seed) * 0.4;
  const armR = 0.4 + hash(2, seed) * 0.4;
  return (
    <g transform={`translate(${f1(x)},${f1(y)}) scale(${s})`}>
      <ellipse cx={5} cy={1} rx={16} ry={5} fill="#000" opacity={0.3} />
      <path d={`M-14,${f1(-30 * armL)} L-14,${f1(-30 * armL - 18)}`} stroke={c.dark} strokeWidth={9} strokeLinecap="round" />
      <path d={`M-14,${f1(-30 * armL)} L-4,${f1(-30 * armL)}`} stroke={c.dark} strokeWidth={9} strokeLinecap="round" />
      <path d={`M14,${f1(-40 * armR)} L14,${f1(-40 * armR - 14)}`} stroke={c.dark} strokeWidth={8} strokeLinecap="round" />
      <path d={`M14,${f1(-40 * armR)} L4,${f1(-40 * armR)}`} stroke={c.dark} strokeWidth={8} strokeLinecap="round" />
      <rect x={-7} y={-52} width={14} height={52} rx={7} fill={c.mid} />
      <rect x={-5} y={-50} width={4} height={48} rx={2} fill={c.light} opacity={0.8} />
      <rect x={3} y={-50} width={3} height={48} rx={1.5} fill={c.dark} opacity={0.6} />
      <path d={`M-14,${f1(-30 * armL - 20)} L-14,${f1(-30 * armL - 6)}`} stroke={c.light} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      <circle cx={0} cy={-53} r={3} fill="#e86a8a" />
    </g>
  );
}

export function Palm({ x, y, s = 1, c = { dark: '#2f5a2c', mid: '#4a7e3a', light: '#79a955' }, trunk = '#8a6a40', lean = 8 }: { x: number; y: number; s?: number; c?: Leafy; trunk?: string; lean?: number }) {
  const tx = lean;
  const ty = -90;
  const fronds: ReactElement[] = [];
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI + (i / 6) * Math.PI + (i % 2 ? 0.1 : -0.1);
    const ex = tx + Math.cos(a) * 46;
    const ey = ty + Math.sin(a) * 18 + 18;
    const mx = tx + Math.cos(a) * 26;
    const my = ty + Math.sin(a) * 22 - 6;
    fronds.push(<path key={i} d={`M${tx},${ty} Q${f1(mx)},${f1(my - 8)} ${f1(ex)},${f1(ey)} Q${f1(mx)},${f1(my + 4)} ${tx},${ty} Z`} fill={i % 2 ? c.mid : c.dark} />);
  }
  return (
    <g transform={`translate(${f1(x)},${f1(y)}) scale(${s})`}>
      <ellipse cx={10} cy={1} rx={30} ry={8} fill="#000" opacity={0.28} />
      <path d={`M-5,0 Q${tx * 0.2},-50 ${tx - 3},${ty} L${tx + 3},${ty} Q${tx * 0.2 + 8},-50 5,0 Z`} fill={trunk} />
      {[-16, -32, -48, -64, -78].map((yy, i) => (
        <path key={i} d={`M${f1(-5 + (tx * -yy) / 95)},${yy} l9,-2`} stroke={shade(trunk, -0.3)} strokeWidth={1.5} />
      ))}
      {fronds}
      <path d={`M${tx},${ty} Q${tx - 10},${ty - 16} ${tx - 30},${ty - 10} Q${tx - 12},${ty - 8} ${tx},${ty} Z`} fill={c.light} />
      <path d={`M${tx},${ty} Q${tx + 12},${ty - 18} ${tx + 32},${ty - 12} Q${tx + 14},${ty - 8} ${tx},${ty} Z`} fill={c.light} />
      <circle cx={tx - 3} cy={ty + 3} r={3} fill="#5a3a1a" />
      <circle cx={tx + 3} cy={ty + 4} r={3} fill="#5a3a1a" />
    </g>
  );
}

/** a small leaf shape centred on 0,0 pointing +x (length ~ 2*l) */
export const leafPath = (l: number) => `M${-l},0 Q0,${f1(-l * 0.6)} ${l},0 Q0,${f1(l * 0.6)} ${-l},0 Z`;

/** a pile / cluster of small leaves (or petals) in an ellipse, denser in the middle */
export function leafPile(cx: number, cy: number, rx: number, ry: number, n: number, seed: number, colors: string[], size = 4, key = 'lp'): ReactElement[] {
  const out: ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const a = hash(i, seed) * Math.PI * 2;
    const d = Math.sqrt(hash(i, seed + 1));
    const x = cx + Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d;
    const l = size * (0.7 + hash(i, seed + 2) * 0.6);
    out.push(<path key={`${key}${i}`} d={leafPath(l)} transform={`translate(${f1(x)},${f1(y)}) rotate(${Math.round(hash(i, seed + 3) * 360)})`} fill={pick(hash(i, seed + 4), colors)} />);
  }
  return out;
}

// ---------------------------------------------------------------- ambient helpers (pure functions of t)

/** flickering flame + glow. Use in Ambient layers. */
export function Flame({ x, y, t, s = 1, seed = 1, color = '#ff9a3c', core = '#fff1b8', glow = true }: { x: number; y: number; t: number; s?: number; seed?: number; color?: string; core?: string; glow?: boolean }) {
  const ph = seed * 1.7;
  const f = 0.85 + 0.1 * Math.sin(t * 13 + ph) + 0.07 * Math.sin(t * 23.3 + ph * 2) + 0.05 * Math.sin(t * 7.1 + ph);
  const sway = Math.sin(t * 5.3 + ph) * 1.6;
  const hgt = 15 * f;
  return (
    <g transform={`translate(${f1(x)},${f1(y)}) scale(${s})`}>
      {glow && (
        <>
          <circle r={f1(38 * f)} fill={color} opacity={f1(0.07 * f * 100) / 100} />
          <circle r={f1(22 * f)} fill={color} opacity={f1(0.1 * f * 100) / 100} />
        </>
      )}
      <path d={`M-6,0 Q-7,${f1(-hgt * 0.5)} ${f1(sway)},${f1(-hgt)} Q7,${f1(-hgt * 0.45)} 6,0 Q0,3 -6,0 Z`} fill={color} opacity={0.9} />
      <path d={`M-3,0 Q-3,${f1(-hgt * 0.35)} ${f1(sway * 0.6)},${f1(-hgt * 0.62)} Q3,${f1(-hgt * 0.3)} 3,0 Z`} fill={core} />
    </g>
  );
}

/**
 * Generic drifting particle field: returns positions for n particles at time t.
 * Particles fall with speed vy (px/s), drift vx, sway amplitude `sway`, wrapping inside [x0,x1]x[y0,y1].
 */
export function particles(
  n: number,
  t: number,
  seed: number,
  o: { vy: number; vx?: number; sway?: number; swayHz?: number; x0?: number; x1?: number; y0?: number; y1?: number; speedVar?: number },
): { x: number; y: number; k: number; r: number; i: number; ph: number }[] {
  const x0 = o.x0 ?? -20;
  const x1 = o.x1 ?? W + 20;
  const y0 = o.y0 ?? -20;
  const y1 = o.y1 ?? H + 20;
  const sv = o.speedVar ?? 0.5;
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = hash(i, seed);
    const k = 1 - sv / 2 + hash(i, seed + 1) * sv; // speed / depth factor
    const ph = hash(i, seed + 2) * Math.PI * 2;
    const sway = (o.sway ?? 0) * Math.sin(t * (o.swayHz ?? 1) * k + ph);
    const spanX = x1 - x0;
    const spanY = y1 - y0;
    const yy = y0 + ((((hash(i, seed + 3) * spanY + o.vy * k * t) % spanY) + spanY) % spanY);
    const xx = x0 + ((((r * spanX + (o.vx ?? 0) * k * t + sway) % spanX) + spanX) % spanX);
    out.push({ x: xx, y: yy, k, r, i, ph });
  }
  return out;
}
