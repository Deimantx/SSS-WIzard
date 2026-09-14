import { GUARDIANS } from '../../content/guardians/guardians'
import { appendLog } from '../../engine'
import type { GameState, GuardianId } from '../../types'
import type { CombatEventSink, CombatTag } from '../combat/combatTypes'
import { executeCombatEffects } from '../combat/effectResolver'
import { isSummoningUnlocked } from './summoningSelectors'

const clearGuardian = (state: GameState['combat']['guardian']) => {
  state.activeGuardianId = null
  state.attackTimerMs = 0
  state.suppressedForEncounter = false
}

export const clearGuardianRuntime = (state: GameState) => {
  clearGuardian(state.combat.guardian)
}

const suppressGuardian = (state: GameState) => {
  const guardianId = state.combat.guardian.activeGuardianId
  if (!guardianId || state.player.mana > 0) return false
  state.combat.guardian.activeGuardianId = null
  state.combat.guardian.attackTimerMs = 0
  state.combat.guardian.suppressedForEncounter = true
  appendLog(state, `${GUARDIANS[guardianId].name} fades as Mana is exhausted.`)
  return true
}

/** Starts a fresh encounter snapshot. It intentionally does not touch the preference. */
export const beginGuardianEncounter = (state: GameState) => {
  clearGuardian(state.combat.guardian)
  const selected = state.guardians.selectedGuardianId
  if (!state.combat.enemyId || !selected || !isSummoningUnlocked(state) || state.player.mana <= 0) return null
  const guardian = GUARDIANS[selected]
  state.combat.guardian.activeGuardianId = selected
  state.combat.guardian.attackTimerMs = guardian.attack.intervalMs
  appendLog(state, `${guardian.name} joins the battle.`)
  return selected
}

/** Reconstructs an active summon for a valid hydrated encounter, without resummoning a suppressed one. */
export const ensureGuardianForCurrentEncounter = (state: GameState) => {
  if (!state.combat.enemyId || state.combat.guardian.activeGuardianId || state.combat.guardian.suppressedForEncounter) return state.combat.guardian.activeGuardianId
  return beginGuardianEncounter(state)
}

export const suppressGuardianIfOutOfMana = (state: GameState) => {
  suppressGuardian(state)
  return state.combat.guardian.activeGuardianId
}

export const advanceGuardianUpkeep = (state: GameState, deltaMs: number) => {
  const guardianId = state.combat.guardian.activeGuardianId
  if (!guardianId || !state.combat.enemyId || deltaMs <= 0) return
  const upkeep = GUARDIANS[guardianId].manaPerSecond * deltaMs / 1000
  state.player.mana = Math.max(0, state.player.mana - upkeep)
  suppressGuardian(state)
}

export const getGuardianAttackBoundary = (state: Pick<GameState, 'combat'>) => state.combat.guardian.activeGuardianId ? Math.max(0, state.combat.guardian.attackTimerMs) : Number.POSITIVE_INFINITY

export const resolveGuardianAttack = (state: GameState, uiEvents?: CombatEventSink) => {
  const guardianId = state.combat.guardian.activeGuardianId
  if (!guardianId || !state.combat.enemyId || state.combat.enemyHp <= 0 || state.player.mana <= 0) {
    suppressGuardian(state)
    return 0
  }
  const guardian = GUARDIANS[guardianId]
  const guardianTags: CombatTag[] = ['guardian', 'summon', guardian.element]
  const source = { actor: 'player' as const, kind: 'guardian' as const, sourceId: guardian.id, school: guardian.element, tags: guardianTags }
  executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: guardian.attack.damageType, magnitude: { type: 'spell-power', coefficient: guardian.attack.spellPowerCoefficient } }], school: guardian.element, tags: guardianTags }], source, 0, uiEvents)
  if (state.combat.guardian.activeGuardianId === guardianId && state.combat.enemyId && state.player.mana > 0) state.combat.guardian.attackTimerMs = guardian.attack.intervalMs
  else suppressGuardian(state)
  return state.combat.lastDamageDealt
}

export const isGuardianId = (value: unknown): value is GuardianId => typeof value === 'string' && Object.prototype.hasOwnProperty.call(GUARDIANS, value)
