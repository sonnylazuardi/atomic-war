// Gallery helpers: fake OwnedHeroes matching makeFakeBattle() uids (L1/L2 left, R1/R2 right).
import type { BoardSlot, HeroDef, HeroId, OwnedHero } from '../../../core/types.ts';
import { HEROES } from '../../../core/data/index.ts';
import { ITEM_SLOTS, spellSlotsForLevel } from '../../../core/constants.ts';

export function fakeOwnedHero(uid: string, heroId: HeroId, level: number, slot: BoardSlot | null): OwnedHero {
  const def = (HEROES as Partial<Record<HeroId, HeroDef>>)[heroId];
  const spells = Array.from({ length: spellSlotsForLevel(level) }, (_, i) => (i === 0 && def ? def.signature : null));
  return {
    uid,
    heroId,
    level,
    pendingUpgrades: 0,
    spells,
    items: Array.from({ length: ITEM_SLOTS }, () => null),
    stacks: { str: 0, agi: 0, int: 0 },
    slot,
    kills: 0,
  };
}

/** the human's board in makeFakeBattle() for each side */
export const fakeBattleHeroes = (side: 'left' | 'right'): OwnedHero[] =>
  side === 'left'
    ? [fakeOwnedHero('L1', 'pudge', 5, { col: 0, row: 1 }), { ...fakeOwnedHero('L2', 'lina', 9, { col: 2, row: 0 }), items: ['aghanims_scepter', null, null] }]
    : [fakeOwnedHero('R1', 'axe', 5, { col: 0, row: 1 }), fakeOwnedHero('R2', 'drow_ranger', 13, { col: 2, row: 2 })];
