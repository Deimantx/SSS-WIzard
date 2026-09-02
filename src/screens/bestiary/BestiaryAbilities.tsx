import { Clock3 } from 'lucide-react'
import type { MonsterDefinition } from '../../game/content/monsters'
import { buildCombatActionPresentation } from '../../game/presentation/combat'
import { GameTooltip } from '../../components/ui'
import { CombatEffectChip } from '../../components/combat/CombatEffectChip'
import { EnemyActionTooltip } from '../../components/combat/EnemyActionTooltip'
import { formatTime } from '../../game/utils'

export function BestiaryAbilities({ monster }: { monster: MonsterDefinition }) {
  const actions = Object.values(monster.actions)
  return <section className="bestiary-section"><span className="bestiary-section-label">ACTIONS</span>{actions.length === 0 ? <p className="bestiary-muted">No recorded Actions.</p> : <div className="bestiary-ability-list">{actions.map((action) => {
    const presentation = buildCombatActionPresentation(action, { actor: 'enemy', kind: 'action', sourceMonsterId: monster.id }, { monster })
    return <GameTooltip key={action.id} block wide content={<EnemyActionTooltip action={presentation} />}>
      <div tabIndex={0} className="bestiary-ability-card"><div><strong>{presentation.name}</strong><small><Clock3 size={11} aria-hidden="true" />{formatTime(presentation.actionTimeMs)}</small></div><p>{presentation.description}</p><div className="bestiary-ability-effects">{presentation.effects.map((effect, index) => <CombatEffectChip key={`${effect.label}-${index}`} effect={effect} />)}</div></div>
    </GameTooltip>
  })}</div>}</section>
}
