// Selected-unit card: portrait, stats, Sell / To bench / To board.
import { SELL_HERO } from '../../../core/constants.ts';
import { teamModsFor } from '../../../core/game/lords.ts';
import { useGame } from '../../store.ts';
import { ATTR_INFO, CLASS_INFO, fmt, heroDef, safeStats } from '../defs.ts';
import { HeroPortrait } from '../HeroPortrait.tsx';
import { useUi } from '../uiState.ts';
import { canGoToBoard, safe, sendToBoard } from './actions.ts';
import { Stars } from './Stars.tsx';

export function UnitCard() {
  const g = useGame();
  const ui = useUi();
  const me = g.players[0]!;
  const hero = ui.selectedUid ? me.heroes.find((h) => h.uid === ui.selectedUid) : undefined;
  if (!hero) return null;
  const prep = g.phase === 'prep';
  const d = heroDef(hero.heroId);
  const c = CLASS_INFO[d.cls];
  const st = safeStats(hero, safe(() => teamModsFor(me), undefined));
  const rows: [string, string, string?][] = st
    ? [
        ['HP', fmt(st.maxHp), 'hp'],
        ['Mana', fmt(st.maxMana), 'mana'],
        ['Dmg', fmt(st.damage)],
        ['Armor', fmt(st.armor)],
        ['Atk/s', (1 / (st.attackInterval || 1)).toFixed(2)],
        ['Amp', `${fmt(st.spellAmp)}%`],
        ['STR', fmt(st.str), 'str'],
        ['AGI', fmt(st.agi), 'agi'],
        ['INT', fmt(st.int), 'int'],
      ]
    : [];
  return (
    <section className="hud-unit" style={{ ['--hero-c' as string]: d.palette.primary }}>
      <button className="unit-x" onClick={() => ui.select(null)} title="Deselect">
        ✕
      </button>
      <div className="unit-top">
        <div className="unit-port">
          <HeroPortrait heroId={hero.heroId} showcase />
        </div>
        <div className="unit-id">
          <div className="unit-name">{d.name}</div>
          <div className="unit-sub">
            <span style={{ color: c.color }}>
              {c.icon} {c.label}
            </span>{' '}
            <span style={{ color: ATTR_INFO[d.primary].color }}>{ATTR_INFO[d.primary].label}</span>
          </div>
          <div className="unit-sub">
            Lv <b className="gold">{hero.level}</b> <Stars n={d.stars ?? 1} />
          </div>
        </div>
      </div>
      <div className="unit-stats">
        {rows.map(([k, v, cls]) => (
          <div key={k} className={`ust ${cls ?? ''}`}>
            <span>{k}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>
      {ui.lordTargeting && <div className="unit-hint">Click a hero to target your lord ability</div>}
      <div className="unit-actions">
        {hero.slot ? (
          <button className="btn sm" disabled={!prep} onClick={() => g.placeHero(hero.uid, null)}>
            To bench
          </button>
        ) : (
          <button className="btn sm" disabled={!prep || !canGoToBoard(me, g.round)} onClick={() => sendToBoard(hero)}>
            To board
          </button>
        )}
        <button
          className="btn sm btn-danger"
          data-testid="sell-hero"
          disabled={!prep}
          onClick={() => {
            g.sellHero(hero.uid);
            ui.select(null);
          }}
        >
          Sell +${SELL_HERO}
        </button>
      </div>
    </section>
  );
}
