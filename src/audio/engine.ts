// Web Audio core: one lazily created AudioContext (made/resumed on the first user gesture), a master chain
// (gain -> gentle compressor -> destination) with a music bus and an sfx bus, and persisted settings.
// Everything here is optional: no AudioContext (old browser, headless, blocked) means silence, never a throw.

export interface AudioSettings {
  music: number; // 0..1
  sfx: number; // 0..1
  muted: boolean;
}

const KEY = 'aw.audio';
const DEFAULTS: AudioSettings = { music: 0.35, sfx: 0.7, muted: false };
/** headroom: the music bus sits well under the effects */
const MUSIC_BASE = 0.55;
const SFX_BASE = 0.9;

const clamp01 = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d);

function load(): AudioSettings {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const o = JSON.parse(raw) as Partial<AudioSettings>;
    return { music: clamp01(o.music, DEFAULTS.music), sfx: clamp01(o.sfx, DEFAULTS.sfx), muted: o.muted === true };
  } catch {
    return { ...DEFAULTS };
  }
}

let settings: AudioSettings = load();
const listeners = new Set<() => void>();

export function getSettings(): AudioSettings {
  return settings;
}

export function subscribeSettings(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function setSettings(patch: Partial<AudioSettings>) {
  settings = {
    music: patch.music !== undefined ? clamp01(patch.music, settings.music) : settings.music,
    sfx: patch.sfx !== undefined ? clamp01(patch.sfx, settings.sfx) : settings.sfx,
    muted: patch.muted !== undefined ? !!patch.muted : settings.muted,
  };
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(settings));
  } catch {
    // private mode / quota: settings just won't persist
  }
  applyGains();
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      // a listener must never break audio settings
    }
  }
}

export const toggleMute = () => setSettings({ muted: !settings.muted });

// ---------------------------------------------------------------- graph

export interface Graph {
  ctx: AudioContext;
  master: GainNode;
  music: GainNode;
  sfx: GainNode;
  noise: AudioBuffer;
}

let graph: Graph | null = null;
let failed = false;
const readyHooks = new Set<(g: Graph) => void>();

/** run once the graph exists (immediately if it already does) */
export function onGraph(fn: (g: Graph) => void) {
  if (graph) fn(graph);
  else readyHooks.add(fn);
}

const perceptual = (v: number) => v * v; // slider -> gain feels linear to the ear

function applyGains() {
  if (!graph) return;
  const t = graph.ctx.currentTime;
  try {
    graph.master.gain.setTargetAtTime(settings.muted ? 0 : 0.9, t, 0.03);
    graph.music.gain.setTargetAtTime(perceptual(settings.music) * MUSIC_BASE, t, 0.08);
    graph.sfx.gain.setTargetAtTime(perceptual(settings.sfx) * SFX_BASE, t, 0.03);
  } catch {
    // closed context
  }
}

function create(): Graph | null {
  if (graph || failed) return graph;
  try {
    const AC: typeof AudioContext | undefined =
      (globalThis as { AudioContext?: typeof AudioContext }).AudioContext ??
      (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) {
      failed = true;
      return null;
    }
    const ctx = new AC({ latencyHint: 'interactive' });
    const master = ctx.createGain();
    master.gain.value = settings.muted ? 0 : 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;
    master.connect(comp);
    comp.connect(ctx.destination);
    const music = ctx.createGain();
    music.gain.value = perceptual(settings.music) * MUSIC_BASE;
    music.connect(master);
    const sfx = ctx.createGain();
    sfx.gain.value = perceptual(settings.sfx) * SFX_BASE;
    // gentle tanh soft-clip so stacked battle hits round off instead of spiking the compressor
    const clip = ctx.createWaveShaper();
    const N = 2048;
    const curve = new Float32Array(N);
    const drive = 1.6;
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1)) * 2 - 1;
      curve[i] = Math.tanh(drive * x) / Math.tanh(drive);
    }
    clip.curve = curve;
    clip.oversample = '2x';
    const trim = ctx.createGain();
    trim.gain.value = 0.58; // the shaper has ~1.74x small-signal gain: keep quiet sounds where they were
    sfx.connect(clip);
    clip.connect(trim);
    trim.connect(master);
    // 1 s of white noise shared by every percussive / whoosh sound
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    let seed = 0x9e3779b9;
    for (let i = 0; i < d.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      d[i] = (seed / 0xffffffff) * 2 - 1;
    }
    graph = { ctx, master, music, sfx, noise };
    for (const fn of readyHooks) {
      try {
        fn(graph);
      } catch {
        // ignore
      }
    }
    readyHooks.clear();
    return graph;
  } catch {
    failed = true;
    return null;
  }
}

/** the graph if the context exists and is running (else null: callers just stay silent) */
export function live(): Graph | null {
  if (!graph || graph.ctx.state !== 'running') return null;
  return graph;
}

export function ctxState(): string {
  return graph ? graph.ctx.state : failed ? 'unavailable' : 'none';
}

function resume() {
  const g = create();
  if (!g || document.hidden) return;
  if (g.ctx.state === 'suspended') g.ctx.resume().catch(() => {});
}

let inited = false;

/** install the unlock-on-gesture and hidden-tab listeners (idempotent) */
export function initAudio() {
  if (inited || typeof window === 'undefined' || typeof document === 'undefined') return;
  inited = true;
  const unlock = () => resume();
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  window.addEventListener('touchend', unlock, true);
  document.addEventListener('visibilitychange', () => {
    if (!graph) return;
    if (document.hidden) graph.ctx.suspend().catch(() => {});
    else graph.ctx.resume().catch(() => {});
  });
}
