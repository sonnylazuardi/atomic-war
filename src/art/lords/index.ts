// Full-body lord ("summoner") art. Every lord gets a HeroArt (HeroArtProps contract): four reuse the
// matching hero art, four are bespoke figures.
import type { HeroId, LordId } from '../../core/types.ts';
import { getHeroArt } from '../registry.tsx';
import type { HeroArt } from '../types.ts';
import { AlchemistLord } from './alchemist.tsx';
import { BloodseekerLord } from './bloodseeker.tsx';
import { BountyHunterLord } from './bountyHunter.tsx';
import { OmniknightLord } from './omniknight.tsx';
import { EmberSpiritLord } from './emberSpirit.tsx';
import { InvokerLord } from './invoker.tsx';
import { LunaLord } from './luna.tsx';
import { NagaSirenLord } from './nagaSiren.tsx';
import { RikiLord } from './riki.tsx';
import { RubickLord } from './rubick.tsx';
import { SpiritBreakerLord } from './spiritBreaker.tsx';

export { LordIcon } from './icons.tsx';
export { SummonerAmbient, SummonerBackdrop } from './backdrop.tsx';

const HERO_LORDS: Partial<Record<LordId, HeroId>> = {
  pudge_lord: 'pudge',
  axe_lord: 'axe',
  tinker_lord: 'tinker',
  sniper_lord: 'sniper',
  zeus_lord: 'zeus',
  juggernaut_lord: 'juggernaut',
  phantom_assassin_lord: 'phantom_assassin',
};

const BESPOKE: Partial<Record<LordId, HeroArt>> = {
  alchemist: AlchemistLord,
  bounty_hunter: BountyHunterLord,
  omniknight: OmniknightLord,
  rubick: RubickLord,
  ember_spirit: EmberSpiritLord,
  naga_siren: NagaSirenLord,
  spirit_breaker: SpiritBreakerLord,
  riki: RikiLord,
  invoker: InvokerLord,
  luna: LunaLord,
  bloodseeker: BloodseekerLord,
};

export function getLordArt(id: LordId): HeroArt {
  const own = BESPOKE[id];
  if (own) return own;
  return getHeroArt(HERO_LORDS[id] ?? 'pudge');
}

/** true when the art is a reused battle hero (draws a team ring the summoner screen hides) */
export const isHeroLordArt = (id: LordId) => !!HERO_LORDS[id];
