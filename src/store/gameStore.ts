import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BALANCE } from '../game/core/balance/balance'
import { DUNGEONS, DUNGEON_ORDER, getDungeonUnlockRequirement, isDungeonUnlocked } from '../game/content/dungeons/dungeons'
import { MONSTERS } from '../game/content/monsters'
import { SPELLS } from '../game/content/spells/spells'
import { castSpellAction } from './actions/combatActions'
import { manaRegenPerSecond, pushNotification, recalculateDerivedStats, selectFreeFocus, selectUsedFocus } from '../game/engine'
import { debugApplyStatus, resolveCombatDeaths, spawnEnemy, spawnNextEnemy } from '../game/systems/combat/combatRuntime'
import { executeCombatEffects } from '../game/systems/combat/effectResolver'
import { forceResolveEnemyAction as forceResolveEnemyActionRuntime, resolveActiveEnemyAction as resolveActiveEnemyActionRuntime, setEnemyActionPattern as setEnemyActionPatternRuntime, startEnemyAction as startEnemyActionRuntime, startNextEnemyAction as startNextEnemyActionRuntime } from '../game/systems/combat/actionRuntime'
import { resetCombatRuleRuntime, runCombatTriggers } from '../game/systems/combat/triggerRuntime'
import { loadProfileGame, resetProfileGame } from '../persistence/profileSaveManager'
import { type SaveReason } from '../persistence/saveConstants'
import { getActiveProfileId } from '../profiles/profileSessionStore'
import { updateProfileMetadata } from '../profiles/profileStorage'
import { createInitialState } from './initialState'
import type { ChannelingDiscoveryId, DungeonId, EquipmentPosition, GameState, ItemId, ManaPillarId, MonsterId, RecipeId, ResearchSlotId, SchoolId, ScreenId, SpellId, SpellPreset, SpellPresetId, StatusId } from '../game/types'
import { clamp } from '../game/utils'
import { resetDebugState, sanitizeDebugNumber } from './actions/debugActions'
import { addItemAction, destroyItemAction, removeItemAction, sellItemAction, toggleItemProtectionAction } from './actions/inventoryActions'
import { equipItemAction, unequipItemAction } from './actions/equipmentActions'
import { donateGuildRequestAction, claimGuildRewardAction, promoteGuildAction } from './actions/guildActions'
import { debugLockSpellAction, debugUnlockSpellRankOneAction, resetSpellCooldownsAction, setSchoolDebugAction, setLevelCapAction, setThreatAction, setBossKillsAction, unlockAllSpellsAction } from './actions/progressionActions'
import { setChannelingEchoesAction, upgradeManaPillarAction, setManaPillarLevelAction, setChannelingManaGeneratedAction, setChannelingSustainAction, setChannelingDiscoveryAction } from './actions/channelingActions'
import { canReserveFocusAction, setFocusImprovementLevelAction, upgradeFocusCapacityAction } from './actions/focusActions'
import { assignResearchEchoAction, clearPreparedResearchAction, clearResearchEchoesAction, prepareResearchAction, removePreparedResearchAction, removeResearchEchoAction, setResearchEchoesAction } from './actions/researchActions'
import { assignTransmutationEchoAction, clearTransmutationAssignmentsAction, removeTransmutationEchoAction, setTransmutationEchoCapacityOverrideAction, setTransmutationEchoesAction } from './actions/transmutationActions'
import { forceCompleteTransmutationCycle } from '../game/systems/transmutation/transmutationEngine'
import { grantItem } from '../game/systems/inventory/itemAcquisition'
import { RECIPES } from '../game/content/recipes/recipes'
import { saveGameAction } from './actions/persistenceActions'
import { advanceGameState } from '../game/systems/simulation/advanceGameState'
import { forceCompleteResearchCycle } from '../game/systems/research/researchEngine'
import { advanceWithOfflineBank as runOfflineBankAdvance, isOfflineBankSimulationActive, type OfflineBankResult } from '../game/systems/offline-bank/offlineBankSimulation'
import type { OfflineBankReport } from '../game/systems/offline-bank/offlineBankReport'
import { getSpellAutoCastFocusCost, isSpellUnlocked, syncSpellUnlocksForSchool } from '../game/systems/spells'
import { applySpellPresetAction, createSpellPresetAction, deleteSpellPresetAction, duplicateSpellPresetAction, renameSpellPresetAction, saveSpellPresetAction, type ApplySpellPresetResult } from './actions/spellPresetActions'
import { clearCombatLogUi, combatLogUiSink as combatLogSink } from '../game/ui/combatLogStore'
import { createCombatEventSink } from '../game/systems/combat/combatEventSink'
import { combatTelemetryObserver, combatTelemetrySink } from '../game/telemetry/combat/combatTelemetryStore'

