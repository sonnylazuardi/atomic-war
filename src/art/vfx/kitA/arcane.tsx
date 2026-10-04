// Kit-A VFX: Silencer (Arcane Curse, Last Word), Lina (Fiery Soul). Pure t-driven, ARENA coordinates.
import type { ReactNode } from 'react';
import type { VfxArt } from '../../types.ts';
import { bump, easeOut } from '../../types.ts';
import { Glow, GlowPath, Ring, Sparks, TAU, boltPoints, dist, envelope, f, pathOf, polar, prog, rnd, seg, srnd } from '../sig/fxkit.tsx';

const CHEST = 40;

// ------------------------------------------------------------------ arcane_curse (silencer Q)
// a purple rune circle seals the ground, curse motes cling to everyone inside
export const ArcaneCurseVfx: VfxArt = ({ t, duration, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 160;
  const sq = 0.5;
  const draw = easeOut(seg(k, 0, 0.35));
  const env = envelope(k, 0.05, 0.35);
  const rot = k * 60;
  const star: string[] = [];
  for (let i = 0; i <= 5; i++) {
    const a = ((i * 2) / 5) * TAU - Math.PI / 2 + (rot * Math.PI) / 180;
    star.push(`${i === 0 ? 'M' : 'L'}${f(to.x + Math.cos(a) * R * 0.78)} ${f(to.y + Math.sin(a) * R * 0.78 * sq)}`);
  }
  const ticks: ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU - (rot * Math.PI) / 90;
    const p0 = polar(to.x, to.y, R * 0.86, a);
    const p1 = polar(to.x, to.y, R * 0.96, a);
    ticks.push(<line key={i} x1={f(p0.x)} y1={f(to.y + (p0.y - to.y) * sq)} x2={f(p1.x)} y2={f(to.y + (p1.y - to.y) * sq)} stroke="#d8b8ff" strokeWidth={2} strokeOpacity={f(env * draw)} />);
  }
  const motes: ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    const ph = (k * 1.3 + rnd(i, 1701)) % 1;
    const a = rnd(i, 1702) * TAU;
    const d = R * Math.sqrt(rnd(i, 1703)) * 0.85;
    const mx = to.x + Math.cos(a) * d + Math.sin(ph * 6 + i) * 4;
    const my = to.y + Math.sin(a) * d * sq - ph * 55;
    motes.push(<circle key={i} cx={f(mx)} cy={f(my)} r={f(2 + rnd(i, 1704) * 2.5)} fill={i % 3 ? '#a06bff' : '#e8d8ff'} opacity={f(env * bump(ph))} />);
  }
  const circ = 2 * Math.PI * R;
  return (
    <g pointerEvents="none">
      <ellipse cx={f(to.x)} cy={f(to.y)} rx={f(R * draw)} ry={f(R * sq * draw)} fill="#5a2aa8" opacity={f(0.16 * env)} />
      <ellipse cx={f(to.x)} cy={f(to.y)} rx={f(R)} ry={f(R * sq)} fill="none" stroke="#a06bff" strokeWidth={3} strokeOpacity={f(env)} strokeDasharray={`${f(circ * draw)} ${f(circ)}`} />
      <ellipse cx={f(to.x)} cy={f(to.y)} rx={f(R * 0.7)} ry={f(R * 0.7 * sq)} fill="none" stroke="#c9a0ff" strokeWidth={1.5} strokeOpacity={f(env * 0.8)} strokeDasharray="8 6" strokeDashoffset={f(k * 80)} />
      {ticks}
      <path d={star.join(' ')} fill="none" stroke="#c9a0ff" strokeWidth={1.8} strokeOpacity={f(env * 0.7 * draw)} strokeLinejoin="round" />
      <Glow x={to.x} y={to.y - 10} r={50} color="#a06bff" opacity={bump(seg(k, 0, 0.5)) * 0.8} core="#f4ecff" />
      {motes}
    </g>
  );
};

