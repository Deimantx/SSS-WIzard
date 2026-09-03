import { SPELLS } from '../../game/content/spells/spells'
import { SCHOOL_MAX_LEVEL, getSchoolLevelFromXp, getSchoolTotalXpForLevel } from '../../game/core/balance/schoolXpCurve'
import { syncAllSpellUnlocks, syncSpellUnlocksForSchool } from '../../game/systems/spells'
import type { GameState, MonsterId, SchoolId, SpellId } from '../../game/types'

export const unlockAllSpellsAction = (state: GameState) => {
  Object.keys(SPELLS).forEach((id) => { state.progress.spellRanks[id as SpellId] = 1 })
  const cap = getCurrentSchoolCap(state)
  Object.keys(state.schools).forEach((id) => {
    const school = id as SchoolId
    const targetLevel = Math.min(cap, 16)
    const currentXp = finiteXp(state.schools[school].xp)
    const nextXp = Math.min(getSchoolTotalXpForLevel(cap), Math.max(getSchoolTotalXpForLevel(targetLevel), currentXp))
    state.schools[school].xp = nextXp
    state.schools[school].level = getSchoolLevelFromXp(nextXp, cap)
  })
  syncAllSpellUnlocks(state)
}
const getCurrentSchoolCap = (state: GameState) => Math.min(SCHOOL_MAX_LEVEL, Math.max(1, Number.isFinite(state.progress.magicLevelCap) ? Math.floor(state.progress.magicLevelCap) : 1))
const finiteXp = (xp: number) => Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0

/** Explicit debug operation: set total XP and derive the matching level. */
export const setSchoolXpDebugAction = (state: GameState, school: SchoolId, xp: number) => {
  const cap = getCurrentSchoolCap(state)
  const nextXp = Math.min(getSchoolTotalXpForLevel(cap), finiteXp(xp))
  state.schools[school].xp = nextXp
  state.schools[school].level = getSchoolLevelFromXp(nextXp, cap)
  syncSpellUnlocksForSchool(state, school)
}

/** Explicit debug operation: set a level and place XP at that level's start. */
export const setSchoolLevelDebugAction = (state: GameState, school: SchoolId, level: number) => {
  const cap = getCurrentSchoolCap(state)
  const nextLevel = Math.min(cap, Math.max(1, Number.isFinite(level) ? Math.floor(level) : 1))
  state.schools[school].level = nextLevel
  state.schools[school].xp = getSchoolTotalXpForLevel(nextLevel)
  syncSpellUnlocksForSchool(state, school)
}

/** Legacy-shaped entry point with explicit semantics: level wins when supplied; otherwise XP is derived. */
export const setSchoolDebugAction = (state: GameState, school: SchoolId, xp: number, level?: number) => {
  if (level !== undefined) setSchoolLevelDebugAction(state, school, level)
  else setSchoolXpDebugAction(state, school, xp)
}
export const debugUnlockSpellRankOneAction = (state: GameState, spellId: SpellId) => {
  if (!SPELLS[spellId]) return false
  state.progress.spellRanks[spellId] = 1
  return true
}
export const debugLockSpellAction = (state: GameState, spellId: SpellId) => {
  if (!SPELLS[spellId]) return false
  delete state.progress.spellRanks[spellId]
  state.activities.autoCast[spellId] = false
  state.combat.autoCastManaStarvedSpells = state.combat.autoCastManaStarvedSpells.filter((id) => id !== spellId)
  state.combat.spellCooldowns[spellId] = 0
  return true
}
export const resetSpellCooldownsAction = (state: GameState) => {
  Object.keys(state.combat.spellCooldowns).forEach((spellId) => { state.combat.spellCooldowns[spellId as SpellId] = 0 })
}
export const setLevelCapAction = (state: GameState, cap: number) => {
  const nextCap = Math.min(SCHOOL_MAX_LEVEL, Math.max(1, Number.isFinite(cap) ? Math.floor(cap) : 1))
  state.progress.magicLevelCap = nextCap
  Object.keys(state.schools).forEach((id) => {
    const school = id as SchoolId
    state.schools[school].xp = Math.min(getSchoolTotalXpForLevel(nextCap), finiteXp(state.schools[school].xp))
    state.schools[school].level = getSchoolLevelFromXp(state.schools[school].xp, nextCap)
  })
  syncAllSpellUnlocks(state)
}
export const setThreatAction = (state: GameState, amount: number) => { state.combat.threatCleared = Math.max(0, amount) }
export const setBossKillsAction = (state: GameState, bossId: MonsterId, amount: number) => {
  state.progress.bossKillsByBoss[bossId] = Math.max(0, amount)
  if (bossId === 'grove-sentinel') state.progress.requestProgress['sentinel-breaker'] = Math.max(state.progress.requestProgress['sentinel-breaker'] ?? 0, state.progress.bossKillsByBoss[bossId])
}
