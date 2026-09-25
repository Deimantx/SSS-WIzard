import type { MonsterDefinition } from '../../game/content/monsters'
import { getBestiaryTraitPresentations } from '../../game/presentation/bestiary/bestiaryPresentation'
import { BestiaryMechanicEffect } from './BestiaryMechanicEffect'

export function BestiaryTraits({ monster }: { monster: MonsterDefinition }) {
  const traits = getBestiaryTraitPresentations(monster)
  return <section className="bestiary-section"><span className="bestiary-section-label">TRAITS</span>{traits.length === 0 ? <p className="bestiary-muted">No recorded traits.</p> : <div className="bestiary-trait-list">{traits.map((trait) => <article key={trait.id}><strong>{trait.name}</strong><span>{trait.description}</span>{trait.passiveModifiers.length > 0 && <div className="bestiary-trait-details"><small>PASSIVE EFFECTS</small>{trait.passiveModifiers.map((modifier) => <p key={modifier}>{modifier}</p>)}</div>}{trait.triggers.map((trigger) => <div className="bestiary-trait-details" key={trigger.id}><small>{trigger.label}{trigger.oncePerEncounter ? ' · ONCE PER ENCOUNTER' : ''}</small><div className="bestiary-mechanic-effect-list">{trigger.effects.map((effect) => <BestiaryMechanicEffect key={effect.id} effect={effect} />)}</div></div>)}</article>)}</div>}</section>
}
