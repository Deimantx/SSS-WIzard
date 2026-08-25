import { Card, Button, Status } from '../../../components/ui'
import { BALANCE } from '../../../game/data/balance'
import { getManaRegenBreakdown } from '../../../game/engine/channelingEngine'
import { selectFreeFocus } from '../../../store/selectors'
import { useGameStore } from '../../../store/gameStore'

const rate = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1)

export function ArcaneEchoPanel() {
  const echoes = useGameStore((state) => state.activities.channeling.echoesAssigned)
  const activities = useGameStore((state) => state.activities)
  const progress = useGameStore((state) => state.progress)
  const equipment = useGameStore((state) => state.equipment)
  const freeFocus = useGameStore(selectFreeFocus)
  const add = useGameStore((state) => state.addArcaneEcho)
  const remove = useGameStore((state) => state.removeArcaneEcho)
  const regen = getManaRegenBreakdown({ activities, progress, equipment })
  const manaPerEcho = BALANCE.channeling.echoManaPerSecond * regen.echoMultiplier
  const status = echoes === 0 ? 'IDLE' : echoes === BALANCE.channeling.maxEchoes ? 'MAX ECHOES' : 'ACTIVE'
  return <Card title="Arcane Echo Channeling" action={<Status tone={echoes === 0 ? 'neutral' : 'active'}>{status}</Status>}>
    <p className="muted">Echoes maintain the leyline while the wizard performs other work.</p>
    <div className="echo-counter"><Button variant="secondary" ariaLabel="Remove Arcane Echo" onClick={remove} disabled={echoes <= 0}>−</Button><strong>{echoes} <small>/ {BALANCE.channeling.maxEchoes}</small></strong><Button variant="secondary" ariaLabel="Add Arcane Echo" onClick={add} disabled={echoes >= BALANCE.channeling.maxEchoes}>+</Button></div>
    <div className="echo-stat-list"><span>Mana per Echo<strong>+{rate(manaPerEcho)}/s</strong></span><span>Echo production<strong>+{rate(regen.echoTotal)}/s</strong></span><span>Focus per Echo<strong>{BALANCE.channeling.echoFocusCost}</strong></span><span>Focus reserved<strong>{echoes * BALANCE.channeling.echoFocusCost}</strong></span><span>Free Focus<strong>{freeFocus}</strong></span></div>
    {echoes < BALANCE.channeling.maxEchoes && freeFocus < BALANCE.channeling.echoFocusCost && <p className="channeling-inline-warning">Not enough free Focus to assign another Echo.</p>}
  </Card>
}
