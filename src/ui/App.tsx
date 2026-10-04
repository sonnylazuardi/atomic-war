import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { hideTip, TooltipLayer } from './components/Tooltip.tsx';
import { LogToasts } from './components/LogToasts.tsx';
import { useLayoutMode } from './components/hud/layout.ts';
import { Gallery } from './screens/Gallery.tsx';
import { LordSelect } from './screens/LordSelect.tsx';
import { Play } from './screens/Play.tsx';
import { useGame } from './store.ts';
import { isOnlineMode, useMode } from './mode.ts';
import { bootOnline } from '../net/session.ts';
import { ConnBadge, UpdateOverlay } from './screens/online/Shell.tsx';
import { Rooms } from './screens/online/Rooms.tsx';
import { SignIn } from './screens/online/SignIn.tsx';
import { Title } from './screens/online/Title.tsx';
import { WaitingRoom } from './screens/online/WaitingRoom.tsx';

/** Logical stage sizes: desktop 1366x768; landscape phones get a smaller stage so the HUD is less tiny. */
const STAGES = { desktop: [1366, 768], compact: [1100, 620] } as const;

/** Scale a logical stage to fill the window (no page scroll at any size). */
function useStage(kind: keyof typeof STAGES) {
  const [bw, bh] = STAGES[kind];
  const calc = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / bw, vh / bh);
    return { scale, w: vw / scale, h: vh / scale };
  };
  const [s, setS] = useState(calc);
  useLayoutEffect(() => {
    const on = () => setS(calc());
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [bw, bh]);
  return s;
}

let started = false;

function Game({ online = false }: { online?: boolean }) {
  const phase = useGame((s) => s.phase);
  const mode = useLayoutMode();
  const stage = useStage(mode === 'compact' ? 'compact' : 'desktop');

  useEffect(() => {
    if (online || started) return;
    started = true;
    const raw = new URLSearchParams(location.search).get('seed');
    const seed = raw !== null && raw !== '' && Number.isFinite(Number(raw)) ? Number(raw) : undefined;
    useGame.getState().newGame?.(seed);
  }, [online]);

  let screen;
  switch (phase) {
    case 'lord_select':
      screen = <LordSelect />;
      break;
    case 'prep':
    case 'battle':
    case 'results':
    case 'game_over':
      // one persistent world: prep, battle and results never swap screens
      screen = <Play />;
      break;
    default:
      screen = <div className="screen loading">Summoning atoms…</div>;
  }

  if (mode === 'mobile') {
    // phones in portrait: real CSS px, column layout, no stage scaling
    return (
      <div className="viewport mobile" onMouseDown={hideTip} onTouchStartCapture={hideTip}>
        <div id="stage" className="stage mstage">
          {screen}
          <LogToasts />
          <TooltipLayer />
        </div>
      </div>
    );
  }

  return (
    <div className="viewport" onMouseDown={hideTip} onTouchStartCapture={hideTip}>
      <div
        id="stage"
        className={`stage ${mode === 'compact' ? 'compact' : ''}`}
        style={{ width: stage.w, height: stage.h, transform: `scale(${stage.scale})` }}
      >
        {screen}
        <LogToasts />
        <TooltipLayer />
      </div>
    </div>
  );
}

/** Title / sign-in / rooms / waiting room: real CSS px (responsive), not the scaled game stage. */
function Lobby({ children }: { children: ReactNode }) {
  return (
    <div className="viewport lobby" onMouseDown={hideTip}>
      {children}
    </div>
  );
}

export function App() {
  useEffect(bootOnline, []);
  const mode = useMode((s) => s.mode);
  const gallery = new URLSearchParams(location.search).has('gallery');
  if (gallery) return <Gallery />;
  let body: ReactNode;
  switch (mode) {
    case 'offline':
      return <Game />;
    case 'online-game':
      body = <Game online />;
      break;
    case 'title':
      body = (
        <Lobby>
          <Title />
        </Lobby>
      );
      break;
    case 'online-auth':
      body = (
        <Lobby>
          <SignIn />
        </Lobby>
      );
      break;
    case 'online-rooms':
      body = (
        <Lobby>
          <Rooms />
        </Lobby>
      );
      break;
    case 'online-room':
      body = (
        <Lobby>
          <WaitingRoom />
        </Lobby>
      );
      break;
  }
  return (
    <>
      {body}
      {isOnlineMode(mode) && mode !== 'online-auth' && mode !== 'online-rooms' && <ConnBadge inGame={mode === 'online-game'} />}
      {isOnlineMode(mode) && <UpdateOverlay />}
    </>
  );
}
