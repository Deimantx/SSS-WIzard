import type { MonsterDefinition } from '../../game/content/monsters'
import { buildCombatActionPresentation, classifyEnemyPatternStep } from '../../game/presentation/combat'
import type { ActionPattern } from '../../game/systems/combat/combatTypes'
import { GameTooltip } from '../ui'
import { EnemyActionTooltip, buildBasicAttackPresentation } from './EnemyActionTooltip'
import { EnemyPatternIcon, getEnemyPatternIconLabel } from './EnemyPatternIcon'

/** Static, tooltip-rich pattern preview. It intentionally has no live combat state. */
export function EnemyPatternPreview({ monster, pattern }: { monster: MonsterDefinition; pattern: ActionPattern }) {
  return <div className="enemy-pattern-preview" data-pattern-id={pattern.id}>
    <div className="enemy-pattern-preview-head"><strong>{pattern.id === monster.defaultActionPatternId ? 'DEFAULT PATTERN' : pattern.id}</strong><span>REPEATS</span></div>
    <div className="enemy-pattern-preview-sequence" aria-label={`${pattern.id} action pattern`}>
      {pattern.steps.map((step, index) => {
        const action = step.type === 'action' ? monster.actions[step.actionId] : undefined
        const presentation = action ? buildCombatActionPresentation(action) : buildBasicAttackPresentation(monster.basicAttackDamage, monster.basicAttackTimeMs)
        const kind = classifyEnemyPatternStep(step, action)
        const label = `${presentation.name}, ${getEnemyPatternIconLabel(kind)}`
        return <span className="enemy-pattern-preview-node-wrap" key={step.id}>
          <GameTooltip block wide placement="bottom" content={<EnemyActionTooltip action={presentation} />}>
            <button type="button" className={`enemy-pattern-preview-node combat-pattern-icon-${kind}`} aria-label={label}><i><EnemyPatternIcon kind={kind} /></i><span>{presentation.name}</span></button>
          </GameTooltip>
          {index < pattern.steps.length - 1 && <b className="enemy-pattern-preview-arrow" aria-hidden="true">&#8594;</b>}
        </span>
      })}
    </div>
    <span className="enemy-pattern-preview-repeat" aria-hidden="true">&#8635;</span>
  </div>
}
