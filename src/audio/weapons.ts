// Per-hero basic-attack sounds, keyed by the attacker's heroId: a "release" voice when the attack fires
// (sword swing, bow twang, gun crack, magic launch) and an "impact" voice when its damage lands
// (metal ring, meaty thud, arrow thunk...). Pure synthesis; gating/throttling lives in sfx.ts.
import type { Graph } from './engine.ts';
import { fm, noise, tone } from './synth.ts';
import type { FilterOpts } from './synth.ts';

export type Weapon = 'sword' | 'axe' | 'claw' | 'dagger' | 'glaive' | 'bow' | 'gun' | 'fire' | 'zap' | 'ice' | 'void' | 'laser' | 'shadow' | 'breath';

const HERO_WEAPON: Record<string, Weapon> = {
  juggernaut: 'sword',
  dragon_knight: 'sword',
  phantom_assassin: 'sword',
  spectre: 'sword',
  pudge: 'axe',
  axe: 'axe',
  ursa: 'claw',
  slark: 'dagger',
  riki: 'dagger',
  silencer: 'glaive',
  drow_ranger: 'bow',
  medusa: 'bow',
  windranger: 'bow',
  clinkz: 'bow',
  sniper: 'gun',
  muerta: 'gun',
  lina: 'fire',
  zeus: 'zap',
  crystal_maiden: 'ice',
  enigma: 'void',
  tinker: 'laser',
  dazzle: 'shadow',
  jakiro: 'breath',
};

export const weaponOf = (heroId: string | undefined): Weapon => (heroId && HERO_WEAPON[heroId]) || 'sword';

/** ±6% */
const j = () => 1 + (Math.random() * 2 - 1) * 0.06;

type V = (g: Graph, t: number, o: AudioNode, v: number, heroId: string) => void;

function swoosh(g: Graph, t: number, o: AudioNode, from: number, to: number, d: number, gain: number, q = 1.4) {
  noise(g.ctx, g.noise, { t, a: d * 0.35, d: d * 0.65, g: gain, filter: { type: 'bandpass', freq: from, to, q }, out: o });
}

function crackle(g: Graph, t: number, o: AudioNode, n: number, gain: number) {
  for (let i = 0; i < n; i++)
    noise(g.ctx, g.noise, { t: t + Math.random() * 0.18, a: 0.001, d: 0.012, g: gain, filter: { type: 'bandpass', freq: 2500 + Math.random() * 3000, q: 4 }, out: o });
}

function thud(g: Graph, t: number, o: AudioNode, f: number, gain: number, d = 0.1) {
  tone(g.ctx, { freq: f * j(), to: f * 0.4, t, a: 0.002, d, g: gain, out: o });
}

/** detuned inharmonic partials: steel ringing */
function ring(g: Graph, t: number, o: AudioNode, base: number, gain: number, d: number) {
  const p = j();
  for (const [r, k] of [
    [1, 1],
    [1.34, 0.7],
    [1.79, 0.5],
    [2.41, 0.35],
  ] as const) {
    tone(g.ctx, { freq: base * r * p, detune: (Math.random() - 0.5) * 30, t, a: 0.001, d: d * (1.1 - r * 0.15), g: gain * k, out: o });
  }
}

function fireWhoosh(g: Graph, t: number, o: AudioNode, v: number) {
  noise(g.ctx, g.noise, { t, a: 0.04, d: 0.18, g: 0.12 * v, filter: { type: 'bandpass', freq: 500 * j(), to: 1700, q: 1 }, out: o });
  crackle(g, t, o, 3, 0.05 * v);
}

function iceTinkle(g: Graph, t: number, o: AudioNode, v: number, n = 3) {
  for (let i = 0; i < n; i++)
    fm(g.ctx, { freq: (2600 + Math.random() * 1600) * j(), ratio: 1.41, index: 0.5, indexTo: 0.02, t: t + i * 0.03, d: 0.16, g: 0.022 * v, out: o });
}

function zap(g: Graph, t: number, o: AudioNode, v: number, len = 0.12) {
  const osc = g.ctx.createOscillator();
  const env = g.ctx.createGain();
  const f = g.ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1800;
  f.Q.value = 0.9;
  osc.type = 'sawtooth';
  for (let i = 0; i < 6; i++) osc.frequency.setValueAtTime(90 + Math.random() * 500, t + (i * len) / 6);
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(0.06 * v, t + 0.003);
  env.gain.exponentialRampToValueAtTime(0.0001, t + len);
  osc.connect(f);
  f.connect(env);
  env.connect(o);
  osc.start(t);
  osc.stop(t + len + 0.05);
  noise(g.ctx, g.noise, { t, a: 0.001, d: 0.05, g: 0.08 * v, filter: { type: 'highpass', freq: 3500 }, out: o });
}

