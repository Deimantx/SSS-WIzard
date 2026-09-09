import { Card, Status } from '../../../components/ui'
import { ItemIcon } from '../../../components/ui/item'
import { useGameStore } from '../../../store/gameStore'
import { TowerFrame } from '../TowerFrame'

export function DarkPortalScreen() {
  const shardQuantity = Math.min(1, Math.max(0, Math.floor(useGameStore((state) => state.inventory['black-portal-shard'] ?? 0))))
  return <TowerFrame eyebrow="DARK PORTAL" title="THE SEALED CHAMBER" description="A newly opened room waits beyond the tower's familiar halls." className="dark-portal-screen">
    <Card className="dark-portal-card">
      <div className="dark-portal-visual" aria-hidden="true"><span className="dark-portal-ring dark-portal-ring-outer" /><span className="dark-portal-ring dark-portal-ring-inner" /><span className="dark-portal-core">◈</span></div>
      <div className="dark-portal-copy">
        <p>A fractured portal frame stands within a room that did not exist before Edrin's fall.</p>
        <p>The Black Portal Shard reacts to the darkness beyond the threshold.</p>
      </div>
      <div className="dark-portal-status-grid">
        <div className="dark-portal-relic"><ItemIcon itemId="black-portal-shard" size="large" /><div><span>BLACK PORTAL SHARD</span><strong>{shardQuantity} / 1</strong></div></div>
        <Status tone="locked">SEALED</Status>
      </div>
      <div className="dark-portal-endpoint"><span>CHAMBER STATUS</span><strong>Further progression is not yet available.</strong></div>
    </Card>
  </TowerFrame>
}

