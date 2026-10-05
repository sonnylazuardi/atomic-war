// Game tuning knobs. Single source of truth for economy and arena geometry.

export const PLAYER_COUNT = 8;
export const PLAYER_START_HP = 100;

export const ARENA_W = 1000;
export const ARENA_H = 600;
// Formation: col = depth (0 = front row, nearest the center line), row = lane across the arena.
export const BOARD_COLS = 3;
export const BOARD_ROWS = 4;
export const BENCH_SIZE = 0; // no bench: like the real game, every hero you own stands in the arena

export const SIM_HZ = 20;
export const SIM_DT = 1 / SIM_HZ;
export const BATTLE_TIME_LIMIT = 45; // seconds

export const MAX_HERO_LEVEL = 30;
export const LEVELS_PER_UPGRADE = 4;
/** a freshly recruited hero's level; each duplicate pick adds +4: 6, 10, 14, 18, 22, 26, 30 */
export const START_HERO_LEVEL = 6;
export const ITEM_SLOTS = 6; // Items tab of the hero roster
export const MAX_SHOP_LEVEL = 6; // tavern
export const HERO_OFFERS = 5; // real game shows 5 heroes in the Mystery shop
/** seconds of preparation before auto-ready (UI timer). `?prep=0` disables it. */
export const PREP_TIME = 32;
/** seconds the round result is shown before the next preparation starts */
export const RESULTS_TIME = 4;

/** Tavern level (1..6) -> % chance of each star 1★..6★ for every Mystery-shop offer. Rows sum to 100.
 *  ITEM LEVEL IS GATED BY THE TAVERN: an item's ★ (its level) never exceeds the tavern level — e.g. Black
 *  King Bar (5★) needs tavern 5, Aghanim's Scepter (4★) tavern 4. Level 5 matches the real game tooltip
 *  (13/25/36/18/8/0). Heroes and spells roll one tavern level ahead (they cap at 5★). */
export const TAVERN_ODDS: readonly (readonly number[])[] = [
  [100, 0, 0, 0, 0, 0],
  [65, 35, 0, 0, 0, 0],
  [40, 38, 22, 0, 0, 0],
  [25, 33, 28, 14, 0, 0],
  [13, 25, 36, 18, 8, 0],
  [8, 17, 30, 25, 13, 7],
];

export const HERO_COST = 3;
export const SPELL_COST = 3;
export const REFRESH_COST = 1;
export const SELL_HERO = 2;
export const SELL_SPELL = 2; // buy 3 -> sell 2, same as heroes
export const SELL_ITEM = 2; // for a 3-coin item; pricier items sell for cost - 1 (itemSellValue)
export const itemSellValue = (cost: number) => Math.max(1, cost - 1);
export const LORD_CHOICES = 4; // "Choose Your Summoner" shows 4

/** Coins each preparation (they do NOT carry over): 4 + round, capped at 15 -> 5, 6, 7 ... 15 by round 11.
 *  Paced against the tavern prices (4/6/8/9/12): each step is affordable about when it matters, but always
 *  competes with buying units that round. */
export const incomeForRound = (round: number) => Math.min(15, 4 + round);
/** win/loss streak bonus: +1 coin at a 3-round streak, +2 at 5+ (comeback for losers, reward for winners) */
export const streakBonus = (streak: number) => (Math.abs(streak) >= 5 ? 2 : Math.abs(streak) >= 3 ? 1 : 0);
/** max heroes in the arena — fixed at 5 (the real game's limit); buying is otherwise only limited by gold */
export const MAX_HEROES = 5;
export const boardCap = (_round: number) => MAX_HEROES;
/** tavern upgrade price from the current level: 1->2 costs 4, 2->3 6, 3->4 8, 4->5 9, 5->6 12 (6 = max) */
const TAVERN_UPGRADE_COSTS = [4, 6, 8, 9, 12];
export const shopUpgradeCost = (level: number) => TAVERN_UPGRADE_COSTS[Math.max(1, level) - 1] ?? 12;
/** offers of spells and items each — one more per tavern level: 2, 3, 4, 5, 5, 5 */
export const offersForShopLevel = (level: number) => Math.min(5, 1 + level);
/** max item tier that can appear at a tavern level (derived from TAVERN_ODDS) */
export const maxItemTier = (shopLevel: number) => {
  const row = TAVERN_ODDS[Math.min(MAX_SHOP_LEVEL, Math.max(1, shopLevel)) - 1]!;
  let max = 1;
  row.forEach((p, i) => p > 0 && (max = i + 1));
  return max;
};
/** Skills tab of the hero roster: 5 slots from level 1 (slot 0 = signature, fixed) */
export const SPELL_SLOTS = 5;
export const spellSlotsForLevel = (_level: number) => SPELL_SLOTS;
/** damage the loser takes */
export const lossDamage = (round: number, survivorLevels: number[]) =>
  2 + round + survivorLevels.reduce((s, l) => s + 1 + Math.floor(l / 10), 0);

/** board slot -> arena spawn position (feet). Top-down camera like the real game: team 'left' (the
 *  host / the human in the World view) stands on the BOTTOM half facing up, team 'right' on the TOP half.
 *  Lanes stay clear of the HUD side panels; depth rows stay clear of the top bar and bottom dock. */
export const slotToArena = (col: number, row: number, team: 'left' | 'right') => {
  const x = 290 + row * 140; // lanes 290 .. 710
  const depth = 60 + col * 55; // front 60 .. back 170 from the center line -> y 130..470, inside FLOOR
  return { x, y: team === 'left' ? ARENA_H / 2 + depth : ARENA_H / 2 - depth };
};
/** Walkable floor (unit feet) inside the arena walls: below the top wall face + HUD top bar, above the
 *  bottom wall, clear of the side walls. The sim clamps every unit to it so nobody fights "outside". */
export const FLOOR = { x0: 70, x1: 930, y0: 130, y1: 550 } as const;

/** which way a team advances along y: left (bottom) moves up (-1), right (top) moves down (+1) */
export const teamDirY = (team: 'left' | 'right') => (team === 'left' ? -1 : 1);

import type { TerrainId } from './types.ts';
export const TERRAIN_IDS: readonly TerrainId[] = ['snow', 'autumn', 'spring', 'desert', 'dire', 'jungle', 'swamp', 'temple'];
/** every player owns one arena terrain for the whole game */
export const terrainForPlayer = (playerId: number, seed: number): TerrainId =>
  TERRAIN_IDS[(playerId + seed) % TERRAIN_IDS.length]!;
