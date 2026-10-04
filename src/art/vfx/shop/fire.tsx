// Fire shop spells: Dragon Slave (wave + projectile), Light Strike Array (zone + cast).
import type { ProjectileArt, VfxArt, ZoneArt } from '../../types.ts';
import { bump, clamp01 } from '../../types.ts';
import { GlowRing, Sparks, dirOf, f, h, hs, prog, span, star } from './fxkit.tsx';

const FireDefs = () => (
  <defs>
    <linearGradient id="dslave-trail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#ff3d00" stopOpacity="0" />
      <stop offset="0.45" stopColor="#ff5a00" stopOpacity="0.55" />
      <stop offset="0.85" stopColor="#ffa31a" stopOpacity="0.9" />
      <stop offset="1" stopColor="#fff2b0" stopOpacity="1" />
    </linearGradient>
    <linearGradient id="dslave-head" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#ffe27a" />
      <stop offset="0.5" stopColor="#ff8a1a" />
      <stop offset="1" stopColor="#c62800" />
    </linearGradient>
    <radialGradient id="dslave-core" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#fffbe0" />
      <stop offset="0.35" stopColor="#ffc23a" />
      <stop offset="0.75" stopColor="#ff5200" stopOpacity="0.7" />
      <stop offset="1" stopColor="#ff2a00" stopOpacity="0" />
    </radialGradient>
  </defs>
);

/** stylized dragon head facing +x, ~70 long, centered near origin */
function DragonHead({ jaw, flick }: { jaw: number; flick: number }) {
  return (
    <g>
      {/* horns */}
      <path d={`M-22,-16 L${f(-50 - flick * 4)},-36 L-30,-12 Z`} fill="#ff6a00" stroke="#7a1a00" strokeWidth={1.5} />
      <path d={`M-30,-10 L${f(-58 + flick * 3)},-20 L-34,-4 Z`} fill="#ff8a1a" stroke="#7a1a00" strokeWidth={1.5} />
      {/* lower jaw */}
      <g transform={`rotate(${f(jaw * 22)} -26 4)`}>
        <path d="M-34,4 L-8,6 L14,10 L32,15 L18,19 L-12,17 L-30,12 Z" fill="url(#dslave-head)" stroke="#7a1a00" strokeWidth={1.5} />
        <path d="M2,10 L6,6 L9,11 M14,12 L18,8 L20,13" stroke="#fff6d0" strokeWidth={1.4} fill="none" />
      </g>
      {/* upper jaw / skull */}
      <path d="M-40,-4 L-26,-18 L-6,-22 L16,-14 L38,-4 L26,0 L8,-2 L-10,2 L-34,6 Z" fill="url(#dslave-head)" stroke="#7a1a00" strokeWidth={1.5} />
      <path d="M8,-2 L11,3 L14,-1 M20,-1 L23,4 L25,0" stroke="#fff6d0" strokeWidth={1.4} fill="none" />
      {/* brow ridge + eye */}
      <path d="M-14,-16 L4,-18 L-2,-12 Z" fill="#7a1a00" />
      <circle cx={-4} cy={-12} r={3.2} fill="#fffbe0" />
      <circle cx={-4} cy={-12} r={7} fill="#fff27a" opacity={0.35} />
      {/* nostril smoke-flame */}
      <circle cx={34} cy={-6} r={3 + flick * 2} fill="#ffd35a" opacity={0.8} />
    </g>
  );
}

