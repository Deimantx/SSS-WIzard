import { formatCombatEffect, type CombatActionPresentation } from '../../game/presentation/combat/combatActionPresentation'
import type { CombatEffect } from '../../game/systems/combat/combatTypes'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { formatTime } from '../../game/utils'

export function buildBasicAttackPresentation(basicDamage: number): CombatActionPresentation {
  const effect: CombatEffect = { type: 'deal-damage', target: 'opponent', damageType: 'physical', magnitude: { type: 'flat', value: basicDamage } }
  return { id: 'basic-attack', name: 'Basic Attack', description: 'A physical attack using the enemy\'s authored base damage.', telegraphMs: 0, effects: [formatCombatEffect(effect, { actor: 'enemy', kind: 'basic-attack' })] }
}

export function EnemyActionTooltip({ action }: { action: CombatActionPresentation }) {
  return <TooltipContent title={action.name} description={action.description}>
    <div className="tooltip-section"><small>ACTION TYPE</small><p>{action.id === 'basic-attack' ? 'BASIC ATTACK' : 'SPECIAL ACTION'}</p></div>
    {action.telegraphMs > 0 && <div className="tooltip-section"><small>TELEGRAPH</small><p>{formatTime(action.telegraphMs)}</p></div>}
    {action.recoveryMs !== undefined && <div className="tooltip-section"><small>RECOVERY</small><p>{formatTime(action.recoveryMs)}</p></div>}
    <div className="tooltip-section"><small>EFFECTS</small>{action.effects.map((effect, index) => <p key={`${effect.label}-${index}`}>{effect.label}{effect.value ? `: ${effect.value}` : ''}{effect.detail ? ` · ${effect.detail}` : ''}{effect.timeLabel ? ` · ${effect.timeLabel}` : ''}</p>)}</div>
  </TooltipContent>
}
