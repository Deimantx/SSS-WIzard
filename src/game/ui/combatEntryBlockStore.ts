import { create } from 'zustand'

export interface CombatFocusBlockSnapshot {
  kind: 'focus'
  loadoutName: string
  maxFocus: number
  activeNonCombatFocus: number
  availableForCombat: number
  combatFocusRequired: number
  missingFocus: number
}

interface CombatEntryBlockState {
  snapshot: CombatFocusBlockSnapshot | null
  showFocusBlock: (snapshot: CombatFocusBlockSnapshot) => void
  clear: () => void
}

export const useCombatEntryBlockStore = create<CombatEntryBlockState>((set) => ({
  snapshot: null,
  showFocusBlock: (snapshot) => set({ snapshot }),
  clear: () => set({ snapshot: null }),
}))

export const showCombatFocusBlock = (snapshot: CombatFocusBlockSnapshot) => useCombatEntryBlockStore.getState().showFocusBlock(snapshot)
export const clearCombatEntryBlock = () => useCombatEntryBlockStore.getState().clear()
