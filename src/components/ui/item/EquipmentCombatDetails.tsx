import type { ItemDefinition } from '../../../game/types'
import { getEquipmentCombatPresentation } from '../../../game/presentation/equipment/equipmentCombatPresentation'

export function EquipmentCombatDetails({ item, compact = false }: { item: Pick<ItemDefinition, 'combat'>; compact?: boolean }) {
  const presentation = getEquipmentCombatPresentation(item)
  if (presentation.modifiers.length === 0 && presentation.rules.length === 0) return null
  return <div className={`equipment-combat-details${compact ? ' is-compact' : ''}`}>
    {presentation.modifiers.length > 0 && <section className="equipment-combat-detail-section"><span>COMBAT EFFECTS</span>{presentation.modifiers.map((line) => <p key={line}>{line}</p>)}</section>}
    {presentation.rules.length > 0 && <section className="equipment-combat-detail-section"><span>SPECIAL EFFECTS</span>{presentation.rules.map((rule) => <div className="equipment-combat-rule" key={rule.id}><strong>{rule.name ?? rule.trigger}</strong>{rule.description && <p>{rule.description}</p>}{rule.condition && <p>{rule.condition}</p>}{rule.effects.map((effect) => <p key={effect}>{effect}</p>)}{rule.cooldown && <small>{rule.cooldown}</small>}</div>)}</section>}
  </div>
}
