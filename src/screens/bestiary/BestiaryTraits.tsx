import type { MonsterDefinition } from '../../game/content/monsters/whisperingWoods'
import { getMonsterTraits } from '../../game/systems/combat/traitRuntime'

export function BestiaryTraits({ monster }: { monster: MonsterDefinition }) {
  const traits = getMonsterTraits(monster)
  return <section className="bestiary-section"><span className="bestiary-section-label">TRAITS</span>{traits.length === 0 ? <p className="bestiary-muted">No recorded traits.</p> : <div className="bestiary-trait-list">{traits.map((trait) => <div key={trait.name}><strong>{trait.name}</strong><span>{trait.description}</span></div>)}</div>}</section>
}
