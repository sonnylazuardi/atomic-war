// Art contract. Every hero and VFX component is a PURE function of its props (no internal timers):
// the arena drives `t`, so pause / 2x / 4x speed and replays just work.
import type { FC } from 'react';
import type { AnimState, HeroId, SpellId, Team, TerrainId, Vec } from '../core/types.ts';

/**
 * Hero art is drawn in LOCAL coordinates: origin (0,0) at the hero's feet (ground contact, horizontal
 * center), hero ~ 80 units tall (y from -80 to 0), ~ 60 wide, FACING RIGHT (+x). Big ultimates can
 * overflow. The arena wraps it in <g transform="translate(x,y) scale(facing,1)">.
 */
export interface HeroArtProps {
  anim: AnimState;
  /** seconds since `anim` started. Looping anims (idle, walk) should loop on their own period. */
  t: number;
  /** nominal duration of a one-shot anim (attack / cast / hurt); 0 for looping ones */
  dur: number;
  team: Team; // left = radiant-green accent, right = dire-red accent (use TEAM_COLORS)
}

/**
 * Spell VFX are drawn in ARENA coordinates (1000 x 600, y down). One-shot: the component receives
 * t in [0, duration] and should return null when t > duration.
 */
export interface VfxProps {
  t: number;
  duration: number;
  from: Vec; // caster position at cast time
  to: Vec; // target point (== from for self spells)
  radius: number; // aoe radius if any, else 0
  team: Team;
  color: string; // SpellDef.vfx.color
}

/** Zones (black hole, freezing field, rot...) render continuously while alive. Arena coordinates. */
export interface ZoneArtProps {
  t: number; // seconds alive
  duration: number;
  x: number;
  y: number;
  radius: number;
  team: Team;
}

/** Spell projectile drawn at origin pointing +x; arena rotates/translates it. */
export interface ProjectileArtProps {
  t: number; // global battle time (for flicker/spin)
  team: Team;
}

export type HeroArt = FC<HeroArtProps>;
export type VfxArt = FC<VfxProps>;
export type ZoneArt = FC<ZoneArtProps>;
export type ProjectileArt = FC<ProjectileArtProps>;

export interface VfxBundle {
  vfx: Partial<Record<SpellId, VfxArt>>;
  zones: Partial<Record<SpellId, ZoneArt>>;
  projectiles: Partial<Record<SpellId, ProjectileArt>>;
}

export const TEAM_COLORS: Record<Team, string> = { left: '#5fd068', right: '#e5484d' };

/** helpers for procedural animation */
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeOut = (k: number) => 1 - (1 - clamp01(k)) ** 3;
export const easeIn = (k: number) => clamp01(k) ** 3;
/** 0..1..0 bump over k in [0,1] */
export const bump = (k: number) => Math.sin(Math.PI * clamp01(k));
export const loop = (t: number, period: number) => (t % period) / period;

// ---------------------------------------------------------------- terrain & teleport

/**
 * A player's arena, drawn in ARENA coordinates (1000 x 600). Look: Dota-style walled courtyard seen
 * from a high 3/4 top-down camera — stone/wood walls around the edges, themed floor inside, themed
 * scenery (trees, rocks, props) outside the walls. The PLAYABLE FLOOR must cover x 60..940, y 90..560
 * unobstructed (units walk there). Ground is STATIC (rendered once, memoized — may be detailed).
 * Ambient is animated (snowfall, falling leaves, embers, fireflies, water shimmer, torch flicker),
 * drawn ABOVE units, pointer-events none, keep it cheap (< ~80 elements).
 */
export interface TerrainDef {
  id: TerrainId;
  name: string; // "Frostbite Hollow"
  accent: string; // UI accent color for this arena
  Ground: FC;
  Ambient: FC<{ t: number }>;
}

/** Dota town-portal style teleport, ARENA coordinates, at a unit's feet. dir 'out' = vanishing, 'in' = arriving. */
export interface TeleportFxProps {
  t: number;
  duration: number;
  x: number;
  y: number;
  team: Team;
  dir: 'out' | 'in';
}
