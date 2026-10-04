# Atomic War 2D — Plan

A browser remake of the Dota 2 arcade game **Atomic War**: an 8-player auto-battler roguelike where
every hero, spell and item is an "atom" you combine freely. Rendered in 2D with hand-built
animated SVG heroes and spell effects.

## Research summary (what Atomic War actually is)

Sources: Steam Workshop page (id 3038795544), the "How to Play Atomic War" tutorial
(youtube TTwknocNnM0, transcript), PCGamesN, AFK Gaming lord guide, Dotabuff arcade deep-dive.

- 8 players, free-for-all PvP. Last player alive wins. Practice mode fills seats with bots.
- **Lords**: at the start you're shown a few random Lords (1 free reroll), pick one. A Lord is a
  persistent player-level power (Pudge lord: more starting HP; Bounty Hunter: bank coins;
  Omniknight: +12 levels to one hero; Ursa lord: pay 1 coin to "forge" a Broken Sword,
  8 forges -> Divine Sword of the Sun; Tinker lord greets you with shop perks).
- **Shop**: everything costs 3 coins. Refresh = 1 coin. Upgrading the shop adds one more item
  offer slot and one more spell offer slot (and better tiers). Shop can be **locked** for next round.
  Coins do not carry between rounds (hence the Bounty Hunter "bank" lord).
- **Heroes** are bought from the shop. Buying a hero you already own makes it "flash" — click to
  upgrade it by several levels (up to level 30). Selling a hero returns 2 coins.
- **Spells** are bought into an inventory and dragged onto any hero's ability slots. Slot order
  (left to right) = cast priority.
- **Items** go into a hero's equipment slots (weapon / armor / accessory).
- Hero **classes** drive the battle AI: Assassins jump to the enemy backline, Warriors/Tanks
  front-line, Mages cast damage spells, Hunters/Shooters are ranged right-clickers,
  Mechanics (Tinker) target the nearest enemy.
- Stacking-stat heroes are the meta: Pudge (+STR per kill), Slark (Essence Shift AGI),
  Silencer (INT steal) — permanent gains that persist across rounds.
- Battle is fully automatic. Losing a round costs player HP.

## Self-grilled decision tree (question -> decided answer)

1. **Platform / stack?** Web browser, desktop-first. **Bun 1.4.2 only (no Node)**, **TypeScript 7**
   (native `tsc`), **Hono** for the server/API, Bun's HTML imports as bundler + HMR (no Vite).
   React 19 + zustand for the shop/drag-drop UI; the arena is one `<svg>` re-rendered per frame.
