import type { MonsterDefinition } from '../../game/content/monsters/whisperingWoods'

export function BestiaryTraits({ monster }: { monster: MonsterDefinition }) {
  return <section className="bestiary-section"><span className="bestiary-section-label">TRAITS</span>{monster.traits.length === 0 ? <p className="bestiary-muted">No recorded traits.</p> : <div className="bestiary-trait-list">{monster.traits.map((trait) => <div key={trait.name}><strong>{trait.name}</strong><span>{trait.description}</span></div>)}</div>}</section>
}
