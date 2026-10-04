import { describe, expect, test } from 'bun:test';
import {
  BENCH_SIZE,
  HERO_COST,
  HERO_OFFERS,
  MAX_SHOP_LEVEL,
  TAVERN_ODDS,
  LORD_CHOICES,
  PLAYER_COUNT,
  PLAYER_START_HP,
  REFRESH_COST,
  SELL_HERO,
  SPELL_COST,
  boardCap,
  incomeForRound,
  offersForShopLevel,
  shopUpgradeCost,
} from '../src/core/constants.ts';
import { HERO_IDS, SIGNATURE_SPELLS } from '../src/core/ids.ts';
import { createRng } from '../src/core/rng.ts';
import { ITEMS } from '../src/core/data/items.ts';
import { LORDS } from '../src/core/data/lords.ts';
import * as G from '../src/core/game/index.ts';
import type { GameState, HeroId, SpellId } from '../src/core/types.ts';

/** New game with the human already in prep with a chosen lord. */
function prepGame(seed = 1, lord: Parameters<typeof G.pickLord>[1] | null = null): GameState {
  let s = G.newGame(seed);
  const pick = lord ?? s.lordChoices[0]!;
  if (!s.lordChoices.includes(pick)) s = { ...s, lordChoices: [...s.lordChoices, pick] };
  s = G.pickLord(s, pick, 0);
  return s;
}

/** Force a specific hero into offer slot 0 for player 0. */
function offer(s: GameState, heroId: HeroId, idx = 0): GameState {
  const c = structuredClone(s);
  c.players[0]!.shop.heroOffers[idx] = heroId;
  return c;
}
function withCoins(s: GameState, coins: number): GameState {
  const c = structuredClone(s);
  c.players[0]!.coins = coins;
  return c;
}

describe('newGame', () => {
  test('shape', () => {
    const s = G.newGame(42);
    expect(s.phase).toBe('lord_select');
    expect(s.round).toBe(1);
    expect(s.players.length).toBe(PLAYER_COUNT);
    expect(s.players[0]!.isHuman).toBe(true);
    expect(s.players[0]!.name).toBe('You');
    expect(s.players[0]!.lordId).toBeNull();
    expect(s.lordChoices.length).toBe(LORD_CHOICES);
    expect(new Set(s.lordChoices).size).toBe(LORD_CHOICES);
    for (const p of s.players.slice(1)) {
      expect(p.isHuman).toBe(false);
      expect(p.lordId).not.toBeNull();
      expect(p.hp).toBe(p.maxHp);
    }
    const human = s.players[0]!;
    expect(human.hp).toBe(PLAYER_START_HP);
    expect(human.coins).toBe(incomeForRound(1));
    expect(human.shop.heroOffers.length).toBe(HERO_OFFERS);
    expect(human.shop.spellOffers.length).toBe(offersForShopLevel(1));
    expect(human.shop.itemOffers.length).toBe(offersForShopLevel(1));
    for (const it of human.shop.itemOffers) expect(ITEMS[it!].lordOnly).toBeFalsy();
    expect(Object.keys(LORDS).length).toBe(8);
  });

  test('deterministic by seed', () => {
    expect(JSON.stringify(G.newGame(7))).toBe(JSON.stringify(G.newGame(7)));
  });

  test('reroll lords once', () => {
    let s = G.newGame(3);
    const first = s.lordChoices;
    s = G.rerollLords(s);
    expect(s.lordRerollUsed).toBe(true);
    expect(s.lordChoices).not.toEqual(first);
    const again = G.rerollLords(s);
    expect(again.lordChoices).toEqual(s.lordChoices);
  });

  test('pick lord -> prep', () => {
    const s = prepGame(5, 'pudge_lord');
    expect(s.phase).toBe('prep');
    expect(s.players[0]!.maxHp).toBe(150);
    expect(s.players[0]!.hp).toBe(150);
  });
});

