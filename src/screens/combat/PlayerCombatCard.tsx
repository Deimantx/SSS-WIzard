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
import { CombatStatusStrip } from './CombatStatusStrip'

export function PlayerCombatCard() {
  const player = useGameStore((state) => state.player)
  const combat = useGameStore((state) => state.combat)
  const weaponId = useGameStore((state) => state.equipment.weapon)
  const basicDamage = useGameStore(selectPlayerBasicDamage)
  const interval = useGameStore((state) => resolveBasicAttackInterval(state, 'player', BALANCE.player.basicAttackIntervalMs))
  const cannotAct = useGameStore((state) => actorCannotAct(state, 'player'))
  const weapon = weaponId ? ITEMS[weaponId] : null
  const attackProgress = Math.max(0, Math.min(1, 1 - combat.playerAttackTimerMs / Math.max(1, interval)))
  return <section className={`combat-actor-card combat-player-card${cannotAct ? ' is-disabled' : ''}`}><header className="combat-actor-head"><div className="combat-actor-mark"><WandSparkles size={20} aria-hidden="true" /></div><div><span className="combat-subsection-label">PLAYER</span><h2>YOUR WIZARD</h2></div><Status tone={cannotAct ? 'warning' : 'active'}>{cannotAct ? 'Unable to act' : 'Ready'}</Status></header><div className="combat-resource-stack"><CombatResource icon={<Heart size={13} />} label="HP" value={`${formatNumber(player.health)} / ${formatNumber(player.maxHealth)}`} percent={player.health / Math.max(1, player.maxHealth) * 100} tone="health" /><CombatResource icon={<Droplet size={13} />} label="MANA" value={`${formatNumber(player.mana)} / ${formatNumber(player.maxMana)}`} percent={player.mana / Math.max(1, player.maxMana) * 100} tone="mana" />{combat.playerBarrier > 0 && <CombatResource icon={<Shield size={13} />} label="BARRIER" value={`${formatNumber(combat.playerBarrier)}${combat.playerBarrierRemainingMs === null ? '' : ` · ${formatTime(combat.playerBarrierRemainingMs)}`}`} percent={combat.playerBarrier / Math.max(1, player.maxHealth) * 100} tone="barrier" />}</div><CombatStatusStrip statuses={combat.playerStatuses} label="ACTIVE STATUSES" /><GameTooltip block content={<TooltipContent title="Basic Attack" description="Your equipped weapon attacks automatically on its resolved combat interval." />}><section className="combat-basic-attack"><div className="combat-basic-head"><span className="combat-subsection-label">BASIC ATTACK</span><span className="combat-basic-weapon"><WandSparkles size={13} aria-hidden="true" />{weapon?.name ?? 'Unarmed'}</span></div><div className="combat-basic-stats"><span>Damage<strong>{formatNumber(basicDamage)}</strong></span><span>Next Attack<strong className="ui-time"><Clock3 size={12} aria-hidden="true" />{formatTime(Math.max(0, combat.playerAttackTimerMs))}</strong></span></div><Progress value={attackProgress * 100} tone="time" label="Attack progress" right={`${formatTime(Math.max(0, combat.playerAttackTimerMs))} remaining`} /></section></GameTooltip></section>
}

function CombatResource({ icon, label, value, percent, tone }: { icon: React.ReactNode; label: string; value: string; percent: number; tone: 'health' | 'mana' | 'barrier' }) {
  const description = tone === 'health' ? 'Current Health. Reaching zero defeats the Wizard.' : tone === 'mana' ? 'Mana is spent to cast Spells.' : 'Barrier absorbs incoming damage before Health.'
  return <GameTooltip block accent={tone === 'health' ? 'danger' : tone === 'mana' ? 'mana' : 'success'} content={<TooltipContent title={label} description={description} />}><div className={`combat-resource combat-resource-${tone}`} aria-label={`${label} ${value}`}><div className="combat-resource-label"><span>{icon}{label}</span><strong>{value}</strong></div><div className="combat-resource-track"><i style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} /></div></div></GameTooltip>
}
