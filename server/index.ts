import index from '../index.html';
import { api } from './api.ts';

// Local server: Hono owns /api/*, Bun's HTML import bundles and serves the SPA (with HMR in dev).
// In production the same SPA ships as static files on Cloudflare Pages (see wrangler.jsonc).
const port = Number(process.env.PORT ?? 4321);
const dev = process.env.NODE_ENV !== 'production';

const server = Bun.serve({
  port,
  development: dev ? { hmr: true, console: true } : false,
  routes: {
    '/': index,
    '/api/*': api.fetch,
  },
  fetch: () => new Response('Not found', { status: 404 }),
});

console.log(`Atomic War 2D on ${server.url}`);
