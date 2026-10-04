// Local UI-only state (selection, click-to-assign, lord targeting). Not game state.
import { create } from 'zustand';

export type PendingInv = { kind: 'spell' | 'item'; idx: number } | null;

interface UiState {
  selectedUid: string | null;
  pending: PendingInv;
  lordTargeting: boolean;
  select(uid: string | null): void;
  setPending(p: PendingInv): void;
  setLordTargeting(on: boolean): void;
}

export const useUi = create<UiState>()((set) => ({
  selectedUid: null,
  pending: null,
  lordTargeting: false,
  select: (uid) => set({ selectedUid: uid }),
  setPending: (p) => set({ pending: p }),
  setLordTargeting: (on) => set({ lordTargeting: on }),
}));
