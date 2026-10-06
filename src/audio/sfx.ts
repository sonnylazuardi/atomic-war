// Synthesized sound effects (no audio files): UI, economy, battle hits and per-element spell casts.
// Every call is fire-and-forget and silent when the AudioContext isn't running or sfx are muted.
// Hits are throttled (max ~6 per 100 ms, fewer at fast playback) and identical sounds coalesce.
import type { BattleEvent, SpellDef } from '../core/types.ts';
import { SPELLS } from '../core/data/index.ts';
import { getSettings, live } from './engine.ts';
import type { Graph } from './engine.ts';
import { fm, mtof, noise, tone } from './synth.ts';

const jitter = (amt = 0.05) => 1 + (Math.random() * 2 - 1) * amt;

/** the graph when an effect may sound now (else null) */
function out(): Graph | null {
  const g = live();
  if (!g) return null;
  const s = getSettings();
  if (s.muted || s.sfx <= 0.001) return null;
  return g;
}

const lastAt = new Map<string, number>();
/** coalesce: the same sound within `gap` seconds plays once */
function gate(name: string, gap: number, delay = 0): boolean {
  const now = performance.now() / 1000 + delay; // scheduled time, so delayed copies don't collide
  const prev = lastAt.get(name) ?? -9;
  if (Math.abs(now - prev) < gap) return false;
  lastAt.set(name, now);
  return true;
}

/** sliding-window limiter: at most `max` sounds of a kind per `win` seconds */
const windows = new Map<string, number[]>();
function budget(kind: string, max: number, win = 0.1): boolean {
  const now = performance.now() / 1000;
  const arr = (windows.get(kind) ?? []).filter((x) => now - x < win);
  if (arr.length >= max) {
    windows.set(kind, arr);
    return false;
  }
  arr.push(now);
  windows.set(kind, arr);
  return true;
}

function play(name: string, gap: number, fn: (g: Graph, t: number, o: AudioNode) => void, delay = 0) {
  const g = out();
  if (!g || !gate(name, gap, delay)) return;
  try {
    fn(g, g.ctx.currentTime + 0.005 + Math.max(0, delay), g.sfx);
  } catch {
    // a failed effect must never break the game
  }
}

/** sub boom under big moments */
function boom(g: Graph, t: number, o: AudioNode, v = 1) {
  tone(g.ctx, { freq: 90, to: 32, glide: 0.5, t, a: 0.01, d: 0.7, g: 0.55 * v, out: o });
  noise(g.ctx, g.noise, { t, a: 0.01, d: 0.5, g: 0.18 * v, filter: { type: 'lowpass', freq: 400, to: 90 }, out: o });
}

// ---------------------------------------------------------------- UI

