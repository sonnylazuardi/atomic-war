// Online GameActions: every player intent becomes an `act` message; the clock-driven transitions
// (newGame / readyForBattle / finishBattle / nextRound) belong to the server and are local hooks here.
import type { GameActions } from '../core/types.ts';
import type { ActName } from './protocol.ts';

export const ACT_NAMES = [
  'pickLord',
  'rerollLords',
  'buyHero',
  'buySpell',
  'buyItem',
  'refreshShop',
  'upgradeShop',
  'toggleLock',
  'upgradeHero',
  'sellHero',
  'sellSpell',
  'sellItem',
  'assignSpell',
  'unassignSpell',
  'swapSpellSlots',
  'equipItem',
  'unequipItem',
  'placeHero',
  'useLordAbility',
] as const satisfies readonly ActName[];

// compile-time check: ACT_NAMES covers every ActName
type Missing = Exclude<ActName, (typeof ACT_NAMES)[number]>;
const _exhaustive: [Missing] extends [never] ? true : Missing = true;
void _exhaustive;

/** drop trailing undefined args (optional params) so JSON stays clean */
export function trimArgs(args: unknown[]): unknown[] {
  let n = args.length;
  while (n > 0 && args[n - 1] === undefined) n--;
  return args.slice(0, n);
}

export interface ServerDrivenHooks {
  /** World finished animating our battle; the server will move everyone to results */
  onBattleDone?: () => void;
}

/** `dispatch` sends the intent (and may predict it, see predict.ts) */
export function makeOnlineActions(dispatch: (name: ActName, args: unknown[]) => void, hooks: ServerDrivenHooks = {}): GameActions {
  const acts = {} as Record<ActName, (...args: unknown[]) => void>;
  for (const name of ACT_NAMES) acts[name] = (...args: unknown[]) => dispatch(name, trimArgs(args));
  return {
    ...(acts as unknown as Pick<GameActions, ActName>),
    newGame: () => {},
    readyForBattle: () => {},
    finishBattle: () => hooks.onBattleDone?.(),
    nextRound: () => {},
  };
}
