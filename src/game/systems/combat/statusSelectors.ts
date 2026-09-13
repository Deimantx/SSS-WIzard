import type { GameState } from '../../types'
import type { ActiveStatus, StatusId } from './combatTypes'
import type { CombatActor } from './magnitude'

type StatusState = { combat: Pick<GameState['combat'], 'playerStatuses' | 'enemyStatuses'> }
const statusList = (state: StatusState, actor: CombatActor): ActiveStatus[] => actor === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses

const modifierOverrideKey = (overrides: ActiveStatus['modifierOverrides']) => Object.entries(overrides ?? {})
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([key, value]) => `${key}:${value}`)
  .join(',')

/** Stable status identity for live selectors; timer fields are intentionally excluded. */
export const getCombatStatusStructureKey = (statuses: ActiveStatus[]) => statuses
  .map((status) => `${status.statusId}:${status.stacks}:${modifierOverrideKey(status.modifierOverrides)}`)
  .join('|')

/** Returns every live instance belonging to one visible status group. */
export const getStatusInstances = (state: StatusState, actor: CombatActor, statusId: StatusId): ActiveStatus[] => statusList(state, actor).filter((status) => status.statusId === statusId)

/** Conditions and UI use group existence rather than an arbitrary raw instance. */
export const hasStatus = (state: StatusState, actor: CombatActor, statusId: StatusId): boolean => getStatusInstances(state, actor, statusId).length > 0

/** Stack thresholds on a grouped status sum all active source instances. */
export const getStatusGroupStacks = (state: StatusState, actor: CombatActor, statusId: StatusId): number => getStatusInstances(state, actor, statusId).reduce((total, status) => total + Math.max(0, status.stacks), 0)
