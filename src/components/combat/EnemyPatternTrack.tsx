import { RotateCw } from 'lucide-react'
import { memo, useMemo } from 'react'
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
  currentProgress?: number
  showLiveState?: boolean
  showRepeat?: boolean
  className?: string
  ariaLabel?: string
}

/** Shared compact icon rail for live Enemy Intel and static Bestiary dossiers. */
export const EnemyPatternTrack = memo(function EnemyPatternTrack({
  monster,
  steps,
  patternId,
  currentStepIndex = -1,
  currentStepId = null,
  currentActionId = null,
  currentPatternOriginId = null,
  currentProgress = 0,
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
    return { presentation, kind: classifyEnemyPatternStep(step, action) }
  }), [monster?.id, patternId, steps])

  return <div className={`combat-pattern-sequence${className ? ` ${className}` : ''}`} aria-label={ariaLabel}>
    {steps.map((step, index) => {
      const current = showLiveState && currentOriginMatchesPattern && (currentStepId ? step.id === currentStepId : currentActionId && step.type === 'action' ? step.actionId === currentActionId : index === currentStepIndex)
      const next = showLiveState && !current && steps.length > 0 && index === nextPatternIndex
      const { presentation, kind } = staticSteps[index]
      const state = current ? 'current' : next ? 'next' : showLiveState && index < currentStepIndex ? 'complete' : 'future'
      const label = `${presentation.name}, ${getEnemyPatternIconLabel(kind)}${current ? ', current action' : next ? ', next action' : ''}`

      return <span className="combat-pattern-node-wrap" key={step.id}>
        <GameTooltip block wide placement="bottom" accent={current ? 'warning' : 'neutral'} content={<EnemyActionTooltip action={presentation} />}>
          <button type="button" className={`combat-pattern-node${showLiveState ? ' combat-flow-pattern-node' : ''} is-${state} combat-pattern-icon-${kind}`} aria-label={label} aria-current={current ? 'step' : undefined}>
            <i><EnemyPatternIcon kind={kind} /></i>
            {showLiveState && current && <CurrentPatternProgress progress={currentProgress} />}
          </button>
        </GameTooltip>
        {index < steps.length - 1 && <span className="combat-pattern-arrow" aria-hidden="true">→</span>}
        {showRepeat && index === steps.length - 1 && <span className="combat-pattern-repeat" aria-label="Repeats"><RotateCw size={13} aria-hidden="true" /></span>}
      </span>
    })}
  </div>
})

function CurrentPatternProgress({ progress: rawProgress }: { progress: number }) {
  const progress = Math.max(0, Math.min(100, rawProgress))
  return <i className="combat-pattern-progress" style={{ transform: `scaleX(${progress / 100})` }} aria-hidden="true" />
}
