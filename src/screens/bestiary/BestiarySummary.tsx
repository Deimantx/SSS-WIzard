import { ArchiveProgressTile, Card, Progress } from '../../components/ui'
import { BESTIARY_CATEGORIES, BESTIARY_CATEGORY_LABELS, getBestiaryCompletion } from '../../game/systems/bestiary/bestiarySelectors'
import type { BestiaryCategory, GameState } from '../../game/types'

export function BestiarySummary({ progress }: { progress: GameState['progress'] }) {
  const completion = getBestiaryCompletion({ progress })
  const categories = BESTIARY_CATEGORIES.filter((category): category is BestiaryCategory => category !== 'all')
  return <Card title="BESTIARY PROGRESS" className="bestiary-summary"><div className="archive-summary-head"><div><span className="archive-summary-label">DISCOVERED</span><strong>{completion.discovered} / {completion.total}</strong></div><div><span className="archive-summary-label">COMPLETION</span><strong>{completion.percent}%</strong></div></div><Progress value={completion.percent} tone="violet" /><div className="archive-progress-grid bestiary-progress-grid">{categories.map((category) => <ArchiveProgressTile key={category} label={BESTIARY_CATEGORY_LABELS[category]} discovered={completion.categories[category].discovered} total={completion.categories[category].total} />)}</div><div className="bestiary-total-defeats"><span>TOTAL DEFEATS</span><strong>{completion.totalDefeats.toLocaleString()}</strong></div></Card>
}
