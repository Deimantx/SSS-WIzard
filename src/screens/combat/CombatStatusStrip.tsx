import { Flame, HeartPulse, Shield, Snowflake, Sparkles, Zap } from 'lucide-react'
import type { CSSProperties } from 'react'
import { memo, useEffect, useMemo, useState } from 'react'
import type { ActiveStatus } from '../../game/types'
import { STATUS_DEFINITIONS } from '../../game/content/statuses'
import { formatUiCombatRate } from '../../game/presentation/numbers'
import { getCombatStatusGroups, type CombatStatusGroupPresentation } from '../../game/presentation/combat/combatStatusPresentation'
import { formatTime } from '../../game/utils'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { useShallow } from 'zustand/react/shallow'

const getStructureKey = (statuses: ActiveStatus[]) => statuses.map((status) => JSON.stringify({
  statusId: status.statusId,
  holder: status.holder,
  instanceKey: status.instanceKey,
  source: status.source,
  initialDurationMs: status.initialDurationMs,
  stacks: status.stacks,
  periodicEffects: status.periodicEffects,
  modifierOverrides: status.modifierOverrides,
})).join('|')

const getStructuralStatuses = (statuses: ActiveStatus[]) => statuses.map((status) => ({
  ...status,
  remainingMs: status.initialDurationMs ?? status.remainingMs,
  nextTickMs: undefined,
  appliedAt: undefined,
}))

export function CombatStatusStrip({ statuses, label }: { statuses: ActiveStatus[]; label: string }) {
  const structureKey = getStructureKey(statuses)
  const structuralStatuses = useMemo(() => getStructuralStatuses(statuses), [structureKey])
  const groups = useMemo(() => getCombatStatusGroups(structuralStatuses, useGameStore.getState()), [structuralStatuses])
  const holder = statuses[0]?.holder ?? 'player'
  return <section className={`combat-status-strip${groups.length ? ' is-active' : ' is-empty'}`} aria-label={label}><div className="combat-subsection-label">{label}</div>{groups.length ? <div className="combat-status-list">{groups.map((group) => <CombatStatusChip key={group.statusId} group={group} holder={holder} />)}</div> : <span className="combat-status-empty">None active</span>}</section>
}

export const CombatStatusChip = memo(function CombatStatusChip({ group, holder }: { group: CombatStatusGroupPresentation; holder: ActiveStatus['holder'] }) {
  const [isNew, setIsNew] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => setIsNew(false), 180)
    return () => window.clearTimeout(timer)
  }, [])
  const { definition } = group
  const timed = group.displayRemainingMs !== null && group.displayInitialDurationMs !== null
  const stacks = group.definition.stacking.mode === 'stacks' ? group.totalStacks : 0
  const sources = group.sourceBreakdown
  const sourceCount = group.instances.length
  const accent = group.categoryKey === 'dot' ? 'danger' : group.categoryKey === 'control' ? 'mana' : group.categoryKey === 'buff' ? 'elemental' : group.categoryKey === 'debuff' ? 'warning' : 'neutral'
  const rate = group.totalCurrentRate
  const accessibleRate = rate !== undefined ? `, ${formatUiCombatRate(rate, 'damage per second')}` : ''
  const accessibleSources = sourceCount > 1 ? `, ${sourceCount} active sources` : ''
  const tooltip = <TooltipContent title={definition.name} description={definition.description}>
    <div className="tooltip-section"><small>TYPE</small><p>{group.categoryLabel}</p></div>
    <div className="tooltip-section"><small>REMAINING</small><p><LiveStatusDuration holder={holder} statusId={group.statusId} /></p></div>
    {definition.stacking.mode === 'stacks' && <div className="tooltip-section"><small>STACKS</small><p>{stacks}</p></div>}
    {sources.length > 0 && <div className="tooltip-section"><small>SOURCES</small><div className="combat-status-tooltip-sources">{sources.map((source) => <div className="combat-status-tooltip-source" key={source.instanceKey}><strong>{source.sourceLabel}</strong><span>{source.damagePerSecond !== undefined ? formatUiCombatRate(source.damagePerSecond, '/s') : 'Periodic effect'}</span><small><LiveStatusSourceRemaining holder={holder} statusId={group.statusId} instanceKey={source.instanceKey} fallbackMs={source.remainingMs} /></small></div>)}</div></div>}
    {rate !== undefined && <div className="tooltip-section"><small>TOTAL</small><p>{formatUiCombatRate(rate, '/s')}</p></div>}
  </TooltipContent>
  const accessibleDuration = group.displayRemainingMs === null ? ', indefinite duration' : `, up to ${formatTime(group.displayRemainingMs ?? 0)} remaining`
  const statusLabel = `${definition.name}, ${group.categoryLabel}${accessibleSources}${accessibleRate}${accessibleDuration}`
  return <GameTooltip block accent={accent} content={tooltip}><span className={`combat-status-chip status-category-${group.categoryKey}${timed ? ' is-timed' : ''}${isNew ? ' is-new' : ''}`} tabIndex={0} aria-label={statusLabel}><span className="combat-status-icon"><StatusIcon status={group.instances[0]} /></span><strong>{definition.name}</strong>{stacks > 1 && <b>×{stacks}</b>}<LiveStatusDuration holder={holder} statusId={group.statusId} showBar={timed} /></span></GameTooltip>
})

