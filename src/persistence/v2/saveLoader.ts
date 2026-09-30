import type { GameState } from '../../game/types'
import { createInitialState } from '../../store/initialState'
import { recalculateDerivedStats } from '../../game/engine'
import type { PersistedGameStateV1 } from './persistedGameState'
import { SAVE_VERSION } from '../../store/initialState'
import { CHRONICLE_OBJECTIVES } from '../../game/content/chronicles/chronicles'
import { reconcileChronicleProgress } from '../../game/systems/chronicles/chronicleRuntime'
import type { ChronicleObjectiveId } from '../../game/types'

const FIRST_FRONTIER_OPENING_IDS = ['m1-choose-school', 'm1a-enter-elemental-counter-zone', 'm1b-exploit-elemental-weakness', 'm2-first-blood', 'm2a-elemental-frontier', 'm2b-equip-elemental-ward', 'm2c-test-elemental-ward', 'm2d-defeat-elemental-boss'] as const

export const reconcileLoadedProfileState = (state: GameState, sourceContentVersion?: number): GameState => {
  if (sourceContentVersion !== undefined && sourceContentVersion >= SAVE_VERSION) return state
  const progress = state.progress
  const chronicle = progress.chronicle
  const hasAnyBoss = Object.values(progress.bossKillsByBoss).some((kills) => kills > 0)
  const forest = (progress.bossKillsByBoss['forest-heart'] ?? 0) > 0
  const bear = (progress.bossKillsByBoss['corrupted-greatbear'] ?? 0) > 0
  const edrin = (progress.bossKillsByBoss['archmage-edrin-shade'] ?? 0) > 0
  const clearlyProgressed = progress.lifetimeKills > 0 || hasAnyBoss || progress.tutorialStage === 'complete' || forest || bear || edrin
  if (clearlyProgressed) chronicle.eventFlags['elemental-tutorial-zones-opened'] = true
  if (hasAnyBoss || forest || bear || edrin) chronicle.eventFlags['first-elemental-tutorial-boss-defeated'] = true
  if (forest || bear || edrin) {
    chronicle.eventFlags['first-elemental-ward-equipped'] = true
    chronicle.eventFlags['first-elemental-ward-mitigation'] = true
    chronicle.eventFlags['first-elemental-weakness-hit'] = true
    chronicle.eventFlags['starting-counter-zone-entered'] = true
    chronicle.completedObjectiveIds = [...new Set([...chronicle.completedObjectiveIds, ...FIRST_FRONTIER_OPENING_IDS])]
  }
  const completedHistoricalBosses: ChronicleObjectiveId[] = []
  if (forest) completedHistoricalBosses.push('m3-heart-of-the-woods')
  if (bear) completedHistoricalBosses.push('m4-break-the-den')
  if (edrin) completedHistoricalBosses.push('m5-fallen-archmage')
  chronicle.completedObjectiveIds = [...new Set([...chronicle.completedObjectiveIds, ...completedHistoricalBosses])]
  // Preserve reward idempotency when reconciliation unlocks objectives on legacy profiles.
  const completed = new Set(chronicle.completedObjectiveIds)
  chronicle.grantedUnlockRewardIds = [...new Set([...chronicle.grantedUnlockRewardIds, ...CHRONICLE_OBJECTIVES.filter((objective) => completed.has(objective.id) && objective.onUnlockReward?.length).map((objective) => objective.id)])]
  reconcileChronicleProgress(state, { notify: false })
  return state
}

const sanitizeWards = (value: unknown) => Array.isArray(value) ? value.filter((ward): ward is NonNullable<GameState['combat']['elementalDamageReductions']>[number] => {
  if (!ward || typeof ward !== 'object') return false
  const candidate = ward as Record<string, unknown>
  return typeof candidate.element === 'string' && ['fire', 'water', 'air', 'earth', 'arcane'].includes(candidate.element)
    && typeof candidate.sourceId === 'string' && candidate.sourceId.trim().length > 0
    && typeof candidate.reduction === 'number' && Number.isFinite(candidate.reduction) && candidate.reduction > 0 && candidate.reduction < 1
    && (candidate.expiresAt === undefined || typeof candidate.expiresAt === 'number' && Number.isFinite(candidate.expiresAt) && candidate.expiresAt >= 0)
}).slice(0, 32) : []

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
  state.combat = { ...structuredClone(document.combat), elementalDamageReductions: sanitizeWards(document.combat.elementalDamageReductions), log: [] }
  if (!state.combat.active) state.combat.elementalDamageReductions = []
  state.progress = structuredClone(document.progress)
  state.storyProgress = structuredClone(document.storyProgress)
  state.darkPortal = structuredClone(document.darkPortal)
  state.spellPresets = structuredClone(document.spellPresets)
  state.offlineBankMs = document.offlineBankMs
  state.lastSavedAt = document.savedAt
  state.ui = { screen: 'home', legacyArchiveRoute: null }
  state.notifications = []
  reconcileLoadedProfileState(state, document.contentVersion)
  recalculateDerivedStats(state)
  state.combat.playerBarrier = Number.isFinite(state.combat.playerBarrier) ? Math.max(0, state.combat.playerBarrier) : 0
  return state
}
