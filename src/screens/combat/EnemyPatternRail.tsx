import { buildCombatActionPresentation, classifyEnemyPatternStep } from '../../game/presentation/combat'
import type { ActionPattern } from '../../game/systems/combat/combatTypes'
import type { MonsterDefinition } from '../../game/content/monsters'
import { GameTooltip } from '../../components/ui'
import { EnemyActionTooltip, buildBasicAttackPresentation } from './EnemyActionTooltip'
import { EnemyPatternIcon, getEnemyPatternIconLabel } from './EnemyPatternIcon'

export function EnemyPatternRail({ pattern, enemy, currentIndex, activeStepId, activeAction, activeOriginMatchesCurrent }: { pattern?: ActionPattern; enemy?: MonsterDefinition | null; currentIndex: number; activeStepId: string | null; activeAction: string | null; activeOriginMatchesCurrent: boolean }) {
  if (!pattern) return <div className="combat-pattern-empty">No enemy pattern loaded.</div>
  return <div className="combat-pattern-rail combat-flow-pattern-rail" aria-label="Enemy pattern">{pattern.steps.map((step, index) => {
    const current = activeAction && !activeOriginMatchesCurrent ? index === currentIndex : activeStepId ? step.id === activeStepId : index === currentIndex
    const next = !current && pattern.steps.length > 1 && index === (currentIndex + 1) % pattern.steps.length
    const action = step.type === 'action' ? enemy?.actions[step.actionId] : undefined
    const presentation = action ? buildCombatActionPresentation(action) : buildBasicAttackPresentation(enemy?.basicAttackDamage ?? 0)
    const kind = classifyEnemyPatternStep(step, action)
    const state = current ? 'current' : next ? 'next' : index < currentIndex ? 'complete' : 'future'
    const label = `${presentation.name}, ${getEnemyPatternIconLabel(kind)}${current ? ', current action' : next ? ', next action' : ''}`
    return <span className="combat-pattern-node-wrap combat-flow-pattern-node-wrap" key={step.id}><GameTooltip block wide placement="bottom" accent={current ? 'warning' : 'neutral'} content={<EnemyActionTooltip action={presentation} />}><button type="button" className={`combat-pattern-node combat-flow-pattern-node is-${state} combat-pattern-icon-${kind}`} aria-label={label} aria-current={current ? 'step' : undefined}><i><EnemyPatternIcon kind={kind} /></i></button></GameTooltip>{index < pattern.steps.length - 1 && <span className="combat-pattern-arrow combat-flow-pattern-arrow" aria-hidden="true">→</span>}</span>
  })}</div>
}
