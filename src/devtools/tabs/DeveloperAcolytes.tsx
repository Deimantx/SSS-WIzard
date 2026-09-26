import { Button, Card, Status } from '../../components/ui'
import { getAcolyteCapacityBreakdown } from '../../game/systems/acolytes/acolyteCapacity'
import { getAcolyteAssignments, selectFreeAcolytes, selectUsedAcolytes } from '../../game/systems/acolytes/acolyteAssignments'
import { getArcaneFluxCapacityBreakdown, getArcaneFluxProductionPerSecond } from '../../game/systems/channeling/channelingRuntime'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

export function DeveloperAcolytes() {
  const state = useGameStore()
  const capacity = getAcolyteCapacityBreakdown(state)
  const assignments = getAcolyteAssignments(state)
  const flux = getArcaneFluxProductionPerSecond(state)
  const fluxCapacity = getArcaneFluxCapacityBreakdown(state).total
  return <div className="developer-tab-grid">
    <Card title="Acolyte roster">
      <div className="developer-summary-grid"><Summary label="Total Acolytes" value={capacity.total} /><Summary label="Assigned" value={selectUsedAcolytes(state)} /><Summary label="Available" value={selectFreeAcolytes(state)} /></div>
      <div className="developer-diagnostics"><span>All Tower work consumes one Acolyte per active assignment.</span><span>Capacity <b>{capacity.base} base + {capacity.permanentBonuses} permanent + {capacity.developerBonus} developer</b></span></div>
    </Card>
    <Card title="Acolyte overrides" className="developer-debug-card">
      <NumberField label="Bonus Acolytes" value={state.debug.bonusAcolytes} onChange={state.setDebugAcolyteBonus} min={0} />
      <NumberField label="Total override (0 disables)" value={state.debug.acolyteTotalOverride ?? 0} onChange={(value) => state.setDebugAcolyteTotalOverride(value > 0 ? value : null)} min={0} />
      <div className="button-row"><Button variant={state.debug.ignoreAcolyteLimit ? 'danger' : 'secondary'} onClick={() => state.setDebugIgnoreAcolyteLimit(!state.debug.ignoreAcolyteLimit)}>{state.debug.ignoreAcolyteLimit ? 'Ignore limit ON' : 'Ignore assignment limit'}</Button></div>
    </Card>
    <Card title="Arcane Flux">
      <div className="developer-summary-grid"><Summary label="Stored" value={`${Math.floor(state.tower.resources.arcaneFlux)} / ${Math.floor(fluxCapacity)}`} /><Summary label="Production" value={`${flux.total.toFixed(2)} / sec`} /><Summary label="Channeling Acolytes" value={flux.assignedAcolytes} /></div>
      <NumberField label="Capacity override (0 disables)" value={state.debug.arcaneFluxCapacityOverride ?? 0} onChange={(value) => state.setDebugArcaneFluxCapacity(value > 0 ? value : null)} min={0} />
    </Card>
    <Card title="Assignment ledger"><div className="reservation-list">{assignments.length === 0 ? <span className="muted">No Acolytes assigned.</span> : assignments.map((assignment) => <div className="reservation" key={assignment.id}><span className="reservation-dot" /><span>{assignment.label}</span><strong>{assignment.sourceType}</strong></div>)}</div><Status tone={selectFreeAcolytes(state) > 0 ? 'success' : 'warning'}>{selectFreeAcolytes(state) > 0 ? 'Acolytes available' : 'Roster fully assigned'}</Status></Card>
  </div>
}
