import { useEffect, useLayoutEffect, useState } from 'react';
import { hideTip, TooltipLayer } from './components/Tooltip.tsx';
import { LogToasts } from './components/LogToasts.tsx';
import { useLayoutMode } from './components/hud/layout.ts';
import { Gallery } from './screens/Gallery.tsx';
import { LordSelect } from './screens/LordSelect.tsx';
import { Play } from './screens/Play.tsx';
import { useGame } from './store.ts';

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

function Game() {
  const phase = useGame((s) => s.phase);
  const mode = useLayoutMode();
  const stage = useStage(mode === 'compact' ? 'compact' : 'desktop');

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

export function App() {
  const gallery = new URLSearchParams(location.search).has('gallery');
  return gallery ? <Gallery /> : <Game />;
}
