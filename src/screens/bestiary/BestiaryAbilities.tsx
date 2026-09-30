import { Clock3, Flame, Droplets, Wind, Mountain, Sparkles } from 'lucide-react'
import type { MonsterDefinition } from '../../game/content/monsters'
import { buildCombatActionPresentation } from '../../game/presentation/combat'
import { GameTooltip } from '../../components/ui'
import { EnemyActionTooltip } from '../../components/combat/EnemyActionTooltip'
import { formatTime } from '../../game/utils'
import { BestiaryEffectRow } from './BestiaryEffectRow'
import { ELEMENT_DEFINITIONS, ELEMENT_IDS } from '../../game/content/elements/elements'

const ELEMENT_ICONS = { fire: Flame, water: Droplets, air: Wind, earth: Mountain, arcane: Sparkles }

export function BestiaryAbilities({ monster }: { monster: MonsterDefinition }) {
  const actions = Object.values(monster.actions)
  return <section className="bestiary-section"><span className="bestiary-section-label">ACTIONS</span>{actions.length === 0 ? <p className="bestiary-muted">No recorded Actions.</p> : <div className="bestiary-ability-list">{actions.map((action) => {
    const presentation = buildCombatActionPresentation(action, { actor: 'enemy', kind: 'action', sourceMonsterId: monster.id }, { monster })
    const damageTypes = ELEMENT_IDS.filter((element) => presentation.effects.some((effect) => effect.damageType === element || effect.damageTypes?.includes(element)))
    return <GameTooltip key={action.id} block wide content={<EnemyActionTooltip action={presentation} />}>
      <div tabIndex={0} className="bestiary-ability-card"><div><strong>{presentation.name}</strong><span className="bestiary-ability-damage-types" aria-label={damageTypes.map((element) => ELEMENT_DEFINITIONS[element].name).join(' and ')}>{damageTypes.map((element) => { const Icon = ELEMENT_ICONS[element]; return <span key={element} aria-label={`${ELEMENT_DEFINITIONS[element].name} damage`} style={{ color: `var(--semantic-damage-${element})` }}><Icon size={13} aria-hidden="true" /></span> })}</span><small><Clock3 size={11} aria-hidden="true" />{formatTime(presentation.actionTimeMs)}</small></div><div className="bestiary-effect-row-list">{presentation.effects.map((effect, index) => <BestiaryEffectRow key={`${effect.label}-${index}`} effect={effect} />)}</div><p>{presentation.description}</p></div>
    </GameTooltip>
  })}</div>}</section>
}
