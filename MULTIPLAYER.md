# Atomic War — Online Multiplayer Plan

Game client: this repo (static SPA on Cloudflare Pages). Game server: `/home/sonny/projects/kickstart`
(Bun + Hono; local `http://localhost:3005`, production `https://vps.sonnylab.com`). Both are Bun 1.4.2 + TypeScript 7.

## Self-grilled decisions

1. **Who is authoritative?** The kickstart server. It runs the game's pure `src/core` reducers per room
   (shop, economy, lords, bots, battles). Clients only send intents ("buyHero 2") and render snapshots.
   No trusting clients with coins or HP.
2. **How does the server get the game rules?** A *vendored copy*: `kickstart/scripts/sync-atomic-core.ts`
   copies `src/core/**` and `src/net/protocol.ts` from this repo into `kickstart/src/atomic/vendor/`
   (committed, "do not edit" header). The Fly Docker build needs no access to this repo. Re-sync after rule
   changes; a protocol version check catches a stale server.
3. **Auth across origins?** Bearer tokens. The game (pages.dev) and API (vps.sonnylab.com) are different *sites*,
   so kickstart's `HttpOnly; SameSite=Lax` session cookie never reaches it. The new endpoints return the
   session token in JSON; REST sends `Authorization: Bearer <token>`; the WebSocket passes `?token=`
   (browsers can't set WS headers). Tokens ARE kickstart sessions (same `sessions` table, 7-day expiry), so
   a game user is a normal kickstart user.
4. **Who can play?** Existing kickstart accounts (email/password), new sign-ups, and **guests**
   (`POST …/auth/guest {name}` creates a user `guest-<id>@guest.atomic.local` with no password). Google
   OAuth for the game is a later phase (needs a redirect flow back to the static site).
5. **Endpoint namespace?** `/api/atomic/*` and `/ws/atomic` — kickstart hosts other apps.
6. **CORS?** Allowlist from `ATOMIC_ORIGINS` (default: `https://atomic-war.pages.dev`,
   `https://*.atomic-war.pages.dev` previews, `https://atomic.sonnylab.com`, `http://localhost:4321`). No
   credentials mode needed (bearer tokens).
7. **Rooms?** All public, listed in the lobby. In-memory registry on the server (one Fly machine; rooms
   don't need to survive restarts). Max **8 seats**. Creator = host (host migrates if they leave). Status:
   `lobby → playing → finished`. A user is in at most one room.
8. **Starting a match?** Humans connect to a public room (up to 8). The match can start with ANY number of
   humans from 1 to 8 — the host presses Start (it also auto-starts when all 8 seats are human). Every
   empty seat is filled with a bot running the current single-player bot AI, so it is always an 8-player
   game: 3 humans + 5 bots plays exactly like today's game, just with friends in some seats.
9. **Who moves the clock?** The server, with the `phaseDeadline` contract already in `GameState`:
   lord select 30 s (auto-pick the first offered lord) → prep 32 s → battle (longest battle replay + 4 s,
   capped 50 s) → results 4 s → prep … Clients count down to `phaseDeadline` using a server-time offset.
10. **Disconnects?** The seat stays yours; while disconnected the bot AI plays it ("autopilot"). Reconnect
    with the same token + room id and you get your seat back and a fresh snapshot.
11. **What does a client receive?** A per-viewer `GameView`: the full GameState with `selfId` = your seat,
    `rngState` zeroed and *other* players' shops, inventories and lord choices hidden (no peeking). Sent to
    the actor after each accepted action, and to everyone on phase changes.
12. **Battles?** The server resolves every pairing (authoritative HP/damage). Each client also gets its own
    battle's inputs (both teams + seed + side) and replays it locally with the same deterministic `runBattle`
    to animate the World — no frame streaming. Outcome numbers always come from the server.
13. **Core changes in this repo (multi-human)?** `GameState.selfId`; lord choices/reroll move into
    `PlayerState`; `newGame(seed, { humans: [...] })` seats N humans + bots; `pickLord(s, pid, lord)`;
    bots act only for non-human or autopilot seats; `RoundReport.seed`; UI replaces `players[0]` with
    `players[selfId]`. Offline single-player keeps working unchanged (selfId 0).
14. **Client architecture?** `src/net/` — `api.ts` (REST), `socket.ts` (WS with heartbeat + reconnect),
    `protocol.ts` (shared types), `onlineStore.ts` (implements the same `GameStore` shape as the offline
    store: actions → WS intents, state ← server snapshots). Play/HUD/World stay the same components.
15. **New screens?** Title (Play vs bots / Play online) → Sign in (guest name, or email login/sign-up) →
    Room browser (list, refresh, create) → Waiting room (8 seats, host Start, chat) → the normal game.
16. **Server URL?** From env, inlined at bundle time: `PUBLIC_ATOMIC_SERVER` in `.env` (dev:
    `http://localhost:3005`, where kickstart runs locally) and `.env.production` (`https://vps.sonnylab.com`,
    used by `bun run build`/`deploy`). `?server=` overrides it at runtime for testing.
17. **Abuse limits?** 8 KB max message, 30 msgs/s per socket, action names whitelisted, args type-checked;
    the reducers already reject illegal moves (coins, phase, slots).
18. **Persistence?** New tables `atomic_matches` and `atomic_match_players` (placement, lord, user/bot) via a
    Drizzle migration; `GET /api/atomic/me/matches` returns your history. Rooms themselves stay in memory.
19. **Tests?** kickstart: room-engine unit tests (8 fake seats play to game over) + a WS integration test
    (real `Bun.serve` + `WebSocket` clients). game: multi-human core tests; smoke test with two browser
    contexts joining one room against a local kickstart.
21. **Latency (players far from the server, e.g. UK ↔ SG)?** Optimistic UI: deterministic actions (buy,
    place, equip, assign, sell, swap) apply locally at once with the same core reducer and are reconciled
    with the server's snapshot (`act.seq` / `state.ackSeq`); only RNG actions (refresh) wait. WebSocket
    `perMessageDeflate` shrinks snapshots; the connection badge shows ping. Deadlines already use server
    time, battles replay locally.
22. **Spectating?** Eliminated online players click anyone in the player list → `watch {pid}`; the server
    streams that seat's view (`state.watching`) and battles; `watch {pid: null}` returns. Read-only.
20. **Deploy?** kickstart: `fly deploy` (release command runs the migration). Game: `bun run deploy`.

## Endpoints (kickstart)

| Method | Path | Body / Query | Returns |
|---|---|---|---|
| POST | `/api/atomic/auth/guest` | `{ name }` | `{ token, user }` |
| POST | `/api/atomic/auth/login` | `{ email, password }` | `{ token, user }` |
| POST | `/api/atomic/auth/signup` | `{ email, password, name }` | `{ token, user }` |
| GET | `/api/atomic/me` | Bearer | `{ user }` |
| POST | `/api/atomic/auth/logout` | Bearer | `{ ok }` |
| GET | `/api/atomic/rooms` | — | `{ rooms: RoomInfo[] }` (public list) |
| POST | `/api/atomic/rooms` | Bearer, `{ name? }` | `{ room }` |
| GET | `/api/atomic/rooms/:id` | — | `{ room }` |
| GET | `/api/atomic/me/matches` | Bearer | `{ matches }` |
| GET (upgrade) | `/ws/atomic?token=…&room=…` | WebSocket | game socket (below) |

`RoomInfo = { id, name, status, hostId, maxPlayers: 8, seats: { userId, name, avatarUrl, connected }[], createdAt }`

## WebSocket protocol (`src/net/protocol.ts`, `v = 1`)

Client → server: `hello {v}` · `start` (host) · `leave` · `chat {text}` · `act {name, args}` (any
`GameActions` method except newGame/finishBattle/nextRound/readyForBattle, which the server drives) ·
`ping {at}`.

Server → client: `welcome {you:{userId, seat}, room, serverNow}` · `room {room}` (lobby changes) ·
`state {state: GameView, serverNow}` · `battle {round, input: {left, right, seed, humanSide}, names}` ·
`chat {from, text, at}` · `error {code, message}` · `pong {at, serverNow}`.

## How the static site connects

```ts
const SERVER = process.env.PUBLIC_ATOMIC_SERVER; // https://vps.sonnylab.com in production
const { token } = await (await fetch(`${SERVER}/api/atomic/auth/guest`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Sonny' }),
})).json();
const { room } = await (await fetch(`${SERVER}/api/atomic/rooms`, {
  method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
  body: '{}',
})).json();
const ws = new WebSocket(`${SERVER.replace(/^http/, 'ws')}/ws/atomic?token=${token}&room=${room.id}`);
ws.onopen = () => ws.send(JSON.stringify({ t: 'hello', v: 1 }));
ws.onmessage = (e) => console.log(JSON.parse(e.data)); // welcome, room, state, battle, …
ws.send(JSON.stringify({ t: 'act', name: 'buyHero', args: [0] }));
```

## Work split (fan-out)

| Agent | Repo | Owns |
|---|---|---|
| core-mp | atomic-war | multi-human core (`selfId`, per-player lords, `newGame` humans, autopilot bots, report seeds) + tests |
| server | kickstart | `/api/atomic/*`, bearer auth, CORS, room registry + engine, `/ws/atomic`, migration, vendor sync script, tests |
| client | atomic-war | `src/net/*`, online store, Title/SignIn/Rooms/WaitingRoom screens, `players[selfId]` refactor, battle replay from inputs |

The lead writes `src/net/protocol.ts` first (shared contract), then integrates: sync core into kickstart,
run both servers locally, two-browser smoke test, deploy.
