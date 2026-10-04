// Arcane / misc shop spells: Global Silence, Arc Lightning, Purification, Time Lock, Rot (zone).
import type { VfxArt, ZoneArt } from '../../types.ts';
import { bump, clamp01, easeOut } from '../../types.ts';
import { GlowPath, GlowRing, GroundRing, Sparks, f, h, hs, jagged, prog, span, star } from './fxkit.tsx';

export const GlobalSilenceVfx: VfxArt = ({ t, duration, from, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const rings = [];
  for (let i = 0; i < 4; i++) {
    const p = span(k, i * 0.1, 0.55 + i * 0.1);
    if (p <= 0 || p >= 1) continue;
    rings.push(<GlowRing key={i} cx={from.x} cy={from.y - 40} r={20 + 1180 * easeOut(p)} color="#a35cff" core="#f0e0ff" width={10 * (1 - p) + 1} opacity={(1 - p) * (i === 0 ? 1 : 0.6)} />);
  }
  const tint = bump(span(k, 0.05, 0.9)) * 0.14;
  const gp = span(k, 0.15, 0.35);
  const ga = Math.min(gp, 1 - span(k, 0.7, 1));
  const gsc = 0.5 + 0.5 * easeOut(gp);
  const R = radius > 0 ? radius : 220;
  const glyph = (x: number, y: number, s: number, key: string, o: number) => (
    <g key={key} transform={`translate(${f(x)},${f(y)}) scale(${f(s)})`} opacity={f(o)}>
      <path d="M-26,-16 Q-26,-30 -10,-30 L10,-30 Q26,-30 26,-16 L26,0 Q26,14 10,14 L-2,14 L-14,26 L-12,14 L-10,14 Q-26,14 -26,0 Z" fill="#2a0f4a" opacity={0.75} stroke="#c79bff" strokeWidth={2.5} />
      <text x={0} y={-2} textAnchor="middle" fontFamily="'Trebuchet MS', sans-serif" fontWeight={800} fontStyle="italic" fontSize={17} fill="#f0e0ff">
        shh
      </text>
      <path d="M-30,-34 L30,18" stroke="#ff4f8a" strokeWidth={4} strokeLinecap="round" opacity={0.9} />
    </g>
  );
  const small = [];
  for (let i = 0; i < 5; i++) {
    const o = Math.min(span(k, 0.25 + i * 0.05, 0.4 + i * 0.05), 1 - span(k, 0.7, 1));
    if (o <= 0) continue;
    small.push(glyph(to.x + hs(i, 1) * R * 0.8, to.y - 60 + hs(i, 2) * R * 0.45 - k * 10, 0.55, `s${i}`, o * 0.85));
  }
  return (
    <g pointerEvents="none">
      <rect x={0} y={0} width={1000} height={600} fill="#5a1aa0" opacity={f(tint)} />
      {rings}
      <path d={star(from.x, from.y - 50, 28 * bump(span(k, 0, 0.3)), 6, 4, k)} fill="#f0e0ff" opacity={f(bump(span(k, 0, 0.3)))} />
      {small}
      {ga > 0 && glyph(to.x, to.y - 130 - 10 * k, gsc * 1.3, 'main', ga)}
    </g>
  );
};

export const ArcLightningVfx: VfxArt = ({ t, duration, from, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const seed = Math.floor(t / 0.05);
  const strike = span(k, 0, 0.12);
  const fade = 1 - span(k, 0.35, 1);
  const ax = from.x;
  const ay = from.y - 50;
  const bx = ax + (to.x - ax) * strike;
  const by = ay + (to.y - 40 - ay) * strike;
  const len = Math.hypot(bx - ax, by - ay);
  const segs = Math.max(4, Math.round(len / 22));
  const main = jagged(ax, ay, bx, by, segs, 14, seed);
  const forks = [];
  for (let i = 0; i < 4; i++) {
    const m = 0.25 + 0.6 * h(i, seed + 3);
    const sx = ax + (bx - ax) * m;
    const sy = ay + (by - ay) * m;
    const ang = Math.atan2(by - ay, bx - ax) + hs(i, seed + 4) * 1.1;
    const fl = 25 + 35 * h(i, seed + 5);
    forks.push(<GlowPath key={i} d={jagged(sx, sy, sx + Math.cos(ang) * fl, sy + Math.sin(ang) * fl, 4, 6, seed + 10 + i)} color="#5cc8ff" width={1.4} opacity={fade * 0.8} />);
  }
  return (
    <g pointerEvents="none">
      {len > 1 && <GlowPath d={main} color="#4aa8ff" core="#ffffff" width={3.5} opacity={fade} />}
      {len > 1 && <GlowPath d={jagged(ax, ay, bx, by, segs, 20, seed + 99)} color="#7ad8ff" width={1.2} opacity={fade * 0.6} />}
      {forks}
      <circle cx={f(ax)} cy={f(ay)} r={f(10 * fade)} fill="#bfe8ff" opacity={f(fade * 0.7)} />
      {strike >= 1 && (
        <g>
          <circle cx={f(to.x)} cy={f(to.y - 40)} r={f(14 + 8 * Math.sin(t * 60))} fill="#bfe8ff" opacity={f(fade * 0.55)} />
          <circle cx={f(to.x)} cy={f(to.y - 40)} r={f(6)} fill="#ffffff" opacity={f(fade)} />
          <Sparks cx={to.x} cy={to.y - 40} n={12} r0={6} r1={60} k={span(k, 0.12, 0.6)} color="#bfe8ff" seed={seed % 7} />
          <GroundRing cx={to.x} cy={to.y} r={18 + 30 * span(k, 0.12, 0.6)} color="#4aa8ff" width={2} opacity={fade} />
        </g>
      )}
    </g>
  );
};

export const PurificationVfx: VfxArt = ({ t, duration, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 110;
  const drop = easeOut(span(k, 0, 0.12));
  const beam = Math.min(span(k, 0, 0.08), 1 - span(k, 0.45, 0.85));
  const bw = 34 * (1 - 0.6 * span(k, 0.2, 0.85)) + 8 * Math.sin(t * 40) * (1 - k);
  const topY = Math.min(to.y - 500, -20);
  const footY = topY + (to.y - topY) * drop;
  const ring = span(k, 0.1, 0.6);
  const motes = [];
  for (let i = 0; i < 16; i++) {
    const p = span(k, 0.1 + h(i, 1) * 0.3, 0.5 + h(i, 1) * 0.4);
    if (p <= 0 || p >= 1) continue;
    const x = to.x + hs(i, 2) * 40;
    const y = to.y - p * (90 + 60 * h(i, 3));
    motes.push(<path key={i} d={star(x, y, 5 * bump(p), 1.5 * bump(p), 4)} fill="#fff6c8" />);
  }
  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id="purif-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffd34a" stopOpacity="0" />
          <stop offset="0.3" stopColor="#ffe48a" stopOpacity="0.6" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="0.7" stopColor="#ffe48a" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffd34a" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="purif-floor" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#ffe48a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffd34a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {beam > 0 && (
        <g opacity={f(beam)}>
          <rect x={f(to.x - bw * 2)} y={f(topY)} width={f(bw * 4)} height={f(Math.max(footY - topY, 0))} fill="url(#purif-beam)" opacity={0.35} />
          <rect x={f(to.x - bw / 2)} y={f(topY)} width={f(bw)} height={f(Math.max(footY - topY, 0))} fill="url(#purif-beam)" />
          <ellipse cx={f(to.x)} cy={f(footY)} rx={f(bw * 1.8)} ry={f(bw * 0.6)} fill="url(#purif-floor)" />
        </g>
      )}
      <circle cx={f(to.x)} cy={f(to.y - 40)} r={f(50 * bump(span(k, 0.08, 0.5)))} fill="url(#purif-floor)" opacity={0.8} />
      <GlowRing cx={to.x} cy={to.y} r={R * easeOut(ring) + 4} color="#ffcf3a" core="#ffffff" width={6 * (1 - ring) + 0.5} opacity={ring > 0 ? 1 - ring : 0} />
      <circle cx={f(to.x)} cy={f(to.y)} r={f(R * easeOut(ring) + 4)} fill="#ffe48a" opacity={f(ring > 0 ? 0.15 * (1 - ring) : 0)} />
      <Sparks cx={to.x} cy={to.y} n={16} r0={R * 0.2} r1={R} k={span(k, 0.1, 0.5)} color="#fff6c8" seed={31} />
      {motes}
      <g opacity={f(bump(span(k, 0.1, 0.7)))} stroke="#ffffff" strokeWidth={5} strokeLinecap="round">
        <line x1={f(to.x)} y1={f(to.y - 108)} x2={f(to.x)} y2={f(to.y - 90)} />
        <line x1={f(to.x - 9)} y1={f(to.y - 99)} x2={f(to.x + 9)} y2={f(to.y - 99)} />
      </g>
    </g>
  );
};