describe('shop & economy', () => {
  test('buy / sell / refresh coin math', () => {
    let s = withCoins(offer(prepGame(1, 'axe_lord'), 'pudge'), 10);
    s = G.buyHero(s, 0, 0);
    let p = s.players[0]!;
    expect(p.coins).toBe(10 - HERO_COST);
    expect(p.heroes.length).toBe(1);
    expect(p.shop.heroOffers[0]).toBeNull();
    const h = p.heroes[0]!;
    expect(h.level).toBe(1);
    expect(h.spells).toEqual([SIGNATURE_SPELLS.pudge, null]);
    expect(h.items).toEqual([null, null, null]);
    expect(h.slot).not.toBeNull();

    // buying sold-out slot is a no-op
    const same = G.buyHero(s, 0, 0);
    expect(same.players[0]!.coins).toBe(p.coins);

    s = G.buySpell(s, 0, 0);
    p = s.players[0]!;
    expect(p.coins).toBe(10 - HERO_COST - SPELL_COST);
    expect(p.spellInventory.length).toBe(1);

    s = G.refreshShop(s, 0);
    expect(s.players[0]!.coins).toBe(10 - HERO_COST - SPELL_COST - REFRESH_COST);
    expect(s.players[0]!.shop.heroOffers.every((x) => x !== null)).toBe(true);

    s = G.sellHero(s, 0, h.uid);
    expect(s.players[0]!.coins).toBe(10 - HERO_COST - SPELL_COST - REFRESH_COST + SELL_HERO);
    expect(s.players[0]!.heroes.length).toBe(0);

    // not enough coins
    const broke = G.buyHero(withCoins(s, 0), 0, 0);
    expect(broke.players[0]!.heroes.length).toBe(0);
    expect(broke.log.at(-1)).toContain('coins');
  });

  test('upgrade shop adds offers immediately', () => {
    let s = withCoins(prepGame(2, 'axe_lord'), 20);
    s = G.upgradeShop(s, 0);
    const p = s.players[0]!;
    expect(p.shopLevel).toBe(2);
    expect(p.coins).toBe(20 - shopUpgradeCost(1));
    expect(p.shop.spellOffers.length).toBe(offersForShopLevel(2));
    expect(p.shop.itemOffers.length).toBe(offersForShopLevel(2));
  });

  test('rubick spells cost 2, tinker first refresh free + shop lvl 2', () => {
    let s = withCoins(prepGame(3, 'rubick'), 10);
    s = G.buySpell(s, 0, 0);
    expect(s.players[0]!.coins).toBe(8);

    let t = prepGame(3, 'tinker_lord');
    expect(t.players[0]!.shopLevel).toBe(2);
    expect(t.players[0]!.shop.spellOffers.length).toBe(offersForShopLevel(2));
    const c = t.players[0]!.coins;
    t = G.refreshShop(t, 0);
    expect(t.players[0]!.coins).toBe(c);
    t = G.refreshShop(t, 0);
    expect(t.players[0]!.coins).toBe(c - REFRESH_COST);
  });

  test('alchemist gets +2 coins', () => {
    const s = prepGame(4, 'alchemist');
    expect(s.players[0]!.coins).toBe(incomeForRound(1) + 2);
  });

  test('duplicate -> pendingUpgrade -> level 5', () => {
    let s = withCoins(offer(offer(prepGame(1, 'axe_lord'), 'axe', 0), 'axe', 1), 10);
    s = G.buyHero(s, 0, 0);
    s = G.buyHero(s, 0, 1);
    let p = s.players[0]!;
    expect(p.heroes.length).toBe(1);
    expect(p.heroes[0]!.pendingUpgrades).toBe(1);
    s = G.upgradeHero(s, 0, p.heroes[0]!.uid);
    p = s.players[0]!;
    expect(p.heroes[0]!.level).toBe(5);
    expect(p.heroes[0]!.pendingUpgrades).toBe(0);
    // no pending -> no-op
    const again = G.upgradeHero(s, 0, p.heroes[0]!.uid);
    expect(again.players[0]!.heroes[0]!.level).toBe(5);
  });

  test('locked shop persists to next round, then unlocks', () => {
    let s = prepGame(9, 'axe_lord');
    s = G.toggleLock(s, 0);
    const offers = structuredClone(s.players[0]!.shop);
    s = G.readyForBattle(s);
    s = G.finishBattle(s);
    expect(s.phase).toBe('results');
    s = G.nextRound(s);
    expect(s.phase).toBe('prep');
    expect(s.round).toBe(2);
    expect(s.players[0]!.shop.heroOffers).toEqual(offers.heroOffers);
    expect(s.players[0]!.shop.spellOffers).toEqual(offers.spellOffers);
    expect(s.players[0]!.shop.locked).toBe(false);
    expect(s.players[0]!.coins).toBe(incomeForRound(2));
  });
});

