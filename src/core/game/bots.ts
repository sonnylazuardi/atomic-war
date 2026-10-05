// Greedy bot brain. Uses the same in-place reducers as the human (player id param).
import { BENCH_SIZE, HERO_COST, MAX_SHOP_LEVEL, boardCap, shopUpgradeCost } from '../constants.ts';
import { HEROES } from '../data/heroes.ts';
import { ITEMS } from '../data/items.ts';
import { SPELLS } from '../data/spells.ts';
import { LORD_IDS } from '../ids.ts';
import type { Attr, Effect, GameState, HeroClass, ItemId, LordId, OwnedHero, PlayerState, SpellId } from '../types.ts';
import { lordActiveAvailable, refreshCostFor, spellCostFor, useLordAbilityM } from './lords.ts';
import { assignSpellM, equipItemM, sellHeroM, sellItemM, sellSpellM, upgradeHeroM } from './roster.ts';
import { buyHeroM, buyItemM, buySpellM, itemCost, refreshShopM, upgradeShopM } from './shop.ts';
import { benchCount, firstFreeSlot, isInnate, pure, withRng, type GS } from './util.ts';

const spellStars = (id: SpellId) => SPELLS[id]?.stars ?? 1;
/** a bought spell must beat an innate one by this many stars before a bot destroys the innate */
const REPLACE_GAP = 2;

/** The weakest non-ultimate innate spell on a hero (replacement candidate). */
function weakestInnate(h: OwnedHero): { slot: number; stars: number } | null {
  let best: { slot: number; stars: number } | null = null;
  h.spells.forEach((sp, i) => {
    if (!sp || !isInnate(h, sp) || SPELLS[sp]?.ultimate) return;
    const st = spellStars(sp);
    if (!best || st < best.stars) best = { slot: i, stars: st };
  });
  return best;
}

export function botPickLord(s: GameState): LordId {
  return withRng(s, (rng) => rng.pick(LORD_IDS));
}

const clsOf = (h: OwnedHero): HeroClass | undefined => HEROES[h.heroId]?.cls;
const primaryOf = (h: OwnedHero): Attr | undefined => HEROES[h.heroId]?.primary;

const DAMAGE_EFFECTS = new Set<Effect['t']>(['damage', 'projectile', 'bounce', 'zone', 'dot', 'execute', 'omnislash']);
const CONTROL_EFFECTS = new Set<Effect['t']>(['stun', 'silence', 'root', 'slow', 'heal', 'grave', 'dispel']);

/** How much a hero of class `cls` wants spell `id` (0..~4). */
export function spellScore(cls: HeroClass | undefined, id: SpellId): number {
  const d = SPELLS[id];
  if (!d) return 1.5;
  if (d.kind === 'passive') {
    switch (cls) {
      case 'warrior':
      case 'assassin':
      case 'hunter':
        return 3;
      case 'mechanic':
        return 2;
      default:
        return 1;
    }
  }
  const dmg = d.effects.some((e) => DAMAGE_EFFECTS.has(e.t));
  const ctl = d.effects.some((e) => CONTROL_EFFECTS.has(e.t));
  const ult = d.ultimate ? 0.5 : 0;
  const leap = d.effects.some((e) => e.t === 'leap');
  switch (cls) {
    case 'mage':
      return (dmg ? 3 : ctl ? 2 : 1) + ult;
    case 'mechanic':
      return (dmg ? 3 : 1.5) + ult;
    case 'support':
      return (ctl ? 3 : dmg ? 2 : 1) + ult;
    case 'assassin':
      return leap ? 3 : dmg ? 2 : 1;
    case 'warrior':
      return ctl ? 2 : dmg ? 1.5 : 1;
    case 'hunter':
      return dmg ? 1.5 : 1;
    default:
      return 1.5;
  }
}

function itemAttr(id: ItemId): Attr | null {
  const st = ITEMS[id]?.stats;
  if (!st) return null;
  const vals: [Attr, number][] = [
    ['str', st.str ?? 0],
    ['agi', st.agi ?? 0],
    ['int', st.int ?? 0],
  ];
  vals.sort((a, b) => b[1] - a[1]);
  return vals[0]![1] > 0 ? vals[0]![0] : null;
}

