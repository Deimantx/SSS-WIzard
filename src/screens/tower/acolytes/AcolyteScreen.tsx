import { Card, Progress } from '../../../components/ui'
import { ScreenGrid } from '../../../components/layout/ScreenGrid'
import { getAcolyteAssignmentGroups, type AcolyteAssignmentGroup } from '../../../game/presentation/acolytes/acolyteAssignmentPresentation'
import { getAcolyteCapacityBreakdown, selectFreeAcolytes, selectUsedAcolytes } from '../../../game/systems/acolytes'
import { useGameStore } from '../../../store/gameStore'
import { TowerFrame } from '../TowerFrame'

export function AcolyteScreen() {
  return <TowerFrame className="acolyte-screen" eyebrow="WIZARD TOWER · ACOLYTES" title="Tower Acolytes" description="Assign your apprentices to Tower work while the Wizard continues fighting."><ScreenGrid screen="tower-acolytes" panels={[{ id: 'acolyte-roster', content: <AcolyteRosterPanel /> }, { id: 'acolyte-assignments', content: <AcolyteAssignmentsPanel /> }, { id: 'acolyte-sources', content: <AcolyteSourcesPanel /> }]} /></TowerFrame>
}

function AcolyteRosterPanel() {
  const state = useGameStore()
  const breakdown = getAcolyteCapacityBreakdown(state)
  const used = selectUsedAcolytes(state)
  const free = selectFreeAcolytes(state)
  const summary = free > 0 ? `${free} Acolytes are available for Tower work.` : 'All Acolytes are assigned.'
  return <Card className="acolyte-roster-panel" title="ACOLYTE ROSTER" action={<span className="acolyte-roster-availability">{free} AVAILABLE</span>}><div className="acolyte-worker-markers" aria-label={`${used} of ${breakdown.total} Acolytes assigned`}>{Array.from({ length: breakdown.total }, (_, index) => <span key={index} className={index < used ? 'is-assigned' : ''} aria-hidden="true" />)}</div><div className="acolyte-roster-progress"><div><span>{used} / {breakdown.total} ASSIGNED</span><strong>{Math.round(used / Math.max(1, breakdown.total) * 100)}%</strong></div><Progress value={breakdown.total ? used / breakdown.total * 100 : 0} tone="gold" /></div><div className="acolyte-roster-grid"><Metric label="TOTAL" value={breakdown.total} /><Metric label="ASSIGNED" value={used} /><Metric label="AVAILABLE" value={free} warning={free === 0} /></div><p className="acolyte-roster-summary">{summary}</p></Card>
}

function AcolyteAssignmentsPanel() {
  const state = useGameStore()
  const groups = getAcolyteAssignmentGroups(state)
  const setScreen = useGameStore((current) => current.setScreen)
  return <Card className="acolyte-assignments-panel" title="ACTIVE ASSIGNMENTS"><div className="acolyte-assignment-list">{groups.length === 0 ? <div className="acolyte-empty"><strong>NO ACTIVE TOWER STAFFING</strong><p>All {getAcolyteCapacityBreakdown(state).total} Acolytes are available. Assign them from Channeling, Research, or Transmutation.</p></div> : groups.map((group) => <button className={`acolyte-assignment-row is-${group.sourceType}`} key={group.key} onClick={() => setScreen(group.sourceType === 'channeling' ? 'tower-channeling' : group.sourceType === 'research' ? 'tower-research' : 'tower-transmutation')}><span className="acolyte-assignment-source">{group.sourceType.toUpperCase()}</span><span className="acolyte-assignment-main"><strong>{group.label}</strong>{group.outputValue !== undefined && <small>{formatAssignmentOutput(group)}</small>}</span><span className="acolyte-assignment-status">{group.count} {group.count === 1 ? 'ACOLYTE' : 'ACOLYTES'} <span aria-hidden="true">›</span></span></button>)}</div></Card>
}

function AcolyteSourcesPanel() {
  const breakdown = getAcolyteCapacityBreakdown(useGameStore())
  return <Card className="acolyte-sources-panel" title="ACOLYTE SOURCES"><div className="acolyte-source-list"><SourceRow label="Base Tower Roster" value={breakdown.base} /><SourceRow label="Permanent Recruits" value={breakdown.permanentBonuses} /><SourceRow label="Developer Bonus" value={breakdown.developerBonus} /></div><div className="acolyte-source-total"><span>TOTAL</span><strong>{breakdown.total}</strong></div><p className="acolyte-source-note">Future recruits will come from progression systems.</p></Card>
}

function SourceRow({ label, value }: { label: string; value: number }) { return <div className="acolyte-source-row"><span>{label}</span><strong>+{value}</strong></div> }
function Metric({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) { return <div className={`acolyte-metric${warning ? ' is-warning' : ''}`}><span>{label}</span><strong>{value}</strong></div> }
function formatAssignmentOutput(group: AcolyteAssignmentGroup) { const value = group.outputValue ?? 0; const formatted = value >= 100 || Number.isInteger(value) ? Math.round(value).toLocaleString() : value.toFixed(1); return `${group.outputUnit === 'FLUX/S' ? '+' : ''}${formatted} ${group.outputUnit}` }
