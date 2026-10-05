// Shared bits for the kit-D VFX (riki, clinkz, spectre, muerta). Pure functions only.
import type { ReactNode } from 'react';
import { f } from '../sig/fxkit.tsx';

/** ghost / apparition silhouette, tail tip at origin, head up (-y). wob sways the tail */
export const ghostPath = (w: number, h: number, wob: number): string =>
  `M${f(-w / 2)} ${f(-h * 0.55)} C${f(-w / 2)} ${f(-h * 1.08)} ${f(w / 2)} ${f(-h * 1.08)} ${f(w / 2)} ${f(-h * 0.55)} Q${f(w * 0.42 + wob * 0.3)} ${f(-h * 0.22)} ${f(wob)} 0 Q${f(-w * 0.42 + wob * 0.3)} ${f(-h * 0.22)} ${f(-w / 2)} ${f(-h * 0.55)}Z`;

/** a ghost with eyes, tail at (x,y) */
export const Ghost = ({ x, y, w, h, wob, color, core, opacity = 1, eyes = '#140a24' }: { x: number; y: number; w: number; h: number; wob: number; color: string; core: string; opacity?: number; eyes?: string }): ReactNode => {
  if (opacity <= 0) return null;
  return (
    <g transform={`translate(${f(x)},${f(y)})`} opacity={f(opacity)}>
      <path d={ghostPath(w * 1.35, h * 1.15, wob * 1.2)} fill={color} opacity={0.25} />
      <path d={ghostPath(w, h, wob)} fill={color} opacity={0.75} />
      <path d={ghostPath(w * 0.55, h * 0.8, wob * 0.6)} fill={core} opacity={0.55} transform={`translate(0,${f(-h * 0.08)})`} />
      <ellipse cx={f(-w * 0.17)} cy={f(-h * 0.7)} rx={f(w * 0.09)} ry={f(w * 0.13)} fill={eyes} />
      <ellipse cx={f(w * 0.17)} cy={f(-h * 0.7)} rx={f(w * 0.09)} ry={f(w * 0.13)} fill={eyes} />
    </g>
  );
};

/** small cartoon skull centered at (x,y) with radius r */
export const Skull = ({ x, y, r, color, eyes, opacity = 1 }: { x: number; y: number; r: number; color: string; eyes: string; opacity?: number }): ReactNode => {
  if (opacity <= 0 || r <= 0) return null;
  return (
    <g transform={`translate(${f(x)},${f(y)})`} opacity={f(opacity)}>
      <circle r={f(r)} fill={color} />
      <rect x={f(-r * 0.55)} y={f(r * 0.55)} width={f(r * 1.1)} height={f(r * 0.55)} rx={f(r * 0.15)} fill={color} />
      <circle cx={f(-r * 0.38)} cy={f(r * 0.05)} r={f(r * 0.27)} fill={eyes} />
      <circle cx={f(r * 0.38)} cy={f(r * 0.05)} r={f(r * 0.27)} fill={eyes} />
      <path d={`M0 ${f(r * 0.3)} L${f(-r * 0.12)} ${f(r * 0.55)} L${f(r * 0.12)} ${f(r * 0.55)}Z`} fill={eyes} />
      <path d={`M${f(-r * 0.3)} ${f(r * 0.8)} L${f(-r * 0.3)} ${f(r * 1.08)} M0 ${f(r * 0.8)} L0 ${f(r * 1.08)} M${f(r * 0.3)} ${f(r * 0.8)} L${f(r * 0.3)} ${f(r * 1.08)}`} stroke={eyes} strokeWidth={f(Math.max(0.6, r * 0.1))} />
    </g>
  );
};

/** dagger blade pointing +x, hilt at origin */
export const daggerPath = (len: number, w: number): string =>
  `M0 ${f(-w / 2)} L${f(len * 0.78)} ${f(-w * 0.42)} L${f(len)} 0 L${f(len * 0.78)} ${f(w * 0.42)} L0 ${f(w / 2)}Z`;

/** soft smoke puff (stacked circles) */
export const Puff = ({ x, y, r, color, opacity }: { x: number; y: number; r: number; color: string; opacity: number }): ReactNode => {
  if (opacity <= 0 || r <= 0) return null;
  return (
    <g opacity={f(opacity)}>
      <circle cx={f(x)} cy={f(y)} r={f(r)} fill={color} opacity={0.45} />
      <circle cx={f(x - r * 0.35)} cy={f(y - r * 0.25)} r={f(r * 0.6)} fill={color} opacity={0.5} />
      <circle cx={f(x + r * 0.3)} cy={f(y - r * 0.15)} r={f(r * 0.5)} fill={color} opacity={0.4} />
    </g>
  );
};

/** marigold blossom (Muerta) */
export const Marigold = ({ x, y, r, rot, opacity = 1 }: { x: number; y: number; r: number; rot: number; opacity?: number }): ReactNode => {
  if (opacity <= 0) return null;
  const petals: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    petals.push(<ellipse key={i} cx={f(r * 0.55)} cy={0} rx={f(r * 0.5)} ry={f(r * 0.28)} fill={i % 2 ? '#ffb020' : '#ff8a10'} transform={`rotate(${f(i * 45)})`} />);
  }
  return (
    <g transform={`translate(${f(x)},${f(y)}) rotate(${f(rot)})`} opacity={f(opacity)}>
      {petals}
      <circle r={f(r * 0.35)} fill="#ffd860" />
    </g>
  );
};