2. **Real multiplayer?** No. Single human vs 7 bots (Atomic War's own practice mode). The game
   core is pure/deterministic so networking could be added later.
3. **Simulation vs rendering?** Strictly separated. `src/core` is pure TS with zero DOM access:
   a fixed-step (20 ticks/s) seeded battle simulation that emits `BattleEvent`s and per-tick
   `UnitSnapshot`s. The renderer interpolates snapshots and spawns VFX from events. This makes the
   sim unit-testable headlessly and lets bots' battles resolve instantly.
4. **Art pipeline?** Every hero is a React component that returns SVG, parameterised by
   `anim` state (`idle | walk | attack | cast | hurt | dead`), facing and team tint. Animation via
   CSS keyframes on SVG groups (transform/opacity only, GPU friendly). Every spell has a VFX
   component that plays a one-shot SVG animation (duration known) at a position/between two points.
   No raster assets, no external art.
5. **Arena geometry?** Logical arena 1000 x 600 units. Left team spawns x 80..380, right team
   mirrored. Player arranges heroes on a 4 x 3 formation grid (column 0 = front line).
6. **Team size?** Board cap = 2 + floor(round/3), max 6 (≈5 heroes mid-game, as in the video).
   Bench: 4 extra.
7. **Economy?** Coins reset each round. Income = 5 + min(round, 5) (so 6..10). Hero/spell/item = 3
   coins (tier-5 items 5 coins). Refresh 1. Shop upgrade cost = 2 + 2*level (max level 5).
   Sell hero 2, sell spell/item 1. Lock toggle free.
8. **Hero upgrade?** Buying a duplicate gives `pendingUpgrades`; clicking the glowing hero spends it
   for +4 levels (level 1 -> 5 -> 9 ... cap 30). Ability slots: 2 at lvl 1, 3 at lvl 10, 4 at lvl 20.
   Slot 0 is the hero's innate signature spell (cannot be removed).
9. **Stats model?** Dota-lite: STR -> 20 HP & 0.1 regen each, AGI -> 0.17 armor & 1 attack speed,
   INT -> 12 mana & 0.07% spell amp. Primary attribute adds 1 damage per point. Armor reduction
   `0.06*a / (1 + 0.06*|a|)`. Permanent stacks (Pudge/Slark/Silencer) stored on the owned hero.
10. **Battle AI?** Each tick: if stunned -> nothing. Else try spells in slot order (first castable
    whose `ai` condition passes). Else attack/move toward target chosen by class rule (assassin:
    leap to the backline at battle start; others: nearest). Mana starts at 50% of max and gains on
    attack / being hit (auto-battler convention) so ultimates actually fire.
11. **Round timeout?** 45 sim seconds; then both sides take damage as a draw (half damage).
12. **Player damage on loss?** `2 + round + sum(surviving enemy star value)` where star value =
    1 + floor(level/10). Player HP 100 (Pudge lord 150).
13. **Pairing?** Each round shuffle alive players into pairs; odd one fights a "ghost" copy of a
    random other alive player (ghost loss does not damage the ghost's owner).
14. **Which battle does the human see?** Their own, animated, speed 1x/2x/4x + skip. Others resolve
    instantly; a standings sidebar shows HP of all 8.
15. **Content size for v1?** 8 Lords, 16 Heroes, 24 Spells, 24 Items. Enough variety for
    roguelike runs; all IDs fixed in `src/core/ids.ts` so art/data/sim work in parallel.
16. **Spell implementation?** Data-driven: a spell = targeting rule + list of `Effect` primitives
    (damage, stun, silence, slow, heal, buff, zone, projectile, leap, pull, permanent-stack...). The
    engine implements primitives once; content agents only write data. A handful of "special"
    spells use a named `custom` hook.
17. **Bots?** Greedy heuristic: pick random lord; buy heroes until board full, then duplicates;
    buy spells matching class (mage -> nukes, warrior -> passives); buy items by primary attribute;
    upgrade shop on rounds 3/6/9. Light randomness per bot ("personality").
18. **Persistence?** None for v1 (single session). Seeded RNG so a run is reproducible via `?seed=`.
19. **Testing?** `bun test` unit tests on `src/core` (determinism, battles terminate, economy
    invariants, every spell/item id resolves). Smoke test = a Bun script driving `playwright-core`
    headless Chromium through a full round, failing on console errors. Both run in the background.
21. **What does Hono do?** Serves `/api/*` (health, seed) and is the seam for future online
    multiplayer; the SPA is served by `Bun.serve` routes with the HTML import.
20. **Sound?** Out of scope for v1.

## Architecture

```
src/
  core/                 (pure TS, no DOM)
    types.ts            contracts — the source of truth for every module
    ids.ts              manifest of every hero/spell/item/lord id + display name
    rng.ts              seeded PRNG
    data/heroes.ts spells.ts items.ts lords.ts
    stats.ts            OwnedHero + items -> CombatStats
    sim/battle.ts       runBattle(): fixed-step engine, events, snapshots
    sim/effects.ts      Effect primitive executor
    sim/targeting.ts    class-based targeting
    game/economy.ts shop.ts match.ts bots.ts lords.ts
  ui/
    store.ts            zustand store wrapping core/game (GameActions)
    App.tsx, screens/ (LordSelect, Prep, Battle, GameOver), components/
  art/
    heroes/<id>.tsx     animated SVG hero
    vfx/<spellId>.tsx   animated SVG spell effect
    registry.ts         id -> component maps, with fallbacks
server/index.ts         Bun.serve + Hono api
tests/                  bun test
e2e/smoke.ts            playwright-core via bun
```

## Parallel work split (fan-out)

Contracts (`types.ts`, `ids.ts`, scaffolding) are written first by the lead. Then in parallel:

| Agent | Owns | Depends on |
|---|---|---|
| A sim | `core/sim/*`, `core/stats.ts`, sim tests | types |
| B content | `core/data/heroes,spells,items.ts` | types, ids |
| C game | `core/game/*`, `core/data/lords.ts`, `ui/store.ts`, game tests | types |
| D ui | `main.tsx`, `ui/App.tsx`, `ui/screens/*`, `ui/components/*` (not arena), styles | types, store API |
| E art-1 | heroes pudge..lina SVG (`art/heroes/group1.ts`) | art contract |
| F art-2 | heroes zeus..dazzle SVG (`art/heroes/group2.ts`) | art contract |
| G arena | `ui/components/Arena.tsx` battle renderer (frames, projectiles, zones, dmg numbers) | types, registry |
| H vfx-sig | VFX for 16 signature spells (`art/vfx/signatures.ts`) | art contract |
| I vfx-shop | VFX for 16 shop spells (`art/vfx/shopSpells.ts`) | art contract |

Stubs with the final export names exist for every owned module, so each agent typechecks
in isolation (`bun run typecheck`).

Integration pass by the lead: typecheck, wire registries, fix seams, run smoke tests (background).

## Milestones
1. M0 contracts + scaffold (lead)
2. M1 parallel build (agents A-G)
3. M2 integrate: `bun run typecheck` + `bun run build` green, `bun test` green, playable loop
4. M3 smoke test in bg + polish passes

## v2 — "feel like the real Atomic War" (feedback after first playable)

The user compared v1 with real Atomic War footage: v1 had separate shop and battle screens and
a generic arena. The real game is ONE persistent world view with a HUD on top.

22. **One world, no screen switches.** `World` (ui/components/World.tsx) always shows an arena.
    Prep: your own walled courtyard, your board heroes idling on their formation tiles (drag a hero
    onto another tile to move it). Battle: same view — the host is `pairing.left`; if you host,
    enemies **teleport in** (Dota TP effect) to the far side; if you visit, your heroes **teleport
    out**, the terrain cross-fades to the enemy's arena, you arrive. After the fight, survivors teleport
    home, the dead re-form, preparation resumes. The human is always drawn on the left half (frames
    are mirrored when humanSide = 'right').
23. **Terrains.** 8 themed arenas (snow, autumn, spring, desert, dire, jungle, swamp, temple), one per
    player for the whole game (`terrainForPlayer`). Static ground plus an animated ambient layer above
    the units.
24. **HUD over the world (Play screen):**
    - Top: Round N · Preparation/Battle · countdown · heroes x/cap · coins.
    - Left: 8 player portraits with HP. Right: hero roster, each row showing spell + item slots.
    - Bottom-left dock: lord portrait, **V** lord ability, **F** Tavern (★ level, upgrade cost, odds
      tooltip), **Space** Mystery shop overlay (heroes / items / spells with ★, refresh, lock).
    - Bottom-right: inventory grid + selected unit card. **Enter** = ready.
25. **Tavern ★ odds.** Every shop offer first rolls a star from `TAVERN_ODDS[tavernLevel]`, then picks
    content of that star. Heroes/spells carry `stars` 1..5; items use `tier` 1..6 (6★ = top items).
    Tavern max level 6.
26. **Prep timer.** 45 s countdown, auto-ready at 0 (`?prep=0` disables it, e.g. for the smoke test).
    After a battle: a short result banner (−HP), then auto-continue to the next preparation.

| v2 agent | Owns |
|---|---|
| logic | stars in data, ★-odds shop rolls, tavern cap 6, tests |
| terrain-1 | snow, autumn, spring, desert terrains + `art/teleport.tsx` |
| terrain-2 | dire, jungle, swamp, temple terrains |
| world | `World.tsx` + `components/world/*` (reusing the arena playback), Gallery terrain section |
| hud | `screens/Play.tsx`, `components/hud/*`, App routing, styles; retires Prep/Battle/Results |
