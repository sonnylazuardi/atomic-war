// Basic-attack projectile art per hero. Drawn at origin pointing +x; the arena translates/rotates it.
// Pure functions of { t, team } (t = global battle time, used for flicker/spin).
import type { HeroId } from '../core/types.ts';
import type { ProjectileArt } from './types.ts';
import { TEAM_COLORS } from './types.ts';

const None: ProjectileArt = () => null;

const Generic: ProjectileArt = ({ team }) => (
  <g>
    <circle r={7} fill={TEAM_COLORS[team]} opacity={0.35} />
    <circle r={4} fill="#ffe08a" />
  </g>
);

const LinaFireball: ProjectileArt = ({ t }) => {
  const f = 1 + Math.sin(t * 40) * 0.12;
  return (
    <g>
      <ellipse cx={-14} cy={0} rx={16 * f} ry={5} fill="#ff6a1a" opacity={0.45} />
      <ellipse cx={-7} cy={0} rx={10} ry={6 * f} fill="#ff9a2e" opacity={0.75} />
      <circle r={9 * f} fill="#ff5a12" opacity={0.5} />
      <circle r={6} fill="#ffb347" />
      <circle cx={1.5} r={3.2} fill="#fff4c2" />
    </g>
  );
};

const DrowFrostArrow: ProjectileArt = ({ t }) => (
  <g>
    <line x1={-26} y1={0} x2={-6} y2={0} stroke="#bfe9ff" strokeWidth={5} opacity={0.3} strokeLinecap="round" />
    <line x1={-18} y1={0} x2={6} y2={0} stroke="#e8f7ff" strokeWidth={1.8} />
    <path d="M-18,0 l-5,-3.5 M-18,0 l-5,3.5" stroke="#9fd8ff" strokeWidth={1.5} />
    <path d="M10,0 L3,-4 L4,0 L3,4 Z" fill="#c9f0ff" stroke="#6ec6ff" strokeWidth={0.8} />
    <circle cx={8} r={5 + Math.sin(t * 30) * 1} fill="#9fe2ff" opacity={0.35} />
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={-10 - i * 7} cy={Math.sin(t * 25 + i * 2) * 3} r={1.3} fill="#ffffff" opacity={0.8 - i * 0.2} />
    ))}
  </g>
);

const SniperBullet: ProjectileArt = () => (
  <g>
    <line x1={-34} y1={0} x2={-4} y2={0} stroke="#fff3c4" strokeWidth={1.4} opacity={0.6} />
    <line x1={-18} y1={0} x2={-4} y2={0} stroke="#ffe08a" strokeWidth={2.4} opacity={0.8} />
    <ellipse cx={0} cy={0} rx={5} ry={2.2} fill="#d9a441" stroke="#7a5418" strokeWidth={0.6} />
    <ellipse cx={2} cy={-0.6} rx={2} ry={0.8} fill="#fff1c0" />
  </g>
);

const ZeusBolt: ProjectileArt = ({ t }) => {
  const j = (k: number) => Math.sin(t * 60 + k * 1.7) * 3;
  const d = `M-20,${j(1)} L-13,${j(2)} L-7,${j(3)} L-1,${j(4)} L6,0`;
  return (
    <g>
      <circle cx={4} r={8} fill="#7fd4ff" opacity={0.3} />
      <path d={d} stroke="#5ab8ff" strokeWidth={5} fill="none" opacity={0.45} strokeLinejoin="round" />
      <path d={d} stroke="#f2fbff" strokeWidth={1.8} fill="none" strokeLinejoin="round" />
      <circle cx={6} r={3} fill="#ffffff" />
    </g>
  );
};

