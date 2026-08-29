import { Plus, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FRAGMENT_ORDER, SCHOOLS } from '../../game/data/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { DEFAULT_SPELL_PRESET_NAME, doesCurrentAutoCastMatchPreset, getSpellPresetFocusBreakdown, getSpellPresetFocusProjection, getSpellAutoCastFocusCost, isSpellUnlocked, SPELL_PRESET_NAME_MAX_LENGTH } from '../../game/systems/spells'
import { formatSpellRank, getAllSpellsInOrder, getSpellRank } from '../../game/systems/spells/spellProgression'
import type { GameState, SchoolId, SpellId, SpellPreset, SpellPresetId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { Button, FilterBar, GameTooltip, SearchInput, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { EditablePresetName } from './EditablePresetName'
import { FocusBudgetMeter } from './FocusBudgetMeter'
import { PresetAvailableSpellTile } from './PresetAvailableSpellTile'
import { PresetLoadoutSpellTile } from './PresetLoadoutSpellTile'
import { SpellIcon } from './SpellIcon'

interface DraftPreset {
  id: SpellPresetId | null
  name: string
  spellIds: SpellId[]
}

type PendingAction = { kind: 'close' } | { kind: 'new' } | { kind: 'select'; preset: SpellPreset } | { kind: 'delete' }

const clonePreset = (preset: SpellPreset): DraftPreset => ({ id: preset.id, name: preset.name, spellIds: [...preset.spellIds] })
const newDraft = (): DraftPreset => ({ id: null, name: DEFAULT_SPELL_PRESET_NAME, spellIds: [] })
const sameIds = (left: readonly SpellId[], right: readonly SpellId[]) => left.length === right.length && left.every((spellId, index) => spellId === right[index])

export function SpellPresetDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const spellPresets = useGameStore((state) => state.spellPresets)
  const progress = useGameStore((state) => state.progress)
  const activities = useGameStore((state) => state.activities)
  const debug = useGameStore((state) => state.debug)
  const maxFocus = useGameStore((state) => state.player.maxFocus)
  const createSpellPreset = useGameStore((state) => state.createSpellPreset)
  const saveSpellPreset = useGameStore((state) => state.saveSpellPreset)
  const applySpellPreset = useGameStore((state) => state.applySpellPreset)
  const deleteSpellPreset = useGameStore((state) => state.deleteSpellPreset)
  const duplicateSpellPreset = useGameStore((state) => state.duplicateSpellPreset)
  const dialogRef = useRef<HTMLDivElement>(null)
  const dirtyRef = useRef(false)
  const closeRequestRef = useRef<() => void>(() => undefined)
  const [selectedId, setSelectedId] = useState<SpellPresetId | null>(null)
  const [draft, setDraft] = useState<DraftPreset | null>(null)
  const [availableSchool, setAvailableSchool] = useState<'all' | SchoolId>('all')
  const [availableSearch, setAvailableSearch] = useState('')
  const [confirmation, setConfirmation] = useState<PendingAction | null>(null)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState(false)
  const nameBeforeEditRef = useRef('')
  const state = useMemo(() => ({ spellPresets, progress, activities, player: { maxFocus }, debug }), [spellPresets, progress, activities, maxFocus, debug])

  useEffect(() => {
    if (!open) return
    const selected = spellPresets.presets[0]
    setSelectedId(selected?.id ?? null)
    setDraft(selected ? clonePreset(selected) : newDraft())
    setAvailableSchool('all')
    setAvailableSearch('')
    setConfirmation(null)
    setApplyError(null)
    setNameError(null)
    setEditingName(!selected)
    nameBeforeEditRef.current = selected?.name ?? DEFAULT_SPELL_PRESET_NAME
    setSavedFeedback(false)
  }, [open])

  const storedDraft = draft?.id ? spellPresets.presets.find((preset) => preset.id === draft.id) : null
  const dirty = Boolean(draft && (draft.id === null ? draft.name !== DEFAULT_SPELL_PRESET_NAME || draft.spellIds.length > 0 : !storedDraft || draft.name !== storedDraft.name || !sameIds(draft.spellIds, storedDraft.spellIds)))
  dirtyRef.current = dirty
  const focus = getSpellPresetFocusBreakdown(state)
  const projection = draft ? getSpellPresetFocusProjection(state, draft) : null
  const activePresetId = useMemo(() => spellPresets.presets.find((preset) => doesCurrentAutoCastMatchPreset(state, preset))?.id ?? null, [spellPresets, activities, progress])
  const presetRows = useMemo(() => spellPresets.presets.map((preset) => ({ preset, projection: getSpellPresetFocusProjection(state, preset) })), [spellPresets, state])

  const requestClose = () => { if (dirtyRef.current) setConfirmation({ kind: 'close' }); else onClose() }
  closeRequestRef.current = requestClose

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => dialogRef.current?.querySelector<HTMLElement>('[data-autofocus="true"]')?.focus(), 0)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRequestRef.current(); return }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => { window.clearTimeout(focusTimer); document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKeyDown) }
  }, [open])

  if (!open || !draft || !projection) return null

  const startNewDraft = () => { setSelectedId(null); setDraft(newDraft()); setApplyError(null); setNameError(null); setEditingName(true); nameBeforeEditRef.current = DEFAULT_SPELL_PRESET_NAME }
  const selectSavedPreset = (preset: SpellPreset) => { setSelectedId(preset.id); setDraft(clonePreset(preset)); setApplyError(null); setNameError(null); setEditingName(false); nameBeforeEditRef.current = preset.name }
  const executePending = () => {
    if (!confirmation) return
    const pending = confirmation
    setConfirmation(null)
    if (pending.kind === 'close') { onClose(); return }
    if (pending.kind === 'new') { startNewDraft(); return }
    if (pending.kind === 'select') { selectSavedPreset(pending.preset); return }
    const deletedId = draft.id
    if (!deletedId || !deleteSpellPreset(deletedId)) return
    const replacement = useGameStore.getState().spellPresets.presets[0]
    if (replacement) selectSavedPreset(replacement)
    else startNewDraft()
  }

  const persistDraft = (): DraftPreset | null => {
    if (!draft) return null
    if (!draft.name.trim()) { setNameError('Preset name cannot be blank.'); setEditingName(true); return null }
    let id = draft.id
    if (!id) id = createSpellPreset(draft.name.trim())
    const candidate: SpellPreset = { id, name: draft.name.trim(), spellIds: [...draft.spellIds] }
    if (!saveSpellPreset(candidate)) { setApplyError('This preset could not be saved.'); return null }
    const saved = useGameStore.getState().spellPresets.presets.find((preset) => preset.id === id)
    if (!saved) { setApplyError('This preset could not be saved.'); return null }
    const next = clonePreset(saved)
    setSelectedId(id)
    setDraft(next)
    setApplyError(null)
    setNameError(null)
    setEditingName(false)
    nameBeforeEditRef.current = next.name
    return next
  }

  const save = () => { if (persistDraft()) { setSavedFeedback(true); window.setTimeout(() => setSavedFeedback(false), 1000) } }
  const apply = () => {
    const saved = persistDraft()
    if (!saved) return
    const result = applySpellPreset(saved.id as SpellPresetId)
    if (result.ok) { onClose(); return }
    if (result.reason === 'focus') setApplyError(`Need ${result.requiredExtraFocus ?? 0} more Focus before applying this preset.`)
    else if (result.reason === 'empty') setApplyError('Add at least one available Spell before applying.')
    else setApplyError('This preset is no longer available.')
  }
  const requestAction = (action: Exclude<PendingAction, { kind: 'delete' }>) => { if (dirty) setConfirmation(action); else if (action.kind === 'close') onClose(); else if (action.kind === 'new') startNewDraft(); else selectSavedPreset(action.preset) }
  const rename = (name: string) => { setDraft((current) => current ? { ...current, name } : current); setNameError(null); setApplyError(null) }
  const beginRename = () => { nameBeforeEditRef.current = draft.name; setNameError(null); setEditingName(true) }
  const commitName = (name: string) => { if (!name.trim()) { setNameError('Preset name cannot be blank.'); return false }; setDraft((current) => current ? { ...current, name: name.trim() } : current); setNameError(null); setEditingName(false); nameBeforeEditRef.current = name.trim(); return true }
  const cancelRename = () => { setDraft((current) => current ? { ...current, name: nameBeforeEditRef.current } : current); setNameError(null); setEditingName(false) }
  const removeSpell = (spellId: SpellId) => { setDraft((current) => current ? { ...current, spellIds: current.spellIds.filter((id) => id !== spellId) } : current); setApplyError(null) }
  const addSpell = (spellId: SpellId) => { setDraft((current) => current && !current.spellIds.includes(spellId) ? { ...current, spellIds: [...current.spellIds, spellId] } : current); setApplyError(null) }
  const moveSpell = (index: number, direction: -1 | 1) => setDraft((current) => {
    if (!current || index + direction < 0 || index + direction >= current.spellIds.length) return current
    const spellIds = [...current.spellIds]
    const [item] = spellIds.splice(index, 1)
    spellIds.splice(index + direction, 0, item)
    return { ...current, spellIds }
  })
  const deletePreset = () => { if (draft.id) setConfirmation({ kind: 'delete' }) }
  const duplicate = () => {
    if (!draft.id) return
    const saved = dirty ? persistDraft() : draft
    if (!saved?.id) return
    const copyId = duplicateSpellPreset(saved.id)
    const copy = copyId ? useGameStore.getState().spellPresets.presets.find((preset) => preset.id === copyId) : null
    if (copy) selectSavedPreset(copy)
  }
  const saveConfirmation = () => { if (persistDraft()) executePending() }
  const discardConfirmation = () => executePending()

  return <div className="spell-preset-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose() }}>
    <div ref={dialogRef} className="spell-preset-dialog" role="dialog" aria-modal="true" aria-labelledby="spell-preset-dialog-title" aria-describedby="spell-preset-dialog-description">
      <header className="spell-preset-dialog-head"><div><div className="panel-kicker">AUTO-CAST CONFIGURATION</div><h2 id="spell-preset-dialog-title">SPELL PRESET MANAGER</h2><p id="spell-preset-dialog-description">Build reusable Auto-Cast setups and preview Focus usage.</p></div><Button icon variant="ghost" ariaLabel="Close spell preset manager" onClick={requestClose}><X size={16} aria-hidden="true" /></Button></header>
      <div className="spell-preset-dialog-body">
        <aside className="spell-preset-sidebar"><div className="spell-preset-list-head"><strong>PRESETS</strong><Button variant="secondary" onClick={() => requestAction({ kind: 'new' })}>+ NEW</Button></div>{draft.id === null && <button type="button" className="spell-preset-card spell-preset-local-row is-selected" onClick={() => requestAction({ kind: 'new' })}><span className="spell-preset-card-title">New Preset</span><PresetMiniIcons spellIds={draft.spellIds} /><small>0 Spells · 0 Focus</small><Status tone={dirty ? 'warning' : 'neutral'}>{dirty ? 'UNSAVED' : 'NEW'}</Status></button>}{presetRows.map(({ preset, projection: presetProjection }) => { const active = activePresetId === preset.id; const selected = preset.id === selectedId; const selectedDirty = selected && dirty; return <button type="button" className={`spell-preset-card${selected ? ' is-selected' : ''}`} key={preset.id} onClick={() => requestAction({ kind: 'select', preset })}><span className="spell-preset-card-title">{preset.name}</span><PresetMiniIcons spellIds={preset.spellIds} /><small>{preset.spellIds.length} Spells · {presetProjection.presetAutoCastFocus} Focus</small><Status tone={selectedDirty ? 'warning' : active ? 'success' : 'neutral'}>{selectedDirty ? 'UNSAVED' : active ? 'ACTIVE' : 'SAVED'}</Status></button> })}</aside>
        <section className="spell-preset-available-column"><div className="dialog-section-head"><div><div className="panel-kicker">ACTION LIBRARY</div><h3>AVAILABLE SPELLS</h3></div><span>Known Spells only</span></div><div className="dialog-filter-row"><FilterBar options={[{ value: 'all' as const, label: 'All' }, ...FRAGMENT_ORDER.map((school) => ({ value: school, label: <><span className="schools-filter-glyph" aria-hidden="true">{SCHOOLS[school].glyph}</span>{SCHOOLS[school].name}</> }))]} value={availableSchool} onChange={setAvailableSchool} ariaLabel="Available spell school" /><SearchInput value={availableSearch} onChange={setAvailableSearch} placeholder="Search available Spells…" ariaLabel="Search available Spells" /></div><AvailableSpells state={{ progress }} selectedIds={draft.spellIds} school={availableSchool} search={availableSearch} onAdd={addSpell} /></section>
        <section className="spell-preset-loadout-column"><div className="dialog-section-head"><div><div className="panel-kicker">EDITOR</div><h3>PRESET LOADOUT</h3></div>{dirty && <Status tone="warning">UNSAVED</Status>}</div><EditablePresetName value={draft.name} editing={editingName} error={nameError} autoFocus={draft.id === null && editingName} maxLength={SPELL_PRESET_NAME_MAX_LENGTH} onChange={rename} onStartEdit={beginRename} onCommit={commitName} onCancel={cancelRename} /><div className="spell-preset-contents">{draft.spellIds.map((spellId, index) => { const available = isSpellUnlocked(state, spellId); const spell = available ? SPELLS[spellId] : null; return <PresetLoadoutSpellTile key={`${spellId}-${index}`} spell={spell} spellId={spellId} index={index} total={draft.spellIds.length} rank={available ? getSpellRank(state, spellId) : null} focusCost={available ? getSpellAutoCastFocusCost(state, spellId) : null} onMove={moveSpell} onRemove={removeSpell} /> })}{!draft.spellIds.length && <div className="spell-preset-empty-loadout"><strong><Plus size={14} aria-hidden="true" /> ADD SPELLS</strong><span className="spell-preset-empty-caption">Choose Spells from the library.</span><span className="spell-preset-empty-legacy">NO SPELLS IN THIS PRESET</span></div>}</div><FocusBudget projection={projection} maxFocus={focus.maxFocus} /></section>
      </div>
      <footer className="spell-preset-dialog-foot"><div className="spell-preset-dialog-status">{savedFeedback && <Status tone="success">✓ SAVED</Status>}{!savedFeedback && applyError && <p role="alert">{applyError}</p>}{!savedFeedback && !applyError && projection.validSpellIds.length === 0 && <Status tone="warning">Add at least one Spell to enable Apply.</Status>}{!savedFeedback && !applyError && projection.validSpellIds.length > 0 && !projection.canApply && <Status tone="warning">Need {Math.max(0, projection.totalAfterApply - state.player.maxFocus)} more Focus.</Status>}{!savedFeedback && !applyError && projection.canApply && projection.unavailableSpellIds.length > 0 && <Status tone="warning">{projection.unavailableSpellIds.length} unavailable Spell{projection.unavailableSpellIds.length === 1 ? '' : 's'} will be skipped.</Status>}</div><div className="spell-preset-dialog-actions"><Button variant="ghost" disabled={!draft.id} onClick={duplicate}>DUPLICATE</Button><Button variant="danger" disabled={!draft.id} onClick={deletePreset}>DELETE</Button><span className="spell-preset-dialog-spacer" /><Button variant="ghost" onClick={requestClose}>CANCEL</Button><Button variant="secondary" onClick={save}>{savedFeedback ? '✓ SAVED' : 'SAVE'}</Button><GameTooltip content={<TooltipContent title="Apply" description="Replace live Auto-Cast with this loadout when Focus allows it." />}><Button variant="success" disabled={!projection.canApply} onClick={apply}>APPLY</Button></GameTooltip></div></footer>
      {confirmation && <ConfirmationDialog confirmation={confirmation} draftName={draft.name} onCancel={() => setConfirmation(null)} onDiscard={discardConfirmation} onSave={saveConfirmation} />}
    </div>
  </div>
}

