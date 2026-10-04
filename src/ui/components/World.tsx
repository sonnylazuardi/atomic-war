// The one persistent world view (PLAN v2 #22). Prep: the human's own courtyard with board heroes idling
// on their formation tiles (pointer-drag to move). Battle: intro teleports (enemy invades, or the human
// teleports to the host's arena), v1 frame playback, result banner, teleport home, onBattleDone().
// A single RAF clock drives everything; all animation state lives in one mutable ref (one React render
// per frame). The human is always drawn on the bottom half in the left/green colors (see world/mirror.ts).
import { useEffect, useRef, useState } from 'react';
import type { DragEvent, ReactNode, PointerEvent as RPointerEvent } from 'react';
import type { BattleResult, BoardSlot, HeroDef, HeroId, OwnedHero, Team, TerrainId, UnitSnapshot } from '../../core/types.ts';
import { ARENA_H, ARENA_W } from '../../core/constants.ts';
import { HEROES } from '../../core/data/index.ts';
import { computeStats } from '../../core/stats.ts';
import { getProjectileArt, getZoneArt } from '../../art/registry.tsx';
import { getAttackProjectileArt } from '../../art/attackProjectiles.tsx';
import { TeleportFx } from '../../art/teleport.tsx';
import { UnitView } from './arena/UnitView.tsx';
import { ItemZone } from './arena/ItemZone.tsx';
import { TextLayer, VfxLayer, pruneEffects } from './arena/effects.tsx';
import { toDisplay } from './world/mirror.ts';
import { advance, currentShake, jumpToEnd, makePlayback } from './world/battlePlayback.ts';
import type { Playback } from './world/battlePlayback.ts';
import { TerrainAmbient, TerrainGround, setTerrain } from './world/terrainLayers.tsx';
import type { TerrainFade } from './world/terrainLayers.tsx';
import { FormationTiles, sameSlot, slotAt, slotPos } from './world/FormationTiles.tsx';
import { WORLD_CSS } from './world/worldCss.ts';
import { BeaconBack, BeaconFront, LevelUpBurst, UpgradeDefs } from './world/upgradeFx.tsx';

export interface WorldProps {
  /** prep: human's own arena, own board heroes idle at their slots. battle: teleport-in, playback, teleport-home. */
  mode: 'prep' | 'battle';
  round: number;
  /** human's board heroes (slot !== null) — what stands in the arena during prep */
  heroes: OwnedHero[];
  homeTerrain: TerrainId; // human's arena
  /** battle mode only */
  battle: BattleResult | null;
  humanSide: Team; // human is 'left' = host (enemy teleports in); 'right' = visitor (human teleports to enemy)
  hostTerrain: TerrainId; // terrain of the arena the battle happens in
  names: { human: string; enemy: string };
  selectedUid: string | null;
  onSelectHero: (uid: string | null) => void;
  /** dragging a hero sprite to another formation tile in prep */
  onPlaceHero: (uid: string, slot: BoardSlot) => void;
  /** HTML5 drops from the HUD (inventory spell/item, bench hero). World only reports the target. */
  onDropOnHero?: (uid: string, e: DragEvent) => void;
  onDropOnSlot?: (slot: BoardSlot, e: DragEvent) => void;
  /** battle mode: fired once after the teleport-home sequence completes (or skip) */
  onBattleDone: () => void;
  /** prep: clicking a hero with pendingUpgrades > 0 (its golden beacon is lit) levels it up */
  onUpgradeHero?: (uid: string) => void;
  /** visible region of the 1000x600 arena (default the whole arena). Mobile uses MOBILE_VIEWBOX. */
  viewBox?: WorldViewBox;
  /** how the viewBox fills the container (default 'slice': cover, HUD overlays the edges) */
  fit?: 'slice' | 'meet';
}

export interface WorldViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const FULL_VIEWBOX: WorldViewBox = { x: 0, y: 0, w: ARENA_W, h: ARENA_H };
/** portrait phones: frames the floor where units stand (lanes x 290..710, feet y 130..470) incl. the
 *  top team's sprites, HP bars and name plates (~110 above the feet). */
export const MOBILE_VIEWBOX: WorldViewBox = { x: 180, y: 12, w: 640, h: 520 };

// ---------------------------------------------------------------- timings (real seconds)
const TP_DUR = 0.9; // teleport fx length
const TP_SHOW = 0.42; // unit becomes visible this long after its TP 'in' starts
const TP_HIDE = 0.3; // unit fades this long after its TP 'out' starts
const FADE = 0.25;
const EMPTY_BANNER = 1.3;
const SPEEDS = [1, 2, 4] as const;