const MedusaArrow: ProjectileArt = ({ t }) => {
  const w = (x: number) => Math.sin(x * 0.35 + t * 30) * 2.5;
  const trail = Array.from({ length: 7 }, (_, i) => -8 - i * 3.5)
    .map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${w(x)}`)
    .join(' ');
  return (
    <g>
      <path d={trail} stroke="#3ce0b0" strokeWidth={2.2} fill="none" opacity={0.6} strokeLinecap="round" />
      <line x1={-14} y1={0} x2={5} y2={0} stroke="#d7ffe9" strokeWidth={1.6} />
      <path d={`M9,0 L2,-3.6 L3,0 L2,3.6 Z`} fill="#46f0b8" stroke="#138a66" strokeWidth={0.7} />
      <circle cx={6} r={5} fill="#40e0b0" opacity={0.25} />
    </g>
  );
};

const SilencerGlaive: ProjectileArt = ({ t }) => (
  <g>
    <ellipse cx={-10} rx={12} ry={4} fill="#a77bff" opacity={0.25} />
    <g transform={`rotate(${(t * 1440) % 360})`}>
      <path d="M0,-9 Q7,-3 0,0 Q-7,3 0,9 Q9,4 9,0 Q9,-4 0,-9 Z" fill="#c9b2ff" stroke="#6c45d9" strokeWidth={1} />
      <path d="M0,9 Q-7,3 0,0 Q7,-3 0,-9 Q-9,-4 -9,0 Q-9,4 0,9 Z" fill="#9a77ff" stroke="#6c45d9" strokeWidth={1} opacity={0.85} />
      <circle r={2} fill="#ffffff" />
    </g>
  </g>
);

const TinkerLaser: ProjectileArt = ({ t }) => (
  <g>
    <rect x={-26} y={-4.5} width={34} height={9} rx={4.5} fill="#ff4a3a" opacity={0.3 + Math.sin(t * 50) * 0.08} />
    <rect x={-20} y={-2.2} width={28} height={4.4} rx={2.2} fill="#ff6b3d" />
    <rect x={-14} y={-1} width={22} height={2} rx={1} fill="#fff1d6" />
  </g>
);

const CrystalShard: ProjectileArt = ({ t }) => (
  <g>
    <ellipse cx={-10} rx={12} ry={4} fill="#bfe9ff" opacity={0.3} />
    <g transform={`rotate(${Math.sin(t * 20) * 8})`}>
      <path d="M9,0 L0,-5 L-9,0 L0,5 Z" fill="#dff6ff" stroke="#6fc3f7" strokeWidth={1} />
      <path d="M9,0 L0,-5 L0,5 Z" fill="#a9e3ff" opacity={0.8} />
    </g>
    {[0, 1, 2].map((i) => (
      <path
        key={i}
        d="M0,-2 L0.6,-0.6 L2,0 L0.6,0.6 L0,2 L-0.6,0.6 L-2,0 L-0.6,-0.6 Z"
        transform={`translate(${-12 - i * 6},${Math.sin(t * 18 + i * 2.1) * 4})`}
        fill="#ffffff"
        opacity={0.9 - i * 0.25}
      />
    ))}
  </g>
);

const DazzleOrb: ProjectileArt = ({ t }) => (
  <g>
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={-7 - i * 6} cy={Math.sin(t * 22 + i * 1.8) * 3} r={4 - i} fill="#c04bd8" opacity={0.45 - i * 0.12} />
    ))}
    <circle r={7.5} fill="#ff6ad5" opacity={0.3} />
    <circle r={5.5} fill="#3a0f4a" stroke="#ff7be0" strokeWidth={1.6} />
    <circle cx={1.5} cy={-1.5} r={1.6} fill="#ffc6f1" />
  </g>
);

const EnigmaOrb: ProjectileArt = ({ t }) => (
  <g>
    <circle r={10} fill="#5b2aa8" opacity={0.25} />
    <g transform={`rotate(${(t * 720) % 360})`}>
      <path d="M0,-8 A8,8 0 0 1 8,0" stroke="#b48cff" strokeWidth={1.8} fill="none" />
      <path d="M0,8 A8,8 0 0 1 -8,0" stroke="#b48cff" strokeWidth={1.8} fill="none" />
    </g>
    <circle r={5} fill="#08020f" stroke="#7d4dff" strokeWidth={1.2} />
    <circle r={1.6} fill="#c7a8ff" />
  </g>
);

const WindrangerArrow: ProjectileArt = ({ t }) => {
  const w = (x: number, k: number) => Math.sin(x * 0.3 + t * 28 + k) * (2 + (-x - 8) * 0.06);
  const trail = (k: number) =>
    Array.from({ length: 9 }, (_, i) => -8 - i * 4)
      .map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${(w(x, k) + k * 1.2).toFixed(2)}`)
      .join(' ');
  return (
    <g>
      <path d={trail(0)} stroke="#7dffa8" strokeWidth={2} fill="none" opacity={0.55} strokeLinecap="round" />
      <path d={trail(2.4)} stroke="#d8ffe6" strokeWidth={1.1} fill="none" opacity={0.45} strokeLinecap="round" />
      <line x1={-16} y1={0} x2={6} y2={0} stroke="#f4efe0" strokeWidth={1.4} />
      <path d="M-16,0 l-5,-3.2 l3,3.2 l-3,3.2 Z M-12,0 l-4,-3 M-12,0 l-4,3" fill="#4ae07a" stroke="#2fb85a" strokeWidth={1.1} />
      <path d="M10,0 L4,-2.8 L5,0 L4,2.8 Z" fill="#e8fff0" stroke="#3ad06a" strokeWidth={0.7} />
      <circle cx={7} r={4.5} fill="#6bff9a" opacity={0.22} />
    </g>
  );
};

