import { Card, Status } from '../../../components/ui'
import { ITEMS } from '../../../game/data/items'
import { SCHOOLS } from '../../../game/data/schools'
import { useGameStore } from '../../../store/gameStore'
import { EditableGrid } from '../../../ui/layout-editor/EditableGrid'
import { ResearchPanel } from '../ResearchPanel'
import { TowerFrame } from '../TowerFrame'

export function ResearchScreen() {
  const job = useGameStore((state) => state.activities.research)
  const inventory = useGameStore((state) => state.inventory)
  return <TowerFrame eyebrow="WIZARD TOWER · ARCANE CRUCIBLE" title="Research turns fragments into understanding." description="Destroy material to deepen a Magic School. Queued research survives navigation and low Mana."><EditableGrid screen="tower-research" panels={[{ id: 'research-config', content: <ResearchPanel /> }, { id: 'research-queue', content: <Card title="Research queue" action={<Status tone={job.running ? 'active' : 'neutral'}>{job.running ? 'Running' : job.status}</Status>}><div className="tower-stat-list"><span>Target<strong>{job.targetSchoolId ? SCHOOLS[job.targetSchoolId].name : 'Not configured'}</strong></span><span>Item remaining<strong>{job.itemId ? `${job.remainingQuantity} × ${ITEMS[job.itemId].name}` : '—'}</strong></span><span>Available<strong>{job.itemId ? inventory[job.itemId] ?? 0 : '—'}</strong></span></div><p className="muted">The queue pauses safely at a Magic School cap or when its item is protected.</p></Card> }]} /></TowerFrame>
}
