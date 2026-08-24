import { BALANCE, SCHOOL_LEVEL_XP } from './data/balance'
import { ITEMS, MONSTERS, RESEARCH_ITEMS, SCHOOLS, SPELLS } from './data/content'
import type { ElementId, FocusReservation, GameState, ItemId, MonsterId, SchoolId, SpellId } from './types'
import { clamp, uid } from './utils'

export const getSchoolLevel = (xp: number, cap: number) => {
  let level = 1
  for (let next = 2; next <= cap; next += 1) {
    if (xp >= SCHOOL_LEVEL_XP(next - 1)) level = next
    else break
  }
  return Math.min(cap, level)
}

export const focusReservations = (state: Pick<GameState, 'activities' | 'progress'>): FocusReservation[] => {
  const reservations: FocusReservation[] = []
  if (state.activities.autoChannel) reservations.push({ id: 'channeling', sourceType: 'channeling', sourceId: 'mana', amount: BALANCE.mana.autoChannelFocus, label: 'Auto Channeling' })
  if (state.activities.condense.running) reservations.push({ id: 'condense', sourceType: 'condense', sourceId: state.activities.condense.element, amount: BALANCE.condense.focusCost, label: `Condensing ${SCHOOLS[state.activities.condense.element].name}` })
  if (state.activities.research.running) reservations.push({ id: 'research', sourceType: 'research', sourceId: state.activities.research.itemId ?? 'fragment', amount: BALANCE.research.focusCost, label: 'Arcane Research' })
  if (state.activities.transmutation.running) reservations.push({ id: 'transmutation', sourceType: 'transmutation', sourceId: state.activities.transmutation.recipeId ?? 'recipe', amount: BALANCE.transmutation.focusCost, label: 'Transmutation' })
  Object.entries(state.activities.autoCast).forEach(([spellId, active]) => {
    if (active && state.progress.unlockedSpells.includes(spellId as SpellId)) reservations.push({ id: `autocast-${spellId}`, sourceType: 'autocast', sourceId: spellId, amount: 15, label: `${SPELLS[spellId as SpellId].name} Auto-Cast` })
  })
  return reservations
}

export const usedFocus = (state: Pick<GameState, 'activities' | 'progress'>) => focusReservations(state).reduce((sum, reservation) => sum + reservation.amount, 0)
export const freeFocus = (state: Pick<GameState, 'activities' | 'progress' | 'player'>) => Math.max(0, state.player.maxFocus - usedFocus(state))

export const manaRegenPerSecond = (state: Pick<GameState, 'activities'>) => BALANCE.mana.passiveRegenPerSecond + (state.activities.autoChannel ? BALANCE.mana.autoChannelManaPerSecond : 0)
export const schoolProgress = (state: GameState, school: SchoolId) => {
  const current = state.schools[school]
  const previous = SCHOOL_LEVEL_XP(Math.max(1, current.level - 1))
  const next = SCHOOL_LEVEL_XP(current.level)
  return current.level >= state.progress.magicLevelCap ? 1 : clamp((current.xp - previous) / Math.max(1, next - previous), 0, 1)
}

export const playerBasicDamage = (state: Pick<GameState, 'equipment'>) => BALANCE.player.basicAttackDamage + (state.equipment.weapon === 'ember-staff' ? 4 : 0)

export const canReserveFocus = (state: Pick<GameState, 'activities' | 'progress' | 'player'>, amount: number) => freeFocus(state) >= amount

export const grantSchoolXp = (state: GameState, school: SchoolId, amount: number) => {
  const before = state.schools[school].level
  const cap = state.progress.magicLevelCap
  const capXp = SCHOOL_LEVEL_XP(cap)
  state.schools[school].xp = Math.min(capXp, state.schools[school].xp + amount)
  state.schools[school].level = getSchoolLevel(state.schools[school].xp, cap)
  return { before, after: state.schools[school].level }
}

export const completeResearchCycle = (state: GameState, itemId: ItemId) => {
  const research = RESEARCH_ITEMS.find((item) => item.itemId === itemId)
  if (!research) return { completed: false, reason: 'unknown' as const }
  const school = state.schools[research.school]
  if (school.level >= state.progress.magicLevelCap) return { completed: false, reason: 'cap' as const }
  const count = state.inventory[itemId] ?? 0
  if (count < 1) return { completed: false, reason: 'missing' as const }
  state.inventory[itemId] = count - 1
  const levels = grantSchoolXp(state, research.school, research.xp)
  const spellForLevel: Partial<Record<SchoolId, SpellId>> = { fire: 'fire-bolt', water: 'water-ward', earth: 'earth-spike', air: 'air-lance' }
  if (levels.after >= 2 && levels.before < 2) {
    const spell = spellForLevel[research.school]
    if (spell && !state.progress.unlockedSpells.includes(spell)) state.progress.unlockedSpells.push(spell)
  }
  return { completed: true, reason: 'complete' as const, school: research.school, levels }
}

export const rollLoot = (state: GameState, monsterId: MonsterId) => {
  const monster = MONSTERS[monsterId]
  const drops: string[] = []
  monster.loot.forEach((drop) => {
    if (Math.random() <= drop.chance) {
      const amount = Math.floor(drop.min + Math.random() * (drop.max - drop.min + 1))
      state.inventory[drop.itemId] = (state.inventory[drop.itemId] ?? 0) + amount
      drops.push(`${amount} ${ITEMS[drop.itemId].name}`)
    }
  })
  return drops
}

export const appendLog = (state: GameState, message: string) => {
  state.combat.log = [message, ...state.combat.log].slice(0, 40)
}

export const pushNotification = (state: GameState, text: string, tone: 'info' | 'success' | 'warning' = 'info') => {
  state.notifications = [...state.notifications, { id: uid(), text, tone }].slice(-5)
}
