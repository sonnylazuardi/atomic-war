// Mobile: sticky hint/action bar for tap-to-assign (no drag-and-drop on touch screens).
import { SELL_ITEM, SELL_SPELL } from '../../../core/constants.ts';
import { useGame } from '../../store.ts';
import { itemDef, spellDef } from '../defs.ts';
import { useUi } from '../uiState.ts';

export function MobileBar() {
  const g = useGame();
  const ui = useUi();
  const me = g.players[0]!;
  if (g.phase !== 'prep') return null;
  const cancel = () => {
    ui.setPending(null);
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
