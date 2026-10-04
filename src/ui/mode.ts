// Which top-level screen the app shows. Offline = today's single-player flow, untouched.
import { create } from 'zustand';

export type UiMode = 'title' | 'offline' | 'online-auth' | 'online-rooms' | 'online-room' | 'online-game';

/** `/?seed=..`, `/?prep=..` and `/?offline` land straight in the offline game (tests, deep links);
 *  `/?online` (and an OAuth `#aw_token=` / `#aw_error=` return) opens the online flow (net/session.ts
 *  bootOnline() then picks sign-in or rooms); the bare URL shows the Title screen. */
export function initialMode(search: string, hash = ''): UiMode {
  const q = new URLSearchParams(search);
  if (q.has('seed') || q.has('prep') || q.has('offline')) return 'offline';
  if (q.has('online') || /(^|[#&])aw_(token|error)=/.test(hash)) return 'online-auth';
  return 'title';
}

interface ModeState {
  mode: UiMode;
  setMode(m: UiMode): void;
}

export const useMode = create<ModeState>()((set) => ({
  mode: initialMode(globalThis.location?.search ?? '', globalThis.location?.hash ?? ''),
  setMode: (mode) => set({ mode }),
}));

export const isOnlineMode = (m: UiMode) => m.startsWith('online');
