import type { HeroArt } from '../types.ts';
import { Glow, HeroFrame, Limb, OUT, Rings, Rot, Swoosh, bump, f, hitFlash, lerp, lunge, motion, ol, seg, smooth, swing, trailAlpha } from './parts1.tsx';

const SKIN = '#c4473a';
const SKIN_HI = '#e0705c';
const SKIN_SH = '#8e2b24';
const BEARD = '#5e1712';
const BEARD_HI = '#8a2a1c';
const IRON = '#4d535c';
const IRON_HI = '#7c8590';
const IRON_SH = '#30343a';
const BONE = '#ece0c2';
const BONE_SH = '#b9a682';
const LEATHER = '#3d2c24';
const LEATHER_HI = '#5b4234';
const WOOD = '#6b4426';
const BLADE = '#a8b1bb';
const ROAR = '#ff5a36';

function GreatAxe() {
  // drawn in hand frame: handle runs along +y from the fist
  return (
    <g>
      <rect x={-1.8} y={-8} width={3.6} height={40} rx={1.6} fill={WOOD} {...ol} />
      <path d="M-1.8,2 L1.8,4 M-1.8,6 L1.8,8 M-1.8,-4 L1.8,-2" stroke={LEATHER_HI} strokeWidth={1.2} />
      {/* twin blades */}
      <path d="M-1,20 C-6,16 -13,14 -17,16 C-20,22 -20,32 -17,38 C-13,40 -6,38 -1,34Z" fill={BLADE} {...ol} />
      <path d="M1,20 C6,16 13,14 17,16 C20,22 20,32 17,38 C13,40 6,38 1,34Z" fill={BLADE} {...ol} />
      <path d="M-16.5,17.5 C-19,23 -19,31 -16.5,36.5" fill="none" stroke="#f1f5f8" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M16.5,17.5 C19,23 19,31 16.5,36.5" fill="none" stroke="#f1f5f8" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M-4,22 C-9,22 -11,26 -11,27 C-11,29 -9,33 -4,32" fill="none" stroke={IRON_SH} strokeWidth={1.4} />
      <path d="M4,22 C9,22 11,26 11,27 C11,29 9,33 4,32" fill="none" stroke={IRON_SH} strokeWidth={1.4} />
      <rect x={-3.4} y={18} width={6.8} height={18} rx={1.5} fill={IRON} {...ol} />
      <circle cx={0} cy={27} r={1.8} fill={ROAR} stroke={OUT} strokeWidth={0.8} />
      <path d="M0,36 L0,42" stroke={OUT} strokeWidth={3.6} strokeLinecap="round" />
      <path d="M0,36 L0,41.5" stroke={IRON_HI} strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

export const Axe: HeroArt = ({ anim, t, dur, team }) => {
  const m = motion(anim, t, dur, 1.5, 0.6);
  const k = m.atk;
  const c = m.cast;
  const breathe = anim === 'idle' ? Math.sin(m.ph) : 0;

  let frontA = -28 + m.sway * (m.walking ? -12 : 2.5);
  let backA = 18 + m.sway * (m.walking ? 18 : -2);
  let lean = m.lean;
  let dx = 0;
  let headTilt = breathe * 1.5;
  let roar = 0;
  if (anim === 'attack') {
    frontA = swing(k, -28, -200, -38);
    backA = swing(k, 18, -150, -30);
    lean = swing(k, 0, -10, 16);
    dx = lunge(k, 7);
  } else if (anim === 'cast') {
    const up = smooth(seg(c, 0, 0.35));
    const spin = seg(c, 0.4, 0.85);
    frontA = lerp(-28, -150, up) + spin * 0;
    backA = lerp(18, 140, up);
    lean = lerp(0, -10, up) * (1 - seg(c, 0.85, 1));
    headTilt = -14 * up * (1 - seg(c, 0.85, 1));
    roar = up * (1 - seg(c, 0.85, 1));
    if (c > 0.85) {
      frontA = lerp(-150, -28, smooth(seg(c, 0.85, 1)));
      backA = lerp(140, 18, smooth(seg(c, 0.85, 1)));
    }
  } else if (anim === 'hurt') {
    frontA = 15 + m.sway * 6;
    backA = 40 - m.sway * 6;
    headTilt = 10;
  } else if (anim === 'dead') {
    frontA = lerp(-28, -140, smooth(t / 0.6));
    backA = lerp(18, -120, smooth(t / 0.6));
  }
  const by = m.bob;
  const helix = anim === 'cast' ? seg(c, 0.4, 0.85) : 0;

  return (
    <HeroFrame anim={anim} t={t} team={team} headY={-84} width={20}>
      {anim === 'cast' && <Rings x={0} y={-2} k={seg(c, 0.3, 1)} r={46} color={ROAR} n={3} flat={0.38} />}
      <g transform={`translate(${f(dx)},0)`}>
        {/* legs */}
        <Rot x={-6} y={-22 + by * 0.6} a={m.legA}>
          <Limb len={17} w0={11} w1={9} fill={LEATHER} />
          <path d="M-5,12 L5,12 L6,18 C6,22 4,23 0,23 L-5,23 C-6,20 -6,15 -5,12Z" fill={IRON_SH} {...ol} />
          <ellipse cx={3} cy={21} rx={6.5} ry={3} fill={IRON_SH} {...ol} />
        </Rot>
        <Rot x={6} y={-22 + by * 0.6} a={m.legB}>
          <Limb len={17} w0={11} w1={9} fill={LEATHER_HI} />
          <path d="M-5,12 L5,12 L6,18 C6,22 4,23 0,23 L-5,23 C-6,20 -6,15 -5,12Z" fill={IRON} {...ol} />
          <ellipse cx={3} cy={21} rx={6.5} ry={3} fill={IRON} {...ol} />
        </Rot>
        <g transform={`translate(0,${f(by)}) rotate(${f(lean)},0,-22)`}>
          {/* back arm */}
          <Rot x={-9} y={-51} a={backA}>
            <Limb len={21} w0={11} w1={9} fill={SKIN_SH} />
            <rect x={-5} y={12} width={10} height={6} rx={1.5} fill={LEATHER} {...ol} />
            <circle cx={0} cy={22} r={5.5} fill={SKIN_SH} {...ol} />
          </Rot>
          {/* torso */}
          <path d="M-15,-56 C-6,-61 12,-61 18,-54 C23,-46 18,-32 11,-23 L-9,-23 C-15,-32 -19,-46 -15,-56Z" fill={SKIN} {...ol} />
          <path d="M-15,-56 C-19,-46 -15,-32 -9,-23 L-3,-23 C-8,-32 -11,-45 -8,-58 C-11,-58 -13,-57 -15,-56Z" fill={SKIN_SH} />
          <path d="M3,-52 C8,-54 14,-52 15,-47 C12,-43 6,-43 3,-46Z" fill={SKIN_HI} opacity={0.85} />
          <path d="M4,-44 C7,-41 11,-41 14,-43 M5,-37 L12,-37 M5,-31 L11,-31" fill="none" stroke={SKIN_SH} strokeWidth={1.2} strokeLinecap="round" />
          {/* belt + kilt */}
          <path d="M-12,-24 L13,-24 L15,-12 L9,-10 L6,-14 L2,-9 L-2,-13 L-6,-9 L-9,-13 L-13,-11Z" fill={LEATHER} {...ol} />
          <path d="M-11,-26 L14,-26 L14,-20 L-11,-20Z" fill={LEATHER_HI} {...ol} />
          <rect x={4} y={-27} width={7} height={8} rx={1.2} fill={IRON_HI} {...ol} />
          <path d="M-14,-56 C-10,-46 0,-38 14,-26" fill="none" stroke={LEATHER} strokeWidth={3} />
          {/* head */}
          <g transform={`translate(9,${f(-65 + breathe * -0.5)}) rotate(${f(headTilt)}) scale(1.08)`}>
            {/* beard braid */}
            <path d={`M1,8 C0,14 ${f(2 + Math.sin(m.ph) * 1.2)},18 ${f(1 + Math.sin(m.ph + 1) * 2)},26`} fill="none" stroke={OUT} strokeWidth={5.4} strokeLinecap="round" />
            <path d={`M1,8 C0,14 ${f(2 + Math.sin(m.ph) * 1.2)},18 ${f(1 + Math.sin(m.ph + 1) * 2)},26`} fill="none" stroke={BEARD} strokeWidth={3.2} strokeLinecap="round" />
            {[12, 16.5, 21].map((y, i) => (
              <path key={i} d={`M-1,${y} L3,${y + 1.5}`} stroke={BEARD_HI} strokeWidth={1.2} />
            ))}
            <circle cx={f(1 + Math.sin(m.ph + 1) * 2)} cy={26} r={2} fill={IRON_HI} stroke={OUT} strokeWidth={0.9} />
            {/* face */}
            <path d="M-9,-4 C-9,-12 10,-13 12,-4 C13,2 11,8 4,10 C-3,11 -9,6 -9,-4Z" fill={SKIN} {...ol} />
            <path d="M-9,-4 C-9,4 -5,9 0,10 C-4,6 -5,1 -4,-6Z" fill={SKIN_SH} />
            {/* beard mass */}
            <path d="M-4,1 C-2,4 4,6 12,2 C13,6 11,11 4,13 C-2,14 -6,10 -6,4Z" fill={BEARD} {...ol} />
            <path d="M2,8 C5,9 8,8 10,6" fill="none" stroke={BEARD_HI} strokeWidth={1.1} />
            {roar > 0.05 ? (
              <ellipse cx={8.5} cy={3.6} rx={2.8 * roar + 0.6} ry={2.6 * roar + 0.6} fill="#2a0b08" stroke={OUT} strokeWidth={0.9} />
            ) : (
              <path d="M5,3.6 L11,3" stroke={OUT} strokeWidth={1.2} strokeLinecap="round" />
            )}
            {/* eye + brow */}
            <path d="M5,-5 L11,-3 L10,-1.2 L5.5,-2.5Z" fill="#fff6c2" stroke={OUT} strokeWidth={0.9} strokeLinejoin="round" />
            <circle cx={8.6} cy={-2.4} r={0.9} fill={OUT} />
            <path d="M3.5,-7 L12,-4" stroke={OUT} strokeWidth={2} strokeLinecap="round" />
            {/* horned helmet */}
            <path d="M-3,-12 C-9,-15 -15,-20 -14,-31 C-19,-25 -18,-14 -8,-8Z" fill={BONE} {...ol} />
            <path d="M-14,-31 C-17,-26 -16,-18 -10,-12" fill="none" stroke={BONE_SH} strokeWidth={1.4} />
            <path d="M5,-13 C10,-16 15,-22 13,-32 C19,-26 19,-15 11,-9Z" fill={BONE} {...ol} />
            <path d="M14.5,-28 C16,-22 15,-16 11,-12" fill="none" stroke={BONE_SH} strokeWidth={1.4} />
            <path d="M-11,-4 C-12,-12 -6,-17 2,-17 C9,-17 13,-12 13,-6 L13,-4 L9,-4 L9,1 L7,1 L6,-5 L-11,-4Z" fill={IRON} {...ol} />
            <path d="M-6,-14 C-2,-16 4,-16 8,-14" fill="none" stroke={IRON_HI} strokeWidth={1.6} strokeLinecap="round" />
            <path d="M-11,-5 L13,-5" stroke={IRON_SH} strokeWidth={1.4} />
            {[-7, -2, 3].map((x) => (
              <circle key={x} cx={x} cy={-7.4} r={0.9} fill={IRON_HI} />
            ))}
          </g>
          {/* front pauldron arm + axe */}
          {anim === 'attack' && <Swoosh cx={1} cy={-49} r={50} a0={-200} a1={frontA} width={18} color="#ffd2c2" core="#fff" opacity={trailAlpha(k)} />}
          {helix > 0 && helix < 1 && (
            <g opacity={f(bump(helix))}>
              <ellipse cx={0} cy={-36} rx={44} ry={12} fill="none" stroke="#ffe0d0" strokeWidth={3} strokeDasharray="40 30" strokeDashoffset={f(-helix * 420)} />
              <ellipse cx={0} cy={-36} rx={38} ry={10} fill="none" stroke={ROAR} strokeWidth={2} strokeDasharray="30 40" strokeDashoffset={f(-helix * 520)} />
            </g>
          )}
          <Rot x={1} y={-49} a={frontA}>
            <Limb len={21} w0={12} w1={10} fill={SKIN} shade={SKIN_SH} />
            <rect x={-5.5} y={12} width={11} height={7} rx={1.5} fill={LEATHER} {...ol} />
            <g transform="translate(0,10)">
              <GreatAxe />
            </g>
            <circle cx={0} cy={22} r={6} fill={SKIN} {...ol} />
            <path d="M-6,-5 C-6,-11 6,-11 7,-5 C8,0 6,3 0,3 C-6,3 -7,0 -6,-5Z" fill={IRON} {...ol} />
            <path d="M-3,-8 C0,-9 3,-8 4,-6" fill="none" stroke={IRON_HI} strokeWidth={1.4} />
            <path d="M-1,-9 L1,-15 L3,-8.5Z" fill={BONE} {...ol} strokeWidth={1} />
          </Rot>
          {anim === 'attack' && hitFlash(k) > 0 && <Glow x={46} y={-14} r={3 + 6 * hitFlash(k)} color="#ffcfa8" opacity={hitFlash(k)} />}
        </g>
      </g>
    </HeroFrame>
  );
};
