import { teamDirY } from '../constants.ts';
// Effect primitive executor + zones, projectiles and omnislash stepping.
import type { Area, Effect, ItemId, SpellId, Vec } from '../types.ts';
import { SIM_DT } from '../constants.ts';
import { asPct } from '../stats.ts';
import type { Tgt, Unit } from './unit.ts';
import { BODY, dist, type World, type Zone } from './world.ts';
import { tgtOf } from './targeting.ts';

export interface Ctx {
  caster: Unit;
  spellId: SpellId | null;
  itemId: ItemId | null;
  mult: number; // magnitude multiplier
  spell: boolean; // spell amp + spell lifesteal apply
}

/** durations scale gently with level (full scaling would make lvl-30 stuns absurd) */
const durOf = (ctx: Ctx, d: number) => Math.max(0, d) * (1 + (ctx.mult - 1) * 0.3);

type Polarity = 'harm' | 'help' | 'any' | 'skip';

function polarity(e: Effect): Polarity {
  switch (e.t) {
    case 'damage':
    case 'stun':
    case 'silence':
    case 'root':
    case 'slow':
    case 'blind':
    case 'dot':
    case 'execute':
    case 'pull':
    case 'knockback':
      return 'harm';
    case 'heal':
    case 'grave':
      return 'help';
    case 'buff':
      return e.value >= 0 ? 'help' : 'harm';
    case 'mana':
      return e.amount >= 0 ? 'help' : 'harm';
    case 'dispel':
      return 'any';
    case 'custom':
      if (e.id === 'hex') return 'harm';
      if (e.id === 'spell_immune' || e.id === 'invulnerable' || e.id === 'refresh_cooldowns') return 'help';
      return 'skip';
    default:
      return 'skip'; // structural effects handle their own targets
  }
}

/** pure damage pierces spell immunity */
const piercesImmunity = (e: Effect) => (e.t === 'damage' || e.t === 'dot') && e.dmgType === 'pure';

function canAffect(w: World, ctx: Ctx, u: Unit, e: Effect, pol: Polarity): boolean {
  if (!u.alive) return false;
  const enemy = u.team !== ctx.caster.team;
  if (pol === 'harm' && !enemy) return false;
  if (pol === 'help' && enemy) return false;
  if (enemy) {
    if (u.invulnUntil > w.t) return false;
    if (u.immuneUntil > w.t && !piercesImmunity(e)) return false;
  }
  return true;
}

export function areaUnits(w: World, ctx: Ctx, area: Area, tgt: Tgt): Unit[] {
  const c = ctx.caster;
  const out: Unit[] = [];
  if (area.shape === 'circle') {
    const center = area.center === 'caster' ? { x: c.x, y: c.y } : tgt.point;
    for (const u of w.units) if (u.alive && dist(center, u) <= area.radius + BODY) out.push(u);
    return out;
  }
  let dx = tgt.point.x - c.x;
  let dy = tgt.point.y - c.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) {
    dx = 0;
    dy = teamDirY(c.team);
  } else {
    dx /= len;
    dy /= len;
  }
  for (const u of w.units) {
    if (!u.alive) continue;
    const rx = u.x - c.x;
    const ry = u.y - c.y;
    const along = rx * dx + ry * dy;
    if (along < -BODY || along > area.length + BODY) continue;
    const perp = Math.abs(rx * dy - ry * dx);
    if (perp <= area.width / 2 + BODY) out.push(u);
  }
  return out;
}

function affectsOk(ctx: Ctx, u: Unit, affects: 'enemies' | 'allies' | 'all' | undefined): boolean {
  if (!affects || affects === 'all') return true;
  return affects === 'enemies' ? u.team !== ctx.caster.team : u.team === ctx.caster.team;
}