const combatEventSink = createCombatEventSink(combatLogSink, combatTelemetrySink)
const combatLogUiSink = combatEventSink

export interface RecentAcquisition { itemId: ItemId; amount: number; timestamp: number; isNew: boolean }

export interface GameActions {
  tick: (deltaMs: number) => void
  setScreen: (screen: ScreenId) => void
  addArcaneEcho: () => void
  removeArcaneEcho: () => void
  setChannelingEchoes: (amount: number) => void
  forceSetEchoes: (amount: number) => void
  upgradeManaPillar: (pillarId: ManaPillarId) => void
  setManaPillarLevel: (pillarId: ManaPillarId, level: number) => void
  forceSetManaPillarLevel: (pillarId: ManaPillarId, level: number) => void
  upgradeFocusCapacity: () => void
  setFocusImprovementLevel: (level: number) => void
  setChannelingManaGenerated: (amount: number) => void
  setChannelingFiveEchoSustain: (amount: number) => void
  setChannelingDiscovery: (id: ChannelingDiscoveryId, completed: boolean) => void
  setDebugManaRegenBonus: (amount: number) => void
  setDebugMaxManaBonus: (amount: number) => void
  setDebugMaxFocusBonus: (amount: number) => void
  setDebugAllowManaOverCap: (enabled: boolean) => void
  setDebugAllowFocusOverCap: (enabled: boolean) => void
  setDebugIgnoreEchoLimit: (enabled: boolean) => void
  resetDebugOverrides: () => void
  prepareResearch: (itemId: ItemId, targetSchoolId: SchoolId, quantity: number) => void
  removePreparedResearch: (slotId: ResearchSlotId) => void
  assignResearchEcho: (slotId: ResearchSlotId) => void
  removeResearchEcho: (slotId: ResearchSlotId) => void
  setResearchEchoes: (slotId: ResearchSlotId, amount: number) => void
  clearResearchEchoes: () => void
  clearPreparedResearch: () => void
  forceResearchCycle: (slotId: ResearchSlotId) => void
  assignTransmutationEcho: (recipeId: RecipeId) => void
  removeTransmutationEcho: (recipeId: RecipeId) => void
  setTransmutationEchoes: (recipeId: RecipeId, amount: number) => void
  clearTransmutationAssignments: () => void
  completeTransmutationCycle: (recipeId: RecipeId) => void
  grantTransmutationIngredients: (recipeId: RecipeId) => void
  setDebugTransmutationEchoCapacity: (amount: number | null) => void
  castSpell: (spellId: SpellId) => void
  toggleAutoCast: (spellId: SpellId) => void
  createSpellPreset: (name: string) => SpellPresetId
  renameSpellPreset: (id: SpellPresetId, name: string) => boolean
  duplicateSpellPreset: (id: SpellPresetId) => SpellPresetId | null
  deleteSpellPreset: (id: SpellPresetId) => boolean
  saveSpellPreset: (preset: SpellPreset) => boolean
  applySpellPreset: (id: SpellPresetId) => ApplySpellPresetResult
  enterDungeon: (dungeonId?: DungeonId) => void
  leaveDungeon: () => void
  engageBoss: (bossId: MonsterId) => void
  toggleAutoHunt: (dungeonId?: DungeonId) => void
  killCurrentEnemy: () => void
  spawnDebugEnemy: (enemyId: MonsterId, dungeonId?: DungeonId) => void
  setEnemyHealthPercent: (percent: number) => void
  applyPlayerStatus: (statusId: StatusId) => void
  applyEnemyStatus: (statusId: StatusId) => void
  setPlayerBarrier: (amount: number) => void
  setEnemyBarrier: (amount: number) => void
  clearPlayerBarrier: () => void
  clearEnemyBarrier: () => void
  forceEnemyAction: (actionId: string) => void
  startEnemyAction: (actionId: string) => void
  resolveActiveEnemyAction: () => void
  advanceEnemyAction: () => void
  setEnemyActionPattern: (patternId: string) => void
  resetEnemyActionPattern: () => void
  resetEnemyActionIndex: () => void
  resetCombatRuleRuntime: () => void
  clearCombatStatuses: () => void
  clearPlayerStatuses: () => void
  clearEnemyStatuses: () => void
  saveGame: (reason?: SaveReason) => SaveResult
  reloadFromStorage: () => void
  resetSave: () => void
  hydrateState: (state: GameState) => void
  dismissNotification: (id: string) => void
  setPlayer: (changes: Partial<GameState['player']>) => void
  addMana: (amount: number) => void
  setSchoolDebug: (school: SchoolId, xp: number, level?: number) => void
  setLevelCap: (cap: number) => void
  setThreat: (amount: number) => void
  addItem: (itemId: ItemId, quantity: number) => void
  removeItem: (itemId: ItemId, quantity: number) => void
  toggleItemProtection: (itemId: ItemId) => void
  sellItem: (itemId: ItemId, quantity: number) => void
  destroyItem: (itemId: ItemId, quantity: number) => void
  clearRecentNew: (itemId: ItemId) => void
  equipItem: (itemId: ItemId, targetPosition?: EquipmentPosition) => void
  unequipItem: (position: EquipmentPosition) => void
  unlockAllSpells: () => void
  debugUnlockSpellRankOne: (spellId: SpellId) => void
  debugLockSpell: (spellId: SpellId) => void
  resetSpellCooldowns: () => void
  donateGuildRequest: (requestId: string, amount: number | 'max') => void
  claimGuildReward: (requestId: string) => void
  promoteGuild: () => void
  setGuildReputation: (amount: number) => void
  setBossKills: (bossId: MonsterId, amount: number) => void
  preset: (name: 'fresh' | 'research' | 'combat' | 'boss' | 'guild' | 'main-boss' | 'chapter-complete') => void
  resumeFromHidden: (elapsedMs: number, notify?: boolean) => void
  advanceWithOfflineBank: (durationMs: number) => Promise<OfflineBankResult>
  lastOfflineBankReport: OfflineBankReport | null
}

