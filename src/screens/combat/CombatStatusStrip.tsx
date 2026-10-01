import { Flame, HeartPulse, Shield, Snowflake, Sparkles, Zap } from 'lucide-react'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import type { ActiveStatus } from '../../game/types'
import { STATUS_DEFINITIONS } from '../../game/content/statuses'
import { getCombatStatusGroupDetails, getCombatStatusGroupsBasic, getCombatStatusStructureSignature, type CombatStatusGroupPresentation } from '../../game/presentation/combat/combatStatusPresentation'
import { formatTime } from '../../game/utils'
import { GameTooltip } from '../../components/ui'
import { CombatStatusTooltip } from '../../components/combat/CombatStatusTooltip'
import { useGameStore } from '../../store/gameStore'
import { getCombatVisualTimelineProgress, getCombatVisualRate } from './performance/combatTimeline'
import { subscribeCombatVisualFrame } from './performance/combatVisualClock'
import { useCombatPerformanceToggle } from './performance/combatPerformanceDiagnostics'
import { useCombatVisualTimeline } from './CombatActionProgress'
import { resolveGameAssetIcon } from '../../ui/icons/gameAssetIcons'
import { getActiveElementalWardPresentations, type ElementalWardPresentation } from '../../game/presentation/combat/elementalWardPresentation'

type CombatStatusActor = 'player' | 'enemy'

/** Status structure is read independently from countdown data. */
export const CombatStatusStrip = memo(function CombatStatusStrip({ statuses, actor, label }: { statuses?: ActiveStatus[]; actor?: CombatStatusActor; label: string }) {
  const structureSignature = useGameStore((state) => actor ? getCombatStatusStructureSignature(state.combat[`${actor}Statuses`]) : '')
  const wardStructureSignature = useGameStore((state) => actor === 'player' ? getActiveElementalWardPresentations(state).map((ward) => `${ward.element}:${ward.sourceId}:${ward.reduction}:${ward.expiresAt ?? 'infinite'}`).sort().join('|') : '')
  const stableStatuses = useMemo(() => actor ? useGameStore.getState().combat[`${actor}Statuses`] : statuses ?? [], [actor, statuses, structureSignature])
  const groups = useMemo(() => getCombatStatusGroupsBasic(stableStatuses), [stableStatuses])
  const wards = useMemo(() => actor === 'player' ? getActiveElementalWardPresentations(useGameStore.getState()) : [], [actor, wardStructureSignature])
  const hasEffects = groups.length > 0 || wards.length > 0
  return <section className={`combat-status-strip${hasEffects ? ' is-active' : ' is-empty'}`} aria-label={label}><div className="combat-subsection-label">{label}</div>{hasEffects ? <div className="combat-status-list">{groups.map((group) => <CombatStatusChip key={group.statusId} group={group} liveActor={actor} />)}{wards.map((ward) => <ElementalWardChip key={ward.element} ward={ward} />)}</div> : <span className="combat-status-empty">None active</span>}</section>
})

function ElementalWardChip({ ward }: { ward: ElementalWardPresentation }) {
  const source = ward.sourceId.endsWith('-ward') ? `${ward.sourceId.slice(0, -5).replace(/^./, (letter) => letter.toUpperCase())} Ward` : ward.sourceId.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  const durationMs = ward.durationMs ?? 20_000
  const remainingMs = <ElementalWardTimer ward={ward} />
  const displayRemaining = ward.remainingMs === null ? null : formatTime(ward.remainingMs)
  return <GameTooltip block accent="elemental" content={<div className="combat-status-tooltip"><header><span className="combat-status-tooltip-category">BUFF · {ward.element.toUpperCase()}</span><h3>{ward.name}</h3></header><div className="combat-status-tooltip-lines"><p>Incoming {ward.element[0].toUpperCase() + ward.element.slice(1)} Damage: -{ward.reductionPercent}%</p>{ward.durationMs !== null && <p>Duration: {formatTime(ward.durationMs)}</p>}{displayRemaining !== null && <p>Remaining: {displayRemaining}</p>}<p>Source: {source}</p></div></div>}><span className="combat-status-chip status-category-buff is-timed" tabIndex={0} aria-label={`${ward.name}, reduces ${ward.element} damage by ${ward.reductionPercent} percent`}><span className="combat-status-icon"><Shield size={13} aria-hidden="true" /><ElementalWardRing ward={ward} durationMs={durationMs} /></span><strong>{ward.name.toUpperCase()}</strong>{remainingMs}</span></GameTooltip>
}

