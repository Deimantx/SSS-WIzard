import { STATUS_DEFINITIONS } from '../../content/statuses'
import { MONSTERS } from '../../content/monsters/whisperingWoods'
import type { GameState, StatusId } from '../../types'
import type { CombatActor } from './magnitude'
import { runCombatTriggers } from './triggerRuntime'
import type { CombatEffect, CombatSource, ActiveStatus, CombatTag } from './combatTypes'
import { getCombatModifiers } from './modifiers'

export type ExecuteEffects = (state: GameState, effects: CombatEffect[], source: CombatSource, depth?: number) => void
export interface StatusRemovalOptions {
  executeEffects?: ExecuteEffects
  source?: CombatSource
  depth?: number
  reason?: 'removed' | 'expired'
}

const statusList = (state: GameState, actor: CombatActor) => actor === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses
const setStatusList = (state: GameState, actor: CombatActor, statuses: ActiveStatus[]) => { if (actor === 'player') state.combat.playerStatuses = statuses; else state.combat.enemyStatuses = statuses }

export const actorCannotAct = (state: GameState, actor: CombatActor) => statusList(state, actor).some((status) => STATUS_DEFINITIONS[status.statusId]?.preventsAction === true)

const resolvedDuration = (state: GameState, actor: CombatActor, statusId: StatusId, durationMs: number | null, source: CombatSource) => {
  if (durationMs === null) return null
  const definition = STATUS_DEFINITIONS[statusId]
  const received = getCombatModifiers(state, actor, 'status-duration-received-percent', { source, statusTags: definition.tags })
  const controlReceived = definition.tags.includes('control') ? getCombatModifiers(state, actor, 'control-duration-received-percent', { source, statusTags: definition.tags }) : 0
  const dealt = getCombatModifiers(state, source.actor, 'status-duration-dealt-percent', { source, statusTags: definition.tags })
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
    // V1 strongest supports fixed-strength definitions only. Variable-strength
    // status applications require a future explicit strength model.
    existing.source = source
    existing.remainingMs = duration
    existing.nextTickMs = nextTickMs
  }
  return existing
}

const removeStatusEntry = (state: GameState, actor: CombatActor, statusId: StatusId, options: StatusRemovalOptions = {}) => {
  const statuses = statusList(state, actor)
  const index = statuses.findIndex((status) => status.statusId === statusId)
  if (index < 0) return null
  const removed = statuses[index]
  setStatusList(state, actor, statuses.filter((_, entryIndex) => entryIndex !== index))
  if (options.executeEffects) {
    const definition = STATUS_DEFINITIONS[removed.statusId]
    const eventStatusTags = definition?.tags ?? []
    const lifecycleSource: CombatSource = options.reason === 'expired'
      ? { actor, kind: 'status', sourceId: removed.statusId, originSourceId: removed.source.sourceId, tags: ['status', ...eventStatusTags] }
      : options.source ?? removed.source
    runCombatTriggers(state, actor, options.reason === 'expired' ? 'on-status-expired' : 'on-status-removed', {
      source: lifecycleSource,
      eventTarget: actor,
      changedActor: actor,
      statusId: removed.statusId,
      sourceTags: lifecycleSource.tags ?? [],
      eventStatusTags,
    }, options.executeEffects, options.depth ?? 0, [removed])
  }
  return removed
}

export const removeStatus = (state: GameState, actor: CombatActor, statusId: StatusId, options: StatusRemovalOptions = {}) => Boolean(removeStatusEntry(state, actor, statusId, { ...options, reason: options.reason ?? 'removed' }))

export const clearStatuses = (state: GameState, actor: CombatActor) => setStatusList(state, actor, [])

export const cleanseStatuses = (state: GameState, actor: CombatActor, mode: 'one' | 'all' | 'tag', tag?: CombatTag, options: StatusRemovalOptions = {}) => {
  const statuses = statusList(state, actor)
  const eligible = statuses.filter((status) => {
    const definition = STATUS_DEFINITIONS[status.statusId]
    return definition?.classification === 'debuff' && definition.cleanseable && (mode !== 'tag' || definition.tags.includes(tag as CombatTag))
  })
  const remove = mode === 'one' ? eligible.slice(0, 1) : eligible
  remove.forEach((status) => {
    const live = statusList(state, actor).find((entry) => entry === status)
    if (live) removeStatusEntry(state, actor, live.statusId, { ...options, reason: 'removed' })
  })
  return remove.filter((status) => !statusList(state, actor).includes(status)).length
}

export const dispelStatuses = (state: GameState, actor: CombatActor, mode: 'one' | 'all' | 'tag', tag?: CombatTag, options: StatusRemovalOptions = {}) => {
  const statuses = statusList(state, actor)
  const eligible = statuses.filter((status) => {
    const definition = STATUS_DEFINITIONS[status.statusId]
    return definition?.classification === 'buff' && definition.dispellable && (mode !== 'tag' || definition.tags.includes(tag as CombatTag))
  })
  const remove = mode === 'one' ? eligible.slice(0, 1) : eligible
  remove.forEach((status) => {
    const live = statusList(state, actor).find((entry) => entry === status)
    if (live) removeStatusEntry(state, actor, live.statusId, { ...options, reason: 'removed' })
  })
  return remove.filter((status) => !statusList(state, actor).includes(status)).length
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
    const snapshot = [...statusList(state, actor)]
    snapshot.forEach((original) => {
      if (!statusList(state, actor).some((status) => status === original)) return
      const definition = STATUS_DEFINITIONS[original.statusId]
      if (!definition) return
      const previousRemaining = original.remainingMs
      const activeWindow = previousRemaining === null ? delta : Math.min(delta, previousRemaining)
      let timeToTick = original.nextTickMs
      let guard = 0
      while (timeToTick !== undefined && timeToTick <= activeWindow && (previousRemaining === null || timeToTick < previousRemaining) && (actor !== 'enemy' || Boolean(state.combat.enemyId)) && statusList(state, actor).some((status) => status === original) && definition.periodic && guard < 1000) {
        executeEffects(state, periodicEffects(original), { ...original.source, kind: 'status', sourceId: original.statusId, originSourceId: original.source.sourceId, tags: ['status', ...definition.tags] })
        timeToTick += definition.periodic.intervalMs
        guard += 1
      }
      const nextTickMs = timeToTick === undefined ? undefined : timeToTick - delta
      const nextRemainingMs = previousRemaining === null ? null : Math.max(0, previousRemaining - delta)
      const liveStatuses = statusList(state, actor)
      const live = liveStatuses.find((status) => status === original)
      if (!live) return
      if (live !== original) return
      if (nextRemainingMs === null || nextRemainingMs > 0) {
        live.remainingMs = nextRemainingMs
        if (nextTickMs !== undefined) live.nextTickMs = nextTickMs
        return
      }
      removeStatusEntry(state, actor, original.statusId, { executeEffects, reason: 'expired' })
    })
  })
}
