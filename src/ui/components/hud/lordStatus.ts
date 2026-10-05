// What the V (lord ability) key shows for each lord: badge, progress line and live tooltip notes.
// Reads PlayerState.lordState counters by name — keep in sync with core/game/lords.ts:
//   ember_spirit: forges (total; FORGE_STEP to the Flame Sword, FORGE_STEP more to the Divine Sword)
//   zeus_lord: bolts · luna: blessings (on lordTarget) · bounty_hunter: bank · omniknight: used
import type { LordDef, PlayerState } from '../../../core/types.ts';

export const FORGE_STEP = 9;
export const ZEUS_BASE = 90;
export const ZEUS_PER_BOLT = 45;
export const LUNA_PER_USE = 11;
export const RUBICK_EVERY = 6;

export interface LordStatus {
  /** small badge on the V key */
  badge: string | null;
  /** one-line progress / state for the tooltip */
  line: string | null;
  /** very short label under the key (falls back to the ability name) */
  short: string | null;
  /** coins per use (LordDef.cost) */
  cost: number;
  /** can't afford the next use */
  poor: boolean;
  /** this seat binds a hero (Naga, Spirit Breaker, Luna): its uid */
  boundUid: string | null;
}

const n = (p: PlayerState, k: string) => p.lordState?.[k] ?? 0;

export function lordStatus(p: PlayerState, def: LordDef | null, round: number): LordStatus {
  const cost = def?.cost ?? 0;
  const base: LordStatus = { badge: null, line: null, short: null, cost, poor: cost > 0 && p.coins < cost, boundUid: p.lordTarget ?? null };
  if (!def) return base;
  const costBadge = cost > 0 ? `$${cost}` : null;
  switch (def.id) {
    case 'ember_spirit': {
      const f = n(p, 'forges');
      if (f >= FORGE_STEP * 2) return { ...base, badge: 'done', line: 'Divine Sword forged', short: 'Forged', poor: false };
      const stage = f < FORGE_STEP ? 'Flame Sword' : 'Divine Sword';
      const x = f % FORGE_STEP;
      return { ...base, badge: `${x}/${FORGE_STEP}`, line: `Forge ${x}/${FORGE_STEP} → ${stage}`, short: `→ ${stage}` };
    }
    case 'zeus_lord': {
      const b = n(p, 'bolts');
      const dmg = ZEUS_BASE + ZEUS_PER_BOLT * b;
      return { ...base, badge: costBadge, line: `Bolt ${dmg} dmg · ${b} bolt${b === 1 ? '' : 's'} cast`, short: `Bolt ${dmg} ×${b}` };
    }
    case 'luna': {
      const b = n(p, 'blessings');
      return { ...base, badge: costBadge, line: `+${LUNA_PER_USE * b} dmg on the blessed hero (${b}×)`, short: `+${LUNA_PER_USE * b} dmg` };
    }
    case 'naga_siren':
    case 'spirit_breaker': {
      const bound = p.lordTarget ? p.heroes.find((h) => h.uid === p.lordTarget) : undefined;
      return { ...base, badge: bound ? 'bound' : 'pick', line: bound ? 'Bound · press V to re-pick' : 'Press V and choose a hero' };
    }
    case 'omniknight': {
      const used = n(p, 'used') > 0;
      return { ...base, badge: used ? 'used' : costBadge ?? '1×', line: used ? 'Used this game' : `Once per game${cost ? ` · $${cost}` : ''}`, poor: !used && base.poor };
    }
    case 'bounty_hunter':
      return { ...base, badge: `$${n(p, 'bank')}`, line: `Bank: ${n(p, 'bank')} coins` };
    case 'rubick': {
      const left = (RUBICK_EVERY - (round % RUBICK_EVERY)) % RUBICK_EVERY;
      return { ...base, badge: 'passive', line: left === 0 ? "Free Aghanim's this round" : `Free Aghanim's in ${left} round${left === 1 ? '' : 's'}` };
    }
    default:
      return def.kind === 'passive' ? { ...base, badge: 'passive' } : { ...base, badge: costBadge };
  }
}