function ElementalWardTimer({ ward }: { ward: ElementalWardPresentation }) {
  const timing = useGameStore(useShallow((state) => ({ timeScale: state.debug.combatTimeScale, paused: state.debug.combatPaused })))
  const ref = useRef<HTMLElement>(null)
  const initialDurationMs = Math.max(1, ward.durationMs ?? 20_000)
  const remainingMs = Math.max(0, ward.remainingMs ?? initialDurationMs)
  const rate = getCombatVisualRate(1, timing.paused, timing.timeScale)
  const snapshot = { cycleId: `${ward.element}:${ward.sourceId}:${ward.expiresAt ?? 'infinite'}`, baseWorkMs: initialDurationMs, remainingWorkMs: remainingMs, rate, blocked: rate <= 0 }
  const timelineRef = useCombatVisualTimeline(snapshot)
  useEffect(() => subscribeCombatVisualFrame((timestamp) => {
    if (!timelineRef.current || !ref.current) return
    const progress = getCombatVisualTimelineProgress(timelineRef.current, timestamp)
    const currentRemaining = Math.max(0, remainingMs - progress * initialDurationMs)
    ref.current.textContent = formatTime(currentRemaining)
  }, { minIntervalMs: 100 }), [initialDurationMs, remainingMs, timelineRef])
  return <small ref={ref}>{ward.remainingMs === null ? '∞' : formatTime(remainingMs)}</small>
}

function ElementalWardRing({ ward, durationMs }: { ward: ElementalWardPresentation; durationMs: number }) {
  const ringsEnabled = useCombatPerformanceToggle('statusTimerRings')
  if (!ringsEnabled || ward.remainingMs === null) return null
  return <ElementalWardRingLive ward={ward} durationMs={durationMs} />
}

function ElementalWardRingLive({ ward, durationMs }: { ward: ElementalWardPresentation; durationMs: number }) {
  const timing = useGameStore(useShallow((state) => ({ timeScale: state.debug.combatTimeScale, paused: state.debug.combatPaused })))
  const ringRef = useRef<HTMLSpanElement>(null)
  const initialDurationMs = Math.max(1, durationMs)
  const remainingMs = Math.max(0, ward.remainingMs ?? initialDurationMs)
  const rate = getCombatVisualRate(1, timing.paused, timing.timeScale)
  const snapshot = { cycleId: `${ward.element}:${ward.sourceId}:${ward.expiresAt ?? 'infinite'}`, baseWorkMs: initialDurationMs, remainingWorkMs: remainingMs, rate, blocked: rate <= 0 }
  const timelineRef = useCombatVisualTimeline(snapshot)
  useEffect(() => subscribeCombatVisualFrame((timestamp) => {
    if (!timelineRef.current || !ringRef.current) return
    const progress = getCombatVisualTimelineProgress(timelineRef.current, timestamp)
    ringRef.current.style.setProperty('--status-duration-percent', `${Math.max(0, Math.min(100, (1 - progress) * 100))}%`)
  }, { minIntervalMs: 33 }), [initialDurationMs, remainingMs, timelineRef])
  return <span ref={ringRef} className="combat-status-timer-ring" aria-hidden="true" />
}

export const CombatStatusChip = memo(function CombatStatusChip({ group, liveActor }: { group: CombatStatusGroupPresentation; liveActor?: CombatStatusActor }) {
  const [isNew, setIsNew] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => setIsNew(false), 180)
    return () => window.clearTimeout(timer)
  }, [])
  const { definition } = group
  const timed = group.displayRemainingMs !== null && group.displayInitialDurationMs !== null
  const stacks = group.definition.stacking.mode === 'stacks' ? group.totalStacks : 0
  const sourceCount = group.instances.length
  const accent = group.categoryKey === 'dot' ? 'danger' : group.categoryKey === 'control' ? 'mana' : group.categoryKey === 'buff' ? 'elemental' : group.categoryKey === 'debuff' ? 'warning' : 'neutral'
  const accessibleSources = sourceCount > 1 ? `, ${sourceCount} active sources` : ''
  return <GameTooltip block accent={accent} content={<CombatStatusTooltip group={group} />}><span className={`combat-status-chip status-category-${group.categoryKey}${timed ? ' is-timed' : ''}${isNew ? ' is-new' : ''}`} tabIndex={0} aria-label={`${definition.name}, ${group.categoryLabel}${accessibleSources}`}><span className="combat-status-icon"><StatusIcon status={group.instances[0]} />{timed && liveActor && <CombatStatusRing actor={liveActor} statusId={group.statusId} fallbackRemainingMs={group.displayRemainingMs} fallbackInitialDurationMs={group.displayInitialDurationMs} />}</span><strong>{definition.name}</strong>{stacks > 1 && <b>×{stacks}</b>}{timed && liveActor ? <CombatStatusTimer actor={liveActor} statusId={group.statusId} fallbackRemainingMs={group.displayRemainingMs} fallbackInitialDurationMs={group.displayInitialDurationMs} /> : <small>{group.displayRemainingMs === null ? '∞' : formatTime(group.displayRemainingMs)}</small>}</span></GameTooltip>
})

