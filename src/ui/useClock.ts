// One shared requestAnimationFrame loop for every animated portrait / idle scene in the UI.
// Components subscribe; the loop runs only while at least one subscriber exists, each subscriber is
// frame-gated to the perf profile's idleFps, and nothing ticks while the tab is hidden.
// Battery saver (profile.animatePortraits false): portraits render a static pose and never subscribe.
import { useEffect, useState } from 'react';
import { getPerf, usePerf } from './perf.ts';

type Sub = { fn: (now: number) => void; last: number; fps: () => number };
const subs = new Set<Sub>();
let raf = 0;

function tick(now: number) {
  raf = 0;
  if (typeof document !== 'undefined' && document.hidden) {
    // resume on visibilitychange instead of spinning in the background
    if (subs.size) document.addEventListener('visibilitychange', resume, { once: true });
    return;
  }
  for (const s of subs) {
    const min = 1000 / s.fps() - 2; // slack so 30 fps doesn't alias down to 20
    if (now - s.last >= min) {
      s.last = now;
      s.fn(now);
    }
  }
  if (subs.size) raf = requestAnimationFrame(tick);
}

function resume() {
  if (!raf && subs.size) raf = requestAnimationFrame(tick);
}

export type ClockKind = 'portrait' | 'scene';

/** fps for a clock kind under the current profile; 0 = static (no subscription) */
export function clockFps(kind: ClockKind, p = getPerf()): number {
  if (kind === 'portrait' && !p.animatePortraits) return 0;
  return Math.min(40, p.idleFps); // ~40 fps is plenty for idle animation even on 'high'
}

/** Seconds since the calling component mounted, updated from the shared RAF loop.
 *  'portrait' clocks freeze (return 0) in battery saver; 'scene' clocks run at the profile's idleFps. */
export function useClock(kind: ClockKind = 'scene'): number {
  const perf = usePerf();
  const fps = clockFps(kind, perf);
  const [t, setT] = useState(0);
  useEffect(() => {
    if (fps <= 0) return;
    const start = performance.now();
    const sub: Sub = { fn: (now) => setT((now - start) / 1000), last: 0, fps: () => fps };
    subs.add(sub);
    resume();
    return () => {
      subs.delete(sub);
    };
  }, [fps]);
  return fps > 0 ? t : 0;
}
