// Frost shop spells: Crystal Nova, Frostbite, Chain Frost (burst + projectile).
import type { ProjectileArt, VfxArt } from '../../types.ts';
import { bump, clamp01, easeOut } from '../../types.ts';
import { GlowRing, Sparks, f, h, hs, poly, prog, span, star } from './fxkit.tsx';

const ICE = '#8fe3ff';
const ICE_DEEP = '#3aa0e0';

const FrostDefs = () => (
  <defs>
    <radialGradient id="cnova-floor" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
      <stop offset="0.6" stopColor="#8fe3ff" stopOpacity="0.3" />
      <stop offset="1" stopColor="#3aa0e0" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="cnova-shard" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#3aa0e0" stopOpacity="0.4" />
      <stop offset="0.6" stopColor="#bff0ff" />
      <stop offset="1" stopColor="#ffffff" />
    </linearGradient>
    <linearGradient id="fbite-ice" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#e8fbff" stopOpacity="0.85" />
      <stop offset="0.5" stopColor="#8fe3ff" stopOpacity="0.55" />
      <stop offset="1" stopColor="#3aa0e0" stopOpacity="0.7" />
    </linearGradient>
    <radialGradient id="cfrost-orb" cx="0.4" cy="0.4" r="0.6">
      <stop offset="0" stopColor="#ffffff" />
      <stop offset="0.45" stopColor="#a8ecff" />
      <stop offset="1" stopColor="#2b7fd0" />
    </radialGradient>
  </defs>
);

/** a single ice crystal, pointing +x, length l */
const shard = (l: number, w: number): string => poly([[0, 0], [l * 0.35, -w], [l, 0], [l * 0.35, w]]);

/** snowflake glyph */
function Flake({ x, y, r, rot, opacity }: { x: number; y: number; r: number; rot: number; opacity: number }) {
  const arms = [];
  for (let i = 0; i < 6; i++) {
    const a = rot + (i * Math.PI) / 3;
    const ex = x + Math.cos(a) * r;
    const ey = y + Math.sin(a) * r;
    const mx = x + Math.cos(a) * r * 0.55;
    const my = y + Math.sin(a) * r * 0.55;
    arms.push(<line key={`a${i}`} x1={f(x)} y1={f(y)} x2={f(ex)} y2={f(ey)} />);
    for (const s of [-1, 1]) {
      const b = a + s * 0.7;
      arms.push(<line key={`b${i}${s}`} x1={f(mx)} y1={f(my)} x2={f(mx + Math.cos(b) * r * 0.3)} y2={f(my + Math.sin(b) * r * 0.3)} />);
    }
  }
  return (
    <g opacity={f(opacity)} strokeLinecap="round">
      <g stroke={ICE} strokeWidth={f(r * 0.22)} opacity={0.35}>{arms}</g>
      <g stroke="#ffffff" strokeWidth={f(Math.max(r * 0.08, 1))}>{arms}</g>
    </g>
  );
}

export const CrystalNovaVfx: VfxArt = ({ t, duration, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 150;
  const g = easeOut(span(k, 0, 0.45));
  const fade = 1 - span(k, 0.6, 1);
  const shards = [];
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hs(i, 1) * 0.15;
    const d = R * (0.25 + 0.65 * h(i, 2)) * g;
    const l = (18 + 26 * h(i, 3)) * (R / 150) * (0.4 + 0.6 * g);
    const sx = to.x + Math.cos(a) * d;
    const sy = to.y + Math.sin(a) * d;
    shards.push(
      <g key={i} transform={`translate(${f(sx)},${f(sy)}) rotate(${f((a * 180) / Math.PI + hs(i, 4) * 20)})`}>
        <polygon points={shard(l, l * 0.22)} fill="url(#cnova-shard)" stroke="#e8fbff" strokeWidth={0.8} />
      </g>,
    );
  }
  const motes = [];
  for (let i = 0; i < 26; i++) {
    const a = h(i, 7) * Math.PI * 2;
    const d = R * (0.2 + 1.0 * h(i, 8)) * easeOut(k);
    motes.push(<circle key={i} cx={f(to.x + Math.cos(a) * d)} cy={f(to.y + Math.sin(a) * d - k * 20 * h(i, 9))} r={f(1 + 2 * h(i, 10))} fill="#ffffff" opacity={f((1 - k) * 0.9)} />);
  }
  return (
    <g pointerEvents="none">
      <FrostDefs />
      <g opacity={f(fade)}>
        <circle cx={f(to.x)} cy={f(to.y)} r={f(R * Math.max(g, 0.05))} fill="url(#cnova-floor)" />
        <circle cx={f(to.x)} cy={f(to.y)} r={f(R * Math.max(g, 0.05))} fill="none" stroke={ICE} strokeWidth={1.5} strokeDasharray="3 6" opacity={0.7} />
        {shards}
      </g>
      <GlowRing cx={to.x} cy={to.y} r={R * easeOut(span(k, 0, 0.5)) + 2} color={ICE} width={7 * (1 - span(k, 0, 0.7)) + 0.5} opacity={1 - span(k, 0.35, 0.8)} />
      <GlowRing cx={to.x} cy={to.y} r={R * 0.6 * easeOut(span(k, 0.08, 0.5)) + 2} color={ICE_DEEP} width={3} opacity={(1 - span(k, 0.3, 0.7)) * span(k, 0.08, 0.12)} />
      <Flake x={to.x} y={to.y} r={R * 0.28 * (0.5 + 0.5 * g)} rot={k * 1.2} opacity={bump(span(k, 0, 0.7))} />
      {motes}
      <Sparks cx={to.x} cy={to.y} n={14} r0={R * 0.3} r1={R * 1.15} k={span(k, 0.05, 0.6)} color="#e8fbff" seed={5} />
    </g>
  );
};

