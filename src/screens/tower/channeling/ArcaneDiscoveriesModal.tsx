import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button, Card, Progress, Status } from '../../../components/ui'
import { BALANCE } from '../../../game/data/balance'
import { CHANNELING_DISCOVERIES, CHANNELING_DISCOVERY_PLACEHOLDERS } from '../../../game/data/channelingDiscoveries'
import { formatTime } from '../../../game/utils'
import { useGameStore } from '../../../store/gameStore'

export function ArcaneDiscoveriesModal({ onClose }: { onClose: () => void }) {
  const progress = useGameStore((state) => state.progress)
  const player = useGameStore((state) => state.player)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])
  return <div className="channeling-modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}><div className="channeling-modal" role="dialog" aria-modal="true" aria-label="Arcane Discoveries"><div className="channeling-modal-head"><div><div className="eyebrow">CHANNELING PRINCIPLES</div><h2>Arcane Discoveries</h2></div><Button variant="ghost" ariaLabel="Close Arcane Discoveries" onClick={onClose}><X size={18} /></Button></div><div className="channeling-discovery-grid">{CHANNELING_DISCOVERIES.map((discovery) => { const complete = progress.channeling.discoveries[discovery.id]; const current = discovery.id === 'stable-leyline' ? progress.channeling.totalManaGenerated : discovery.id === 'echo-resonance' ? progress.channeling.fiveEchoSustainMs : player.maxMana; const target = discovery.id === 'stable-leyline' ? BALANCE.channeling.stableLeylineThreshold : discovery.id === 'echo-resonance' ? BALANCE.channeling.echoResonanceDurationMs : BALANCE.channeling.deepReservoirThreshold; const progressLabel = discovery.id === 'stable-leyline' ? `${Math.floor(current)} / ${target} Mana generated` : discovery.id === 'echo-resonance' ? `${formatTime(Math.min(current, target))} / ${formatTime(target)}` : `${current} / ${target} Max Mana`; return <Card key={discovery.id} className={`channeling-discovery-card ${complete ? 'complete' : ''}`} title={discovery.name} action={<Status tone={complete ? 'success' : 'neutral'}>{complete ? 'Completed' : 'In progress'}</Status>}><p>{discovery.description}</p><small>{discovery.conditionDescription}</small>{!complete && <Progress value={current / target * 100} label="Progress" right={progressLabel} />}<div className="channeling-discovery-reward"><span>REWARD</span><strong>{discovery.rewardDescription}</strong></div></Card> })}{CHANNELING_DISCOVERY_PLACEHOLDERS.map((discovery) => <Card key={discovery.id} className="channeling-discovery-card channeling-discovery-placeholder" title={discovery.name}><strong>Undiscovered</strong><p>An undiscovered principle of Channeling.</p></Card>)}</div></div></div>
}

