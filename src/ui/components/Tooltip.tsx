// Single global tooltip rendered inside the scaled stage (never clipped by panels).
import { useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { create } from 'zustand';
import type { ItemId, LordId, SpellId } from '../../core/types.ts';
import { ATTR_INFO, CLASS_INFO, TIER_COLORS, heroDef, itemDef, lordDef, spellDef, statLines } from './defs.ts';
import type { HeroId } from '../../core/types.ts';

interface TipState {
  content: ReactNode;
  rect: DOMRect | null;
}
const useTipStore = create<TipState>()(() => ({ content: null, rect: null }));

export const hideTip = () => useTipStore.setState({ content: null, rect: null });

/** Spread onto any element to give it a hover tooltip. */
export function tip(content: () => ReactNode) {
  return {
    onMouseEnter: (e: MouseEvent<HTMLElement | SVGElement>) =>
      useTipStore.setState({ content: content(), rect: e.currentTarget.getBoundingClientRect() }),
    onMouseLeave: hideTip,
  };
}

export function TooltipLayer() {
  const { content, rect } = useTipStore();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const stage = document.getElementById('stage');
    if (!el || !rect || !stage) return setPos(null);
    const sr = stage.getBoundingClientRect();
    const scale = sr.width / stage.offsetWidth || 1;
    const sw = stage.offsetWidth;
    const sh = stage.offsetHeight;
    const r = {
      left: (rect.left - sr.left) / scale,
      top: (rect.top - sr.top) / scale,
      width: rect.width / scale,
      height: rect.height / scale,
    };
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let x = r.left + r.width / 2 - w / 2;
    x = Math.max(8, Math.min(sw - w - 8, x));
    let y = r.top - h - 8;
    if (y < 8) y = r.top + r.height + 8;
    if (y + h > sh - 8) y = Math.max(8, sh - h - 8);
    setPos({ x, y });
  }, [content, rect]);

  if (!content || !rect) return null;
  return (
    <div
      ref={ref}
      className="tooltip"
      style={{ left: pos?.x ?? -9999, top: pos?.y ?? -9999, visibility: pos ? 'visible' : 'hidden' }}
    >
      {content}
    </div>
  );
}

// ---------------------------------------------------------------- tooltip bodies

export function SpellTip({ id }: { id: SpellId }) {
  const s = spellDef(id);
  return (
    <div className="tip-body">
      <div className="tip-head">
        <span className="tip-glyph">{s.glyph}</span>
        <div>
          <div className="tip-title">{s.name}</div>
          <div className="tip-sub">
            {s.kind === 'passive' ? 'Passive' : 'Active'}
            {s.ultimate ? ' · Ultimate' : ''}
          </div>
        </div>
      </div>
      {s.kind === 'active' && (
        <div className="tip-meta">
          <span className="mana">💧 {s.manaCost}</span>
          <span>⏱ {s.cooldown}s</span>
          {s.castRange > 0 && <span>⌖ {s.castRange}</span>}
        </div>
      )}
      <p>{s.description || 'No description.'}</p>
    </div>
  );
}

export function ItemTip({ id }: { id: ItemId }) {
  const it = itemDef(id);
  return (
    <div className="tip-body">
      <div className="tip-head">
        <span className="tip-glyph">{it.glyph}</span>
        <div>
          <div className="tip-title" style={{ color: TIER_COLORS[it.tier] }}>
            {it.name}
          </div>
          <div className="tip-sub">
            Tier {it.tier} · <span className="gold">{it.cost}◉</span>
          </div>
        </div>
      </div>
      {statLines(it.stats).length > 0 && (
        <ul className="tip-stats">
          {statLines(it.stats).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}
      {it.description && <p>{it.description}</p>}
    </div>
  );
}

export function LordTip({ id }: { id: LordId }) {
  const l = lordDef(id);
  return (
    <div className="tip-body">
      <div className="tip-head">
        <span className="tip-glyph">{l.glyph}</span>
        <div>
          <div className="tip-title" style={{ color: l.color }}>
            {l.name} Lord
          </div>
          <div className="tip-sub">
            {l.title} · {l.kind === 'active' ? 'Active' : 'Passive'}
          </div>
        </div>
      </div>
      <p>{l.description}</p>
    </div>
  );
}

export function HeroTip({ id }: { id: HeroId }) {
  const h = heroDef(id);
  const c = CLASS_INFO[h.cls];
  const sig = spellDef(h.signature);
  return (
    <div className="tip-body">
      <div className="tip-title">{h.name}</div>
      <div className="tip-sub">
        <span style={{ color: c.color }}>
          {c.icon} {c.label}
        </span>{' '}
        · <span style={{ color: ATTR_INFO[h.primary].color }}>{ATTR_INFO[h.primary].label}</span> ·{' '}
        {h.ranged ? 'Ranged' : 'Melee'}
      </div>
      {h.blurb && <p>{h.blurb}</p>}
      <div className="tip-meta">
        <span>
          Signature: {sig.glyph} {sig.name}
        </span>
      </div>
    </div>
  );
}
