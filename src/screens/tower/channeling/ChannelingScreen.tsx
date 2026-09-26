import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { ScreenGrid } from '../../../components/layout/ScreenGrid'
import { useGameStore } from '../../../store/gameStore'
import { CHANNELING_DISCOVERIES } from '../../../game/data/channelingDiscoveries'
import { getArcaneFluxCapacityBreakdown, getArcaneFluxProductionBreakdown } from '../../../game/systems/channeling/channelingRuntime'
import { selectFreeAcolytes } from '../../../game/systems/acolytes'
import { Card, Button, Progress } from '../../../components/ui'
import { GameTooltip, TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ManaPillarsPanel } from './ManaPillarsPanel'
import { ArcaneDiscoveriesModal } from './ArcaneDiscoveriesModal'
import { ArcaneDiscoveriesStrip } from './ArcaneDiscoveriesStrip'

export function ChannelingScreen() {
  const [discoveriesOpen, setDiscoveriesOpen] = useState(false)
  const discoveries = useGameStore((state) => state.progress.channeling.discoveries)
  const completed = CHANNELING_DISCOVERIES.filter(({ id }) => discoveries[id]).length
  return <div className="screen-content channeling-screen"><div className="screen-header"><div><div className="eyebrow">WIZARD TOWER · CHANNELING</div><h1>Channeling Chamber</h1><p>Assign Acolytes to draw Arcane Flux from the leyline while the Wizard fights.</p></div></div><ArcaneDiscoveriesStrip completed={completed} total={CHANNELING_DISCOVERIES.length} onOpen={() => setDiscoveriesOpen(true)} /><ScreenGrid screen="tower-channeling" panels={[{ id: 'channeling-mana-core', content: <ArcaneFluxCorePanel /> }, { id: 'channeling-acolytes', content: <AcolyteChannelingPanel /> }, { id: 'channeling-breakdown', content: <FluxBreakdownPanel /> }, { id: 'channeling-pillars', content: <ManaPillarsPanel /> }]} />{discoveriesOpen && <ArcaneDiscoveriesModal onClose={() => setDiscoveriesOpen(false)} />}</div>
}

function ArcaneFluxCorePanel() {
  const state = useGameStore()
  const capacity = getArcaneFluxCapacityBreakdown(state)
  const production = getArcaneFluxProductionBreakdown(state)
  const flux = state.tower.resources.arcaneFlux
  return <Card className="arcane-flux-core-panel" title="ARCANE FLUX CORE"><div className="flux-core-readout"><strong>{Math.floor(flux)} <small>/ {capacity.total}</small></strong><Progress value={capacity.total ? flux / capacity.total * 100 : 0} tone="mana" /></div><div className="flux-core-stats"><div><span>TOTAL FLOW</span><strong>+{production.total.toFixed(1)}/s</strong></div><div><span>ACOLYTES</span><strong>{production.assignedAcolytes}</strong></div><div><span>CAPACITY</span><strong>{capacity.total}</strong></div></div></Card>
}

function AcolyteChannelingPanel() {
  const state = useGameStore()
  const assigned = state.activities.channeling.acolytesAssigned ?? 0
  const free = selectFreeAcolytes(state)
  const production = getArcaneFluxProductionBreakdown(state)
  const addDescription = free > 0 ? 'Each worker adds independent Arcane Flux production.' : 'No free Acolytes. Unassign another Tower job first.'
  return <Card className="acolyte-channeling-panel" title="ACOLYTE CHANNELING" action={<span className="channeling-active-label">{assigned > 0 ? 'ACTIVE' : 'IDLE'}</span>}><div className="channeling-assigned-label">ASSIGNED</div><div className="channeling-stepper"><GameTooltip content={<TooltipContent title="Remove Channeling Acolyte" description="Release one worker. Partial Tower work remains intact." />}><Button variant="ghost" icon ariaLabel="Remove Channeling Acolyte" onClick={state.removeChannelingAcolyte} disabled={assigned <= 0}><Minus size={14} /></Button></GameTooltip><strong>{assigned}</strong><GameTooltip content={<TooltipContent title="Assign Channeling Acolyte" description={addDescription} />}><Button variant="secondary" icon ariaLabel="Assign Channeling Acolyte" onClick={state.assignChannelingAcolyte} disabled={free <= 0}><Plus size={14} /></Button></GameTooltip></div><p>{free} available for other Tower work</p><div className="channeling-rate-summary"><span>PER ACOLYTE</span><strong>+{production.assignedAcolytes ? (production.total / production.assignedAcolytes).toFixed(1) : '0.0'} Flux/s</strong><span>TOTAL</span><strong>+{production.total.toFixed(1)} Flux/s</strong></div></Card>
}

function FluxBreakdownPanel() {
  const state = useGameStore()
  const production = getArcaneFluxProductionBreakdown(state)
  const capacity = getArcaneFluxCapacityBreakdown(state)
  const rows = [['Assigned Acolytes', `${production.assignedAcolytes}`], ['Base / Acolyte', `+${production.basePerAcolyte.toFixed(1)} Flux/s`], ['Leyline Conduit', `+${production.leylineConduit.toFixed(2)} / worker`], ['Acolyte Attunement', `×${production.acolyteAttunementMultiplier.toFixed(2)}`], ['Flux Resonance', `×${production.fluxResonanceMultiplier.toFixed(2)}`], ['FINAL PRODUCTION', `+${production.total.toFixed(1)} Flux/s`]]
  return <Card title="CHANNELING BREAKDOWN"><div className="channeling-breakdown-columns"><div><span className="eyebrow">PRODUCTION</span>{rows.map(([label, value]) => <div className={`channeling-breakdown-row${label === 'FINAL PRODUCTION' ? ' is-final' : ''}`} key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div><span className="eyebrow">CAPACITY</span><div className="channeling-breakdown-row"><span>Base Capacity</span><strong>{capacity.base}</strong></div><div className="channeling-breakdown-row"><span>Arcane Reservoir</span><strong>+{capacity.arcaneReservoirBonus}</strong></div><div className="channeling-breakdown-row"><span>Astral Expansion</span><strong>×{capacity.astralExpansionMultiplier.toFixed(2)}</strong></div><div className="channeling-breakdown-row is-final"><span>FINAL CAPACITY</span><strong>{capacity.total}</strong></div></div></div></Card>
}
