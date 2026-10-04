import type { HeroArt } from '../types.ts';
import { Glow, HeroFrame, Limb, OUT, RuneCircle, Rot, Swoosh, bump, f, hitFlash, lerp, lunge, motion, ol, seg, smooth, swing, trailAlpha } from './parts1.tsx';

const SKIN = '#93a47c';
const SKIN_HI = '#b3c296';
const SKIN_SH = '#66774f';
const FLESH = '#b5525a';
const HOOD = '#6b4a33';
const HOOD_SH = '#4b3222';
const APRON = '#d3c49a';
const APRON_SH = '#a8966b';
const BLOOD = '#8f1f1f';
const PANTS = '#4a3a2c';
const METAL = '#c3c8cf';
const METAL_SH = '#7c8490';
const HOOK_GLOW = '#9be35a';

function Hook(p: { glow: number }) {
  // drawn hanging from (0,0) downwards
  const links = [];
  for (let i = 0; i < 4; i++) {
    links.push(<ellipse key={i} cx={0} cy={2 + i * 3.4} rx={i % 2 ? 0.9 : 1.6} ry={2} fill="none" stroke={OUT} strokeWidth={2.4} />);
    links.push(<ellipse key={`h${i}`} cx={0} cy={2 + i * 3.4} rx={i % 2 ? 0.9 : 1.6} ry={2} fill="none" stroke={METAL_SH} strokeWidth={1} />);
  }
  return (
    <g>
      {p.glow > 0 && <Glow x={-3} y={20} r={6 + p.glow * 4} color={HOOK_GLOW} opacity={p.glow} />}
      {links}
      <path d="M-1.6,14 L1.6,14 L1.6,22 C1.6,30 -8.5,31 -9.5,23 L-11.5,19 L-6.5,21.5 C-6,25 -1.6,25 -1.6,21Z" fill={METAL} {...ol} />
      <path d="M0.4,15 L0.4,22 C0.4,27 -5,28 -7,24" fill="none" stroke="#fff" strokeWidth={0.8} opacity={0.7} />
    </g>
  );
}

function Cleaver() {
  return (
    <g>
      <rect x={-1.6} y={-2} width={3.2} height={9} rx={1} fill="#5a3b22" {...ol} />
      <path d="M-8,6 L4,6 L4.5,24 C1,25.5 -5,25.5 -9,24 Z" fill={METAL} {...ol} />
      <path d="M-7.6,7 L-8.6,23.5" stroke="#fff" strokeWidth={1.2} opacity={0.8} />
      <path d="M1,8 L1.3,22" stroke={METAL_SH} strokeWidth={2} />
      <circle cx={1.5} cy={9} r={1.2} fill={OUT} />
      <path d="M-5,18 C-4,20 -2,19 -1,22" stroke={BLOOD} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </g>
  );
}

