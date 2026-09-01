import type { GameState } from '../../types'
import type { ActiveStatus, StatusId } from './combatTypes'
import type { CombatActor } from './magnitude'

const statusList = (state: GameState, actor: CombatActor): ActiveStatus[] => actor === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses

/** Returns every live instance belonging to one visible status group. */
export const getStatusInstances = (state: GameState, actor: CombatActor, statusId: StatusId): ActiveStatus[] => statusList(state, actor).filter((status) => status.statusId === statusId)

/** Conditions and UI use group existence rather than an arbitrary raw instance. */
export const hasStatus = (state: GameState, actor: CombatActor, statusId: StatusId): boolean => getStatusInstances(state, actor, statusId).length > 0

/** Stack thresholds on a grouped status sum all active source instances. */
export const getStatusGroupStacks = (state: GameState, actor: CombatActor, statusId: StatusId): number => getStatusInstances(state, actor, statusId).reduce((total, status) => total + Math.max(0, status.stacks), 0)

