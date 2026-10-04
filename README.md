# Atomic War 2D

A 2D browser remake of the Dota 2 arcade auto-battler **Atomic War** — pick a Lord, buy heroes,
spells and items, combine them freely, and out-last 7 bots. All heroes and spell effects are
hand-built animated SVG. Design and decisions: [PLAN.md](PLAN.md).

Stack: Bun 1.4.2 (no Node), TypeScript 7, Hono, React 19, zustand.

```sh
bun install
bun run dev          # http://localhost:4321  (PORT=xxxx to change)
bun run typecheck    # TypeScript 7 native tsc
bun test             # core unit tests (sim determinism, economy, full bot games)
bun run smoke        # headless Chromium plays a full game; screenshots in e2e/shots/
bun run build        # production bundle -> dist/
bun run pages:dev    # build + serve dist/ with the Cloudflare Pages runtime on :8788
SMOKE_BASE=http://localhost:8788 bun run smoke   # smoke-test the production build
```

## Deploy (Cloudflare Pages)
The site is the static SPA in `dist/`; `/api/*` is the shared Hono app (`server/api.ts`) served by a
Pages Function (`functions/api/[[route]].ts`). Config: `wrangler.jsonc`.

**CLI (direct upload)**
```sh
bunx wrangler login                                                      # once
bunx wrangler pages project create atomic-war --production-branch=main   # once
bun run deploy                                                           # build + upload dist/ + functions/
```

**Git-connected (deploy on push)** — Cloudflare dashboard → Workers & Pages → Create → Pages → Connect
to Git → `sonnylazuardi/atomic-war`. Build command `bun run build`, output directory `dist`, environment
variable `BUN_VERSION=1.4.2`. Custom domain: add it in the Pages project, CNAME → `atomic-war.pages.dev`.

URLs: `/?seed=123` reproducible run · `/?gallery` every hero animation + every spell VFX.

## How to play
- **Choose Your Summoner** (lord) — a player-wide power for the whole game. One free reroll.
- Each preparation the **Mystery shop** opens (Space toggles it): heroes, items and spells, each with a ★ rarity.
  Coins don't carry over between rounds.
- **F** upgrades the Tavern: better ★ odds and one more item/spell offer per level. **V** uses your lord's ability.
- Buy a hero you already own → a light beam shines on it in the arena; click it for +4 levels (max 30).
- Drag spells and items from the inventory onto a hero (roster on the right, or the hero in the arena).
  Spell order = cast priority; slot 1 is the hero's signature.
- Drag heroes between formation tiles: your side is the bottom half, front row nearest the center.
- **Enter** = Ready. You teleport to the enemy's arena (or they invade yours), fight, then return home.
  Losing costs HP; last summoner standing wins.

## Smoke test on WSL without sudo
Headless Chromium needs NSS; extract it locally once:
```sh
D=~/.cache/ms-playwright/syslibs; mkdir -p $D/debs && cd $D/debs
apt-get download libnss3 libnspr4 && for f in *.deb; do dpkg -x $f $D/root; done
bun node_modules/playwright-core/cli.js install chromium-headless-shell
```
