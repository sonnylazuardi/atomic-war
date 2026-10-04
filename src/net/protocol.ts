// Shared multiplayer contract between this client and the kickstart game server.
// kickstart vendors this file (scripts/sync-atomic-core.ts) — change it here, then re-sync.
// Pure types + tiny constants only; no runtime imports beyond core types.

import type { BattleTeamInput, GameActions, GameState, LordId, Team } from '../core/types.ts';

export const PROTOCOL_VERSION = 1;
export const MAX_SEATS = 8;
export const WS_PATH = '/ws/atomic';
export const API_PREFIX = '/api/atomic';

/** timings the server uses for its phase deadlines (seconds) */
export const MP_TIMINGS = {
  lordSelect: 30,
  prep: 25,
  battleExtra: 4, // intro + outro on top of the longest battle replay
  battleMax: 50,
  results: 4,
} as const;

// ---------------------------------------------------------------- REST shapes

export interface ApiUser {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  guest: boolean;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export type RoomStatus = 'lobby' | 'playing' | 'finished';

export interface SeatInfo {
  seat: number; // 0..7 = player id in the match
  userId: string;
  name: string;
  avatarUrl: string | null;
  connected: boolean;
}

export interface RoomInfo {
  id: string; // short code, e.g. "K7Q2"
  name: string;
  status: RoomStatus;
  hostId: string; // userId
  maxPlayers: number; // MAX_SEATS
  seats: SeatInfo[]; // humans only; bots fill the rest at start
  round: number; // 0 while in lobby
  createdAt: string; // ISO
}

export interface MatchSummary {
  id: string;
  roomId: string;
  finishedAt: string;
  rounds: number;
  placement: number; // yours
  lordId: LordId | null;
  players: { name: string; placement: number; bot: boolean }[];
}

// ---------------------------------------------------------------- game view

/** What a client sees: the full GameState from its own seat's point of view. The server hides
 *  rngState (0) and other players' shop offers, inventories and lord choices. */
export type GameView = GameState & { selfId: number };

/** One battle a client should replay locally for display (the server already resolved it). */
export interface BattleReplayInput {
  round: number;
  seed: number;
  left: BattleTeamInput;
  right: BattleTeamInput;
  humanSide: Team; // which side the viewer is on
  names: { left: string; right: string };
}

// ---------------------------------------------------------------- socket messages

/** Player intents the server accepts. The server drives newGame / readyForBattle / finishBattle /
 *  nextRound itself on its clock. */
export type ActName = Exclude<keyof GameActions, 'newGame' | 'readyForBattle' | 'finishBattle' | 'nextRound'>;

export type ClientMsg =
  | { t: 'hello'; v: number }
  | { t: 'start' } // host only, lobby only
  | { t: 'leave' }
  | { t: 'chat'; text: string }
  | { t: 'act'; name: ActName; args: unknown[] }
  | { t: 'ping'; at: number };

export type ServerMsg =
  | { t: 'welcome'; you: { userId: string; seat: number | null }; room: RoomInfo; serverNow: number }
  | { t: 'room'; room: RoomInfo }
  | { t: 'state'; state: GameView; serverNow: number }
  | { t: 'battle'; input: BattleReplayInput }
  | { t: 'chat'; from: { userId: string; name: string }; text: string; at: number }
  | { t: 'error'; code: ErrorCode; message: string }
  | { t: 'pong'; at: number; serverNow: number };

export type ErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'version'
  | 'room_not_found'
  | 'room_full'
  | 'not_host'
  | 'already_started'
  | 'rate_limited'
  | 'illegal';
