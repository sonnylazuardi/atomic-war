// Space: Mystery shop overlay — like the real game: a wide translucent 5-column panel.
// Row 1 heroes (figures, no cards), row 2 items, row 3 spells; fewer than 5 offers are spread evenly.
import type { CSSProperties } from 'react';
import { HERO_COST, LEVELS_PER_UPGRADE, MAX_HERO_LEVEL } from '../../../core/constants.ts';
import { refreshCostFor, spellCostFor } from '../../../core/game/lords.ts';
import { meOf } from '../../me.ts';
import { useGame } from '../../store.ts';
import { CLASS_INFO, heroDef, itemDef, spellDef, starColor } from '../defs.ts';
import { HeroPortrait } from '../HeroPortrait.tsx';
import { HeroTip, ItemTip, SpellTip, tip } from '../Tooltip.tsx';
import { safe } from './actions.ts';
import { Stars } from './Stars.tsx';

const COLS = 5;
/** 1-based grid column for offer i of n, spreading fewer than 5 offers evenly. */
const SPREAD: Record<number, number[]> = { 1: [3], 2: [2, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5] };
const colOf = (i: number, n: number): CSSProperties => ({ gridColumn: (SPREAD[n] ?? [])[i] ?? (i % COLS) + 1 });

export function MysteryShop({ onClose, mobile = false }: { onClose: () => void; mobile?: boolean }) {
  const g = useGame();
  const me = meOf(g);
  const spellCost = safe(() => spellCostFor(me), 3);
  const refresh = safe(() => refreshCostFor(me), 1);
  const owned = new Set(me.heroes.map((h) => h.heroId));
  const ownedLevel = new Map(me.heroes.map((h) => [h.heroId, h.level]));
  const { heroOffers, itemOffers, spellOffers } = me.shop;

  const heroCells = heroOffers.map((id, i) => {
    const pos = mobile ? undefined : colOf(i, heroOffers.length);
    if (!id) return <div key={`h${i}`} className="my-cell my-hero sold" style={pos} />;
    const d = heroDef(id);
    const c = CLASS_INFO[d.cls];
    const dup = owned.has(id);
    return (
      <button
        key={`h${i}`}
        data-testid="shop-hero-offer"
        className={`my-cell my-hero ${me.coins < HERO_COST ? 'poor' : ''} ${dup ? 'dup' : ''}`}
        style={{ ...pos, ['--star' as string]: starColor(d.stars ?? 1) }}
        onClick={() => g.buyHero(i)}
        {...tip(() => (
          <>
            <HeroTip id={id} />
            {dup && <div className="tip-foot gold">Owned — buying levels it up instantly (+{LEVELS_PER_UPGRADE} Lv)</div>}
          </>
        ))}
      >
        <span className="my-hname">
          <i style={{ color: c.color }}>{c.icon}</i>
          {d.name}
        </span>
        <span className="my-figure">
          {dup && <span className="my-beam" aria-hidden />}
          <HeroPortrait heroId={id} phase={i * 0.7} />
          {dup && (
            <span className="my-uplv">
              ⬆ Lv {ownedLevel.get(id)} → {Math.min(MAX_HERO_LEVEL, (ownedLevel.get(id) ?? 1) + LEVELS_PER_UPGRADE)}
            </span>
          )}
        </span>
        <span className="my-price">
          <Stars n={d.stars ?? 1} />
          <b>${HERO_COST}</b>
        </span>
      </button>
    );
  });

  const itemCells = itemOffers.map((id, i) => {
    const pos = mobile ? undefined : { ...colOf(i, itemOffers.length), gridRow: 2 };
    if (!id) return <div key={`i${i}`} className="my-cell my-icon-cell sold" style={pos} />;
    const it = itemDef(id);
    return (
      <button
        key={`i${i}`}
        data-testid="shop-item-offer"
        className={`my-cell my-icon-cell ${me.coins < it.cost ? 'poor' : ''}`}
        style={{ ...pos, ['--star' as string]: starColor(it.tier) }}
        onClick={() => g.buyItem(i)}
        {...tip(() => <ItemTip id={id} />)}
      >
        <span className="my-icon">{it.glyph}</span>
        <span className="my-iname">{it.name}</span>
        <span className="my-price">
          <Stars n={it.tier} />
          <b>${it.cost}</b>
        </span>
      </button>
    );
  });

  const spellCells = spellOffers.map((id, i) => {
    const pos = mobile ? undefined : { ...colOf(i, spellOffers.length), gridRow: 3 };
    if (!id) return <div key={`s${i}`} className="my-cell my-icon-cell sold" style={pos} />;
    const s = spellDef(id);
    return (
      <button
        key={`s${i}`}
        data-testid="shop-spell-offer"
        className={`my-cell my-icon-cell spell ${me.coins < spellCost ? 'poor' : ''} ${s.ultimate ? 'ult' : ''}`}
        style={{ ...pos, ['--star' as string]: starColor(s.stars ?? 1) }}
        onClick={() => g.buySpell(i)}
        {...tip(() => <SpellTip id={id} />)}
      >
        <span className="my-icon">{s.glyph}</span>
        <span className="my-iname">{s.name}</span>
        <span className="my-price">
          <Stars n={s.stars ?? 1} />
          <b>${spellCost}</b>
        </span>
      </button>
    );
  });

  const side = (
    <div className="my-side">
      <button className="my-side-btn close" data-testid="close-shop" onClick={onClose} title="Close (Esc)">
        ✕
      </button>
      <button
        className="my-side-btn"
        data-testid="refresh-shop"
        onClick={() => g.refreshShop()}
        {...tip(() => (
          <div className="tip-body">
            <div className="tip-title">Refresh (R)</div>
            <p>Reroll every offer for ${refresh}.</p>
          </div>
        ))}
      >
        ⟳<span className={`my-side-cost ${me.coins < refresh ? 'poor' : ''}`}>${refresh}</span>
      </button>
      <button
        className={`my-side-btn ${me.shop.locked ? 'on' : ''}`}
        data-testid="lock-shop"
        aria-pressed={me.shop.locked}
        onClick={() => g.toggleLock()}
        {...tip(() => (
          <div className="tip-body">
            <div className="tip-title">{me.shop.locked ? 'Locked' : 'Lock'}</div>
            <p>Keep these offers for next round.</p>
          </div>
        ))}
      >
        {me.shop.locked ? '🔒' : '🔓'}
      </button>
    </div>
  );

  if (mobile) {
    return (
      <div className="msheet" role="dialog" aria-label="Mystery shop">
        <div className="msheet-head">
          <span className="msheet-title">
            Mystery Shop <Stars n={me.shopLevel} />
          </span>
          <span className="msheet-coins">
            <span className="ht-coin">$</span>
            {me.coins}
          </span>
          {side}
        </div>
        <div className="msheet-body">
          <h4 className="msheet-sub">Heroes</h4>
          <div className="msheet-grid heroes">{heroCells}</div>
          <h4 className="msheet-sub">Items</h4>
          <div className="msheet-grid">{itemCells}</div>
          <h4 className="msheet-sub">Spells</h4>
          <div className="msheet-grid">{spellCells}</div>
          <p className="msheet-hint">Tap to buy · press and hold for details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mystery" role="dialog" aria-label="Mystery shop" onMouseDown={(e) => e.stopPropagation()}>
      <div className="my-grid">
        {heroCells}
        {itemCells}
        {spellCells}
      </div>
      {side}
    </div>
  );
}
