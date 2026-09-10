import { Card, Button, Status } from '../../../components/ui'
import { GameTooltip, TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { BALANCE } from '../../../game/data/balance'
import { getManaRegenBreakdown } from '../../../game/engine/channelingEngine'
import { selectFreeFocus } from '../../../store/selectors'
import { useGameStore } from '../../../store/gameStore'
import { formatChannelingRate } from './channelingPresentation'

export function ArcaneEchoPanel() {
  const echoes = useGameStore((state) => state.activities.channeling.echoesAssigned)
  const activities = useGameStore((state) => state.activities)
  const progress = useGameStore((state) => state.progress)
  const equipment = useGameStore((state) => state.equipment)
  const artifactProgress = useGameStore((state) => state.artifactProgress)
  const freeFocus = useGameStore(selectFreeFocus)
  const add = useGameStore((state) => state.addArcaneEcho)
  const remove = useGameStore((state) => state.removeArcaneEcho)
  const regen = getManaRegenBreakdown({ activities, progress, equipment, artifactProgress })
  const manaPerEcho = echoes > 0 ? regen.echoTotal / echoes : BALANCE.channeling.echoManaPerSecond * regen.echoAttunementMultiplier * regen.echoDiscoveryMultiplier
  const status = echoes > BALANCE.channeling.maxEchoes ? 'OVERRIDE' : echoes === 0 ? 'IDLE' : echoes === BALANCE.channeling.maxEchoes ? 'MAX ECHOES' : 'ACTIVE'
  return <Card title="Arcane Echo Channeling" action={<Status tone={echoes > BALANCE.channeling.maxEchoes ? 'warning' : echoes === 0 ? 'neutral' : 'active'}>{status}</Status>}>
    <p className="muted">Echoes maintain the leyline while the wizard performs other work.</p>
    <div className="echo-counter"><Button variant="secondary" ariaLabel="Remove Arcane Echo" onClick={remove} disabled={echoes <= 0}>−</Button><strong>{echoes} <small>/ {BALANCE.channeling.maxEchoes}</small></strong><Button variant="secondary" ariaLabel="Add Arcane Echo" onClick={add} disabled={echoes >= BALANCE.channeling.maxEchoes}>+</Button></div>
    <div className="echo-slots" aria-label={`${echoes} Arcane Echo slots active`}>{Array.from({ length: BALANCE.channeling.maxEchoes }, (_, index) => { const active = index < echoes; return <GameTooltip key={index} content={<TooltipContent title={`Arcane Echo ${index + 1}`} description={active ? 'Active channel. Generating Mana and reserving Focus.' : 'Empty slot. Assign an Echo to begin channeling.'}><div className="tooltip-section"><small>STATUS</small><p>{active ? 'Active' : 'Available'}</p></div></TooltipContent>} accent="mana"><span className={active ? 'active' : ''}><i>✦</i><small>Echo {index + 1}</small></span></GameTooltip> })}</div>
    <div className="echo-core-stats"><span>Effective per Echo<strong>+{formatChannelingRate(manaPerEcho)}/s</strong></span><span>Focus reserved<strong>{echoes * BALANCE.channeling.echoFocusCost}</strong></span><span>Free Focus<strong>{freeFocus}</strong></span></div>
    {echoes < BALANCE.channeling.maxEchoes && freeFocus < BALANCE.channeling.echoFocusCost && <p className="channeling-inline-warning">Not enough free Focus to assign another Echo.</p>}
  </Card>
}
