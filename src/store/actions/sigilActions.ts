import { recalculateDerivedStats } from '../../game/engine'
import type { GameState, SigilQuality, SigilSetId, SigilSlot, SigilTier } from '../../game/types'
import { craftSigil as craftSigilRuntime, type SigilCraftMode } from '../../game/systems/sigils/sigilCrafting'
import { enhanceSigil as enhanceSigilRuntime, type SigilEnhancementOptions } from '../../game/systems/sigils/sigilEnhancement'
export type { SigilEnhancementOptions } from '../../game/systems/sigils/sigilEnhancement'
import { equipSigil as equipSigilRuntime, toggleSigilLock as toggleSigilLockRuntime, unequipSigil as unequipSigilRuntime } from '../../game/systems/sigils/sigilEquipment'
import { bulkSalvageSigils as bulkSalvageSigilsRuntime, salvageSigil as salvageSigilRuntime } from '../../game/systems/sigils/sigilSalvage'

export const equipSigilAction = (state: GameState, instanceId: string) => { const result = equipSigilRuntime(state, instanceId); if (result.ok) recalculateDerivedStats(state); return result }
export const unequipSigilAction = (state: GameState, slot: SigilSlot) => { const result = unequipSigilRuntime(state, slot); if (result.ok) recalculateDerivedStats(state); return result }
export const toggleSigilLockAction = (state: GameState, instanceId: string) => toggleSigilLockRuntime(state, instanceId)
export const enhanceSigilAction = (state: GameState, instanceId: string, options?: SigilEnhancementOptions) => { const result = enhanceSigilRuntime(state, instanceId, options); if (result.ok && state.sigils.equipped[state.sigils.storage[instanceId]?.slot ?? 1] === instanceId) recalculateDerivedStats(state); return result }
export const salvageSigilAction = (state: GameState, instanceId: string) => salvageSigilRuntime(state, instanceId)
export const bulkSalvageSigilsAction = (state: GameState, instanceIds: readonly string[]) => bulkSalvageSigilsRuntime(state, instanceIds)
export const setSigilAttunementAction = (state: GameState, setId: SigilSetId | null) => { if (setId && !state.sigils.discovery.discoveredSets[setId]) return { ok: false as const, reason: 'Discover that Set before attuning.' }; state.sigils.attunedSetId = setId; return { ok: true as const } }
export const setSigilAutoSalvageAction = (state: GameState, quality: SigilQuality, enabled: boolean) => { state.sigils.autoSalvage[quality] = enabled; return { ok: true as const } }
export const craftSigilAction = (state: GameState, mode: SigilCraftMode, tier: SigilTier, setId: SigilSetId, slot?: SigilSlot, rng: () => number = Math.random) => craftSigilRuntime(state, mode, tier, setId, rng, slot)