function AvailableSpells({ state, selectedIds, school, search, onAdd }: { state: Pick<GameState, 'progress'>; selectedIds: SpellId[]; school: 'all' | SchoolId; search: string; onAdd: (spellId: SpellId) => void }) {
  const query = search.trim().toLocaleLowerCase()
  const spells = useMemo(() => getAllSpellsInOrder().filter((spell) => {
    if (school !== 'all' && spell.school !== school) return false
    if (!isSpellUnlocked(state, spell.id)) return false
    return !query || `${spell.name} ${spell.description}`.toLocaleLowerCase().includes(query)
  }), [state.progress, school, query])
  return <div className="spell-preset-available-list">{spells.map((spell) => { const added = selectedIds.includes(spell.id); const rank = getSpellRank(state, spell.id) ?? 1; const focusCost = getSpellAutoCastFocusCost(state, spell.id) ?? rank * 10; return <PresetAvailableSpellTile key={spell.id} spell={spell} rank={rank} focusCost={focusCost} added={added} onAdd={onAdd} /> })}{!spells.length && <div className="spell-preset-library-empty">No known Spells match this library filter.</div>}</div>
}

function FocusBudget({ projection, maxFocus }: { projection: ReturnType<typeof getSpellPresetFocusProjection>; maxFocus: number }) {
  return <FocusBudgetMeter autoCastFocus={projection.presetAutoCastFocus} otherFocus={projection.nonAutoCastFocus} totalFocus={projection.totalAfterApply} maxFocus={maxFocus} freeFocus={projection.freeAfterApply} />
}

