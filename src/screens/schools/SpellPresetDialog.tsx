import { useEffect, useMemo, useState } from 'react'
import { FRAGMENT_ORDER, SCHOOLS } from '../../game/data/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { getSpellPresetFocusProjection, isSpellUnlocked, SPELL_PRESET_NAME_MAX_LENGTH } from '../../game/systems/spells'
import { getAllSpellsInOrder } from '../../game/systems/spells/spellProgression'
import type { GameState, SchoolId, SpellId, SpellPreset } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { Button, FilterBar, GameTooltip, SearchInput, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SpellIcon } from './SpellIcon'

type DraftPreset = SpellPreset

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
  const state = { spellPresets, progress, activities, player: { maxFocus }, debug }
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftPreset | null>(null)
  const [availableSchool, setAvailableSchool] = useState<'all' | SchoolId>('all')
  const [availableSearch, setAvailableSearch] = useState('')

  useEffect(() => {
    if (!open) return
    const selected = spellPresets.presets.find((preset) => preset.id === selectedId) ?? spellPresets.presets[0]
    setSelectedId(selected?.id ?? null)
    setDraft(selected ? { ...selected, spellIds: [...selected.spellIds] } : null)
  // Opening and closing the dialog is the synchronization boundary. Edits
  // remain local until Save, while store changes explicitly refresh below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, spellPresets, selectedId])

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open, onClose])

  if (!open) return null
  const selectPreset = (preset: SpellPreset) => { setSelectedId(preset.id); setDraft({ ...preset, spellIds: [...preset.spellIds] }) }
  const create = () => {
    const before = new Set(spellPresets.presets.map((preset) => preset.id))
    createSpellPreset('New Preset')
    const created = useGameStore.getState().spellPresets.presets.find((preset) => !before.has(preset.id))
    if (created) selectPreset(created)
  }
  const save = () => { if (!draft) return; saveSpellPreset(draft); setDraft({ ...draft, spellIds: [...draft.spellIds] }) }
  const apply = () => { if (!draft) return; saveSpellPreset(draft); applySpellPreset(draft.id); onClose() }
  const rename = (name: string) => setDraft((current) => current ? { ...current, name } : current)
  const removeSpell = (spellId: SpellId) => setDraft((current) => current ? { ...current, spellIds: current.spellIds.filter((id) => id !== spellId) } : current)
  const moveSpell = (index: number, direction: -1 | 1) => setDraft((current) => {
    if (!current || index + direction < 0 || index + direction >= current.spellIds.length) return current
    const spellIds = [...current.spellIds]
    const [item] = spellIds.splice(index, 1)
    spellIds.splice(index + direction, 0, item)
    return { ...current, spellIds }
  })
  const addSpell = (spellId: SpellId) => setDraft((current) => current && !current.spellIds.includes(spellId) ? { ...current, spellIds: [...current.spellIds, spellId] } : current)
  const deletePreset = () => {
    if (!draft || !window.confirm(`Delete ${draft.name}?`)) return
    const oldId = draft.id
    deleteSpellPreset(oldId)
    const replacement = useGameStore.getState().spellPresets.presets[0]
    if (replacement) selectPreset(replacement)
    else { setSelectedId(null); setDraft(null) }
  }
  const duplicate = () => { if (!draft) return; const before = new Set(spellPresets.presets.map((preset) => preset.id)); duplicateSpellPreset(draft.id); const copy = useGameStore.getState().spellPresets.presets.find((preset) => !before.has(preset.id)); if (copy) selectPreset(copy) }
  return <div className="spell-preset-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="spell-preset-dialog" role="dialog" aria-modal="true" aria-labelledby="spell-preset-dialog-title">
      <div className="spell-preset-dialog-head"><div><div className="panel-kicker">AUTO-CAST CONFIGURATION</div><h2 id="spell-preset-dialog-title">Saved Presets</h2></div><Button variant="ghost" ariaLabel="Close saved presets" onClick={onClose}>×</Button></div>
      <div className="spell-preset-dialog-body">
        <aside className="spell-preset-list"><div className="spell-preset-list-head"><strong>Saved Presets</strong><Button variant="secondary" onClick={create}>NEW</Button></div>{spellPresets.presets.map((preset) => { const projection = getSpellPresetFocusProjection(state, preset); return <button type="button" className={`spell-preset-list-row${preset.id === selectedId ? ' is-selected' : ''}`} key={preset.id} onClick={() => selectPreset(preset)}><span>{preset.name}</span><small>{preset.spellIds.length} spells · {projection.presetAutoCastFocus} Focus</small></button> })}{!spellPresets.presets.length && <p className="muted">No presets yet. Create one to begin.</p>}</aside>
        {draft ? <div className="spell-preset-editor"><div className="spell-preset-editor-head"><label><span>Preset name</span><input value={draft.name} maxLength={SPELL_PRESET_NAME_MAX_LENGTH} onChange={(event) => rename(event.target.value)} /></label><div className="spell-preset-editor-actions"><Button variant="ghost" onClick={duplicate}>DUPLICATE</Button><Button variant="danger" onClick={deletePreset}>DELETE</Button></div></div><div className="spell-preset-editor-grid"><section><div className="dialog-section-head"><h3>Available Spells</h3><span>Unlocked spells can be added.</span></div><div className="dialog-filter-row"><FilterBar options={[{ value: 'all' as const, label: 'All' }, ...FRAGMENT_ORDER.map((school) => ({ value: school, label: SCHOOLS[school].name }))]} value={availableSchool} onChange={setAvailableSchool} ariaLabel="Available spell school" /><SearchInput value={availableSearch} onChange={setAvailableSearch} placeholder="Search available spells…" ariaLabel="Search available spells" /></div><AvailableSpells state={state} selectedIds={draft.spellIds} school={availableSchool} search={availableSearch} onAdd={addSpell} /></section><section><div className="dialog-section-head"><h3>Preset Contents</h3><span>{draft.spellIds.length} spells · {getSpellPresetFocusProjection(state, draft).presetAutoCastFocus} Focus</span></div><div className="spell-preset-contents">{draft.spellIds.map((spellId, index) => { const available = isSpellUnlocked(state, spellId); const spell = SPELLS[spellId]; const displayName = available ? spell.name : '???'; return <div className="spell-preset-content-row" key={spellId}><span className="spell-preset-order">{index + 1}</span><div><strong>{displayName}</strong><small>{spell ? `${SCHOOLS[spell.school].name} · ${available ? 'Available' : 'Unavailable'}` : 'Unavailable'}</small></div><div className="spell-preset-row-actions"><Button variant="ghost" ariaLabel={`Move ${available ? displayName : 'spell'} up`} disabled={index === 0} onClick={() => moveSpell(index, -1)}>↑</Button><Button variant="ghost" ariaLabel={`Move ${available ? displayName : 'spell'} down`} disabled={index === draft.spellIds.length - 1} onClick={() => moveSpell(index, 1)}>↓</Button><Button variant="ghost" ariaLabel={`Remove ${available ? displayName : 'spell'}`} onClick={() => removeSpell(spellId)}>×</Button></div></div> })}{!draft.spellIds.length && <p className="muted">Add unlocked spells from the library.</p>}</div></section></div></div> : <div className="spell-preset-no-selection"><h3>Preset Contents</h3><p>Create a preset to save a reusable Auto-Cast set.</p></div>}
      </div>
      {draft && <div className="spell-preset-dialog-foot"><div>{(() => { const projection = getSpellPresetFocusProjection(state, draft); return projection.canApply ? <Status tone="success">{projection.totalAfterApply} / {state.player.maxFocus} Focus after Apply</Status> : <Status tone="warning">Requires {projection.totalAfterApply - state.player.maxFocus} more Focus</Status> })()}</div><div><Button variant="ghost" onClick={onClose}>CANCEL</Button><GameTooltip content={<TooltipContent title="Save" description="Persist this draft without changing live Auto-Cast." />}><Button variant="secondary" onClick={save}>SAVE</Button></GameTooltip><GameTooltip content={<TooltipContent title="Apply" description="Replace the live Auto-Cast selection atomically with this preset." />}><Button variant="success" onClick={apply}>APPLY</Button></GameTooltip></div></div>}
    </div>
  </div>
}

