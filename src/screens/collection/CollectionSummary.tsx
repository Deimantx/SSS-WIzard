import { ArchiveProgressTile, Card, Progress } from '../../components/ui'
import { getCollectionCategoryCounts, getCollectionCompletion } from '../../game/systems/collection/collectionSelectors'
import { CATEGORY_LABELS } from '../../game/content/items/inventoryMetadata'
import type { GameState } from '../../game/types'

export function CollectionSummary({ progress }: { progress: GameState['progress'] }) {
  const completion = getCollectionCompletion({ progress })
  const categories = getCollectionCategoryCounts({ progress })
  return <Card title="COLLECTION PROGRESS" className="collection-summary"><div className="archive-summary-head"><div><span className="archive-summary-label">DISCOVERED</span><strong>{completion.discovered} / {completion.total}</strong></div><div><span className="archive-summary-label">COMPLETION</span><strong>{completion.percent}%</strong></div></div><Progress value={completion.percent} tone="violet" /><div className="archive-progress-grid collection-progress-grid">{Object.entries(categories).map(([category, count]) => <ArchiveProgressTile key={category} label={CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]} discovered={count.discovered} total={count.total} />)}</div></Card>
}
