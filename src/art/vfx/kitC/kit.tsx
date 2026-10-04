// Shared bits for the kit-C VFX (sniper, CM, dazzle, DK, windranger, jakiro). Pure functions only.
import type { ReactNode } from 'react';
import type { Team, Vec } from '../../../core/types.ts';
import { f } from '../sig/fxkit.tsx';

export const CHEST = 40;
export const HAND = 46;
export const HEAD = 66;

/** direction a team attacks in when there is no target: left team sits at the bottom, faces up */
export const teamFwd = (team: Team): Vec => (team === 'left' ? { x: 0, y: -1 } : { x: 0, y: 1 });

/** unit direction from a to b, team forward when degenerate */
export const aim = (a: Vec, b: Vec, team: Team): Vec => {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  return d < 1 ? teamFwd(team) : { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
};

/** teardrop flame, base at (x,y), pointing towards -y in local space */
export const flamePath = (x: number, y: number, w: number, h: number, lean: number): string =>
  `M${f(x - w / 2)} ${f(y)} Q${f(x - w * 0.6 + lean * 0.4)} ${f(y - h * 0.55)} ${f(x + lean)} ${f(y - h)} Q${f(x + w * 0.6 + lean * 0.4)} ${f(y - h * 0.55)} ${f(x + w / 2)} ${f(y)} Q${f(x)} ${f(y + w * 0.3)} ${f(x - w / 2)} ${f(y)}Z`;

/** flame tongue pointing along +x, base at origin */
export const tonguePath = (len: number, w: number, wob: number): string =>
  `M0 ${f(-w / 2)} Q${f(len * 0.55)} ${f(-w * 0.6 + wob)} ${f(len)} ${f(wob * 0.5)} Q${f(len * 0.55)} ${f(w * 0.6 + wob)} 0 ${f(w / 2)} Q${f(-w * 0.3)} 0 0 ${f(-w / 2)}Z`;

/** 4-point twinkle star */
export const twinkle = (s: number): string =>
  `M0 ${f(-s)} L${f(s * 0.22)} ${f(-s * 0.22)} L${f(s)} 0 L${f(s * 0.22)} ${f(s * 0.22)} L0 ${f(s)} L${f(-s * 0.22)} ${f(s * 0.22)} L${f(-s)} 0 L${f(-s * 0.22)} ${f(-s * 0.22)}Z`;

/** ice shard (diamond spike) pointing up, base at origin */
export const shardPath = (w: number, h: number): string => `M0 0 L${f(-w / 2)} ${f(-h * 0.35)} L0 ${f(-h)} L${f(w / 2)} ${f(-h * 0.35)}Z`;

/** arrow drawn at (x,y) pointing along rot (deg) */
export const Arrow = ({ x, y, rot, color, glow, opacity = 1, len = 30, scale = 1 }: { x: number; y: number; rot: number; color: string; glow: string; opacity?: number; len?: number; scale?: number }): ReactNode => (
  <g transform={`translate(${f(x)},${f(y)}) rotate(${f(rot)}) scale(${f(scale)})`} opacity={f(opacity)}>
    <path d={`M${f(-len * 2.2)} 0 L0 0`} stroke={glow} strokeWidth={8} strokeOpacity={0.18} strokeLinecap="round" />
    <path d={`M${f(-len * 1.6)} 0 L0 0`} stroke={glow} strokeWidth={3.5} strokeOpacity={0.45} strokeLinecap="round" />
    <path d={`M${f(-len)} 0 L0 0`} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <path d="M7 0 L-5 -5 L-3 0 L-5 5 Z" fill="#ffffff" stroke={color} strokeWidth={1} />
    <path d={`M${f(-len)} 0 l-6 -5 M${f(-len)} 0 l-6 5 M${f(-len + 5)} 0 l-6 -5 M${f(-len + 5)} 0 l-6 5`} stroke={color} strokeWidth={1.6} />
  </g>
);

/** dizzy stun stars orbiting above a head */
export const StunStars = ({ x, y, t, opacity, color = '#ffe36a', n = 3 }: { x: number; y: number; t: number; opacity: number; color?: string; n?: number }): ReactNode => {
  if (opacity <= 0) return null;
  const out: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = t * 7 + (i / n) * Math.PI * 2;
    const px = x + Math.cos(a) * 16;
    const py = y + Math.sin(a) * 5;
    out.push(<path key={i} d={twinkle(5)} transform={`translate(${f(px)},${f(py)})`} fill={color} stroke="#7a4a00" strokeWidth={0.6} />);
  }
  return (
    <g opacity={f(opacity)}>
      <ellipse cx={f(x)} cy={f(y)} rx={16} ry={5} fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={1} />
      {out}
    </g>
  );
};
