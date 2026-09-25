import { useState } from 'react'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { RESONANCE_METADATA, RESONANCE_TYPES, type ResonanceType, type ResonanceYield } from '../../game/content/resonance/resonance'
import { MONSTERS, MONSTER_IDS } from '../../game/content/monsters'
import { formatResonanceAmount, getNonZeroResonanceEntries } from '../../game/presentation/resonance/resonancePresentation'
import { aggregateResonanceBundle, resolveEnemyResonanceReward } from '../../game/systems/resonance/resonanceRuntime'
import type { MonsterId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { DeveloperSection } from '../components/DeveloperBrowser'
import { NumberField, Summary } from './DeveloperTabPrimitives'

const DEFAULT_PREVIEW_KILLS = 100
const MAX_PREVIEW_KILLS = 100_000

export function DeveloperResonance() {
  const state = useGameStore()
  const [setValues, setSetValues] = useState<Record<ResonanceType, number>>(() => ({ ...state.resonance }))
  const [selectedEnemy, setSelectedEnemy] = useState<MonsterId>('forest-wisp')
  const [kills, setKills] = useState(DEFAULT_PREVIEW_KILLS)
  const [preview, setPreview] = useState<ResonanceYield | null>(null)
  const resolution = resolveEnemyResonanceReward(selectedEnemy)
  const selectedMonster = MONSTERS[selectedEnemy]
  const setValue = (type: ResonanceType, value: number) => setSetValues((current) => ({ ...current, [type]: value }))
  const clampKills = (value: number) => Math.max(1, Math.min(MAX_PREVIEW_KILLS, Math.floor(Number.isFinite(value) ? value : DEFAULT_PREVIEW_KILLS)))

  return <div className="developer-tab-stack developer-resonance-tab">
    <Card title="Resonance balance" action={<Status tone="warning">PROFILE STATE</Status>}>
      <p className="muted">Resonance is a persisted magical resource earned from authored enemy defeats. It is separate from Inventory, Arcane Points, and Transmutation materials.</p>
      <div className="developer-summary-grid">{RESONANCE_TYPES.map((type) => <Summary key={type} label={RESONANCE_METADATA[type].label} value={formatResonanceAmount(state.resonance[type])} />)}</div>
      <div className="developer-resonance-controls">{RESONANCE_TYPES.map((type) => <div className="developer-resonance-row" key={type}><strong>{RESONANCE_METADATA[type].shortLabel}</strong><span>{formatResonanceAmount(state.resonance[type])}</span><div className="button-row"><Button onClick={() => state.debugGrantResonance(type, 100)}>+100</Button><Button onClick={() => state.debugGrantResonance(type, 1_000)}>+1,000</Button><Button onClick={() => state.debugGrantResonance(type, 10_000)}>+10,000</Button><Button variant="ghost" onClick={() => state.debugClearResonance(type)}>CLEAR</Button></div><NumberField label={`Set ${RESONANCE_METADATA[type].shortLabel}`} value={setValues[type]} min={0} max={Number.MAX_SAFE_INTEGER} onChange={(value) => setValue(type, value)} /><Button variant="secondary" onClick={() => state.debugSetResonance(type, setValues[type])}>SET</Button></div>)}</div>
      <div className="button-row"><Button variant="danger" onClick={state.debugClearAllResonance}>CLEAR ALL</Button><GameTooltip content="Adds 100 of each Phase 1 Resonance type to the current profile."><Button variant="secondary" onClick={state.debugGrantResonanceTestBundle}>GRANT TEST BUNDLE</Button></GameTooltip></div>
      <p className="developer-debug-note">Developer controls intentionally mutate the current profile balance. They do not use Developer Tools local storage.</p>
    </Card>

    <Card title="Enemy reward inspector">
      <DeveloperSection title="Resonance Harvest"><label className="developer-select-field">SELECT ENEMY<select aria-label="Resonance enemy" value={selectedEnemy} onChange={(event) => { setSelectedEnemy(event.target.value as MonsterId); setPreview(null) }}>{MONSTER_IDS.map((id) => <option key={id} value={id}>{MONSTERS[id].name}</option>)}</select></label><div className="developer-inspector-title"><div><strong>{selectedMonster.name}</strong><small className="muted">{selectedMonster.subtitle}</small></div><Status tone={resolution.finalYield && getNonZeroResonanceEntries(resolution.finalYield).length ? 'success' : 'neutral'}>{getNonZeroResonanceEntries(resolution.finalYield).length ? 'PROFILED' : 'UNCONVERTED'}</Status></div><div className="developer-detail-grid"><span>BASE PROFILE<strong>{getNonZeroResonanceEntries(resolution.baseYield).length ? getNonZeroResonanceEntries(resolution.baseYield).map(({ label, amount }) => `${label} ${formatResonanceAmount(amount)}`).join(' · ') : 'No Phase 1 Resonance profile authored'}</strong></span><span>WORLD TIER<strong>WT{resolution.worldTier}</strong></span><span>WT / GLOBAL<strong>{resolution.worldTierRewardMultiplier.toFixed(2)}× / {resolution.globalRewardMultiplier.toFixed(2)}×</strong></span><span>EFFECTIVE MULTIPLIER<strong>{resolution.rewardMultiplier.toFixed(2)}×</strong></span><span>FINAL REWARD<strong>{getNonZeroResonanceEntries(resolution.finalYield).length ? getNonZeroResonanceEntries(resolution.finalYield).map(({ label, amount }) => `${label} ${formatResonanceAmount(amount)}`).join(' · ') : '0'}</strong></span></div></DeveloperSection>
    </Card>

    <Card title="Reward-only batch preview" className="developer-debug-card"><p className="muted">REWARD PREVIEW — DOES NOT MODIFY PROFILE. This aggregates the pure authored reward only; it does not simulate combat, loot, kills, threat, Arcane Points, or time.</p><div className="developer-form-grid"><label className="developer-select-field">SELECT ENEMY<select aria-label="Preview enemy" value={selectedEnemy} onChange={(event) => { setSelectedEnemy(event.target.value as MonsterId); setPreview(null) }}>{MONSTER_IDS.map((id) => <option key={id} value={id}>{MONSTERS[id].name}</option>)}</select></label><NumberField label="Kills N (1–100,000)" value={kills} min={1} max={MAX_PREVIEW_KILLS} onChange={(value) => setKills(clampKills(value))} /></div><div className="button-row"><Button onClick={() => setPreview(aggregateResonanceBundle(resolution.finalYield, kills))}>SIMULATE</Button></div>{preview && <div className="developer-summary-grid"><Summary label="Enemy" value={selectedMonster.name} /><Summary label="Kills" value={kills} />{getNonZeroResonanceEntries(preview).length ? getNonZeroResonanceEntries(preview).map(({ type, label, amount }) => <Summary key={type} label={`${label} Resonance`} value={formatResonanceAmount(amount)} />) : <Summary label="Final reward" value="0" />}</div>}</Card>
  </div>
}
