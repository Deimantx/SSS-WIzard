import { GameTooltip } from '../../components/ui'
import { CombatStatusTooltip } from '../../components/combat/CombatStatusTooltip'
import type { BestiaryMechanicEffectPresentation } from '../../game/presentation/bestiary/bestiaryPresentation'

export function BestiaryMechanicEffect({ effect }: { effect: BestiaryMechanicEffectPresentation }) {
  const content = <span className={`bestiary-mechanic-effect bestiary-mechanic-effect-${effect.kind}`}>
    <strong>{effect.label}</strong>
    {effect.detail && <small>{effect.detail}</small>}
  </span>
  if (!effect.statusId) return content
  return <GameTooltip block wide content={<CombatStatusTooltip statusId={effect.statusId} durationMs={effect.durationMs} periodicEffects={effect.periodicEffects} />}>
    <span tabIndex={0} role="button" aria-label={`${effect.label} status details`} className="bestiary-mechanic-effect-trigger">{content}</span>
  </GameTooltip>
}
