// Performance profile shared by the arena (World) and the HUD.
// Phones were heating up: painting the full-screen SVG every frame at 3x DPR pegged the CPU/GPU.
// 'auto' picks 'saver' on phones / weak devices / reduced-motion, 'high' on desktops.
import { useSyncExternalStore } from 'react';

export type PerfMode = 'auto' | 'high' | 'saver';

export interface PerfProfile {
  tier: 'high' | 'saver';
  /** max arena frames per second during battle playback */
  battleFps: number;
  /** max frames per second for idle animation (prep arena, portraits, lord select, gallery) */
  idleFps: number;
  /** animated terrain ambience (snow, leaves, embers…) */
  ambient: boolean;
  /** shop / roster / gallery hero portraits animate (false = static idle pose) */
  animatePortraits: boolean;
  /** CSS backdrop-filter / drop-shadow filters on panels over the arena */
  cssFilters: boolean;
  /** full particle counts in spell VFX (false = lighter) */
  richVfx: boolean;
}

const HIGH: PerfProfile = {
  tier: 'high',
  battleFps: 60,
  idleFps: 30,
  ambient: true,
  animatePortraits: true,
  cssFilters: true,
  richVfx: true,
};
const SAVER: PerfProfile = {
  tier: 'saver',
  battleFps: 30,
  idleFps: 12,
  ambient: false,
  animatePortraits: false,
  cssFilters: false,
  richVfx: false,
};

const KEY = 'aw.perf';

function weakDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const touch = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const small = Math.min(window.screen?.width ?? 1920, window.screen?.height ?? 1080) < 820;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const fewCores = (nav.hardwareConcurrency ?? 8) <= 4;
  const lowMem = (nav.deviceMemory ?? 8) <= 4;
  return reduced || (touch && small) || fewCores || lowMem;
}

function readMode(): PerfMode {
  try {
    const q = new URLSearchParams(location.search).get('perf');
    if (q === 'high' || q === 'saver' || q === 'auto') return q;
    const v = localStorage.getItem(KEY);
    if (v === 'high' || v === 'saver' || v === 'auto') return v;
  } catch {}
  return 'auto';
}

let mode: PerfMode = typeof window === 'undefined' ? 'auto' : readMode();
let profile: PerfProfile = resolve(mode);
const subs = new Set<() => void>();

function resolve(m: PerfMode): PerfProfile {
  if (m === 'high') return HIGH;
  if (m === 'saver') return SAVER;
  return weakDevice() ? SAVER : HIGH;
}

function apply() {
  profile = resolve(mode);
  if (typeof document !== 'undefined') document.documentElement.dataset.perf = profile.tier; // CSS hook: [data-perf="saver"]
  subs.forEach((f) => f());
}
apply();

export const getPerf = (): PerfProfile => profile;
export const getPerfMode = (): PerfMode => mode;

export function setPerfMode(m: PerfMode) {
  mode = m;
  try {
    localStorage.setItem(KEY, m);
  } catch {}
  apply();
}

export function usePerf(): PerfProfile {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => profile,
    () => HIGH,
  );
}

export function usePerfMode(): PerfMode {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => mode,
    () => 'auto' as PerfMode,
  );
}

/** Frame limiter for requestAnimationFrame loops: returns true when a frame should render. */
export function makeFrameGate(getFps: () => number) {
  let last = 0;
  return (now: number) => {
    const fps = getFps();
    if (fps >= 60) return true;
    const min = 1000 / fps - 2; // small slack so 30fps doesn't alias down to 20
    if (now - last < min) return false;
    last = now;
    return true;
  };
}
