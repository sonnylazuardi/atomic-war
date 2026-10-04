// Hero art group 2: zeus, enigma, tinker, medusa, drow_ranger, sniper, crystal_maiden, dazzle,
// dragon_knight, windranger, jakiro
import type { HeroArt } from '../types.ts';
import type { HeroId } from '../../core/types.ts';
import { CrystalMaiden } from './crystal_maiden.tsx';
import { Dazzle } from './dazzle.tsx';
import { DragonKnight } from './dragon_knight.tsx';
import { DrowRanger } from './drow_ranger.tsx';
import { Enigma } from './enigma.tsx';
import { Jakiro } from './jakiro.tsx';
import { Medusa } from './medusa.tsx';
import { Sniper } from './sniper.tsx';
import { Tinker } from './tinker.tsx';
import { Windranger } from './windranger.tsx';
import { Zeus } from './zeus.tsx';

export const heroArtGroup2: Partial<Record<HeroId, HeroArt>> = {
  zeus: Zeus,
  enigma: Enigma,
  tinker: Tinker,
  medusa: Medusa,
  drow_ranger: DrowRanger,
  sniper: Sniper,
  crystal_maiden: CrystalMaiden,
  dazzle: Dazzle,
  dragon_knight: DragonKnight,
  windranger: Windranger,
  jakiro: Jakiro,
};
