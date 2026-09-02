import { RotateCw } from 'lucide-react'
import type { CSSProperties } from 'react'
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

  return <div className={`combat-pattern-sequence${className ? ` ${className}` : ''}`} aria-label={ariaLabel}>
    {steps.map((step, index) => {
      const current = showLiveState && currentOriginMatchesPattern && (currentStepId ? step.id === currentStepId : currentActionId && step.type === 'action' ? step.actionId === currentActionId : index === currentStepIndex)
      const next = showLiveState && !current && steps.length > 0 && index === nextPatternIndex
      const action = step.type === 'action' ? monster?.actions[step.actionId] : undefined
      const presentation = action
        ? buildCombatActionPresentation(action)
        : buildBasicAttackPresentation(monster?.basicAttackDamage ?? 0, current ? currentActionDurationMs ?? monster?.basicAttackTimeMs ?? 0 : monster?.basicAttackTimeMs ?? 0)
      const kind = classifyEnemyPatternStep(step, action)
      const state = current ? 'current' : next ? 'next' : showLiveState && index < currentStepIndex ? 'complete' : 'future'
      const label = `${presentation.name}, ${getEnemyPatternIconLabel(kind)}${current ? ', current action' : next ? ', next action' : ''}`
      const nodeStyle = current && currentProgress !== null && currentProgress !== undefined
        ? { '--pattern-progress': `${Math.max(0, Math.min(100, currentProgress))}%` } as CSSProperties
        : undefined

      return <span className="combat-pattern-node-wrap" key={step.id}>
        <GameTooltip block wide placement="bottom" accent={current ? 'warning' : 'neutral'} content={<EnemyActionTooltip action={presentation} />}>
          <button style={nodeStyle} type="button" className={`combat-pattern-node${showLiveState ? ' combat-flow-pattern-node' : ''} is-${state} combat-pattern-icon-${kind}`} aria-label={label} aria-current={current ? 'step' : undefined}>
            <i><EnemyPatternIcon kind={kind} /></i>
          </button>
        </GameTooltip>
        {index < steps.length - 1 && <span className="combat-pattern-arrow" aria-hidden="true">→</span>}
        {showRepeat && index === steps.length - 1 && <span className="combat-pattern-repeat" aria-label="Repeats"><RotateCw size={13} aria-hidden="true" /></span>}
      </span>
    })}
  </div>
}
