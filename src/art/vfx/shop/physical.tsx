// Physical / rage shop spells: Berserker's Blood, Battle Hunger, Culling Blade, Fury Swipes,
// Blink Strike, Meat Hook (cast + projectile).
import type { ProjectileArt, VfxArt } from '../../types.ts';
import { bump, clamp01, easeIn, easeOut } from '../../types.ts';
import { GlowPath, GlowRing, GroundRing, Sparks, dirOf, f, h, hs, prog, span, star } from './fxkit.tsx';

const drop = (x: number, y: number, s: number): string =>
  `M${f(x)},${f(y - 6 * s)} C${f(x + 3 * s)},${f(y - 1 * s)} ${f(x + 4 * s)},${f(y + 2 * s)} ${f(x)},${f(y + 5 * s)} C${f(x - 4 * s)},${f(y + 2 * s)} ${f(x - 3 * s)},${f(y - 1 * s)} ${f(x)},${f(y - 6 * s)} Z`;

const BloodDefs = () => (
  <defs>
    <radialGradient id="bblood-aura" cx="0.5" cy="0.6" r="0.5">
      <stop offset="0" stopColor="#ff2a2a" stopOpacity="0" />
      <stop offset="0.6" stopColor="#d10f1f" stopOpacity="0.45" />
      <stop offset="1" stopColor="#7a0010" stopOpacity="0" />
    </radialGradient>
  </defs>
);

