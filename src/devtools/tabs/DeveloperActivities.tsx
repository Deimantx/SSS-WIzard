import { Button, Card } from '../../components/ui'
import { SPELLS } from '../../game/data/spells'
import { deriveFocusReservations } from '../../game/engine'
import { CHANNELING_DISCOVERIES } from '../../game/data/channelingDiscoveries'
import { getManaRegenBreakdown } from '../../game/engine/channelingEngine'
import { useGameStore } from '../../store/gameStore'
import { selectFreeFocus, selectUsedFocus } from '../../store/selectors'
import { NumberField, Summary } from './DeveloperTabPrimitives'

export function DeveloperActivities() {
  const activities = useGameStore((state) => state.activities)
  const player = useGameStore((state) => state.player)
  const progress = useGameStore((state) => state.progress)
  const used = useGameStore(selectUsedFocus)
  const free = useGameStore(selectFreeFocus)
  const reservations = deriveFocusReservations({ activities, progress })
  const toggleCondense = useGameStore((state) => state.toggleCondense)
  const toggleResearch = useGameStore((state) => state.toggleResearch)
  const toggleTransmutation = useGameStore((state) => state.toggleTransmutation)
  const setEchoes = useGameStore((state) => state.setChannelingEchoes)
  const setRank = useGameStore((state) => state.setChannelingUpgradeRank)
  const setGenerated = useGameStore((state) => state.setChannelingManaGenerated)
  const setSustain = useGameStore((state) => state.setChannelingFiveEchoSustain)
  const setDiscovery = useGameStore((state) => state.setChannelingDiscovery)
  const regen = getManaRegenBreakdown({ activities, progress, equipment: useGameStore.getState().equipment })
  const release = () => { if (activities.channeling.echoesAssigned > 0) setEchoes(0); if (activities.condense.running) toggleCondense(); if (activities.research.running) toggleResearch(); if (activities.transmutation.running) toggleTransmutation() }
  return <div className="developer-tab-grid"><Card title="Live activities"><div className="developer-summary-grid"><Summary label="Arcane Echoes" value={`${activities.channeling.echoesAssigned} / 5`} /><Summary label="Natural Regen" value={`+${regen.baseNatural + regen.conduitBonus + regen.stableLeylineBonus}/s`} /><Summary label="Total Regen" value={`+${regen.total}/s`} /><Summary label="Condensation" value={activities.condense.running ? 'Running' : 'Stopped'} /><Summary label="Research" value={activities.research.running ? `${activities.research.remainingQuantity} left` : activities.research.status} /><Summary label="Transmutation" value={activities.transmutation.running ? 'Running' : 'Stopped'} /><Summary label="Focus" value={`${used} used  -  ${free} free`} /><Summary label="Mana" value={`${Math.floor(player.mana)} / ${player.maxMana}`} /></div><div className="reservation-list">{reservations.map((item) => <div className="reservation" key={item.id}><span className="reservation-dot" /><span>{item.label}</span><strong>{item.amount}</strong></div>)}</div></Card><Card title="Channeling V2 controls"><div className="developer-form-grid"><NumberField label="Echoes Assigned (0-5)" value={activities.channeling.echoesAssigned} onChange={(value) => setEchoes(value)} /><NumberField label="Reservoir Rank (0-5)" value={progress.channeling.manaReservoirRank} onChange={(value) => setRank('mana-reservoir', value)} /><NumberField label="Conduit Rank (0-5)" value={progress.channeling.leylineConduitRank} onChange={(value) => setRank('leyline-conduit', value)} /><NumberField label="Mana Generated" value={progress.channeling.totalManaGenerated} onChange={setGenerated} /><NumberField label="Five Echo Sustain (ms)" value={progress.channeling.fiveEchoSustainMs} onChange={setSustain} /></div><div className="button-row"><Button variant="danger" onClick={release}>Release all automation</Button><Button variant="secondary" onClick={() => useGameStore.getState().setPlayer({ mana: player.maxMana })}>Give required Mana</Button></div><div className="developer-owned-list">{CHANNELING_DISCOVERIES.map((discovery) => <span key={discovery.id}>{discovery.name}<strong>{progress.channeling.discoveries[discovery.id] ? 'Complete' : 'Incomplete'}</strong><Button variant="ghost" onClick={() => setDiscovery(discovery.id, !progress.channeling.discoveries[discovery.id])}>{progress.channeling.discoveries[discovery.id] ? 'Reset' : 'Complete'}</Button></span>)}</div><div className="developer-owned-list">{Object.entries(activities.autoCast).filter(([, enabled]) => enabled).map(([id]) => <span key={id}>Auto-Cast {SPELLS[id as keyof typeof SPELLS].name}<strong>ON</strong></span>)}</div></Card></div>
}
