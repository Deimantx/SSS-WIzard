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
import type { ChannelingDiscoveryId, DungeonId, EquipmentSlot, GameState, ItemId, ManaPillarId, MonsterId, SchoolId, ScreenId, SpellId } from '../game/types'
import { clamp } from '../game/utils'
import { resetDebugState, sanitizeDebugNumber } from './actions/debugActions'
import { addItemAction, removeItemAction, toggleItemProtectionAction } from './actions/inventoryActions'
import { equipItemAction, unequipItemAction } from './actions/equipmentActions'
import { donateGuildRequestAction, claimGuildRewardAction, promoteGuildAction } from './actions/guildActions'
import { setSchoolDebugAction, setLevelCapAction, setThreatAction, setBossKillsAction, unlockAllSpellsAction } from './actions/progressionActions'
import { setChannelingEchoesAction, upgradeManaPillarAction, setManaPillarLevelAction, setChannelingManaGeneratedAction, setChannelingSustainAction, setChannelingDiscoveryAction } from './actions/channelingActions'
import { canReserveFocusAction } from './actions/focusActions'
import { toggleCondensationAction } from './actions/condensationActions'
import { setResearchConfigAction, toggleResearchAction } from './actions/researchActions'
import { toggleTransmutationAction } from './actions/transmutationActions'
import { saveGameAction } from './actions/persistenceActions'
import { advanceGameState } from '../game/systems/simulation/advanceGameState'
import { advanceWithOfflineBank as runOfflineBankAdvance, isOfflineBankSimulationActive } from '../game/systems/offline-bank/offlineBankSimulation'

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
  toggleCondense: (element?: SchoolId) => void
  setResearchConfig: (itemId: ItemId, targetSchoolId: SchoolId, quantity: number) => void
  toggleResearch: (itemId?: ItemId, targetSchoolId?: SchoolId, quantity?: number) => void
  toggleTransmutation: (recipeId?: string) => void
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
  equipItem: (itemId: ItemId) => void
  unequipItem: (slot: EquipmentSlot) => void
  unlockAllSpells: () => void
  donateGuildRequest: (requestId: string, amount: number | 'max') => void
  claimGuildReward: (requestId: string) => void
  promoteGuild: () => void
  setGuildReputation: (amount: number) => void
  setBossKills: (bossId: 'grove-sentinel' | 'forest-heart', amount: number) => void
  preset: (name: 'fresh' | 'research' | 'combat' | 'boss' | 'guild' | 'main-boss' | 'chapter-complete') => void
  resumeFromHidden: (elapsedMs: number, notify?: boolean) => void
  advanceWithOfflineBank: (durationMs: number) => Promise<{ ok: boolean; error?: string }>
}

export type GameStore = GameState & GameActions

export interface SaveResult { ok: boolean; error: string | null }

const spellUnlocked = (state: GameState, spellId: SpellId) => state.progress.unlockedSpells.includes(spellId)
const canReserveFocus = canReserveFocusAction

