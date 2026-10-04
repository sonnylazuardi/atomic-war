// Title screen: big logo, two lords idling, Play vs Bots (today's offline game) or Play Online.
import { LORD_IDS } from '../../../core/ids.ts';
import type { LordId } from '../../../core/types.ts';
import { getLordArt, isHeroLordArt } from '../../../art/lords/index.ts';
import { goOnline, useNet } from '../../../net/session.ts';
import { useMode } from '../../mode.ts';
import { useClock } from '../../useClock.ts';
import { LobbyShell } from './Shell.tsx';

function Fig({ id, t, flip }: { id: LordId; t: number; flip?: boolean }) {
  const Art = getLordArt(id);
  return (
    <div className="ol-fig">
      <svg viewBox="-55 -100 110 106" preserveAspectRatio="xMidYMax meet" aria-hidden>
        <ellipse cx={0} cy={0} rx={34} ry={7} fill="#000" opacity={0.35} />
        <g transform={`scale(${flip ? -1 : 1},1)${isHeroLordArt(id) ? ' scale(1.13)' : ''}`}>
          <Art anim="idle" t={t} dur={0} team="left" />
        </g>
      </svg>
    </div>
  );
}

export function Title() {
  const t = useClock();
  const user = useNet((s) => s.session?.user ?? null);
  const a = LORD_IDS[0]!;
  const b = LORD_IDS[Math.min(LORD_IDS.length - 1, 3)]!;
  return (
    <LobbyShell center testId="title">
      <div className="ol-hero-row">
        <Fig id={a} t={t} />
        <h1 className="ol-logo">
          Atomic War
          <small>2D</small>
        </h1>
        <Fig id={b} t={t + 0.5} flip />
      </div>
      <div className="ol-tag">Eight lords · one arena · last one standing</div>
      <div className="ol-menu">
        <button className="btn btn-ready big" data-testid="title-offline" onClick={() => useMode.getState().setMode('offline')}>
          Play vs Bots
        </button>
        <button className="btn btn-gold" data-testid="title-online" onClick={goOnline}>
          Play Online
        </button>
        {user && (
          <div className="ol-note" style={{ textAlign: 'center' }}>
            Signed in as <b>{user.name ?? user.email}</b>
            {user.guest ? ' (guest)' : ''}
          </div>
        )}
      </div>
    </LobbyShell>
  );
}
