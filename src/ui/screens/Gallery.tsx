// Art QA page (route /?gallery, or /?gallery=world for just the World demos + terrains): World demos,
// terrains, every hero x anim state x team,
// every attack projectile, every spell VFX / zone / projectile on loop.
import { memo, useEffect, useMemo, useState } from 'react';
import type { AnimState, BoardSlot, HeroDef, HeroId, OwnedHero, SpellId, Team, TerrainId } from '../../core/types.ts';
import { HERO_IDS, SPELL_IDS } from '../../core/ids.ts';
import { BOARD_COLS, BOARD_ROWS, LEVELS_PER_UPGRADE, TERRAIN_IDS } from '../../core/constants.ts';
import { getTerrain } from '../../art/terrain/index.ts';
import { HEROES } from '../../core/data/index.ts';
import { getHeroArt, getProjectileArt, getVfx, getZoneArt } from '../../art/registry.tsx';
import { heroArtGroup1 } from '../../art/heroes/group1.ts';
import { heroArtGroup2 } from '../../art/heroes/group2.ts';
import { signatureVfx } from '../../art/vfx/signatures.ts';
import { shopSpellVfx } from '../../art/vfx/shopSpells.ts';
import { getAttackProjectileArt, hasAttackProjectile } from '../../art/attackProjectiles.tsx';
import { TEAM_COLORS } from '../../art/types.ts';
import { World } from '../components/World.tsx';
import { makeFakeBattle } from '../components/arena/fakeBattle.ts';
import { GroundLayer } from '../components/world/terrainLayers.tsx';
import { fakeBattleHeroes, fakeOwnedHero } from '../components/world/demo.ts';
import { spellDef } from '../components/arena/effects.tsx';

const ANIMS: AnimState[] = ['idle', 'walk', 'attack', 'cast', 'hurt', 'dead'];

const heroName = (id: HeroId) => (HEROES as Partial<Record<HeroId, HeroDef>>)[id]?.name ?? id;
const heroHasArt = (id: HeroId) => !!(heroArtGroup1[id] ?? heroArtGroup2[id]);
const has = (b: typeof signatureVfx, k: 'vfx' | 'zones' | 'projectiles', id: SpellId) => !!b[k][id];
const spellHas = (k: 'vfx' | 'zones' | 'projectiles', id: SpellId) => has(signatureVfx, k, id) || has(shopSpellVfx, k, id);

const CSS = `
.gal{height:100vh;overflow:auto;background:#0e1016;color:#e6e9f0;font:13px/1.4 system-ui,'Segoe UI',sans-serif;padding:20px 16px 60px;box-sizing:border-box}
.gal h1{font-size:22px;margin:0 0 4px}
.gal h2{font-size:16px;margin:28px 0 10px;color:#ffd76a;letter-spacing:.03em}
.gal .sub{color:#8a93a6;margin:0 0 14px}
.gal-demo{width:min(1000px,100%);margin:0 auto}
.gal-demo-bar{display:flex;gap:10px;align-items:center;margin:8px 0;color:#8a93a6}
.gal-demo-bar button{background:#1b1e27;border:1px solid #333a4a;color:#dfe5f0;border-radius:6px;padding:5px 10px;cursor:pointer}
.gal-heroes{display:grid;grid-template-columns:120px repeat(6,minmax(110px,1fr));gap:4px;align-items:center;overflow-x:auto}
.gal-hh{color:#8a93a6;font-weight:600;text-align:center;text-transform:uppercase;font-size:11px;letter-spacing:.06em}
.gal-hname{font-weight:700}
.gal-hname small{display:block;color:#8a93a6;font-weight:400}
.gal-cell{background:#171a22;border-radius:6px;display:block;width:100%;height:auto}
.gal-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.gal-card{background:#151821;border:1px solid #232838;border-radius:8px;padding:8px}
.gal-card svg{display:block;width:100%;height:auto;background:#1c2029;border-radius:6px}
.gal-label{margin-top:6px;display:flex;justify-content:space-between;gap:8px}
.gal-label b{font-weight:700}
.gal-fb{color:#ff8a5c;font-size:11px}
.gal-ok{color:#5fd068;font-size:11px}
.gal-row{display:flex;gap:6px;margin-top:6px}
.gal-row svg{flex:1;min-width:0}
.gal-world{position:relative;width:100%;aspect-ratio:5/3;border-radius:10px;overflow:hidden;background:#000}
.gal-terrains{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.gal-proj{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}
`;

