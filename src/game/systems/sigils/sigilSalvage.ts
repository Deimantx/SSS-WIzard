import type { GameState } from '../../types'
import { getSigilSalvageValue } from './sigilRuntime'

export interface BulkSalvageResult { ok: boolean; salvagedCount: number; dustGranted: number; skippedLocked: number; skippedEquipped: number; missing: number }

export type SigilSalvageResult = { ok: true; dust: number } | { ok: false; reason: string }

export const salvageSigil = (state: GameState, instanceId: string): SigilSalvageResult => {
  const sigil = state.sigils.storage[instanceId]
  if (!sigil) return { ok: false, reason: 'Sigil not found.' }
  if (sigil.locked) return { ok: false, reason: 'Unlock the Sigil before salvaging.' }
  if (Object.values(state.sigils.equipped).includes(instanceId)) return { ok: false, reason: 'Unequip the Sigil before salvaging.' }
  const dust = getSigilSalvageValue(sigil)
  delete state.sigils.storage[instanceId]
  state.sigils.dust += dust
  return { ok: true, dust }
}

export const bulkSalvageSigils = (state: GameState, instanceIds: readonly string[]): BulkSalvageResult => {
  const result: BulkSalvageResult = { ok: false, salvagedCount: 0, dustGranted: 0, skippedLocked: 0, skippedEquipped: 0, missing: 0 }
  for (const instanceId of new Set(instanceIds)) {
    const sigil = state.sigils.storage[instanceId]
    if (!sigil) { result.missing += 1; continue }
    if (sigil.locked) { result.skippedLocked += 1; continue }
    if (Object.values(state.sigils.equipped).includes(instanceId)) { result.skippedEquipped += 1; continue }
    const salvaged = salvageSigil(state, instanceId)
    if (!salvaged.ok) continue
    result.salvagedCount += 1
    result.dustGranted += salvaged.dust
  }
  result.ok = result.salvagedCount > 0
  return result
}
export const shouldAutoSalvageSigil = (state: Pick<GameState, 'sigils'>, instanceId: string) => {
  const sigil = state.sigils.storage[instanceId]
  return Boolean(sigil && !sigil.locked && state.sigils.autoSalvage[sigil.quality])
}
