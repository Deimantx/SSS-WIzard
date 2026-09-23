import { X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FRAGMENT_ORDER, SCHOOLS } from '../../game/data/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { DEFAULT_SPELL_PRESET_NAME, getSpellAutoCastFocusCost, getSpellPresetFocusBreakdown, getSpellPresetFocusProjection, getSpellPresetSignature, insertSpellAt, isSpellUnlocked, MAX_COMBAT_SPELLS, moveSpellToIndex, SPELL_PRESET_NAME_MAX_LENGTH } from '../../game/systems/spells'
import { formatSpellRank, getAllSpellsInOrder, getSpellRank } from '../../game/systems/spells/spellProgression'
import type { SpellPresetProjectionState } from '../../game/systems/spells'
import type { CanonicalSpellId, GameState, SchoolId, SpellPreset, SpellPresetId, SpellPresetSlot } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { Button, FilterBar, GameTooltip, ModalPortal, SearchInput, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { EditablePresetName } from './EditablePresetName'
import { FocusBudgetMeter } from './FocusBudgetMeter'
import { PresetAvailableSpellTile } from './PresetAvailableSpellTile'
import { PresetLoadoutSpellTile } from './PresetLoadoutSpellTile'
import { SpellIcon } from './SpellIcon'

interface DraftPreset {
  id: SpellPresetId | null
  name: string
  slots: SpellPresetSlot[]
}

type PendingAction = { kind: 'close' } | { kind: 'new' } | { kind: 'select'; preset: SpellPreset } | { kind: 'delete' }
type SpellPresetDragPayload = { source: 'available' | 'loadout'; spellId: CanonicalSpellId; fromIndex?: number }

const SPELL_PRESET_DRAG_MIME = 'application/x-sss-wizard-spell-preset'
const readSpellPresetDragPayload = (event: React.DragEvent<HTMLElement>): SpellPresetDragPayload | null => {
  try {
    const raw = event.dataTransfer.getData(SPELL_PRESET_DRAG_MIME)
    const payload = raw ? JSON.parse(raw) as SpellPresetDragPayload : null
    return payload && (payload.source === 'available' || payload.source === 'loadout') && typeof payload.spellId === 'string' ? payload : null
  } catch {
    return null
  }
}

const cloneSlots = (slots: readonly SpellPresetSlot[]) => slots.map((slot) => ({ ...slot }))
const clonePreset = (preset: SpellPreset): DraftPreset => ({ id: preset.id, name: preset.name, slots: cloneSlots(preset.slots) })
const newDraft = (): DraftPreset => ({ id: null, name: DEFAULT_SPELL_PRESET_NAME, slots: [] })
const sameSlots = (left: readonly SpellPresetSlot[], right: readonly SpellPresetSlot[]) => left.length === right.length && left.every((slot, index) => slot.spellId === right[index]?.spellId && slot.autoCast === right[index]?.autoCast)

export function SpellPresetDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const spellPresets = useGameStore((state) => state.spellPresets)
  const selectedPresetId = spellPresets.selectedPresetId
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const activities = useGameStore((state) => state.activities)
  const equipment = useGameStore((state) => state.equipment)
  const artifactProgress = useGameStore((state) => state.artifactProgress)
  const arcaneCore = useGameStore((state) => state.arcaneCore)
  const debugAllowFocusOverCap = useGameStore((state) => state.debug.allowFocusOverCap)
  const maxFocus = useGameStore((state) => state.player.maxFocus)
  const createSpellPreset = useGameStore((state) => state.createSpellPreset)
  const saveSpellPreset = useGameStore((state) => state.saveSpellPreset)
  const selectSpellPreset = useGameStore((state) => state.selectSpellPreset)
  const deleteSpellPreset = useGameStore((state) => state.deleteSpellPreset)
  const duplicateSpellPreset = useGameStore((state) => state.duplicateSpellPreset)
  const dirtyRef = useRef(false)
  const [selectedId, setSelectedId] = useState<SpellPresetId | null>(null)
  const [draft, setDraft] = useState<DraftPreset | null>(null)
  const [availableSchool, setAvailableSchool] = useState<'all' | SchoolId>('all')
  const [availableSearch, setAvailableSearch] = useState('')
  const [confirmation, setConfirmation] = useState<PendingAction | null>(null)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState(false)
  const [dragPayload, setDragPayload] = useState<SpellPresetDragPayload | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [dropFeedback, setDropFeedback] = useState<string | null>(null)
  const nameBeforeEditRef = useRef('')
  const state = useMemo<SpellPresetProjectionState>(() => ({ progress, activities, equipment, artifactProgress, arcaneCore, player: { maxFocus }, debug: { allowFocusOverCap: debugAllowFocusOverCap } }), [progress, activities, equipment, artifactProgress, arcaneCore, maxFocus, debugAllowFocusOverCap])

  useEffect(() => {
    if (!open) return
    const selected = spellPresets.presets.find((preset) => preset.id === spellPresets.selectedPresetId) ?? spellPresets.presets[0]
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
    setDragPayload(null)
    setDropTargetIndex(null)
    setDropFeedback(null)
  }, [open])

  const storedDraft = draft?.id ? spellPresets.presets.find((preset) => preset.id === draft.id) : null
  const dirty = Boolean(draft && (draft.id === null ? draft.name !== DEFAULT_SPELL_PRESET_NAME || draft.slots.length > 0 : !storedDraft || draft.name !== storedDraft.name || !sameSlots(draft.slots, storedDraft.slots)))
  dirtyRef.current = dirty
  const focus = getSpellPresetFocusBreakdown(state)
  const projection = draft ? getSpellPresetFocusProjection(state, draft) : null
  const presetRows = useMemo(() => spellPresets.presets.map((preset) => ({ preset, projection: getSpellPresetFocusProjection(state, preset) })), [spellPresets, state])

  const requestClose = () => { if (dirtyRef.current) setConfirmation({ kind: 'close' }); else onClose() }

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
    const candidate: SpellPreset = { id, name: draft.name.trim(), slots: cloneSlots(draft.slots).slice(0, MAX_COMBAT_SPELLS) }
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
    const result = selectSpellPreset(saved.id as SpellPresetId)
    if (result.ok) { onClose(); return }
    if (result.reason === 'focus') setApplyError(`Need ${result.requiredExtraFocus ?? 0} more Focus before selecting this preset.`)
    else if (result.reason === 'empty') setApplyError('Add at least one available Spell before selecting.')
    else setApplyError('This preset is no longer available.')
  }
  const requestAction = (action: Exclude<PendingAction, { kind: 'delete' }>) => { if (dirty) setConfirmation(action); else if (action.kind === 'close') onClose(); else if (action.kind === 'new') startNewDraft(); else selectSavedPreset(action.preset) }
  const rename = (name: string) => { setDraft((current) => current ? { ...current, name } : current); setNameError(null); setApplyError(null) }
  const beginRename = () => { nameBeforeEditRef.current = draft.name; setNameError(null); setEditingName(true) }
  const commitName = (name: string) => { if (!name.trim()) { setNameError('Preset name cannot be blank.'); return false }; setDraft((current) => current ? { ...current, name: name.trim() } : current); setNameError(null); setEditingName(false); nameBeforeEditRef.current = name.trim(); return true }
  const cancelRename = () => { setDraft((current) => current ? { ...current, name: nameBeforeEditRef.current } : current); setNameError(null); setEditingName(false) }
  const removeSpell = (spellId: CanonicalSpellId) => { setDraft((current) => current ? { ...current, slots: current.slots.filter((slot) => slot.spellId !== spellId) } : current); setApplyError(null) }
  const addSpell = (spellId: CanonicalSpellId) => {
    setDraft((current) => {
      if (!current) return current
      const result = insertSpellAt(current.slots, spellId, current.slots.length, { available: isSpellUnlocked(state, spellId) })
      return result.ok ? { ...current, slots: result.slots } : current
    })
    setApplyError(null)
  }
  const toggleAutoCast = (spellId: CanonicalSpellId, autoCast: boolean) => setDraft((current) => current ? { ...current, slots: current.slots.map((slot) => slot.spellId === spellId ? { ...slot, autoCast } : slot) } : current)
  const moveSpell = (index: number, direction: -1 | 1) => setDraft((current) => {
    if (!current) return current
    const slots = moveSpellToIndex(current.slots, index, index + direction)
    return slots ? { ...current, slots } : current
  })
  const startDrag = (event: React.DragEvent<HTMLElement>, payload: SpellPresetDragPayload) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(SPELL_PRESET_DRAG_MIME, JSON.stringify(payload))
    setDragPayload(payload)
    setDropFeedback(null)
  }
  const endDrag = () => { setDragPayload(null); setDropTargetIndex(null) }
  const handleDragOver = (event: React.DragEvent<HTMLElement>, index: number) => {
    if (!readSpellPresetDragPayload(event) && !dragPayload) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDropTargetIndex(index)
  }
  const handleDrop = (event: React.DragEvent<HTMLElement>, index: number) => {
    event.preventDefault()
    const payload = readSpellPresetDragPayload(event) ?? dragPayload
    setDropTargetIndex(null)
    if (!payload || !draft) return
    if (payload.source === 'available') {
      const result = insertSpellAt(draft.slots, payload.spellId, index, { available: isSpellUnlocked(state, payload.spellId) })
      if (!result.ok) {
        setDropFeedback(result.reason === 'duplicate' ? 'That Spell is already in this loadout.' : result.reason === 'full' ? 'The loadout already has eight Spells.' : 'That Spell is not currently available.')
      } else {
        setDraft({ ...draft, slots: result.slots })
        setDropFeedback(null)
        setApplyError(null)
      }
    } else {
      const fromIndex = payload.fromIndex
      const targetIndex = Math.min(index, draft.slots.length - 1)
      if (fromIndex === undefined || draft.slots[fromIndex]?.spellId !== payload.spellId) return
      const slots = moveSpellToIndex(draft.slots, fromIndex, targetIndex)
      if (slots) { setDraft({ ...draft, slots }); setDropFeedback(null); setApplyError(null) }
    }
    setDragPayload(null)
  }
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
  const activeLoadout = combat.activeSpellLoadout
  const getUsableSignature = (preset: Pick<SpellPreset, 'slots'>) => getSpellPresetSignature(getSpellPresetFocusProjection(state, preset).validSlots)

  return <ModalPortal open onClose={requestClose} onEscape={requestClose} backdropClassName="spell-preset-dialog-backdrop" surfaceClassName="spell-preset-dialog" ariaLabelledBy="spell-preset-dialog-title" ariaDescribedBy="spell-preset-dialog-description">
    <header className="spell-preset-dialog-head"><div><div className="panel-kicker">COMBAT CONFIGURATION</div><h2 id="spell-preset-dialog-title">SPELL PRESET MANAGER</h2><p id="spell-preset-dialog-description">Build an ordered combat deck of up to eight Spells. AUTO slots reserve Focus and run in slot order; MANUAL slots reserve none.</p></div><Button icon variant="ghost" ariaLabel="Close spell preset manager" onClick={requestClose}><X size={16} aria-hidden="true" /></Button></header>
    <div className="spell-preset-dialog-body">
      <aside className="spell-preset-sidebar"><div className="spell-preset-list-head"><strong>PRESETS</strong><Button variant="secondary" onClick={() => requestAction({ kind: 'new' })}>+ NEW</Button></div>{draft.id === null && <button type="button" className="spell-preset-card spell-preset-local-row is-selected" onClick={() => requestAction({ kind: 'new' })}><span className="spell-preset-card-title">{draft.name || DEFAULT_SPELL_PRESET_NAME}</span><PresetMiniIcons slots={draft.slots} /><small>{draft.slots.length}/{MAX_COMBAT_SPELLS} Slots · {projection.presetAutoCastFocus} Focus</small><Status tone="warning">UNSAVED</Status></button>}{presetRows.map(({ preset, projection: presetProjection }) => { const selected = preset.id === selectedId; const selectedDirty = selected && dirty; const usableSignature = getUsableSignature(preset); const active = activeLoadout?.presetId === preset.id && activeLoadout.signature === usableSignature; const next = activeLoadout && selectedPresetId === preset.id && presetProjection.canApply && !active; const status = selectedDirty ? 'UNSAVED' : active ? 'ACTIVE BATTLE' : next ? 'NEXT BATTLE' : selected ? 'SELECTED' : 'SAVED'; return <button type="button" className={`spell-preset-card${selected ? ' is-selected' : ''}`} key={preset.id} onClick={() => requestAction({ kind: 'select', preset })}><span className="spell-preset-card-title">{preset.name}</span><PresetMiniIcons slots={preset.slots} /><small>{preset.slots.length}/{MAX_COMBAT_SPELLS} Slots · {presetProjection.presetAutoCastFocus} Focus</small><Status tone={selectedDirty ? 'warning' : active ? 'success' : next ? 'active' : 'neutral'}>{status}</Status></button> })}</aside>
      <section className="spell-preset-available-column"><div className="dialog-section-head"><div><div className="panel-kicker">ACTION LIBRARY</div><h3>AVAILABLE SPELLS</h3></div><span>{draft.slots.length}/{MAX_COMBAT_SPELLS} slots used</span></div><div className="dialog-filter-row"><FilterBar options={[{ value: 'all' as const, label: 'All' }, ...FRAGMENT_ORDER.map((school) => ({ value: school, label: <><span className="schools-filter-glyph" aria-hidden="true">{SCHOOLS[school].glyph}</span>{SCHOOLS[school].name}</> }))]} value={availableSchool} onChange={setAvailableSchool} ariaLabel="Available spell school" /><SearchInput value={availableSearch} onChange={setAvailableSearch} placeholder="Search available Spells…" ariaLabel="Search available Spells" /></div><AvailableSpells state={state} selectedIds={draft.slots.map((slot) => slot.spellId)} full={draft.slots.length >= MAX_COMBAT_SPELLS} school={availableSchool} search={availableSearch} onAdd={addSpell} draggingSpellId={dragPayload?.source === 'available' ? dragPayload.spellId : null} onDragStart={startDrag} onDragEnd={endDrag} /></section>
      <section className="spell-preset-loadout-column"><div className="dialog-section-head"><div><div className="panel-kicker">ORDERED EDITOR</div><h3>COMBAT LOADOUT</h3></div><div className="spell-preset-header-status">{dirty && <Status tone="warning">UNSAVED</Status>}{!dirty && activeLoadout?.presetId === draft.id && <Status tone={activeLoadout.signature === getUsableSignature(draft) ? 'success' : 'active'}>{activeLoadout.signature === getUsableSignature(draft) ? 'ACTIVE BATTLE' : 'NEXT BATTLE'}</Status>}{dropFeedback && <span className="spell-preset-drag-feedback" role="status">{dropFeedback}</span>}</div></div><EditablePresetName value={draft.name} editing={editingName} error={nameError} autoFocus={draft.id === null && editingName} maxLength={SPELL_PRESET_NAME_MAX_LENGTH} onChange={rename} onStartEdit={beginRename} onCommit={commitName} onCancel={cancelRename} /><div className="spell-preset-contents">{Array.from({ length: MAX_COMBAT_SPELLS }, (_, index) => { const slot = draft.slots[index] ?? null; const available = Boolean(slot && isSpellUnlocked(state, slot.spellId)); const spell = slot && available ? SPELLS[slot.spellId] : null; return <PresetLoadoutSpellTile key={slot?.spellId ?? `empty-${index}`} spell={spell} slot={slot} index={index} total={draft.slots.length} rank={slot && available ? getSpellRank(state, slot.spellId) : null} focusCost={slot && available ? getSpellAutoCastFocusCost(state, slot.spellId) : null} dragging={Boolean(slot && dragPayload?.source === 'loadout' && dragPayload.spellId === slot.spellId)} dropTarget={dropTargetIndex === index} onMove={moveSpell} onRemove={removeSpell} onToggleAutoCast={toggleAutoCast} onDragStart={(event, spellId, fromIndex) => startDrag(event, { source: 'loadout', spellId, fromIndex })} onDragEnd={endDrag} onDragOver={handleDragOver} onDrop={handleDrop} /> })}</div><FocusBudget projection={projection} maxFocus={focus.maxFocus} /></section>
    </div>
    <footer className="spell-preset-dialog-foot"><div className="spell-preset-dialog-status">{savedFeedback && <Status tone="success">✓ SAVED</Status>}{!savedFeedback && applyError && <p role="alert">{applyError}</p>}{!savedFeedback && !applyError && projection.validSpellIds.length === 0 && <Status tone="warning">Add at least one available Spell to select this preset.</Status>}{!savedFeedback && !applyError && projection.validSpellIds.length > 0 && !projection.canApply && <Status tone="warning">Need {Math.max(0, projection.totalAfterApply - state.player.maxFocus)} more Focus.</Status>}{!savedFeedback && !applyError && projection.canApply && projection.unavailableSpellIds.length > 0 && <Status tone="warning">{projection.unavailableSpellIds.length} unavailable slot{projection.unavailableSpellIds.length === 1 ? '' : 's'} will be skipped.</Status>}</div><div className="spell-preset-dialog-actions"><Button variant="ghost" disabled={!draft.id} onClick={duplicate}>DUPLICATE</Button><Button variant="danger" disabled={!draft.id} onClick={deletePreset}>DELETE</Button><span className="spell-preset-dialog-spacer" /><Button variant="ghost" onClick={requestClose}>CANCEL</Button><Button variant="secondary" onClick={save}>{savedFeedback ? '✓ SAVED' : 'SAVE'}</Button><GameTooltip content={<TooltipContent title="Select preset" description={combat.active ? 'Store this selection for the next enemy battle.' : 'Use this ordered loadout for the next battle.'} />}><Button variant="success" disabled={!projection.canApply} onClick={apply}>SELECT PRESET</Button></GameTooltip></div></footer>
    {confirmation && <ConfirmationDialog confirmation={confirmation} draftName={draft.name} onCancel={() => setConfirmation(null)} onDiscard={discardConfirmation} onSave={saveConfirmation} />}
  </ModalPortal>
}

