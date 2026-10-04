// Post-battle banner over the world: VICTORY / DEFEAT −X HP / DRAW + other matchups. Auto-continues.
import { useEffect } from 'react';
import { useGame } from '../../store.ts';

const AUTO_MS = 3000;

export function ResultToast() {
  const g = useGame();
  const me = g.players[0]!;
  const mine = g.reports.find((r) => r.pairing.left === 0 || r.pairing.right === 0);
  let result = me.lastResult;
  if (!result && mine) {
    const side = mine.pairing.left === 0 ? 'left' : 'right';
    result = mine.winner === 'draw' ? 'draw' : mine.winner === side ? 'win' : 'loss';
  }
  const label = result === 'win' ? 'Victory' : result === 'loss' ? 'Defeat' : 'Draw';
  const name = (id: number) => g.players[id]?.name ?? `Player ${id + 1}`;

  useEffect(() => {
    const round = useGame.getState().round;
    const h = setTimeout(() => {
      const s = useGame.getState();
      if (s.phase === 'results' && s.round === round) s.nextRound();
    }, AUTO_MS);
    return () => clearTimeout(h);
  }, []);

  return (
    <div className={`result-toast ${result ?? 'draw'}`} data-testid="results">
      <div className="rt-label">{label}</div>
      {mine && result === 'loss' && <div className="rt-sub dmg">−{mine.damageToLoser} HP</div>}
      {mine && result === 'win' && !mine.pairing.ghost && <div className="rt-sub">dealt {mine.damageToLoser} damage</div>}
      <ul className="rt-list">
        {g.reports
          .filter((r) => r !== mine)
          .map((r, i) => (
            <li key={i}>
              <span className={r.winner === 'left' ? 'w' : 'l'}>{name(r.pairing.left)}</span>
              <i>{r.winner === 'draw' ? '=' : r.winner === 'left' ? '▶' : '◀'}</i>
              <span className={r.winner === 'right' ? 'w' : 'l'}>
                {name(r.pairing.right)}
                {r.pairing.ghost ? ' 👻' : ''}
              </span>
              <b>{r.damageToLoser > 0 ? `−${r.damageToLoser}` : ''}</b>
            </li>
          ))}
      </ul>
      <button className="btn btn-ready rt-btn" data-testid="continue" onClick={() => g.nextRound()}>
        Continue
        <span className="rt-timer" style={{ animationDuration: `${AUTO_MS}ms` }} />
      </button>
    </div>
  );
}
