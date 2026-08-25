import { BALANCE, SCHOOL_LEVEL_XP } from './data/balance'
import { ITEMS, getResearchXp } from './data/items'
import { SCHOOLS } from './data/schools'
import { SPELLS } from './data/spells'
import { getManaCapacityBreakdown, manaRegenPerSecond as getChannelingManaRegen } from './engine/channelingEngine'
import type { EquipmentStats, FocusReservation, GameState, ItemId, SchoolId, SpellId } from './types'
import { clamp, uid } from './utils'

export const getSchoolLevel = (xp: number, cap: number) => {
  let level = 1
  for (let next = 2; next <= cap; next += 1) {
    if (xp >= SCHOOL_LEVEL_XP(next - 1)) level = next
    else break
  }
  return Math.min(cap, level)
}

export const equipmentStats = (state: Pick<GameState, 'equipment'>): EquipmentStats => {
  const total: EquipmentStats = {}
  Object.values(state.equipment).forEach((itemId) => {
    if (!itemId || !ITEMS[itemId]) return
    const stats = ITEMS[itemId].stats ?? {}
    Object.entries(stats).forEach(([key, value]) => { total[key as keyof EquipmentStats] = (total[key as keyof EquipmentStats] ?? 0) + (value ?? 0) })
  })
  return total
}

export const recalculateDerivedStats = (state: GameState) => {
  const stats = equipmentStats(state)
  const permanentFocus = Object.values(state.progress.permanentFocusBonuses).reduce((sum, value) => sum + value, 0)
  state.player.maxHealth = state.player.baseMaxHealth + (stats.maxHealth ?? 0)
  state.player.maxMana = getManaCapacityBreakdown(state).total
  state.player.maxFocus = state.player.baseMaxFocus + permanentFocus + (stats.maxFocus ?? 0)
  state.player.health = clamp(state.player.health, 0, state.player.maxHealth)
  state.player.mana = clamp(state.player.mana, 0, state.player.maxMana)
}

export const deriveFocusReservations = (state: Pick<GameState, 'activities' | 'progress'>): FocusReservation[] => {
  const reservations: FocusReservation[] = []
  const echoes = state.activities.channeling.echoesAssigned
  if (echoes > 0) reservations.push({ id: 'channeling-echoes', sourceType: 'channeling', sourceId: 'echoes', amount: echoes * BALANCE.channeling.echoFocusCost, label: 'Arcane Echo Channeling' })
  if (state.activities.condense.running) reservations.push({ id: 'condense', sourceType: 'condense', sourceId: state.activities.condense.element, amount: BALANCE.condense.focusCost, label: `Condensing ${SCHOOLS[state.activities.condense.element].name}` })
  const research = state.activities.research
  if (research.running) reservations.push({ id: 'research', sourceType: 'research', sourceId: research.itemId ?? 'fragment', amount: research.focusCost, label: 'Arcane Research' })
  if (state.activities.transmutation.running) reservations.push({ id: 'transmutation', sourceType: 'transmutation', sourceId: state.activities.transmutation.recipeId ?? 'recipe', amount: BALANCE.transmutation.focusCost, label: 'Transmutation' })
  Object.entries(state.activities.autoCast).forEach(([spellId, active]) => {
    if (!active || !state.progress.unlockedSpells.includes(spellId as SpellId)) return
    const spell = SPELLS[spellId as SpellId]
    reservations.push({ id: `autocast-${spellId}`, sourceType: 'autocast', sourceId: spellId, amount: spell.autoCastFocus, label: `${spell.name} Auto-Cast` })
  })
  return reservations
}

export const selectUsedFocus = (state: Pick<GameState, 'activities' | 'progress'>) => deriveFocusReservations(state).reduce((sum, reservation) => sum + reservation.amount, 0)
export const selectFreeFocus = (state: Pick<GameState, 'activities' | 'progress' | 'player'>) => Math.max(0, state.player.maxFocus - selectUsedFocus(state))
export const usedFocus = selectUsedFocus
export const freeFocus = selectFreeFocus
export const canReserveFocus = (state: Pick<GameState, 'activities' | 'progress' | 'player'>, amount: number) => selectFreeFocus(state) >= amount
export const manaRegenPerSecond = getChannelingManaRegen
export const schoolProgress = (state: GameState, school: SchoolId) => {
  const current = state.schools[school]
  if (current.level >= state.progress.magicLevelCap) return 1
  const previous = SCHOOL_LEVEL_XP(Math.max(1, current.level - 1))
  const next = SCHOOL_LEVEL_XP(current.level)
  return clamp((current.xp - previous) / Math.max(1, next - previous), 0, 1)
}
export const playerBasicDamage = (state: Pick<GameState, 'equipment'>) => BALANCE.player.basicAttackDamage + (equipmentStats(state).basicDamage ?? 0)
export const spellDamageMultiplier = (state: Pick<GameState, 'equipment'>, school: SchoolId) => {
  const stats = equipmentStats(state)
  return 1 + (school === 'fire' ? stats.fireSpellDamagePct ?? 0 : school === 'earth' ? stats.earthSpellDamagePct ?? 0 : school === 'air' ? stats.airSpellDamagePct ?? 0 : 0)
}
export const barrierMultiplier = (state: Pick<GameState, 'equipment'>) => 1 + (equipmentStats(state).waterBarrierPct ?? 0)

export const grantSchoolXp = (state: GameState, school: SchoolId, amount: number) => {
  const before = state.schools[school].level
  const cap = state.progress.magicLevelCap
  state.schools[school].xp = Math.min(SCHOOL_LEVEL_XP(cap), state.schools[school].xp + amount)
  state.schools[school].level = getSchoolLevel(state.schools[school].xp, cap)
  return { before, after: state.schools[school].level }
}

export const completeResearchCycle = (state: GameState, itemId: ItemId, targetSchoolId: SchoolId = ITEMS[itemId].researchSchool ?? 'fire') => {
  const item = ITEMS[itemId]
  if (!item || !item.researchSchool) return { completed: false, reason: 'unknown' as const }
  if (state.schools[targetSchoolId].level >= state.progress.magicLevelCap) return { completed: false, reason: 'cap' as const }
  if ((state.inventory[itemId] ?? 0) < 1 || state.protectedItems[itemId]) return { completed: false, reason: 'protected' as const }
  state.inventory[itemId] = (state.inventory[itemId] ?? 0) - 1
  const xp = getResearchXp(itemId, targetSchoolId)
  const levels = grantSchoolXp(state, targetSchoolId, xp)
  const spell = Object.values(SPELLS).find((entry) => entry.school === targetSchoolId && entry.unlockLevel === levels.after)
  if (spell && !state.progress.unlockedSpells.includes(spell.id)) state.progress.unlockedSpells.push(spell.id)
  return { completed: true, reason: 'complete' as const, xp, levels, spellId: spell?.id }
}

export const pushNotification = (state: GameState, text: string, tone: 'info' | 'success' | 'warning' = 'info') => { if (state.notifications.some((notification) => notification.text === text && notification.tone === tone)) return; state.notifications = [...state.notifications, { id: uid(), text, tone }].slice(-5) }
export const appendLog = (state: GameState, message: string) => { state.combat.log = [message, ...state.combat.log].slice(0, 50) }
export const focusReservations = deriveFocusReservations
