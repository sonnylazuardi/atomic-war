// Right edge: hero roster like the real game — Items / Skills tabs, one row per hero with its slots.
import { LEVELS_PER_UPGRADE, MAX_HEROES } from '../../../core/constants.ts';
import { boardOrder } from '../../../core/game/index.ts';
import { teamModsFor } from '../../../core/game/lords.ts';
import type { ItemId, OwnedHero, SpellId, TeamMods } from '../../../core/types.ts';
import { meOf, useMe } from '../../me.ts';
import { useGame } from '../../store.ts';
import { CLASS_INFO, fmt, heroDef, itemDef, lordDef, safeStats, spellDef, starColor } from '../defs.ts';
import { dragProps, useDrop } from '../dnd.ts';
import { HeroPortrait, phaseOf } from '../HeroPortrait.tsx';
import { AghGlyph, HeroTip, ItemTip, SpellTip, tip } from '../Tooltip.tsx';
import { useUi, type RosterTab } from '../uiState.ts';
import { LUNA_PER_USE } from './lordStatus.ts';
import { assignSpellSafe, clickHero, confirmInnateLoss, dropOnHero, innate, safe } from './actions.ts';

export function SpellSlot({ hero, idx, id, prep }: { hero: OwnedHero; idx: number; id: SpellId | null; prep: boolean }) {
  const g = useGame();
  const ui = useUi();
  const isInnate = innate(hero, id);
  const drop = useDrop(
    (p) => prep && (p.kind === 'spellInv' || (p.kind === 'spellSlot' && p.uid === hero.uid && p.slot !== idx)),
    (p) => {
      if (p.kind === 'spellInv') assignSpellSafe(hero, idx, p.idx);
      else if (p.kind === 'spellSlot') g.swapSpellSlots(hero.uid, p.slot, idx);
      ui.setPending(null);
    },
  );
  const s = id ? spellDef(id) : null;
  const agh = !!s?.aghanim && hero.items.includes('aghanims_scepter');
  const pendingHere = prep && ui.pending?.kind === 'spell';
  // warn while an inventory spell hovers an innate slot: dropping destroys the kit spell
  const warn = s && isInnate && (drop.over || pendingHere) ? `replaces ${s.name} (innate, lost)` : null;
  return (
    <div
      className={`rs spell ${agh ? 'agh' : ''} ${isInnate ? 'innate' : ''} ${s?.ultimate ? 'ult' : ''} ${s ? 'filled' : 'empty'} ${drop.over ? 'drop-over' : ''} ${pendingHere ? 'targetable' : ''} ${warn && drop.over ? 'warn' : ''}`}
      style={{ ...(s ? { ['--star' as string]: starColor(s.stars ?? 1) } : {}), ['--kit-c' as string]: heroDef(hero.heroId).palette.primary }}
      onClick={(e) => {
        e.stopPropagation();
        if (pendingHere && ui.pending) {
          if (assignSpellSafe(hero, idx, ui.pending.idx)) ui.setPending(null);
        } else clickHero(hero.uid);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (prep && id && confirmInnateLoss(hero, idx, 'remove')) g.unassignSpell(hero.uid, idx);
      }}
      {...(id
        ? tip(() => (
            <>
              <SpellTip id={id} upgraded={agh} />
              <div className="tip-foot">
                {isInnate ? 'Innate (hero kit) · replacing or removing destroys it · ' : ''}
                Cast priority {idx + 1} · drag to reorder · right-click removes
              </div>
            </>
          ))
        : {})}
      {...dragProps(prep && id ? { kind: 'spellSlot', uid: hero.uid, slot: idx } : null)}
      {...drop.props}
    >
      {s ? s.glyph : ''}
      {isInnate && <i className="rs-innate" aria-label="innate" />}
      {s?.ultimate && <i className="rs-ult">R</i>}
      {agh && (
        <i className="rs-agh" aria-label="Aghanim's upgrade active">
          <AghGlyph />
        </i>
      )}
      {warn && drop.over && <span className="rs-warn">{warn}</span>}
    </div>
  );
}

export function ItemSlot({ hero, idx, id, prep }: { hero: OwnedHero; idx: number; id: ItemId | null; prep: boolean }) {
  const g = useGame();
  const ui = useUi();
  const drop = useDrop(
    (p) => prep && p.kind === 'itemInv',
    (p) => {
      if (p.kind === 'itemInv') g.equipItem(hero.uid, idx, p.idx);
      ui.setPending(null);
    },
  );
  const it = id ? itemDef(id) : null;
  const pendingHere = prep && ui.pending?.kind === 'item';
  return (
    <div
      className={`rs item ${it ? 'filled' : 'empty'} ${drop.over ? 'drop-over' : ''} ${pendingHere ? 'targetable' : ''}`}
      style={it ? { ['--star' as string]: starColor(it.tier) } : undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (pendingHere && ui.pending) {
          g.equipItem(hero.uid, idx, ui.pending.idx);
          ui.setPending(null);
        } else clickHero(hero.uid);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (prep && id) g.unequipItem(hero.uid, idx);
      }}
      {...(id
        ? tip(() => (
            <>
              <ItemTip id={id} />
              <div className="tip-foot">Right-click to unequip</div>
            </>
          ))
        : {})}
      {...dragProps(prep && id ? { kind: 'itemSlot', uid: hero.uid, slot: idx } : null)}
      {...drop.props}
    >
      {it ? it.glyph : ''}
    </div>
  );
}

