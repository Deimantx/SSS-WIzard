import { SPELLS } from '../../game/content/spells/spells'
import { getTraitDefinition } from '../../game/content/traits'
import { STATUS_DEFINITIONS } from '../../game/content/statuses'
import type { CombatDetailsMode, CombatDetailsRowPresentation } from '../../game/presentation/combat'
import { getCombatMetricRate } from '../../game/telemetry/combat/combatTelemetryAggregator'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'

const exact = (value: number) => Math.round(Math.max(0, value)).toLocaleString()
const percent = (value: number) => value > 0 && value < 0.1 ? '<0.1%' : `${value.toFixed(1)}%`
const sourceKindLabel = (kind: CombatDetailsRowPresentation['contribution']['kind']) => kind === 'basic-attack' ? 'Basic Attack' : kind === 'spell' ? 'Spell' : kind === 'action' ? 'Enemy Action' : kind === 'status' ? 'Status Effect' : kind === 'trait' ? 'Trait Effect' : 'Combat Effect'

const resolveOrigin = (id: string | undefined) => {
  if (!id) return undefined
  const spell = SPELLS[id as keyof typeof SPELLS]
  if (spell) return `Applied by ${spell.name}`
  const status = STATUS_DEFINITIONS[id as keyof typeof STATUS_DEFINITIONS]
  if (status) return `Applied by ${status.name}`
  const trait = getTraitDefinition(id)
  return trait ? `Applied by ${trait.name}` : undefined
}

export function CombatDetailsTooltip({ mode, row, scopeLabel, engagedMs }: { mode: CombatDetailsMode; row: CombatDetailsRowPresentation; scopeLabel: string; engagedMs: number }) {
  const contribution = row.contribution
  const rateLabel = mode === 'healing' ? 'HPS' : mode === 'damage-taken' ? 'DTPS' : 'DPS'
  const details = mode === 'healing'
    ? <><div className="tooltip-row"><span>EFFECTIVE</span><b className="semantic-positive">{exact(contribution.effectiveHealing || contribution.total)}</b></div><div className="tooltip-row"><span>OVERHEAL</span><b>{exact(contribution.overheal)}</b></div><div className="tooltip-row"><span>OVERHEAL RATE</span><b>{exact(getCombatMetricRate(contribution.overheal, engagedMs))}/s</b></div></>
    : <><div className="tooltip-row"><span>HP DAMAGE</span><b className="semantic-negative">{exact(contribution.healthDamage)}</b></div><div className="tooltip-row"><span>BARRIER ABSORBED</span><b>{exact(contribution.barrierAbsorbed)}</b></div>{mode === 'damage-taken' && <p>Includes damage absorbed by Barrier.</p>}{Object.keys(contribution.damageTypes).length > 0 && <div className="tooltip-row"><span>DAMAGE TYPE</span><b>{Object.entries(contribution.damageTypes).sort((left, right) => right[1] - left[1]).map(([type]) => type.toUpperCase()).join(' · ')}</b></div>}</>
  return <TooltipContent title={row.source.name} description={row.source.subtitle}><div className="tooltip-row"><span>TOTAL</span><b className={mode === 'healing' ? 'semantic-positive' : 'semantic-negative'}>{exact(row.total)}</b></div><div className="tooltip-row"><span>{rateLabel}</span><b>{exact(row.rate)} /s</b></div><div className="tooltip-row"><span>SHARE</span><b>{percent(row.percent)}</b></div><div className="tooltip-row"><span>EVENTS</span><b>{contribution.events.toLocaleString()}</b></div>{details}<div className="tooltip-section"><small>SOURCE</small><p>{contribution.actor === 'player' ? 'Player' : 'Enemy'} · {sourceKindLabel(contribution.kind)} · {scopeLabel}</p>{resolveOrigin(contribution.originSourceId) && <p>{resolveOrigin(contribution.originSourceId)}</p>}</div></TooltipContent>
}