function useClock() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      setT((now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}

/** anim clock per state: one-shots play for 0.6s every 1.2s (idle between), dead replays every 2.5s */
function animAt(anim: AnimState, t: number): { anim: AnimState; t: number; dur: number } {
  if (anim === 'idle' || anim === 'walk') return { anim, t, dur: 0 };
  if (anim === 'dead') return { anim, t: t % 2.5, dur: 0 };
  const k = t % 1.2;
  return k < 0.6 ? { anim, t: k, dur: 0.6 } : { anim: 'idle', t: k - 0.6, dur: 0 };
}

function HeroCell({ id, anim, t }: { id: HeroId; anim: AnimState; t: number }) {
  const Art = getHeroArt(id);
  const a = animAt(anim, t);
  const team = (side: Team, x: number) => (
    <g transform={`translate(${x},100) scale(${side === 'left' ? 1 : -1},1)`}>
      <ellipse rx={22} ry={6} fill="#000" opacity={0.35} />
      <Art anim={a.anim} t={a.t} dur={a.dur} team={side} />
    </g>
  );
  return (
    <svg className="gal-cell" viewBox="-95 -10 190 125">
      {team('left', -45)}
      {team('right', 45)}
    </svg>
  );
}

const FROM = { x: 400, y: 330 };
const TO = { x: 600, y: 330 };

function Markers() {
  return (
    <g>
      <ellipse cx={FROM.x} cy={FROM.y} rx={16} ry={5} fill={TEAM_COLORS.left} opacity={0.5} />
      <ellipse cx={TO.x} cy={TO.y} rx={16} ry={5} fill={TEAM_COLORS.right} opacity={0.5} />
    </g>
  );
}

function zoneParams(id: SpellId) {
  const def = spellDef(id);
  const z = def?.effects.find((e) => e.t === 'zone') as { radius: number; duration: number } | undefined;
  return { radius: z?.radius ?? def?.aoeRadius ?? 90, duration: z?.duration ?? 3 };
}

function SpellCard({ id, t }: { id: SpellId; t: number }) {
  const def = spellDef(id);
  const V = getVfx(id);
  const Z = getZoneArt(id);
  const P = getProjectileArt(id);
  const dur = def?.vfx.duration ?? 1;
  const vt = t % (dur + 0.5);
  const zp = zoneParams(id);
  const zt = t % (zp.duration + 0.4);
  const pk = (t % 1.2) / 0.8;
  const hasV = spellHas('vfx', id);
  const hasZ = spellHas('zones', id);
  const hasP = spellHas('projectiles', id);
  const wantZ = hasZ || !!def?.effects.some((e) => e.t === 'zone');
  const wantP = hasP || !!def?.effects.some((e) => e.t === 'projectile');
  const team: Team = 'left';
  return (
    <div className="gal-card">
      <svg viewBox="300 190 400 220">
        <Markers />
        {vt <= dur && <V t={vt} duration={dur} from={FROM} to={TO} radius={def?.aoeRadius ?? 0} team={team} color={def?.vfx.color ?? '#ffd36b'} />}
      </svg>
      {(wantZ || wantP) && <div className="gal-row">
        {wantZ && <svg viewBox="390 210 220 180">
          {zt <= zp.duration && <Z t={zt} duration={zp.duration} x={500} y={300} radius={Math.min(zp.radius, 85)} team={team} />}
        </svg>}
        {wantP && <svg viewBox="390 250 220 100">
          {pk <= 1 && (
            <g transform={`translate(${410 + pk * 180},300)`}>
              <P t={t} team={team} />
            </g>
          )}
        </svg>}
      </div>}
      <div className="gal-label">
        <span>
          <b>{def?.name ?? id}</b> <small style={{ color: '#8a93a6' }}>{id}</small>
          {def && <small style={{ color: '#8a93a6' }}> · {def.vfx.kind} {def.vfx.duration}s</small>}
        </span>
        <span>
          <span className={hasV ? 'gal-ok' : 'gal-fb'}>vfx</span> {wantZ && <span className={hasZ ? 'gal-ok' : 'gal-fb'}>zone </span>}
          {wantP && <span className={hasP ? 'gal-ok' : 'gal-fb'}>proj</span>}
        </span>
      </div>
    </div>
  );
}

function AttackProjCard({ id, t }: { id: HeroId; t: number }) {
  const P = getAttackProjectileArt(id);
  const k = (t % 1) / 0.7;
  return (
    <div className="gal-card">
      <svg viewBox="0 0 200 60">
        {k <= 1 && (
          <g transform={`translate(${15 + k * 170},${30 - Math.sin(k * Math.PI) * 8}) rotate(${Math.cos(k * Math.PI) * -12})`}>
            <P t={t} team="left" />
          </g>
        )}
      </svg>
      <div className="gal-label">
        <b>{heroName(id)}</b>
        <small style={{ color: '#8a93a6' }}>attack</small>
      </div>
    </div>
  );
}

function LoopingSections() {
  const t = useClock();
  return (
    <>
      <h2>Heroes × animation (left / right team)</h2>
      <div className="gal-heroes">
        <div />
        {ANIMS.map((a) => (
          <div key={a} className="gal-hh">
            {a}
          </div>
        ))}
        {HERO_IDS.map((id) => (
          <HeroRow key={id} id={id} t={t} />
        ))}
      </div>

      <h2>Attack projectiles</h2>
      <div className="gal-proj">
        {HERO_IDS.filter(hasAttackProjectile).map((id) => (
          <AttackProjCard key={id} id={id} t={t} />
        ))}
      </div>

      <h2>Spells — VFX (from → to, 200px apart) · zone · projectile</h2>
      <div className="gal-grid">
        {SPELL_IDS.map((id) => (
          <SpellCard key={id} id={id} t={t} />
        ))}
      </div>
    </>
  );
}

function HeroRow({ id, t }: { id: HeroId; t: number }) {
  return (
    <>
      <div className="gal-hname">
        {heroName(id)}
        <small>
          {id} {heroHasArt(id) ? '' : <span className="gal-fb">(fallback)</span>}
        </small>
      </div>
      {ANIMS.map((a) => (
        <HeroCell key={a} id={id} anim={a} t={t} />
      ))}
    </>
  );
}

function WorldBattleDemo({ side }: { side: Team }) {
  const [run, setRun] = useState(0);
  const [mode, setMode] = useState<'prep' | 'battle'>('battle');
  const battle = useMemo(() => makeFakeBattle(), [run]);
  const heroes = useMemo(() => fakeBattleHeroes(side), [side]);
  const [doneCount, setDoneCount] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const home: TerrainId = side === 'left' ? 'snow' : 'spring';
  const host: TerrainId = side === 'left' ? 'snow' : 'dire';
  return (
    <div className="gal-demo">
      <div className="gal-demo-bar">
        <button
          type="button"
          data-testid={`world-demo-restart-${side}`}
          onClick={() => {
            setRun((r) => r + 1);
            setMode('battle');
          }}
        >
          Restart battle
        </button>
        <span>
          humanSide <b>{side}</b> ({side === 'left' ? 'host: enemy invades' : 'visitor: teleport to enemy arena'}) · mode {mode} · winner{' '}
          {battle.winner} · onBattleDone {doneCount}×
        </span>
      </div>
      <div className="gal-world" data-testid={`world-demo-${side}`}>
        <World
          mode={mode}
          round={3}
          heroes={heroes}
          homeTerrain={home}
          battle={mode === 'battle' ? battle : null}
          humanSide={side}
          hostTerrain={host}
          names={{ human: 'You', enemy: 'Dire Bot' }}
          selectedUid={sel}
          onSelectHero={setSel}
          onPlaceHero={() => {}}
          onBattleDone={() => {
            setDoneCount((n) => n + 1);
            setMode('prep');
          }}
        />
      </div>
    </div>
  );
}

const PREP_START: OwnedHero[] = [
  fakeOwnedHero('P1', 'juggernaut', 4, { col: 0, row: 0 }),
  { ...fakeOwnedHero('P2', 'crystal_maiden', 7, { col: 2, row: 1 }), pendingUpgrades: 1 },
  fakeOwnedHero('P3', 'sniper', 11, { col: 1, row: 3 }),
];
const PREP_EXTRA: HeroId[] = ['axe', 'zeus', 'slark'];

function WorldPrepDemo() {
  const [heroes, setHeroes] = useState<OwnedHero[]>(PREP_START);
  const [sel, setSel] = useState<string | null>(null);
  const [terrain, setTerrain] = useState(0);
  const place = (uid: string, slot: BoardSlot) =>
    setHeroes((hs) => {
      const me = hs.find((h) => h.uid === uid);
      return hs.map((h) =>
        h.uid === uid ? { ...h, slot } : h.slot && h.slot.col === slot.col && h.slot.row === slot.row ? { ...h, slot: me?.slot ?? null } : h,
      );
    });
  const summon = () =>
    setHeroes((hs) => {
      const used = new Set(hs.map((h) => (h.slot ? `${h.slot.col}-${h.slot.row}` : '')));
      for (let col = 0; col < BOARD_COLS; col++)
        for (let row = 0; row < BOARD_ROWS; row++)
          if (!used.has(`${col}-${row}`)) {
            const id = PREP_EXTRA[hs.length % PREP_EXTRA.length]!;
            return [...hs, fakeOwnedHero(`P${hs.length + 1}-${Date.now() % 1000}`, id, 3, { col, row })];
          }
      return hs;
    });
  return (
    <div className="gal-demo">
      <div className="gal-demo-bar">
        <button type="button" data-testid="world-demo-summon" onClick={summon}>
          Buy hero (teleport in)
        </button>
        <button
          type="button"
          data-testid="world-demo-give-upgrade"
          onClick={() => setHeroes((hs) => hs.map((h, i) => (i === 0 ? { ...h, pendingUpgrades: h.pendingUpgrades + 1 } : h)))}
        >
          Give first hero an upgrade
        </button>
        <button type="button" onClick={() => setHeroes((hs) => hs.slice(0, -1))}>
          Sell last
        </button>
        <button type="button" onClick={() => setTerrain((t) => t + 1)}>
          Next terrain ({TERRAIN_IDS[terrain % TERRAIN_IDS.length]})
        </button>
        <span>drag heroes between tiles · selected {sel ?? 'none'}</span>
      </div>
      <div className="gal-world" data-testid="world-demo-prep">
        <World
          mode="prep"
          round={2}
          heroes={heroes}
          homeTerrain={TERRAIN_IDS[terrain % TERRAIN_IDS.length]!}
          battle={null}
          humanSide="left"
          hostTerrain={TERRAIN_IDS[terrain % TERRAIN_IDS.length]!}
          names={{ human: 'You', enemy: '-' }}
          selectedUid={sel}
          onSelectHero={setSel}
          onPlaceHero={place}
          onUpgradeHero={(uid) =>
            setHeroes((hs) =>
              hs.map((h) => (h.uid === uid && h.pendingUpgrades > 0 ? { ...h, level: Math.min(30, h.level + LEVELS_PER_UPGRADE), pendingUpgrades: h.pendingUpgrades - 1 } : h)),
            )
          }
          onBattleDone={() => {}}
        />
      </div>
    </div>
  );
}

const TerrainCard = memo(function TerrainCard({ id, t }: { id: TerrainId; t: number }) {
  const def = getTerrain(id);
  const A = def.Ambient;
  return (
    <div className="gal-card" data-testid={`terrain-${id}`}>
      <svg viewBox="0 0 1000 600">
        <GroundLayer id={id} />
        <A t={t} />
      </svg>
      <div className="gal-label">
        <b>{def.name}</b>
        <span>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: def.accent, marginRight: 6 }} />
          <small style={{ color: '#8a93a6' }}>{id}</small>
        </span>
      </div>
    </div>
  );
});

function TerrainsSection() {
  const t = useClock();
  return (
    <div className="gal-terrains">
      {TERRAIN_IDS.map((id) => (
        <TerrainCard key={id} id={id} t={t} />
      ))}
    </div>
  );
}

export function Gallery() {
  // /?gallery=world renders only the World demos + terrains (lighter page for screenshots)
  const worldOnly = typeof location !== 'undefined' && new URLSearchParams(location.search).get('gallery') === 'world';
  return (
    <div className="gal" data-testid="gallery">
      <style>{CSS}</style>
      <h1>Atomic War 2D — Art Gallery</h1>
      <p className="sub">Visual QA. Orange labels mark assets still using registry fallbacks.</p>
      <h2>World demo — battle, human hosts (enemy teleports in)</h2>
      <WorldBattleDemo side="left" />
      <h2>World demo — battle, human visits (teleport to enemy arena)</h2>
      <WorldBattleDemo side="right" />
      <h2>World demo — preparation</h2>
      <WorldPrepDemo />
      <h2>Terrains</h2>
      <TerrainsSection />
      {!worldOnly && <LoopingSections />}
    </div>
  );
}
