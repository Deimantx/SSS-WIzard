import { useMemo } from 'react'
import { ITEMS } from '../../game/content/items/items'
import { STATUS_DEFINITIONS } from '../../game/content/statuses'
import type { GameState } from '../../game/types'
import { getAllocatedArtifactCombatProviders } from '../../game/systems/artifacts/artifactProgression'
import { getCurrentEnemyActionTiming, getPlayerBasicTiming, getTimedActionState, type TimedActionState } from '../../game/systems/combat/actionTiming'
import type { CombatActor, CombatCondition, CombatModifier } from '../../game/systems/combat/combatTypes'
import { getActorTraits } from '../../game/systems/combat/traitRuntime'
import { getCombatStatusStructureKey } from '../../game/systems/combat/statusSelectors'
import { useGameStore } from '../../store/gameStore'
import { useShallow } from 'zustand/react/shallow'

type StaticTiming = Pick<TimedActionState, 'baseWorkMs' | 'rate' | 'blockReason'>

const toStaticTiming = (timing: TimedActionState | null): StaticTiming | null => timing && ({
  baseWorkMs: timing.baseWorkMs,
  rate: timing.rate,
  blockReason: timing.blockReason,
})

type ConditionDependencies = { hp: boolean; mana: boolean; barrier: boolean }

const collectConditionDependencies = (condition: CombatCondition | undefined, dependencies: ConditionDependencies) => {
  if (!condition) return
  switch (condition.type) {
    case 'self-hp-below-percent':
    case 'target-hp-below-percent':
    case 'self-hp-above-percent':
    case 'target-hp-above-percent':
      dependencies.hp = true
      return
    case 'self-mana-above-percent':
      dependencies.mana = true
      return
    case 'self-has-barrier':
    case 'target-has-barrier':
    case 'self-barrier-at-least':
    case 'self-barrier-at-most':
    case 'target-barrier-at-least':
    case 'target-barrier-at-most':
      dependencies.barrier = true
      return
    case 'all':
    case 'any':
      condition.conditions.forEach((entry) => collectConditionDependencies(entry, dependencies))
      return
    case 'not':
      collectConditionDependencies(condition.condition, dependencies)
      return
    default:
      return
  }
}

const relevantModifiers = (state: GameState, actor: CombatActor, lane: 'basic-attack' | 'action'): CombatModifier[] => {
  const key = lane === 'basic-attack' ? 'basic-attack-speed-percent' : 'action-speed-percent'
  const modifiers: CombatModifier[] = []
  const add = (entries: readonly CombatModifier[] | undefined) => entries?.forEach((modifier) => { if (modifier.key === key) modifiers.push(modifier) })

  const statuses = actor === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses
  statuses.forEach((status) => add(STATUS_DEFINITIONS[status.statusId]?.modifiers))
  getActorTraits(state, actor).forEach((trait) => add(trait.modifiers))
  if (actor === 'player') {
    Object.values(state.equipment).forEach((itemId) => {
      if (!itemId) return
      add(ITEMS[itemId]?.combat?.modifiers)
      getAllocatedArtifactCombatProviders(state, itemId).forEach((provider) => add(provider.modifiers))
    })
  }
  return modifiers
}

/**
 * Only adds live condition inputs when an authored action-speed modifier
 * actually reads them. Normal HP/Mana ticks therefore do not invalidate the
 * timing calculation.
 */
const getTimingConditionKey = (state: GameState, actor: CombatActor, lane: 'basic-attack' | 'action') => {
  const dependencies: ConditionDependencies = { hp: false, mana: false, barrier: false }
  relevantModifiers(state, actor, lane).forEach((modifier) => collectConditionDependencies(modifier.condition, dependencies))
  const values: string[] = []
  if (dependencies.hp) values.push(`hp:${state.player.health}:${state.player.maxHealth}:${state.combat.enemyHp}:${state.combat.enemyMaxHp}`)
  if (dependencies.mana && actor === 'player') values.push(`mana:${state.player.mana}:${state.player.maxMana}`)
  if (dependencies.barrier) values.push(`barrier:${state.combat.playerBarrier}:${state.combat.enemyBarrier}`)
  return values.join('|')
}

/** Recomputes combat modifiers only when timing inputs change, not per timer tick. */
export function usePlayerCombatActionTiming() {
  const staticInputs = useGameStore(useShallow((state) => ({
    playerAttackDurationMs: state.combat.playerAttackDurationMs,
    playerStatusShape: getCombatStatusStructureKey(state.combat.playerStatuses),
    equipment: state.equipment,
    artifactProgress: state.artifactProgress,
    conditionState: getTimingConditionKey(state, 'player', 'basic-attack'),
    freezePlayerActions: state.debug.freezePlayerActions,
    disablePlayerBasicAttack: state.debug.disablePlayerBasicAttack,
  })))
  const timerMs = useGameStore((state) => state.combat.playerAttackTimerMs)
  const staticTiming = useMemo(() => toStaticTiming(getPlayerBasicTiming(useGameStore.getState())), [staticInputs])
  return useMemo(() => staticTiming ? getTimedActionState(staticTiming.baseWorkMs, timerMs, staticTiming.rate, staticTiming.blockReason) : null, [staticTiming, timerMs])
}

/** Recomputes the enemy action rate only when its action/control inputs change. */
export function useEnemyCombatActionTiming() {
  const staticInputs = useGameStore(useShallow((state) => ({
    enemyId: state.combat.enemyId,
    enemyActionDurationMs: state.combat.enemyActionDurationMs,
    enemyCurrentStepId: state.combat.enemyCurrentStepId,
    enemyCurrentActionPatternId: state.combat.enemyCurrentActionPatternId,
    enemyActionPatternId: state.combat.enemyActionPatternId,
    enemyStatusShape: getCombatStatusStructureKey(state.combat.enemyStatuses),
    conditionState: getTimingConditionKey(state, 'enemy', 'action'),
    freezeEnemyActions: state.debug.freezeEnemyActions,
  })))
  const timerMs = useGameStore((state) => state.combat.enemyActionTimerMs)
  const staticTiming = useMemo(() => toStaticTiming(getCurrentEnemyActionTiming(useGameStore.getState())), [staticInputs])
  return useMemo(() => staticTiming ? getTimedActionState(staticTiming.baseWorkMs, timerMs, staticTiming.rate, staticTiming.blockReason) : null, [staticTiming, timerMs])
}
