// Procedural background music: an upbeat-but-gentle fantasy/chiptune loop in D minor / Dorian.
// A lookahead scheduler (25 ms tick, ~100 ms ahead) places 16th-note steps on the AudioContext clock.
// Layers (kick, hats, snare, bass, arp, pad, lead) each have their own gain; a mood sets the layer levels
// and patterns. Mood switches are quantized to the next bar and crossfade over ~1 s.
import { getSettings, live, onGraph } from './engine.ts';
import type { Graph } from './engine.ts';
import { fm, mtof, noise, tone } from './synth.ts';

export type Mood = 'menu' | 'prep' | 'battle';
type Layer = 'kick' | 'hat' | 'snare' | 'bass' | 'arp' | 'pad' | 'lead';
const LAYERS: Layer[] = ['kick', 'hat', 'snare', 'bass', 'arp', 'pad', 'lead'];

interface MoodDef {
  bpm: number;
  levels: Record<Layer, number>;
  form: Prog[]; // 4-bar progressions, cycled
}

interface Chord {
  root: number; // bass-register MIDI note
  minor: boolean;
}

type Prog = readonly [Chord, Chord, Chord, Chord];

const c = (root: number, minor: boolean): Chord => ({ root, minor });
const Dm = c(38, true);
const Bb = c(46, false);
const F = c(41, false);
const C = c(36, false);
const G = c(43, false);
const Gm = c(43, true);
const A = c(45, false);

// i–VI–III–VII, a brighter Dorian turn (major IV), a driving battle cadence, a relative-major lift
const P_A: Prog = [Dm, Bb, F, C];
const P_B: Prog = [Bb, F, C, G];
const P_C: Prog = [Dm, C, Bb, A];
const P_D: Prog = [F, C, Dm, Bb];
const P_E: Prog = [Gm, Dm, Bb, C];

const MOODS: Record<Mood, MoodDef> = {
  menu: {
    bpm: 112,
    levels: { kick: 0.45, hat: 0.35, snare: 0, bass: 0.7, arp: 0.6, pad: 1, lead: 0 },
    form: [P_A, P_D, P_A, P_E],
  },
  prep: {
    bpm: 118,
    levels: { kick: 0.6, hat: 0.6, snare: 0, bass: 0.85, arp: 0.85, pad: 0.75, lead: 0 },
    form: [P_B, P_A, P_D, P_B, P_A, P_E],
  },
  battle: {
    bpm: 126,
    levels: { kick: 0.85, hat: 0.8, snare: 0.7, bass: 1, arp: 0.7, pad: 0.45, lead: 0.75 },
    form: [P_A, P_C, P_B, P_C],
  },
};

// ---------------------------------------------------------------- state

interface Sched {
  layer: Record<Layer, GainNode>;
  duck: GainNode;
}

let sched: Sched | null = null;
let mood: Mood = 'menu';
let wanted: Mood = 'menu';
let fadeFrom: Mood | null = null; // previous mood, still played by fading-out layers for one bar
let fadeBar = -1;
let nextTime = 0;
let step = 0; // 16th within the bar
let bar = 0;
let timer: ReturnType<typeof setInterval> | null = null;
let notes = 0;
let ticks = 0;
let lastError: string | null = null;

const LOOKAHEAD = 0.1;
const TICK_MS = 25;

function build(g: Graph): Sched {
  const duck = g.ctx.createGain();
  duck.connect(g.music);
  const layer = {} as Record<Layer, GainNode>;
  for (const l of LAYERS) {
    const n = g.ctx.createGain();
    n.gain.value = MOODS[mood].levels[l];
    n.connect(duck);
    layer[l] = n;
  }
  return { layer, duck };
}

// ---------------------------------------------------------------- voices

function kick(g: Graph, out: AudioNode, t: number, v = 1) {
  tone(g.ctx, { freq: 140, to: 46, glide: 0.1, t, a: 0.003, d: 0.24, g: 0.85 * v, out });
  tone(g.ctx, { type: 'triangle', freq: 900, to: 200, t, a: 0.001, d: 0.012, g: 0.05 * v, out });
}

