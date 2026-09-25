import type { MonsterDefinition } from '../../game/content/monsters'
import { getBestiaryBossSummaryTags } from '../../game/presentation/bestiary/bestiaryPresentation'

export function BestiaryBossSummary({ monster }: { monster: MonsterDefinition }) {
  const tags = getBestiaryBossSummaryTags(monster)
  if (tags.length === 0) return null
  return <div className="bestiary-boss-summary" aria-label="Boss encounter profile">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
}
