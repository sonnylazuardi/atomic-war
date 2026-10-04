import { handle } from 'hono/cloudflare-pages';
import { api } from '../../server/api.ts';

// Cloudflare Pages Function: every /api/* request is served by the shared Hono app.
export const onRequest = handle(api);
