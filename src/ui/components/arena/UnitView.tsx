// One unit in the arena: shadow, hero art (flipped by facing), HP/mana bars, level, status icons.
import type { ReactNode } from 'react';
import type { StatusKind, UnitSnapshot } from '../../../core/types.ts';
import { getHeroArt } from '../../../art/registry.tsx';
import { TEAM_COLORS } from '../../../art/types.ts';

export interface BarFx {
  chip: number; // trailing damage chip hp value
  flash: number; // 0..1 white flash intensity
}

const BAR_W = 56;
const BAR_Y = -98;

function Sheep({ t }: { t: number }) {
  const hop = Math.abs(Math.sin(t * 6)) * 3;
  return (
    <g transform={`translate(0,${-hop})`}>
      <ellipse cx={0} cy={-2 + hop} rx={16} ry={4} fill="#000" opacity={0.25} />
      {[-7, 5].map((x) => (
        <rect key={x} x={x} y={-12} width={3} height={11} fill="#3b3330" />
      ))}
      <ellipse cx={0} cy={-20} rx={17} ry={12} fill="#f4f1ea" stroke="#cfc8bb" strokeWidth={1} />
      {[-10, -3, 4, 11].map((x, i) => (
        <circle key={x} cx={x} cy={-29 + (i % 2) * 2} r={5} fill="#fbf9f3" />
      ))}
      <ellipse cx={17} cy={-24} rx={6} ry={5} fill="#3b3330" />
      <circle cx={19} cy={-25} r={1.2} fill="#fff" />
    </g>
  );
}

function StunStars({ t }: { t: number }) {
  return (
    <g transform="translate(0,-84)">
      {[0, 1, 2].map((i) => {
        const a = t * 5 + (i * Math.PI * 2) / 3;
        const x = Math.cos(a) * 16;
        const y = Math.sin(a) * 5;
        return (
          <path
            key={i}
            transform={`translate(${x},${y}) scale(${0.8 + Math.sin(a) * 0.2})`}
            d="M0,-5 L1.5,-1.5 L5,0 L1.5,1.5 L0,5 L-1.5,1.5 L-5,0 L-1.5,-1.5 Z"
            fill="#ffe46b"
            stroke="#a07a10"
            strokeWidth={0.6}
          />
        );
      })}
    </g>
  );
}

function Flames({ t }: { t: number }) {
  return (
    <g>
      {[-12, 0, 12].map((x, i) => {
        const h = 10 + Math.sin(t * 14 + i * 2) * 4;
        return (
          <path key={x} d={`M${x - 5},-2 Q${x - 3},${-h} ${x},${-h - 5} Q${x + 3},${-h} ${x + 5},-2 Z`} fill="#ff7a1a" opacity={0.75} />
        );
      })}
      {[-6, 6].map((x, i) => (
        <path key={x} d={`M${x - 3},-2 Q${x},${-10 - Math.sin(t * 17 + i) * 3} ${x + 3},-2 Z`} fill="#ffd36b" opacity={0.85} />
      ))}
    </g>
  );
}

function Vines({ t }: { t: number }) {
  const w = Math.sin(t * 3) * 1.5;
  return (
    <g stroke="#4fa34a" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.9}>
      <path d={`M-18,0 Q-22,-14 ${-12 + w},-22`} />
      <path d={`M18,0 Q22,-14 ${12 - w},-22`} />
      <path d={`M-8,1 Q-14,-8 ${-4 + w},-14`} />
      <path d={`M8,1 Q14,-8 ${4 - w},-14`} />
      <ellipse cx={0} cy={0} rx={22} ry={6} stroke="#2f6e2c" strokeWidth={2} />
    </g>
  );
}

/** Aghanim's Scepter carrier: small blue crown/scepter badge right of the HP bar */
function AghsBadge({ t }: { t: number }) {
  const glow = 0.55 + 0.25 * Math.sin(t * 4);
  return (
    <g transform={`translate(${BAR_W / 2 + 9},${BAR_Y + 4})`}>
      <circle r={9.5} fill="#4fa8ff" opacity={glow * 0.35} />
      <circle r={7.5} fill="#10203a" stroke="#6cc0ff" strokeWidth={1.4} />
      <path d="M-4.6,2.6 L-5,-3 L-2.2,-0.6 L0,-4.4 L2.2,-0.6 L5,-3 L4.6,2.6 Z" fill="#7fd0ff" stroke="#d8f1ff" strokeWidth={0.6} strokeLinejoin="round" />
      <rect x={-4.6} y={2.4} width={9.2} height={1.8} rx={0.6} fill="#bfe6ff" />
      <circle cx={0} cy={-4.4} r={1} fill="#fff" />
    </g>
  );
}