export const sfx = {
  uiClick() {
    play('click', 0.04, (g, t, o) => {
      tone(g.ctx, { type: 'triangle', freq: 1250 * jitter(0.03), to: 820, t, a: 0.002, d: 0.035, g: 0.09, out: o });
    });
  },

  hover() {
    play('hover', 0.06, (g, t, o) => {
      tone(g.ctx, { freq: 2100, t, a: 0.004, d: 0.025, g: 0.018, out: o });
    });
  },

  coin() {
    play('coin', 0.05, (g, t, o) => {
      const p = jitter(0.02);
      tone(g.ctx, { type: 'square', freq: 988 * p, t, a: 0.002, d: 0.06, g: 0.06, filter: { type: 'lowpass', freq: 5000 }, out: o });
      tone(g.ctx, { type: 'square', freq: 1319 * p, t: t + 0.065, a: 0.002, d: 0.28, g: 0.06, filter: { type: 'lowpass', freq: 5000, to: 2000 }, out: o });
      fm(g.ctx, { freq: 2637 * p, ratio: 3.5, index: 0.5, indexTo: 0.05, t: t + 0.065, d: 0.3, g: 0.03, out: o });
    });
  },

  sell() {
    play('sell', 0.06, (g, t, o) => {
      tone(g.ctx, { type: 'square', freq: 1319, t, a: 0.002, d: 0.05, g: 0.05, filter: { type: 'lowpass', freq: 4500 }, out: o });
      tone(g.ctx, { type: 'square', freq: 880, t: t + 0.055, a: 0.002, d: 0.08, g: 0.05, filter: { type: 'lowpass', freq: 4500 }, out: o });
      for (let i = 0; i < 3; i++)
        fm(g.ctx, { freq: 2200 + i * 380 + Math.random() * 200, ratio: 2.7, index: 0.6, indexTo: 0.05, t: t + 0.11 + i * 0.045, d: 0.12, g: 0.025, out: o });
    });
  },

  refresh() {
    play('refresh', 0.12, (g, t, o) => {
      for (let i = 0; i < 7; i++)
        noise(g.ctx, g.noise, { t: t + i * 0.026 + Math.random() * 0.008, a: 0.002, d: 0.03, g: 0.13, filter: { type: 'bandpass', freq: 2600 + Math.random() * 1500, q: 1.4 }, out: o });
      tone(g.ctx, { type: 'triangle', freq: 700, to: 1100, t: t + 0.18, a: 0.005, d: 0.08, g: 0.05, out: o });
    });
  },

  tavernUp() {
    play('tavern', 0.2, (g, t, o) => {
      [62, 66, 69, 74, 78].forEach((m, i) => {
        tone(g.ctx, { type: 'triangle', freq: mtof(m + 12), t: t + i * 0.07, a: 0.004, d: 0.35, g: 0.08, out: o });
        fm(g.ctx, { freq: mtof(m + 24), ratio: 3, index: 0.4, indexTo: 0.02, t: t + i * 0.07, d: 0.3, g: 0.02, out: o });
      });
      noise(g.ctx, g.noise, { t: t + 0.2, a: 0.15, d: 0.4, g: 0.04, filter: { type: 'highpass', freq: 6000 }, out: o });
    });
  },

  lock() {
    play('lock', 0.08, (g, t, o) => {
      tone(g.ctx, { type: 'square', freq: 320, to: 140, t, a: 0.001, d: 0.05, g: 0.06, filter: { type: 'lowpass', freq: 1800 }, out: o });
      noise(g.ctx, g.noise, { t: t + 0.04, a: 0.001, d: 0.02, g: 0.12, filter: { type: 'bandpass', freq: 3500, q: 2 }, out: o });
    });
  },

  ready() {
    play('ready', 0.15, (g, t, o) => {
      [74, 81].forEach((m, i) => tone(g.ctx, { type: 'triangle', freq: mtof(m), t: t + i * 0.08, a: 0.005, d: 0.3, g: 0.09, out: o }));
      [74, 78, 81, 86].forEach((m) => tone(g.ctx, { freq: mtof(m), t: t + 0.16, a: 0.01, d: 0.5, g: 0.035, out: o }));
    });
  },

  tick(last = false) {
    play('tick', 0.3, (g, t, o) => {
      tone(g.ctx, { freq: last ? 1320 : 990, t, a: 0.002, d: 0.06, g: last ? 0.09 : 0.06, out: o });
      noise(g.ctx, g.noise, { t, a: 0.001, d: 0.012, g: 0.04, filter: { type: 'bandpass', freq: 3000, q: 3 }, out: o });
    });
  },

  roundStart() {
    play('horn', 0.5, (g, t, o) => {
      for (const [m, det] of [
        [50, -6],
        [50, 6],
        [57, 0],
        [62, 3],
      ] as const) {
        tone(g.ctx, {
          type: 'sawtooth',
          freq: mtof(m),
          detune: det,
          t,
          a: 0.22,
          hold: 0.35,
          d: 0.5,
          g: 0.05,
          filter: { type: 'lowpass', freq: 300, to: 1700, q: 1.2 },
          vib: { rate: 5, depth: 8 },
          out: o,
        });
      }
      kickish(g, t, o, 0.6);
    });
  },

  /** whoosh + shimmer; `delay` seconds from now */
  teleport(delay = 0) {
    play(
      'tp',
      0.15,
      (g, t, o) => {
        noise(g.ctx, g.noise, { t, a: 0.12, d: 0.35, g: 0.12, filter: { type: 'bandpass', freq: 350, to: 3200, q: 1.6 }, out: o });
        fm(g.ctx, { freq: 1300 * jitter(), to: 2600, ratio: 1.5, index: 1.5, indexTo: 0.1, t: t + 0.05, a: 0.06, d: 0.35, g: 0.035, out: o });
      },
      delay,
    );
  },

  levelUp() {
    play('level', 0.12, (g, t, o) => {
      [69, 73, 76, 81].forEach((m, i) => {
        tone(g.ctx, { type: 'triangle', freq: mtof(m + 12), t: t + i * 0.055, a: 0.003, d: 0.22, g: 0.08, out: o });
        tone(g.ctx, { freq: mtof(m + 24), t: t + i * 0.055, a: 0.003, d: 0.18, g: 0.03, out: o });
      });
      noise(g.ctx, g.noise, { t: t + 0.15, a: 0.05, d: 0.35, g: 0.05, filter: { type: 'highpass', freq: 7000 }, out: o });
    });
  },

  lordAbility() {
    play('lord', 0.25, (g, t, o) => {
      fm(g.ctx, { freq: 110, to: 220, ratio: 1.5, index: 4, indexTo: 0.5, t, a: 0.15, d: 0.6, g: 0.12, out: o });
      [74, 78, 81].forEach((m, i) => fm(g.ctx, { freq: mtof(m + 12), ratio: 3.5, index: 0.7, indexTo: 0.02, t: t + 0.18 + i * 0.06, d: 0.7, g: 0.04, out: o }));
      noise(g.ctx, g.noise, { t, a: 0.2, d: 0.4, g: 0.07, filter: { type: 'bandpass', freq: 600, to: 4000, q: 1 }, out: o });
    });
  },

  // ---------------------------------------------------------------- battle

  hit(speed = 1) {
    if (!budget('hit', speed >= 4 ? 2 : speed >= 2 ? 4 : 6)) return;
    play('hit', 0.012, (g, t, o) => {
      const p = jitter();
      noise(g.ctx, g.noise, { t, a: 0.002, d: 0.06, g: 0.16, filter: { type: 'lowpass', freq: 1400 * p, to: 300 }, out: o });
      tone(g.ctx, { freq: 150 * p, to: 60, t, a: 0.002, d: 0.08, g: 0.18, out: o });
    });
  },

  crit() {
    if (!budget('crit', 3)) return;
    play('crit', 0.04, (g, t, o) => {
      const p = jitter();
      noise(g.ctx, g.noise, { t, a: 0.001, d: 0.09, g: 0.22, filter: { type: 'highpass', freq: 1800 * p }, out: o });
      tone(g.ctx, { freq: 190 * p, to: 55, t, a: 0.002, d: 0.14, g: 0.3, out: o });
      fm(g.ctx, { freq: 1700 * p, ratio: 3.41, index: 1.2, indexTo: 0.05, t: t + 0.005, d: 0.22, g: 0.05, out: o });
    });
  },

  death() {
    if (!budget('death', 3, 0.2)) return;
    play('death', 0.05, (g, t, o) => {
      tone(g.ctx, { freq: 120 * jitter(), to: 38, t, a: 0.004, d: 0.4, g: 0.35, out: o });
      noise(g.ctx, g.noise, { t, a: 0.004, d: 0.3, g: 0.14, filter: { type: 'lowpass', freq: 700, to: 120 }, out: o });
      tone(g.ctx, { type: 'triangle', freq: 330, to: 160, t: t + 0.03, a: 0.01, d: 0.3, g: 0.04, out: o });
    });
  },

  stun() {
    if (!budget('stun', 2, 0.15)) return;
    play('stun', 0.06, (g, t, o) => {
      tone(g.ctx, { type: 'triangle', freq: 420, to: 260, t, a: 0.002, d: 0.08, g: 0.12, out: o });
      [1800, 2300, 2000].forEach((f, i) => tone(g.ctx, { freq: f * jitter(0.03), t: t + 0.06 + i * 0.06, a: 0.003, d: 0.06, g: 0.025, out: o }));
    });
  },

  proc() {
    if (!budget('proc', 3)) return;
    play('proc', 0.05, (g, t, o) => {
      fm(g.ctx, { freq: 1400 * jitter(), ratio: 2.5, index: 0.9, indexTo: 0.05, t, d: 0.14, g: 0.04, out: o });
    });
  },

  heal() {
    play('heal', 0.3, (g, t, o) => {
      tone(g.ctx, { freq: 660, to: 990, t, a: 0.03, d: 0.25, g: 0.03, out: o });
    });
  },

  stack() {
    play('stack', 0.25, (g, t, o) => {
      tone(g.ctx, { type: 'triangle', freq: 1760, t, a: 0.003, d: 0.12, g: 0.035, out: o });
      tone(g.ctx, { type: 'triangle', freq: 2637, t: t + 0.05, a: 0.003, d: 0.15, g: 0.03, out: o });
    });
  },

  cast(spellId: string, speed = 1) {
    const def = (SPELLS as Partial<Record<string, SpellDef>>)[spellId];
    const el = elementOf(spellId, def);
    const ult = !!def?.ultimate;
    if (!budget('cast', speed >= 4 ? 2 : 4, 0.2) && !ult) return;
    play(`cast:${el}:${ult ? 1 : 0}`, speed >= 4 ? 0.12 : 0.06, (g, t, o) => {
      CASTS[el](g, t, o, ult ? 1.35 : 1);
      if (ult) boom(g, t + 0.04, o, 0.9);
    });
  },

  // ---------------------------------------------------------------- stingers

  victory() {
    play('sting', 1, (g, t, o) => {
      // D major arpeggio up, then a bright chord (Picardy lift out of D minor)
      [62, 66, 69, 74].forEach((m, i) => tone(g.ctx, { type: 'triangle', freq: mtof(m + 12), t: t + i * 0.09, a: 0.004, d: 0.3, g: 0.09, out: o }));
      [74, 78, 81, 86].forEach((m) => {
        tone(g.ctx, { type: 'sawtooth', freq: mtof(m), t: t + 0.36, a: 0.03, hold: 0.35, d: 0.8, g: 0.025, filter: { type: 'lowpass', freq: 2400, to: 900 }, out: o });
        tone(g.ctx, { type: 'triangle', freq: mtof(m), t: t + 0.36, a: 0.01, hold: 0.3, d: 0.9, g: 0.05, out: o });
      });
      kickish(g, t + 0.36, o, 0.5);
      noise(g.ctx, g.noise, { t: t + 0.36, a: 0.05, d: 0.9, g: 0.05, filter: { type: 'highpass', freq: 6500 }, out: o });
    });
  },

  defeat() {
    play('sting', 1, (g, t, o) => {
      [74, 72, 69, 65].forEach((m, i) => tone(g.ctx, { type: 'triangle', freq: mtof(m), t: t + i * 0.14, a: 0.006, d: 0.3, g: 0.08, out: o }));
      [50, 53, 57].forEach((m) =>
        tone(g.ctx, { type: 'sawtooth', freq: mtof(m), t: t + 0.56, a: 0.06, hold: 0.3, d: 0.9, g: 0.03, filter: { type: 'lowpass', freq: 900, to: 300 }, out: o }),
      );
      tone(g.ctx, { freq: mtof(38), t: t + 0.56, a: 0.02, hold: 0.2, d: 0.9, g: 0.2, out: o });
    });
  },

  draw() {
    play('sting', 1, (g, t, o) => {
      [69, 74].forEach((m, i) => tone(g.ctx, { type: 'triangle', freq: mtof(m), t: t + i * 0.16, a: 0.006, d: 0.45, g: 0.08, out: o }));
      [62, 69].forEach((m) => tone(g.ctx, { freq: mtof(m), t: t + 0.32, a: 0.05, d: 0.8, g: 0.04, out: o }));
    });
  },

  gameOver(won: boolean) {
    play('gameover', 2, (g, t, o) => {
      const seq = won ? [62, 66, 69, 74, 78, 81, 86] : [74, 72, 69, 67, 65, 62];
      seq.forEach((m, i) => tone(g.ctx, { type: 'triangle', freq: mtof(m + (won ? 12 : 0)), t: t + i * 0.1, a: 0.005, d: 0.35, g: 0.08, out: o }));
      const end = t + seq.length * 0.1;
      const chord = won ? [62, 66, 69, 74, 78] : [50, 53, 57, 62];
      chord.forEach((m) =>
        tone(g.ctx, { type: 'sawtooth', freq: mtof(m), t: end, a: 0.08, hold: 0.8, d: 1.4, g: 0.022, filter: { type: 'lowpass', freq: won ? 2200 : 900, to: 500 }, vib: { rate: 4.5, depth: 6 }, out: o }),
      );
      boom(g, end, o, won ? 0.6 : 0.8);
    });
  },
};