const hp = (freq: number): FilterOpts => ({ type: 'highpass', freq });

// ---------------------------------------------------------------- release (attack fires)

const RELEASE: Record<Weapon, V> = {
  sword(g, t, o, v) {
    swoosh(g, t, o, 5200 * j(), 1400, 0.11, 0.14 * v, 1.6);
  },
  axe(g, t, o, v) {
    swoosh(g, t, o, 700 * j(), 180, 0.2, 0.2 * v, 1.1);
  },
  claw(g, t, o, v) {
    for (let i = 0; i < 3; i++)
      noise(g.ctx, g.noise, { t: t + i * 0.045 * j(), a: 0.004, d: 0.04, g: 0.1 * v, filter: { type: 'bandpass', freq: (2600 + i * 500) * j(), to: 1400, q: 2.2 }, out: o });
  },
  dagger(g, t, o, v) {
    swoosh(g, t, o, 6500 * j(), 2500, 0.06, 0.1 * v, 2);
  },
  glaive(g, t, o, v) {
    // spinning whirr: a buzzy tone with a fast wobble, plus air
    tone(g.ctx, { type: 'triangle', freq: 420 * j(), to: 560, t, a: 0.02, d: 0.2, g: 0.045 * v, vib: { rate: 28, depth: 180 }, out: o });
    swoosh(g, t, o, 1800, 3200, 0.2, 0.06 * v, 3);
  },
  bow(g, t, o, v, heroId) {
    // string twang, then the arrow's airy whoosh
    const f = 196 * j();
    tone(g.ctx, { type: 'triangle', freq: f * 1.15, to: f, glide: 0.03, t, a: 0.001, d: 0.14, g: 0.11 * v, out: o });
    fm(g.ctx, { freq: f * 2, ratio: 1.5, index: 1.2, indexTo: 0.05, t, a: 0.001, d: 0.08, g: 0.03 * v, out: o });
    swoosh(g, t + 0.02, o, 3200 * j(), 1800, 0.16, 0.06 * v, 2.5);
    if (heroId === 'clinkz') crackle(g, t + 0.02, o, 4, 0.05 * v);
  },
  gun(g, t, o, v, heroId) {
    // sharp crack + a short slap-back echo
    noise(g.ctx, g.noise, { t, a: 0.0008, d: 0.045, g: 0.3 * v, filter: hp(1300), out: o });
    tone(g.ctx, { freq: 150 * j(), to: 48, t, a: 0.001, d: 0.08, g: 0.24 * v, out: o });
    noise(g.ctx, g.noise, { t: t + 0.085, a: 0.004, d: 0.16, g: 0.07 * v, filter: { type: 'lowpass', freq: 1700, to: 600 }, out: o });
    noise(g.ctx, g.noise, { t: t + 0.17, a: 0.004, d: 0.12, g: 0.03 * v, filter: { type: 'lowpass', freq: 1200, to: 500 }, out: o });
    if (heroId === 'muerta')
      fm(g.ctx, { freq: 620 * j(), to: 310, ratio: 1.5, index: 2, indexTo: 0.2, t: t + 0.02, a: 0.03, d: 0.35, g: 0.04 * v, out: o });
  },
  fire(g, t, o, v) {
    fireWhoosh(g, t, o, v);
  },
  zap(g, t, o, v) {
    zap(g, t, o, v);
  },
  ice(g, t, o, v) {
    iceTinkle(g, t, o, v, 2);
    swoosh(g, t, o, 4000, 7000, 0.12, 0.03 * v, 2);
  },
  void(g, t, o, v) {
    fm(g.ctx, { freq: 70 * j(), ratio: 1.5, index: 3, indexTo: 0.4, t, a: 0.04, d: 0.25, g: 0.12 * v, out: o });
  },
  laser(g, t, o, v) {
    tone(g.ctx, { type: 'square', freq: 1900 * j(), to: 320, glide: 0.12, t, a: 0.002, d: 0.13, g: 0.035 * v, filter: { type: 'lowpass', freq: 4000 }, out: o });
  },
  shadow(g, t, o, v) {
    fm(g.ctx, { freq: 380 * j(), to: 190, ratio: 1.5, index: 2.2, indexTo: 0.2, t, a: 0.02, d: 0.2, g: 0.06 * v, out: o });
  },
  breath(g, t, o, v) {
    if (Math.random() < 0.5) fireWhoosh(g, t, o, v);
    else {
      iceTinkle(g, t, o, v, 2);
      swoosh(g, t, o, 900, 2600, 0.16, 0.08 * v, 1.2);
    }
  },
};

