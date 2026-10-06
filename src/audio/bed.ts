// Intense battle bed: war-drum toms + sub rumble + distant clash ambience under the battle SFX.
// Its level follows battle intensity (recent hits / crits / deaths / ultimates and units alive), smoothed
// with a 0.3 s attack and 1.5 s release. The toms are placed on the music scheduler's 16th grid (music.ts
// calls bedStep) so they lock to the tempo; the rumble is a continuous source while the bed is on.
import { getSettings, live } from './engine.ts';
import type { Graph } from './engine.ts';
import { fm, noise, tone } from './synth.ts';

interface Bed {
  g: Graph;
  out: GainNode; // intensity-driven level
  rumble: GainNode;
  stop: () => void;
}

let bed: Bed | null = null;
let energy = 0; // decays with a ~1.5 s time constant
let energyAt = 0; // performance.now() seconds of the last decay
let alive = 10;
let applied = -1;
let appliedOn = true;

const nowS = () => performance.now() / 1000;

function decayed(): number {
  const t = nowS();
  energy *= Math.exp(-(t - energyAt) / 1.5);
  energyAt = t;
  return energy;
}

/** add battle energy: a hit ~0.05, a crit ~0.15, a death ~0.35, an ultimate ~0.5 */
export function bump(amount: number, unitsAlive?: number) {
  decayed();
  energy = Math.min(3, energy + amount);
  if (unitsAlive !== undefined) alive = unitsAlive;
}

/** 0..1 battle intensity */
export function intensity(): number {
  if (!bed) return 0;
  const e = decayed();
  const crowd = Math.min(1, alive / 10) * 0.25;
  return Math.min(1, 0.18 + crowd + (1 - Math.exp(-e)) * 0.7);
}

function sfxAudible(): boolean {
  const s = getSettings();
  return !s.muted && s.sfx > 0.001;
}

/** start (true) or fade out (false) the bed. Safe to call repeatedly. */
export function battleBed(on: boolean) {
  if (!on) {
    const b = bed;
    bed = null;
    if (!b) return;
    try {
      const t = b.g.ctx.currentTime;
      b.out.gain.cancelScheduledValues(t);
      b.out.gain.setValueAtTime(b.out.gain.value, t);
      b.out.gain.setTargetAtTime(0, t, 0.35);
      setTimeout(b.stop, 2000);
    } catch {
      b.stop();
    }
    return;
  }
  if (bed) return;
  const g = live();
  if (!g) return;
  try {
    energy = 0.3;
    energyAt = nowS();
    alive = 10;
    applied = -1;
    const out = g.ctx.createGain();
    out.gain.value = 0;
    out.connect(g.sfx);
    const rumble = g.ctx.createGain();
    rumble.gain.value = 0.0001;
    rumble.connect(out);
    const sub = g.ctx.createOscillator();
    sub.frequency.value = 41;
    const subG = g.ctx.createGain();
    subG.gain.value = 0.18;
    sub.connect(subG);
    subG.connect(rumble);
    const n = g.ctx.createBufferSource();
    n.buffer = g.noise;
    n.loop = true;
    n.playbackRate.value = 0.5;
    const lp = g.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 110;
    lp.Q.value = 0.7;
    const nG = g.ctx.createGain();
    nG.gain.value = 0.5;
    n.connect(lp);
    lp.connect(nG);
    nG.connect(rumble);
    sub.start();
    n.start();
    bed = {
      g,
      out,
      rumble,
      stop: () => {
        try {
          sub.stop();
          n.stop();
          out.disconnect();
        } catch {
          // already stopped
        }
      },
    };
    out.gain.setTargetAtTime(0.5, g.ctx.currentTime, 0.4);
  } catch {
    bed = null;
  }
}

export const bedActive = () => bed !== null;
export const bedState = () => ({ on: bed !== null, intensity: Math.round(intensity() * 100) / 100 });

/** called by the music scheduler for every 16th step (t = ctx time) */
export function bedStep(step: number, bar: number, t: number) {
  const b = bed;
  if (!b) return;
  const k = intensity();
  // smoothed level: fast attack, slow release
  const on = sfxAudible();
  if (Math.abs(k - applied) > 0.02 || on !== appliedOn) {
    appliedOn = on;
    const rising = k > applied;
    b.out.gain.setTargetAtTime(on ? 0.25 + 0.55 * k : 0, t, rising ? 0.1 : 0.5);
    b.rumble.gain.setTargetAtTime(0.05 + 0.5 * k * k, t, rising ? 0.1 : 0.5);
    applied = k;
  }
  if (!on) return;
  const g = b.g;
  const o = b.out;
  const lastBar = bar % 4 === 3;
  // war drums: low pulse on the beat pairs, mid toms join as it heats up, rolls when it's wild
  if (step === 0 || step === 8) tom(g, o, t, 'low', 1);
  else if (step === 3 || step === 11) tom(g, o, t, 'low', 0.55);
  if (k > 0.45 && (step === 6 || step === 14)) tom(g, o, t, 'mid', 0.7);
  if (k > 0.75 && lastBar && step >= 12) tom(g, o, t, step % 2 ? 'mid' : 'high', 0.5 + (step - 12) * 0.12);
  // distant clashes
  if (Math.random() < 0.1 * k * k) clash(g, o, t + Math.random() * 0.05);
}

function tom(g: Graph, o: AudioNode, t: number, kind: 'low' | 'mid' | 'high', v: number) {
  const f = kind === 'low' ? 92 : kind === 'mid' ? 128 : 165;
  tone(g.ctx, { freq: f * 1.4, to: f, glide: 0.06, t, a: 0.003, d: 0.32, g: 0.42 * v, out: o });
  noise(g.ctx, g.noise, { t, a: 0.002, d: 0.07, g: 0.12 * v, filter: { type: 'lowpass', freq: 900 }, out: o });
}

function clash(g: Graph, o: AudioNode, t: number) {
  const pan = Math.random() * 1.6 - 0.8;
  fm(g.ctx, { freq: 2100 + Math.random() * 1400, ratio: 2.76, index: 0.8, indexTo: 0.05, t, d: 0.16, g: 0.014, filter: { type: 'lowpass', freq: 3800 }, pan, out: o });
  noise(g.ctx, g.noise, { t, a: 0.002, d: 0.05, g: 0.03, filter: { type: 'bandpass', freq: 1700, q: 1.2 }, pan, out: o });
}
