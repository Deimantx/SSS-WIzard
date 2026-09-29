import { useEffect, useMemo, useState } from 'react'
import { Button, ModalPortal, SearchInput, Status, Toggle } from '../../components/ui'
import { useGameStore } from '../../store/gameStore'
import { PLAYER_STAT_FIELD_REGISTRY, PLAYER_STAT_PRESET_GROUPS } from '../playerStats/playerStatFieldRegistry'
import { normalizeScenarioReadyPreset, type DeveloperScenarioGroup, type ScenarioReadyPreset } from './scenarioReadyPresetStore'

type Props = { open: boolean; label: string; preset: ScenarioReadyPreset; scenarioDefault: ScenarioReadyPreset; inheritedPreset: ScenarioReadyPreset; group: DeveloperScenarioGroup; onChange: (next: ScenarioReadyPreset) => void; onReset: () => void; onUseGroup: () => void; onSetGroup: () => void; onSetGlobal: () => void; onClose: () => void }
const flags = [{ key: 'refillHealth', label: 'Refill Health on Run', description: 'Restore Health after applying this Test Ready preset.' }, { key: 'refillMana', label: 'Refill Mana on Run', description: 'Restore Mana after applying this Test Ready preset.' }, { key: 'clearStatuses', label: 'Clear Player Statuses', description: 'Remove active statuses from the player when this preset runs.' }, { key: 'clearBarrier', label: 'Clear Barrier', description: 'Remove the player’s existing Barrier when this preset runs.' }, { key: 'godMode', label: 'God Mode', description: 'Enable the Developer-only immortal player flag for this run.' }, { key: 'infiniteMana', label: 'Infinite Mana', description: 'Enable the Developer-only infinite Mana flag for this run.' }] as const
const readPath = (root: unknown, path: string) => path.split('.').reduce<unknown>((value, key) => value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined, root)

export function ScenarioReadyPresetEditor({ open, label, preset, scenarioDefault, inheritedPreset, group, onChange, onReset, onUseGroup, onSetGroup, onSetGlobal, onClose }: Props) {
  const [draft, setDraft] = useState(preset)
  const [saved, setSaved] = useState(true)
  const game = useGameStore()
  useEffect(() => { setDraft(preset); setSaved(true) }, [preset, open])
  useEffect(() => {
    if (!open || saved) return
    const timeout = window.setTimeout(() => { onChange(normalizeScenarioReadyPreset(draft)); setSaved(true) }, 250)
    return () => window.clearTimeout(timeout)
  }, [draft, open, onChange, saved])
  const fieldGroups = useMemo(() => PLAYER_STAT_PRESET_GROUPS.map((name) => [name, PLAYER_STAT_FIELD_REGISTRY.filter((field) => field.group === name)] as const), [])
  const updateStat = (path: string, value: string) => { const field = PLAYER_STAT_FIELD_REGISTRY.find((entry) => entry.path === path); const parsed = Number(value) || 0; setDraft((current) => ({ ...current, stats: { ...current.stats, [path]: field?.kind === 'percent' ? parsed / 100 : parsed } })); setSaved(false) }
  const updateFlag = (key: typeof flags[number]['key'], checked: boolean) => { setDraft((current) => ({ ...current, [key]: checked })); setSaved(false) }
  const close = () => { onChange(normalizeScenarioReadyPreset(draft)); onClose() }
  const copyStatLab = () => {
    const stats = Object.fromEntries(PLAYER_STAT_FIELD_REGISTRY.map((field) => { const value = Number(readPath(game.debug.playerStats, field.path)) || 0; return [field.path, field.kind === 'percent' ? value * 100 : value] }))
    setDraft((current) => ({ ...current, stats })); setSaved(false)
  }
  const applyPreset = (next: ScenarioReadyPreset) => { setDraft(next); setSaved(false) }
  return <ModalPortal open={open} onClose={close} backdropClassName="scenario-ready-backdrop" surfaceClassName="scenario-ready-modal" ariaLabel="Test Ready preset editor">
    <header className="scenario-ready-header"><div><span className="eyebrow">TEST READY PRESET EDITOR</span><h2>{label}</h2><p>Edits only this Developer preference. It does not enter Sandbox or modify the current game state.</p></div><Status tone={saved ? 'success' : 'active'}>{saved ? 'SAVED' : 'SAVING…'}</Status></header>
    <div className="scenario-ready-actions"><Button variant="secondary" onClick={copyStatLab}>COPY CURRENT PLAYER STAT LAB</Button><Button variant="ghost" onClick={() => { setDraft(inheritedPreset); setSaved(true); onUseGroup() }}>USE GROUP DEFAULT</Button><Button variant="ghost" onClick={() => { setDraft(scenarioDefault); setSaved(true); onReset() }}>RESET TO SCENARIO DEFAULT</Button><Button variant="ghost" onClick={onSetGroup}>SET AS GROUP DEFAULT</Button><Button variant="ghost" onClick={onSetGlobal}>SET AS GLOBAL DEFAULT</Button></div>
    <div className="scenario-ready-scroll"><section className="scenario-ready-flags" aria-label="Run options">{flags.map((flag) => <Toggle key={flag.key} label={flag.label} description={flag.description} checked={draft[flag.key]} onChange={(checked) => updateFlag(flag.key, checked)} />)}</section>
      {fieldGroups.map(([name, fields]) => <section className="scenario-ready-field-group" key={name}><h3>{name}</h3><div className="scenario-ready-field-grid">{fields.map((field) => <label key={field.path}>{field.label}<SearchInput type="number" value={String(field.kind === 'percent' ? (draft.stats[field.path] ?? 0) * 100 : draft.stats[field.path] ?? 0)} onChange={(value) => updateStat(field.path, value)} ariaLabel={field.label} step={field.kind === 'percent' ? 0.1 : 1} /></label>)}</div></section>)}
    </div>
    <footer className="scenario-ready-footer"><span>{group} scenario · changes autosave locally</span><Button variant="primary" onClick={close}>DONE</Button></footer>
  </ModalPortal>
}