/** forge swords are valued by their stage, not their (lord-only) tier */
const FORGE_TIER: Partial<Record<ItemId, number>> = { broken_sword: 1, flame_sword: 9, divine_sword_of_the_sun: 11 };
const FORGE_ITEMS = new Set<ItemId>(['broken_sword', 'flame_sword', 'divine_sword_of_the_sun']);
const tierOf = (id: ItemId | null) => (id ? (FORGE_TIER[id] ?? ITEMS[id]?.tier ?? 1) : 0);

function heroValue(h: OwnedHero): number {
  return h.level * 2 + h.items.reduce((s, it) => s + tierOf(it), 0) * 2 + (h.stacks.str + h.stacks.agi + h.stacks.int) / 4;
}

/** Heroes the bot wants on the board, best first. */
function bestHeroes(p: PlayerState, round: number): OwnedHero[] {
  return [...p.heroes].sort((a, b) => heroValue(b) - heroValue(a)).slice(0, boardCap(round));
}

function spendUpgrades(s: GS, p: PlayerState) {
  for (const h of p.heroes) {
    let guard = 10;
    while (h.pendingUpgrades > 0 && guard-- > 0) {
      const before = h.pendingUpgrades;
      upgradeHeroM(s, p.id, h.uid);
      if (h.pendingUpgrades === before) {
        h.pendingUpgrades = 0;
        break;
      }
    }
  }
}

/** Put inventory spells into empty slots of the heroes that want them most. */
function assignSpells(s: GS, p: PlayerState) {
  const team = bestHeroes(p, s.round);
  for (let inv = p.spellInventory.length - 1; inv >= 0; inv--) {
    const sp = p.spellInventory[inv]!;
    let best: { h: OwnedHero; slot: number; score: number } | null = null;
    for (const h of team) {
      if (h.spells.includes(sp)) continue;
      let slot = h.spells.indexOf(null);
      let score = spellScore(clsOf(h), sp) + h.level / 30;
      if (slot < 0) {
        const weak = weakestInnate(h);
        if (!weak || spellStars(sp) < weak.stars + REPLACE_GAP) continue;
        slot = weak.slot;
        score -= 1; // prefer filling a free slot over destroying an innate spell
      }
      if (!best || score > best.score) best = { h, slot, score };
    }
    if (best) assignSpellM(s, p.id, best.h.uid, best.slot, inv);
  }
}

function equipItems(s: GS, p: PlayerState) {
  const team = bestHeroes(p, s.round);
  for (let inv = p.itemInventory.length - 1; inv >= 0; inv--) {
    const it = p.itemInventory[inv]!;
    const attr = itemAttr(it);
    const candidates = team
      .map((h) => {
        const free = h.items.indexOf(null);
        let slot = free;
        if (slot < 0) {
          // replace the weakest item if this one is better
          let worst = 0;
          for (let i = 1; i < h.items.length; i++) if (tierOf(h.items[i]!) < tierOf(h.items[worst]!)) worst = i;
          if (tierOf(h.items[worst]!) < tierOf(it)) slot = worst;
        }
        const score = heroValue(h) + (attr && primaryOf(h) === attr ? 20 : 0) + (free >= 0 ? 5 : 0);
        return { h, slot, score };
      })
      .filter((c) => c.slot >= 0)
      .sort((a, b) => b.score - a.score);
    const c = candidates[0];
    if (c) equipItemM(s, p.id, c.h.uid, c.slot, inv);
  }
  // sell leftovers that nobody can use (never the broken sword)
  for (let inv = p.itemInventory.length - 1; inv >= 0; inv--) {
    const it = p.itemInventory[inv]!;
    if (!FORGE_ITEMS.has(it)) sellItemM(s, p.id, inv);
  }
}

