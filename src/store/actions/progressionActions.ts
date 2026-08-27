import { SPELLS } from '../../game/content/spells/spells'
import { SCHOOL_LEVEL_XP } from '../../game/core/balance/balance'
import type { GameState, MonsterId, SchoolId, SpellId } from '../../game/types'

export const unlockSchoolSpellsAction = (state: GameState, school: SchoolId) => {
  Object.values(SPELLS).filter((spell) => spell.school === school && state.schools[school].level >= spell.unlockLevel).forEach((spell) => { if (!state.progress.unlockedSpells.includes(spell.id)) state.progress.unlockedSpells.push(spell.id) })
}
export const unlockAllSpellsAction = (state: GameState) => {
  state.progress.unlockedSpells = Object.keys(SPELLS) as SpellId[]
  Object.keys(state.schools).forEach((id) => { const school = id as SchoolId; state.schools[school].level = Math.max(4, state.schools[school].level); state.schools[school].xp = Math.max(SCHOOL_LEVEL_XP(4), state.schools[school].xp) })
}
export const setSchoolDebugAction = (state: GameState, school: SchoolId, xp: number, level?: number) => { state.schools[school].xp = Math.max(0, xp); state.schools[school].level = level ?? Math.min(state.progress.magicLevelCap, Math.max(1, Math.floor(xp / 20) + 1)); unlockSchoolSpellsAction(state, school) }
export const setLevelCapAction = (state: GameState, cap: number) => { state.progress.magicLevelCap = Math.max(1, cap); Object.keys(state.schools).forEach((id) => { const school = id as SchoolId; state.schools[school].level = Math.min(state.schools[school].level, state.progress.magicLevelCap) }) }
export const setThreatAction = (state: GameState, amount: number) => { state.combat.threatCleared = Math.max(0, amount) }
export const setBossKillsAction = (state: GameState, bossId: MonsterId, amount: number) => { state.progress.bossKillsByBoss[bossId] = Math.max(0, amount); state.progress.requestProgress['sentinel-breaker'] = state.progress.bossKillsByBoss['grove-sentinel'] ?? 0 }
