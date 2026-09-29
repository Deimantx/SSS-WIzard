import { useState } from 'react'
import { Button, Card, SearchInput, SelectMenu, Status } from '../../components/ui'
import { useDeveloperGameStore as useGameStore } from '../developerSandbox'
import { restoreAndExitDeveloperSandbox } from '../developerSandbox'
import { OFFLINE_BANK_PRESETS, toOfflineDurationMs, type OfflineBankUnit } from '../../game/systems/offline-bank/offlineBankDuration'
import { formatResourceAmount } from '../../game/presentation/resources/resourcePresentation'
import { useShallow } from 'zustand/react/shallow'
import { useDeveloperToolsStore } from '../developerToolsStore'

const formatDuration = (milliseconds: number) => {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

export function DeveloperOfflineBank() {
  const offlineBankMs = useGameStore((state) => state.offlineBankMs)
  const addOfflineBank = useGameStore((state) => state.debugAddOfflineBank)
  const setOfflineBank = useGameStore((state) => state.debugSetOfflineBank)
  const clearOfflineBank = useGameStore((state) => state.debugClearOfflineBank)
  const [amount, setAmount] = useState('1')
  const [unit, setUnit] = useState<OfflineBankUnit>('hours')
  const [feedback, setFeedback] = useState('')
  const apply = (mode: 'add' | 'set') => {
    const duration = toOfflineDurationMs(Number(amount), unit)
    if (mode === 'add') addOfflineBank(duration)
    else setOfflineBank(duration)
    setFeedback(`${mode === 'add' ? 'Added' : 'Set'} ${formatDuration(duration)}.`)
  }
  return <div className="developer-tab-stack">
    <Card title="Offline Bank">
      <p className="muted">Banked time represents a real absence between profile sessions. This fixture changes only the runtime bank.</p>
      <div className="developer-summary-grid"><div className="developer-summary"><span>Current bank</span><strong>{formatDuration(offlineBankMs)}</strong></div><div className="developer-summary"><span>Storage limit</span><strong>Finite</strong></div></div>
      <div className="developer-form-grid"><label>Amount<SearchInput type="number" value={amount} onChange={setAmount} ariaLabel="Offline Bank amount"/></label><label>Unit<SelectMenu value={unit} ariaLabel="Offline Bank unit" options={[{ value: 'minutes', label: 'Minutes' }, { value: 'hours', label: 'Hours' }, { value: 'days', label: 'Days' }]} onChange={setUnit}/></label></div>
      <div className="button-row">{OFFLINE_BANK_PRESETS.map((preset) => <Button key={preset.label} variant="ghost" onClick={() => { addOfflineBank(toOfflineDurationMs(preset.amount, preset.unit)); setFeedback(`${preset.label} added.`) }}>{preset.label}</Button>)}<Button onClick={() => apply('add')}>ADD TIME</Button><Button variant="secondary" onClick={() => apply('set')}>SET TIME</Button><Button variant="danger" onClick={() => { clearOfflineBank(); setFeedback('Offline Bank cleared.') }}>CLEAR</Button></div>
      {feedback && <Status tone="success">{feedback}</Status>}
    </Card>
  </div>
}

export { DeveloperScenarios } from './DeveloperScenarios'

export function DeveloperV4TesterPlaceholder({ title, description, systems }: { title: string; description: string; systems: string[] }) {
  return <div className="developer-tab-stack"><Card title={title}><Status tone="active">V4 TESTER SURFACE</Status><p className="muted">{description}</p><div className="developer-detail-grid">{systems.map((system) => <span key={system}>{system}<strong>Canonical integration target</strong></span>)}</div><p className="muted">This workspace is registered and routed through the V4 shell. Its production read models remain the source of truth while the dedicated mutation controls are migrated.</p></Card></div>
}

export function DeveloperDashboardOverview() {
  const snapshot = useGameStore(useShallow((state) => ({
    health: state.player.health,
    maxHealth: state.player.maxHealth,
    mana: state.player.mana,
    maxMana: state.player.maxMana,
    enemyId: state.combat.enemyId,
    active: state.combat.active,
    worldTier: state.worldTier.current,
    flux: state.tower.resources.arcaneFlux,
    notifications: state.notifications.length,
  })))
  return <div className="developer-tab-stack"><Card title="Session overview"><div className="developer-summary-grid"><div className="developer-summary"><span>Health</span><strong>{formatResourceAmount(snapshot.health)} / {formatResourceAmount(snapshot.maxHealth)}</strong></div><div className="developer-summary"><span>Mana</span><strong>{formatResourceAmount(snapshot.mana)} / {formatResourceAmount(snapshot.maxMana)}</strong></div><div className="developer-summary"><span>Combat</span><strong>{snapshot.active ? 'ACTIVE' : 'IDLE'}</strong></div><div className="developer-summary"><span>World Tier</span><strong>{snapshot.worldTier}</strong></div><div className="developer-summary"><span>Arcane Flux</span><strong>{Math.floor(snapshot.flux)}</strong></div><div className="developer-summary"><span>Active enemy</span><strong>{snapshot.enemyId ?? 'None'}</strong></div></div></Card><Card title="Quick actions"><div className="button-row"><Button onClick={() => { const state = useGameStore.getState(); state.setPlayer({ health: state.player.maxHealth }) }}>HEAL</Button><Button variant="secondary" onClick={() => { const state = useGameStore.getState(); state.setPlayer({ mana: state.player.maxMana }) }}>FILL MANA</Button><Button variant="ghost" onClick={() => useGameStore.getState().resetDebugOverrides()}>CLEAR DEBUG OVERRIDES</Button></div></Card></div>
}

export function DeveloperSettings() {
  return <div className="developer-tab-stack"><Card title="Developer settings"><Status tone="active">SESSION ONLY</Status><p className="muted">Technical identifiers, selection context, and presentation preferences will persist in Developer session storage and never in the gameplay save.</p></Card></div>
}