function targetsFor(w: World, ctx: Ctx, e: Effect, tgt: Tgt): Unit[] {
  const pol = polarity(e);
  const area = 'area' in e ? e.area : undefined;
  const affects = 'affects' in e ? e.affects : undefined;
  if (!area) {
    // explicit self-targeted harmful effects (rot's self-burn) are allowed on the caster itself
    return tgt.units.filter(
      (u) => affectsOk(ctx, u, affects) && (canAffect(w, ctx, u, e, pol) || (pol === 'harm' && u === ctx.caster && u.alive)),
    );
  }
  return areaUnits(w, ctx, area, tgt).filter((u) => affectsOk(ctx, u, affects) && canAffect(w, ctx, u, e, pol));
}

export function applyEffects(w: World, ctx: Ctx, effects: readonly Effect[] | undefined, tgt: Tgt): void {
  if (!effects) return;
  for (const e of effects) {
    try {
      applyEffect(w, ctx, e, tgt);
    } catch {
      // malformed content must never crash a battle
    }
  }
}

function attrVal(u: Unit, a: 'str' | 'agi' | 'int' | undefined): number {
  return a ? u.cur[a] : 0;
}

function applyEffect(w: World, ctx: Ctx, e: Effect, tgt: Tgt): void {
  const c = ctx.caster;
  const m = ctx.mult;
  switch (e.t) {
    case 'damage': {
      for (const u of targetsFor(w, ctx, e, tgt)) {
        let amt = (e.amount || 0) * m;
        if (e.scaleAttr && e.attrMult) amt += attrVal(c, e.scaleAttr) * e.attrMult;
        if (e.pctMissingHp) amt += ((u.cur.maxHp - u.hp) * e.pctMissingHp) / 100;
        if (e.attackMult) amt += c.cur.damage * e.attackMult;
        w.dealDamage(c, u, amt, e.dmgType || 'magical', { spell: ctx.spell });
      }
      return;
    }
    case 'heal': {
      for (const u of targetsFor(w, ctx, e, tgt)) {
        let amt = (e.amount || 0) * m;
        if (e.scaleAttr && e.attrMult) amt += attrVal(c, e.scaleAttr) * e.attrMult;
        if (ctx.spell) amt *= 1 + Math.max(0, c.cur.spellAmp) / 200;
        w.heal(u, amt);
      }
      return;
    }
    case 'stun':
      for (const u of targetsFor(w, ctx, e, tgt)) w.stun(u, durOf(ctx, e.duration));
      return;
    case 'silence':
      for (const u of targetsFor(w, ctx, e, tgt)) {
        const d = durOf(ctx, e.duration);
        u.silenceUntil = Math.max(u.silenceUntil, w.t + d);
        if (u.action.k === 'cast' || u.action.k === 'channel') w.interrupt(u);
        w.status(u, 'silenced', d);
      }
      return;
    case 'root':
      for (const u of targetsFor(w, ctx, e, tgt)) {
        const d = durOf(ctx, e.duration);
        u.rootUntil = Math.max(u.rootUntil, w.t + d);
        w.status(u, 'rooted', d);
      }
      return;
    case 'slow':
      for (const u of targetsFor(w, ctx, e, tgt)) {
        const d = durOf(ctx, e.duration);
        u.slows.push({ pct: Math.min(90, asPct(e.pct)), until: w.t + d });
        w.status(u, 'slowed', d);
      }
      return;
    case 'blind':
      for (const u of targetsFor(w, ctx, e, tgt)) {
        const d = durOf(ctx, e.duration);
        u.blinds.push({ pct: Math.min(100, asPct(e.pct)), until: w.t + d });
        w.status(u, 'blinded', d);
      }
      return;
    case 'buff':
      for (const u of targetsFor(w, ctx, e, tgt)) {
        const d = e.duration > 0 ? durOf(ctx, e.duration) : Infinity;
        u.buffs.push({ stat: e.stat, value: e.value * m, until: w.t + d, show: e.value > 0 });
        if (e.value > 0) w.status(u, 'buffed', Number.isFinite(d) ? d : 999);
      }
      return;
    case 'dot':
      for (const u of targetsFor(w, ctx, e, tgt)) {
        const d = durOf(ctx, e.duration);
        u.dots.push({ dps: e.dps * m, dmgType: e.dmgType || 'magical', until: w.t + d, next: w.t + 0.5, src: c, spell: ctx.spell });
        w.status(u, 'burning', d);
      }
      return;
    case 'zone':
      spawnZone(w, ctx, e, tgt);
      return;
    case 'leap': {
      const p = tgt.primary;
      if (!p || p === c) return;
      if (e.to === 'behind_target') {
        c.x = p.x;
        c.y = p.y - teamDirY(p.team) * 45;
      } else {
        const dd = dist(c, p) || 1;
        c.x = p.x - ((p.x - c.x) / dd) * 45;
        c.y = p.y - ((p.y - c.y) / dd) * 45;
      }
      w.clampPos(c);
      c.facing = p.x >= c.x ? 1 : -1;
      if (p.team !== c.team) {
        c.target = p;
        c.retargetAt = w.t + 1;
      }
      return;
    }
    case 'pull':
      for (const u of targetsFor(w, ctx, e, tgt)) {
        const dd = dist(c, u);
        if (dd < 1) continue;
        const move = Math.min(e.distance, dd - 50);
        if (move <= 0) continue;
        u.x += ((c.x - u.x) / dd) * move;
        u.y += ((c.y - u.y) / dd) * move;
        w.clampPos(u);
      }
      return;
    case 'knockback':
      for (const u of targetsFor(w, ctx, e, tgt)) {
        const dd = dist(c, u);
        const dx = dd < 1 ? 0 : (u.x - c.x) / dd;
        const dy = dd < 1 ? teamDirY(c.team) : (u.y - c.y) / dd;
        u.x += dx * e.distance;
        u.y += dy * e.distance;
        w.clampPos(u);
      }
      return;
    case 'bounce':
      doBounce(w, ctx, e, tgt);
      return;
    case 'projectile':
      spawnSpellProjectiles(w, ctx, e, tgt);
      return;
    case 'execute':
      for (const u of targetsFor(w, ctx, e, tgt)) {
        if ((u.hp / u.cur.maxHp) * 100 <= asPct(e.thresholdPct)) {
          w.proc(c, u, ctx);
          w.dealDamage(c, u, u.hp + 1e6, 'pure', { spell: false });
        } else {
          w.dealDamage(c, u, (e.damage || 0) * m, 'magical', { spell: ctx.spell });
        }
      }
      return;
    case 'grave':
      for (const u of targetsFor(w, ctx, e, tgt)) {
        const d = durOf(ctx, e.duration);
        u.graveUntil = Math.max(u.graveUntil, w.t + d);
        w.status(u, 'grave', d);
      }
      return;
    case 'omnislash': {
      const jumps = Math.max(1, Math.round(e.jumps || 1));
      const interval = Math.max(SIM_DT, e.interval || 0.3);
      c.action = { k: 'omni', left: jumps, next: w.t, interval, attackMult: e.attackMult || 1, spellId: ctx.spellId, itemId: ctx.itemId };
      c.invulnUntil = Math.max(c.invulnUntil, w.t + jumps * interval + 0.15);
      w.status(c, 'invulnerable', jumps * interval + 0.15);
      if (tgt.primary && tgt.primary.team !== c.team) c.target = tgt.primary;
      omniStep(w, c);
      return;
    }
    case 'dispel':
      for (const u of targetsFor(w, ctx, e, tgt)) dispel(w, u, u.team === c.team);
      return;
    case 'mana':
      for (const u of targetsFor(w, ctx, e, tgt)) w.addMana(u, (e.amount || 0) * m);
      return;
    case 'custom':
      applyCustom(w, ctx, e, tgt);
      return;
  }
}