export type GameStore = GameState & GameActions & { recentAcquisitions: RecentAcquisition[] }

export interface SaveResult { ok: boolean; error: string | null }

export const recordRecentAcquisition = (state: GameState & { recentAcquisitions?: RecentAcquisition[] }, itemId: ItemId, amount: number) => {
  if (amount <= 0 || !Number.isFinite(amount)) return
  const previous = state.recentAcquisitions ?? []
  const priorEntry = previous.find((entry) => entry.itemId === itemId)
  const wasOwned = (state.inventory[itemId] ?? 0) - amount > 0
  state.recentAcquisitions = [{ itemId, amount, timestamp: Date.now(), isNew: priorEntry?.isNew ?? !wasOwned }, ...previous.filter((entry) => entry.itemId !== itemId)].slice(0, 8)
}

const spellUnlocked = isSpellUnlocked
const canReserveFocus = canReserveFocusAction

export const useGameStore = create<GameStore>()(immer((set, get) => ({
  ...createInitialState(),
  recentAcquisitions: [],
  lastOfflineBankReport: null,
  tick: (deltaMs) => set((state) => {
    if (isOfflineBankSimulationActive()) return state
    return advanceGameState(state, deltaMs, { mode: 'live', onItemAcquired: (itemId, amount) => recordRecentAcquisition(state, itemId, amount), uiEvents: combatEventSink, telemetry: combatTelemetryObserver })
  }),
  setScreen: (screen) => set((state) => { state.ui.screen = screen; return state }),
  addArcaneEcho: () => set((state) => {
    const current = state.activities.channeling.echoesAssigned
    if (current >= BALANCE.channeling.maxEchoes) return state
    if (!canReserveFocus(state, BALANCE.channeling.echoFocusCost)) {
      pushNotification(state, `Not enough free Focus. Arcane Echo requires ${BALANCE.channeling.echoFocusCost} Focus. Free Focus: ${selectFreeFocus(state)}`, 'warning')
      return state
    }
    state.activities.channeling.echoesAssigned = current + 1
    return state
  }),
  removeArcaneEcho: () => set((state) => {
    state.activities.channeling.echoesAssigned = Math.max(0, state.activities.channeling.echoesAssigned - 1)
    return state
  }),
  setChannelingEchoes: (amount) => set((state) => { setChannelingEchoesAction(state, amount); return state }),
  forceSetEchoes: (amount) => set((state) => { setChannelingEchoesAction(state, sanitizeDebugNumber(amount), true); return state }),
  upgradeManaPillar: (pillarId) => set((state) => { upgradeManaPillarAction(state, pillarId); return state }),
  setManaPillarLevel: (pillarId, level) => set((state) => { setManaPillarLevelAction(state, pillarId, level); return state }),
  forceSetManaPillarLevel: (pillarId, level) => get().setManaPillarLevel(pillarId, level),
  upgradeFocusCapacity: () => set((state) => { upgradeFocusCapacityAction(state); return state }),
  setFocusImprovementLevel: (level) => set((state) => { setFocusImprovementLevelAction(state, level); return state }),
  setChannelingManaGenerated: (amount) => set((state) => { setChannelingManaGeneratedAction(state, amount); return state }),
  setChannelingFiveEchoSustain: (amount) => set((state) => { setChannelingSustainAction(state, amount); return state }),
  setChannelingDiscovery: (id, completed) => set((state) => { setChannelingDiscoveryAction(state, id, completed); return state }),
  setDebugManaRegenBonus: (amount) => set((state) => { state.debug.bonusManaRegenFlat = sanitizeDebugNumber(amount); return state }),
  setDebugMaxManaBonus: (amount) => set((state) => { state.debug.bonusMaxManaFlat = sanitizeDebugNumber(amount); recalculateDerivedStats(state); return state }),
  setDebugMaxFocusBonus: (amount) => set((state) => { state.debug.bonusMaxFocusFlat = sanitizeDebugNumber(amount); recalculateDerivedStats(state); return state }),
  setDebugAllowManaOverCap: (enabled) => set((state) => { state.debug.allowManaOverCap = enabled; recalculateDerivedStats(state); return state }),
  setDebugAllowFocusOverCap: (enabled) => set((state) => { state.debug.allowFocusOverCap = enabled; return state }),
  setDebugIgnoreEchoLimit: (enabled) => set((state) => { state.debug.ignoreEchoLimit = enabled; return state }),
  resetDebugOverrides: () => set((state) => { resetDebugState(state); state.activities.channeling.echoesAssigned = clamp(state.activities.channeling.echoesAssigned, 0, BALANCE.channeling.maxEchoes); recalculateDerivedStats(state); return state }),
  prepareResearch: (itemId, targetSchoolId, quantity) => set((state) => { prepareResearchAction(state, itemId, targetSchoolId, quantity); return state }),
  removePreparedResearch: (slotId) => set((state) => { removePreparedResearchAction(state, slotId); return state }),
  assignResearchEcho: (slotId) => set((state) => { assignResearchEchoAction(state, slotId); return state }),
  removeResearchEcho: (slotId) => set((state) => { removeResearchEchoAction(state, slotId); return state }),
  setResearchEchoes: (slotId, amount) => set((state) => { setResearchEchoesAction(state, slotId, amount); return state }),
  clearResearchEchoes: () => set((state) => { clearResearchEchoesAction(state); return state }),
  clearPreparedResearch: () => set((state) => { clearPreparedResearchAction(state); return state }),
  forceResearchCycle: (slotId) => set((state) => { forceCompleteResearchCycle(state, slotId, { mode: 'live' }); return state }),
  assignTransmutationEcho: (recipeId) => set((state) => { assignTransmutationEchoAction(state, recipeId); return state }),
  removeTransmutationEcho: (recipeId) => set((state) => { removeTransmutationEchoAction(state, recipeId); return state }),
  setTransmutationEchoes: (recipeId, amount) => set((state) => { setTransmutationEchoesAction(state, recipeId, amount); return state }),
  clearTransmutationAssignments: () => set((state) => { clearTransmutationAssignmentsAction(state); return state }),
  completeTransmutationCycle: (recipeId) => set((state) => { forceCompleteTransmutationCycle(state, recipeId, { mode: 'live' }); return state }),
  grantTransmutationIngredients: (recipeId) => set((state) => { const recipe = RECIPES[recipeId]; recipe.ingredients.forEach((ingredient) => grantItem(state, ingredient.itemId, ingredient.quantity)); return state }),
  setDebugTransmutationEchoCapacity: (amount) => set((state) => { setTransmutationEchoCapacityOverrideAction(state, amount); return state }),
  castSpell: (spellId) => set((state) => { castSpellAction(state, spellId, combatEventSink); return state }),
  toggleAutoCast: (spellId) => set((state) => { const cost = getSpellAutoCastFocusCost(state, spellId); if (!spellUnlocked(state, spellId) || cost === null) return state; if (state.activities.autoCast[spellId]) { state.activities.autoCast[spellId] = false; state.spellPresets.lastAppliedPresetId = null } else if (canReserveFocus(state, cost)) { state.activities.autoCast[spellId] = true; state.spellPresets.lastAppliedPresetId = null; pushNotification(state, `${SPELLS[spellId].name} Auto-Cast enabled`, 'success') } else pushNotification(state, `Cannot enable Auto-Cast · Requires ${cost} Focus · Free Focus: ${selectFreeFocus(state)}`, 'warning'); return state }),
  createSpellPreset: (name) => { let result!: SpellPresetId; set((state) => { result = createSpellPresetAction(state, name); return state }); return result },
  renameSpellPreset: (id, name) => { let result = false; set((state) => { result = renameSpellPresetAction(state, id, name); return state }); return result },
  duplicateSpellPreset: (id) => { let result: SpellPresetId | null = null; set((state) => { result = duplicateSpellPresetAction(state, id); return state }); return result },
  deleteSpellPreset: (id) => { let result = false; set((state) => { result = deleteSpellPresetAction(state, id); return state }); return result },
  saveSpellPreset: (preset) => { let result = false; set((state) => { result = saveSpellPresetAction(state, preset); return state }); return result },
  applySpellPreset: (id) => { let result: ApplySpellPresetResult = { ok: false, reason: 'missing-preset', unavailableSpellIds: [] }; set((state) => { result = applySpellPresetAction(state, id); return state }); return result },
  enterDungeon: (dungeonId = 'whispering-woods') => set((state) => { const dungeon = DUNGEONS[dungeonId]; if (state.combat.active || !dungeon) return state; if (!isDungeonUnlocked(dungeon, state.progress)) { pushNotification(state, `${getDungeonUnlockRequirement(dungeon) ?? 'Requirement'} to unlock ${dungeon.name}.`, 'warning'); return state } combatTelemetryObserver.beginRun(dungeonId); state.combat.active = true; state.combat.dungeonId = dungeonId; state.combat.encounterTimerMs = 0; state.player.health = Math.max(1, state.player.health); spawnNextEnemy(state, combatEventSink); pushNotification(state, `${dungeon.name} entered`, 'info'); return state }),
  leaveDungeon: () => { combatTelemetryObserver.endRun('leave'); return set((state) => { state.combat = { ...createInitialState().combat, log: ['Left the dungeon. Threat Cleared resets.'] }; return state }) },
  engageBoss: (bossId) => set((state) => {
    const dungeon = DUNGEONS[state.combat.dungeonId ?? 'whispering-woods']
    const boss = MONSTERS[bossId]
    if (!state.combat.active) { pushNotification(state, `Enter ${dungeon.name} first`, 'warning'); return state }
    if (state.combat.enemyId) { pushNotification(state, 'Finish the current encounter before challenging the boss.', 'warning'); return state }
    if (!isDungeonUnlocked(dungeon, state.progress)) { pushNotification(state, `${dungeon.name} is locked.`, 'warning'); return state }
    if (!boss || dungeon.boss !== bossId) { pushNotification(state, `${boss?.name ?? bossId} is not the boss of ${dungeon.name}.`, 'warning'); return state }
    if (state.combat.threatCleared < dungeon.threatRequired) { pushNotification(state, `${boss.name} requires ${dungeon.threatRequired} Threat Cleared`, 'warning'); return state }
    if (state.combat.pendingBossId === bossId) state.combat.pendingBossId = null
    state.combat.encounterTimerMs = 0
    spawnEnemy(state, bossId, combatLogUiSink)
    pushNotification(state, `${boss.name} engaged`, 'warning')
    return state
  }),
  toggleAutoHunt: (dungeonId = 'whispering-woods') => set((state) => { const dungeon = DUNGEONS[dungeonId]; if (!dungeon || !isDungeonUnlocked(dungeon, state.progress)) return state; const unlocked = state.progress.autoHuntBossUnlocked || Object.values(state.progress.bossKillsByBoss).some((kills) => kills > 0) || state.progress.firstBossKill; if (!unlocked) { pushNotification(state, 'Auto Hunt unlocks after the first dungeon boss kill', 'warning'); return state } state.progress.autoHuntBossUnlocked = true; state.progress.autoHuntBossByDungeon[dungeonId] = !state.progress.autoHuntBossByDungeon[dungeonId]; return state }),
  killCurrentEnemy: () => set((state) => { if (state.combat.enemyId) { state.combat.enemyHp = 0; resolveCombatDeaths(state, undefined, undefined, combatLogUiSink) } return state }),
  spawnDebugEnemy: (enemyId, dungeonId) => set((state) => {
    const contextDungeonId = dungeonId ?? state.combat.dungeonId ?? 'whispering-woods'
    state.combat.active = true
    state.combat.dungeonId = contextDungeonId
    spawnEnemy(state, enemyId, combatLogUiSink)
    pushNotification(state, `${MONSTERS[enemyId].name} spawned by Developer Tools in ${DUNGEONS[contextDungeonId].name}`, 'warning')
    return state
  }),
  setEnemyHealthPercent: (percent) => set((state) => { if (state.combat.enemyId) { const previousHp = state.combat.enemyHp; const nextHp = Math.max(0, Math.min(state.combat.enemyMaxHp, state.combat.enemyMaxHp * clamp(percent, 0, 100) / 100)); state.combat.enemyHp = nextHp; if (nextHp !== previousHp) { const context = { source: { actor: 'player' as const, kind: 'system' as const, sourceId: 'developer-health-control' }, eventTarget: 'enemy' as const, changedActor: 'enemy' as const, sourceTags: [], previousHp, currentHp: nextHp, previousHpPercent: previousHp / Math.max(1, state.combat.enemyMaxHp) * 100, currentHpPercent: nextHp / Math.max(1, state.combat.enemyMaxHp) * 100 }; runCombatTriggers(state, 'enemy', 'on-hp-threshold', context, executeCombatEffects, 0, [], combatLogUiSink); runCombatTriggers(state, 'player', 'on-hp-threshold', context, executeCombatEffects, 0, [], combatLogUiSink) } } return state }),
  applyPlayerStatus: (statusId) => set((state) => { debugApplyStatus(state, 'player', statusId); return state }),
  applyEnemyStatus: (statusId) => set((state) => { debugApplyStatus(state, 'enemy', statusId); return state }),
  setPlayerBarrier: (amount) => set((state) => { state.combat.playerBarrier = Math.max(0, Math.floor(sanitizeDebugNumber(amount))); if (state.combat.playerBarrier === 0) state.combat.playerBarrierRemainingMs = null; return state }),
  setEnemyBarrier: (amount) => set((state) => { state.combat.enemyBarrier = Math.max(0, Math.floor(sanitizeDebugNumber(amount))); if (state.combat.enemyBarrier === 0) state.combat.enemyBarrierRemainingMs = null; return state }),
  clearPlayerBarrier: () => set((state) => { state.combat.playerBarrier = 0; state.combat.playerBarrierRemainingMs = null; return state }),
  clearEnemyBarrier: () => set((state) => { state.combat.enemyBarrier = 0; state.combat.enemyBarrierRemainingMs = null; return state }),
  forceEnemyAction: (actionId) => set((state) => { if (state.combat.enemyId) forceResolveEnemyActionRuntime(state, actionId, executeCombatEffects, 0, combatLogUiSink); return state }),
  startEnemyAction: (actionId) => set((state) => { if (state.combat.enemyId) startEnemyActionRuntime(state, actionId, executeCombatEffects, undefined, 0, combatLogUiSink); return state }),
  resolveActiveEnemyAction: () => set((state) => { resolveActiveEnemyActionRuntime(state, executeCombatEffects, 0, combatLogUiSink); return state }),
  advanceEnemyAction: () => set((state) => { startNextEnemyActionRuntime(state, executeCombatEffects, 0, combatLogUiSink); return state }),
  setEnemyActionPattern: (patternId) => set((state) => { setEnemyActionPatternRuntime(state, patternId, combatLogUiSink); return state }),
  resetEnemyActionPattern: () => set((state) => { if (state.combat.enemyId) setEnemyActionPatternRuntime(state, MONSTERS[state.combat.enemyId].defaultActionPatternId, combatLogUiSink); return state }),
  resetEnemyActionIndex: () => set((state) => { state.combat.enemyActionIndex = 0; return state }),
  resetCombatRuleRuntime: () => set((state) => { resetCombatRuleRuntime(state); return state }),
  clearCombatStatuses: () => set((state) => { state.combat.playerStatuses = []; state.combat.enemyStatuses = []; return state }),
  clearPlayerStatuses: () => set((state) => { state.combat.playerStatuses = []; return state }),
  clearEnemyStatuses: () => set((state) => { state.combat.enemyStatuses = []; return state }),
  saveGame: (reason = 'manual') => {
    const activeProfileId = getActiveProfileId()
    const savedAt = Date.now()
    let result: SaveResult = { ok: false, error: 'Profile save failed.' }
    set((state) => { result = saveGameAction(state, activeProfileId, reason, savedAt); return state })
    return result
  },
  reloadFromStorage: () => {
    const activeProfileId = getActiveProfileId()
    if (!activeProfileId) return
    const loaded = loadProfileGame(activeProfileId)
    if (!loaded.state) return
    clearCombatLogUi()
    combatTelemetryObserver.clear()
    set((state) => { Object.assign(state, loaded.state as GameState); state.recentAcquisitions = []; state.lastOfflineBankReport = null; recalculateDerivedStats(state); return state })
  },
  resetSave: () => {
    const fresh = createInitialState()
    const activeProfileId = getActiveProfileId()
    if (activeProfileId) {
      const saved = resetProfileGame(activeProfileId, fresh)
      if (!saved.ok) {
        set((state) => { pushNotification(state, saved.error ?? 'The profile reset could not be saved.', 'warning'); return state })
        return
      }
    }
    clearCombatLogUi()
    combatTelemetryObserver.clear()
    set((state) => { Object.assign(state, fresh); state.recentAcquisitions = []; state.lastOfflineBankReport = null; return state })
    if (activeProfileId) updateProfileMetadata(activeProfileId, { lastSavedAt: fresh.lastSavedAt })
  },
  hydrateState: (nextState) => { clearCombatLogUi(); combatTelemetryObserver.clear(); return set((state) => { Object.assign(state, nextState); state.recentAcquisitions = []; state.lastOfflineBankReport = null; recalculateDerivedStats(state); return state }) },
  dismissNotification: (id) => set((state) => { state.notifications = state.notifications.filter((note) => note.id !== id); return state }),
  setPlayer: (changes) => set((state) => { state.player = { ...state.player, ...changes }; recalculateDerivedStats(state); return state }),
  addMana: (amount) => set((state) => { state.player.mana = Math.max(0, state.player.mana + sanitizeDebugNumber(amount)); recalculateDerivedStats(state); return state }),
  setSchoolDebug: (school, xp, level) => set((state) => { setSchoolDebugAction(state, school, xp, level); return state }),
  setLevelCap: (cap) => set((state) => { setLevelCapAction(state, cap); return state }),
  setThreat: (amount) => set((state) => { setThreatAction(state, amount); return state }),
  addItem: (itemId, quantity) => set((state) => { addItemAction(state, itemId, quantity); return state }),
  removeItem: (itemId, quantity) => set((state) => { removeItemAction(state, itemId, quantity); return state }),
  toggleItemProtection: (itemId) => set((state) => { toggleItemProtectionAction(state, itemId); return state }),
  sellItem: (itemId, quantity) => set((state) => { sellItemAction(state, itemId, quantity); return state }),
  destroyItem: (itemId, quantity) => set((state) => { destroyItemAction(state, itemId, quantity); return state }),
  clearRecentNew: (itemId) => set((state) => { const entry = state.recentAcquisitions.find((item) => item.itemId === itemId); if (entry) entry.isNew = false; return state }),
  equipItem: (itemId, targetPosition) => set((state) => { equipItemAction(state, itemId, targetPosition); return state }),
  unequipItem: (position) => set((state) => { unequipItemAction(state, position); return state }),
  unlockAllSpells: () => set((state) => { unlockAllSpellsAction(state); return state }),
  debugUnlockSpellRankOne: (spellId) => set((state) => { debugUnlockSpellRankOneAction(state, spellId); return state }),
  debugLockSpell: (spellId) => set((state) => { debugLockSpellAction(state, spellId); return state }),
  resetSpellCooldowns: () => set((state) => { resetSpellCooldownsAction(state); return state }),
  donateGuildRequest: (requestId, amount) => set((state) => { donateGuildRequestAction(state, requestId, amount); return state }),
  claimGuildReward: (requestId) => set((state) => { claimGuildRewardAction(state, requestId); return state }),
  promoteGuild: () => set((state) => { promoteGuildAction(state); return state }),
  setGuildReputation: (amount) => set((state) => { state.progress.guildReputation = Math.max(0, amount); return state }),
  setBossKills: (bossId, amount) => set((state) => { setBossKillsAction(state, bossId, amount); return state }),
  preset: (name) => set((state) => { clearCombatLogUi(); Object.assign(state, createInitialState()); state.lastOfflineBankReport = null; if (name === 'research') { (['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment'] as const).forEach((itemId) => { state.inventory[itemId] = 100 }); state.player.mana = 100; (['fire', 'water', 'earth', 'air'] as const).forEach((schoolId, index) => { prepareResearchAction(state, `${schoolId}-fragment` as ItemId, schoolId, 50); setResearchEchoesAction(state, `research-${index + 1}` as ResearchSlotId, index === 0 ? 2 : 1) }) } if (name === 'combat') { state.inventory['fire-fragment'] = 10; state.schools.fire = { xp: 20, level: 2 }; syncSpellUnlocksForSchool(state, 'fire'); state.player.mana = 100; state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; spawnNextEnemy(state, combatLogUiSink) } if (name === 'boss') { state.inventory['fire-fragment'] = 15; state.inventory['wisp-essence'] = 10; state.inventory['grove-bark'] = 2; state.schools.fire = { xp: 80, level: 4 }; syncSpellUnlocksForSchool(state, 'fire'); state.progress.guildUnlocked = true; state.progress.firstBossKill = true; state.progress.emberStaffUnlocked = true; state.progress.forestHeartUnlocked = true; state.progress.autoHuntBossUnlocked = true; state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; state.combat.threatCleared = 20; spawnNextEnemy(state, combatLogUiSink) } if (name === 'guild') { state.progress.guildUnlocked = true; state.progress.guildRank = 'initiate'; state.progress.firstBossKill = true; state.progress.emberStaffUnlocked = true; state.progress.forestHeartUnlocked = true; state.progress.autoHuntBossUnlocked = true; state.inventory['fire-fragment'] = 20; state.progress.lifetimeKills = 30; state.progress.requestProgress['clear-the-woods'] = 30; state.progress.bossKillsByBoss['grove-sentinel'] = 2; state.progress.requestProgress['sentinel-breaker'] = 2; state.progress.guildReputation = 100 } if (name === 'main-boss' || name === 'chapter-complete') { state.inventory['fire-fragment'] = 20; state.inventory['wisp-essence'] = 12; state.inventory['grove-bark'] = 4; state.progress.guildUnlocked = true; state.progress.guildRank = 'apprentice'; state.progress.firstBossKill = true; state.progress.emberStaffUnlocked = true; state.progress.forestHeartUnlocked = true; state.progress.autoHuntBossUnlocked = true; state.progress.permanentFocusBonuses['forest-heart'] = 10; state.progress.permanentFocusBonuses['guild-apprentice'] = 10; state.progress.magicLevelCap = 20; state.schools.fire = { xp: 380, level: 20 }; syncSpellUnlocksForSchool(state, 'fire'); state.progress.firstMainBossKill = true; state.inventory.heartseed = 1; recalculateDerivedStats(state); state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; spawnEnemy(state, 'forest-heart', combatLogUiSink); } return state }),
  resumeFromHidden: (elapsedMs, notify = true) => set((state) => { if (elapsedMs > 1000) { state.offlineBankMs += elapsedMs; if (notify) pushNotification(state, `${Math.round(elapsedMs / 1000)}s added to Offline Bank`, 'info') } return state }),
  advanceWithOfflineBank: async (durationMs) => {
    const result = await runOfflineBankAdvance(durationMs, get, (recipe) => set((state) => { recipe(state); return state }), () => { get().saveGame('autosave') }, (state, itemId, amount) => recordRecentAcquisition(state as GameStore, itemId, amount))
    if (result.ok) set((state) => { state.lastOfflineBankReport = result.report ?? null; return state })
    return result
  },
})))

