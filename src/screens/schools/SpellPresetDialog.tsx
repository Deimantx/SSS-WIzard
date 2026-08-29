import { useEffect, useMemo, useRef, useState } from 'react'
import { FRAGMENT_ORDER, SCHOOLS } from '../../game/data/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { DEFAULT_SPELL_PRESET_NAME, doesCurrentAutoCastMatchPreset, getSpellPresetFocusBreakdown, getSpellPresetFocusProjection, getSpellAutoCastFocusCost, isSpellUnlocked, SPELL_PRESET_NAME_MAX_LENGTH } from '../../game/systems/spells'
import { formatSpellRank, getAllSpellsInOrder, getSpellRank } from '../../game/systems/spells/spellProgression'
import type { GameState, SchoolId, SpellId, SpellPreset, SpellPresetId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { Button, FilterBar, GameTooltip, SearchInput, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
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

  const startNewDraft = () => { setSelectedId(null); setDraft(newDraft()); setApplyError(null) }
  const selectSavedPreset = (preset: SpellPreset) => { setSelectedId(preset.id); setDraft(clonePreset(preset)); setApplyError(null) }
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
    let id = draft.id
    if (!id) id = createSpellPreset(draft.name)
    const candidate: SpellPreset = { id, name: draft.name, spellIds: [...draft.spellIds] }
    if (!saveSpellPreset(candidate)) { setApplyError('This preset could not be saved.'); return null }
    const saved = useGameStore.getState().spellPresets.presets.find((preset) => preset.id === id)
    if (!saved) { setApplyError('This preset could not be saved.'); return null }
    const next = clonePreset(saved)
    setSelectedId(id)
    setDraft(next)
    setApplyError(null)
    return next
  }

  const save = () => { persistDraft() }
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
  const rename = (name: string) => { setDraft((current) => current ? { ...current, name } : current); setApplyError(null) }
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
      <header className="spell-preset-dialog-head"><div><div className="panel-kicker">AUTO-CAST CONFIGURATION</div><h2 id="spell-preset-dialog-title">SPELL PRESET MANAGER</h2><p id="spell-preset-dialog-description">Build reusable Auto-Cast setups and preview Focus usage.</p></div><Button variant="ghost" ariaLabel="Close spell preset manager" onClick={requestClose}>×</Button></header>
      <div className="spell-preset-dialog-body">
        <aside className="spell-preset-sidebar"><div className="spell-preset-list-head"><strong>PRESETS</strong><Button variant="secondary" onClick={() => requestAction({ kind: 'new' })}>+ NEW</Button></div>{draft.id === null && <button type="button" className="spell-preset-list-row spell-preset-local-row is-selected" onClick={() => requestAction({ kind: 'new' })}><span>New Preset</span><Status tone={dirty ? 'warning' : 'neutral'}>{dirty ? 'DIRTY' : 'UNSAVED'}</Status></button>}{presetRows.map(({ preset, projection: presetProjection }) => { const active = activePresetId === preset.id; const selected = preset.id === selectedId; const selectedDirty = selected && dirty; return <button type="button" className={`spell-preset-list-row${selected ? ' is-selected' : ''}`} key={preset.id} onClick={() => requestAction({ kind: 'select', preset })}><span>{preset.name}</span><small>{preset.spellIds.length} Spells · {presetProjection.presetAutoCastFocus} Focus</small><Status tone={selectedDirty ? 'warning' : active ? 'success' : 'neutral'}>{selectedDirty ? 'DIRTY' : active ? 'ACTIVE' : 'SAVED'}</Status></button> })}</aside>
        <section className="spell-preset-available-column"><div className="dialog-section-head"><div><div className="panel-kicker">ACTION LIBRARY</div><h3>AVAILABLE SPELLS</h3></div><span>Known Spells only</span></div><div className="dialog-filter-row"><FilterBar options={[{ value: 'all' as const, label: 'All' }, ...FRAGMENT_ORDER.map((school) => ({ value: school, label: <><span className="schools-filter-glyph" aria-hidden="true">{SCHOOLS[school].glyph}</span>{SCHOOLS[school].name}</> }))]} value={availableSchool} onChange={setAvailableSchool} ariaLabel="Available spell school" /><SearchInput value={availableSearch} onChange={setAvailableSearch} placeholder="Search available Spells…" ariaLabel="Search available Spells" /></div><AvailableSpells state={{ progress }} selectedIds={draft.spellIds} school={availableSchool} search={availableSearch} onAdd={addSpell} /></section>
        <section className="spell-preset-loadout-column"><div className="dialog-section-head"><div><div className="panel-kicker">EDITOR</div><h3>PRESET LOADOUT</h3></div>{dirty && <Status tone="warning">UNSAVED</Status>}</div><label className="spell-preset-name-field"><span>Preset name</span><input data-autofocus="true" value={draft.name} maxLength={SPELL_PRESET_NAME_MAX_LENGTH} onChange={(event) => rename(event.target.value)} aria-label="Preset name" /></label><div className="spell-preset-contents">{draft.spellIds.map((spellId, index) => { const available = isSpellUnlocked(state, spellId); const spell = available ? SPELLS[spellId] : null; const displayName = spell?.name ?? '???'; return <div className="spell-preset-content-row" key={`${spellId}-${index}`}><span className="spell-preset-order">{index + 1}</span><SpellIcon school={spell?.school ?? 'fire'} locked={!available} size="small" /><div><strong>{displayName}</strong><small>{spell ? `${formatSpellRank(getSpellRank(state, spellId) ?? 1)} · ${SCHOOLS[spell.school].name} · ${getSpellAutoCastFocusCost(state, spellId) ?? 10} Focus` : 'Unavailable · saved slot retained'}</small></div><div className="spell-preset-row-actions"><Button variant="ghost" ariaLabel={`Move ${available ? displayName : 'spell'} up`} disabled={index === 0} onClick={() => moveSpell(index, -1)}>↑</Button><Button variant="ghost" ariaLabel={`Move ${available ? displayName : 'spell'} down`} disabled={index === draft.spellIds.length - 1} onClick={() => moveSpell(index, 1)}>↓</Button><Button variant="ghost" ariaLabel={`Remove ${available ? displayName : 'spell'}`} onClick={() => removeSpell(spellId)}>×</Button></div></div> })}{!draft.spellIds.length && <div className="spell-preset-empty-loadout"><strong>NO SPELLS IN THIS PRESET</strong><span>Add Spells from the library.</span></div>}</div><FocusBudget projection={projection} focus={focus} /></section>
      </div>
      <footer className="spell-preset-dialog-foot"><div className="spell-preset-dialog-status">{applyError && <p role="alert">{applyError}</p>}{!applyError && projection.validSpellIds.length === 0 && <Status tone="warning">Add at least one Spell to enable Apply.</Status>}{!applyError && projection.validSpellIds.length > 0 && !projection.canApply && <Status tone="warning">Need {Math.max(0, projection.totalAfterApply - state.player.maxFocus)} more Focus.</Status>}{!applyError && projection.canApply && projection.unavailableSpellIds.length > 0 && <Status tone="warning">{projection.unavailableSpellIds.length} unavailable Spell{projection.unavailableSpellIds.length === 1 ? '' : 's'} will be skipped.</Status>}</div><div className="spell-preset-dialog-actions"><Button variant="ghost" disabled={!draft.id} onClick={duplicate}>DUPLICATE</Button><Button variant="danger" disabled={!draft.id} onClick={deletePreset}>DELETE</Button><span className="spell-preset-dialog-spacer" /><Button variant="ghost" onClick={requestClose}>CANCEL</Button><Button variant="secondary" onClick={save}>SAVE</Button><GameTooltip content={<TooltipContent title="Apply" description="Replace live Auto-Cast with this loadout when Focus allows it." />}><Button variant="success" disabled={!projection.canApply} onClick={apply}>APPLY</Button></GameTooltip></div></footer>
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
  return <div className="spell-preset-available-list">{spells.map((spell) => { const added = selectedIds.includes(spell.id); const rank = getSpellRank(state, spell.id) ?? 1; const focusCost = getSpellAutoCastFocusCost(state, spell.id) ?? rank * 10; return <GameTooltip key={spell.id} content={<TooltipContent title={spell.name} description={added ? 'Already in this preset.' : 'Add this Spell to the loadout.'} />}><button type="button" disabled={added} className="spell-preset-available-row" onClick={() => onAdd(spell.id)}><SpellIcon school={spell.school} size="small" /><span><strong>{spell.name}</strong><small>{formatSpellRank(rank)} · {focusCost} Focus</small></span><b>{added ? 'ADDED' : '+'}</b></button></GameTooltip> })}{!spells.length && <div className="spell-preset-library-empty">No known Spells match this library filter.</div>}</div>
}

