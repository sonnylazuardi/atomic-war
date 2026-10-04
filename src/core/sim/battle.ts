// Owned by sim agent. Deterministic fixed-step battle simulation.
import type {
  AnimState,
  BattleFrame,
  BattleResult,
  BattleTeamInput,
  OwnedHero,
  RunBattle,
  StatusKind,
  Team,
  UnitSnapshot,
} from '../types.ts';
import { teamDirY } from '../constants.ts';
import { BATTLE_TIME_LIMIT, SIM_DT, slotToArena } from '../constants.ts';
import { createRng } from '../rng.ts';
import { createUnit, refreshStats, type SpellSlot, type Tgt, type Unit } from './unit.ts';
import { BODY, dist, World } from './world.ts';
import { aiAllows, backlineOf, isEnemyRule, pickAttackTarget, resolveTarget } from './targeting.ts';
import { applyEffects, omniStep, stepProjectiles, stepZones, type Ctx } from './effects.ts';
import { releaseAttack } from './combat.ts';

const DT = SIM_DT;

function setAnim(u: Unit, s: AnimState, dur: number): void {
  if (u.anim !== s) {
    u.anim = s;
    u.animT = 0;
    u.animDur = dur;
  }
}

// ---------------------------------------------------------------- spells

function selfSpellHasEnemyInReach(w: World, u: Unit, s: SpellSlot): boolean {
  // self-targeted spells that hurt enemies around the caster (rot, freezing field, helix-like) need someone nearby
  let harmful = false;
  let reach = s.def.aoeRadius ?? 0;
  for (const e of s.def.effects) {
    if (e.t === 'zone' && e.affects !== 'allies') {
      harmful = true;
      reach = Math.max(reach, e.radius);
    } else if ((e.t === 'damage' || e.t === 'stun' || e.t === 'slow' || e.t === 'silence' || e.t === 'dot') && e.area) {
      harmful = true;
      reach = Math.max(reach, e.area.shape === 'circle' ? e.area.radius : e.area.length);
    }
  }
  if (!harmful) return true;
  reach = (reach || 250) + 60;
  for (const o of w.units) if (o.alive && o.team !== u.team && dist(u, o) <= reach) return true;
  return false;
}

function implicitOk(w: World, u: Unit, s: SpellSlot, tgt: Tgt): boolean {
  const rule = s.def.target;
  if (rule === 'self' && !selfSpellHasEnemyInReach(w, u, s)) return false;
  // pure heals on a (nearly) full-hp ally are wasted
  if (!s.def.ai && (rule === 'lowest_hp_ally' || rule === 'self' || rule === 'all_allies')) {
    const onlyHeal = s.def.effects.every((e) => e.t === 'heal' || e.t === 'grave' || e.t === 'dispel');
    if (onlyHeal) {
      const p = tgt.primary;
      const low = rule === 'all_allies' ? tgt.units.some((a) => a.hp < a.cur.maxHp * 0.8) : !!p && p.hp < p.cur.maxHp * 0.8;
      if (!low) return false;
    }
  }
  return true;
}

function tryCast(w: World, u: Unit): boolean {
  for (const s of u.spells) {
    if (s.cd > 0) continue;
    const cost = s.def.manaCost || 0;
    if (u.mana < cost) continue;
    const range = s.def.castRange || 0;
    const tgt = resolveTarget(w, u, s.def.target, range, s.def.aoeRadius);
    if (!tgt) continue;
    if (!aiAllows(w, u, s.def.ai, tgt, range, s.def.aoeRadius)) continue;
    if (!implicitOk(w, u, s, tgt)) continue;
    const cp = Math.max(0, s.def.castPoint || 0);
    if (tgt.primary && tgt.primary !== u) u.facing = tgt.primary.x >= u.x ? 1 : -1;
    u.action = { k: 'cast', spell: s, tgt, t: 0 };
    u.anim = 'cast';
    u.animT = 0;
    u.animDur = cp + 0.2;
    if (cp <= 0) releaseCast(w, u);
    return true;
  }
  return false;
}

