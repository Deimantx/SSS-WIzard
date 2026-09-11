import { Flame, HeartPulse, Shield, Snowflake, Sparkles, Zap } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import type { ActiveStatus } from '../../game/types'
import { STATUS_DEFINITIONS } from '../../game/content/statuses'
import { formatUiCombatRate } from '../../game/presentation/numbers'
import { getCombatStatusGroups, type CombatStatusGroupPresentation } from '../../game/presentation/combat/combatStatusPresentation'
import { formatTime } from '../../game/utils'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'

export function CombatStatusStrip({ statuses, label }: { statuses: ActiveStatus[]; label: string }) {
  const state = useGameStore()
  const groups = getCombatStatusGroups(statuses, state)
  return <section className={`combat-status-strip${groups.length ? ' is-active' : ' is-empty'}`} aria-label={label}><div className="combat-subsection-label">{label}</div>{groups.length ? <div className="combat-status-list">{groups.map((group) => <CombatStatusChip key={group.statusId} group={group} />)}</div> : <span className="combat-status-empty">None active</span>}</section>
}

export function CombatStatusChip({ group }: { group: CombatStatusGroupPresentation }) {
  const [isNew, setIsNew] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => setIsNew(false), 180)
    return () => window.clearTimeout(timer)
  }, [])
  const { definition } = group
  const duration = group.displayRemainingMs === null ? '\u221e' : formatTime(group.displayRemainingMs)
  const timed = group.displayRemainingMs !== null && group.displayInitialDurationMs !== null
  const durationPercent = timed ? Math.max(0, Math.min(100, group.displayRemainingMs! / Math.max(1, group.displayInitialDurationMs!) * 100)) : 0
  const style = timed ? { '--status-duration-percent': `${durationPercent}%` } as CSSProperties : undefined
  const stacks = group.definition.stacking.mode === 'stacks' ? group.totalStacks : 0
  const sources = group.sourceBreakdown
  const sourceCount = group.instances.length
  const accent = group.categoryKey === 'dot' ? 'danger' : group.categoryKey === 'control' ? 'mana' : group.categoryKey === 'buff' ? 'elemental' : group.categoryKey === 'debuff' ? 'warning' : 'neutral'
  const rate = group.totalCurrentRate
  const accessibleRate = rate !== undefined ? `, ${formatUiCombatRate(rate, 'damage per second')}` : ''
  const accessibleSources = sourceCount > 1 ? `, ${sourceCount} active sources` : ''
  const tooltip = <TooltipContent title={definition.name} description={definition.description}>
    <div className="tooltip-section"><small>TYPE</small><p>{group.categoryLabel}</p></div>
    <div className="tooltip-section"><small>REMAINING</small><p>{duration}</p></div>
    {definition.stacking.mode === 'stacks' && <div className="tooltip-section"><small>STACKS</small><p>{stacks}</p></div>}
    {sources.length > 0 && <div className="tooltip-section"><small>SOURCES</small><div className="combat-status-tooltip-sources">{sources.map((source) => <div className="combat-status-tooltip-source" key={source.instanceKey}><strong>{source.sourceLabel}</strong><span>{source.damagePerSecond !== undefined ? formatUiCombatRate(source.damagePerSecond, '/s') : 'Periodic effect'}</span><small>{source.remainingMs === null ? '\u221e' : formatTime(source.remainingMs)}</small></div>)}</div></div>}
    {rate !== undefined && <div className="tooltip-section"><small>TOTAL</small><p>{formatUiCombatRate(rate, '/s')}</p></div>}
  </TooltipContent>
  return <GameTooltip block accent={accent} content={tooltip}><span style={style} className={`combat-status-chip status-category-${group.categoryKey}${timed ? ' is-timed' : ''}${isNew ? ' is-new' : ''}`} tabIndex={0} aria-label={`${definition.name}, ${group.categoryLabel}${accessibleSources}${accessibleRate}, up to ${duration} remaining`}><span className="combat-status-icon"><StatusIcon status={group.instances[0]} /></span><strong>{definition.name}</strong>{stacks > 1 && <b>\u00d7{stacks}</b>}<small>{duration}</small></span></GameTooltip>
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
