// Roster management: upgrade, sell, spells, items, placement.
import { LEVELS_PER_UPGRADE, MAX_HERO_LEVEL, SELL_HERO, SELL_ITEM, SELL_SPELL, boardCap, itemSellValue } from '../constants.ts';
import { ITEMS } from '../data/items.ts';
import { addLevels } from './lords.ts';
import { SPELLS } from '../data/spells.ts';
import type { BoardSlot, OwnedHero, PlayerState, SpellId } from '../types.ts';
import { say, boardCount, canBench, fail, findHero, heroName, isInnate, pure, slotFree, validSlot, type GS } from './util.ts';

/** Take a spell out of a hero slot: bought spells go back to the inventory, innate (kit) spells are destroyed. */
function releaseSpell(s: GS, p: PlayerState, h: OwnedHero, sp: SpellId, verb: string) {
  if (isInnate(h, sp)) {
    if (p.isHuman) say(s, p, `${SPELLS[sp]?.name ?? sp} was ${verb} (innate spells are lost).`);
  } else {
    p.spellInventory.push(sp);
  }
}

function prep(s: GS, pid: number) {
  const p = s.players[pid];
  if (!p) return null;
  if (s.phase !== 'prep') {
    fail(s, p, 'You can only do that during prep.');
    return null;
  }
  return p;
}

export function upgradeHeroM(s: GS, pid: number, uid: string) {
  const p = prep(s, pid);
  if (!p) return;
  const h = findHero(p, uid);
  if (!h) return fail(s, p, 'No such hero.');
  if (h.pendingUpgrades <= 0) return fail(s, p, 'No upgrade available.');
  if (h.level >= MAX_HERO_LEVEL) {
    h.pendingUpgrades = 0;
    return fail(s, p, 'Hero is already max level.');
  }
  h.pendingUpgrades--;
  addLevels(h, LEVELS_PER_UPGRADE);
  if (p.isHuman) say(s, p, `${heroName(h.heroId)} is now level ${h.level}.`);
}

export function sellHeroM(s: GS, pid: number, uid: string) {
  const p = prep(s, pid);
  if (!p) return;
  const idx = p.heroes.findIndex((h) => h.uid === uid);
  if (idx < 0) return fail(s, p, 'No such hero.');
  const h = p.heroes[idx]!;
  for (const sp of h.spells) if (sp && !isInnate(h, sp)) p.spellInventory.push(sp);
  for (const it of h.items) if (it) p.itemInventory.push(it);
  p.heroes.splice(idx, 1);
  p.coins += SELL_HERO;
  if (p.isHuman) say(s, p, `Sold ${heroName(h.heroId)} for ${SELL_HERO}.`);
}

export function sellSpellM(s: GS, pid: number, invIdx: number) {
  const p = prep(s, pid);
  if (!p) return;
  if (invIdx < 0 || invIdx >= p.spellInventory.length) return fail(s, p, 'No such spell.');
  p.spellInventory.splice(invIdx, 1);
  p.coins += SELL_SPELL;
}

export function sellItemM(s: GS, pid: number, invIdx: number) {
  const p = prep(s, pid);
  if (!p) return;
  if (invIdx < 0 || invIdx >= p.itemInventory.length) return fail(s, p, 'No such item.');
  const [id] = p.itemInventory.splice(invIdx, 1);
  p.coins += id ? itemSellValue(ITEMS[id]?.cost ?? 3) : SELL_ITEM;
}

export function assignSpellM(s: GS, pid: number, uid: string, slotIdx: number, invIdx: number) {
  const p = prep(s, pid);
  if (!p) return;
  const h = findHero(p, uid);
  if (!h) return fail(s, p, 'No such hero.');
  if (slotIdx < 0 || slotIdx >= h.spells.length) return fail(s, p, 'No such spell slot.');
  const sp = p.spellInventory[invIdx];
  if (!sp) return fail(s, p, 'No such spell.');
  if (h.spells.some((x, i) => x === sp && i !== slotIdx)) return fail(s, p, 'Hero already knows that spell.');
  p.spellInventory.splice(invIdx, 1);
  const prev = h.spells[slotIdx];
  h.spells[slotIdx] = sp;
  if (prev) releaseSpell(s, p, h, prev, 'replaced');
}

