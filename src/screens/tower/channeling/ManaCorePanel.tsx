import { Card, Progress, Status } from '../../../components/ui'
import { getManaCapacityBreakdown, getManaRegenBreakdown } from '../../../game/engine/channelingEngine'
import { useGameStore } from '../../../store/gameStore'
import { formatChannelingRate } from './channelingPresentation'

export function ManaCorePanel() {
  const player = useGameStore((state) => state.player)
  const activities = useGameStore((state) => state.activities)
  const progress = useGameStore((state) => state.progress)
  const equipment = useGameStore((state) => state.equipment)
  const artifactProgress = useGameStore((state) => state.artifactProgress)
  const regen = getManaRegenBreakdown({ activities, progress, equipment, artifactProgress })
  const capacity = getManaCapacityBreakdown({ player, progress, equipment, artifactProgress })
  const overCap = player.mana > player.maxMana
  return <Card title="Mana Core" action={<Status tone="active">+{formatChannelingRate(regen.total)}/s</Status>}>
    <div className="channeling-mana-hero"><div><span className="eyebrow">CURRENT MANA</span><strong>{Math.floor(player.mana)} <small>/ {player.maxMana}</small></strong>{overCap && <Status tone="warning">OVER CAP</Status>}</div><span className="channeling-mana-orb">✦</span></div>
    <Progress value={player.maxMana ? player.mana / player.maxMana * 100 : 0} tone="orange" label="Mana reserves" right={`${Math.floor(player.mana)} / ${player.maxMana}`} />
    <div className="channeling-flow"><span>TOTAL MANA FLOW</span><strong>+{formatChannelingRate(regen.total)}/s</strong></div>
    <div className="channeling-mana-summary"><span>PASSIVE MANA<strong>+{formatChannelingRate(regen.passiveAfterResonance)}/s</strong></span><span>ARCANE ECHOES<strong>+{formatChannelingRate(regen.echoTotal)}/s</strong></span><span>MAX MANA<strong>{capacity.total}</strong></span></div>
  </Card>
}
