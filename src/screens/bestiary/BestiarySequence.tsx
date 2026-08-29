import type { MonsterDefinition } from '../../game/content/monsters'

export function BestiarySequence({ monster }: { monster: MonsterDefinition }) {
  return <section className="bestiary-section"><span className="bestiary-section-label">ACTION PATTERN</span>{Object.values(monster.actionPatterns).map((pattern) => <div className="bestiary-pattern" key={pattern.id}><strong>{pattern.id === monster.defaultActionPatternId ? 'Default' : pattern.id}</strong><div className="bestiary-sequence">{pattern.steps.map((step, index) => <span key={`${step.id}-${index}`} className={step.type === 'action' ? 'special' : ''}>{step.type === 'basic' ? 'Basic' : monster.actions[step.actionId]?.name ?? step.actionId}{index < pattern.steps.length - 1 && <b>→</b>}</span>)}<em>↻ repeat</em></div></div>)}</section>
}