/** Naga's Song: soft pink/teal bubble, swirling music notes, "Zz" */
function SirenSong({ t }: { t: number }) {
  return (
    <g pointerEvents="none">
      <ellipse cx={0} cy={-40} rx={34} ry={48} fill="#f08ad8" opacity={0.1 + Math.sin(t * 2) * 0.03} />
      <ellipse cx={0} cy={-40} rx={34} ry={48} fill="none" stroke="#7fe3d8" strokeWidth={1.6} strokeDasharray="10 6" strokeDashoffset={-t * 20} opacity={0.6} />
      {[0, 1, 2, 3].map((i) => {
        const a = t * 1.8 + (i * Math.PI) / 2;
        const x = Math.cos(a) * 30;
        const y = -44 + Math.sin(a) * 34;
        return (
          <text key={i} x={x} y={y} textAnchor="middle" fontSize={i % 2 ? 13 : 11} fill={i % 2 ? '#ff9fe6' : '#7fe8dc'} stroke="#2a1030" strokeWidth={2} paintOrder="stroke" opacity={0.65 + 0.35 * Math.sin(a * 2)}>
            {i % 2 ? '♫' : '♪'}
          </text>
        );
      })}
      {[0, 1].map((i) => {
        const k = (t * 0.6 + i * 0.5) % 1;
        return (
          <text key={`z${i}`} x={12 + k * 14} y={-92 - k * 22} fontSize={10 + k * 6} fontWeight={800} fill="#e8f6ff" stroke="#1a2440" strokeWidth={2.5} paintOrder="stroke" opacity={1 - k} fontFamily="system-ui, sans-serif">
            Z
          </text>
        );
      })}
    </g>
  );
}

/** Riki's smoke: shimmering outline + drifting puffs */
function SmokeOutline({ t }: { t: number }) {
  return (
    <g pointerEvents="none">
      <ellipse cx={0} cy={-40} rx={26} ry={44} fill="none" stroke="#b9a6ff" strokeWidth={1.6} strokeDasharray="4 5" strokeDashoffset={t * 25} opacity={0.55 + Math.sin(t * 6) * 0.2} />
      {[0, 1, 2, 3].map((i) => {
        const k = (t * 0.5 + i * 0.25) % 1;
        return <circle key={i} cx={Math.sin(i * 2.1 + t) * 18} cy={-10 - k * 70} r={5 + k * 7} fill="#8f84b8" opacity={(1 - k) * 0.25} />;
      })}
    </g>
  );
}

/** small icons in a row above the bars */
function StatusIcon({ s, x }: { s: StatusKind; x: number }) {
  const bg = (fill: string, child: ReactNode) => (
    <g transform={`translate(${x},${BAR_Y - 12})`}>
      <circle r={6} fill={fill} stroke="#0008" strokeWidth={1} />
      {child}
    </g>
  );
  switch (s) {
    case 'silenced':
      return bg('#6a3fb5', <path d="M-3.2,-3.2 L3.2,3.2 M-3.5,0 A3.5,3.5 0 1 0 3.5,0 A3.5,3.5 0 1 0 -3.5,0" stroke="#fff" strokeWidth={1.3} fill="none" />);
    case 'slowed':
      return bg('#2f6fb5', <path d="M0,-4 L0,4 M-3.5,-2 L3.5,2 M-3.5,2 L3.5,-2" stroke="#dff2ff" strokeWidth={1.3} />);
    case 'blinded':
      return bg('#333', <path d="M-4,0 Q0,-4 4,0 Q0,4 -4,0 Z M-4,-4 L4,4" stroke="#ddd" strokeWidth={1.1} fill="none" />);
    case 'buffed':
      return bg('#b58a1f', <path d="M0,-4 L3.5,0.5 L1.2,0.5 L1.2,4 L-1.2,4 L-1.2,0.5 L-3.5,0.5 Z" fill="#fff6d0" />);
    case 'grave':
      return bg('#4a2a63', <path d="M-2.8,4 L-2.8,-1.5 A2.8,2.8 0 0 1 2.8,-1.5 L2.8,4 Z" fill="#cdbbe0" />);
    case 'hexed':
      return bg('#3d7a3a', <circle r={2.6} fill="#fff" />);
    case 'burning':
      return bg('#a3380f', <path d="M0,-4 Q3,-1 2,2 Q1,4 0,4 Q-2,4 -2,1.5 Q-2,-1 0,-4 Z" fill="#ffcf6b" />);
    case 'rooted':
      return bg('#2f6e2c', <path d="M0,4 L0,-1 M0,-1 Q-3,-2 -3,-4 M0,-1 Q3,-2 3,-4" stroke="#bff0b0" strokeWidth={1.2} fill="none" />);
    case 'invulnerable':
      return bg('#ddd', <circle r={3} fill="#fff" />);
    default:
      return null;
  }
}