function kickish(g: Graph, t: number, o: AudioNode, v: number) {
  tone(g.ctx, { freq: 130, to: 45, glide: 0.12, t, a: 0.003, d: 0.3, g: 0.5 * v, out: o });
}

// ---------------------------------------------------------------- spell elements

export type Element = 'fire' | 'frost' | 'lightning' | 'arcane' | 'nature' | 'holy' | 'physical' | 'wind';

const RULES: [Element, RegExp][] = [
  ['wind', /gust|wind|powershot|shackle|multishot|split shot|strafe|focus fire|take aim|marksman/],
  ['frost', /frost|freez|\bice\b|crystal|cold|blizzard|snow|dual breath/],
  ['lightning', /thunder|lightning|arc |static|laser|matrix|storm|zap|volt|spark/],
  ['fire', /fire|flame|laguna|macropyre|dragon slave|light strike|heat|tar bomb|burn|\bember|elder dragon|lava|inferno|solar|\bsun\b|blaze|liquid/],
  ['nature', /\brot\b|poison|snake|toxic|venom|gaze|juju|\bward|nature|plague|acid|corrosive|bramble|swamp/],
  ['holy', /purif|heal|grave|guardian|holy|bless|repel|light|aura|wisdom|moon|lunar|eclipse/],
  ['arcane', /black hole|silence|curse|malefice|pact|shadow|void|midnight|time|last word|essence|phantom|blink|blur|dispersion|desolate|spectral|haunt|calling|veil|dark|smoke|cloak|tricks|mana|rearm|demonic|hex|song|siren|illusion|astral|rubick|telekin|spell/],
  ['physical', /./],
];

