// Client networking: clock offset math, socket handshake/reconnect (fake WebSocket), action -> message mapping.
import { describe, expect, test } from 'bun:test';
import { makeOnlineActions, trimArgs, ACT_NAMES } from '../src/net/actions.ts';
import { wsUrlFor } from '../src/net/config.ts';
import { errorMessage } from '../src/net/api.ts';
import type { ClientMsg, ServerMsg } from '../src/net/protocol.ts';
import { backoff, ClockSync, GameSocket, median, type WsLike } from '../src/net/socket.ts';
import { initialMode } from '../src/ui/mode.ts';

describe('clock sync', () => {
  test('median', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  test('pong offset is RTT-corrected', () => {
    const c = new ClockSync();
    // sent at 1000, server stamped 6050, back at 1100 -> midpoint 1050 -> offset 5000
    c.addPong(1000, 6050, 1100);
    expect(c.offset).toBe(5000);
    expect(c.toLocal(16_000)).toBe(11_000);
  });

  test('median of the last 5 samples rejects an outlier', () => {
    const c = new ClockSync();
    for (const off of [5000, 5002, 4998, 9000, 5001]) c.addPong(0, off + 50, 100);
    expect(c.offset).toBe(5001);
    for (let i = 0; i < 5; i++) c.addPong(0, 200 + 50, 100); // window slides: old samples drop out
    expect(c.offset).toBe(200);
  });

  test('one-way hint is used only until a pong arrives', () => {
    const c = new ClockSync();
    expect(c.offset).toBe(0);
    c.addHint(10_000, 7_000);
    expect(c.offset).toBe(3000);
    c.addPong(7_000, 9_500, 7_200);
    expect(c.offset).toBe(2400);
    c.addPong(7_200, 9_000, 7_100); // recv before send: ignored
    expect(c.offset).toBe(2400);
  });

  test('backoff doubles and caps', () => {
    expect([0, 1, 2, 3, 4, 9].map(backoff)).toEqual([500, 1000, 2000, 4000, 8000, 8000]);
  });
});

class FakeWs implements WsLike {
  static all: FakeWs[] = [];
  readyState = 0;
  sent: ClientMsg[] = [];
  onopen: ((ev: unknown) => void) | null = null;
  onclose: ((ev: unknown) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  constructor(readonly url: string) {
    FakeWs.all.push(this);
  }
  send(d: string) {
    this.sent.push(JSON.parse(d));
  }
  close() {
    this.readyState = 3;
  }
  open() {
    this.readyState = 1;
    this.onopen?.({});
  }
  recv(m: ServerMsg) {
    this.onmessage?.({ data: JSON.stringify(m) });
  }
  drop() {
    this.readyState = 3;
    this.onclose?.({});
  }
}

describe('GameSocket', () => {
  test('hello first, queued sends flushed, pong updates offset, reconnects with same token+room', async () => {
    FakeWs.all = [];
    let now = 1000;
    const s = new GameSocket('tok en', 'K7Q2', { url: 'ws://x/ws/atomic', createWs: (u) => new FakeWs(u), now: () => now });
    const statuses: string[] = [];
    s.onStatus((st) => statuses.push(st));
    const got: ServerMsg[] = [];
    s.on('room', (m) => got.push(m));
    s.connect();
    const ws = FakeWs.all[0]!;
    expect(ws.url).toBe('ws://x/ws/atomic?token=tok%20en&room=K7Q2');
    s.send({ t: 'chat', text: 'hi' }); // queued until open
    expect(ws.sent).toEqual([]);
    ws.open();
    expect(ws.sent[0]).toEqual({ t: 'hello', v: 1 });
    expect(ws.sent[1]).toEqual({ t: 'chat', text: 'hi' });
    expect(ws.sent[2]).toEqual({ t: 'ping', at: 1000 });
    now = 1100;
    ws.recv({ t: 'pong', at: 1000, serverNow: 51_050 });
    expect(s.clock.offset).toBe(50_000);
    ws.recv({ t: 'room', room: { id: 'K7Q2' } as never });
    expect(got.length).toBe(1);

    ws.drop();
    expect(s.status).toBe('reconnecting');
    await Bun.sleep(600); // first backoff 500 ms
    const ws2 = FakeWs.all[1]!;
    expect(ws2.url).toBe(ws.url);
    ws2.open();
    expect(ws2.sent[0]).toEqual({ t: 'hello', v: 1 });
    expect(s.status).toBe('online');
    expect(statuses).toEqual(['connecting', 'online', 'reconnecting', 'online']);

    s.close();
    expect(s.status).toBe('offline');
    await Bun.sleep(50);
    expect(FakeWs.all.length).toBe(2);
  });

  test('fatal error stops reconnecting', async () => {
    FakeWs.all = [];
    const s = new GameSocket('t', 'R', { url: 'ws://x', createWs: (u) => new FakeWs(u) });
    s.connect();
    FakeWs.all[0]!.open();
    FakeWs.all[0]!.recv({ t: 'error', code: 'room_not_found', message: 'nope' });
    expect(s.status).toBe('offline');
    await Bun.sleep(600);
    expect(FakeWs.all.length).toBe(1);
  });
});

describe('online actions', () => {
  test('every intent becomes an act message with its args', () => {
    const sent: ClientMsg[] = [];
    let done = 0;
    const a = makeOnlineActions((m) => sent.push(m), { onBattleDone: () => done++ });
    a.pickLord('alchemist' as never);
    a.buyHero(2);
    a.assignSpell('h1', 1, 0);
    a.placeHero('h1', { row: 0, col: 1 } as never);
    a.placeHero('h1', null);
    a.useLordAbility();
    a.useLordAbility('h3');
    a.refreshShop();
    expect(sent).toEqual([
      { t: 'act', name: 'pickLord', args: ['alchemist'] },
      { t: 'act', name: 'buyHero', args: [2] },
      { t: 'act', name: 'assignSpell', args: ['h1', 1, 0] },
      { t: 'act', name: 'placeHero', args: ['h1', { row: 0, col: 1 }] },
      { t: 'act', name: 'placeHero', args: ['h1', null] },
      { t: 'act', name: 'useLordAbility', args: [] },
      { t: 'act', name: 'useLordAbility', args: ['h3'] },
      { t: 'act', name: 'refreshShop', args: [] },
    ]);
    // the server drives the clock: these never send
    a.newGame(1);
    a.readyForBattle();
    a.nextRound();
    a.finishBattle();
    expect(sent.length).toBe(8);
    expect(done).toBe(1);
    expect(ACT_NAMES.length).toBe(19);
  });

  test('trimArgs drops only trailing undefined', () => {
    expect(trimArgs([1, undefined, 2, undefined, undefined])).toEqual([1, undefined, 2]);
  });
});

describe('config + misc', () => {
  test('ws url derivation', () => {
    expect(wsUrlFor('http://localhost:3005')).toBe('ws://localhost:3005/ws/atomic');
    expect(wsUrlFor('https://vps.sonnylab.com/')).toBe('wss://vps.sonnylab.com/ws/atomic');
  });
  test('api error bodies', () => {
    expect(errorMessage({ error: 'Bad name' })).toBe('Bad name');
    expect(errorMessage({ message: 'nope' })).toBe('nope');
    expect(errorMessage({ error: { message: 'deep' } })).toBe('deep');
    expect(errorMessage(null)).toBeNull();
  });
  test('initial ui mode: test URLs go straight to the offline game', () => {
    expect(initialMode('')).toBe('title');
    expect(initialMode('?server=http://x')).toBe('title');
    expect(initialMode('?seed=42&prep=5')).toBe('offline');
    expect(initialMode('?prep=5')).toBe('offline');
    expect(initialMode('?offline')).toBe('offline');
    expect(initialMode('?online')).toBe('online-auth');
    expect(initialMode('', '#aw_token=abc')).toBe('online-auth');
    expect(initialMode('', '#aw_error=denied')).toBe('online-auth');
  });
});

describe('server view merge', async () => {
  const { mergeView } = await import('../src/net/session.ts');
  const { newGame } = await import('../src/core/game/index.ts');
  const base = newGame(5);
  const fakeBattle = { frames: [] } as never;

  test('deadline converted to the local clock; replay attached in battle', () => {
    const prev = { ...base, phase: 'prep' as const, round: 2, humanBattle: null };
    const view = { ...base, phase: 'battle' as const, round: 2, selfId: 3, phaseDeadline: 60_000, humanBattle: null };
    const out = mergeView(prev, view, (ms) => ms - 50_000, { round: 2, result: fakeBattle, side: 'right' });
    expect(out.phaseDeadline).toBe(10_000);
    expect(out.selfId).toBe(3);
    expect(out.humanBattle).toBe(fakeBattle);
    expect(out.humanSide).toBe('right');
    // replay of an older round is not used
    const stale = mergeView(prev, view, (ms) => ms, { round: 1, result: fakeBattle, side: 'right' });
    expect(stale.humanBattle).toBeNull();
  });

  test('local replay survives later views (server views carry no recording)', () => {
    const prev = { ...base, phase: 'battle' as const, round: 2, humanBattle: fakeBattle, humanSide: 'left' as const };
    const view = { ...base, phase: 'battle' as const, round: 2, selfId: 0, phaseDeadline: null, humanBattle: null };
    const out = mergeView(prev, view, (ms) => ms, null);
    expect(out.humanBattle).toBe(fakeBattle);
    expect(out.phaseDeadline).toBeNull();
  });
});

describe('google login', async () => {
  const { googleLoginUrl, parseAuthHash } = await import('../src/net/session.ts');
  const { SERVER } = await import('../src/net/config.ts');
  test('redirect url returns to ?online', () => {
    expect(googleLoginUrl({ origin: 'https://atomic-war.pages.dev', pathname: '/' })).toBe(
      `${SERVER}/api/atomic/auth/google?return=${encodeURIComponent('https://atomic-war.pages.dev/?online')}`,
    );
  });
  test('hash parsing', () => {
    expect(parseAuthHash('#aw_token=t0k')).toEqual({ token: 't0k', error: null });
    expect(parseAuthHash('#aw_error=access_denied')).toEqual({ token: null, error: 'access_denied' });
    expect(parseAuthHash('')).toEqual({ token: null, error: null });
  });
});
