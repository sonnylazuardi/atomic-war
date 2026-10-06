// PWA helpers: service-worker registration (production builds only) and the "install app" flow.
// Chrome/Edge/Android fire `beforeinstallprompt`; iOS Safari has no prompt, so we show a hint instead.
import { useSyncExternalStore } from 'react';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
let installed = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

const standalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

const isIos = () =>
  typeof navigator !== 'undefined' &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export function initPwa() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // we show our own button
    deferred = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    emit();
  });
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

export type InstallState = 'prompt' | 'ios-hint' | 'none';

const snapshot = (): InstallState => {
  if (installed || standalone()) return 'none';
  if (deferred) return 'prompt';
  if (isIos()) return 'ios-hint';
  return 'none';
};

export function useInstallState(): InstallState {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    snapshot,
    () => 'none',
  );
}

export async function promptInstall() {
  if (!deferred) return;
  const ev = deferred;
  deferred = null;
  await ev.prompt();
  await ev.userChoice.catch(() => null);
  emit();
}
