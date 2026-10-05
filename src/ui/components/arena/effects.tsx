// Transient arena effects spawned from BattleEvents: spell VFX, floating numbers, pops, bursts.
// All effects are timed in BATTLE seconds so pause / speed changes apply to them too.
import type { BattleEvent, ItemId, SpellDef, SpellId, Team, Vec } from '../../../core/types.ts';
import { ITEMS, SPELLS } from '../../../core/data/index.ts';
import { getVfx } from '../../../art/registry.tsx';
import { TEAM_COLORS, clamp01, easeOut } from '../../../art/types.ts';

export type Effect =
  | { kind: 'vfx'; id: number; start: number; dur: number; spellId: SpellId; from: Vec; to: Vec; radius: number; team: Team; color: string }
  | { kind: 'text'; id: number; start: number; dur: number; x: number; y: number; text: string; color: string; size: number; stroke: string; big?: boolean }
  | { kind: 'pop'; id: number; start: number; dur: number; x: number; y: number; glyph: string; size: number }
  | { kind: 'burst'; id: number; start: number; dur: number; x: number; y: number; color: string; r: number }
  | { kind: 'dust'; id: number; start: number; dur: number; x: number; y: number };

export const MAX_TEXTS = 36;

export const spellDef = (id: SpellId | null | undefined): SpellDef | undefined =>
  id ? (SPELLS as Partial<Record<SpellId, SpellDef>>)[id] : undefined;

const itemGlyph = (id: ItemId) => (ITEMS as Partial<Record<ItemId, { glyph: string }>>)[id]?.glyph ?? '✦';

const DMG_COLORS = { physical: '#ffffff', magical: '#6fb6ff', pure: '#ffd34d' } as const;

export interface SpawnCtx {
  pos: (uid: string) => Vec | undefined;
  team: (uid: string) => Team | undefined;
  nextId: () => number;
  shake: (amount: number) => void;
  /** caster holds Aghanim's Scepter (status 'aghanim') */
  aghs?: (uid: string) => boolean;
}

