// Player-facing Gallery ("codex") at /gallery: every hero (with its Q/W/E/R kit), lord and item.
// Hover (mouse) or tap a card for the full details; on phones the details open as a bottom sheet.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { HERO_IDS, HERO_KITS, ITEM_IDS, LORD_IDS } from '../../../core/ids.ts';
import type { HeroClass, HeroId, ItemId, LordId, OwnedHero, SpellId } from '../../../core/types.ts';
import { LordIcon, SummonerBackdrop, getLordArt, isHeroLordArt } from '../../../art/lords/index.ts';
import { HeroPortrait, phaseOf } from '../../components/HeroPortrait.tsx';
import { AghGlyph, ItemTip } from '../../components/Tooltip.tsx';
import { ATTR_INFO, CLASS_INFO, fmt, heroDef, itemDef, lordDef, safeStats, spellDef, starColor, statLines } from '../../components/defs.ts';
import { useClock } from '../../useClock.ts';
import { CODEX_CSS } from './codex.css.ts';
import { closeCodex } from './route.ts';

type Tab = 'heroes' | 'lords' | 'items';
type ClassFilter = 'all' | HeroClass;
/** an open detail popover, anchored to the card element that opened it */
type Pop = { kind: 'hero'; id: HeroId; at: HTMLElement; pinned: boolean } | { kind: 'item'; id: ItemId; at: HTMLElement; pinned: boolean };
/** props spread onto a card that opens the detail popover */
interface AnchorProps {
  'data-codex-anchor': string;
  onPointerEnter(e: PointerEvent<HTMLElement>): void;
  onPointerLeave(e: PointerEvent<HTMLElement>): void;
  onClick(e: MouseEvent<HTMLElement>): void;
}

const TABS: Tab[] = ['heroes', 'lords', 'items'];
const CLASSES: HeroClass[] = ['warrior', 'assassin', 'mage', 'hunter', 'support', 'mechanic'];
const KEYS = ['Q', 'W', 'E', 'R'] as const;
const STAT_LEVEL = 6;

const kitOf = (id: HeroId): readonly SpellId[] => HERO_KITS[id] ?? [];

/** heroes sorted by ★ then manifest order */
const HEROES_SORTED: HeroId[] = [...HERO_IDS].sort(
  (a, b) => heroDef(a).stars - heroDef(b).stars || HERO_IDS.indexOf(a) - HERO_IDS.indexOf(b),
);

function Stars({ n }: { n: number }) {
  return (
    <span className="cx-stars" style={{ color: starColor(n) }} aria-label={`${n} star`}>
      {'★'.repeat(Math.max(1, Math.min(6, n)))}
    </span>
  );
}

const SHEET_Q = '(max-width: 640px)';
function subscribeSheet(cb: () => void) {
  const q = window.matchMedia(SHEET_Q);
  q.addEventListener('change', cb);
  return () => q.removeEventListener('change', cb);
}
const useSheet = () =>
  useSyncExternalStore(
    subscribeSheet,
    () => window.matchMedia(SHEET_Q).matches,
    () => false,
  );

function initialTab(): Tab {
  const h = (globalThis.location?.hash ?? '').replace('#', '') as Tab;
  return TABS.includes(h) ? h : 'heroes';
}

// ---------------------------------------------------------------- page