export const FrostbiteVfx: VfxArt = ({ t, duration, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const cx = to.x;
  const base = to.y + 4;
  const blocks = [];
  const cols = 2;
  const rows = 3;
  const bw = 30;
  const bh = 30;
  const crack = span(k, 0.68, 0.82);
  const shatter = span(k, 0.82, 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const form = easeOut(span(k, i * 0.035, 0.18 + i * 0.035));
      const ox = (c - 0.5) * bw;
      const oy = -(r + 0.5) * bh;
      // fly in from outside, fly out when shattering
      const dirx = c === 0 ? -1 : 1;
      const inx = (1 - form) * dirx * (40 + 20 * h(i, 1));
      const iny = (1 - form) * -(30 + 30 * h(i, 2));
      const outx = shatter * dirx * (30 + 40 * h(i, 3));
      const outy = shatter * (-20 + 70 * h(i, 4)) + shatter * shatter * 40;
      const rot = (1 - form) * hs(i, 5) * 60 + shatter * hs(i, 6) * 90;
      const x = cx + ox + inx + outx;
      const y = base + oy + iny + outy;
      const op = form * (1 - shatter);
      if (op <= 0.001) continue;
      blocks.push(
        <g key={i} transform={`translate(${f(x)},${f(y)}) rotate(${f(rot)})`} opacity={f(op)}>
          <rect x={f(-bw / 2)} y={f(-bh / 2)} width={bw} height={bh} rx={3} fill="url(#fbite-ice)" stroke="#e8fbff" strokeWidth={1.2} />
          <path d={`M${f(-bw / 2 + 4)},${f(-bh / 2 + 4)} L${f(bw / 2 - 10)},${f(-bh / 2 + 4)}`} stroke="#ffffff" strokeWidth={2} strokeLinecap="round" opacity={0.8} />
          <path d={`M${f(-bw / 2 + 4)},${f(-bh / 2 + 4)} L${f(-bw / 2 + 4)},${f(bh / 2 - 12)}`} stroke="#ffffff" strokeWidth={1.2} opacity={0.6} />
        </g>,
      );
    }
  }
  const cracks =
    crack > 0 && shatter < 1 ? (
      <g opacity={f(1 - shatter)} stroke="#ffffff" strokeWidth={1.4} fill="none" strokeLinecap="round">
        {[0, 1, 2, 3].map((i) => {
          const sx = cx + hs(i, 30) * 12;
          const sy = base - 45 + hs(i, 31) * 20;
          const l = 40 * crack;
          const a = h(i, 32) * Math.PI * 2;
          return <path key={i} d={`M${f(sx)},${f(sy)} L${f(sx + Math.cos(a) * l * 0.5 + 4)},${f(sy + Math.sin(a) * l * 0.5)} L${f(sx + Math.cos(a + 0.4) * l)},${f(sy + Math.sin(a + 0.4) * l)}`} />;
        })}
      </g>
    ) : null;
  const hold = span(k, 0.15, 0.25) * (1 - shatter);
  return (
    <g pointerEvents="none">
      <FrostDefs />
      <ellipse cx={f(cx)} cy={f(base)} rx={f(44 * (0.5 + 0.5 * span(k, 0, 0.2)))} ry={12} fill={ICE} opacity={f(0.35 * (1 - shatter))} />
      <rect x={f(cx - bw - 4)} y={f(base - bh * 3 - 4)} width={f(bw * 2 + 8)} height={f(bh * 3 + 8)} rx={6} fill="none" stroke={ICE} strokeWidth={6} opacity={f(0.25 * hold)} />
      {blocks}
      {cracks}
      <Sparks cx={cx} cy={base - 45} n={16} r0={10} r1={90} k={shatter} color="#e8fbff" seed={41} width={2.5} />
      {[0, 1, 2, 3, 4].map((i) => {
        const p = span(k, 0.2 + i * 0.1, 0.4 + i * 0.1);
        if (p <= 0 || p >= 1) return null;
        return <path key={i} d={star(cx + hs(i, 50) * 30, base - 20 - h(i, 51) * 70, 6 * bump(p), 1.5 * bump(p), 4)} fill="#ffffff" />;
      })}
    </g>
  );
};