export const TimeLockVfx: VfxArt = ({ t, duration, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const a = Math.min(span(k, 0, 0.12), 1 - span(k, 0.7, 1));
  const cx = to.x;
  const cy = to.y - 40;
  const R = 46 * (0.7 + 0.3 * easeOut(span(k, 0, 0.15)));
  // hand spins backwards fast, then freezes with a jitter
  const spinP = span(k, 0, 0.4);
  const handA = -90 - 720 * easeOut(spinP) + (spinP >= 1 ? Math.sin(t * 70) * 2 : 0);
  const minA = -90 - 60 * easeOut(spinP);
  const ticks = [];
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * Math.PI * 2;
    const r0 = R * (i % 3 === 0 ? 0.74 : 0.82);
    ticks.push(<line key={i} x1={f(cx + Math.cos(an) * r0)} y1={f(cy + Math.sin(an) * r0)} x2={f(cx + Math.cos(an) * R * 0.92)} y2={f(cy + Math.sin(an) * R * 0.92)} stroke="#ffe7a0" strokeWidth={i % 3 === 0 ? 3 : 1.5} strokeLinecap="round" />);
  }
  const gear = (gx: number, gy: number, gr: number, rot: number) => (
    <g transform={`rotate(${f(rot)} ${f(gx)} ${f(gy)})`}>
      <path d={star(gx, gy, gr, gr * 0.72, 8)} fill="#b38a2a" stroke="#ffe7a0" strokeWidth={1} />
      <circle cx={f(gx)} cy={f(gy)} r={f(gr * 0.3)} fill="#3a2a0a" />
    </g>
  );
  const frozen = span(k, 0.4, 0.5);
  return (
    <g pointerEvents="none" opacity={f(a)}>
      <circle cx={f(cx)} cy={f(cy)} r={f(R * 1.25)} fill="#ffd34a" opacity={0.1} />
      {gear(cx - R * 0.95, cy + R * 0.7, 12, -t * 200 * (1 - frozen))}
      {gear(cx + R * 0.95, cy - R * 0.75, 9, t * 260 * (1 - frozen))}
      <circle cx={f(cx)} cy={f(cy)} r={f(R)} fill="#2a1e05" opacity={0.35} />
      <GlowRing cx={cx} cy={cy} r={R} color="#ffc93a" core="#fff4c8" width={3} />
      <circle cx={f(cx)} cy={f(cy)} r={f(R * 0.62)} fill="none" stroke="#ffc93a" strokeWidth={1} strokeDasharray="2 4" opacity={0.7} />
      {ticks}
      <path d={`M${f(cx + R * 1.12)},${f(cy - 8)} A${f(R * 1.12)},${f(R * 1.12)} 0 0 0 ${f(cx + 8)},${f(cy - R * 1.12)}`} fill="none" stroke="#fff4c8" strokeWidth={2} opacity={f(1 - frozen)} />
      <path d={`M${f(cx + 8)},${f(cy - R * 1.12)} l6,-5 l1,9 Z`} fill="#fff4c8" opacity={f(1 - frozen)} />
      <line x1={f(cx)} y1={f(cy)} x2={f(cx + Math.cos((minA * Math.PI) / 180) * R * 0.5)} y2={f(cy + Math.sin((minA * Math.PI) / 180) * R * 0.5)} stroke="#fff4c8" strokeWidth={4} strokeLinecap="round" />
      <line x1={f(cx)} y1={f(cy)} x2={f(cx + Math.cos((handA * Math.PI) / 180) * R * 0.8)} y2={f(cy + Math.sin((handA * Math.PI) / 180) * R * 0.8)} stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={f(cx)} cy={f(cy)} r={3.5} fill="#ffc93a" />
      {frozen > 0 && <GlowRing cx={cx} cy={cy} r={R * (1 + 0.5 * frozen)} color="#ffe7a0" width={3 * (1 - frozen) + 0.3} opacity={1 - frozen} />}
    </g>
  );
};

