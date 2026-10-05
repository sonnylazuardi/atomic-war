// Kit-D VFX: riki — smoke_screen (bomb + lingering cloud), cloak_and_dagger (backstab), tricks_of_the_trade (phased flurry).
import type { ReactNode } from 'react';
import type { Vec } from '../../../core/types.ts';
import type { VfxArt, ZoneArt } from '../../types.ts';
import { bump, clamp01, easeIn, easeOut, lerp } from '../../types.ts';
import { Glow, Ring, Slash, Sparks, TAU, angleDeg, envelope, f, polar, prog, rnd, seg, srnd } from '../sig/fxkit.tsx';
import { CHEST, HAND, aim } from '../kitC/kit.tsx';
import { Puff, daggerPath } from './kit.tsx';

const SMOKE = '#8d8aa6';
const SMOKE_DARK = '#4a4660';
const RIKI = '#b48cff';

// ------------------------------------------------------------------ smoke_screen (cast: bomb lobbed, cloud bursts)
export const SmokeScreenVfx: VfxArt = ({ t, duration, from, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 130;
  const fly = seg(k, 0, 0.4);
  const a: Vec = { x: from.x, y: from.y - HAND };
  const arc = Math.sin(Math.PI * fly) * 90;
  const bomb: Vec = { x: lerp(a.x, to.x, fly), y: lerp(a.y, to.y - 6, fly) - arc };
  const burst = seg(k, 0.38, 1);
  const puffs: ReactNode[] = [];
  if (burst > 0) {
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * TAU + srnd(i, 301) * 0.3;
      const rr = R * (0.35 + rnd(i, 302) * 0.6) * easeOut(burst);
      const p = polar(to.x, to.y, rr, ang);
      puffs.push(<Puff key={i} x={p.x} y={p.y * 1 - 8 * burst} r={14 + 18 * easeOut(burst)} color={i % 3 ? SMOKE : SMOKE_DARK} opacity={(1 - seg(burst, 0.6, 1)) * 0.9} />);
    }
  }
  return (
    <g>
      {fly < 1 ? (
        <g>
          <circle cx={f(bomb.x)} cy={f(bomb.y)} r={6} fill="#2a2638" stroke="#cfc8ff" strokeWidth={1.2} />
          <circle cx={f(bomb.x + 3)} cy={f(bomb.y - 6)} r={f(2 + rnd(Math.floor(t * 30), 303) * 2)} fill="#ffd27a" />
          {Array.from({ length: 4 }, (_, i) => {
            const b = Math.max(0, fly - (i + 1) * 0.06);
            const px = lerp(a.x, to.x, b);
            const py = lerp(a.y, to.y - 6, b) - Math.sin(Math.PI * b) * 90;
            return <circle key={i} cx={f(px)} cy={f(py)} r={f(3 + i * 1.5)} fill={SMOKE} opacity={f(0.5 - i * 0.1)} />;
          })}
        </g>
      ) : null}
      {burst > 0 ? (
        <g>
          <Glow x={to.x} y={to.y - 10} r={50} color="#d8d0ff" opacity={1 - seg(burst, 0, 0.3)} core="#ffffff" />
          <Ring x={to.x} y={to.y} r={R * easeOut(burst)} color="#cfc8ff" width={3 * (1 - burst)} opacity={1 - burst} />
          {puffs}
        </g>
      ) : null}
    </g>
  );
};