function AvailableSpells({ state, selectedIds, full, school, search, onAdd, draggingSpellId, onDragStart, onDragEnd }: { state: Pick<GameState, 'progress' | 'equipment' | 'artifactProgress' | 'arcaneCore'>; selectedIds: CanonicalSpellId[]; full: boolean; school: 'all' | SchoolId; search: string; onAdd: (spellId: CanonicalSpellId) => void; draggingSpellId: CanonicalSpellId | null; onDragStart: (event: React.DragEvent<HTMLElement>, payload: SpellPresetDragPayload) => void; onDragEnd: () => void }) {
  const query = search.trim().toLocaleLowerCase()
  const spells = useMemo(() => getAllSpellsInOrder().filter((spell) => {
    if (school !== 'all' && spell.school !== school) return false
    if (!isSpellUnlocked(state, spell.id)) return false
    return !query || `${spell.name} ${spell.description}`.toLocaleLowerCase().includes(query)
  }), [state.progress, state.equipment, state.artifactProgress, state.arcaneCore, school, query])
  return <div className="spell-preset-available-list">{spells.map((spell) => { const added = selectedIds.includes(spell.id); const rank = getSpellRank(state, spell.id); const focusCost = getSpellAutoCastFocusCost(state, spell.id); if (rank === null || focusCost === null) return null; return <PresetAvailableSpellTile key={spell.id} spell={spell} rank={rank} focusCost={focusCost} added={added} disabled={full && !added} dragging={draggingSpellId === spell.id} onAdd={onAdd} onDragStart={(event, spellId) => onDragStart(event, { source: 'available', spellId })} onDragEnd={onDragEnd} /> })}{!spells.length && <div className="spell-preset-library-empty">No known Spells match this library filter.</div>}</div>
}

