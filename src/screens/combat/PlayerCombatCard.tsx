import { Clock3, Droplet, Heart, Shield, WandSparkles } from 'lucide-react'
import { ITEMS } from '../../game/content/items/items'
import { actorCannotAct } from '../../game/systems/combat/statusRuntime'
import { resolveBasicAttackInterval } from '../../game/systems/combat/effectResolver'
import { BALANCE } from '../../game/core/balance/balance'
import { formatNumber, formatTime } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { selectPlayerBasicDamage } from '../../store/selectors'
import { GameTooltip, Progress, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../components/ui/item/ItemIcon'
import { CombatStatusStrip } from './CombatStatusStrip'
import { CombatResource } from './CombatResource'

export function PlayerCombatCard() {
  const health = useGameStore((state) => state.player.health)
  const maxHealth = useGameStore((state) => state.player.maxHealth)
  const mana = useGameStore((state) => state.player.mana)
  const maxMana = useGameStore((state) => state.player.maxMana)
  const playerBarrier = useGameStore((state) => state.combat.playerBarrier)
  const playerBarrierRemainingMs = useGameStore((state) => state.combat.playerBarrierRemainingMs)
  const playerStatuses = useGameStore((state) => state.combat.playerStatuses)
  const playerAttackTimerMs = useGameStore((state) => state.combat.playerAttackTimerMs)
  const weaponId = useGameStore((state) => state.equipment.weapon)
  const basicDamage = useGameStore(selectPlayerBasicDamage)
  const interval = useGameStore((state) => resolveBasicAttackInterval(state, 'player', BALANCE.player.basicAttackIntervalMs))
  const cannotAct = useGameStore((state) => actorCannotAct(state, 'player'))
  const weapon = weaponId ? ITEMS[weaponId] : null
  const attackProgress = Math.max(0, Math.min(1, 1 - playerAttackTimerMs / Math.max(1, interval)))
  return <section className={`combat-actor-card combat-player-card${cannotAct ? ' is-disabled' : ''}`}><header className="combat-actor-head"><div className="combat-actor-mark"><WandSparkles size={20} aria-hidden="true" /></div><div className="combat-actor-head-copy"><span className="combat-subsection-label">PLAYER</span><h2>YOUR WIZARD</h2></div><Status tone={cannotAct ? 'warning' : 'active'}>{cannotAct ? 'Unable to act' : 'Ready'}</Status></header><div className="combat-player-sigil">{weaponId ? <ItemIcon itemId={weaponId} size="large" /> : <WandSparkles size={42} strokeWidth={1.15} aria-hidden="true" />}<span>{weapon?.name ?? 'Unarmed focus'}</span></div><div className="combat-resource-stack"><CombatResource icon={<Heart size={13} />} label="HP" value={`${formatNumber(health)} / ${formatNumber(maxHealth)}`} percent={health / Math.max(1, maxHealth) * 100} tone="health" /><CombatResource icon={<Droplet size={13} />} label="MANA" value={`${formatNumber(mana)} / ${formatNumber(maxMana)}`} percent={mana / Math.max(1, maxMana) * 100} tone="mana" /><CombatResource icon={<Shield size={13} />} label="BARRIER" value={`${formatNumber(playerBarrier)}${playerBarrierRemainingMs === null ? '' : ` · ${formatTime(playerBarrierRemainingMs)}`}`} percent={playerBarrier / Math.max(1, maxHealth) * 100} tone="barrier" /></div><CombatStatusStrip statuses={playerStatuses} label="ACTIVE STATUSES" /><GameTooltip block content={<TooltipContent title="Basic Attack" description="Your equipped weapon attacks automatically on its resolved combat interval." />}><section className="combat-basic-attack"><div className="combat-basic-head"><span className="combat-subsection-label">BASIC ATTACK</span><span className="combat-basic-weapon"><WandSparkles size={13} aria-hidden="true" />{weapon?.name ?? 'Unarmed'}</span></div><div className="combat-basic-stats"><span>Damage<strong>{formatNumber(basicDamage)}</strong></span><span>Next Attack<strong className="ui-time"><Clock3 size={12} aria-hidden="true" />{formatTime(Math.max(0, playerAttackTimerMs))}</strong></span></div><Progress value={attackProgress * 100} tone="time" label="Attack progress" /></section></GameTooltip></section>
}
