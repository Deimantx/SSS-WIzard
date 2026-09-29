import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, ModalPortal, SearchInput, Status, Toggle } from '../../components/ui'
import { useGameStore } from '../../store/gameStore'
import { deleteCustomScenario, getScenarioStorageStatus, listCustomScenarios, putCustomScenario, type ScenarioStorageStatus } from './customScenarioStorage'
import { captureDeveloperScenario, duplicateDeveloperScenario, exportDeveloperScenario, runCustomDeveloperScenario } from './customScenarioRuntime'
import { parseDeveloperScenarioFile, validateDeveloperScenario } from './customScenarioSchema'
import type { DeveloperScenarioDraft, DeveloperScenarioRecord } from './customScenarioTypes'
import { setCustomScenarioLibraryExpanded, useDeveloperToolsStore } from '../developerToolsStore'

const emptyDraft: DeveloperScenarioDraft = { name: '', description: '', tags: [] }
const formatNumber = (value: number) => new Intl.NumberFormat().format(value)
const screenLabels: Record<string, string> = { home: 'Home', combat: 'Combat', schools: 'Magic Schools', inventory: 'Inventory', equipment: 'Equipment', 'arcane-core': 'Arcane Core', crystals: 'Crystals', collection: 'Collection', bestiary: 'Bestiary', 'tower-channeling': 'Channeling', 'tower-acolytes': 'Acolytes', 'tower-research': 'Research', 'tower-transmutation': 'Transmutation', 'tower-artificing': 'Artificing', 'tower-summoning': 'Summoning', 'tower-dark-portal': 'Dark Portal', 'arcane-guild': 'Arcane Guild', 'hunters-order': 'Hunter’s Order', settings: 'Settings' }

