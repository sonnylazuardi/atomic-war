// The seat this client controls: 0 offline, the server-assigned seat online (GameState.selfId).
import type { GameState, Pairing, PlayerState } from '../core/types.ts';
import { useGame } from './store.ts';

export const selfIdOf = (s: Pick<GameState, 'selfId'>): number => s.selfId ?? 0;
export const meOf = (s: Pick<GameState, 'selfId' | 'players'>): PlayerState => s.players[selfIdOf(s)]!;
/** the human's PlayerState, reactive */
export const useMe = (): PlayerState => useGame((s) => meOf(s));
export const useSelfId = (): number => useGame((s) => selfIdOf(s));
/** is this pairing ours? */
export const involves = (p: Pick<Pairing, 'left' | 'right'>, id: number) => p.left === id || p.right === id;
