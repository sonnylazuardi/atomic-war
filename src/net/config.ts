// Where the multiplayer server (kickstart) lives. PUBLIC_ATOMIC_SERVER is inlined into the bundle at build
// time (.env for dev, .env.production for `bun run build`); `?server=` overrides it at runtime for testing.
import { WS_PATH } from './protocol.ts';

export const DEFAULT_SERVER = 'http://localhost:3005';

function envServer(): string | undefined {
  try {
    // Bun replaces this whole expression with a string literal; without inlining `process` may not exist.
    return process.env.PUBLIC_ATOMIC_SERVER || undefined;
  } catch {
    return undefined;
  }
}

function queryServer(): string | undefined {
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').get('server') || undefined;
  } catch {
    return undefined;
  }
}

const trimSlash = (u: string) => u.replace(/\/+$/, '');

/** http(s)://host → ws(s)://host + WS_PATH */
export function wsUrlFor(server: string): string {
  return `${trimSlash(server).replace(/^http(s?):/i, 'ws$1:')}${WS_PATH}`;
}

export const SERVER: string = trimSlash(queryServer() ?? envServer() ?? DEFAULT_SERVER);
export const WS_URL: string = wsUrlFor(SERVER);
