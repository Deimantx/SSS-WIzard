import { Heart, Shield, ShieldAlert, Sparkles, Swords, TimerReset } from 'lucide-react'
import { useMemo } from 'react'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../game/content/monsters'
import { type CombatEffectPresentation } from '../../game/presentation/combat'
import { getCombatFlowPresentation, type CombatFlowTimeline } from '../../game/presentation/combat/combatFlowPresentation'
import { getCurrentEnemyActionStep, getEnemyAction, getEnemyActionPattern, getNextEnemyActionStep } from '../../game/systems/combat/actionRuntime'
import { getCurrentEnemyActionTiming, getPlayerBasicTiming } from '../../game/systems/combat/actionTiming'
import type { DungeonId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { selectPlayerBasicDamage } from '../../store/selectors'
import { formatTime } from '../../game/utils'
import { GameTooltip, Progress } from '../../components/ui'
import { EnemyPatternRail } from './EnemyPatternRail'
import { CombatActionProgress } from './CombatActionProgress'
import { EnemyActionTooltip, buildBasicAttackPresentation } from './EnemyActionTooltip'
import { EnemyPatternIcon } from './EnemyPatternIcon'

export function CombatFlowPanel({ selectedDungeonId }: { selectedDungeonId: DungeonId }) {
  const combat = useGameStore((state) => state.combat)
  const enemy = useGameStore((state) => state.combat.enemyId ? MONSTERS[state.combat.enemyId] ?? null : null)
  const dungeon = DUNGEONS[combat.active ? combat.dungeonId ?? selectedDungeonId : selectedDungeonId]
  const playerBasicDamage = useGameStore(selectPlayerBasicDamage)
  // Timing selectors return structured values, so compute them from the
  // stable store snapshot rather than subscribing with a fresh object on
  // every getSnapshot call.
  const timingState = useGameStore()
  const playerTiming = useMemo(() => getPlayerBasicTiming(timingState), [timingState])
  const enemyTiming = useMemo(() => getCurrentEnemyActionTiming(timingState), [timingState])
  const pattern = useGameStore((state) => state.combat.enemyId ? getEnemyActionPattern(state) : undefined)
  const nextStep = useGameStore((state) => state.combat.enemyId ? getNextEnemyActionStep(state) : undefined)
  const currentStep = useGameStore((state) => state.combat.enemyId ? getCurrentEnemyActionStep(state) : undefined)
  const currentAction = useGameStore((state) => state.combat.enemyId ? getEnemyAction(state, state.combat.enemyCurrentActionId) : undefined)
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
    playerAttackDurationMs: combat.playerAttackDurationMs || playerTiming.baseWorkMs,
    enemyActionTimerMs: combat.enemyActionTimerMs,
    enemyActionDurationMs: combat.enemyActionDurationMs,
    enemyNextActionIndex: combat.enemyNextActionIndex,
    enemyCurrentActionId: combat.enemyCurrentActionId,
    enemyCurrentStepId: combat.enemyCurrentStepId,
    enemyCurrentActionPatternId: combat.enemyCurrentActionPatternId,
    enemyActionPatternId: combat.enemyActionPatternId,
    playerBasicDamage,
    playerTiming,
    enemyTiming,
    pattern,
    nextStep,
    currentStep,
    currentAction,
  }), [combat, currentAction, currentStep, dungeon, enemy, enemyTiming, nextStep, pattern, playerBasicDamage, playerTiming, selectedDungeonId])

  if (presentation.mode === 'tower') return <section className="combat-flow-panel is-tower"><div className="combat-flow-kicker">AT THE TOWER</div><ShieldAlert size={28} aria-hidden="true" /><strong>Enter a Dungeon to begin Combat.</strong></section>
  if (presentation.mode === 'boss-ready') return <section className="combat-flow-panel is-boss-ready"><div className="combat-flow-kicker">BOSS READY</div><ShieldAlert size={28} aria-hidden="true" /><strong>{MONSTERS[presentation.dungeon.boss].name} awaits.</strong><p>The route is clear. Engage the Boss from the Run Bar when ready.</p></section>
  if (presentation.mode === 'encounter-delay') return <section className="combat-flow-panel is-encounter-delay"><div className="combat-flow-delay-label">NEXT ENCOUNTER</div><strong className="combat-flow-delay">{formatTime(presentation.encounterTimerMs)}</strong><Progress value={Math.max(0, Math.min(100, (1 - presentation.encounterTimerMs / Math.max(1, presentation.dungeon.encounterDelayMs)) * 100))} tone="time" label="Encounter progress" /><div className="combat-flow-delay-context"><span>Searching the {presentation.dungeon.name}...</span><span>THREAT {combat.threatCleared} / {presentation.dungeon.threatRequired}</span>{presentation.dungeon.threatRequired <= combat.threatCleared && <strong>BOSS APPROACHING</strong>}</div></section>

  return <section className="combat-flow-panel" style={{ '--enemy-accent': presentation.enemy?.color } as React.CSSProperties}>
    <header className="combat-flow-head"><span className="combat-flow-kicker">COMBAT FLOW</span></header>
    <div className="combat-flow-timelines"><TimelineRow timeline={presentation.playerTimeline} /><TimelineRow timeline={presentation.enemyTimeline} /></div>
    {presentation.enemyCurrentAction && <CurrentEnemyAction currentAction={presentation.enemyCurrentAction} basicDamage={presentation.enemy?.basicAttackDamage ?? 0} actionTimeMs={presentation.enemyTimeline?.baseWorkMs ?? presentation.currentActionDurationMs} progress={presentation.enemyTimeline?.progress ?? 0} />}
    <div className="combat-flow-pattern"><div className="combat-subsection-label">ENEMY PATTERN</div><EnemyPatternRail pattern={presentation.pattern} enemy={presentation.enemy} currentStepIndex={presentation.currentStepIndex} currentStepId={presentation.currentStepId} currentActionId={presentation.currentActionId} currentPatternOriginId={presentation.currentPatternOriginId} currentProgress={presentation.enemyTimeline?.progress} currentActionDurationMs={presentation.enemyTimeline?.baseWorkMs ?? presentation.currentActionDurationMs} /></div>
  </section>
}

