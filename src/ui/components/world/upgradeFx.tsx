// Upgrade beacon (real Atomic War: a hero with a pending duplicate upgrade gets a golden light from
// above; click it to level up) and the level-up burst. Arena coordinates, feet at (x, y).
import { LEVELS_PER_UPGRADE } from '../../../core/constants.ts';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (k: number) => 1 - (1 - clamp01(k)) ** 3;
const FONT = "system-ui, 'Segoe UI', sans-serif";

/** gradients used by the beacon; render once inside <defs> */
export function UpgradeDefs() {
  return (
    <>
      <linearGradient id="aw-beacon" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff3c4" stopOpacity="0" />
        <stop offset="0.45" stopColor="#ffd968" stopOpacity="0.35" />
        <stop offset="1" stopColor="#ffc93a" stopOpacity="0.75" />
      </linearGradient>
      <radialGradient id="aw-beacon-floor">
        <stop offset="0" stopColor="#fff1b0" stopOpacity="0.85" />
        <stop offset="0.6" stopColor="#ffc93a" stopOpacity="0.35" />
        <stop offset="1" stopColor="#ffc93a" stopOpacity="0" />
      </radialGradient>
    </>
  );
}

/** light column + floor glow, drawn BEHIND the hero */
export function BeaconBack({ x, y, t }: { x: number; y: number; t: number }) {
  const p = 0.5 + 0.5 * Math.sin(t * 3.2);
  const top = Math.max(-40, y - 340);
  const wTop = 14;
  const wBot = 40 + p * 6;
  return (
    <g pointerEvents="none">
      <ellipse cx={x} cy={y} rx={56 + p * 8} ry={18 + p * 3} fill="url(#aw-beacon-floor)" opacity={0.75 + p * 0.25} />
      <path d={`M${x - wTop},${top} L${x + wTop},${top} L${x + wBot},${y} L${x - wBot},${y} Z`} fill="url(#aw-beacon)" opacity={0.55 + p * 0.3} />
      <path d={`M${x - 4},${top} L${x + 4},${top} L${x + 12},${y} L${x - 12},${y} Z`} fill="url(#aw-beacon)" opacity={0.9} />
    </g>
  );
}

/** motes, arrow and "+4 Lv" label, drawn IN FRONT of the hero */
export function BeaconFront({ x, y, t, pending }: { x: number; y: number; t: number; pending: number }) {
  const p = 0.5 + 0.5 * Math.sin(t * 3.2);
  const bob = Math.sin(t * 4) * 4;
  const ay = y - 150 + bob;
  return (
    <g pointerEvents="none">
      {/* light falling on the hero */}
      <path d={`M${x - 16},${y - 120} L${x + 16},${y - 120} L${x + 34},${y} L${x - 34},${y} Z`} fill="#fff2b8" opacity={0.1 + p * 0.08} />
      {Array.from({ length: 7 }, (_, i) => {
        const k = (t * 0.55 + i / 7) % 1;
        const mx = x + Math.sin(i * 2.3 + t * 1.5) * (10 + i * 3);
        return <circle key={i} cx={mx} cy={y - 8 - k * 150} r={2.2 * (1 - k) + 0.6} fill="#fff1a8" opacity={(1 - k) * 0.9} />;
      })}
      <g transform={`translate(${x},${ay})`}>
        <path d="M0,-18 L14,-2 L6,-2 L6,12 L-6,12 L-6,-2 L-14,-2 Z" fill="#ffd54a" stroke="#6b4300" strokeWidth={2} strokeLinejoin="round" />
        <path d="M0,-13 L8,-4 L2,-4 L2,8" fill="none" stroke="#fff7d6" strokeWidth={1.5} opacity={0.8} />
        <text
          x={0}
          y={-24}
          textAnchor="middle"
          fontSize={14}
          fontWeight={900}
          fill="#ffe27a"
          stroke="#3a2400"
          strokeWidth={3.5}
          paintOrder="stroke"
          fontFamily={FONT}
        >
          +{LEVELS_PER_UPGRADE} Lv{pending > 1 ? ` ×${pending}` : ''}
        </text>
      </g>
    </g>
  );
}

/** ~1s burst when a hero's level goes up: golden ring, rising sparks, "LEVEL UP" */
export function LevelUpBurst({ x, y, k }: { x: number; y: number; k: number }) {
  if (k < 0 || k > 1) return null;
  const e = easeOut(k);
  const fade = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
  return (
    <g pointerEvents="none" opacity={fade}>
      <ellipse cx={x} cy={y} rx={14 + e * 62} ry={5 + e * 20} fill="none" stroke="#ffd54a" strokeWidth={5 * (1 - k) + 1} />
      <ellipse cx={x} cy={y} rx={10 + e * 40} ry={4 + e * 13} fill="#ffe27a" opacity={0.3 * (1 - k)} />
      <ellipse cx={x} cy={y - 45} rx={30 * (1 - e) + 6} ry={60 * (1 - e) + 8} fill="#fff6d0" opacity={0.45 * (1 - k)} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r = 18 + e * 46;
        const sx = x + Math.cos(a) * r;
        const sy = y + Math.sin(a) * r * 0.32 - e * (50 + (i % 3) * 25);
        return <circle key={i} cx={sx} cy={sy} r={2.8 * (1 - k) + 0.8} fill={i % 2 ? '#fff1a8' : '#ffc93a'} />;
      })}
      <text
        x={x}
        y={y - 128 - e * 26}
        textAnchor="middle"
        fontSize={18 + (k < 0.15 ? (1 - k / 0.15) * 10 : 0)}
        fontWeight={900}
        letterSpacing="0.06em"
        fill="#ffd54a"
        stroke="#3a2400"
        strokeWidth={4}
        paintOrder="stroke"
        fontFamily={FONT}
      >
        LEVEL UP
      </text>
    </g>
  );
}
