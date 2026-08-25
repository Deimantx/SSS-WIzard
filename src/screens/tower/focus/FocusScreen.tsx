import { useMemo } from 'react'
import { Card, Progress } from '../../../components/ui'
import { deriveFocusReservations } from '../../../game/engine'
import { selectFreeFocus, selectUsedFocus } from '../../../store/selectors'
import { useGameStore } from '../../../store/gameStore'
import { EditableGrid } from '../../../ui/layout-editor/EditableGrid'
import { FocusPanel } from '../FocusPanel'
import { TowerFrame } from '../TowerFrame'

export function FocusScreen() {
  const player = useGameStore((state) => state.player)
  const activities = useGameStore((state) => state.activities)
  const progress = useGameStore((state) => state.progress)
  const used = useGameStore(selectUsedFocus)
  const free = useGameStore(selectFreeFocus)
  const reservations = useMemo(() => deriveFocusReservations({ activities, progress }), [activities, progress])
  return <TowerFrame eyebrow="WIZARD TOWER · FOCUS" title={'Focus is the tower\u2019s limiting spell.'} description="Review every reservation before you automate another system."><EditableGrid screen="tower-focus" panels={[{ id: 'focus-summary', content: <FocusPanel /> }, { id: 'focus-reservations', content: <Card title="Reservation ledger"><div className="tower-focus-hero"><strong>{free} free</strong><span>{used} / {player.maxFocus} reserved</span></div><Progress value={player.maxFocus ? used / player.maxFocus * 100 : 0} tone="violet" label="Focus allocation" right={`${used} / ${player.maxFocus}`} /><div className="reservation-list">{reservations.length ? reservations.map((reservation) => <div className="reservation" key={reservation.id}><span className="reservation-dot" /><span>{reservation.label}</span><strong>{reservation.amount}</strong></div>) : <div className="empty-state small">No automated activities are reserving Focus.</div>}</div></Card> }]} /></TowerFrame>
}
