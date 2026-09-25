import { MONSTERS } from '../../content/monsters'
import { getSpellPower } from '../spells/spellPower'
import type { GameState } from '../../types'
import type { CombatSource, Magnitude } from './combatTypes'
import { getRootCombatSourceProvenance } from './combatProvenance'
export { scaleMagnitude } from './combatTypes'

export type CombatActor = 'player' | 'enemy'
export type MagnitudeState = {
  player: Pick<GameState['player'], 'health' | 'maxHealth' | 'maxMana'>
  combat: Pick<GameState['combat'], 'enemyId' | 'enemyHp' | 'enemyMaxHp' | 'playerBarrier' | 'enemyBarrier' | 'playerStatuses' | 'enemyStatuses'>
  schools: GameState['schools']
  equipment: GameState['equipment']
  artifactProgress: GameState['artifactProgress']
}

export const getActorMaxHealth = (state: MagnitudeState, actor: CombatActor) => actor === 'player' ? state.player.maxHealth : state.combat.enemyMaxHp
export const getActorMaxMana = (state: MagnitudeState, actor: CombatActor) => actor === 'player' ? state.player.maxMana : 0
export const getActorHealth = (state: MagnitudeState, actor: CombatActor) => actor === 'player' ? state.player.health : state.combat.enemyHp
export const getActorBarrier = (state: MagnitudeState, actor: CombatActor) => actor === 'player' ? state.combat.playerBarrier : state.combat.enemyBarrier
/** A combat target is valid only while its actor and, for Enemy, encounter are alive. */
export const isCombatActorAlive = (state: MagnitudeState, actor: CombatActor) => actor === 'player'
  ? state.player.health > 0
  : Boolean(state.combat.enemyId) && state.combat.enemyHp > 0
export const getActorBasicDamage = (state: MagnitudeState, actor: CombatActor) => actor === 'player' ? 0 : state.combat.enemyId ? MONSTERS[state.combat.enemyId].basicAttackDamage : 0


export const resolveMagnitude = (state: MagnitudeState, magnitude: Magnitude, source: CombatSource, target: CombatActor): number => {
  const sourceMax = getActorMaxHealth(state, source.actor)
  const targetMax = getActorMaxHealth(state, target)
  switch (magnitude.type) {
    case 'flat': return Math.max(0, magnitude.value)
    case 'source-max-health-percent': return Math.max(0, sourceMax * magnitude.value)
    case 'source-max-mana-percent': return Math.max(0, getActorMaxMana(state, source.actor) * magnitude.value)
    case 'target-max-health-percent': return Math.max(0, targetMax * magnitude.value)
    case 'source-basic-damage-percent': return Math.max(0, getActorBasicDamage(state, source.actor) * magnitude.value)
    case 'school-level': return Math.max(0, magnitude.base + (state.schools[magnitude.school]?.level ?? 0) * magnitude.perLevel)
    case 'spell-power': return (source.kind === 'spell' || source.kind === 'guardian' || getRootCombatSourceProvenance(source).sourceKind === 'spell') ? Math.max(0, getSpellPower(state) * magnitude.coefficient) : 0
    case 'target-missing-health-percent': return Math.max(0, (targetMax - getActorHealth(state, target)) * magnitude.value)
    case 'source-current-barrier-percent': return Math.max(0, getActorBarrier(state, source.actor) * magnitude.value)
    case 'opponent-status-stack-scaled': {
      const opponent = source.actor === 'player' ? 'enemy' : 'player'
      const statuses = opponent === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses
      const stacks = statuses
        .filter((status) => status.statusId === magnitude.statusId)
        .reduce((total, status) => total + Math.max(0, status.stacks), 0)
      const cappedStacks = magnitude.maxStacks === undefined ? stacks : Math.min(stacks, magnitude.maxStacks)
      return Math.max(0, resolveMagnitude(state, magnitude.base, source, target) * (1 + cappedStacks * magnitude.perStack))
    }
    case 'source-status-stack-scaled': {
      const statuses = source.actor === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses
      const stacks = statuses
        .filter((status) => status.statusId === magnitude.statusId)
        .reduce((total, status) => total + Math.max(0, status.stacks), 0)
      const cappedStacks = magnitude.maxStacks === undefined ? stacks : Math.min(stacks, magnitude.maxStacks)
      return Math.max(0, resolveMagnitude(state, magnitude.base, source, target) * (1 + cappedStacks * magnitude.perStack))
    }
  }
}
