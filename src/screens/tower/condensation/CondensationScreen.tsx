import { Card, Status } from '../../../components/ui'
import { BALANCE } from '../../../game/data/balance'
import { ITEMS } from '../../../game/data/items'
import { SCHOOLS } from '../../../game/data/schools'
import { useGameStore } from '../../../store/gameStore'
import { EditableGrid } from '../../../ui/layout-editor/EditableGrid'
import { CondensationPanel } from '../CondensationPanel'
import { TowerFrame } from '../TowerFrame'

export function CondensationScreen() {
  const condense = useGameStore((state) => state.activities.condense)
  const inventory = useGameStore((state) => state.inventory)
  return <TowerFrame eyebrow="WIZARD TOWER · ELEMENTAL CONDENSATION" title="Turn Mana into elemental matter." description="Choose a fragment to condense. The activity continues while you visit other screens."><EditableGrid screen="tower-condensation" panels={[{ id: 'condensation-elements', content: <CondensationPanel /> }, { id: 'condensation-status', content: <Card title="Condensation status" action={<Status tone={condense.running ? 'active' : 'neutral'}>{condense.running ? 'Running' : 'Paused'}</Status>}><div className="tower-stat-list"><span>Selected element<strong>{SCHOOLS[condense.element].name}</strong></span><span>Fragments banked<strong>{inventory[SCHOOLS[condense.element].fragment] ?? 0}</strong></span><span>Focus reservation<strong>{BALANCE.condense.focusCost}</strong></span></div><p className="muted">Pause or resume the activity from the primary condensation panel.</p></Card> }]} /></TowerFrame>
}