const ICON_STATUSES: StatusKind[] = ['silenced', 'rooted', 'slowed', 'blinded', 'hexed', 'grave', 'burning', 'buffed', 'invulnerable'];

export function UnitView({ u, fx, human, battleT }: { u: UnitSnapshot; fx: BarFx | undefined; human: boolean; battleT: number }) {
  const Art = getHeroArt(u.heroId);
  const team = TEAM_COLORS[u.team];
  const st = new Set(u.statuses);
  const hexed = st.has('hexed') && u.alive;
  const hpK = u.maxHp > 0 ? Math.max(0, Math.min(1, u.hp / u.maxHp)) : 0;
  const chipK = fx && u.maxHp > 0 ? Math.max(hpK, Math.min(1, fx.chip / u.maxHp)) : hpK;
  const manaK = u.maxMana > 0 ? Math.max(0, Math.min(1, u.mana / u.maxMana)) : 0;
  const icons = u.alive ? ICON_STATUSES.filter((s) => st.has(s)) : [];
  // dead units fade once their fall anim is mostly done
  const deadFade = u.alive ? 1 : Math.max(0.35, 1 - u.animT * 0.8);
  const asleep = u.alive && st.has('hypnotized');
  const invis = u.alive && st.has('invisible');
  const summon = u.uid.startsWith('summon-');
  // invisible: faint for its own (human) side, nearly gone for the enemy
  const unitOpacity = invis && !human ? 0.12 : deadFade;
  const sway = asleep ? Math.sin(battleT * 1.6) * 6 : 0;
  const artOpacity = invis ? 0.28 : asleep ? 0.7 : undefined;

  return (
    <g transform={`translate(${u.x.toFixed(1)},${u.y.toFixed(1)})`} opacity={unitOpacity < 1 ? unitOpacity : undefined}>
      <ellipse cx={0} cy={0} rx={22} ry={7} fill="#000" opacity={0.35} />
      {human && u.alive && (
        <ellipse cx={0} cy={0} rx={27} ry={9} fill="none" stroke={team} strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="5 4" strokeDashoffset={battleT * 12} />
      )}
      {st.has('channeling') && u.alive && (
        <ellipse cx={0} cy={0} rx={30} ry={10} fill="none" stroke="#9fd0ff" strokeOpacity={0.6} strokeWidth={2} strokeDasharray="12 8" strokeDashoffset={-battleT * 40} />
      )}
      {st.has('rooted') && u.alive && <Vines t={battleT} />}
      <g transform={sway ? `rotate(${sway.toFixed(2)})` : undefined} opacity={artOpacity}>
        <g transform={u.facing === -1 ? 'scale(-1,1)' : undefined} filter={u.alive ? undefined : 'url(#aw-desat)'}>
          {hexed ? <Sheep t={battleT} /> : <Art anim={asleep ? 'idle' : u.anim} t={asleep ? battleT * 0.4 : u.animT} dur={asleep ? 0 : u.animDur} team={u.team} />}
        </g>
      </g>
      {invis && <SmokeOutline t={battleT} />}
      {asleep && <SirenSong t={battleT} />}
      {summon && u.alive && <ellipse cx={0} cy={-40} rx={27} ry={45} fill="none" stroke="#8fd0ff" strokeWidth={1.4} opacity={0.35 + Math.sin(battleT * 4) * 0.12} />}
      {st.has('burning') && u.alive && <Flames t={battleT} />}
      {st.has('grave') && u.alive && <ellipse cx={0} cy={-40} rx={30} ry={46} fill="#8a4fd0" opacity={0.12 + Math.sin(battleT * 6) * 0.05} />}
      {st.has('invulnerable') && u.alive && <ellipse cx={0} cy={-40} rx={28} ry={44} fill="#fff" opacity={0.1 + Math.sin(battleT * 10) * 0.05} />}
      {st.has('spell_immune') && u.alive && (
        <g pointerEvents="none">
          <ellipse cx={0} cy={-40} rx={36} ry={50} fill="#ffcf3f" opacity={0.16 + Math.sin(battleT * 5) * 0.04} />
          <ellipse cx={0} cy={-40} rx={36} ry={50} fill="none" stroke="#ffd95a" strokeWidth={2.6} opacity={0.7 + Math.sin(battleT * 8) * 0.2} />
          <ellipse cx={0} cy={-40} rx={30} ry={44} fill="none" stroke="#fff3b8" strokeWidth={1} opacity={0.35} />
          {/* shimmer band sweeping up the bubble */}
          <ellipse cx={0} cy={-40 + 40 - ((battleT * 60) % 100)} rx={30} ry={5} fill="#fff6cf" opacity={0.28} />
          <path d="M-22,-72 Q-6,-88 12,-83" stroke="#fff6cf" strokeWidth={2.4} fill="none" opacity={0.75} strokeLinecap="round" />
        </g>
      )}
      {st.has('stunned') && u.alive && <StunStars t={battleT} />}
      {u.alive && (
        <g>
          <rect x={-BAR_W / 2 - 1} y={BAR_Y - 1} width={BAR_W + 2} height={11} rx={2} fill="#0a0b0f" opacity={0.85} stroke={summon ? '#8fd0ff' : undefined} strokeOpacity={summon ? 0.8 : undefined} />
          <rect x={-BAR_W / 2} y={BAR_Y} width={BAR_W * chipK} height={6} fill="#f2e6b8" />
          <rect x={-BAR_W / 2} y={BAR_Y} width={BAR_W * hpK} height={6} fill={team} />
          <rect x={-BAR_W / 2} y={BAR_Y} width={BAR_W * hpK} height={2} fill="#fff" opacity={0.25} />
          {fx && fx.flash > 0 && <rect x={-BAR_W / 2} y={BAR_Y} width={BAR_W * chipK} height={6} fill="#fff" opacity={fx.flash * 0.9} />}
          {/* hp ticks every 250 */}
          {u.maxHp > 0 &&
            u.maxHp <= 5000 &&
            Array.from({ length: Math.floor(u.maxHp / 250) }, (_, i) => {
              const x = -BAR_W / 2 + (BAR_W * ((i + 1) * 250)) / u.maxHp;
              return x < BAR_W / 2 - 1 ? <line key={i} x1={x} x2={x} y1={BAR_Y} y2={BAR_Y + 3} stroke="#000" strokeOpacity={0.5} strokeWidth={0.7} /> : null;
            })}
          {u.maxMana > 0 && <rect x={-BAR_W / 2} y={BAR_Y + 7} width={BAR_W * manaK} height={2.5} fill="#4f8dff" />}
          <g transform={`translate(${-BAR_W / 2 - 8},${BAR_Y + 4})`}>
            <circle r={7.5} fill="#16181f" stroke={team} strokeWidth={1.4} />
            <text y={3} textAnchor="middle" fontSize={u.level >= 10 ? 8 : 9} fontWeight={700} fill="#fff" fontFamily="system-ui, sans-serif">
              {u.level}
            </text>
          </g>
          {st.has('aghanim') && <AghsBadge t={battleT} />}
          {summon && (
            <text x={0} y={BAR_Y - 4} textAnchor="middle" fontSize={8} fontWeight={800} letterSpacing="0.08em" fill="#a8dcff" stroke="#0a1626" strokeWidth={2.5} paintOrder="stroke" fontFamily="system-ui, sans-serif">
              SUMMON
            </text>
          )}
          {icons.map((s, i) => (
            <StatusIcon key={s} s={s} x={-BAR_W / 2 + 6 + i * 14} />
          ))}
        </g>
      )}
    </g>
  );
}
