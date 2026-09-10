import { ShieldAlert, WandSparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../game/content/monsters'
import { SPELLS } from '../../game/content/spells/spells'
import { type CombatEffectPresentation } from '../../game/presentation/combat'
import { getCombatFlowPresentation } from '../../game/presentation/combat/combatFlowPresentation'
import { classifyEnemyActionPatternIcon } from '../../game/presentation/combat/enemyPatternIconPresentation'
import { getCurrentEnemyActionStep, getEnemyAction, getEnemyActionPattern, getNextEnemyActionStep } from '../../game/systems/combat/actionRuntime'
import type { TimedActionState } from '../../game/systems/combat/actionTiming'
import type { ActionStep, CombatLogEntry } from '../../game/systems/combat/combatTypes'
import type { DungeonId, MonsterId } from '../../game/types'
import { buildCombatActionPresentation, type CombatActionPresentation } from '../../game/presentation/combat/combatActionPresentation'
import { useGameStore } from '../../store/gameStore'
import { useCombatLogStore } from '../../game/ui/combatLogStore'
import { formatTime } from '../../game/utils'
import { GameTooltip, Progress } from '../../components/ui'
import { useShallow } from 'zustand/react/shallow'
import { EnemyPatternRail } from './EnemyPatternRail'
import { CombatActionProgress } from './CombatActionProgress'
import { EnemyActionTooltip, buildBasicAttackPresentation } from './EnemyActionTooltip'
import { EnemyPatternIcon } from './EnemyPatternIcon'
import { useEnemyCombatActionTiming, usePlayerCombatActionTiming } from '../../components/combat/combatLiveTiming'

const STATIC_PRESENTATION_TIMING = getTimedActionState(1_200, 0, 1)

/**
 * The panel owns only combat-flow identity. Timer fields live in small child
 * subscriptions below so the full panel does not render on every simulation
 * tick.
 */
export function CombatFlowPanel({ selectedDungeonId }: { selectedDungeonId: DungeonId }) {
  const flowState = useGameStore(useShallow((state) => ({
    active: state.combat.active,
    dungeonId: state.combat.dungeonId,
    enemyId: state.combat.enemyId,
    threatCleared: state.combat.threatCleared,
    inBossFight: state.combat.inBossFight,
    enemyNextActionIndex: state.combat.enemyNextActionIndex,
    enemyCurrentActionId: state.combat.enemyCurrentActionId,
    enemyCurrentStepId: state.combat.enemyCurrentStepId,
    enemyCurrentActionPatternId: state.combat.enemyCurrentActionPatternId,
    enemyActionPatternId: state.combat.enemyActionPatternId,
  })))
  const flowModel = useMemo(() => {
    const runtimeState = useGameStore.getState()
    const enemy = flowState.enemyId ? MONSTERS[flowState.enemyId] ?? null : null
    const dungeon = DUNGEONS[flowState.active ? flowState.dungeonId ?? selectedDungeonId : selectedDungeonId]
    const pattern = flowState.enemyId ? getEnemyActionPattern(runtimeState) : undefined
    const nextStep = flowState.enemyId ? getNextEnemyActionStep(runtimeState) : undefined
    const currentStep = flowState.enemyId ? getCurrentEnemyActionStep(runtimeState) : undefined
    const currentAction = flowState.enemyId ? getEnemyAction(runtimeState, flowState.enemyCurrentActionId) : undefined
    const enemyHasCommittedAction = Boolean(currentStep || currentAction || flowState.enemyCurrentStepId)
    const presentation = getCombatFlowPresentation({
      active: flowState.active,
      dungeonId: flowState.dungeonId,
      selectedDungeonId,
      enemyId: flowState.enemyId,
      dungeon,
      enemy,
      threatCleared: flowState.threatCleared,
      inBossFight: flowState.inBossFight,
      encounterTimerMs: 0,
      playerAttackTimerMs: 0,
      playerAttackDurationMs: STATIC_PRESENTATION_TIMING.baseWorkMs,
      enemyActionTimerMs: 0,
      enemyActionDurationMs: currentAction?.actionTimeMs ?? enemy?.basicAttackTimeMs ?? STATIC_PRESENTATION_TIMING.baseWorkMs,
      enemyNextActionIndex: flowState.enemyNextActionIndex,
      enemyCurrentActionId: flowState.enemyCurrentActionId,
      enemyCurrentStepId: flowState.enemyCurrentStepId,
      enemyCurrentActionPatternId: flowState.enemyCurrentActionPatternId,
      enemyActionPatternId: flowState.enemyActionPatternId,
      playerBasicDamage: 0,
      playerTiming: STATIC_PRESENTATION_TIMING,
      enemyTiming: enemyHasCommittedAction ? STATIC_PRESENTATION_TIMING : null,
      pattern,
      nextStep,
      currentStep,
      currentAction,
    })
    return { dungeon, enemy, nextStep, presentation, nextIntent: getNextIntent(presentation, nextStep) }
  }, [flowState, selectedDungeonId])

  const { dungeon, enemy, nextIntent, presentation } = flowModel
  const currentActor = presentation.enemyCurrentAction ? 'enemy' : 'player'
  const currentLabel = currentActor === 'enemy' ? presentation.enemyCurrentAction?.label ?? 'Enemy Action' : 'Basic Attack'
  const currentIcon = currentActor === 'enemy' && presentation.enemyCurrentAction
    ? <EnemyPatternIcon kind={presentation.enemyCurrentAction.iconKind} />
    : <WandSparkles size={19} aria-hidden="true" />

  if (presentation.mode === 'tower') return <section className="combat-flow-panel is-tower"><div className="combat-flow-kicker">AT THE TOWER</div><ShieldAlert size={28} aria-hidden="true" /><strong>Enter a Dungeon to begin Combat.</strong></section>
  if (presentation.mode === 'boss-ready') return <section className="combat-flow-panel is-boss-ready"><div className="combat-flow-kicker">BOSS READY</div><ShieldAlert size={28} aria-hidden="true" /><strong>{MONSTERS[dungeon.boss].name} awaits.</strong><p>The route is clear. Engage the Boss from the Run Bar when ready.</p></section>
  if (presentation.mode === 'encounter-delay') return <CombatEncounterDelay dungeon={dungeon} threatCleared={flowState.threatCleared} />

  return <section className="combat-flow-panel" style={{ '--enemy-accent': enemy?.color } as CSSProperties}>
    <header className="combat-flow-head"><div><span className="combat-flow-kicker">COMBAT STAGE</span><strong className="combat-flow-live-label">LIVE DUEL CONSOLE</strong></div><span className="combat-flow-live-dot">{flowState.active ? 'LIVE' : 'STANDBY'}</span></header>
    <div className={`combat-flow-stage is-actor-${currentActor}`}>
      <div className="combat-flow-lanes"><CombatPlayerTimelineRow /><span className="combat-flow-lane-axis" aria-hidden="true"><i /><i /></span>{presentation.enemyTimeline && <CombatEnemyTimelineRow label={presentation.enemyTimeline.label} />}</div>
      {currentActor === 'enemy'
        ? <CombatEnemyActionCore label={currentLabel} icon={currentIcon} special={Boolean(presentation.enemyCurrentAction?.special)} />
        : <CombatPlayerActionCore label={currentLabel} icon={currentIcon} />}
      <CombatImpactLayer enemyId={flowState.enemyId} />
    </div>
    <CombatEnemyIntent intent={nextIntent} current={Boolean(presentation.enemyCurrentAction)} />
    <div className="combat-flow-pattern"><div className="combat-subsection-label">ENEMY PATTERN</div><EnemyPatternRail pattern={presentation.pattern} enemy={enemy} currentStepIndex={presentation.currentStepIndex} currentStepId={presentation.currentStepId} currentActionId={presentation.currentActionId} currentPatternOriginId={presentation.currentPatternOriginId} /></div>
  </section>
}

function getActionState(timing: TimedActionState) {
  if (timing.blockReason === 'status-control') return 'stunned'
  if (timing.blockReason === 'debug-freeze') return 'paused'
  if (timing.blockReason === 'disabled') return 'disabled'
  return 'acting'
}

function actionStateLabel(timing: TimedActionState) {
  if (timing.blockReason === 'status-control') return 'STUNNED'
  if (timing.blockReason === 'debug-freeze') return 'PAUSED'
  if (timing.blockReason === 'disabled') return 'DISABLED'
  return 'CASTING'
}

function CombatPlayerTimelineRow() {
  return <TimelineRow actor="player" label="Basic Attack" timing={usePlayerCombatActionTiming()} />
}

function CombatEnemyTimelineRow({ label }: { label: string }) {
  const timing = useEnemyCombatActionTiming()
  return timing ? <TimelineRow actor="enemy" label={label} timing={timing} /> : null
}

function TimelineRow({ actor, label, timing }: { actor: 'player' | 'enemy'; label: string; timing: TimedActionState }) {
  const state = getActionState(timing)
  const progress = Math.max(0, Math.min(100, timing.progress))
  const blockLabel = state === 'stunned' ? 'STUNNED · PAUSED' : state === 'paused' ? 'DEBUG PAUSED' : state === 'disabled' ? 'DISABLED' : null
  return <div className={`combat-flow-timeline combat-flow-timeline-${actor} is-${state}${progress >= 90 ? ' is-near-complete' : ''}`}><div className="combat-flow-timeline-head"><span className="combat-subsection-label">{actor === 'player' ? 'PLAYER' : 'ENEMY'}</span><strong>{label}</strong><span className="combat-flow-timeline-time ui-time">{timing.blockReason === 'disabled' ? 'DISABLED' : timing.etaMs === null ? 'PAUSED' : formatTime(timing.etaMs)}</span></div><CombatActionProgress value={progress} />{blockLabel && <div className="combat-flow-paused">{blockLabel}</div>}</div>
}

function CombatPlayerActionCore({ label, icon }: { label: string; icon: ReactNode }) {
  return <ActionCore actor="player" label={label} icon={icon} timing={usePlayerCombatActionTiming()} />
}

function CombatEnemyActionCore({ label, icon, special }: { label: string; icon: ReactNode; special: boolean }) {
  const timing = useEnemyCombatActionTiming()
  return timing ? <ActionCore actor="enemy" label={label} icon={icon} timing={timing} special={special} /> : null
}

function ActionCore({ actor, label, icon, timing, special = false }: { actor: 'player' | 'enemy'; label: string; icon: ReactNode; timing: TimedActionState; special?: boolean }) {
  const progress = Math.max(0, Math.min(100, timing.progress))
  return <div className={`combat-flow-action-core is-actor-${actor}${special ? ' is-special' : ''}`}>
    <span className={`combat-flow-action-glyph combat-pattern-icon-${actor === 'enemy' && special ? 'action' : 'basic-attack'}`}>{icon}</span>
    <span className="combat-subsection-label">{actor === 'enemy' ? 'ENEMY ACTION' : 'PLAYER ACTION'}</span>
    <strong>{label}</strong>
    <div className="combat-flow-action-meta"><span>{actionStateLabel(timing)}</span><b>{timing.etaMs === null ? '—' : formatTime(timing.etaMs)}</b></div>
    <div className="combat-flow-action-progress"><i style={{ width: `${progress}%` }} /></div>
  </div>
}

function CombatEncounterDelay({ dungeon, threatCleared }: { dungeon: ReturnType<typeof getCombatFlowPresentation>['dungeon']; threatCleared: number }) {
  const encounterTimerMs = useGameStore((state) => state.combat.encounterTimerMs)
  const progress = Math.max(0, Math.min(100, (1 - encounterTimerMs / Math.max(1, dungeon.encounterDelayMs)) * 100))
  return <section className="combat-flow-panel is-encounter-delay"><div className="combat-flow-delay-label">NEXT ENCOUNTER</div><strong className="combat-flow-delay">{formatTime(encounterTimerMs)}</strong><Progress value={progress} tone="time" label="Encounter progress" /><div className="combat-flow-delay-context"><span>Searching the {dungeon.name}...</span><span>THREAT {threatCleared} / {dungeon.threatRequired}</span>{dungeon.threatRequired <= threatCleared && <strong>BOSS APPROACHING</strong>}</div></section>
}

type CombatIntent = {
  label: string
  action: CombatActionPresentation | null
  basic: CombatEffectPresentation | null
  special: boolean
  iconKind: ReturnType<typeof classifyEnemyActionPatternIcon>
  basicDamage: number
  actionTimeMs: number
}

function getNextIntent(presentation: ReturnType<typeof getCombatFlowPresentation>, nextStep: ActionStep | undefined): CombatIntent | null {
  if (presentation.enemyCurrentAction) {
    const actionTimeMs = presentation.enemyCurrentAction.action?.actionTimeMs ?? (presentation.enemy ? presentation.enemy.basicAttackTimeMs : presentation.currentActionDurationMs)
    return { ...presentation.enemyCurrentAction, basicDamage: presentation.enemy?.basicAttackDamage ?? 0, actionTimeMs }
  }
  if (!presentation.enemy || !nextStep) return null
  if (nextStep.type === 'basic') return { label: 'Basic Attack', action: null, basic: buildBasicAttackPresentation(presentation.enemy.basicAttackDamage, presentation.enemy.basicAttackTimeMs).effects[0] ?? null, special: false, iconKind: 'basic-attack', basicDamage: presentation.enemy.basicAttackDamage, actionTimeMs: presentation.enemy.basicAttackTimeMs }
  const action = presentation.enemy.actions[nextStep.actionId]
  if (!action) return null
  return { label: action.name, action: buildCombatActionPresentation(action, { actor: 'enemy', kind: 'action', sourceMonsterId: presentation.enemy.id }, { monster: presentation.enemy }), basic: null, special: true, iconKind: classifyEnemyActionPatternIcon(action), basicDamage: presentation.enemy.basicAttackDamage, actionTimeMs: action.actionTimeMs }
}

function CombatEnemyIntent({ intent, current }: { intent: CombatIntent | null; current: boolean }) {
  const action = useMemo(() => intent?.action ?? (intent?.basic ? buildBasicAttackPresentation(intent.basicDamage, intent.actionTimeMs) : null), [intent])
  if (!intent) return null
  return <GameTooltip block wide placement="bottom" accent={intent.special ? 'warning' : 'neutral'} content={action ? <EnemyActionTooltip action={action} /> : undefined}><div className={`combat-enemy-intent${intent.special ? ' is-special' : ''}`}><div className="combat-enemy-intent-icon"><EnemyPatternIcon kind={intent.iconKind} /></div><div className="combat-enemy-intent-copy"><span className="combat-subsection-label">{current ? 'ENEMY INTENT' : 'NEXT ENEMY INTENT'}</span><strong>{intent.label}</strong><small>{intent.special ? 'Canonical special action' : 'Basic attack'} · <EnemyIntentCountdown current={current} /></small></div><span className="combat-enemy-intent-countdown"><EnemyIntentCountdown current={current} /></span></div></GameTooltip>
}

function EnemyIntentCountdown({ current }: { current: boolean }) {
  const timing = useEnemyCombatActionTiming()
  if (!current) return <>NEXT UP</>
  if (!timing) return <>NEXT UP</>
  return <>{timing.etaMs === null ? 'PAUSED' : formatTime(timing.etaMs)}</>
}

function getRelevantCombatEvent(event: CombatLogEntry | null, enemyId: MonsterId | null) {
  if (!event || !enemyId || event.category === 'system' || event.category === 'loot' || event.category === 'death') return null
  const belongsToEncounter = event.source.kind === 'enemy' ? event.source.monsterId === enemyId : event.target === 'enemy' && event.targetMonsterId === enemyId
  return belongsToEncounter ? event : null
}

function CombatImpactLayer({ enemyId }: { enemyId: MonsterId | null }) {
  const latestEvent = useCombatLogStore((state) => {
    for (const entry of state.entries) {
      if (entry.sourceId === 'encounter-start' && entry.targetMonsterId === enemyId) break
      const relevant = getRelevantCombatEvent(entry, enemyId)
      if (relevant) return relevant
    }
    return null
  })
  const enemy = enemyId ? MONSTERS[enemyId] ?? null : null
  if (!latestEvent) return null
  return <CombatImpactEvent event={latestEvent} enemy={enemy} />
}

function CombatImpactEvent({ event, enemy }: { event: CombatLogEntry; enemy: ReturnType<typeof getCombatFlowPresentation>['enemy'] }) {
  const initialSequence = useRef(event.sequence)
  const [isNew, setIsNew] = useState(false)
  useEffect(() => {
    if (event.sequence === initialSequence.current) return
    initialSequence.current = event.sequence
    setIsNew(true)
    const timer = window.setTimeout(() => setIsNew(false), 240)
    return () => window.clearTimeout(timer)
  }, [event.sequence])
  const actor = event.source.kind === 'enemy' ? 'enemy' : event.source.kind === 'player' ? 'player' : null
  if (!actor) return null
  const periodic = event.sourceKind === 'status' || event.originTags?.includes('dot') || event.originTags?.includes('hot')
  const spellName = event.spellId && SPELLS[event.spellId] ? SPELLS[event.spellId].name : null
  const actionName = event.actionId && enemy?.actions[event.actionId] ? enemy.actions[event.actionId].name : null
  const label = spellName ?? actionName ?? (event.category === 'basic-attack' ? 'Basic Attack' : event.category === 'enemy-action' ? 'Enemy Action' : actor === 'player' ? 'Player Effect' : 'Enemy Effect')
  const healthDamage = event.healthDamage ?? 0
  const barrierAbsorbed = event.barrierAbsorbed ?? 0
  const amount = event.amount ?? event.effectiveAmount ?? 0
  const result = healthDamage > 0 ? `−${Math.round(healthDamage).toLocaleString()} HP` : barrierAbsorbed > 0 ? `${Math.round(barrierAbsorbed).toLocaleString()} BARRIER ABSORBED` : event.category === 'heal' ? `+${Math.round(event.effectiveAmount ?? amount).toLocaleString()} HP` : event.category === 'barrier' ? `+${Math.round(event.barrierGranted ?? amount).toLocaleString()} BARRIER` : event.category === 'status' ? 'STATUS APPLIED' : event.category === 'spell' ? 'SPELL RESOLVED' : 'RESOLVED'
  const resultKind = healthDamage > 0 || barrierAbsorbed > 0 ? 'damage' : event.category === 'heal' ? 'heal' : event.category === 'barrier' ? 'barrier' : event.category === 'status' ? 'status' : 'neutral'
  const actorLabel = event.category === 'heal' || event.category === 'barrier' || event.category === 'status' ? `${actor === 'player' ? 'PLAYER' : 'ENEMY'} EFFECT` : actor === 'player' ? 'PLAYER HIT' : 'ENEMY HIT'
  return <div className={`combat-impact-layer is-${actor}${periodic ? ' is-periodic' : ''}${isNew ? ' is-new' : ''}`} aria-hidden="true"><span className="combat-impact-energy" /><span className="combat-impact-flash" /><div className={`combat-impact-result is-${resultKind}`}><span>{actorLabel}</span><strong>{label}</strong><small>{result}</small></div></div>
}
