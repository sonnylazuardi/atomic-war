// Single global tooltip rendered inside the scaled stage (never clipped by panels).
import { useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode, type SyntheticEvent, type TouchEvent } from 'react';
import { isTouch } from './hud/layout.ts';
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

let pressTimer = 0;
let longPressed = false;

/** Spread onto any element to give it a hover tooltip (long-press on touch screens). */
export function tip(content: () => ReactNode) {
  if (isTouch()) {
    return {
      onTouchStart: (e: TouchEvent<HTMLElement | SVGElement>) => {
        const el = e.currentTarget;
        clearTimeout(pressTimer);
        longPressed = false;
        pressTimer = window.setTimeout(() => {
          longPressed = true;
          useTipStore.setState({ content: content(), rect: el.getBoundingClientRect() });
        }, 420);
      },
      onTouchEnd: () => clearTimeout(pressTimer),
      onTouchMove: () => clearTimeout(pressTimer),
      onTouchCancel: () => clearTimeout(pressTimer),
      // a long-press shows info; it must not also buy / assign
      onClickCapture: (e: SyntheticEvent) => {
        if (!longPressed) return;
        longPressed = false;
        e.stopPropagation();
        e.preventDefault();
      },
    };
  }
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

export function SpellTip({ id, upgraded = false }: { id: SpellId; upgraded?: boolean }) {
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
      {s.aghanim && (
        <div className={`tip-agh ${upgraded ? 'on' : ''}`}>
          <span className="agh-glyph" aria-hidden>
            <AghGlyph />
          </span>
          <div>
            <div className="tip-agh-title">Aghanim's Upgrade{upgraded ? ' · active' : ''}</div>
            <div>{s.aghanim.description}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Blue Aghanim's Scepter mark. */
export function AghGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path d="M8 1l2.4 3.2L8 7.4 5.6 4.2z" fill="#7fc4ff" stroke="#cfeaff" strokeWidth=".6" />
      <rect x="7.2" y="7" width="1.6" height="8" rx=".6" fill="#3d86d6" />
      <circle cx="8" cy="7.6" r="1.4" fill="#a8d8ff" />
    </svg>
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
            <span style={{ color: TIER_COLORS[it.tier] }}>{'★'.repeat(it.tier)}</span> · <span className="gold">${it.cost}</span>
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
      {it.id === 'aghanims_scepter' && (
        <div className="tip-agh on">
          <span className="agh-glyph" aria-hidden>
            <AghGlyph />
          </span>
          <div>Upgrades the holder's spells that have an Aghanim's Upgrade (marked with a blue corner).</div>
        </div>
      )}
      {it.active && it.id !== 'aghanims_scepter' && (
        <div className="tip-foot">
          Triggers automatically {it.active.when === 'battle_start' ? 'when the battle starts' : it.active.when === 'low_hp' ? 'at low HP' : `every ${it.active.cooldown ?? '?'}s`}
        </div>
      )}
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
