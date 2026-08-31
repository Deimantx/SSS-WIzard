import { SPELLS } from '../../game/content/spells/spells'
import { getTraitDefinition } from '../../game/content/traits'
import { STATUS_DEFINITIONS } from '../../game/content/statuses'
import type { CombatDetailsMode, CombatDetailsRowPresentation } from '../../game/presentation/combat'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'

const exact = (value: number) => Math.round(Math.max(0, value)).toLocaleString()
const rate = (value: number) => Math.max(0, value).toFixed(1)
const percent = (value: number) => value > 0 && value < 0.1 ? '<0.1%' : `${value.toFixed(1)}%`
const damageType = (row: CombatDetailsRowPresentation) => Object.entries(row.contribution.damageTypes).sort((left, right) => right[1] - left[1]).map(([type]) => type[0].toUpperCase() + type.slice(1)).join(' · ')

const resolveOrigin = (id: string | undefined) => {
  if (!id) return undefined
  const spell = SPELLS[id as keyof typeof SPELLS]
  if (spell) return `Applied by ${spell.name}`
  const status = STATUS_DEFINITIONS[id as keyof typeof STATUS_DEFINITIONS]
  if (status) return `Applied by ${status.name}`
  const trait = getTraitDefinition(id)
  return trait ? `Applied by ${trait.name}` : undefined
}

export function CombatDetailsTooltip({ mode, row }: { mode: CombatDetailsMode; row: CombatDetailsRowPresentation }) {
  const contribution = row.contribution
  const rateLabel = mode === 'healing' ? 'HPS' : mode === 'damage-taken' ? 'DTPS' : 'DPS'
  const percentLabel = mode === 'healing' ? '% HEALING' : mode === 'damage-taken' ? '% TAKEN' : '% DONE'
  const type = damageType(row)

  return <TooltipContent title={row.source.name} description={row.source.subtitle || undefined}>
    <div className="tooltip-row"><span>{mode === 'healing' ? 'HEALING' : 'DAMAGE'}</span><b className={mode === 'healing' ? 'semantic-positive' : 'semantic-negative'}>{exact(row.total)}</b></div>
    <div className="tooltip-row"><span>{rateLabel}</span><b>{rate(row.rate)} /s</b></div>
    <div className="tooltip-row"><span>{percentLabel}</span><b>{percent(row.percent)}</b></div>
    {mode === 'damage-taken' && contribution.barrierAbsorbed > 0 && <div className="tooltip-row"><span>ABSORBED BY BARRIER</span><b>{exact(contribution.barrierAbsorbed)}</b></div>}
    {mode === 'healing' && <>{contribution.effectiveHealing > 0 && <div className="tooltip-row"><span>EFFECTIVE HP HEAL</span><b className="semantic-positive">{exact(contribution.effectiveHealing)}</b></div>}{contribution.barrierAbsorbed > 0 && <div className="tooltip-row"><span>ABSORBED DAMAGE</span><b className="semantic-positive">{exact(contribution.barrierAbsorbed)}</b></div>}{contribution.barrierGranted > 0 && <><div className="tooltip-row"><span>BARRIER GRANTED</span><b>{exact(contribution.barrierGranted)}</b></div><div className="tooltip-row"><span>UNUSED / EXPIRED</span><b>{exact(Math.max(0, contribution.barrierGranted - contribution.barrierAbsorbed))}</b></div></>}{(contribution.effectiveHealing > 0 || contribution.overheal > 0) && <div className="tooltip-row"><span>OVERHEAL</span><b>{exact(contribution.overheal)}</b></div>}</>}
    <div className="tooltip-row"><span>EVENTS</span><b>{contribution.events.toLocaleString()}</b></div>
    {mode !== 'healing' && type && <div className="tooltip-row"><span>DAMAGE TYPE</span><b>{type}</b></div>}
    {mode === 'damage-taken' && contribution.barrierAbsorbed > 0 && <p>Damage Taken includes the full incoming amount, including damage absorbed by Barrier.</p>}
    {resolveOrigin(contribution.originSourceId) && <div className="tooltip-section"><small>SOURCE</small><p>{resolveOrigin(contribution.originSourceId)}</p></div>}
  </TooltipContent>
}