/** lingering smoke cloud: billowing puffs that churn in place */
export const SmokeScreenZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const R = radius > 0 ? radius : 130;
  const env = Math.min(clamp01(t / 0.3), clamp01((duration - t) / 0.6));
  if (env <= 0) return null;
  const puffs: ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    const ang = rnd(i, 311) * TAU + t * (0.25 + rnd(i, 312) * 0.3) * (i % 2 ? 1 : -1);
    const rr = R * (0.15 + Math.sqrt(rnd(i, 313)) * 0.72);
    const breathe = Math.sin(t * 1.7 + i) * 0.15 + 1;
    const p = polar(x, y, rr, ang);
    puffs.push(<Puff key={i} x={p.x} y={p.y - 10 - rnd(i, 314) * 14} r={(20 + rnd(i, 315) * 16) * breathe} color={i % 4 === 0 ? SMOKE_DARK : SMOKE} opacity={0.7} />);
  }
  // wisps rising off the top
  const wisps: ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const ph = (rnd(i, 321) + t * 0.4) % 1;
    const px = x + srnd(i, 322) * R * 0.7 + Math.sin(ph * 6 + i) * 6;
    wisps.push(<circle key={i} cx={f(px)} cy={f(y - 20 - ph * 50)} r={f(6 + ph * 10)} fill="#b8b2d0" opacity={f(bump(ph) * 0.3)} />);
  }
  return (
    <g pointerEvents="none" opacity={f(env)}>
      <ellipse cx={f(x)} cy={f(y)} rx={f(R)} ry={f(R * 0.9)} fill={SMOKE_DARK} opacity={0.3} />
      <circle cx={f(x)} cy={f(y)} r={f(R)} fill="none" stroke="#cfc8ff" strokeWidth={1.5} strokeOpacity={0.35} strokeDasharray="3 9" transform={`rotate(${f(t * 12)} ${f(x)} ${f(y)})`} />
      {puffs}
      {wisps}
    </g>
  );
};

// ------------------------------------------------------------------ cloak_and_dagger (backstab proc at the target)
export const CloakAndDaggerVfx: VfxArt = ({ t, duration, from, to, team }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const d = aim(from, to, team);
  const deg = angleDeg(d);
  const hx = to.x;
  const hy = to.y - CHEST;
  const cut = easeOut(seg(k, 0, 0.35));
  const fade = 1 - seg(k, 0.45, 1);
  // shimmer where Riki stood (fading in from invisibility)
  const shimmer = bump(seg(k, 0, 0.7));
  return (
    <g>
      <g opacity={f(shimmer * 0.6)}>
        <ellipse cx={f(from.x)} cy={f(from.y - 36)} rx={18} ry={36} fill="none" stroke={RIKI} strokeWidth={1.5} strokeDasharray="4 4" strokeDashoffset={f(t * 60)} />
        {Array.from({ length: 6 }, (_, i) => {
          const ph = (rnd(i, 331) + k * 1.5) % 1;
          return <circle key={i} cx={f(from.x + srnd(i, 332) * 18)} cy={f(from.y - 10 - ph * 60)} r={1.6} fill="#e6dcff" opacity={f(bump(ph))} />;
        })}
      </g>
      <Slash x={hx} y={hy} rot={deg + 35} L={58} w={10} p={cut} color={RIKI} opacity={fade} />
      <Slash x={hx} y={hy + 4} rot={deg - 30} L={46} w={8} p={easeOut(seg(k, 0.12, 0.45))} color="#7a5cff" opacity={fade} />
      <g transform={`translate(${f(hx - d.x * 20)},${f(hy - d.y * 20)}) rotate(${f(deg)})`} opacity={f(1 - seg(k, 0.2, 0.6))}>
        <path d={daggerPath(26, 7)} fill="#efeaff" stroke="#5a3fb0" strokeWidth={1} transform={`translate(${f(-6 + 14 * cut)},0)`} />
      </g>
      <Glow x={hx} y={hy} r={30} color={RIKI} opacity={(1 - seg(k, 0.2, 0.7)) * 0.8} core="#ffffff" />
      <Sparks x={hx} y={hy} n={8} seed={333} k={seg(k, 0.15, 0.8)} reach={36} color="#d6c8ff" width={1.8} arc={1.8} heading={Math.atan2(d.y, d.x)} />
    </g>
  );
};