function PresetMiniIcons({ spellIds }: { spellIds: readonly SpellId[] }) {
  const shown = spellIds.slice(0, 4)
  const remaining = Math.max(0, spellIds.length - shown.length)
  return <span className="spell-preset-mini-icons">{shown.map((spellId) => { const spell = SPELLS[spellId]; return <GameTooltip key={spellId} content={<TooltipContent title={spell?.name ?? 'Unavailable Spell'} description={spell ? 'Spell saved in this preset.' : 'This saved slot is currently unavailable.'} />}><span>{spell ? <SpellIcon school={spell.school} size="small" /> : <SpellIcon school="fire" locked size="small" />}</span></GameTooltip> })}{remaining > 0 && <span className="spell-preset-mini-more">+{remaining}</span>}</span>
}

function ConfirmationDialog({ confirmation, draftName, onCancel, onDiscard, onSave }: { confirmation: PendingAction; draftName: string; onCancel: () => void; onDiscard: () => void; onSave: () => void }) {
  if (confirmation.kind === 'delete') return <div className="spell-preset-confirm-layer"><div className="spell-preset-confirmation" role="alertdialog" aria-modal="true" aria-labelledby="preset-delete-title"><div className="panel-kicker">CONFIRM ACTION</div><h3 id="preset-delete-title">DELETE “{draftName || DEFAULT_SPELL_PRESET_NAME}”?</h3><p>This removes the saved preset. Current live Auto-Cast remains unchanged.</p><div><Button variant="ghost" onClick={onCancel}>CANCEL</Button><Button variant="danger" onClick={onDiscard}>DELETE</Button></div></div></div>
  const switching = confirmation.kind === 'select'
  return <div className="spell-preset-confirm-layer"><div className="spell-preset-confirmation" role="alertdialog" aria-modal="true" aria-labelledby="preset-discard-title"><div className="panel-kicker">UNSAVED CHANGES</div><h3 id="preset-discard-title">{switching ? 'SAVE CHANGES?' : 'DISCARD UNSAVED CHANGES?'}</h3><p>{switching ? 'Save this draft before switching presets?' : 'Your local draft has changes that have not been saved.'}</p><div><Button variant="ghost" onClick={onCancel}>CANCEL</Button><Button variant="danger" onClick={onDiscard}>DISCARD</Button><Button variant="secondary" onClick={onSave}>{switching ? 'SAVE' : 'SAVE & CLOSE'}</Button></div></div></div>
}
