import { MONSTERS } from '../../content/monsters/whisperingWoods'
import { playerBasicDamage } from '../../engine'
import type { GameState } from '../../types'
import type { CombatSource, Magnitude } from './combatTypes'

export type CombatActor = 'player' | 'enemy'

export const getActorMaxHealth = (state: GameState, actor: CombatActor) => actor === 'player' ? state.player.maxHealth : state.combat.enemyMaxHp
export const getActorHealth = (state: GameState, actor: CombatActor) => actor === 'player' ? state.player.health : state.combat.enemyHp
export const getActorBasicDamage = (state: GameState, actor: CombatActor) => actor === 'player' ? playerBasicDamage(state) : state.combat.enemyId ? MONSTERS[state.combat.enemyId].attackDamage : 0

export const resolveMagnitude = (state: GameState, magnitude: Magnitude, source: CombatSource, target: CombatActor) => {
  const sourceMax = getActorMaxHealth(state, source.actor)
  const targetMax = getActorMaxHealth(state, target)
  switch (magnitude.type) {
    case 'flat': return Math.max(0, magnitude.value)
    case 'source-max-health-percent': return Math.max(0, sourceMax * magnitude.value)
    case 'target-max-health-percent': return Math.max(0, targetMax * magnitude.value)
    case 'source-basic-damage-percent': return Math.max(0, getActorBasicDamage(state, source.actor) * magnitude.value)
    case 'school-level': return Math.max(0, magnitude.base + (state.schools[magnitude.school]?.level ?? 0) * magnitude.perLevel)
    case 'weapon-damage-percent': return Math.max(0, getActorBasicDamage(state, source.actor) * magnitude.value)
    case 'target-missing-health-percent': return Math.max(0, (targetMax - getActorHealth(state, target)) * magnitude.value)
  }
}