const heroDef = (id: HeroId) => (HEROES as Partial<Record<HeroId, HeroDef>>)[id];
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (k: number) => {
  const c = clamp01(k);
  return c * c * (3 - 2 * c);
};

interface Actor {
  uid: string;
  heroId: HeroId;
  level: number;
  name: string;
  maxHp: number;
  maxMana: number;
  src: OwnedHero | null; // identity cache for stats
  slot: BoardSlot;
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  moveStart: number;
  moveDur: number;
  facing: 1 | -1;
  visibleFrom: number; // clock s
  phase: number; // idle anim desync
  pending: number; // pendingUpgrades (beacon)
  aghs: boolean; // holds Aghanim's Scepter (badge)
  levelUpAt: number; // clock s of the last level increase (burst fx)
}

interface Tp {
  id: number;
  x: number;
  y: number;
  team: Team;
  dir: 'in' | 'out';
  start: number; // clock s (may be in the future)
  flash: boolean;
}

type Phase = 'intro' | 'play' | 'outro' | 'done';

interface Run {
  src: BattleResult | null;
  pb: Playback | null;
  winner: Team | 'draw';
  visiting: boolean;
  phase: Phase;
  start: number;
  phaseStart: number;
  introLen: number;
  /** run-relative switch to the host terrain (intro) */
  switchIn: number;
  speed: number;
  paused: boolean;
  appear: Map<string, number>; // clock s when a battle unit becomes visible
  vanish: Map<string, number>; // clock s when a battle unit fades out
  outroHome: number; // clock s: terrain back home (visiting)
  outroReturn: number; // clock s: heroes re-form at home
  outroEnd: number; // clock s: onBattleDone
  returned: boolean;
  doneCalled: boolean;
}

interface Drag {
  uid: string;
  pointerId: number;
  sx: number;
  sy: number;
  ox: number;
  oy: number;
  x: number;
  y: number;
  moved: boolean;
  hover: BoardSlot | null;
}

interface WS {
  now: number;
  inited: boolean;
  actors: Map<string, Actor>;
  tps: Tp[];
  tpSeq: number;
  terrain: TerrainFade;
  run: Run | null;
  drag: Drag | null;
  floorDown: { x: number; y: number; id: number } | null;
  dnd: { uid: string | null; slot: BoardSlot | null; at: number };
  prepSince: number;
  lastMode: 'prep' | 'battle' | null;
}

const clockNow = () => performance.now() / 1000;

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return ((h >>> 0) % 1000) / 1000;
}

function spawnTp(ws: WS, x: number, y: number, team: Team, dir: 'in' | 'out', start: number, flash = false) {
  ws.tps.push({ id: ws.tpSeq++, x, y, team, dir, start, flash });
}

// ---------------------------------------------------------------- prep actors

function syncActors(ws: WS, heroes: OwnedHero[], quiet: boolean) {
  const now = ws.now;
  const seen = new Set<string>();
  for (const h of heroes) {
    if (!h.slot) continue;
    seen.add(h.uid);
    const target = slotPos(h.slot);
    let a = ws.actors.get(h.uid);
    if (!a) {
      a = {
        uid: h.uid,
        heroId: h.heroId,
        level: h.level,
        name: heroDef(h.heroId)?.name ?? h.heroId,
        maxHp: 0,
        maxMana: 0,
        src: null,
        slot: h.slot,
        x: target.x,
        y: target.y,
        fromX: target.x,
        fromY: target.y,
        toX: target.x,
        toY: target.y,
        moveStart: 0,
        moveDur: 0,
        facing: restFacing(target.x),
        visibleFrom: -1,
        phase: hash(h.uid) * 3,
        pending: h.pendingUpgrades ?? 0,
        aghs: false,
        levelUpAt: -9,
      };
      ws.actors.set(h.uid, a);
      if (!quiet) {
        spawnTp(ws, target.x, target.y, 'left', 'in', now, true);
        a.visibleFrom = now + TP_SHOW;
      }
    }
    if (a.src !== h) {
      if (a.src && h.level > a.level) a.levelUpAt = now;
      a.pending = h.pendingUpgrades ?? 0;
      a.aghs = (h.items ?? []).includes('aghanims_scepter');
      a.src = h;
      a.heroId = h.heroId;
      a.level = h.level;
      a.name = heroDef(h.heroId)?.name ?? h.heroId;
      try {
        const st = computeStats(h);
        a.maxHp = st.maxHp;
        a.maxMana = st.maxMana;
      } catch {
        a.maxHp = 1;
        a.maxMana = 0;
      }
    }
    a.slot = h.slot;
    if (a.toX !== target.x || a.toY !== target.y) moveActor(a, target.x, target.y, now);
  }
  for (const [uid, a] of ws.actors) {
    if (seen.has(uid)) continue;
    ws.actors.delete(uid);
    if (!quiet && ws.drag?.uid !== uid) spawnTp(ws, a.x, a.y, 'left', 'out', now);
  }
}

