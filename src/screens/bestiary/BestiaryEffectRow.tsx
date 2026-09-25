import { GameTooltip } from '../../components/ui'
import { CombatStatusTooltip } from '../../components/combat/CombatStatusTooltip'
import type { CombatEffectPresentation } from '../../game/presentation/combat'

const capitalize = (value: string) => `${value[0]?.toUpperCase() ?? ''}${value.slice(1)}`

export function BestiaryEffectRow({ effect }: { effect: CombatEffectPresentation }) {
  const headline = effect.kind === 'damage' && effect.value
    ? `${effect.value}${effect.damageType ? ` ${capitalize(effect.damageType)}` : ''} Damage`
    : effect.kind === 'heal' && effect.value
      ? `${effect.value} Health`
      : effect.kind === 'barrier' && effect.value
        ? `${effect.value} Barrier`
        : effect.kind === 'status'
          ? effect.label.replace(/^Applies /, '')
          : effect.value ? `${effect.label}: ${effect.value}` : effect.label
  const details = [
    effect.scalingLabel,
    effect.lifeStealLabel,
    effect.kind === 'status' && effect.timeLabel ? `Duration: ${effect.timeLabel}` : undefined,
    effect.kind !== 'status' ? effect.detail?.replace(/^Target: (Player|Enemy)$/, '') : undefined,
  ].filter(Boolean)
  const row = <div className={`bestiary-effect-row bestiary-effect-row-${effect.tone}`}>
    <span className="bestiary-effect-row-kind">{effect.kind.toUpperCase()}</span>
    <div><strong>{headline}</strong>{details.map((detail) => <small key={detail}>{detail}</small>)}</div>
  </div>
  if (!effect.statusId) return row
  return <GameTooltip block wide content={<CombatStatusTooltip statusId={effect.statusId} durationMs={effect.durationMs} periodicEffects={effect.periodicEffects} />}>
    <span tabIndex={0} role="button" aria-label={`${headline} status details`} className="bestiary-effect-row-trigger">{row}</span>
  </GameTooltip>
}