// ------------------------------------------------------------------ tricks_of_the_trade (cast: riki dissolves into smoke)
export const TricksVfx: VfxArt = ({ t, duration, from, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 200;
  const swirl = easeOut(seg(k, 0, 0.6));
  const fade = 1 - seg(k, 0.55, 1);
  const motes: ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const ang = rnd(i, 341) * TAU + swirl * 3;
    const rr = lerp(10, R * (0.5 + rnd(i, 342) * 0.5), swirl);
    const p = polar(from.x, from.y - 30, rr, ang);
    motes.push(<circle key={i} cx={f(p.x)} cy={f(p.y)} r={f(2 + rnd(i, 343) * 2)} fill="#e2d6ff" opacity={f(fade)} />);
  }
  return (
    <g>
      <Puff x={from.x} y={from.y - 30} r={20 + 30 * swirl} color={SMOKE_DARK} opacity={fade * 0.7} />
      <Glow x={from.x} y={from.y - 36} r={60} color={RIKI} opacity={bump(seg(k, 0, 0.6))} core="#ffffff" />
      <Ring x={from.x} y={from.y} r={R * swirl} color={RIKI} width={3 * fade} opacity={fade} dash="14 8" />
      {motes}
    </g>
  );
};

/** phased Riki: purple smoke disc following him, dagger strikes flashing on random spots inside */
export const TricksZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const R = radius > 0 ? radius : 200;
  const env = Math.min(clamp01(t / 0.25), clamp01((duration - t) / 0.4));
  if (env <= 0) return null;
  const strikes: ReactNode[] = [];
  const slot = 0.11;
  const life = 0.32;
  const n1 = Math.floor(t / slot);
  for (let n = Math.max(0, Math.floor((t - life) / slot)); n <= n1; n++) {
    const age = t - n * slot;
    if (age < 0 || age > life) continue;
    const p = age / life;
    const ang = rnd(n, 351) * TAU;
    const rr = R * (0.25 + Math.sqrt(rnd(n, 352)) * 0.65);
    const sx = x + Math.cos(ang) * rr;
    const sy = y - 30 + Math.sin(ang) * rr * 0.8;
    const rot = rnd(n, 353) * 360;
    strikes.push(
      <g key={n}>
        <Slash x={sx} y={sy} rot={rot} L={58} w={11} p={easeOut(seg(p, 0, 0.4))} color={n % 2 ? RIKI : '#e8e0ff'} opacity={1 - easeIn(p)} />
        {p < 0.4 ? <circle cx={f(sx)} cy={f(sy)} r={f(4 + p * 24)} fill="#ffffff" opacity={f(1 - p / 0.4)} /> : null}
        <Sparks x={sx} y={sy} n={5} seed={354 + (n % 7)} k={p} reach={30} color="#e2d6ff" width={1.6} />
      </g>,
    );
  }
  // afterimage blurs of Riki darting around
  const ghosts: ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const ang = t * 5 + (i / 3) * TAU;
    const p = polar(x, y, R * 0.45, ang);
    ghosts.push(<ellipse key={i} cx={f(p.x)} cy={f(p.y - 28)} rx={9} ry={26} fill={RIKI} opacity={0.22} transform={`rotate(${f(Math.cos(ang) * 20)} ${f(p.x)} ${f(p.y - 28)})`} />);
  }
  const pulse = 0.5 + 0.5 * Math.sin(t * 8);
  return (
    <g pointerEvents="none" opacity={f(env)}>
      <circle cx={f(x)} cy={f(y)} r={f(R)} fill="#3a2a66" opacity={0.22} />
      <circle cx={f(x)} cy={f(y)} r={f(R)} fill="none" stroke={RIKI} strokeWidth={2.5} strokeOpacity={f(0.45 + pulse * 0.3)} strokeDasharray="18 10" transform={`rotate(${f(-t * 60)} ${f(x)} ${f(y)})`} />
      <circle cx={f(x)} cy={f(y)} r={f(R * 0.7)} fill="none" stroke="#e2d6ff" strokeWidth={1} strokeOpacity={0.3} strokeDasharray="4 12" transform={`rotate(${f(t * 90)} ${f(x)} ${f(y)})`} />
      {Array.from({ length: 8 }, (_, i) => {
        const ang = (i / 8) * TAU + t * 0.8;
        const p = polar(x, y, R * (0.6 + 0.25 * Math.sin(t * 2 + i)), ang);
        return <Puff key={i} x={p.x} y={p.y - 6} r={16} color={SMOKE_DARK} opacity={0.45} />;
      })}
      {ghosts}
      {strikes}
    </g>
  );
};
