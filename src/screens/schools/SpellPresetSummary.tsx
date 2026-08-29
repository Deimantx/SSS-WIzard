import { getSpellPresetFocusProjection } from '../../game/systems/spells'
import { selectUsedFocus } from '../../game/engine'
import { useGameStore } from '../../store/gameStore'
import { Button, Card, Status } from '../../components/ui'

export function SpellPresetSummary({ onManage }: { onManage: () => void }) {
  const spellPresets = useGameStore((state) => state.spellPresets)
  const activities = useGameStore((state) => state.activities)
  const progress = useGameStore((state) => state.progress)
  const debug = useGameStore((state) => state.debug)
  const maxFocus = useGameStore((state) => state.player.maxFocus)
  const state = { spellPresets, activities, progress, player: { maxFocus }, debug }
  const applied = spellPresets.presets.find((preset) => preset.id === spellPresets.lastAppliedPresetId)
  const currentCount = Object.values(activities.autoCast).filter(Boolean).length
  const projection = applied ? getSpellPresetFocusProjection(state, applied) : null
  return <Card title="Spell Presets" className="schools-presets-panel" action={<Button variant="secondary" onClick={onManage}>MANAGE PRESETS</Button>}>
    <div className="spell-preset-summary-grid"><div><small>APPLIED</small><strong>{applied?.name ?? 'CUSTOM'}</strong><span>{applied ? `${projection?.validSpellIds.length ?? 0} spells · ${projection?.presetAutoCastFocus ?? 0} Focus` : 'None · Manual Auto-Cast selection'}</span></div><div><small>LIVE AUTO-CAST</small><strong>{currentCount} spells</strong><span>{selectUsedFocus(state)} / {maxFocus} Focus reserved</span></div><div><Status tone={applied ? 'success' : 'active'}>{applied ? 'PRESET ACTIVE' : 'CUSTOM SETUP'}</Status><span>{applied ? 'Manual changes clear the applied marker.' : 'Apply a saved set to coordinate Auto-Cast.'}</span></div></div>
  </Card>
}