function arrangeBoard(s: GS, p: PlayerState) {
  const team = bestHeroes(p, s.round);
  for (const h of p.heroes) h.slot = null;
  // melee first so they grab front columns
  const ordered = [...team].sort((a, b) => Number(HEROES[a.heroId]?.ranged ?? 0) - Number(HEROES[b.heroId]?.ranged ?? 0));
  for (const h of ordered) h.slot = firstFreeSlot(p, h.heroId);
  // bench overflow: sell the weakest extras
  while (benchCount(p) > BENCH_SIZE) {
    const bench = p.heroes.filter((h) => h.slot === null).sort((a, b) => heroValue(a) - heroValue(b));
    const victim = bench[0];
    if (!victim) break;
    sellHeroM(s, p.id, victim.uid);
  }
}

function tryBuyHero(s: GS, p: PlayerState, jitter: number): boolean {
  const cap = boardCap(s.round);
  const offers = p.shop.heroOffers;
  if (p.coins < HERO_COST) return false;
  const owned = new Set(p.heroes.map((h) => h.heroId));
  const ownedCls = new Set(p.heroes.map(clsOf));
  const needMore = p.heroes.length < cap;
  let bestIdx = -1;
  let bestScore = -Infinity;
  offers.forEach((id, i) => {
    if (!id) return;
    let score: number;
    if (owned.has(id)) {
      const h = p.heroes.find((x) => x.heroId === id)!;
      if (h.level + 4 * h.pendingUpgrades >= 30) return;
      score = needMore ? 1 : 5;
    } else {
      if (!needMore && benchCount(p) >= BENCH_SIZE) return;
      if (!needMore) return; // board full: only duplicates
      score = 4 + (ownedCls.has(HEROES[id]?.cls) ? 0 : 2);
    }
    score += ((i * 7 + jitter * 13) % 3) * 0.3;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  });
  if (bestIdx < 0) return false;
  const before = p.coins;
  buyHeroM(s, p.id, bestIdx);
  return p.coins < before;
}

function tryBuySpell(s: GS, p: PlayerState): boolean {
  const cost = spellCostFor(p);
  if (p.coins < cost) return false;
  const team = bestHeroes(p, s.round);
  const freeSlots = team.reduce((n, h) => n + h.spells.filter((x) => x === null).length, 0);
  const fill = freeSlots > p.spellInventory.length;
  // no free slot: occasionally upgrade a weak innate with a much rarer spell (keep a little reserve)
  const upgrade = !fill && p.spellInventory.length === 0 && s.round >= 4 && p.coins >= cost + 3;
  if (!fill && !upgrade) return false;
  let bestIdx = -1;
  let bestScore = 2;
  p.shop.spellOffers.forEach((id, i) => {
    if (!id) return;
    for (const h of team) {
      if (h.spells.includes(id)) continue;
      if (fill) {
        if (h.spells.indexOf(null) < 0) continue;
      } else {
        const weak = weakestInnate(h);
        if (!weak || spellStars(id) < weak.stars + REPLACE_GAP) continue;
      }
      const sc = spellScore(clsOf(h), id) + (fill ? 0 : spellStars(id) / 5);
      if (sc >= bestScore) {
        bestScore = sc;
        bestIdx = i;
      }
    }
  });
  if (bestIdx < 0) return false;
  buySpellM(s, p.id, bestIdx);
  assignSpells(s, p);
  return true;
}

function tryBuyItem(s: GS, p: PlayerState): boolean {
  const team = bestHeroes(p, s.round);
  if (team.length === 0) return false;
  const minTier = Math.min(...team.flatMap((h) => h.items.map(tierOf)));
  let bestIdx = -1;
  let bestTier = 0;
  p.shop.itemOffers.forEach((id, i) => {
    if (!id || itemCost(id) > p.coins) return;
    const t = tierOf(id);
    if (t > minTier && t > bestTier) {
      bestTier = t;
      bestIdx = i;
    }
  });
  if (bestIdx < 0) return false;
  buyItemM(s, p.id, bestIdx);
  equipItems(s, p);
  return true;
}

