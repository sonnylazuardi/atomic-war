import type { PlayerState } from '../../core/types.ts';
import { useSelfId } from '../me.ts';
import { lordDef } from './defs.ts';
import { LordTip, tip } from './Tooltip.tsx';

export function Standings({ players, highlight = [] }: { players: PlayerState[]; highlight?: number[] }) {
  const selfId = useSelfId();
  const sorted = [...players].sort((a, b) => {
    if (a.alive !== b.alive) return a.alive ? -1 : 1;
    if (a.alive) return b.hp - a.hp;
    return (a.placement ?? 9) - (b.placement ?? 9);
  });
  return (
    <aside className="panel standings">
      <h3 className="panel-title">Standings</h3>
      <ol>
        {sorted.map((p, i) => {
          const lord = p.lordId ? lordDef(p.lordId) : null;
          const pct = Math.max(0, Math.min(1, p.hp / (p.maxHp || 100)));
          return (
            <li
              key={p.id}
              className={`stand ${p.id === selfId ? 'you' : ''} ${p.alive ? '' : 'dead'} ${highlight.includes(p.id) ? 'hl' : ''}`}
            >
              <span className="stand-rank">{p.alive ? i + 1 : p.placement ?? '–'}</span>
              <span className="stand-lord" style={{ borderColor: lord?.color }} {...(p.lordId ? tip(() => <LordTip id={p.lordId!} />) : {})}>
                {p.alive ? lord?.glyph ?? '?' : '💀'}
              </span>
              <div className="stand-main">
                <div className="stand-name">
                  <span>{p.name}</span>
                  {p.id === selfId && <em className="you-tag">you</em>}
                  {p.streak !== 0 && p.alive && (
                    <span className={`streak ${p.streak > 0 ? 'win' : 'loss'}`}>
                      {p.streak > 0 ? '🔥' : '❄'}
                      {Math.abs(p.streak)}
                    </span>
                  )}
                </div>
                <div className="stand-hp">
                  <div className="bar hp-bar">
                    <div style={{ width: `${pct * 100}%` }} />
                  </div>
                  <span className="stand-hp-num">{Math.max(0, Math.ceil(p.hp))}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
