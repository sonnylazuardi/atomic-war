// Client networking: clock offset math, socket handshake/reconnect (fake WebSocket), action -> message mapping.
import { describe, expect, test } from 'bun:test';
import { makeOnlineActions, trimArgs, ACT_NAMES } from '../src/net/actions.ts';
import { wsUrlFor } from '../src/net/config.ts';
import { errorMessage } from '../src/net/api.ts';
import type { ClientMsg, GameView, ServerMsg } from '../src/net/protocol.ts';
import { PROTOCOL_VERSION } from '../src/net/protocol.ts';
import { pingLevel, predictOne, Predictor } from '../src/net/predict.ts';
import * as G from '../src/core/game/index.ts';
import type { GameState } from '../src/core/types.ts';
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
    expect(ws.sent[0]).toEqual({ t: 'hello', v: PROTOCOL_VERSION });
    expect(ws.sent[1]).toEqual({ t: 'chat', text: 'hi' });
    expect(ws.sent[2]).toEqual({ t: 'ping', at: 1000 });
    now = 1100;
    ws.recv({ t: 'pong', at: 1000, serverNow: 51_050 });
    expect(s.clock.offset).toBe(50_000);
    expect(s.clock.rtt).toBe(100);
    ws.recv({ t: 'room', room: { id: 'K7Q2' } as never });
    expect(got.length).toBe(1);

    ws.drop();
    expect(s.status).toBe('reconnecting');
    await Bun.sleep(600); // first backoff 500 ms
    const ws2 = FakeWs.all[1]!;
    expect(ws2.url).toBe(ws.url);
    ws2.open();
    expect(ws2.sent[0]).toEqual({ t: 'hello', v: PROTOCOL_VERSION });
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
    const a = makeOnlineActions((name, args) => sent.push({ t: 'act', name, args }), { onBattleDone: () => done++ });
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
    expect(ACT_NAMES.length).toBe(20);
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

// ---------------------------------------------------------------- optimistic UI

/** an online prep-phase view for seat 2 (rngState 0, like the server sends) */
function prepView(): GameState {
  let s = G.newGame(11, { humans: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] } as never);
  s = G.autoPickLords(s);
  s = { ...G.viewFor(s, 2) } as GameState;
  return s;
}

describe('optimistic prediction', () => {
  const base = prepView();
  const pid = 2;

  test('ping colour thresholds', () => {
    expect([0, 119, 120, 249, 250, 900].map(pingLevel)).toEqual(['good', 'good', 'ok', 'ok', 'bad', 'bad']);
  });

  test('deterministic intents predict; RNG ones (refresh, hero buy with new uid) do not', () => {
    expect(base.phase).toBe('prep');
    expect(base.rngState).toBe(0);
    expect(predictOne(base, pid, 'refreshShop', [])).toBeNull();
    expect(predictOne(base, pid, 'rerollLords', [])).toBeNull();
    expect(predictOne(base, pid, 'buyHero', [0])).toBeNull(); // the new hero's uid comes from the RNG
    const lock = predictOne(base, pid, 'toggleLock', [])!;
    expect(lock.players[pid]!.shop.locked).toBe(!base.players[pid]!.shop.locked);
    expect(base.players[pid]!.shop.locked).toBe(false); // input untouched
  });

  test('predict, ack, re-apply pending on top of an older snapshot, rollback on rejection', () => {
    const p = new Predictor();
    const me = (s: GameState) => s.players[pid]!;
    // seq 1: lock (predicted), seq 2: refresh (not predicted, just sent), seq 3: unlock again (predicted)
    const a1 = p.act(base, pid, 'toggleLock', []);
    expect(a1.seq).toBe(1);
    expect(me(a1.next!).shop.locked).toBe(true);
    const a2 = p.act(a1.next!, pid, 'refreshShop', []);
    expect(a2.next).toBeNull();
    const a3 = p.act(a1.next!, pid, 'toggleLock', []);
    expect(me(a3.next!).shop.locked).toBe(false);
    expect(p.pending.map((x) => x.seq)).toEqual([1, 3]);

    // server applied seq 1 only: its state says locked; seq 3 re-applied on top -> unlocked (no flicker)
    const server1 = G.toggleLock(base, pid);
    const r1 = p.reconcile(server1, pid, 1);
    expect(me(r1).shop.locked).toBe(false);
    expect(p.pending.map((x) => x.seq)).toEqual([3]);

    // server acks seq 3 as REJECTED (state unchanged = still locked): the prediction must not survive
    const r2 = p.reconcile(server1, pid, 3);
    expect(me(r2).shop.locked).toBe(true);
    expect(p.pending).toEqual([]);
  });

  test('a prediction that no longer applies is dropped; an unacked one survives a broadcast', () => {
    const p = new Predictor();
    const coins = base.players[pid]!.coins;
    p.act(base, pid, 'toggleLock', []);
    // a phase broadcast (seq not yet applied) still shows our pending change
    const r = p.reconcile({ ...base }, pid, 0);
    expect(r.players[pid]!.shop.locked).toBe(true);
    expect(r.players[pid]!.coins).toBe(coins);
    // a server without ackSeq: trust it fully
    expect(p.reconcile(base, pid, undefined).players[pid]!.shop.locked).toBe(false);
    expect(p.pending).toEqual([]);
  });

  test('confirmed prediction equals the server state (no flicker on confirm)', () => {
    const p = new Predictor();
    const s0 = base;
    const spellIdx = s0.players[pid]!.shop.spellOffers.findIndex((x) => x !== null);
    const { next } = p.act(s0, pid, 'buySpell', [spellIdx]);
    if (!next) return; // not affordable with this seed: nothing to compare
    const server = G.buySpell(s0, pid, spellIdx);
    const r = p.reconcile(server, pid, 1);
    expect(r.players[pid]).toEqual(next.players[pid]!);
  });
});

