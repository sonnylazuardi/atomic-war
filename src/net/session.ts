// The online session: auth, room membership, chat, connection status — and, once a match starts, it makes
// the SAME zustand `useGame` store drive online play (actions -> `act` intents, state <- server views).
import { create } from 'zustand';
import type { BattleResult, GameState, Team } from '../core/types.ts';
import { runBattle } from '../core/sim/battle.ts';
import { useGame, type GameStore } from '../ui/store.ts';
import { useMode, type UiMode } from '../ui/mode.ts';
import { api, loadSession, saveSession, type Session } from './api.ts';
import { SERVER } from './config.ts';
import { API_PREFIX } from './protocol.ts';
import { makeOnlineActions } from './actions.ts';
import type { BattleReplayInput, GameView, RoomInfo, ServerMsg } from './protocol.ts';
import { GameSocket, type ConnStatus } from './socket.ts';

export interface ChatLine {
  from: { userId: string; name: string };
  text: string;
  at: number;
}

interface NetState {
  session: Session | null;
  conn: ConnStatus;
  room: RoomInfo | null;
  you: { userId: string; seat: number | null } | null;
  chat: ChatLine[];
  error: string | null;
  /** our battle replay finished; the server moves everyone to results when all battles are done */
  waitingOthers: boolean;
  inGame: boolean;
}

export const useNet = create<NetState>()(() => ({
  session: loadSession(),
  conn: 'idle',
  room: null,
  you: null,
  chat: [],
  error: null,
  waitingOthers: false,
  inGame: false,
}));

const setMode = (m: UiMode) => useMode.getState().setMode(m);

// ---------------------------------------------------------------- auth

function setSession(s: Session | null) {
  saveSession(s);
  useNet.setState({ session: s });
}

export async function signInGuest(name: string) {
  setSession(await api.guest(name.trim()));
}
export async function signIn(email: string, password: string) {
  setSession(await api.login(email.trim(), password));
}
export async function signUp(email: string, password: string, name: string) {
  setSession(await api.signup(email.trim(), password, name.trim()));
}
export async function signOut() {
  const s = useNet.getState().session;
  leaveRoom(null);
  setSession(null);
  if (s) await api.logout(s.token).catch(() => {});
  setMode('online-auth');
}

/** validate a remembered token; a rejected one is dropped */
export async function verifySession(): Promise<boolean> {
  const s = useNet.getState().session;
  if (!s) return false;
  try {
    const { user } = await api.me(s.token);
    setSession({ token: s.token, user });
    return true;
  } catch (e) {
    if ((e as { status?: number }).status === 401) {
      setSession(null);
      return false;
    }
    return true; // server unreachable: keep the token, the rooms screen will show the error
  }
}

/** full-page redirect to the server's Google OAuth; it comes back to `?online#aw_token=…` (or `#aw_error=…`) */
export function googleLoginUrl(loc: { origin: string; pathname: string } = location): string {
  return `${SERVER}${API_PREFIX}/auth/google?return=${encodeURIComponent(`${loc.origin}${loc.pathname}?online`)}`;
}

