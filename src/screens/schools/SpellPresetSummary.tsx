import { Check } from 'lucide-react'
import { doesCurrentAutoCastMatchPreset, getSpellPresetFocusBreakdown } from '../../game/systems/spells'
import type { SpellPresetFocusState } from '../../game/systems/spells'
import { SPELLS } from '../../game/content/spells/spells'
import type { SpellId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { FocusBudgetMeter } from './FocusBudgetMeter'
import { SpellIcon } from './SpellIcon'

export function SpellPresetSummary({ onManage }: { onManage: () => void }) {
  const spellPresets = useGameStore((state) => state.spellPresets)
  const activities = useGameStore((state) => state.activities)
  const progress = useGameStore((state) => state.progress)
  const equipment = useGameStore((state) => state.equipment)
  const artifactProgress = useGameStore((state) => state.artifactProgress)
  const maxFocus = useGameStore((state) => state.player.maxFocus)
  const focusState: SpellPresetFocusState = { activities, progress, equipment, artifactProgress, player: { maxFocus } }
  const focus = getSpellPresetFocusBreakdown(focusState)
  const applied = spellPresets.presets.find((preset) => doesCurrentAutoCastMatchPreset(focusState, preset))
  const activeSpellIds = Object.keys(SPELLS).filter((spellId) => activities.autoCast[spellId as SpellId]) as SpellId[]
  const shownSpellIds = activeSpellIds.slice(0, 4)
  const remainingCount = Math.max(0, activeSpellIds.length - shownSpellIds.length)
  return <Card title="Spell Preset" className="schools-presets-panel" action={<Button variant="secondary" onClick={onManage}>MANAGE PRESETS</Button>}>
    <div className="spell-preset-summary-grid">
      <div className="spell-preset-summary-current"><small>{applied ? 'ACTIVE PRESET' : 'CURRENT LOADOUT'}</small><strong>{applied?.name ?? 'CUSTOM'}</strong><span>{applied ? <Status tone="success"><Check size={11} aria-hidden="true" /> ACTIVE</Status> : 'Manual Auto-Cast configuration'}</span></div>
      <div className="spell-preset-summary-spells"><small>AUTO-CAST</small><div className="spell-preset-summary-icons">{shownSpellIds.map((spellId) => <GameTooltip key={spellId} content={<TooltipContent title={SPELLS[spellId].name} description="Currently enabled for live Auto-Cast." />}><span><SpellIcon school={SPELLS[spellId].school} spellId={spellId} size="small" /></span></GameTooltip>)}{remainingCount > 0 && <span className="spell-preset-summary-more">+{remainingCount}</span>}{!activeSpellIds.length && <span className="spell-preset-summary-none">No active Spells</span>}</div><strong className="ui-focus">{activeSpellIds.length} Spells · {focus.autoCastFocus} Focus</strong></div>
      <div className="spell-preset-summary-focus"><small>FOCUS</small><FocusBudgetMeter autoCastFocus={focus.autoCastFocus} otherFocus={focus.otherFocus} totalFocus={focus.totalFocus} maxFocus={focus.maxFocus} freeFocus={focus.freeFocus} compact /></div>
    </div>
  </Card>
}