/** turn one event into zero or more effects */
export function effectsForEvent(ev: BattleEvent, ctx: SpawnCtx): Effect[] {
  const out: Effect[] = [];
  const t = ev.t;
  const jitter = (n: number) => ((n * 37) % 23) - 11;
  switch (ev.kind) {
    case 'cast': {
      const def = spellDef(ev.spellId);
      const team = ctx.team(ev.src) ?? 'left';
      const dur = def?.vfx.duration ?? 1;
      out.push({
        kind: 'vfx',
        id: ctx.nextId(),
        start: t,
        dur,
        spellId: ev.spellId,
        from: ev.from,
        to: ev.to,
        radius: ev.radius,
        team,
        color: def?.vfx.color ?? TEAM_COLORS[team],
      });
      if (def?.ultimate) ctx.shake(7);
      const aghs = !!ctx.aghs?.(ev.src);
      if (aghs) {
        // upgraded cast: blue flash at the caster
        out.push({ kind: 'burst', id: ctx.nextId(), start: t, dur: 0.55, x: ev.from.x, y: ev.from.y - 40, color: '#5fb8ff', r: 40 });
      }
      // spell name callout
      if (def) {
        const p = ctx.pos(ev.src) ?? ev.from;
        out.push({ kind: 'text', id: ctx.nextId(), start: t, dur: 1.1, x: Math.min(760, Math.max(240, p.x)), y: Math.max(40, p.y - 122), text: aghs ? `${def.name} ✦` : def.name, color: aghs ? '#8fd3ff' : def.ultimate ? '#ffe28a' : '#d8e4ff', size: def.ultimate ? 15 : 12, stroke: '#000' });
      }
      break;
    }
    case 'proc': {
      const callout = ev.spellId === 'culling_blade' ? { text: 'CULLED!', color: '#ff3b3b', stroke: '#2a0000' } : ev.spellId && ev.dst === ev.src && spellDef(ev.spellId)?.kind !== 'passive' ? { text: 'REFRESH!', color: '#7fe3ff', stroke: '#001a2a' } : null;
      if (callout) {
        const p = ctx.pos(ev.dst ?? ev.src) ?? ev.at;
        out.push({ kind: 'text', id: ctx.nextId(), start: t, dur: 1.4, x: p.x, y: p.y - 125, text: callout.text, color: callout.color, size: 22, stroke: callout.stroke, big: true });
        if (ev.spellId === 'culling_blade') ctx.shake(6);
      }
      if (ev.spellId) {
        const def = spellDef(ev.spellId);
        const team = ctx.team(ev.src) ?? 'left';
        const src = ctx.pos(ev.src) ?? ev.at;
        out.push({
          kind: 'vfx',
          id: ctx.nextId(),
          start: t,
          dur: Math.min(def?.vfx.duration ?? 0.6, 1.2),
          spellId: ev.spellId,
          from: src,
          to: ev.at,
          radius: def?.aoeRadius ?? 0,
          team,
          color: def?.vfx.color ?? '#ffd36b',
        });
      } else {
        out.push({ kind: 'burst', id: ctx.nextId(), start: t, dur: 0.4, x: ev.at.x, y: ev.at.y - 40, color: '#ffd36b', r: 22 });
        if (ev.itemId) out.push({ kind: 'pop', id: ctx.nextId(), start: t, dur: 0.8, x: ev.at.x, y: ev.at.y - 70, glyph: itemGlyph(ev.itemId), size: 16 });
      }
      break;
    }
    case 'item': {
      out.push({ kind: 'pop', id: ctx.nextId(), start: t, dur: 1.1, x: ev.at.x, y: ev.at.y - 112, glyph: itemGlyph(ev.itemId), size: 24 });
      out.push({ kind: 'burst', id: ctx.nextId(), start: t, dur: 0.5, x: ev.at.x, y: ev.at.y - 40, color: '#ffe9a8', r: 34 });
      break;
    }
    case 'damage': {
      if (ev.amount < 1) break;
      const p = ctx.pos(ev.dst);
      if (!p) break;
      const id = ctx.nextId();
      const crit = ev.crit;
      out.push({
        kind: 'text',
        id,
        start: t,
        dur: crit ? 1.1 : 0.85,
        x: p.x + jitter(id),
        y: p.y - 70,
        text: crit ? `${Math.round(ev.amount)}!` : `${Math.round(ev.amount)}`,
        color: crit ? '#ff3b3b' : DMG_COLORS[ev.dmgType],
        size: crit ? 24 : ev.amount >= 200 ? 17 : 13,
        stroke: '#000',
        big: crit,
      });
      break;
    }
    case 'heal': {
      if (ev.amount < 1) break;
      const p = ctx.pos(ev.dst);
      if (!p) break;
      const id = ctx.nextId();
      out.push({ kind: 'text', id, start: t, dur: 0.9, x: p.x + jitter(id), y: p.y - 60, text: `+${Math.round(ev.amount)}`, color: '#6dff7c', size: 13, stroke: '#0a2a0e' });
      break;
    }
    case 'miss': {
      const p = ctx.pos(ev.dst);
      if (!p) break;
      out.push({ kind: 'text', id: ctx.nextId(), start: t, dur: 0.7, x: p.x, y: p.y - 70, text: 'MISS', color: '#c9c9c9', size: 12, stroke: '#000' });
      break;
    }
    case 'death': {
      const p = ctx.pos(ev.dst);
      if (!p) break;
      out.push({ kind: 'dust', id: ctx.nextId(), start: t, dur: 0.7, x: p.x, y: p.y });
      out.push({ kind: 'pop', id: ctx.nextId(), start: t, dur: 1.3, x: p.x, y: p.y - 80, glyph: '💀', size: 26 });
      break;
    }
    case 'stack': {
      const p = ctx.pos(ev.dst);
      if (!p) break;
      const amt = Math.round(ev.amount * 10) / 10;
      out.push({
        kind: 'text',
        id: ctx.nextId(),
        start: t,
        dur: 1.8,
        x: p.x,
        y: p.y - 112,
        text: `+${amt} ${ev.attr.toUpperCase()}`,
        color: '#ffcf33',
        size: 19,
        stroke: '#4a2e00',
        big: true,
      });
      out.push({ kind: 'burst', id: ctx.nextId(), start: t, dur: 0.7, x: p.x, y: p.y - 40, color: '#ffcf33', r: 46 });
      break;
    }
    default:
      break;
  }
  return out;
}

