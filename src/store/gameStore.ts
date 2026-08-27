import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BALANCE } from '../game/core/balance/balance'
import { DUNGEONS } from '../game/content/dungeons/dungeons'
import { MONSTERS } from '../game/content/monsters/whisperingWoods'
import { SPELLS } from '../game/content/spells/spells'
import { castSpellAction } from './actions/combatActions'
import { manaRegenPerSecond, pushNotification, recalculateDerivedStats, selectFreeFocus, selectUsedFocus } from '../game/engine'
import { finishEnemy, spawnEnemy, spawnNextEnemy } from '../game/systems/combat/combatRuntime'
import { loadProfileGame, saveProfileGame } from '../persistence/profileSaveManager'
import { type SaveReason } from '../persistence/saveConstants'
import { getActiveProfileId } from '../profiles/profileSessionStore'
import { updateProfileMetadata } from '../profiles/profileStorage'
import { createInitialState } from './initialState'
import type { ChannelingDiscoveryId, DungeonId, EquipmentPosition, GameState, ItemId, ManaPillarId, MonsterId, RecipeId, ResearchSlotId, SchoolId, ScreenId, SpellId } from '../game/types'
import { clamp } from '../game/utils'
import { resetDebugState, sanitizeDebugNumber } from './actions/debugActions'
import { addItemAction, destroyItemAction, removeItemAction, sellItemAction, toggleItemProtectionAction } from './actions/inventoryActions'
import { equipItemAction, unequipItemAction } from './actions/equipmentActions'
import { donateGuildRequestAction, claimGuildRewardAction, promoteGuildAction } from './actions/guildActions'
import { setSchoolDebugAction, setLevelCapAction, setThreatAction, setBossKillsAction, unlockAllSpellsAction } from './actions/progressionActions'
import { setChannelingEchoesAction, upgradeManaPillarAction, setManaPillarLevelAction, setChannelingManaGeneratedAction, setChannelingSustainAction, setChannelingDiscoveryAction } from './actions/channelingActions'
import { canReserveFocusAction, setFocusImprovementLevelAction, upgradeFocusCapacityAction } from './actions/focusActions'
import { assignResearchEchoAction, clearPreparedResearchAction, clearResearchEchoesAction, prepareResearchAction, removePreparedResearchAction, removeResearchEchoAction, setResearchEchoesAction } from './actions/researchActions'
import { assignTransmutationEchoAction, clearTransmutationAssignmentsAction, removeTransmutationEchoAction, setTransmutationEchoCapacityOverrideAction, setTransmutationEchoesAction } from './actions/transmutationActions'
import { forceCompleteTransmutationCycle } from '../game/systems/transmutation/transmutationEngine'
import { RECIPES } from '../game/content/recipes/recipes'
import { saveGameAction } from './actions/persistenceActions'
import { advanceGameState } from '../game/systems/simulation/advanceGameState'
import { forceCompleteResearchCycle } from '../game/systems/research/researchEngine'
import { advanceWithOfflineBank as runOfflineBankAdvance, isOfflineBankSimulationActive, type OfflineBankResult } from '../game/systems/offline-bank/offlineBankSimulation'
import type { OfflineBankReport } from '../game/systems/offline-bank/offlineBankReport'

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
  enterDungeon: () => void
  leaveDungeon: () => void
  engageBoss: (bossId: 'grove-sentinel' | 'forest-heart') => void
  toggleAutoHunt: () => void
  killCurrentEnemy: () => void
  spawnDebugEnemy: (enemyId: MonsterId) => void
  setEnemyHealthPercent: (percent: number) => void
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
  donateGuildRequest: (requestId: string, amount: number | 'max') => void
  claimGuildReward: (requestId: string) => void
  promoteGuild: () => void
  setGuildReputation: (amount: number) => void
  setBossKills: (bossId: 'grove-sentinel' | 'forest-heart', amount: number) => void
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

const spellUnlocked = (state: GameState, spellId: SpellId) => state.progress.unlockedSpells.includes(spellId)
const canReserveFocus = canReserveFocusAction

