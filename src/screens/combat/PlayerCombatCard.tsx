import { Droplet, Heart, Shield, Sparkles } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
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
import { CombatActionProgress, CombatTimelineReadout, useCombatVisualTimeline } from './CombatActionProgress'
import { getCombatVisualRate } from './performance/combatTimeline'
import { formatResourceAmount } from '../../game/presentation/resources/resourcePresentation'

export function PlayerCombatCard() {
  const health = useGameStore((state) => state.player.health)
  const maxHealth = useGameStore((state) => state.player.maxHealth)
  const mana = useGameStore((state) => state.player.mana)
  const maxMana = useGameStore((state) => state.player.maxMana)
  const playerBarrier = useGameStore((state) => state.combat.playerBarrier)
  const playerBarrierRemainingMs = useGameStore((state) => state.combat.playerBarrierRemainingMs)
  const pendingCast = useGameStore(useShallow((state) => state.combat.pendingPlayerSpellCast ? {
    spellId: state.combat.pendingPlayerSpellCast.spellId,
    castWorkMs: state.combat.pendingPlayerSpellCast.castWorkMs,
    manaCostSnapshot: state.combat.pendingPlayerSpellCast.manaCostSnapshot,
    cycleId: `${state.combat.enemyInstanceKey ?? 'downtime'}:${state.combat.arcaneCoreRuntime.spellCastCount + 1}:${state.combat.pendingPlayerSpellCast.spellId}`,
  } : null))
  const queuedSpellId = useGameStore((state) => state.combat.queuedPlayerSpellId)
  const cannotAct = useGameStore((state) => actorCannotAct(state, 'player'))
  const pendingSpell = pendingCast ? SPELLS[pendingCast.spellId] : null
  const queuedSpell = queuedSpellId ? SPELLS[queuedSpellId] : null
  const queuedCooldown = useGameStore((state) => queuedSpellId ? state.combat.spellCooldowns[queuedSpellId] ?? 0 : 0)
  const queuedFailure = useGameStore((state) => queuedSpellId ? getSpellStartFailure(state, queuedSpellId) : null)
  const queuedState = queuedSpell
    ? queuedCooldown > 0 ? `CD ${formatTime(queuedCooldown)}` : queuedFailure === 'mana' ? 'WAITING MANA' : queuedFailure === 'no-target' ? 'WAITING TARGET' : queuedFailure === 'stunned' || queuedFailure === 'silenced' ? 'WAITING STATUS' : 'READY'
    : null

  return <section className={`combat-actor-card combat-player-card${cannotAct ? ' is-disabled' : ''}`}>
    <header className="combat-actor-head"><div className="combat-actor-head-copy"><span className="combat-subsection-label">PLAYER</span><h2>YOUR WIZARD</h2></div><Status tone={cannotAct ? 'warning' : 'active'}>{cannotAct ? 'Unable to act' : 'Ready'}</Status></header>
    <CombatFloatingFeedback actor="player" health={health} barrier={playerBarrier} resetKey="player" /><div className="combat-resource-stack"><CombatResource icon={<Heart size={13} />} label="HP" value={`${formatNumber(health)} / ${formatNumber(maxHealth)}`} currentValue={health} maxValue={maxHealth} percent={health / Math.max(1, maxHealth) * 100} tone="health" /><CombatResource icon={<Droplet size={13} />} label="MANA" value={`${formatResourceAmount(mana)} / ${formatResourceAmount(maxMana)}`} currentValue={mana} maxValue={maxMana} percent={mana / Math.max(1, maxMana) * 100} tone="mana" /><CombatResource icon={<Shield size={13} />} label="BARRIER" value={`${formatNumber(playerBarrier)}${playerBarrierRemainingMs === null ? '' : ` · ${formatTime(playerBarrierRemainingMs)}`} `} currentValue={playerBarrier} maxValue={maxHealth} percent={playerBarrier / Math.max(1, maxHealth) * 100} tone="barrier" /></div>
    <CombatStatusStrip actor="player" label="ACTIVE STATUSES" />
    {pendingCast && pendingSpell && <PlayerCastTimeline pendingCast={pendingCast} pendingSpell={pendingSpell.name} />}
    {queuedSpell && <div className="combat-spell-queue" aria-label={`Next spell ${queuedSpell.name}, ${queuedState}`}><div><span className="combat-subsection-label">NEXT</span><strong><Sparkles size={12} aria-hidden="true" />{queuedSpell.name}</strong></div><span className="combat-spell-queue-state">{queuedState}</span></div>}
  </section>
}

function PlayerCastTimeline({ pendingCast, pendingSpell }: { pendingCast: { spellId: string; castWorkMs: number; manaCostSnapshot: number; cycleId: string }; pendingSpell: string }) {
  const timing = useGameStore(useShallow((state) => {
    const baseRate = getPlayerSpellCastRate(state)
    const blocked = state.debug.combatPaused || state.debug.freezePlayerActions || baseRate <= 0
    return { remainingWorkMs: state.combat.pendingPlayerSpellCast?.remainingWorkMs ?? pendingCast.castWorkMs, baseRate, blocked, timeScale: state.debug.combatTimeScale }
  }))
  const rate = getCombatVisualRate(timing.baseRate, timing.blocked, timing.timeScale)
  const snapshot = { cycleId: pendingCast.cycleId, baseWorkMs: pendingCast.castWorkMs, remainingWorkMs: timing.remainingWorkMs, rate, blocked: timing.blocked }
  const timelineRef = useCombatVisualTimeline(snapshot)
  return <GameTooltip block content={<TooltipContent title={`Casting ${pendingSpell}`} description="The spell resolves when its cast work completes. Mana and cooldown are committed on successful completion." />}><div className="combat-spell-cast"><div className="combat-spell-cast-head"><div><span className="combat-subsection-label">CASTING</span><strong><Sparkles size={13} aria-hidden="true" />{pendingSpell}</strong></div><CombatTimelineReadout timelineRef={timelineRef} mode="eta" className="combat-spell-cast-eta ui-time" fallback={timing.blocked ? 'PAUSED' : formatTime(Math.max(0, timing.remainingWorkMs) / Math.max(0.0001, rate))} /></div><CombatActionProgress {...snapshot} timelineRef={timelineRef} /><span className="combat-spell-cast-meta"><CombatTimelineReadout timelineRef={timelineRef} mode="elapsed" totalWorkMs={pendingCast.castWorkMs} fallback={formatTime(Math.max(0, pendingCast.castWorkMs - timing.remainingWorkMs))} /> / {formatTime(pendingCast.castWorkMs)} · {pendingCast.manaCostSnapshot} MANA</span></div></GameTooltip>
}