describe('tavern ★ odds', () => {
  test('tavernOdds / starsOf helpers', () => {
    for (let lvl = 1; lvl <= MAX_SHOP_LEVEL; lvl++) {
      const row = G.tavernOdds(lvl);
      expect(row.length).toBe(6);
      expect(row.reduce((a, b) => a + b, 0)).toBe(100);
      expect(row).toEqual([...TAVERN_ODDS[lvl - 1]!]);
    }
    expect(G.tavernOdds(99)).toEqual(G.tavernOdds(MAX_SHOP_LEVEL));
    expect(G.starsOf('hero', 'enigma')).toBe(5);
    expect(G.starsOf('spell', 'black_hole')).toBeGreaterThanOrEqual(4);
    expect(G.starsOf('item', 'divine_rapier')).toBe(6);
  });

  test('rollStar follows the odds', () => {
    const rng = createRng(42);
    const counts = [0, 0, 0, 0, 0, 0];
    const N = 5000;
    for (let i = 0; i < N; i++) counts[G.rollStar(rng, 4) - 1]!++;
    TAVERN_ODDS[3]!.forEach((pct, i) => expect(Math.abs((counts[i]! / N) * 100 - pct)).toBeLessThan(3));
  });

  test('tavern 1: no 4★+ items in 2000 rolls; tavern 6: some 6★ items', () => {
    const rng = createRng(7);
    const low = new Set<number>();
    for (let i = 0; i < 2000; i++) for (const id of G.rollItems(rng, 1, offersForShopLevel(1))) low.add(ITEMS[id].tier);
    expect(Math.max(...low)).toBeLessThanOrEqual(3);
    let six = 0;
    for (let i = 0; i < 2000; i++) six += G.rollItems(rng, 6, offersForShopLevel(6)).filter((id) => ITEMS[id].tier === 6).length;
    expect(six).toBeGreaterThan(0);
    // heroes and spells never exceed 5★, and do reach 5★ at tavern 6
    let hero5 = 0;
    for (let i = 0; i < 500; i++) {
      const hs = G.rollHeroes(rng, 6, HERO_OFFERS);
      for (const h of hs) expect(G.starsOf('hero', h)).toBeLessThanOrEqual(5);
      hero5 += hs.filter((h) => G.starsOf('hero', h) === 5).length;
    }
    expect(hero5).toBeGreaterThan(0);
  });

  test('offers are distinct and sized by tavern level', () => {
    const rng = createRng(3);
    for (let lvl = 1; lvl <= MAX_SHOP_LEVEL; lvl++) {
      for (let i = 0; i < 200; i++) {
        const hs = G.rollHeroes(rng, lvl, HERO_OFFERS);
        const sp = G.rollSpells(rng, lvl, offersForShopLevel(lvl));
        const it = G.rollItems(rng, lvl, offersForShopLevel(lvl));
        expect(hs.length).toBe(HERO_OFFERS);
        expect(sp.length).toBe(offersForShopLevel(lvl));
        expect(it.length).toBe(offersForShopLevel(lvl));
        for (const arr of [hs, sp, it] as string[][]) expect(new Set(arr).size).toBe(arr.length);
        for (const id of it) expect(ITEMS[id].lordOnly).toBeFalsy();
        for (const h of hs) expect(HERO_IDS).toContain(h);
      }
    }
  });

  test('cannot upgrade past max tavern level', () => {
    let s = withCoins(prepGame(5, 'axe_lord'), 999);
    for (let i = 0; i < 10; i++) s = G.upgradeShop(s, 0);
    expect(s.players[0]!.shopLevel).toBe(MAX_SHOP_LEVEL);
    expect(s.players[0]!.shop.itemOffers.length).toBe(offersForShopLevel(MAX_SHOP_LEVEL));
  });
});