function releaseCast(w: World, u: Unit): void {
  const a = u.action;
  if (a.k !== 'cast') return;
  const s = a.spell;
  let tgt = a.tgt;
  const p = tgt.primary;
  if (p && p !== u && (!p.alive || (p.team !== u.team && (p.invulnUntil > w.t || p.immuneUntil > w.t)))) {
    const re = resolveTarget(w, u, s.def.target, s.def.castRange ? s.def.castRange * 1.25 : 0, s.def.aoeRadius);
    if (!re) {
      u.action = { k: 'none' };
      return;
    }
    tgt = re;
  } else if (p && tgt.units.length === 1 && s.def.target !== 'enemy_cluster') {
    tgt = { primary: p, units: tgt.units, point: { x: p.x, y: p.y } };
  }
  const cost = s.def.manaCost || 0;
  if (u.mana < cost) {
    u.action = { k: 'none' };
    return;
  }
  u.mana -= cost;
  s.cd = Math.max(0.5, (s.def.cooldown || 0) * (1 - u.cur.cooldownReduction / 100));
  u.action = { k: 'none' };
  w.emit({
    t: w.t,
    kind: 'cast',
    src: u.uid,
    spellId: s.def.id,
    dst: tgt.primary ? tgt.primary.uid : null,
    from: { x: u.x, y: u.y },
    to: { x: tgt.point.x, y: tgt.point.y },
    radius: s.radius,
  });
  const ctx: Ctx = { caster: u, spellId: s.def.id, itemId: null, mult: s.mult, spell: true };
  applyEffects(w, ctx, s.def.effects, tgt);
}

// ---------------------------------------------------------------- items

function fireItem(w: World, u: Unit, idx: number): boolean {
  const it = u.items[idx]!;
  const a = it.def.active;
  if (!a || !u.alive) return false;
  const tgt = resolveTarget(w, u, a.target, 0, undefined);
  if (!tgt) return false;
  if (isEnemyRule(a.target) && !tgt.primary) return false;
  w.emit({ t: w.t, kind: 'item', src: u.uid, itemId: it.def.id, at: { x: u.x, y: u.y } });
  applyEffects(w, { caster: u, spellId: null, itemId: it.def.id, mult: 1, spell: true }, a.effects, tgt);
  return true;
}

function stepItems(w: World, u: Unit, start: boolean): void {
  for (let k = 0; k < u.items.length; k++) {
    const it = u.items[k]!;
    const a = it.def.active;
    if (!a || !u.alive) continue;
    if (a.when === 'battle_start') {
      if (start && !it.used) {
        it.used = true;
        fireItem(w, u, k);
      }
    } else if (a.when === 'low_hp') {
      if (!it.used && !start && u.hp < u.cur.maxHp * 0.35) {
        if (fireItem(w, u, k)) it.used = true;
      }
    } else if (!start) {
      it.cd -= DT;
      if (it.cd <= 0 && u.hexUntil <= w.t && u.stunUntil <= w.t) {
        if (fireItem(w, u, k)) it.cd = Math.max(0.5, a.cooldown ?? 10);
        else it.cd = 0;
      }
    }
  }
}

// ---------------------------------------------------------------- unit AI

