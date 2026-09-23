import { ArrowDown, ArrowUp, CircleDot, Eye, Pencil, Settings2, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button, GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SpellCardTooltip } from '../../components/spells/SpellCardTooltip'
import { SPELLS } from '../../game/content/spells/spells'
import { SCHOOLS } from '../../game/content/schools/schools'
import { formatAutomationCondition, formatSpellAutomationSummary, getSpellAutomationConfig, getSpellPresetFocusBreakdown, type SpellPresetFocusState } from '../../game/systems/spells'
import type { SpellAutomationConfig, SpellId, SpellPresetSlot } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { SpellIcon } from './SpellIcon'
import { FocusBudgetMeter } from './FocusBudgetMeter'
import { useSpellLoadoutDnd } from './SpellLoadoutDnd'
import { CombatAutomationOverviewModal, SpellAutomationModal } from './SpellAutomationModals'
import { useGameContextMenu } from '../../ui/context-menu/GameContextMenuProvider'
import { buildSpellDetailPresentation, type SpellPresentationState } from './spellDetailPresentation'

type AutomationEditorOrigin = 'overview' | 'direct'

export function CombatSpellLoadout({ focusState, spellPresentationState, onSelectSpell, automationSpellId = null, onAutomationRequestHandled }: { focusState: SpellPresetFocusState; spellPresentationState: SpellPresentationState; onSelectSpell?: (spellId: SpellId) => void; automationSpellId?: SpellId | null; onAutomationRequestHandled?: () => void }) {
  const presets = useGameStore((state) => state.spellPresets)
  const combat = useGameStore((state) => state.combat)
  const moveSlot = useGameStore((state) => state.moveSelectedPresetSlot)
  const removeSpell = useGameStore((state) => state.removeSpellFromSelectedPreset)
  const createPreset = useGameStore((state) => state.createSpellPreset)
  const savePreset = useGameStore((state) => state.saveSpellPreset)
  const selectPresetForEditing = useGameStore((state) => state.selectSpellPresetForEditing)
  const renamePreset = useGameStore((state) => state.renameSpellPreset)
  const deletePreset = useGameStore((state) => state.deleteSpellPreset)
  const setPresetSlotAutoCast = useGameStore((state) => state.setPresetSlotAutoCast)
  const applyPresetSlotAutomation = useGameStore((state) => state.applyPresetSlotAutomation)
  const selected = presets.presets.find((preset) => preset.id === presets.selectedPresetId) ?? null
  const slots = combat.active && combat.activeSpellLoadout ? combat.activeSpellLoadout.slots : selected?.slots ?? []
  const focus = getSpellPresetFocusBreakdown(focusState)
  const { drag, dropTarget, beginDrag, registerTarget } = useSpellLoadoutDnd()
  const [editor, setEditor] = useState<'new' | 'rename' | null>(null)
  const [editorName, setEditorName] = useState('')
  const [copyCurrent, setCopyCurrent] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [automationIndex, setAutomationIndex] = useState<number | null>(null)
  const [automationOrigin, setAutomationOrigin] = useState<AutomationEditorOrigin>('direct')
  const [overviewOpen, setOverviewOpen] = useState(false)
  const [automationError, setAutomationError] = useState<string | null>(null)

  useEffect(() => { setEditor(null); setConfirmDelete(false) }, [selected?.id])
  useEffect(() => {
    if (!automationSpellId) return
    try {
      if (combat.active) return
      const requestedIndex = slots.findIndex((slot) => slot.spellId === automationSpellId)
      if (requestedIndex >= 0) {
        setAutomationError(null)
        setAutomationOrigin('direct')
        setAutomationIndex(requestedIndex)
      }
    } finally {
      onAutomationRequestHandled?.()
    }
  }, [automationSpellId, combat.active, slots, onAutomationRequestHandled])

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
  const requestPresetChange = (id: typeof presets.selectedPresetId) => {
    if (!id || id === selected?.id) return
    if (!combat.active) selectPresetForEditing(id)
  }
  const automationSlot = automationIndex === null ? null : slots[automationIndex] ?? null
  const closeAutomationEditor = () => {
    const returnToOverview = automationOrigin === 'overview'
    setAutomationIndex(null)
    setAutomationOrigin('direct')
    if (returnToOverview) setOverviewOpen(true)
  }
  const applyAutomation = (config: SpellAutomationConfig, autoCast: boolean) => {
    if (!selected || !automationSlot || combat.active) return
    const result = applyPresetSlotAutomation(selected.id, automationSlot.spellId, config, autoCast)
    if (!result.ok) {
      setAutomationError(result.message)
      return result
    }
    setAutomationError(null)
    closeAutomationEditor()
    return result
  }
  const toggleAutomationMode = (slot: SpellPresetSlot) => {
    if (selected && !combat.active) setPresetSlotAutoCast(selected.id, slot.spellId, !slot.autoCast)
  }

  return <section className="schools-loadout-panel">
    <div className="section-heading loadout-heading"><div><div className="panel-kicker">COMBAT PREPARATION</div><h2>Combat Loadout</h2><p>{combat.active ? 'Active battle snapshot · read-only' : 'Changes save automatically.'}</p></div><div className="loadout-preset-controls"><label>Preset <select aria-label="Active combat loadout preset" disabled={combat.active} value={selected?.id ?? ''} onChange={event => requestPresetChange(event.target.value as typeof presets.selectedPresetId)}>{presets.presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label><GameTooltip content={<TooltipContent title="Automation overview" description={combat.active ? 'Review the active battle automation snapshot. Editing is disabled until combat ends.' : "Review every prepared Spell's mode, conditions, and priority."} />}><Button variant="secondary" ariaLabel="Open combat automation overview" disabled={!selected} onClick={() => setOverviewOpen(true)}><Settings2 size={14} aria-hidden="true" /> AUTOMATION</Button></GameTooltip><Button variant="ghost" disabled={combat.active} onClick={beginNew}>NEW</Button><Button variant="ghost" disabled={!selected || combat.active} onClick={beginRename}><Pencil size={14} aria-hidden="true" /> RENAME</Button><GameTooltip accent="warning" content={<TooltipContent title="Delete preset" description="Remove the active saved loadout after confirmation." />}><Button variant="ghost" disabled={!selected || combat.active} ariaLabel="Delete active combat loadout preset" onClick={() => setConfirmDelete(true)}><Trash2 size={14} aria-hidden="true" /> DELETE</Button></GameTooltip></div></div>
    {editor && <div className="loadout-inline-editor"><strong>{editor === 'new' ? 'NEW PRESET' : 'RENAME PRESET'}</strong><input aria-label={editor === 'new' ? 'New preset name' : 'Rename preset'} value={editorName} onChange={event => setEditorName(event.target.value)} placeholder="Preset name" onKeyDown={event => { if (event.key === 'Enter') submitEditor(); if (event.key === 'Escape') setEditor(null) }} />{editor === 'new' && <label><input type="checkbox" checked={copyCurrent} onChange={event => setCopyCurrent(event.target.checked)} /> Copy current loadout</label>}<Button variant="ghost" onClick={() => setEditor(null)}>CANCEL</Button><Button variant="secondary" disabled={!editorName.trim()} onClick={submitEditor}>{editor === 'new' ? 'CREATE' : 'SAVE'}</Button></div>}
    {confirmDelete && selected && <div className="loadout-inline-confirm" role="alert"><span>Delete “{selected.name}”?</span><Button variant="ghost" onClick={() => setConfirmDelete(false)}>CANCEL</Button><Button variant="danger" onClick={() => { deletePreset(selected.id); setConfirmDelete(false) }}>DELETE</Button></div>}
    <div className="loadout-slot-list">
      {Array.from({ length: 8 }, (_, index) => {
        const slot = slots[index]
        const spell = slot ? SPELLS[slot.spellId] : null
        return <LoadoutSlot key={`${index}-${slot?.spellId ?? 'empty'}`} index={index} totalSlots={slots.length} slot={slot} spell={spell} spellPresentationState={spellPresentationState} canEdit={!combat.active} dragging={drag?.payload.source === 'loadout' && drag.payload.fromIndex === index} dropTarget={dropTarget?.index === index} registerTarget={element => registerTarget(index, element)} onMove={moveSlot} onRemove={removeSpell} onSelect={onSelectSpell} onToggleAutoCast={toggleAutomationMode} onOpenAutomation={(nextIndex) => { setAutomationError(null); setAutomationOrigin('direct'); setAutomationIndex(nextIndex) }} onPointerDown={event => { if (slot && !combat.active) beginDrag({ source: 'loadout', spellId: slot.spellId, fromIndex: index }, event) }} />
      })}
    </div>
    <div className="loadout-footer"><span>{slots.length} / 8 prepared</span><FocusBudgetMeter autoCastFocus={focus.autoCastFocus} otherFocus={focus.otherFocus} totalFocus={focus.totalFocus} maxFocus={focus.maxFocus} freeFocus={focus.freeFocus} compact /></div>
    {selected && <CombatAutomationOverviewModal open={overviewOpen} presetName={selected.name} slots={slots} spellPresentationState={spellPresentationState} readOnly={combat.active} onClose={() => setOverviewOpen(false)} onEdit={(index) => { setAutomationError(null); setAutomationOrigin('overview'); setOverviewOpen(false); setAutomationIndex(index) }} onToggleMode={toggleAutomationMode} />}
    {selected && automationSlot && automationIndex !== null && <SpellAutomationModal open={automationIndex !== null} slot={automationSlot} slotIndex={automationIndex} presetName={selected.name} loadoutSlots={slots} readOnly={combat.active} applyError={automationError} onClose={closeAutomationEditor} onApply={applyAutomation} />}
  </section>
}

function LoadoutSlot({ index, totalSlots, slot, spell, spellPresentationState, canEdit, dragging, dropTarget, registerTarget, onMove, onRemove, onSelect, onToggleAutoCast, onOpenAutomation, onPointerDown }: { index: number; totalSlots: number; slot?: SpellPresetSlot; spell: typeof SPELLS[SpellId] | null; spellPresentationState: SpellPresentationState; canEdit: boolean; dragging: boolean; dropTarget: boolean; registerTarget: (element: HTMLElement | null) => void; onMove: (fromIndex: number, toIndex: number) => unknown; onRemove: (spellId: SpellId) => unknown; onSelect?: (spellId: SpellId) => void; onToggleAutoCast: (slot: SpellPresetSlot) => void; onOpenAutomation: (index: number) => void; onPointerDown: (event: React.PointerEvent<HTMLElement>) => void }) {
  const school = spell ? SCHOOLS[spell.school] : null
  const presentation = useMemo(() => spell ? buildSpellDetailPresentation(spellPresentationState, spell.id, spellPresentationState.progress.spellRanks[spell.id] ?? 1) : null, [spell, spellPresentationState])
  const summary = slot ? formatSpellAutomationSummary(slot) : ''
  const summaryDetails = slot?.autoCast ? getSpellAutomationConfig(slot).conditions.map(formatAutomationCondition).join(' · ') : 'Manual casting only. Automation will ignore this Spell.'
  const { openContextMenu } = useGameContextMenu()
  const openLoadoutContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (!spell || !slot) return
    event.preventDefault()
    event.stopPropagation()
    const inspect = { id: 'inspect', label: 'Inspect Spell', icon: Eye, onSelect: () => onSelect?.(spell.id) }
    const editActions = [
      { id: 'automation', label: 'Configure Automation', icon: Settings2, disabled: !canEdit, disabledReason: !canEdit ? 'Automation is locked during an active battle.' : undefined, onSelect: () => onOpenAutomation(index) },
      { id: 'mode', label: slot.autoCast ? 'Set to Manual' : 'Set to Auto', icon: CircleDot, disabled: !canEdit, disabledReason: !canEdit ? 'Loadout editing is locked during an active battle.' : undefined, onSelect: () => onToggleAutoCast(slot) },
      { id: 'up', label: 'Move Up', icon: ArrowUp, disabled: !canEdit || index === 0, disabledReason: !canEdit ? 'Loadout editing is locked during an active battle.' : undefined, onSelect: () => onMove(index, index - 1) },
      { id: 'down', label: 'Move Down', icon: ArrowDown, disabled: !canEdit || index >= totalSlots - 1, disabledReason: !canEdit ? 'Loadout editing is locked during an active battle.' : undefined, onSelect: () => onMove(index, index + 1) },
      { id: 'remove', label: 'Remove from Loadout', icon: X, tone: 'warning' as const, disabled: !canEdit, disabledReason: !canEdit ? 'Loadout editing is locked during an active battle.' : undefined, onSelect: () => onRemove(spell.id) },
    ]
    openContextMenu({ x: event.clientX, y: event.clientY, anchor: event.currentTarget, header: { title: spell.name, meta: `${school?.name.toUpperCase()} · SLOT ${String(index + 1).padStart(2, '0')}`, icon: <SpellIcon school={spell.school} spellId={spell.id} size="small" /> }, sections: [{ id: 'inspect', actions: [inspect] }, { id: 'actions', actions: editActions }] })
  }
  return <article ref={registerTarget} className={`loadout-slot${slot ? '' : ' is-empty'}${!canEdit ? ' is-readonly' : ''}${dragging ? ' is-dragging' : ''}${dropTarget ? ' is-drop-target' : ''}`} style={school ? { '--school-accent': school.color } as React.CSSProperties : undefined} onClick={() => spell && onSelect?.(spell.id)} onContextMenu={openLoadoutContextMenu} onPointerDown={onPointerDown}>
    <span className="loadout-slot-number">{String(index + 1).padStart(2, '0')}</span>
    {spell && slot ? <><GameTooltip wide placement="top" delay={200} content={presentation ? <SpellCardTooltip presentation={presentation} /> : null}><span className="loadout-spell-icon-tooltip-target" data-no-drag="true"><SpellIcon school={spell.school} spellId={spell.id} size="small" /></span></GameTooltip><div className="loadout-slot-copy"><strong>{spell.name}</strong><small><GameTooltip content={<TooltipContent title="Automation Rule" description={summaryDetails} />}><span>{summary}</span></GameTooltip> · {school?.name.toUpperCase()}</small></div>{canEdit ? <GameTooltip content={<TooltipContent title="Toggle automation mode" description={slot.autoCast ? 'Switch this Spell to manual casting.' : 'Allow this Spell to be considered by combat automation.'} />}><Button className={`loadout-slot-mode-button loadout-slot-mode${slot.autoCast ? ' is-auto' : ''}`} dataStaticMotion dataNoDrag variant="ghost" ariaLabel={`${slot.autoCast ? 'Switch' : 'Enable'} ${spell.name} automation`} ariaPressed={slot.autoCast} onClick={() => onToggleAutoCast(slot)}><CircleDot size={11} aria-hidden="true" />{slot.autoCast ? 'AUTO' : 'MANUAL'}</Button></GameTooltip> : <span className={`loadout-slot-mode${slot.autoCast ? ' is-auto' : ''}`}><CircleDot size={11} aria-hidden="true" />{slot.autoCast ? 'AUTO' : 'MANUAL'}</span>}{canEdit && <div className="loadout-slot-actions"><GameTooltip content={<TooltipContent title="Automation settings" description="Configure conditions, target, and inspect system checks for this Spell." />}><Button dataStaticMotion dataNoDrag icon variant="ghost" ariaLabel={`Configure ${spell.name} automation`} onClick={() => onOpenAutomation(index)}><Settings2 size={13} aria-hidden="true" /></Button></GameTooltip><GameTooltip content={<TooltipContent title="Move earlier" description="Move this spell one slot up." />}><Button dataStaticMotion dataNoDrag icon variant="ghost" ariaLabel={`Move ${spell.name} earlier`} disabled={index === 0} onClick={() => onMove(index, index - 1)}><ArrowUp size={13} aria-hidden="true" /></Button></GameTooltip><GameTooltip content={<TooltipContent title="Move later" description="Move this spell one slot down." />}><Button dataStaticMotion dataNoDrag icon variant="ghost" ariaLabel={`Move ${spell.name} later`} disabled={index >= totalSlots - 1} onClick={() => onMove(index, index + 1)}><ArrowDown size={13} aria-hidden="true" /></Button></GameTooltip><GameTooltip accent="warning" content={<TooltipContent title="Remove from Loadout" description="Remove this Spell from the selected loadout." />}><Button dataStaticMotion dataNoDrag icon variant="ghost" ariaLabel={`Remove ${spell.name} from Loadout`} onClick={() => onRemove(spell.id)}><X size={13} aria-hidden="true" /></Button></GameTooltip></div>}</> : <><span className="loadout-slot-empty-copy">EMPTY SLOT</span><small>Drop a Spell here</small></>}
  </article>
}
