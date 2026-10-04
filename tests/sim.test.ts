import { describe, expect, test } from 'bun:test';
import type { BattleTeamInput, HeroId, ItemId, OwnedHero, SpellId } from '../src/core/types.ts';
import { HERO_IDS, ITEM_IDS, SHOP_SPELL_IDS, SIGNATURE_SPELLS, SPELL_IDS } from '../src/core/ids.ts';
import { BATTLE_TIME_LIMIT, ITEM_SLOTS, SIM_DT, spellSlotsForLevel } from '../src/core/constants.ts';
import { createRng, type Rng } from '../src/core/rng.ts';
import { runBattle } from '../src/core/sim/battle.ts';
import { computeStats, heroPower } from '../src/core/stats.ts';
import { HEROES, ITEMS, SPELLS } from '../src/core/data/index.ts';

let uidSeq = 0;
function mk(
  heroId: HeroId,
  level = 1,
  o: { spells?: (SpellId | null)[]; items?: (ItemId | null)[]; col?: number; row?: number; uid?: string } = {},
): OwnedHero {
  const slots = spellSlotsForLevel(level);
  const spells: (SpellId | null)[] = [SIGNATURE_SPELLS[heroId]];
  for (const s of o.spells ?? []) spells.push(s);
  while (spells.length < slots) spells.push(null);
  const items: (ItemId | null)[] = [...(o.items ?? [])];
  while (items.length < ITEM_SLOTS) items.push(null);
  return {
    uid: o.uid ?? `h${uidSeq++}`,
    heroId,
    level,
    pendingUpgrades: 0,
    spells: spells.slice(0, Math.max(slots, spells.length)),
    items,
    stacks: { str: 0, agi: 0, int: 0 },
    slot: { col: o.col ?? 0, row: o.row ?? 1 },
    kills: 0,
  };
}

const team = (heroes: OwnedHero[], playerId = 0): BattleTeamInput => ({ playerId, heroes, mods: {} });

function randomTeam(rng: Rng, n: number, prefix: string): OwnedHero[] {
  const out: OwnedHero[] = [];
  const cells: { col: number; row: number }[] = [];
  for (let c = 0; c < 4; c++) for (let r = 0; r < 3; r++) cells.push({ col: c, row: r });
  rng.shuffle(cells);
  for (let i = 0; i < n; i++) {
    const heroId = rng.pick(HERO_IDS);
    const level = rng.int(1, 30);
    const extra: SpellId[] = [];
    for (let k = 1; k < spellSlotsForLevel(level); k++) extra.push(rng.pick(SHOP_SPELL_IDS));
    const items: ItemId[] = [];
    for (let k = 0; k < rng.int(0, 3); k++) items.push(rng.pick(ITEM_IDS));
    out.push(mk(heroId, level, { spells: extra, items, col: cells[i]!.col, row: cells[i]!.row, uid: `${prefix}${i}` }));
  }
  return out;
}

describe('stats', () => {
  test('computeStats basics', () => {
    const s1 = computeStats(mk('pudge', 1));
    const s20 = computeStats(mk('pudge', 20, { items: ['heart_of_tarrasque'] }));
    expect(s1.maxHp).toBeGreaterThan(200);
    expect(s20.maxHp).toBeGreaterThan(s1.maxHp);
    expect(s1.attackInterval).toBeCloseTo(s1.bat / (s1.attackSpeed / 100), 6);
    expect(s1.attackSpeed).toBeGreaterThanOrEqual(20);
    expect(computeStats(mk('pudge', 1), { hpPct: 50 }).maxHp).toBeCloseTo(s1.maxHp * 1.5, 3);
    expect(heroPower(mk('pudge', 20))).toBeGreaterThan(heroPower(mk('pudge', 1)));
  });
  test('every hero computes finite stats', () => {
    for (const id of HERO_IDS) {
      const s = computeStats(mk(id, 30, { items: ['divine_rapier', 'butterfly', 'satanic'] }));
      for (const v of Object.values(s)) if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
    }
  });
});

