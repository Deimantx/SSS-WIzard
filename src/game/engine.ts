import { BALANCE, SCHOOL_LEVEL_XP } from './core/balance/balance'
import { ITEMS, getResearchXp } from './content/items/items'
import { SCHOOLS } from './content/schools/schools'
import { SPELLS } from './content/spells/spells'
import { getManaCapacityBreakdown, manaRegenPerSecond as getChannelingManaRegen } from './engine/channelingEngine'
import type { EquipmentStats, FocusReservation, GameState, ItemId, SchoolId, SpellId } from './types'
import { RECIPES, RECIPE_ORDER } from './content/recipes/recipes'
import { clamp, uid } from './utils'
import { RESEARCH_SLOT_ORDER } from './systems/research/researchReservations'
import { getSchoolLevel as getCentralSchoolLevel, getSchoolProgressInfo } from './systems/schools'
import { getFocusCapacityBreakdown } from './systems/focus/focusCapacity'
import { getSpellAutoCastFocusCost, syncSpellUnlocksForSchool } from './systems/spells'

export const getSchoolLevel = getCentralSchoolLevel

export const equipmentStats = (state: Pick<GameState, 'equipment'>): EquipmentStats => {
  const total: EquipmentStats = {}
  Object.values(state.equipment).forEach((itemId) => {
    if (!itemId || !ITEMS[itemId]) return
    const stats = ITEMS[itemId].stats ?? {}
    Object.entries(stats).forEach(([key, value]) => {
      if (key === 'resistances' && value && typeof value === 'object') {
        const resistances = (total.resistances ?? {}) as NonNullable<EquipmentStats['resistances']>
        Object.entries(value as Record<string, number>).forEach(([damageType, resistance]) => { resistances[damageType as keyof typeof resistances] = (resistances[damageType as keyof typeof resistances] ?? 0) + (resistance ?? 0) })
        total.resistances = resistances
        return
      }
      total[key as keyof EquipmentStats] = ((total[key as keyof EquipmentStats] ?? 0) as number + (value ?? 0)) as never
    })
  })
  return total
}

export const recalculateDerivedStats = (state: GameState) => {
  const stats = equipmentStats(state)
  state.player.maxHealth = state.player.baseMaxHealth + (stats.maxHealth ?? 0)
  state.player.maxMana = getManaCapacityBreakdown(state).total
  state.player.maxFocus = getFocusCapacityBreakdown(state).total
  state.player.health = clamp(state.player.health, 0, state.player.maxHealth)
  state.player.mana = state.debug.allowManaOverCap ? Math.max(0, state.player.mana) : clamp(state.player.mana, 0, state.player.maxMana)
}

export const deriveFocusReservations = (state: Pick<GameState, 'activities' | 'progress'>): FocusReservation[] => {
  const reservations: FocusReservation[] = []
  const echoes = state.activities.channeling.echoesAssigned
  if (echoes > 0) reservations.push({ id: 'channeling-echoes', sourceType: 'channeling', sourceId: 'echoes', amount: echoes * BALANCE.channeling.echoFocusCost, label: 'Arcane Echo Channeling' })
  const research = state.activities.research
  const researchJobs = research.slots
    ? RESEARCH_SLOT_ORDER.map((slotId) => ({ slotId, job: research.slots[slotId] })).filter((entry): entry is { slotId: typeof RESEARCH_SLOT_ORDER[number]; job: NonNullable<typeof entry.job> } => Boolean(entry.job && entry.job.echoesAssigned > 0))
    : research.running && research.itemId && research.targetSchoolId ? [{ slotId: 'research-1' as const, job: { itemId: research.itemId, targetSchoolId: research.targetSchoolId, requestedQuantity: research.requestedQuantity ?? research.remainingQuantity ?? 0, remainingQuantity: research.remainingQuantity ?? 0, progressMs: research.progressMs ?? 0, echoesAssigned: 1, status: 'running' as const } }] : []
  researchJobs.forEach(({ slotId, job }) => reservations.push({ id: `research-${slotId}`, sourceType: 'research', sourceId: slotId, amount: Math.max(0, Math.floor(job.echoesAssigned)) * BALANCE.research.echoFocusCost, label: `Research · ${ITEMS[job.itemId]?.name ?? job.itemId} → ${SCHOOLS[job.targetSchoolId]?.name ?? job.targetSchoolId}` }))
  RECIPE_ORDER.forEach((recipeId) => {
    const echoes = Math.max(0, Math.floor(state.activities.transmutation.jobs[recipeId]?.echoesAssigned ?? 0))
    if (!echoes) return
    reservations.push({ id: `transmutation-${recipeId}`, sourceType: 'transmutation', sourceId: recipeId, amount: echoes * BALANCE.transmutation.echoFocusCost, label: `Transmutation · ${RECIPES[recipeId].name}` })
  })
  Object.entries(state.activities.autoCast).forEach(([spellId, active]) => {
    if (!active) return
    const spell = SPELLS[spellId as SpellId]
    const amount = getSpellAutoCastFocusCost(state, spellId as SpellId)
    if (!spell || amount === null) return
    reservations.push({ id: `autocast-${spellId}`, sourceType: 'autocast', sourceId: spellId, amount, label: `${spell.name} Auto-Cast` })
  })
  return reservations
}

export const selectUsedFocus = (state: Pick<GameState, 'activities' | 'progress'>) => deriveFocusReservations(state).reduce((sum, reservation) => sum + reservation.amount, 0)
export const selectRawFreeFocus = (state: Pick<GameState, 'activities' | 'progress' | 'player'>) => state.player.maxFocus - selectUsedFocus(state)
export const selectFreeFocus = (state: Pick<GameState, 'activities' | 'progress' | 'player'>) => Math.max(0, selectRawFreeFocus(state))
export const usedFocus = selectUsedFocus
export const freeFocus = selectFreeFocus
export const canReserveFocus = (state: Pick<GameState, 'activities' | 'progress' | 'player'>, amount: number) => selectFreeFocus(state) >= amount
export const manaRegenPerSecond = getChannelingManaRegen
export const schoolProgress = (state: GameState, school: SchoolId) => {
  return getSchoolProgressInfo(state, school).progress
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
  const unlockedSpellIds = syncSpellUnlocksForSchool(state, school)
  unlockedSpellIds.forEach((spellId) => pushNotification(state, `${SPELLS[spellId].name} unlocked · Rank I`, 'success'))
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
