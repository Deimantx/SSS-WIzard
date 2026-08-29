import { MONSTERS } from '../../game/data/monsters'
import { useGameStore } from '../../store/gameStore'
import { Card } from '../../components/ui'
import { formatTime } from '../../game/utils'
import { getCurrentEnemyActionStep, getEnemyAction, getEnemyActionPattern } from '../../game/systems/combat/actionRuntime'

export function CombatTimelinePanel() {
  const combat = useGameStore((state) => state.combat)
  const enemy = combat.enemyId ? MONSTERS[combat.enemyId] : null
  const state = useGameStore.getState()
  const pattern = enemy ? getEnemyActionPattern(state) : undefined
  const nextStep = enemy ? getCurrentEnemyActionStep(state) : undefined
  const activeAction = enemy ? getEnemyAction(state, combat.enemyTelegraphActionId) : undefined
  const currentAction = activeAction ?? (nextStep?.type === 'action' ? getEnemyAction(state, nextStep.actionId) : undefined)
  const activeStepId = combat.enemyTelegraphStepId
  const currentIndex = pattern && pattern.steps.length > 0 ? Math.max(0, combat.enemyActionIndex) % pattern.steps.length : -1

  return <Card title={`Enemy Pattern · ${pattern?.id ?? 'None'}`} className="timeline-card">
    <div className="timeline-row">{pattern ? pattern.steps.map((step, index) => {
      const current = activeStepId ? step.id === activeStepId : index === currentIndex
      return <div className={`timeline-step ${current ? 'current' : index < currentIndex ? 'complete' : ''}`} key={step.id}><span>{current ? '→' : index < currentIndex ? '✓' : '•'}</span><small>{step.type === 'basic' ? 'Basic' : enemy?.actions[step.actionId]?.name ?? step.actionId}</small></div>
    }) : <div className="muted">No enemy pattern loaded.</div>}</div>
    <div className={`telegraph ${activeAction ? 'active' : ''}`}>
      <div><strong>{activeAction ? activeAction.name : currentAction?.name ?? 'Next action'}</strong><span>{activeAction ? `${formatTime(combat.enemyTelegraphMs)} telegraph remaining` : 'The pattern advances on the enemy clock.'}</span></div>
      {currentAction && <span>{currentAction.description} · {currentAction.interruptible === false ? 'Uninterruptible' : 'Interruptible'}</span>}
    </div>
  </Card>
}
