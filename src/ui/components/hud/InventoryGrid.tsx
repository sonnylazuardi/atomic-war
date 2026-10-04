// Bottom-right inventory grid: spells then items. Drag onto heroes, click-to-assign, right-click sells.
import { SELL_ITEM, SELL_SPELL } from '../../../core/constants.ts';
import { meOf } from '../../me.ts';
import { useGame } from '../../store.ts';
import { itemDef, spellDef, starColor } from '../defs.ts';
import { dragProps, useDrop } from '../dnd.ts';
import { ItemTip, SpellTip, tip } from '../Tooltip.tsx';
import { useUi } from '../uiState.ts';
import { isTouch } from './layout.ts';

const MIN_CELLS = 12;

export function InventoryGrid() {
  const g = useGame();
  const ui = useUi();
  const me = meOf(g);
  const prep = g.phase === 'prep';
  const drop = useDrop(
    (p) => prep && (p.kind === 'spellSlot' || p.kind === 'itemSlot'),
    (p) => {
      if (p.kind === 'spellSlot') g.unassignSpell(p.uid, p.slot);
      else if (p.kind === 'itemSlot') g.unequipItem(p.uid, p.slot);
    },
  );
  const pend = ui.pending;
  const toggle = (kind: 'spell' | 'item', idx: number) =>
    prep && ui.setPending(pend && pend.kind === kind && pend.idx === idx ? null : { kind, idx });
  const used = me.spellInventory.length + me.itemInventory.length;
  const empties = Math.max(0, MIN_CELLS - used, (6 - (used % 6)) % 6);

  return (
    <section className={`hud-inv ${drop.over ? 'drop-over' : ''}`} {...drop.props}>
      <div className="inv-head">
        Inventory
        <small>{isTouch() ? (pend ? 'tap a hero to assign' : 'tap, then tap a hero') : pend ? 'click a hero to assign · Esc' : 'drag onto a hero · right-click sells'}</small>
      </div>
      <div className="inv-cells">
        {me.spellInventory.map((id, i) => {
          const s = spellDef(id);
          return (
            <div
              key={`s${i}-${id}`}
              data-testid="inv-spell"
              className={`inv-cell spell ${pend?.kind === 'spell' && pend.idx === i ? 'selected' : ''}`}
              style={{ ['--star' as string]: starColor(s.stars ?? 1) }}
              onClick={() => toggle('spell', i)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!prep) return;
                g.sellSpell(i);
                ui.setPending(null);
              }}
              {...tip(() => (
                <>
                  <SpellTip id={id} />
                  <div className="tip-foot">Drag onto a hero · right-click sells (+${SELL_SPELL})</div>
                </>
              ))}
              {...dragProps(prep ? { kind: 'spellInv', idx: i } : null)}
            >
              {s.glyph}
            </div>
          );
        })}
        {me.itemInventory.map((id, i) => {
          const it = itemDef(id);
          return (
            <div
              key={`i${i}-${id}`}
              data-testid="inv-item"
              className={`inv-cell item ${pend?.kind === 'item' && pend.idx === i ? 'selected' : ''}`}
              style={{ ['--star' as string]: starColor(it.tier) }}
              onClick={() => toggle('item', i)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!prep) return;
                g.sellItem(i);
                ui.setPending(null);
              }}
              {...tip(() => (
                <>
                  <ItemTip id={id} />
                  <div className="tip-foot">Drag onto a hero · right-click sells (+${SELL_ITEM})</div>
                </>
              ))}
              {...dragProps(prep ? { kind: 'itemInv', idx: i } : null)}
            >
              {it.glyph}
            </div>
          );
        })}
        {Array.from({ length: empties }, (_, i) => (
          <div key={`e${i}`} className="inv-cell empty" />
        ))}
      </div>
    </section>
  );
}
