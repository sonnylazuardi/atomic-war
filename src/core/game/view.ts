// Per-viewer projection of the authoritative GameState (online play): what seat `pid` may see.
import type { GameState, PlayerState } from '../types.ts';
import { cloneState, type GS } from './util.ts';

/** GameState as seen from seat `pid`: deep copy, rngState zeroed, no battle recording or pending results,
 *  and other players' shop offers, inventories and lord choices hidden. */
export function viewFor(s: GameState, pid: number): GameState & { selfId: number } {
  const v = cloneState(s);
  delete v.pendingGains;
  delete v.pendingDamage;
  delete v.pendingResult;
  const self: PlayerState | undefined = v.players[pid];
  v.selfId = pid;
  v.rngState = 0;
  v.humanBattle = null;
  v.humanSide = 'left';
  v.lordChoices = self ? [...(self.lordChoices ?? (s.online ? [] : s.lordChoices))] : [];
  v.lordRerollUsed = self ? (self.lordRerollUsed ?? (s.online ? false : s.lordRerollUsed)) : true;
  // online: the shared log carries public announcements; append this player's private messages
  if (s.online) v.log = [...s.log, ...(self?.log ?? [])].slice(-50);
  for (const p of v.players) {
    if (p.id === pid) continue;
    p.shop = {
      heroOffers: p.shop.heroOffers.map(() => null),
      spellOffers: p.shop.spellOffers.map(() => null),
      itemOffers: p.shop.itemOffers.map(() => null),
      locked: false,
    };
    p.spellInventory = [];
    p.itemInventory = [];
    delete p.lordChoices;
    delete p.lordRerollUsed;
    delete p.log;
  }
  return v as GS & { selfId: number };
}