describe('spectating view merge', async () => {
  const { mergeView } = await import('../src/net/session.ts');
  test('selfId follows the watched seat until game over', () => {
    const base = G.newGame(3);
    const view = { ...base, phase: 'prep' as const, selfId: 1, phaseDeadline: null } as GameView;
    expect(mergeView(base, view, (x) => x, null, 5).selfId).toBe(5);
    expect(mergeView(base, view, (x) => x, null, null).selfId).toBe(1);
    expect(mergeView(base, { ...view, phase: 'game_over' }, (x) => x, null, 5).selfId).toBe(1);
  });
});

describe('ready', async () => {
  const { withReady } = await import('../src/net/session.ts');
  const { readyTally } = await import('../src/ui/components/hud/ReadyButton.tsx');
  test('tally counts alive, non-autopilot humans', () => {
    const s = G.newGame(4, { humans: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] });
    const players = s.players.map((p, i) => ({ ...p, ready: i === 0 || i === 3, autopilot: i === 2 }));
    expect(readyTally({ players })).toEqual({ n: 1, m: 2 }); // seat 3 is a bot, seat 2 on autopilot
  });
  test('optimistic own ready only during prep', () => {
    const s = { ...G.newGame(4), phase: 'prep' as const };
    expect(withReady(s, 0, true).players[0]!.ready).toBe(true);
    expect(s.players[0]!.ready).toBeFalsy(); // input untouched
    const battle = { ...s, phase: 'battle' as const };
    expect(withReady(battle, 0, true)).toBe(battle);
  });
});

describe('lord status (V key)', async () => {
  const { lordStatus } = await import('../src/ui/components/hud/lordStatus.ts');
  const base = G.newGame(9).players[0]!;
  const def = (id: string, extra: object = {}) => ({ id, name: id, title: 't', glyph: 'g', color: '#fff', description: '', kind: 'active', ...extra }) as never;
  const p = (lordState: Record<string, number>, extra: object = {}) => ({ ...base, coins: 5, lordState, ...extra });
  test('ember forge progress in two stages', () => {
    expect(lordStatus(p({ forges: 4 }), def('ember_spirit', { cost: 1 }), 3).line).toBe('Forge 4/9 → Flame Sword');
    expect(lordStatus(p({ forges: 11 }), def('ember_spirit', { cost: 1 }), 3).line).toBe('Forge 2/9 → Divine Sword');
    expect(lordStatus(p({ forges: 18 }), def('ember_spirit', { cost: 1 }), 3).badge).toBe('done');
  });
  test('zeus bolt damage, cost gating, rubick countdown, bound target', () => {
    expect(lordStatus(p({ bolts: 2 }), def('zeus_lord', { cost: 1 }), 1).short).toBe('Bolt 180 ×2');
    expect(lordStatus(p({}, { coins: 0 }), def('zeus_lord', { cost: 1 }), 1).poor).toBe(true);
    expect(lordStatus(p({}), def('rubick', { kind: 'passive' }), 4).line).toBe("Free Aghanim's in 2 rounds");
    expect(lordStatus(p({}), def('rubick', { kind: 'passive' }), 6).line).toBe("Free Aghanim's this round");
    expect(lordStatus(p({}, { lordTarget: 'h1' }), def('naga_siren', { cost: 0, needsTarget: true }), 1).boundUid).toBe('h1');
  });
});

describe('lord status: bounty hunter + bloodseeker', async () => {
  const { lordStatus } = await import('../src/ui/components/hud/lordStatus.ts');
  const base = G.newGame(9).players[0]!;
  const def = (id: string) => ({ id, name: id, title: 't', glyph: 'g', color: '#fff', description: '', kind: 'active' }) as never;
  const p = (lordState: Record<string, number>, extra: object = {}) => ({ ...base, lordState, ...extra });
  test('gold hunting: stored amount, then cashed out once', () => {
    expect(lordStatus(p({ bank: 7 }), def('bounty_hunter'), 7).short).toBe('+7 💰 stored');
    expect(lordStatus(p({ bank: 0 }), def('bounty_hunter'), 1).disabled).toBe(true);
    const done = lordStatus(p({ bank: 0, used: 1 }), def('bounty_hunter'), 9);
    expect([done.short, done.disabled]).toEqual(['Cashed out', true]);
  });
  test('bloodrage: HP cost, armed state', () => {
    expect(lordStatus(p({}, { hp: 80 }), def('bloodseeker'), 2).short).toBe('Bloodrage −40 HP');
    expect(lordStatus(p({}, { hp: 40 }), def('bloodseeker'), 2).poor).toBe(true);
    const armed = lordStatus(p({ bloodrage: 1 }, { hp: 80 }), def('bloodseeker'), 2);
    expect([armed.armed, armed.disabled, armed.badge]).toEqual([true, true, 'ARMED']);
  });
});