function hat(g: Graph, out: AudioNode, t: number, v: number, open = false) {
  noise(g.ctx, g.noise, { t, a: 0.003, d: open ? 0.09 : 0.035, g: 0.11 * v, filter: { type: 'highpass', freq: 7200 }, out });
}

function shaker(g: Graph, out: AudioNode, t: number, v: number) {
  noise(g.ctx, g.noise, { t, a: 0.012, d: 0.05, g: 0.09 * v, filter: { type: 'bandpass', freq: 5200, q: 1.1 }, out });
}

function snare(g: Graph, out: AudioNode, t: number, v = 1) {
  noise(g.ctx, g.noise, { t, a: 0.002, d: 0.15, g: 0.3 * v, filter: { type: 'bandpass', freq: 2100, to: 1300, q: 0.8 }, out });
  tone(g.ctx, { type: 'triangle', freq: 200, to: 150, t, a: 0.002, d: 0.08, g: 0.22 * v, out });
}

function bassNote(g: Graph, out: AudioNode, t: number, midi: number, len: number, drive: boolean) {
  const f = mtof(midi);
  if (drive) {
    tone(g.ctx, { type: 'sawtooth', freq: f, t, a: 0.006, hold: len * 0.35, d: len * 0.6, g: 0.16, filter: { type: 'lowpass', freq: 520, to: 260, q: 4 }, out });
  } else {
    tone(g.ctx, { type: 'triangle', freq: f, t, a: 0.012, hold: len * 0.4, d: len * 0.6, g: 0.3, out });
  }
  tone(g.ctx, { freq: f, t, a: 0.01, hold: len * 0.4, d: len * 0.55, g: 0.22, out });
}

let panFlip = 1;
function pluck(g: Graph, out: AudioNode, t: number, midi: number, v: number) {
  const f = mtof(midi);
  panFlip = -panFlip;
  tone(g.ctx, { type: 'square', freq: f, t, a: 0.003, d: 0.2, g: 0.045 * v, filter: { type: 'lowpass', freq: 3400, to: 900 }, pan: 0.22 * panFlip, out });
  tone(g.ctx, { type: 'triangle', freq: f, t, a: 0.003, d: 0.32, g: 0.09 * v, pan: 0.22 * panFlip, out });
}

function pad(g: Graph, out: AudioNode, t: number, midis: number[], len: number) {
  for (const m of midis) {
    for (const det of [-9, 8]) {
      tone(g.ctx, {
        type: 'sawtooth',
        freq: mtof(m),
        detune: det,
        t,
        a: 0.45,
        hold: Math.max(0.05, len - 0.5),
        d: 0.7,
        g: 0.022,
        filter: { type: 'lowpass', freq: 1100, to: 700, q: 0.4 },
        vib: { rate: 0.3 + Math.abs(det) * 0.02, depth: 5 },
        out,
      });
    }
  }
}

function leadNote(g: Graph, out: AudioNode, t: number, midi: number, len: number) {
  const f = mtof(midi);
  tone(g.ctx, { type: 'square', freq: f, t, a: 0.015, hold: len * 0.55, d: len * 0.5 + 0.05, g: 0.04, filter: { type: 'lowpass', freq: 2600, q: 0.7 }, vib: { rate: 5.5, depth: 10 }, out });
  fm(g.ctx, { freq: f, ratio: 2, index: 0.8, indexTo: 0.2, t, a: 0.01, hold: len * 0.5, d: len * 0.5 + 0.05, g: 0.05, out });
}

// ---------------------------------------------------------------- harmony helpers

const third = (ch: Chord) => (ch.minor ? 3 : 4);
const tones = (ch: Chord) => [0, third(ch), 7].map((i) => ch.root + i);

/** chord tones folded into [lo, hi] (sorted) */
function voiced(ch: Chord, lo: number, hi: number): number[] {
  const out: number[] = [];
  for (const n of tones(ch)) {
    for (let m = n - 48; m <= hi; m += 12) if (m >= lo) out.push(m);
  }
  return out.sort((a, b) => a - b);
}