describe('roster', () => {
  function withHero(): { s: GameState; uid: string } {
    let s = withCoins(offer(prepGame(1, 'axe_lord'), 'lina'), 30);
    s = G.buyHero(s, 0, 0);
    const c = structuredClone(s);
    c.players[0]!.spellInventory.push('dragon_slave', 'arc_lightning', 'rot');
    return { s: c, uid: c.players[0]!.heroes[0]!.uid };
  }

  test('assign / swap / unassign keep slot 0', () => {
    let { s, uid } = withHero();
    const sig = SIGNATURE_SPELLS.lina;
    // slot 0 forbidden
    let t = G.assignSpell(s, 0, uid, 0, 0);
    expect(t.players[0]!.heroes[0]!.spells[0]).toBe(sig);
    s = G.assignSpell(s, 0, uid, 1, 0);
    let h = s.players[0]!.heroes[0]!;
    expect(h.spells).toEqual([sig, 'dragon_slave']);
    expect(s.players[0]!.spellInventory).toEqual(['arc_lightning', 'rot']);
    // displacing returns old spell to inventory
    s = G.assignSpell(s, 0, uid, 1, 0);
    expect(s.players[0]!.heroes[0]!.spells[1]).toBe('arc_lightning');
    expect(s.players[0]!.spellInventory).toContain('dragon_slave' as SpellId);
    // grow to 3 slots and swap
    const c = structuredClone(s);
    c.players[0]!.heroes[0]!.level = 10;
    c.players[0]!.heroes[0]!.spells.push(null);
    s = G.assignSpell(c, 0, uid, 2, c.players[0]!.spellInventory.indexOf('rot'));
    s = G.swapSpellSlots(s, 0, uid, 1, 2);
    h = s.players[0]!.heroes[0]!;
    expect(h.spells).toEqual([sig, 'rot', 'arc_lightning']);
    t = G.swapSpellSlots(s, 0, uid, 0, 1);
    expect(t.players[0]!.heroes[0]!.spells[0]).toBe(sig);
    s = G.unassignSpell(s, 0, uid, 1);
    expect(s.players[0]!.heroes[0]!.spells).toEqual([sig, null, 'arc_lightning']);
    t = G.unassignSpell(s, 0, uid, 0);
    expect(t.players[0]!.heroes[0]!.spells[0]).toBe(sig);
  });

  test('equip / unequip, sell hero returns spells & items', () => {
    let { s, uid } = withHero();
    const c = structuredClone(s);
    c.players[0]!.itemInventory.push('broadsword');
    s = G.equipItem(c, 0, uid, 0, 0);
    expect(s.players[0]!.heroes[0]!.items[0]).toBe('broadsword');
    s = G.assignSpell(s, 0, uid, 1, 0);
    s = G.sellHero(s, 0, uid);
    const p = s.players[0]!;
    expect(p.itemInventory).toContain('broadsword');
    expect(p.spellInventory).toContain('dragon_slave' as SpellId);
    expect(p.spellInventory).not.toContain(SIGNATURE_SPELLS.lina as SpellId);
  });

  test('board cap', () => {
    let s = withCoins(prepGame(1, 'axe_lord'), 100);
    const ids: HeroId[] = ['axe', 'lina', 'zeus', 'sniper', 'pudge', 'slark', 'ursa'];
    for (const id of ids) s = G.buyHero(offer(s, id), 0, 0);
    const p = s.players[0]!;
    expect(G.boardCount(p)).toBe(boardCap(1));
    expect(p.heroes.length).toBe(boardCap(1) + BENCH_SIZE);
    // full bench: next new hero no-op
    const t = G.buyHero(offer(s, 'tinker'), 0, 0);
    expect(t.players[0]!.heroes.length).toBe(p.heroes.length);
    // bench hero can't go onto a free board slot when at cap
    const benchHero = p.heroes.find((h) => h.slot === null)!;
    const free = [0, 1, 2, 3].flatMap((col) => [0, 1, 2].map((row) => ({ col, row }))).find((sl) =>
      !p.heroes.some((h) => h.slot?.col === sl.col && h.slot.row === sl.row),
    )!;
    const u = G.placeHero(s, 0, benchHero.uid, free);
    expect(G.boardCount(u.players[0]!)).toBe(boardCap(1));
    // but can swap with a board hero
    const boardHero = p.heroes.find((h) => h.slot !== null)!;
    const v = G.placeHero(s, 0, benchHero.uid, boardHero.slot);
    const vp = v.players[0]!;
    expect(vp.heroes.find((h) => h.uid === benchHero.uid)!.slot).toEqual(boardHero.slot);
    expect(vp.heroes.find((h) => h.uid === boardHero.uid)!.slot).toBeNull();
    // board hero can move to a free slot
    const w = G.placeHero(s, 0, boardHero.uid, free);
    expect(w.players[0]!.heroes.find((h) => h.uid === boardHero.uid)!.slot).toEqual(free);
  });
});