export const useGameStore = create<GameStore>()(immer((set, get) => ({
  ...createInitialState(),
  recentAcquisitions: [],
  lastOfflineBankReport: null,
  tick: (deltaMs) => set((state) => {
    if (isOfflineBankSimulationActive()) return state
    return advanceGameState(state, deltaMs, { mode: 'live', onItemAcquired: (itemId, amount) => recordRecentAcquisition(state, itemId, amount) })
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
  grantTransmutationIngredients: (recipeId) => set((state) => { const recipe = RECIPES[recipeId]; recipe.ingredients.forEach((ingredient) => { state.inventory[ingredient.itemId] = (state.inventory[ingredient.itemId] ?? 0) + ingredient.quantity }); return state }),
  setDebugTransmutationEchoCapacity: (amount) => set((state) => { setTransmutationEchoCapacityOverrideAction(state, amount); return state }),
  castSpell: (spellId) => set((state) => { castSpellAction(state, spellId); return state }),
  toggleAutoCast: (spellId) => set((state) => { if (!spellUnlocked(state, spellId)) return state; if (state.activities.autoCast[spellId]) state.activities.autoCast[spellId] = false; else if (canReserveFocus(state, SPELLS[spellId].autoCastFocus)) { state.activities.autoCast[spellId] = true; pushNotification(state, `${SPELLS[spellId].name} Auto-Cast enabled`, 'success') } else pushNotification(state, `Cannot enable Auto-Cast · Requires ${SPELLS[spellId].autoCastFocus} Focus · Free Focus: ${selectFreeFocus(state)}`, 'warning'); return state }),
  enterDungeon: () => set((state) => { if (state.combat.active) return state; state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; state.combat.encounterTimerMs = 0; state.player.health = Math.max(1, state.player.health); spawnNextEnemy(state); pushNotification(state, 'Whispering Woods entered', 'info'); return state }),
  leaveDungeon: () => set((state) => { state.combat = { ...createInitialState().combat, log: ['Left the dungeon. Threat Cleared resets.'] }; return state }),
  engageBoss: (bossId) => set((state) => { if (!state.combat.active) { pushNotification(state, 'Enter Whispering Woods first', 'warning'); return state } if (bossId === 'grove-sentinel' && state.combat.threatCleared < DUNGEONS['whispering-woods'].threatRequired) { pushNotification(state, `Grove Sentinel requires ${DUNGEONS['whispering-woods'].threatRequired} Threat Cleared`, 'warning'); return state } if (bossId === 'forest-heart' && !state.progress.forestHeartUnlocked) { pushNotification(state, 'Defeat Grove Sentinel to reveal Forest Heart', 'warning'); return state } spawnEnemy(state, bossId, true); pushNotification(state, `${MONSTERS[bossId].name} engaged`, 'warning'); return state }),
  toggleAutoHunt: () => set((state) => { const unlocked = state.progress.autoHuntBossUnlocked || (state.progress.bossKillsByBoss['grove-sentinel'] ?? 0) > 0 || state.progress.firstBossKill; if (!unlocked) { pushNotification(state, 'Auto Hunt unlocks after the first Grove Sentinel kill', 'warning'); return state } state.progress.autoHuntBossUnlocked = true; state.progress.autoHuntBossByDungeon['whispering-woods'] = !state.progress.autoHuntBossByDungeon['whispering-woods']; return state }),
  killCurrentEnemy: () => set((state) => { if (state.combat.enemyId) { state.combat.enemyHp = 0; finishEnemy(state) } return state }),
  spawnDebugEnemy: (enemyId) => set((state) => { if (!state.combat.active) { state.combat.active = true; state.combat.dungeonId = 'whispering-woods' } spawnEnemy(state, enemyId, enemyId === 'grove-sentinel' || enemyId === 'forest-heart'); pushNotification(state, `${MONSTERS[enemyId].name} spawned by Developer Tools`, 'warning'); return state }),
  setEnemyHealthPercent: (percent) => set((state) => { if (state.combat.enemyId) state.combat.enemyHp = Math.max(0, Math.min(state.combat.enemyMaxHp, state.combat.enemyMaxHp * clamp(percent, 0, 100) / 100)); return state }),
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
    set((state) => { Object.assign(state, loaded.state as GameState); state.recentAcquisitions = []; state.lastOfflineBankReport = null; recalculateDerivedStats(state); return state })
  },
  resetSave: () => {
    const fresh = createInitialState()
    set((state) => { Object.assign(state, fresh); state.recentAcquisitions = []; state.lastOfflineBankReport = null; return state })
    const activeProfileId = getActiveProfileId()
    if (activeProfileId) {
      const saved = saveProfileGame(activeProfileId, useGameStore.getState())
      if (saved.ok) updateProfileMetadata(activeProfileId, { lastSavedAt: fresh.lastSavedAt })
    }
  },
  hydrateState: (nextState) => set((state) => { Object.assign(state, nextState); state.recentAcquisitions = []; state.lastOfflineBankReport = null; recalculateDerivedStats(state); return state }),
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
  donateGuildRequest: (requestId, amount) => set((state) => { donateGuildRequestAction(state, requestId, amount); return state }),
  claimGuildReward: (requestId) => set((state) => { claimGuildRewardAction(state, requestId); return state }),
  promoteGuild: () => set((state) => { promoteGuildAction(state); return state }),
  setGuildReputation: (amount) => set((state) => { state.progress.guildReputation = Math.max(0, amount); return state }),
  setBossKills: (bossId, amount) => set((state) => { setBossKillsAction(state, bossId, amount); return state }),
  preset: (name) => set((state) => { Object.assign(state, createInitialState()); state.lastOfflineBankReport = null; if (name === 'research') { (['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment'] as const).forEach((itemId) => { state.inventory[itemId] = 100 }); state.player.mana = 100; (['fire', 'water', 'earth', 'air'] as const).forEach((schoolId, index) => { prepareResearchAction(state, `${schoolId}-fragment` as ItemId, schoolId, 50); setResearchEchoesAction(state, `research-${index + 1}` as ResearchSlotId, index === 0 ? 2 : 1) }) } if (name === 'combat') { state.inventory['fire-fragment'] = 10; state.progress.unlockedSpells = ['fire-bolt']; state.schools.fire = { xp: 20, level: 2 }; state.player.mana = 100; state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; spawnNextEnemy(state) } if (name === 'boss') { state.inventory['fire-fragment'] = 15; state.inventory['wisp-essence'] = 10; state.inventory['grove-bark'] = 2; state.progress.unlockedSpells = ['fire-bolt']; state.schools.fire = { xp: 80, level: 4 }; state.progress.guildUnlocked = true; state.progress.firstBossKill = true; state.progress.emberStaffUnlocked = true; state.progress.forestHeartUnlocked = true; state.progress.autoHuntBossUnlocked = true; state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; state.combat.threatCleared = 20; spawnNextEnemy(state) } if (name === 'guild') { state.progress.guildUnlocked = true; state.progress.guildRank = 'initiate'; state.progress.firstBossKill = true; state.progress.emberStaffUnlocked = true; state.progress.forestHeartUnlocked = true; state.progress.autoHuntBossUnlocked = true; state.inventory['fire-fragment'] = 20; state.progress.lifetimeKills = 30; state.progress.requestProgress['clear-the-woods'] = 30; state.progress.bossKillsByBoss['grove-sentinel'] = 2; state.progress.requestProgress['sentinel-breaker'] = 2; state.progress.guildReputation = 100 } if (name === 'main-boss' || name === 'chapter-complete') { state.inventory['fire-fragment'] = 20; state.inventory['wisp-essence'] = 12; state.inventory['grove-bark'] = 4; state.progress.guildUnlocked = true; state.progress.guildRank = 'apprentice'; state.progress.firstBossKill = true; state.progress.emberStaffUnlocked = true; state.progress.forestHeartUnlocked = true; state.progress.autoHuntBossUnlocked = true; state.progress.permanentFocusBonuses['forest-heart'] = 10; state.progress.permanentFocusBonuses['guild-apprentice'] = 10; state.progress.magicLevelCap = 20; state.schools.fire = { xp: 380, level: 20 }; state.progress.firstMainBossKill = true; state.inventory.heartseed = 1; recalculateDerivedStats(state); state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; spawnEnemy(state, 'forest-heart', true) } return state }),
  resumeFromHidden: (elapsedMs, notify = true) => set((state) => { if (elapsedMs > 1000) { state.offlineBankMs += elapsedMs; if (notify) pushNotification(state, `${Math.round(elapsedMs / 1000)}s added to Offline Bank`, 'info') } return state }),
  advanceWithOfflineBank: async (durationMs) => {
    const result = await runOfflineBankAdvance(durationMs, get, (recipe) => set((state) => { recipe(state); return state }), () => { get().saveGame('autosave') }, (state, itemId, amount) => recordRecentAcquisition(state as GameStore, itemId, amount))
    if (result.ok) set((state) => { state.lastOfflineBankReport = result.report ?? null; return state })
    return result
  },
})))

// Presets replace gameplay state for developer testing; recent acquisition UI state is session-only too.
const presetGameplayState = useGameStore.getState().preset
useGameStore.setState({ preset: (name) => { presetGameplayState(name); useGameStore.setState({ recentAcquisitions: [] }) } })

export const useGameStoreSelectors = { selectUsedFocus, selectFreeFocus }
export { selectUsedFocus, selectFreeFocus }
export const selectManaRegen = (state: GameStore) => manaRegenPerSecond(state)
export const makeInitialState = createInitialState