export function dispel(w: World, u: Unit, ally: boolean): void {
  if (ally) {
    u.stunUntil = Math.min(u.stunUntil, w.t);
    u.silenceUntil = Math.min(u.silenceUntil, w.t);
    u.rootUntil = Math.min(u.rootUntil, w.t);
    u.hexUntil = Math.min(u.hexUntil, w.t);
    u.slows = [];
    u.blinds = [];
    u.dots = [];
    u.buffs = u.buffs.filter((b) => b.value >= 0 || !Number.isFinite(b.until));
  } else {
    u.buffs = u.buffs.filter((b) => b.value <= 0 || !Number.isFinite(b.until));
  }
}

function applyCustom(w: World, ctx: Ctx, e: Extract<Effect, { t: 'custom' }>, tgt: Tgt): void {
  const pol = polarity(e);
  if (pol === 'skip') return;
  const dur = Math.max(0, e.params?.duration ?? 3);
  for (const u of targetsFor(w, ctx, e, tgt)) {
    switch (e.id) {
      case 'spell_immune':
        u.immuneUntil = Math.max(u.immuneUntil, w.t + dur);
        dispel(w, u, true);
        w.status(u, 'spell_immune', dur);
        break;
      case 'invulnerable':
        u.invulnUntil = Math.max(u.invulnUntil, w.t + dur);
        w.status(u, 'invulnerable', dur);
        break;
      case 'hex': {
        const d = durOf(ctx, dur);
        u.hexUntil = Math.max(u.hexUntil, w.t + d);
        w.interrupt(u);
        w.status(u, 'hexed', d);
        break;
      }
      case 'refresh_cooldowns':
        for (const s of u.spells) s.cd = 0;
        for (const it of u.items) {
          if (ctx.itemId && it.def.id === ctx.itemId) continue;
          if (it.def.active?.when === 'cooldown') it.cd = 0;
        }
        break;
    }
  }
}

