import type { ReactNode } from 'react';
import type { HeroArt } from '../types.ts';
import { Flame, Glow, HeroFrame, Limb, OUT, RuneCircle, Rot, bump, easeOut, f, lerp, motion, ol, seg, smooth, swing } from './parts1.tsx';

const SKIN = '#f3cfae';
const SKIN_SH = '#d9a37e';
const DRESS = '#d63a1f';
const DRESS_HI = '#f0612e';
const DRESS_SH = '#962211';
const GOLD = '#f2c14e';
const HAIR = '#e8391a';
const HAIR_MID = '#ff7a1f';
const HAIR_TIP = '#ffd23f';
const BOOT = '#5a2418';
const FIRE = '#ff6a1f';

function HairFlames(p: { t: number; wind: number }) {
  // flame tongues streaming up/back from the head (head centred at 0,0)
  const tongues: ReactNode[] = [];
  const spec = [
    { x: -9, y: 2, s: 16, lean: -9, rot: -50 },
    { x: -8, y: -5, s: 19, lean: -8, rot: -35 },
    { x: -4, y: -10, s: 21, lean: -6, rot: -18 },
    { x: 2, y: -12, s: 18, lean: -4, rot: -2 },
    { x: 7, y: -10, s: 13, lean: -3, rot: 14 },
  ];
  spec.forEach((s, i) => {
    tongues.push(
      <g key={i} transform={`translate(${s.x},${s.y}) rotate(${f(s.rot + Math.sin(p.t * 7 + i) * 5 + p.wind)})`}>
        <Flame x={0} y={4} s={s.s} t={p.t} seed={i * 1.7} color={i % 2 ? HAIR : HAIR_MID} core={HAIR_TIP} lean={s.lean * 0.5} />
      </g>,
    );
  });
  return <g>{tongues}</g>;
}

