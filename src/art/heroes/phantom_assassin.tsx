import type { HeroArt } from '../types.ts';
import { Glow, HeroFrame, Limb, OUT, Rot, bump, f, hitFlash, lerp, lunge, motion, ol, seg, smooth, swing } from './parts1.tsx';

const VEIL = '#7c6c9a';
const VEIL_HI = '#a294c0';
const VEIL_SH = '#54476f';
const CLOTH = '#3c3552';
const CLOTH_SH = '#28233a';
const HELM = '#34303f';
const HELM_HI = '#615b74';
const EYE = '#b6f3ff';
const BLADE = '#dfe5ee';
const GOLD = '#c9a24a';
const BLUR = '#b48cff';

function Sword() {
  return (
    <g>
      <rect x={-1.3} y={-6} width={2.6} height={8} rx={1} fill={CLOTH_SH} {...ol} strokeWidth={1.1} />
      <circle cx={0} cy={-6.5} r={1.6} fill={GOLD} stroke={OUT} strokeWidth={0.9} />
      <path d="M-4,2.5 C-2,1.5 2,1.5 4,2.5 L3,4 L-3,4Z" fill={GOLD} {...ol} strokeWidth={1} />
      <path d="M-1.5,4 L1.5,4 L1.6,30 C1.4,35 0.6,39 -0.6,42 C-1.4,36 -1.6,32 -1.5,30Z" fill={BLADE} {...ol} strokeWidth={1.2} />
      <path d="M0.4,6 L0.4,33" stroke="#fff" strokeWidth={0.7} />
    </g>
  );
}

interface Pose {
  frontA: number;
  backA: number;
  grip: number;
  lean: number;
  legA: number;
  legB: number;
  by: number;
  wave: number;
  headTilt: number;
}

function Body({ p, slit }: { p: Pose; slit: number }) {
  const w = p.wave;
  return (
    <g>
      {/* cape */}
      <g transform={`translate(0,${f(p.by)}) rotate(${f(p.lean)},0,-28)`}>
        <path
          d={`M-6,-54 C-14,-44 ${f(-18 + w * 2)},-30 ${f(-24 + w * 4)},-10 L${f(-17 + w * 3)},-13 L${f(-14 + w * 2)},-7 L${f(-9 + w)},-14 C-6,-26 -2,-40 2,-52Z`}
          fill={VEIL_SH}
          {...ol}
        />
      </g>
      {/* back leg */}
      <Rot x={-2} y={-28 + p.by} a={p.legA}>
        <Limb len={26} w0={7} w1={5} fill={CLOTH_SH} />
        <path d="M-3,22 L4,22 L10,26 L-3,27Z" fill={HELM} {...ol} strokeWidth={1.2} />
      </Rot>
      <g transform={`translate(0,${f(p.by)}) rotate(${f(p.lean)},0,-28)`}>
        {/* back arm */}
        <Rot x={-2} y={-51} a={p.backA}>
          <Limb len={19} w0={6} w1={5} fill={CLOTH_SH} />
          <circle cx={0} cy={20} r={3.2} fill={HELM} {...ol} />
        </Rot>
        {/* torso */}
        <path d="M-7,-30 C-9,-40 -8,-50 -4,-55 L7,-55 C10,-48 10,-40 7,-30Z" fill={CLOTH} {...ol} />
        <path d="M-7,-30 C-9,-40 -8,-50 -4,-55 L-1,-55 C-3,-48 -3,-38 -2,-30Z" fill={CLOTH_SH} />
        <path d="M0,-52 L8,-51 C9,-46 9,-42 7,-38 L1,-40Z" fill={HELM_HI} {...ol} strokeWidth={1.1} />
        {/* sash + skirt */}
        <path d={`M-8,-32 L8,-32 L${f(13 + w)},-13 L6,-16 L2,-11 L-3,-16 L${f(-11 + w)},-13Z`} fill={VEIL} {...ol} />
        <path d={`M-8,-32 L-2,-32 L-3,-16 L${f(-11 + w)},-13Z`} fill={VEIL_SH} />
        <path d="M-8,-33 L8,-33 L8,-29 L-8,-29Z" fill={GOLD} {...ol} strokeWidth={1.1} />
      </g>
      {/* front leg */}
      <Rot x={3} y={-28 + p.by} a={p.legB}>
        <Limb len={26} w0={7} w1={5} fill={CLOTH} />
        <path d="M-3,22 L4,22 L10,26 L-3,27Z" fill={HELM_HI} {...ol} strokeWidth={1.2} />
      </Rot>
      <g transform={`translate(0,${f(p.by)}) rotate(${f(p.lean)},0,-28)`}>
        {/* head: helmet + veil */}
        <g transform={`translate(3,-64) rotate(${f(p.headTilt)}) scale(1.1)`}>
          <path
            d={`M-9,-2 C-11,-12 -4,-18 4,-17 C10,-16 13,-11 13,-4 L11,2 C8,6 2,8 -4,9 C${f(-10 + w)},14 ${f(-16 + w * 2)},18 ${f(-21 + w * 3)},20 C${f(-16 + w * 2)},12 -12,6 -9,-2Z`}
            fill={VEIL}
            {...ol}
          />
          <path d={`M-9,-2 C-11,-12 -4,-18 2,-17 C-4,-12 -6,-4 -4,9 C${f(-10 + w)},14 ${f(-16 + w * 2)},18 ${f(-21 + w * 3)},20 C${f(-16 + w * 2)},12 -12,6 -9,-2Z`} fill={VEIL_SH} />
          <path d="M-2,-15 C3,-17 8,-15 10,-12" fill="none" stroke={VEIL_HI} strokeWidth={1.6} strokeLinecap="round" />
          {/* helmet face plate */}
          <path d="M2,-11 C8,-12 13,-8 13,-2 C13,3 10,6 5,6 C2,3 1,-6 2,-11Z" fill={HELM} {...ol} />
          <path d="M4,-9.5 C8,-10 11,-7.5 11.5,-5" fill="none" stroke={HELM_HI} strokeWidth={1.1} />
          <path d="M4,-3.6 L13,-4.2" stroke={OUT} strokeWidth={2.6} strokeLinecap="round" />
          <path d="M5,-3.7 L12.6,-4.2" stroke={EYE} strokeWidth={1.2} strokeLinecap="round" />
          {slit > 0 && <Glow x={10} y={-4} r={1.4 + slit * 1.4} color={EYE} opacity={0.8} />}
          <path d="M3,1 L10,1.5" stroke={HELM_HI} strokeWidth={0.8} />
        </g>
        {/* front arm + sword */}
        <Rot x={4} y={-51} a={p.frontA}>
          <Limb len={19} w0={6.5} w1={5.5} fill={CLOTH} shade={CLOTH_SH} />
          <rect x={-3.4} y={10} width={6.8} height={5} rx={1} fill={HELM_HI} {...ol} strokeWidth={1.1} />
          <g transform={`translate(0,20) rotate(${f(p.grip)})`}>
            <Sword />
          </g>
          <circle cx={0} cy={20} r={3.4} fill={HELM} {...ol} />
          <path d="M-5,-2 C-5,-8 6,-8 6,-2 C6,2 3,4 0,4 C-3,4 -5,2 -5,-2Z" fill={VEIL} {...ol} strokeWidth={1.2} />
        </Rot>
      </g>
    </g>
  );
}

