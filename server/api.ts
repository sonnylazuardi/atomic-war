import { Hono } from 'hono';

// The API surface, shared by the Bun dev/prod server (server/index.ts) and the Cloudflare Pages
// Function (functions/api/[[route]].ts) so both environments answer identically.
export const api = new Hono().basePath('/api');

api.get('/health', (c) => c.json({ ok: true, game: 'atomic-war-2d' }));
api.get('/seed', (c) => c.json({ seed: Math.floor(Math.random() * 2 ** 31) }));
