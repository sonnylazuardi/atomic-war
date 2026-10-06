// Connects the audio to the game: music mood follows the screen/phase, stingers on results/game over,
// and economy/UI sounds derived by diffing the controlled player's state (works the same offline and
// online, since both drive the one `useGame` store). Also: global button clicks, the timer's last
// seconds, and the M hotkey (mute).
import type { GameState, PlayerState } from '../core/types.ts';
import { useGame } from '../ui/store.ts';
import { useMode } from '../ui/mode.ts';
import { useRoute } from '../ui/screens/codex/route.ts';
import { ctxState, getSettings, initAudio, toggleMute } from './engine.ts';
import { duck, musicState, setMood, startMusic } from './music.ts';
import type { Mood } from './music.ts';
import { battleEnd, sfx, sfxCounts } from './sfx.ts';
import { bedState } from './bed.ts';

type Snap = Pick<GameState, 'phase' | 'round' | 'seed' | 'selfId' | 'players' | 'phaseDeadline'>;

const selfOf = (s: Snap): PlayerState | undefined => s.players[s.selfId ?? 0];
const owned = (p: PlayerState) => p.heroes.length + p.spellInventory.length + p.itemInventory.length + p.heroes.reduce((n, h) => n + h.spells.filter(Boolean).length + h.items.filter(Boolean).length, 0);
const soldOut = (p: PlayerState) => [...p.shop.heroOffers, ...p.shop.spellOffers, ...p.shop.itemOffers].filter((x) => x === null).length;
const offersKey = (p: PlayerState) => `${p.shop.heroOffers.join(',')}|${p.shop.spellOffers.join(',')}|${p.shop.itemOffers.join(',')}`;

function inGameMode(): boolean {
  const m = useMode.getState().mode;
  return m === 'offline' || m === 'online-game';
}

function moodFor(phase: GameState['phase']): Mood {
  if (!inGameMode() || useRoute.getState().codex) return 'menu';
  if (phase === 'battle') return 'battle';
  if (phase === 'prep' || phase === 'results') return 'prep';
  return 'menu';
}

/** economy / progression sounds from one state change of the controlled player */
function diff(prev: Snap, next: Snap) {
  const a = selfOf(prev);
  const b = selfOf(next);
  if (!a || !b) return;
  // a new game, another seat, or a round/phase boundary (income, auto-refresh): not the player's doing
  if (prev.seed !== next.seed || (prev.selfId ?? 0) !== (next.selfId ?? 0)) return;

  // level ups (from upgrades) are worth a sparkle whenever they happen
  const lv = new Map(a.heroes.map((h) => [h.uid, h.level]));
  if (b.heroes.some((h) => (lv.get(h.uid) ?? h.level) < h.level)) sfx.levelUp();

  if (prev.phase !== 'prep' || next.phase !== 'prep' || prev.round !== next.round) return;

  if (b.shopLevel > a.shopLevel) return sfx.tavernUp();
  if (b.shop.locked !== a.shop.locked) sfx.lock();
  const spent = b.coins < a.coins;
  const gained = b.coins > a.coins;
  const na = owned(a);
  const nb = owned(b);
  if (spent && soldOut(b) > soldOut(a)) sfx.coin(); // bought an offer (a duplicate hero levels up instead)
  else if (spent && nb > na) sfx.coin();
  else if (spent && offersKey(a) !== offersKey(b)) sfx.refresh();
  else if (gained && nb < na) sfx.sell();
  if (!a.ready && b.ready) sfx.ready();
}

/** stingers already played: one per round (`seed:round`) and one per game (`seed:over`) */
const stung = new Set<string>();

function onPhase(prev: Snap, next: Snap) {
  setMood(moodFor(next.phase));
  if (next.phase !== 'battle') battleEnd();
  if (prev.seed !== next.seed) return;
  const me = selfOf(next);
  if (prev.phase === 'prep' && next.phase === 'battle') sfx.go();
  if (next.phase === 'results' && prev.phase !== 'results' && me?.lastResult) {
    const key = `${next.seed}:${next.round}`;
    if (!stung.has(key)) {
      stung.add(key);
      duck(2.6);
      if (me.lastResult === 'win') sfx.victory();
      else if (me.lastResult === 'loss') sfx.defeat();
      else sfx.draw();
    }
  }
  if (next.phase === 'game_over' && prev.phase !== 'game_over') {
    const key = `${next.seed}:over`;
    if (!stung.has(key)) {
      stung.add(key);
      duck(4.5, 0.1);
      sfx.gameOver(me?.placement === 1);
    }
  }
}

// ---------------------------------------------------------------- countdown (last 5 s of every prep)

let counted = new Set<number>();
let countKey = '';
/** polled every 100 ms; each beep is scheduled on the audio clock exactly at its second boundary */
function timerTick() {
  const s = useGame.getState();
  if (s.phase !== 'prep' || s.phaseDeadline == null || !inGameMode()) return;
  const key = `${s.seed}:${s.round}`;
  if (key !== countKey) {
    countKey = key;
    counted = new Set();
  }
  const ms = s.phaseDeadline - Date.now();
  for (let n = 5; n >= 1; n--) {
    if (counted.has(n)) continue;
    const at = ms - n * 1000; // ms until "n seconds left"
    if (at > 150) continue;
    counted.add(n); // once per second per round, whatever re-renders or deadline re-syncs happen
    if (at > -250) sfx.countdown(n, Math.max(0, at) / 1000); // a missed beat (hidden tab, late join) stays silent
  }
}

// ---------------------------------------------------------------- input

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  if (el.isContentEditable || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
  if (el.tagName !== 'INPUT') return false;
  const type = (el as HTMLInputElement).type;
  return !['range', 'checkbox', 'radio', 'button', 'submit'].includes(type);
};

function onKey(e: KeyboardEvent) {
  if (e.code !== 'KeyM' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
  toggleMute();
}

function onClick(e: MouseEvent) {
  const el = (e.target as Element | null)?.closest?.('button, [role="button"], a.ol-codex-link');
  if (!el || (el as HTMLButtonElement).disabled) return;
  sfx.uiClick();
}

// ---------------------------------------------------------------- boot

let wired = false;

/** install everything once (safe to call from a React effect / HMR) */
export function initAudioWiring() {
  if (wired || typeof window === 'undefined') return;
  wired = true;
  try {
    initAudio();
    startMusic();
    setMood(moodFor(useGame.getState().phase));
    useGame.subscribe((next, prev) => {
      try {
        if (next.phase !== prev.phase || next.seed !== prev.seed) onPhase(prev, next);
        if (next.players !== prev.players) diff(prev, next);
      } catch {
        // audio must never break the game
      }
    });
    useMode.subscribe(() => setMood(moodFor(useGame.getState().phase)));
    useRoute.subscribe(() => setMood(moodFor(useGame.getState().phase)));
    setInterval(timerTick, 100);
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick, true);
    (window as unknown as { __awAudio?: unknown }).__awAudio = {
      state: () => ({ ctx: ctxState(), settings: getSettings(), music: musicState(), bed: bedState(), sfx: { ...sfxCounts } }),
    };
  } catch {
    // no audio at all is fine
  }
}
