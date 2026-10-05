// Basic attacks and attack-related passives.
import type { PassiveDef } from '../types.ts';
import { teamDirY } from '../constants.ts';
import { SPELLS } from '../data/index.ts';
import { asPct, type PassiveEntry } from '../stats.ts';
import type { Unit } from './unit.ts';
import { BODY, dist, type World } from './world.ts';
import { applyEffects, type Ctx } from './effects.ts';
import { tgtOf } from './targeting.ts';

const chanceOf = (c: number) => Math.max(0, Math.min(100, asPct(c))) / 100;
const ctxOf = (u: Unit, pe: PassiveEntry): Ctx => ({ caster: u, spellId: pe.spellId, itemId: pe.itemId, mult: pe.mult, spell: true });

/** Attack release point reached: melee hits now, ranged spawns a projectile. */
export function releaseAttack(w: World, u: Unit, target: Unit): void {
  w.emit({ t: w.t, kind: 'attack', src: u.uid, dst: target.uid });
  u.invisUntil = 0; // attacking breaks invisibility
  const extras: Unit[] = [];
  let splitPct = 0;
  let splitPe: PassiveEntry | null = null;
  if (u.splits.length) {
    let n = 0;
    for (const pe of u.splits) {
      const p = pe.p as Extract<PassiveDef, { t: 'split_shot' }>;
      n += Math.max(0, Math.round(p.extraTargets || 0));
      const pct = p.dmgPct > 0 && p.dmgPct <= 2 ? p.dmgPct * 100 : p.dmgPct;
      if (pct > splitPct) {
        splitPct = pct;
        splitPe = pe;
      }
    }
    if (n > 0) {
      const range = u.cur.attackRange + 120;
      const cands = w
        .attackable(u)
        .filter((o) => o !== target && dist(u, o) <= range)
        .sort((a, b) => dist(u, a) - dist(u, b) || a.i - b.i);
      extras.push(...cands.slice(0, n));
      if (extras.length && splitPe) w.proc(u, target, splitPe, { x: u.x, y: u.y });
    }
  }
  const fire = (dst: Unit, frac: number, main: boolean) => {
    if (u.base.ranged || u.cur.attackRange > 150) {
      w.projectiles.push({
        id: w.nextId++,
        x: u.x,
        y: u.y - 10,
        angle: Math.atan2(dst.y - u.y, dst.x - u.x),
        team: u.team,
        speed: u.cur.projectileSpeed || 900,
        target: dst,
        tx: dst.x,
        ty: dst.y,
        line: null,
        art: { kind: 'attack', heroId: u.heroId },
        onHit: (hit) => {
          resolveAttack(w, u, hit, frac, main);
        },
        done: false,
      });
    } else resolveAttack(w, u, dst, frac, main);
  };
  fire(target, 1, true);
  for (const x of extras) fire(x, splitPct / 100, false);
}

export function resolveAttack(w: World, src: Unit, dst: Unit, frac: number, main: boolean): void {
  if (!dst.alive || dst.invulnUntil > w.t || dst.hypnoUntil > w.t) return;
  // miss: evasion and blind (true strike ignores both)
  if (!src.trueStrike) {
    const hit = (1 - dst.cur.evasion / 100) * (1 - src.cur.blind / 100);
    if (hit < 1 && w.rng.next() >= hit) {
      w.emit({ t: w.t, kind: 'miss', src: src.uid, dst: dst.uid });
      return;
    }
  }
  let dmg = src.cur.damage * frac;
  if (src.furyPerStack > 0) {
    const st = src.swipes.get(dst.i) ?? 0;
    dmg += st * src.furyPerStack;
    src.swipes.set(dst.i, st + 1);
  }
  let crit = 1;
  let critPe: PassiveEntry | null = null;
  for (const pe of src.crits) {
    const p = pe.p as Extract<PassiveDef, { t: 'crit' }>;
    if (w.rng.chance(chanceOf(p.chance))) {
      const mult = p.mult > 10 ? p.mult / 100 : p.mult;
      if (mult > crit) {
        crit = mult;
        critPe = pe;
      }
    }
  }
  if (critPe) {
    dmg *= crit;
    w.proc(src, dst, critPe);
  }
  w.dealDamage(src, dst, dmg, 'physical', { attack: true, crit: !!critPe });
  for (const pe of src.bonusDmg) {
    const p = pe.p as Extract<PassiveDef, { t: 'bonus_attack_damage' }>;
    const v = src.cur[p.attr] * (p.mult || 0) * frac;
    if (v > 0 && dst.alive) w.dealDamage(src, dst, v, p.dmgType || 'pure', { attack: false });
  }
  if (main) w.addMana(src, 10);
  else w.addMana(src, 3);
  if (!main) return;

  // Sniper lord headshot: bonus physical damage + knockback away from the attacker
  const hs = src.headshot;
  if (hs && dst.alive && w.rng.chance(chanceOf(hs.chance))) {
    w.proc(src, dst, { spellId: SPELLS.headshot ? 'headshot' : null, itemId: null });
    if (hs.damage > 0) w.dealDamage(src, dst, hs.damage, 'physical', {});
    if (dst.alive && hs.knockback > 0) {
      const dd = dist(src, dst);
      const dx = dd < 1 ? 0 : (dst.x - src.x) / dd;
      const dy = dd < 1 ? -teamDirY(dst.team) : (dst.y - src.y) / dd;
      dst.x += dx * hs.knockback;
      dst.y += dy * hs.knockback;
      w.clampPos(dst);
    }
  }

  for (const pe of src.onAttack) {
    const p = pe.p as Extract<PassiveDef, { t: 'on_attack' }>;
    if (!dst.alive) break;
    if (w.rng.chance(chanceOf(p.chance))) {
      w.proc(src, dst, pe);
      applyEffects(w, ctxOf(src, pe), p.effects, tgtOf(dst));
    }
  }
  for (const pe of src.steals) {
    const p = pe.p as Extract<PassiveDef, { t: 'on_hit_steal' }>;
    const until = w.t + Math.max(0.5, p.duration || 10);
    src.buffs.push({ stat: p.attr, value: p.amount, until, show: false });
    if (dst.alive) dst.buffs.push({ stat: p.attr, value: -p.amount, until, show: false });
  }
  if (!src.base.ranged && src.cur.attackRange <= 150 && src.cleaves.length) {
    for (const pe of src.cleaves) {
      const p = pe.p as Extract<PassiveDef, { t: 'custom' }>;
      const pct = asPct(p.params?.pct ?? 40);
      const radius = p.params?.radius ?? 150;
      for (const o of w.units) {
        if (!o.alive || o === dst || o.team === src.team || o.invulnUntil > w.t || o.hypnoUntil > w.t) continue;
        if (dist(dst, o) <= radius + BODY) w.dealDamage(src, o, (dmg * pct) / 100, 'physical', {});
      }
    }
  }
  if (dst.alive && src.alive) {
    for (const pe of dst.onAttacked) {
      const p = pe.p as Extract<PassiveDef, { t: 'on_attacked' }>;
      if (w.rng.chance(chanceOf(p.chance))) {
        w.proc(dst, src, pe, { x: dst.x, y: dst.y });
        applyEffects(w, ctxOf(dst, pe), p.effects, tgtOf(src));
      }
    }
  }
}
