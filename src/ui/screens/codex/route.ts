// Tiny path router for the player-facing Gallery ("codex") at /gallery. Everything else stays on
// the existing mode store (title / offline / online). `?gallery` (art QA sheet) is a separate route.
import { create } from 'zustand';

export const CODEX_PATH = '/gallery';
export const isCodexPath = (p: string) => /^\/gallery\/?$/.test(p);

interface RouteState {
  codex: boolean;
}

export const useRoute = create<RouteState>()(() => ({ codex: isCodexPath(globalThis.location?.pathname ?? '/') }));

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => useRoute.setState({ codex: isCodexPath(location.pathname) }));
}

/** Title -> Gallery (keeps browser back working). */
export function openCodex() {
  history.pushState({ codex: 1 }, '', CODEX_PATH);
  useRoute.setState({ codex: true });
}

/** Gallery -> Title. Pops our own history entry when we pushed it, else replaces the URL. */
export function closeCodex() {
  const st = history.state as { codex?: number } | null;
  if (st?.codex === 1 && history.length > 1) {
    history.back();
    return;
  }
  history.pushState(null, '', '/');
  useRoute.setState({ codex: false });
}