function FloatText({ e, now, k: sc = 1 }: { e: Extract<Effect, { kind: 'text' }>; now: number; k?: number }) {
  const k = clamp01((now - e.start) / e.dur);
  const rise = easeOut(k) * (e.big ? 34 : 26);
  const pop = e.big ? 1 + Math.max(0, 0.6 - k * 4) : 1 + Math.max(0, 0.3 - k * 3);
  const op = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
  return (
    <text
      transform={`translate(${e.x.toFixed(1)},${(e.y - rise).toFixed(1)}) scale(${(pop * sc).toFixed(3)})`}
      textAnchor="middle"
      fontSize={e.size}
      fontWeight={800}
      fontFamily="system-ui, 'Segoe UI', sans-serif"
      fill={e.color}
      stroke={e.stroke}
      strokeWidth={e.size > 16 ? 3.5 : 3}
      paintOrder="stroke"
      opacity={op}
    >
      {e.text}
    </text>
  );
}

function Pop({ e, now, k: sc = 1 }: { e: Extract<Effect, { kind: 'pop' }>; now: number; k?: number }) {
  const k = clamp01((now - e.start) / e.dur);
  const s = k < 0.2 ? easeOut(k / 0.2) * 1.25 : 1.25 - Math.min(0.25, (k - 0.2) * 1.2);
  const op = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
  return (
    <text transform={`translate(${e.x},${e.y - k * 18}) scale(${(s * sc).toFixed(3)})`} textAnchor="middle" dominantBaseline="middle" fontSize={e.size} opacity={op}>
      {e.glyph}
    </text>
  );
}

function Burst({ e, now }: { e: Extract<Effect, { kind: 'burst' }>; now: number }) {
  const k = clamp01((now - e.start) / e.dur);
  return (
    <g transform={`translate(${e.x},${e.y})`} opacity={1 - k}>
      <circle r={e.r * easeOut(k)} fill="none" stroke={e.color} strokeWidth={4 * (1 - k) + 0.5} />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        const r0 = e.r * 0.3 + e.r * 0.7 * easeOut(k);
        return <circle key={i} cx={Math.cos(a) * r0} cy={Math.sin(a) * r0 * 0.7} r={2.4 * (1 - k) + 0.4} fill={e.color} />;
      })}
    </g>
  );
}

function Dust({ e, now }: { e: Extract<Effect, { kind: 'dust' }>; now: number }) {
  const k = clamp01((now - e.start) / e.dur);
  return (
    <g transform={`translate(${e.x},${e.y})`} opacity={(1 - k) * 0.7}>
      {[-1, -0.4, 0.4, 1].map((d, i) => (
        <circle key={i} cx={d * 24 * easeOut(k)} cy={-4 - k * 10 - (i % 2) * 4} r={6 + k * 8} fill="#8b8172" />
      ))}
    </g>
  );
}

function VfxEffect({ e, now }: { e: Extract<Effect, { kind: 'vfx' }>; now: number }) {
  const Art = getVfx(e.spellId);
  const t = now - e.start;
  return <Art t={t} duration={e.dur} from={e.from} to={e.to} radius={e.radius} team={e.team} color={e.color} />;
}

/** spell VFX + bursts (under floating text) */
export function VfxLayer({ effects, now }: { effects: Effect[]; now: number }) {
  return (
    <g>
      {effects.map((e) => {
        if (e.kind === 'vfx') return <VfxEffect key={e.id} e={e} now={now} />;
        if (e.kind === 'burst') return <Burst key={e.id} e={e} now={now} />;
        if (e.kind === 'dust') return <Dust key={e.id} e={e} now={now} />;
        return null;
      })}
    </g>
  );
}

/** floating text + glyph pops (top layer) */
export function TextLayer({ effects, now, scale = 1 }: { effects: Effect[]; now: number; scale?: number }) {
  return (
    <g pointerEvents="none">
      {effects.map((e) => {
        if (e.kind === 'text') return <FloatText key={e.id} e={e} now={now} k={scale} />;
        if (e.kind === 'pop') return <Pop key={e.id} e={e} now={now} k={scale} />;
        return null;
      })}
    </g>
  );
}

/** drop expired effects and cap the number of floating texts (oldest go first) */
export function pruneEffects(effects: Effect[], now: number): Effect[] {
  const alive = effects.filter((e) => now - e.start <= e.dur + 0.05);
  let texts = 0;
  for (const e of alive) if (e.kind === 'text') texts++;
  if (texts <= MAX_TEXTS) return alive;
  let drop = texts - MAX_TEXTS;
  return alive.filter((e) => {
    if (drop > 0 && e.kind === 'text' && !e.big) {
      drop--;
      return false;
    }
    return true;
  });
}