// ---------------------------------------------------------------- impact (damage lands)

const IMPACT: Record<Weapon, V> = {
  sword(g, t, o, v) {
    thud(g, t, o, 170, 0.14 * v, 0.07);
    ring(g, t, o, 2350, 0.022 * v, 0.16);
    noise(g.ctx, g.noise, { t, a: 0.001, d: 0.03, g: 0.08 * v, filter: hp(3000), out: o });
  },
  axe(g, t, o, v) {
    thud(g, t, o, 120, 0.3 * v, 0.14);
    noise(g.ctx, g.noise, { t, a: 0.001, d: 0.08, g: 0.16 * v, filter: { type: 'lowpass', freq: 1600 * j(), to: 300 }, out: o });
    noise(g.ctx, g.noise, { t: t + 0.01, a: 0.001, d: 0.05, g: 0.08 * v, filter: { type: 'bandpass', freq: 900, q: 2 }, rate: 0.6, out: o });
  },
  claw(g, t, o, v) {
    thud(g, t, o, 140, 0.16 * v, 0.08);
    noise(g.ctx, g.noise, { t, a: 0.002, d: 0.06, g: 0.09 * v, filter: { type: 'bandpass', freq: 1800, q: 1.5 }, out: o });
  },
  dagger(g, t, o, v) {
    noise(g.ctx, g.noise, { t, a: 0.001, d: 0.035, g: 0.1 * v, filter: hp(2200), out: o });
    thud(g, t, o, 200, 0.1 * v, 0.05);
  },
  glaive(g, t, o, v) {
    fm(g.ctx, { freq: 1760 * j(), ratio: 2.76, index: 0.9, indexTo: 0.03, t, d: 0.25, g: 0.04 * v, out: o });
    thud(g, t, o, 160, 0.08 * v, 0.05);
  },
  bow(g, t, o, v, heroId) {
    // thunk / thwack
    thud(g, t, o, 320, 0.15 * v, 0.05);
    noise(g.ctx, g.noise, { t, a: 0.001, d: 0.04, g: 0.1 * v, filter: { type: 'bandpass', freq: 1300 * j(), q: 1.8 }, out: o });
    if (heroId === 'clinkz') crackle(g, t, o, 3, 0.04 * v);
  },
  gun(g, t, o, v, heroId) {
    noise(g.ctx, g.noise, { t, a: 0.001, d: 0.03, g: 0.1 * v, filter: { type: 'bandpass', freq: 2200, q: 1.4 }, out: o });
    thud(g, t, o, 180, 0.12 * v, 0.06);
    if (heroId === 'muerta') tone(g.ctx, { freq: 900, to: 450, t, a: 0.01, d: 0.18, g: 0.02 * v, vib: { rate: 7, depth: 30 }, out: o });
  },
  fire(g, t, o, v) {
    noise(g.ctx, g.noise, { t, a: 0.003, d: 0.12, g: 0.13 * v, filter: { type: 'lowpass', freq: 1400, to: 300 }, out: o });
    crackle(g, t, o, 3, 0.05 * v);
  },
  zap(g, t, o, v) {
    zap(g, t, o, v * 0.8, 0.08);
  },
  ice(g, t, o, v) {
    noise(g.ctx, g.noise, { t, a: 0.001, d: 0.05, g: 0.08 * v, filter: { type: 'bandpass', freq: 3800, q: 2 }, out: o });
    iceTinkle(g, t, o, v, 2);
  },
  void(g, t, o, v) {
    tone(g.ctx, { freq: 110 * j(), to: 55, t, a: 0.004, d: 0.12, g: 0.15 * v, out: o });
  },
  laser(g, t, o, v) {
    noise(g.ctx, g.noise, { t, a: 0.002, d: 0.06, g: 0.07 * v, filter: { type: 'bandpass', freq: 4500, q: 3 }, out: o });
    thud(g, t, o, 200, 0.07 * v, 0.04);
  },
  shadow(g, t, o, v) {
    tone(g.ctx, { freq: 240 * j(), to: 120, t, a: 0.003, d: 0.1, g: 0.09 * v, out: o });
  },
  breath(g, t, o, v) {
    noise(g.ctx, g.noise, { t, a: 0.003, d: 0.1, g: 0.1 * v, filter: { type: 'lowpass', freq: 1800, to: 400 }, out: o });
  },
};

export function attackRelease(g: Graph, t: number, o: AudioNode, heroId: string, v = 1) {
  RELEASE[weaponOf(heroId)](g, t, o, v, heroId);
}

export function attackImpact(g: Graph, t: number, o: AudioNode, heroId: string, v = 1) {
  IMPACT[weaponOf(heroId)](g, t, o, v, heroId);
}
