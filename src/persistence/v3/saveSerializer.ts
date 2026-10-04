import type { GameState } from '../../game/types'
import { PERSISTED_COMBAT_FIELDS_V3, type PersistedCombatStateV3, type PersistedGameStateV3 } from './persistedGameState'
import { validatePersistedGameStateV3 } from './saveSchema'
import { SAVE_VERSION } from '../../store/initialState'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export const serializeGameStateV3 = (state: GameState, savedAt = state.lastSavedAt): PersistedGameStateV3 => {
  const activities = clone(state.activities)
  activities.research = { slots: clone(state.activities.research.slots) }
  activities.transmutation = { jobs: clone(state.activities.transmutation.jobs) }
  const document: PersistedGameStateV3 = {
    schemaVersion: 3,
    contentVersion: SAVE_VERSION,
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
    inventory: clone(state.inventory),
    crystals: clone(state.crystals),
    protectedItems: clone(state.protectedItems),
    equipment: clone(state.equipment),
    arcaneCore: clone(state.arcaneCore),
    artifactProgress: clone(state.artifactProgress),
    sigils: clone(state.sigils),
    guardians: clone(state.guardians),
    activities,
    combat: Object.fromEntries(PERSISTED_COMBAT_FIELDS_V3.map((field) => [field, field === 'elementalDamageReductions' && !state.combat.active ? [] : clone(state.combat[field])])) as PersistedCombatStateV3,
    progress: clone(state.progress),
    storyProgress: clone(state.storyProgress),
    darkPortal: clone(state.darkPortal),
    spellPresets: clone(state.spellPresets),
    ...(state.ui.lastEnteredCombatLocationId ? { ui: { lastEnteredCombatLocationId: state.ui.lastEnteredCombatLocationId } } : {}),
    offlineBankMs: state.offlineBankMs,
  }
  if (!validatePersistedGameStateV3(document)) throw new Error('Runtime state could not be mapped to the V3 save schema.')
  return document
}
