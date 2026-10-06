// Tiny synth voices shared by the music and the effects: enveloped oscillators, filtered noise, 2-op FM.
// Every voice ramps from/to ~0 so nothing clicks, and stops itself (finished nodes are garbage collected).

export interface FilterOpts {
  type: BiquadFilterType;
  freq: number;
  to?: number; // exponential sweep target over the voice length
  q?: number;
}

export interface ToneOpts {
  freq: number;
  to?: number; // pitch glide target (exponential)
  glide?: number; // glide time (default: whole voice)
  type?: OscillatorType;
  t: number; // start time (ctx seconds)
  a?: number; // attack
  hold?: number; // time at peak before the decay
  d: number; // decay to silence
  g: number; // peak gain
  detune?: number; // cents
  filter?: FilterOpts;
  vib?: { rate: number; depth: number }; // vibrato (Hz, cents)
  pan?: number;
  out: AudioNode;
}

const EPS = 0.0001;

function envelope(ctx: BaseAudioContext, t: number, a: number, hold: number, d: number, g: number): GainNode {
  const env = ctx.createGain();
  const p = env.gain;
  p.setValueAtTime(EPS, t);
  p.linearRampToValueAtTime(Math.max(EPS, g), t + a);
  if (hold > 0) p.setValueAtTime(Math.max(EPS, g), t + a + hold);
  p.exponentialRampToValueAtTime(EPS, t + a + hold + d);
  return env;
}

function chain(ctx: BaseAudioContext, src: AudioNode, env: GainNode, o: { filter?: FilterOpts; pan?: number; out: AudioNode }, t: number, len: number) {
  let node: AudioNode = src;
  if (o.filter) {
    const f = ctx.createBiquadFilter();
    f.type = o.filter.type;
    f.frequency.setValueAtTime(o.filter.freq, t);
    if (o.filter.to) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.filter.to), t + len);
    if (o.filter.q !== undefined) f.Q.value = o.filter.q;
    node.connect(f);
    node = f;
  }
  node.connect(env);
  if (o.pan && typeof (ctx as AudioContext).createStereoPanner === 'function') {
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, o.pan));
    env.connect(p);
    p.connect(o.out);
  } else env.connect(o.out);
}

export function tone(ctx: BaseAudioContext, o: ToneOpts) {
  const a = o.a ?? 0.005;
  const hold = o.hold ?? 0;
  const len = a + hold + o.d;
  const osc = ctx.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, o.t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), o.t + (o.glide ?? len));
  if (o.detune) osc.detune.value = o.detune;
  if (o.vib) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = o.vib.rate;
    depth.gain.value = o.vib.depth;
    lfo.connect(depth);
    depth.connect(osc.detune);
    lfo.start(o.t);
    lfo.stop(o.t + len + 0.05);
  }
  chain(ctx, osc, envelope(ctx, o.t, a, hold, o.d, o.g), o, o.t, len);
  osc.start(o.t);
  osc.stop(o.t + len + 0.05);
}

export interface NoiseOpts {
  t: number;
  a?: number;
  hold?: number;
  d: number;
  g: number;
  filter?: FilterOpts;
  rate?: number; // playback rate (pitch of the noise)
  pan?: number;
  out: AudioNode;
}

export function noise(ctx: BaseAudioContext, buf: AudioBuffer, o: NoiseOpts) {
  const a = o.a ?? 0.002;
  const hold = o.hold ?? 0;
  const len = a + hold + o.d;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  if (o.rate) src.playbackRate.value = o.rate;
  chain(ctx, src, envelope(ctx, o.t, a, hold, o.d, o.g), o, o.t, len);
  // random offset so repeated hits don't sound identical
  src.start(o.t, Math.random() * Math.max(0, buf.duration - 0.1));
  src.stop(o.t + len + 0.05);
}

export interface FmOpts {
  freq: number;
  to?: number;
  ratio: number; // modulator = carrier * ratio
  index: number; // modulation depth in multiples of the modulator frequency
  indexTo?: number;
  t: number;
  a?: number;
  hold?: number;
  d: number;
  g: number;
  type?: OscillatorType;
  filter?: FilterOpts;
  pan?: number;
  out: AudioNode;
}

/** 2-operator FM: bells, metal, wobbly arcane tones */
export function fm(ctx: BaseAudioContext, o: FmOpts) {
  const a = o.a ?? 0.004;
  const hold = o.hold ?? 0;
  const len = a + hold + o.d;
  const car = ctx.createOscillator();
  const mod = ctx.createOscillator();
  const depth = ctx.createGain();
  car.type = o.type ?? 'sine';
  car.frequency.setValueAtTime(o.freq, o.t);
  mod.frequency.setValueAtTime(o.freq * o.ratio, o.t);
  if (o.to) {
    car.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), o.t + len);
    mod.frequency.exponentialRampToValueAtTime(Math.max(1, o.to * o.ratio), o.t + len);
  }
  const dep = o.freq * o.ratio * o.index;
  depth.gain.setValueAtTime(dep, o.t);
  if (o.indexTo !== undefined) depth.gain.exponentialRampToValueAtTime(Math.max(0.01, o.freq * o.ratio * o.indexTo), o.t + len);
  mod.connect(depth);
  depth.connect(car.frequency);
  chain(ctx, car, envelope(ctx, o.t, a, hold, o.d, o.g), o, o.t, len);
  mod.start(o.t);
  car.start(o.t);
  mod.stop(o.t + len + 0.05);
  car.stop(o.t + len + 0.05);
}

export const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
