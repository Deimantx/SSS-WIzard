import { Card, Progress, Status } from '../../../components/ui'
import { getManaCapacityBreakdown, getManaRegenBreakdown } from '../../../game/engine/channelingEngine'
import { useGameStore } from '../../../store/gameStore'

const rate = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1)

export function ManaCorePanel() {
  const player = useGameStore((state) => state.player)
  const activities = useGameStore((state) => state.activities)
  const progress = useGameStore((state) => state.progress)
  const equipment = useGameStore((state) => state.equipment)
  const regen = getManaRegenBreakdown({ activities, progress, equipment })
  const capacity = getManaCapacityBreakdown({ player, progress, equipment })
  const discoveryBonus = regen.stableLeylineBonus + regen.echoTotal - regen.echoBase
  return <Card title="Mana Core" action={<Status tone="active">+{rate(regen.total)}/s</Status>}>
    <div className="channeling-mana-hero"><div><span className="eyebrow">CURRENT MANA</span><strong>{Math.floor(player.mana)} <small>/ {player.maxMana}</small></strong></div><span className="channeling-mana-orb">✦</span></div>
    <Progress value={player.maxMana ? player.mana / player.maxMana * 100 : 0} tone="orange" label="Mana reserves" right={`${Math.floor(player.mana)} / ${player.maxMana}`} />
    <div className="channeling-flow"><span>TOTAL MANA FLOW</span><strong>+{rate(regen.total)}/s</strong></div>
    <div className="channeling-breakdown">
      <span>Natural Leyline<strong>+{rate(regen.baseNatural)}/s</strong></span>
      <span>Leyline Conduit<strong>+{rate(regen.conduitBonus)}/s</strong></span>
      <span>Arcane Echoes<strong>+{rate(regen.echoTotal)}/s</strong></span>
      <span>Arcane Discoveries<strong>+{rate(discoveryBonus)}/s</strong></span>
      <span>Equipment<strong>+{rate(regen.equipmentBonus)}/s</strong></span>
    </div>
    <div className="channeling-capacity" title="Derived from base capacity, infrastructure, discoveries, and equipment."><span>Capacity</span><strong>{capacity.base} + {capacity.reservoirBonus} Reservoir + {capacity.discoveryBonus} Discovery + {capacity.equipmentBonus} Equipment = {capacity.total}</strong></div>
  </Card>
}

