// Layout mode (reacts to resize / rotation) + touch detection.
import { useSyncExternalStore } from 'react';

/** phones in portrait (and narrow windows): real-px column layout, no stage scaling */
const MOBILE_Q = '(max-width: 760px), (orientation: portrait) and (max-width: 1000px)';
/** phones in landscape: desktop HUD on a smaller logical stage */
const COMPACT_Q = '(orientation: landscape) and (max-height: 560px)';

export type LayoutMode = 'mobile' | 'compact' | 'desktop';

const hasMM = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function';

function current(): LayoutMode {
  if (!hasMM()) return 'desktop';
  if (window.matchMedia(MOBILE_Q).matches) return 'mobile';
  if (window.matchMedia(COMPACT_Q).matches) return 'compact';
  return 'desktop';
}

function subscribe(cb: () => void) {
  if (!hasMM()) return () => {};
  const qs = [window.matchMedia(MOBILE_Q), window.matchMedia(COMPACT_Q)];
  qs.forEach((q) => q.addEventListener('change', cb));
  window.addEventListener('resize', cb);
  return () => {
    qs.forEach((q) => q.removeEventListener('change', cb));
    window.removeEventListener('resize', cb);
  };
}

export const useLayoutMode = (): LayoutMode => useSyncExternalStore(subscribe, current, () => 'desktop');

/** no hover (phones/tablets): tooltips become long-press, HTML5 drag is disabled in favor of tap-to-assign */
export const isTouch = () => hasMM() && window.matchMedia('(hover: none)').matches;
