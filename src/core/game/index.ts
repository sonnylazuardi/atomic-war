// Public API of core/game. All reducers are pure: (state, playerId, ...args) => newState.
export * from './match.ts';
export * from './shop.ts';
export * from './roster.ts';
export * from './lords.ts';
export { botPrep, botPrepM, botPickLord, spellScore } from './bots.ts';
export { viewFor } from './view.ts';
export {
  boardCount,
  benchCount,
  fighters,
  boardOrder,
  firstFreeSlot,
  findHero,
  isInnate,
  cloneState,
  type GS,
  type MatchExtras,
} from './util.ts';
