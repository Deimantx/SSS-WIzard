import { Button, Card, Status } from '../../components/ui'
import { CHANNELING_DISCOVERIES, MANA_PILLAR_IDS, MANA_PILLARS } from '../../game/content/channeling'
import { formatDuration, formatNumber } from '../../game/content/presentation/balanceFormatters'
import { getArcaneFluxCapacityBreakdown, getArcaneFluxProductionBreakdown } from '../../game/systems/channeling/channelingRuntime'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

export function DeveloperChanneling() {
  const state = useGameStore()
  const progress = state.progress
  const production = getArcaneFluxProductionBreakdown(state)
  const capacity = getArcaneFluxCapacityBreakdown(state)
  return <div className="developer-tab-grid">
    <Card title="Channeling overview"><div className="developer-summary-grid"><Summary label="Channeling Acolytes" value={state.activities.channeling.acolytesAssigned ?? 0} /><Summary label="Flux Generated" value={formatNumber(progress.channeling.totalFluxGenerated ?? 0)} /><Summary label="Flux / Second" value={`+${production.total.toFixed(2)}`} /><Summary label="Capacity" value={`${Math.floor(state.tower.resources.arcaneFlux)} / ${capacity.total}`} /><Summary label="Stable Channel Sustain" value={formatDuration(progress.channeling.fiveEchoSustainMs)} /><Summary label="Discoveries" value={`${Object.values(progress.channeling.discoveries).filter(Boolean).length} / ${CHANNELING_DISCOVERIES.length}`} /></div><div className="button-row"><Button variant="secondary" onClick={() => state.setChannelingAcolytesDebug(5)}>Assign 5 Acolytes</Button><Button variant="danger" onClick={() => state.setChannelingAcolytesDebug(20)}>Force 20 Acolytes</Button></div></Card>
    <Card title="Force channeling state" className="developer-debug-card"><div className="developer-form-grid"><NumberField label="Channeling Acolytes" value={state.activities.channeling.acolytesAssigned ?? 0} onChange={state.setChannelingAcolytesDebug} />{MANA_PILLAR_IDS.map((id) => <NumberField key={id} label={`${MANA_PILLARS[id].name} Level (0-10)`} value={progress.channeling.pillars[id].level} onChange={(value) => state.forceSetManaPillarLevel(id, value)} />)}<NumberField label="Total Arcane Flux Generated" value={progress.channeling.totalFluxGenerated ?? 0} onChange={state.setChannelingFluxGenerated} /><NumberField label="Stable Channel Sustain (seconds)" value={progress.channeling.fiveEchoSustainMs / 1000} onChange={(value) => state.setChannelingFiveEchoSustain(Math.max(0, value * 1000))} /></div><p className="muted">Force controls are tester fixtures; normal channeling uses shared Acolyte capacity and Arcane Flux storage.</p></Card>
    <Card title="Arcane Discoveries"><div className="developer-owned-list">{CHANNELING_DISCOVERIES.map((discovery) => { const complete = progress.channeling.discoveries[discovery.id]; return <span key={discovery.id}><span>{discovery.name}</span><strong>{complete ? 'Complete' : 'Incomplete'}</strong><Button variant="ghost" onClick={() => state.setChannelingDiscovery(discovery.id, !complete)}>{complete ? 'Reset' : 'Complete'}</Button></span> })}</div></Card>
    <Card title="Debug controls" className="developer-danger-card"><div className="developer-toggle-list"><label><input type="checkbox" checked={state.debug.ignoreAcolyteLimit} onChange={(event) => state.setDebugIgnoreAcolyteLimit(event.target.checked)} /> Ignore Acolyte limit</label></div><div className="button-row"><Button variant="danger" onClick={state.resetDebugOverrides}>Reset Debug Overrides</Button><Status tone={state.debug.ignoreAcolyteLimit ? 'warning' : 'neutral'}>{state.debug.ignoreAcolyteLimit ? 'DANGEROUS OVERRIDE ACTIVE' : 'Normal caps active'}</Status></div></Card>
  </div>
}
