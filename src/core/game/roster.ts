// Roster management: upgrade, sell, spells, items, placement.
import { LEVELS_PER_UPGRADE, MAX_HERO_LEVEL, SELL_HERO, SELL_ITEM, SELL_SPELL, boardCap } from '../constants.ts';
import type { BoardSlot } from '../types.ts';
import { addLevels } from './lords.ts';
import { boardCount, canBench, fail, findHero, heroName, log, pure, slotFree, validSlot, type GS } from './util.ts';

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
  if (p.isHuman) log(s, `${heroName(h.heroId)} is now level ${h.level}.`);
}

export function sellHeroM(s: GS, pid: number, uid: string) {
  const p = prep(s, pid);
  if (!p) return;
  const idx = p.heroes.findIndex((h) => h.uid === uid);
  if (idx < 0) return fail(s, p, 'No such hero.');
  const h = p.heroes[idx]!;
  for (let i = 1; i < h.spells.length; i++) {
    const sp = h.spells[i];
    if (sp) p.spellInventory.push(sp);
  }
  for (const it of h.items) if (it) p.itemInventory.push(it);
  p.heroes.splice(idx, 1);
  p.coins += SELL_HERO;
  if (p.isHuman) log(s, `Sold ${heroName(h.heroId)} for ${SELL_HERO}.`);
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
  p.itemInventory.splice(invIdx, 1);
  p.coins += SELL_ITEM;
}

export function assignSpellM(s: GS, pid: number, uid: string, slotIdx: number, invIdx: number) {
  const p = prep(s, pid);
  if (!p) return;
  const h = findHero(p, uid);
  if (!h) return fail(s, p, 'No such hero.');
  if (slotIdx < 1 || slotIdx >= h.spells.length) return fail(s, p, 'That spell slot is locked.');
  const sp = p.spellInventory[invIdx];
  if (!sp) return fail(s, p, 'No such spell.');
  if (h.spells.some((x, i) => x === sp && i !== slotIdx)) return fail(s, p, 'Hero already knows that spell.');
  p.spellInventory.splice(invIdx, 1);
  const prev = h.spells[slotIdx];
  if (prev) p.spellInventory.push(prev);
  h.spells[slotIdx] = sp;
}

export function unassignSpellM(s: GS, pid: number, uid: string, slotIdx: number) {
  const p = prep(s, pid);
  if (!p) return;
  const h = findHero(p, uid);
  if (!h) return fail(s, p, 'No such hero.');
  if (slotIdx < 1 || slotIdx >= h.spells.length) return fail(s, p, 'Cannot remove that spell.');
  const sp = h.spells[slotIdx];
  if (!sp) return;
  p.spellInventory.push(sp);
  h.spells[slotIdx] = null;
}

export function swapSpellSlotsM(s: GS, pid: number, uid: string, a: number, b: number) {
  const p = prep(s, pid);
  if (!p) return;
  const h = findHero(p, uid);
  if (!h) return fail(s, p, 'No such hero.');
  if (a < 1 || b < 1 || a >= h.spells.length || b >= h.spells.length) return fail(s, p, 'Cannot move the signature spell.');
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
    return fail(s, p, `Board is full (${boardCap(s.round)} heroes this round).`);
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
