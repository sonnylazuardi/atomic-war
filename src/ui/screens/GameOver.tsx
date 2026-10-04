import { Standings } from '../components/Standings.tsx';
import { useGame } from '../store.ts';

export function GameOver() {
  const g = useGame();
  const me = g.players[0]!;
  const place = me.placement ?? (me.alive ? 1 : 8);
  const winner = g.players.find((p) => p.placement === 1) ?? g.players.find((p) => p.alive);
  const won = place === 1;
  return (
    <div className="game-over go-overlay" data-testid="game-over">
      <div className="go-main">
        <div className={`go-place ${won ? 'won' : ''}`}>
          <div className="go-kicker">{won ? 'Last Lord standing' : 'Eliminated'}</div>
          <div className="go-rank">#{place}</div>
          <div className="go-text">{won ? 'Victory! The atoms bow to you.' : `You placed ${place} of ${g.players.length}`}</div>
          {winner && !won && <div className="go-winner">Winner: {winner.name}</div>}
          <div className="go-round">Survived {g.round} rounds</div>
        </div>
        <button className="btn btn-ready big" data-testid="new-game" onClick={() => g.newGame()}>
          New Game
        </button>
      </div>
      <Standings players={g.players} />
    </div>
  );
}
