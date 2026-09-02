import type { ActionPattern } from '../../game/systems/combat/combatTypes'
import type { MonsterDefinition } from '../../game/content/monsters'
import { EnemyPatternTrack } from '../../components/combat/EnemyPatternTrack'

export function EnemyPatternRail({ pattern, enemy, currentStepIndex, currentStepId, currentActionId, currentPatternOriginId, currentProgress, currentActionDurationMs }: { pattern?: ActionPattern; enemy?: MonsterDefinition | null; currentStepIndex: number; currentStepId: string | null; currentActionId: string | null; currentPatternOriginId: string | null; currentProgress?: number | null; currentActionDurationMs?: number }) {
  if (!pattern) return <div className="combat-pattern-empty">No enemy pattern loaded.</div>
  const currentOriginIsDifferent = Boolean(currentPatternOriginId && currentPatternOriginId !== pattern.id && (currentStepId || currentActionId))
  const currentActionLabel = currentActionId ? enemy?.actions[currentActionId]?.name ?? 'Enemy Action' : 'Basic Attack'
  return <div className="combat-pattern-rail combat-flow-pattern-rail" aria-label="Enemy pattern">
    {currentOriginIsDifferent && <div className="combat-pattern-transition">
      <div><span className="combat-subsection-label">CURRENT ACTION</span><strong>{currentActionLabel}</strong></div>
      <div><span className="combat-subsection-label">NEXT PATTERN</span><strong>{pattern.id}</strong></div>
    </div>}
    <EnemyPatternTrack
      monster={enemy}
      steps={pattern.steps}
      patternId={pattern.id}
      currentStepIndex={currentStepIndex}
      currentStepId={currentStepId}
      currentActionId={currentActionId}
      currentPatternOriginId={currentPatternOriginId}
      currentProgress={currentProgress}
      currentActionDurationMs={currentActionDurationMs}
      showLiveState
      ariaLabel="Enemy pattern"
    />
  </div>
}