function RosterRow({ hero, mods, prep, tab }: { hero: OwnedHero; mods?: TeamMods; prep: boolean; tab: RosterTab }) {
  const g = useGame();
  const selected = useUi((s) => s.selectedUid === hero.uid);
  const ui = useUi();
  const d = heroDef(hero.heroId);
  const c = CLASS_INFO[d.cls];
  const st = safeStats(hero, mods);
  const drop = useDrop(
    (p) => prep && (p.kind === 'spellInv' || p.kind === 'itemInv' || (p.kind === 'hero' && p.uid !== hero.uid && !!hero.slot)),
    (p) => dropOnHero(p, hero.uid),
  );
  const targetable = prep && (ui.lordTargeting || !!ui.pending);
  const owner = meOf(g);
  const lord = owner.lordId && owner.lordTarget === hero.uid ? lordDef(owner.lordId) : null;
  const bound = lord && lord.needsTarget ? lord : null;
  const blessings = owner.lordState?.blessings ?? 0;
  return (
    <div
      data-testid="hero-card"
      className={`rrow ${selected ? 'selected' : ''} ${drop.over ? 'drop-over' : ''} ${targetable ? 'targetable' : ''}`}
      style={{ ['--hero-c' as string]: d.palette.primary, ['--cls-c' as string]: c.color }}
      onClick={() => clickHero(hero.uid)}
      {...dragProps(prep ? { kind: 'hero', uid: hero.uid } : null)}
      {...drop.props}
    >
      <div className="rr-main">
        <span className="rr-cls" {...tip(() => <div className="tip-body">{c.label}</div>)}>
          <i>{c.icon}</i>
        </span>
        <div className="rr-port" {...tip(() => <HeroTip id={hero.heroId} />)}>
          <HeroPortrait heroId={hero.heroId} phase={phaseOf(hero.uid)} />
          <span className="rr-lvl">{hero.level}</span>
          {bound && (
            <span
              className="rr-bound"
              data-testid="lord-bound"
              style={{ ['--lord-c' as string]: bound.color }}
              {...tip(() => (
                <div className="tip-body">
                  <b>{bound.title}</b> is bound to this hero
                  {bound.id === 'luna' && blessings > 0 ? ` · +${LUNA_PER_USE * blessings} dmg (${blessings}×)` : ''}
                </div>
              ))}
            >
              {bound.glyph}
              {bound.id === 'luna' && blessings > 0 && <b>{blessings}</b>}
            </span>
          )}
        </div>
        <div className="rr-slots">
          {tab === 'skills'
            ? hero.spells.map((s, i) => <SpellSlot key={i} hero={hero} idx={i} id={s} prep={prep} />)
            : hero.items.map((it, i) => <ItemSlot key={i} hero={hero} idx={i} id={it} prep={prep} />)}
        </div>
      </div>
      <div className="rr-hpline">
        <span className="rr-hp">{st ? fmt(st.maxHp) : '—'}</span>
        <div className="rr-hpbar">
          <div />
        </div>
        {hero.kills > 0 && <span className="rr-kills">☠{hero.kills}</span>}
      </div>
      {hero.pendingUpgrades > 0 && (
        <button
          className="rr-up"
          disabled={!prep}
          onClick={(e) => {
            e.stopPropagation();
            g.upgradeHero(hero.uid);
          }}
          title="Spend upgrade"
        >
          ⬆ +{LEVELS_PER_UPGRADE * hero.pendingUpgrades} lv
        </button>
      )}
    </div>
  );
}

function TabIcon({ kind }: { kind: RosterTab }) {
  return kind === 'items' ? (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 13c0-5 3.6-9 8-9s8 4 8 9v3h-3v-3a5 5 0 0 0-10 0v3H4z" fill="currentColor" />
      <path d="M11 4h2v7h-2z" fill="currentColor" opacity=".6" />
      <path d="M4 17h5v3H4zM15 17h5v3h-5z" fill="currentColor" opacity=".8" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M5 3h11a3 3 0 0 1 3 3v15H8a3 3 0 0 1-3-3z" fill="currentColor" />
      <path d="M8 18h11v3H8a1.5 1.5 0 0 1 0-3z" fill="currentColor" opacity=".55" />
      <path d="M12 6l1.2 2.6L16 9l-2 2 .5 2.8L12 12.5 9.5 13.8 10 11 8 9l2.8-.4z" fill="#0d1018" />
    </svg>
  );
}

export function Roster() {
  const me = useMe();
  const phase = useGame((s) => s.phase);
  const tab = useUi((s) => s.rosterTab);
  const setTab = useUi((s) => s.setRosterTab);
  const prep = phase === 'prep';
  const mods = safe(() => teamModsFor(me), undefined);
  const board = safe(() => boardOrder(me), me.heroes.filter((h) => h.slot));
  const rest = me.heroes.filter((h) => !board.includes(h));
  return (
    <aside className="hud-roster">
      <div className="roster-tabs" role="tablist">
        {(['items', 'skills'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`roster-tab ${tab === t ? 'on' : ''}`}
            data-testid={`roster-tab-${t}`}
            onClick={() => setTab(t)}
          >
            <TabIcon kind={t} />
            {t === 'items' ? 'Items' : 'Skills'}
          </button>
        ))}
        <span className="roster-count">
          {me.heroes.length}/{MAX_HEROES}
        </span>
      </div>
      <div className="roster-list">
        {[...board, ...rest].map((h) => (
          <RosterRow key={h.uid} hero={h} mods={mods} prep={prep} tab={tab} />
        ))}
        {me.heroes.length === 0 && <div className="roster-empty">Open the Mystery shop to recruit heroes</div>}
      </div>
    </aside>
  );
}