/** Chain frost impact burst at the target */
export const ChainFrostVfx: VfxArt = ({ t, duration, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? Math.min(radius, 120) : 60;
  const cy = to.y - 40;
  const shards = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + hs(i, 60) * 0.2;
    const d = R * easeOut(span(k, 0, 0.6)) * (0.6 + 0.4 * h(i, 61));
    shards.push(
      <polygon
        key={i}
        points={shard(14 + 10 * h(i, 62), 4)}
        fill="url(#cnova-shard)"
        transform={`translate(${f(to.x + Math.cos(a) * d)},${f(cy + Math.sin(a) * d)}) rotate(${f((a * 180) / Math.PI)})`}
        opacity={f(1 - span(k, 0.4, 1))}
      />,
    );
  }
  return (
    <g pointerEvents="none">
      <FrostDefs />
      <circle cx={f(to.x)} cy={f(cy)} r={f(28 * (1 - span(k, 0, 0.4)) + 2)} fill="url(#cfrost-orb)" opacity={f(1 - span(k, 0, 0.4))} />
      <GlowRing cx={to.x} cy={cy} r={R * easeOut(span(k, 0, 0.5)) + 4} color={ICE} width={5 * (1 - k) + 0.5} opacity={1 - span(k, 0.3, 0.9)} />
      {shards}
      <Flake x={to.x} y={cy} r={26} rot={k * 2} opacity={bump(span(k, 0, 0.8))} />
      <Sparks cx={to.x} cy={cy} n={12} r0={8} r1={R * 1.2} k={span(k, 0, 0.5)} color="#ffffff" seed={63} />
    </g>
  );
};

export const ChainFrostProjectile: ProjectileArt = ({ t }) => {
  const spin = t * 360;
  const mist = [];
  for (let i = 0; i < 8; i++) {
    const ph = (t * 2.5 + i / 8) % 1;
    mist.push(<circle key={i} cx={f(-6 - ph * 50)} cy={f(Math.sin((ph + i) * 6) * 6 * ph)} r={f(7 * (1 - ph) + 1)} fill="#bff0ff" opacity={f(0.5 * (1 - ph))} />);
  }
  const orbit = [];
  for (let i = 0; i < 4; i++) {
    const a = t * 7 + (i * Math.PI) / 2;
    orbit.push(<polygon key={i} points={shard(8, 2.5)} fill="#ffffff" transform={`translate(${f(Math.cos(a) * 17)},${f(Math.sin(a) * 9)}) rotate(${f((a * 180) / Math.PI + 90)})`} opacity={f(Math.sin(a) > 0 ? 1 : 0.55)} />);
  }
  return (
    <g>
      <FrostDefs />
      {mist}
      <circle r={20} fill={ICE} opacity={0.18} />
      <circle r={13} fill="url(#cfrost-orb)" stroke="#e8fbff" strokeWidth={1} />
      <g transform={`rotate(${f(spin)})`} fill="none" stroke="#ffffff" strokeWidth={1.6} strokeLinecap="round">
        <path d="M-9,0 A9,9 0 0 1 0,-9" />
        <path d="M9,0 A9,9 0 0 1 0,9" />
      </g>
      <g transform={`rotate(${f(-spin * 0.6)})`} fill="none" stroke={ICE} strokeWidth={1.2} opacity={0.8}>
        <path d="M-16,0 A16,16 0 0 1 0,-16" />
        <path d="M16,0 A16,16 0 0 1 0,16" />
      </g>
      {orbit}
      <circle cx={-3} cy={-4} r={3} fill="#ffffff" />
    </g>
  );
};
