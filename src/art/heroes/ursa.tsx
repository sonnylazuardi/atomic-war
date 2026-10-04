import type { HeroArt } from '../types.ts';
import { ClawTrail, Glow, HeroFrame, Limb, OUT, Rings, Rot, bump, f, hitFlash, lerp, lunge, motion, ol, seg, smooth, swing } from './parts1.tsx';

const FUR = '#7d5130';
const FUR_HI = '#a06c42';
const FUR_SH = '#55361f';
const MUZZLE = '#c99c6c';
const IRON = '#4f5560';
const IRON_HI = '#828c99';
const STRAP = '#3b2a20';
const CLAW = '#f1e9d6';
const CLAW_SH = '#b8ab8e';
const EYE = '#ff3b2f';
const RAGE = '#ff2a1a';

function Paw(p: { fill: string; spread: number }) {
  // fist at (0,0); three big claws pointing along +y and curving forward (+x)
  const s = p.spread;
  return (
    <g>
      {[-1, 0, 1].map((i) => (
        <path
          key={i}
          transform={`rotate(${f(i * (12 + s * 8))})`}
          d="M-2,3 C-2.5,10 0,16 5,20 C3,14 2.5,9 2.4,3Z"
          fill={CLAW}
          {...ol}
          strokeWidth={1.2}
        />
      ))}
      <circle cx={0} cy={0} r={6.2} fill={p.fill} {...ol} />
      <path d="M-5,-1 L5,-1" stroke={IRON} strokeWidth={0} />
    </g>
  );
}

