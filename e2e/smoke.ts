// Smoke test: boots the real server, drives headless Chromium through two full rounds,
// and fails on any console error / page error. Run: `bun run smoke` (screenshots -> e2e/shots/).
import { chromium, type Page } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

// SMOKE_BASE=http://localhost:8788 tests an already-running server (e.g. `bun run pages:dev`)
// instead of spawning the Bun dev server.
const PORT = Number(process.env.SMOKE_PORT ?? 3300);
const BASE = process.env.SMOKE_BASE ?? `http://localhost:${PORT}`;
const SHOTS = join(import.meta.dir, 'shots');
mkdirSync(SHOTS, { recursive: true });

const server = process.env.SMOKE_BASE
  ? null
  : Bun.spawn(['bun', 'server/index.ts'], {
      cwd: join(import.meta.dir, '..'),
      env: { ...process.env, PORT: String(PORT) },
      stdout: 'ignore',
      stderr: 'inherit',
    });

const errors: string[] = [];
const step = (msg: string) => console.log(`• ${msg}`);

async function waitForServer() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return;
    } catch {}
    await Bun.sleep(100);
  }
  throw new Error('server did not start');
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: join(SHOTS, `${name}.png`) });
}

async function clickAll(page: Page, testId: string, max: number) {
  let n = 0;
  for (let i = 0; i < max; i++) {
    const loc = page.getByTestId(testId);
    if ((await loc.count()) === 0) break;
    await loc.first().click({ timeout: 2000 }).catch(() => {});
    n++;
  }
  return n;
}

// No Ready button: rounds start when the fixed preparation timer runs out (?prep=N shortens it for tests)
// and results auto-advance, exactly like multiplayer will.
const PREP = 5;

/** after a battle: wait for the next preparation (shop auto-opens) or game over */
async function passResults(page: Page) {
  const next = page.getByTestId('shop-hero-offer').or(page.getByTestId('game-over'));
  await next.first().waitFor({ timeout: 30000 });
}

async function playRound(page: Page, round: number) {
  // the Mystery shop opens on its own at the start of every preparation phase
  await page.getByTestId('shop-hero-offer').first().waitFor({ timeout: 15000 });
  await page.getByTestId('phase-timer').first().waitFor({ timeout: 5000 });
  await shot(page, `r${round}-shop`);
  await clickAll(page, 'shop-hero-offer', 3);
  await clickAll(page, 'shop-spell-offer', 1);
  await page.keyboard.press('Escape');
  if (round === 2) await page.keyboard.press('KeyF'); // upgrade tavern
  await shot(page, `r${round}-prep`);
  await page.getByTestId('battle-skip').waitFor({ timeout: (PREP + 15) * 1000 }); // timer starts the battle
  step(`round ${round}: battle started by the timer`);
  await page.waitForTimeout(800);
  await shot(page, `r${round}-teleport`);
  await page.waitForTimeout(2200); // watch the fight a bit
  await shot(page, `r${round}-battle`);
  await page.getByTestId('battle-skip').click();
  await page.waitForTimeout(600);
  await shot(page, `r${round}-outro`);
  await page.getByTestId('results').or(page.getByTestId('game-over')).first().waitFor({ timeout: 15000 });
  await shot(page, `r${round}-results`);
  await passResults(page);
  step(`round ${round}: done`);
}

let exitCode = 0;
// WSL/Ubuntu without sudo: NSS/NSPR extracted locally (see README "Smoke test").
const SYSLIBS = `${process.env.HOME}/.cache/ms-playwright/syslibs/root/usr/lib/x86_64-linux-gnu`;
const browser = await chromium.launch({
  headless: true,
  env: { ...process.env, LD_LIBRARY_PATH: [SYSLIBS, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':') },
});
try {
  await waitForServer();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(`${BASE}/?seed=42&prep=${PREP}`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('lord-option').first().waitFor({ timeout: 15000 });
  await shot(page, 'lord-select');
  await page.getByTestId('lord-option').first().click();
  const start = page.getByTestId('lord-start');
  if ((await start.count()) > 0) await start.click(); // v2 summoner screen: select, then START
  step('lord picked');

  for (let r = 1; r <= 2; r++) await playRound(page, r);

  // keep going without shopping until the game ends (human eventually loses) -> GameOver screen
  let rounds = 2;
  while ((await page.getByTestId('game-over').count()) === 0 && rounds < 60) {
    await page.getByTestId('battle-skip').click({ timeout: (PREP + 15) * 1000 });
    await passResults(page);
    rounds++;
  }
  await page.getByTestId('game-over').waitFor({ timeout: 5000 });
  await page.waitForTimeout(600); // let the card's rise-in animation finish
  await shot(page, 'game-over');
  step(`game over after ${rounds} rounds`);
  await page.getByTestId('new-game').click();
  await page.getByTestId('lord-option').first().waitFor({ timeout: 5000 });
  step('new game started');

  // ---- mobile pass: iPhone-sized portrait viewport, touch only (no HTML5 drag-and-drop on iOS)
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const m = await phone.newPage();
  m.on('console', (msg) => msg.type() === 'error' && errors.push(`mobile console: ${msg.text()}`));
  m.on('pageerror', (e) => errors.push(`mobile pageerror: ${e.message}`));
  await m.goto(`${BASE}/?seed=7&prep=${PREP}`, { waitUntil: 'domcontentloaded' });
  await m.getByTestId('lord-option').first().waitFor({ timeout: 15000 });
  await shot(m, 'mobile-lord-select');
  await m.getByTestId('lord-option').first().tap();
  await m.getByTestId('lord-start').tap();
  await m.getByTestId('shop-hero-offer').first().waitFor({ timeout: 10000 });
  await shot(m, 'mobile-shop');
  for (let i = 0; i < 2; i++) await m.getByTestId('shop-hero-offer').first().tap({ timeout: 2000 }).catch(() => {});
  await m.getByTestId('close-shop').first().tap({ timeout: 2000 }).catch(() => {});
  await shot(m, 'mobile-prep');
  await m.getByTestId('battle-skip').waitFor({ timeout: (PREP + 15) * 1000 }); // timer starts it
  await m.waitForTimeout(2500);
  await shot(m, 'mobile-battle');
  await m.getByTestId('battle-skip').tap();
  await passResults(m);
  await shot(m, 'mobile-after');
  step('mobile round played');
  await phone.close();

  await page.goto(`${BASE}/?gallery`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await shot(page, 'gallery');
  step('gallery rendered');
} catch (e) {
  errors.push(`step failed: ${(e as Error).message}`);
} finally {
  await browser.close();
  server?.kill();
}

if (errors.length) {
  console.error(`SMOKE FAIL (${errors.length})`);
  for (const e of errors.slice(0, 30)) console.error('  ' + e);
  exitCode = 1;
} else console.log('SMOKE PASS');
process.exit(exitCode);
