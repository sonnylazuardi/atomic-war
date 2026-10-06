// Mobile performance probe: emulated mid-range phone (390x844 @3x, CPU throttled 4x).
// Prints CPU busy %, JS %, style+layout %, fps, JS heap and DOM nodes per screen.
import { chromium, type Page, type CDPSession } from 'playwright-core';
// Usage: bun e2e/perf.ts <baseUrl>  — point it at a PRODUCTION build (dev builds run React in slow dev mode)
const BASE = process.argv[2] ?? 'http://localhost:3802';
// optional 2nd arg: perf mode (high | saver | auto) passed as ?perf=
const PERF = process.argv[3] ? `perf=${process.argv[3]}` : '';
console.log(`perf probe ${BASE}${PERF ? ` (${PERF})` : ''}`);
const b = await chromium.launch({ env: { ...process.env, LD_LIBRARY_PATH: process.env.HOME + '/.cache/ms-playwright/syslibs/root/usr/lib/x86_64-linux-gnu' } });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const cdp: CDPSession = await ctx.newCDPSession(p);
await cdp.send('Performance.enable');
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await p.addInitScript(() => {
  (window as any).__frames = 0;
  const loop = () => { (window as any).__frames++; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});
const metric = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
async function measure(label: string, ms = 5000) {
  const a = await metric(); const fa = await p.evaluate(() => (window as any).__frames);
  await p.waitForTimeout(ms);
  const z = await metric(); const fz = await p.evaluate(() => (window as any).__frames);
  const wall = (z.Timestamp - a.Timestamp);
  const busy = ((z.TaskDuration - a.TaskDuration) / wall) * 100;
  const script = ((z.ScriptDuration - a.ScriptDuration) / wall) * 100;
  const style = ((z.RecalcStyleDuration - a.RecalcStyleDuration + z.LayoutDuration - a.LayoutDuration) / wall) * 100;
  const fps = (fz - fa) / wall;
  console.log(`${label.padEnd(16)} cpu-busy ${busy.toFixed(0).padStart(3)}%  script ${script.toFixed(0).padStart(3)}%  style+layout ${style.toFixed(0).padStart(3)}%  fps ${fps.toFixed(0).padStart(3)}  heap ${(z.JSHeapUsedSize / 1e6).toFixed(0)}MB  nodes ${z.Nodes}`);
}
await p.goto(`${BASE}/${PERF ? `?${PERF}` : ''}`, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500); await measure('title');
await p.goto(`${BASE}/?seed=11&prep=60${PERF ? `&${PERF}` : ''}`, { waitUntil: 'domcontentloaded' });
await p.getByTestId('lord-option').first().waitFor(); await p.waitForTimeout(1500); await measure('lord-select');
await p.getByTestId('lord-option').first().tap(); await p.getByTestId('lord-start').tap();
await p.getByTestId('shop-hero-offer').first().waitFor(); await p.waitForTimeout(1500); await measure('prep-shop-open');
for (let i = 0; i < 2; i++) await p.getByTestId('shop-hero-offer').first().tap().catch(() => {});
await p.getByTestId('close-shop').first().tap().catch(() => {}); await p.waitForTimeout(1000); await measure('prep-arena');
await p.getByTestId('ready').first().tap().catch(() => {});
await p.getByTestId('battle-skip').waitFor({ timeout: 20000 }); await measure('battle', 6000);
await b.close();
