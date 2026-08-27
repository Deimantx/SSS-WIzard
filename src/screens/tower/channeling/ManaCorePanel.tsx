import { Button, Card, Progress, Status } from '../../../components/ui'
import { getManaCapacityBreakdown, getManaRegenBreakdown } from '../../../game/engine/channelingEngine'
import { useGameStore } from '../../../store/gameStore'

const rate = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, '')
const percent = (value: number) => `+${Math.round((value - 1) * 100)}%`

export function ManaCorePanel({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const player = useGameStore((state) => state.player)
  const activities = useGameStore((state) => state.activities)
  const progress = useGameStore((state) => state.progress)
  const equipment = useGameStore((state) => state.equipment)
  const debug = useGameStore((state) => state.debug)
  const regen = getManaRegenBreakdown({ activities, progress, equipment, debug })
  const capacity = getManaCapacityBreakdown({ player, progress, equipment, debug })
  const overCap = player.mana > player.maxMana
  return <Card title="Mana Core" action={<Status tone="active">+{rate(regen.total)}/s</Status>}>
    <div className="channeling-mana-hero"><div><span className="eyebrow">CURRENT MANA</span><strong>{Math.floor(player.mana)} <small>/ {player.maxMana}</small></strong>{overCap && <Status tone="warning">OVER CAP</Status>}</div><span className="channeling-mana-orb">✦</span></div>
    <Progress value={player.maxMana ? player.mana / player.maxMana * 100 : 0} tone="orange" label="Mana reserves" right={`${Math.floor(player.mana)} / ${player.maxMana}`} />
    <div className="channeling-flow"><span>TOTAL MANA FLOW</span><strong>+{rate(regen.total)}/s</strong></div>
    <div className="channeling-mana-summary"><span>PASSIVE MANA<strong>+{rate(regen.passiveAfterResonance)}/s</strong></span><span>ARCANE ECHOES<strong>+{rate(regen.echoTotal)}/s</strong></span><span>MAX MANA<strong>{capacity.total}</strong></span></div>
    <Button variant="ghost" className="channeling-breakdown-toggle" onClick={onToggle}>{expanded ? 'Hide Detailed Breakdown' : 'View Detailed Breakdown'}</Button>
    {expanded && <div className="channeling-breakdown mana-core-breakdown">
      <div><span>PASSIVE MANA<strong>+{rate(regen.passiveAfterResonance)}/s</strong></span><small>Base + flat <b>+{rate(regen.passiveBeforeResonance)}/s</b></small><small>Mana Resonance <b>{percent(regen.manaResonanceMultiplier)}</b></small></div>
      <div><span>ARCANE ECHOES<strong>+{rate(regen.echoTotal)}/s</strong></span><small>Base Echo Output <b>+{rate(regen.echoBase)}/s</b></small><small>Echo Attunement <b>{percent(regen.echoAttunementMultiplier)}</b></small><small>Echo Resonance <b>{percent(regen.echoDiscoveryMultiplier)}</b></small></div>
      <div><span>DEVELOPER BONUS<strong>+{rate(regen.developerBonus)}/s</strong></span><small>Temporary runtime override only</small></div>
      <div className="channeling-capacity"><span>MAX MANA CALCULATION</span><strong>Base + Flat + Developer <b>{capacity.preAmplification}</b></strong><strong>Developer Capacity Bonus <b>+{capacity.developerCapacityBonus}</b></strong><strong>Astral Expansion <b>{percent(capacity.astralExpansionMultiplier)}</b></strong><strong>FINAL <b>{capacity.total}</b></strong></div>
    </div>}
  </Card>
}
