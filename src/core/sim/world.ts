// Battle world state + damage/heal/status primitives. No effect interpretation here.
import type { BattleEvent, DamageType, ItemId, ProjectileSnapshot, SpellId, StatusKind, Team, Vec } from '../types.ts';
import type { Rng } from '../rng.ts';
import { ARENA_H, ARENA_W, FLOOR } from '../constants.ts';
import { armorMult } from '../stats.ts';
import type { Unit } from './unit.ts';
import type { PassiveEntry } from '../stats.ts';

export const BODY = 18;

export interface Projectile {
  id: number;
  x: number;
  y: number;
  angle: number;
  team: Team;
  speed: number;
  target: Unit | null; // homing target
  tx: number;
  ty: number;
  line: { dx: number; dy: number; left: number; halfW: number; hit: Set<number>; team: Team } | null;
  art: ProjectileSnapshot['art'];
  onHit: (u: Unit) => void;
  done: boolean;
}

export interface Zone {
  id: number;
  spellId: SpellId | null;
  itemId: ItemId | null;
  caster: Unit;
  team: Team;
  x: number;
  y: number;
  radius: number;
  duration: number;
  delay: number;
  tickEvery: number;
  t: number;
  nextTick: number;
  follow: boolean;
  channel: boolean;
  pull: number;
  affects: 'enemies' | 'allies' | 'all';
  onTick: (z: Zone) => void;
  done: boolean;
}

export interface Task {
  at: number;
  seq: number;
  fn: () => void;
}

export interface DmgOpts {
  attack?: boolean;
  spell?: boolean;
  dot?: boolean;
  crit?: boolean;
}

export const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

export class World {
  t = 0;
  units: Unit[] = [];
  projectiles: Projectile[] = [];
  zones: Zone[] = [];
  tasks: Task[] = [];
  events: BattleEvent[] = [];
  nextId = 1;
  taskSeq = 0;
  gains: Record<string, { str: number; agi: number; int: number; kills: number }> = {};
  damageDealt: Record<string, number> = {};

  constructor(
    public rng: Rng,
    public record: boolean,
  ) {}

  emit(e: BattleEvent): void {
    if (this.record) this.events.push(e);
  }

  schedule(delay: number, fn: () => void): void {
    this.tasks.push({ at: this.t + delay, seq: this.taskSeq++, fn });
  }

  status(u: Unit, status: StatusKind, duration: number): void {
    if (this.record) this.events.push({ t: this.t, kind: 'status', dst: u.uid, status, duration });
  }

  proc(src: Unit, dst: Unit | null, pe: { spellId: SpellId | null; itemId: ItemId | null } | PassiveEntry, at?: Vec): void {
    if (!this.record) return;
    const p = at ?? (dst ? { x: dst.x, y: dst.y } : { x: src.x, y: src.y });
    this.events.push({
      t: this.t,
      kind: 'proc',
      src: src.uid,
      dst: dst ? dst.uid : null,
      spellId: pe.spellId,
      itemId: pe.itemId,
      at: { x: p.x, y: p.y },
    });
  }

  clampPos(u: Unit): void {
    if (!Number.isFinite(u.x)) u.x = ARENA_W / 2;
    if (!Number.isFinite(u.y)) u.y = ARENA_H / 2;
    u.x = Math.max(FLOOR.x0, Math.min(FLOOR.x1, u.x));
    u.y = Math.max(FLOOR.y0, Math.min(FLOOR.y1, u.y));
  }

  isInvuln(u: Unit): boolean {
    return u.invulnUntil > this.t;
  }
  isImmune(u: Unit): boolean {
    return u.immuneUntil > this.t;
  }

  /** Cancel cast / channel / attack windup. Omnislash cannot be interrupted. */
  interrupt(u: Unit): void {
    const a = u.action;
    if (a.k === 'channel') {
      const z = this.zones.find((z) => z.id === a.zoneId);
      if (z) z.done = true;
    }
    if (a.k !== 'omni') u.action = { k: 'none' };
  }

