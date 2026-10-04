// One shared requestAnimationFrame loop for every animated portrait in the UI.
// Components subscribe; the loop runs only while at least one subscriber exists.
import { useEffect, useState } from 'react';

type Sub = (now: number) => void;
const subs = new Set<Sub>();
let raf = 0;
let lastEmit = 0;
const FRAME_MS = 1000 / 40; // ~40 fps is plenty for idle portraits

function tick(now: number) {
  if (now - lastEmit >= FRAME_MS) {
    lastEmit = now;
    for (const s of subs) s(now);
  }
  raf = subs.size > 0 ? requestAnimationFrame(tick) : 0;
}

/** Seconds since the calling component mounted, updated from the shared RAF loop. */
export function useClock(): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const sub: Sub = (now) => setT((now - start) / 1000);
    subs.add(sub);
    if (!raf) raf = requestAnimationFrame(tick);
    return () => {
      subs.delete(sub);
    };
  }, []);
  return t;
}
