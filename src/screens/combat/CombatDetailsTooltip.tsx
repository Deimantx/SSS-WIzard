import { resolveCombatSourceLabel } from '../../game/presentation/combat/combatSourcePresentation'
import type { CombatDetailsMode, CombatDetailsRowPresentation } from '../../game/presentation/combat'
import { formatUiCount } from '../../game/presentation/numbers'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'

const damageType = (row: CombatDetailsRowPresentation) => Object.entries(row.contribution.damageTypes).sort((left, right) => right[1] - left[1]).map(([type]) => type[0].toUpperCase() + type.slice(1)).join(' · ')

export function CombatDetailsTooltip({ mode, row }: { mode: CombatDetailsMode; row: CombatDetailsRowPresentation }) {
  const contribution = row.contribution
  const rateLabel = mode === 'healing' ? 'HPS' : mode === 'damage-taken' ? 'DTPS' : 'DPS'
  const percentLabel = mode === 'healing' ? '% HEALING' : mode === 'damage-taken' ? '% TAKEN' : '% DONE'
  const type = damageType(row)

  return <TooltipContent title={row.source.name} description={row.source.subtitle || undefined}>
    <div className="tooltip-row"><span>{mode === 'healing' ? 'HEALING' : 'DAMAGE'}</span><b className={mode === 'healing' ? 'semantic-positive' : 'semantic-negative'}>{formatUiCount(row.total)}</b></div>
    <div className="tooltip-row"><span>{rateLabel}</span><b>{row.rateLabel} /s</b></div>
    <div className="tooltip-row"><span>{percentLabel}</span><b>{row.percentLabel}</b></div>
    {mode === 'damage-taken' && contribution.barrierAbsorbed > 0 && <div className="tooltip-row"><span>ABSORBED BY BARRIER</span><b>{formatUiCount(contribution.barrierAbsorbed)}</b></div>}
    {mode === 'healing' && <>{contribution.effectiveHealing > 0 && <div className="tooltip-row"><span>EFFECTIVE HP HEAL</span><b className="semantic-positive">{formatUiCount(contribution.effectiveHealing)}</b></div>}{contribution.barrierAbsorbed > 0 && <div className="tooltip-row"><span>ABSORBED DAMAGE</span><b className="semantic-positive">{formatUiCount(contribution.barrierAbsorbed)}</b></div>}{contribution.barrierGranted > 0 && <><div className="tooltip-row"><span>BARRIER GRANTED</span><b>{formatUiCount(contribution.barrierGranted)}</b></div><div className="tooltip-row"><span>UNUSED / EXPIRED</span><b>{formatUiCount(Math.max(0, contribution.barrierGranted - contribution.barrierAbsorbed))}</b></div></>}{(contribution.effectiveHealing > 0 || contribution.overheal > 0) && <div className="tooltip-row"><span>OVERHEAL</span><b>{formatUiCount(contribution.overheal)}</b></div>}</>}
    <div className="tooltip-row"><span>EVENTS</span><b>{formatUiCount(contribution.events)}</b></div>
    {mode !== 'healing' && type && <div className="tooltip-row"><span>DAMAGE TYPE</span><b>{type}</b></div>}
    {mode === 'damage-taken' && contribution.barrierAbsorbed > 0 && <p>Damage Taken includes the full incoming amount, including damage absorbed by Barrier.</p>}
    {contribution.originSourceId && <div className="tooltip-section"><small>SOURCE</small><p>Applied by {resolveCombatSourceLabel({ kind: contribution.originSourceKind ?? contribution.kind, sourceId: contribution.originSourceId })}</p></div>}
  </TooltipContent>
}