// ---------------------------------------------------------------- bounce

function doBounce(w: World, ctx: Ctx, e: Extract<Effect, { t: 'bounce' }>, tgt: Tgt): void {
  const first = tgt.primary;
  if (!first || !first.alive) return;
  const count = Math.max(1, Math.round(e.count || 1));
  const falloff = e.falloff > 0 ? e.falloff : 1;
  const team = first.team;
  const hit = new Set<number>();
  const step = (cur: Unit, i: number) => {
    hit.add(cur.i);
    applyEffects(w, { ...ctx, mult: ctx.mult * Math.pow(falloff, i) }, e.effects, tgtOf(cur));
    if (i + 1 >= count) return;
    let next: Unit | null = null;
    let bd = Infinity;
    for (const o of w.units) {
      if (!o.alive || o.team !== team || o === cur) continue;
      if (!e.allowRepeat && hit.has(o.i)) continue;
      if (o.team !== ctx.caster.team && (o.invulnUntil > w.t || o.immuneUntil > w.t)) continue;
      const dd = dist(cur, o);
      if (dd <= (e.range || 300) + BODY && dd < bd) {
        bd = dd;
        next = o;
      }
    }
    if (!next) return;
    const n = next;
    w.schedule(0.15, () => {
      if (!n.alive) return;
      w.proc(ctx.caster, n, ctx, { x: n.x, y: n.y });
      step(n, i + 1);
    });
  };
  step(first, 0);
}

// ---------------------------------------------------------------- projectiles

function projArt(ctx: Ctx) {
  return ctx.spellId
    ? ({ kind: 'spell', spellId: ctx.spellId } as const)
    : ({ kind: 'attack', heroId: ctx.caster.heroId } as const);
}

