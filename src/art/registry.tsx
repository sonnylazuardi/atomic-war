// Merges all art groups and supplies fallbacks so missing art never crashes the arena.
import type { HeroId, SpellId } from '../core/types.ts';
import { heroArtGroup1 } from './heroes/group1.ts';
import { heroArtGroup2 } from './heroes/group2.ts';
import { shopSpellVfx } from './vfx/shopSpells.ts';
import { signatureVfx } from './vfx/signatures.ts';
import { kitAVfx } from './vfx/kitA.ts';
import { kitBVfx } from './vfx/kitB.ts';
import { kitCVfx } from './vfx/kitC.ts';
import { kitDVfx } from './vfx/kitD.ts';
import type { HeroArt, ProjectileArt, VfxArt, ZoneArt } from './types.ts';
import { TEAM_COLORS, bump, clamp01, loop } from './types.ts';

const FallbackHero: HeroArt = ({ anim, t, dur, team }) => {
  const bob = anim === 'walk' ? Math.sin(loop(t, 0.5) * Math.PI * 2) * 3 : Math.sin(t * 2) * 1.5;
  const lunge = anim === 'attack' && dur > 0 ? bump(t / dur) * 10 : 0;
  const fall = anim === 'dead' ? clamp01(t / 0.4) : 0;
  return (
    <g transform={`rotate(${fall * 90}) translate(${lunge},${bob})`} opacity={1 - fall * 0.5}>
      <ellipse cx={0} cy={-30} rx={20} ry={30} fill="#888" stroke={TEAM_COLORS[team]} strokeWidth={3} />
      <circle cx={8} cy={-45} r={4} fill="#fff" />
    </g>
  );
};

const FallbackVfx: VfxArt = ({ t, duration, to, radius, color }) => {
  const k = clamp01(t / duration);
  if (t > duration) return null;
  return <circle cx={to.x} cy={to.y} r={(radius || 40) * k} fill="none" stroke={color} strokeWidth={6 * (1 - k)} opacity={1 - k} />;
};

const FallbackZone: ZoneArt = ({ t, x, y, radius }) => (
  <circle cx={x} cy={y} r={radius} fill="rgba(160,120,255,0.18)" stroke="rgba(200,170,255,0.6)" strokeDasharray="8 6" strokeDashoffset={t * 30} />
);

const FallbackProjectile: ProjectileArt = () => <circle r={6} fill="#ffd36b" />;

const heroArt: Partial<Record<HeroId, HeroArt>> = { ...heroArtGroup1, ...heroArtGroup2 };
const bundles = [signatureVfx, shopSpellVfx, kitAVfx, kitBVfx, kitCVfx, kitDVfx];
const vfx = Object.assign({}, ...bundles.map((b) => b.vfx)) as typeof signatureVfx.vfx;
const zones = Object.assign({}, ...bundles.map((b) => b.zones)) as typeof signatureVfx.zones;
const projectiles = Object.assign({}, ...bundles.map((b) => b.projectiles)) as typeof signatureVfx.projectiles;

export const getHeroArt = (id: HeroId): HeroArt => heroArt[id] ?? FallbackHero;
export const getVfx = (id: SpellId): VfxArt => vfx[id] ?? FallbackVfx;
export const getZoneArt = (id: SpellId): ZoneArt => zones[id] ?? FallbackZone;
export const getProjectileArt = (id: SpellId): ProjectileArt => projectiles[id] ?? FallbackProjectile;
