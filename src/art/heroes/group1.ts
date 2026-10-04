// Hero art group 1 (pudge, axe, ursa, slark, phantom_assassin, juggernaut, silencer, lina)
import type { HeroArt } from '../types.ts';
import type { HeroId } from '../../core/types.ts';
import { Axe } from './axe.tsx';
import { Juggernaut } from './juggernaut.tsx';
import { Lina } from './lina.tsx';
import { PhantomAssassin } from './phantom_assassin.tsx';
import { Pudge } from './pudge.tsx';
import { Silencer } from './silencer.tsx';
import { Slark } from './slark.tsx';
import { Ursa } from './ursa.tsx';

export const heroArtGroup1: Partial<Record<HeroId, HeroArt>> = {
  pudge: Pudge,
  axe: Axe,
  ursa: Ursa,
  slark: Slark,
  phantom_assassin: PhantomAssassin,
  juggernaut: Juggernaut,
  silencer: Silencer,
  lina: Lina,
};
