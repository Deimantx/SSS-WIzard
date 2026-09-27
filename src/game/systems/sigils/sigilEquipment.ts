import type { GameState, SigilSlot } from '../../types'
import { getEquippedSigilStats } from './sigilRuntime'

export type SigilEquipmentResult = { ok: true } | { ok: false; reason: string }

export const equipSigil = (state: GameState, instanceId: string): SigilEquipmentResult => {
  const sigil = state.sigils.storage[instanceId]
  if (!sigil) return { ok: false, reason: 'Sigil not found.' }
  const previous = state.sigils.equipped[sigil.slot]
  if (previous && previous !== instanceId) state.sigils.equipped[sigil.slot] = null
  const otherSlot = Object.entries(state.sigils.equipped).find(([slot, id]) => id === instanceId && Number(slot) !== sigil.slot)
  if (otherSlot) state.sigils.equipped[Number(otherSlot[0]) as SigilSlot] = null
  state.sigils.equipped[sigil.slot] = instanceId
  return { ok: true }
}

export const unequipSigil = (state: GameState, slot: SigilSlot): SigilEquipmentResult => {
  if (!state.sigils.equipped[slot]) return { ok: false, reason: 'No Sigil is equipped in that slot.' }
  state.sigils.equipped[slot] = null
  return { ok: true }
}

export const toggleSigilLock = (state: GameState, instanceId: string): SigilEquipmentResult => {
  const sigil = state.sigils.storage[instanceId]
  if (!sigil) return { ok: false, reason: 'Sigil not found.' }
  sigil.locked = !sigil.locked
  return { ok: true }
}

export { getEquippedSigilStats }
