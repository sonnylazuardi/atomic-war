import { useEffect, useLayoutEffect, useState } from 'react';
import { hideTip, TooltipLayer } from './components/Tooltip.tsx';
import { LogToasts } from './components/LogToasts.tsx';
import { Gallery } from './screens/Gallery.tsx';
import { LordSelect } from './screens/LordSelect.tsx';
import { Play } from './screens/Play.tsx';
import { useGame } from './store.ts';

const BASE_W = 1366;
const BASE_H = 768;

/** Scale a >= 1366x768 logical stage to fill the window (no page scroll at any size). */
function useStage() {
  const calc = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / BASE_W, vh / BASE_H);
    return { scale, w: vw / scale, h: vh / scale };
  };
  const [s, setS] = useState(calc);
  useLayoutEffect(() => {
    const on = () => setS(calc());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return s;
}

let started = false;

function Game() {
  const phase = useGame((s) => s.phase);
  const stage = useStage();

  useEffect(() => {
    if (started) return;
    started = true;
    const raw = new URLSearchParams(location.search).get('seed');
    const seed = raw !== null && raw !== '' && Number.isFinite(Number(raw)) ? Number(raw) : undefined;
    useGame.getState().newGame?.(seed);
  }, []);

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

  return (
    <div className="viewport" onMouseDown={hideTip}>
      <div
        id="stage"
        className="stage"
        style={{ width: stage.w, height: stage.h, transform: `scale(${stage.scale})` }}
      >
        {screen}
        <LogToasts />
        <TooltipLayer />
      </div>
    </div>
  );
}

export function App() {
  const gallery = new URLSearchParams(location.search).has('gallery');
  return gallery ? <Gallery /> : <Game />;
}