const elCache = new Map<string, Element>();

function hueOf(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

function byHue(color: string): Element {
  const c = hueOf(color);
  if (!c || c.s < 0.2) return 'wind';
  const { h, l } = c;
  if (h < 12 || h >= 340) return 'physical';
  if (h < 45) return 'fire';
  if (h < 62) return 'holy';
  if (h < 170) return 'nature';
  if (h < 215) return l > 0.75 ? 'frost' : 'lightning';
  if (h < 250) return 'lightning';
  return 'arcane';
}

/** pick a sound family from the spell's name, falling back to its VFX colour */
export function elementOf(spellId: string, def?: SpellDef): Element {
  const hit = elCache.get(spellId);
  if (hit) return hit;
  let el: Element;
  const name = `${def?.name ?? ''} ${spellId.replace(/_/g, ' ')}`.toLowerCase();
  const rule = RULES.find(([, re]) => re.test(name));
  if (rule && rule[0] !== 'physical') el = rule[0];
  else if (def && /helix|blade|slash|culling|hook|dismember|swipe|coup|enrage|overpower|berserk|pounce|strike|dagger|earthshock|tail|assassinate|sleight|shot|blood|charge|gunslinger|grip|cleave|bash/.test(name)) el = 'physical';
  else el = def ? byHue(def.vfx.color) : 'arcane';
  elCache.set(spellId, el);
  return el;
}

type CastFn = (g: Graph, t: number, o: AudioNode, v: number) => void;

const CASTS: Record<Element, CastFn> = {
  fire(g, t, o, v) {
    const len = 0.45 * v;
    noise(g.ctx, g.noise, { t, a: 0.04, hold: len * 0.3, d: len, g: 0.2 * v, filter: { type: 'bandpass', freq: 380, to: 1900, q: 0.9 }, out: o });
    noise(g.ctx, g.noise, { t: t + 0.05, a: 0.01, d: len * 0.8, g: 0.08 * v, filter: { type: 'highpass', freq: 3000 }, rate: 0.5, out: o });
    tone(g.ctx, { freq: 90, to: 60, t, a: 0.03, d: len, g: 0.16 * v, out: o });
  },
  frost(g, t, o, v) {
    [1760, 2349, 3136].forEach((f, i) =>
      fm(g.ctx, { freq: f * jitter(0.02), ratio: 1.41, index: 0.6, indexTo: 0.02, t: t + i * 0.035, a: 0.003, d: 0.45 * v, g: 0.035 * v, out: o }),
    );
    noise(g.ctx, g.noise, { t, a: 0.02, d: 0.4 * v, g: 0.08 * v, filter: { type: 'highpass', freq: 5000, to: 9000 }, out: o });
    noise(g.ctx, g.noise, { t, a: 0.002, d: 0.08, g: 0.12 * v, filter: { type: 'bandpass', freq: 1800, q: 3 }, out: o });
  },
  lightning(g, t, o, v) {
    const osc = g.ctx.createOscillator();
    const env = g.ctx.createGain();
    const f = g.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1400;
    f.Q.value = 0.8;
    osc.type = 'sawtooth';
    const len = 0.28 * v;
    for (let i = 0; i < 10; i++) osc.frequency.setValueAtTime(70 + Math.random() * 340, t + (i * len) / 10);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(0.09 * v, t + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, t + len);
    osc.connect(f);
    f.connect(env);
    env.connect(o);
    osc.start(t);
    osc.stop(t + len + 0.05);
    noise(g.ctx, g.noise, { t, a: 0.001, d: 0.12, g: 0.22 * v, filter: { type: 'highpass', freq: 2500 }, out: o });
  },
  arcane(g, t, o, v) {
    fm(g.ctx, { freq: 620 * jitter(), to: 210, ratio: 1.5, index: 3, indexTo: 0.3, t, a: 0.05, d: 0.45 * v, g: 0.08 * v, out: o });
    tone(g.ctx, { type: 'triangle', freq: 300, to: 600, t, a: 0.15, d: 0.2 * v, g: 0.04 * v, vib: { rate: 9, depth: 40 }, out: o });
  },
  nature(g, t, o, v) {
    for (let i = 0; i < 5; i++) {
      const f = 280 + Math.random() * 420;
      tone(g.ctx, { freq: f, to: f * 1.8, t: t + i * 0.045 + Math.random() * 0.02, a: 0.004, d: 0.07, g: 0.06 * v, out: o });
    }
    noise(g.ctx, g.noise, { t, a: 0.05, d: 0.35 * v, g: 0.06 * v, filter: { type: 'lowpass', freq: 900, to: 400 }, out: o });
  },
  holy(g, t, o, v) {
    [74, 78, 81, 86].forEach((m, i) => tone(g.ctx, { freq: mtof(m + 12), t: t + i * 0.025, a: 0.04, d: 0.6 * v, g: 0.03 * v, vib: { rate: 6, depth: 6 }, out: o }));
    noise(g.ctx, g.noise, { t, a: 0.1, d: 0.4 * v, g: 0.05 * v, filter: { type: 'highpass', freq: 7000 }, out: o });
  },
  physical(g, t, o, v) {
    noise(g.ctx, g.noise, { t, a: 0.01, d: 0.16 * v, g: 0.2 * v, filter: { type: 'bandpass', freq: 3200, to: 700, q: 1.3 }, out: o });
    fm(g.ctx, { freq: 1250 * jitter(), ratio: 3.5, index: 1, indexTo: 0.05, t: t + 0.06, d: 0.25 * v, g: 0.04 * v, out: o });
    tone(g.ctx, { freq: 160, to: 70, t: t + 0.06, a: 0.002, d: 0.12, g: 0.15 * v, out: o });
  },
  wind(g, t, o, v) {
    noise(g.ctx, g.noise, { t, a: 0.12, hold: 0.05, d: 0.4 * v, g: 0.14 * v, filter: { type: 'bandpass', freq: 500, to: 2200, q: 2.2 }, out: o });
    tone(g.ctx, { freq: 900, to: 1500, t: t + 0.05, a: 0.05, d: 0.2, g: 0.015 * v, out: o });
  },
};

// ---------------------------------------------------------------- battle playback hook

/** sounds for the events the battle playback just crossed (thinned out at fast playback speeds) */
export function battleEvents(events: readonly BattleEvent[], speed = 1) {
  if (!events.length || !out()) return;
  for (const ev of events) {
    switch (ev.kind) {
      case 'damage':
        if (ev.crit) sfx.crit();
        else if (ev.src && ev.dmgType === 'physical') sfx.hit(speed);
        break;
      case 'cast':
        sfx.cast(ev.spellId, speed);
        break;
      case 'proc':
        if (speed < 4) sfx.proc();
        break;
      case 'status':
        if (ev.status === 'stunned') sfx.stun();
        break;
      case 'death':
        sfx.death();
        break;
      case 'heal':
        if (speed < 2 && ev.amount > 40) sfx.heal();
        break;
      case 'stack':
        if (speed < 4) sfx.stack();
        break;
      default:
        break;
    }
  }
}