function useLiveStatusInstances(holder: ActiveStatus['holder'], statusId: ActiveStatus['statusId']) {
  return useGameStore(useShallow((state) => (holder === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses).filter((status) => status.statusId === statusId)))
}

function getLiveDuration(instances: ActiveStatus[], fallbackMs: number | null = null) {
  if (instances.length === 0) return { remainingMs: fallbackMs, initialDurationMs: fallbackMs }
  const hasInfinite = instances.some((status) => status.remainingMs === null)
  if (hasInfinite) return { remainingMs: null, initialDurationMs: null }
  const displayInstance = instances.reduce((best, status) => (status.remainingMs ?? 0) > (best.remainingMs ?? 0) ? status : best, instances[0])
  return { remainingMs: Math.max(...instances.map((status) => status.remainingMs ?? 0)), initialDurationMs: displayInstance.initialDurationMs ?? STATUS_DEFINITIONS[displayInstance.statusId]?.defaultDurationMs ?? fallbackMs }
}

function LiveStatusDuration({ holder, statusId, showBar = false }: { holder: ActiveStatus['holder']; statusId: ActiveStatus['statusId']; showBar?: boolean }) {
  const instances = useLiveStatusInstances(holder, statusId)
  const { remainingMs, initialDurationMs } = getLiveDuration(instances)
  const duration = remainingMs === null ? '∞' : formatTime(remainingMs ?? 0)
  const timed = showBar && remainingMs !== null && initialDurationMs !== null
  const percent = timed ? Math.max(0, Math.min(100, remainingMs! / Math.max(1, initialDurationMs!) * 100)) : 0
  return <>{duration}{timed && <span className="combat-status-duration-bar" style={{ '--status-duration-percent': `${percent}%` } as CSSProperties} aria-hidden="true" />}</>
}

function LiveStatusSourceRemaining({ holder, statusId, instanceKey, fallbackMs }: { holder: ActiveStatus['holder']; statusId: ActiveStatus['statusId']; instanceKey: string; fallbackMs: number | null }) {
  const instances = useLiveStatusInstances(holder, statusId)
  const instance = instances.find((status) => status.instanceKey === instanceKey)
  const remainingMs = instance?.remainingMs ?? (instance ? null : fallbackMs)
  return <>{remainingMs === null ? '∞' : formatTime(remainingMs ?? 0)}</>
}

function StatusIcon({ status }: { status: ActiveStatus }) {
  const definition = STATUS_DEFINITIONS[status.statusId]
  if (!definition) return null
  if (definition.tags.includes('dot')) return <Flame size={13} aria-hidden="true" />
  if (definition.tags.includes('control')) return <Snowflake size={13} aria-hidden="true" />
  if (definition.tags.includes('barrier')) return <Shield size={13} aria-hidden="true" />
  if (definition.classification === 'buff') return <Sparkles size={13} aria-hidden="true" />
  if (definition.classification === 'debuff') return <Zap size={13} aria-hidden="true" />
  return <HeartPulse size={13} aria-hidden="true" />
}
