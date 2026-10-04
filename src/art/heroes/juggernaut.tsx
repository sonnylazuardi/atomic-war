import type { ReactNode } from 'react';
import type { HeroArt } from '../types.ts';
import { Glow, HeroFrame, Limb, OUT, Rot, bump, f, hitFlash, lerp, lunge, motion, ol, seg, smooth, swing } from './parts1.tsx';

const SKIN = '#c98d5c';
const SKIN_SH = '#9a643c';
const PANTS = '#ddd3bd';
const PANTS_SH = '#ada083';
const SASH = '#c1352b';
const SASH_SH = '#87201a';
const HAIR = '#ff8a2a';
const HAIR_HI = '#ffc061';
const MASK = '#efe4c8';
const MASK_SH = '#c7b892';
const PAINT_G = '#2f9e78';
const PAINT_R = '#c1352b';
const BLADE = '#e4eaf1';
const WRAP = '#2a2230';
const GOLD = '#d6a640';
const FURY = '#ffb347';

function Katana() {
  return (
    <g>
      <rect x={-1.6} y={-9} width={3.2} height={11} rx={1.2} fill={WRAP} {...ol} strokeWidth={1.1} />
      <path d="M-1.6,-7 L1.6,-5 M-1.6,-3.5 L1.6,-1.5" stroke={HAIR} strokeWidth={0.9} />
      <ellipse cx={0} cy={2.6} rx={4.2} ry={1.6} fill={GOLD} {...ol} strokeWidth={1} />
      <path d="M-1.4,4 L1.6,4 C2.6,16 2.6,28 0.6,40 C-0.4,42 -1.6,41 -1.6,39 C-0.6,28 -0.8,16 -1.4,4Z" fill={BLADE} {...ol} strokeWidth={1.2} />
      <path d="M0.8,6 C1.6,16 1.6,26 0.4,36" stroke="#fff" strokeWidth={0.7} fill="none" />
    </g>
  );
}

/** Flat elliptical slash arc around the body (horizontal swing), drawn from phi0 to phi1 (radians). */
function FlatSlash(p: { cy: number; rx: number; ry: number; phi0: number; phi1: number; opacity: number; color: string }) {
  if (p.opacity <= 0.01) return null;
  const N = 16;
  const o: string[] = [];
  const i: string[] = [];
  for (let n = 0; n <= N; n++) {
    const q = n / N;
    const ph = lerp(p.phi0, p.phi1, q);
    const w = q * q * 6;
    o.push(`${f(Math.cos(ph) * p.rx)},${f(p.cy + Math.sin(ph) * p.ry)}`);
    i.unshift(`${f(Math.cos(ph) * (p.rx - w))},${f(p.cy + Math.sin(ph) * (p.ry - w * 0.4) - w * 0.3)}`);
  }
  return (
    <g opacity={f(p.opacity)}>
      <path d={`M${o.join(' L')} L${i.join(' L')}Z`} fill={p.color} opacity={0.8} />
      <path d={`M${o.join(' L')}`} fill="none" stroke="#fff" strokeWidth={1.3} strokeLinecap="round" />
    </g>
  );
}

