import { Flame, HeartPulse, Shield, Snowflake, Sparkles, Zap } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import type { ActiveStatus } from '../../game/types'
import { STATUS_DEFINITIONS } from '../../game/content/statuses'
import { formatUiCombatRate } from '../../game/presentation/numbers'
import { getCombatStatusGroupDetails, getCombatStatusGroupsBasic, type CombatStatusGroupPresentation } from '../../game/presentation/combat/combatStatusPresentation'
import { formatTime } from '../../game/utils'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { resolveGameAssetIcon } from '../../ui/icons/gameAssetIcons'

export function CombatStatusStrip({ statuses, label }: { statuses: ActiveStatus[]; label: string }) {
  const groups = getCombatStatusGroupsBasic(statuses)
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
  const sourceCount = group.instances.length
  const accent = group.categoryKey === 'dot' ? 'danger' : group.categoryKey === 'control' ? 'mana' : group.categoryKey === 'buff' ? 'elemental' : group.categoryKey === 'debuff' ? 'warning' : 'neutral'
  const accessibleSources = sourceCount > 1 ? `, ${sourceCount} active sources` : ''
  return <GameTooltip block accent={accent} content={<CombatStatusTooltip group={group} />}><span style={style} className={`combat-status-chip status-category-${group.categoryKey}${timed ? ' is-timed' : ''}${isNew ? ' is-new' : ''}`} tabIndex={0} aria-label={`${definition.name}, ${group.categoryLabel}${accessibleSources}, up to ${duration} remaining`}><span className="combat-status-icon"><StatusIcon status={group.instances[0]} /></span><strong>{definition.name}</strong>{stacks > 1 && <b>\u00d7{stacks}</b>}<small>{duration}</small></span></GameTooltip>
}

function CombatStatusTooltip({ group }: { group: CombatStatusGroupPresentation }) {
  // Mounted only by the tooltip portal, so DoT calculations are absent from
  // the closed-chip render path.
  const state = useGameStore.getState()
  const holderStatuses = group.instances[0]?.holder === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses
  const currentGroup = getCombatStatusGroupsBasic(holderStatuses).find((entry) => entry.statusId === group.statusId) ?? group
  const detailed = getCombatStatusGroupDetails(currentGroup, state)
  const duration = detailed.displayRemainingMs === null ? '\u221e' : formatTime(detailed.displayRemainingMs)
  const stacks = detailed.definition.stacking.mode === 'stacks' ? detailed.totalStacks : 0
  const rate = detailed.totalCurrentRate
  return <TooltipContent title={detailed.definition.name} description={detailed.definition.description}>
    <div className="tooltip-section"><small>TYPE</small><p>{detailed.categoryLabel}</p></div>
    <div className="tooltip-section"><small>REMAINING</small><p>{duration}</p></div>
    {detailed.definition.stacking.mode === 'stacks' && <div className="tooltip-section"><small>STACKS</small><p>{stacks}</p></div>}
    {detailed.sourceBreakdown.length > 0 && <div className="tooltip-section"><small>SOURCES</small><div className="combat-status-tooltip-sources">{detailed.sourceBreakdown.map((source) => <div className="combat-status-tooltip-source" key={source.instanceKey}><strong>{source.sourceLabel}</strong><span>{source.damagePerSecond !== undefined ? formatUiCombatRate(source.damagePerSecond, '/s') : 'Periodic effect'}</span><small>{source.remainingMs === null ? '\u221e' : formatTime(source.remainingMs)}</small></div>)}</div></div>}
    {rate !== undefined && <div className="tooltip-section"><small>TOTAL</small><p>{formatUiCombatRate(rate, '/s')}</p></div>}
  </TooltipContent>
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