function useLord(s: GS, p: PlayerState, phase: 'start' | 'end') {
  if (!lordActiveAvailable(p)) return;
  if (p.lordId === 'bounty_hunter' && phase === 'start') {
    // one cash-in per match: wait for a fat bank, or cash in to afford a tavern upgrade / late game
    const bank = p.lordState.bank ?? 0;
    const upCost = shopUpgradeCost(p.shopLevel);
    const forTavern = p.shopLevel < MAX_SHOP_LEVEL && p.coins < upCost && p.coins + bank >= upCost && bank >= 3;
    if (bank >= 6 || forTavern || s.round >= 12) useLordAbilityM(s, p.id);
  } else if (p.lordId === 'bloodseeker' && phase === 'start') {
    // only gamble when confident: healthy and won last round
    if (p.hp > 60 && p.lastResult === 'win') useLordAbilityM(s, p.id);
  } else if (p.lordId === 'omniknight' && phase === 'start' && s.round >= 3) {
    const target = bestHeroes(p, s.round)[0];
    if (target && target.level <= 18) useLordAbilityM(s, p.id, target.uid);
  } else if ((p.lordId === 'naga_siren' || p.lordId === 'spirit_breaker') && phase === 'end') {
    // bind the song / charge to the strongest hero (free, re-picked every round)
    const target = bestHeroes(p, s.round)[0];
    if (target && p.lordTarget !== target.uid) useLordAbilityM(s, p.id, target.uid);
  } else if ((p.lordId === 'ember_spirit' || p.lordId === 'zeus_lord') && phase === 'end') {
    // spend every spare coin after shopping
    let guard = 40;
    while (lordActiveAvailable(p) && guard-- > 0) useLordAbilityM(s, p.id);
  } else if (p.lordId === 'luna' && phase === 'end') {
    const target = bestHeroes(p, s.round)[0];
    let guard = 40;
    while (target && lordActiveAvailable(p) && guard-- > 0) useLordAbilityM(s, p.id, target.uid);
  }
}

/** Full prep phase for a bot. Mutates state in place. */
export function botPrepM(s: GS, pid: number) {
  const p = s.players[pid];
  if (!p || !p.alive || s.phase !== 'prep') return;
  const jitter = withRng(s, (rng) => rng.int(0, 99));
  useLord(s, p, 'start');
  spendUpgrades(s, p);

  // tavern ★ drives offer rarity: aim for level 2 at round 3, +1 every 2 rounds (6 at round 11).
  // Behind schedule -> upgrade once per prep when affordable (catches up on later rounds).
  const tavernTarget = Math.min(MAX_SHOP_LEVEL, 1 + Math.max(0, Math.floor((s.round - 1) / 2)));
  if (p.shopLevel < tavernTarget && p.coins >= shopUpgradeCost(p.shopLevel)) upgradeShopM(s, pid);

  assignSpells(s, p);
  equipItems(s, p);

  let refreshes = 0;
  for (let guard = 0; guard < 40; guard++) {
    let bought = false;
    if (tryBuyHero(s, p, jitter)) {
      bought = true;
      spendUpgrades(s, p);
    } else if (jitter % 2 === 0 ? tryBuySpell(s, p) || tryBuyItem(s, p) : tryBuyItem(s, p) || tryBuySpell(s, p)) {
      bought = true;
    }
    if (bought) continue;
    const rc = refreshCostFor(p);
    if (refreshes < 3 && p.coins >= rc + 3) {
      refreshShopM(s, pid);
      refreshes++;
      continue;
    }
    break;
  }
  spendUpgrades(s, p);
  assignSpells(s, p);
  equipItems(s, p);
  // leftover junk spells
  for (let i = p.spellInventory.length - 1; i >= 0 && p.spellInventory.length > 2; i--) sellSpellM(s, pid, i);
  useLord(s, p, 'end');
  arrangeBoard(s, p);
}

/** Pure: run the bot AI's prep for one seat (bots, or an autopilot human). */
export const botPrep = (state: GameState, pid: number): GameState => pure(botPrepM)(state, pid);
