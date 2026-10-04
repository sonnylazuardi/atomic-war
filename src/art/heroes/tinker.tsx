import type { HeroArt } from '../types.ts';
import { bump, clamp01, lerp, loop } from '../types.ts';
import { Blob, Frame, Glow, Limb, arm, dirPt, olp, pose, pts, r2 } from './parts2.tsx';

const Y = '#f2a33a';
const Y_D = '#c8731f';
const Y_L = '#ffd27a';
const MET = '#6b707c';
const MET_D = '#3c3f48';
const SKIN = '#f2cfa6';
const SKIN_D = '#d3a57a';
const GLASS = '#7fe9ff';
const LASER = '#ff5a3a';

export const Tinker: HeroArt = ({ anim, t, dur, team }) => {
  const p = pose(anim, t, dur, 1.4, 0.5);
  const tt = p.t;
  const recoil = anim === 'attack' ? -2.5 * p.flash : 0;
  const ant = Math.sin(tt * 3.2) * 4 + (p.walking ? Math.sin(p.wph * 2) * 5 - 6 : 0) + (p.hurt ? Math.sin(tt * 20) * 8 : 0);

  const [bl, fl] = legs2(p);

  // claw arm
  let a1 = 25 + p.breathe * 4;
  let a2 = 70;
  if (p.walking) {
    a1 = 15 - Math.sin(p.wph) * 18;
    a2 = 60 - Math.sin(p.wph) * 10;
  } else if (anim === 'attack') {
    a1 = 25 - 20 * p.charge;
    a2 = 70 - 30 * p.charge;
  } else if (anim === 'cast') {
    a1 = lerp(25, 130, p.raise);
    a2 = lerp(70, 160, p.raise);
  } else if (p.hurt) {
    a1 = -20;
    a2 = 20;
  }
  const ca = arm(10, -33, a1, a2, 8, 8);
  const pinch = anim === 'idle' ? 10 + Math.max(0, Math.sin(tt * 3)) * 18 : anim === 'cast' ? 30 * p.raise : 12;
  const [c1x, c1y] = dirPt(ca.hx, ca.hy, a2 - pinch, 7);
  const [c2x, c2y] = dirPt(ca.hx, ca.hy, a2 + pinch, 7);
  const [c1t, c1u] = dirPt(c1x, c1y, a2 + 30, 3);
  const [c2t, c2u] = dirPt(c2x, c2y, a2 - 30, 3);

  // laser emitter on shoulder
  const lx = 22;
  const ly = -44;
  const charge = anim === 'attack' ? p.charge : 0;
  const beamO = anim === 'attack' ? p.flash : 0;
  const beamW = 3.8 + Math.sin(tt * 90) * 0.8;

  // backpack lights
  const fast = anim === 'cast' ? Math.floor(tt * 16) : Math.floor(tt * 3);
  const light = (i: number) => ((fast + i) % 2 === 0 ? 1 : 0.25);

  // rockets during cast
  const rockets =
    anim === 'cast'
      ? [0, 1, 2].map((i) => {
          const q = clamp01((p.k - 0.25 - i * 0.12) / 0.45);
          if (q <= 0 || q >= 1) return null;
          const x = -16 + i * 3.5 - q * (8 - i * 6);
          const y = -50 - q * 45;
          return (
            <g key={i} opacity={r2(1 - q * 0.3)}>
              <Blob c={[[x, y + 8, 2.5 + q * 2], [x + 1, y + 13, 2 + q * 2.5]]} fill="#e7e2da" ow={1.5} />
              <path d={`M${r2(x)},${r2(y + 3)} l-2,4 l2,-1.5 l2,1.5 Z`} fill="#ffd23d" />
              <path d={`M${r2(x - 1.6)},${r2(y + 3)} L${r2(x - 1.6)},${r2(y - 2)} L${r2(x)},${r2(y - 5)} L${r2(x + 1.6)},${r2(y - 2)} L${r2(x + 1.6)},${r2(y + 3)} Z`} {...olp('#e8e8ee', 1)} />
              <path d={`M${r2(x - 1.6)},${r2(y - 2)} L${r2(x)},${r2(y - 5)} L${r2(x + 1.6)},${r2(y - 2)} Z`} fill="#e5484d" />
            </g>
          );
        })
      : null;

  return (
    <Frame p={p} team={team} headY={-80} rx={17}>
      {bl}
      <g transform={`translate(${r2(recoil)},${r2(p.bob)}) rotate(${r2(p.lean * 0.6)},0,-18)`}>
        {/* antennae */}
        {[
          [-16, -46, -21 + ant * 0.4, -78],
          [-11, -46, -7 + ant * 0.6, -72],
        ].map(([x1, y1, x2, y2], i) => (
          <g key={i}>
            <path d={`M${x1},${y1} Q${r2((x1 + x2) / 2 - 2)},${r2((y1 + y2) / 2)} ${r2(x2)},${r2(y2)}`} fill="none" stroke="#14110f" strokeWidth={2.4} strokeLinecap="round" />
            <path d={`M${x1},${y1} Q${r2((x1 + x2) / 2 - 2)},${r2((y1 + y2) / 2)} ${r2(x2)},${r2(y2)}`} fill="none" stroke="#9aa0ad" strokeWidth={0.9} strokeLinecap="round" />
            <circle cx={r2(x2)} cy={r2(y2)} r={2.2} {...olp(i ? '#5fffa0' : '#ff4a4a', 1.1)} opacity={r2(0.4 + 0.6 * light(i))} />
            <Glow x={x2} y={y2} r={4.5} c={i ? '#5fffa0' : '#ff4a4a'} o={light(i) * 0.8} />
          </g>
        ))}
        {/* backpack + rocket tubes */}
        <rect x={-21} y={-47} width={13} height={27} rx={3} {...olp(MET_D)} />
        <rect x={-19.5} y={-44} width={4} height={20} rx={1.5} fill={Y_D} />
        <rect x={-20} y={-52} width={5} height={7} rx={1} {...olp(MET, 1.4)} />
        <rect x={-14.5} y={-51} width={5} height={6} rx={1} {...olp(MET, 1.4)} />
        <ellipse cx={-17.5} cy={-52} rx={2.5} ry={0.9} fill="#14110f" />
        <ellipse cx={-12} cy={-51} rx={2.5} ry={0.9} fill="#14110f" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={-13} cy={-40 + i * 5} r={1.3} fill={['#ff4a4a', '#ffd23d', '#5fffa0'][i]} opacity={r2(light(i + 1))} />
        ))}
        {anim === 'cast' ? <Glow x={-14} y={-40} r={8 + p.cflash * 8} c="#ffd23d" o={0.4 + light(0) * 0.5} /> : null}
        {/* chassis */}
        <path d="M-11,-41 Q-11,-44 -7,-44 L10,-44 Q14,-44 14,-40 L15,-24 Q15,-17 9,-17 L-7,-17 Q-12,-17 -12,-23 Z" {...olp(Y, 1.8)} />
        <path d="M-11,-41 Q-11,-44 -7,-44 L-4,-44 L-5,-17 L-7,-17 Q-12,-17 -12,-23 Z" fill={Y_D} />
        <path d="M-2,-42 L10,-42 Q12,-42 12,-40" fill="none" stroke={Y_L} strokeWidth={1.4} strokeLinecap="round" />
        <rect x={0} y={-28} width={11} height={6} rx={1.5} {...olp(MET_D, 1.2)} />
        {[2, 5, 8].map((x) => (
          <line key={x} x1={x + 0.5} y1={-27} x2={x + 0.5} y2={-23} stroke={MET} strokeWidth={1} />
        ))}
        <circle cx={5} cy={-35} r={2.6} {...olp(GLASS, 1.2)} />
        <Glow x={5} y={-35} r={5 + (anim === 'cast' ? p.glow * 5 : 0)} c={GLASS} o={0.7} />
        {[-8, 12].map((x) => (
          <circle key={x} cx={x} cy={-20.5} r={0.9} fill={MET_D} />
        ))}
        {/* head: ear, hair, face, goggles */}
        <path d="M-3,-53 Q-12,-60 -17,-63 Q-13,-54 -4,-47 Z" {...olp(SKIN, 1.5)} />
        <path d="M-5,-52 Q-11,-57 -14,-60 Q-11,-54 -5,-49 Z" fill={SKIN_D} />
        <Blob c={[[-4, -48, 3], [-6, -52, 2.6], [-2, -46, 2.5]]} fill="#f4f4f4" ow={2.4} />
        <circle cx={4} cy={-52} r={9.5} {...olp(SKIN)} />
        <path d="M-4,-48 Q-2,-44 3,-43 Q-3,-47 -3,-52 Z" fill={SKIN_D} />
        <path d="M-5,-55 Q4,-60 13,-55" fill="none" stroke="#14110f" strokeWidth={3.2} />
        <path d="M-5,-55 Q4,-60 13,-55" fill="none" stroke="#5a3b22" strokeWidth={1.8} />
        <circle cx={5} cy={-54.5} r={3.2} {...olp('#c9a04a', 1.4)} />
        <circle cx={5} cy={-54.5} r={2} fill={GLASS} />
        <circle cx={11} cy={-54.5} r={3.8} {...olp('#c9a04a', 1.4)} />
        <circle cx={11} cy={-54.5} r={2.5} fill={GLASS} />
        <circle cx={11.8} cy={-55.4} r={0.8} fill="#fff" />
        <path d="M14.5,-50 Q15.5,-48 13,-47" fill="none" stroke="#14110f" strokeWidth={1.2} strokeLinecap="round" />
        <path d="M7,-46.5 Q10,-45 12,-47 L11,-46 Q9,-45.4 7.6,-46 Z" fill="#fff" stroke="#14110f" strokeWidth={0.9} />
        {/* cockpit rim covering the neck */}
        <path d="M-9,-44 Q3,-40 13,-44 L13,-41 Q3,-37 -9,-41 Z" {...olp(Y_D, 1.3)} />
        {/* laser emitter */}
        <path d="M10,-47 L20,-47 L22,-45.5 L22,-42.5 L20,-41 L10,-41 Z" {...olp(MET, 1.5)} />
        <rect x={9} y={-49} width={5} height={10} rx={1.5} {...olp(Y, 1.3)} />
        <circle cx={22} cy={-44} r={r2(1.6 + charge * 1.4)} fill={LASER} />
        <Glow x={lx} y={ly} r={3 + charge * 9 + beamO * 6} c={LASER} o={anim === 'dead' ? 0 : 0.5 + charge * 0.5} />
        {beamO > 0.02 ? (
          <g opacity={r2(beamO)}>
            <line x1={lx} y1={ly} x2={lx + 80} y2={ly + 6} stroke={LASER} strokeWidth={r2(beamW * 2.4)} strokeLinecap="round" opacity={0.35} />
            <line x1={lx} y1={ly} x2={lx + 80} y2={ly + 6} stroke={LASER} strokeWidth={r2(beamW)} strokeLinecap="round" />
            <line x1={lx} y1={ly} x2={lx + 80} y2={ly + 6} stroke="#fff3e0" strokeWidth={r2(beamW * 0.35)} strokeLinecap="round" />
            <Glow x={lx + 80} y={ly + 6} r={10} c="#ffb070" />
          </g>
        ) : null}
        {/* claw arm */}
        <Limb p={[[ca.sx, ca.sy], [ca.ex, ca.ey], [ca.hx, ca.hy]]} w={4.4} c={MET} />
        <circle cx={r2(ca.ex)} cy={r2(ca.ey)} r={2.6} {...olp(Y, 1.2)} />
        <circle cx={r2(ca.sx)} cy={r2(ca.sy)} r={3.6} {...olp(Y, 1.4)} />
        <path d={`M${pts([[ca.hx, ca.hy], [c1x, c1y], [c1t, c1u]])}`} fill="none" stroke="#14110f" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${pts([[ca.hx, ca.hy], [c1x, c1y], [c1t, c1u]])}`} fill="none" stroke="#b9bfca" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${pts([[ca.hx, ca.hy], [c2x, c2y], [c2t, c2u]])}`} fill="none" stroke="#14110f" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${pts([[ca.hx, ca.hy], [c2x, c2y], [c2t, c2u]])}`} fill="none" stroke="#b9bfca" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={r2(ca.hx)} cy={r2(ca.hy)} r={2.2} {...olp(MET_D, 1.2)} />
        {rockets}
        {anim === 'cast' && p.cflash > 0.05 ? <Glow x={-14} y={-60} r={14 + p.cflash * 14} c="#ffe08a" o={p.cflash} /> : null}
      </g>
      {fl}
      {anim === 'hurt' ? <Sparks t={tt} /> : null}
    </Frame>
  );
};

function Sparks({ t }: { t: number }) {
  const q = loop(t, 0.5);
  return (
    <g opacity={r2(bump(q))}>
      {[0, 1, 2].map((i) => {
        const [x, y] = dirPt(-6, -36, 120 + i * 50, 6 + q * 8);
        return <line key={i} x1={-6} y1={-36} x2={r2(x)} y2={r2(y)} stroke="#ffd23d" strokeWidth={1} strokeLinecap="round" />;
      })}
    </g>
  );
}

function legs2(p: ReturnType<typeof pose>) {
  const mk = (side: number) => {
    const hx = side * 5;
    const hy = -18 + p.bob;
    let fx = hx + side * 1.5;
    let fy = 0;
    if (p.walking) {
      const ph = p.wph + (side > 0 ? 0 : Math.PI);
      fx = hx + Math.sin(ph) * 6;
      fy = -Math.max(0, Math.cos(ph)) * 3.5;
    }
    const kx = lerp(hx, fx, 0.5) + 3;
    const ky = lerp(hy, fy, 0.5) - 1;
    const c = side > 0 ? MET : MET_D;
    return (
      <g>
        <Limb p={[[hx, hy], [kx, ky], [fx, fy - 2]]} w={6} c={c} />
        <circle cx={r2(kx)} cy={r2(ky)} r={2.8} {...olp(side > 0 ? Y : Y_D, 1.3)} />
        <path d={`M${r2(fx - 5)},${r2(fy)} L${r2(fx - 4)},${r2(fy - 4)} L${r2(fx + 4)},${r2(fy - 4)} L${r2(fx + 7)},${r2(fy)} Z`} {...olp(side > 0 ? Y : Y_D, 1.4)} />
      </g>
    );
  };
  return [mk(-1), mk(1)] as const;
}
