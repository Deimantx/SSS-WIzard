import { buildCombatActionPresentation, classifyEnemyPatternStep } from '../../game/presentation/combat'
import type { ActionPattern } from '../../game/systems/combat/combatTypes'
import type { MonsterDefinition } from '../../game/content/monsters'
import { GameTooltip } from '../../components/ui'
import { EnemyActionTooltip, buildBasicAttackPresentation } from '../../components/combat/EnemyActionTooltip'
import { EnemyPatternIcon, getEnemyPatternIconLabel } from '../../components/combat/EnemyPatternIcon'

export function EnemyPatternRail({ pattern, enemy, currentStepIndex, currentStepId, currentActionId, currentPatternOriginId, currentProgress, currentActionDurationMs }: { pattern?: ActionPattern; enemy?: MonsterDefinition | null; currentStepIndex: number; currentStepId: string | null; currentActionId: string | null; currentPatternOriginId: string | null; currentProgress?: number | null; currentActionDurationMs?: number }) {
  if (!pattern) return <div className="combat-pattern-empty">No enemy pattern loaded.</div>
  const currentOriginIsDifferent = Boolean(currentPatternOriginId && currentPatternOriginId !== pattern.id && (currentStepId || currentActionId))
  const currentActionLabel = currentActionId ? enemy?.actions[currentActionId]?.name ?? 'Enemy Action' : 'Basic Attack'
  const nextPatternIndex = currentOriginIsDifferent ? 0 : (currentStepIndex + 1) % pattern.steps.length
  return <div className="combat-pattern-rail combat-flow-pattern-rail" aria-label="Enemy pattern">{currentOriginIsDifferent && <div className="combat-pattern-transition"><div><span className="combat-subsection-label">CURRENT ACTION</span><strong>{currentActionLabel}</strong></div><div><span className="combat-subsection-label">NEXT PATTERN</span><strong>{pattern.id}</strong></div></div>}<div className="combat-pattern-sequence">{pattern.steps.map((step, index) => {
    const currentOriginMatchesPattern = !currentPatternOriginId || currentPatternOriginId === pattern.id
    const current = currentOriginMatchesPattern && (currentStepId ? step.id === currentStepId : currentActionId && step.type === 'action' ? step.actionId === currentActionId : index === currentStepIndex)
    const next = !current && pattern.steps.length > 0 && index === nextPatternIndex
    const action = step.type === 'action' ? enemy?.actions[step.actionId] : undefined
    const presentation = action ? buildCombatActionPresentation(action) : buildBasicAttackPresentation(enemy?.basicAttackDamage ?? 0, current ? currentActionDurationMs ?? enemy?.basicAttackTimeMs ?? 0 : enemy?.basicAttackTimeMs ?? 0)
    const kind = classifyEnemyPatternStep(step, action)
    const state = current ? 'current' : next ? 'next' : index < currentStepIndex ? 'complete' : 'future'
    const label = `${presentation.name}, ${getEnemyPatternIconLabel(kind)}${current ? ', current action' : next ? ', next action' : ''}`
    const nodeStyle = current && currentProgress !== null && currentProgress !== undefined ? { '--pattern-progress': `${Math.max(0, Math.min(100, currentProgress))}%` } as React.CSSProperties : undefined
    return <span className="combat-pattern-node-wrap combat-flow-pattern-node-wrap" key={step.id}><GameTooltip block wide placement="bottom" accent={current ? 'warning' : 'neutral'} content={<EnemyActionTooltip action={presentation} />}><button style={nodeStyle} type="button" className={`combat-pattern-node combat-flow-pattern-node is-${state} combat-pattern-icon-${kind}`} aria-label={label} aria-current={current ? 'step' : undefined}><i><EnemyPatternIcon kind={kind} /></i></button></GameTooltip>{index < pattern.steps.length - 1 && <span className="combat-pattern-arrow combat-flow-pattern-arrow" aria-hidden="true">→</span>}</span>
  })}</div></div>
}
