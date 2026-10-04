// Terrain registry: one themed arena per player (see core `terrainForPlayer`).
import type { TerrainId } from '../../core/types.ts';
import type { TerrainDef } from '../types.ts';
import { autumnTerrain } from './autumn.tsx';
import { desertTerrain } from './desert.tsx';
import { direTerrain } from './dire.tsx';
import { jungleTerrain } from './jungle.tsx';
import { snowTerrain } from './snow.tsx';
import { springTerrain } from './spring.tsx';
import { swampTerrain } from './swamp.tsx';
import { templeTerrain } from './temple.tsx';

const Blank = () => null;

export const TERRAINS: Partial<Record<TerrainId, TerrainDef>> = {
  snow: snowTerrain,
  autumn: autumnTerrain,
  spring: springTerrain,
  desert: desertTerrain,
  dire: direTerrain,
  jungle: jungleTerrain,
  swamp: swampTerrain,
  temple: templeTerrain,
};

export const getTerrain = (id: TerrainId): TerrainDef =>
  TERRAINS[id] ?? { id, name: id, accent: '#c9a45c', Ground: Blank, Ambient: Blank };
