// Trash zone (bottom-left) shown while dragging anything sellable: drop = sell.
import { SELL_HERO, SELL_SPELL, itemSellValue } from '../../../core/constants.ts';
import { meOf } from '../../me.ts';
import { useGame } from '../../store.ts';
import { heroDef, itemDef, spellDef } from '../defs.ts';
import { useDragState, useDrop, type DragPayload } from '../dnd.ts';
import { useUi } from '../uiState.ts';
import { innate } from './actions.ts';

interface Quote {
  value: number;
  destroy: boolean;
  name: string;
}

function quote(p: DragPayload): Quote | null {
  const me = meOf(useGame.getState());
  switch (p.kind) {
    case 'spellInv': {
      const id = me.spellInventory[p.idx];
      return id ? { value: SELL_SPELL, destroy: false, name: spellDef(id).name } : null;
    }
    case 'itemInv': {
      const id = me.itemInventory[p.idx];
      return id ? { value: itemSellValue(itemDef(id).cost), destroy: false, name: itemDef(id).name } : null;
    }
    case 'spellSlot': {
      const h = me.heroes.find((x) => x.uid === p.uid);
      const id = h?.spells[p.slot];
      if (!h || !id) return null;
      const lost = innate(h, id);
      return { value: lost ? 0 : SELL_SPELL, destroy: lost, name: spellDef(id).name };
    }
    case 'itemSlot': {
      const h = me.heroes.find((x) => x.uid === p.uid);
      const id = h?.items[p.slot];
      return id ? { value: itemSellValue(itemDef(id).cost), destroy: false, name: itemDef(id).name } : null;
    }
    case 'hero': {
      const h = me.heroes.find((x) => x.uid === p.uid);
      return h ? { value: SELL_HERO, destroy: false, name: heroDef(h.heroId).name } : null;
    }
  }
}

/** Sell whatever the payload points at. */
export function sellPayload(p: DragPayload) {
  const g = useGame.getState();
  if (g.phase !== 'prep') return;
  const me = () => meOf(useGame.getState());
  switch (p.kind) {
    case 'spellInv':
      g.sellSpell(p.idx);
      break;
    case 'itemInv':
      g.sellItem(p.idx);
      break;
    case 'spellSlot': {
      const h = me().heroes.find((x) => x.uid === p.uid);
      const id = h?.spells[p.slot];
      if (!h || !id) return;
      const lost = innate(h, id);
      g.unassignSpell(p.uid, p.slot); // innate spells are destroyed here (no coins)
      if (!lost) {
        const inv = me().spellInventory;
        const i = inv.lastIndexOf(id);
        if (i >= 0) useGame.getState().sellSpell(i);
      }
      break;
    }
    case 'itemSlot': {
      const id = me().heroes.find((x) => x.uid === p.uid)?.items[p.slot];
      if (!id) return;
      g.unequipItem(p.uid, p.slot);
      const i = me().itemInventory.lastIndexOf(id);
      if (i >= 0) useGame.getState().sellItem(i);
      break;
    }
    case 'hero':
      g.sellHero(p.uid);
      if (useUi.getState().selectedUid === p.uid) useUi.getState().select(null);
      break;
  }
  useUi.getState().setPending(null);
}

export function SellZone() {
  const payload = useDragState((s) => s.payload);
  const worldUid = useDragState((s) => s.worldHeroUid);
  const phase = useGame((s) => s.phase);
  useGame((s) => s.players); // re-quote when state changes
  const drop = useDrop(
    (p) => phase === 'prep' && quote(p) !== null,
    (p) => sellPayload(p),
  );
  const active: DragPayload | null = payload ?? (worldUid ? { kind: 'hero', uid: worldUid } : null);
  const q = active && phase === 'prep' ? quote(active) : null;
  if (!q) return null;
  return (
    <div className={`sell-zone ${drop.over ? 'over' : ''} ${q.destroy ? 'destroy' : ''}`} data-testid="sell-zone" {...drop.props}>
      <div className="sz-can" aria-hidden>
        <span className="sz-arrow">▼</span>
        <svg viewBox="0 0 40 44">
          <path d="M6 10h28l-2.5 30a3 3 0 0 1-3 3h-17a3 3 0 0 1-3-3z" fill="currentColor" />
          <rect x="3" y="5" width="34" height="5" rx="1.5" fill="currentColor" />
          <rect x="15" y="1" width="10" height="5" rx="1.5" fill="currentColor" />
          <path d="M14 16v21M20 16v21M26 16v21" stroke="rgba(0,0,0,.35)" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </div>
      <div className="sz-text">
        <div className="sz-value">{q.destroy ? 'Destroy' : `+${q.value} $`}</div>
        <div className="sz-name">{q.destroy ? `${q.name} (innate, lost)` : `Sell ${q.name}`}</div>
      </div>
    </div>
  );
}
