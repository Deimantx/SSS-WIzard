import { Clock3, Heart, Shield, ShieldAlert, Sparkles, Swords, TimerReset } from 'lucide-react'
import { useMemo } from 'react'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../game/content/monsters'
import { buildCombatActionPresentation, type CombatActionPresentation, type CombatEffectPresentation } from '../../game/presentation/combat'
import { getCombatFlowPresentation, type CombatFlowTimeline } from '../../game/presentation/combat/combatFlowPresentation'
import { getCurrentEnemyActionStep, getEnemyAction, getEnemyActionPattern } from '../../game/systems/combat/actionRuntime'
import { actorCannotAct } from '../../game/systems/combat/statusRuntime'
import type { DungeonId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { selectPlayerBasicDamage } from '../../store/selectors'
import { formatTime } from '../../game/utils'
import { BALANCE } from '../../game/core/balance/balance'
import { resolveBasicAttackInterval } from '../../game/systems/combat/effectResolver'
import { GameTooltip, Progress } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { EnemyPatternRail } from './EnemyPatternRail'

export function CombatFlowPanel({ selectedDungeonId }: { selectedDungeonId: DungeonId }) {
  const combat = useGameStore((state) => state.combat)
  const enemy = useGameStore((state) => state.combat.enemyId ? MONSTERS[state.combat.enemyId] ?? null : null)
  const dungeon = DUNGEONS[combat.active ? combat.dungeonId ?? selectedDungeonId : selectedDungeonId]
  const playerBasicDamage = useGameStore(selectPlayerBasicDamage)
  const playerAttackIntervalMs = useGameStore((state) => resolveBasicAttackInterval(state, 'player', BALANCE.player.basicAttackIntervalMs))
  const playerStunned = useGameStore((state) => actorCannotAct(state, 'player'))
  const enemyStunned = useGameStore((state) => actorCannotAct(state, 'enemy'))
  const pattern = useGameStore((state) => state.combat.enemyId ? getEnemyActionPattern(state) : undefined)
  const nextStep = useGameStore((state) => state.combat.enemyId ? getCurrentEnemyActionStep(state) : undefined)
  const telegraphAction = useGameStore((state) => state.combat.enemyId ? getEnemyAction(state, state.combat.enemyTelegraphActionId) : undefined)
  const presentation = useMemo(() => getCombatFlowPresentation({
    active: combat.active,
    dungeonId: combat.dungeonId,
    selectedDungeonId,
    enemyId: combat.enemyId,
    dungeon,
    enemy,
    threatCleared: combat.threatCleared,
    inBossFight: combat.inBossFight,
    encounterTimerMs: combat.encounterTimerMs,
    playerAttackTimerMs: combat.playerAttackTimerMs,
    playerAttackIntervalMs,
    enemyActionTimerMs: combat.enemyActionTimerMs,
    enemyActionRecoveryMs: combat.enemyActionRecoveryMs,
    enemyActionIndex: combat.enemyActionIndex,
    enemyTelegraphMs: combat.enemyTelegraphMs,
    enemyTelegraphActionId: combat.enemyTelegraphActionId,
    enemyTelegraphStepId: combat.enemyTelegraphStepId,
    enemyTelegraphPatternId: combat.enemyTelegraphPatternId,
    enemyActionPatternId: combat.enemyActionPatternId,
    playerBasicDamage,
    playerStunned,
    enemyStunned,
    pattern,
    nextStep,
    telegraphAction,
  }), [combat, dungeon, enemy, enemyStunned, nextStep, pattern, playerAttackIntervalMs, playerBasicDamage, playerStunned, selectedDungeonId, telegraphAction])

  if (presentation.mode === 'tower') return <section className="combat-flow-panel is-tower"><div className="combat-flow-kicker">AT THE TOWER</div><ShieldAlert size={28} aria-hidden="true" /><strong>Enter a Dungeon to begin Combat.</strong></section>
  if (presentation.mode === 'boss-ready') return <section className="combat-flow-panel is-boss-ready"><div className="combat-flow-kicker">BOSS READY</div><ShieldAlert size={28} aria-hidden="true" /><strong>{MONSTERS[presentation.dungeon.boss].name} awaits.</strong><p>The route is clear. Engage the Boss from the Run Bar when ready.</p></section>
  if (presentation.mode === 'encounter-delay') return <section className="combat-flow-panel is-encounter-delay"><div className="combat-flow-kicker">NEXT ENCOUNTER</div><strong className="combat-flow-delay">{formatTime(presentation.encounterTimerMs)}</strong><Progress value={Math.max(0, Math.min(100, (1 - presentation.encounterTimerMs / Math.max(1, presentation.dungeon.encounterDelayMs)) * 100))} tone="time" label="Encounter progress" /><p>The Dungeon is searching for another threat.</p></section>

  return <section className={`combat-flow-panel${presentation.enemyTimeline?.state === 'telegraph' ? ' is-telegraphing' : ''}`} style={{ '--enemy-accent': presentation.enemy?.color } as React.CSSProperties}>
    <header className="combat-flow-head"><span className="combat-flow-kicker">COMBAT FLOW</span></header>
    <div className="combat-flow-timelines"><TimelineRow timeline={presentation.playerTimeline} /><TimelineRow timeline={presentation.enemyTimeline} /></div>
    {presentation.enemyIntent && <GameTooltip block wide={presentation.enemyIntent.special} placement="bottom" accent={presentation.enemyIntent.special ? 'warning' : 'neutral'} content={presentation.enemyIntent.action ? <ActionTooltip action={presentation.enemyIntent.action} /> : undefined}><div className={`combat-flow-intent${presentation.enemyIntent.special ? ' is-special' : ''}`}><div className="combat-flow-subhead"><span className="combat-subsection-label">ENEMY INTENT</span><strong>{presentation.enemyIntent.label}</strong></div>{presentation.enemyIntent.action ? <div className="combat-flow-effects">{presentation.enemyIntent.action.effects.map((effect, index) => <CombatEffectRow key={`${effect.label}-${index}`} effect={effect} />)}</div> : presentation.enemyIntent.basic ? <div className="combat-flow-effects"><CombatEffectRow effect={presentation.enemyIntent.basic} /></div> : null}</div></GameTooltip>}
    <div className="combat-flow-pattern"><div className="combat-subsection-label">ENEMY PATTERN</div><EnemyPatternRail pattern={presentation.pattern} enemy={presentation.enemy} currentIndex={presentation.patternIndex} activeStepId={presentation.activeStepId} activeAction={presentation.activeActionId} activeOriginMatchesCurrent={presentation.activeOriginMatchesCurrent} /></div>
  </section>
}

function TimelineRow({ timeline }: { timeline: CombatFlowTimeline | null }) {
  if (!timeline) return null
  const label = timeline.actor === 'player' ? 'PLAYER' : 'ENEMY'
  const progress = timeline.progress ?? 0
  return <div className={`combat-flow-timeline combat-flow-timeline-${timeline.actor}${timeline.state === 'telegraph' ? ' is-telegraphing' : ''}${timeline.state === 'stunned' ? ' is-stunned' : ''}`}><div className="combat-flow-timeline-head"><span className="combat-subsection-label">{label}</span><strong>{timeline.label}</strong><span className="combat-flow-timeline-time ui-time">{timeline.state === 'stunned' ? 'STUNNED' : formatTime(timeline.remainingMs ?? 0)}</span></div>{timeline.state === 'stunned' ? <div className="combat-flow-paused">Action paused</div> : <Progress value={progress} label={`${label} ${timeline.label} progress`} />}</div>
}

function CombatEffectRow({ effect }: { effect: CombatEffectPresentation }) {
  const value = effect.kind === 'damage' ? `${effect.value ?? ''} ${effect.label}`.trim() : effect.kind === 'barrier' ? `+${effect.value ?? 0} BARRIER` : effect.kind === 'heal' ? `HEAL ${effect.value ?? 0}` : effect.kind === 'status' ? effect.label.replace(/^Applies /, '').toUpperCase() : effect.kind === 'control' && effect.label === 'Basic Attack' ? `BASIC ATTACK DELAY ${effect.value ?? ''}`.trim() : [effect.label, effect.value].filter(Boolean).join(' ')
  const detail = [effect.detail, effect.timeLabel].filter(Boolean).join(' · ')
  return <div className={`combat-flow-effect effect-kind-${effect.kind}${effect.damageType ? ` damage-type-${effect.damageType}` : ''}`}><span className="combat-flow-effect-icon"><IntentEffectIcon kind={effect.kind} /></span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>
}

function IntentEffectIcon({ kind }: { kind: CombatEffectPresentation['kind'] }) {
  if (kind === 'damage') return <Swords size={13} aria-hidden="true" />
  if (kind === 'barrier') return <Shield size={13} aria-hidden="true" />
  if (kind === 'heal') return <Heart size={13} aria-hidden="true" />
  if (kind === 'control') return <TimerReset size={13} aria-hidden="true" />
  return <Sparkles size={13} aria-hidden="true" />
}

function ActionTooltip({ action }: { action: CombatActionPresentation }) {
  return <TooltipContent title={action.name} description={action.description}><div className="tooltip-section"><small>TELEGRAPH</small><p>{formatTime(action.telegraphMs)}</p></div>{action.recoveryMs !== undefined && <div className="tooltip-section"><small>RECOVERY</small><p>{formatTime(action.recoveryMs)}</p></div>}<div className="tooltip-section"><small>EFFECTS</small>{action.effects.map((effect, index) => <p key={`${effect.label}-${index}`}>{effect.label}{effect.value ? `: ${effect.value}` : ''}{effect.detail ? ` · ${effect.detail}` : ''}{effect.timeLabel ? ` · ${effect.timeLabel}` : ''}</p>)}</div></TooltipContent>
}
