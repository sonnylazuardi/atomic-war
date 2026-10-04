import { useSelfId } from '../../me.ts';
import { useGame } from '../../store.ts';
import { lordDef } from '../defs.ts';
import { LordTip, tip } from '../Tooltip.tsx';

/** Left edge: 8 players, portrait + name + lord + HP. */
export function PlayerList({ opponent }: { opponent: number | null }) {
  const players = useGame((s) => s.players);
  const phase = useGame((s) => s.phase);
  const selfId = useSelfId();
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
            className={`hp-row ${p.id === selfId ? 'you' : ''} ${p.alive ? '' : 'dead'} ${vs ? 'vs' : ''}`}
            {...(p.lordId ? tip(() => <LordTip id={p.lordId!} />) : {})}
          >
            <div className="hp-port" style={{ ['--lord-c' as string]: lord?.color ?? '#666' }}>
              <span>{p.alive ? lord?.glyph ?? '?' : '💀'}</span>
              {vs && <i className="hp-vs">⚔</i>}
            </div>
            <div className="hp-main">
              <div className="hp-name">
                {p.name}
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
