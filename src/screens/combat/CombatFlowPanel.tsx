import { ShieldAlert, WandSparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../game/content/monsters'
import { SPELLS } from '../../game/content/spells/spells'
import { type CombatEffectPresentation } from '../../game/presentation/combat'
import { getCombatFlowPresentation, type CombatFlowTimeline } from '../../game/presentation/combat/combatFlowPresentation'
import { classifyEnemyActionPatternIcon } from '../../game/presentation/combat/enemyPatternIconPresentation'
import { getCurrentEnemyActionStep, getEnemyAction, getEnemyActionPattern, getNextEnemyActionStep } from '../../game/systems/combat/actionRuntime'
import { getCurrentEnemyActionTiming, getPlayerBasicTiming } from '../../game/systems/combat/actionTiming'
import type { DungeonId, MonsterId } from '../../game/types'
import type { CombatLogEntry } from '../../game/systems/combat/combatTypes'
import { buildCombatActionPresentation, type CombatActionPresentation } from '../../game/presentation/combat/combatActionPresentation'
import { useGameStore } from '../../store/gameStore'
import { useCombatLogStore } from '../../game/ui/combatLogStore'
import { selectPlayerBasicDamage } from '../../store/selectors'
import { formatTime } from '../../game/utils'
import { GameTooltip, Progress } from '../../components/ui'
import { useShallow } from 'zustand/react/shallow'
import { EnemyPatternRail } from './EnemyPatternRail'
import { CombatActionProgress } from './CombatActionProgress'
import { EnemyActionTooltip, buildBasicAttackPresentation } from './EnemyActionTooltip'
import { EnemyPatternIcon } from './EnemyPatternIcon'

export function CombatFlowPanel({ selectedDungeonId }: { selectedDungeonId: DungeonId }) {
  const flowState = useGameStore(useShallow((state) => ({
    active: state.combat.active,
    dungeonId: state.combat.dungeonId,
    enemyId: state.combat.enemyId,
    enemyHp: state.combat.enemyHp,
    enemyMaxHp: state.combat.enemyMaxHp,
    enemyBarrier: state.combat.enemyBarrier,
    playerBarrier: state.combat.playerBarrier,
    threatCleared: state.combat.threatCleared,
    inBossFight: state.combat.inBossFight,
    encounterTimerMs: state.combat.encounterTimerMs,
    playerAttackTimerMs: state.combat.playerAttackTimerMs,
    playerAttackDurationMs: state.combat.playerAttackDurationMs,
    enemyActionTimerMs: state.combat.enemyActionTimerMs,
    enemyActionDurationMs: state.combat.enemyActionDurationMs,
    enemyNextActionIndex: state.combat.enemyNextActionIndex,
    enemyCurrentActionId: state.combat.enemyCurrentActionId,
    enemyCurrentStepId: state.combat.enemyCurrentStepId,
    enemyCurrentActionPatternId: state.combat.enemyCurrentActionPatternId,
    enemyActionPatternId: state.combat.enemyActionPatternId,
    playerHealth: state.player.health,
    playerMaxHealth: state.player.maxHealth,
    playerMana: state.player.mana,
    playerMaxMana: state.player.maxMana,
    playerStatuses: state.combat.playerStatuses,
    enemyStatuses: state.combat.enemyStatuses,
    equipment: state.equipment,
    artifactProgress: state.artifactProgress,
    debugFreezePlayerActions: state.debug.freezePlayerActions,
    debugDisablePlayerBasicAttack: state.debug.disablePlayerBasicAttack,
    debugFreezeEnemyActions: state.debug.freezeEnemyActions,
  })))
  const enemy = flowState.enemyId ? MONSTERS[flowState.enemyId] ?? null : null
  const dungeon = DUNGEONS[flowState.active ? flowState.dungeonId ?? selectedDungeonId : selectedDungeonId]
  const playerBasicDamage = useGameStore(selectPlayerBasicDamage)
  const timingState = useGameStore.getState()
  const playerTiming = useMemo(() => getPlayerBasicTiming(timingState), [timingState])
  const enemyTiming = useMemo(() => getCurrentEnemyActionTiming(timingState), [timingState])
  const pattern = useMemo(() => flowState.enemyId ? getEnemyActionPattern(timingState) : undefined, [flowState.enemyId, flowState.enemyActionPatternId, timingState])
  const nextStep = useMemo(() => flowState.enemyId ? getNextEnemyActionStep(timingState) : undefined, [flowState.enemyId, flowState.enemyNextActionIndex, flowState.enemyActionPatternId, timingState])
  const currentStep = useMemo(() => flowState.enemyId ? getCurrentEnemyActionStep(timingState) : undefined, [flowState.enemyId, flowState.enemyCurrentStepId, flowState.enemyCurrentActionPatternId, timingState])
  const currentAction = useMemo(() => flowState.enemyId ? getEnemyAction(timingState, flowState.enemyCurrentActionId) : undefined, [flowState.enemyId, flowState.enemyCurrentActionId, timingState])
  const latestEvent = useCombatLogStore((state) => {
    for (const entry of state.entries) {
      if (entry.sourceId === 'encounter-start' && entry.targetMonsterId === flowState.enemyId) break
      const relevant = getRelevantCombatEvent(entry, flowState.enemyId)
      if (relevant) return relevant
    }
    return null
  })
  const presentation = useMemo(() => getCombatFlowPresentation({
    active: flowState.active,
    dungeonId: flowState.dungeonId,
    selectedDungeonId,
    enemyId: flowState.enemyId,
    dungeon,
    enemy,
    threatCleared: flowState.threatCleared,
    inBossFight: flowState.inBossFight,
    encounterTimerMs: flowState.encounterTimerMs,
    playerAttackTimerMs: flowState.playerAttackTimerMs,
    playerAttackDurationMs: flowState.playerAttackDurationMs || playerTiming.baseWorkMs,
    enemyActionTimerMs: flowState.enemyActionTimerMs,
    enemyActionDurationMs: flowState.enemyActionDurationMs,
    enemyNextActionIndex: flowState.enemyNextActionIndex,
    enemyCurrentActionId: flowState.enemyCurrentActionId,
    enemyCurrentStepId: flowState.enemyCurrentStepId,
    enemyCurrentActionPatternId: flowState.enemyCurrentActionPatternId,
    enemyActionPatternId: flowState.enemyActionPatternId,
    playerBasicDamage,
    playerTiming,
    enemyTiming,
    pattern,
    nextStep,
    currentStep,
    currentAction,
  }), [currentAction, currentStep, dungeon, enemy, enemyTiming, flowState, nextStep, pattern, playerBasicDamage, playerTiming, selectedDungeonId])

  const recentEvent = useMemo(() => getRelevantCombatEvent(latestEvent, flowState.enemyId), [flowState.enemyId, latestEvent])
  const nextIntent = useMemo(() => getNextIntent(presentation, nextStep), [nextStep, presentation])
  const currentActor = presentation.enemyCurrentAction && presentation.enemyTimeline ? 'enemy' : 'player'
  const currentTimeline = currentActor === 'enemy' ? presentation.enemyTimeline : presentation.playerTimeline
  const currentLabel = currentActor === 'enemy' ? presentation.enemyCurrentAction?.label ?? 'Enemy Action' : 'Basic Attack'
  const currentIcon = currentActor === 'enemy' && presentation.enemyCurrentAction ? <EnemyPatternIcon kind={presentation.enemyCurrentAction.iconKind} /> : <WandSparkles size={19} aria-hidden="true" />
  const currentState = currentTimeline?.state === 'stunned' ? 'STUNNED' : currentTimeline?.state === 'paused' ? 'PAUSED' : currentTimeline?.state === 'disabled' ? 'DISABLED' : 'CASTING'
  const currentEta = currentTimeline?.etaMs === null || currentTimeline?.etaMs === undefined ? '—' : formatTime(currentTimeline.etaMs)
  const currentProgress = currentTimeline?.progress ?? 0

  if (presentation.mode === 'tower') return <section className="combat-flow-panel is-tower"><div className="combat-flow-kicker">AT THE TOWER</div><ShieldAlert size={28} aria-hidden="true" /><strong>Enter a Dungeon to begin Combat.</strong></section>
  if (presentation.mode === 'boss-ready') return <section className="combat-flow-panel is-boss-ready"><div className="combat-flow-kicker">BOSS READY</div><ShieldAlert size={28} aria-hidden="true" /><strong>{MONSTERS[presentation.dungeon.boss].name} awaits.</strong><p>The route is clear. Engage the Boss from the Run Bar when ready.</p></section>
  if (presentation.mode === 'encounter-delay') return <section className="combat-flow-panel is-encounter-delay"><div className="combat-flow-delay-label">NEXT ENCOUNTER</div><strong className="combat-flow-delay">{formatTime(presentation.encounterTimerMs)}</strong><Progress value={Math.max(0, Math.min(100, (1 - presentation.encounterTimerMs / Math.max(1, presentation.dungeon.encounterDelayMs)) * 100))} tone="time" label="Encounter progress" /><div className="combat-flow-delay-context"><span>Searching the {presentation.dungeon.name}...</span><span>THREAT {flowState.threatCleared} / {presentation.dungeon.threatRequired}</span>{presentation.dungeon.threatRequired <= flowState.threatCleared && <strong>BOSS APPROACHING</strong>}</div></section>

  return <section className="combat-flow-panel" style={{ '--enemy-accent': presentation.enemy?.color } as CSSProperties}>
    <header className="combat-flow-head"><div><span className="combat-flow-kicker">COMBAT STAGE</span><strong className="combat-flow-live-label">LIVE DUEL CONSOLE</strong></div><span className="combat-flow-live-dot">{flowState.active ? 'LIVE' : 'STANDBY'}</span></header>
    <div className={`combat-flow-stage is-actor-${currentActor}`}>
      <div className="combat-flow-lanes"><TimelineRow timeline={presentation.playerTimeline} /><span className="combat-flow-lane-axis" aria-hidden="true"><i /><i /></span><TimelineRow timeline={presentation.enemyTimeline} /></div>
      <div className={`combat-flow-action-core is-actor-${currentActor}${presentation.enemyCurrentAction?.special ? ' is-special' : ''}`}>
        <span className={`combat-flow-action-glyph combat-pattern-icon-${currentActor === 'enemy' && presentation.enemyCurrentAction ? presentation.enemyCurrentAction.iconKind : 'basic-attack'}`}>{currentIcon}</span>
        <span className="combat-subsection-label">{currentActor === 'enemy' ? 'ENEMY ACTION' : 'PLAYER ACTION'}</span>
        <strong>{currentLabel}</strong>
        <div className="combat-flow-action-meta"><span>{currentState}</span><b>{currentEta}</b></div>
        <div className="combat-flow-action-progress" style={{ '--current-action-progress': `${Math.max(0, Math.min(100, currentProgress))}%` } as CSSProperties}><i /></div>
      </div>
      {recentEvent && <CombatImpactLayer event={recentEvent} enemy={presentation.enemy} />}
    </div>
    <CombatEnemyIntent intent={nextIntent} current={Boolean(presentation.enemyCurrentAction)} etaMs={presentation.enemyTimeline?.etaMs ?? null} />
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

type CombatIntent = {
  label: string
  action: CombatActionPresentation | null
  basic: CombatEffectPresentation | null
  special: boolean
  iconKind: ReturnType<typeof classifyEnemyActionPatternIcon>
  basicDamage: number
  actionTimeMs: number
}

function getNextIntent(presentation: ReturnType<typeof getCombatFlowPresentation>, nextStep: ReturnType<typeof getNextEnemyActionStep>): CombatIntent | null {
  if (presentation.enemyCurrentAction) return { ...presentation.enemyCurrentAction, basicDamage: presentation.enemy?.basicAttackDamage ?? 0, actionTimeMs: presentation.enemyTimeline?.baseWorkMs ?? presentation.currentActionDurationMs }
  if (!presentation.enemy || !nextStep) return null
  if (nextStep.type === 'basic') return { label: 'Basic Attack', action: null, basic: buildBasicAttackPresentation(presentation.enemy.basicAttackDamage, presentation.enemy.basicAttackTimeMs).effects[0] ?? null, special: false, iconKind: 'basic-attack', basicDamage: presentation.enemy.basicAttackDamage, actionTimeMs: presentation.enemy.basicAttackTimeMs }
  const action = presentation.enemy.actions[nextStep.actionId]
  if (!action) return null
  return { label: action.name, action: buildCombatActionPresentation(action, { actor: 'enemy', kind: 'action', sourceMonsterId: presentation.enemy.id }, { monster: presentation.enemy }), basic: null, special: true, iconKind: classifyEnemyActionPatternIcon(action), basicDamage: presentation.enemy.basicAttackDamage, actionTimeMs: action.actionTimeMs }
}

function CombatEnemyIntent({ intent, current, etaMs }: { intent: CombatIntent | null; current: boolean; etaMs: number | null }) {
  if (!intent) return null
  const action = intent.action ?? (intent.basic ? buildBasicAttackPresentation(intent.basicDamage, intent.actionTimeMs) : null)
  const countdown = current && etaMs !== null ? formatTime(etaMs) : 'NEXT UP'
  return <GameTooltip block wide placement="bottom" accent={intent.special ? 'warning' : 'neutral'} content={action ? <EnemyActionTooltip action={action} /> : undefined}><div className={`combat-enemy-intent${intent.special ? ' is-special' : ''}`}><div className="combat-enemy-intent-icon"><EnemyPatternIcon kind={intent.iconKind} /></div><div className="combat-enemy-intent-copy"><span className="combat-subsection-label">{current ? 'ENEMY INTENT' : 'NEXT ENEMY INTENT'}</span><strong>{intent.label}</strong><small>{intent.special ? 'Canonical special action' : 'Basic attack'} · {countdown}</small></div><span className="combat-enemy-intent-countdown">{countdown}</span></div></GameTooltip>
}

function getRelevantCombatEvent(event: CombatLogEntry | null, enemyId: MonsterId | null) {
  if (!event || !enemyId || event.category === 'system' || event.category === 'loot' || event.category === 'death') return null
  const belongsToEncounter = event.source.kind === 'enemy' ? event.source.monsterId === enemyId : event.target === 'enemy' && event.targetMonsterId === enemyId
  return belongsToEncounter ? event : null
}

function CombatImpactLayer({ event, enemy }: { event: CombatLogEntry; enemy: ReturnType<typeof getCombatFlowPresentation>['enemy'] }) {
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
