// Shared HUD actions: hero click (lord targeting > click-to-assign > select), drops onto heroes, lord key.
import { lordActiveAvailable } from '../../../core/game/lords.ts';
import { HERO_KITS } from '../../../core/ids.ts';
import type { OwnedHero, SpellId } from '../../../core/types.ts';
import { useGame } from '../../store.ts';
import { lordDef, spellDef } from '../defs.ts';
import type { DragPayload } from '../dnd.ts';
import { useUi } from '../uiState.ts';

export const me = () => useGame.getState().players[0]!;
export const isPrep = () => useGame.getState().phase === 'prep';

/** Kit spells (Q/W/E/R) are innate: replacing or removing one destroys it. */
export function innate(h: OwnedHero, id: SpellId | null | undefined): boolean {
  if (!id) return false;
  const kit = (HERO_KITS as Partial<Record<string, readonly string[]>>)[h.heroId];
  return !!kit?.includes(id);
}

/** First empty skill slot; when all are full, the last slot (asks before destroying an innate spell). */
export function firstSpellSlot(h: OwnedHero): number {
  if (!h.spells.length) return -1;
  const i = h.spells.findIndex((s) => !s);
  return i >= 0 ? i : h.spells.length - 1;
}

/** Confirm before an innate spell is destroyed (replace / remove). */
export function confirmInnateLoss(h: OwnedHero, slot: number, verb: 'replace' | 'remove'): boolean {
  const cur = h.spells[slot];
  if (!innate(h, cur)) return true;
  const name = spellDef(cur!).name;
  return window.confirm(`${verb === 'replace' ? 'Replace' : 'Remove'} ${name}? It is innate and will be lost.`);
}

export function assignSpellSafe(h: OwnedHero, slot: number, invIdx: number) {
  if (slot < 0 || !confirmInnateLoss(h, slot, 'replace')) return false;
  useGame.getState().assignSpell(h.uid, slot, invIdx);
  return true;
}

export function firstItemSlot(h: OwnedHero): number {
  const i = h.items.findIndex((s) => !s);
  return i >= 0 ? i : h.items.length - 1;
}

export function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** Click on a hero (roster row or World sprite). */
export function clickHero(uid: string | null) {
  const ui = useUi.getState();
  const g = useGame.getState();
  const h = uid ? g.players[0]!.heroes.find((x) => x.uid === uid) : undefined;
  if (!h) {
    ui.select(null);
    return;
  }
  if (g.phase === 'prep' && ui.lordTargeting) {
    g.useLordAbility(h.uid);
    ui.setLordTargeting(false);
    ui.select(h.uid);
    return;
  }
  if (g.phase === 'prep' && ui.pending) {
    if (ui.pending.kind === 'spell') assignSpellSafe(h, firstSpellSlot(h), ui.pending.idx);
    else g.equipItem(h.uid, firstItemSlot(h), ui.pending.idx);
    ui.setPending(null);
  }
  ui.select(h.uid);
}

/** A HUD drag payload dropped onto one of the human's heroes. */
export function dropOnHero(p: DragPayload, uid: string) {
  const g = useGame.getState();
  if (g.phase !== 'prep') return;
  const h = g.players[0]!.heroes.find((x) => x.uid === uid);
  if (!h) return;
  if (p.kind === 'spellInv') assignSpellSafe(h, firstSpellSlot(h), p.idx);
  else if (p.kind === 'itemInv') g.equipItem(h.uid, firstItemSlot(h), p.idx);
  else if (p.kind === 'hero' && p.uid !== h.uid && h.slot) g.placeHero(p.uid, h.slot);
  else return;
  useUi.getState().setPending(null);
  useUi.getState().select(h.uid);
}

/** V key / lord button. */
export function triggerLord() {
  const g = useGame.getState();
  const p = g.players[0]!;
  if (g.phase !== 'prep' || !p.lordId) return;
  const l = lordDef(p.lordId);
  if (l.kind !== 'active') return;
  const ui = useUi.getState();
  if (ui.lordTargeting) return ui.setLordTargeting(false);
  if (!safe(() => lordActiveAvailable(p), true)) return;
  if (l.needsTarget) ui.setLordTargeting(true);
  else g.useLordAbility();
}