/** parse an OAuth return hash: `#aw_token=…` / `#aw_error=…` */
export function parseAuthHash(hash: string): { token: string | null; error: string | null } {
  const q = new URLSearchParams(hash.replace(/^#/, ''));
  return { token: q.get('aw_token') || null, error: q.get('aw_error') || null };
}

let booted = false;
/** once on app load: handle an OAuth return hash, and `?online` deep links */
export function bootOnline() {
  if (booted || typeof location === 'undefined') return;
  booted = true;
  const { token, error } = parseAuthHash(location.hash);
  if (token || error) {
    try {
      history.replaceState(null, '', location.pathname + location.search);
    } catch {}
  }
  if (error) {
    useNet.setState({ error: `Google sign-in failed: ${error.replace(/_/g, ' ')}` });
    setMode('online-auth');
    return;
  }
  if (token) {
    setMode('online-auth');
    api
      .me(token)
      .then(({ user }) => {
        setSession({ token, user });
        useNet.setState({ error: null });
        if (useMode.getState().mode === 'online-auth') setMode('online-rooms');
      })
      .catch((e: unknown) => useNet.setState({ error: `Google sign-in failed: ${e instanceof Error ? e.message : String(e)}` }));
    return;
  }
  if (useMode.getState().mode === 'online-auth') goOnline();
}

export function goOnline() {
  setMode(useNet.getState().session ? 'online-rooms' : 'online-auth');
  void verifySession().then((ok) => {
    if (!ok && useMode.getState().mode === 'online-rooms') setMode('online-auth');
  });
}

// ---------------------------------------------------------------- room + match

let socket: GameSocket | null = null;
let offlineSnapshot: GameStore | null = null;
let replay: { round: number; result: BattleResult; side: Team } | null = null;
let lastPhaseKey = '';

export function currentSocket(): GameSocket | null {
  return socket;
}

export async function createRoom(name?: string) {
  const s = useNet.getState().session;
  if (!s) throw new Error('Not signed in');
  const { room } = await api.createRoom(s.token, name);
  joinRoom(room.id, room);
}

export function joinRoom(roomId: string, room: RoomInfo | null = null) {
  const s = useNet.getState().session;
  if (!s) return setMode('online-auth');
  closeSocket();
  useNet.setState({ room, you: null, chat: [], error: null, waitingOthers: false, inGame: false });
  const sock = new GameSocket(s.token, roomId);
  socket = sock;
  sock.onStatus((conn) => socket === sock && useNet.setState({ conn }));
  sock.on('welcome', (m) => useNet.setState({ you: m.you, room: m.room }));
  sock.on('room', (m) => useNet.setState({ room: m.room }));
  sock.on('chat', (m) => useNet.setState((st) => ({ chat: [...st.chat, { from: m.from, text: m.text, at: m.at }].slice(-60) })));
  sock.on('error', (m) => onError(m));
  sock.on('state', (m) => applyView(m.state));
  sock.on('battle', (m) => applyBattle(m.input));
  setMode('online-room');
  sock.connect();
}

function onError(m: Extract<ServerMsg, { t: 'error' }>) {
  useNet.setState({ error: m.message || m.code });
  if (m.code === 'room_not_found' || m.code === 'room_full' || m.code === 'version') {
    leaveRoom('online-rooms');
    useNet.setState({ error: m.message || m.code });
  } else if (m.code === 'unauthorized') {
    leaveRoom('online-auth');
    setSession(null);
    useNet.setState({ error: 'Session expired, please sign in again' });
  }
}

export function startMatch() {
  socket?.send({ t: 'start' });
}

export function sendChat(text: string) {
  const t = text.trim().slice(0, 200);
  if (t) socket?.send({ t: 'chat', text: t });
}

function closeSocket() {
  const s = socket;
  socket = null;
  s?.close();
}

/** leave the room (tells the server), restore the offline store, then show `next` */
export function leaveRoom(next: UiMode | null = 'online-rooms') {
  if (socket) {
    socket.send({ t: 'leave' });
    closeSocket();
  }
  exitGame();
  useNet.setState({ room: null, you: null, chat: [], conn: 'idle', waitingOthers: false });
  if (next) setMode(next);
}

function enterGame() {
  if (useNet.getState().inGame) return;
  offlineSnapshot = useGame.getState();
  replay = null;
  lastPhaseKey = '';
  const actions = makeOnlineActions((m) => socket?.send(m), {
    onBattleDone: () => useNet.setState({ waitingOthers: true }),
  });
  useGame.setState({ ...actions });
  useNet.setState({ inGame: true, waitingOthers: false });
  setMode('online-game');
}

function exitGame() {
  if (!useNet.getState().inGame) return;
  if (offlineSnapshot) useGame.setState(offlineSnapshot, true);
  offlineSnapshot = null;
  replay = null;
  useNet.setState({ inGame: false });
}

/** the local-only fields an incoming server view must not clobber */
export function mergeView(prev: GameState, view: GameView, toLocal: (serverMs: number) => number, rep: typeof replay): Partial<GameState> {
  let humanBattle = prev.humanBattle;
  let humanSide = prev.humanSide;
  if (view.phase === 'battle') {
    if (rep && rep.round === view.round) {
      humanBattle = rep.result;
      humanSide = rep.side;
    } else if (prev.phase !== 'battle' || prev.round !== view.round) humanBattle = null;
  }
  return {
    ...view,
    phaseDeadline: view.phaseDeadline != null ? toLocal(view.phaseDeadline) : null,
    humanBattle,
    humanSide,
  };
}

function applyView(view: GameView) {
  if (!socket) return;
  enterGame();
  const clock = socket.clock;
  useGame.setState(mergeView(useGame.getState(), view, (ms) => clock.toLocal(ms), replay) as Partial<GameStore>);
  const key = `${view.phase}:${view.round}`;
  if (key !== lastPhaseKey) {
    lastPhaseKey = key;
    useNet.setState({ waitingOthers: false });
  }
}

function applyBattle(input: BattleReplayInput) {
  const result = runBattle(input.left, input.right, input.seed, { record: true });
  replay = { round: input.round, result, side: input.humanSide };
  const g = useGame.getState();
  if (useNet.getState().inGame && g.phase === 'battle' && g.round === input.round)
    useGame.setState({ humanBattle: result, humanSide: input.humanSide });
}

/** after game over: drop the room and go back to the room browser */
export function backToRooms() {
  leaveRoom('online-rooms');
}

/** Title → Play vs Bots / Back to title */
export function backToTitle() {
  leaveRoom('title');
}
