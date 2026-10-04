import type { ReactNode } from 'react';
import type { HeroArt } from '../types.ts';
import { Glow, HeroFrame, Limb, OUT, RuneCircle, Rot, arcPt, bump, easeOut, f, lerp, motion, ol, seg, smooth, swing } from './parts1.tsx';

const ROBE = '#3d4f9e';
const ROBE_HI = '#5b73c8';
const ROBE_SH = '#27357a';
const INNER = '#6a43b0';
const TRIM = '#d9b44a';
const PLATE = '#a3b0cf';
const PLATE_HI = '#d3dbef';
const PLATE_SH = '#6c7899';
const SKIN = '#8fa0c8';
const EYE = '#efe0ff';
const ARCANE = '#b47cff';
const BLADE = '#dbe2f0';

function Glaive(p: { glow: number }) {
  // centred on (0,0), blades spread along x
  return (
    <g>
      {p.glow > 0 && <ellipse cx={0} cy={0} rx={20} ry={8} fill={ARCANE} opacity={f(0.35 * p.glow)} />}
      <path d="M-18,4 C-14,-7 -4,-8 0,-3 C4,-8 14,-7 18,4 C12,-2 6,-2 0,3 C-6,-2 -12,-2 -18,4Z" fill={BLADE} {...ol} strokeWidth={1.3} />
      <path d="M-15,1 C-11,-4 -5,-5 -2,-3 M15,1 C11,-4 5,-5 2,-3" fill="none" stroke={ARCANE} strokeWidth={1.2} />
      <circle cx={0} cy={0} r={2.6} fill={INNER} stroke={OUT} strokeWidth={1} />
      <circle cx={-0.6} cy={-0.6} r={0.9} fill={EYE} />
    </g>
  );
}