function AvailableSpells({ state, selectedIds, school, search, onAdd }: { state: Pick<GameState, 'progress'>; selectedIds: SpellId[]; school: 'all' | SchoolId; search: string; onAdd: (spellId: SpellId) => void }) {
  const query = search.trim().toLocaleLowerCase()
  const spells = useMemo(() => getAllSpellsInOrder().filter((spell) => {
    if (school !== 'all' && spell.school !== school) return false
    const unlocked = isSpellUnlocked(state, spell.id)
    if (query && (!unlocked || !`${spell.name} ${spell.description}`.toLocaleLowerCase().includes(query))) return false
    return true
  }), [query, school, state, selectedIds])
  return <div className="spell-preset-available-list">{spells.map((spell) => { const unlocked = isSpellUnlocked(state, spell.id); const added = selectedIds.includes(spell.id); return <GameTooltip key={spell.id} content={<TooltipContent title={unlocked ? spell.name : 'Locked spell'} description={unlocked ? (added ? 'Already in this preset.' : 'Add this spell to the draft.') : `${SCHOOLS[spell.school].name} School Level ${spell.unlockLevel} is required.`} />}><button type="button" disabled={!unlocked || added} className="spell-preset-available-row" onClick={() => onAdd(spell.id)}><SpellIcon school={spell.school} locked={!unlocked} size="small" /><span>{unlocked ? spell.name : '???'}</span><small>{unlocked ? (added ? 'ADDED' : SCHOOLS[spell.school].name) : `Requires Lv ${spell.unlockLevel}`}</small></button></GameTooltip> })}</div>
}
