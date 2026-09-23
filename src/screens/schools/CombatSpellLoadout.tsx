import { ArrowDown, ArrowUp, CircleDot, Pencil, Save, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button, GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SPELLS } from '../../game/content/spells/spells'
import { SCHOOLS } from '../../game/content/schools/schools'
import { getSpellPresetFocusBreakdown, type SpellPresetFocusState } from '../../game/systems/spells'
import type { SpellId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { SpellIcon } from './SpellIcon'
import { FocusBudgetMeter } from './FocusBudgetMeter'
import { useSpellLoadoutDnd } from './SpellLoadoutDnd'

export function CombatSpellLoadout({ focusState, onSelectSpell }: { focusState: SpellPresetFocusState; onSelectSpell?: (spellId: SpellId) => void }) {
  const presets = useGameStore((state) => state.spellPresets)
  const combat = useGameStore((state) => state.combat)
  const moveSlot = useGameStore((state) => state.moveSelectedPresetSlot)
  const removeSpell = useGameStore((state) => state.removeSpellFromSelectedPreset)
  const createPreset = useGameStore((state) => state.createSpellPreset)
  const savePreset = useGameStore((state) => state.saveSpellPreset)
  const selectPreset = useGameStore((state) => state.selectSpellPreset)
  const selectPresetForEditing = useGameStore((state) => state.selectSpellPresetForEditing)
  const renamePreset = useGameStore((state) => state.renameSpellPreset)
  const deletePreset = useGameStore((state) => state.deleteSpellPreset)
  const selected = presets.presets.find((preset) => preset.id === presets.selectedPresetId) ?? null
  const slots = combat.active && combat.activeSpellLoadout ? combat.activeSpellLoadout.slots : selected?.slots ?? []
  const focus = getSpellPresetFocusBreakdown(focusState)
  const { drag, dropTarget, beginDrag, registerTarget } = useSpellLoadoutDnd()
  const currentSignature = useMemo(() => JSON.stringify({ name: selected?.name ?? '', slots }), [selected?.name, slots])
  const [savedSignature, setSavedSignature] = useState(currentSignature)
  const [editor, setEditor] = useState<'new' | 'rename' | null>(null)
  const [editorName, setEditorName] = useState('')
  const [copyCurrent, setCopyCurrent] = useState(true)
  const [pendingPresetId, setPendingPresetId] = useState<typeof presets.selectedPresetId>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const modified = Boolean(selected && currentSignature !== savedSignature)

  useEffect(() => { setSavedSignature(currentSignature); setEditor(null); setPendingPresetId(null); setConfirmDelete(false) }, [selected?.id])

  const beginNew = () => { setEditor('new'); setEditorName(''); setCopyCurrent(true) }
  const beginRename = () => { if (selected) { setEditor('rename'); setEditorName(selected.name) } }
  const submitEditor = () => {
    const name = editorName.trim()
    if (!name) return
    if (editor === 'rename' && selected) { renamePreset(selected.id, name); setEditor(null); return }
    if (editor === 'new') {
      const id = createPreset(name)
      if (copyCurrent && selected) savePreset({ id, name, slots: selected.slots })
      selectPresetForEditing(id)
      setEditor(null)
    }
  }
  const saveCurrent = () => { if (selected) { savePreset({ id: selected.id, name: selected.name, slots }); setSavedSignature(currentSignature) } }
  const requestPresetChange = (id: typeof presets.selectedPresetId) => {
    if (!id || id === selected?.id) return
    if (modified) setPendingPresetId(id)
    else selectPreset(id)
  }
  const discardAndSwitch = () => { if (pendingPresetId) { selectPreset(pendingPresetId); setPendingPresetId(null) } }

  return <section className="schools-loadout-panel">
    <div className="section-heading loadout-heading"><div><div className="panel-kicker">COMBAT PREPARATION</div><h2>Combat Loadout</h2><p>{combat.active ? 'Active battle snapshot' : 'Drag spells onto each other to swap positions.'}</p></div><div className="loadout-preset-controls"><label>Preset <select aria-label="Active combat loadout preset" value={selected?.id ?? ''} onChange={event => requestPresetChange(event.target.value as typeof presets.selectedPresetId)}>{presets.presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label>{modified && <span className="loadout-modified">MODIFIED</span>}<GameTooltip content={<TooltipContent title="Save preset" description="Save this loadout's order and Auto-Cast state to the active preset." />}><Button variant="secondary" ariaLabel="Save active combat loadout preset" onClick={saveCurrent}><Save size={14} aria-hidden="true" /> SAVE</Button></GameTooltip><Button variant="ghost" onClick={beginNew}>NEW</Button><Button variant="ghost" disabled={!selected} onClick={beginRename}><Pencil size={14} aria-hidden="true" /> RENAME</Button><GameTooltip accent="warning" content={<TooltipContent title="Delete preset" description="Remove the active saved loadout after confirmation." />}><Button variant="ghost" disabled={!selected} ariaLabel="Delete active combat loadout preset" onClick={() => setConfirmDelete(true)}><Trash2 size={14} aria-hidden="true" /> DELETE</Button></GameTooltip></div></div>
    {editor && <div className="loadout-inline-editor"><strong>{editor === 'new' ? 'NEW PRESET' : 'RENAME PRESET'}</strong><input aria-label={editor === 'new' ? 'New preset name' : 'Rename preset'} value={editorName} onChange={event => setEditorName(event.target.value)} placeholder="Preset name" onKeyDown={event => { if (event.key === 'Enter') submitEditor(); if (event.key === 'Escape') setEditor(null) }} />{editor === 'new' && <label><input type="checkbox" checked={copyCurrent} onChange={event => setCopyCurrent(event.target.checked)} /> Copy current loadout</label>}<Button variant="ghost" onClick={() => setEditor(null)}>CANCEL</Button><Button variant="secondary" disabled={!editorName.trim()} onClick={submitEditor}>{editor === 'new' ? 'CREATE' : 'SAVE'}</Button></div>}
    {pendingPresetId && <div className="loadout-inline-confirm" role="alert"><span>Unsaved changes to “{selected?.name}”.</span><Button variant="ghost" onClick={() => setPendingPresetId(null)}>CANCEL</Button><Button variant="danger" onClick={discardAndSwitch}>DISCARD & SWITCH</Button><Button variant="secondary" onClick={() => { saveCurrent(); discardAndSwitch() }}>SAVE & SWITCH</Button></div>}
    {confirmDelete && selected && <div className="loadout-inline-confirm" role="alert"><span>Delete “{selected.name}”?</span><Button variant="ghost" onClick={() => setConfirmDelete(false)}>CANCEL</Button><Button variant="danger" onClick={() => { deletePreset(selected.id); setConfirmDelete(false) }}>DELETE</Button></div>}
    <div className="loadout-slot-list">
      {Array.from({ length: 8 }, (_, index) => {
        const slot = slots[index]
        const spell = slot ? SPELLS[slot.spellId] : null
        return <LoadoutSlot key={`${index}-${slot?.spellId ?? 'empty'}`} index={index} totalSlots={slots.length} slot={slot} spell={spell} canEdit={!combat.active} dragging={drag?.payload.source === 'loadout' && drag.payload.fromIndex === index} dropTarget={dropTarget?.index === index} registerTarget={element => registerTarget(index, element)} onMove={moveSlot} onRemove={removeSpell} onSelect={onSelectSpell} onPointerDown={event => { if (slot && !combat.active) beginDrag({ source: 'loadout', spellId: slot.spellId, fromIndex: index }, event) }} />
      })}
    </div>
    <div className="loadout-footer"><span>{slots.length} / 8 prepared</span><FocusBudgetMeter autoCastFocus={focus.autoCastFocus} otherFocus={focus.otherFocus} totalFocus={focus.totalFocus} maxFocus={focus.maxFocus} freeFocus={focus.freeFocus} compact /></div>
  </section>
}

function LoadoutSlot({ index, totalSlots, slot, spell, canEdit, dragging, dropTarget, registerTarget, onMove, onRemove, onSelect, onPointerDown }: { index: number; totalSlots: number; slot?: { spellId: SpellId; autoCast: boolean }; spell: typeof SPELLS[SpellId] | null; canEdit: boolean; dragging: boolean; dropTarget: boolean; registerTarget: (element: HTMLElement | null) => void; onMove: (fromIndex: number, toIndex: number) => unknown; onRemove: (spellId: SpellId) => unknown; onSelect?: (spellId: SpellId) => void; onPointerDown: (event: React.PointerEvent<HTMLElement>) => void }) {
  const school = spell ? SCHOOLS[spell.school] : null
  return <article ref={registerTarget} className={`loadout-slot${slot ? '' : ' is-empty'}${!canEdit ? ' is-readonly' : ''}${dragging ? ' is-dragging' : ''}${dropTarget ? ' is-drop-target' : ''}`} style={school ? { '--school-accent': school.color } as React.CSSProperties : undefined} onClick={() => spell && onSelect?.(spell.id)} onPointerDown={onPointerDown}>
    <span className="loadout-slot-number">{String(index + 1).padStart(2, '0')}</span>
    {spell && slot ? <><SpellIcon school={spell.school} spellId={spell.id} size="small" /><div className="loadout-slot-copy"><strong>{spell.name}</strong><small>{slot.autoCast ? 'AUTO-CAST' : 'MANUAL'} · {school?.name.toUpperCase()}</small></div><span className={`loadout-slot-mode${slot.autoCast ? ' is-auto' : ''}`}><CircleDot size={11} aria-hidden="true" />{slot.autoCast ? 'AUTO' : 'MANUAL'}</span>{canEdit && <div className="loadout-slot-actions"><GameTooltip content={<TooltipContent title="Move earlier" description="Move this spell one slot up." />}><Button dataStaticMotion dataNoDrag icon variant="ghost" ariaLabel={`Move ${spell.name} earlier`} disabled={index === 0} onClick={() => onMove(index, index - 1)}><ArrowUp size={13} aria-hidden="true" /></Button></GameTooltip><GameTooltip content={<TooltipContent title="Move later" description="Move this spell one slot down." />}><Button dataStaticMotion dataNoDrag icon variant="ghost" ariaLabel={`Move ${spell.name} later`} disabled={index >= totalSlots - 1} onClick={() => onMove(index, index + 1)}><ArrowDown size={13} aria-hidden="true" /></Button></GameTooltip><GameTooltip accent="warning" content={<TooltipContent title="Remove from Loadout" description="Remove this Spell from the selected loadout." />}><Button dataStaticMotion dataNoDrag icon variant="ghost" ariaLabel={`Remove ${spell.name} from Loadout`} onClick={() => onRemove(spell.id)}><X size={13} aria-hidden="true" /></Button></GameTooltip></div>}</> : <><span className="loadout-slot-empty-copy">EMPTY SLOT</span><small>Drop a Spell here</small></>}
  </article>
}
