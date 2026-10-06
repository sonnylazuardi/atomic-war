import { describe, expect, test } from 'bun:test';
import {
  BENCH_SIZE,
  HERO_COST,
  START_HERO_LEVEL,
  ITEM_SLOTS,
  SPELL_SLOTS,
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
import { HERO_IDS, HERO_KITS, LORD_IDS, LORD_SPELL_IDS } from '../src/core/ids.ts';
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
    expect(Object.keys(LORDS).sort()).toEqual([...LORD_IDS].sort());
    for (const l of Object.values(LORDS)) expect(l.description.length).toBeGreaterThan(20);
    // lord-only spells never roll in the shop
    for (const sp of human.shop.spellOffers) expect((LORD_SPELL_IDS as readonly string[]).includes(sp!)).toBe(false);
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
    expect(s.players[0]!.maxHp).toBe(600);
    expect(s.players[0]!.hp).toBe(600);
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
    expect(h.level).toBe(START_HERO_LEVEL);
    // a new hero comes with its real Dota kit [Q, W, E, R] + one free slot
    expect(h.spells).toEqual([...HERO_KITS.pudge, ...Array(SPELL_SLOTS - 4).fill(null)]);
    expect(h.spells.length).toBe(SPELL_SLOTS);
    expect(h.spells.every((sp) => sp === null || G.isInnate(h, sp))).toBe(true);
    expect(h.items).toEqual(Array(ITEM_SLOTS).fill(null));
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

  test('spells cost SPELL_COST for every lord, tinker first two refreshes free + shop lvl 2', () => {
    let s = withCoins(prepGame(3, 'rubick'), 10);
    s = G.buySpell(s, 0, 0);
    expect(s.players[0]!.coins).toBe(10 - SPELL_COST);

    let t = prepGame(3, 'tinker_lord');
    expect(t.players[0]!.shopLevel).toBe(2);
    expect(t.players[0]!.shop.spellOffers.length).toBe(offersForShopLevel(2));
    const c = t.players[0]!.coins;
    t = G.refreshShop(t, 0);
    expect(t.players[0]!.coins).toBe(c);
    t = G.refreshShop(t, 0);
    expect(t.players[0]!.coins).toBe(c);
    t = G.refreshShop(t, 0);
    expect(t.players[0]!.coins).toBe(c - REFRESH_COST);
  });

  test('alchemist gets +1 coin', () => {
    const s = prepGame(4, 'alchemist');
    expect(s.players[0]!.coins).toBe(incomeForRound(1) + 1);
  });

  test('buying a hero you own upgrades it immediately (+4 lv, no click needed)', () => {
    let s = withCoins(offer(offer(prepGame(1, 'axe_lord'), 'axe', 0), 'axe', 1), 10);
    s = G.buyHero(s, 0, 0);
    s = G.buyHero(s, 0, 1);
    const p = s.players[0]!;
    expect(p.heroes.length).toBe(1);
    expect(p.heroes[0]!.level).toBe(START_HERO_LEVEL + 4);
    expect(p.heroes[0]!.pendingUpgrades).toBe(0);
    expect(p.coins).toBe(10 - 2 * HERO_COST);
    // a max-level hero can't be bought again (no coins wasted)
    const maxed = structuredClone(offer(s, 'axe', 0));
    maxed.players[0]!.heroes[0]!.level = 30;
    const t = G.buyHero(maxed, 0, 0);
    expect(t.players[0]!.coins).toBe(maxed.players[0]!.coins);
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

  test('locked shop refills the slots bought last round, keeps the rest', () => {
    let s = withCoins(prepGame(9, 'axe_lord'), 30);
    s = G.buyHero(s, 0, 1); // empty hero slot 1
    s = G.buySpell(s, 0, 0); // empty spell slot 0
    s = G.buyItem(s, 0, 0); // empty item slot 0
    s = G.toggleLock(s, 0);
    const before = structuredClone(s.players[0]!.shop);
    expect(before.heroOffers[1]).toBeNull();
    expect(before.spellOffers[0]).toBeNull();
    expect(before.itemOffers[0]).toBeNull();
    s = G.nextRound(G.finishBattle(G.readyForBattle(s)));
    const after = s.players[0]!.shop;
    // bought slots are refilled ...
    expect(after.heroOffers[1]).not.toBeNull();
    expect(after.spellOffers[0]).not.toBeNull();
    expect(after.itemOffers[0]).not.toBeNull();
    // ... unbought offers stay exactly where they were
    before.heroOffers.forEach((o, i) => o !== null && expect(after.heroOffers[i]).toBe(o));
    before.spellOffers.forEach((o, i) => o !== null && expect(after.spellOffers[i]).toBe(o));
    before.itemOffers.forEach((o, i) => o !== null && expect(after.itemOffers[i]).toBe(o));
    expect(after.heroOffers.every((o) => o !== null)).toBe(true);
    expect(after.locked).toBe(false);
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

  test('item level is gated by tavern level; tavern 6: some 6★ items', () => {
    const rng = createRng(7);
    for (let lvl = 1; lvl <= 6; lvl++) {
      const tiers = new Set<number>();
      for (let i = 0; i < 1000; i++) for (const id of G.rollItems(rng, lvl, offersForShopLevel(lvl))) tiers.add(ITEMS[id].tier);
      expect(Math.max(...tiers)).toBeLessThanOrEqual(lvl);
    }
    expect(ITEMS.black_king_bar.tier).toBe(5);
    expect(ITEMS.aghanims_scepter.tier).toBe(4);
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
  // lina: kit = dragon_slave, light_strike_array, fiery_soul, laguna_blade; slot 4 free
  function withHero(): { s: GameState; uid: string } {
    let s = withCoins(offer(prepGame(1, 'axe_lord'), 'lina'), 30);
    s = G.buyHero(s, 0, 0);
    const c = structuredClone(s);
    c.players[0]!.spellInventory.push('arc_lightning', 'rot', 'crystal_nova');
    return { s: c, uid: c.players[0]!.heroes[0]!.uid };
  }
  const kit = [...HERO_KITS.lina] as SpellId[];
  const heroOf = (s: GameState) => s.players[0]!.heroes[0]!;

  test('every slot can be reordered', () => {
    let { s, uid } = withHero();
    s = G.swapSpellSlots(s, 0, uid, 0, 3);
    expect(heroOf(s).spells).toEqual([kit[3]!, kit[1]!, kit[2]!, kit[0]!, null]);
    s = G.swapSpellSlots(s, 0, uid, 1, 4);
    expect(heroOf(s).spells).toEqual([kit[3]!, null, kit[2]!, kit[0]!, kit[1]!]);
    // out of range is a no-op
    const t = G.swapSpellSlots(s, 0, uid, 0, 9);
    expect(heroOf(t).spells).toEqual(heroOf(s).spells);
  });

  test('free slot: bought spells return to inventory when replaced or removed', () => {
    let { s, uid } = withHero();
    s = G.assignSpell(s, 0, uid, 4, 0);
    expect(heroOf(s).spells[4]).toBe('arc_lightning');
    expect(s.players[0]!.spellInventory).toEqual(['rot', 'crystal_nova']);
    expect(G.isInnate(heroOf(s), 'arc_lightning')).toBe(false);
    s = G.assignSpell(s, 0, uid, 4, 0);
    expect(heroOf(s).spells[4]).toBe('rot');
    expect(s.players[0]!.spellInventory).toEqual(['crystal_nova', 'arc_lightning']);
    s = G.unassignSpell(s, 0, uid, 4);
    expect(heroOf(s).spells[4]).toBeNull();
    expect(s.players[0]!.spellInventory).toContain('rot' as SpellId);
    // a hero can't know the same spell twice
    const c = structuredClone(s);
    c.players[0]!.spellInventory.push(kit[0]!);
    const dup = G.assignSpell(c, 0, uid, 4, c.players[0]!.spellInventory.length - 1);
    expect(heroOf(dup).spells[4]).toBeNull();
  });

  test('replacing or removing an innate spell destroys it', () => {
    let { s, uid } = withHero();
    expect(G.isInnate(heroOf(s), kit[0]!)).toBe(true);
    s = G.assignSpell(s, 0, uid, 0, 0); // arc_lightning over dragon_slave
    expect(heroOf(s).spells[0]).toBe('arc_lightning');
    expect(s.players[0]!.spellInventory).toEqual(['rot', 'crystal_nova']);
    expect(s.log.at(-1)).toContain('innate');
    s = G.unassignSpell(s, 0, uid, 1); // light strike array removed -> lost
    expect(heroOf(s).spells[1]).toBeNull();
    expect(s.players[0]!.spellInventory).toEqual(['rot', 'crystal_nova']);
    // and the freed slot takes any spell
    s = G.assignSpell(s, 0, uid, 1, 0);
    expect(heroOf(s).spells[1]).toBe('rot');
  });

  test('equip / unequip, sell hero returns only bought spells & items', () => {
    let { s, uid } = withHero();
    const c = structuredClone(s);
    c.players[0]!.itemInventory.push('broadsword');
    s = G.equipItem(c, 0, uid, 0, 0);
    expect(heroOf(s).items[0]).toBe('broadsword');
    s = G.unequipItem(s, 0, uid, 0);
    expect(s.players[0]!.itemInventory).toEqual(['broadsword']);
    s = G.equipItem(s, 0, uid, 5, 0);
    s = G.assignSpell(s, 0, uid, 4, 0); // arc_lightning (bought)
    s = G.sellHero(s, 0, uid);
    const p = s.players[0]!;
    expect(p.itemInventory).toContain('broadsword');
    expect(p.spellInventory.sort()).toEqual(['arc_lightning', 'crystal_nova', 'rot']);
    for (const k of kit) expect(p.spellInventory).not.toContain(k);
  });

  test('level-ups keep exactly SPELL_SLOTS slots', () => {
    let s = withCoins(offer(offer(prepGame(1, 'axe_lord'), 'axe', 0), 'axe', 1), 10);
    s = G.buyHero(s, 0, 0);
    s = G.buyHero(s, 0, 1);
    s = G.upgradeHero(s, 0, heroOf(s).uid);
    expect(heroOf(s).level).toBe(START_HERO_LEVEL + 4);
    expect(heroOf(s).spells).toEqual([...HERO_KITS.axe, null]);
  });

  test('max 5 heroes, all in the arena (no bench)', () => {
    let s = withCoins(prepGame(1, 'axe_lord'), 100);
    const ids: HeroId[] = ['axe', 'lina', 'zeus', 'sniper', 'pudge', 'slark', 'ursa'];
    for (const id of ids) s = G.buyHero(offer(s, id), 0, 0);
    const p = s.players[0]!;
    expect(BENCH_SIZE).toBe(0);
    expect(p.heroes.length).toBe(boardCap(1));
    expect(G.boardCount(p)).toBe(boardCap(1));
    expect(p.heroes.every((h) => h.slot !== null)).toBe(true);
    // a 6th distinct hero is a no-op (sell one first) ...
    const t = G.buyHero(offer(s, 'tinker'), 0, 0);
    expect(t.players[0]!.heroes.length).toBe(boardCap(1));
    // ... but buying a duplicate still works (it becomes an upgrade)
    const d = G.buyHero(offer(s, 'axe'), 0, 0);
    expect(d.players[0]!.heroes.find((h) => h.heroId === 'axe')!.level).toBe(START_HERO_LEVEL + 4);
    // there is no bench to move a hero to
    const hero = p.heroes[0]!;
    const u = G.placeHero(s, 0, hero.uid, null);
    expect(u.players[0]!.heroes.find((h) => h.uid === hero.uid)!.slot).toEqual(hero.slot);
    // heroes can still move to a free formation tile
    const free = [0, 1, 2].flatMap((col) => [0, 1, 2, 3].map((row) => ({ col, row }))).find(
      (sl) => !p.heroes.some((h) => h.slot?.col === sl.col && h.slot.row === sl.row),
    )!;
    const w = G.placeHero(s, 0, hero.uid, free);
    expect(w.players[0]!.heroes.find((h) => h.uid === hero.uid)!.slot).toEqual(free);
  });
});

describe('lords', () => {
  /** advance n rounds (human idle) */
  function advance(s: GameState, n: number): GameState {
    for (let i = 0; i < n && s.phase === 'prep'; i++) {
      s = G.finishBattle(G.readyForBattle(s));
      if (s.phase !== 'results') break;
      s = G.nextRound(s);
    }
    return s;
  }
  /** human with one hero of `heroId` */
  function withOne(lord: Parameters<typeof prepGame>[1], heroId: HeroId = 'juggernaut', coins = 30) {
    let s = withCoins(offer(prepGame(1, lord), heroId), coins);
    s = G.buyHero(s, 0, 0);
    return { s, uid: s.players[0]!.heroes[0]!.uid };
  }

  test('ember spirit forge: 9 -> flame sword, 18 -> divine sword', () => {
    let s = withCoins(prepGame(1, 'ember_spirit'), 30);
    expect(s.players[0]!.itemInventory).toContain('broken_sword');
    expect(G.lordActiveAvailable(s.players[0]!)).toBe(true);
    for (let i = 0; i < 8; i++) s = G.useLordAbility(s, 0);
    expect(s.players[0]!.itemInventory).toContain('broken_sword');
    s = G.useLordAbility(s, 0);
    let p = s.players[0]!;
    expect(p.lordState.forges).toBe(G.FORGES_FOR_FLAME);
    expect(p.itemInventory).toContain('flame_sword');
    expect(p.itemInventory).not.toContain('broken_sword');
    for (let i = 0; i < 9; i++) s = G.useLordAbility(s, 0);
    p = s.players[0]!;
    expect(p.lordState.forges).toBe(G.FORGES_FOR_DIVINE);
    expect(p.itemInventory).toContain('divine_sword_of_the_sun');
    expect(p.itemInventory).not.toContain('flame_sword');
    expect(p.coins).toBe(30 - 18);
    expect(G.lordActiveAvailable(p)).toBe(false);
    expect(G.useLordAbility(s, 0).players[0]!.coins).toBe(p.coins);
  });

  test('ember forge works while equipped', () => {
    let { s, uid } = withOne('ember_spirit');
    s = G.equipItem(s, 0, uid, 1, s.players[0]!.itemInventory.indexOf('broken_sword'));
    for (let i = 0; i < 9; i++) s = G.useLordAbility(s, 0);
    expect(s.players[0]!.heroes[0]!.items[1]).toBe('flame_sword');
    for (let i = 0; i < 9; i++) s = G.useLordAbility(s, 0);
    expect(s.players[0]!.heroes[0]!.items[1]).toBe('divine_sword_of_the_sun');
  });

  test('omniknight +12 once for 1 coin, sell value unchanged', () => {
    let { s, uid } = withOne('omniknight', 'zeus', 10);
    const before = s.players[0]!.coins;
    s = G.useLordAbility(s, 0, uid);
    expect(s.players[0]!.heroes[0]!.level).toBe(START_HERO_LEVEL + 12);
    expect(s.players[0]!.heroes[0]!.spells.length).toBe(SPELL_SLOTS);
    expect(s.players[0]!.coins).toBe(before - 1);
    expect(s.players[0]!.lordState.used).toBe(1);
    s = G.useLordAbility(s, 0, uid);
    expect(s.players[0]!.heroes[0]!.level).toBe(START_HERO_LEVEL + 12);
    expect(s.players[0]!.coins).toBe(before - 1);
    const sold = G.sellHero(s, 0, uid);
    expect(sold.players[0]!.coins).toBe(before - 1 + SELL_HERO);
    // no coin -> no purification
    const broke = withOne('omniknight', 'zeus', 3);
    const b = G.useLordAbility(withCoins(broke.s, 0), 0, broke.uid);
    expect(b.players[0]!.heroes[0]!.level).toBe(START_HERO_LEVEL);
  });

  /** jump to the next round's prep (no battle) */
  function skipRound(s: GameState): GameState {
    const c = structuredClone(s);
    c.phase = 'results';
    return G.nextRound(c);
  }

  test('bounty hunter: stores 1 coin per round, one cash-in, nothing after', () => {
    let s = prepGame(1, 'bounty_hunter');
    expect(s.players[0]!.lordState.bank).toBe(0);
    expect(G.lordActiveAvailable(s.players[0]!)).toBe(false);
    for (let i = 0; i < 4; i++) s = skipRound(s);
    expect(s.round).toBe(5);
    expect(s.players[0]!.lordState.bank).toBe(4);
    // unspent coins are NOT banked any more
    const coins = s.players[0]!.coins;
    s = G.useLordAbility(s, 0);
    expect(s.players[0]!.coins).toBe(coins + 4);
    expect(s.players[0]!.lordState.bank).toBe(0);
    expect(s.players[0]!.lordState.used).toBe(1);
    expect(G.lordActiveAvailable(s.players[0]!)).toBe(false);
    s = skipRound(skipRound(s));
    expect(s.players[0]!.lordState.bank).toBe(0);
    const again = G.useLordAbility(s, 0);
    expect(again.players[0]!.coins).toBe(s.players[0]!.coins);
  });

  /** player 0 (bloodseeker) vs player 1 with a forced outcome, then finishBattle */
  function bloodBattle(outcome: 'win' | 'loss' | 'draw', ghost = false) {
    let s = G.useLordAbility(prepGame(1, 'bloodseeker'), 0);
    const c = structuredClone(s) as G.GS;
    c.phase = 'battle';
    const winner = outcome === 'win' ? 'left' : outcome === 'loss' ? 'right' : 'draw';
    c.reports = [{ round: 1, pairing: { left: 0, right: 1, ghost }, winner, damageToLoser: 10, duration: 1, seed: 1 }];
    c.pendingResult = outcome === 'win' ? (ghost ? { 0: 'win' } : { 0: 'win', 1: 'loss' }) : outcome === 'loss' ? { 0: 'loss', 1: 'win' } : { 0: 'draw', 1: 'draw' };
    c.pendingDamage = outcome === 'win' ? (ghost ? {} : { 1: 10 }) : outcome === 'loss' ? { 0: 10 } : { 0: 5, 1: 5 };
    return { before: s, after: G.finishBattle(c) };
  }

  test('bloodseeker: costs 40 HP, needs > 40 HP, once per round', () => {
    const s = prepGame(1, 'bloodseeker');
    const t1 = G.useLordAbility(s, 0);
    expect(t1.players[0]!.hp).toBe(PLAYER_START_HP - 40);
    expect(t1.players[0]!.lordState.bloodrage).toBe(1);
    expect(t1.players[0]!.coins).toBe(s.players[0]!.coins);
    expect(G.lordActiveAvailable(t1.players[0]!)).toBe(false);
    expect(G.useLordAbility(t1, 0).players[0]!.hp).toBe(PLAYER_START_HP - 40);
    const low = structuredClone(s);
    low.players[0]!.hp = 40;
    expect(G.lordActiveAvailable(low.players[0]!)).toBe(false);
    expect(G.useLordAbility(low, 0).players[0]!.hp).toBe(40);
    expect(G.useLordAbility(low, 0).players[0]!.lordState.bloodrage).toBe(0);
  });

  test('bloodseeker win: +100 HP (net +60, may exceed max) and +50 damage to the loser', () => {
    const { before, after } = bloodBattle('win');
    expect(after.players[0]!.hp).toBe(PLAYER_START_HP - 40 + 100);
    expect(after.players[1]!.hp).toBe(before.players[1]!.hp - 10 - 50);
    expect(after.players[0]!.lordState.bloodrage).toBe(0);
    // a lower-HP bloodseeker gets the full +100
    let s = structuredClone(prepGame(1, 'bloodseeker'));
    s.players[0]!.hp = 50;
    s = G.useLordAbility(s, 0);
    const c = structuredClone(s) as G.GS;
    c.phase = 'battle';
    c.reports = [{ round: 1, pairing: { left: 1, right: 0, ghost: false }, winner: 'right', damageToLoser: 10, duration: 1, seed: 1 }];
    c.pendingResult = { 0: 'win', 1: 'loss' };
    c.pendingDamage = { 1: 10 };
    expect(G.finishBattle(c).players[0]!.hp).toBe(110); // uncapped heal
  });

  test('bloodseeker win vs ghost: heal, no extra damage', () => {
    const { before, after } = bloodBattle('win', true);
    expect(after.players[0]!.hp).toBe(PLAYER_START_HP + 60);
    expect(after.players[1]!.hp).toBe(before.players[1]!.hp);
  });

  test('bloodseeker loss/draw: the 40 HP is gone + normal damage, flag resets', () => {
    const l = bloodBattle('loss');
    expect(l.after.players[0]!.hp).toBe(PLAYER_START_HP - 40 - 10);
    expect(l.after.players[1]!.hp).toBe(l.before.players[1]!.hp);
    expect(l.after.players[0]!.lordState.bloodrage).toBe(0);
    const d = bloodBattle('draw');
    expect(d.after.players[0]!.hp).toBe(PLAYER_START_HP - 40 - 5);
    expect(d.after.players[1]!.hp).toBe(d.before.players[1]!.hp - 5);
  });

  test('team mods: axe cull, invoker refund, zeus bolt, phantom strike', () => {
    const p = prepGame(1, 'axe_lord').players[0]!;
    expect(G.teamModsFor({ ...p, lordId: 'axe_lord' })).toEqual({ cullThresholdPct: 45 });
    expect(G.teamModsFor({ ...p, lordId: 'invoker' })).toEqual({ refundChance: 25 });
    expect(G.teamModsFor({ ...p, lordId: 'phantom_assassin_lord' })).toEqual({
      blinkBuff: { damagePct: 50, spellImmune: true, duration: 4 },
    });
    expect(G.teamModsFor({ ...p, lordId: 'alchemist' })).toEqual({});

    let z = withCoins(prepGame(1, 'zeus_lord'), 5);
    expect(G.teamModsFor(z.players[0]!).openingStrike).toEqual({ targets: 2, damage: 90 });
    z = G.useLordAbility(G.useLordAbility(z, 0), 0);
    expect(z.players[0]!.lordState.bolts).toBe(2);
    expect(z.players[0]!.coins).toBe(3);
    expect(G.teamModsFor(z.players[0]!).openingStrike).toEqual({ targets: 2, damage: 180 });
  });

  test('naga song and spirit breaker charge bind to one hero (re-pickable)', () => {
    let s = withCoins(offer(offer(prepGame(1, 'naga_siren'), 'axe', 0), 'lina', 1), 30);
    s = G.buyHero(G.buyHero(s, 0, 0), 0, 1);
    const [a, b] = s.players[0]!.heroes.map((h) => h.uid) as [string, string];
    expect(G.heroModsFor(s.players[0]!, s.round)).toEqual({});
    s = G.useLordAbility(s, 0, a);
    expect(s.players[0]!.lordTarget).toBe(a);
    expect(s.players[0]!.coins).toBe(30 - 2 * HERO_COST);
    expect(G.heroModsFor(s.players[0]!, s.round)).toEqual({
      [a]: { hypnotize: { seconds: 4, hpPctPerSec: 6, damagePct: 80, immuneAfter: 6 } },
    });
    s = G.useLordAbility(s, 0, b);
    expect(Object.keys(G.heroModsFor(s.players[0]!, s.round))).toEqual([b]);

    const sb = withOne('spirit_breaker', 'axe');
    const t = G.useLordAbility(sb.s, 0, sb.uid);
    expect(G.heroModsFor(t.players[0]!, t.round)).toEqual({ [sb.uid]: { grantSpells: ['charge_of_darkness'] } });
  });

  test('riki buffs melee heroes, sniper buffs hunters', () => {
    let s = withCoins(offer(offer(prepGame(1, 'riki'), 'axe', 0), 'sniper', 1), 30);
    s = G.buyHero(G.buyHero(s, 0, 0), 0, 1);
    const p = s.players[0]!;
    const axe = p.heroes.find((h) => h.heroId === 'axe')!;
    const sniper = p.heroes.find((h) => h.heroId === 'sniper')!;
    const riki = G.heroModsFor(p, 1);
    expect(riki[axe.uid]).toEqual({ agiDamageMult: 1, moveSpeed: 20, invisibleOnKill: 3 });
    expect(riki[sniper.uid]).toBeUndefined();
    const sn = G.heroModsFor({ ...p, lordId: 'sniper_lord' }, 1);
    expect(sn[sniper.uid]).toEqual({ attackRange: 150, damagePct: 15, headshot: { chance: 40, damage: 60, knockback: 30 } });
    expect(sn[axe.uid]).toBeUndefined();
  });

  test('luna blessing stacks +11 damage per coin', () => {
    let { s, uid } = withOne('luna', 'axe', 10);
    for (let i = 0; i < 3; i++) s = G.useLordAbility(s, 0, uid);
    const p = s.players[0]!;
    expect(p.heroes[0]!.bonus?.damage).toBe(33);
    expect(p.lordState.blessings).toBe(3);
    expect(p.coins).toBe(10 - HERO_COST - 3);
    // no target -> no-op
    expect(G.useLordAbility(s, 0).players[0]!.coins).toBe(p.coins);
  });

  test('rubick: free Aghanim on rounds 6, 12, ...', () => {
    const at = (round: number) => {
      const c = structuredClone(prepGame(2, 'rubick'));
      c.phase = 'results';
      c.round = round - 1;
      return G.nextRound(c).players[0]!.itemInventory.filter((i) => i === 'aghanims_scepter').length;
    };
    expect(at(2)).toBe(0);
    expect(at(5)).toBe(0);
    expect(at(6)).toBe(1);
    expect(at(7)).toBe(0);
    expect(at(12)).toBe(1);
    expect(at(18)).toBe(1);
    // real flow
    const s = advance(prepGame(2, 'rubick'), 5);
    if (s.phase === 'prep' && s.round === 6) expect(s.players[0]!.itemInventory).toContain('aghanims_scepter');
  });

  test('juggernaut summon joins battle inputs only', () => {
    let { s } = withOne('juggernaut_lord', 'axe');
    const p = s.players[0]!;
    expect(G.lordSummon(p, 2)).toBeNull(); // joins from round 3
    const sum = G.lordSummon(p, 3)!;
    expect(sum.summon).toBe(true);
    expect(sum.uid).toBe('summon-0-3');
    expect(sum.heroId).toBe('juggernaut');
    expect(sum.level).toBe(3);
    expect(sum.spells).toEqual([...HERO_KITS.juggernaut.slice(0, 2), null, null, null]);
    expect(sum.items.filter(Boolean)).toEqual([]);
    expect(sum.items.length).toBe(ITEM_SLOTS);
    expect(p.heroes.some((h) => h.slot?.col === sum.slot!.col && h.slot.row === sum.slot!.row)).toBe(false);
    const late = G.lordSummon(p, 20)!;
    expect(late.level).toBe(12);
    expect(late.items.filter(Boolean)).toEqual(['broadsword']);
    expect(G.lordSummon(p, 60)!.level).toBe(12);
    expect(G.lordSummon({ ...p, lordId: 'axe_lord' }, 1)).toBeNull();

    s = G.readyForBattle(s);
    const pr = s.pairings.find((x) => x.left === 0 || x.right === 0)!;
    const io = G.pairingInputs(s, pr);
    const mine = pr.left === 0 ? io.left : io.right;
    expect(mine.heroes.some((h) => h.summon)).toBe(false); // round 1: no summon yet (joins from round 3; see mp.test)
    expect(s.players[0]!.heroes.length).toBe(1);
    s = G.finishBattle(s);
    expect(s.players[0]!.heroes.every((h) => !h.summon)).toBe(true);
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
