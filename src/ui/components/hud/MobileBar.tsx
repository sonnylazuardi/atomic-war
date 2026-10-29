// Mobile: sticky hint/action bar for tap-to-assign and equipped-slot actions (no drag / right-click on touch).
import { SELL_ITEM, SELL_SPELL } from '../../../core/constants.ts';
import { meOf } from '../../me.ts';
import { useGame } from '../../store.ts';
import { itemDef, spellDef } from '../defs.ts';
import { confirmInnateLoss, innate } from './actions.ts';
import { sellPayload } from './SellZone.tsx';
import { useUi } from '../uiState.ts';

export function MobileBar() {
  const g = useGame();
  const ui = useUi();
  const me = meOf(g);
  if (g.phase !== 'prep') return null;
  const cancel = () => {
    ui.setPending(null);
    ui.setSlotPick(null);
    ui.setLordTargeting(false);
  };
  if (ui.lordTargeting) {
    return (
      <div className="mbar">
        <span>Tap one of your heroes for the lord ability</span>
        <button className="btn sm" onClick={cancel}>
          Cancel
        </button>
      </div>
    );
  }
  const sp = ui.slotPick;
  const sh = sp ? me.heroes.find((h) => h.uid === sp.uid) : undefined;
  const sid = sp && sh ? (sp.kind === 'spell' ? sh.spells[sp.idx] : sh.items[sp.idx]) : null;
  if (sp && sh && sid) {
    const d = sp.kind === 'spell' ? spellDef(sid as never) : itemDef(sid as never);
    const lost = sp.kind === 'spell' && innate(sh, sid as never);
    const unequip = () => {
      if (sp.kind === 'spell') {
        if (!confirmInnateLoss(sh, sp.idx, 'remove')) return;
        g.unassignSpell(sh.uid, sp.idx);
      } else g.unequipItem(sh.uid, sp.idx);
      ui.setSlotPick(null);
    };
    const sell = () => {
      sellPayload(sp.kind === 'spell' ? { kind: 'spellSlot', uid: sh.uid, slot: sp.idx } : { kind: 'itemSlot', uid: sh.uid, slot: sp.idx });
      ui.setSlotPick(null);
    };
    if (sp.moving)
      return (
        <div className="mbar active" data-testid="slot-bar">
          <span className="mbar-glyph">{d.glyph}</span>
          <span>
            Move <b>{d.name}</b> — tap a hero or {sp.kind === 'spell' ? 'a spell slot' : 'an item slot'}
          </span>
          <button className="btn sm" onClick={cancel}>
            ✕
          </button>
        </div>
      );
    return (
      <div className="mbar active" data-testid="slot-bar">
        <span className="mbar-glyph">{d.glyph}</span>
        <span>
          <b>{d.name}</b>
        </span>
        {!lost && me.heroes.length > 1 && (
          <button className="btn sm" data-testid="slot-move" onClick={() => ui.setSlotPick({ ...sp, moving: true })}>
            Move
          </button>
        )}
        <button className="btn sm" data-testid="slot-unequip" onClick={unequip}>
          {lost ? 'Remove' : sp.kind === 'spell' ? 'Unassign' : 'Unequip'}
        </button>
        {!lost && (
          <button className="btn sm btn-danger" data-testid="slot-sell" onClick={sell}>
            Sell +${sp.kind === 'spell' ? SELL_SPELL : SELL_ITEM}
          </button>
        )}
        <button className="btn sm" onClick={cancel}>
          ✕
        </button>
      </div>
    );
  }
  const p = ui.pending;
  if (p) {
    const id = p.kind === 'spell' ? me.spellInventory[p.idx] : me.itemInventory[p.idx];
    if (!id) return null;
    const d = p.kind === 'spell' ? spellDef(id as never) : itemDef(id as never);
    return (
      <div className="mbar active">
        <span className="mbar-glyph">{d.glyph}</span>
        <span>
          <b>{d.name}</b> — tap a hero {p.kind === 'spell' ? 'or a spell slot' : 'or an item slot'}
        </span>
        <button
          className="btn sm btn-danger"
          onClick={() => {
            if (p.kind === 'spell') g.sellSpell(p.idx);
            else g.sellItem(p.idx);
            ui.setPending(null);
          }}
        >
          Sell +${p.kind === 'spell' ? SELL_SPELL : SELL_ITEM}
        </button>
        <button className="btn sm" onClick={cancel}>
          ✕
        </button>
      </div>
    );
  }
  return null;
}
