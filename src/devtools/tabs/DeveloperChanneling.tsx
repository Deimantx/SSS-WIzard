import { Button, Card, Status } from '../../components/ui'
import { CHANNELING_DISCOVERIES, MANA_PILLAR_IDS, MANA_PILLARS } from '../../game/content/channeling'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

export function DeveloperChanneling() {
  const activities = useGameStore((state) => state.activities)
  const progress = useGameStore((state) => state.progress)
  const debug = useGameStore((state) => state.debug)
  const forceEchoes = useGameStore((state) => state.forceSetEchoes)
  const forcePillar = useGameStore((state) => state.forceSetManaPillarLevel)
  const setGenerated = useGameStore((state) => state.setChannelingManaGenerated)
  const setSustain = useGameStore((state) => state.setChannelingFiveEchoSustain)
  const setDiscovery = useGameStore((state) => state.setChannelingDiscovery)
  const reset = useGameStore((state) => state.resetDebugOverrides)
  const maxEchoes = debug.ignoreEchoLimit ? 'unlimited' : '5'

  return <div className="developer-tab-grid">
    <Card title="Channeling runtime">
      <div className="developer-summary-grid">
        <Summary label="Echoes" value={`${activities.channeling.echoesAssigned} / ${maxEchoes}`} />
        <Summary label="Mana Generated" value={progress.channeling.totalManaGenerated} />
        <Summary label="Five Echo Sustain" value={`${progress.channeling.fiveEchoSustainMs} ms`} />
        <Summary label="Discoveries" value={`${Object.values(progress.channeling.discoveries).filter(Boolean).length} / ${CHANNELING_DISCOVERIES.length}`} />
      </div>
      <div className="button-row"><Button variant="secondary" onClick={() => forceEchoes(5)}>Force 5 Echoes</Button><Button variant="danger" onClick={() => forceEchoes(20)}>Force 20 Echoes</Button></div>
    </Card>
    <Card title="Force channeling state" className="developer-debug-card">
      <div className="developer-form-grid">
        <NumberField label={`Force Echoes (cap: ${maxEchoes})`} value={activities.channeling.echoesAssigned} onChange={forceEchoes} />
        {MANA_PILLAR_IDS.map((id) => <NumberField key={id} label={`${MANA_PILLARS[id].name} Level (0-10)`} value={progress.channeling.pillars[id].level} onChange={(value) => forcePillar(id, value)} />)}
        <NumberField label="Total Mana Generated" value={progress.channeling.totalManaGenerated} onChange={setGenerated} />
        <NumberField label="Five Echo Sustain (ms)" value={progress.channeling.fiveEchoSustainMs} onChange={setSustain} />
      </div>
      <p className="muted">Force controls do not consume materials or alter the normal upgrade path.</p>
    </Card>
    <Card title="Arcane Discoveries">
      <div className="developer-owned-list">{CHANNELING_DISCOVERIES.map((discovery) => { const complete = progress.channeling.discoveries[discovery.id]; return <span key={discovery.id}><span>{discovery.name}</span><strong>{complete ? 'Complete' : 'Incomplete'}</strong><Button variant="ghost" onClick={() => setDiscovery(discovery.id, !complete)}>{complete ? 'Reset' : 'Complete'}</Button></span> })}</div>
    </Card>
    <Card title="Debug controls" className="developer-danger-card">
      <div className="developer-toggle-list"><label><input type="checkbox" checked={debug.ignoreEchoLimit} onChange={(event) => useGameStore.getState().setDebugIgnoreEchoLimit(event.target.checked)} /> Ignore Echo limit</label></div>
      <div className="button-row"><Button variant="danger" onClick={reset}>Reset Debug Overrides</Button><Status tone={debug.ignoreEchoLimit ? 'warning' : 'neutral'}>{debug.ignoreEchoLimit ? 'DANGEROUS OVERRIDE ACTIVE' : 'Normal caps active'}</Status></div>
    </Card>
  </div>
}
