import type { ReactNode } from 'react';
import type { HeroArt } from '../types.ts';
import { Glow, HeroFrame, Limb, OUT, Rot, Swoosh, bump, f, hitFlash, lerp, lunge, motion, ol, seg, smooth, swing, trailAlpha } from './parts1.tsx';

const SKIN = '#2c3a5c';
const SKIN_HI = '#4a5f8c';
const SKIN_SH = '#18203a';
const BELLY = '#6f86a8';
const FIN = '#5d78c4';
const FIN_SH = '#384c8a';
const EYE = '#d8ff4a';
const WRAP = '#8a6f4e';
const WRAP_SH = '#5f4a33';
const BLADE = '#d6dde8';
const MOTE = '#7dff6a';

function Leg(p: { x: number; y: number; a: number; fill: string }) {
  return (
    <Rot x={p.x} y={p.y} a={p.a - 28}>
      <Limb len={12} w0={8} w1={6.5} fill={p.fill} />
      <Rot x={0} y={12} a={58 - Math.max(0, p.a) * 0.6}>
        <Limb len={12} w0={6.5} w1={5} fill={p.fill} />
        <Rot x={0} y={12} a={-30}>
          <path d="M-2,-1 L9,1 L11,3 L8,3.6 L10,5 L-2,3.5Z" fill={p.fill} {...ol} strokeWidth={1.2} />
        </Rot>
      </Rot>
    </Rot>
  );
}

function Dagger() {
  return (
    <g>
      <rect x={-1.4} y={-3} width={2.8} height={6} rx={1} fill={WRAP_SH} {...ol} strokeWidth={1.1} />
      <path d="M-3.5,3 L3.5,3" stroke={OUT} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M-3.5,3 L3.5,3" stroke="#b9a15a" strokeWidth={1.2} strokeLinecap="round" />
      <path d="M-1.8,4 L1.8,4 C3.5,9 4.5,14 2.5,21 C1,16 -1,11 -1.8,4Z" fill={BLADE} {...ol} strokeWidth={1.2} />
      <path d="M0.8,5 C2,10 2.6,14 2.3,18" stroke="#fff" strokeWidth={0.8} fill="none" />
    </g>
  );
}