export const RotZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const R = radius > 0 ? radius : 130;
  const a = Math.min(clamp01(t / 0.25), duration > 0 ? clamp01((duration - t) / 0.3) + (duration < 0.3 ? 1 : 0) : 1);
  const op = clamp01(a);
  const puffs = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const an = (i / n) * Math.PI * 2 + t * 0.4 + hs(i, 1) * 0.2;
    const d = R * (0.72 + 0.12 * Math.sin(t * 2.2 + i * 1.7));
    const r = R * (0.24 + 0.08 * h(i, 2)) * (1 + 0.1 * Math.sin(t * 3 + i));
    puffs.push(<circle key={i} cx={f(x + Math.cos(an) * d)} cy={f(y + Math.sin(an) * d)} r={f(r)} fill={i % 2 ? '#5fae1e' : '#7fd02a'} opacity={0.22} />);
  }
  const bubbles = [];
  for (let i = 0; i < 18; i++) {
    const period = 0.9 + h(i, 3) * 0.9;
    const ph = ((t + h(i, 4) * period) % period) / period;
    const an = h(i, 5) * Math.PI * 2;
    const d = R * Math.sqrt(h(i, 6)) * 0.85;
    const bx = x + Math.cos(an) * d;
    const by = y + Math.sin(an) * d - ph * 30;
    const br = (2.5 + 5 * h(i, 7)) * (0.4 + 0.6 * ph);
    const pop = ph > 0.88;
    bubbles.push(
      pop ? (
        <circle key={i} cx={f(bx)} cy={f(by)} r={f(br * 1.6)} fill="none" stroke="#c8ff6a" strokeWidth={1} opacity={f((1 - ph) * 6)} />
      ) : (
        <g key={i}>
          <circle cx={f(bx)} cy={f(by)} r={f(br)} fill="#9be83a" stroke="#d6ff8a" strokeWidth={0.8} opacity={0.75} />
          <circle cx={f(bx - br * 0.35)} cy={f(by - br * 0.35)} r={f(br * 0.3)} fill="#f0ffd0" opacity={0.8} />
        </g>
      ),
    );
  }
  const fumes = [];
  for (let i = 0; i < 6; i++) {
    const ph = (t * 0.6 + i / 6) % 1;
    const fx = x + hs(i, 8) * R * 0.6 + Math.sin(t * 2 + i) * 8;
    const fy = y - ph * (R * 0.6 + 40);
    fumes.push(<circle key={i} cx={f(fx)} cy={f(fy)} r={f(R * 0.18 * (0.6 + ph))} fill="#6fbf2a" opacity={f(0.2 * bump(ph))} />);
  }
  return (
    <g pointerEvents="none" opacity={f(op)}>
      <defs>
        <radialGradient id="rot-cloud" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#a8f04a" stopOpacity="0.5" />
          <stop offset="0.65" stopColor="#5fae1e" stopOpacity="0.32" />
          <stop offset="1" stopColor="#2f6a0a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={f(x)} cy={f(y)} r={f(R * 1.05)} fill="url(#rot-cloud)" />
      {puffs}
      <circle cx={f(x)} cy={f(y)} r={f(R)} fill="none" stroke="#9be83a" strokeWidth={1.5} strokeDasharray="10 8" strokeDashoffset={f(-t * 25)} opacity={0.5} />
      {bubbles}
      {fumes}
    </g>
  );
};

/** Rot activation: a toxic burst puffing out of the caster. */
export const RotVfx: VfxArt = ({ t, duration, from, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 130;
  const p = easeOut(span(k, 0, 0.5));
  const puffs = [];
  for (let i = 0; i < 10; i++) {
    const an = (i / 10) * Math.PI * 2 + hs(i, 70) * 0.3;
    const d = R * 0.8 * p;
    puffs.push(<circle key={i} cx={f(from.x + Math.cos(an) * d)} cy={f(from.y - 20 + Math.sin(an) * d * 0.8)} r={f(10 + 14 * p)} fill="#7fd02a" opacity={f(0.35 * (1 - k))} />);
  }
  return (
    <g pointerEvents="none">
      {puffs}
      <GroundRing cx={from.x} cy={from.y} r={R * p + 4} color="#9be83a" width={3 * (1 - k) + 0.5} opacity={1 - k} squash={1} />
    </g>
  );
};
