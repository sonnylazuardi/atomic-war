// Hero art group 2: zeus, enigma, tinker, medusa, drow_ranger, sniper, crystal_maiden, dazzle
import type { HeroArt } from '../types.ts';
import type { HeroId } from '../../core/types.ts';
import { Enigma } from './enigma.tsx';
import { Tinker } from './tinker.tsx';
import { Medusa } from './medusa.tsx';
import { DrowRanger } from './drow_ranger.tsx';
import { Sniper } from './sniper.tsx';
import { CrystalMaiden } from './crystal_maiden.tsx';
import { Dazzle } from './dazzle.tsx';
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
};
