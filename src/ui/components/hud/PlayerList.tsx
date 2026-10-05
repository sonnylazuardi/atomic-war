import { useSelfId } from '../../me.ts';
import { useNet, watch } from '../../../net/session.ts';
import { useGame } from '../../store.ts';
import { lordDef } from '../defs.ts';
import { LordTip, tip } from '../Tooltip.tsx';

/** Left edge: 8 players, portrait + name + lord + HP. */
export function PlayerList({ opponent }: { opponent: number | null }) {
  const players = useGame((s) => s.players);
  const phase = useGame((s) => s.phase);
  const viewId = useSelfId(); // the seat the HUD follows (the watched one while spectating)
  const inGame = useNet((s) => s.inGame);
  const seat = useNet((s) => (s.inGame ? (s.you?.seat ?? null) : null));
  const watching = useNet((s) => s.watching);
  const selfId = inGame && seat !== null ? seat : viewId;
  // online: eliminated players (and seatless spectators) can watch anyone's arena
  const canWatch = inGame && phase !== 'game_over' && (seat === null || players[seat]?.alive === false);
  const sorted = [...players].sort((a, b) => {
    if (a.alive !== b.alive) return a.alive ? -1 : 1;
    if (a.alive) return b.hp - a.hp || a.id - b.id;
    return (a.placement ?? 9) - (b.placement ?? 9);
  });
  return (
    <aside className="hud-players">
      {sorted.map((p) => {
        const lord = p.lordId ? lordDef(p.lordId) : null;
        const pct = Math.max(0, Math.min(1, p.hp / (p.maxHp || 100)));
        const vs = phase === 'battle' && opponent === p.id;
        return (
          <div
            key={p.id}
            className={`hp-row ${p.id === selfId ? 'you' : ''} ${p.alive ? '' : 'dead'} ${vs ? 'vs' : ''}${canWatch ? ' watchable' : ''}${
              watching === p.id ? ' watched' : ''
            }`}
            data-testid="player-row"
            data-pid={p.id}
            {...(p.lordId ? tip(() => <LordTip id={p.lordId!} />) : {})}
            {...(canWatch
              ? {
                  role: 'button',
                  tabIndex: 0,
                  title: p.id === seat ? 'Back to your arena' : `Watch ${p.name}`,
                  onClick: () => watch(p.id === seat || p.id === watching ? null : p.id),
                }
              : {})}
          >
            {canWatch && <span className="hp-watch">{watching === p.id ? 'Watching' : p.id === seat ? 'You' : 'Watch'}</span>}
            <div className="hp-port" style={{ ['--lord-c' as string]: lord?.color ?? '#666' }}>
              <span>{p.alive ? lord?.glyph ?? '?' : '💀'}</span>
              {vs && <i className="hp-vs">⚔</i>}
            </div>
            <div className="hp-main">
              <div className="hp-name">
                {p.name}
                {p.lordId === 'bloodseeker' && p.lordState?.bloodrage === 1 && p.alive && (
                  <span className="hp-blood" data-testid="bloodrage-armed" title="Bloodrage armed">
                    🩸
                  </span>
                )}
                {phase === 'prep' && p.ready && p.alive && (
                  <span className="hp-ready" data-testid="ready-check" title="Ready">
                    ✓
                  </span>
                )}
                {p.streak !== 0 && p.alive && (
                  <span className={`streak ${p.streak > 0 ? 'win' : 'loss'}`}>
                    {p.streak > 0 ? '🔥' : '❄'}
                    {Math.abs(p.streak)}
                  </span>
                )}
              </div>
              <div className="hp-lord">{lord ? lord.name : '…'}</div>
              <div className="hp-barrow">
                <div className="bar hp-bar">
                  <div style={{ width: `${pct * 100}%` }} />
                </div>
                <span className="hp-num" {...(p.id === selfId ? { 'data-testid': 'player-hp' } : {})}>
                  {Math.max(0, Math.ceil(p.hp))}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </aside>
  );
}
