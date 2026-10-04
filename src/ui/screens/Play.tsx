// One persistent world (prep -> battle -> results) with the HUD overlaid. No screen swaps.
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { PREP_TIME, terrainForPlayer } from '../../core/constants.ts';
import type { BoardSlot } from '../../core/types.ts';
import { currentDrag } from '../components/dnd.ts';
import { clickHero, dropOnHero, triggerLord } from '../components/hud/actions.ts';
import { Dock } from '../components/hud/Dock.tsx';
import { InventoryGrid } from '../components/hud/InventoryGrid.tsx';
import { useLayoutMode } from '../components/hud/layout.ts';
import { MobileBar } from '../components/hud/MobileBar.tsx';
import { MysteryShop } from '../components/hud/MysteryShop.tsx';
import { PlayerList } from '../components/hud/PlayerList.tsx';
import { ResultToast } from '../components/hud/ResultToast.tsx';
import { Roster } from '../components/hud/Roster.tsx';
import { TopCenter } from '../components/hud/TopCenter.tsx';
import { UnitCard } from '../components/hud/UnitCard.tsx';
import { hideTip } from '../components/Tooltip.tsx';
import { useUi } from '../components/uiState.ts';
import { World } from '../components/World.tsx';
import { useGame } from '../store.ts';
import { GameOver } from './GameOver.tsx';

/** `?prep=0` disables the prep timer, `?prep=N` sets it to N seconds. */
function prepSeconds(): number {
  const v = new URLSearchParams(location.search).get('prep');
  if (v === null || v === '') return PREP_TIME;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : PREP_TIME;
}

function usePrepTimer(active: boolean, round: number): number | null {
  const total = useMemo(prepSeconds, []);
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!active || total <= 0) {
      setLeft(null);
      return;
    }
    const end = performance.now() + total * 1000;
    let fired = false;
    const tick = () => {
      const l = Math.max(0, (end - performance.now()) / 1000);
      setLeft(Math.ceil(l));
      if (l <= 0 && !fired) {
        fired = true;
        const s = useGame.getState();
        if (s.phase === 'prep' && s.round === round) s.readyForBattle();
      }
    };
    tick();
    const h = setInterval(tick, 250);
    return () => clearInterval(h);
  }, [active, round, total]);
  return left;
}

/** Mobile portrait: World shows the whole arena (letterboxed) instead of the desktop slice-fit.
 *  Passed via spread so it typechecks before and after World adds the props / MOBILE_VIEWBOX. */
const MOBILE_WORLD = { viewBox: { x: 200, y: 70, w: 600, h: 520 }, fit: 'meet' as const };

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
};