export const useGameStore = create<GameStore>()(immer((set, get) => ({
  ...createInitialState(),
  tick: (deltaMs) => set((state) => {
    if (isOfflineBankSimulationActive()) return state
    return advanceGameState(state, deltaMs, { mode: 'live' })
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
  toggleCondense: (element = get().activities.condense.element) => set((state) => { toggleCondensationAction(state, element); return state }),
  setResearchConfig: (itemId, targetSchoolId, quantity) => set((state) => { setResearchConfigAction(state, itemId, targetSchoolId, quantity); return state }),
  toggleResearch: (itemId, targetSchoolId, quantity = 1) => set((state) => { toggleResearchAction(state, itemId, targetSchoolId, quantity); return state }),
  toggleTransmutation: (recipeId = get().activities.transmutation.recipeId ?? 'ember-staff') => set((state) => { toggleTransmutationAction(state, recipeId); return state }),
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
    set((state) => { Object.assign(state, loaded.state as GameState); recalculateDerivedStats(state); return state })
  },
  resetSave: () => {
    const fresh = createInitialState()
    set((state) => { Object.assign(state, fresh); return state })
    const activeProfileId = getActiveProfileId()
    if (activeProfileId) {
      const saved = saveProfileGame(activeProfileId, useGameStore.getState())
      if (saved.ok) updateProfileMetadata(activeProfileId, { lastSavedAt: fresh.lastSavedAt })
    }
  },
  hydrateState: (nextState) => set((state) => { Object.assign(state, nextState); recalculateDerivedStats(state); return state }),
  dismissNotification: (id) => set((state) => { state.notifications = state.notifications.filter((note) => note.id !== id); return state }),
  setPlayer: (changes) => set((state) => { state.player = { ...state.player, ...changes }; recalculateDerivedStats(state); return state }),
  addMana: (amount) => set((state) => { state.player.mana = Math.max(0, state.player.mana + sanitizeDebugNumber(amount)); recalculateDerivedStats(state); return state }),
  setSchoolDebug: (school, xp, level) => set((state) => { setSchoolDebugAction(state, school, xp, level); return state }),
  setLevelCap: (cap) => set((state) => { setLevelCapAction(state, cap); return state }),
  setThreat: (amount) => set((state) => { setThreatAction(state, amount); return state }),
  addItem: (itemId, quantity) => set((state) => { addItemAction(state, itemId, quantity); return state }),
  removeItem: (itemId, quantity) => set((state) => { removeItemAction(state, itemId, quantity); return state }),
  toggleItemProtection: (itemId) => set((state) => { toggleItemProtectionAction(state, itemId); return state }),
  equipItem: (itemId) => set((state) => { equipItemAction(state, itemId); return state }),
  unequipItem: (slot) => set((state) => { unequipItemAction(state, slot); return state }),
  unlockAllSpells: () => set((state) => { unlockAllSpellsAction(state); return state }),
  donateGuildRequest: (requestId, amount) => set((state) => { donateGuildRequestAction(state, requestId, amount); return state }),
  claimGuildReward: (requestId) => set((state) => { claimGuildRewardAction(state, requestId); return state }),
  promoteGuild: () => set((state) => { promoteGuildAction(state); return state }),
  setGuildReputation: (amount) => set((state) => { state.progress.guildReputation = Math.max(0, amount); return state }),
  setBossKills: (bossId, amount) => set((state) => { setBossKillsAction(state, bossId, amount); return state }),
  preset: (name) => set((state) => { Object.assign(state, createInitialState()); if (name === 'research') { state.inventory['fire-fragment'] = 10; state.player.mana = 100; state.activities.channeling.echoesAssigned = 1 } if (name === 'combat') { state.inventory['fire-fragment'] = 10; state.progress.unlockedSpells = ['fire-bolt']; state.schools.fire = { xp: 20, level: 2 }; state.player.mana = 100; state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; spawnNextEnemy(state) } if (name === 'boss') { state.inventory['fire-fragment'] = 15; state.inventory['wisp-essence'] = 10; state.inventory['grove-bark'] = 2; state.progress.unlockedSpells = ['fire-bolt']; state.schools.fire = { xp: 80, level: 4 }; state.progress.guildUnlocked = true; state.progress.firstBossKill = true; state.progress.emberStaffUnlocked = true; state.progress.forestHeartUnlocked = true; state.progress.autoHuntBossUnlocked = true; state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; state.combat.threatCleared = 20; spawnNextEnemy(state) } if (name === 'guild') { state.progress.guildUnlocked = true; state.progress.guildRank = 'initiate'; state.progress.firstBossKill = true; state.progress.emberStaffUnlocked = true; state.progress.forestHeartUnlocked = true; state.progress.autoHuntBossUnlocked = true; state.inventory['fire-fragment'] = 20; state.progress.lifetimeKills = 30; state.progress.requestProgress['clear-the-woods'] = 30; state.progress.bossKillsByBoss['grove-sentinel'] = 2; state.progress.requestProgress['sentinel-breaker'] = 2; state.progress.guildReputation = 100 } if (name === 'main-boss' || name === 'chapter-complete') { state.inventory['fire-fragment'] = 20; state.inventory['wisp-essence'] = 12; state.inventory['grove-bark'] = 4; state.progress.guildUnlocked = true; state.progress.guildRank = 'apprentice'; state.progress.firstBossKill = true; state.progress.emberStaffUnlocked = true; state.progress.forestHeartUnlocked = true; state.progress.autoHuntBossUnlocked = true; state.progress.permanentFocusBonuses['forest-heart'] = 10; state.progress.permanentFocusBonuses['guild-apprentice'] = 10; state.progress.magicLevelCap = 20; state.schools.fire = { xp: 380, level: 20 }; state.progress.firstMainBossKill = true; state.inventory.heartseed = 1; recalculateDerivedStats(state); state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; spawnEnemy(state, 'forest-heart', true) } return state }),
  resumeFromHidden: (elapsedMs, notify = true) => set((state) => { if (elapsedMs > 1000) { state.offlineBankMs += elapsedMs; if (notify) pushNotification(state, `${Math.round(elapsedMs / 1000)}s added to Offline Bank`, 'info') } return state }),
  advanceWithOfflineBank: (durationMs): Promise<{ ok: boolean; error?: string }> => runOfflineBankAdvance(durationMs, get, (recipe) => set((state) => { recipe(state); return state }), () => { get().saveGame('autosave') }),
})))

export const useGameStoreSelectors = { selectUsedFocus, selectFreeFocus }
export { selectUsedFocus, selectFreeFocus }
export const selectManaRegen = (state: GameStore) => manaRegenPerSecond(state)
export const makeInitialState = createInitialState
