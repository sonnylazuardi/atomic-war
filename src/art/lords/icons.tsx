// Square ability icons for lord powers (drawn in a 40x40 box; the bevel frame is CSS).
import type { ReactNode } from 'react';
import type { LordId } from '../../core/types.ts';

const OL = '#14110f';
const o = (fill: string, sw = 1.6) => ({ fill, stroke: OL, strokeWidth: sw, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });

const ICONS: Record<LordId, ReactNode> = {
  alchemist: (
    <g>
      <circle cx={20} cy={22} r={11} fill="#9be33a" opacity={0.25} />
      <path d="M17,6 L23,6 L23,13 Q31,16 31,24 Q31,33 20,33 Q9,33 9,24 Q9,16 17,13 Z" {...o('#dff4ff')} />
      <path d="M10.4,22 Q20,19 29.6,22 Q30,31 20,31.4 Q10,31 10.4,22 Z" fill="#9be33a" />
      <rect x={15.5} y={4} width={9} height={4} rx={1} {...o('#f2c14e', 1.3)} />
      <circle cx={16} cy={25} r={1.6} fill="#fff" opacity={0.8} />
      <circle cx={23} cy={27} r={1} fill="#fff" opacity={0.7} />
      <ellipse cx={31} cy={33} rx={5} ry={2.6} {...o('#f2c14e', 1.2)} />
    </g>
  ),
  pudge_lord: (
    <g>
      <path d="M20,34 C6,25 5,13 12,10 C16,8 19,11 20,14 C21,11 24,8 28,10 C35,13 34,25 20,34 Z" {...o('#c8423e')} />
      <path d="M12,14 Q14,11 17,13" fill="none" stroke="#ff9a90" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M20,16 L20,28 M14,22 L26,22" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" />
    </g>
  ),
  bounty_hunter: (
    <g>
      <path d="M12,16 Q8,26 12,32 Q20,36 28,32 Q32,26 28,16 Z" {...o('#a07a44')} />
      <path d="M13,16 Q20,11 27,16 L25,12 Q20,9 15,12 Z" {...o('#7d5634', 1.3)} />
      <circle cx={20} cy={25} r={5} {...o('#f2c14e', 1.3)} />
      <path d="M20,22 L20,28" stroke="#b8842a" strokeWidth={1.6} />
      <ellipse cx={31} cy={10} rx={3.4} ry={3.4} {...o('#f2c14e', 1.2)} />
      <ellipse cx={9} cy={9} rx={2.6} ry={2.6} {...o('#f2c14e', 1.1)} />
    </g>
  ),
  omniknight: (
    <g>
      <circle cx={20} cy={20} r={13} fill="#fff6c8" opacity={0.35} />
      <rect x={12} y={8} width={16} height={9} rx={1.5} {...o('#d6dde6')} />
      <rect x={11} y={11} width={18} height={3} {...o('#f2c14e', 1.1)} />
      <path d="M20,17 L20,34" stroke={OL} strokeWidth={4.6} strokeLinecap="round" />
      <path d="M20,17 L20,34" stroke="#7a5634" strokeWidth={2.6} strokeLinecap="round" />
      <path d="M7,30 l2,-2 M33,30 l-2,-2 M6,20 l3,0 M34,20 l-3,0" stroke="#fff6c8" strokeWidth={1.8} strokeLinecap="round" />
    </g>
  ),
  tinker_lord: (
    <g>
      <circle cx={20} cy={20} r={10} {...o('#9aa3b0')} strokeDasharray="5 3.2" strokeWidth={5} />
      <circle cx={20} cy={20} r={9} fill="#9aa3b0" />
      <circle cx={20} cy={20} r={4} {...o('#4fa3d1', 1.4)} />
      <path d="M29,7 A16,16 0 0 1 35,21" fill="none" stroke="#7fe9ff" strokeWidth={2} strokeLinecap="round" />
      <path d="M35,21 l-3.4,-2 M35,21 l1.6,-3.6" stroke="#7fe9ff" strokeWidth={2} strokeLinecap="round" />
    </g>
  ),
  axe_lord: (
    <g>
      <path d="M12,34 L26,8" stroke={OL} strokeWidth={5} strokeLinecap="round" />
      <path d="M12,34 L26,8" stroke="#7a5634" strokeWidth={3} strokeLinecap="round" />
      <path d="M21,9 Q31,4 35,13 Q28,13 25,19 Q22,14 21,9 Z" {...o('#d6dde6')} />
      <path d="M22,10 Q17,7 13,11 Q18,13 20,16 Z" {...o('#b9c1cc', 1.3)} />
      <path d="M6,8 l4,3 M5,16 l4,0 M34,28 l-3,-2" stroke="#ff5a3a" strokeWidth={2} strokeLinecap="round" />
    </g>
  ),
  rubick: (
    <g>
      <circle cx={20} cy={20} r={12} fill="#7dffb0" opacity={0.22} />
      <path d="M14,32 L26,10" stroke={OL} strokeWidth={4.4} strokeLinecap="round" />
      <path d="M14,32 L26,10" stroke="#5a3a24" strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={27} cy={9} r={4} {...o('#7dffb0', 1.3)} />
      <path d="M9,13 Q8,8 12,7 M31,26 Q34,28 32,32 M10,26 Q6,27 7,31" fill="none" stroke="#e3c35a" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M33,15 l1.4,-3 l1.4,3 l-1.4,3 Z" fill="#fff" />
    </g>
  ),
  ember_spirit: (
    <g>
      <path d="M9,30 L31,30 L28,25 L22,25 L22,22 L14,22 L14,25 L10,25 Z" {...o('#5b616c')} />
      <path d="M12,34 L28,34 L27,30 L13,30 Z" {...o('#3c3f48', 1.3)} />
      <path d="M20,22 C14,16 17,10 20,5 C21,10 26,12 23,18 C26,16 27,14 27,12 C30,17 27,21 24,22 Z" {...o('#ff6a1f', 1.2)} />
      <path d="M21,21 C19,17 20,13 21,11 C23,15 24,18 22,21 Z" fill="#ffd84a" />
      <path d="M6,12 L13,19" stroke={OL} strokeWidth={4.4} strokeLinecap="round" />
      <path d="M6,12 L13,19" stroke="#7a5634" strokeWidth={2.4} strokeLinecap="round" />
      <rect x={2} y={6} width={9} height={6} rx={1} transform="rotate(45 6.5 9)" {...o('#9aa3b0', 1.3)} />
    </g>
  ),
  naga_siren: (
    <g>
      <path d="M6,26 Q13,20 20,26 T34,26" fill="none" stroke="#9ff5ff" strokeWidth={2.2} strokeLinecap="round" opacity={0.8} />
      <path d="M6,32 Q13,26 20,32 T34,32" fill="none" stroke="#6fd6c4" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      <ellipse cx={15} cy={21} rx={4.6} ry={3.4} transform="rotate(-20 15 21)" {...o('#e8fbff', 1.4)} />
      <path d="M19,20 L19,6 L28,9 L28,17" fill="none" stroke={OL} strokeWidth={3.4} strokeLinejoin="round" />
      <path d="M19,20 L19,6 L28,9 L28,17" fill="none" stroke="#e8fbff" strokeWidth={1.6} strokeLinejoin="round" />
      <ellipse cx={25} cy={18} rx={3.6} ry={2.8} transform="rotate(-20 25 18)" {...o('#e8fbff', 1.3)} />
    </g>
  ),
  spirit_breaker: (
    <g>
      <path d="M4,30 L16,30 M2,24 L14,24 M6,18 L14,18" stroke="#c9b6ff" strokeWidth={2.2} strokeLinecap="round" opacity={0.8} />
      <path d="M16,14 Q24,10 31,14 Q35,22 31,30 Q24,34 17,30 Q14,22 16,14 Z" {...o('#4f5aa8')} />
      <path d="M17,15 Q12,8 6,8 Q10,13 15,19 Z" {...o('#e9e2cc', 1.3)} />
      <path d="M30,15 Q35,8 38,7 Q37,13 32,19 Z" {...o('#e9e2cc', 1.3)} />
      <circle cx={24} cy={29} r={3} fill="none" stroke="#f2c14e" strokeWidth={1.6} />
      <path d="M20,20 L22,21 M28,20 L26,21" stroke="#e6dcff" strokeWidth={1.8} strokeLinecap="round" />
    </g>
  ),
  riki: (
    <g>
      <circle cx={14} cy={26} r={8} fill="#8a7fa0" opacity={0.7} />
      <circle cx={24} cy={28} r={7} fill="#8a7fa0" opacity={0.55} />
      <circle cx={20} cy={20} r={7} fill="#a79cc0" opacity={0.5} />
      <path d="M10,32 L28,8 L31,10 L14,34 Z" {...o('#dfe6ee', 1.4)} />
      <path d="M12,30 L8,26 M14,34 L10,36" stroke={OL} strokeWidth={4} strokeLinecap="round" />
      <path d="M12,30 L8,26 M14,34 L10,36" stroke="#c9a45c" strokeWidth={2} strokeLinecap="round" />
    </g>
  ),
  invoker: (
    <g>
      <circle cx={20} cy={11} r={6} {...o('#6fd3ff', 1.3)} />
      <circle cx={11} cy={27} r={6} {...o('#d07bff', 1.3)} />
      <circle cx={29} cy={27} r={6} {...o('#ff9a3a', 1.3)} />
      <circle cx={18.5} cy={9.5} r={2} fill="#e6f8ff" />
      <circle cx={9.5} cy={25.5} r={2} fill="#f6e6ff" />
      <circle cx={27.5} cy={25.5} r={2} fill="#fff0d0" />
      <circle cx={20} cy={22} r={13} fill="none" stroke="#f2c14e" strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
    </g>
  ),
  sniper_lord: (
    <g>
      <circle cx={20} cy={20} r={11} fill="none" stroke={OL} strokeWidth={4} />
      <circle cx={20} cy={20} r={11} fill="none" stroke="#e8e2d0" strokeWidth={2} />
      <path d="M20,4 L20,14 M20,26 L20,36 M4,20 L14,20 M26,20 L36,20" stroke={OL} strokeWidth={3.6} strokeLinecap="round" />
      <path d="M20,4 L20,14 M20,26 L20,36 M4,20 L14,20 M26,20 L36,20" stroke="#e8e2d0" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={20} cy={20} r={2.4} fill="#ff4a3a" stroke={OL} strokeWidth={1} />
    </g>
  ),
  zeus_lord: (
    <g>
      <circle cx={20} cy={20} r={12} fill="#9fd8ff" opacity={0.3} />
      <path d="M23,3 L11,22 L19,22 L15,37 L30,15 L21,15 L26,3 Z" {...o('#fff6a8', 1.6)} />
      <path d="M22,7 L15,19" stroke="#fff" strokeWidth={1.2} strokeLinecap="round" />
    </g>
  ),
  juggernaut_lord: (
    <g>
      <path d="M9,10 Q20,5 31,10 L30,22 Q27,31 20,35 Q13,31 10,22 Z" {...o('#c8423e')} />
      <path d="M12,12 Q20,8 28,12 L27,21 Q25,28 20,31 Q15,28 13,21 Z" fill="#e5a13a" opacity={0.85} />
      <path d="M20,13 L20,28 M13,20 L27,20" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
      <path d="M20,13 L20,28 M13,20 L27,20" stroke="#5fd068" strokeWidth={1.6} strokeLinecap="round" />
    </g>
  ),
  luna: (
    <g>
      <circle cx={20} cy={20} r={13} fill="#cfe4ff" opacity={0.25} />
      <path d="M22,5 A15,15 0 1 0 22,35 A11,11 0 1 1 22,5 Z" {...o('#e6f0ff', 1.5)} />
      <path d="M30,9 l1.4,3 3,1.4 -3,1.4 -1.4,3 -1.4,-3 -3,-1.4 3,-1.4 Z" fill="#fff" />
      <circle cx={31} cy={27} r={1.4} fill="#fff" />
    </g>
  ),
  phantom_assassin_lord: (
    <g>
      <path d="M8,32 L24,10 L26,12 L11,34 Z" fill="#b6a8e6" opacity={0.35} />
      <path d="M11,32 L27,10 L29,12 L14,34 Z" fill="#b6a8e6" opacity={0.55} />
      <path d="M14,32 L30,8 L33,10 L17,34 Z" {...o('#dfe6ee', 1.4)} />
      <path d="M15,30 L11,26 M17,34 L13,36" stroke={OL} strokeWidth={4} strokeLinecap="round" />
      <path d="M15,30 L11,26 M17,34 L13,36" stroke="#6b4a8a" strokeWidth={2} strokeLinecap="round" />
      <path d="M33,10 l3,-3" stroke="#ff5a5a" strokeWidth={2} strokeLinecap="round" />
    </g>
  ),
};

export function LordIcon({ id }: { id: LordId }) {
  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden>
      {ICONS[id] ?? <circle cx={20} cy={20} r={10} fill="#ccc" />}
    </svg>
  );
}
