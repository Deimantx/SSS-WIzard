import type { MonsterDefinition } from '../../game/content/monsters'
import { EnemyPatternPreview } from '../../components/combat/EnemyPatternPreview'

export function BestiarySequence({ monster }: { monster: MonsterDefinition }) {
  return <section className="bestiary-section"><span className="bestiary-section-label">ACTION PATTERN</span><div className="bestiary-pattern-list">{Object.values(monster.actionPatterns).map((pattern) => <EnemyPatternPreview key={pattern.id} monster={monster} pattern={pattern} />)}</div></section>
}
