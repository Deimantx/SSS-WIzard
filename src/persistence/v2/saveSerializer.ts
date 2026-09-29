import type { GameState } from '../../game/types'
import type { PersistedGameStateV1 } from './persistedGameState'
import { validatePersistedGameStateV1 } from './saveSchema'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export const serializeGameStateV1 = (state: GameState, savedAt = state.lastSavedAt): PersistedGameStateV1 => {
  const document: PersistedGameStateV1 = {
    schemaVersion: 1,
    savedAt,
    player: {
      health: state.player.health,
      mana: state.player.mana,
      baseMaxHealth: state.player.baseMaxHealth,
      baseMaxMana: state.player.baseMaxMana,
      healthRegenTimerMs: state.player.healthRegenTimerMs,
    },
    schools: clone(state.schools),
    currencies: clone(state.currencies),
    resonance: clone(state.resonance),
    tower: clone(state.tower),
    worldTier: clone(state.worldTier),
    inventory: clone(state.inventory),
    crystals: clone(state.crystals),
    protectedItems: clone(state.protectedItems),
    equipment: clone(state.equipment),
    arcaneCore: clone(state.arcaneCore),
    artifactProgress: clone(state.artifactProgress),
    sigils: clone(state.sigils),
    guardians: clone(state.guardians),
    activities: clone(state.activities),
    combat: clone(state.combat),
    progress: clone(state.progress),
    storyProgress: clone(state.storyProgress),
    darkPortal: clone(state.darkPortal),
    spellPresets: clone(state.spellPresets),
    offlineBankMs: state.offlineBankMs,
  }
  delete (document.combat as Partial<GameState['combat']>).log
  if (!validatePersistedGameStateV1(document)) throw new Error('Runtime state could not be mapped to the V2 save schema.')
  return document
}