export const Ursa: HeroArt = ({ anim, t, dur, team }) => {
  const m = motion(anim, t, dur, 1.4, 0.55);
  const k = m.atk;
  const c = m.cast;
  const breathe = anim === 'idle' ? Math.sin(m.ph) : 0;

  let frontA = -25 + m.sway * (m.walking ? -16 : 3);
  let backA = 10 + m.sway * (m.walking ? 16 : -3);
  let lean = 6 + m.lean;
  let dx = 0;
  let scale = 1;
  let rage = 0;
  let roar = 0;
  let headTilt = breathe * 1.5;
  // two swipes: front claw strikes at ~0.5, back claw follows at ~0.72
  const k2 = seg(k, 0.25, 1);
  if (anim === 'attack') {
    frontA = swing(k, -25, -200, -30);
    backA = k < 0.5 ? lerp(10, 40, smooth(k / 0.5)) : swing(seg(k2, 0.2, 1), 40, 140, -100);
    lean = 6 + swing(k, 0, -6, 14);
    dx = lunge(k, 6);
  } else if (anim === 'cast') {
    const up = smooth(seg(c, 0, 0.4));
    const end = 1 - seg(c, 0.85, 1);
    rage = Math.min(1, c * 1.6) * end;
    scale = 1 + 0.16 * smooth(seg(c, 0.2, 0.55)) * end;
    frontA = lerp(-25, -150, up * end);
    backA = lerp(10, 150, up * end);
    lean = lerp(6, -8, up * end);
    roar = up * end;
    headTilt = -14 * up * end;
  } else if (anim === 'hurt') {
    frontA = 20 + m.sway * 6;
    backA = 35 - m.sway * 6;
    headTilt = 12;
  } else if (anim === 'dead') {
    frontA = lerp(-25, -130, smooth(t / 0.6));
    backA = lerp(10, -110, smooth(t / 0.6));
  }
  const by = m.bob;
  const eyeR = 1.5 + rage * 1.2;
  const trail1 = anim === 'attack' ? (k < 0.42 ? 0 : k < 0.55 ? 1 : 1 - seg(k, 0.55, 0.72)) : 0;
  const trail2 = anim === 'attack' ? (k < 0.66 ? 0 : k < 0.76 ? 1 : 1 - seg(k, 0.76, 0.92)) : 0;

  return (
    <HeroFrame anim={anim} t={t} team={team} headY={-80} width={24}>
      {rage > 0 && <Rings x={0} y={-2} k={c} r={40} color={RAGE} n={2} flat={0.35} />}
      <g transform={`translate(${f(dx)},0) scale(${f(scale)})`}>
        {rage > 0 && <ellipse cx={0} cy={-36} rx={f(32 + Math.sin(t * 30) * 2)} ry={f(40 + Math.sin(t * 25) * 2)} fill={RAGE} opacity={f(0.22 * rage)} />}
        {/* legs */}
        <Rot x={-8} y={-18 + by * 0.6} a={m.legA}>
          <Limb len={14} w0={13} w1={11} fill={FUR_SH} />
          <ellipse cx={3} cy={15} rx={7.5} ry={4} fill={FUR_SH} {...ol} />
          <path d="M8,14 L11,15.5 M8,16.5 L10.5,18" stroke={CLAW_SH} strokeWidth={1.4} strokeLinecap="round" />
        </Rot>
        <Rot x={6} y={-18 + by * 0.6} a={m.legB}>
          <Limb len={14} w0={13} w1={11} fill={FUR} />
          <ellipse cx={3} cy={15} rx={7.5} ry={4} fill={FUR} {...ol} />
          <path d="M8,14 L11,15.5 M8,16.5 L10.5,18" stroke={CLAW} strokeWidth={1.4} strokeLinecap="round" />
        </Rot>
        <g transform={`translate(0,${f(by)}) rotate(${f(lean)},0,-18)`}>
          {/* back arm */}
          <ClawTrail cx={-6} cy={-50} r={40} a0={140} a1={backA} opacity={trail2} color="#ffb2a2" />
          <Rot x={-6} y={-50} a={backA}>
            <Limb len={20} w0={13} w1={11} fill={FUR_SH} />
            <rect x={-6} y={11} width={12} height={6} rx={1.5} fill={IRON} {...ol} />
            <g transform="translate(0,22) scale(1.3)">
              <Paw fill={FUR_SH} spread={rage} />
            </g>
          </Rot>
          {/* body: big fur barrel */}
          <path d="M-20,-46 C-20,-60 -6,-64 6,-62 C18,-60 24,-50 22,-36 C21,-24 16,-15 4,-13 C-8,-11 -18,-16 -21,-26 C-23,-34 -22,-40 -20,-46Z" fill={FUR} {...ol} />
          <path d="M-20,-46 C-22,-40 -23,-34 -21,-26 C-18,-16 -8,-11 2,-13 C-8,-18 -13,-30 -12,-50 C-12,-56 -10,-60 -6,-62 C-14,-61 -19,-54 -20,-46Z" fill={FUR_SH} />
          {/* chest fur tufts */}
          <path d="M8,-46 C14,-44 18,-38 18,-30 L15,-32 L14,-27 L11,-30 L9,-25 L7,-29 C5,-35 5,-42 8,-46Z" fill={FUR_HI} {...ol} strokeWidth={1.1} />
          {/* armor: belt + chest strap + shoulder plate */}
          <path d="M-20,-24 C-10,-20 8,-20 20,-26 L19,-19 C8,-14 -10,-14 -19,-18Z" fill={STRAP} {...ol} />
          <rect x={2} y={-23} width={7} height={7} rx={1.2} fill={IRON_HI} {...ol} />
          <path d="M-16,-56 C-6,-46 6,-34 18,-26" fill="none" stroke={OUT} strokeWidth={4.6} strokeLinecap="round" />
          <path d="M-16,-56 C-6,-46 6,-34 18,-26" fill="none" stroke={STRAP} strokeWidth={2.8} strokeLinecap="round" />
          {/* back fur spikes */}
          <path d="M-20,-46 L-25,-48 L-21,-40 L-26,-38 L-21,-32" fill={FUR_SH} {...ol} strokeWidth={1.2} />
          {/* head */}
          <g transform={`translate(11,${f(-65 + breathe * -0.6)}) rotate(${f(headTilt)}) scale(1.2)`}>
            {/* ears */}
            <circle cx={-7} cy={-10} r={4.6} fill={FUR_SH} {...ol} />
            <circle cx={-7} cy={-10} r={2} fill={MUZZLE} />
            <circle cx={1} cy={-13} r={4.6} fill={FUR} {...ol} />
            <circle cx={1} cy={-13} r={2} fill={MUZZLE} />
            <path d="M-12,-1 C-13,-10 -6,-14 2,-14 C10,-14 14,-8 14,-2 C14,5 8,10 0,10 C-8,10 -12,6 -12,-1Z" fill={FUR} {...ol} />
            <path d="M-12,-1 C-12,6 -8,10 0,10 C-5,6 -6,-2 -3,-13 C-9,-12 -12,-7 -12,-1Z" fill={FUR_SH} />
            {/* helmet plate */}
            <path d="M-6,-12 C0,-16 9,-14 12,-8 L8,-6 C4,-9 -1,-10 -5,-7Z" fill={IRON} {...ol} strokeWidth={1.2} />
            <path d="M-2,-12.5 C2,-13.5 6,-13 9,-11" stroke={IRON_HI} strokeWidth={1} fill="none" />
            {/* snout */}
            <path d="M7,-3 C12,-5 19,-3 20,1 C21,5 17,8 11,8 C7,8 5,4 7,-3Z" fill={MUZZLE} {...ol} />
            <ellipse cx={19} cy={-0.5} rx={2.4} ry={1.8} fill={OUT} />
            {roar > 0.05 ? (
              <g>
                <path d={`M9,5 L19,${f(4 + roar)} L17,${f(8 + roar * 4)} C14,${f(10 + roar * 3)} 10,${f(9 + roar * 2)} 9,5Z`} fill="#4a0f0c" {...ol} strokeWidth={1.1} />
                <path d={`M12,5 L13,7 L14,5 M16,5 L17,7 L18,5`} fill="none" stroke="#fff" strokeWidth={0.9} />
              </g>
            ) : (
              <path d="M10,5 C13,6.5 16,6 18,4.5" fill="none" stroke={OUT} strokeWidth={1.1} strokeLinecap="round" />
            )}
            {/* angry glowing eye */}
            <Glow x={6.5} y={-4.5} r={eyeR} color={EYE} core="#ffd6c8" opacity={0.95} />
            <path d="M2,-8 L10.5,-5" stroke={OUT} strokeWidth={2.2} strokeLinecap="round" />
          </g>
          {/* front arm */}
          <ClawTrail cx={4} cy={-49} r={42} a0={-200} a1={frontA} opacity={trail1} color="#ffb2a2" />
          <Rot x={4} y={-49} a={frontA}>
            <Limb len={20} w0={14} w1={12} fill={FUR} shade={FUR_SH} />
            <rect x={-6.5} y={11} width={13} height={6.5} rx={1.5} fill={IRON} {...ol} />
            <path d="M-5,13 L5,13" stroke={IRON_HI} strokeWidth={1} />
            <g transform="translate(0,22) scale(1.3)">
              <Paw fill={FUR} spread={rage} />
            </g>
            {/* shoulder plate */}
            <path d="M-8,-3 C-8,-11 8,-11 9,-3 C9,2 6,5 0,5 C-6,5 -9,2 -8,-3Z" fill={IRON} {...ol} />
            <path d="M-4,-7 C0,-8.5 4,-7.5 6,-5" fill="none" stroke={IRON_HI} strokeWidth={1.3} />
            <path d="M-3,-8 L-1,-14 L1,-8 M2,-7.5 L5,-12 L5.5,-6" fill={CLAW} {...ol} strokeWidth={1} />
          </Rot>
          {anim === 'attack' && hitFlash(k) > 0 && <Glow x={36} y={-30} r={2 + 5 * hitFlash(k)} color="#ffc0a8" opacity={hitFlash(k)} />}
          {anim === 'attack' && bump(seg(k, 0.68, 0.86)) > 0 && <Glow x={33} y={-34} r={2 + 4 * bump(seg(k, 0.68, 0.86))} color="#ffc0a8" opacity={bump(seg(k, 0.68, 0.86))} />}
          {rage > 0.3 &&
            [0, 1, 2].map((i) => {
              const q = (t * 1.6 + i / 3) % 1;
              return <path key={i} d={`M${-14 + i * 12},${f(-58 - q * 22)} q2,-3 0,-6 q-2,-3 0,-6`} fill="none" stroke={RAGE} strokeWidth={1.6} opacity={f((1 - q) * rage)} strokeLinecap="round" />;
            })}
        </g>
      </g>
    </HeroFrame>
  );
};
