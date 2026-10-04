// Dev harness: a tiny scripted 2v2 "sim" producing a plausible BattleResult so the arena can be
// verified without the real simulation. Deterministic.
import type {
  AnimState,
  BattleEvent,
  BattleFrame,
  BattleResult,
  DamageType,
  HeroId,
  ProjectileSnapshot,
  SpellId,
  StatusKind,
  Team,
  UnitSnapshot,
  ZoneSnapshot,
} from '../../../core/types.ts';
import { SIM_DT, slotToArena } from '../../../core/constants.ts';

interface FUnit {
  uid: string;
  heroId: HeroId;
  team: Team;
  level: number;
  x: number;
  y: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  anim: AnimState;
  animT: number;
  animDur: number;
  alive: boolean;
  status: Partial<Record<StatusKind, number>>; // until
  range: number;
  speed: number;
  dmg: number;
  ranged: boolean;
  atkCd: number;
  fired: boolean;
  attacks: number;
  target: FUnit | null;
}

interface FProj {
  id: number;
  x: number;
  y: number;
  angle: number;
  team: Team;
  speed: number;
  art: ProjectileSnapshot['art'];
  target: FUnit;
  onHit: (t: number) => void;
}

interface FZone extends ZoneSnapshot {
  onEnd: (t: number) => void;
}

