import { STATUS_DEFINITIONS } from '../../content/statuses'
import { MONSTERS } from '../../content/monsters'
import type { GameState, StatusId } from '../../types'
import type { CombatActor } from './magnitude'
import { resolveMagnitude } from './magnitude'
import { runCombatTriggers } from './triggerRuntime'
import type { CombatEffect, CombatEventSink, CombatSource, ActiveStatus, CombatTag } from './combatTypes'
import { getCombatModifiers } from './modifiers'

export type ExecuteEffects = (state: GameState, effects: CombatEffect[], source: CombatSource, depth?: number, uiEvents?: CombatEventSink) => void
export interface StatusRemovalOptions {
  executeEffects?: ExecuteEffects
  source?: CombatSource
  depth?: number
  reason?: 'removed' | 'expired'
  uiEvents?: CombatEventSink
}

const statusList = (state: GameState, actor: CombatActor): ActiveStatus[] => actor === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses
const setStatusList = (state: GameState, actor: CombatActor, statuses: ActiveStatus[]) => { if (actor === 'player') state.combat.playerStatuses = statuses; else state.combat.enemyStatuses = statuses }

/** Stable source identity shared by application, persistence, UI, and tests. */
export const getStatusApplicationSourceKey = (source: Pick<CombatSource, 'actor' | 'kind' | 'sourceId' | 'originSourceId' | 'ruleId'>): string => {
  const sourceId = source.sourceId?.trim() || source.originSourceId?.trim() || 'unknown'
  const origin = source.kind === 'status' && source.originSourceId?.trim() && source.originSourceId !== sourceId ? `:origin:${source.originSourceId.trim()}` : ''
  const rule = source.ruleId?.trim() ? `:rule:${source.ruleId.trim()}` : ''
  return `${source.actor}:${source.kind}:${sourceId}${origin}${rule}`
}

const getNextStatusEventMs = (state: GameState, actors: CombatActor[]): number | null => {
  let next: number | null = null
  actors.forEach((actor) => {
    statusList(state, actor).forEach((status) => {
      if (!STATUS_DEFINITIONS[status.statusId]) return
      const candidates = [status.remainingMs, status.nextTickMs].filter((value): value is number => value !== null && value !== undefined && Number.isFinite(value))
      candidates.forEach((value) => {
        const boundary = Math.max(0, value)
        if (next === null || boundary < next) next = boundary
      })
    })
  })
  return next
}

/** Returns the earliest status tick or expiration boundary on the shared combat clock. */
export const getNextCombatStatusEventMs = (state: GameState): number | null => getNextStatusEventMs(state, ['player', 'enemy'])

/** Returns the earliest player-owned status boundary while an encounter is not active. */
export const getNextPlayerStatusEventMs = (state: GameState): number | null => getNextStatusEventMs(state, ['player'])

export const actorCannotAct = (state: GameState, actor: CombatActor) => statusList(state, actor).some((status) => STATUS_DEFINITIONS[status.statusId]?.preventsAction === true)

const resolvedDuration = (state: GameState, actor: CombatActor, statusId: StatusId, durationMs: number | null, source: CombatSource) => {
  if (durationMs === null) return null
  const definition = STATUS_DEFINITIONS[statusId]
  const received = getCombatModifiers(state, actor, 'status-duration-received-percent', { source, statusTags: definition.tags })
  const controlReceived = definition.tags.includes('control') ? getCombatModifiers(state, actor, 'control-duration-received-percent', { source, statusTags: definition.tags }) : 0
  const dealt = getCombatModifiers(state, source.actor, 'status-duration-dealt-percent', { source, statusTags: definition.tags })
  return Math.max(0, Math.round(durationMs * Math.max(0, 1 + received + controlReceived + dealt)))
}

const relativeTargetForHolder = (holder: CombatActor, sourceActor: CombatActor, target: 'self' | 'opponent'): CombatActor => {
  if (target === 'self') return holder
  return holder === 'player' ? 'enemy' : 'player'
}

/** Resolve variable authored periodic magnitudes once, while retaining target-relative effects. */
const snapshotPeriodicEffects = (state: GameState, holder: CombatActor, source: CombatSource, effects: CombatEffect[] | undefined) => effects?.map((effect) => {
  if (effect.type !== 'deal-damage' || effect.magnitude.type === 'flat') return { ...effect }
  const target = relativeTargetForHolder(holder, source.actor, effect.target)
  return { ...effect, magnitude: { type: 'flat' as const, value: resolveMagnitude(state, effect.magnitude, source, target) } }
})

