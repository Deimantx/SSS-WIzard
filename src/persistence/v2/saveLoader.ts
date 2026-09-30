import type { GameState } from '../../game/types'
import { createInitialState } from '../../store/initialState'
import { recalculateDerivedStats } from '../../game/engine'
import type { PersistedGameStateV1 } from './persistedGameState'

export const loadPersistedGameStateV1 = (document: PersistedGameStateV1): GameState => {
  const state = createInitialState()
  state.player = { ...state.player, ...structuredClone(document.player) }
  state.schools = structuredClone(document.schools)
  state.currencies = structuredClone(document.currencies)
  state.resonance = structuredClone(document.resonance)
  state.tower = structuredClone(document.tower)
  state.worldTier = structuredClone(document.worldTier)
  state.inventory = structuredClone(document.inventory)
  state.crystals = structuredClone(document.crystals)
  state.protectedItems = structuredClone(document.protectedItems)
  state.equipment = structuredClone(document.equipment)
  state.arcaneCore = structuredClone(document.arcaneCore)
  state.artifactProgress = structuredClone(document.artifactProgress)
  state.sigils = structuredClone(document.sigils)
  state.guardians = structuredClone(document.guardians)
  state.activities = structuredClone(document.activities)
  state.combat = { ...structuredClone(document.combat), elementalDamageReductions: document.combat.elementalDamageReductions ?? [], log: [] }
  if (!state.combat.active) state.combat.elementalDamageReductions = []
  state.progress = structuredClone(document.progress)
  state.storyProgress = structuredClone(document.storyProgress)
  state.darkPortal = structuredClone(document.darkPortal)
  state.spellPresets = structuredClone(document.spellPresets)
  state.offlineBankMs = document.offlineBankMs
  state.lastSavedAt = document.savedAt
  state.ui = { screen: 'home', legacyArchiveRoute: null }
  state.notifications = []
  recalculateDerivedStats(state)
  state.combat.playerBarrier = Number.isFinite(state.combat.playerBarrier) ? Math.max(0, state.combat.playerBarrier) : 0
  return state
}
