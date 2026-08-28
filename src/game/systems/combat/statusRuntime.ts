import { STATUS_DEFINITIONS } from '../../content/statuses'
import { MONSTERS } from '../../content/monsters/whisperingWoods'
import type { GameState, StatusId } from '../../types'
import type { CombatActor } from './magnitude'
import type { CombatEffect, CombatSource, ActiveStatus, CombatTag } from './combatTypes'
import { getCombatModifiers } from './modifiers'

export type ExecuteEffects = (state: GameState, effects: CombatEffect[], source: CombatSource, depth?: number) => void

const statusList = (state: GameState, actor: CombatActor) => actor === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses
const setStatusList = (state: GameState, actor: CombatActor, statuses: ActiveStatus[]) => { if (actor === 'player') state.combat.playerStatuses = statuses; else state.combat.enemyStatuses = statuses }

export const actorCannotAct = (state: GameState, actor: CombatActor) => statusList(state, actor).some((status) => STATUS_DEFINITIONS[status.statusId]?.preventsAction === true)

const resolvedDuration = (state: GameState, actor: CombatActor, statusId: StatusId, durationMs: number | null, source: CombatSource) => {
  if (durationMs === null) return null
  const definition = STATUS_DEFINITIONS[statusId]
  const received = getCombatModifiers(state, actor, 'status-duration-received-percent', { statusTags: definition.tags })
  const controlReceived = definition.tags.includes('control') ? getCombatModifiers(state, actor, 'control-duration-received-percent', { statusTags: definition.tags }) : 0
  const dealt = getCombatModifiers(state, source.actor, 'status-duration-dealt-percent', { statusTags: definition.tags })
  return Math.max(0, Math.round(durationMs * Math.max(0, 1 + received + controlReceived + dealt)))
}

export interface ApplyStatusOptions { durationMs?: number | null; stacks?: number; now?: number }

export const applyStatus = (state: GameState, actor: CombatActor, statusId: StatusId, source: CombatSource, options: ApplyStatusOptions = {}) => {
  const definition = STATUS_DEFINITIONS[statusId]
  if (!definition) return null
  if (actor === 'enemy' && state.combat.enemyId) {
    const monster = MONSTERS[state.combat.enemyId]
    if (monster.statusImmunities?.includes(statusId) || monster.statusTagImmunities?.some((tag) => definition.tags.includes(tag))) return null
  }
  const statuses = statusList(state, actor)
  const existing = statuses.find((status) => status.statusId === statusId)
  const duration = resolvedDuration(state, actor, statusId, options.durationMs === undefined ? definition.defaultDurationMs : options.durationMs, source)
  if (duration !== null && duration <= 0) return null
  const requestedStacks = Math.max(1, Math.floor(options.stacks ?? 1))
  const nextTickMs = definition.periodic ? definition.periodic.intervalMs : undefined
  const create = (stacks = requestedStacks, remainingMs = duration): ActiveStatus => ({ statusId, holder: actor, source, remainingMs, stacks: Math.min(definition.stacking.maxStacks ?? Number.MAX_SAFE_INTEGER, stacks), nextTickMs, appliedAt: options.now ?? Date.now() })
  if (!existing) {
    statuses.push(create())
    return statuses[statuses.length - 1]
  }

  const mode = definition.stacking.mode
  if (mode === 'replace') Object.assign(existing, create())
  if (mode === 'refresh') {
    existing.remainingMs = duration
    existing.nextTickMs = nextTickMs
    existing.source = source
  }
  if (mode === 'extend') {
    const extended = existing.remainingMs === null || duration === null ? null : existing.remainingMs + duration
    existing.remainingMs = definition.stacking.maxDurationMs && extended !== null ? Math.min(definition.stacking.maxDurationMs, extended) : extended
    existing.source = source
  }
  if (mode === 'stacks') {
    existing.stacks = Math.min(definition.stacking.maxStacks ?? Number.MAX_SAFE_INTEGER, existing.stacks + requestedStacks)
    existing.remainingMs = duration
    existing.nextTickMs = nextTickMs
    existing.source = source
  }
  if (mode === 'strongest') {
    // V1 has no variable per-application strength. Equal applications refresh;
    // future strength-bearing statuses must introduce an explicit stat rather
    // than overloading runtime duration or an opaque potency number.
    existing.source = source
    existing.remainingMs = duration
    existing.nextTickMs = nextTickMs
  }
  return existing
}

