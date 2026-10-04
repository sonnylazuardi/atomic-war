// Online smoke: two guest browsers meet in one room on a real kickstart server, the host starts
// (6 bots fill the other seats), both pick a lord, reach the shop and buy a hero. Run: `bun e2e/online-smoke.ts`
//   SMOKE_SERVER  game server (kickstart)       default http://localhost:3005
//   SMOKE_BASE    an already-running game site  default: spawn `bun server/index.ts` on SMOKE_PORT (3800)
// A spawned site's origin is usually not in the server's CORS allowlist, so its REST calls are proxied
// through Playwright (WebSockets go direct). Set SMOKE_PROXY=0/1 to force.
import { chromium, type BrowserContext, type Page } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SERVER = (process.env.SMOKE_SERVER ?? 'http://localhost:3005').replace(/\/+$/, '');
const PORT = Number(process.env.SMOKE_PORT ?? 3800);
const BASE = process.env.SMOKE_BASE ?? `http://localhost:${PORT}`;
const PROXY = process.env.SMOKE_PROXY ? process.env.SMOKE_PROXY === '1' : !process.env.SMOKE_BASE;
const SHOTS = join(import.meta.dir, 'shots');
mkdirSync(SHOTS, { recursive: true });

const site = process.env.SMOKE_BASE
  ? null
  : Bun.spawn(['bun', 'server/index.ts'], {
      cwd: join(import.meta.dir, '..'),
      env: { ...process.env, PORT: String(PORT) },
      stdout: 'ignore',
      stderr: 'inherit',
    });

const errors: string[] = [];
const step = (msg: string) => console.log(`• ${msg}`);

async function waitFor(url: string, what: string) {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await Bun.sleep(100);
  }
  throw new Error(`${what} not reachable at ${url}`);
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
};

async function proxyApi(ctx: BrowserContext) {
  await ctx.route(`${SERVER}/api/atomic/**`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const headers: Record<string, string> = {};
    const h = await req.allHeaders();
    for (const k of ['authorization', 'content-type']) if (h[k]) headers[k] = h[k];
    const res = await fetch(req.url(), { method: req.method(), headers, body: req.postData() ?? undefined });
    await route.fulfill({
      status: res.status,
      headers: { ...CORS, 'content-type': res.headers.get('content-type') ?? 'application/json' },
      body: Buffer.from(await res.arrayBuffer()),
    });
  });
}