describe('runBattle', () => {
  test('data is loaded', () => {
    expect(Object.keys(HEROES).length).toBe(HERO_IDS.length);
    expect(Object.keys(SPELLS).length).toBe(SPELL_IDS.length);
    expect(Object.keys(ITEMS).length).toBeGreaterThan(0);
  });

  test('empty teams', () => {
    expect(runBattle(team([mk('axe')]), team([]), 1, { record: false }).winner).toBe('left');
    expect(runBattle(team([]), team([mk('axe')]), 1, { record: true }).winner).toBe('right');
    expect(runBattle(team([]), team([]), 1, { record: false }).winner).toBe('draw');
  });

  test('determinism: same seed -> identical result', () => {
    for (let s = 0; s < 5; s++) {
      const rng = createRng(1000 + s);
      const l = randomTeam(rng, 5, 'L');
      const r = randomTeam(rng, 5, 'R');
      const a = runBattle(team(l), team(r), 77 + s, { record: true });
      const b = runBattle(team(l), team(r), 77 + s, { record: true });
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      const c = runBattle(team(l), team(r), 77 + s, { record: false });
      expect(c.winner).toBe(a.winner);
      expect(c.duration).toBe(a.duration);
    }
  });

  test('always terminates within the time limit', () => {
    // two immortal-ish tanks that barely hurt each other -> draw at the limit
    const a = runBattle(team([mk('pudge', 30, { items: ['heart_of_tarrasque'] })]), team([mk('pudge', 30, { items: ['heart_of_tarrasque'] })]), 3, {
      record: false,
      maxDuration: 5,
    });
    expect(a.duration).toBeLessThanOrEqual(5 + 1e-6);
    expect(a.winner).toBe('draw');
    for (let s = 0; s < 30; s++) {
      const rng = createRng(s);
      const res = runBattle(team(randomTeam(rng, rng.int(1, 6), 'L')), team(randomTeam(rng, rng.int(1, 6), 'R')), s, { record: false });
      expect(res.duration).toBeLessThanOrEqual(BATTLE_TIME_LIMIT + 1e-6);
      expect(['left', 'right', 'draw']).toContain(res.winner);
    }
  });

  test('records a frame every tick plus events', () => {
    const res = runBattle(team([mk('lina', 10)]), team([mk('axe', 10)]), 5, { record: true });
    const ticks = Math.round(res.duration / SIM_DT);
    expect(res.frames.length).toBe(ticks + 1);
    expect(res.events.at(-1)?.kind).toBe('end');
    expect(res.events.some((e) => e.kind === 'attack')).toBe(true);
    expect(res.events.some((e) => e.kind === 'damage')).toBe(true);
    expect(res.events.some((e) => e.kind === 'death')).toBe(true);
    const anims = new Set(res.frames.flatMap((f) => f.units.map((u) => u.anim)));
    expect(anims.has('walk')).toBe(true);
    expect(anims.has('attack')).toBe(true);
  });

  test('a level-20 hero with items beats a level-1 hero', () => {
    for (let s = 0; s < 5; s++) {
      const res = runBattle(
        team([mk('juggernaut', 20, { items: ['daedalus', 'heart_of_tarrasque', 'butterfly'] })]),
        team([mk('juggernaut', 1)]),
        s,
        { record: false },
      );
      expect(res.winner).toBe('left');
    }
  });

  test('pudge flesh heap records permanent STR stacks on kills', () => {
    const pudge = mk('pudge', 25, { items: ['divine_rapier', 'heart_of_tarrasque', 'satanic'], uid: 'pudge' });
    const res = runBattle(team([pudge]), team([mk('lina', 1, { col: 3 }), mk('zeus', 1, { col: 3, row: 0 }), mk('sniper', 1, { col: 3, row: 2 })]), 9, {
      record: true,
    });
    expect(res.winner).toBe('left');
    const g = res.gains['pudge']!;
    expect(g.kills).toBe(3);
    expect(g.str).toBe(6);
    expect(res.events.filter((e) => e.kind === 'stack').length).toBe(3);
  });

  test('every spell runs without throwing (hero vs 3 enemies)', () => {
    const neverCast: string[] = [];
    for (const sid of SPELL_IDS) {
      let cast = false;
      for (let s = 0; s < 3; s++) {
        const me = mk('dazzle', 20, { spells: [sid as SpellId], uid: 'me' });
        const ally = mk('axe', 5, { uid: 'ally', row: 0 });
        const enemies = [mk('pudge', 15, { uid: 'e0' }), mk('lina', 12, { uid: 'e1', col: 2, row: 0 }), mk('axe', 12, { uid: 'e2', col: 1, row: 2 })];
        const res = runBattle(team([me, ally]), team(enemies), s, { record: true });
        expect(res.frames.length).toBeGreaterThan(1);
        if (res.events.some((e) => (e.kind === 'cast' || e.kind === 'proc') && e.spellId === sid)) cast = true;
      }
      if (SPELLS[sid as SpellId]?.kind === 'active' && !cast) neverCast.push(sid);
    }
    if (neverCast.length) console.log('actives never cast in test setup:', neverCast.join(', '));
  });

  test('every hero signature runs', () => {
    for (const h of HERO_IDS) {
      const res = runBattle(team([mk(h, 20, { uid: 'a' })]), team([mk('axe', 10), mk('lina', 10, { col: 2 }), mk('slark', 10, { row: 0 })]), 4, {
        record: true,
      });
      expect(res.duration).toBeGreaterThan(0);
    }
  });

  test('every item runs without throwing', () => {
    for (const iid of ITEM_IDS) {
      const me = mk('ursa', 15, { items: [iid], uid: 'me' });
      const res = runBattle(team([me]), team([mk('axe', 10), mk('lina', 10, { col: 2 })]), 11, { record: true });
      expect(res.duration).toBeGreaterThan(0);
      if (ITEMS[iid]?.active) {
        const fired = res.events.some((e) => e.kind === 'item' && e.itemId === iid);
        if (!fired) console.log('item active never fired:', iid);
      }
    }
  });

  test('performance: 100 random 5v5 battles', () => {
    const t0 = performance.now();
    for (let s = 0; s < 100; s++) {
      const rng = createRng(5000 + s);
      runBattle(team(randomTeam(rng, 5, 'L')), team(randomTeam(rng, 5, 'R')), s, { record: false });
    }
    const ms = performance.now() - t0;
    console.log(`100 battles: ${ms.toFixed(0)}ms (${(ms / 100).toFixed(2)}ms each)`);
    expect(ms).toBeLessThan(4000);
  });
});