function spawnSpellProjectiles(w: World, ctx: Ctx, e: Extract<Effect, { t: 'projectile' }>, tgt: Tgt): void {
  const c = ctx.caster;
  const speed = e.speed > 0 ? e.speed : 900;
  if (e.line) {
    let dx = tgt.point.x - c.x;
    let dy = tgt.point.y - c.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) {
      dx = 0;
      dy = teamDirY(c.team);
    } else {
      dx /= len;
      dy /= len;
    }
    const team = c.team;
    w.projectiles.push({
      id: w.nextId++,
      x: c.x,
      y: c.y,
      angle: Math.atan2(dy, dx),
      team,
      speed,
      target: null,
      tx: c.x + dx * e.line.length,
      ty: c.y + dy * e.line.length,
      line: { dx, dy, left: Math.max(10, e.line.length), halfW: Math.max(5, e.line.width / 2), hit: new Set(), team },
      art: projArt(ctx),
      onHit: (u) => applyEffects(w, ctx, e.effects, tgtOf(u)),
      done: false,
    });
    return;
  }
  for (const u of tgt.units) {
    if (u === c) {
      applyEffects(w, ctx, e.effects, tgtOf(u));
      continue;
    }
    w.projectiles.push({
      id: w.nextId++,
      x: c.x,
      y: c.y,
      angle: Math.atan2(u.y - c.y, u.x - c.x),
      team: c.team,
      speed,
      target: u,
      tx: u.x,
      ty: u.y,
      line: null,
      art: projArt(ctx),
      onHit: (hit) => applyEffects(w, ctx, e.effects, tgtOf(hit)),
      done: false,
    });
  }
}

export function stepProjectiles(w: World, dt: number): void {
  if (w.projectiles.length === 0) return;
  for (const p of w.projectiles) {
    if (p.done) continue;
    const stepLen = p.speed * dt;
    if (p.line) {
      const L = p.line;
      const mv = Math.min(stepLen, L.left);
      const ox = p.x;
      const oy = p.y;
      p.x += L.dx * mv;
      p.y += L.dy * mv;
      L.left -= mv;
      for (const u of w.units) {
        if (!u.alive || u.team === L.team || L.hit.has(u.i)) continue;
        // distance from u to segment (ox,oy)->(p.x,p.y)
        const sx = p.x - ox;
        const sy = p.y - oy;
        const sl = sx * sx + sy * sy;
        let k = sl > 0 ? ((u.x - ox) * sx + (u.y - oy) * sy) / sl : 0;
        k = Math.max(0, Math.min(1, k));
        const d = Math.hypot(u.x - (ox + sx * k), u.y - (oy + sy * k));
        if (d <= L.halfW + BODY) {
          L.hit.add(u.i);
          p.onHit(u);
        }
      }
      if (L.left <= 0.001) p.done = true;
      continue;
    }
    const tgt = p.target;
    if (tgt && tgt.alive) {
      p.tx = tgt.x;
      p.ty = tgt.y;
    }
    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    const d = Math.hypot(dx, dy);
    if (d <= stepLen + 4) {
      p.x = p.tx;
      p.y = p.ty;
      p.done = true;
      if (tgt && tgt.alive) p.onHit(tgt);
    } else {
      p.x += (dx / d) * stepLen;
      p.y += (dy / d) * stepLen;
      p.angle = Math.atan2(dy, dx);
    }
  }
  w.projectiles = w.projectiles.filter((p) => !p.done);
}

// ---------------------------------------------------------------- zones

function spawnZone(w: World, ctx: Ctx, e: Extract<Effect, { t: 'zone' }>, tgt: Tgt): void {
  const c = ctx.caster;
  const at: Vec = e.at === 'caster' ? { x: c.x, y: c.y } : tgt.point;
  const delay = Math.max(0, e.delay ?? 0);
  const zctx: Ctx = { ...ctx };
  const affects = e.affects ?? 'enemies';
  const selfSafe = (e.effects ?? []).filter((x) => polarity(x) !== 'harm');
  const z: Zone = {
    id: w.nextId++,
    spellId: ctx.spellId,
    itemId: ctx.itemId,
    caster: c,
    team: c.team,
    x: at.x,
    y: at.y,
    radius: Math.max(10, e.radius || 150),
    duration: Math.max(0, e.duration > 0 ? durOf(ctx, e.duration) : 0),
    delay,
    tickEvery: Math.max(SIM_DT, e.tickEvery || 0.5),
    t: 0,
    nextTick: delay,
    follow: !!e.follow,
    channel: !!e.channel,
    pull: e.pullStrength ?? 0,
    affects,
    onTick: (zz) => {
      for (const u of w.units) {
        if (!u.alive || dist(zz, u) > zz.radius + BODY) continue;
        if (!affectsOk(zctx, u, affects)) continue;
        applyEffects(w, zctx, u === c ? selfSafe : e.effects, tgtOf(u));
      }
    },
    done: false,
  };
  w.zones.push(z);
  if (z.channel) {
    w.interrupt(c);
    c.action = { k: 'channel', zoneId: z.id };
    w.status(c, 'channeling', z.delay + z.duration);
  }
}