interface CombatStatusTimerProps {
  actor: CombatStatusActor
  statusId: string
  instanceKey?: string
  fallbackRemainingMs: number | null
  fallbackInitialDurationMs: number | null
}

function useLiveStatusTimer({ actor, statusId, fallbackRemainingMs, fallbackInitialDurationMs }: CombatStatusTimerProps) {
  return useGameStore(useShallow((state) => {
    const statuses = state.combat[`${actor}Statuses`]
    const group = getCombatStatusGroupsBasic(statuses).find((entry) => entry.statusId === statusId)
    return {
      remainingMs: group?.displayRemainingMs ?? fallbackRemainingMs,
      initialDurationMs: group?.displayInitialDurationMs ?? fallbackInitialDurationMs,
      timeScale: state.debug.combatTimeScale,
      paused: state.debug.combatPaused,
    }
  }))
}

function CombatStatusTimer({ actor, statusId, fallbackRemainingMs, fallbackInitialDurationMs }: CombatStatusTimerProps) {
  const timer = useLiveStatusTimer({ actor, statusId, fallbackRemainingMs, fallbackInitialDurationMs })
  return <small>{timer.remainingMs === null ? '∞' : formatTime(timer.remainingMs)}</small>
}

function CombatStatusRing({ actor, statusId, fallbackRemainingMs, fallbackInitialDurationMs }: CombatStatusTimerProps) {
  const ringsEnabled = useCombatPerformanceToggle('statusTimerRings')
  if (!ringsEnabled) return null
  return <CombatStatusRingLive actor={actor} statusId={statusId} fallbackRemainingMs={fallbackRemainingMs} fallbackInitialDurationMs={fallbackInitialDurationMs} />
}

function CombatStatusRingLive({ actor, statusId, instanceKey, fallbackRemainingMs, fallbackInitialDurationMs }: CombatStatusTimerProps) {
  const timer = useLiveStatusTimer({ actor, statusId, fallbackRemainingMs, fallbackInitialDurationMs })
  const ringRef = useRef<HTMLSpanElement>(null)
  const initialDurationMs = Math.max(1, timer.initialDurationMs ?? 1)
  const remainingMs = Math.max(0, timer.remainingMs ?? 0)
  const rate = getCombatVisualRate(1, timer.paused, timer.timeScale)
  const liveStatuses = useGameStore.getState().combat[`${actor}Statuses`]
  const resolvedInstanceKey = instanceKey ?? getCombatStatusGroupsBasic(liveStatuses).find((group) => group.statusId === statusId)?.instances[0]?.instanceKey ?? ''
  const snapshot = { cycleId: `${statusId}:${resolvedInstanceKey}`, baseWorkMs: initialDurationMs, remainingWorkMs: remainingMs, rate, blocked: rate <= 0 }
  const timelineRef = useCombatVisualTimeline(snapshot)

  useLayoutEffect(() => {
    if (!timelineRef.lastReconciliation?.requiresImmediatePaint || !timelineRef.current) return
    const progress = getCombatVisualTimelineProgress(timelineRef.current, performance.now())
    ringRef.current?.style.setProperty('--status-duration-percent', `${Math.max(0, Math.min(100, (1 - progress) * 100))}%`)
  }, [remainingMs, initialDurationMs, rate, timelineRef, snapshot.blocked])

  useEffect(() => subscribeCombatVisualFrame((timestamp) => {
    if (!timelineRef.current || !ringRef.current) return
    const progress = getCombatVisualTimelineProgress(timelineRef.current, timestamp)
    ringRef.current.style.setProperty('--status-duration-percent', `${Math.max(0, Math.min(100, (1 - progress) * 100))}%`)
  }, { minIntervalMs: 33 }), [timelineRef])

  return <span ref={ringRef} className="combat-status-timer-ring" aria-hidden="true" />
}

function StatusIcon({ status }: { status: ActiveStatus }) {
  const definition = STATUS_DEFINITIONS[status.statusId]
  if (!definition) return null
  const asset = resolveGameAssetIcon({ kind: 'status', id: status.statusId })
  if (asset) return <img className="combat-status-icon-image" src={asset} alt="" draggable={false} />
  if (definition.tags.includes('dot')) return <Flame size={13} aria-hidden="true" />
  if (definition.tags.includes('control')) return <Snowflake size={13} aria-hidden="true" />
  if (definition.tags.includes('barrier')) return <Shield size={13} aria-hidden="true" />
  if (definition.classification === 'buff') return <Sparkles size={13} aria-hidden="true" />
  if (definition.classification === 'debuff') return <Zap size={13} aria-hidden="true" />
  return <HeartPulse size={13} aria-hidden="true" />
}
