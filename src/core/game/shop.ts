// Shop: rolling offers, buying, refresh, upgrade, lock.
import {
  START_HERO_LEVEL,
  LEVELS_PER_UPGRADE,
  MAX_HERO_LEVEL,
  BENCH_SIZE,
  HERO_COST,
  HERO_OFFERS,
  ITEM_SLOTS,
  MAX_SHOP_LEVEL,
  SPELL_SLOTS,
  TAVERN_ODDS,
  boardCap,
  offersForShopLevel,
  shopUpgradeCost,
} from '../constants.ts';
import { HEROES } from '../data/heroes.ts';
import { ITEMS } from '../data/items.ts';
import { SPELLS } from '../data/spells.ts';
import { HERO_IDS, HERO_KITS, ITEM_IDS, LORD_SPELL_IDS, SPELL_IDS } from '../ids.ts';
import type { Rng } from '../rng.ts';
import type { GameState, HeroId, ItemId, OwnedHero, PlayerState, SpellId, Stars } from '../types.ts';
import { addLevels, refreshCostFor, spellCostFor } from './lords.ts';
import { log, say, benchCount, boardCount, fail, firstFreeSlot, heroName, pure, withRng, type GS } from './util.ts';

export function itemCost(id: ItemId): number {
  return ITEMS[id]?.cost ?? 3;
}

// ---------------------------------------------------------------- ★ odds

const clampLevel = (level: number) => Math.min(MAX_SHOP_LEVEL, Math.max(1, Math.floor(level) || 1));

/** % chance of each star 1★..6★ for a Mystery-shop offer at tavern `level` (1..6). Sums to 100. */
export function tavernOdds(level: number): number[] {
  return [...TAVERN_ODDS[clampLevel(level) - 1]!];
}

/** Rarity of any shop content. Items: tier (1..6); heroes/spells: stars (1..5). */
export function starsOf(kind: 'hero' | 'spell' | 'item', id: string): Stars {
  if (kind === 'hero') return HEROES[id as HeroId]?.stars ?? 1;
  if (kind === 'spell') return SPELLS[id as SpellId]?.stars ?? 1;
  return ITEMS[id as ItemId]?.tier ?? 1;
}

/** Roll a star 1..6 from the tavern odds. */
export function rollStar(rng: Rng, shopLevel: number): Stars {
  const row = TAVERN_ODDS[clampLevel(shopLevel) - 1]!;
  let r = rng.next() * 100;
  for (let i = 0; i < row.length; i++) {
    r -= row[i]!;
    if (r < 0) return (i + 1) as Stars;
  }
  let last = 1;
  row.forEach((p, i) => p > 0 && (last = i + 1));
  return last as Stars;
}

/**
 * Pick `n` distinct ids: each offer rolls a star, capped at `maxStar`, then a random id of that star.
 * Empty star bucket -> nearest lower non-empty star (or nearest higher if nothing lower is left).
 */
function rollByStars<T extends string>(
  rng: Rng,
  shopLevel: number,
  n: number,
  pool: readonly T[],
  starOf: (id: T) => number,
  maxStar: number,
  exclude: readonly (T | null)[],
): T[] {
  const buckets = new Map<number, T[]>();
  for (const id of pool) {
    if (exclude.includes(id)) continue;
    const raw = Math.max(1, starOf(id));
    if (raw > maxStar) continue; // above the cap (items: above the tavern level) -> never offered
    const st = raw;
    const b = buckets.get(st);
    if (b) b.push(id);
    else buckets.set(st, [id]);
  }
  const out: T[] = [];
  const nonEmpty = (st: number) => (buckets.get(st)?.length ?? 0) > 0;
  while (out.length < n) {
    const want = Math.min(maxStar, rollStar(rng, shopLevel));
    let st = 0;
    for (let k = want; k >= 1 && !st; k--) if (nonEmpty(k)) st = k;
    for (let k = want + 1; k <= maxStar && !st; k++) if (nonEmpty(k)) st = k;
    if (!st) break;
    const b = buckets.get(st)!;
    const idx = Math.floor(rng.next() * b.length);
    out.push(b[idx]!);
    b.splice(idx, 1);
  }
  return out;
}

/** lord-only spells (Charge of Darkness, Sleight of Fist) never roll in the shop */
const SHOP_SPELLS: SpellId[] = (SPELL_IDS as readonly SpellId[]).filter(
  (id) => !SPELLS[id]?.lordOnly && !(LORD_SPELL_IDS as readonly string[]).includes(id),
);
const SHOP_ITEMS: ItemId[] = ITEM_IDS.filter((id) => ITEMS[id] && !ITEMS[id].lordOnly);

export function rollItems(rng: Rng, shopLevel: number, n: number, exclude: readonly (ItemId | null)[] = []): ItemId[] {
  // item level gate: nothing above the tavern level can ever appear
  return rollByStars(rng, shopLevel, n, SHOP_ITEMS, (id) => ITEMS[id]?.tier ?? 1, Math.min(6, clampLevel(shopLevel)), exclude);
}