function stepUnit(w: World, u: Unit): void {
  u.moved = false;
  if (!u.alive) return;
  const t = w.t;
  if (u.attackCd > 0) u.attackCd -= DT;
  for (const s of u.spells) if (s.cd > 0) s.cd -= DT;

  const a = u.action;
  if (a.k === 'omni') {
    if (t + 1e-9 >= a.next) omniStep(w, u);
    return;
  }
  if (u.stunUntil > t) {
    if (u.action.k !== 'none') w.interrupt(u);
    return;
  }
  const hexed = u.hexUntil > t;
  const silenced = u.silenceUntil > t;
  if (a.k === 'channel') {
    if (hexed || silenced) w.interrupt(u);
    else return;
  }
  if (a.k === 'cast') {
    if (hexed || silenced) {
      u.action = { k: 'none' };
    } else {
      a.t += DT;
      if (a.t + 1e-9 >= (a.spell.def.castPoint || 0)) releaseCast(w, u);
      return;
    }
  }
  if (a.k === 'attack') {
    const tg = a.target;
    if (hexed || !tg.alive || tg.invulnUntil > t) {
      u.action = { k: 'none' };
      u.attackCd = Math.min(u.attackCd, 0.1);
    } else {
      a.t += DT;
      u.facing = tg.x >= u.x ? 1 : -1;
      if (a.t + 1e-9 >= a.point) {
        u.action = { k: 'none' };
        releaseAttack(w, u, tg);
      }
      return;
    }
  }
  // idle: spells first (slot order = priority)
  if (!hexed && !silenced && u.spells.length && tryCast(w, u)) return;

  const tg = pickAttackTarget(w, u);
  u.target = tg;
  if (!tg) return;
  const d = dist(u, tg);
  const reach = u.cur.attackRange + BODY;
  if (d <= reach) {
    u.facing = tg.x >= u.x ? 1 : -1;
    if (!hexed && u.attackCd <= 0) {
      const interval = u.cur.attackInterval;
      u.attackCd = interval;
      u.action = { k: 'attack', target: tg, t: 0, point: 0.35 * interval };
      u.anim = 'attack';
      u.animT = 0;
      u.animDur = Math.max(0.25, Math.min(0.8, interval * 0.7));
      u.animLockUntil = t + u.animDur;
    }
    return;
  }
  const sp = u.cur.moveSpeed * DT;
  if (sp <= 0) return;
  const mv = Math.min(sp, d - (reach - 4));
  if (mv <= 0) return;
  u.x += ((tg.x - u.x) / d) * mv;
  u.y += ((tg.y - u.y) / d) * mv;
  u.facing = tg.x >= u.x ? 1 : -1;
  u.moved = true;
}

function separate(w: World): void {
  const us = w.units;
  const min = BODY * 2;
  for (let i = 0; i < us.length; i++) {
    const a = us[i]!;
    if (!a.alive) continue;
    for (let j = i + 1; j < us.length; j++) {
      const b = us[j]!;
      if (!b.alive) continue;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      if (d >= min) continue;
      if (d < 0.01) {
        const ang = (i * 7 + j * 13) * 0.7;
        dx = Math.cos(ang);
        dy = Math.sin(ang);
      } else {
        dx /= d;
        dy /= d;
      }
      const push = Math.min(4, (min - d) / 2);
      const wa = a.action.k === 'omni' ? 0 : 1;
      const wb = b.action.k === 'omni' ? 0 : 1;
      a.x -= dx * push * wa;
      a.y -= dy * push * wa;
      b.x += dx * push * wb;
      b.y += dy * push * wb;
    }
  }
  for (const u of us) if (u.alive) w.clampPos(u);
}

function updateAnim(w: World, u: Unit): void {
  u.animT += DT;
  if (!u.alive) return setAnim(u, 'dead', 0);
  const a = u.action;
  if (a.k === 'omni') return;
  if (u.stunUntil > w.t) return setAnim(u, 'hurt', 0);
  if (a.k === 'cast') return setAnim(u, 'cast', (a.spell.def.castPoint || 0) + 0.2);
  if (a.k === 'channel') return setAnim(u, 'cast', 0);
  if (a.k === 'attack') return setAnim(u, 'attack', u.animDur);
  if (w.t < u.animLockUntil && (u.anim === 'attack' || u.anim === 'cast')) return;
  setAnim(u, u.moved ? 'walk' : 'idle', 0);
}

// ---------------------------------------------------------------- recording

