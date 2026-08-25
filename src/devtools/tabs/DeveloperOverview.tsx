import { Button, Card } from '../../components/ui'
import { deriveFocusReservations } from '../../game/engine'
import { getManaRegenBreakdown } from '../../game/engine/channelingEngine'
import { formatOfflineBank } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { selectFreeFocus, selectUsedFocus } from '../../store/selectors'
import { Summary } from './DeveloperTabPrimitives'

export function DeveloperOverview() {
  const state = useGameStore()
  const used = useGameStore(selectUsedFocus)
  const free = useGameStore(selectFreeFocus)
  const preset = useGameStore((game) => game.preset)
  const reservations = deriveFocusReservations({ activities: state.activities, progress: state.progress })
  const channelingRegen = getManaRegenBreakdown({ activities: state.activities, progress: state.progress, equipment: state.equipment })
  const presets: { id: Parameters<typeof preset>[0]; label: string }[] = [{ id: 'fresh', label: 'Fresh' }, { id: 'research', label: 'Research Ready' }, { id: 'combat', label: 'Combat Ready' }, { id: 'boss', label: 'Sentinel Ready' }, { id: 'guild', label: 'Guild Ready' }, { id: 'main-boss', label: 'Forest Heart Ready' }, { id: 'chapter-complete', label: 'Chapter Complete' }]
  return <div className="developer-tab-grid"><Card title="Runtime summary"><div className="developer-summary-grid"><Summary label="Screen" value={state.ui.screen} /><Summary label="Save version" value={`v${state.saveVersion}`} /><Summary label="HP" value={`${Math.floor(state.player.health)} / ${state.player.maxHealth}`} /><Summary label="Mana" value={`${Math.floor(state.player.mana)} / ${state.player.maxMana}`} /><Summary label="Focus" value={`${free} free  -  ${used} reserved`} /><Summary label="Echoes Assigned" value={`${state.activities.channeling.echoesAssigned} / 5`} /><Summary label="Natural Regen" value={`+${channelingRegen.baseNatural + channelingRegen.conduitBonus + channelingRegen.stableLeylineBonus}/s`} /><Summary label="Total Mana Regen" value={`+${channelingRegen.total}/s`} /><Summary label="Reservoir Rank" value={state.progress.channeling.manaReservoirRank} /><Summary label="Conduit Rank" value={state.progress.channeling.leylineConduitRank} /><Summary label="Total Mana Generated" value={state.progress.channeling.totalManaGenerated} /><Summary label="Five Echo Sustain" value={state.progress.channeling.fiveEchoSustainMs} /><Summary label="Magic cap" value={state.progress.magicLevelCap} /><Summary label="Combat" value={state.combat.active ? state.combat.enemyId ? `Fighting ${state.combat.enemyId}` : 'Recovery' : 'Inactive'} /><Summary label="Threat" value={state.combat.threatCleared} /><Summary label="Guild" value={`${state.progress.guildRank}  -  ${state.progress.guildReputation} rep`} /><Summary label="Offline" value={formatOfflineBank(state.offlineBankMs)} /><Summary label="Activities" value={reservations.length} /><Summary label="Viewport" value={typeof window === 'undefined' ? '-' : `${window.innerWidth} x ${window.innerHeight}`} /></div></Card><Card title="Quick presets"><p className="muted">Presets reset gameplay state and prepare a focused test scenario.</p><div className="developer-button-grid">{presets.map((item) => <Button key={item.id} variant="secondary" onClick={() => preset(item.id)}>{item.label}</Button>)}</div></Card></div>
}
