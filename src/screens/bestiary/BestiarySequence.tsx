import type { MonsterDefinition } from '../../game/content/monsters/whisperingWoods'

export function BestiarySequence({ monster }: { monster: MonsterDefinition }) {
  return <section className="bestiary-section"><span className="bestiary-section-label">ATTACK SEQUENCE</span><div className="bestiary-sequence">{monster.actionSequence.map((step, index) => <span key={`${step.id}-${index}`} className={step.kind === 'special' ? 'special' : ''}>{step.name}{index < monster.actionSequence.length - 1 && <b>→</b>}</span>)}<em>↻ repeat</em></div></section>
}
