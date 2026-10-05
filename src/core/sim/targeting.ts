// Target selection: spell TargetRules and class-based attack targeting.
import type { AiCondition, TargetRule } from '../types.ts';
import { isHidden, type Tgt, type Unit } from './unit.ts';
import { BODY, dist, type World } from './world.ts';

export const RELAX_AOE_AFTER = 6;

const ENEMY_RULES = new Set<TargetRule>([
  'current_target',
  'nearest_enemy',
  'farthest_enemy',
  'lowest_hp_enemy',
  'highest_hp_enemy',
  'random_enemy',
  'enemy_cluster',
  'backline_enemy',
  'all_enemies',
]);
export const isEnemyRule = (r: TargetRule) => ENEMY_RULES.has(r);

const single = (u: Unit): Tgt => ({ primary: u, units: [u], point: { x: u.x, y: u.y } });
export const tgtOf = single;

const minBy = (arr: Unit[], f: (u: Unit) => number): Unit | null => {
  let best: Unit | null = null;
  let bv = Infinity;
  for (const u of arr) {
    const v = f(u);
    if (v < bv) {
      bv = v;
      best = u;
    }
  }
  return best;
};

/** Enemies a spell/item may target: alive, not invulnerable, not spell immune. */
export function spellEnemies(w: World, caster: Unit, range: number): Unit[] {
  const out: Unit[] = [];
  for (const o of w.units) {
    if (!o.alive || o.team === caster.team) continue;
    if (isHidden(o, w.t) || o.immuneUntil > w.t) continue;
    if (range > 0 && dist(caster, o) > range + BODY * 2) continue;
    out.push(o);
  }
  return out;
}

export function backlineOf(units: Unit[]): Unit | null {
  // enemy farthest from its own team's front: left (bottom) team's back is large y, right (top) team's back is small y
  return minBy(units, (u) => (u.team === 'left' ? -u.y : u.y) + u.x * 1e-6);
}

export function resolveTarget(w: World, caster: Unit, rule: TargetRule, range: number, aoe?: number): Tgt | null {
  const d = (u: Unit) => dist(caster, u) + u.i * 1e-6;
  if (rule === 'self') return single(caster);
  if (rule === 'lowest_hp_ally' || rule === 'all_allies') {
    let allies = w.alliesOf(caster);
    if (range > 0) allies = allies.filter((a) => a === caster || dist(caster, a) <= range + BODY * 2);
    if (allies.length === 0) return null;
    if (rule === 'all_allies') return { primary: caster, units: allies, point: { x: caster.x, y: caster.y } };
    const low = minBy(allies, (a) => a.hp / a.cur.maxHp + a.i * 1e-6)!;
    return single(low);
  }
  const cands = spellEnemies(w, caster, range);
  if (cands.length === 0) return null;
  switch (rule) {
    case 'current_target': {
      const ct = caster.target;
      if (ct && cands.includes(ct)) return single(ct);
      return single(minBy(cands, d)!);
    }
    case 'nearest_enemy':
      return single(minBy(cands, d)!);
    case 'farthest_enemy':
      return single(minBy(cands, (u) => -d(u))!);
    case 'lowest_hp_enemy':
      return single(minBy(cands, (u) => u.hp + u.i * 1e-6)!);
    case 'highest_hp_enemy':
      return single(minBy(cands, (u) => -u.hp + u.i * 1e-6)!);
    case 'random_enemy':
      return single(w.rng.pick(cands));
    case 'backline_enemy':
      return single(backlineOf(cands)!);
    case 'all_enemies': {
      const p = minBy(cands, d)!;
      return { primary: p, units: cands, point: { x: p.x, y: p.y } };
    }
    case 'enemy_cluster': {
      const r = aoe && aoe > 0 ? aoe : 200;
      const all = spellEnemies(w, caster, 0);
      let best: Unit = cands[0]!;
      let bestN = -1;
      let bestD = Infinity;
      for (const c of cands) {
        let n = 0;
        for (const o of all) if (dist(c, o) <= r) n++;
        const dd = d(c);
        if (n > bestN || (n === bestN && dd < bestD)) {
          best = c;
          bestN = n;
          bestD = dd;
        }
      }
      // centroid of enemies around best, pulled toward best so it stays a valid hit
      let sx = 0;
      let sy = 0;
      let k = 0;
      for (const o of all) {
        if (dist(best, o) <= r) {
          sx += o.x;
          sy += o.y;
          k++;
        }
      }
      const point = k > 0 ? { x: (sx / k + best.x) / 2, y: (sy / k + best.y) / 2 } : { x: best.x, y: best.y };
      return { primary: best, units: [best], point };
    }
    default:
      return single(minBy(cands, d)!);
  }
}

export function aiAllows(w: World, caster: Unit, ai: AiCondition | undefined, tgt: Tgt, range: number, aoe: number | undefined): boolean {
  if (!ai) return true;
  if (ai.minBattleTime !== undefined && w.t < ai.minBattleTime) return false;
  if (ai.selfHpBelowPct !== undefined && (caster.hp / caster.cur.maxHp) * 100 >= ai.selfHpBelowPct) return false;
  if (ai.targetHpBelowPct !== undefined) {
    const p = tgt.primary;
    if (!p || (p.hp / p.cur.maxHp) * 100 >= ai.targetHpBelowPct) return false;
  }
  if (ai.allyHpBelowPct !== undefined) {
    const ok = w.alliesOf(caster).some((a) => (a.hp / a.cur.maxHp) * 100 < ai.allyHpBelowPct!);
    if (!ok) return false;
  }
  if (ai.minEnemiesInRange !== undefined && ai.minEnemiesInRange > 0) {
    // after a while, settle for any single enemy so AoE spells don't sit unused all battle
    const need = w.t >= RELAX_AOE_AFTER ? 1 : ai.minEnemiesInRange;
    const all = spellEnemies(w, caster, 0);
    let n = 0;
    if (aoe && aoe > 0) {
      for (const o of all) if (dist(tgt.point, o) <= aoe + BODY) n++;
    } else if (range > 0) {
      for (const o of all) if (dist(caster, o) <= range + BODY * 2) n++;
    } else n = all.length;
    if (n < need) return false;
  }
  return true;
}

/** Class-aware attack target pick (assassins keep their locked backline target). */
export function pickAttackTarget(w: World, u: Unit): Unit | null {
  const cands = w.attackable(u);
  if (cands.length === 0) return null;
  const cur = u.target;
  const valid = cur && cur.alive && !isHidden(cur, w.t) && cur.team !== u.team;
  if (valid && u.lockTarget) return cur;
  if (valid && w.t < u.retargetAt) return cur;
  u.retargetAt = w.t + 0.5;
  u.lockTarget = false;
  const nearest = minBy(cands, (o) => dist(u, o) + o.i * 1e-6)!;
  if (valid && cur !== nearest && dist(u, cur!) <= dist(u, nearest) + 40) return cur;
  return nearest;
}
