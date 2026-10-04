// "Choose Your Summoner" backdrop: jungle temple ruins framed by two giant elephant-head statues with
// glowing purple gem eyes, misty purple foliage and a soft central light shaft. Drawn in a 1366x768
// box (slice-fit). SummonerBackdrop is static + memoized; SummonerAmbient is the cheap animated layer.
import { memo } from 'react';
import { loop } from '../types.ts';

const W = 1366;
const H = 768;
const r2 = (n: number) => Math.round(n * 10) / 10;

// left statue gem eyes in backdrop coords (right statue mirrors x)
const EYES: [number, number][] = [
  [92, 228],
  [178, 222],
];

function rand(i: number) {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function Foliage({ x, y, s, c, hi, seed }: { x: number; y: number; s: number; c: string; hi: string; seed: number }) {
  const leaves = [];
  for (let i = 0; i < 9; i++) {
    const a = -150 + rand(seed + i) * 300;
    const len = s * (0.6 + rand(seed + i * 3) * 0.6);
    const rad = (a * Math.PI) / 180;
    const ex = x + Math.sin(rad) * len;
    const ey = y - Math.cos(rad) * len;
    const nx = Math.cos(rad) * len * 0.28;
    const ny = Math.sin(rad) * len * 0.28;
    const mx = (x + ex) / 2;
    const my = (y + ey) / 2;
    leaves.push(
      <path
        key={i}
        d={`M${r2(x)},${r2(y)} Q${r2(mx + nx)},${r2(my + ny)} ${r2(ex)},${r2(ey)} Q${r2(mx - nx)},${r2(my - ny)} ${r2(x)},${r2(y)} Z`}
        fill={i % 3 === 0 ? hi : c}
      />,
    );
  }
  return <g>{leaves}</g>;
}

function Statue() {
  return (
    <g>
      {/* plinth */}
      <rect x={-30} y={470} width={300} height={320} fill="url(#sb-stone-d)" />
      {[520, 580, 650, 720].map((y) => (
        <line key={y} x1={-30} y1={y} x2={270} y2={y} stroke="#15121a" strokeWidth={3} opacity={0.6} />
      ))}
      {[60, 140, 210].map((x, i) => (
        <line key={x} x1={x + (i % 2) * 30} y1={470} x2={x + (i % 2) * 30} y2={768} stroke="#15121a" strokeWidth={2} opacity={0.35} />
      ))}
      <rect x={-30} y={462} width={310} height={22} fill="#3c3946" stroke="#15121a" strokeWidth={3} />
      {/* ears */}
      <path d="M58,160 Q-40,150 -70,250 Q-80,360 10,410 Q50,420 70,380 Z" fill="url(#sb-stone-d)" stroke="#15121a" strokeWidth={4} />
      <path d="M40,190 Q-30,200 -45,260 Q-50,330 15,375" fill="none" stroke="#22202a" strokeWidth={5} opacity={0.6} />
      <path d="M215,160 Q290,150 300,250 Q300,340 230,390 Z" fill="url(#sb-stone-d)" stroke="#15121a" strokeWidth={4} />
      {/* crown */}
      <path d="M78,140 L88,80 L112,100 L134,30 L156,96 L180,72 L196,140 Z" fill="url(#sb-stone)" stroke="#15121a" strokeWidth={4} />
      <path d="M134,40 L134,120" stroke="#2a2733" strokeWidth={3} />
      <circle cx={134} cy={112} r={9} fill="url(#sb-gem)" stroke="#15121a" strokeWidth={2.5} />
      {/* forehead + face */}
      <path d="M62,150 Q134,96 218,150 Q236,232 206,300 L74,300 Q44,232 62,150 Z" fill="url(#sb-stone)" stroke="#15121a" strokeWidth={4} />
      <path d="M62,150 Q134,120 218,150 L214,170 Q134,142 64,170 Z" fill="#4c4a58" stroke="#15121a" strokeWidth={3} />
      {[76, 104, 132, 160, 188].map((x) => (
        <circle key={x} cx={x + 6} cy={158} r={4} fill="#2a2733" />
      ))}
      <path d="M70,202 Q92,192 114,206" fill="none" stroke="#15121a" strokeWidth={5} strokeLinecap="round" />
      <path d="M156,200 Q178,188 202,198" fill="none" stroke="#15121a" strokeWidth={5} strokeLinecap="round" />
      {EYES.map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={13} ry={8} fill="#15121a" />
          <ellipse cx={x} cy={y} rx={9} ry={5.5} fill="url(#sb-gem)" />
          <circle cx={x - 3} cy={y - 2} r={1.8} fill="#fff" opacity={0.9} />
        </g>
      ))}
      {/* moss patches */}
      <path d="M70,250 Q90,240 104,258 Q90,262 72,270 Z" fill="#3d5a3a" opacity={0.55} />
      <path d="M180,120 Q200,128 210,150 Q195,145 182,136 Z" fill="#3d5a3a" opacity={0.5} />
      {/* tusks */}
      <path d="M90,292 Q70,350 44,382 Q40,392 52,388 Q96,352 112,300 Z" fill="#a8a294" stroke="#15121a" strokeWidth={3.5} />
      <path d="M190,292 Q214,346 244,372 Q250,382 238,380 Q192,348 170,300 Z" fill="#a8a294" stroke="#15121a" strokeWidth={3.5} />
      {/* trunk curling outward */}
      <path
        d="M106,290 Q100,380 124,440 Q146,492 196,486 Q232,480 226,450 Q222,436 208,442 Q206,458 188,458 Q160,454 150,420 Q140,372 160,290 Z"
        fill="url(#sb-stone)"
        stroke="#15121a"
        strokeWidth={4}
      />
      {[320, 345, 370, 395, 420].map((y, i) => (
        <path key={y} d={`M${106 + i * 2},${y} Q${130 + i * 4},${y + 8} ${156 + i * 1},${y}`} fill="none" stroke="#24212c" strokeWidth={2.5} opacity={0.7} />
      ))}
      {/* cracks */}
      <path d="M150,170 L144,196 L152,214 L146,240" fill="none" stroke="#1a1720" strokeWidth={2} />
      <path d="M-10,520 L20,560 L10,600" fill="none" stroke="#1a1720" strokeWidth={2} />
    </g>
  );
}