export const Juggernaut: HeroArt = ({ anim, t, dur, team }) => {
  const m = motion(anim, t, dur, 1.5, 0.55);
  const k = m.atk;
  const c = m.cast;
  const breathe = anim === 'idle' ? Math.sin(m.ph) : 0;

  let frontA = -30 + m.sway * (m.walking ? -10 : 2);
  let grip = -40 + breathe * 4;
  let backA = 10 + m.sway * (m.walking ? 16 : -2);
  let lean = m.lean + 3;
  let dx = 0;
  let spinX = 1;
  let fury = 0;
  if (anim === 'attack') {
    frontA = swing(k, -30, 110, -100);
    grip = swing(k, -40, 50, -10);
    backA = swing(k, 10, -30, 40);
    lean = 3 + swing(k, 0, -6, 12);
    dx = lunge(k, 9);
  } else if (anim === 'cast') {
    fury = bump(seg(c, 0.05, 1)) ** 0.5;
    const s = t * 30;
    const cs = Math.cos(s);
    spinX = fury > 0.1 ? (Math.abs(cs) < 0.3 ? Math.sign(cs || 1) * 0.3 : cs) : 1;
    frontA = lerp(-30, -90, Math.min(1, fury * 1.5));
    grip = lerp(-40, 0, Math.min(1, fury * 1.5));
    backA = lerp(10, 80, Math.min(1, fury * 1.5));
    lean = 3;
  } else if (anim === 'hurt') {
    frontA = 20 + m.sway * 6;
    grip = 10;
    backA = 35 - m.sway * 6;
  } else if (anim === 'dead') {
    frontA = lerp(-30, -150, smooth(t / 0.6));
    grip = lerp(-40, -30, smooth(t / 0.6));
    backA = lerp(10, -110, smooth(t / 0.6));
  }
  const by = m.bob;
  const hairW = Math.sin(m.ph + 0.8) * (m.walking ? 2 : 1.2) + (anim === 'attack' ? swing(k, 0, 2, -3) : 0);
  const sashW = Math.sin(m.ph + 1.4) * (m.walking ? 3 : 1.5) + (fury ? Math.sin(t * 30) * 4 : 0);

  // slash: sweeps behind (phi=pi) through the front-bottom of the ellipse (pi/2) to front (0)
  const slashK = anim === 'attack' ? seg(k, 0.42, 0.56) : 0;
  const slashA = anim === 'attack' ? (k < 0.42 ? 0 : k < 0.58 ? 1 : 1 - seg(k, 0.58, 0.8)) : 0;

  const whirl: ReactNode[] = [];
  if (fury > 0.02) {
    [-50, -38, -26, -14].forEach((y, i) => {
      whirl.push(
        <ellipse
          key={i}
          cx={0}
          cy={y}
          rx={f(36 - Math.abs(y + 32) * 0.3)}
          ry={f(8)}
          fill="none"
          stroke={i % 2 ? '#fff6e0' : FURY}
          strokeWidth={i % 2 ? 1.4 : 2.6}
          strokeDasharray="34 22"
          strokeDashoffset={f(-t * 600 - i * 13)}
          opacity={f(fury * 0.85)}
        />,
      );
    });
  }

  return (
    <HeroFrame anim={anim} t={t} team={team} headY={-86} width={19}>
      {fury > 0.02 && <ellipse cx={0} cy={-2} rx={f(30 * fury)} ry={f(8 * fury)} fill="#d8c08a" opacity={f(0.35 * fury)} />}
      {fury > 0.02 && <g>{whirl.slice(0, 2)}</g>}
      <g transform={`translate(${f(dx)},0) scale(${f(spinX)},1)`}>
        {/* legs */}
        <Rot x={-5} y={-26 + by * 0.6} a={m.legA}>
          <Limb len={19} w0={12} w1={8} fill={PANTS_SH} />
          <path d="M-4,13 L4,13 L4,19 L-4,19Z" fill={SASH_SH} {...ol} strokeWidth={1.1} />
          <path d="M-3.5,20 L4,20 L9,24 L-3.5,25Z" fill={WRAP} {...ol} strokeWidth={1.2} />
        </Rot>
        <Rot x={5} y={-26 + by * 0.6} a={m.legB}>
          <Limb len={19} w0={12} w1={8} fill={PANTS} />
          <path d="M-4,13 L4,13 L4,19 L-4,19Z" fill={SASH} {...ol} strokeWidth={1.1} />
          <path d="M-3.5,20 L4,20 L9,24 L-3.5,25Z" fill={WRAP} {...ol} strokeWidth={1.2} />
        </Rot>
        <g transform={`translate(0,${f(by)}) rotate(${f(lean)},0,-26)`}>
          {/* sash tails */}
          <path d={`M-8,-28 C-14,-24 ${f(-18 + sashW)},-18 ${f(-22 + sashW * 1.5)},-10 L${f(-17 + sashW)},-11 C-14,-17 -10,-22 -6,-26Z`} fill={SASH_SH} {...ol} />
          {/* back arm */}
          <Rot x={-5} y={-50} a={backA}>
            <Limb len={19} w0={8} w1={6.5} fill={SKIN_SH} />
            <rect x={-3.8} y={11} width={7.6} height={5} rx={1} fill={PANTS_SH} {...ol} strokeWidth={1.1} />
            <circle cx={0} cy={20} r={4} fill={SKIN_SH} {...ol} />
          </Rot>
          {/* torso */}
          <path d="M-9,-27 C-11,-38 -10,-49 -4,-53 C2,-56 10,-54 11,-48 C12,-40 10,-32 8,-27Z" fill={SKIN} {...ol} />
          <path d="M-9,-27 C-11,-38 -10,-49 -4,-53 C-5,-44 -4,-34 -2,-27Z" fill={SKIN_SH} />
          <path d="M3,-48 C6,-47 8,-44 8,-41 M2,-40 L7,-40 M2,-35 L6,-35" fill="none" stroke={SKIN_SH} strokeWidth={1} strokeLinecap="round" />
          {/* cross strap */}
          <path d="M-7,-52 L9,-30" stroke={OUT} strokeWidth={4.6} strokeLinecap="round" />
          <path d="M-7,-52 L9,-30" stroke={PANTS} strokeWidth={2.8} strokeLinecap="round" />
          {/* sash */}
          <path d="M-10,-31 L10,-31 L11,-23 L-10,-23Z" fill={SASH} {...ol} />
          <path d="M-10,-27 L11,-27" stroke={SASH_SH} strokeWidth={1.2} />
          <path d="M5,-31 L8,-23" stroke={GOLD} strokeWidth={1.3} />
          {/* head */}
          <g transform={`translate(5,${f(-64 + breathe * -0.5)}) scale(1.12)`}>
            {/* hair tuft */}
            <path
              d={`M-6,-8 C${f(-12 + hairW)},-14 ${f(-14 + hairW)},-22 ${f(-8 + hairW)},-28 C-6,-22 -4,-20 -2,-19 C${f(-2 + hairW)},-25 ${f(2 + hairW)},-29 ${f(7 + hairW)},-30 C4,-24 4,-20 5,-16 C${f(8 + hairW)},-19 ${f(12 + hairW)},-20 ${f(15 + hairW)},-19 C10,-14 8,-10 6,-8Z`}
              fill={HAIR}
              {...ol}
            />
            <path d={`M-4,-12 C${f(-8 + hairW)},-17 ${f(-8 + hairW)},-21 ${f(-7 + hairW)},-24 M0,-14 C${f(1 + hairW)},-20 ${f(3 + hairW)},-24 ${f(5 + hairW)},-26`} fill="none" stroke={HAIR_HI} strokeWidth={1.3} strokeLinecap="round" />
            {/* back of head / wrap */}
            <path d="M-9,-2 C-10,-10 -4,-13 2,-12 L2,6 C-4,7 -8,4 -9,-2Z" fill={WRAP} {...ol} />
            {/* the tiki mask */}
            <path d="M-1,-13 C7,-15 14,-10 15,-2 C16,7 11,13 4,13 C-2,13 -4,6 -3,-3 C-3,-8 -2,-11 -1,-13Z" fill={MASK} {...ol} />
            <path d="M-1,-13 C-2,-11 -3,-8 -3,-3 C-4,6 -2,13 4,13 C1,8 0,0 1,-12Z" fill={MASK_SH} />
            {/* painted pattern */}
            <path d="M2,-12 C6,-12.5 10,-11 12,-8" fill="none" stroke={PAINT_G} strokeWidth={2} strokeLinecap="round" />
            <path d="M4,-9 L7,-6 L4,-3" fill="none" stroke={PAINT_R} strokeWidth={1.3} strokeLinejoin="round" />
            {/* slanted eye holes */}
            <path d="M6,-5 L13,-6 L12,-2.8 L7.2,-2.6Z" fill={OUT} />
            <circle cx={11} cy={-4.1} r={0.8} fill="#ffd27a" />
            {/* grin */}
            <path d="M3,4 C6,8 11,8 14.5,3.5 L14,6 C11,10 6,10 3.5,6Z" fill={OUT} />
            <path d="M5,5.6 L6,7.4 L7.3,5.9 L8.5,7.8 L9.8,6 L11,7.6 L12.2,5.6" fill="none" stroke="#fff" strokeWidth={0.8} strokeLinejoin="round" />
            <path d="M14.6,-1 C15.8,1 15.8,3 14.4,4" fill="none" stroke={PAINT_G} strokeWidth={1.4} />
          </g>
          {/* slash trail */}
          <FlatSlash cy={-40} rx={46} ry={14} phi0={Math.PI * 1.05} phi1={lerp(Math.PI * 1.05, -0.1, smooth(slashK))} opacity={slashA} color="#ffe3b8" />
          {/* front arm + katana */}
          <Rot x={4} y={-49} a={frontA}>
            <Limb len={19} w0={8.5} w1={7} fill={SKIN} shade={SKIN_SH} />
            <rect x={-4} y={10} width={8} height={6} rx={1} fill={PANTS} {...ol} strokeWidth={1.1} />
            <g transform={`translate(0,20) rotate(${f(grip)})`}>
              <Katana />
            </g>
            <circle cx={0} cy={20} r={4.2} fill={SKIN} {...ol} />
            <path d="M-5.5,-2 C-5.5,-8 6,-8 6,-2 C6,2 3,4 0,4 C-3,4 -5.5,2 -5.5,-2Z" fill={SASH} {...ol} strokeWidth={1.2} />
          </Rot>
        </g>
      </g>
      {fury > 0.02 && <g>{whirl.slice(2)}</g>}
      {anim === 'attack' && hitFlash(k) > 0 && <Glow x={f(dx + 44)} y={-36} r={2 + 5 * hitFlash(k)} color="#fff1d6" opacity={hitFlash(k)} />}
    </HeroFrame>
  );
};