export const Silencer: HeroArt = ({ anim, t, dur, team }) => {
  const m = motion(anim, t, dur, 1.8, 0.65);
  const k = m.atk;
  const c = m.cast;
  const breathe = anim === 'idle' ? Math.sin(m.ph) : 0;

  let upperA = -10 + m.sway * (m.walking ? -10 : 2);
  let foreA = -40 + breathe * 3;
  let backA = 14 + m.sway * (m.walking ? 12 : -2);
  let lean = m.lean * 0.6;
  let headTilt = breathe;
  let glaiveSpin = breathe * 4;
  let glaiveInHand = true;
  let glaiveGlow = 0;
  let hush = 0;
  if (anim === 'attack') {
    upperA = swing(k, -10, 120, -85);
    foreA = swing(k, -40, 40, -10);
    backA = swing(k, 14, -30, 40);
    lean = swing(k, 0, -8, 10);
    glaiveSpin = k < 0.42 ? -k * 300 : -126;
    glaiveGlow = Math.min(1, k * 2.2);
    glaiveInHand = k < 0.5 || k > 0.88;
  } else if (anim === 'cast') {
    const up = smooth(seg(c, 0, 0.3));
    const end = 1 - seg(c, 0.88, 1);
    hush = up * end;
    upperA = lerp(-10, -40, hush);
    foreA = lerp(-40, -145, hush);
    backA = lerp(14, 70, hush);
    headTilt = -4 * hush;
  } else if (anim === 'hurt') {
    upperA = 20 + m.sway * 6;
    foreA = 10;
    backA = 30 - m.sway * 6;
    headTilt = 10;
  } else if (anim === 'dead') {
    upperA = lerp(-10, -130, smooth(t / 0.6));
    foreA = lerp(-40, 0, smooth(t / 0.6));
    backA = lerp(14, -110, smooth(t / 0.6));
  }
  const by = m.bob;
  const hem = Math.sin(m.ph * (m.walking ? 1 : 1) + 1) * (m.walking ? 2.5 : 1.2);

  // flying glaive (attack release)
  let flying: ReactNode = null;
  if (anim === 'attack' && !glaiveInHand) {
    const q = seg(k, 0.5, 0.88);
    const [hx, hy] = arcPt(4, -55, 24, -85);
    const x = hx + easeOut(q) * 34 - seg(q, 0.6, 1) * 30;
    const y = hy + 2 + Math.sin(q * Math.PI) * -4;
    flying = (
      <g>
        <path d={`M${f(hx)},${f(hy + 2)} Q${f((hx + x) / 2)},${f(hy - 6)} ${f(x)},${f(y)}`} fill="none" stroke={ARCANE} strokeWidth={3} opacity={f(0.5 * (1 - q))} strokeLinecap="round" />
        <g transform={`translate(${f(x)},${f(y)}) rotate(${f(q * 1080)}) scale(0.8)`}>
          <Glaive glow={1} />
        </g>
      </g>
    );
  }

  // hush wave arcs + glyph
  const waves: ReactNode[] = [];
  if (anim === 'cast') {
    for (let i = 0; i < 3; i++) {
      const q = seg(c, 0.35 + i * 0.12, 0.75 + i * 0.1);
      if (q <= 0 || q >= 1) continue;
      const r = 8 + q * 40;
      const [x0, y0] = [16 + r * Math.cos(-0.9), -62 + r * Math.sin(-0.9)];
      const [x1, y1] = [16 + r * Math.cos(0.9), -62 + r * Math.sin(0.9)];
      waves.push(<path key={i} d={`M${f(x0)},${f(y0)} A${f(r)},${f(r)} 0 0 1 ${f(x1)},${f(y1)}`} fill="none" stroke={ARCANE} strokeWidth={f(3.5 * (1 - q) + 0.6)} opacity={f(1 - q)} strokeLinecap="round" />);
    }
  }
  const glyphK = anim === 'cast' ? seg(c, 0.2, 0.6) : 0;
  const glyphFlash = anim === 'cast' ? bump(seg(c, 0.5, 0.85)) : 0;
  const glyphFade = anim === 'cast' ? 1 - seg(c, 0.85, 1) : 0;

  return (
    <HeroFrame anim={anim} t={t} team={team} headY={-90} width={19}>
      {anim === 'cast' && <RuneCircle x={0} y={0} r={30} k={c} color={ARCANE} spin={-t * 2} sides={5} />}
      {/* feet peeking under robe */}
      <Rot x={-4} y={-6} a={m.legA * 0.5}>
        <ellipse cx={2} cy={6} rx={5.5} ry={2.8} fill={PLATE_SH} {...ol} />
      </Rot>
      <Rot x={5} y={-6} a={m.legB * 0.5}>
        <ellipse cx={2} cy={6} rx={5.5} ry={2.8} fill={PLATE} {...ol} />
      </Rot>
      <g transform={`translate(0,${f(by)}) rotate(${f(lean)},0,-10)`}>
        {/* back arm */}
        <Rot x={-6} y={-55} a={backA}>
          <Limb len={22} w0={8} w1={7} fill={ROBE_SH} />
          <circle cx={0} cy={23} r={3.4} fill={SKIN} {...ol} />
        </Rot>
        {/* robe */}
        <path d={`M-10,-56 C-12,-40 -15,-20 ${f(-18 + hem)},-1 L${f(-10 + hem)},1 L-2,-1 L6,1 L${f(15 + hem * 0.5)},0 C14,-20 12,-40 10,-56Z`} fill={ROBE} {...ol} />
        <path d={`M-10,-56 C-12,-40 -15,-20 ${f(-18 + hem)},-1 L${f(-10 + hem)},1 L-5,0 C-6,-20 -5,-40 -3,-56Z`} fill={ROBE_SH} />
        <path d={`M2,-48 C6,-36 8,-18 8,0 L${f(15 + hem * 0.5)},0 C14,-20 12,-40 10,-56Z`} fill={INNER} {...ol} />
        <path d={`M3,-46 C7,-34 8,-18 8,0`} fill="none" stroke={TRIM} strokeWidth={1.4} />
        <path d={`M${f(-18 + hem)},-1 L${f(-10 + hem)},1 L-2,-1 L6,1 L${f(15 + hem * 0.5)},0`} fill="none" stroke={TRIM} strokeWidth={1.6} strokeLinejoin="round" />
        {/* belt */}
        <path d="M-12,-34 L12,-34 L12,-29 L-12,-29Z" fill={ROBE_SH} {...ol} />
        <path d="M2,-36 L6,-31.5 L2,-27 L-2,-31.5Z" fill={TRIM} {...ol} strokeWidth={1} />
        <circle cx={2} cy={-31.5} r={1.2} fill={ARCANE} />
        {/* hood + face */}
        <g transform={`translate(4,${f(-66 + breathe * -0.6)}) rotate(${f(headTilt)}) scale(1.1)`}>
          <path d="M-11,6 C-13,-4 -9,-14 -4,-18 C-6,-22 -8,-26 -12,-28 C-2,-28 8,-22 11,-12 C14,-4 14,4 11,8 L-6,10Z" fill={ROBE} {...ol} />
          <path d="M-11,6 C-13,-4 -9,-14 -4,-18 C-6,-22 -8,-26 -12,-28 C-6,-26 -2,-20 -2,-12 C-3,-4 -2,4 -1,9 L-6,10Z" fill={ROBE_SH} />
          <path d="M-4,-18 C2,-18 8,-14 10,-8" fill="none" stroke={ROBE_HI} strokeWidth={1.4} strokeLinecap="round" />
          {/* face opening */}
          <path d="M1,-10 C7,-11 12,-6 12,0 C12,5 9,8 4,8 C1,5 -1,-5 1,-10Z" fill="#141029" {...ol} strokeWidth={1.2} />
          <path d="M4,-7 C8,-8 11,-4 11,1 C10,4 8,6 5,6 C3,3 2.5,-3 4,-7Z" fill={SKIN} />
          <path d="M5,-3 L11,-3.6" stroke={OUT} strokeWidth={2.4} strokeLinecap="round" />
          <path d="M6,-3.1 L10.6,-3.6" stroke={EYE} strokeWidth={1.2} strokeLinecap="round" />
          {(hush > 0 || glaiveGlow > 0) && <Glow x={9} y={-3.4} r={1.2 + hush * 1.2} color={ARCANE} core={EYE} opacity={0.8} />}
          <path d="M7,3 L10.5,2.6" stroke={OUT} strokeWidth={0.9} strokeLinecap="round" />
          <path d="M-7,6 C-2,10 6,10 12,7 L10,12 C4,14 -4,13 -8,10Z" fill={TRIM} {...ol} strokeWidth={1.1} />
        </g>
        {/* shoulder pauldrons */}
        <path d="M-15,-52 C-15,-60 -4,-62 0,-56 C-2,-52 -8,-50 -15,-52Z" fill={PLATE_SH} {...ol} />
        {/* front arm (2 segments) + glaive */}
        <Rot x={4} y={-55} a={upperA}>
          <Limb len={12} w0={8} w1={7} fill={ROBE} />
          <Rot x={0} y={12} a={foreA - upperA * 0}>
            <Limb len={11} w0={7} w1={6.5} fill={ROBE} shade={ROBE_SH} />
            <path d="M-3.6,6 L3.6,6 L3.8,10 L-3.8,10Z" fill={TRIM} {...ol} strokeWidth={1} />
            {hush > 0.05 && <path d="M0,12 L0,18" stroke={OUT} strokeWidth={3.4} strokeLinecap="round" />}
            {hush > 0.05 && <path d="M0,12 L0,18" stroke={SKIN} strokeWidth={1.8} strokeLinecap="round" />}
            <circle cx={0} cy={12} r={3.6} fill={SKIN} {...ol} />
            {glaiveInHand && hush < 0.05 && (
              <g transform={`translate(0,13) rotate(${f(90 + glaiveSpin)})`}>
                <Glaive glow={glaiveGlow} />
              </g>
            )}
          </Rot>
          <path d="M-8,-1 C-9,-9 7,-11 9,-3 C9,2 4,4 0,4 C-5,4 -8,3 -8,-1Z" fill={PLATE} {...ol} />
          <path d="M-4,-6 C0,-8 4,-7 6,-4" fill="none" stroke={PLATE_HI} strokeWidth={1.4} strokeLinecap="round" />
          <circle cx={0.5} cy={-1} r={1.6} fill={ARCANE} stroke={OUT} strokeWidth={0.8} />
        </Rot>
        {flying}
        {waves}
      </g>
      {glyphK > 0 && glyphFade > 0 && (
        <g transform={`translate(18,-92) scale(${f(0.4 + easeOut(glyphK) * 0.6 + glyphFlash * 0.25)})`} opacity={f(glyphFade)}>
          <circle r={9} fill={ARCANE} opacity={f(0.25 + glyphFlash * 0.35)} />
          <circle r={8} fill="none" stroke={ARCANE} strokeWidth={1.8} />
          <path d="M-5,2 C-2,5 2,5 5,2" fill="none" stroke={EYE} strokeWidth={1.6} strokeLinecap="round" />
          <path d="M0,-6 L0,5" stroke={EYE} strokeWidth={1.8} strokeLinecap="round" />
          <path d="M-6,-6 L6,6" stroke={ARCANE} strokeWidth={1.4} strokeLinecap="round" opacity={0.9} />
        </g>
      )}
    </HeroFrame>
  );
};
