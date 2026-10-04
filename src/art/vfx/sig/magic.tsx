// Signature VFX: silencer, lina, zeus, enigma, tinker.
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { VfxArt, ZoneArt } from '../../types.ts';
import { bump, clamp01, easeIn, easeOut, lerp } from '../../types.ts';
import { Glow, GlowPath, Ring, Sparks, TAU, boltPoints, dir, dist, envelope, f, pathOf, polar, prog, rnd, seg, srnd } from './fxkit.tsx';

const CHEST = 40;
const HAND = 46;

// ------------------------------------------------------------------ glaives_of_wisdom
const glaiveShape = (r: number): string => {
  const pts: string[] = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU;
    const tip = polar(0, 0, r, a);
    const c1 = polar(0, 0, r * 0.9, a + 0.9);
    const back = polar(0, 0, r * 0.3, a + 1.3);
    pts.push(`${i === 0 ? 'M' : 'L'}${f(back.x)} ${f(back.y)} Q${f(c1.x)} ${f(c1.y)} ${f(tip.x)} ${f(tip.y)}`);
  }
  return `${pts.join(' ')} Z`;
};

export const GlaivesOfWisdom: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const tgt: Vec = { x: to.x, y: to.y - CHEST };
  const d = dir(from, to, team);
  const self = dist(from, to) < 1;
  const start: Vec = self ? { x: tgt.x - d.x * 90, y: tgt.y - 20 } : { x: from.x + d.x * 20, y: from.y - HAND };
  const fly = easeIn(seg(k, 0, 0.3)) * 0.5 + seg(k, 0, 0.3) * 0.5;
  const hit = seg(k, 0.3, 1);
  const spin = t * 1800;
  const gx = lerp(start.x, tgt.x, fly);
  const gy = lerp(start.y, tgt.y, fly) - Math.sin(Math.PI * fly) * 25;
  const glyph = seg(k, 0.3, 1);
  const gEnv = envelope(glyph, 0.15, 0.4);
  const runeY = tgt.y - 55 - easeOut(glyph) * 20;
  return (
    <g>
      {hit <= 0 ? (
        <g>
          <path d={pathOf([start, { x: lerp(start.x, gx, 0.5), y: lerp(start.y, gy, 0.5) - 10 }, { x: gx, y: gy }])} fill="none" stroke="#b06bff" strokeWidth={4} strokeOpacity={0.35} strokeLinecap="round" />
          <Glow x={gx} y={gy} r={22} color="#a259ff" />
          <g transform={`translate(${f(gx)},${f(gy)}) rotate(${f(spin)})`}>
            <path d={glaiveShape(14)} fill="#d7b8ff" stroke="#7a2cff" strokeWidth={1.5} />
            <circle r={3} fill="#fff" />
          </g>
        </g>
      ) : null}
      {hit > 0 ? (
        <g>
          <Glow x={tgt.x} y={tgt.y} r={50} color="#9b4dff" opacity={1 - hit} core="#f2e6ff" />
          <Ring x={tgt.x} y={tgt.y} r={14 + easeOut(hit) * 50} color="#c48bff" width={5 * (1 - hit)} opacity={1 - hit} />
          <g transform={`translate(${f(tgt.x)},${f(tgt.y)}) rotate(${f(spin * 0.3)}) scale(${f(1 + hit)})`} opacity={f(1 - easeOut(seg(hit, 0, 0.4)))}>
            <path d={glaiveShape(16)} fill="#e8d6ff" stroke="#7a2cff" strokeWidth={1.5} />
          </g>
          <Sparks x={tgt.x} y={tgt.y} n={12} seed={61} k={seg(hit, 0, 0.6)} reach={60} color="#d6b0ff" width={2.5} />
          {/* int glyph: glowing rune of the mind */}
          <g transform={`translate(${f(tgt.x)},${f(runeY)}) scale(1.4)`} opacity={f(gEnv)}>
            <circle r={16} fill="#6a1fd6" opacity={0.25} />
            <circle r={13} fill="none" stroke="#c48bff" strokeWidth={2} />
            <path d="M0 -10 L9 5 L-9 5 Z" fill="none" stroke="#f0e2ff" strokeWidth={2} strokeLinejoin="round" />
            <circle cy={1} r={2.5} fill="#ffffff" />
            <text y={30} textAnchor="middle" fontSize={13} fontWeight={800} fontFamily="sans-serif" fill="#e2c8ff" stroke="#2a0a50" strokeWidth={2.5} paintOrder="stroke">
              INT
            </text>
          </g>
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ laguna_blade
export const LagunaBlade: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = dir(from, to, team);
  const a: Vec = { x: from.x + d.x * 18, y: from.y - HAND };
  const b: Vec = dist(from, to) < 1 ? { x: a.x + d.x * 300, y: a.y } : { x: to.x, y: to.y - CHEST };
  const charge = seg(k, 0, 0.18);
  const beam = seg(k, 0.12, 0.6);
  const beamEnv = beam > 0 && beam < 1 ? Math.min(1, beam * 8) * (1 - easeIn(beam)) : 0;
  const L = dist(a, b);
  const segs = Math.max(6, Math.round(L / 22));
  const seed = Math.floor(t / 0.035);
  const out: ReactNode[] = [];
  if (beamEnv > 0) {
    out.push(<GlowPath key="m" d={pathOf(boltPoints(a, b, segs, 26, seed))} color="#ff4a1a" core="#fff3c0" width={10 * beamEnv + 2} opacity={beamEnv} layers={3} />);
    out.push(<GlowPath key="s1" d={pathOf(boltPoints(a, b, segs, 40, seed + 77))} color="#ff9a2a" core="#ffffff" width={3 * beamEnv + 1} opacity={beamEnv * 0.8} layers={1} />);
    out.push(<GlowPath key="s2" d={pathOf(boltPoints(a, b, Math.ceil(segs * 0.7), 50, seed + 151))} color="#ff3a10" core="#ffd080" width={2 * beamEnv + 1} opacity={beamEnv * 0.6} layers={1} />);
  }
  const flash = bump(seg(k, 0.12, 0.3));
  const impact = seg(k, 0.14, 1);
  const pillar = envelope(impact, 0.05, 0.6);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={600} fill="#ff8a2a" opacity={f(flash * 0.22)} />
      <Glow x={a.x} y={a.y} r={20 + charge * 30} color="#ff6a1a" opacity={charge * (1 - seg(k, 0.4, 0.7))} core="#fff6d0" />
      {out}
      {impact > 0 && impact < 1 ? (
        <g>
          <ellipse cx={f(b.x)} cy={f(to.y)} rx={f(50 * easeOut(impact))} ry={f(14 * easeOut(impact))} fill="#ff5a1a" opacity={f(pillar * 0.4)} />
          <rect x={f(b.x - 16 * pillar)} y={f(b.y - 120)} width={f(32 * pillar)} height={f(120 + CHEST)} fill="#ff7a2a" opacity={f(pillar * 0.35)} rx={10} />
          <Glow x={b.x} y={b.y} r={90 * pillar + 10} color="#ff5a1a" opacity={pillar} core="#fffbe0" />
          <Ring x={b.x} y={b.y} r={20 + easeOut(impact) * 90} color="#ffb04a" width={7 * (1 - impact)} opacity={1 - impact} />
          <Sparks x={b.x} y={b.y} n={22} seed={71} k={seg(impact, 0, 0.6)} reach={130} color="#ffcf6a" width={3} gravity={40} />
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ thundergods_wrath
export const ThundergodsWrath: VfxArt = ({ t, duration, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const targets: { p: Vec; d: number }[] = [{ p: to, d: 0 }];
  if (radius > 0) {
    const extra = Math.min(5, 2 + Math.floor(radius / 80));
    for (let i = 0; i < extra; i++) {
      const a = rnd(i, 81) * TAU;
      const r = radius * (0.35 + rnd(i, 82) * 0.6);
      targets.push({ p: { x: to.x + Math.cos(a) * r, y: to.y + Math.sin(a) * r * 0.6 }, d: 0.05 + i * 0.06 });
    }
  }
  const sky = bump(seg(k, 0, 0.35));
  const strikes: ReactNode[] = [];
  targets.forEach(({ p, d }, i) => {
    const sk = seg(k, d, d + 0.45);
    if (sk <= 0 || sk >= 1) return;
    const env = sk < 0.08 ? sk / 0.08 : 1 - easeIn(seg(sk, 0.08, 1));
    const top: Vec = { x: p.x + srnd(i, 83) * 60, y: -20 };
    const bot: Vec = { x: p.x, y: p.y - 30 };
    const seed = Math.floor(t / 0.05) * 7 + i * 31;
    const pts = boltPoints(top, bot, 14, 40, seed);
    const branchFrom = pts[5]!;
    const branchTo: Vec = { x: branchFrom.x + srnd(seed, 84) * 90, y: branchFrom.y + 80 + rnd(seed, 85) * 60 };
    const imp = seg(sk, 0.05, 1);
    strikes.push(
      <g key={i}>
        <GlowPath d={pathOf(pts)} color="#7ab8ff" core="#ffffff" width={8 * env + 1} opacity={env} layers={3} />
        <GlowPath d={pathOf(boltPoints(branchFrom, branchTo, 6, 18, seed + 3))} color="#9ccaff" core="#ffffff" width={3 * env} opacity={env * 0.8} layers={1} />
        <ellipse cx={f(p.x)} cy={f(p.y)} rx={f(18 + easeOut(imp) * 60)} ry={f(6 + easeOut(imp) * 18)} fill="none" stroke="#bfe0ff" strokeWidth={f(4 * (1 - imp))} opacity={f(1 - imp)} />
        <Glow x={bot.x} y={bot.y} r={70 * env + 10} color="#5aa8ff" opacity={env} core="#ffffff" />
        <Sparks x={bot.x} y={bot.y + 20} n={14} seed={86 + i} k={imp} reach={80} color="#d8ecff" width={2.5} arc={Math.PI} heading={-Math.PI / 2} gravity={50} />
      </g>,
    );
  });
  return (
    <g>
      <defs>
        <linearGradient id="tgw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfe6ff" stopOpacity={0.9} />
          <stop offset="0.6" stopColor="#5a8aff" stopOpacity={0.15} />
          <stop offset="1" stopColor="#5a8aff" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1000} height={600} fill="url(#tgw-sky)" opacity={f(sky * 0.5)} />
      <rect x={0} y={0} width={1000} height={600} fill="#ffffff" opacity={f(bump(seg(k, 0, 0.12)) * 0.25)} />
      {strikes}
    </g>
  );
};

// ------------------------------------------------------------------ black_hole (cast flash + zone)
export const BlackHoleCast: VfxArt = ({ t, duration, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 150;
  const cx = to.x;
  const cy = to.y - 30;
  const rings: ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const p = seg(k, i * 0.1, 0.5 + i * 0.1);
    if (p <= 0 || p >= 1) continue;
    rings.push(<Ring key={i} x={cx} y={cy} r={R * 1.3 * (1 - easeIn(p))} color={i % 2 ? '#b07bff' : '#5a1aa8'} width={4 + 6 * p} opacity={bump(p)} />);
  }
  const core = easeOut(seg(k, 0.3, 0.7));
  return (
    <g>
      <rect x={0} y={0} width={1000} height={600} fill="#1a0030" opacity={f(bump(k) * 0.3)} />
      {rings}
      <Glow x={cx} y={cy} r={60 * core} color="#9b4dff" opacity={1 - seg(k, 0.7, 1)} />
      <circle cx={f(cx)} cy={f(cy)} r={f(28 * core)} fill="#05000c" opacity={f(1 - seg(k, 0.8, 1))} />
    </g>
  );
};

export const BlackHoleZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const R = radius > 0 ? radius : 150;
  const life = duration > 0 ? clamp01(t / duration) : 0;
  const env = Math.min(1, t / 0.3) * (duration > 0 ? clamp01((duration - t) / 0.4) : 1);
  if (env <= 0) return null;
  const cy = y - 30;
  const sq = 0.55; // ground-plane squash
  const arms: ReactNode[] = [];
  const ARMS = 4;
  const PER = 9;
  for (let a = 0; a < ARMS; a++) {
    // continuous spiral arm curve
    const pts: Vec[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const r = R * (0.12 + 0.95 * u);
      const ang = (a / ARMS) * TAU + u * 3.4 - t * 2.6;
      pts.push({ x: x + Math.cos(ang) * r, y: cy + Math.sin(ang) * r * sq });
    }
    arms.push(<path key={`a${a}`} d={pathOf(pts)} fill="none" stroke={a % 2 ? '#7a3cff' : '#c08bff'} strokeWidth={10} strokeOpacity={0.12} strokeLinecap="round" />);
    arms.push(<path key={`b${a}`} d={pathOf(pts)} fill="none" stroke={a % 2 ? '#a070ff' : '#e0c4ff'} strokeWidth={2.5} strokeOpacity={0.5} strokeLinecap="round" />);
    // particles drifting inward along the arm
    for (let i = 0; i < PER; i++) {
      const id = a * PER + i;
      const u = 1 - ((rnd(id, 91) + t * (0.35 + rnd(id, 92) * 0.25)) % 1);
      const r = R * (0.1 + 0.95 * u);
      const ang = (a / ARMS) * TAU + u * 3.4 - t * 2.6 + srnd(id, 93) * 0.25;
      const px = x + Math.cos(ang) * r;
      const py = cy + Math.sin(ang) * r * sq;
      arms.push(<circle key={`p${id}`} cx={f(px)} cy={f(py)} r={f(1.5 + u * 2.5)} fill={id % 3 ? '#e6d4ff' : '#9b6bff'} opacity={f(Math.min(1, u * 4) * 0.9)} />);
    }
  }
  // pulled-in dust streaks from the outer edge
  const dust: ReactNode[] = [];
  for (let i = 0; i < 18; i++) {
    const u = 1 - ((rnd(i, 95) + t * 0.6) % 1);
    const ang = rnd(i, 96) * TAU - t * 0.8 - (1 - u) * 1.5;
    const r0 = R * (0.2 + u * 1.05);
    const r1 = r0 + 14 * u;
    const p0 = { x: x + Math.cos(ang) * r0, y: cy + Math.sin(ang) * r0 * sq };
    const p1 = { x: x + Math.cos(ang + 0.12) * r1, y: cy + Math.sin(ang + 0.12) * r1 * sq };
    dust.push(<line key={i} x1={f(p0.x)} y1={f(p0.y)} x2={f(p1.x)} y2={f(p1.y)} stroke="#c9b0ff" strokeWidth={1.5} strokeOpacity={f(u * 0.7)} strokeLinecap="round" />);
  }
  const pulse = 1 + Math.sin(t * 9) * 0.06;
  const coreR = R * 0.2 * pulse;
  return (
    <g opacity={f(env)}>
      <defs>
        <radialGradient id="bh-disk">
          <stop offset="0" stopColor="#000000" stopOpacity={1} />
          <stop offset="0.25" stopColor="#14002a" stopOpacity={0.9} />
          <stop offset="0.6" stopColor="#3a0a78" stopOpacity={0.45} />
          <stop offset="1" stopColor="#2a0060" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={f(x)} cy={f(cy)} rx={f(R * 1.1)} ry={f(R * 1.1 * sq)} fill="url(#bh-disk)" />
      <ellipse cx={f(x)} cy={f(cy)} rx={f(R)} ry={f(R * sq)} fill="none" stroke="#8a4dff" strokeWidth={2} strokeOpacity={0.45} strokeDasharray="14 10" strokeDashoffset={f(-t * 60)} />
      {dust}
      {arms}
      {/* event horizon */}
      <ellipse cx={f(x)} cy={f(cy)} rx={f(coreR * 1.7)} ry={f(coreR * 1.7 * sq)} fill="none" stroke="#b07bff" strokeWidth={6} strokeOpacity={0.25} />
      <circle cx={f(x)} cy={f(cy)} r={f(coreR * 1.25)} fill="none" stroke="#e8d0ff" strokeWidth={3} strokeOpacity={f(0.6 + 0.3 * Math.sin(t * 13))} />
      <circle cx={f(x)} cy={f(cy)} r={f(coreR * 1.25)} fill="none" stroke="#9b4dff" strokeWidth={9} strokeOpacity={0.3} />
      <circle cx={f(x)} cy={f(cy)} r={f(coreR)} fill="#020006" />
      <circle cx={f(x - coreR * 0.3)} cy={f(cy - coreR * 0.3)} r={f(coreR * 0.25)} fill="#2a0a50" opacity={0.6} />
      <rect x={0} y={0} width={1000} height={600} fill="#12001f" opacity={f(0.12 * (1 - life * 0.3))} />
    </g>
  );
};

// ------------------------------------------------------------------ laser
export const Laser: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = dir(from, to, team);
  const a: Vec = { x: from.x + d.x * 22, y: from.y - HAND };
  const b: Vec = dist(from, to) < 1 ? { x: a.x + d.x * 300, y: a.y } : { x: to.x, y: to.y - CHEST };
  const grow = easeOut(seg(k, 0, 0.12));
  const tip: Vec = { x: lerp(a.x, b.x, grow), y: lerp(a.y, b.y, grow) };
  const env = envelope(k, 0.02, 0.3);
  const flick = 0.75 + 0.25 * Math.sin(t * 90) * Math.sin(t * 37);
  const w = 4.5 * env * flick + 1;
  const line = pathOf([a, tip]);
  const hot = grow >= 1 ? env : 0;
  return (
    <g>
      <GlowPath d={line} color="#ff4a1a" core="#fff4d0" width={w} opacity={env} layers={3} />
      <Glow x={a.x} y={a.y} r={18 * env} color="#ff8a2a" core="#ffffff" />
      {hot > 0 ? (
        <g>
          <Glow x={b.x} y={b.y} r={34 * hot * flick} color="#ff5a1a" core="#ffffff" />
          <Ring x={b.x} y={b.y} r={10 + ((t * 4) % 1) * 22} color="#ffb04a" width={2} opacity={hot * (1 - ((t * 4) % 1))} />
          <Sparks x={b.x} y={b.y} n={9} seed={Math.floor(t / 0.08)} k={(t % 0.08) / 0.08} reach={50} color="#ffd070" width={2} arc={Math.PI * 1.4} heading={Math.atan2(-d.y, -d.x)} gravity={25} />
        </g>
      ) : null}
    </g>
  );
};