export function makeFakeBattle(): BattleResult {
  const mk = (uid: string, heroId: HeroId, team: Team, col: number, row: number, o: Partial<FUnit>): FUnit => {
    const p = slotToArena(col, row, team);
    return {
      uid,
      heroId,
      team,
      level: 1,
      x: p.x,
      y: p.y,
      facing: team === 'left' ? 1 : -1,
      hp: 600,
      maxHp: 600,
      mana: 200,
      maxMana: 300,
      anim: 'idle',
      animT: 0,
      animDur: 0,
      alive: true,
      status: {},
      range: 70,
      speed: 110,
      dmg: 50,
      ranged: false,
      atkCd: 0.2,
      fired: false,
      attacks: 0,
      target: null,
      ...o,
    };
  };

  const pudge = mk('L1', 'pudge', 'left', 0, 1, { hp: 950, maxHp: 950, dmg: 72, speed: 100, level: 5 });
  const lina = mk('L2', 'lina', 'left', 2, 0, { hp: 560, maxHp: 560, dmg: 64, range: 380, ranged: true, level: 9, maxMana: 420, mana: 260 });
  lina.status.aghanim = Infinity; // holds Aghanim's Scepter (badge + blue cast flash)
  const axe = mk('R1', 'axe', 'right', 0, 1, { hp: 880, maxHp: 880, dmg: 62, speed: 115, level: 5 });
  const drow = mk('R2', 'drow_ranger', 'right', 2, 2, { hp: 520, maxHp: 520, dmg: 52, range: 420, ranged: true, level: 13 });
  const units = [pudge, lina, axe, drow];

  const frames: BattleFrame[] = [];
  const events: BattleEvent[] = [];
  const projs: FProj[] = [];
  const zones: FZone[] = [];
  const delayed: { at: number; fn: (t: number) => void }[] = [];
  let projId = 1;
  let zoneId = 1;
  let winner: Team | 'draw' = 'draw';
  let endAt = -1;
  const damageDealt: Record<string, number> = {};

  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
  const has = (u: FUnit, s: StatusKind, t: number) => (u.status[s] ?? -1) > t;
  const setAnim = (u: FUnit, a: AnimState, dur = 0) => {
    if (u.anim === a && dur === 0) return;
    u.anim = a;
    u.animT = 0;
    u.animDur = dur;
  };
  const enemiesOf = (u: FUnit) => units.filter((v) => v.alive && v.team !== u.team);

  const hit = (t: number, src: FUnit | null, dst: FUnit, amount: number, dmgType: DamageType, crit = false) => {
    if (!dst.alive) return;
    if (dmgType === 'magical' && has(dst, 'spell_immune', t)) return;
    dst.hp -= amount;
    if (src) damageDealt[src.uid] = (damageDealt[src.uid] ?? 0) + amount;
    events.push({ t, kind: 'damage', src: src?.uid ?? null, dst: dst.uid, amount, dmgType, crit });
    if (dst.hp <= 0) {
      dst.hp = 0;
      dst.alive = false;
      dst.status = {};
      setAnim(dst, 'dead');
      events.push({ t, kind: 'death', dst: dst.uid, killer: src?.uid ?? null });
      if (src === pudge) {
        events.push({ t: t + 0.05, kind: 'proc', src: pudge.uid, dst: null, spellId: 'flesh_heap', itemId: null, at: { x: pudge.x, y: pudge.y } });
        events.push({ t: t + 0.05, kind: 'stack', dst: pudge.uid, attr: 'str', amount: 2 });
        pudge.maxHp += 40;
        pudge.hp += 40;
      }
    }
  };

  const status = (t: number, u: FUnit, s: StatusKind, d: number) => {
    u.status[s] = t + d;
    events.push({ t, kind: 'status', dst: u.uid, status: s, duration: d });
  };

  const cast = (t: number, u: FUnit, spellId: SpellId, to: FUnit | { x: number; y: number }, radius: number, castPoint: number, fn: (t: number) => void) => {
    setAnim(u, 'cast', castPoint + 0.2);
    u.atkCd = Math.max(u.atkCd, castPoint + 0.2);
    events.push({ t, kind: 'cast', src: u.uid, spellId, dst: 'uid' in to ? to.uid : null, from: { x: u.x, y: u.y }, to: { x: to.x, y: to.y }, radius });
    delayed.push({ at: t + castPoint, fn });
  };

  // scripted spell / item timeline
  const script: { at: number; fn: (t: number) => void; done?: boolean }[] = [
    {
      at: 0.5,
      fn: (t) => {
        events.push({ t, kind: 'item', src: drow.uid, itemId: 'black_king_bar', at: { x: drow.x, y: drow.y } });
        status(t, drow, 'spell_immune', 2.2);
      },
    },
    {
      at: 0.7,
      fn: (t) =>
        cast(t, pudge, 'meat_hook', drow, 0, 0.3, (t2) => {
          projs.push({
            id: projId++,
            x: pudge.x,
            y: pudge.y,
            angle: 0,
            team: 'left',
            speed: 750,
            art: { kind: 'spell', spellId: 'meat_hook' },
            target: drow,
            onHit: (t3) => {
              hit(t3, pudge, drow, 140, 'pure');
              // drag drow toward pudge (snaps: teleport threshold)
              const k = 140 / Math.max(1, dist(drow, pudge));
              drow.x += (pudge.x - drow.x) * k;
              drow.y += (pudge.y - drow.y) * k;
              status(t3, drow, 'stunned', 0.4);
            },
          });
          void t2;
        }),
    },
    {
      at: 1.5,
      fn: (t) => {
        const at = { x: axe.x, y: axe.y };
        cast(t, lina, 'light_strike_array', at, 90, 0.35, (t2) => {
          zones.push({
            id: zoneId++,
            spellId: 'light_strike_array',
            itemId: null,
            x: at.x,
            y: at.y,
            radius: 90,
            t: 0,
            duration: 0.5,
            team: 'left',
            onEnd: (t3) => {
              for (const e of enemiesOf(lina)) {
                if (dist(e, at) <= 100) {
                  hit(t3, lina, e, 170, 'magical');
                  if (!has(e, 'spell_immune', t3)) status(t3, e, 'stunned', 1.2);
                }
              }
            },
          });
          void t2;
        });
        lina.mana -= 100;
      },
    },
    {
      at: 2.4,
      fn: (t) => {
        events.push({ t, kind: 'item', src: pudge.uid, itemId: 'satanic', at: { x: pudge.x, y: pudge.y } });
        status(t, pudge, 'buffed', 2);
        for (let i = 0; i < 4; i++) delayed.push({ at: t + 0.3 + i * 0.4, fn: (t2) => {
          if (!pudge.alive) return;
          const amt = 45;
          pudge.hp = Math.min(pudge.maxHp, pudge.hp + amt);
          events.push({ t: t2, kind: 'heal', dst: pudge.uid, amount: amt });
        } });
      },
    },
    {
      at: 2.9,
      fn: (t) => {
        const tgt = axe.alive ? axe : drow;
        cast(t, lina, 'laguna_blade', tgt, 0, 0.3, (t2) => hit(t2, lina, tgt, 380, 'magical'));
        lina.mana -= 150;
      },
    },
    {
      at: 3.4,
      fn: (t) => {
        status(t, lina, 'burning', 2);
        status(t, pudge, 'rooted', 1.2);
      },
    },
    {
      at: 4.2,
      fn: (t) => {
        if (!drow.alive) return;
        const at = { x: drow.x, y: drow.y };
        cast(t, lina, 'dragon_slave', at, 0, 0.3, (t2) => {
          for (const e of enemiesOf(lina)) if (dist(e, at) < 120) hit(t2, lina, e, 230, 'magical');
        });
        lina.mana -= 90;
      },
    },
  ];

  const MAX_T = 8;
  for (let step = 0; step * SIM_DT <= MAX_T; step++) {
    const t = +(step * SIM_DT).toFixed(4);

    for (const s of script) if (!s.done && t >= s.at) {
      s.done = true;
      s.fn(t);
    }
    for (let i = delayed.length - 1; i >= 0; i--) {
      if (t >= delayed[i]!.at) {
        const d = delayed.splice(i, 1)[0]!;
        d.fn(t);
      }
    }

    // units
    for (const u of units) {
      u.animT += SIM_DT;
      if (!u.alive) continue;
      u.mana = Math.min(u.maxMana, u.mana + 6 * SIM_DT);
      u.atkCd -= SIM_DT;
      if (has(u, 'stunned', t)) {
        setAnim(u, 'idle');
        continue;
      }
      const foes = enemiesOf(u);
      if (!foes.length) {
        setAnim(u, 'idle');
        continue;
      }
      if (!u.target || !u.target.alive) u.target = foes.reduce((a, b) => (dist(u, a) <= dist(u, b) ? a : b));
      const tg = u.target;
      u.facing = tg.x >= u.x ? 1 : -1;
      if (u.anim === 'cast' && u.animT < u.animDur) continue;
      if (u.anim === 'attack' && u.animT < u.animDur) {
        if (!u.fired && u.animT >= 0.3) {
          u.fired = true;
          u.attacks++;
          const crit = u === drow && u.attacks % 4 === 0;
          const miss = u === axe && u.attacks % 5 === 0;
          const dmg = u.dmg * (crit ? 2.2 : 1) * (0.9 + ((u.attacks * 7) % 5) * 0.05);
          events.push({ t, kind: 'attack', src: u.uid, dst: tg.uid });
          const land = (t2: number) => {
            if (miss) events.push({ t: t2, kind: 'miss', src: u.uid, dst: tg.uid });
            else {
              hit(t2, u, tg, Math.round(dmg), 'physical', crit);
              // axe counter helix on being attacked
              if (tg === axe && axe.alive && u.attacks % 2 === 0) {
                events.push({ t: t2, kind: 'proc', src: axe.uid, dst: null, spellId: 'counter_helix', itemId: null, at: { x: axe.x, y: axe.y } });
                for (const e of enemiesOf(axe)) if (dist(e, axe) < 140) hit(t2, axe, e, 70, 'pure');
              }
            }
          };
          if (u.ranged) {
            projs.push({ id: projId++, x: u.x + u.facing * 20, y: u.y, angle: 0, team: u.team, speed: 900, art: { kind: 'attack', heroId: u.heroId }, target: tg, onHit: land });
          } else land(t);
        }
        continue;
      }
      const d = dist(u, tg);
      if (d > u.range) {
        if (has(u, 'rooted', t)) {
          setAnim(u, 'idle');
          continue;
        }
        setAnim(u, 'walk');
        const k = Math.min(1, (u.speed * SIM_DT) / d);
        u.x += (tg.x - u.x) * k;
        u.y += (tg.y - u.y) * k;
      } else if (u.atkCd <= 0) {
        setAnim(u, 'attack', 0.6);
        u.fired = false;
        u.atkCd = 1.05;
      } else if (u.anim !== 'idle') setAnim(u, 'idle');
    }

    // projectiles
    for (let i = projs.length - 1; i >= 0; i--) {
      const p = projs[i]!;
      const dx = p.target.x - p.x;
      const dy = p.target.y - p.y;
      const d = Math.hypot(dx, dy);
      p.angle = Math.atan2(dy, dx);
      const mv = p.speed * SIM_DT;
      if (d <= mv) {
        projs.splice(i, 1);
        p.onHit(t);
      } else {
        p.x += (dx / d) * mv;
        p.y += (dy / d) * mv;
      }
    }

    // zones
    for (let i = zones.length - 1; i >= 0; i--) {
      const z = zones[i]!;
      z.t += SIM_DT;
      if (z.t >= z.duration) {
        zones.splice(i, 1);
        z.onEnd(t);
      }
    }

    frames.push({
      t,
      units: units.map(
        (u): UnitSnapshot => ({
          uid: u.uid,
          heroId: u.heroId,
          team: u.team,
          level: u.level,
          x: u.x,
          y: u.y,
          facing: u.facing,
          hp: Math.max(0, u.hp),
          maxHp: u.maxHp,
          mana: Math.max(0, u.mana),
          maxMana: u.maxMana,
          anim: u.anim,
          animT: u.animT,
          animDur: u.animDur,
          alive: u.alive,
          statuses: (Object.keys(u.status) as StatusKind[]).filter((s) => has(u, s, t)),
        }),
      ),
      projectiles: projs.map((p) => ({ id: p.id, x: p.x, y: p.y, angle: p.angle, team: p.team, art: p.art })),
      zones: zones.map(({ onEnd: _onEnd, ...z }) => ({ ...z })),
    });

    if (endAt < 0) {
      const l = units.some((u) => u.team === 'left' && u.alive);
      const r = units.some((u) => u.team === 'right' && u.alive);
      if (!l || !r) {
        winner = l ? 'left' : r ? 'right' : 'draw';
        endAt = t + 0.6;
      }
    }
    if (endAt >= 0 && t >= endAt) break;
  }

  const duration = frames[frames.length - 1]!.t;
  events.push({ t: duration, kind: 'end', winner });
  return {
    winner,
    duration,
    seed: 1,
    frames,
    events,
    survivors: {
      left: units.filter((u) => u.team === 'left' && u.alive).map((u) => u.uid),
      right: units.filter((u) => u.team === 'right' && u.alive).map((u) => u.uid),
    },
    gains: { L1: { str: 2, agi: 0, int: 0, kills: 1 } },
    damageDealt,
  };
}
