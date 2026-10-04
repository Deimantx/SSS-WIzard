import type { GameState } from '../../game/types'
import { createInitialState } from '../../store/initialState'
import { recalculateDerivedStats } from '../../game/engine'
import type { PersistedGameStateV3 } from './persistedGameState'
import { SAVE_VERSION } from '../../store/initialState'
import { isElementId } from '../../game/content/elements/elements'
import { COMBAT_LOCATIONS } from '../../game/content/combat-locations/worldNavigation'

const sanitizeWards = (input: unknown): GameState['combat']['elementalDamageReductions'] => {
  if (!Array.isArray(input)) return []
  return input.flatMap((value) => {
    if (!value || typeof value !== 'object') return []
    const ward = value as Record<string, unknown>
    if (!isElementId(ward.element) || typeof ward.sourceId !== 'string' || !ward.sourceId.trim() || typeof ward.reduction !== 'number' || !Number.isFinite(ward.reduction) || ward.reduction <= 0 || ward.reduction >= 1) return []
    if (ward.expiresAt !== undefined && (typeof ward.expiresAt !== 'number' || !Number.isFinite(ward.expiresAt) || ward.expiresAt < 0)) return []
    if (ward.durationMs !== undefined && (typeof ward.durationMs !== 'number' || !Number.isFinite(ward.durationMs) || ward.durationMs <= 0)) return []
    return [{ element: ward.element, sourceId: ward.sourceId, reduction: ward.reduction, ...(typeof ward.expiresAt === 'number' ? { expiresAt: ward.expiresAt } : {}), ...(typeof ward.durationMs === 'number' ? { durationMs: ward.durationMs } : {}) }]
  }).slice(-32) as GameState['combat']['elementalDamageReductions']
}

export const reconcileLoadedProfileState = (state: GameState, sourceContentVersion?: number): GameState => {
  if (sourceContentVersion === undefined || sourceContentVersion < SAVE_VERSION && sourceContentVersion !== 65) {
    Object.assign(state, createInitialState())
    return state
  }

  if (sourceContentVersion === 65 && state.combat.active && state.combat.locationId) {
    const location = COMBAT_LOCATIONS[state.combat.locationId]
    const convertedBoss = state.combat.locationId === 'cinder-sepulcher' ? 'sepulcher-flamekeeper' : state.combat.locationId === 'temple-of-the-sunken-bell' ? 'deep-bell-saint' : null
    if (convertedBoss && state.combat.enemyId === convertedBoss) {
      const fresh = createInitialState()
      state.combat = { ...fresh.combat, log: state.combat.log, combatRngState: state.combat.combatRngState }
    } else if (location?.encounterMode === 'sequence') {
      const sequence = location.encounterSequence ?? []
      const activeIndex = state.combat.enemyId ? sequence.indexOf(state.combat.enemyId) : -1
      state.combat.sequenceIndex = activeIndex >= 0 ? activeIndex : state.combat.enemyId === location.boss ? sequence.length : 0
      state.combat.targetEnemyId = null
      state.combat.pendingBossId = null
      state.combat.threatCleared = 0
    } else if (location && state.combat.targetEnemyId && !location.monsterPool.includes(state.combat.targetEnemyId)) {
      state.combat.targetEnemyId = location.monsterPool[0] ?? null
      state.combat.threatCleared = 0
    }
  }

  const wardNow = Math.max(0, state.combat.arcaneCoreRuntime.elapsedMs || 0)
  const wards = new Map<string, GameState['combat']['elementalDamageReductions'][number]>()
  for (const ward of state.combat.elementalDamageReductions ?? []) {
    if (ward.expiresAt !== undefined && ward.expiresAt <= wardNow) continue
    const key = `${ward.element}:${ward.sourceId}`
    const previous = wards.get(key)
    if (!previous || (ward.expiresAt === undefined && previous.expiresAt !== undefined) || (ward.expiresAt !== undefined && previous.expiresAt !== undefined && ward.expiresAt > previous.expiresAt)) wards.set(key, ward)
  }
  state.combat.elementalDamageReductions = state.combat.active ? [...wards.values()].slice(-32) : []
  return state
}
export const loadPersistedGameStateV3 = (document: PersistedGameStateV3): GameState => {
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
  state.combat = { ...structuredClone(document.combat), elementalDamageReductions: sanitizeWards(document.combat.elementalDamageReductions), log: [] }
  if (!state.combat.active) state.combat.elementalDamageReductions = []
  state.progress = structuredClone(document.progress)
  state.storyProgress = structuredClone(document.storyProgress)
  state.darkPortal = structuredClone(document.darkPortal)
  state.spellPresets = structuredClone(document.spellPresets)
  state.offlineBankMs = document.offlineBankMs
  state.lastSavedAt = document.savedAt
  state.ui = { screen: 'home', legacyArchiveRoute: null, ...(document.ui?.lastEnteredCombatLocationId ? { lastEnteredCombatLocationId: document.ui.lastEnteredCombatLocationId } : {}) }
  state.notifications = []
  reconcileLoadedProfileState(state, document.contentVersion)
  recalculateDerivedStats(state)
  state.combat.playerBarrier = Number.isFinite(state.combat.playerBarrier) ? Math.max(0, state.combat.playerBarrier) : 0
  return state
}
