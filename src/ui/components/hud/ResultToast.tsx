// Post-battle banner over the world: VICTORY / DEFEAT −X HP / DRAW + other matchups. Advances on the phase deadline.
import { RESULTS_TIME } from '../../../core/constants.ts';
import { meOf, selfIdOf } from '../../me.ts';
import { useGame } from '../../store.ts';



export function ResultToast({ left }: { left: number | null }) {
  const g = useGame();
  const me = meOf(g);
  const self = selfIdOf(g);
  const mine = g.reports.find((r) => r.pairing.left === self || r.pairing.right === self);
  let result = me.lastResult;
  if (!result && mine) {
    const side = mine.pairing.left === self ? 'left' : 'right';
    result = mine.winner === 'draw' ? 'draw' : mine.winner === side ? 'win' : 'loss';
  }
  const label = result === 'win' ? 'Victory' : result === 'loss' ? 'Defeat' : 'Draw';
  const name = (id: number) => g.players[id]?.name ?? `Player ${id + 1}`;


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
      <div className="rt-next">
        next round in <b>{left ?? '…'}</b>
        <span className="rt-timer" style={{ animationDuration: `${RESULTS_TIME * 1000}ms` }} />
      </div>
    </div>
  );
}
