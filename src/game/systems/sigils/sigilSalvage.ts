import type { GameState } from '../../types'
import { getSigilSalvageValue } from './sigilRuntime'

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

export const shouldAutoSalvageSigil = (state: Pick<GameState, 'sigils'>, instanceId: string) => {
  const sigil = state.sigils.storage[instanceId]
  return Boolean(sigil && !sigil.locked && (sigil.quality === 'common' && state.sigils.autoSalvage.common || sigil.quality === 'refined' && state.sigils.autoSalvage.refined))
}