function TimelineRow({ timeline }: { timeline: CombatFlowTimeline | null }) {
  if (!timeline) return null
  const label = timeline.actor === 'player' ? 'PLAYER' : 'ENEMY'
  const progress = timeline.progress ?? 0
  const stateClass = timeline.state === 'stunned' ? ' is-stunned' : timeline.state === 'paused' ? ' is-paused' : timeline.state === 'disabled' ? ' is-disabled' : ''
  const blockLabel = timeline.state === 'stunned' ? 'STUNNED · PAUSED' : timeline.state === 'paused' ? 'DEBUG PAUSED' : timeline.state === 'disabled' ? 'DISABLED' : null
  return <div className={`combat-flow-timeline combat-flow-timeline-${timeline.actor}${stateClass}${progress >= 90 ? ' is-near-complete' : ''}`}><div className="combat-flow-timeline-head"><span className="combat-subsection-label">{label}</span><strong>{timeline.label}</strong><span className="combat-flow-timeline-time ui-time">{timeline.state === 'disabled' ? 'DISABLED' : timeline.etaMs === null ? 'PAUSED' : formatTime(timeline.etaMs)}</span></div><CombatActionProgress value={progress} />{blockLabel && <div className="combat-flow-paused">{blockLabel}</div>}</div>
}

function CombatEffectRow({ effect }: { effect: CombatEffectPresentation }) {
  const value = effect.kind === 'damage' ? `${effect.value ?? ''} ${effect.label}`.trim() : effect.kind === 'barrier' ? `+${effect.value ?? 0} BARRIER` : effect.kind === 'heal' ? `HEAL ${effect.value ?? 0}` : effect.kind === 'status' ? effect.label.replace(/^Applies /, '').toUpperCase() : effect.kind === 'control' && effect.label === 'Basic Attack' ? `BASIC ATTACK DELAY ${effect.value ?? ''}`.trim() : [effect.label, effect.value].filter(Boolean).join(' ')
  const detail = [effect.detail, effect.timeLabel].filter(Boolean).join(' · ')
  return <div className={`combat-flow-effect effect-kind-${effect.kind}${effect.damageType ? ` damage-type-${effect.damageType}` : ''}`}><span className="combat-flow-effect-icon"><IntentEffectIcon kind={effect.kind} /></span><strong>{value}</strong>{effect.scalingLabel && <small>Scaling: {effect.scalingLabel}</small>}{detail && <small>{detail}</small>}</div>
}

function IntentEffectIcon({ kind }: { kind: CombatEffectPresentation['kind'] }) {
  if (kind === 'damage') return <Swords size={13} aria-hidden="true" />
  if (kind === 'barrier') return <Shield size={13} aria-hidden="true" />
  if (kind === 'heal') return <Heart size={13} aria-hidden="true" />
  if (kind === 'control') return <TimerReset size={13} aria-hidden="true" />
  return <Sparkles size={13} aria-hidden="true" />
}

function CurrentEnemyAction({ currentAction, basicDamage, actionTimeMs, progress }: { currentAction: NonNullable<ReturnType<typeof getCombatFlowPresentation>['enemyCurrentAction']>; basicDamage: number; actionTimeMs: number; progress: number }) {
  const action = currentAction.action ?? (currentAction.basic ? buildBasicAttackPresentation(basicDamage, actionTimeMs) : null)
  const style = { '--current-action-progress': `${Math.max(0, Math.min(100, progress))}%` } as React.CSSProperties
  return <GameTooltip block wide placement="bottom" accent={currentAction.special ? 'warning' : 'neutral'} content={action ? <EnemyActionTooltip action={action} /> : undefined}><div className={`combat-flow-current-action${currentAction.special ? ' is-special' : ''} combat-current-action-${currentAction.iconKind}`}><div className="combat-flow-subhead"><span style={style} className={`combat-flow-current-action-icon combat-pattern-icon-${currentAction.iconKind}`}><EnemyPatternIcon kind={currentAction.iconKind} /></span><span className="combat-subsection-label">CURRENT ACTION</span><strong>{currentAction.label}</strong></div>{currentAction.action ? <div className="combat-flow-effects">{currentAction.action.effects.map((effect, index) => <CombatEffectRow key={`${effect.label}-${index}`} effect={effect} />)}</div> : currentAction.basic ? <div className="combat-flow-effects"><CombatEffectRow effect={currentAction.basic} /></div> : null}</div></GameTooltip>
}
