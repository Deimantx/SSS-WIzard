import { Button, Card } from '../../components/ui'
import { SPELLS } from '../../game/data/spells'
import { deriveFocusReservations } from '../../game/engine'
import { useGameStore } from '../../store/gameStore'
import { selectFreeFocus, selectUsedFocus } from '../../store/selectors'
import { Summary } from './DeveloperTabPrimitives'

export function DeveloperActivities() {
  const activities = useGameStore((state) => state.activities)
  const player = useGameStore((state) => state.player)
  const progress = useGameStore((state) => state.progress)
  const used = useGameStore(selectUsedFocus)
  const free = useGameStore(selectFreeFocus)
  const reservations = deriveFocusReservations({ activities, progress })
  const toggleAutoChannel = useGameStore((state) => state.toggleAutoChannel)
  const toggleCondense = useGameStore((state) => state.toggleCondense)
  const toggleResearch = useGameStore((state) => state.toggleResearch)
  const toggleTransmutation = useGameStore((state) => state.toggleTransmutation)
  const release = () => { if (activities.autoChannel) toggleAutoChannel(); if (activities.condense.running) toggleCondense(); if (activities.research.running) toggleResearch(); if (activities.transmutation.running) toggleTransmutation() }
  return <div className="developer-tab-grid"><Card title="Live activities"><div className="developer-summary-grid"><Summary label="Auto Channel" value={activities.autoChannel ? 'Running' : 'Stopped'} /><Summary label="Condensation" value={activities.condense.running ? 'Running' : 'Stopped'} /><Summary label="Research" value={activities.research.running ? `${activities.research.remainingQuantity} left` : activities.research.status} /><Summary label="Transmutation" value={activities.transmutation.running ? 'Running' : 'Stopped'} /><Summary label="Focus" value={`${used} used  -  ${free} free`} /><Summary label="Mana" value={`${Math.floor(player.mana)} / ${player.maxMana}`} /></div><div className="reservation-list">{reservations.map((item) => <div className="reservation" key={item.id}><span className="reservation-dot" /><span>{item.label}</span><strong>{item.amount}</strong></div>)}</div></Card><Card title="Automation controls"><p className="muted">Stop actions here; normal completion and reward logic remains in the simulation.</p><div className="button-row"><Button variant="danger" onClick={release}>Release all automation</Button><Button variant="secondary" onClick={() => useGameStore.getState().setPlayer({ mana: player.maxMana })}>Give required Mana</Button></div><div className="developer-owned-list">{Object.entries(activities.autoCast).filter(([, enabled]) => enabled).map(([id]) => <span key={id}>Auto-Cast {SPELLS[id as keyof typeof SPELLS].name}<strong>ON</strong></span>)}</div></Card></div>
}
