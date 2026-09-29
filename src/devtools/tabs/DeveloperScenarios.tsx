import { useMemo, useState } from 'react'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { ensureDeveloperSandbox, restoreAndExitDeveloperSandbox, useDeveloperGameStore as useGameStore } from '../developerSandbox'
import { getDeveloperToolsState, setScenarioGroupExpanded, useDeveloperToolsStore } from '../developerToolsStore'
import { applyTestReadyPlayerPreset } from '../scenarios/scenarioStatPresets'
import { BUILT_IN_DEVELOPER_SCENARIOS, type BuiltInDeveloperScenario } from '../scenarios/builtInScenarios'
import { ScenarioReadyPresetEditor } from '../scenarios/ScenarioReadyPresetEditor'
import { clearScenarioReadyOverride, createDefaultScenarioReadyPreset, readScenarioReadyPresetStore, resolveScenarioReadyPreset, setScenarioReadyPreset, writeScenarioReadyPresetStore, type DeveloperScenarioGroup, type ScenarioReadyPreset, type ScenarioReadyPresetStoreV1 } from '../scenarios/scenarioReadyPresetStore'
import { CustomScenarioLibrary } from '../scenarios/CustomScenarioLibrary'

const groupOrder: readonly DeveloperScenarioGroup[] = ['Foundation', 'Combat', 'Hunter’s Order', 'Arcane Guild', 'Tower Systems']
const groupDefaults: Record<DeveloperScenarioGroup, boolean> = { Foundation: false, Combat: true, 'Hunter’s Order': true, 'Arcane Guild': false, 'Tower Systems': false }
const numberFormat = (number: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(number)
const presetSummary = (preset: ScenarioReadyPreset) => [
  preset.stats['core.maxHealthFlat'] ? `HP +${numberFormat(preset.stats['core.maxHealthFlat'])}` : '',
  preset.stats['core.spellPowerFlat'] ? `SP +${numberFormat(preset.stats['core.spellPowerFlat'])}` : '',
  preset.stats['modifiers.defense-flat'] ? `DEF +${numberFormat(preset.stats['modifiers.defense-flat'])}` : '',
  preset.stats['modifiers.crit-chance'] ? `CRIT +${numberFormat(preset.stats['modifiers.crit-chance'] * 100)}%` : '',
].filter(Boolean).join(' · ') || 'Base Player Stats'

export function DeveloperScenarios() {
  const session = useDeveloperToolsStore()
  const [feedback, setFeedback] = useState<{ text: string; tone: 'success' | 'warning' } | null>(null)
  const [readyStore, setReadyStore] = useState<ScenarioReadyPresetStoreV1>(() => readScenarioReadyPresetStore())
  const [editing, setEditing] = useState<{ scenario: BuiltInDeveloperScenario; groupMode: boolean } | null>(null)
  const [readyStoreAvailable, setReadyStoreAvailable] = useState(true)
  const snapshotReady = session.sandbox.snapshotPresent
  const prepareCombatLoadout = () => {
    let state = useGameStore.getState()
    state.debugUnlockSpellRankOne('fire-bolt')
    state = useGameStore.getState()
    const existing = state.spellPresets.presets.find((preset) => preset.id === 'developer-scenario-loadout')
    const presetId = existing?.id ?? state.createSpellPreset('Scenario Loadout')
    state = useGameStore.getState()
    state.selectSpellPresetForEditing(presetId)
    if (!existing?.slots.some((slot) => slot.spellId === 'fire-bolt')) useGameStore.getState().addSpellToSelectedPreset('fire-bolt')
    useGameStore.getState().selectSpellPreset(presetId)
  }
  const scenarios = useMemo(() => BUILT_IN_DEVELOPER_SCENARIOS(prepareCombatLoadout), [])
  const groups = groupOrder.filter((group) => scenarios.some((scenario) => scenario.group === group))
  const saveReadyStore = (next: ScenarioReadyPresetStoreV1) => { setReadyStore(next); setReadyStoreAvailable(writeScenarioReadyPresetStore(next)) }
  const changeExpanded = (group: string, expanded: boolean) => setScenarioGroupExpanded({ ...getDeveloperToolsState().scenarioGroupExpanded, [group]: expanded })
  const run = (scenario: BuiltInDeveloperScenario, testReady = false) => {
    try {
      ensureDeveloperSandbox(`Scenario Lab · ${scenario.label}`)
      const result = scenario.run()
      if (testReady && result !== false && scenario.testReady.supportsTestReady) {
        const resolved = resolveScenarioReadyPreset(readyStore, scenario.group, scenario.id, scenario.defaultReadyPreset)
        applyTestReadyPlayerPreset(resolved.preset)
        prepareCombatLoadout()
      }
      if (result === false) setFeedback({ text: `${scenario.label}: the authored action could not prepare this state from the current profile.`, tone: 'warning' })
      else setFeedback({ text: `${scenario.label} prepared${testReady ? ` with ${resolveScenarioReadyPreset(readyStore, scenario.group, scenario.id, scenario.defaultReadyPreset).source} Test Ready settings` : ''}.`, tone: 'success' })
    } catch (error) { setFeedback({ text: `${scenario.label} failed: ${error instanceof Error ? error.message : 'Unknown scenario error'}`, tone: 'warning' }) }
  }
  const customOverrides = Object.keys(readyStore.scenarioOverrides).length
  const editorScenario = editing?.scenario
  const editorTarget = editing?.groupMode && editorScenario ? { type: 'group' as const, group: editorScenario.group } : editorScenario ? { type: 'scenario' as const, id: editorScenario.id } : null
  const resolvedEditor = editorScenario ? resolveScenarioReadyPreset(readyStore, editorScenario.group, editorScenario.id, editorScenario.defaultReadyPreset) : null
  const editPreset = (preset: ScenarioReadyPreset) => { if (editorTarget) saveReadyStore(setScenarioReadyPreset(readyStore, editorTarget, preset)) }
  return <div className="developer-tab-stack developer-scenario-lab">
    <Card title="Developer Scenario Lab"><div className="developer-scenario-intro"><div>{session.sandbox.active ? <Status tone="warning">DEV SANDBOX ACTIVE · AUTOSAVE PAUSED</Status> : <Status tone="active">REAL PROFILE</Status>}<p className="muted">Run authored fixtures inside an isolated runtime. Test Ready presets are Developer preferences and autosave independently from game state.</p></div><div className="developer-snapshot-actions"><Button variant="primary" tooltip="Restores the captured profile state, recalculates derived resources, and resumes autosaving." disabled={!session.sandbox.active || !snapshotReady} onClick={() => { const restored = restoreAndExitDeveloperSandbox(); setFeedback({ text: restored ? 'Snapshot restored. Developer Sandbox exited and profile saving resumed.' : 'No Sandbox snapshot is available.', tone: restored ? 'success' : 'warning' }) }}>RESTORE SNAPSHOT &amp; EXIT SANDBOX</Button></div></div>{session.sandbox.active && <div className="developer-sandbox-reason"><strong>Sandbox started for</strong><span>{session.sandbox.reason ?? 'Developer testing'}</span></div>}{!readyStoreAvailable && <Status tone="warning">Browser storage is unavailable; preset changes may not persist.</Status>}{feedback && <Status tone={feedback.tone}>{feedback.text}</Status>}</Card>
    <div className="developer-scenario-controls"><span>{scenarios.length} built-in scenarios · {customOverrides} custom Ready presets</span><div><Button variant="ghost" onClick={() => setScenarioGroupExpanded(Object.fromEntries(groups.map((group) => [group, true])))}>EXPAND ALL</Button><Button variant="ghost" onClick={() => setScenarioGroupExpanded(Object.fromEntries(groups.map((group) => [group, false])))}>COLLAPSE ALL</Button></div></div>
    {groups.map((group) => { const groupScenarios = scenarios.filter((scenario) => scenario.group === group); const expanded = session.scenarioGroupExpanded[group] ?? groupDefaults[group]; const readyCount = groupScenarios.filter((scenario) => Boolean(readyStore.scenarioOverrides[scenario.id])).length; const editorScenarioForGroup = groupScenarios.find((scenario) => scenario.testReady.supportsTestReady); return <section className="developer-scenario-group" key={group}><header><Button variant="ghost" aria-expanded={expanded} onClick={() => changeExpanded(group, !expanded)}><span aria-hidden="true">{expanded ? '▾' : '▸'}</span><strong>{group.toUpperCase()}</strong><small>{groupScenarios.length} scenarios · {readyCount} custom Ready presets</small></Button>{editorScenarioForGroup && <Button variant="ghost" onClick={() => setEditing({ scenario: editorScenarioForGroup, groupMode: true })}>EDIT GROUP READY</Button>}</header>{expanded && <div className="developer-scenario-grid">{groupScenarios.map((scenario) => { const supportsReady = scenario.testReady.supportsTestReady; const resolved = supportsReady ? resolveScenarioReadyPreset(readyStore, group, scenario.id, scenario.defaultReadyPreset) : null; const hasOverride = Boolean(readyStore.scenarioOverrides[scenario.id]); return <article className="developer-scenario-card developer-scenario-card-compact" key={scenario.id}><div className="developer-scenario-description"><span className="eyebrow">SESSION FIXTURE</span><h3>{scenario.label}</h3><p>{scenario.summary[0]}</p><details><summary>Details</summary><ul>{scenario.summary.map((item) => <li key={item}>{item}</li>)}</ul></details></div><div className="developer-scenario-card-actions"><Button variant="secondary" tooltip={`Run ${scenario.label} with progression and encounter state only.`} onClick={() => run(scenario)}>RAW</Button>{supportsReady && <><div className="developer-ready-action"><Button variant="primary" tooltip={`Apply ${resolved!.source}: ${presetSummary(resolved!.preset)}.`} onClick={() => run(scenario, true)}>TEST READY</Button><span>{hasOverride ? 'Custom' : resolved!.source}</span><small>{presetSummary(resolved!.preset)}</small></div><Button variant="ghost" ariaLabel={`Edit Test Ready preset for ${scenario.label}`} onClick={() => setEditing({ scenario, groupMode: false })}>EDIT READY</Button></>}</div></article> })}</div>}</section> })}
    <CustomScenarioLibrary />
    {editing && resolvedEditor && <ScenarioReadyPresetEditor open label={editing.groupMode ? `${editing.scenario.group} default` : editing.scenario.label} preset={editing.groupMode ? readyStore.groupDefaults[editing.scenario.group] ?? editing.scenario.defaultReadyPreset ?? readyStore.globalDefault : resolvedEditor.preset} scenarioDefault={editing.groupMode ? readyStore.globalDefault : editing.scenario.defaultReadyPreset ?? createDefaultScenarioReadyPreset()} inheritedPreset={readyStore.groupDefaults[editing.scenario.group] ?? readyStore.globalDefault} group={editing.scenario.group} onChange={editPreset} onClose={() => setEditing(null)} onReset={() => { if (editorScenario) { if (editing.groupMode) saveReadyStore({ ...readyStore, groupDefaults: { ...readyStore.groupDefaults, [editorScenario.group]: readyStore.globalDefault } }); else saveReadyStore(clearScenarioReadyOverride(readyStore, editorScenario.id)) } }} onUseGroup={() => { if (editorScenario) { if (editing.groupMode) saveReadyStore(setScenarioReadyPreset(readyStore, { type: 'group', group: editorScenario.group }, readyStore.globalDefault)); else saveReadyStore(clearScenarioReadyOverride(readyStore, editorScenario.id)) } }} onSetGroup={() => { if (editorScenario) saveReadyStore(setScenarioReadyPreset(readyStore, { type: 'group', group: editorScenario.group }, resolvedEditor.preset)) }} onSetGlobal={() => saveReadyStore(setScenarioReadyPreset(readyStore, { type: 'global' }, resolvedEditor.preset))} />}
  </div>
}
