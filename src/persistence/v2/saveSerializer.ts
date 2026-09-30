import type { GameState } from '../../game/types'
import { PERSISTED_COMBAT_FIELDS_V1, type PersistedCombatStateV1, type PersistedGameStateV1 } from './persistedGameState'
import { validatePersistedGameStateV1 } from './saveSchema'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export const serializeGameStateV1 = (state: GameState, savedAt = state.lastSavedAt): PersistedGameStateV1 => {
  const activities = clone(state.activities)
  activities.research = { slots: clone(state.activities.research.slots) }
  activities.transmutation = { jobs: clone(state.activities.transmutation.jobs) }
  const document: PersistedGameStateV1 = {
    schemaVersion: 2,
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
    activities,
    combat: Object.fromEntries(PERSISTED_COMBAT_FIELDS_V1.map((field) => [field, field === 'elementalDamageReductions' && !state.combat.active ? [] : clone(state.combat[field])])) as PersistedCombatStateV1,
    progress: clone(state.progress),
    storyProgress: clone(state.storyProgress),
    darkPortal: clone(state.darkPortal),
    spellPresets: clone(state.spellPresets),
    offlineBankMs: state.offlineBankMs,
  }
  if (!validatePersistedGameStateV1(document)) throw new Error('Runtime state could not be mapped to the V2 save schema.')
  return document
}