export interface ApplyStatusOptions {
  durationMs?: number | null
  stacks?: number
  now?: number
  periodicEffects?: CombatEffect[]
  statusSourceKey?: string
}

export interface StatusTickOptions {
  /** Keep zero-duration instances present until combat death resolution completes. */
  deferExpiry?: boolean
}

export const applyStatus = (state: GameState, actor: CombatActor, statusId: StatusId, source: CombatSource, options: ApplyStatusOptions = {}) => {
  const definition = STATUS_DEFINITIONS[statusId]
  if (!definition) return null
  if (actor === 'enemy' && state.combat.enemyId) {
    const monster = MONSTERS[state.combat.enemyId]
    if (monster.statusImmunities?.includes(statusId) || monster.statusTagImmunities?.some((tag) => definition.tags.includes(tag))) return null
  }
  const statuses = statusList(state, actor)
  const applicationPolicy = definition.applicationPolicy ?? 'single'
  const instanceKey = applicationPolicy === 'per-source'
    ? options.statusSourceKey?.trim() || getStatusApplicationSourceKey(source)
    : `single:${statusId}`
  const existing = statuses.find((status) => status.statusId === statusId && status.instanceKey === instanceKey)
  const duration = resolvedDuration(state, actor, statusId, options.durationMs === undefined ? definition.defaultDurationMs : options.durationMs, source)
  if (duration !== null && duration <= 0) return null
  const requestedStacks = Math.max(1, Math.floor(options.stacks ?? 1))
  const nextTickMs = definition.periodic ? definition.periodic.intervalMs : undefined
  const hasPeriodicOverride = options.periodicEffects !== undefined
  const periodicEffects = hasPeriodicOverride ? snapshotPeriodicEffects(state, actor, source, options.periodicEffects) : undefined
  const create = (stacks = requestedStacks, remainingMs = duration): ActiveStatus => ({
    statusId,
    holder: actor,
    instanceKey,
    source,
    remainingMs,
    stacks: Math.min(definition.stacking.maxStacks ?? Number.MAX_SAFE_INTEGER, stacks),
    nextTickMs,
    appliedAt: options.now ?? Date.now(),
    ...(hasPeriodicOverride ? { periodicEffects } : {}),
  })
  if (!existing) {
    statuses.push(create())
    return statuses[statuses.length - 1]
  }

  const mode = definition.stacking.mode
  // Per-source reapplication refreshes this source's payload and duration but
  // never resets its already-scheduled tick cadence.
  if (applicationPolicy === 'per-source') {
    existing.source = source
    existing.remainingMs = duration
    existing.appliedAt = options.now ?? Date.now()
    existing.instanceKey = instanceKey
    if (definition.periodic && existing.nextTickMs === undefined) existing.nextTickMs = definition.periodic.intervalMs
    if (hasPeriodicOverride) existing.periodicEffects = periodicEffects
    else delete existing.periodicEffects
    if (mode === 'stacks') existing.stacks = Math.min(definition.stacking.maxStacks ?? Number.MAX_SAFE_INTEGER, existing.stacks + requestedStacks)
    return existing
  }

  if (mode === 'replace') Object.assign(existing, create())
  if (mode === 'refresh') {
    existing.remainingMs = duration
    existing.nextTickMs = nextTickMs
    existing.source = source
    existing.appliedAt = options.now ?? Date.now()
    if (hasPeriodicOverride) existing.periodicEffects = periodicEffects
    else delete existing.periodicEffects
  }
  if (mode === 'extend') {
    const extended = existing.remainingMs === null || duration === null ? null : existing.remainingMs + duration
    existing.remainingMs = definition.stacking.maxDurationMs && extended !== null ? Math.min(definition.stacking.maxDurationMs, extended) : extended
    existing.source = source
    existing.appliedAt = options.now ?? Date.now()
    if (hasPeriodicOverride) existing.periodicEffects = periodicEffects
    else delete existing.periodicEffects
  }
  if (mode === 'stacks') {
    existing.stacks = Math.min(definition.stacking.maxStacks ?? Number.MAX_SAFE_INTEGER, existing.stacks + requestedStacks)
    existing.remainingMs = duration
    existing.nextTickMs = nextTickMs
    existing.source = source
    existing.appliedAt = options.now ?? Date.now()
    if (hasPeriodicOverride) existing.periodicEffects = periodicEffects
    else delete existing.periodicEffects
  }
  if (mode === 'strongest') {
    // V1 strongest supports fixed-strength definitions only. Variable-strength
    // status applications require a future explicit strength model.
    existing.source = source
    existing.remainingMs = duration
    existing.nextTickMs = nextTickMs
    existing.appliedAt = options.now ?? Date.now()
    if (hasPeriodicOverride) existing.periodicEffects = periodicEffects
    else delete existing.periodicEffects
  }
  return existing
}

