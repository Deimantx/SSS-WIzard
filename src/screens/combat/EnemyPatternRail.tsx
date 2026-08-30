import { Check } from 'lucide-react'
import type { ActionPattern, ActionStep } from '../../game/systems/combat/combatTypes'
import type { MonsterDefinition } from '../../game/content/monsters'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { buildCombatActionPresentation } from '../../game/presentation/combat'

export function EnemyPatternRail({ pattern, enemy, currentIndex, activeStepId, activeAction, activeOriginMatchesCurrent }: { pattern?: ActionPattern; enemy?: MonsterDefinition | null; currentIndex: number; activeStepId: string | null; activeAction: string | null; activeOriginMatchesCurrent: boolean }) {
  if (!pattern) return <div className="combat-pattern-empty">No action sequence loaded.</div>
  return <div className="combat-pattern-rail" aria-label="Enemy action sequence">{pattern.steps.map((step, index) => {
    const current = activeAction && !activeOriginMatchesCurrent ? index === currentIndex : activeStepId ? step.id === activeStepId : index === currentIndex
    const complete = !current && index < currentIndex
    const name = actionStepName(step, enemy)
    const action = step.type === 'action' ? enemy?.actions[step.actionId] : null
    const tooltip = action ? <TooltipContent title={action.name} description={buildCombatActionPresentation(action).description}><div className="tooltip-section"><small>TELEGRAPH</small><p>{(action.telegraphMs / 1000).toFixed(1)}s</p></div></TooltipContent> : <TooltipContent title="Basic Attack" description="A physical attack using the enemy's authored base damage." />
    return <span className="combat-pattern-node-wrap" key={step.id}><GameTooltip block accent={current ? 'warning' : 'neutral'} content={tooltip}><span className={`combat-pattern-node${current ? ' is-current' : complete ? ' is-complete' : ''}`} aria-current={current ? 'step' : undefined} tabIndex={0}><i>{complete ? <Check size={12} aria-hidden="true" /> : current ? '→' : '·'}</i><strong>{name}</strong></span></GameTooltip>{index < pattern.steps.length - 1 && <span className="combat-pattern-arrow" aria-hidden="true">→</span>}</span>
  })}</div>
}

function actionStepName(step: ActionStep, enemy?: MonsterDefinition | null) { return step.type === 'basic' ? 'Basic Attack' : enemy?.actions[step.actionId]?.name ?? 'Action' }
