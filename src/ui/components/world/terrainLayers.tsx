// Terrain layers for the World: a memoized static Ground per terrain id (falls back to the v1 stone
// arena floor while a terrain is not drawn yet) and the animated Ambient layer.
import { memo } from 'react';
import type { TerrainId } from '../../../core/types.ts';
import { TERRAINS, getTerrain } from '../../../art/terrain/index.ts';
import { Ground as FallbackGround, Vignette } from '../arena/Ground.tsx';

export const GroundLayer = memo(function GroundLayer({ id }: { id: TerrainId }) {
  const def = TERRAINS[id];
  if (!def) {
    return (
      <g>
        <FallbackGround />
        <Vignette />
      </g>
    );
  }
  const G = def.Ground;
  return <G />;
});

export function AmbientLayer({ id, t }: { id: TerrainId; t: number }) {
  const A = getTerrain(id).Ambient;
  return (
    <g pointerEvents="none">
      <A t={t} />
    </g>
  );
}

/** cross-fade bookkeeping: `cur` fades in over `prev` */
export interface TerrainFade {
  cur: TerrainId;
  prev: TerrainId | null;
  start: number; // clock seconds
}

export const TERRAIN_FADE = 0.6;

export function setTerrain(f: TerrainFade, id: TerrainId, now: number) {
  if (f.cur === id) return;
  // a fade interrupted mid-way restarts from whatever is mostly visible
  const k = fadeK(f, now);
  f.prev = k < 0.5 && f.prev ? f.prev : f.cur;
  f.cur = id;
  f.start = now;
  if (f.prev === id) f.prev = null;
}

export function fadeK(f: TerrainFade, now: number) {
  if (!f.prev) return 1;
  const k = (now - f.start) / TERRAIN_FADE;
  return k >= 1 ? 1 : k <= 0 ? 0 : k * k * (3 - 2 * k);
}

/** renders prev (fading out) under cur (fading in) */
export function TerrainGround({ f, now }: { f: TerrainFade; now: number }) {
  const k = fadeK(f, now);
  if (k >= 1 && f.prev) f.prev = null;
  return (
    <g>
      {f.prev && (
        <g key={f.prev}>
          <GroundLayer id={f.prev} />
        </g>
      )}
      <g key={f.cur} opacity={k < 1 ? k : undefined}>
        <GroundLayer id={f.cur} />
      </g>
    </g>
  );
}

export function TerrainAmbient({ f, now }: { f: TerrainFade; now: number }) {
  const k = fadeK(f, now);
  return (
    <g>
      {f.prev && k < 1 && (
        <g key={f.prev} opacity={1 - k}>
          <AmbientLayer id={f.prev} t={now} />
        </g>
      )}
      <g key={f.cur} opacity={k < 1 ? k : undefined}>
        <AmbientLayer id={f.cur} t={now} />
      </g>
    </g>
  );
}