const holderSource = (state: GameState, actor: CombatActor) => actor === 'enemy' && state.combat.enemyId
  ? { kind: 'enemy' as const, monsterId: state.combat.enemyId }
  : actor === 'player' ? { kind: 'player' as const } : { kind: 'system' as const }

const emitStatusLifecycle = (state: GameState, actor: CombatActor, removed: ActiveStatus, options: StatusRemovalOptions, statusPhase: 'remove' | 'expire') => {
  const source = holderSource(state, actor)
  options.uiEvents?.push({
    source,
    sourceKind: 'status',
    dungeonId: state.combat.dungeonId ?? undefined,
    target: actor,
    targetMonsterId: actor === 'enemy' ? state.combat.enemyId ?? undefined : undefined,
    category: 'status',
    sourceId: removed.statusId,
    statusId: removed.statusId,
    statusPhase,
    originSourceId: removed.source.sourceId,
    originSourceKind: removed.source.kind,
    ruleId: removed.source.ruleId,
    statusInstanceKey: removed.instanceKey,
    stacks: removed.stacks,
  })
  if (!options.executeEffects) return
  const definition = STATUS_DEFINITIONS[removed.statusId]
  const eventStatusTags = definition?.tags ?? []
  const lifecycleSource: CombatSource = statusPhase === 'expire'
    ? { actor, kind: 'status', sourceId: removed.statusId, originSourceId: removed.source.sourceId, originSourceKind: removed.source.kind, statusInstanceKey: removed.instanceKey, tags: ['status', ...eventStatusTags] }
    : options.source ?? removed.source
  runCombatTriggers(state, actor, statusPhase === 'expire' ? 'on-status-expired' : 'on-status-removed', {
    source: lifecycleSource,
    eventTarget: actor,
    changedActor: actor,
    statusId: removed.statusId,
    sourceTags: lifecycleSource.tags ?? [],
    eventStatusTags,
  }, options.executeEffects, options.depth ?? 0, [removed], options.uiEvents)
}

/** Removes one internal instance during natural expiry. */
const removeStatusInstance = (state: GameState, actor: CombatActor, status: ActiveStatus, options: StatusRemovalOptions = {}) => {
  const statuses = statusList(state, actor)
  if (!statuses.includes(status)) return null
  setStatusList(state, actor, statuses.filter((entry) => entry !== status))
  const groupRemains = statusList(state, actor).some((entry) => entry.statusId === status.statusId)
  // A grouped status has one visible lifecycle. Individual source expiry is
  // silent until the final source disappears.
  if (!groupRemains || options.reason !== 'expired') emitStatusLifecycle(state, actor, status, options, options.reason === 'expired' ? 'expire' : 'remove')
  return status
}

/** Removes the complete visible status group, regardless of source count. */
const removeStatusGroup = (state: GameState, actor: CombatActor, statusId: StatusId, options: StatusRemovalOptions = {}) => {
  const statuses = statusList(state, actor)
  const removed = statuses.filter((status) => status.statusId === statusId)
  if (!removed.length) return []
  setStatusList(state, actor, statuses.filter((status) => status.statusId !== statusId))
  emitStatusLifecycle(state, actor, removed[0], { ...options, reason: options.reason ?? 'removed' }, options.reason === 'expired' ? 'expire' : 'remove')
  return removed
}

export const removeStatus = (state: GameState, actor: CombatActor, statusId: StatusId, options: StatusRemovalOptions = {}) => removeStatusGroup(state, actor, statusId, { ...options, reason: options.reason ?? 'removed' }).length > 0

