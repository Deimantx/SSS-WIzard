import { TooltipContent } from '../ui/tooltip/Tooltip'
import type { CombatStatusGroupPresentation } from '../../game/presentation/combat'
import { buildCombatStatusDetailPresentation, formatCombatStatusDuration } from '../../game/presentation/combat'
import type { CombatEffect, StatusId } from '../../game/systems/combat/combatTypes'
import { formatUiCombatRate } from '../../game/presentation/numbers'
import { formatTime } from '../../game/utils'
import { getCombatStatusGroupDetails, getCombatStatusGroupsBasic } from '../../game/presentation/combat/combatStatusPresentation'
import { useGameStore } from '../../store/gameStore'

interface StaticStatusTooltipProps {
  statusId: StatusId
  durationMs?: number | null
  periodicEffects?: CombatEffect[]
  modifierOverrides?: Partial<Record<import('../../game/systems/combat/combatTypes').ModifierKey, number>>
}

interface LiveStatusTooltipProps {
  group: CombatStatusGroupPresentation
}

/** Full status explanation shared by live combat status chips and Bestiary mechanic references. */
export function CombatStatusTooltip(props: StaticStatusTooltipProps | LiveStatusTooltipProps) {
  const active = 'group' in props ? resolveLiveStatus(props.group) : null
  const staticProps = 'statusId' in props ? props : null
  const detail = active
    ? buildCombatStatusDetailPresentation(active.statusId, { durationMs: active.durationMs, periodicEffects: active.periodicEffects, modifierOverrides: active.modifierOverrides })
    : buildCombatStatusDetailPresentation(staticProps!.statusId, { durationMs: staticProps!.durationMs, periodicEffects: staticProps!.periodicEffects, modifierOverrides: staticProps!.modifierOverrides })
  const remainingLabel = active ? active.remainingMs === null ? 'Permanent' : formatCombatStatusDuration(active.remainingMs) : null
  const stacks = active?.stacks
  const rate = active?.totalCurrentRate
  return <TooltipContent title={detail.name} description={detail.description}>
    <div className="tooltip-section"><small>TYPE</small><p>{detail.classificationLabel}</p></div>
    {detail.modifiers.length > 0 && <div className="tooltip-section"><small>MODIFIERS</small><div className="combat-status-tooltip-lines">{detail.modifiers.map((modifier) => <p key={modifier}>{modifier}</p>)}</div></div>}
    {detail.periodic && <div className="tooltip-section"><small>PERIODIC EFFECT</small><div className="combat-status-tooltip-lines">{detail.periodic.effects.map((effect) => <p key={effect}>{effect}</p>)}<p>Tick interval: {detail.periodic.intervalLabel}</p>{detail.periodic.tickCount > 0 && <p>Ticks: {detail.periodic.tickCount}</p>}{detail.periodic.totalEffects.map((effect) => <p key={effect}>{effect}</p>)}</div></div>}
    <div className="tooltip-section"><small>{active ? 'REMAINING' : 'DURATION'}</small><p>{remainingLabel ?? detail.durationLabel}</p></div>
    {active && detail.durationMs !== null && <div className="tooltip-section"><small>AUTHORED DURATION</small><p>{detail.durationLabel}</p></div>}
    <div className="tooltip-section"><small>STACKING</small><p>{detail.stackingLabel}{detail.maxStacks !== undefined ? ` · Max ${detail.maxStacks}` : ''}{stacks !== undefined && detail.stackingLabel === 'Stacks' ? ` · Current ${stacks}` : ''}</p></div>
    {(detail.cleanseable || detail.dispellable || detail.preventsAction || detail.preventsSpellCast) && <div className="tooltip-section"><small>RULES</small><div className="combat-status-tooltip-lines"><p>Cleanseable: {detail.cleanseable ? 'Yes' : 'No'}</p><p>Dispellable: {detail.dispellable ? 'Yes' : 'No'}</p>{detail.preventsAction && <p>Prevents normal actions</p>}{detail.preventsSpellCast && <p>Prevents Spell casts</p>}</div></div>}
    {active?.sourceBreakdown.length ? <div className="tooltip-section"><small>SOURCES</small><div className="combat-status-tooltip-sources">{active.sourceBreakdown.map((source) => <div className="combat-status-tooltip-source" key={source.instanceKey}><strong>{source.sourceLabel}</strong><span>{source.damagePerSecond !== undefined ? formatUiCombatRate(source.damagePerSecond, '/s') : 'Periodic effect'}</span><small>{source.remainingMs === null ? '∞' : formatTime(source.remainingMs)}</small></div>)}</div></div> : null}
    {rate !== undefined && <div className="tooltip-section"><small>TOTAL RATE</small><p>{formatUiCombatRate(rate, '/s')}</p></div>}
  </TooltipContent>
}

function resolveLiveStatus(group: CombatStatusGroupPresentation) {
  const state = useGameStore.getState()
  const holderStatuses = group.instances[0]?.holder === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses
  const currentGroup = getCombatStatusGroupsBasic(holderStatuses).find((entry) => entry.statusId === group.statusId) ?? group
  const detailed = getCombatStatusGroupDetails(currentGroup, state)
  const instance = detailed.instances[0]
  return {
    statusId: detailed.statusId,
    durationMs: detailed.displayInitialDurationMs,
    remainingMs: detailed.displayRemainingMs,
    stacks: detailed.totalStacks,
    periodicEffects: instance?.periodicEffects,
    modifierOverrides: instance?.modifierOverrides,
    sourceBreakdown: detailed.sourceBreakdown,
    totalCurrentRate: detailed.totalCurrentRate,
  }
}
