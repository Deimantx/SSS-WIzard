import { SPELLS } from '../../game/content/spells/spells'
import { getSchoolLevelStartXp } from '../../game/systems/schools'
import { syncAllSpellUnlocks, syncSpellUnlocksForSchool } from '../../game/systems/spells'
import type { GameState, MonsterId, SchoolId, SpellId } from '../../game/types'

export const unlockAllSpellsAction = (state: GameState) => {
  Object.keys(SPELLS).forEach((id) => { state.progress.spellRanks[id as SpellId] = 1 })
  Object.keys(state.schools).forEach((id) => {
    const school = id as SchoolId
    const targetLevel = Math.min(state.progress.magicLevelCap, 16)
    state.schools[school].level = Math.max(targetLevel, state.schools[school].level)
    state.schools[school].xp = Math.max(getSchoolLevelStartXp(targetLevel), state.schools[school].xp)
  })
  syncAllSpellUnlocks(state)
}
export const setSchoolDebugAction = (state: GameState, school: SchoolId, xp: number, level?: number) => {
  state.schools[school].xp = Math.max(0, xp)
  state.schools[school].level = Math.max(1, Math.min(state.progress.magicLevelCap, Math.floor(level ?? Math.floor(xp / 20) + 1)))
  syncSpellUnlocksForSchool(state, school)
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
  state.combat.spellCooldowns[spellId] = 0
  return true
}
export const resetSpellCooldownsAction = (state: GameState) => {
  Object.keys(state.combat.spellCooldowns).forEach((spellId) => { state.combat.spellCooldowns[spellId as SpellId] = 0 })
}
export const setLevelCapAction = (state: GameState, cap: number) => { state.progress.magicLevelCap = Math.max(1, cap); Object.keys(state.schools).forEach((id) => { const school = id as SchoolId; state.schools[school].level = Math.min(state.schools[school].level, state.progress.magicLevelCap) }) }
export const setThreatAction = (state: GameState, amount: number) => { state.combat.threatCleared = Math.max(0, amount) }
export const setBossKillsAction = (state: GameState, bossId: MonsterId, amount: number) => {
  state.progress.bossKillsByBoss[bossId] = Math.max(0, amount)
  if (bossId === 'grove-sentinel') state.progress.requestProgress['sentinel-breaker'] = Math.max(state.progress.requestProgress['sentinel-breaker'] ?? 0, state.progress.bossKillsByBoss[bossId])
}
