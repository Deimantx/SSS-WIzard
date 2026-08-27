import { Card, Progress } from '../../components/ui'
import { getBestiaryCompletion } from '../../game/systems/bestiary/bestiarySelectors'
import type { GameState } from '../../game/types'

const labels = { monster: 'Monsters', boss: 'Bosses', 'special-boss': 'Special Bosses' } as const

export function BestiarySummary({ progress }: { progress: GameState['progress'] }) {
  const completion = getBestiaryCompletion({ progress })
  return <Card title="BESTIARY PROGRESS" className="bestiary-summary"><div className="archive-summary-head"><div><span className="archive-summary-label">DISCOVERED</span><strong>{completion.discovered} / {completion.total}</strong></div><div><span className="archive-summary-label">COMPLETION</span><strong>{completion.percent}%</strong></div></div><Progress value={completion.percent} tone="violet" /><div className="archive-category-counts">{(Object.keys(labels) as Array<keyof typeof labels>).map((category) => <div key={category}><span>{labels[category]}</span><strong>{completion.categories[category].discovered} / {completion.categories[category].total}</strong></div>)}</div><div className="bestiary-total-defeats">TOTAL DEFEATS <strong>{completion.totalDefeats.toLocaleString()}</strong></div></Card>
}