async function player(ctx: BrowserContext, name: string): Promise<Page> {
  if (PROXY) await proxyApi(ctx);
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && !/WebSocket|ERR_CONNECTION|Failed to load resource/.test(m.text()) && errors.push(`${name} console: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`${name} pageerror: ${e.message}`));
  if (process.env.SMOKE_DEBUG) {
    page.on('console', (m) => console.log(`  [${name} ${m.type()}] ${m.text()}`));
    page.on('websocket', (ws) =>
      ws.on('framereceived', (f) => {
        try {
          const m = JSON.parse(String(f.payload));
          if (m.t !== 'pong') console.log(`  [${name} ws] ${m.t} ${m.state ? `${m.state.phase} r${m.state.round}` : ''}`);
        } catch {}
      }),
    );
  }
  await page.goto(`${BASE}/?server=${encodeURIComponent(SERVER)}`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('title-online').click({ timeout: 15000 });
  const signedIn = page.getByTestId('room-create');
  if ((await signedIn.count()) === 0) {
    await page.getByTestId('guest-name').fill(name);
    await page.getByTestId('guest-go').click();
  }
  await signedIn.waitFor({ timeout: 10000 });
  step(`${name}: signed in as guest`);
  return page;
}

async function pickLordAndShop(page: Page, name: string) {
  await page.getByTestId('lord-option').first().waitFor({ timeout: 20000 });
  await page.getByTestId('lord-option').first().click();
  await page.getByTestId('lord-start').click();
  step(`${name}: lord picked`);
  // prep starts once every human picked (or the 30 s lord deadline passes)
  await page.getByTestId('shop-hero-offer').first().waitFor({ timeout: 45000 });
  const before = await page.getByTestId('hero-card').count();
  const coins0 = (await page.getByTestId('coins').first().textContent())?.trim();
  await page.getByTestId('shop-hero-offer').first().click();
  await page.waitForFunction(
    (n) => document.querySelectorAll('[data-testid="hero-card"]').length > n,
    before,
    { timeout: 8000 },
  );
  const coins1 = (await page.getByTestId('coins').first().textContent())?.trim();
  step(`${name}: bought a hero (coins ${coins0} -> ${coins1})`);
}

let exitCode = 0;
const SYSLIBS = `${process.env.HOME}/.cache/ms-playwright/syslibs/root/usr/lib/x86_64-linux-gnu`;
const browser = await chromium.launch({
  headless: true,
  env: { ...process.env, LD_LIBRARY_PATH: [SYSLIBS, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':') },
});
try {
  await waitFor(`${SERVER}/api/atomic/rooms`, 'kickstart /api/atomic');
  if (site) await waitFor(`${BASE}/api/health`, 'game site');
  const vp = { viewport: { width: 1366, height: 768 } };
  const host = await player(await browser.newContext(vp), 'Alice');
  const guest = await player(await browser.newContext(vp), 'Bob');

  await host.getByTestId('room-create').click();
  const code = host.getByTestId('room-code');
  await code.waitFor({ timeout: 10000 });
  const roomId = await code.getAttribute('data-room');
  await host.getByTestId('conn-status').and(host.locator('[data-status="online"]')).waitFor({ timeout: 10000 });
  step(`Alice created room ${roomId}`);
  await host.screenshot({ path: join(SHOTS, 'online-room-host.png') });

  await guest.getByTestId('room-refresh').click();
  const row = guest.locator(`[data-testid="room-row"][data-room="${roomId}"]`);
  await row.waitFor({ timeout: 10000 });
  await row.getByTestId('room-join').click();
  await guest.getByTestId('waiting-room').waitFor({ timeout: 10000 });
  await host.waitForFunction(() => document.querySelectorAll('[data-testid="seat"][data-user]').length === 2, null, { timeout: 10000 });
  step('Bob joined; host sees 2 humans');

  await guest.getByTestId('chat-input').fill('gl hf');
  await guest.getByTestId('chat-input').press('Enter');
  await host.getByText('gl hf').waitFor({ timeout: 5000 });
  step('chat delivered');
  await host.screenshot({ path: join(SHOTS, 'online-room-2p.png') });

  await host.getByTestId('room-start').click();
  step('host pressed START');
  await Promise.all([pickLordAndShop(host, 'Alice'), pickLordAndShop(guest, 'Bob')]);
  await host.screenshot({ path: join(SHOTS, 'online-shop-host.png') });
  await guest.screenshot({ path: join(SHOTS, 'online-shop-guest.png') });

  // both are in different seats of the same match
  const hp = await host.getByTestId('player-hp').count();
  if (hp !== 1) throw new Error(`expected exactly one own HP row, got ${hp}`);

  // the server's prep deadline starts the battle; each client replays its own fight, then results, then round 2
  if (process.env.SMOKE_SHORT !== '1') {
    await Promise.all(
      [host, guest].map(async (p, i) => {
        const who = i ? 'Bob' : 'Alice';
        await p.locator('[data-testid="world"][data-mode="battle"]').waitFor({ timeout: 40000 });
        await p.waitForTimeout(2500);
        await p.screenshot({ path: join(SHOTS, `online-battle-${who}.png`) });
        await p.getByTestId('results').or(p.getByTestId('game-over')).first().waitFor({ timeout: 70000 });
        step(`${who}: battle replayed, results shown`);
        await p.getByTestId('shop-hero-offer').first().waitFor({ timeout: 20000 });
        const round = (await p.getByTestId('round').first().textContent())?.trim();
        step(`${who}: next preparation (${round})`);
      }),
    );
  }

  if (errors.length) throw new Error(`browser errors:\n${errors.join('\n')}`);
  console.log('ONLINE SMOKE PASS');
} catch (e) {
  console.error('ONLINE SMOKE FAIL:', e instanceof Error ? e.message : e);
  if (errors.length) console.error(errors.join('\n'));
  exitCode = 1;
} finally {
  await browser.close();
  site?.kill();
}
process.exit(exitCode);
