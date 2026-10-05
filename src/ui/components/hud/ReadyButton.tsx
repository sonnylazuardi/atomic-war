// READY during preparation. Offline: starts the battle at once. Online: toggles your ready flag; the server
// starts the battle when every connected, alive, non-autopilot human is ready (or at the deadline).
import type { GameState } from '../../../core/types.ts';
import { setReady, useNet } from '../../../net/session.ts';
import { useGame } from '../../store.ts';

/** online ready tally: n ready of m deciding humans (alive, not on autopilot) */
export function readyTally(s: Pick<GameState, 'players'>): { n: number; m: number } {
  const deciding = s.players.filter((p) => p.isHuman && p.alive && !p.autopilot);
  return { n: deciding.filter((p) => p.ready).length, m: deciding.length };
}

/** click / Enter: what READY does right now */
export function toggleReady() {
  const g = useGame.getState();
  if (g.phase !== 'prep') return;
  const net = useNet.getState();
  if (!net.inGame) return g.readyForBattle();
  const seat = net.you?.seat;
  if (seat == null || net.watching !== null || !g.players[seat]?.alive) return;
  setReady(!g.players[seat]!.ready);
}

export function ReadyButton() {
  const phase = useGame((s) => s.phase);
  const inGame = useNet((s) => s.inGame);
  const seat = useNet((s) => (s.inGame ? (s.you?.seat ?? null) : null));
  const watching = useNet((s) => s.watching);
  const me = useGame((s) => (seat !== null ? s.players[seat] : undefined));
  // primitive selectors (a fresh object per call would re-render forever)
  const n = useGame((s) => readyTally(s).n);
  const m = useGame((s) => readyTally(s).m);
  if (phase !== 'prep') return null;
  if (inGame && (seat === null || watching !== null || !me?.alive)) return null;
  const waiting = inGame && !!me?.ready;
  return (
    <button
      type="button"
      className={`btn ht-ready${waiting ? ' waiting' : ''}`}
      data-testid="ready"
      data-ready={waiting ? '1' : '0'}
      title={waiting ? 'Click to cancel ready (Enter)' : 'Start the battle now (Enter)'}
      onClick={toggleReady}
    >
      {waiting ? (
        <>
          Waiting… <small>
            {n}/{m} ready
          </small>
        </>
      ) : (
        'Ready'
      )}
    </button>
  );
}