export function Codex() {
  const [tab, setTabState] = useState<Tab>(initialTab);
  const [cls, setCls] = useState<ClassFilter>('all');
  const [pop, setPop] = useState<Pop | null>(null);
  const sheet = useSheet();
  const closeTimer = useRef(0);
  const popRef = useRef<HTMLDivElement>(null);

  const setTab = (t: Tab) => {
    setTabState(t);
    setPop(null);
    history.replaceState(history.state, '', t === 'heroes' ? location.pathname : `#${t}`);
  };

  const pickCls = (c: ClassFilter) => {
    setCls(c);
    setPop(null);
  };

  const cancelClose = () => clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setPop((p) => (p && !p.pinned ? null : p)), 140);
  };
  useEffect(() => cancelClose, []);

  /** handlers for a card: mouse hover previews, click/tap pins (tap the same card again to close) */
  const anchor = useCallback(
    (kind: Pop['kind'], id: string): AnchorProps => ({
      'data-codex-anchor': `${kind}:${id}`,
      onPointerEnter: (e: PointerEvent<HTMLElement>) => {
        if (e.pointerType !== 'mouse' || sheet) return;
        cancelClose();
        const at = e.currentTarget;
        setPop((p) => (p?.pinned ? p : ({ kind, id, at, pinned: false } as Pop)));
      },
      onPointerLeave: (e: PointerEvent<HTMLElement>) => {
        if (e.pointerType === 'mouse' && !sheet) scheduleClose();
      },
      onClick: (e: MouseEvent<HTMLElement>) => {
        cancelClose();
        const at = e.currentTarget;
        setPop((p) => (p && p.pinned && p.kind === kind && p.id === id ? null : ({ kind, id, at, pinned: true } as Pop)));
      },
    }),
    [sheet],
  );

  // pinned popup: Escape / click outside closes it
  useEffect(() => {
    if (!pop) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPop(null);
    const onDown = (e: Event) => {
      const el = e.target as Element | null;
      // the sheet backdrop closes on its own click (closing on pointerdown would let the tap fall through)
      if (!el || popRef.current?.contains(el) || el.closest?.('[data-codex-anchor], .cx-sheet-backdrop')) return;
      setPop(null);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [pop]);

  const heroes = useMemo(() => HEROES_SORTED.filter((id) => cls === 'all' || heroDef(id).cls === cls), [cls]);

  return (
    <div className="cx-screen" data-testid="codex">
      <style>{CODEX_CSS}</style>
      <div className="cx-bg">
        <SummonerBackdrop />
      </div>
      <div className="cx-dim" />
      <div className="cx-scroll">
        <header className="cx-head">
          <div className="cx-head-row">
            <button type="button" className="cx-back" data-testid="codex-back" onClick={closeCodex}>
              <span aria-hidden>←</span> Back to menu
            </button>
            <h1 className="cx-title">Gallery</h1>
            <span className="cx-head-sp" />
          </div>
          <nav className="cx-tabs" role="tablist" aria-label="Gallery sections">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={`cx-tab${tab === t ? ' on' : ''}`}
                data-testid={`codex-tab-${t}`}
                onClick={() => setTab(t)}
              >
                {t === 'heroes' ? 'Heroes' : t === 'lords' ? 'Lords' : 'Items'}
                <span className="cx-count">{t === 'heroes' ? HERO_IDS.length : t === 'lords' ? LORD_IDS.length : ITEM_IDS.length}</span>
              </button>
            ))}
          </nav>
          {tab === 'heroes' && (
            <div className="cx-filter" role="radiogroup" aria-label="Filter by class">
              <button
                type="button"
                role="radio"
                aria-checked={cls === 'all'}
                className={`cx-chip${cls === 'all' ? ' on' : ''}`}
                onClick={() => pickCls('all')}
              >
                All
              </button>
              {CLASSES.map((c) => {
                const ci = CLASS_INFO[c];
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={cls === c}
                    data-testid={`codex-class-${c}`}
                    className={`cx-chip${cls === c ? ' on' : ''}`}
                    style={{ ['--c' as string]: ci.color }}
                    onClick={() => pickCls(c)}
                  >
                    <span className="cx-chip-ic" aria-hidden>
                      {ci.icon}
                    </span>
                    {ci.label}
                  </button>
                );
              })}
            </div>
          )}
        </header>

        <main className="cx-main">
          {tab === 'heroes' && (
            <div className="cx-grid heroes">
              {heroes.map((id) => (
                <HeroCard key={id} id={id} active={pop?.kind === 'hero' && pop.id === id} anchor={anchor('hero', id)} />
              ))}
            </div>
          )}
          {tab === 'lords' && <LordsGrid />}
          {tab === 'items' && <ItemsList anchor={anchor} activeId={pop?.kind === 'item' ? pop.id : null} />}
          <p className="cx-hint">{sheet ? 'Tap a card for details.' : 'Hover a card for details · click to pin it.'}</p>
        </main>
      </div>

      {pop && (
        <Popover refEl={popRef} anchorEl={pop.at} sheet={sheet} wide={pop.kind === 'hero'} pinned={pop.pinned} onClose={() => setPop(null)}>
          {pop.kind === 'hero' ? <HeroDetail id={pop.id} /> : <ItemTip id={pop.id} />}
        </Popover>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- popover / bottom sheet

function Popover({
  refEl,
  anchorEl,
  sheet,
  wide,
  pinned,
  children,
  onClose,
}: {
  refEl: RefObject<HTMLDivElement | null>;
  anchorEl: HTMLElement;
  sheet: boolean;
  wide: boolean;
  /** clicked open: interactive + closable; a hover peek ignores the pointer so it never blocks other cards */
  pinned: boolean;
  children: ReactNode;
  onClose(): void;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const place = useCallback(() => {
    const el = refEl.current;
    if (!el || sheet) return setPos(null);
    const rect = anchorEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const gap = 12;
    let x: number;
    let y: number;
    if (rect.right + gap + w <= vw - 8) {
      x = rect.right + gap;
      y = rect.top;
    } else if (rect.left - gap - w >= 8) {
      x = rect.left - gap - w;
      y = rect.top;
    } else {
      x = rect.left + rect.width / 2 - w / 2;
      y = rect.bottom + gap + h <= vh - 8 ? rect.bottom + gap : rect.top - gap - h;
    }
    x = Math.max(8, Math.min(vw - w - 8, x));
    y = Math.max(8, Math.min(vh - h - 8, y));
    setPos({ x, y });
  }, [refEl, anchorEl, sheet]);

  useLayoutEffect(place, [place, children]);
  // follow the card while the page scrolls / resizes
  useEffect(() => {
    if (sheet) return;
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [place, sheet]);

  if (sheet) {
    return (
      <>
        <div className="cx-sheet-backdrop" onClick={onClose} />
        <div ref={refEl} className="cx-pop sheet" role="dialog" aria-modal="true" data-testid="codex-popup">
          <button type="button" className="cx-pop-close" data-testid="codex-popup-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
          <div className="cx-pop-body">{children}</div>
        </div>
      </>
    );
  }
  return (
    <div
      ref={refEl}
      className={`cx-pop${wide ? ' wide' : ''}${pinned ? ' pinned' : ' peek'}`}
      role="dialog"
      data-testid="codex-popup"
      style={{ left: pos?.x ?? -9999, top: pos?.y ?? -9999, visibility: pos ? 'visible' : 'hidden' }}
    >
      {pinned && (
        <button type="button" className="cx-pop-close" data-testid="codex-popup-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      )}
      <div className="cx-pop-body">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------- heroes

function SkillIcon({ id, k, size = 'sm' }: { id: SpellId; k: string; size?: 'sm' | 'lg' }) {
  const s = spellDef(id);
  return (
    <span
      className={`cx-sk ${size}${s.ultimate || k === 'R' ? ' ult' : ''}${s.aghanim ? ' agh' : ''}`}
      title={size === 'sm' ? `${k}: ${s.name}` : undefined}
    >
      <span className="cx-sk-g" aria-hidden>
        {s.glyph}
      </span>
      <i>{k}</i>
    </span>
  );
}

function HeroCard({ id, active, anchor }: { id: HeroId; active: boolean; anchor: AnchorProps }) {
  const h = heroDef(id);
  const c = CLASS_INFO[h.cls];
  const a = ATTR_INFO[h.primary];
  return (
    <button
      type="button"
      className={`cx-card cx-hero${active ? ' on' : ''}`}
      data-testid="codex-hero"
      data-hero={id}
      aria-label={`${h.name} details`}
      style={{ ['--c' as string]: c.color, ['--pal' as string]: h.palette.primary }}
      {...anchor}
    >
      <div className="cx-hero-fig">
        <HeroPortrait heroId={id} phase={phaseOf(id)} />
      </div>
      <Stars n={h.stars} />
      <div className="cx-name">{h.name}</div>
      <div className="cx-badges">
        <span className="cx-cls">
          <span aria-hidden>{c.icon}</span> {c.label}
        </span>
        <span className="cx-attr" style={{ color: a.color }}>
          {a.label}
        </span>
      </div>
      <div className="cx-kit">
        {kitOf(id).map((s, i) => (
          <SkillIcon key={s} id={s} k={KEYS[i] ?? '?'} />
        ))}
      </div>
    </button>
  );
}

function level6(id: HeroId) {
  const owned: OwnedHero = {
    uid: `codex-${id}`,
    heroId: id,
    level: STAT_LEVEL,
    pendingUpgrades: 0,
    spells: [...kitOf(id)],
    items: [],
    stacks: { str: 0, agi: 0, int: 0 },
    slot: null,
    kills: 0,
  };
  return safeStats(owned);
}

function HeroDetail({ id }: { id: HeroId }) {
  const h = heroDef(id);
  const c = CLASS_INFO[h.cls];
  const a = ATTR_INFO[h.primary];
  const st = useMemo(() => level6(id), [id]);
  const stats: [string, string, string?][] = st
    ? [
        ['HP', fmt(st.maxHp), 'hp'],
        ['Mana', fmt(st.maxMana), 'mana'],
        ['Damage', fmt(Math.round(st.damage))],
        ['Armor', fmt(st.armor)],
        ['Attack speed', `${fmt(st.attackSpeed)} · ${st.attackInterval.toFixed(2)}s`],
        ['Range', fmt(st.attackRange)],
        ['Move speed', fmt(st.moveSpeed)],
      ]
    : [];
  return (
    <div className="cx-hd" data-testid="codex-hero-popup" data-hero={id}>
      <div className="cx-hd-side">
        <div className="cx-hd-top" style={{ ['--c' as string]: c.color }}>
          <div className="cx-hd-fig">
            <HeroPortrait heroId={id} showcase phase={phaseOf(id)} />
          </div>
          <div className="cx-hd-info">
            <Stars n={h.stars} />
            <h2 className="cx-hd-name">{h.name}</h2>
            <div className="cx-badges">
              <span className="cx-cls">
                <span aria-hidden>{c.icon}</span> {c.label}
              </span>
              <span className="cx-attr" style={{ color: a.color }}>
                {a.label}
              </span>
              <span className="cx-range">{h.ranged ? 'Ranged' : 'Melee'}</span>
            </div>
            {h.blurb && <p className="cx-blurb">{h.blurb}</p>}
          </div>
        </div>
        {st && (
          <>
            <div className="cx-sec">Level {STAT_LEVEL} stats</div>
            <div className="cx-stats">
              {stats.map(([k, v, cl]) => (
                <div key={k} className={`cx-st ${cl ?? ''}`}>
                  <span>{k}</span>
                  <b>{v}</b>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="cx-hd-main">
        <div className="cx-sec">Abilities</div>
        <ol className="cx-skills">
          {kitOf(id).map((sid, i) => {
            const s = spellDef(sid);
            const k = KEYS[i] ?? '?';
            const ult = k === 'R' || s.ultimate;
            return (
              <li key={sid} className={`cx-skill${ult ? ' ult' : ''}`} data-testid="codex-skill" data-key={k}>
                <SkillIcon id={sid} k={k} size="lg" />
                <div className="cx-skill-txt">
                  <div className="cx-skill-head">
                    <span className="cx-key">{ult ? 'R · Ultimate' : k}</span>
                    <b className="cx-skill-name">{s.name}</b>
                    <Stars n={s.stars} />
                    <span className="cx-skill-meta">
                      {s.kind === 'passive' ? (
                        <span className="cx-passive">Passive</span>
                      ) : (
                        <>
                          <span className="mana">💧 {s.manaCost}</span>
                          <span>⏱ {s.cooldown}s</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p>{s.description || 'No description.'}</p>
                  {s.aghanim && (
                    <div className="cx-agh">
                      <span className="agh-glyph" aria-hidden>
                        <AghGlyph />
                      </span>
                      <div>
                        <b>Aghanim's Upgrade</b> {s.aghanim.description}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- lords

function LordFigure({ id, t }: { id: LordId; t: number }) {
  const Art = getLordArt(id);
  return (
    <svg viewBox="-55 -100 110 106" preserveAspectRatio="xMidYMax meet" aria-hidden>
      <ellipse cx={0} cy={0} rx={34} ry={7} fill="#000" opacity={0.35} />
      <g transform={isHeroLordArt(id) ? 'scale(1.13)' : undefined}>
        <Art anim="idle" t={t} dur={0} team="left" />
      </g>
    </svg>
  );
}

function LordsGrid() {
  const t = useClock('portrait'); // 17 figures: static in battery saver
  return (
    <div className="cx-grid lords">
      {LORD_IDS.map((id, i) => {
        const l = lordDef(id);
        return (
          <article key={id} className="cx-card cx-lord" data-testid="codex-lord" data-lord={id} style={{ ['--c' as string]: l.color }}>
            <div className="cx-lord-fig">
              <LordFigure id={id} t={t + i * 0.37} />
            </div>
            <div className="cx-name lg">{l.name}</div>
            <div className="cx-lord-ab">
              <div className="cx-lord-ic">
                <LordIcon id={id} />
              </div>
              <div>
                <div className="cx-lord-title">
                  {l.title}
                  <span className={`cx-kind ${l.kind}`}>{l.kind}</span>
                </div>
                <p className="cx-lord-desc">{l.description}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- items

function ItemsList({ anchor, activeId }: { anchor: (k: Pop['kind'], id: string) => AnchorProps; activeId: ItemId | null }) {
  const groups: { key: string; label: ReactNode; ids: ItemId[] }[] = [];
  for (let tier = 1; tier <= 6; tier++) {
    const ids = ITEM_IDS.filter((id) => !itemDef(id).lordOnly && itemDef(id).tier === tier);
    if (ids.length)
      groups.push({
        key: `t${tier}`,
        label: (
          <>
            Level <Stars n={tier} />
          </>
        ),
        ids,
      });
  }
  const lordIds = ITEM_IDS.filter((id) => itemDef(id).lordOnly);
  if (lordIds.length) groups.push({ key: 'lord', label: <>Lord items</>, ids: lordIds });
  return (
    <div className="cx-items">
      {groups.map((g) => (
        <section key={g.key} className="cx-group" data-testid="codex-item-group">
          <h3 className="cx-group-h">
            {g.label}
            <span className="cx-count">{g.ids.length}</span>
          </h3>
          <div className="cx-grid items">
            {g.ids.map((id) => {
              const it = itemDef(id);
              const lines = statLines(it.stats);
              const col = starColor(it.tier);
              return (
                <button
                  key={id}
                  type="button"
                  className={`cx-card cx-item${activeId === id ? ' on' : ''}${id === 'black_king_bar' ? ' bkb' : ''}${id === 'aghanims_scepter' ? ' agh' : ''}`}
                  data-testid="codex-item"
                  data-item={id}
                  style={{ ['--c' as string]: col }}
                  {...anchor('item', id)}
                >
                  <span className="cx-item-ic" aria-hidden>
                    {it.glyph}
                  </span>
                  <div className="cx-item-txt">
                    <div className="cx-item-head">
                      <b className="cx-item-name" style={{ color: col }}>
                        {it.name}
                      </b>
                      <Stars n={it.tier} />
                    </div>
                    {lines.length > 0 && <div className="cx-item-stats">{lines.join(' · ')}</div>}
                    {it.description && <p className="cx-item-desc">{it.description}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
