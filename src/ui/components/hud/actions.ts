// Shared HUD actions: hero click (lord targeting > click-to-assign > select), drops onto heroes, lord key.
import { boardCap } from '../../../core/constants.ts';
import { boardCount, firstFreeSlot } from '../../../core/game/index.ts';
import { lordActiveAvailable } from '../../../core/game/lords.ts';
import type { OwnedHero, PlayerState } from '../../../core/types.ts';
import { useGame } from '../../store.ts';
import { lordDef } from '../defs.ts';
import type { DragPayload } from '../dnd.ts';
import { useUi } from '../uiState.ts';

export const me = () => useGame.getState().players[0]!;
export const isPrep = () => useGame.getState().phase === 'prep';

export function firstSpellSlot(h: OwnedHero): number {
  if (h.spells.length < 2) return -1;
  const i = h.spells.findIndex((s, k) => k >= 1 && !s);
  return i >= 1 ? i : h.spells.length - 1;
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
    if (ui.pending.kind === 'spell') {
      const s = firstSpellSlot(h);
      if (s >= 1) g.assignSpell(h.uid, s, ui.pending.idx);
    } else g.equipItem(h.uid, firstItemSlot(h), ui.pending.idx);
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
  if (p.kind === 'spellInv') {
    const s = firstSpellSlot(h);
    if (s >= 1) g.assignSpell(h.uid, s, p.idx);
  } else if (p.kind === 'itemInv') g.equipItem(h.uid, firstItemSlot(h), p.idx);
  else if (p.kind === 'hero' && p.uid !== h.uid && h.slot) g.placeHero(p.uid, h.slot);
  else return;
  useUi.getState().setPending(null);
  useUi.getState().select(h.uid);
}

export function canGoToBoard(p: PlayerState, round: number) {
  return boardCount(p) < boardCap(round);
}

export function sendToBoard(h: OwnedHero) {
  const g = useGame.getState();
  const p = g.players[0]!;
  if (!canGoToBoard(p, g.round)) return;
  const slot = safe(() => firstFreeSlot(p, h.heroId), null);
  if (slot) g.placeHero(h.uid, slot);
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