export const BerserkersBloodVfx: VfxArt = ({ t, duration, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const a = bump(k);
  const pulse = 0.75 + 0.25 * Math.sin(k * Math.PI * 6);
  const drops = [];
  for (let i = 0; i < 12; i++) {
    const st = h(i, 1) * 0.5;
    const p = span(k, st, st + 0.5);
    if (p <= 0 || p >= 1) continue;
    const x = to.x + hs(i, 2) * 30 + Math.sin(p * 6 + i) * 3;
    const y = to.y - 10 - p * (70 + 30 * h(i, 3));
    drops.push(<path key={i} d={drop(x, y, 1.3 + 0.9 * h(i, 4))} fill={i % 3 ? '#e01b2b' : '#ff5a5a'} opacity={f(bump(p))} transform={`rotate(180 ${f(x)} ${f(y)})`} />);
  }
  return (
    <g pointerEvents="none">
      <BloodDefs />
      <ellipse cx={f(to.x)} cy={f(to.y - 40)} rx={f(36 * (0.9 + 0.2 * pulse))} ry={f(52 * (0.9 + 0.15 * pulse))} fill="url(#bblood-aura)" opacity={f(a)} />
      <GroundRing cx={to.x} cy={to.y} r={22 + 26 * easeOut(k)} color="#e01b2b" width={4 * (1 - k) + 1} opacity={1 - k} />
      <GroundRing cx={to.x} cy={to.y} r={30 * pulse} color="#ff4040" width={2} opacity={a * 0.7} />
      {drops}
      <path d={star(to.x, to.y - 92, 7 * a, 2.5 * a, 4, k)} fill="#ff5a5a" opacity={f(a)} />
    </g>
  );
};

export const BattleHungerVfx: VfxArt = ({ t, duration, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const a = Math.min(span(k, 0, 0.15), 1 - span(k, 0.75, 1));
  const gx = to.x;
  const gy = to.y - 108 - 6 * easeOut(span(k, 0, 0.3));
  const sc = 0.6 + 0.4 * easeOut(span(k, 0, 0.2)) + 0.08 * Math.sin(t * 20) * (1 - k);
  const drips = [];
  for (let i = 0; i < 7; i++) {
    const x = to.x - 26 + (i / 6) * 52 + hs(i, 1) * 4;
    const top = to.y - 70 + Math.abs(i - 3) * 9;
    const ph = (k * 2 + h(i, 2)) % 1;
    const len = 8 + 18 * ph;
    drips.push(
      <g key={i} opacity={f(a)}>
        <line x1={f(x)} y1={f(top)} x2={f(x)} y2={f(top + len)} stroke="#9b0a14" strokeWidth={3} strokeLinecap="round" />
        <path d={drop(x, top + len + 4 + ph * ph * 30, 0.8)} fill="#c3121f" opacity={f(1 - ph)} />
      </g>,
    );
  }
  return (
    <g pointerEvents="none">
      <BloodDefs />
      <ellipse cx={f(to.x)} cy={f(to.y - 38)} rx={40} ry={50} fill="url(#bblood-aura)" opacity={f(a)} />
      <ellipse cx={f(to.x)} cy={f(to.y - 38)} rx={34} ry={44} fill="none" stroke="#9b0a14" strokeWidth={2} strokeDasharray="6 5" strokeDashoffset={f(t * 40)} opacity={f(a * 0.7)} />
      {drips}
      <g transform={`translate(${f(gx)},${f(gy)}) scale(${f(sc)})`} opacity={f(a)}>
        <circle r={22} fill="#2a0005" opacity={0.6} />
        <circle r={22} fill="none" stroke="#e01b2b" strokeWidth={2.5} />
        {/* gaping maw rune */}
        <path d="M-14,-6 Q0,-14 14,-6 L10,8 Q0,14 -10,8 Z" fill="#e01b2b" />
        <path d="M-10,-5 L-7,2 L-4,-6 L-1,2 L2,-7 L5,2 L8,-5" fill="none" stroke="#fff0f0" strokeWidth={1.6} strokeLinejoin="round" />
        <path d="M-7,8 L-5,3 L-2,9 L1,3 L4,9 L7,4" fill="none" stroke="#fff0f0" strokeWidth={1.4} strokeLinejoin="round" />
        <path d="M-20,-20 L-12,-14 M20,-20 L12,-14" stroke="#ff5a5a" strokeWidth={3} strokeLinecap="round" />
      </g>
    </g>
  );
};

export const CullingBladeVfx: VfxArt = ({ t, duration, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const swing = easeIn(span(k, 0, 0.28));
  const impact = span(k, 0.28, 1);
  const px = to.x - 10;
  const py = to.y - 150;
  const R = 120;
  const a0 = -40;
  const a1 = 125;
  const ang = a0 + (a1 - a0) * swing;
  const rad = (d: number) => (d * Math.PI) / 180;
  const arcStart = Math.max(a0, ang - 110);
  const arc = (r: number) => `M${f(px + Math.cos(rad(arcStart)) * r)},${f(py + Math.sin(rad(arcStart)) * r)} A${r},${r} 0 0 1 ${f(px + Math.cos(rad(ang)) * r)},${f(py + Math.sin(rad(ang)) * r)}`;
  const axeOp = 1 - span(k, 0.35, 0.55);
  const showArc = swing > 0.02 && k < 0.5;
  const blood = [];
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI * (0.1 + 0.8 * h(i, 1));
    const sp = 60 + 90 * h(i, 2);
    const p = easeOut(impact * 1.6);
    const x = to.x + Math.cos(a) * sp * p;
    const y = to.y - 40 + Math.sin(a) * sp * p + impact * impact * 120;
    blood.push(<circle key={i} cx={f(x)} cy={f(y)} r={f((2 + 3 * h(i, 3)) * (1 - impact * 0.5))} fill="#c3121f" opacity={f(1 - impact)} />);
  }
  const flash = impact > 0 ? 1 - span(impact, 0, 0.35) : 0;
  const txt = impact > 0 ? Math.min(span(impact, 0, 0.1), 1 - span(impact, 0.7, 1)) : 0;
  const tsc = 1 + 0.6 * (1 - easeOut(span(impact, 0, 0.15)));
  return (
    <g pointerEvents="none">
      {flash > 0 && <circle cx={f(to.x)} cy={f(to.y - 40)} r={f(60 + 80 * (1 - flash))} fill="#ff1a1a" opacity={f(flash * 0.45)} />}
      {showArc && (
        <g opacity={f(axeOp)}>
          <path d={arc(R)} fill="none" stroke="#ff3030" strokeWidth={34} opacity={0.18} strokeLinecap="round" />
          <path d={arc(R)} fill="none" stroke="#ffd0d0" strokeWidth={10} opacity={0.6} strokeLinecap="round" />
          <path d={arc(R + 8)} fill="none" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" />
        </g>
      )}
      {axeOp > 0 && (
        <g transform={`translate(${f(px)},${f(py)}) rotate(${f(ang)})`} opacity={f(axeOp)}>
          <rect x={0} y={-4} width={R - 6} height={8} rx={3} fill="#5a3a1a" stroke="#2a1505" strokeWidth={1.5} />
          {/* giant axe head at the end of the haft, blade facing the swing direction (+y in local frame) */}
          <path d={`M${R - 30},-8 L${R + 18},-26 Q${R + 34},12 ${R + 18},46 L${R - 30},14 Z`} fill="#9aa3ad" stroke="#2a2f35" strokeWidth={2} />
          <path d={`M${R + 18},-26 Q${R + 34},12 ${R + 18},46`} fill="none" stroke="#ffffff" strokeWidth={3} />
          <path d={`M${R - 24},-2 L${R + 6},-8`} stroke="#c3121f" strokeWidth={4} strokeLinecap="round" />
        </g>
      )}
      {impact > 0 && (
        <g>
          <GlowPath d={`M${f(to.x + 34)},${f(to.y - 96)} L${f(to.x - 30)},${f(to.y + 8)}`} color="#ff1a1a" width={8 * (1 - impact) + 1} opacity={1 - span(impact, 0.2, 0.7)} />
          <GlowRing cx={to.x} cy={to.y - 40} r={30 + 90 * easeOut(impact)} color="#ff2a2a" width={6 * (1 - impact) + 0.5} opacity={1 - impact} />
          <Sparks cx={to.x} cy={to.y - 40} n={14} r0={14} r1={110} k={span(impact, 0, 0.5)} color="#ffd0d0" seed={77} width={3} />
          {blood}
          <g transform={`translate(${f(to.x)},${f(to.y - 118 - 14 * impact)}) scale(${f(tsc)})`} opacity={f(txt)}>
            <text textAnchor="middle" fontFamily="Impact, 'Arial Black', sans-serif" fontWeight={900} fontSize={26} fill="#ff2a2a" stroke="#1a0000" strokeWidth={5} paintOrder="stroke" letterSpacing={2}>
              CULLED
            </text>
            <path d="M-46,6 L46,6" stroke="#ff2a2a" strokeWidth={2} opacity={0.8} />
          </g>
        </g>
      )}
    </g>
  );
};

export const FurySwipesVfx: VfxArt = ({ t, duration, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const fade = 1 - span(k, 0.5, 1);
  const cx = to.x;
  const cy = to.y - 42;
  const claws = [];
  for (let i = 0; i < 3; i++) {
    const p = easeOut(span(k, i * 0.04, 0.22 + i * 0.04));
    if (p <= 0) continue;
    const off = (i - 1) * 12;
    const d = `M${f(cx - 26 + off)},${f(cy - 30 + off * 0.3)} Q${f(cx - 2 + off)},${f(cy - 4 + off * 0.2)} ${f(cx + 18 + off)},${f(cy + 30 + off * 0.3)}`;
    claws.push(
      <g key={i}>
        <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={f(1 - p)} fill="none" stroke="#c3121f" strokeWidth={7} strokeLinecap="round" opacity={0.45} />
        <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={f(1 - p)} fill="none" stroke="#ffffff" strokeWidth={3.5} strokeLinecap="round" />
      </g>,
    );
  }
  return (
    <g pointerEvents="none" opacity={f(fade)}>
      {claws}
      <Sparks cx={cx + 6} cy={cy + 6} n={8} r0={6} r1={36} k={span(k, 0.15, 0.6)} color="#ffffff" seed={88} />
    </g>
  );
};

function Smoke({ x, y, k, seed, scale = 1 }: { x: number; y: number; k: number; seed: number; scale?: number }) {
  if (k <= 0 || k >= 1) return null;
  const out = [];
  for (let i = 0; i < 9; i++) {
    const a = h(i, seed) * Math.PI * 2;
    const d = (12 + 26 * h(i, seed + 1)) * easeOut(k) * scale;
    const r = (10 + 10 * h(i, seed + 2)) * (0.6 + 0.6 * k) * scale;
    out.push(<circle key={i} cx={f(x + Math.cos(a) * d)} cy={f(y + Math.sin(a) * d * 0.7 - k * 18 * scale)} r={f(r)} fill={i % 2 ? '#7b3fd0' : '#b07cff'} opacity={f((1 - k) * 0.55)} />);
  }
  return <g>{out}</g>;
}

export const BlinkStrikeVfx: VfxArt = ({ t, duration, from, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const { ux, uy, deg } = dirOf(from, to);
  const slash = easeOut(span(k, 0.15, 0.35));
  const slashFade = 1 - span(k, 0.4, 0.8);
  const cx = to.x;
  const cy = to.y - 42;
  const crescent = `M${f(-34)},${f(-28)} Q${f(30)},${f(-10)} ${f(30)},${f(32)} Q${f(14)},${f(-2)} ${f(-34)},${f(-28)} Z`;
  return (
    <g pointerEvents="none">
      {/* blink trail */}
      <GlowPath d={`M${f(from.x)},${f(from.y - 40)} L${f(to.x - ux * 20)},${f(to.y - 40 - uy * 20)}`} color="#9b5cff" width={4 * (1 - span(k, 0, 0.3))} opacity={1 - span(k, 0, 0.3)} dash="2 10" />
      <Smoke x={from.x} y={from.y - 30} k={span(k, 0, 0.7)} seed={3} />
      <path d={star(from.x, from.y - 40, 24 * bump(span(k, 0, 0.2)), 6, 4, 0.4)} fill="#e6d4ff" opacity={f(bump(span(k, 0, 0.2)))} />
      <Smoke x={to.x - ux * 20} y={to.y - 30} k={span(k, 0.08, 0.7)} seed={9} scale={0.8} />
      <path d={star(to.x - ux * 20, to.y - 40, 20 * bump(span(k, 0.08, 0.25)), 5, 4, 0.2)} fill="#e6d4ff" opacity={f(bump(span(k, 0.08, 0.25)))} />
      {slash > 0 && slashFade > 0 && (
        <g transform={`translate(${f(cx)},${f(cy)}) rotate(${f(Math.abs(deg) > 90 ? 180 : 0)}) scale(1,${f(Math.abs(deg) > 90 ? -1 : 1)})`} opacity={f(slashFade)}>
          <g transform={`scale(${f(0.6 + 0.4 * slash)})`}>
            <path d={crescent} fill="#b07cff" opacity={0.35} transform="scale(1.2)" />
            <path d={crescent} fill="#ffffff" />
          </g>
          {/* dagger glint */}
          <g transform={`translate(${f(-34 + 64 * slash)},${f(-28 + 60 * slash)}) rotate(50)`}>
            <path d="M0,-3 L22,0 L0,3 Z" fill="#e8eef5" stroke="#5a5f66" strokeWidth={0.8} />
            <rect x={-8} y={-2} width={8} height={4} fill="#4a2a6a" />
            <rect x={-1} y={-6} width={2} height={12} fill="#c9a640" />
          </g>
        </g>
      )}
      <Sparks cx={cx} cy={cy} n={10} r0={10} r1={55} k={span(k, 0.25, 0.65)} color="#e6d4ff" seed={14} />
    </g>
  );
};

/** rusty meat hook, pointing +x with chain trailing to -x */
function Hook() {
  const links = [];
  for (let i = 0; i < 7; i++) {
    const x = -10 - i * 8.5;
    links.push(
      i % 2 === 0 ? (
        <ellipse key={i} cx={f(x)} cy={0} rx={5.5} ry={3} fill="none" stroke="#6b5a4a" strokeWidth={2} />
      ) : (
        <line key={i} x1={f(x - 4.5)} y1={0} x2={f(x + 4.5)} y2={0} stroke="#8a7560" strokeWidth={2.4} strokeLinecap="round" />
      ),
    );
  }
  return (
    <g>
      {links}
      <circle cx={-4} cy={0} r={3.5} fill="none" stroke="#7a5a3a" strokeWidth={2} />
      <rect x={-1} y={-2} width={12} height={4} fill="#8a5a32" stroke="#3a2010" strokeWidth={0.8} />
      <path d="M10,0 C22,-1 26,10 18,15 C12,18 6,14 6,8" fill="none" stroke="#3a2010" strokeWidth={6} strokeLinecap="round" />
      <path d="M10,0 C22,-1 26,10 18,15 C12,18 6,14 6,8" fill="none" stroke="#a0643a" strokeWidth={4} strokeLinecap="round" />
      <path d="M12,1 C20,1 23,8 19,12" fill="none" stroke="#d9a070" strokeWidth={1.2} strokeLinecap="round" />
      <path d="M6,8 L3,3 L9,6 Z" fill="#c8c8c8" stroke="#3a2010" strokeWidth={0.8} />
      <path d="M12,-2 C26,-6 30,6 26,14" fill="none" stroke="#b5341e" strokeWidth={1.4} opacity={0.6} />
    </g>
  );
}

export const MeatHookProjectile: ProjectileArt = ({ t }) => (
  <g>
    <path d={`M-70,0 L-10,0`} stroke="#ffffff" strokeWidth={10} opacity={0.08} strokeLinecap="round" />
    {[0, 1, 2].map((i) => (
      <line key={i} x1={-20 - i * 18} y1={f(-9 + i * 9 + Math.sin(t * 30 + i) * 1.5)} x2={-40 - i * 18} y2={f(-9 + i * 9 + Math.sin(t * 30 + i) * 1.5)} stroke="#e0d6c8" strokeWidth={1.2} opacity={0.5} />
    ))}
    <g transform={`rotate(${f(Math.sin(t * 25) * 4)})`}>
      <Hook />
    </g>
  </g>
);

/** chain whoosh line from caster to target fading */
export const MeatHookVfx: VfxArt = ({ t, duration, from, to }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const out = easeOut(span(k, 0, 0.35));
  const fade = 1 - span(k, 0.35, 1);
  const ax = from.x;
  const ay = from.y - 40;
  const bx = from.x + (to.x - from.x) * out;
  const by = from.y - 40 + (to.y - from.y) * out;
  const sag = 14 * (1 - out) + 4;
  const d = `M${f(ax)},${f(ay)} Q${f((ax + bx) / 2)},${f((ay + by) / 2 + sag)} ${f(bx)},${f(by)}`;
  return (
    <g pointerEvents="none" opacity={f(fade)}>
      <path d={d} fill="none" stroke="#e0d6c8" strokeWidth={12} opacity={0.12} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#3a2a1a" strokeWidth={4.5} strokeDasharray="7 3" strokeDashoffset={f(-t * 200)} />
      <path d={d} fill="none" stroke="#8a7560" strokeWidth={2.5} strokeDasharray="7 3" strokeDashoffset={f(-t * 200)} />
      <Sparks cx={ax} cy={ay} n={6} r0={4} r1={30} k={span(k, 0, 0.3)} color="#ffd9a0" seed={21} />
      {out >= 1 && <Sparks cx={to.x} cy={to.y - 40} n={8} r0={6} r1={40} k={span(k, 0.35, 0.7)} color="#ffd9a0" seed={22} width={2.5} />}
      {clamp01(1 - out) > 0 && <circle cx={f(bx)} cy={f(by)} r={6} fill="#ffd9a0" opacity={0.6} />}
    </g>
  );
};