// Presets replace gameplay state for developer testing; recent acquisition UI state is session-only too.
const presetGameplayState = useGameStore.getState().preset
const prepareForestHeartPreset = () => useGameStore.setState((state) => {
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.combat.threatCleared = DUNGEONS['whispering-woods'].threatRequired
  state.combat.pendingBossId = null
  spawnEnemy(state, DUNGEONS['whispering-woods'].boss, combatLogUiSink)
})
const completeDungeonPreset = () => useGameStore.setState((state) => {
  DUNGEON_ORDER.forEach((dungeonId) => { state.progress.bossKillsByBoss[DUNGEONS[dungeonId].boss] = 1; state.progress.autoHuntBossByDungeon[dungeonId] = true })
  state.progress.autoHuntBossUnlocked = true
  state.progress.firstMainBossKill = true
  state.progress.magicLevelCap = Math.max(state.progress.magicLevelCap, BALANCE.schoolProgression.tutorialCompleteCap)
  state.combat.active = true
  state.combat.dungeonId = 'abandoned-catacombs'
  state.combat.threatCleared = DUNGEONS['abandoned-catacombs'].threatRequired
  spawnEnemy(state, DUNGEONS['abandoned-catacombs'].boss, combatLogUiSink)
})
useGameStore.setState({ preset: (name) => { combatTelemetryObserver.clear(); presetGameplayState(name); if (name === 'boss' || name === 'main-boss') prepareForestHeartPreset(); if (name === 'chapter-complete') completeDungeonPreset(); useGameStore.setState({ recentAcquisitions: [] }) } })

export const useGameStoreSelectors = { selectUsedFocus, selectFreeFocus }
export { selectUsedFocus, selectFreeFocus }
export const selectManaRegen = (state: GameStore) => manaRegenPerSecond(state)
export const makeInitialState = createInitialState