export const Lina: HeroArt = ({ anim, t, dur, team }) => {
  const m = motion(anim, t, dur, 1.4, 0.6);
  const k = m.atk;
  const c = m.cast;
  const breathe = anim === 'idle' ? Math.sin(m.ph) : 0;

  let frontA = -40 + m.sway * (m.walking ? -12 : 4);
  let foreA = -40 + breathe * 5;
  let backA = 20 + m.sway * (m.walking ? 14 : -3);
  let backFore = -20;
  let lean = m.lean * 0.8;
  let headTilt = breathe * 1.5;
  let palm = 0.5 + Math.sin(t * 6) * 0.1;
  let charge = 0;
  let wind = m.walking ? -12 : Math.sin(m.ph) * 3;
  if (anim === 'attack') {
    frontA = swing(k, -40, 70, -100);
    foreA = swing(k, -40, -70, 0);
    backA = swing(k, 20, -20, 40);
    lean = swing(k, 0, -8, 10);
    palm = 0.5 + Math.min(1, k * 2.4) * 0.6;
    if (k > 0.5) palm = 0.4;
    wind = swing(k, 0, 8, -14);
  } else if (anim === 'cast') {
    const up = smooth(seg(c, 0, 0.3));
    const end = 1 - seg(c, 0.88, 1);
    frontA = lerp(-40, -80, up * end);
    foreA = lerp(-40, -5, up * end);
    backA = lerp(20, -78, up * end);
    backFore = lerp(-20, -8, up * end);
    lean = lerp(0, 8, up * end);
    charge = easeOut(seg(c, 0.1, 0.6)) * (1 - seg(c, 0.62, 0.8));
    palm = 0;
    wind = -14 * up * end + Math.sin(t * 20) * 4 * end;
  } else if (anim === 'hurt') {
    frontA = 20 + m.sway * 6;
    foreA = 0;
    backA = 30 - m.sway * 6;
    headTilt = 12;
    palm = 0;
  } else if (anim === 'dead') {
    frontA = lerp(-40, -140, smooth(t / 0.6));
    foreA = lerp(-40, 0, smooth(t / 0.6));
    backA = lerp(20, -110, smooth(t / 0.6));
    palm = 0;
  }
  const by = m.bob;
  const hairT = anim === 'dead' ? Math.min(t, 0.6) * 0.3 : t;
  const flameDim = anim === 'dead' ? 1 - seg(t, 0, 0.6) * 0.8 : 1;
  const skirt = Math.sin(m.ph + 0.5) * (m.walking ? 2.4 : 1.2);

  // fireball flicked from the hand at the strike frame
  let fireball: ReactNode = null;
  if (anim === 'attack' && k >= 0.48 && k < 0.85) {
    const q = seg(k, 0.48, 0.85);
    fireball = <Glow x={f(30 + easeOut(q) * 26)} y={f(-44 - Math.sin(q * Math.PI) * 4)} r={f(4.5 * (1 - q * 0.6))} color={FIRE} core="#fff2a8" opacity={f(1 - q * q)} />;
  }
  const chargeFlash = anim === 'cast' ? bump(seg(c, 0.55, 0.8)) : 0;

  return (
    <HeroFrame anim={anim} t={t} team={team} headY={-92} width={17}>
      {anim === 'cast' && <RuneCircle x={0} y={0} r={30} k={c} color={FIRE} spin={t * 3} sides={3} />}
      {anim === 'cast' &&
        [0, 1, 2, 3, 4].map((i) => {
          const q = (t * 1.8 + i * 0.21) % 1;
          const op = (1 - q) * bump(seg(c, 0.05, 0.9));
          if (op <= 0.02) return null;
          return <Flame key={i} x={-20 + i * 10} y={-q * 30} s={6 * (1 - q) + 2} t={t} seed={i} color={FIRE} />;
        })}
      {/* legs */}
      <Rot x={-3} y={-24 + by * 0.6} a={m.legA}>
        <Limb len={20} w0={6} w1={5} fill={SKIN_SH} />
        <path d="M-3,12 L3,12 L3.2,20 L8,22 L8,24 L-3,24Z" fill={BOOT} {...ol} strokeWidth={1.2} />
      </Rot>
      <Rot x={3} y={-24 + by * 0.6} a={m.legB}>
        <Limb len={20} w0={6} w1={5} fill={SKIN} />
        <path d="M-3,12 L3,12 L3.2,20 L8,22 L8,24 L-3,24Z" fill={BOOT} {...ol} strokeWidth={1.2} />
        <path d="M-3,13 L3,13" stroke={GOLD} strokeWidth={1.1} />
      </Rot>
      <g transform={`translate(0,${f(by)}) rotate(${f(lean)},0,-24)`}>
        {/* back arm */}
        <Rot x={-3} y={-50} a={backA}>
          <Limb len={11} w0={5.5} w1={5} fill={SKIN_SH} />
          <Rot x={0} y={11} a={backFore}>
            <Limb len={10} w0={5} w1={4.5} fill={SKIN_SH} />
            <circle cx={0} cy={11} r={3} fill={SKIN_SH} {...ol} />
          </Rot>
        </Rot>
        {/* skirt (flowing) */}
        <path d={`M-7,-30 L8,-30 C12,-24 15,-18 ${f(17 + skirt)},-12 L${f(10 + skirt)},-14 L${f(5 + skirt)},-10 L${f(-1 + skirt)},-13 L${f(-7 + skirt)},-10 L${f(-14 + skirt * 1.5)},-12 C-12,-18 -10,-24 -7,-30Z`} fill={DRESS} {...ol} />
        <path d={`M-7,-30 L-2,-30 C-3,-24 -2,-18 ${f(-1 + skirt)},-13 L${f(-7 + skirt)},-10 L${f(-14 + skirt * 1.5)},-12 C-12,-18 -10,-24 -7,-30Z`} fill={DRESS_SH} />
        <path d={`M${f(17 + skirt)},-12 L${f(10 + skirt)},-14 L${f(5 + skirt)},-10 L${f(-1 + skirt)},-13 L${f(-7 + skirt)},-10 L${f(-14 + skirt * 1.5)},-12`} fill="none" stroke={GOLD} strokeWidth={1.3} strokeLinejoin="round" />
        {/* bodice */}
        <path d="M-6,-30 C-8,-38 -7,-48 -3,-52 L6,-52 C9,-46 9,-38 7,-30Z" fill={DRESS} {...ol} />
        <path d="M-6,-30 C-8,-38 -7,-48 -3,-52 L0,-52 C-2,-44 -2,-36 -1,-30Z" fill={DRESS_SH} />
        <path d="M2,-49 C6,-47 7,-42 6,-38" fill="none" stroke={DRESS_HI} strokeWidth={1.5} strokeLinecap="round" />
        <path d="M-7,-32 L8,-32 L8,-29 L-7,-29Z" fill={GOLD} {...ol} strokeWidth={1.1} />
        <path d="M-1,-52 L3,-47 L7,-52" fill="none" stroke={GOLD} strokeWidth={1.2} />
        {/* neck */}
        <rect x={0} y={-56} width={4.4} height={6} fill={SKIN} {...ol} strokeWidth={1.2} />
        {/* head */}
        <g transform={`translate(3,-65) rotate(${f(headTilt)}) scale(1.1)`} opacity={1}>
          <g opacity={f(flameDim)}>
            <HairFlames t={hairT} wind={wind} />
          </g>
          <path d="M-8,0 C-8,-8 -2,-11 4,-10 C10,-9 12,-4 11,2 C10,7 6,10 1,10 C-4,10 -8,6 -8,0Z" fill={SKIN} {...ol} />
          <path d="M-8,0 C-8,6 -4,10 1,10 C-3,7 -4,0 -2,-9 C-6,-8 -8,-5 -8,0Z" fill={SKIN_SH} />
          {/* hair cap/fringe */}
          <path d="M-9,2 C-11,-8 -4,-13 4,-12 C9,-11 12,-8 12,-4 C8,-7 4,-6 1,-3 C-1,0 -3,2 -4,6 Z" fill={HAIR} {...ol} />
          <path d="M-6,-6 C-3,-10 3,-11 7,-9" fill="none" stroke={HAIR_TIP} strokeWidth={1.2} strokeLinecap="round" />
          <path d="M-3,6 C-4,10 -6,14 -9,16 C-6,14 -2,12 -1,8Z" fill={HAIR_MID} {...ol} strokeWidth={1} />
          {/* eye */}
          <ellipse cx={6.5} cy={-0.5} rx={1.4} ry={2} fill={OUT} />
          <circle cx={6.9} cy={-1.1} r={0.6} fill="#ffe08a" />
          <path d="M4.4,-3.6 L9,-3" stroke={OUT} strokeWidth={1.1} strokeLinecap="round" />
          <path d="M7.5,5.4 L10,5" stroke="#9a3324" strokeWidth={1} strokeLinecap="round" />
          <circle cx={4.5} cy={3.5} r={1.4} fill="#f29a8a" opacity={0.6} />
          {/* gold circlet */}
          <path d="M-7,-5 C-2,-9 6,-9 11,-5" fill="none" stroke={GOLD} strokeWidth={1.4} strokeLinecap="round" />
          <circle cx={9} cy={-6} r={1.2} fill={FIRE} stroke={OUT} strokeWidth={0.6} />
        </g>
        {/* front arm (2 segments) */}
        <Rot x={3} y={-50} a={frontA}>
          <Limb len={11} w0={6} w1={5.2} fill={SKIN} shade={SKIN_SH} />
          <path d="M-3.5,-1 C-3.5,-5 4,-5 4,-1 C4,2 2,3 0,3 C-2,3 -3.5,2 -3.5,-1Z" fill={DRESS_HI} {...ol} strokeWidth={1.1} />
          <Rot x={0} y={11} a={foreA}>
            <Limb len={10} w0={5.2} w1={4.6} fill={SKIN} />
            <path d="M-2.6,5 L2.6,5 L2.8,8 L-2.8,8Z" fill={GOLD} {...ol} strokeWidth={0.9} />
            <circle cx={0} cy={11} r={3.1} fill={SKIN} {...ol} />
            {palm > 0 && (
              <g transform={`translate(0,13) rotate(${f(-frontA - foreA)})`}>
                <Flame x={0} y={2} s={6 + palm * 6} t={t} seed={3} color={FIRE} />
              </g>
            )}
          </Rot>
        </Rot>
        {charge > 0 && (
          <g>
            <Glow x={30} y={-46} r={f(3 + charge * 9 + Math.sin(t * 30) * 0.8)} color={FIRE} core="#fff3b0" />
            {[0, 1, 2, 3].map((i) => {
              const a = t * 8 + (i * Math.PI) / 2;
              const r = 16 * (1 - charge * 0.4);
              return <Glow key={i} x={f(30 + Math.cos(a) * r)} y={f(-46 + Math.sin(a) * r * 0.6)} r={1.4} color={HAIR_TIP} opacity={charge} />;
            })}
          </g>
        )}
        {chargeFlash > 0 && <circle cx={30} cy={-46} r={f(10 + chargeFlash * 16)} fill="none" stroke="#ffe08a" strokeWidth={f(3 * chargeFlash)} opacity={f(chargeFlash)} />}
        {anim === 'attack' && k > 0.42 && k < 0.6 && <Glow x={28} y={-46} r={f(2 + 4 * bump(seg(k, 0.42, 0.6)))} color="#ffd36b" opacity={bump(seg(k, 0.42, 0.6))} />}
      </g>
      {fireball}
    </HeroFrame>
  );
};