function FocusBudget({ projection, focus }: { projection: ReturnType<typeof getSpellPresetFocusProjection>; focus: ReturnType<typeof getSpellPresetFocusBreakdown> }) {
  const total = projection.totalAfterApply
  const free = focus.maxFocus - total
  return <div className={`spell-preset-focus-budget${free < 0 ? ' is-over-cap' : ''}`}><div className="panel-kicker">FOCUS BUDGET</div><div><span>Auto-Cast</span><strong>{projection.presetAutoCastFocus}</strong></div><div><span>Other Systems</span><strong>{projection.nonAutoCastFocus}</strong></div><div className="spell-preset-focus-divider" /><div><span>Total</span><strong>{total} / {focus.maxFocus}</strong></div><div><span>{free < 0 ? `${Math.abs(free)} OVER CAP` : 'Free'}</span><strong>{Math.abs(free)}</strong></div></div>
}

function ConfirmationDialog({ confirmation, draftName, onCancel, onDiscard, onSave }: { confirmation: PendingAction; draftName: string; onCancel: () => void; onDiscard: () => void; onSave: () => void }) {
  if (confirmation.kind === 'delete') return <div className="spell-preset-confirm-layer"><div className="spell-preset-confirmation" role="alertdialog" aria-modal="true" aria-labelledby="preset-delete-title"><div className="panel-kicker">CONFIRM ACTION</div><h3 id="preset-delete-title">DELETE “{draftName || DEFAULT_SPELL_PRESET_NAME}”?</h3><p>This removes the saved preset. Current live Auto-Cast remains unchanged.</p><div><Button variant="ghost" onClick={onCancel}>CANCEL</Button><Button variant="danger" onClick={onDiscard}>DELETE</Button></div></div></div>
  const switching = confirmation.kind === 'select'
  return <div className="spell-preset-confirm-layer"><div className="spell-preset-confirmation" role="alertdialog" aria-modal="true" aria-labelledby="preset-discard-title"><div className="panel-kicker">UNSAVED CHANGES</div><h3 id="preset-discard-title">{switching ? 'SAVE CHANGES?' : 'DISCARD UNSAVED CHANGES?'}</h3><p>{switching ? 'Save this draft before switching presets?' : 'Your local draft has changes that have not been saved.'}</p><div><Button variant="ghost" onClick={onCancel}>CANCEL</Button><Button variant="danger" onClick={onDiscard}>DISCARD</Button><Button variant="secondary" onClick={onSave}>{switching ? 'SAVE' : 'SAVE & CLOSE'}</Button></div></div></div>
}
