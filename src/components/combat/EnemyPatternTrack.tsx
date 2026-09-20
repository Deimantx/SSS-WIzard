import { RotateCw } from 'lucide-react'
import { memo, useMemo, type CSSProperties } from 'react'
import type { MonsterDefinition } from '../../game/content/monsters'
import { buildCombatActionPresentation, classifyEnemyPatternStep } from '../../game/presentation/combat'
import type { ActionStep } from '../../game/systems/combat/combatTypes'
import { GameTooltip } from '../ui'
import { EnemyActionTooltip, buildBasicAttackPresentation } from './EnemyActionTooltip'
import { EnemyPatternIcon, getEnemyPatternIconLabel } from './EnemyPatternIcon'

interface EnemyPatternTrackProps {
  monster?: MonsterDefinition | null
  steps: ActionStep[]
  patternId?: string
  currentStepIndex?: number
  currentStepId?: string | null
  currentActionId?: string | null
  currentPatternOriginId?: string | null
  currentProgress?: number | null
  currentActionDurationMs?: number
  showLiveState?: boolean
  showRepeat?: boolean
  className?: string
  ariaLabel?: string
}

/** Shared compact icon rail for live Enemy Intel and static Bestiary dossiers. */
export function EnemyPatternTrack({
  monster,
  steps,
  patternId,
  currentStepIndex = -1,
  currentStepId = null,
  currentActionId = null,
  currentPatternOriginId = null,
  currentProgress = null,
  currentActionDurationMs,
  showLiveState = false,
  showRepeat = false,
  className = '',
  ariaLabel = 'Enemy pattern',
}: EnemyPatternTrackProps) {
  const currentOriginIsDifferent = showLiveState && Boolean(currentPatternOriginId && patternId && currentPatternOriginId !== patternId && (currentStepId || currentActionId))
  const currentOriginMatchesPattern = !currentPatternOriginId || !patternId || currentPatternOriginId === patternId
  const nextPatternIndex = currentOriginIsDifferent ? 0 : steps.length > 0 ? (currentStepIndex + 1) % steps.length : -1
  const staticSteps = useMemo(() => steps.map((step) => {
    const action = step.type === 'action' ? monster?.actions[step.actionId] : undefined
    const presentation = action
      ? buildCombatActionPresentation(action, { actor: 'enemy', kind: 'action', sourceMonsterId: monster?.id }, { monster: monster ?? undefined })
      : buildBasicAttackPresentation(monster?.basicAttackDamage ?? 0, monster?.basicAttackTimeMs ?? 0)
    return { step, action, presentation, kind: classifyEnemyPatternStep(step, action) }
  }), [monster, patternId, steps])

  return <div className={`combat-pattern-sequence${className ? ` ${className}` : ''}`} aria-label={ariaLabel}>
    {staticSteps.map((staticStep, index) => {
      const { step, presentation, kind } = staticStep
      const current = showLiveState && currentOriginMatchesPattern && (currentStepId ? step.id === currentStepId : currentActionId && step.type === 'action' ? step.actionId === currentActionId : index === currentStepIndex)
      const next = showLiveState && !current && steps.length > 0 && index === nextPatternIndex
      const state = current ? 'current' : next ? 'next' : showLiveState && index < currentStepIndex ? 'complete' : 'future'

      return <span className="combat-pattern-node-wrap" key={step.id}>
        <EnemyPatternNode presentation={presentation} kind={kind} state={state} current={current} next={next} showLiveState={showLiveState} currentProgress={current ? currentProgress : undefined} />
        {index < steps.length - 1 && <span className="combat-pattern-arrow" aria-hidden="true">→</span>}
        {showRepeat && index === steps.length - 1 && <span className="combat-pattern-repeat" aria-label="Repeats"><RotateCw size={13} aria-hidden="true" /></span>}
      </span>
    })}
  </div>
}

const EnemyPatternNode = memo(function EnemyPatternNode({ presentation, kind, state, current, next, showLiveState, currentProgress }: { presentation: ReturnType<typeof buildCombatActionPresentation> | ReturnType<typeof buildBasicAttackPresentation>; kind: Parameters<typeof getEnemyPatternIconLabel>[0]; state: 'current' | 'next' | 'complete' | 'future'; current: boolean; next: boolean; showLiveState: boolean; currentProgress?: number | null }) {
  const label = `${presentation.name}, ${getEnemyPatternIconLabel(kind)}${current ? ', current action' : next ? ', next action' : ''}`
  const nodeStyle = current && currentProgress !== null && currentProgress !== undefined
    ? { '--pattern-progress': `${Math.max(0, Math.min(100, currentProgress))}%` } as CSSProperties
    : undefined
  return <GameTooltip block wide placement="bottom" accent={current ? 'warning' : 'neutral'} content={<EnemyActionTooltip action={presentation} />}>
    <button style={nodeStyle} type="button" className={`combat-pattern-node${showLiveState ? ' combat-flow-pattern-node' : ''} is-${state} combat-pattern-icon-${kind}`} aria-label={label} aria-current={current ? 'step' : undefined}>
      <i><EnemyPatternIcon kind={kind} /></i>
    </button>
  </GameTooltip>
})