export const DragonSlaveVfx: VfxArt = ({ t, duration, from, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const { len, deg } = dirOf(from, to);
  const L = Math.max(len + 240, 520);
  const p = span(k, 0, 0.82);
  const s = L * (1 - (1 - p) ** 1.5);
  const w = radius > 0 ? radius : 80;
  const hw = w / 2;
  const alpha = 1 - span(k, 0.78, 1);
  const fl = Math.floor(t * 24);
  const tail = Math.max(0, s - 280);
  const sc = w / 80;

  // trail cone
  const trail = `M${f(tail)},0 C${f(tail + (s - tail) * 0.45)},${f(-hw * 0.55)} ${f(s - 50)},${f(-hw)} ${f(s - 4)},${f(-hw * 0.7)} L${f(s + 18)},0 L${f(s - 4)},${f(hw * 0.7)} C${f(s - 50)},${f(hw)} ${f(tail + (s - tail) * 0.45)},${f(hw * 0.55)} ${f(tail)},0 Z`;

  const tongues = [];
  for (let j = 0; j < 7; j++) {
    const y = (j / 6 - 0.5) * w * 0.95;
    const reach = 10 + 22 * h(j, fl) + (1 - Math.abs(j - 3) / 3) * 16;
    const base = s - 70 - h(j, fl + 7) * 30;
    tongues.push(
      <path
        key={j}
        d={`M${f(base)},${f(y - 7)} Q${f(s - 10)},${f(y - 12 + hs(j, fl) * 5)} ${f(s + reach)},${f(y * 1.05)} Q${f(s - 10)},${f(y + 10)} ${f(base)},${f(y + 7)} Z`}
        fill={j % 2 ? '#ff7a12' : '#ffb636'}
        opacity={0.85}
      />,
    );
  }

  // ground flames left burning along the path
  const ground = [];
  for (let i = 0; i < 16; i++) {
    const gx = h(i, 11) * L * 0.95;
    if (gx > s - 20) continue;
    const pass = gx / L;
    const age = clamp01((p - pass) / 0.35);
    if (age >= 1) continue;
    const gy = hs(i, 12) * hw * 0.8;
    const ht = (14 + h(i, 13) * 16) * sc * (1 - age) * (0.8 + 0.2 * h(i, fl));
    ground.push(
      <path key={i} d={`M${f(gx - 6 * sc)},${f(gy)} Q${f(gx)},${f(gy - ht * 1.2)} ${f(gx + 6 * sc)},${f(gy)} Z`} fill="#ff8a1a" opacity={f((1 - age) * 0.8)} transform={`rotate(${f(-deg)} ${f(gx)} ${f(gy)})`} />,
    );
  }

  // embers trailing the front
  const embers = [];
  for (let i = 0; i < 30; i++) {
    const ph = (t * 1.8 + h(i, 21)) % 1;
    const ex = s - 20 - ph * (180 + h(i, 22) * 140);
    if (ex < 0) continue;
    const ey = hs(i, 23) * hw * (0.6 + ph * 0.8);
    const r = (1.2 + h(i, 24) * 2.4) * (1 - ph);
    embers.push(<circle key={i} cx={f(ex)} cy={f(ey)} r={f(r)} fill={i % 3 ? '#ffb43a' : '#fff2b0'} opacity={f(1 - ph)} />);
  }

  return (
    <g opacity={f(alpha)} pointerEvents="none">
      <FireDefs />
      <g transform={`translate(${f(from.x)},${f(from.y)}) rotate(${f(deg)})`}>
        <rect x={0} y={f(-hw * 0.8)} width={f(Math.max(s - 10, 0))} height={f(hw * 1.6)} fill="#ff6a00" opacity={0.08} rx={f(hw * 0.5)} />
        {ground}
        <path d={trail} fill="url(#dslave-trail)" />
        <path d={trail} fill="none" stroke="#ff4400" strokeWidth={3} opacity={0.25} />
        {tongues}
        <ellipse cx={f(s - 10)} cy={0} rx={f(hw * 1.1)} ry={f(hw * 0.9)} fill="url(#dslave-core)" opacity={0.85} />
        {embers}
        <g transform={`translate(${f(s + 4)},0) scale(${f(sc * 1.1)})`}>
          <DragonHead jaw={0.4 + 0.6 * bump((t * 3) % 1)} flick={h(fl, 5)} />
        </g>
      </g>
    </g>
  );
};

export const DragonSlaveProjectile: ProjectileArt = ({ t }) => {
  const fl = Math.floor(t * 24);
  const tails = [];
  for (let j = 0; j < 5; j++) {
    const y = (j - 2) * 5;
    const reach = 30 + h(j, fl) * 26;
    tails.push(<path key={j} d={`M4,${y - 5} Q${f(-reach * 0.5)},${f(y - 4 + hs(j, fl) * 4)} ${f(-reach)},${f(y * 1.6)} Q${f(-reach * 0.5)},${f(y + 5)} 4,${y + 5} Z`} fill={j % 2 ? '#ff6a00' : '#ffae2a'} opacity={0.8} />);
  }
  return (
    <g>
      <FireDefs />
      {tails}
      <circle r={20} fill="url(#dslave-core)" />
      <g transform="translate(6,0) scale(0.42)">
        <DragonHead jaw={0.5 + 0.5 * Math.sin(t * 18)} flick={h(fl, 3)} />
      </g>
    </g>
  );
};

/** Light strike array: telegraphed rune circle, then a pillar of fire erupts. */
export const LightStrikeZone: ZoneArt = ({ t, duration, x, y, radius }) => {
  const R = radius > 0 ? radius : 120;
  const te = Math.min(0.5, Math.max(duration, 0.2) * 0.7);
  if (t < te) {
    const p = clamp01(t / te);
    const flick = 0.75 + 0.25 * Math.sin(t * 40);
    return (
      <g pointerEvents="none">
        <circle cx={f(x)} cy={f(y)} r={f(R)} fill="#ff5a00" opacity={f(0.06 + 0.16 * p)} />
        <circle cx={f(x)} cy={f(y)} r={f(R)} fill="none" stroke="#ffb340" strokeWidth={2.5} strokeDasharray="14 8" strokeDashoffset={f(-t * 120)} opacity={f(0.5 + 0.5 * p)} />
        <circle cx={f(x)} cy={f(y)} r={f(R * (1 - p) + R * 0.05)} fill="none" stroke="#ffe08a" strokeWidth={f(1.5 + 3 * p)} opacity={f(0.4 + 0.5 * p)} />
        <g transform={`rotate(${f(t * 90)} ${f(x)} ${f(y)})`} opacity={f((0.3 + 0.7 * p) * flick)}>
          <path d={star(x, y, R * 0.72, R * 0.36, 6, 0)} fill="none" stroke="#ff8a1a" strokeWidth={2.5} />
          <path d={star(x, y, R * 0.72, R * 0.36, 6, 0)} fill="none" stroke="#fff0b0" strokeWidth={0.8} />
          <circle cx={f(x)} cy={f(y)} r={f(R * 0.82)} fill="none" stroke="#ff8a1a" strokeWidth={1.2} />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <rect key={i} x={f(x + Math.cos(a) * R * 0.9 - 3)} y={f(y + Math.sin(a) * R * 0.9 - 3)} width={6} height={6} fill="#ffd35a" transform={`rotate(45 ${f(x + Math.cos(a) * R * 0.9)} ${f(y + Math.sin(a) * R * 0.9)})`} />;
          })}
        </g>
        <circle cx={f(x)} cy={f(y)} r={f(R * 0.15 * p)} fill="#fff2b0" opacity={f(p * flick)} />
      </g>
    );
  }
  const e = clamp01((t - te) / Math.max(duration - te, 0.15));
  const fade = 1 - span(e, 0.45, 1);
  const pw = R * (0.85 - 0.55 * e);
  const top = y - 320 * (0.4 + 0.6 * Math.min(1, e * 4));
  const fl = Math.floor(t * 30);
  return (
    <g pointerEvents="none" opacity={f(fade)}>
      <defs>
        <linearGradient id="lsa-pillar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff3d00" stopOpacity="0" />
          <stop offset="0.35" stopColor="#ff6a00" stopOpacity="0.7" />
          <stop offset="0.8" stopColor="#ffc23a" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fffbe0" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="lsa-floor" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fffbe0" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#ff9a1a" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ff3d00" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={f(x)} cy={f(y)} r={f(R * 1.1)} fill="url(#lsa-floor)" />
      <path d={`M${f(x - pw)},${f(y)} Q${f(x - pw * 0.7)},${f((y + top) / 2)} ${f(x - pw * 0.25)},${f(top)} L${f(x + pw * 0.25)},${f(top)} Q${f(x + pw * 0.7)},${f((y + top) / 2)} ${f(x + pw)},${f(y)} Z`} fill="url(#lsa-pillar)" />
      <path d={`M${f(x - pw * 0.35)},${f(y)} L${f(x - pw * 0.1)},${f(top + 40)} L${f(x + pw * 0.1)},${f(top + 40)} L${f(x + pw * 0.35)},${f(y)} Z`} fill="#fffbe0" opacity={0.75} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + hs(i, 3) * 0.3;
        const bx = x + Math.cos(a) * R * 0.8;
        const by = y + Math.sin(a) * R * 0.8;
        const ht = (40 + h(i, fl) * 50) * (1 - e * 0.7);
        return <path key={i} d={`M${f(bx - 9)},${f(by)} Q${f(bx + hs(i, fl) * 8)},${f(by - ht)} ${f(bx + 2)},${f(by - ht * 1.1)} Q${f(bx + 4)},${f(by - ht * 0.5)} ${f(bx + 9)},${f(by)} Z`} fill={i % 2 ? '#ff7a12' : '#ffb636'} opacity={0.85} />;
      })}
      <GlowRing cx={x} cy={y} r={R * (0.9 + 0.5 * e)} color="#ff7a12" width={6 * (1 - e) + 1} opacity={1 - e} core="#fff2b0" />
      <Sparks cx={x} cy={y - 20} n={18} r0={10} r1={R * 1.6} k={clamp01(e * 1.3)} color="#ffd35a" seed={9} width={3} />
    </g>
  );
};