/** at rest heroes turn toward the middle lane (side-view sprites in a top-down arena) */
const restFacing = (x: number): 1 | -1 => (x <= ARENA_W / 2 ? 1 : -1);

function moveActor(a: Actor, tx: number, ty: number, now: number) {
  a.fromX = a.x;
  a.fromY = a.y;
  a.toX = tx;
  a.toY = ty;
  const d = Math.hypot(tx - a.x, ty - a.y);
  a.moveStart = now;
  a.moveDur = d < 1 ? 0 : Math.min(0.75, Math.max(0.25, d / 420));
  if (Math.abs(tx - a.x) > 2) a.facing = tx > a.x ? 1 : -1;
}

function stepActor(a: Actor, now: number): boolean {
  if (a.moveDur <= 0) {
    a.x = a.toX;
    a.y = a.toY;
    return false;
  }
  const k = (now - a.moveStart) / a.moveDur;
  if (k >= 1) {
    a.x = a.toX;
    a.y = a.toY;
    a.moveDur = 0;
    a.facing = restFacing(a.x);
    return false;
  }
  const e = ease(k);
  a.x = a.fromX + (a.toX - a.fromX) * e;
  a.y = a.fromY + (a.toY - a.fromY) * e;
  return true;
}

// ---------------------------------------------------------------- battle run

function startRun(ws: WS, battle: BattleResult | null, humanSide: Team): Run {
  const now = ws.now;
  const disp = battle && battle.frames.length ? toDisplay(battle, humanSide) : null;
  const pb = disp ? makePlayback(disp) : null;
  const visiting = humanSide === 'right';
  const run: Run = {
    src: battle,
    pb,
    winner: disp ? disp.winner : 'draw',
    visiting,
    phase: 'intro',
    start: now,
    phaseStart: now,
    introLen: EMPTY_BANNER,
    switchIn: 0,
    speed: 1,
    paused: false,
    appear: new Map(),
    vanish: new Map(),
    outroHome: Infinity,
    outroReturn: Infinity,
    outroEnd: Infinity,
    returned: false,
    doneCalled: false,
  };
  if (!pb) return run;
  ws.drag = null;
  const units = [...pb.view.units];
  const mine = units.filter((u) => u.team === 'left').sort((a, b) => a.y - b.y || b.x - a.x);
  const theirs = units.filter((u) => u.team === 'right').sort((a, b) => a.y - b.y || a.x - b.x);
  let last = 0;
  if (!visiting) {
    // host: enemies teleport in on the far side
    theirs.forEach((u, i) => {
      const at = 0.3 + i * 0.1;
      spawnTp(ws, u.x, u.y, 'right', 'in', now + at);
      run.appear.set(u.uid, now + at + TP_SHOW);
      last = Math.max(last, at + TP_SHOW);
    });
    run.introLen = Math.max(1.4, last + 0.45);
    run.switchIn = 0;
  } else {
    // visitor: human heroes teleport out of home, terrain swaps, they arrive in the host's arena
    mine.forEach((u, i) => {
      const at = 0.05 + i * 0.06;
      spawnTp(ws, u.x, u.y, 'left', 'out', now + at);
      run.vanish.set(u.uid, now + at + TP_HIDE);
    });
    run.switchIn = 0.6;
    for (const u of theirs) run.appear.set(u.uid, now + 0.75);
    mine.forEach((u, i) => {
      const at = 1.05 + i * 0.1;
      spawnTp(ws, u.x, u.y, 'left', 'in', now + at);
      run.appear.set(`in:${u.uid}`, now + at + TP_SHOW);
      last = Math.max(last, at + TP_SHOW);
    });
    run.introLen = Math.max(1.8, last + 0.45);
  }
  return run;
}

/** visibility of a battle unit in [0,1] */
function unitAlpha(run: Run, uid: string, now: number): number {
  let a = 1;
  const ap = run.appear.get(uid);
  if (ap !== undefined) a *= clamp01((now - ap) / FADE);
  const vn = run.vanish.get(uid);
  if (vn !== undefined) {
    const out = clamp01((now - vn) / FADE);
    const back = run.appear.get(`in:${uid}`);
    // visitor: vanished at home, re-appears in the host arena
    if (back !== undefined && now >= back) a *= clamp01((now - back) / FADE);
    else a *= 1 - out;
  }
  return a;
}