// D minor pentatonic motifs: [step, midi, len16]
const MOTIF_A: [number, number, number][][] = [
  [
    [0, 81, 2],
    [2, 86, 2],
    [4, 84, 2],
    [6, 81, 4],
    [12, 79, 2],
    [14, 81, 2],
  ],
  [
    [0, 77, 3],
    [3, 79, 3],
    [6, 81, 6],
    [14, 74, 2],
  ],
];
const MOTIF_B: [number, number, number][][] = [
  [
    [0, 74, 2],
    [2, 77, 2],
    [4, 79, 2],
    [6, 81, 2],
    [8, 84, 4],
    [12, 81, 4],
  ],
  [
    [0, 86, 4],
    [4, 84, 2],
    [6, 81, 2],
    [8, 79, 6],
  ],
];

/** keep the pentatonic motif consonant over the A major (dominant) bar */
function fitLead(midi: number, ch: Chord): number {
  if (ch === A) {
    if (midi % 12 === 0) return midi + 1; // C -> C#
    if (midi % 12 === 5) return midi - 1; // F -> E
  }
  return midi;
}

// ---------------------------------------------------------------- the step

function playStep(g: Graph, s: Sched, m: Mood, layers: Set<Layer>, t: number, stepDur: number) {
  const def = MOODS[m];
  const phrase = Math.floor(bar / 4);
  const prog = def.form[phrase % def.form.length]!;
  const ch = prog[bar % 4]!;
  const lastBarOfPhrase = bar % 4 === 3;
  const L = s.layer;
  const on = (l: Layer) => layers.has(l);

  // ---- drums
  if (on('kick')) {
    const kicks = m === 'battle' ? [0, 8, 10] : m === 'prep' && lastBarOfPhrase ? [0, 8, 14] : [0, 8];
    if (kicks.includes(step)) kick(g, L.kick, t, step === 0 ? 1 : 0.8);
  }
  if (on('hat')) {
    if (m === 'battle') hat(g, L.hat, t, step % 4 === 2 ? 1 : step % 2 ? 0.45 : 0.7, step === 14 && lastBarOfPhrase);
    else if (m === 'prep') {
      if (step % 2 === 0) (step % 4 === 2 ? hat : shaker)(g, L.hat, t, step % 4 === 2 ? 0.9 : 0.6);
    } else if (step % 4 === 2) shaker(g, L.hat, t, 0.8);
  }
  if (on('snare')) {
    if (step === 4 || step === 12) snare(g, L.snare, t);
    else if (lastBarOfPhrase && (step === 14 || step === 15)) snare(g, L.snare, t, 0.55);
  }

  // ---- bass
  if (on('bass')) {
    const r = ch.root;
    if (m === 'battle') {
      if (step % 2 === 0) {
        const n = step === 6 || step === 14 ? r + 12 : step === 10 ? r + 7 : r;
        bassNote(g, L.bass, t, n, stepDur * 1.8, true);
      }
    } else if (m === 'prep') {
      const pat: Record<number, [number, number]> = { 0: [0, 3], 3: [0, 2], 6: [7, 2], 8: [0, 3], 11: [12, 2], 14: [7, 2] };
      const p = pat[step];
      if (p) bassNote(g, L.bass, t, r + p[0], stepDur * p[1], false);
    } else if (step === 0 || step === 8) bassNote(g, L.bass, t, step === 0 ? r : r + 7, stepDur * 7, false);
  }

  // ---- arp
  if (on('arp')) {
    const pool = m === 'menu' ? voiced(ch, 62, 79) : voiced(ch, 64, 84);
    const n = pool.length;
    if (n) {
      if (m === 'battle') {
        const up = [0, 1, 2, 3, 4, 3, 2, 1];
        const i = up[step % 8]! % n;
        pluck(g, L.arp, t, pool[i]!, step % 4 === 0 ? 1 : 0.7);
      } else if (m === 'prep') {
        const seq = [0, 2, 1, 3, 2, 4, 3, 1];
        const extra = step === 7 || step === 15; // a couple of 16ths for lift
        if (step % 2 === 0 || extra) pluck(g, L.arp, t, pool[seq[(step >> 1) % 8]! % n]!, extra ? 0.55 : step % 4 === 0 ? 1 : 0.75);
      } else {
        const seq = [0, 1, 2, 1, 3, 2, 1, 2];
        if (step % 2 === 0 && step !== 12) pluck(g, L.arp, t, pool[seq[(step >> 1) % 8]! % n]!, step % 8 === 0 ? 0.9 : 0.6);
      }
    }
  }

  // ---- pad (once per bar)
  if (on('pad') && step === 0) pad(g, L.pad, t, voiced(ch, 55, 67), stepDur * 16);

  // ---- lead (battle): two-bar motifs, alternating per phrase, resting on the turnaround
  if (on('lead') && !(lastBarOfPhrase && phrase % 2 === 1)) {
    const motif = phrase % 2 ? MOTIF_B : MOTIF_A;
    const half = motif[bar % 2]!;
    for (const [st, midi, len] of half) if (st === step) leadNote(g, L.lead, t, fitLead(midi, ch), stepDur * len);
  }
}

