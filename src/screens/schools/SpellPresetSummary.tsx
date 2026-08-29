import { doesCurrentAutoCastMatchPreset, getSpellPresetFocusBreakdown } from '../../game/systems/spells'
import { useGameStore } from '../../store/gameStore'
import { Button, Card, Status } from '../../components/ui'

export function SpellPresetSummary({ onManage }: { onManage: () => void }) {
  const spellPresets = useGameStore((state) => state.spellPresets)
  const activities = useGameStore((state) => state.activities)
  const progress = useGameStore((state) => state.progress)
  const debug = useGameStore((state) => state.debug)
  const maxFocus = useGameStore((state) => state.player.maxFocus)
  const state = { spellPresets, activities, progress, player: { maxFocus }, debug }
  const focus = getSpellPresetFocusBreakdown(state)
  const applied = spellPresets.presets.find((preset) => doesCurrentAutoCastMatchPreset(state, preset))
  const currentCount = Object.values(activities.autoCast).filter(Boolean).length
  return <Card title="Spell Presets" className="schools-presets-panel" action={<Button variant="secondary" onClick={onManage}>MANAGE PRESETS</Button>}>
    <div className="spell-preset-summary-grid">
      <div className="spell-preset-summary-current"><small>CURRENT</small><strong>{applied?.name ?? 'CUSTOM'}</strong><span>{applied ? <Status tone="success">ACTIVE</Status> : 'Manual Auto-Cast selection'}</span></div>
      <div><small>AUTO-CAST</small><strong>{currentCount} Spells · {focus.autoCastFocus} Focus</strong></div>
      <div><small>OTHER SYSTEMS</small><strong>{focus.otherFocus} Focus</strong></div>
      <div><small>TOTAL</small><strong>{focus.totalFocus} / {focus.maxFocus}</strong><span>{focus.freeFocus >= 0 ? `${focus.freeFocus} Free` : `${Math.abs(focus.freeFocus)} Over Cap`}</span></div>
    </div>
  </Card>
}
