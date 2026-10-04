// Right edge: one row per owned hero (board first, then bench) with spell + item slots.
import { BENCH_SIZE, LEVELS_PER_UPGRADE, boardCap } from '../../../core/constants.ts';
import { boardOrder } from '../../../core/game/index.ts';
import { teamModsFor } from '../../../core/game/lords.ts';
import type { ItemId, OwnedHero, SpellId, TeamMods } from '../../../core/types.ts';
import { useGame } from '../../store.ts';
import { fmt, heroDef, itemDef, safeStats, spellDef, starColor } from '../defs.ts';
import { dragProps, useDrop } from '../dnd.ts';
import { HeroPortrait, phaseOf } from '../HeroPortrait.tsx';
import { ItemTip, SpellTip, tip } from '../Tooltip.tsx';
import { useUi } from '../uiState.ts';
import { clickHero, dropOnHero, safe } from './actions.ts';

function SpellSlot({ hero, idx, id, prep }: { hero: OwnedHero; idx: number; id: SpellId | null; prep: boolean }) {
  const g = useGame();
  const ui = useUi();
  const locked = idx === 0;
  const drop = useDrop(
    (p) => prep && !locked && (p.kind === 'spellInv' || (p.kind === 'spellSlot' && p.uid === hero.uid && p.slot !== idx)),
    (p) => {
      if (p.kind === 'spellInv') g.assignSpell(hero.uid, idx, p.idx);
      else if (p.kind === 'spellSlot') g.swapSpellSlots(hero.uid, p.slot, idx);
      ui.setPending(null);
    },
  );
  const s = id ? spellDef(id) : null;
  const pendingHere = prep && ui.pending?.kind === 'spell' && !locked;
  return (
    <div
      className={`rs spell ${locked ? 'sig' : ''} ${s ? 'filled' : 'empty'} ${drop.over ? 'drop-over' : ''} ${pendingHere ? 'targetable' : ''}`}
      style={s ? { ['--star' as string]: starColor(s.stars ?? 1) } : undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (pendingHere && ui.pending) {
          g.assignSpell(hero.uid, idx, ui.pending.idx);
          ui.setPending(null);
        } else clickHero(hero.uid);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (prep && !locked && id) g.unassignSpell(hero.uid, idx);
      }}
      {...(id
        ? tip(() => (
            <>
              <SpellTip id={id} />
              <div className="tip-foot">{locked ? 'Signature · always cast first' : `Cast priority ${idx + 1} · drag to reorder · right-click removes`}</div>
            </>
          ))
        : {})}
      {...dragProps(prep && !locked && id ? { kind: 'spellSlot', uid: hero.uid, slot: idx } : null)}
      {...drop.props}
    >
      {s ? s.glyph : ''}
      {locked && <i className="rs-lock">🔒</i>}
    </div>
  );
}

function ItemSlot({ hero, idx, id, prep }: { hero: OwnedHero; idx: number; id: ItemId | null; prep: boolean }) {
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

function RosterRow({ hero, mods, prep, bench }: { hero: OwnedHero; mods?: TeamMods; prep: boolean; bench: boolean }) {
  const g = useGame();
  const selected = useUi((s) => s.selectedUid === hero.uid);
  const ui = useUi();
  const d = heroDef(hero.heroId);
  const st = safeStats(hero, mods);
  const drop = useDrop(
    (p) => prep && (p.kind === 'spellInv' || p.kind === 'itemInv' || (p.kind === 'hero' && p.uid !== hero.uid && !!hero.slot)),
    (p) => dropOnHero(p, hero.uid),
  );
  const sealed = [10, 20].filter((lv) => hero.level < lv && hero.spells.length < 4).slice(0, 4 - hero.spells.length);
  const targetable = prep && (ui.lordTargeting || !!ui.pending);
  return (
    <div
      data-testid="hero-card"
      className={`rrow ${selected ? 'selected' : ''} ${bench ? 'bench' : ''} ${drop.over ? 'drop-over' : ''} ${targetable ? 'targetable' : ''}`}
      style={{ ['--hero-c' as string]: d.palette.primary }}
      onClick={() => clickHero(hero.uid)}
      {...dragProps(prep ? { kind: 'hero', uid: hero.uid } : null)}
      {...drop.props}
    >
      <div className="rr-left">
        <div className="rr-port">
          <HeroPortrait heroId={hero.heroId} phase={phaseOf(hero.uid)} />
          <span className="rr-lvl">{hero.level}</span>
        </div>
        <div className="rr-hp">{st ? fmt(st.maxHp) : '—'}</div>
      </div>
      <div className="rr-body">
        <div className="rr-name">
          <span>{d.name}</span>
          {bench && <em className="rr-tag">bench</em>}
          {hero.kills > 0 && <span className="rr-kills">☠{hero.kills}</span>}
        </div>
        <div className="rr-slots">
          {hero.spells.map((s, i) => (
            <SpellSlot key={i} hero={hero} idx={i} id={s} prep={prep} />
          ))}
          {sealed.map((lv) => (
            <div key={lv} className="rs sealed" {...tip(() => <div className="tip-body">Unlocks at level {lv}</div>)}>
              {lv}
            </div>
          ))}
          <span className="rs-gap" />
          {hero.items.map((it, i) => (
            <ItemSlot key={i} hero={hero} idx={i} id={it} prep={prep} />
          ))}
        </div>
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

export function Roster() {
  const me = useGame((s) => s.players[0]!);
  const round = useGame((s) => s.round);
  const phase = useGame((s) => s.phase);
  const placeHero = useGame((s) => s.placeHero);
  const prep = phase === 'prep';
  const mods = safe(() => teamModsFor(me), undefined);
  const board = safe(() => boardOrder(me), me.heroes.filter((h) => h.slot));
  const bench = me.heroes.filter((h) => !h.slot);
  const benchDrop = useDrop(
    (p) => prep && p.kind === 'hero' && !!me.heroes.find((h) => h.uid === p.uid)?.slot,
    (p) => p.kind === 'hero' && placeHero(p.uid, null),
  );
  return (
    <aside className="hud-roster">
      <div className="roster-head">
        Heroes <span>{board.length}/{boardCap(round)}</span>
      </div>
      <div className="roster-list">
        {board.map((h) => (
          <RosterRow key={h.uid} hero={h} mods={mods} prep={prep} bench={false} />
        ))}
        {board.length === 0 && <div className="roster-empty">Press Space to recruit heroes</div>}
        <div className={`bench-zone ${benchDrop.over ? 'drop-over' : ''}`} {...benchDrop.props}>
          <div className="roster-sub">
            Bench <span>{bench.length}/{BENCH_SIZE}</span>
          </div>
          {bench.map((h) => (
            <RosterRow key={h.uid} hero={h} mods={mods} prep={prep} bench />
          ))}
          {bench.length === 0 && <div className="bench-empty">drag a hero here to bench it</div>}
        </div>
      </div>
    </aside>
  );
}
