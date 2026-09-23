import { ArrowDown, ArrowUp, CircleDot, Settings2, X } from 'lucide-react'
import { Button, GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SPELLS } from '../../game/content/spells/spells'
import { SCHOOLS } from '../../game/content/schools/schools'
import { getSpellPresetFocusBreakdown, type SpellPresetFocusState } from '../../game/systems/spells'
import type { SpellId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { SpellIcon } from './SpellIcon'
import { FocusBudgetMeter } from './FocusBudgetMeter'

export function CombatSpellLoadout({ focusState, onManage }: { focusState: SpellPresetFocusState; onManage: () => void }) {
  const presets = useGameStore((state) => state.spellPresets)
  const combat = useGameStore((state) => state.combat)
  const moveSlot = useGameStore((state) => state.moveSelectedPresetSlot)
  const removeSpell = useGameStore((state) => state.removeSpellFromSelectedPreset)
  const selected = presets.presets.find((preset) => preset.id === presets.selectedPresetId) ?? null
  const slots = combat.active && combat.activeSpellLoadout ? combat.activeSpellLoadout.slots : selected?.slots ?? []
  const focus = getSpellPresetFocusBreakdown(focusState)
  return <section className="schools-loadout-panel">
    <div className="section-heading"><div><div className="panel-kicker">COMBAT PREPARATION</div><h2>Combat Loadout</h2><p>{combat.active ? 'Active battle snapshot' : selected?.name ?? 'No prepared preset'}</p></div><GameTooltip content={<TooltipContent title="Manage loadout" description="Add, remove, reorder and change Auto-Cast slots using the full preset manager." />}><Button variant="secondary" icon ariaLabel="Manage combat loadout" onClick={onManage}><Settings2 size={15} aria-hidden="true" /></Button></GameTooltip></div>
    <div className="loadout-slot-list">
      {Array.from({ length: 8 }, (_, index) => {
        const slot = slots[index]
        const spell = slot ? SPELLS[slot.spellId] : null
        return <LoadoutSlot key={`${index}-${slot?.spellId ?? 'empty'}`} index={index} slot={slot} spell={spell} canEdit={!combat.active} onMove={moveSlot} onRemove={removeSpell} />
      })}
    </div>
    <div className="loadout-footer"><span>{slots.length} / 8 prepared</span><FocusBudgetMeter autoCastFocus={focus.autoCastFocus} otherFocus={focus.otherFocus} totalFocus={focus.totalFocus} maxFocus={focus.maxFocus} freeFocus={focus.freeFocus} compact /></div>
  </section>
}

function LoadoutSlot({ index, slot, spell, canEdit, onMove, onRemove }: { index: number; slot?: { spellId: SpellId; autoCast: boolean }; spell: typeof SPELLS[SpellId] | null; canEdit: boolean; onMove: (fromIndex: number, toIndex: number) => unknown; onRemove: (spellId: SpellId) => unknown }) {
  const school = spell ? SCHOOLS[spell.school] : null
  return <article className={`loadout-slot${slot ? '' : ' is-empty'}`} style={school ? { '--school-accent': school.color } as React.CSSProperties : undefined}>
    <span className="loadout-slot-number">{String(index + 1).padStart(2, '0')}</span>
    {spell && slot ? <><SpellIcon school={spell.school} spellId={spell.id} size="small" /><div className="loadout-slot-copy"><strong>{spell.name}</strong><small>{slot.autoCast ? 'AUTO-CAST' : 'MANUAL'} · {school?.name.toUpperCase()}</small></div><span className={`loadout-slot-mode${slot.autoCast ? ' is-auto' : ''}`}><CircleDot size={11} aria-hidden="true" />{slot.autoCast ? 'AUTO' : 'MANUAL'}</span>{canEdit && <div className="loadout-slot-actions"><GameTooltip content={<TooltipContent title="Move earlier" description="Move this spell one slot up." />}><Button dataStaticMotion dataNoDrag icon variant="ghost" ariaLabel={`Move ${spell.name} earlier`} disabled={index === 0} onClick={() => onMove(index, index - 1)}><ArrowUp size={13} aria-hidden="true" /></Button></GameTooltip><GameTooltip content={<TooltipContent title="Move later" description="Move this spell one slot down." />}><Button dataStaticMotion dataNoDrag icon variant="ghost" ariaLabel={`Move ${spell.name} later`} disabled={index >= 7} onClick={() => onMove(index, index + 1)}><ArrowDown size={13} aria-hidden="true" /></Button></GameTooltip><GameTooltip accent="warning" content={<TooltipContent title="Remove spell" description="Remove this spell from the selected loadout." />}><Button dataStaticMotion dataNoDrag icon variant="ghost" ariaLabel={`Remove ${spell.name}`} onClick={() => onRemove(spell.id)}><X size={13} aria-hidden="true" /></Button></GameTooltip></div>}</> : <><span className="loadout-slot-empty-copy">EMPTY SLOT</span><small>Use Equip or Manage Loadout</small></>}
  </article>
}
