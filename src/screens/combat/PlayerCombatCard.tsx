import { Droplet, Heart, Shield, Sparkles } from 'lucide-react'
import { SPELLS } from '../../game/content/spells'
import { actorCannotAct } from '../../game/systems/combat/statusRuntime'
import { formatNumber, formatTime } from '../../game/utils'
import { getPlayerSpellCastRate, getSpellStartFailure } from '../../game/engine/spellEngine'
import { useGameStore } from '../../store/gameStore'
import { GameTooltip, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { CombatStatusStrip } from './CombatStatusStrip'
import { CombatResource } from './CombatResource'
import { CombatFloatingFeedback } from './CombatFloatingFeedback'
import { CombatActionProgress } from './CombatActionProgress'
import { formatResourceAmount } from '../../game/presentation/resources/resourcePresentation'

export function PlayerCombatCard() {
  const health = useGameStore((state) => state.player.health)
  const maxHealth = useGameStore((state) => state.player.maxHealth)
  const mana = useGameStore((state) => state.player.mana)
  const maxMana = useGameStore((state) => state.player.maxMana)
  const playerBarrier = useGameStore((state) => state.combat.playerBarrier)
  const playerBarrierRemainingMs = useGameStore((state) => state.combat.playerBarrierRemainingMs)
  const playerStatuses = useGameStore((state) => state.combat.playerStatuses)
  const pendingCast = useGameStore((state) => state.combat.pendingPlayerSpellCast)
  const queuedSpellId = useGameStore((state) => state.combat.queuedPlayerSpellId)
  const freezePlayerActions = useGameStore((state) => state.debug.freezePlayerActions)
  const cannotAct = useGameStore((state) => actorCannotAct(state, 'player'))
  const castRate = useGameStore(getPlayerSpellCastRate)
  const pendingSpell = pendingCast ? SPELLS[pendingCast.spellId] : null
  const queuedSpell = queuedSpellId ? SPELLS[queuedSpellId] : null
  const queuedCooldown = useGameStore((state) => queuedSpellId ? state.combat.spellCooldowns[queuedSpellId] ?? 0 : 0)
  const queuedFailure = useGameStore((state) => queuedSpellId ? getSpellStartFailure(state, queuedSpellId) : null)
  const castProgress = pendingCast ? Math.max(0, Math.min(100, (1 - pendingCast.remainingWorkMs / Math.max(0.0001, pendingCast.castWorkMs)) * 100)) : 0
  const castEtaMs = pendingCast && !cannotAct && !freezePlayerActions && castRate > 0 ? pendingCast.remainingWorkMs / castRate : null
  const queuedState = queuedSpell
    ? queuedCooldown > 0 ? `CD ${formatTime(queuedCooldown)}` : queuedFailure === 'mana' ? 'WAITING MANA' : queuedFailure === 'no-target' ? 'WAITING TARGET' : queuedFailure === 'stunned' || queuedFailure === 'silenced' ? 'WAITING STATUS' : 'READY'
    : null

  return <section className={`combat-actor-card combat-player-card${cannotAct ? ' is-disabled' : ''}`}>
    <header className="combat-actor-head"><div className="combat-actor-head-copy"><span className="combat-subsection-label">PLAYER</span><h2>YOUR WIZARD</h2></div><Status tone={cannotAct ? 'warning' : 'active'}>{cannotAct ? 'Unable to act' : 'Ready'}</Status></header>
    <CombatFloatingFeedback actor="player" health={health} barrier={playerBarrier} resetKey="player" /><div className="combat-resource-stack"><CombatResource icon={<Heart size={13} />} label="HP" value={`${formatNumber(health)} / ${formatNumber(maxHealth)}`} currentValue={health} maxValue={maxHealth} percent={health / Math.max(1, maxHealth) * 100} tone="health" /><CombatResource icon={<Droplet size={13} />} label="MANA" value={`${formatResourceAmount(mana)} / ${formatResourceAmount(maxMana)}`} currentValue={mana} maxValue={maxMana} percent={mana / Math.max(1, maxMana) * 100} tone="mana" /><CombatResource icon={<Shield size={13} />} label="BARRIER" value={`${formatNumber(playerBarrier)}${playerBarrierRemainingMs === null ? '' : ` · ${formatTime(playerBarrierRemainingMs)}`} `} currentValue={playerBarrier} maxValue={maxHealth} percent={playerBarrier / Math.max(1, maxHealth) * 100} tone="barrier" /></div>
    <CombatStatusStrip statuses={playerStatuses} label="ACTIVE STATUSES" />
    {pendingCast && pendingSpell && <GameTooltip block content={<TooltipContent title={`Casting ${pendingSpell.name}`} description="The spell resolves when its cast work completes. Mana and cooldown are committed on successful completion." />}><div className="combat-spell-cast"><div className="combat-spell-cast-head"><div><span className="combat-subsection-label">CASTING</span><strong><Sparkles size={13} aria-hidden="true" />{pendingSpell.name}</strong></div><span className="combat-spell-cast-eta ui-time">{castEtaMs === null ? 'PAUSED' : formatTime(castEtaMs)}</span></div><CombatActionProgress value={castProgress} /><span className="combat-spell-cast-meta">{formatTime(Math.max(0, pendingCast.castWorkMs - pendingCast.remainingWorkMs))} / {formatTime(pendingCast.castWorkMs)} · {pendingSpell.manaCost} MANA</span></div></GameTooltip>}
    {queuedSpell && <div className="combat-spell-queue" aria-label={`Next spell ${queuedSpell.name}, ${queuedState}`}><div><span className="combat-subsection-label">NEXT</span><strong><Sparkles size={12} aria-hidden="true" />{queuedSpell.name}</strong></div><span className="combat-spell-queue-state">{queuedState}</span></div>}
  </section>
}
