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
  ursa_lord: (
    <g>
      <path d="M11,30 L27,9 L31,13 L14,33 Z" {...o('#d6dde6')} />
      <path d="M27,9 L24,14 L21,13 Z" fill="#14110f" />
      <path d="M8,27 L17,36 M9,33 L12,30" stroke={OL} strokeWidth={4} strokeLinecap="round" />
      <path d="M8,27 L17,36" stroke="#f2c14e" strokeWidth={2.2} strokeLinecap="round" />
      <path d="M9,33 L12,30" stroke="#6b4528" strokeWidth={2.2} strokeLinecap="round" />
      <path d="M23,8 l3,-3 M30,6 l1,-4 M33,13 l4,-1" stroke="#ffb040" strokeWidth={1.6} strokeLinecap="round" />
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
};

export function LordIcon({ id }: { id: LordId }) {
  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden>
      {ICONS[id] ?? <circle cx={20} cy={20} r={10} fill="#ccc" />}
    </svg>
  );
}
