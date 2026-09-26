import { useGameStore } from '../../../store/gameStore'
import { getAcolyteAssignments, getAcolyteCapacityBreakdown, selectFreeAcolytes, selectUsedAcolytes } from '../../../game/systems/acolytes'
import { Card, Button, Progress, Status } from '../../../components/ui'
import { ScreenGrid } from '../../../components/layout/ScreenGrid'
import { TowerFrame } from '../TowerFrame'

export function AcolyteScreen() {
  return <TowerFrame className="acolyte-screen" eyebrow="WIZARD TOWER · ACOLYTES" title="Tower Acolytes" description="Assign your apprentices to Tower work while the Wizard continues fighting."><ScreenGrid screen="tower-acolytes" panels={[{ id: 'acolyte-roster', content: <AcolyteRosterPanel /> }, { id: 'acolyte-assignments', content: <AcolyteAssignmentsPanel /> }, { id: 'acolyte-sources', content: <AcolyteSourcesPanel /> }]} /></TowerFrame>
}

function AcolyteRosterPanel() {
  const state = useGameStore()
  const breakdown = getAcolyteCapacityBreakdown(state)
  const used = selectUsedAcolytes(state)
  const free = selectFreeAcolytes(state)
  return <Card className="acolyte-roster-panel" title="ACOLYTE ROSTER" action={<Button variant="ghost" onClick={() => state.setScreen('tower-channeling')}>OPEN CHANNELING</Button>}><div className="acolyte-worker-markers" aria-label={`${used} of ${breakdown.total} Acolytes assigned`}>{Array.from({ length: breakdown.total }, (_, index) => <span key={index} className={index < used ? 'is-assigned' : ''} />)}</div><div className="acolyte-roster-progress"><div><span>ACTIVE TOWER STAFFING</span><strong>{used} / {breakdown.total}</strong></div><Progress value={breakdown.total ? used / breakdown.total * 100 : 0} tone="gold" /></div><div className="acolyte-roster-grid"><Metric label="TOTAL" value={breakdown.total} /><Metric label="ASSIGNED" value={used} /><Metric label="AVAILABLE" value={free} /></div></Card>
}

function AcolyteAssignmentsPanel() {
  const assignments = getAcolyteAssignments(useGameStore())
  const setScreen = useGameStore((state) => state.setScreen)
  return <Card className="acolyte-assignments-panel" title="ACTIVE ACOLYTE ASSIGNMENTS"><div className="acolyte-assignment-list">{assignments.length === 0 ? <div className="acolyte-empty"><Status tone="neutral">NO ACTIVE TOWER STAFFING</Status><p>Assign apprentices to Channeling, Research, or Transmutation while Combat remains independent.</p></div> : assignments.map((assignment) => <button className={`acolyte-assignment-row is-${assignment.sourceType}`} key={assignment.id} onClick={() => setScreen(assignment.sourceType === 'channeling' ? 'tower-channeling' : assignment.sourceType === 'research' ? 'tower-research' : 'tower-transmutation')}><span className="acolyte-assignment-source">{assignment.sourceType.toUpperCase()}</span><strong>{assignment.label}</strong><span className="acolyte-assignment-status">1 ACOLYTE <span aria-hidden="true">›</span></span></button>)}</div></Card>
}

function AcolyteSourcesPanel() {
  const breakdown = getAcolyteCapacityBreakdown(useGameStore())
  return <Card className="acolyte-sources-panel" title="ACOLYTE SOURCES"><div className="acolyte-source-row"><span>Base Tower Roster</span><strong>+{breakdown.base}</strong></div><div className="acolyte-source-row"><span>Permanent Recruits</span><strong>+{breakdown.permanentBonuses}</strong></div>{breakdown.developerBonus > 0 && <div className="acolyte-source-row"><span>Developer Bonus</span><strong>+{breakdown.developerBonus}</strong></div>}<p className="acolyte-source-note">Additional Acolytes will come from future progression.</p></Card>
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="acolyte-metric"><span>{label}</span><strong>{value}</strong></div> }