/** Jakiro: twin-headed dragon alternates ice and fire orbs (decided per ~0.5s window of battle time). */
const JakiroOrb: ProjectileArt = ({ t }) => {
  const ice = Math.floor(t * 2) % 2 === 0;
  const core = ice ? '#e6f8ff' : '#fff1c2';
  const mid = ice ? '#7ad0ff' : '#ff9a2e';
  const outer = ice ? '#3a9cff' : '#ff4a12';
  const fl = 1 + Math.sin(t * 36) * 0.1;
  return (
    <g>
      <ellipse cx={-13} rx={15 * fl} ry={5} fill={outer} opacity={0.35} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={-9 - i * 6} cy={Math.sin(t * 22 + i * 2) * 3} r={2.4 - i * 0.5} fill={mid} opacity={0.75 - i * 0.2} />
      ))}
      <circle r={9 * fl} fill={outer} opacity={0.3} />
      <circle r={6} fill={mid} />
      <circle cx={1.5} r={3} fill={core} />
      {ice ? <path d="M0,-8 L0,8 M-7,-4 L7,4 M-7,4 L7,-4" stroke="#ffffff" strokeWidth={0.8} opacity={0.6} /> : null}
    </g>
  );
};

/** Dragon Knight is melee, so this only appears when Elder Dragon Form gives him range: a green dragon fireball. */
const DragonFireball: ProjectileArt = ({ t }) => {
  const fl = 1 + Math.sin(t * 38) * 0.12;
  return (
    <g>
      <ellipse cx={-16} rx={20 * fl} ry={6} fill="#3ad04a" opacity={0.35} />
      <ellipse cx={-8} rx={12} ry={7 * fl} fill="#8aff5a" opacity={0.55} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={-14 - i * 7} cy={Math.sin(t * 24 + i * 2) * 4} r={2.6 - i * 0.6} fill="#e8ff8a" opacity={0.8 - i * 0.2} />
      ))}
      <circle r={11 * fl} fill="#2ac03a" opacity={0.35} />
      <circle r={7} fill="#7dff4a" />
      <circle cx={1.5} r={3.8} fill="#f6ffd0" />
    </g>
  );
};

/** Clinkz: burning arrow with licking flame trail. */
const ClinkzFireArrow: ProjectileArt = ({ t }) => {
  const f = (k: number) => Math.sin(t * 34 + k) * 2.2;
  return (
    <g>
      <ellipse cx={-14} rx={16} ry={5} fill="#ff5a12" opacity={0.3} />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={-8 - i * 5} cy={f(i * 1.9)} r={3.6 - i * 0.7} fill={i % 2 ? "#ffb347" : "#ff6a1a"} opacity={0.8 - i * 0.15} />
      ))}
      <line x1={-16} y1={0} x2={6} y2={0} stroke="#3b2418" strokeWidth={1.8} />
      <path d="M-16,0 l-4,-3 l2,3 l-2,3 Z" fill="#ff8a2a" />
      <path d="M10,0 L3,-3.2 L4,0 L3,3.2 Z" fill="#ffd23d" stroke="#c8401c" strokeWidth={0.8} />
      <circle cx={6} r={5 + Math.sin(t * 40)} fill="#ff9a2e" opacity={0.35} />
    </g>
  );
};

/** Muerta: ghostly green-teal bullet with long tracer. */
const MuertaBullet: ProjectileArt = ({ t }) => (
  <g>
    <line x1={-40} y1={0} x2={-4} y2={0} stroke="#5fffd0" strokeWidth={3.4} opacity={0.25} strokeLinecap="round" />
    <line x1={-30} y1={0} x2={-3} y2={0} stroke="#b8fff0" strokeWidth={1.3} opacity={0.85} />
    {[0, 1].map((i) => (
      <circle key={i} cx={-12 - i * 10} cy={Math.sin(t * 26 + i * 2.4) * 2.5} r={1.6 - i * 0.4} fill="#7affd8" opacity={0.7 - i * 0.25} />
    ))}
    <circle r={6 + Math.sin(t * 36) * 0.8} fill="#3ae0b8" opacity={0.3} />
    <ellipse cx={0} cy={0} rx={4.6} ry={2.3} fill="#c8fff0" stroke="#1fa888" strokeWidth={0.8} />
  </g>
);

const ATTACK_PROJECTILES: Record<HeroId, ProjectileArt> = {
  pudge: None,
  axe: None,
  ursa: None,
  slark: None,
  phantom_assassin: None,
  juggernaut: None,
  silencer: SilencerGlaive,
  lina: LinaFireball,
  zeus: ZeusBolt,
  enigma: EnigmaOrb,
  tinker: TinkerLaser,
  medusa: MedusaArrow,
  drow_ranger: DrowFrostArrow,
  sniper: SniperBullet,
  crystal_maiden: CrystalShard,
  dazzle: DazzleOrb,
  dragon_knight: DragonFireball,
  windranger: WindrangerArrow,
  jakiro: JakiroOrb,
  riki: None,
  clinkz: ClinkzFireArrow,
  spectre: None,
  muerta: MuertaBullet,
};

/** true when the hero has a visible basic-attack projectile (ranged) */
export const hasAttackProjectile = (heroId: HeroId) => (ATTACK_PROJECTILES[heroId] ?? Generic) !== None;

export const getAttackProjectileArt = (heroId: HeroId): ProjectileArt => ATTACK_PROJECTILES[heroId] ?? Generic;