export const Slark: HeroArt = ({ anim, t, dur, team }) => {
  const m = motion(anim, t, dur, 1.2, 0.5);
  const k = m.atk;
  const c = m.cast;
  const breathe = anim === 'idle' ? Math.sin(m.ph) : 0;

  let frontA = -30 + m.sway * (m.walking ? -18 : 4);
  let backA = 15 + m.sway * (m.walking ? 20 : -4);
  let lean = 24 + m.lean * 1.2;
  let dx = 0;
  let crouch = 0;
  let headTilt = breathe * 2;
  let shadow = 0;
  if (anim === 'attack') {
    frontA = swing(k, -30, 55, -98);
    backA = swing(k, 15, -20, 50);
    lean = 24 + swing(k, 0, -6, 12);
    dx = lunge(k, 9);
    crouch = bump(seg(k, 0.2, 0.6)) * 3;
  } else if (anim === 'cast') {
    const up = smooth(seg(c, 0, 0.3));
    const end = 1 - seg(c, 0.85, 1);
    shadow = Math.min(1, c * 2.5) * end;
    crouch = 6 * up * end;
    frontA = lerp(-30, -130, up * end) + Math.sin(t * 14) * 10 * shadow;
    backA = lerp(15, 120, up * end) - Math.sin(t * 14) * 10 * shadow;
    lean = lerp(24, 10, up * end);
  } else if (anim === 'hurt') {
    frontA = 25 + m.sway * 8;
    backA = 40 - m.sway * 8;
    headTilt = 14;
    lean = 6;
  } else if (anim === 'dead') {
    frontA = lerp(-30, -140, smooth(t / 0.6));
    backA = lerp(15, -110, smooth(t / 0.6));
  }
  const by = m.bob + crouch;
  const finWave = Math.sin(m.ph * 1.0) * 3;

  // shadow dance smoke & motes
  const smoke: ReactNode[] = [];
  if (shadow > 0) {
    for (let i = 0; i < 7; i++) {
      const a = t * 3 + i * 0.9;
      smoke.push(
        <ellipse key={`s${i}`} cx={f(Math.cos(a) * 20)} cy={f(-34 + Math.sin(a * 1.3) * 18)} rx={f(12 + Math.sin(a * 2) * 3)} ry={f(9 + Math.cos(a) * 2)} fill="#05070f" opacity={f(0.5 * shadow)} />,
      );
    }
  }
  const motes: ReactNode[] = [];
  if (shadow > 0) {
    for (let i = 0; i < 7; i++) {
      const q = (t * 1.3 + i * 0.37) % 1;
      const x = Math.sin(i * 2.7 + t * 2) * 22;
      motes.push(<Glow key={`m${i}`} x={x} y={-6 - q * 70} r={1.3 + (i % 2) * 0.6} color={MOTE} opacity={f(shadow * (1 - q) * 0.95)} />);
    }
  }

  return (
    <HeroFrame anim={anim} t={t} team={team} headY={-74} width={20}>
      {smoke}
      <g transform={`translate(${f(dx)},0)`} opacity={f(1 - shadow * 0.45)}>
        <Leg x={-5} y={-22 + by} a={m.legA} fill={SKIN_SH} />
        <g transform={`translate(0,${f(by)}) rotate(${f(lean)},0,-22)`}>
          {/* back arm */}
          <Rot x={-1} y={-49} a={backA}>
            <Limb len={23} w0={7} w1={5.5} fill={SKIN_SH} />
            <rect x={-3.5} y={14} width={7} height={5} rx={1} fill={WRAP_SH} {...ol} strokeWidth={1.1} />
            <circle cx={0} cy={23.5} r={3.6} fill={SKIN_SH} {...ol} />
          </Rot>
          {/* dorsal fin along the back */}
          <path d={`M-9,-34 C${f(-18 + finWave)},-40 ${f(-18 + finWave)},-52 ${f(-12 + finWave * 0.5)},-58 L-7,-52 L-4,-56 C-4,-48 -6,-40 -9,-34Z`} fill={FIN} {...ol} />
          <path d={`M-10,-38 L${f(-15 + finWave * 0.8)},-46 M-8,-44 L${f(-12 + finWave * 0.6)},-54`} stroke={FIN_SH} strokeWidth={1.1} />
          {/* torso */}
          <path d="M-8,-22 C-12,-32 -11,-46 -2,-53 C6,-58 15,-54 15,-46 C15,-38 9,-29 6,-22Z" fill={SKIN} {...ol} />
          <path d="M-8,-22 C-12,-32 -11,-46 -2,-53 C-4,-46 -4,-32 -1,-22Z" fill={SKIN_SH} />
          <path d="M8,-50 C13,-46 12,-36 6,-26 L3,-27 C7,-34 9,-42 8,-50Z" fill={BELLY} opacity={0.85} />
          <path d="M6,-44 L11,-43 M5,-38 L10,-37 M4,-32 L8,-31" stroke={SKIN_SH} strokeWidth={0.9} />
          {/* belt wraps + strap */}
          <path d="M-9,-25 L7,-25 L6,-19 L-9,-19Z" fill={WRAP} {...ol} />
          <path d="M-2,-19 L-4,-10 L1,-12 L3,-19Z" fill={WRAP_SH} {...ol} strokeWidth={1.1} />
          <path d="M-6,-52 C0,-44 6,-34 7,-25" fill="none" stroke={OUT} strokeWidth={4} />
          <path d="M-6,-52 C0,-44 6,-34 7,-25" fill="none" stroke={WRAP} strokeWidth={2.4} />
          <circle cx={3} cy={-38} r={1.6} fill="#c9a94a" stroke={OUT} strokeWidth={0.8} />
          {/* head */}
          <g transform={`translate(10,-57) rotate(${f(headTilt - lean * 0.6)}) scale(1.12)`}>
            <path d={`M-6,-7 L${f(-12 + finWave)},-19 L-4,-13 L${f(-5 + finWave * 0.6)},-24 L1,-13 L${f(4 + finWave * 0.4)},-21 L6,-11Z`} fill={FIN} {...ol} />
            <path d={`M-5,-12 L${f(-9 + finWave)},-17 M0,-14 L${f(-3 + finWave * 0.6)},-21`} stroke={FIN_SH} strokeWidth={1} />
            <path d="M-8,0 C-8,-9 0,-13 8,-11 C14,-9 19,-4 19,1 C19,5 12,9 4,9 C-3,9 -8,5 -8,0Z" fill={SKIN} {...ol} />
            <path d="M-8,0 C-8,5 -3,9 4,9 C-1,5 -2,-4 1,-12 C-5,-10 -8,-6 -8,0Z" fill={SKIN_SH} />
            <path d="M6,-9 C11,-8 15,-5 16,-2" fill="none" stroke={SKIN_HI} strokeWidth={1.4} strokeLinecap="round" />
            {/* gills */}
            <path d="M-3,0 C-2,2 -2,4 -3,6 M0,0 C1,2 1,4 0,6" fill="none" stroke={SKIN_SH} strokeWidth={1} />
            {/* toothy mouth */}
            <path d="M5,3 L19,2 C18,6 12,7.5 6,6Z" fill="#0c0f1a" {...ol} strokeWidth={1.1} />
            <path d="M7,3 L8,5 L9.5,3 L10.5,5 L12,2.8 L13,4.8 L14.5,2.6 L15.5,4.4 L17,2.4" fill="none" stroke="#eef2f6" strokeWidth={0.8} strokeLinejoin="round" />
            {/* glowing eye */}
            <Glow x={10} y={-3.5} r={2.3} color={EYE} core="#ffffe0" />
            <path d="M6.5,-6.6 L14,-4.8" stroke={OUT} strokeWidth={1.6} strokeLinecap="round" />
          </g>
        </g>
        <Leg x={4} y={-22 + by} a={m.legB} fill={SKIN} />
        <g transform={`translate(0,${f(by)}) rotate(${f(lean)},0,-22)`}>
          {/* front arm + dagger */}
          {anim === 'attack' && <Swoosh cx={4} cy={-48} r={42} a0={-40} a1={frontA} width={6} color="#cfe8ff" opacity={trailAlpha(k)} />}
          <Rot x={4} y={-48} a={frontA}>
            <Limb len={23} w0={7.5} w1={6} fill={SKIN} shade={SKIN_SH} />
            <rect x={-3.8} y={14} width={7.6} height={5} rx={1} fill={WRAP} {...ol} strokeWidth={1.1} />
            <g transform="translate(0,24)">
              <Dagger />
            </g>
            <circle cx={0} cy={23.5} r={3.8} fill={SKIN} {...ol} />
            <circle cx={0} cy={0} r={4.6} fill={SKIN_HI} {...ol} strokeWidth={1.2} />
          </Rot>
        </g>
        {anim === 'attack' && hitFlash(k) > 0 && (
          <g opacity={f(hitFlash(k))}>
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M${18 + i * 2},${-36 + i * 4} L${36 + i * 4},${-36 + i * 4}`} stroke="#e6f5ff" strokeWidth={1.4 - i * 0.3} strokeLinecap="round" />
            ))}
            <Glow x={48} y={-34} r={2 + 4 * hitFlash(k)} color="#c8f0ff" />
          </g>
        )}
      </g>
      {motes}
      {shadow > 0 && <Glow x={f(dx + 18)} y={-60} r={2.4} color={EYE} opacity={shadow} />}
    </HeroFrame>
  );
};
