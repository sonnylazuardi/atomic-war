// Title screen: big logo, two lords idling, Play vs Bots (today's offline game) or Play Online.
import { LORD_IDS } from '../../../core/ids.ts';
import type { LordId } from '../../../core/types.ts';
import { getLordArt, isHeroLordArt } from '../../../art/lords/index.ts';
import { goOnline, useNet } from '../../../net/session.ts';
import { useMode } from '../../mode.ts';
import { useClock } from '../../useClock.ts';
import { LobbyShell } from './Shell.tsx';
import { CODEX_PATH, openCodex } from '../codex/route.ts';

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

/** small open-book glyph for the Gallery link */
function BookIcon() {
  return (
    <svg viewBox="0 0 20 16" width="18" height="14" aria-hidden>
      <path
        d="M10 3.2C8.2 1.8 5.6 1.2 1.5 1.5v11.6c4.1-.3 6.7.3 8.5 1.7 1.8-1.4 4.4-2 8.5-1.7V1.5c-4.1-.3-6.7.3-8.5 1.7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M10 3.2v11.6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
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
        <a
          className="ol-codex-link"
          href={CODEX_PATH}
          data-testid="title-gallery"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // new tab / window: let the browser handle it
            e.preventDefault();
            openCodex();
          }}
        >
          <BookIcon />
          Gallery
        </a>
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