function statusesOf(w: World, u: Unit): StatusKind[] {
  const t = w.t;
  const out: StatusKind[] = [];
  if (!u.alive) return out;
  if (u.stunUntil > t) out.push('stunned');
  if (u.silenceUntil > t) out.push('silenced');
  if (u.rootUntil > t) out.push('rooted');
  if (u.cur.slow > 0) out.push('slowed');
  if (u.cur.blind > 0) out.push('blinded');
  if (u.hexUntil > t) out.push('hexed');
  if (u.immuneUntil > t) out.push('spell_immune');
  if (u.graveUntil > t) out.push('grave');
  if (u.invulnUntil > t) out.push('invulnerable');
  if (u.buffs.some((b) => b.show && b.until > t)) out.push('buffed');
  if (u.action.k === 'channel') out.push('channeling');
  if (u.dots.length) out.push('burning');
  return out;
}

const r1 = (v: number) => Math.round(v * 10) / 10;

function snapshot(w: World): BattleFrame {
  const units: UnitSnapshot[] = w.units.map((u) => ({
    uid: u.uid,
    heroId: u.heroId,
    team: u.team,
    level: u.level,
    x: r1(u.x),
    y: r1(u.y),
    facing: u.facing,
    hp: Math.max(0, Math.round(u.hp)),
    maxHp: Math.round(u.cur.maxHp),
    mana: Math.round(u.mana),
    maxMana: Math.round(u.cur.maxMana),
    anim: u.anim,
    animT: Math.round(u.animT * 100) / 100,
    animDur: u.animDur,
    alive: u.alive,
    statuses: statusesOf(w, u),
  }));
  return {
    t: Math.round(w.t * 1000) / 1000,
    units,
    projectiles: w.projectiles.map((p) => ({ id: p.id, x: r1(p.x), y: r1(p.y), angle: p.angle, team: p.team, art: p.art })),
    zones: w.zones
      .filter((z) => z.spellId !== null || z.itemId !== null)
      .map((z) => ({ id: z.id, spellId: z.spellId, itemId: z.itemId, x: r1(z.x), y: r1(z.y), radius: z.radius, t: Math.round(z.t * 1000) / 1000, duration: z.delay + z.duration, team: z.team })),
  };
}

// ---------------------------------------------------------------- main

function heroesOf(input: BattleTeamInput | null | undefined): OwnedHero[] {
  return (input?.heroes ?? []).filter((h) => !!h);
}

