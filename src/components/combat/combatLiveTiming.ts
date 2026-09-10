import { useMemo } from 'react'
import type { ActiveStatus } from '../../game/systems/combat/combatTypes'
import { getCurrentEnemyActionTiming, getPlayerBasicTiming, getTimedActionState, type TimedActionState } from '../../game/systems/combat/actionTiming'
import { useGameStore } from '../../store/gameStore'
import { useShallow } from 'zustand/react/shallow'

const statusShapeKey = (statuses: ActiveStatus[]) => statuses.map((status) => `${status.statusId}:${status.stacks}:${JSON.stringify(status.modifierOverrides ?? null)}`).join('|')

const toStaticTiming = (timing: TimedActionState | null) => timing && ({
  baseWorkMs: timing.baseWorkMs,
  rate: timing.rate,
  blockReason: timing.blockReason,
})

/** Recomputes combat modifiers only when timing inputs change, not per timer tick. */
export function usePlayerCombatActionTiming() {
  const staticInputs = useGameStore(useShallow((state) => ({
    playerAttackDurationMs: state.combat.playerAttackDurationMs,
    playerHealth: state.player.health,
    playerMaxHealth: state.player.maxHealth,
    playerMana: state.player.mana,
    playerMaxMana: state.player.maxMana,
    playerBarrier: state.combat.playerBarrier,
    enemyId: state.combat.enemyId,
    enemyHp: state.combat.enemyHp,
    enemyMaxHp: state.combat.enemyMaxHp,
    enemyBarrier: state.combat.enemyBarrier,
    playerStatusShape: statusShapeKey(state.combat.playerStatuses),
    enemyStatusShape: statusShapeKey(state.combat.enemyStatuses),
    equipment: state.equipment,
    artifactProgress: state.artifactProgress,
    freezePlayerActions: state.debug.freezePlayerActions,
    disablePlayerBasicAttack: state.debug.disablePlayerBasicAttack,
  })))
  const timerMs = useGameStore((state) => state.combat.playerAttackTimerMs)
  const staticTiming = useMemo(() => toStaticTiming(getPlayerBasicTiming(useGameStore.getState()))!, [staticInputs])
  return useMemo(() => getTimedActionState(staticTiming.baseWorkMs, timerMs, staticTiming.rate, staticTiming.blockReason), [staticTiming, timerMs])
}

/** Recomputes the enemy action rate only when its action/control inputs change. */
export function useEnemyCombatActionTiming() {
  const staticInputs = useGameStore(useShallow((state) => ({
    enemyId: state.combat.enemyId,
    enemyActionDurationMs: state.combat.enemyActionDurationMs,
    enemyCurrentStepId: state.combat.enemyCurrentStepId,
    enemyCurrentActionPatternId: state.combat.enemyCurrentActionPatternId,
    enemyStatuses: statusShapeKey(state.combat.enemyStatuses),
    enemyHp: state.combat.enemyHp,
    enemyMaxHp: state.combat.enemyMaxHp,
    playerHealth: state.player.health,
    playerMaxHealth: state.player.maxHealth,
    playerBarrier: state.combat.playerBarrier,
    enemyBarrier: state.combat.enemyBarrier,
    playerStatuses: statusShapeKey(state.combat.playerStatuses),
    freezeEnemyActions: state.debug.freezeEnemyActions,
  })))
  const timerMs = useGameStore((state) => state.combat.enemyActionTimerMs)
  const staticTiming = useMemo(() => toStaticTiming(getCurrentEnemyActionTiming(useGameStore.getState())), [staticInputs])
  return useMemo(() => staticTiming ? getTimedActionState(staticTiming.baseWorkMs, timerMs, staticTiming.rate, staticTiming.blockReason) : null, [staticTiming, timerMs])
}