function Vines({ x, len, seed }: { x: number; len: number; seed: number }) {
  const sway = (rand(seed) - 0.5) * 30;
  return (
    <g>
      <path d={`M${x},40 Q${x + sway},${40 + len / 2} ${x + sway * 0.4},${40 + len}`} fill="none" stroke="#2a1b38" strokeWidth={3} />
      {[0.3, 0.55, 0.8, 1].map((k, i) => (
        <ellipse key={i} cx={r2(x + sway * k * 0.7 + (i % 2 ? 6 : -6))} cy={r2(40 + len * k)} rx={7} ry={4} fill={i % 2 ? '#6a3d8f' : '#4a2a66'} transform={`rotate(${i % 2 ? 30 : -30},${r2(x + sway * k * 0.7 + (i % 2 ? 6 : -6))},${r2(40 + len * k)})`} />
      ))}
    </g>
  );
}

function BackdropSvg() {
  const far = [];
  for (let i = 0; i < 26; i++) {
    const x = (i / 25) * W;
    far.push(<circle key={i} cx={r2(x)} cy={r2(330 + rand(i) * 70)} r={r2(60 + rand(i + 9) * 50)} fill="#24173a" />);
  }
  const mid = [];
  for (let i = 0; i < 14; i++) {
    const x = 260 + (i / 13) * 846;
    if (x > 560 && x < 800) continue;
    mid.push(<Foliage key={i} x={x} y={470 + rand(i + 40) * 30} s={70 + rand(i + 50) * 40} c="#3a2252" hi="#55307a" seed={i * 7} />);
  }
  const tiles = [];
  for (let i = -8; i <= 8; i++) {
    tiles.push(<line key={`v${i}`} x1={683 + i * 40} y1={500} x2={683 + i * 190} y2={H} stroke="#100c16" strokeWidth={2} opacity={0.5} />);
  }
  for (const y of [530, 575, 630, 700]) tiles.push(<line key={`h${y}`} x1={0} y1={y} x2={W} y2={y} stroke="#100c16" strokeWidth={2} opacity={0.45} />);

  return (
    <svg className="sb-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="sb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d0814" />
          <stop offset="0.45" stopColor="#2a1c3c" />
          <stop offset="0.66" stopColor="#4a3a5c" />
          <stop offset="1" stopColor="#1a1222" />
        </linearGradient>
        <linearGradient id="sb-shaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4e9ff" stopOpacity="0.32" />
          <stop offset="0.7" stopColor="#d9c6ff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#d9c6ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sb-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3e3448" />
          <stop offset="1" stopColor="#120e18" />
        </linearGradient>
        <linearGradient id="sb-stone" x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor="#6c6a78" />
          <stop offset="0.6" stopColor="#4a4856" />
          <stop offset="1" stopColor="#2c2a34" />
        </linearGradient>
        <linearGradient id="sb-stone-d" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" stopColor="#4d4b58" />
          <stop offset="1" stopColor="#24222b" />
        </linearGradient>
        <radialGradient id="sb-gem">
          <stop offset="0" stopColor="#ffe6ff" />
          <stop offset="0.4" stopColor="#c46bff" />
          <stop offset="1" stopColor="#5a1690" />
        </radialGradient>
        <radialGradient id="sb-fog">
          <stop offset="0" stopColor="#c8b4e6" stopOpacity="0.32" />
          <stop offset="1" stopColor="#c8b4e6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sb-glow">
          <stop offset="0" stopColor="#fff2ff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff2ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sb-vig" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.85" />
        </radialGradient>
        <filter id="sb-blur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <rect width={W} height={H} fill="url(#sb-sky)" />
      <ellipse cx={683} cy={330} rx={360} ry={220} fill="url(#sb-glow)" />
      <g filter="url(#sb-blur)" opacity={0.9}>
        {far}
      </g>
      {/* far temple */}
      <g fill="#2e2540" stroke="#1a1424" strokeWidth={3}>
        <rect x={503} y={420} width={360} height={90} />
        <rect x={543} y={360} width={280} height={62} />
        <rect x={588} y={302} width={190} height={60} />
        <rect x={628} y={250} width={110} height={54} />
        <path d="M648,250 L683,196 L718,250 Z" />
      </g>
      <path d="M664,420 L664,385 Q683,366 702,385 L702,420 Z" fill="#d8c8f0" opacity={0.35} />
      <rect x={0} y={480} width={W} height={20} fill="#1e1628" opacity={0.6} />
      {/* light shaft */}
      <path d="M600,0 L770,0 L930,768 L440,768 Z" fill="url(#sb-shaft)" />
      {/* floor */}
      <rect x={0} y={500} width={W} height={H - 500} fill="url(#sb-floor)" />
      {tiles}
      <ellipse cx={683} cy={600} rx={420} ry={90} fill="url(#sb-glow)" opacity={0.5} />
      {/* mid jungle foliage */}
      <g opacity={0.85}>{mid}</g>
      {/* lintel archway */}
      <rect x={0} y={0} width={W} height={46} fill="url(#sb-stone-d)" />
      <rect x={0} y={40} width={W} height={14} fill="#2a2733" stroke="#15121a" strokeWidth={3} />
      {Array.from({ length: 17 }, (_, i) => (
        <rect key={i} x={i * 84 + 8} y={10} width={60} height={22} rx={4} fill="none" stroke="#1b1822" strokeWidth={3} opacity={0.6} />
      ))}
      {[300, 380, 470, 900, 980, 1060].map((x, i) => (
        <Vines key={x} x={x} len={60 + rand(i + 3) * 90} seed={i + 11} />
      ))}
      {/* statues */}
      <g transform="translate(-36,0)">
        <Statue />
      </g>
      <g transform={`translate(${W + 36},0) scale(-1,1)`}>
        <Statue />
      </g>
      {/* foreground foliage */}
      <Foliage x={-10} y={780} s={170} c="#2a1640" hi="#4a2a66" seed={101} />
      <Foliage x={120} y={790} s={120} c="#3a1f55" hi="#6a3d8f" seed={131} />
      <Foliage x={W + 10} y={780} s={170} c="#2a1640" hi="#4a2a66" seed={151} />
      <Foliage x={W - 120} y={790} s={120} c="#3a1f55" hi="#6a3d8f" seed={171} />
      <Foliage x={30} y={60} s={110} c="#2a1640" hi="#55307a" seed={201} />
      <Foliage x={W - 30} y={60} s={110} c="#2a1640" hi="#55307a" seed={221} />
      {/* floor mist */}
      <ellipse cx={300} cy={640} rx={420} ry={90} fill="url(#sb-fog)" />
      <ellipse cx={1066} cy={650} rx={420} ry={90} fill="url(#sb-fog)" />
      <rect width={W} height={H} fill="url(#sb-vig)" />
    </svg>
  );
}

export const SummonerBackdrop = memo(BackdropSvg);

/** Animated layer: drifting fog, rising motes, pulsing statue eyes. Cheap (< 50 elements). */
export function SummonerAmbient({ t }: { t: number }) {
  const motes = [];
  for (let i = 0; i < 30; i++) {
    const q = loop(t + rand(i) * 20, 9 + rand(i + 5) * 7);
    const x = rand(i + 2) * W + Math.sin(t * 0.6 + i) * 18;
    const y = H - q * (H + 40);
    const purple = i % 3 !== 0;
    motes.push(
      <circle
        key={i}
        cx={r2(x)}
        cy={r2(y)}
        r={r2(1.2 + rand(i + 7) * 2)}
        fill={purple ? '#d59bff' : '#ffe6a0'}
        opacity={r2(Math.sin(q * Math.PI) * (0.35 + rand(i + 3) * 0.5))}
      />,
    );
  }
  const pulse = 0.55 + 0.45 * Math.sin(t * 1.7);
  const eyes = EYES.flatMap(([x, y], i) => [
    [x - 36, y, i],
    [W - (x - 36), y, i + 2],
  ]);
  return (
    <svg className="sb-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="sa-fog">
          <stop offset="0" stopColor="#d8c8f0" stopOpacity="0.22" />
          <stop offset="1" stopColor="#d8c8f0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sa-eye">
          <stop offset="0" stopColor="#e9a8ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#a040ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[0, 1, 2].map((i) => {
        const x = ((t * (14 + i * 6) + i * 500) % (W + 800)) - 400;
        return <ellipse key={i} cx={r2(x)} cy={560 + i * 50} rx={380} ry={60 + i * 10} fill="url(#sa-fog)" />;
      })}
      {eyes.map(([x, y, i]) => (
        <circle key={i} cx={x} cy={y} r={r2(22 + pulse * 10)} fill="url(#sa-eye)" opacity={r2(0.5 + pulse * 0.5)} />
      ))}
      {motes}
    </svg>
  );
}