export function CustomScenarioLibrary() {
  const screen = useGameStore((state) => state.ui.screen)
  const session = useDeveloperToolsStore()
  const expanded = session.customScenarioLibraryExpanded
  const [status, setStatus] = useState<ScenarioStorageStatus>({ available: false, reason: 'Checking browser storage…' })
  const [records, setRecords] = useState<DeveloperScenarioRecord[]>([])
  const [query, setQuery] = useState('')
  const [feedback, setFeedback] = useState<{ text: string; tone: 'success' | 'warning' } | null>(null)
  const [dialog, setDialog] = useState<'save' | 'delete' | null>(null)
  const [editing, setEditing] = useState<DeveloperScenarioRecord | null>(null)
  const [deleting, setDeleting] = useState<DeveloperScenarioRecord | null>(null)
  const [draft, setDraft] = useState<DeveloperScenarioDraft>(emptyDraft)
  const [tagText, setTagText] = useState('')
  const [includeCombat, setIncludeCombat] = useState(true)
  const [includeOfflineBank, setIncludeOfflineBank] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = async () => {
    const nextStatus = await getScenarioStorageStatus()
    setStatus(nextStatus)
    if (!nextStatus.available) return
    try { setRecords(await listCustomScenarios()) }
    catch (error) { setStatus({ available: false, reason: error instanceof Error ? error.message : 'Could not read scenario library.' }) }
  }
  useEffect(() => { void refresh() }, [])
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return [...records].sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0)).filter((record) => !term || `${typeof record.name === 'string' ? record.name : ''} ${typeof record.description === 'string' ? record.description : ''} ${Array.isArray(record.tags) ? record.tags.join(' ') : ''}`.toLowerCase().includes(term))
  }, [records, query])

  const openSave = (record?: DeveloperScenarioRecord) => {
    setEditing(record ?? null)
    setDraft(record ? { name: record.name, description: record.description, tags: record.tags } : emptyDraft)
    setTagText(record?.tags.join(', ') ?? '')
    setDialog('save')
  }
  const save = async (refreshSnapshot: boolean) => {
    const trimmed = { ...draft, name: draft.name.trim(), tags: tagText.split(',').map((tag) => tag.trim()).filter(Boolean) }
    if (!trimmed.name) { setFeedback({ text: 'Add a scenario name before saving.', tone: 'warning' }); return }
    const captured = captureDeveloperScenario(trimmed, { includeCombat, includeOfflineBank })
    const record = editing ? { ...captured, id: editing.id, createdAt: editing.createdAt, updatedAt: Date.now(), snapshot: refreshSnapshot ? captured.snapshot : editing.snapshot } : captured
    try {
      if (!status.available) { exportDeveloperScenario(record); setDialog(null); setFeedback({ text: `${record.name} exported as JSON because persistent browser storage is unavailable.`, tone: 'success' }); return }
      await putCustomScenario(record); setDialog(null); setFeedback({ text: `${record.name} saved in the local Scenario Library.`, tone: 'success' }); await refresh()
    }
    catch (error) { setFeedback({ text: error instanceof Error ? error.message : 'Could not save this scenario.', tone: 'warning' }) }
  }
  const importFile = async (file?: File) => {
    if (!file) return
    try {
      const parsed = parseDeveloperScenarioFile(await file.text())
      if (!parsed.ok) { setFeedback({ text: parsed.reason, tone: 'warning' }); return }
      const record = { ...parsed.record, id: globalThis.crypto?.randomUUID?.() ?? `import-${Date.now()}`, createdAt: Date.now(), updatedAt: Date.now() }
      await putCustomScenario(record); await refresh(); setFeedback({ text: `${record.name} imported into the library.`, tone: 'success' })
    } catch (error) { setFeedback({ text: error instanceof Error ? error.message : 'Could not import this scenario.', tone: 'warning' }) }
    finally { if (fileRef.current) fileRef.current.value = '' }
  }

  return <>
    <details className="developer-custom-scenario-accordion" open={expanded} onToggle={(event) => { const next = event.currentTarget.open; if (next !== expanded) setCustomScenarioLibraryExpanded(next) }}><summary><strong>CUSTOM SCENARIOS</strong><span>{records.length} saved</span></summary>
    {expanded && <Card title="Custom Scenario Library" action={<Status tone={status.available ? 'success' : 'warning'}>{status.available ? `${records.length} SAVED` : 'STORAGE UNAVAILABLE'}</Status>}>
      <div className="scenario-library-toolbar">
        <p className="muted">Saved locally in a separate Developer-only database. Scenarios include progression, debug overrides, combat state and view context, without profile identity.</p>
        <div className="button-row"><Button onClick={() => openSave()}>{status.available ? 'SAVE CURRENT STATE' : 'EXPORT CURRENT STATE'}</Button><Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={!status.available}>IMPORT JSON</Button><input ref={fileRef} className="scenario-file-input" type="file" accept="application/json,.json" aria-label="Import scenario file" onChange={(event) => void importFile(event.target.files?.[0])} /></div>
      </div>
      {!status.available && <Status tone="warning">{status.reason} New captures can still be exported as JSON; persistent save/import requires IndexedDB.</Status>}
      <div className="scenario-library-toolbar"><SearchInput value={query} onChange={setQuery} placeholder="Search names, descriptions, tags…" ariaLabel="Search custom scenarios"/><span className="muted">Schema V1 · Current view: {screenLabels[screen] ?? 'Game'}</span></div>
      {feedback && <Status tone={feedback.tone}>{feedback.text}</Status>}
      {filtered.length === 0 ? <div className="developer-empty-state"><strong>{records.length ? 'No matching scenarios' : 'Your library is empty'}</strong><span>{records.length ? 'Try another name or tag.' : 'Capture a useful state, then export or reuse it in later sessions.'}</span></div> : <div className="scenario-library-grid">{filtered.map((record) => {
        const validation = validateDeveloperScenario(record)
        const summary = record.snapshot?.summary
        return <article className="scenario-library-card" key={record.id}>
          <div className="scenario-library-title"><div><span className="eyebrow">{record.scenarioSchemaVersion === 1 ? 'SCHEMA V1' : 'UNSUPPORTED SCHEMA'}</span><h3>{typeof record.name === 'string' ? record.name : 'Unnamed scenario'}</h3></div><Status tone={validation.ok ? 'active' : 'warning'}>{validation.ok ? 'READY' : 'INCOMPATIBLE'}</Status></div>
          <p>{typeof record.description === 'string' && record.description ? record.description : 'No description.'}</p>
          <div className="scenario-tags">{Array.isArray(record.tags) && record.tags.map((tag, index) => <span key={`${tag}-${index}`}>{String(tag)}</span>)}</div>
          {validation.ok && summary && <div className="scenario-summary-grid"><span>Hunter<strong>{summary.hunterRankLabel} · {formatNumber(summary.hunterReputation)} rep</strong></span><span>Arcane Guild<strong>{summary.guildRankLabel} · {formatNumber(summary.guildReputation)} rep</strong></span><span>Encounter<strong>{summary.activeEnemyLabel ?? 'Idle'}{summary.activeDungeonLabel ? ` · ${summary.activeDungeonLabel}` : ''}</strong></span><span>Runtime<strong>{summary.combatActive ? 'Combat active' : 'Combat idle'} · {formatNumber(summary.inventoryItemCount)} items</strong></span></div>}
          {!validation.ok && <Status tone="warning">{validation.reason}</Status>}
          <div className="scenario-library-actions"><Button variant="primary" disabled={!status.available || !validation.ok} onClick={() => { if (validation.ok) { runCustomDeveloperScenario(record); setFeedback({ text: `${record.name} loaded inside Developer Sandbox. Restore Snapshot exits safely.`, tone: 'success' }) } }}>RUN</Button><Button variant="secondary" disabled={!status.available || !validation.ok} onClick={() => openSave(record)}>EDIT</Button><Button variant="secondary" disabled={!status.available || !validation.ok} onClick={async () => { const copy = duplicateDeveloperScenario(record); await putCustomScenario(copy); await refresh(); setFeedback({ text: `${copy.name} created.`, tone: 'success' }) }}>DUPLICATE</Button><Button variant="ghost" tooltip="Download this scenario as a portable versioned JSON file." onClick={() => exportDeveloperScenario(record)}>EXPORT</Button><Button variant="danger" disabled={!status.available} onClick={() => { setDeleting(record); setDialog('delete') }}>DELETE</Button></div>
        </article>
      })}</div>}
      {status.available && <details className="scenario-library-diagnostics"><summary>Advanced storage diagnostics</summary><span>Database: sss-wizard-dev-scenarios</span><span>Schema: V1</span><span>Records: {records.length}</span><span>Estimated payload: {formatNumber(new Blob(records.map((record) => JSON.stringify(record))).size)} bytes</span></details>}
    </Card>}
    </details>

    <ModalPortal open={dialog === 'save'} onClose={() => setDialog(null)} backdropClassName="scenario-dialog-backdrop" surfaceClassName="scenario-dialog" ariaLabel={editing ? 'Edit scenario' : 'Save scenario'}>
      <header><span className="eyebrow">DEVELOPER SCENARIO</span><h2>{editing ? 'Edit library entry' : 'Save current state'}</h2><p>Capture the current game snapshot. This reads runtime state and does not start or replace the sandbox restore anchor.</p></header>
      <div className="scenario-dialog-fields"><label>Name<input autoFocus value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} maxLength={80}/></label><label>Description<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={3} maxLength={500}/></label><label>Tags<input value={tagText} onChange={(event) => setTagText(event.target.value)} placeholder="combat, hunter, regression"/></label><div className="scenario-dialog-toggles"><Toggle label="Include combat state" description="Preserve enemy, player barrier, action timers, cooldowns, statuses, and encounter progress." checked={includeCombat} onChange={setIncludeCombat}/><Toggle label="Include Offline Bank" description="Preserve the current test banked-time value in the scenario." checked={includeOfflineBank} onChange={setIncludeOfflineBank}/></div></div>
      <footer><Button variant="ghost" onClick={() => setDialog(null)}>CANCEL</Button>{editing && status.available && <Button variant="secondary" onClick={() => void save(false)}>SAVE DETAILS</Button>}<Button onClick={() => void save(true)}>{!status.available ? 'EXPORT JSON' : editing ? 'UPDATE SNAPSHOT' : 'SAVE SCENARIO'}</Button></footer>
    </ModalPortal>
    <ModalPortal open={dialog === 'delete'} onClose={() => setDialog(null)} backdropClassName="scenario-dialog-backdrop" surfaceClassName="scenario-dialog scenario-confirm-dialog" ariaLabel="Confirm scenario deletion">
      <header><span className="eyebrow">REMOVE LIBRARY ENTRY</span><h2>Delete {deleting?.name}?</h2><p>This removes the saved scenario from this browser’s Developer Library.</p></header><footer><Button variant="ghost" onClick={() => setDialog(null)}>KEEP SCENARIO</Button><Button variant="danger" onClick={async () => { if (deleting) await deleteCustomScenario(deleting.id); setDialog(null); setDeleting(null); await refresh(); setFeedback({ text: 'Scenario deleted.', tone: 'success' }) }}>DELETE SCENARIO</Button></footer>
    </ModalPortal>
  </>
}