function FocusBudget({ projection, maxFocus }: { projection: ReturnType<typeof getSpellPresetFocusProjection>; maxFocus: number }) {
  return <FocusBudgetMeter autoCastFocus={projection.presetAutoCastFocus} otherFocus={projection.nonAutoCastFocus} totalFocus={projection.totalAfterApply} maxFocus={maxFocus} freeFocus={projection.freeAfterApply} compact={false} />
}

function PresetMiniIcons({ slots }: { slots: readonly SpellPresetSlot[] }) {
  const shown = slots.slice(0, 4)
  const remaining = Math.max(0, slots.length - shown.length)
  return <span className="spell-preset-mini-icons">{shown.map((slot) => { const spell = SPELLS[slot.spellId]; return <GameTooltip key={slot.spellId} content={<TooltipContent title={spell?.name ?? 'Unavailable Spell'} description={slot.autoCast ? 'AUTO slot · included in Auto-Cast priority.' : 'MANUAL slot · no Auto-Cast Focus reserved.'} />}><span>{spell ? <SpellIcon school={spell.school} spellId={slot.spellId} size="small" /> : <SpellIcon school="fire" locked size="small" />}</span></GameTooltip> })}{remaining > 0 && <span className="spell-preset-mini-more">+{remaining}</span>}</span>
}

