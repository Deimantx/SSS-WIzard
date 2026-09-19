import { Check } from 'lucide-react'
import { getSpellPresetFocusBreakdown, getSpellPresetFocusProjection } from '../../game/systems/spells'
import type { SpellPresetFocusState } from '../../game/systems/spells'
import { SPELLS } from '../../game/content/spells/spells'
import { useGameStore } from '../../store/gameStore'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { FocusBudgetMeter } from './FocusBudgetMeter'
import { SpellIcon } from './SpellIcon'

export function SpellPresetSummary({ onManage }: { onManage: () => void }) {
  const spellPresets = useGameStore((state) => state.spellPresets)
  const combat = useGameStore((state) => state.combat)
  const activities = useGameStore((state) => state.activities)
  const progress = useGameStore((state) => state.progress)
  const equipment = useGameStore((state) => state.equipment)
  const artifactProgress = useGameStore((state) => state.artifactProgress)
  const arcaneCore = useGameStore((state) => state.arcaneCore)
  const maxFocus = useGameStore((state) => state.player.maxFocus)
  const allowFocusOverCap = useGameStore((state) => state.debug.allowFocusOverCap)
  const focusState: SpellPresetFocusState = { activities, progress, equipment, artifactProgress, arcaneCore, player: { maxFocus } }
  const focus = getSpellPresetFocusBreakdown(focusState)
  const selected = spellPresets.presets.find((preset) => preset.id === spellPresets.selectedPresetId) ?? null
  const selectedProjection = selected ? getSpellPresetFocusProjection({ activities, progress, equipment, artifactProgress, arcaneCore, player: { maxFocus }, debug: { allowFocusOverCap } }, selected) : null
  const active = combat.activeSpellLoadout
  const activeSlots = active?.slots ?? selectedProjection?.validSlots ?? []
  const shownSlots = activeSlots.slice(0, 4)
  const remainingCount = Math.max(0, activeSlots.length - shownSlots.length)
  return <Card title="Combat Spell Preset" className="schools-presets-panel" action={<Button variant="secondary" onClick={onManage}>MANAGE PRESETS</Button>}>
    <div className="spell-preset-summary-grid">
      <div className="spell-preset-summary-current"><small>{combat.active && active ? 'ACTIVE BATTLE' : 'NEXT BATTLE PRESET'}</small><strong>{combat.active && active ? active.presetName : selected?.name ?? 'No preset selected'}</strong><span>{combat.active && active ? <Status tone="success"><Check size={11} aria-hidden="true" /> ACTIVE SNAPSHOT</Status> : selected ? 'Selected ordered loadout' : 'Create a combat preset'}</span></div>
      <div className="spell-preset-summary-spells"><small>{activeSlots.length} SLOTS</small><div className="spell-preset-summary-icons">{shownSlots.map((slot) => { const spell = SPELLS[slot.spellId]; return <GameTooltip key={slot.spellId} content={<TooltipContent title={spell?.name ?? 'Unavailable Spell'} description={slot.autoCast ? 'AUTO slot · reserves Auto-Cast Focus.' : 'MANUAL slot · reserves no Auto-Cast Focus.'} />}><span><SpellIcon school={spell?.school ?? 'fire'} spellId={spell ? slot.spellId : undefined} locked={!spell} size="small" /></span></GameTooltip> })}{remainingCount > 0 && <span className="spell-preset-summary-more">+{remainingCount}</span>}{!activeSlots.length && <span className="spell-preset-summary-none">No slots</span>}</div><strong className="ui-focus">{activeSlots.filter((slot) => slot.autoCast).length} AUTO · {activeSlots.filter((slot) => !slot.autoCast).length} MANUAL · {focus.autoCastFocus} Focus</strong></div>
      <div className="spell-preset-summary-focus"><small>FOCUS</small><FocusBudgetMeter autoCastFocus={focus.autoCastFocus} otherFocus={focus.otherFocus} totalFocus={focus.totalFocus} maxFocus={focus.maxFocus} freeFocus={focus.freeFocus} compact /></div>
    </div>
  </Card>
}