export const removeStatus = (state: GameState, actor: CombatActor, statusId: StatusId) => {
  const statuses = statusList(state, actor)
  const next = statuses.filter((status) => status.statusId !== statusId)
  setStatusList(state, actor, next)
  return next.length !== statuses.length
}

export const clearStatuses = (state: GameState, actor: CombatActor) => setStatusList(state, actor, [])

export const cleanseStatuses = (state: GameState, actor: CombatActor, mode: 'one' | 'all' | 'tag', tag?: CombatTag) => {
  const statuses = statusList(state, actor)
  const eligible = statuses.filter((status) => {
    const definition = STATUS_DEFINITIONS[status.statusId]
    return definition?.classification === 'debuff' && definition.cleanseable && (mode !== 'tag' || definition.tags.includes(tag as CombatTag))
  })
  const remove = mode === 'one' ? eligible.slice(0, 1) : eligible
  if (remove.length) setStatusList(state, actor, statuses.filter((status) => !remove.includes(status)))
  return remove.length
}

export const dispelStatuses = (state: GameState, actor: CombatActor, mode: 'one' | 'all' | 'tag', tag?: CombatTag) => {
  const statuses = statusList(state, actor)
  const eligible = statuses.filter((status) => {
    const definition = STATUS_DEFINITIONS[status.statusId]
    return definition?.classification === 'buff' && definition.dispellable && (mode !== 'tag' || definition.tags.includes(tag as CombatTag))
  })
  const remove = mode === 'one' ? eligible.slice(0, 1) : eligible
  if (remove.length) setStatusList(state, actor, statuses.filter((status) => !remove.includes(status)))
  return remove.length
}

const periodicEffects = (status: ActiveStatus): CombatEffect[] => {
  const definition = STATUS_DEFINITIONS[status.statusId]
  return definition?.periodic?.effects.map((effect) => {
    const holderTarget = status.holder === status.source.actor ? effect.target : effect.target === 'self' ? 'opponent' : 'self'
    return { ...effect, target: holderTarget } as CombatEffect
  }) ?? []
}

export const tickStatuses = (state: GameState, deltaMs: number, executeEffects: ExecuteEffects) => {
  const delta = Math.max(0, deltaMs)
  ;(['player', 'enemy'] as CombatActor[]).forEach((actor) => {
    const remaining: ActiveStatus[] = []
    statusList(state, actor).forEach((status) => {
      const definition = STATUS_DEFINITIONS[status.statusId]
      if (!definition) return
      const next = { ...status }
      const previousRemaining = next.remainingMs
      const activeWindow = previousRemaining === null ? delta : Math.min(delta, previousRemaining)
      let timeToTick = next.nextTickMs
      let guard = 0
      while (timeToTick !== undefined && timeToTick <= activeWindow && (previousRemaining === null || timeToTick < previousRemaining) && (actor !== 'enemy' || Boolean(state.combat.enemyId)) && definition.periodic && guard < 1000) {
        executeEffects(state, periodicEffects(next), { ...next.source, kind: 'status', sourceId: next.statusId, originSourceId: next.source.sourceId, tags: ['status', ...definition.tags] })
        timeToTick += definition.periodic.intervalMs
        guard += 1
      }
      if (timeToTick !== undefined) next.nextTickMs = timeToTick - delta
      if (next.remainingMs !== null) next.remainingMs = Math.max(0, next.remainingMs - delta)
      if (next.remainingMs === null || next.remainingMs > 0) remaining.push(next)
    })
    setStatusList(state, actor, remaining)
  })
}