export const clearStatuses = (state: GameState, actor: CombatActor) => setStatusList(state, actor, [])

const eligibleStatusGroups = (state: GameState, actor: CombatActor, classification: 'buff' | 'debuff', mode: 'one' | 'all' | 'tag', tag?: CombatTag) => {
  const ids: StatusId[] = []
  statusList(state, actor).forEach((status) => {
    if (ids.includes(status.statusId)) return
    const definition = STATUS_DEFINITIONS[status.statusId]
    if (definition?.classification === classification && (classification === 'debuff' ? definition.cleanseable : definition.dispellable) && (mode !== 'tag' || definition.tags.includes(tag as CombatTag))) ids.push(status.statusId)
  })
  return mode === 'one' ? ids.slice(0, 1) : ids
}

export const cleanseStatuses = (state: GameState, actor: CombatActor, mode: 'one' | 'all' | 'tag', tag?: CombatTag, options: StatusRemovalOptions = {}) => {
  const groups = eligibleStatusGroups(state, actor, 'debuff', mode, tag)
  groups.forEach((statusId) => removeStatusGroup(state, actor, statusId, { ...options, reason: 'removed' }))
  return groups.length
}

export const dispelStatuses = (state: GameState, actor: CombatActor, mode: 'one' | 'all' | 'tag', tag?: CombatTag, options: StatusRemovalOptions = {}) => {
  const groups = eligibleStatusGroups(state, actor, 'buff', mode, tag)
  groups.forEach((statusId) => removeStatusGroup(state, actor, statusId, { ...options, reason: 'removed' }))
  return groups.length
}

const periodicEffects = (status: ActiveStatus): CombatEffect[] => {
  const definition = STATUS_DEFINITIONS[status.statusId]
  return (status.periodicEffects ?? definition?.periodic?.effects)?.map((effect) => ({
    ...effect,
    target: relativeTargetForHolder(status.holder, status.source.actor, effect.target) === status.source.actor ? 'self' : 'opponent',
  }) as CombatEffect) ?? []
}

export const expirePendingStatuses = (state: GameState, pending: Array<{ actor: CombatActor; status: ActiveStatus }>, executeEffects: ExecuteEffects, uiEvents?: CombatEventSink) => {
  pending.forEach(({ actor, status }) => {
    const live = statusList(state, actor).find((entry) => entry === status)
    if (live && live.remainingMs === 0) removeStatusInstance(state, actor, live, { executeEffects, reason: 'expired', uiEvents })
  })
}

export const tickStatuses = (state: GameState, deltaMs: number, executeEffects: ExecuteEffects, uiEvents?: CombatEventSink, actors: CombatActor[] = ['player', 'enemy'], options: StatusTickOptions = {}) => {
  const delta = Math.max(0, deltaMs)
  const pending: Array<{ actor: CombatActor; status: ActiveStatus }> = []
  actors.forEach((actor) => {
    const snapshot = [...statusList(state, actor)]
    snapshot.forEach((original) => {
      if (!statusList(state, actor).some((status) => status === original)) return
      const definition = STATUS_DEFINITIONS[original.statusId]
      if (!definition) return
      const previousRemaining = original.remainingMs
      const activeWindow = previousRemaining === null ? delta : Math.min(delta, previousRemaining)
      let timeToTick = original.nextTickMs
      let guard = 0
      // Inclusive expiration boundary: a tick scheduled exactly when the
      // status expires resolves before the instance is removed.
      while (timeToTick !== undefined && timeToTick <= activeWindow && (previousRemaining === null || timeToTick <= previousRemaining) && (actor !== 'enemy' || Boolean(state.combat.enemyId)) && statusList(state, actor).some((status) => status === original) && definition.periodic && guard < 1000) {
        executeEffects(state, periodicEffects(original), { ...original.source, kind: 'status', sourceId: original.statusId, originSourceId: original.source.sourceId, originSourceKind: original.source.kind, statusInstanceKey: original.instanceKey, tags: ['status', ...definition.tags] }, undefined, uiEvents)
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
      if (options.deferExpiry) {
        live.remainingMs = 0
        if (nextTickMs !== undefined) live.nextTickMs = nextTickMs
        pending.push({ actor, status: live })
      } else removeStatusInstance(state, actor, original, { executeEffects, reason: 'expired', uiEvents })
    })
  })
  return pending
}