  stun(u: Unit, dur: number): void {
    if (dur <= 0) return;
    u.stunUntil = Math.max(u.stunUntil, this.t + dur);
    this.interrupt(u);
    this.status(u, 'stunned', dur);
  }

  heal(u: Unit, amount: number): number {
    if (!u.alive || !(amount > 0)) return 0;
    const before = u.hp;
    u.hp = Math.min(u.cur.maxHp, u.hp + amount);
    const got = u.hp - before;
    if (got >= 1 && this.record) this.events.push({ t: this.t, kind: 'heal', dst: u.uid, amount: Math.round(got) });
    return got;
  }

  addMana(u: Unit, amount: number): void {
    if (!u.alive) return;
    u.mana = Math.max(0, Math.min(u.cur.maxMana, u.mana + amount));
  }

  dealDamage(src: Unit | null, dst: Unit, amount: number, type: DamageType, o: DmgOpts = {}): number {
    if (!dst.alive || !(amount > 0)) return 0;
    if (dst.invulnUntil > this.t) return 0;
    if (type === 'magical' && dst.immuneUntil > this.t && (!src || src.team !== dst.team)) return 0;
    let a = amount;
    if (o.spell && src) a *= 1 + Math.max(-90, src.cur.spellAmp) / 100;
    if (type === 'physical') a *= armorMult(dst.cur.armor);
    else if (type === 'magical') a *= 1 - Math.max(-100, Math.min(95, dst.cur.magicResist)) / 100;
    a *= 1 - Math.max(-100, Math.min(90, dst.cur.damageReduction)) / 100;
    if (!(a > 0)) return 0;
    let hp = dst.hp - a;
    if (hp < 1 && dst.graveUntil > this.t) hp = 1;
    const dealt = Math.max(0, dst.hp - hp);
    dst.hp = hp;
    if (src) this.damageDealt[src.uid] = (this.damageDealt[src.uid] ?? 0) + dealt;
    if (this.record) {
      this.events.push({
        t: this.t,
        kind: 'damage',
        src: src ? src.uid : null,
        dst: dst.uid,
        amount: Math.max(1, Math.round(a)),
        dmgType: type,
        crit: !!o.crit,
      });
    }
    this.addMana(dst, o.attack ? 5 : o.dot ? 0 : 2);
    if (src && src.alive && dealt > 0) {
      const ls = o.attack ? src.cur.lifesteal : o.spell ? src.cur.spellLifesteal : 0;
      if (ls > 0) this.heal(src, (dealt * ls) / 100);
    }
    if (dst.hp <= 0) this.kill(dst, src);
    return dealt;
  }

  kill(dst: Unit, killer: Unit | null): void {
    if (!dst.alive) return;
    this.interrupt(dst);
    dst.action = { k: 'none' };
    dst.alive = false;
    dst.hp = 0;
    dst.dots = [];
    for (const z of this.zones) if (z.caster === dst && z.channel) z.done = true;
    this.emit({ t: this.t, kind: 'death', dst: dst.uid, killer: killer ? killer.uid : null });
    if (killer && killer !== dst && killer.team !== dst.team) {
      const g = this.gains[killer.uid];
      if (g) g.kills += 1;
      for (const pe of killer.killStacks) {
        if (pe.p.t !== 'on_kill_stack') continue;
        const amt = pe.p.amount;
        if (!amt) continue;
        if (g) g[pe.p.attr] += amt;
        if (killer.alive) killer.buffs.push({ stat: pe.p.attr, value: amt, until: Infinity, show: false });
        this.emit({ t: this.t, kind: 'stack', dst: killer.uid, attr: pe.p.attr, amount: amt });
      }
    }
  }

  enemiesOf(u: Unit): Unit[] {
    return this.units.filter((o) => o.alive && o.team !== u.team);
  }
  alliesOf(u: Unit): Unit[] {
    return this.units.filter((o) => o.alive && o.team === u.team);
  }

  /** Units that can be chosen as an attack target. */
  attackable(u: Unit): Unit[] {
    return this.units.filter((o) => o.alive && o.team !== u.team && o.invulnUntil <= this.t);
  }
}
