import { EditableGrid } from '../../../ui/layout-editor/EditableGrid'
import { TowerFrame } from '../TowerFrame'
import { FocusImprovementPanel } from './FocusImprovementPanel'
import { FocusOverviewPanel } from './FocusOverviewPanel'
import { FocusUsagePanel } from './FocusUsagePanel'

export function FocusScreen() {
  return <TowerFrame className="focus-screen" eyebrow="WIZARD TOWER · FOCUS" title="Focus governs every parallel action." description="See where the tower is spending Focus, reclaim capacity through its active systems, and permanently strengthen how much automation the wizard can sustain."><EditableGrid screen="tower-focus" panels={[{ id: 'focus-summary', content: <FocusOverviewPanel /> }, { id: 'focus-reservations', content: <FocusUsagePanel /> }, { id: 'focus-improvement', content: <FocusImprovementPanel /> }]} /></TowerFrame>
}