/** Light strike array cast: flare at caster's hand, rune converging on the target point. */
export const LightStrikeVfx: VfxArt = ({ t, duration, from, to, radius }) => {
  if (t > duration) return null;
  const k = prog(t, duration);
  const R = radius > 0 ? radius : 120;
  const c = span(k, 0, 0.45);
  const flare = 1 - span(k, 0, 0.35);
  return (
    <g pointerEvents="none">
      {flare > 0 && (
        <g opacity={f(flare)}>
          <circle cx={f(from.x)} cy={f(from.y - 55)} r={f(10 + 14 * (1 - flare))} fill="#ffb636" opacity={0.5} />
          <path d={star(from.x, from.y - 55, 18, 5, 4, t * 6)} fill="#fff2b0" />
        </g>
      )}
      {c < 1 && (
        <g opacity={f(bump(c))}>
          <circle cx={f(to.x)} cy={f(to.y)} r={f(R * (2.2 - 1.2 * c))} fill="none" stroke="#ff8a1a" strokeWidth={3} strokeDasharray="4 10" />
          <path d={star(to.x, to.y, R * (1.6 - 0.9 * c), R * (0.8 - 0.45 * c), 6, c * 2)} fill="none" stroke="#ffd35a" strokeWidth={1.5} />
        </g>
      )}
    </g>
  );
};