export function Play() {
  const phase = useGame((s) => s.phase);
  const round = useGame((s) => s.round);
  const seed = useGame((s) => s.seed);
  const players = useGame((s) => s.players);
  const pairings = useGame((s) => s.pairings);
  const humanBattle = useGame((s) => s.humanBattle);
  const humanSide = useGame((s) => s.humanSide);
  const readyForBattle = useGame((s) => s.readyForBattle);
  const placeHero = useGame((s) => s.placeHero);
  const selectedUid = useUi((s) => s.selectedUid);
  const lordTargeting = useUi((s) => s.lordTargeting);
  const pending = useUi((s) => s.pending);
  const mobile = useLayoutMode() === 'mobile';
  const me = players[0]!;
  const prep = phase === 'prep';
  const battle = phase === 'battle';

  const [shopOpen, setShopOpen] = useState(false);
  const shopRef = useRef(shopOpen);
  shopRef.current = shopOpen;
  useEffect(() => {
    // like the real game, the Mystery shop pops up on its own whenever a preparation phase begins
    if (prep) setShopOpen(true);
    else {
      setShopOpen(false);
      useUi.getState().setPending(null);
      useUi.getState().setLordTargeting(false);
      hideTip();
    }
  }, [prep]);

  const timer = usePrepTimer(prep, round);

  const pairing = pairings.find((p) => p.left === 0 || p.right === 0) ?? null;
  const oppId = pairing ? (pairing.left === 0 ? pairing.right : pairing.left) : null;
  const opp = oppId !== null ? players[oppId] : undefined;
  const enemyName = opp ? `${opp.name}${pairing?.ghost && pairing.right === oppId ? ' (ghost)' : ''}` : null;
  const homeTerrain = terrainForPlayer(0, seed);
  const hostTerrain = battle && pairing ? terrainForPlayer(pairing.left, seed) : homeTerrain;
  const heroes = useMemo(() => me.heroes.filter((h) => h.slot !== null), [me.heroes]);
  const names = useMemo(() => ({ human: me.name, enemy: enemyName ?? 'Enemy' }), [me.name, enemyName]);

  const onBattleDone = useCallback(() => {
    const s = useGame.getState();
    if (s.phase === 'battle') s.finishBattle();
  }, []);
  // arena click on a hero with a light beacon (pendingUpgrades > 0) levels it up, like the real game
  const onUpgradeHero = useCallback((uid: string) => {
    const s = useGame.getState();
    if (s.phase === 'prep') s.upgradeHero(uid);
  }, []);
  const onSelectHero = useCallback((uid: string | null) => clickHero(uid), []);
  const onPlaceHero = useCallback((uid: string, slot: BoardSlot) => {
    if (useGame.getState().phase === 'prep') useGame.getState().placeHero(uid, slot);
  }, []);
  const onDropOnHero = useCallback((uid: string, e: DragEvent) => {
    const p = currentDrag();
    if (!p) return;
    e.preventDefault();
    dropOnHero(p, uid);
  }, []);
  const onDropOnSlot = useCallback(
    (slot: BoardSlot, e: DragEvent) => {
      const p = currentDrag();
      if (!p || p.kind !== 'hero' || useGame.getState().phase !== 'prep') return;
      e.preventDefault();
      placeHero(p.uid, slot);
    },
    [placeHero],
  );

  // hotkeys: Space Mystery · F Tavern · V lord · R refresh · Enter ready · Esc close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      const s = useGame.getState();
      const isSpace = e.code === 'Space' || e.key === ' ';
      const isEnter = e.key === 'Enter';
      if (s.phase === 'results') {
        if (isEnter || isSpace) {
          e.preventDefault();
          if (!e.repeat) s.nextRound();
        }
        return;
      }
      if (s.phase !== 'prep') {
        if (isSpace || isEnter) e.preventDefault();
        return;
      }
      if (e.repeat && (isSpace || isEnter || e.code === 'KeyF' || e.code === 'KeyV')) {
        e.preventDefault();
        return;
      }
      if (isSpace) {
        e.preventDefault();
        hideTip();
        setShopOpen((o) => !o);
      } else if (isEnter) {
        e.preventDefault();
        s.readyForBattle();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        s.upgradeShop();
      } else if (e.code === 'KeyV') {
        e.preventDefault();
        triggerLord();
      } else if (e.code === 'KeyR') {
        if (shopRef.current) {
          e.preventDefault();
          s.refreshShop();
        }
      } else if (e.key === 'Escape') {
        const ui = useUi.getState();
        hideTip();
        if (shopRef.current) setShopOpen(false);
        else if (ui.pending || ui.lordTargeting) {
          ui.setPending(null);
          ui.setLordTargeting(false);
        } else ui.select(null);
      }
    };
    // a focused button would also "click" on Space/Enter keyup
    const onKeyUp = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') e.preventDefault();
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, []);

  const world = (
    <World
      mode={battle ? 'battle' : 'prep'}
      round={round}
      heroes={heroes}
      homeTerrain={homeTerrain}
      battle={battle ? humanBattle : null}
      humanSide={humanSide}
      hostTerrain={hostTerrain}
      names={names}
      selectedUid={selectedUid}
      onSelectHero={onSelectHero}
      onPlaceHero={onPlaceHero}
      onDropOnHero={onDropOnHero}
      onDropOnSlot={onDropOnSlot}
      onBattleDone={onBattleDone}
      {...{ onUpgradeHero }}
      {...(mobile ? MOBILE_WORLD : {})}
    />
  );
  const onToggleShop = () => setShopOpen((o) => !o);

  if (mobile) {
    return (
      <div className={`screen mplay phase-${phase} ${lordTargeting ? 'lord-targeting' : ''} ${pending ? 'assigning' : ''}`}>
        <TopCenter timer={timer} enemy={enemyName} onReady={prep ? () => readyForBattle() : null} />
        <div className="m-world">{world}</div>
        <div className="m-scroll">
          <PlayerList opponent={oppId} />
          <MobileBar />
          <Dock shopOpen={shopOpen} onToggleShop={onToggleShop} />
          <UnitCard />
          <Roster />
          <InventoryGrid />
        </div>
        {prep && shopOpen && <MysteryShop mobile onClose={() => setShopOpen(false)} />}
        {phase === 'results' && <ResultToast />}
        {phase === 'game_over' && <GameOver />}
      </div>
    );
  }

  return (
    <div className={`screen play phase-${phase} ${lordTargeting ? 'lord-targeting' : ''} ${pending ? 'assigning' : ''}`}>
      <div className="play-world">{world}</div>
      <div className="hud">
        <TopCenter timer={timer} enemy={enemyName} onReady={prep ? () => readyForBattle() : null} />
        <PlayerList opponent={oppId} />
        <Roster />
        <Dock shopOpen={shopOpen} onToggleShop={onToggleShop} />
        <div className="hud-unit-slot">
          <UnitCard />
        </div>
        <div className="hud-br">
          <InventoryGrid />
        </div>
        {prep && shopOpen && <MysteryShop onClose={() => setShopOpen(false)} />}
        {phase === 'results' && <ResultToast />}
        {lordTargeting && prep && <div className="hud-banner">Choose a hero for your lord ability · Esc cancels</div>}
      </div>
      {phase === 'game_over' && <GameOver />}
    </div>
  );
}
