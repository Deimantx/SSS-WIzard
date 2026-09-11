import { Droplet, Heart, Shield, WandSparkles } from 'lucide-react'
import { ITEMS } from '../../game/content/items/items'
import { actorCannotAct } from '../../game/systems/combat/statusRuntime'
import { formatNumber, formatTime } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { selectPlayerBasicDamage } from '../../store/selectors'
import { GameTooltip, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { CombatStatusStrip } from './CombatStatusStrip'
import { CombatResource } from './CombatResource'
import { CombatFloatingFeedback } from './CombatFloatingFeedback'

export function PlayerCombatCard() {
  const health = useGameStore((state) => state.player.health)
  const maxHealth = useGameStore((state) => state.player.maxHealth)
  const mana = useGameStore((state) => state.player.mana)
  const maxMana = useGameStore((state) => state.player.maxMana)
  const playerBarrier = useGameStore((state) => state.combat.playerBarrier)
  const playerBarrierRemainingMs = useGameStore((state) => state.combat.playerBarrierRemainingMs)
  const playerStatuses = useGameStore((state) => state.combat.playerStatuses)
  const weaponId = useGameStore((state) => state.equipment.weapon)
  const basicDamage = useGameStore(selectPlayerBasicDamage)
  const cannotAct = useGameStore((state) => actorCannotAct(state, 'player'))
  const weapon = weaponId ? ITEMS[weaponId] : null

  return <section className={`combat-actor-card combat-player-card${cannotAct ? ' is-disabled' : ''}`}>
    <header className="combat-actor-head"><div className="combat-actor-head-copy"><span className="combat-subsection-label">PLAYER</span><h2>YOUR WIZARD</h2></div><Status tone={cannotAct ? 'warning' : 'active'}>{cannotAct ? 'Unable to act' : 'Ready'}</Status></header>
    <CombatFloatingFeedback actor="player" health={health} barrier={playerBarrier} resetKey="player" /><div className="combat-resource-stack"><CombatResource icon={<Heart size={13} />} label="HP" value={`${formatNumber(health)} / ${formatNumber(maxHealth)}`} currentValue={health} maxValue={maxHealth} percent={health / Math.max(1, maxHealth) * 100} tone="health" /><CombatResource icon={<Droplet size={13} />} label="MANA" value={`${formatNumber(mana)} / ${formatNumber(maxMana)}`} currentValue={mana} maxValue={maxMana} percent={mana / Math.max(1, maxMana) * 100} tone="mana" /><CombatResource icon={<Shield size={13} />} label="BARRIER" value={`${formatNumber(playerBarrier)}${playerBarrierRemainingMs === null ? '' : ` · ${formatTime(playerBarrierRemainingMs)}`} `} currentValue={playerBarrier} maxValue={maxHealth} percent={playerBarrier / Math.max(1, maxHealth) * 100} tone="barrier" /></div>
    <CombatStatusStrip statuses={playerStatuses} label="ACTIVE STATUSES" />
    <GameTooltip block content={<TooltipContent title="Basic Attack" description="Your equipped weapon attacks automatically. Live timing is shown in Combat Flow." />}><div className="combat-basic-attack"><div className="combat-basic-head"><span className="combat-subsection-label">BASIC ATTACK</span><span className="combat-basic-weapon"><WandSparkles size={13} aria-hidden="true" />{weapon?.name ?? 'Unarmed'}</span></div><div className="combat-basic-stats"><span>Damage<strong>{formatNumber(basicDamage)}</strong></span></div></div></GameTooltip>
  </section>
}
