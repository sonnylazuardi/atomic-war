import { describe, expect, test } from 'bun:test';
import { HERO_IDS, ITEM_IDS, SIGNATURE_SPELLS, SPELL_IDS } from '../src/core/ids.ts';
import { HEROES } from '../src/core/data/heroes.ts';
import { SPELLS } from '../src/core/data/spells.ts';
import { ITEMS } from '../src/core/data/items.ts';

const pos = (n: number) => Number.isFinite(n) && n > 0;
const nonNeg = (n: number) => Number.isFinite(n) && n >= 0;

/** every number nested in a value is finite */
function allFinite(v: unknown): boolean {
  if (typeof v === 'number') return Number.isFinite(v);
  if (Array.isArray(v)) return v.every(allFinite);
  if (v && typeof v === 'object') return Object.values(v).every(allFinite);
  return true;
}

describe('heroes', () => {
  test('every hero id has a def with matching id and signature', () => {
    expect(Object.keys(HEROES).sort()).toEqual([...HERO_IDS].sort());
    for (const id of HERO_IDS) {
      const h = HEROES[id];
      expect(h.id).toBe(id);
      expect(h.signature).toBe(SIGNATURE_SPELLS[id]);
      expect(SPELLS[h.signature]).toBeDefined();
    }
  });

  test('numbers are sane', () => {
    for (const h of Object.values(HEROES)) {
      expect(allFinite(h)).toBe(true);
      for (const n of [h.attackRange, h.baseStr, h.baseAgi, h.baseInt, h.gainStr, h.gainAgi, h.gainInt, h.baseDamage, h.bat, h.moveSpeed])
        expect(pos(n)).toBe(true);
      expect(nonNeg(h.baseArmor)).toBe(true);
      if (h.ranged) {
        expect(h.attackRange).toBeGreaterThanOrEqual(250);
        expect(pos(h.projectileSpeed)).toBe(true);
      } else {
        expect(h.attackRange).toBeLessThan(150);
        expect(h.projectileSpeed).toBe(0);
      }
      for (const c of [h.palette.primary, h.palette.secondary, h.palette.accent]) expect(c).toMatch(/^#[0-9a-f]{6}$/i);
      expect(h.blurb.length).toBeGreaterThan(10);
    }
  });

  test('stars 1..5, every star used', () => {
    const used = new Set<number>();
    for (const h of Object.values(HEROES)) {
      expect(Number.isInteger(h.stars)).toBe(true);
      expect(h.stars).toBeGreaterThanOrEqual(1);
      expect(h.stars).toBeLessThanOrEqual(5);
      used.add(h.stars);
    }
    expect([...used].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  test('sniper has the longest range', () => {
    const max = Math.max(...Object.values(HEROES).map((h) => h.attackRange));
    expect(HEROES.sniper.attackRange).toBe(max);
  });
});

describe('spells', () => {
  test('every spell id has a def with matching id', () => {
    expect(Object.keys(SPELLS).sort()).toEqual([...SPELL_IDS].sort());
    for (const id of SPELL_IDS) expect(SPELLS[id].id).toBe(id);
  });

  test('numbers and shape are sane', () => {
    for (const s of Object.values(SPELLS)) {
      expect(allFinite(s)).toBe(true);
      expect(s.levelScaling).toBeGreaterThanOrEqual(0.02);
      expect(s.levelScaling).toBeLessThanOrEqual(0.08);
      expect(pos(s.vfx.duration)).toBe(true);
      expect(s.vfx.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(s.glyph.length).toBeGreaterThan(0);
      expect(nonNeg(s.castRange)).toBe(true);
      expect(nonNeg(s.castPoint)).toBe(true);
      if (s.kind === 'active') {
        expect(s.effects.length).toBeGreaterThan(0);
        expect(s.manaCost).toBeGreaterThanOrEqual(60);
        expect(s.manaCost).toBeLessThanOrEqual(250);
        expect(s.cooldown).toBeGreaterThanOrEqual(6);
        expect(s.cooldown).toBeLessThanOrEqual(40);
      } else {
        expect(s.passives?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  test('stars 1..5, every star used, ultimates are 4★+', () => {
    const used = new Set<number>();
    for (const s of Object.values(SPELLS)) {
      expect(Number.isInteger(s.stars)).toBe(true);
      expect(s.stars).toBeGreaterThanOrEqual(1);
      expect(s.stars).toBeLessThanOrEqual(5);
      used.add(s.stars);
    }
    expect([...used].sort()).toEqual([1, 2, 3, 4, 5]);
    for (const id of ['black_hole', 'omnislash', 'global_silence', 'thundergods_wrath', 'laguna_blade', 'chain_frost'] as const)
      expect(SPELLS[id].stars).toBeGreaterThanOrEqual(4);
  });

  test('stacking signatures grant permanent stats', () => {
    const stacks = (id: keyof typeof SPELLS) => SPELLS[id].passives?.find((p) => p.t === 'on_kill_stack');
    expect(stacks('flesh_heap')).toMatchObject({ attr: 'str' });
    expect(stacks('essence_shift')).toMatchObject({ attr: 'agi' });
    expect(stacks('glaives_of_wisdom')).toMatchObject({ attr: 'int' });
  });
});

describe('items', () => {
  test('every item id has a def with matching id', () => {
    expect(Object.keys(ITEMS).sort()).toEqual([...ITEM_IDS].sort());
    for (const id of ITEM_IDS) expect(ITEMS[id].id).toBe(id);
  });

  test('numbers are sane and costs follow tiers', () => {
    for (const it of Object.values(ITEMS)) {
      expect(allFinite(it)).toBe(true);
      expect(pos(it.cost)).toBe(true);
      expect(Number.isInteger(it.tier)).toBe(true);
      expect(it.tier).toBeGreaterThanOrEqual(1);
      expect(it.tier).toBeLessThanOrEqual(6);
      expect(it.cost).toBe(it.tier >= 5 ? it.tier : 3);
      expect(it.description.length).toBeGreaterThan(0);
      if (it.active?.when === 'cooldown') expect(pos(it.active.cooldown ?? 0)).toBe(true);
    }
  });

  test('every tier 1..6 has shop items', () => {
    for (let tier = 1; tier <= 6; tier++)
      expect(Object.values(ITEMS).some((i) => i.tier === tier && !i.lordOnly)).toBe(true);
  });

  test('only the two lord items are lordOnly', () => {
    const lordOnly = Object.values(ITEMS)
      .filter((i) => i.lordOnly)
      .map((i) => i.id)
      .sort();
    expect(lordOnly).toEqual(['broken_sword', 'divine_sword_of_the_sun']);
  });
});

describe('aghanim upgrades', () => {
  const ALLOWED = new Set(['effects', 'passives', 'cooldown', 'manaCost', 'castRange', 'castPoint', 'aoeRadius', 'target', 'ai']);

  test('new heroes are present with their signatures', () => {
    for (const id of ['dragon_knight', 'windranger', 'jakiro'] as const) {
      expect(HEROES[id]).toBeDefined();
      expect(HEROES[id].signature).toBe(SIGNATURE_SPELLS[id]);
    }
  });

  test('every signature spell has an aghanim upgrade', () => {
    for (const id of HERO_IDS) {
      const agh = SPELLS[SIGNATURE_SPELLS[id]].aghanim;
      expect(agh).toBeDefined();
      expect(agh!.description.length).toBeGreaterThan(5);
      expect(Object.keys(agh!.patch).length).toBeGreaterThan(0);
    }
  });

  test('patches only use allowed keys and sane values', () => {
    for (const s of Object.values(SPELLS)) {
      if (!s.aghanim) continue;
      for (const k of Object.keys(s.aghanim.patch)) expect(ALLOWED.has(k)).toBe(true);
      expect(allFinite(s.aghanim.patch)).toBe(true);
      const p = s.aghanim.patch;
      if (s.kind === 'active') expect((p.effects ?? s.effects).length).toBeGreaterThan(0);
      else expect((p.passives ?? s.passives ?? []).length).toBeGreaterThan(0);
      if (p.cooldown !== undefined) expect(p.cooldown).toBeGreaterThan(0);
    }
  });

  test("aghanim's scepter and black king bar are in the shop", () => {
    expect(ITEMS.aghanims_scepter.lordOnly).toBeFalsy();
    expect(ITEMS.black_king_bar.lordOnly).toBeFalsy();
    const bkb = ITEMS.black_king_bar.active?.effects[0];
    expect(bkb).toMatchObject({ t: 'custom', id: 'spell_immune' });
  });
});