export const Pudge: HeroArt = ({ anim, t, dur, team }) => {
  const m = motion(anim, t, dur, 1.8, 0.7);
  const k = m.atk;
  const c = m.cast;
  const breathe = anim === 'idle' ? Math.sin(m.ph) : 0;

  // front arm (cleaver)
  let frontA = -12 + m.sway * (m.walking ? -14 : 3);
  let lean = m.lean;
  let dx = 0;
  if (anim === 'attack') {
    frontA = swing(k, -12, -195, -35);
    lean = swing(k, 0, -8, 14);
    dx = lunge(k, 6);
  }
  // back arm (hook)
  let backA = 22 + m.sway * (m.walking ? 16 : 3);
  let hookSpin = Math.sin(m.ph) * 8;
  let hookGlow = 0;
  if (anim === 'cast') {
    backA = c < 0.6 ? lerp(22, 175, smooth(c / 0.45)) : lerp(175, -70, smooth(seg(c, 0.6, 0.75)));
    hookSpin = c < 0.6 ? -backA + c * 1400 : -backA + 840 + seg(c, 0.6, 1) * 90;
    hookGlow = Math.min(1, c * 2.2) * (1 - seg(c, 0.85, 1));
    lean = c < 0.6 ? -4 : lerp(-4, 10, seg(c, 0.6, 0.75));
  } else {
    hookSpin = -backA + hookSpin;
  }
  if (anim === 'hurt') {
    frontA = 30 + m.sway * 6;
    backA = 50 - m.sway * 6;
  }
  if (anim === 'dead') {
    frontA = lerp(-12, -150, smooth(t / 0.6));
    backA = lerp(22, -120, smooth(t / 0.6));
  }
  const by = m.bob;
  const bellyS = 1 + breathe * 0.025;

  return (
    <HeroFrame anim={anim} t={t} team={team} headY={-78} width={24}>
      {anim === 'cast' && <RuneCircle x={0} y={0} r={30} k={c} color={HOOK_GLOW} spin={t * 2} />}
      <g transform={`translate(${f(dx)},0)`}>
        {/* legs */}
        <Rot x={-8} y={-13 + by * 0.5} a={m.legA}>
          <Limb len={11} w0={11} w1={10} fill={PANTS} />
          <ellipse cx={1.5} cy={12} rx={7} ry={3.6} fill={HOOD_SH} {...ol} />
        </Rot>
        <Rot x={7} y={-13 + by * 0.5} a={m.legB}>
          <Limb len={11} w0={11} w1={10} fill={PANTS} />
          <ellipse cx={1.5} cy={12} rx={7} ry={3.6} fill={HOOD_SH} {...ol} />
        </Rot>
        <g transform={`translate(0,${f(by)}) rotate(${f(lean)},0,-12)`}>
          {/* back arm with hook */}
          <Rot x={-9} y={-52} a={backA}>
            <Limb len={22} w0={12} w1={10} fill={SKIN_SH} />
            <circle cx={0} cy={23} r={6} fill={SKIN_SH} {...ol} />
            {c > 0.6 && anim === 'cast' && (
              <Swoosh cx={0} cy={23} r={26} a0={-backA + 700} a1={-backA + 840} width={6} color={HOOK_GLOW} opacity={1 - seg(c, 0.62, 0.8)} />
            )}
            <g transform={`translate(0,23) rotate(${f(hookSpin)})`}>
              <Hook glow={hookGlow} />
            </g>
          </Rot>
          {/* torso */}
          <g transform={`translate(2,-12) scale(${f(bellyS)}) translate(-2,12)`}>
            <path d="M-7,-64 C8,-66 19,-58 23,-46 C31,-32 28,-14 15,-9 C4,-5 -13,-6 -19,-12 C-26,-21 -26,-46 -19,-56 C-16,-61 -12,-64 -7,-64Z" fill={SKIN} {...ol} />
            <path d="M-19,-56 C-26,-46 -26,-21 -19,-12 C-14,-8 -6,-6 0,-6 C-10,-14 -14,-30 -12,-50 C-12,-56 -14,-58 -19,-56Z" fill={SKIN_SH} />
            <ellipse cx={13} cy={-34} rx={10} ry={13} fill={SKIN_HI} opacity={0.8} />
            {/* rotten chunks / exposed flesh */}
            <path d="M-17,-48 C-14,-52 -9,-50 -10,-45 C-11,-41 -17,-42 -17,-48Z" fill={FLESH} {...ol} strokeWidth={1.1} />
            <path d="M-15,-46 L-12,-46" stroke="#e7c5b5" strokeWidth={0.8} />
            <path d="M-20,-30 C-18,-33 -14,-32 -15,-28 C-16,-25 -20,-26 -20,-30Z" fill={FLESH} {...ol} strokeWidth={1.1} />
            {/* stitched seam */}
            <path d="M8,-58 C18,-50 21,-38 18,-26" fill="none" stroke="#2c2a22" strokeWidth={1.2} />
            {[[11, -55], [15, -49], [18, -42], [19, -35], [19, -29]].map(([x, y], i) => (
              <path key={i} d={`M${x - 2.5},${y - 1} L${x + 2.5},${y + 1}`} stroke="#2c2a22" strokeWidth={1.1} strokeLinecap="round" />
            ))}
            <path d="M-4,-40 C-1,-36 -1,-30 -4,-26" fill="none" stroke="#2c2a22" strokeWidth={1.1} />
            {[[-3, -38], [-2, -33], [-3, -28]].map(([x, y], i) => (
              <path key={i} d={`M${x - 2},${y} L${x + 2},${y}`} stroke="#2c2a22" strokeWidth={1} strokeLinecap="round" />
            ))}
            <path d="M-7,-64 C8,-66 19,-58 23,-46 C31,-32 28,-14 15,-9 C4,-5 -13,-6 -19,-12 C-26,-21 -26,-46 -19,-56 C-16,-61 -12,-64 -7,-64Z" fill="none" {...ol} />
            {/* apron */}
            <g transform={`rotate(${f(m.walking ? Math.sin(m.ph) * 3 : Math.sin(m.ph) * 1)},4,-24)`}>
              <path d="M-11,-25 C0,-28 16,-28 25,-27 C27,-19 25,-11 22,-5 L18,-7 L15,-3 L11,-6 L7,-2 L3,-5 L-1,-2 L-4,-5 L-8,-4 C-11,-10 -12,-17 -11,-25Z" fill={APRON} {...ol} />
              <path d="M-11,-25 C-12,-17 -11,-10 -8,-4 L-4,-5 L-1.5,-3 C-4,-10 -5,-18 -4,-26Z" fill={APRON_SH} />
              <path d="M12,-22 C14,-18 11,-14 14,-11 C16,-8 12,-6 13,-3" fill="none" stroke={BLOOD} strokeWidth={2.4} strokeLinecap="round" opacity={0.85} />
              <circle cx={4} cy={-14} r={2.2} fill={BLOOD} opacity={0.8} />
              <circle cx={19} cy={-6} r={1.4} fill={BLOOD} opacity={0.8} />
              <path d="M-12,-25 C0,-28 16,-28 25,-27" fill="none" stroke={HOOD} strokeWidth={3} strokeLinecap="round" />
            </g>
          </g>
          {/* head: hooded, small, sunken into shoulders */}
          <g transform={`translate(10,${f(-63 + breathe * -0.6)}) scale(1.15)`}>
            <path d="M-12,4 C-14,-8 -7,-17 2,-17 C10,-17 14,-10 13,-1 L10,5 L-4,8Z" fill={HOOD} {...ol} />
            <path d="M-12,4 C-14,-8 -7,-17 0,-17 C-6,-12 -7,-4 -4,8Z" fill={HOOD_SH} />
            <path d="M3,-9 C9,-10 14,-6 13,0 C13,5 9,8 4,8 C0,6 -1,-4 3,-9Z" fill={SKIN} {...ol} />
            <path d="M3,-3 L13,-4" stroke={HOOD} strokeWidth={2.4} />
            <circle cx={8.5} cy={-5.5} r={1.6} fill="#ffe36b" stroke={OUT} strokeWidth={0.7} />
            <path d="M5,2 L13,1.5 L12.5,5 C10,6.5 7,6.5 5,5Z" fill="#3a1d1a" {...ol} strokeWidth={1} />
            <path d="M6,2 L7,4 L8,2 M9,2 L10,4 L11,1.8" fill="#f2ead2" stroke="#f2ead2" strokeWidth={0.6} />
            <path d="M-6,-14 L-4,-11 M-2,-16 L-1,-13" stroke={HOOD_SH} strokeWidth={1} />
          </g>
          {/* front arm with cleaver */}
          {anim === 'attack' && (
            <Swoosh cx={6} cy={-50} r={47} a0={-195} a1={frontA} width={13} color="#e9e2d0" opacity={trailAlpha(k)} />
          )}
          <Rot x={6} y={-50} a={frontA}>
            <Limb len={22} w0={13} w1={10} fill={SKIN} shade={SKIN_SH} />
            <path d="M-5,16 L5,16 L5,20 L-5,20Z" fill={HOOD} {...ol} strokeWidth={1.1} />
            <circle cx={0} cy={23} r={6} fill={SKIN} {...ol} />
            <g transform="translate(0,24)">
              <Cleaver />
            </g>
          </Rot>
          {anim === 'attack' && hitFlash(k) > 0 && <Glow x={40} y={-18} r={3 + 5 * hitFlash(k)} color="#ffd9a0" opacity={hitFlash(k)} />}
          {anim === 'cast' && bump(seg(c, 0.55, 0.85)) > 0 && <Glow x={-9} y={-60} r={4 * bump(seg(c, 0.55, 0.85))} color={HOOK_GLOW} />}
        </g>
      </g>
    </HeroFrame>
  );
};