export const PhantomAssassin: HeroArt = ({ anim, t, dur, team }) => {
  const m = motion(anim, t, dur, 1.6, 0.55);
  const k = m.atk;
  const c = m.cast;
  const breathe = anim === 'idle' ? Math.sin(m.ph) : 0;
  const pose: Pose = {
    frontA: -18 + m.sway * (m.walking ? -14 : 2),
    backA: 14 + m.sway * (m.walking ? 16 : -2),
    grip: 62,
    lean: m.lean + 4,
    legA: m.legA,
    legB: m.legB,
    by: m.bob,
    wave: Math.sin(m.ph * (m.walking ? 1 : 1) + 0.6) * (m.walking ? 1.6 : 1),
    headTilt: breathe * 1.2,
  };
  let dx = 0;
  let slit = 0;
  if (anim === 'attack') {
    pose.frontA = swing(k, -18, 60, -96);
    pose.grip = k < 0.42 ? lerp(62, -20, smooth(k / 0.42)) : k < 0.5 ? lerp(-20, 0, seg(k, 0.42, 0.5)) : lerp(0, 62, smooth(seg(k, 0.55, 1)));
    pose.backA = swing(k, 14, -40, 60);
    pose.lean = 4 + swing(k, 0, -8, 16);
    pose.legA = swing(k, 0, 10, 30);
    pose.legB = swing(k, 0, -10, -34);
    pose.wave = swing(k, 0, -1, 3);
    dx = lunge(k, 15);
    slit = hitFlash(k);
  } else if (anim === 'cast') {
    const up = smooth(seg(c, 0, 0.3));
    const end = 1 - seg(c, 0.85, 1);
    pose.frontA = lerp(-18, -60, up * end);
    pose.grip = lerp(62, 100, up * end);
    pose.backA = lerp(14, 60, up * end);
    pose.lean = 4 + 10 * up * end;
    pose.wave = Math.sin(t * 20) * 2;
    slit = up * end;
  } else if (anim === 'hurt') {
    pose.frontA = 20 + m.sway * 6;
    pose.backA = 30 - m.sway * 6;
    pose.grip = 30;
    pose.headTilt = 12;
  } else if (anim === 'dead') {
    pose.frontA = lerp(-18, -150, smooth(t / 0.6));
    pose.backA = lerp(14, -110, smooth(t / 0.6));
    pose.grip = lerp(62, -30, smooth(t / 0.6));
  }

  const blur = anim === 'cast' ? bump(seg(c, 0.1, 0.95)) : 0;
  const ghosts = [];
  if (blur > 0.02) {
    for (let i = 3; i >= 1; i--) {
      const off = -i * 9 * blur + Math.sin(t * 9 + i) * 2;
      ghosts.push(
        <g key={i} transform={`translate(${f(off)},${f(-Math.sin(t * 7 + i * 2) * 1.5)})`} opacity={f(blur * (0.5 - i * 0.12))}>
          <Body p={pose} slit={0} />
          <ellipse cx={2} cy={-40} rx={12} ry={34} fill={BLUR} opacity={0.35} />
        </g>,
      );
    }
  }
  const streak = anim === 'attack' ? hitFlash(k) : 0;

  return (
    <HeroFrame anim={anim} t={t} team={team} headY={-84} width={18}>
      {ghosts}
      {streak > 0 && (
        <g opacity={f(streak)}>
          {[-50, -44, -38].map((y, i) => (
            <path key={y} d={`M${-10 + i * 6},${y} L${30 + i * 4},${y}`} stroke={i === 1 ? '#fff' : BLUR} strokeWidth={1.4} strokeLinecap="round" />
          ))}
        </g>
      )}
      <g transform={`translate(${f(dx)},0)`} opacity={f(1 - blur * 0.35)}>
        <Body p={pose} slit={slit} />
      </g>
      {streak > 0 && <Glow x={f(dx + 52)} y={-50} r={2 + 4 * streak} color="#e6f7ff" opacity={streak} />}
    </HeroFrame>
  );
};
