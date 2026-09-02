import type { MonsterDefinition } from '../../game/content/monsters'
import type { ActionPattern } from '../../game/systems/combat/combatTypes'
import { EnemyPatternTrack } from './EnemyPatternTrack'

/** Static, tooltip-rich pattern preview. It intentionally has no live combat state. */
export function EnemyPatternPreview({ monster, pattern }: { monster: MonsterDefinition; pattern: ActionPattern }) {
  const label = pattern.id === monster.defaultActionPatternId ? 'Default' : pattern.id.split(/[-_]/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')
  return <div className="bestiary-pattern-preview" data-pattern-id={pattern.id}>
    <div className="bestiary-pattern-label"><strong>{label}</strong></div>
    <div className="combat-pattern-rail bestiary-pattern-track">
      <EnemyPatternTrack monster={monster} steps={pattern.steps} patternId={pattern.id} showRepeat ariaLabel={`${label} action pattern`} />
    </div>
  </div>
}