describe('lords', () => {
  test('ursa forge 8 -> divine sword', () => {
    let s = withCoins(prepGame(1, 'ursa_lord'), 10);
    expect(s.players[0]!.itemInventory).toContain('broken_sword');
    expect(G.lordActiveAvailable(s.players[0]!)).toBe(true);
    for (let i = 0; i < 8; i++) s = G.useLordAbility(s, 0);
    const p = s.players[0]!;
    expect(p.coins).toBe(2);
    expect(p.lordState.forges).toBe(8);
    expect(p.itemInventory).toContain('divine_sword_of_the_sun');
    expect(p.itemInventory).not.toContain('broken_sword');
    expect(G.lordActiveAvailable(p)).toBe(false);
  });

  test('ursa forge works while equipped', () => {
    let s = withCoins(offer(prepGame(1, 'ursa_lord'), 'juggernaut'), 20);
    s = G.buyHero(s, 0, 0);
    const uid = s.players[0]!.heroes[0]!.uid;
    s = G.equipItem(s, 0, uid, 1, s.players[0]!.itemInventory.indexOf('broken_sword'));
    for (let i = 0; i < 8; i++) s = G.useLordAbility(s, 0);
    expect(s.players[0]!.heroes[0]!.items[1]).toBe('divine_sword_of_the_sun');
  });

  test('omniknight +12 once, bounty bank, axe mods', () => {
    let s = withCoins(offer(prepGame(1, 'omniknight'), 'zeus'), 10);
    s = G.buyHero(s, 0, 0);
    const uid = s.players[0]!.heroes[0]!.uid;
    s = G.useLordAbility(s, 0, uid);
    expect(s.players[0]!.heroes[0]!.level).toBe(13);
    expect(s.players[0]!.heroes[0]!.spells.length).toBe(3);
    s = G.useLordAbility(s, 0, uid);
    expect(s.players[0]!.heroes[0]!.level).toBe(13);

    let b = prepGame(1, 'bounty_hunter');
    const coins = b.players[0]!.coins;
    b = G.readyForBattle(b);
    expect(b.players[0]!.lordState.bank).toBe(coins);
    b = G.finishBattle(b);
    if (b.phase === 'results') {
      b = G.nextRound(b);
      b = G.useLordAbility(b, 0);
      expect(b.players[0]!.coins).toBe(incomeForRound(2) + coins);
      expect(b.players[0]!.lordState.bank).toBe(0);
    }

    expect(G.teamModsFor({ ...s.players[0]!, lordId: 'axe_lord' }).hpPct).toBe(15);
  });
});

describe('full game', () => {
  test('all-bot game reaches game_over with unique placements', () => {
    const s = G.simulateGame(12345, 60);
    expect(s.phase).toBe('game_over');
    expect(s.round).toBeLessThanOrEqual(60);
    const placements = s.players.map((p) => p.placement);
    expect(placements.every((x) => x !== null)).toBe(true);
    expect([...placements].sort((a, b) => a! - b!)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(s.players.filter((p) => p.alive).length).toBeLessThanOrEqual(1);
    // bots invest in the tavern
    expect(Math.max(...s.players.map((p) => p.shopLevel))).toBeGreaterThanOrEqual(4);
  }, 60_000);

  test('human round flow: ready -> battle -> results', () => {
    let s = withCoins(offer(prepGame(77, 'axe_lord'), 'sniper'), 10);
    s = G.buyHero(s, 0, 0);
    s = G.readyForBattle(s);
    expect(s.phase).toBe('battle');
    expect(s.humanBattle).not.toBeNull();
    expect(s.reports.length).toBe(4);
    const hpBefore = s.players.map((p) => p.hp);
    // no damage before finishBattle
    expect(s.players.every((p, i) => p.hp === hpBefore[i])).toBe(true);
    s = G.finishBattle(s);
    expect(['results', 'game_over']).toContain(s.phase);
    expect(s.players.some((p) => p.hp < p.maxHp)).toBe(true);
  });
});