function startOutro(ws: WS, run: Run, actorsCount: number) {
  const now = ws.now;
  run.phase = 'outro';
  run.phaseStart = now;
  const pb = run.pb!;
  // everything is visible now (skip may land mid-intro), then survivors teleport out
  run.appear.clear();
  run.vanish.clear();
  const units = [...pb.view.units].sort((a, b) => a.y - b.y);
  let i = 0;
  let gone = 0.75 + FADE;
  for (const u of units) {
    if (u.alive) {
      const at = 0.6 + i++ * 0.045;
      spawnTp(ws, u.x, u.y, u.team, 'out', now + at);
      run.vanish.set(u.uid, now + at + TP_HIDE);
      gone = Math.max(gone, at + TP_HIDE + FADE);
    } else {
      run.vanish.set(u.uid, now + 0.75);
    }
  }
  run.outroHome = run.visiting ? now + gone : Infinity;
  run.outroReturn = now + gone + (run.visiting ? 0.3 : 0.05);
  run.outroEnd = run.outroReturn + Math.min(actorsCount, 8) * 0.08 + 0.7;
}

function returnHome(ws: WS, run: Run) {
  run.returned = true;
  const actors = [...ws.actors.values()].sort((a, b) => a.y - b.y);
  actors.forEach((a, i) => {
    a.x = a.fromX = a.toX;
    a.y = a.fromY = a.toY;
    a.moveDur = 0;
    a.facing = restFacing(a.x);
    const at = ws.now + i * 0.08;
    spawnTp(ws, a.x, a.y, 'left', 'in', at, true);
    a.visibleFrom = at + TP_SHOW;
  });
}

// ---------------------------------------------------------------- component

