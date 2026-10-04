// Game WebSocket client: hello handshake, 10 s heartbeat, server-clock offset, auto-reconnect with backoff
// (same token + room -> the server restores the seat), typed events for every ServerMsg.
import type { ClientMsg, ErrorCode, ServerMsg } from './protocol.ts';
import { PROTOCOL_VERSION } from './protocol.ts';
import { WS_URL } from './config.ts';

export const HEARTBEAT_MS = 10_000;
const OFFSET_SAMPLES = 5;

/** Estimates `serverClock - localClock` (ms). Pong samples (RTT-corrected) win over one-way hints. */
export class ClockSync {
  private samples: number[] = [];
  private hint: number | null = null;

  /** a ping sent at local `sentAt` came back at local `recvAt` carrying the server's `serverNow` */
  addPong(sentAt: number, serverNow: number, recvAt: number): void {
    if (recvAt < sentAt) return;
    this.samples.push(serverNow - (sentAt + recvAt) / 2);
    if (this.samples.length > OFFSET_SAMPLES) this.samples.shift();
  }

  /** a message stamped with serverNow arrived at local `recvAt` (one-way; used until a pong arrives) */
  addHint(serverNow: number, recvAt: number): void {
    this.hint = serverNow - recvAt;
  }

  get offset(): number {
    if (this.samples.length) return median(this.samples);
    return this.hint ?? 0;
  }

  /** server epoch ms -> local epoch ms */
  toLocal(serverMs: number): number {
    return serverMs - this.offset;
  }
}

export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

/** reconnect delay for attempt n (0-based): 0.5 s, 1 s, 2 s, 4 s, then 8 s */
export function backoff(attempt: number): number {
  return Math.min(8000, 500 * 2 ** attempt);
}

/** errors after which reconnecting cannot help */
const FATAL: ReadonlySet<ErrorCode> = new Set(['unauthorized', 'version', 'room_not_found', 'room_full']);

export type ConnStatus = 'idle' | 'connecting' | 'online' | 'reconnecting' | 'offline';

type MsgOf<T extends ServerMsg['t']> = Extract<ServerMsg, { t: T }>;
type Handler<T extends ServerMsg['t']> = (msg: MsgOf<T>) => void;

export interface WsLike {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  onopen: ((ev: unknown) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
}

export interface SocketOptions {
  url?: string;
  /** injectable for tests */
  createWs?: (url: string) => WsLike;
  now?: () => number;
}

export class GameSocket {
  readonly clock = new ClockSync();
  status: ConnStatus = 'idle';
  private ws: WsLike | null = null;
  private handlers = new Map<string, Set<(m: never) => void>>();
  private statusHandlers = new Set<(s: ConnStatus) => void>();
  private hb: ReturnType<typeof setInterval> | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  private closed = false;
  private queue: ClientMsg[] = [];
  private readonly url: string;
  private readonly createWs: (url: string) => WsLike;
  private readonly now: () => number;

  constructor(
    readonly token: string,
    readonly roomId: string,
    opts: SocketOptions = {},
  ) {
    this.url = `${opts.url ?? WS_URL}?token=${encodeURIComponent(token)}&room=${encodeURIComponent(roomId)}`;
    this.createWs = opts.createWs ?? ((u) => new WebSocket(u) as unknown as WsLike);
    this.now = opts.now ?? Date.now;
  }

  on<T extends ServerMsg['t']>(t: T, fn: Handler<T>): () => void {
    let set = this.handlers.get(t);
    if (!set) this.handlers.set(t, (set = new Set()));
    set.add(fn as (m: never) => void);
    return () => set!.delete(fn as (m: never) => void);
  }

  onStatus(fn: (s: ConnStatus) => void): () => void {
    this.statusHandlers.add(fn);
    return () => this.statusHandlers.delete(fn);
  }

  connect(): void {
    this.closed = false;
    this.open();
  }

  /** queue while disconnected (flushed on open, after hello) */
  send(msg: ClientMsg): void {
    if (this.ws && this.ws.readyState === 1 && this.status === 'online') this.ws.send(JSON.stringify(msg));
    else if (msg.t !== 'ping') this.queue.push(msg);
  }

  /** stop for good (no reconnect) */
  close(): void {
    this.closed = true;
    this.stopTimers();
    const ws = this.ws;
    this.ws = null;
    if (ws) {
      ws.onclose = ws.onerror = ws.onmessage = ws.onopen = null;
      try {
        ws.close(1000, 'bye');
      } catch {}
    }
    this.setStatus('offline');
  }

  private setStatus(s: ConnStatus) {
    if (this.status === s) return;
    this.status = s;
    for (const fn of this.statusHandlers) fn(s);
  }

  private emit(msg: ServerMsg) {
    const set = this.handlers.get(msg.t);
    if (set) for (const fn of [...set]) (fn as (m: ServerMsg) => void)(msg);
  }

  private open() {
    this.setStatus(this.attempt === 0 ? 'connecting' : 'reconnecting');
    let ws: WsLike;
    try {
      ws = this.createWs(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ t: 'hello', v: PROTOCOL_VERSION } satisfies ClientMsg));
      this.attempt = 0;
      this.setStatus('online');
      const q = this.queue;
      this.queue = [];
      for (const m of q) this.send(m);
      this.ping();
      this.stopHeartbeat();
      this.hb = setInterval(() => this.ping(), HEARTBEAT_MS);
    };
    ws.onmessage = (ev) => {
      let msg: ServerMsg;
      try {
        msg = JSON.parse(String(ev.data)) as ServerMsg;
      } catch {
        return;
      }
      if (!msg || typeof msg !== 'object' || typeof msg.t !== 'string') return;
      this.handle(msg);
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      this.stopHeartbeat();
      if (!this.closed) this.scheduleReconnect();
    };
    ws.onerror = () => {};
  }

  /** exposed for tests */
  handle(msg: ServerMsg): void {
    const recv = this.now();
    if (msg.t === 'pong') this.clock.addPong(msg.at, msg.serverNow, recv);
    else if ((msg.t === 'welcome' || msg.t === 'state') && typeof msg.serverNow === 'number')
      this.clock.addHint(msg.serverNow, recv);
    if (msg.t === 'error' && FATAL.has(msg.code)) this.closed = true;
    this.emit(msg);
    if (this.closed && msg.t === 'error') this.close();
  }

  private ping() {
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify({ t: 'ping', at: this.now() } satisfies ClientMsg));
  }

  private scheduleReconnect() {
    if (this.closed) return;
    this.setStatus('reconnecting');
    const delay = backoff(this.attempt++);
    if (this.retry) clearTimeout(this.retry);
    this.retry = setTimeout(() => {
      this.retry = null;
      if (!this.closed) this.open();
    }, delay);
  }

  private stopHeartbeat() {
    if (this.hb) clearInterval(this.hb);
    this.hb = null;
  }

  private stopTimers() {
    this.stopHeartbeat();
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
  }
}