export function stepZones(w: World, dt: number): void {
  if (w.zones.length === 0) return;
  for (const z of w.zones) {
    if (z.done) continue;
    const c = z.caster;
    if ((z.channel && (!c.alive || c.action.k !== 'channel' || c.action.zoneId !== z.id)) || (z.follow && !c.alive)) {
      z.done = true;
      continue;
    }
    if (z.follow && c.alive) {
      z.x = c.x;
      z.y = c.y;
    }
    z.t += dt;
    if (z.pull > 0 && z.t >= z.delay) {
      for (const u of w.units) {
        if (!u.alive || u === c) continue;
        if (z.affects === 'enemies' && u.team === z.team) continue;
        if (z.affects === 'allies' && u.team !== z.team) continue;
        if (u.team !== z.team && (u.immuneUntil > w.t || u.invulnUntil > w.t)) continue;
        const d = dist(z, u);
        if (d > z.radius + BODY || d < 6) continue;
        const mv = Math.min(z.pull * dt, d - 5);
        u.x += ((z.x - u.x) / d) * mv;
        u.y += ((z.y - u.y) / d) * mv;
      }
    }
    const end = z.delay + z.duration;
    let guard = 0;
    while (z.t + 1e-9 >= z.nextTick && z.nextTick <= end + 1e-9 && guard++ < 50) {
      z.onTick(z);
      z.nextTick += z.tickEvery;
    }
    if (z.t >= end && z.nextTick > end + 1e-9) z.done = true;
  }
  for (const z of w.zones) {
    if (z.done && z.channel && z.caster.action.k === 'channel' && z.caster.action.zoneId === z.id) {
      z.caster.action = { k: 'none' };
    }
  }
  w.zones = w.zones.filter((z) => !z.done);
}

// ---------------------------------------------------------------- omnislash

export function omniStep(w: World, c: Unit): void {
  const a = c.action;
  if (a.k !== 'omni') return;
  if (!c.alive || a.left <= 0) {
    c.action = { k: 'none' };
    return;
  }
  const cands = w.attackable(c);
  if (cands.length === 0) {
    c.action = { k: 'none' };
    return;
  }
  const near = cands.filter((o) => dist(c, o) <= 350);
  const pool = near.length ? near : cands;
  const tgt = c.target && pool.includes(c.target) && a.left === -1 ? c.target : w.rng.pick(pool);
  const side = w.rng.chance(0.5) ? 1 : -1;
  c.x = tgt.x + side * 35;
  c.y = tgt.y + (w.rng.next() - 0.5) * 20;
  w.clampPos(c);
  c.facing = tgt.x >= c.x ? 1 : -1;
  c.anim = 'attack';
  c.animT = 0;
  c.animDur = Math.max(0.2, a.interval);
  c.animLockUntil = w.t + a.interval;
  w.emit({ t: w.t, kind: 'attack', src: c.uid, dst: tgt.uid });
  w.proc(c, tgt, { spellId: a.spellId, itemId: a.itemId });
  w.dealDamage(c, tgt, c.cur.damage * a.attackMult, 'physical', { attack: true });
  a.left -= 1;
  a.next = w.t + a.interval;
  if (a.left <= 0) c.action = { k: 'none' };
}