export function unassignSpellM(s: GS, pid: number, uid: string, slotIdx: number) {
  const p = prep(s, pid);
  if (!p) return;
  const h = findHero(p, uid);
  if (!h) return fail(s, p, 'No such hero.');
  if (slotIdx < 0 || slotIdx >= h.spells.length) return fail(s, p, 'No such spell slot.');
  const sp = h.spells[slotIdx];
  if (!sp) return;
  h.spells[slotIdx] = null;
  releaseSpell(s, p, h, sp, 'removed');
}

export function swapSpellSlotsM(s: GS, pid: number, uid: string, a: number, b: number) {
  const p = prep(s, pid);
  if (!p) return;
  const h = findHero(p, uid);
  if (!h) return fail(s, p, 'No such hero.');
  if (a < 0 || b < 0 || a >= h.spells.length || b >= h.spells.length) return fail(s, p, 'No such spell slot.');
  [h.spells[a], h.spells[b]] = [h.spells[b]!, h.spells[a]!];
}

export function equipItemM(s: GS, pid: number, uid: string, slotIdx: number, invIdx: number) {
  const p = prep(s, pid);
  if (!p) return;
  const h = findHero(p, uid);
  if (!h) return fail(s, p, 'No such hero.');
  if (slotIdx < 0 || slotIdx >= h.items.length) return fail(s, p, 'No such item slot.');
  const it = p.itemInventory[invIdx];
  if (!it) return fail(s, p, 'No such item.');
  p.itemInventory.splice(invIdx, 1);
  const prev = h.items[slotIdx];
  if (prev) p.itemInventory.push(prev);
  h.items[slotIdx] = it;
}

export function unequipItemM(s: GS, pid: number, uid: string, slotIdx: number) {
  const p = prep(s, pid);
  if (!p) return;
  const h = findHero(p, uid);
  if (!h) return fail(s, p, 'No such hero.');
  const it = h.items[slotIdx];
  if (!it) return;
  p.itemInventory.push(it);
  h.items[slotIdx] = null;
}

export function placeHeroM(s: GS, pid: number, uid: string, slot: BoardSlot | null) {
  const p = prep(s, pid);
  if (!p) return;
  const h = findHero(p, uid);
  if (!h) return fail(s, p, 'No such hero.');
  if (slot === null) {
    if (h.slot === null) return;
    if (!canBench(p)) return fail(s, p, 'Bench is full.');
    h.slot = null;
    return;
  }
  if (!validSlot(slot)) return fail(s, p, 'Invalid board slot.');
  const occupant = p.heroes.find((o) => o.uid !== uid && o.slot && o.slot.col === slot.col && o.slot.row === slot.row);
  if (occupant) {
    occupant.slot = h.slot ? { ...h.slot } : null;
    h.slot = { col: slot.col, row: slot.row };
    return;
  }
  if (h.slot === null && boardCount(p) >= boardCap(s.round)) {
    return fail(s, p, `Board is full (${boardCap(s.round)} heroes max).`);
  }
  if (!slotFree(p, slot, uid)) return;
  h.slot = { col: slot.col, row: slot.row };
}

export const upgradeHero = pure(upgradeHeroM);
export const sellHero = pure(sellHeroM);
export const sellSpell = pure(sellSpellM);
export const sellItem = pure(sellItemM);
export const assignSpell = pure(assignSpellM);
export const unassignSpell = pure(unassignSpellM);
export const swapSpellSlots = pure(swapSpellSlotsM);
export const equipItem = pure(equipItemM);
export const unequipItem = pure(unequipItemM);
export const placeHero = pure(placeHeroM);
