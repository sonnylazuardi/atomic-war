// Full-body lord ("summoner") art. Every lord gets a HeroArt (HeroArtProps contract): four reuse the
// matching hero art, four are bespoke figures.
import type { HeroId, LordId } from '../../core/types.ts';
import { getHeroArt } from '../registry.tsx';
import type { HeroArt } from '../types.ts';
import { AlchemistLord } from './alchemist.tsx';
import { BountyHunterLord } from './bountyHunter.tsx';
import { OmniknightLord } from './omniknight.tsx';
import { RubickLord } from './rubick.tsx';

export { LordIcon } from './icons.tsx';
export { SummonerAmbient, SummonerBackdrop } from './backdrop.tsx';

const HERO_LORDS: Partial<Record<LordId, HeroId>> = {
  ursa_lord: 'ursa',
  pudge_lord: 'pudge',
  axe_lord: 'axe',
  tinker_lord: 'tinker',
};

const BESPOKE: Partial<Record<LordId, HeroArt>> = {
  alchemist: AlchemistLord,
  bounty_hunter: BountyHunterLord,
  omniknight: OmniknightLord,
  rubick: RubickLord,
};

export function getLordArt(id: LordId): HeroArt {
  const own = BESPOKE[id];
  if (own) return own;
  return getHeroArt(HERO_LORDS[id] ?? 'pudge');
}

/** true when the art is a reused battle hero (draws a team ring the summoner screen hides) */
export const isHeroLordArt = (id: LordId) => !!HERO_LORDS[id];