export const runBattle: RunBattle = (left, right, seed, opts) => {
  const record = !!opts?.record;
  const maxDur = Math.max(DT, opts?.maxDuration ?? BATTLE_TIME_LIMIT);
  const w = new World(createRng(seed), record);
  const frames: BattleFrame[] = [];

  const seen = new Set<string>();
  const spawn = (hero: OwnedHero, team: Team, idx: number, mods: BattleTeamInput['mods']) => {
    let uid = hero.uid || `${team}-${idx}`;
    while (seen.has(uid)) uid += '#';
    seen.add(uid);
    const slot = hero.slot ?? { col: Math.floor(idx / 3) % 4, row: idx % 3 };
    const pos = slotToArena(slot.col, slot.row, team);
    const u = createUnit(hero, uid, w.units.length, team, mods ?? {}, pos);
    w.units.push(u);
    w.gains[uid] = { str: 0, agi: 0, int: 0, kills: 0 };
    w.damageDealt[uid] = 0;
  };
  const lh = heroesOf(left);
  const rh = heroesOf(right);
  lh.forEach((h, i) => spawn(h, 'left', i, left.mods));
  rh.forEach((h, i) => spawn(h, 'right', i, right.mods));

  const finish = (winner: Team | 'draw'): BattleResult => {
    w.emit({ t: w.t, kind: 'end', winner });
    const damageDealt: Record<string, number> = {};
    for (const k of Object.keys(w.damageDealt)) damageDealt[k] = Math.round(w.damageDealt[k]!);
    return {
      winner,
      duration: Math.round(w.t * 1000) / 1000,
      seed,
      frames,
      events: w.events,
      survivors: {
        left: w.units.filter((u) => u.alive && u.team === 'left').map((u) => u.uid),
        right: w.units.filter((u) => u.alive && u.team === 'right').map((u) => u.uid),
      },
      gains: w.gains,
      damageDealt,
    };
  };

  const alive = (team: Team) => w.units.some((u) => u.alive && u.team === team);
  if (record) frames.push(snapshot(w));
  if (!alive('left') || !alive('right')) {
    const la = alive('left');
    const ra = alive('right');
    return finish(la && !ra ? 'left' : ra && !la ? 'right' : 'draw');
  }

  // processing order: interleave teams so neither side always acts first
  const L = w.units.filter((u) => u.team === 'left');
  const R = w.units.filter((u) => u.team === 'right');
  const order: Unit[] = [];
  for (let k = 0; k < Math.max(L.length, R.length); k++) {
    if (L[k]) order.push(L[k]!);
    if (R[k]) order.push(R[k]!);
  }

  // battle start: assassins leap to the enemy backline, battle_start items fire
  for (const u of order) {
    if (u.cls !== 'assassin') continue;
    w.schedule(0.25, () => {
      if (!u.alive || u.stunUntil > w.t || u.action.k !== 'none') return;
      const tg = backlineOf(w.attackable(u));
      if (!tg) return;
      u.x = tg.x; // land behind the target, on the far side from the center line
      u.y = tg.y - teamDirY(tg.team) * 45;
      w.clampPos(u);
      u.facing = tg.x >= u.x ? 1 : -1;
      u.target = tg;
      u.lockTarget = true;
      w.proc(u, tg, { spellId: null, itemId: null }, { x: u.x, y: u.y });
    });
  }
  for (const u of order) stepItems(w, u, true);

  const maxTicks = Math.ceil(maxDur / DT - 1e-9);
  for (let n = 1; n <= maxTicks; n++) {
    w.t = n * DT;
    const t = w.t;
    // auras
    for (const u of w.units) u.auraAcc.length = 0;
    for (const src of w.units) {
      if (!src.alive || src.auras.length === 0) continue;
      for (const pe of src.auras) {
        const p = pe.p;
        if (p.t !== 'aura') continue;
        for (const o of w.units) {
          if (!o.alive) continue;
          const ally = o.team === src.team;
          if (p.affects === 'enemies' && ally) continue;
          if (p.affects === 'allies' && !ally) continue;
          if (o !== src && dist(src, o) > p.radius + BODY) continue;
          o.auraAcc.push({ stat: p.stat, value: p.value * pe.mult, until: Infinity, show: false });
        }
      }
    }
    for (const u of w.units) if (u.alive) refreshStats(u, t);
    // regen + dots
    for (const u of w.units) {
      if (!u.alive) continue;
      if (u.cur.hpRegen !== 0) u.hp = Math.max(Math.min(u.hp, 1), Math.min(u.cur.maxHp, u.hp + u.cur.hpRegen * DT));
      u.mana = Math.max(0, Math.min(u.cur.maxMana, u.mana + u.cur.manaRegen * DT));
      if (u.dots.length) {
        for (const d of u.dots) {
          if (t + 1e-9 >= d.next && d.next <= d.until + 1e-9) {
            d.next += 0.5;
            if (u.alive) w.dealDamage(d.src, u, d.dps * 0.5, d.dmgType, { dot: true, spell: d.spell });
          }
        }
        u.dots = u.dots.filter((d) => d.next <= d.until + 1e-9);
      }
    }
    // scheduled tasks (bounces, assassin leaps)
    if (w.tasks.length) {
      const due = w.tasks.filter((k) => k.at <= t + 1e-9).sort((a, b) => a.at - b.at || a.seq - b.seq);
      if (due.length) {
        w.tasks = w.tasks.filter((k) => k.at > t + 1e-9);
        for (const k of due) k.fn();
      }
    }
    for (const u of order) stepUnit(w, u);
    stepProjectiles(w, DT);
    stepZones(w, DT);
    for (const u of order) if (u.alive) stepItems(w, u, false);
    separate(w);
    for (const u of w.units) updateAnim(w, u);
    if (record) frames.push(snapshot(w));
    const la = alive('left');
    const ra = alive('right');
    if (!la || !ra) return finish(la ? 'left' : ra ? 'right' : 'draw');
  }
  return finish('draw');
};
