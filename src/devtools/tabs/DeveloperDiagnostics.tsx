import { Button, Card, Status } from '../../components/ui'
import { getManaCapacityBreakdown, getManaRegenBreakdown } from '../../game/engine/channelingEngine'
import { useGameStore } from '../../store/gameStore'
import { selectRawFreeFocus, selectUsedFocus } from '../../store/selectors'
import { Summary } from './DeveloperTabPrimitives'

export function DeveloperDiagnostics() {
  const state = useGameStore()
  const used = useGameStore(selectUsedFocus)
  const rawFree = useGameStore(selectRawFreeFocus)
  const regen = getManaRegenBreakdown(state)
  const capacity = getManaCapacityBreakdown(state)
  const debugActive = Object.values(state.debug).some((value) => typeof value === 'boolean' ? value : value > 0)
  const hasInvalidNumber = [state.player.health, state.player.mana, state.player.maxMana, state.player.maxFocus, regen.total, capacity.total].some((value) => !Number.isFinite(value))
  return <div className="developer-tab-grid"><Card title="Runtime diagnostics"><div className="developer-summary-grid"><Summary label="Save version" value={`v${state.saveVersion}`} /><Summary label="Debug state" value={debugActive ? 'Active' : 'Clean'} /><Summary label="Mana" value={`${Math.floor(state.player.mana)} / ${state.player.maxMana}`} /><Summary label="Mana regen" value={`+${regen.total}/s`} /><Summary label="Capacity order" value={`${capacity.preAmplification} × ${capacity.astralExpansionMultiplier}`} /><Summary label="Focus" value={`${used} used / ${rawFree} raw free`} /><Summary label="Notifications" value={state.notifications.length} /><Summary label="Combat" value={state.combat.enemyId ?? 'None'} /></div><div className="developer-diagnostics"><span>Finite numeric state <b>{hasInvalidNumber ? 'FAILED' : 'OK'}</b></span><span>Serialized debug overrides <b>excluded</b></span><span>Developer regen source <b>+{regen.developerBonus}/s</b></span><span>Developer capacity source <b>+{capacity.developerCapacityBonus}</b></span></div></Card><Card title="Safety actions" className="developer-danger-card"><p className="muted">These actions affect only the current debug session unless you explicitly save normal gameplay state.</p><div className="button-row"><Button variant="danger" onClick={() => state.resetDebugOverrides()}>Reset Debug Overrides</Button><Status tone={hasInvalidNumber ? 'warning' : 'success'}>{hasInvalidNumber ? 'INVALID NUMBER DETECTED' : 'No invalid numbers detected'}</Status></div></Card></div>
}
