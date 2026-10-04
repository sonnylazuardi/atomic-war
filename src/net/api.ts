// Typed REST client for the kickstart /api/atomic endpoints (bearer-token auth, JSON errors -> Error).
import type { ApiUser, AuthResponse, MatchSummary, RoomInfo } from './protocol.ts';
import { API_PREFIX } from './protocol.ts';
import { SERVER } from './config.ts';

export interface Session {
  token: string;
  user: ApiUser;
}

const SESSION_KEY = 'aw.session';

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s && typeof s.token === 'string' && s.user ? s : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session | null): void {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {}
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST';

async function call<T>(method: Method, path: string, opts: { token?: string | null; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  let res: Response;
  try {
    res = await fetch(`${SERVER}${API_PREFIX}${path}`, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(`Cannot reach the game server (${SERVER})`, 0);
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) {
    throw new ApiError(errorMessage(data) ?? `${res.status} ${res.statusText || 'request failed'}`, res.status);
  }
  return data as T;
}

/** server error bodies: { error: "msg" } | { message: "msg" } | { error: { message } } */
export function errorMessage(data: unknown): string | null {
  const d = data as { error?: unknown; message?: unknown } | null;
  if (!d || typeof d !== 'object') return null;
  if (typeof d.error === 'string' && d.error) return d.error;
  if (typeof d.message === 'string' && d.message) return d.message;
  const inner = d.error as { message?: unknown } | null | undefined;
  if (inner && typeof inner === 'object' && typeof inner.message === 'string') return inner.message;
  return null;
}

export const api = {
  guest: (name: string) => call<AuthResponse>('POST', '/auth/guest', { body: { name } }),
  login: (email: string, password: string) => call<AuthResponse>('POST', '/auth/login', { body: { email, password } }),
  signup: (email: string, password: string, name: string) =>
    call<AuthResponse>('POST', '/auth/signup', { body: { email, password, name } }),
  me: (token: string) => call<{ user: ApiUser }>('GET', '/me', { token }),
  logout: (token: string) => call<{ ok: boolean }>('POST', '/auth/logout', { token, body: {} }),
  rooms: () => call<{ rooms: RoomInfo[] }>('GET', '/rooms'),
  createRoom: (token: string, name?: string) => call<{ room: RoomInfo }>('POST', '/rooms', { token, body: name ? { name } : {} }),
  room: (id: string) => call<{ room: RoomInfo }>('GET', `/rooms/${encodeURIComponent(id)}`),
  matches: (token: string) => call<{ matches: MatchSummary[] }>('GET', '/me/matches', { token }),
};
