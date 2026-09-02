import { formatCombatEffect, type CombatActionPresentation } from '../../game/presentation/combat/combatActionPresentation'
import type { CombatEffect } from '../../game/systems/combat/combatTypes'
import { TooltipContent } from '../ui/tooltip/Tooltip'
import { formatTime } from '../../game/utils'
import { CombatEffectChip } from './CombatEffectChip'

export function buildBasicAttackPresentation(basicDamage: number, actionTimeMs = 0): CombatActionPresentation {
  const effect: CombatEffect = { type: 'deal-damage', target: 'opponent', damageType: 'physical', magnitude: { type: 'flat', value: basicDamage } }
  return { id: 'basic-attack', name: 'Basic Attack', description: 'A physical attack using the enemy\'s authored base damage.', actionTimeMs, effects: [formatCombatEffect(effect, { actor: 'enemy', kind: 'basic-attack' })] }
}

/** Full authored action explanation shared by live combat and Bestiary previews. */
export function EnemyActionTooltip({ action }: { action: CombatActionPresentation }) {
  return <TooltipContent title={action.name} description={action.description}>
    <div className="tooltip-section"><small>ACTION TYPE</small><p>{action.id === 'basic-attack' ? 'BASIC ATTACK' : 'SPECIAL ACTION'}</p></div>
    <div className="tooltip-section"><small>ACTION TIME</small><p>{action.actionTimeMs > 0 ? formatTime(action.actionTimeMs) : 'Runtime dependent'}</p></div>
    <div className="tooltip-section"><small>EFFECTS</small><div className="enemy-intel-tooltip-effects">{action.effects.map((effect, index) => <CombatEffectChip detailed key={`${effect.label}-${index}`} effect={effect} />)}</div></div>
  </TooltipContent>
}
