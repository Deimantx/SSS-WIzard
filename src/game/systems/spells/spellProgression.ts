import { SPELLS } from '../../content/spells/spells'
import type { GameState, SchoolId, SpellId } from '../../types'

export const MIN_SPELL_RANK = 1
export const MAX_SPELL_RANK = 8

export type SpellRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

const RANK_LABELS: Record<SpellRank, string> = { 1: 'Rank I', 2: 'Rank II', 3: 'Rank III', 4: 'Rank IV', 5: 'Rank V', 6: 'Rank VI', 7: 'Rank VII', 8: 'Rank VIII' }
const SCHOOL_ORDER: readonly SchoolId[] = ['fire', 'water', 'earth', 'air']

const isSpellRank = (value: unknown): value is SpellRank => typeof value === 'number' && Number.isInteger(value) && value >= MIN_SPELL_RANK && value <= MAX_SPELL_RANK

export function getSpellRank(state: Pick<GameState, 'progress'>, spellId: SpellId): SpellRank | null {
  const rank = state.progress.spellRanks[spellId]
  return isSpellRank(rank) ? rank : null
}

export function isSpellUnlocked(state: Pick<GameState, 'progress'>, spellId: SpellId): boolean {
  return getSpellRank(state, spellId) !== null
}

export function getAutoCastFocusCostForRank(rank: SpellRank): number {
  return rank * 10
}

export function getSpellAutoCastFocusCost(state: Pick<GameState, 'progress'>, spellId: SpellId): number | null {
  const rank = getSpellRank(state, spellId)
  return rank === null ? null : getAutoCastFocusCostForRank(rank)
}

export function formatSpellRank(rank: SpellRank): string {
  return RANK_LABELS[rank]
}

export function getSpellsForSchool(schoolId: SchoolId) {
  return Object.values(SPELLS)
    .filter((spell) => spell.school === schoolId)
    .sort((left, right) => left.unlockLevel - right.unlockLevel || left.id.localeCompare(right.id))
}

export function getAllSpellsInOrder() {
  return SCHOOL_ORDER.flatMap((schoolId) => getSpellsForSchool(schoolId))
}

/** Grants only authored level-based Rank-I spells; future Rank upgrades belong elsewhere. */
export function syncSpellUnlocksForSchool(state: GameState, schoolId: SchoolId): SpellId[] {
  const level = state.schools[schoolId]?.level ?? 1
  const newlyUnlocked: SpellId[] = []
  getSpellsForSchool(schoolId).forEach((spell) => {
    if (level < spell.unlockLevel || getSpellRank(state, spell.id) !== null) return
    state.progress.spellRanks[spell.id] = 1
    newlyUnlocked.push(spell.id)
  })
  return newlyUnlocked
}

export function syncAllSpellUnlocks(state: GameState): SpellId[] {
  return SCHOOL_ORDER.flatMap((schoolId) => syncSpellUnlocksForSchool(state, schoolId))
}

export { SCHOOL_ORDER }
