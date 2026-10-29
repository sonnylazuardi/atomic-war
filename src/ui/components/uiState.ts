// Local UI-only state (selection, click-to-assign, lord targeting, roster tab). Not game state.
import { create } from 'zustand';

export type PendingInv = { kind: 'spell' | 'item'; idx: number } | null;
export type RosterTab = 'items' | 'skills';
/** mobile: a filled hero slot tapped for its actions (unequip / sell), since touch has no right-click or drag */
export type SlotPick = { uid: string; kind: 'spell' | 'item'; idx: number; /** Move tapped: next hero/slot tap is the target */ moving?: boolean } | null;

const TAB_KEY = 'aw.rosterTab';
function loadTab(): RosterTab {
  try {
    return localStorage.getItem(TAB_KEY) === 'items' ? 'items' : 'skills';
  } catch {
    return 'skills';
  }
}

interface UiState {
  selectedUid: string | null;
  pending: PendingInv;
  slotPick: SlotPick;
  lordTargeting: boolean;
  rosterTab: RosterTab;
  select(uid: string | null): void;
  setPending(p: PendingInv): void;
  setSlotPick(p: SlotPick): void;
  setLordTargeting(on: boolean): void;
  setRosterTab(t: RosterTab): void;
}

export const useUi = create<UiState>()((set) => ({
  selectedUid: null,
  pending: null,
  slotPick: null,
  lordTargeting: false,
  rosterTab: loadTab(),
  select: (uid) => set({ selectedUid: uid }),
  // picking an inventory spell/item flips the roster to the matching tab so its slots are visible
  setPending: (p) => set(p ? { pending: p, slotPick: null, rosterTab: p.kind === 'spell' ? 'skills' : 'items' } : { pending: null }),
  setSlotPick: (p) => set(p ? { slotPick: p, pending: null } : { slotPick: null }),
  setLordTargeting: (on) => set({ lordTargeting: on }),
  setRosterTab: (t) => {
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {}
    set({ rosterTab: t });
  },
}));
