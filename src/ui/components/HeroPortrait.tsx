// Animated SVG hero portrait. Driven by the shared clock; art crashes are contained.
import { Component, memo, type ReactNode } from 'react';
import { getHeroArt } from '../../art/registry.tsx';
import type { AnimState, HeroId, Team } from '../../core/types.ts';
import { useClock } from '../useClock.ts';

class ArtBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean; key: string }> {
  state = { failed: false, key: this.props.resetKey };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  static getDerivedStateFromProps(p: { resetKey: string }, s: { failed: boolean; key: string }) {
    return p.resetKey !== s.key ? { failed: false, key: p.resetKey } : null;
  }
  render() {
    if (this.state.failed) return <circle cx={0} cy={-35} r={22} fill="#444" stroke="#888" />;
    return this.props.children;
  }
}

/** showcase: cycles idle -> attack -> idle -> cast (detail panel). */
function pickAnim(t: number, showcase: boolean): { anim: AnimState; at: number; dur: number } {
  if (!showcase) return { anim: 'idle', at: t, dur: 0 };
  const k = t % 7;
  if (k >= 3 && k < 3.7) return { anim: 'attack', at: k - 3, dur: 0.7 };
  if (k >= 6 && k < 7) return { anim: 'cast', at: k - 6, dur: 1 };
  return { anim: 'idle', at: t, dur: 0 };
}

interface Props {
  heroId: HeroId;
  team?: Team;
  showcase?: boolean;
  phase?: number;
  className?: string;
}

function HeroPortraitImpl({ heroId, team = 'left', showcase = false, phase = 0, className }: Props) {
  const t = useClock() + phase;
  const Art = getHeroArt(heroId);
  const { anim, at, dur } = pickAnim(t, showcase);
  return (
    <svg className={`portrait ${className ?? ''}`} viewBox="-52 -100 104 108" preserveAspectRatio="xMidYMax meet" aria-hidden>
      <ellipse cx={0} cy={0} rx={26} ry={6} fill="rgba(0,0,0,0.45)" />
      <ArtBoundary resetKey={heroId}>
        <Art anim={anim} t={at} dur={dur} team={team} />
      </ArtBoundary>
    </svg>
  );
}

export const HeroPortrait = memo(HeroPortraitImpl);

/** Stable pseudo-random phase from a string so portraits don't bob in sync. */
export const phaseOf = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 250;
};