export function World(props: WorldProps) {
  const { mode, round, names, selectedUid } = props;
  const vb = props.viewBox ?? FULL_VIEWBOX;
  const fit = props.fit ?? 'slice';
  const rootRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 1000, h: 600 });
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setBox((b) => (b.w === w && b.h === h ? b : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // css px per arena unit; small screens get proportionally bigger floating text / name plates
  const pxScale = box.w > 0 && box.h > 0 ? (fit === 'meet' ? Math.min(box.w / vb.w, box.h / vb.h) : Math.max(box.w / vb.w, box.h / vb.h)) : 1;
  const textScale = Math.min(1.7, Math.max(1, 0.95 / pxScale));
  const [, setTick] = useState(0);
  const propsRef = useRef(props);
  propsRef.current = props;
  const svgRef = useRef<SVGSVGElement>(null);
  const wsRef = useRef<WS | null>(null);
  if (!wsRef.current) {
    wsRef.current = {
      now: clockNow(),
      inited: false,
      actors: new Map(),
      tps: [],
      tpSeq: 1,
      terrain: { cur: props.homeTerrain, prev: null, start: 0 },
      run: null,
      drag: null,
      floorDown: null,
      dnd: { uid: null, slot: null, at: -9 },
      prepSince: -9,
      lastMode: null,
    };
  }
  const ws = wsRef.current;

  useEffect(() => {
    let raf = 0;
    let last = clockNow();
    const tick = () => {
      const now = clockNow();
      const realDt = Math.min(0.1, Math.max(0, now - last));
      last = now;
      ws.now = now;
      const p = propsRef.current;

      // ---- mode / run bookkeeping
      if (p.mode !== ws.lastMode) {
        if (p.mode === 'prep') {
          ws.prepSince = now;
          if (ws.run && !ws.run.returned) {
            // battle aborted by the parent: just show the heroes again
            for (const a of ws.actors.values()) a.visibleFrom = -1;
          }
          ws.run = null;
        }
        ws.lastMode = p.mode;
      }
      if (p.mode === 'battle' && (!ws.run || ws.run.src !== p.battle)) {
        ws.run = startRun(ws, p.battle, p.humanSide);
      }
      const runActive = !!ws.run && ws.run.phase !== 'done';
      syncActors(ws, p.heroes, !ws.inited || (runActive && !ws.run!.returned));
      ws.inited = true;

      // ---- battle phases
      const run = ws.run;
      if (run && run.phase !== 'done') {
        const pb = run.pb;
        if (!pb) {
          if (now - run.start >= EMPTY_BANNER) {
            run.phase = 'done';
            run.returned = true;
            for (const a of ws.actors.values()) a.visibleFrom = -1;
          }
        } else if (run.phase === 'intro') {
          if (now - run.phaseStart >= run.introLen) {
            run.phase = 'play';
            run.phaseStart = now;
          }
        } else if (run.phase === 'play') {
          let dtB = 0;
          if (!run.paused) {
            dtB = realDt * run.speed;
            pb.t = Math.min(pb.end, pb.t + dtB);
          }
          advance(pb, dtB);
          if (pb.t >= pb.end) startOutro(ws, run, ws.actors.size);
        } else if (run.phase === 'outro') {
          pb.effects = pruneEffects(pb.effects, pb.t + (now - run.phaseStart));
          if (!run.returned && now >= run.outroReturn) returnHome(ws, run);
          if (now >= run.outroEnd) run.phase = 'done';
        }
        if (run.phase === 'done' && !run.doneCalled) {
          run.doneCalled = true;
          p.onBattleDone();
        }
      }

      // ---- terrain
      let want: TerrainId = p.homeTerrain;
      if (ws.run && ws.run.phase !== 'done' && ws.run.pb) {
        const r = ws.run;
        const inHost = r.phase === 'intro' ? now - r.start >= r.switchIn : r.phase === 'play' ? true : now < r.outroHome;
        if (inHost) want = p.hostTerrain;
      }
      setTerrain(ws.terrain, want, now);

      // ---- actors & teleports
      for (const a of ws.actors.values()) if (ws.drag?.uid !== a.uid) stepActor(a, now);
      if (ws.tps.length) ws.tps = ws.tps.filter((t) => now - t.start <= TP_DUR);

      setTick((n) => (n + 1) & 0xffff);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ws]);

  // ---------------------------------------------------------------- input
  const toArena = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return { x: 0, y: 0 };
    const pt = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: pt.x, y: pt.y };
  };
  const prepActive = mode === 'prep' && !ws.run;

  const onHeroDown = (uid: string, e: RPointerEvent) => {
    if (!prepActive || e.button !== 0) return;
    e.stopPropagation();
    const a = ws.actors.get(uid);
    if (!a) return;
    const p = toArena(e.clientX, e.clientY);
    ws.drag = { uid, pointerId: e.pointerId, sx: p.x, sy: p.y, ox: a.x - p.x, oy: a.y - p.y, x: a.x, y: a.y, moved: false, hover: null };
    try {
      svgRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };
  const onSvgDown = (e: RPointerEvent) => {
    if (e.button !== 0) return;
    const p = toArena(e.clientX, e.clientY);
    ws.floorDown = { x: p.x, y: p.y, id: e.pointerId };
  };
  const onSvgMove = (e: RPointerEvent) => {
    const d = ws.drag;
    if (!d || d.pointerId !== e.pointerId) return;
    const p = toArena(e.clientX, e.clientY);
    if (!d.moved && Math.hypot(p.x - d.sx, p.y - d.sy) > 6) d.moved = true;
    if (!d.moved) return;
    d.x = Math.max(40, Math.min(ARENA_W - 40, p.x + d.ox));
    d.y = Math.max(70, Math.min(ARENA_H - 20, p.y + d.oy));
    d.hover = slotAt(d.x, d.y);
    const a = ws.actors.get(d.uid);
    if (a) {
      if (Math.abs(d.x - a.x) > 1.5) a.facing = d.x > a.x ? 1 : -1;
      a.x = d.x;
      a.y = d.y;
    }
  };
  const onSvgUp = (e: RPointerEvent) => {
    const d = ws.drag;
    const p = propsRef.current;
    if (d && d.pointerId === e.pointerId) {
      ws.drag = null;
      ws.floorDown = null;
      const a = ws.actors.get(d.uid);
      if (!d.moved) {
        p.onSelectHero(d.uid);
        if (a && a.pending > 0 && p.onUpgradeHero) p.onUpgradeHero(d.uid);
        return;
      }
      if (a) moveActor(a, a.toX, a.toY, ws.now); // slide back unless props move it elsewhere
      if (d.hover && a && !sameSlot(d.hover, a.slot)) p.onPlaceHero(d.uid, d.hover);
      return;
    }
    const f = ws.floorDown;
    ws.floorDown = null;
    if (f && f.id === e.pointerId && mode === 'prep') {
      const q = toArena(e.clientX, e.clientY);
      if (Math.hypot(q.x - f.x, q.y - f.y) < 8) p.onSelectHero(null);
    }
  };
  const onSvgCancel = () => {
    const d = ws.drag;
    ws.drag = null;
    ws.floorDown = null;
    const a = d ? ws.actors.get(d.uid) : undefined;
    if (a) moveActor(a, a.toX, a.toY, ws.now);
  };

  const dndOverHero = (uid: string, e: DragEvent) => {
    if (!props.onDropOnHero) return;
    e.preventDefault();
    e.stopPropagation();
    ws.dnd = { uid, slot: null, at: ws.now };
  };
  const dndDropHero = (uid: string, e: DragEvent) => {
    if (!props.onDropOnHero) return;
    e.preventDefault();
    e.stopPropagation();
    ws.dnd = { uid: null, slot: null, at: -9 };
    props.onDropOnHero(uid, e);
  };
  const dndOverSlot = (slot: BoardSlot, e: DragEvent) => {
    if (!props.onDropOnSlot) return;
    e.preventDefault();
    ws.dnd = { uid: null, slot, at: ws.now };
  };
  const dndDropSlot = (slot: BoardSlot, e: DragEvent) => {
    if (!props.onDropOnSlot) return;
    e.preventDefault();
    ws.dnd = { uid: null, slot: null, at: -9 };
    props.onDropOnSlot(slot, e);
  };

  // ---------------------------------------------------------------- render
  const now = ws.now;
  const run = ws.run;
  const pb = run?.pb ?? null;
  const showBattle = !!run && !!pb && !run.returned;
  const dndLive = now - ws.dnd.at < 0.25;

  let fxNow = 0;
  if (pb && run) fxNow = run.phase === 'outro' || run.phase === 'done' ? pb.t + (now - run.phaseStart) : pb.t;
  const shake = pb && run?.phase === 'play' ? currentShake(pb) : 0;
  const sx = shake ? Math.sin(pb!.t * 93) * shake : 0;
  const sy = shake ? Math.cos(pb!.t * 71) * shake * 0.6 : 0;

  // battle units (display space: human = left)
  let battleUnits: { u: UnitSnapshot; alpha: number }[] = [];
  if (showBattle && run && pb) {
    const tr = now - run.start;
    battleUnits = pb.view.units
      .map((u) => {
        let v = u;
        if (run.phase === 'intro' && u.alive) v = { ...u, anim: 'idle', animT: tr + hash(u.uid) * 3, animDur: 0 };
        else if (run.phase === 'outro' && u.alive) v = { ...u, anim: 'idle', animT: now - run.phaseStart, animDur: 0, statuses: [] };
        return { u: v, alpha: unitAlpha(run, u.uid, now) };
      })
      .filter((x) => x.alpha > 0.01)
      .sort((a, b) => (a.u.alive === b.u.alive ? a.u.y - b.u.y : a.u.alive ? 1 : -1));
  }

  const actors = showBattle ? [] : [...ws.actors.values()].sort((a, b) => a.y - b.y);
  const tilesOpacity = mode === 'prep' && !run ? clamp01((now - ws.prepSince) / 0.4) : 0;
  const dragging = !!ws.drag?.moved;
  const dndSlot = dndLive ? ws.dnd.slot : null;
  const dndUid = dndLive ? ws.dnd.uid : null;

  // banners
  let banner: ReactNode = null;
  if (run && run.phase !== 'done') {
    if (!pb || run.phase === 'intro') {
      banner = (
        <div className="aw-wb aw-wb-intro" key={`intro-${run.start}`} style={{ ['--life' as string]: `${(pb ? run.introLen : EMPTY_BANNER) + 0.2}s` }} data-testid="battle-intro">
          <div className="aw-wb-round">
            Round {round} — vs {names.enemy}
          </div>
          {pb && <div className={`aw-wb-sub ${run.visiting ? '' : 'invade'}`}>{run.visiting ? `Teleporting to ${names.enemy}'s arena` : `${names.enemy} is invading!`}</div>}
        </div>
      );
    } else if (run.phase === 'outro') {
      const w = run.winner;
      const r = w === 'draw' ? { text: 'DRAW', cls: 'draw' } : w === 'left' ? { text: 'VICTORY', cls: 'win' } : { text: 'DEFEAT', cls: 'loss' };
      banner = (
        <div className={`aw-wb aw-wb-result aw-wb-${r.cls}`} key={`res-${run.start}`} data-testid="battle-banner">
          <div className="aw-wb-big">{r.text}</div>
        </div>
      );
    }
  }

  const controls = run && pb && run.phase !== 'done' && !run.doneCalled;
  const skip = () => {
    const r = ws.run;
    if (!r || r.phase === 'done') return;
    if (!r.pb) {
      r.phase = 'done';
      r.returned = true;
      for (const a of ws.actors.values()) a.visibleFrom = -1;
    } else if (r.phase === 'intro' || r.phase === 'play') {
      jumpToEnd(r.pb);
      // drop pending intro teleports
      ws.tps = ws.tps.filter((t) => t.start <= ws.now);
      startOutro(ws, r, ws.actors.size);
      return;
    } else {
      // already in the outro: finish now
      if (!r.returned) returnHome(ws, r);
      r.phase = 'done';
    }
    if (!r.doneCalled) {
      r.doneCalled = true;
      propsRef.current.onBattleDone();
    }
  };

  return (
    <div ref={rootRef} className={`aw-world${dragging ? ' dragging' : ''}${prepActive ? ' prep' : ''}`} data-testid="world" data-mode={mode} data-phase={run ? run.phase : 'prep'}>
      <style>{WORLD_CSS}</style>
      <svg
        ref={svgRef}
        className="aw-world-svg"
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        preserveAspectRatio={`xMidYMid ${fit}`}
        onPointerDown={onSvgDown}
        onPointerMove={onSvgMove}
        onPointerUp={onSvgUp}
        onPointerCancel={onSvgCancel}
        onDragOver={(e) => {
          if (props.onDropOnSlot || props.onDropOnHero) e.preventDefault();
        }}
      >
        <defs>
          <filter id="aw-desat">
            <feColorMatrix type="saturate" values="0.15" />
          </filter>
          <UpgradeDefs />
        </defs>
        <g transform={shake ? `translate(${sx.toFixed(2)},${sy.toFixed(2)})` : undefined}>
          <TerrainGround f={ws.terrain} now={now} />
          <FormationTiles
            opacity={tilesOpacity}
            active={dragging || dndLive}
            hover={dragging ? (ws.drag?.hover ?? null) : dndSlot}
            t={now}
            onDragOverSlot={dndOverSlot}
            onDropSlot={dndDropSlot}
          />
          {showBattle && pb && (
            <g>
              {pb.view.zones.map((z) => {
                const Z = z.spellId ? getZoneArt(z.spellId) : ItemZone;
                return <Z key={z.id} t={z.t} duration={z.duration} x={z.x} y={z.y} radius={z.radius} team={z.team} />;
              })}
            </g>
          )}
          <g>
            {battleUnits.map(({ u, alpha }) => (
              <g key={u.uid} opacity={alpha < 1 ? alpha : undefined}>
                <UnitView u={u} fx={pb?.fx.get(u.uid)} human={u.team === 'left'} battleT={pb?.t ?? now} />
              </g>
            ))}
            {actors.map((a) => (
              <PrepHero
                key={a.uid}
                a={a}
                now={now}
                selected={selectedUid === a.uid}
                textScale={textScale}
                dragging={ws.drag?.uid === a.uid && ws.drag.moved}
                dropHot={dndUid === a.uid}
                interactive={prepActive}
                onDown={onHeroDown}
                onDragOver={dndOverHero}
                onDrop={dndDropHero}
              />
            ))}
          </g>
          {showBattle && pb && run!.phase === 'play' && (
            <g>
              {pb.view.projectiles.map((p) => {
                const P = p.art.kind === 'attack' ? getAttackProjectileArt(p.art.heroId) : getProjectileArt(p.art.spellId);
                return (
                  <g key={p.id} transform={`translate(${p.x.toFixed(1)},${(p.y - 40).toFixed(1)}) rotate(${((p.angle * 180) / Math.PI).toFixed(1)})`}>
                    <P t={pb.t} team={p.team} />
                  </g>
                );
              })}
            </g>
          )}
          {pb && run && run.phase !== 'intro' && <VfxLayer effects={pb.effects} now={fxNow} />}
          {pb && run && run.phase !== 'intro' && <TextLayer effects={pb.effects} now={fxNow} scale={textScale} />}
          <TerrainAmbient f={ws.terrain} now={now} />
          <g pointerEvents="none">
            {ws.tps.map((t) => {
              const k = now - t.start;
              if (k < 0) return null;
              return (
                <g key={t.id}>
                  <TeleportFx t={k} duration={TP_DUR} x={t.x} y={t.y} team={t.team} dir={t.dir} />
                  {t.flash && k < 0.6 && k > TP_SHOW - 0.1 && <SummonFlash k={(k - TP_SHOW + 0.1) / 0.5} x={t.x} y={t.y} />}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {banner}

      {controls && run && pb && (
        <div className="aw-wctl" data-testid="battle-controls">
          <span className="aw-wctl-time" data-testid="battle-timer">
            {fmtTime(pb.t)}
          </span>
          <button
            type="button"
            className={`aw-wbtn ${run.paused ? 'on' : ''}`}
            onClick={() => {
              run.paused = !run.paused;
            }}
            data-testid="battle-pause"
            aria-label={run.paused ? 'Resume' : 'Pause'}
          >
            {run.paused ? '▶' : '❚❚'}
          </button>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              className={`aw-wbtn ${!run.paused && run.speed === s ? 'on' : ''}`}
              onClick={() => {
                run.speed = s;
                run.paused = false;
              }}
              data-testid={`battle-speed-${s}`}
            >
              {s}x
            </button>
          ))}
          <button type="button" className="aw-wbtn skip" onClick={skip} data-testid="battle-skip">
            Skip ▸▸
          </button>
        </div>
      )}
    </div>
  );
}

const fmtTime = (s: number) => {
  const v = Math.max(0, Math.floor(s));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
};

function SummonFlash({ k, x, y }: { k: number; x: number; y: number }) {
  const c = clamp01(k);
  return (
    <g transform={`translate(${x},${y})`} opacity={1 - c}>
      <ellipse cx={0} cy={0} rx={18 + c * 40} ry={6 + c * 14} fill="none" stroke="#ffe9a8" strokeWidth={3 * (1 - c) + 0.5} />
      <ellipse cx={0} cy={-40} rx={22 * (1 - c) + 4} ry={44 * (1 - c) + 6} fill="#fff6d8" opacity={0.35 * (1 - c)} />
    </g>
  );
}

interface PrepHeroProps {
  a: Actor;
  now: number;
  selected: boolean;
  textScale: number;
  dragging: boolean;
  dropHot: boolean;
  interactive: boolean;
  onDown: (uid: string, e: RPointerEvent) => void;
  onDragOver: (uid: string, e: DragEvent) => void;
  onDrop: (uid: string, e: DragEvent) => void;
}

function PrepHero({ a, now, selected, textScale, dragging, dropHot, interactive, onDown, onDragOver, onDrop }: PrepHeroProps) {
  const alpha = a.visibleFrom < 0 ? 1 : clamp01((now - a.visibleFrom) / FADE);
  if (alpha <= 0.01) return null;
  const moving = dragging || a.moveDur > 0;
  const u: UnitSnapshot = {
    uid: a.uid,
    heroId: a.heroId,
    team: 'left',
    level: a.level,
    x: a.x,
    y: a.y,
    facing: a.facing,
    hp: a.maxHp,
    maxHp: a.maxHp,
    mana: a.maxMana,
    maxMana: a.maxMana,
    anim: moving ? 'walk' : 'idle',
    animT: now + a.phase,
    animDur: 0,
    alive: true,
    statuses: a.aghs ? ['aghanim'] : [],
  };
  const lift = dragging ? -10 : 0;
  const beacon = a.pending > 0 && !dragging;
  return (
    <g opacity={alpha < 1 ? alpha : undefined} data-testid={`world-hero-${a.uid}`} data-upgrade={beacon ? 'ready' : undefined}>
      {beacon && <BeaconBack x={a.x} y={a.y} t={now + a.phase} />}
      {(selected || dropHot) && (
        <g transform={`translate(${a.x.toFixed(1)},${a.y.toFixed(1)})`}>
          <ellipse rx={33} ry={11} fill={dropHot ? 'rgba(120,200,255,0.18)' : 'rgba(255,210,90,0.16)'} stroke={dropHot ? '#8fd0ff' : '#ffd24a'} strokeWidth={2.5} />
          <ellipse rx={38} ry={13} fill="none" stroke={dropHot ? '#8fd0ff' : '#ffd24a'} strokeOpacity={0.4 + 0.3 * Math.sin(now * 5)} strokeWidth={1.2} />
        </g>
      )}
      <g transform={lift ? `translate(0,${lift})` : undefined}>
        <UnitView u={u} fx={undefined} human battleT={now} />
        <text
          x={a.x}
          y={a.y - 108}
          textAnchor="middle"
          fontSize={11 * Math.min(1.3, textScale)}
          fontWeight={700}
          fill={selected ? '#ffe28a' : '#eef2f8'}
          stroke="#000"
          strokeWidth={3}
          paintOrder="stroke"
          fontFamily="system-ui, 'Segoe UI', sans-serif"
          pointerEvents="none"
        >
          {a.name}
        </text>
      </g>
      {beacon && <BeaconFront x={a.x} y={a.y} t={now + a.phase} pending={a.pending} />}
      {now - a.levelUpAt < 1.05 && <LevelUpBurst x={a.x} y={a.y} k={(now - a.levelUpAt) / 1.05} />}
      <rect
        className="aw-hero-hit"
        x={a.x - 26 * Math.min(1.5, textScale)}
        y={a.y - 96}
        width={52 * Math.min(1.5, textScale)}
        height={104}
        fill="transparent"
        pointerEvents={interactive ? 'all' : 'none'}
        onPointerDown={(e) => onDown(a.uid, e)}
        onDragOver={(e) => onDragOver(a.uid, e)}
        onDrop={(e) => onDrop(a.uid, e)}
      />
    </g>
  );
}