export function rollSpells(rng: Rng, shopLevel: number, n: number, exclude: readonly (SpellId | null)[] = []): SpellId[] {
  return rollByStars(rng, clampLevel(shopLevel + 1), n, SHOP_SPELLS, (id) => SPELLS[id]?.stars ?? 1, 5, exclude);
}

export function rollHeroes(rng: Rng, shopLevel: number, n: number, exclude: readonly (HeroId | null)[] = []): HeroId[] {
  return rollByStars(rng, clampLevel(shopLevel + 1), n, HERO_IDS as readonly HeroId[], (id) => HEROES[id]?.stars ?? 1, 5, exclude);
}

/** Fully re-roll a player's shop (ignores lock). Mutates. */
export function rollShop(s: GameState, p: PlayerState) {
  withRng(s, (rng) => {
    const n = offersForShopLevel(p.shopLevel);
    p.shop.heroOffers = rollHeroes(rng, p.shopLevel, HERO_OFFERS);
    p.shop.spellOffers = rollSpells(rng, p.shopLevel, n);
    p.shop.itemOffers = rollItems(rng, p.shopLevel, n);
  });
}

/** Locked shop at the start of a new round: keep the offers the player didn't buy (same positions)
 *  and fill every emptied slot (null = bought) with a fresh roll — heroes, spells and items. */
export function refillShop(s: GameState, p: PlayerState) {
  withRng(s, (rng) => {
    const fill = <T,>(offers: (T | null)[], count: number, roll: (n: number, exclude: (T | null)[]) => T[]) => {
      while (offers.length < count) offers.push(null);
      const empty = offers.reduce<number[]>((acc, o, i) => (o === null ? [...acc, i] : acc), []);
      if (!empty.length) return offers;
      const fresh = roll(empty.length, offers);
      empty.forEach((i, k) => (offers[i] = fresh[k] ?? null));
      return offers;
    };
    const n = offersForShopLevel(p.shopLevel);
    p.shop.heroOffers = fill(p.shop.heroOffers, HERO_OFFERS, (k, ex) => rollHeroes(rng, p.shopLevel, k, ex));
    p.shop.spellOffers = fill(p.shop.spellOffers, n, (k, ex) => rollSpells(rng, p.shopLevel, k, ex));
    p.shop.itemOffers = fill(p.shop.itemOffers, n, (k, ex) => rollItems(rng, p.shopLevel, k, ex));
  });
}

/** Append offers for the slots gained by going from shop level `from` to `to`. */
export function rollExtraOffers(s: GameState, p: PlayerState, from: number, to: number) {
  const extra = offersForShopLevel(to) - offersForShopLevel(from);
  if (extra <= 0) return;
  withRng(s, (rng) => {
    p.shop.spellOffers.push(...rollSpells(rng, to, extra, p.shop.spellOffers));
    p.shop.itemOffers.push(...rollItems(rng, to, extra, p.shop.itemOffers));
  });
}

export function emptyShop() {
  return { heroOffers: [], spellOffers: [], itemOffers: [], locked: false };
}

/** Create a fresh level-1 hero (not placed). */
export function makeHero(s: GameState, pid: number, heroId: HeroId): OwnedHero {
  const uid = withRng(s, (rng) => `p${pid}-${heroId}-${rng.int(0, 0x7fffffff).toString(36)}`);
  // the hero's real Dota kit [Q, W, E, R] (innate) + free slot(s)
  const spells: (SpellId | null)[] = [...HERO_KITS[heroId]].slice(0, SPELL_SLOTS);
  while (spells.length < SPELL_SLOTS) spells.push(null);
  return {
    uid,
    heroId,
    level: START_HERO_LEVEL,
    pendingUpgrades: 0,
    spells,
    items: Array.from({ length: ITEM_SLOTS }, () => null),
    stacks: { str: 0, agi: 0, int: 0 },
    slot: null,
    kills: 0,
  };
}

/** Whether buying offer `heroId` would succeed space-wise. */
export function canTakeHero(s: GameState, p: PlayerState, heroId: HeroId): boolean {
  if (p.heroes.some((h) => h.heroId === heroId)) return true;
  return boardCount(p) < boardCap(s.round) || benchCount(p) < BENCH_SIZE;
}

