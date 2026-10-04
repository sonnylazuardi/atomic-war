// Soft radial glow for summoner figures (gradient instead of stacked discs: these render ~3x larger).
import { useId } from 'react';

export function SoftGlow({ x, y, r, c, o = 1, ry }: { x: number; y: number; r: number; c: string; o?: number; ry?: number }) {
  const id = useId().replace(/:/g, '');
  if (r <= 0.05 || o <= 0.01) return null;
  return (
    <g>
      <defs>
        <radialGradient id={`sg${id}`}>
          <stop offset="0" stopColor={c} stopOpacity={0.75} />
          <stop offset="0.45" stopColor={c} stopOpacity={0.3} />
          <stop offset="1" stopColor={c} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={Math.round(x * 100) / 100} cy={Math.round(y * 100) / 100} rx={Math.round(r * 100) / 100} ry={Math.round((ry ?? r) * 100) / 100} fill={`url(#sg${id})`} opacity={Math.round(o * 100) / 100} />
    </g>
  );
}