// ------------------------------------------------------------------ last_word (silencer E)
// a violet bolt from Silencer, then a mouth-seal rune locks over the victim's head
export const LastWordVfx: VfxArt = ({ t, duration, from, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const self = dist(from, to) < 1;
  const a = { x: from.x, y: from.y - 50 };
  const b = { x: to.x, y: to.y - CHEST };
  const bolt = seg(k, 0, 0.25);
  const boltFade = 1 - seg(k, 0.15, 0.4);
  const hx = to.x;
  const hy = to.y - 95;
  const seal = seg(k, 0.15, 1);
  const s = 2.2 - 0.8 * easeOut(seg(seal, 0, 0.3));
  const sealEnv = envelope(seal, 0.1, 0.3);
  const lock = seg(seal, 0.25, 0.45);
  return (
    <g pointerEvents="none">
      {!self && bolt > 0 ? (
        <GlowPath d={pathOf(boltPoints(a, { x: a.x + (b.x - a.x) * easeOut(bolt), y: a.y + (b.y - a.y) * easeOut(bolt) }, 9, 14, 1801))} color="#a06bff" core="#ffffff" width={3} opacity={boltFade} layers={3} />
      ) : null}
      <Glow x={b.x} y={b.y} r={55} color="#8e5bff" opacity={bump(seg(k, 0.15, 0.55))} core="#ffffff" />
      <Sparks x={b.x} y={b.y} n={12} seed={1802} k={seg(k, 0.18, 0.6)} reach={60} color="#e0ccff" width={2} />
      {seal > 0 && seal < 1 ? (
        <g transform={`translate(${f(hx)},${f(hy)}) scale(${f(s)})`} opacity={f(sealEnv)}>
          <circle r={17} fill="#2a1450" stroke="#c9a0ff" strokeWidth={2.5} />
          <circle r={22} fill="none" stroke="#a06bff" strokeWidth={1.5} strokeDasharray="3 4" transform={`rotate(${f(seal * 180)})`} />
          {/* closed lips */}
          <path d="M-9 1 Q0 -5 9 1 Q0 6 -9 1 Z" fill="#c9a0ff" />
          <line x1={-12} y1={1} x2={12} y2={1} stroke="#ffffff" strokeWidth={f(1 + 1.5 * lock)} />
          {[-6, 0, 6].map((xx) => (
            <line key={xx} x1={xx} y1={-3} x2={xx} y2={5} stroke="#2a1450" strokeWidth={1.4} opacity={f(lock)} />
          ))}
        </g>
      ) : null}
      <Ring x={hx} y={hy} r={18 + 30 * easeOut(lock)} color="#d8b8ff" width={3} opacity={lock > 0 && lock < 1 ? 1 - lock : 0} />
    </g>
  );
};

// ------------------------------------------------------------------ fiery_soul (lina E, passive)
export const FierySoulVfx: VfxArt = ({ t, duration, from }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const cx = from.x;
  const env = envelope(k, 0.1, 0.4);
  const flames: ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const ph = (k * 1.8 + rnd(i, 1901)) % 1;
    const a = (i / 12) * TAU + k * 5;
    const rr = 22 + 6 * Math.sin(i * 1.7);
    const fx = cx + Math.cos(a) * rr * (1 - ph * 0.4);
    const fy = from.y - 6 + Math.sin(a) * 6 - ph * 75;
    const h = (14 + rnd(i, 1902) * 12) * (1 - ph * 0.6);
    const w = 5 * (1 - ph * 0.5);
    flames.push(
      <path
        key={i}
        d={`M${f(fx - w)} ${f(fy)} Q${f(fx)} ${f(fy - h * 1.5)} ${f(fx + w)} ${f(fy)} Q${f(fx)} ${f(fy + 4)} ${f(fx - w)} ${f(fy)}Z`}
        fill={i % 3 === 0 ? '#ffd23a' : i % 3 === 1 ? '#ff6a1a' : '#ff9a2a'}
        opacity={f(env * (1 - ph) * 0.9)}
      />,
    );
  }
  const embers: ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const ph = (k * 1.4 + rnd(i, 1903)) % 1;
    const ex = cx + srnd(i, 1904) * 34 + Math.sin(ph * 8 + i) * 5;
    const ey = from.y - 20 - ph * 90;
    embers.push(<circle key={i} cx={f(ex)} cy={f(ey)} r={1.8} fill="#fff0a0" opacity={f(env * (1 - ph))} />);
  }
  return (
    <g pointerEvents="none">
      <ellipse cx={f(cx)} cy={f(from.y)} rx={36} ry={11} fill="#ff6a1a" opacity={f(0.25 * env)} />
      <Ring x={cx} y={from.y - 40} r={22 + 28 * easeOut(seg(k, 0, 0.35))} color="#ff8a2a" width={3} opacity={1 - seg(k, 0, 0.35)} />
      <Glow x={cx} y={from.y - 40} r={50} color="#ff6a1a" opacity={env * 0.55} core="#fff3c0" />
      {flames}
      {embers}
    </g>
  );
};