function setLevels(s: Sched, m: Mood, at: number) {
  for (const l of LAYERS) s.layer[l].gain.setTargetAtTime(MOODS[m].levels[l], at, 0.3);
}

function tick() {
  ticks++;
  const g = live();
  if (!g) return;
  if (!sched) sched = build(g);
  const s = sched;
  const now = g.ctx.currentTime;
  if (nextTime < now - 0.25) nextTime = now + 0.05; // stalled (background tab / resume): realign
  const st = getSettings();
  const audible = !st.muted && st.music > 0.001;
  let guard = 0;
  while (nextTime < now + LOOKAHEAD && guard++ < 64) {
    if (step === 0) {
      // bar boundary: apply a pending mood switch (quantized) and crossfade the layers
      if (wanted !== mood) {
        fadeFrom = mood;
        fadeBar = bar;
        mood = wanted;
        setLevels(s, mood, nextTime);
      }
    }
    const stepDur = 60 / MOODS[mood].bpm / 4;
    if (audible) {
      try {
        const cur = new Set<Layer>(LAYERS.filter((l) => MOODS[mood].levels[l] > 0));
        playStep(g, s, mood, cur, nextTime, stepDur);
        if (fadeFrom && fadeBar === bar) {
          // layers leaving the mix keep their old pattern for one bar while they fade out
          const leaving = new Set<Layer>(LAYERS.filter((l) => MOODS[mood].levels[l] === 0 && MOODS[fadeFrom!].levels[l] > 0));
          if (leaving.size) playStep(g, s, fadeFrom, leaving, nextTime, stepDur);
        }
        notes++;
      } catch (e) {
        lastError = (e as Error)?.message ?? String(e);
      }
    }
    nextTime += stepDur;
    step++;
    if (step >= 16) {
      step = 0;
      bar++;
      if (fadeFrom && bar > fadeBar) fadeFrom = null;
    }
  }
}

/** start the scheduler (idempotent; it idles silently until the AudioContext runs) */
export function startMusic() {
  if (timer || typeof window === 'undefined') return;
  timer = setInterval(tick, TICK_MS);
  onGraph((g) => {
    nextTime = g.ctx.currentTime + 0.05;
  });
}

/** switch mood at the next bar (crossfaded) */
export function setMood(m: Mood) {
  wanted = m;
}

export function getMood(): Mood {
  return wanted;
}

/** pull the music down for a stinger, then let it swell back */
export function duck(seconds: number, depth = 0.2) {
  const g = live();
  if (!g || !sched) return;
  const t = g.ctx.currentTime;
  const p = sched.duck.gain;
  try {
    p.cancelScheduledValues(t);
    p.setValueAtTime(p.value, t);
    p.setTargetAtTime(depth, t, 0.06);
    p.setTargetAtTime(1, t + seconds, 0.5);
  } catch {
    // ignore
  }
}

/** scheduler state for diagnostics (headless checks can't hear anything) */
export function musicState() {
  return { running: timer !== null, mood, wanted, bar, step, steps: notes, ticks, lastError, built: sched !== null };
}
