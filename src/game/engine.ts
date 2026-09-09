import { BALANCE } from './core/balance/balance'
import { SCHOOL_MAX_LEVEL, getSchoolTotalXpForLevel } from './core/balance/schoolXpCurve'
import { ITEMS, getResearchXp } from './content/items/items'
import { getManaCapacityBreakdown, manaRegenPerSecond as getChannelingManaRegen } from './engine/channelingEngine'
import type { GameState, ItemId, SchoolId } from './types'
import { clamp, uid } from './utils'
import { getSchoolLevel as getCentralSchoolLevel, getSchoolProgressInfo } from './systems/schools'
import { getFocusCapacityBreakdown } from './systems/focus/focusCapacity'
import { syncSpellUnlocksForSchool } from './systems/spells/spellProgression'
import { getEquipmentStats } from './core/equipment/equipmentStats'
import { deriveFocusReservations } from './systems/focus/focusReservations'
export { canReserveFocus, deriveFocusReservations, selectFreeFocus, selectRawFreeFocus, selectUsedFocus, usedFocus, freeFocus } from './systems/focus/focusReservations'
export { getSpellPower, getSpellPowerBreakdown } from './systems/spells/spellPower'

export const getSchoolLevel = getCentralSchoolLevel

export const equipmentStats = getEquipmentStats

export const recalculateDerivedStats = (state: GameState) => {
  const stats = equipmentStats(state)
  state.player.maxHealth = state.player.baseMaxHealth + (stats.maxHealth ?? 0)
  state.player.maxMana = getManaCapacityBreakdown(state).total
  state.player.maxFocus = getFocusCapacityBreakdown(state).total
  state.player.health = clamp(state.player.health, 0, state.player.maxHealth)
  state.player.mana = state.debug.allowManaOverCap ? Math.max(0, state.player.mana) : clamp(state.player.mana, 0, state.player.maxMana)
}

export const manaRegenPerSecond = getChannelingManaRegen
export const schoolProgress = (state: GameState, school: SchoolId) => {
  return getSchoolProgressInfo(state, school).progress
}
export const playerBasicDamage = (state: Pick<GameState, 'equipment' | 'artifactProgress'>) => BALANCE.player.basicAttackDamage + (equipmentStats(state).basicDamage ?? 0)

export const grantSchoolXp = (state: GameState, school: SchoolId, amount: number) => {
  const before = state.schools[school].level
  const cap = Math.min(SCHOOL_MAX_LEVEL, Math.max(1, Number.isFinite(state.progress.magicLevelCap) ? Math.floor(state.progress.magicLevelCap) : 1))
  const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0
  const currentXp = Number.isFinite(state.schools[school].xp) ? Math.max(0, state.schools[school].xp) : 0
  state.schools[school].xp = Math.min(getSchoolTotalXpForLevel(cap), currentXp + safeAmount)
  state.schools[school].level = getSchoolLevel(state.schools[school].xp, cap)
  const unlockedSpellIds = syncSpellUnlocksForSchool(state, school)
  return { before, after: state.schools[school].level, unlockedSpellIds }
}

export const completeResearchCycle = (state: GameState, itemId: ItemId, targetSchoolId: SchoolId = ITEMS[itemId].researchSchool ?? 'fire') => {
  const item = ITEMS[itemId]
  if (!item || !item.researchSchool) return { completed: false, reason: 'unknown' as const }
  if (state.schools[targetSchoolId].level >= state.progress.magicLevelCap) return { completed: false, reason: 'cap' as const }
  if (state.protectedItems[itemId] || Object.values(state.equipment).includes(itemId)) return { completed: false, reason: 'protected' as const }
  const equippedCopies = Object.values(state.equipment).filter((equipped) => equipped === itemId).length
  if ((state.inventory[itemId] ?? 0) <= equippedCopies) return { completed: false, reason: 'missing' as const }
  state.inventory[itemId] = (state.inventory[itemId] ?? 0) - 1
  const xp = getResearchXp(itemId, targetSchoolId)
  const levels = grantSchoolXp(state, targetSchoolId, xp)
  return { completed: true, reason: 'complete' as const, xp, levels, spellId: levels.unlockedSpellIds[0] }
}

export interface NotificationOptions { key?: string; cooldownMs?: number }

export const pushNotification = (state: GameState, text: string, tone: 'info' | 'success' | 'warning' = 'info', options: NotificationOptions = {}) => {
  const now = Date.now()
  const cooldownMs = Math.max(0, options.cooldownMs ?? 0)
  if (state.notifications.some((notification) => notification.text === text && notification.tone === tone)) return
  if (options.key && state.notifications.some((notification) => notification.key === options.key && (cooldownMs === 0 || !notification.createdAt || now - notification.createdAt < cooldownMs))) return
  state.notifications = [...state.notifications, { id: uid(), text, tone, key: options.key, createdAt: now }].slice(-3)
}
export const appendLog = (state: GameState, message: string) => { state.combat.log = [message, ...state.combat.log].slice(0, 50) }
export const focusReservations = deriveFocusReservations