function ConfirmationDialog({ confirmation, draftName, onCancel, onDiscard, onSave }: { confirmation: PendingAction; draftName: string; onCancel: () => void; onDiscard: () => void; onSave: () => void }) {
  if (confirmation.kind === 'delete') return <div className="spell-preset-confirm-layer"><div className="spell-preset-confirmation" role="alertdialog" aria-modal="true" aria-labelledby="preset-delete-title"><div className="panel-kicker">CONFIRM ACTION</div><h3 id="preset-delete-title">DELETE “{draftName || DEFAULT_SPELL_PRESET_NAME}”?</h3><p>This removes the saved preset. The active battle snapshot remains unchanged.</p><div><Button variant="ghost" onClick={onCancel}>CANCEL</Button><Button variant="danger" onClick={onDiscard}>DELETE</Button></div></div></div>
  const switching = confirmation.kind === 'select'
  return <div className="spell-preset-confirm-layer"><div className="spell-preset-confirmation" role="alertdialog" aria-modal="true" aria-labelledby="preset-discard-title"><div className="panel-kicker">UNSAVED CHANGES</div><h3 id="preset-discard-title">{switching ? 'SAVE CHANGES?' : 'DISCARD UNSAVED CHANGES?'}</h3><p>{switching ? 'Save this draft before switching presets?' : 'Your local draft has changes that have not been saved.'}</p><div><Button variant="ghost" onClick={onCancel}>CANCEL</Button><Button variant="danger" onClick={onDiscard}>DISCARD</Button><Button variant="secondary" onClick={onSave}>{switching ? 'SAVE' : 'SAVE & CLOSE'}</Button></div></div></div>
}
