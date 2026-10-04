// Zones spawned by items (currently only Radiance): a pulsing golden burn aura that follows its owner.
import type { ZoneArt } from '../../../art/types.ts';

export const ItemZone: ZoneArt = ({ t, x, y, radius }) => {
  const pulse = 0.5 + 0.5 * Math.sin(t * 6);
  const ry = radius * 0.45; // ground-plane ellipse, matches unit shadow perspective
  return (
    <g pointerEvents="none">
      <ellipse cx={x} cy={y} rx={radius} ry={ry} fill="rgba(255,170,40,0.10)" stroke="rgba(255,196,80,0.55)" strokeWidth={2 + pulse * 2} />
      <ellipse cx={x} cy={y} rx={radius * 0.7} ry={ry * 0.7} fill="none" stroke="rgba(255,120,30,0.35)" strokeDasharray="10 8" strokeDashoffset={-t * 40} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + t * 0.8;
        const k = ((t * 0.9 + i * 0.37) % 1 + 1) % 1;
        const r = radius * (0.35 + 0.6 * ((i * 0.618) % 1));
        return (
          <circle key={i} cx={x + Math.cos(a) * r} cy={y + Math.sin(a) * r * 0.45 - k * 30} r={3 * (1 - k) + 1} fill="#ffcf5a" opacity={1 - k} />
        );
      })}
    </g>
  );
};
