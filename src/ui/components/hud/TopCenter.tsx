import { boardCap } from '../../../core/constants.ts';
import { boardCount } from '../../../core/game/index.ts';
import { useGame } from '../../store.ts';

export function TopCenter({ timer, enemy }: { timer: number | null; enemy: string | null }) {
  const round = useGame((s) => s.round);
  const phase = useGame((s) => s.phase);
  const me = useGame((s) => s.players[0]!);
  const cap = boardCap(round);
  const n = boardCount(me);
  const label = phase === 'battle' ? 'Battle' : phase === 'prep' ? 'Preparation' : phase === 'game_over' ? 'Game Over' : 'Results';
  const cls = phase === 'battle' ? 'battle' : phase === 'prep' ? 'prep' : 'over';
  const urgent = phase === 'prep' && timer !== null && timer <= 5;
  return (
    <div className="hud-top">
      <div className="ht-emblem" aria-hidden>
        <svg viewBox="-20 -20 40 40">
          <circle r="18" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
          {[0, 120, 240].map((a) => (
            <path key={a} transform={`rotate(${a})`} d="M0 -3 C 7 -6 12 -2 13 6 C 9 1 5 -1 0 -3 Z" fill="currentColor" />
          ))}
          <circle r="3" fill="currentColor" />
        </svg>
      </div>
      <div className="ht-main">
        <div className="ht-title">
          Round <b data-testid="round">{round}</b> <span className={`ht-phase ${cls}`}>{label}</span>
        </div>
        {timer !== null && phase !== 'battle' ? (
          <div className={`ht-sub ht-timer ${urgent ? 'urgent' : ''}`} data-testid="phase-timer">
            {timer}
          </div>
        ) : (
          <div className="ht-sub">{phase === 'battle' && enemy ? `vs ${enemy}` : '—'}</div>
        )}
      </div>
      <div className={`ht-stat ${n >= cap ? 'full' : ''}`} title="Heroes on board / cap">
        <span className="ht-ico">👤</span>
        {n}/{cap}
      </div>
      <div className="ht-stat coins" title="Coins">
        <span className="ht-coin">$</span>
        <b data-testid="coins">{me.coins}</b>
      </div>
    </div>
  );
}
