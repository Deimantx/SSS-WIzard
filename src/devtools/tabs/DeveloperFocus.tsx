import { Button, Card, Status } from '../../components/ui'
import { FOCUS_IMPROVEMENT } from '../../game/content/focus/focusImprovement'
import { deriveFocusReservations } from '../../game/engine'
import { useGameStore } from '../../store/gameStore'
import { selectFreeFocus, selectRawFreeFocus, selectUsedFocus } from '../../store/selectors'
import { NumberField, Summary } from './DeveloperTabPrimitives'

export function DeveloperFocus() {
  const player = useGameStore((state) => state.player)
  const debug = useGameStore((state) => state.debug)
  const activities = useGameStore((state) => state.activities)
  const progress = useGameStore((state) => state.progress)
  const used = useGameStore(selectUsedFocus)
  const free = useGameStore(selectFreeFocus)
  const rawFree = useGameStore(selectRawFreeFocus)
  const setBonus = useGameStore((state) => state.setDebugMaxFocusBonus)
  const focusImprovement = useGameStore((state) => state.progress.focusImprovement)
  const setFocusImprovementLevel = useGameStore((state) => state.setFocusImprovementLevel)
  const reservations = deriveFocusReservations({ activities, progress })
  return <div className="developer-tab-grid">
    <Card title="Focus Improvement"><NumberField label="Rank I Level (0-10)" value={focusImprovement.level} onChange={setFocusImprovementLevel} /><div className="developer-diagnostics"><span>Sets the permanent Focus Capacity level and recalculates Max Focus.</span><span>Bonus per level <b>+{FOCUS_IMPROVEMENT.focusPerLevel} Max Focus</b></span><span>Upgrade material <b>Prismatic Fragment only</b></span></div></Card>
    <Card title="Focus availability"><div className="developer-summary-grid"><Summary label="Final Max Focus" value={player.maxFocus} /><Summary label="Used Focus" value={used} /><Summary label="Available Focus" value={free} /><Summary label="Available before cap" value={rawFree} /></div><div className="developer-diagnostics"><span>Available Focus is clamped to 0 when reservations exceed capacity.</span><span>Debug mode <b>{debug.allowFocusOverCap ? 'allows over-reservation testing' : 'does not change reservations'}</b>.</span></div></Card>
    <Card title="Focus override" className="developer-debug-card"><NumberField label="Developer Max Focus Bonus" value={debug.bonusMaxFocusFlat} onChange={setBonus} /><div className="button-row"><Button variant={debug.allowFocusOverCap ? 'danger' : 'secondary'} onClick={() => useGameStore.getState().setDebugAllowFocusOverCap(!debug.allowFocusOverCap)}>{debug.allowFocusOverCap ? 'Over-reservation ON' : 'Allow over-reservation'}</Button><Button variant="secondary" onClick={() => useGameStore.getState().setDebugMaxFocusBonus(500)}>Add +500 Focus</Button></div></Card>
    <Card title="Reservation ledger"><div className="reservation-list">{reservations.map((item) => <div className="reservation" key={item.id}><span className="reservation-dot" /><span>{item.label}</span><strong>{item.amount}</strong></div>)}</div><Status tone={rawFree < 0 ? 'warning' : 'success'}>{rawFree < 0 ? 'FOCUS OVER-RESERVED' : 'Focus allocation is valid'}</Status></Card>
  </div>
}