export function buyHeroM(s: GS, pid: number, offerIdx: number) {
  const p = s.players[pid];
  if (!p) return;
  if (s.phase !== 'prep') return fail(s, p, 'You can only shop during prep.');
  const heroId = p.shop.heroOffers[offerIdx];
  if (!heroId) return fail(s, p, 'That offer is sold out.');
  if (p.coins < HERO_COST) return fail(s, p, 'Not enough coins.');
  const owned = p.heroes.find((h) => h.heroId === heroId);
  if (owned) {
    // like the real game: picking a hero you already own levels it up on the spot
    if (owned.level >= MAX_HERO_LEVEL) return fail(s, p, `${heroName(heroId)} is already max level.`);
    addLevels(owned, LEVELS_PER_UPGRADE);
    if (p.isHuman) say(s, p, `${heroName(heroId)} upgraded to Lv ${owned.level}!`);
  } else {
    let slot = null;
    if (boardCount(p) < boardCap(s.round)) slot = firstFreeSlot(p, heroId);
    if (!slot && benchCount(p) >= BENCH_SIZE) return fail(s, p, `You can field at most ${boardCap(s.round)} heroes — sell one first.`);
    const h = makeHero(s, pid, heroId);
    h.slot = slot;
    p.heroes.push(h);
    if (p.isHuman) say(s, p, `Recruited ${heroName(heroId)}.`);
  }
  p.coins -= HERO_COST;
  p.shop.heroOffers[offerIdx] = null;
}

export function buySpellM(s: GS, pid: number, offerIdx: number) {
  const p = s.players[pid];
  if (!p) return;
  if (s.phase !== 'prep') return fail(s, p, 'You can only shop during prep.');
  const id = p.shop.spellOffers[offerIdx];
  if (!id) return fail(s, p, 'That offer is sold out.');
  const cost = spellCostFor(p);
  if (p.coins < cost) return fail(s, p, 'Not enough coins.');
  p.coins -= cost;
  p.spellInventory.push(id);
  p.shop.spellOffers[offerIdx] = null;
}

export function buyItemM(s: GS, pid: number, offerIdx: number) {
  const p = s.players[pid];
  if (!p) return;
  if (s.phase !== 'prep') return fail(s, p, 'You can only shop during prep.');
  const id = p.shop.itemOffers[offerIdx];
  if (!id) return fail(s, p, 'That offer is sold out.');
  const cost = itemCost(id);
  if (p.coins < cost) return fail(s, p, 'Not enough coins.');
  p.coins -= cost;
  p.itemInventory.push(id);
  p.shop.itemOffers[offerIdx] = null;
}

export function refreshShopM(s: GS, pid: number) {
  const p = s.players[pid];
  if (!p) return;
  if (s.phase !== 'prep') return fail(s, p, 'You can only shop during prep.');
  const cost = refreshCostFor(p);
  if (p.coins < cost) return fail(s, p, 'Not enough coins.');
  p.coins -= cost;
  if (p.lordId === 'tinker_lord') p.lordState.freeRefreshUsed = (p.lordState.freeRefreshUsed ?? 0) + 1;
  rollShop(s, p);
}

export function upgradeShopM(s: GS, pid: number) {
  const p = s.players[pid];
  if (!p) return;
  if (s.phase !== 'prep') return fail(s, p, 'You can only shop during prep.');
  if (p.shopLevel >= MAX_SHOP_LEVEL) return fail(s, p, 'Shop is already max level.');
  const cost = shopUpgradeCost(p.shopLevel);
  if (p.coins < cost) return fail(s, p, 'Not enough coins.');
  p.coins -= cost;
  const from = p.shopLevel;
  p.shopLevel++;
  rollExtraOffers(s, p, from, p.shopLevel);
  if (p.isHuman) say(s, p, `Shop upgraded to level ${p.shopLevel}.`);
}

export function toggleLockM(s: GS, pid: number) {
  const p = s.players[pid];
  if (!p) return;
  p.shop.locked = !p.shop.locked;
}

export const buyHero = pure(buyHeroM);
export const buySpell = pure(buySpellM);
export const buyItem = pure(buyItemM);
export const refreshShop = pure(refreshShopM);

/** Single-player cheat (triple-tap the "Mystery Shop" title): the hero row becomes 2x Dragon Knight and the
 *  item row Black King Bar + Aghanim's Scepter; other slots in those rows are emptied, spells untouched.
 *  Works offline and online (the server applies it to the sender's own seat, prep phase only). */
export function cheatShopM(s: GS, pid: number) {
  const p = s.players[pid];
  if (!p || s.phase !== 'prep') return;
  p.shop.heroOffers = p.shop.heroOffers.map((_, i) => (i < 2 ? 'dragon_knight' : null));
  if (p.shop.heroOffers.length < 2) p.shop.heroOffers = ['dragon_knight', 'dragon_knight'];
  const items: (ItemId | null)[] = ['black_king_bar', 'aghanims_scepter'];
  p.shop.itemOffers = p.shop.itemOffers.map((_, i) => items[i] ?? null);
  while (p.shop.itemOffers.length < 2) p.shop.itemOffers.push(items[p.shop.itemOffers.length]!);
  if (p.isHuman) log(s, 'Cheat activated: 2x Dragon Knight, Black King Bar, Aghanim\'s Scepter.');
}
export const cheatShop = pure(cheatShopM);
export const upgradeShop = pure(upgradeShopM);
export const toggleLock = pure(toggleLockM);
