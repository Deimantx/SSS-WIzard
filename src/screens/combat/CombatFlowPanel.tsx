import { Crown, Heart, Shield, ShieldAlert, Sparkles, Swords, TimerReset } from 'lucide-react'
import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../game/content/monsters'
import { getCombatEncounterMode, getCombatLocationByDungeonId } from '../../game/content/world-navigation'
import { type CombatEffectPresentation } from '../../game/presentation/combat'
import { getCombatFlowPresentation } from '../../game/presentation/combat/combatFlowPresentation'
import { getCurrentEnemyActionStep, getEnemyAction, getEnemyActionPattern } from '../../game/systems/combat/actionRuntime'
import { getCurrentEnemyActionTiming } from '../../game/systems/combat/actionTiming'
import type { DungeonId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { formatNumber, formatTime } from '../../game/utils'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { EnemyPatternRail } from './EnemyPatternRail'
import { CombatActionProgress, CombatTimelineReadout, useCombatVisualTimeline } from './CombatActionProgress'
import { EnemyActionTooltip, buildBasicAttackPresentation } from './EnemyActionTooltip'
import { EnemyPatternIcon } from './EnemyPatternIcon'
import { CombatGuardianIndicator } from './CombatGuardianIndicator'
import { getCombatVisualRate } from './performance/combatTimeline'

export function CombatFlowPanel({ selectedDungeonId }: { selectedDungeonId: DungeonId }) {
  const combat = useGameStore(useShallow((state) => ({
    active: state.combat.active,
    dungeonId: state.combat.dungeonId,
    enemyId: state.combat.enemyId,
    threatCleared: state.combat.threatCleared,
    dungeonSequenceIndex: state.combat.dungeonSequenceIndex,
    inBossFight: state.combat.inBossFight,
    enemyInstanceKey: state.combat.enemyInstanceKey,
    enemyNextActionIndex: state.combat.enemyNextActionIndex,
    enemyCurrentActionId: state.combat.enemyCurrentActionId,
    enemyCurrentStepId: state.combat.enemyCurrentStepId,
    enemyCurrentActionPatternId: state.combat.enemyCurrentActionPatternId,
    enemyActionPatternId: state.combat.enemyActionPatternId,
    enemyActionDurationMs: state.combat.enemyActionDurationMs,
    worldTier: state.worldTier.current,
  })))
  const enemy = useGameStore((state) => state.combat.enemyId ? MONSTERS[state.combat.enemyId] ?? null : null)
  const dungeon = DUNGEONS[combat.active ? combat.dungeonId ?? selectedDungeonId : selectedDungeonId]
  const sequence = getCombatEncounterMode(getCombatLocationByDungeonId(dungeon.id)) === 'sequence' && dungeon.encounterSequence ? dungeon.encounterSequence : null
  const pattern = useGameStore((state) => state.combat.enemyId ? getEnemyActionPattern(state) : undefined)
  const currentStep = useGameStore((state) => state.combat.enemyId ? getCurrentEnemyActionStep(state) : undefined)
  const currentActionDefinition = useGameStore((state) => state.combat.enemyId ? getEnemyAction(state, state.combat.enemyCurrentActionId) : undefined)
  const structuralTiming = useMemo(() => {
    if (!enemy || !combat.enemyCurrentStepId) return null
    const baseWorkMs = combat.enemyActionDurationMs || enemy.basicAttackTimeMs
    return { baseWorkMs, remainingWorkMs: baseWorkMs, progress: 0, rate: 1, etaMs: baseWorkMs, blocked: false, blockReason: null }
  }, [combat.enemyActionDurationMs, combat.enemyCurrentStepId, enemy])
  const presentation = useMemo(() => getCombatFlowPresentation({
    active: combat.active,
    dungeonId: combat.dungeonId,
    selectedDungeonId,
    enemyId: combat.enemyId,
    dungeon,
    enemy,
    threatCleared: combat.threatCleared,
    worldTier: combat.worldTier,
    inBossFight: combat.inBossFight,
    encounterTimerMs: 0,
    enemyActionTimerMs: structuralTiming?.remainingWorkMs ?? 0,
    enemyActionDurationMs: structuralTiming?.baseWorkMs ?? 0,
    enemyNextActionIndex: combat.enemyNextActionIndex,
    enemyCurrentActionId: combat.enemyCurrentActionId,
    enemyCurrentStepId: combat.enemyCurrentStepId,
    enemyCurrentActionPatternId: combat.enemyCurrentActionPatternId,
    enemyActionPatternId: combat.enemyActionPatternId,
    playerSpellCast: null,
    enemyTiming: structuralTiming,
    pattern,
    currentStep,
    currentAction: currentActionDefinition,
  }), [combat, currentActionDefinition, currentStep, dungeon, enemy, pattern, selectedDungeonId, structuralTiming])

  if (presentation.mode === 'tower') return <section className="combat-flow-panel is-tower"><div className="combat-flow-state-kicker"><span className="combat-flow-kicker">AT THE TOWER</span><span className="combat-flow-state-mark">STANDBY</span></div><div className="combat-flow-state-sigil"><ShieldAlert size={26} aria-hidden="true" /></div><strong>NO ACTIVE HUNT</strong><p>Enter a Location from World Navigation to begin Combat.</p></section>
  if (presentation.mode === 'boss-ready') return <section className="combat-flow-panel is-boss-ready"><div className="combat-flow-state-kicker"><span className="combat-flow-kicker">BOSS READY</span><span className="combat-flow-state-mark">LOCATION CLEAR</span></div><div className="combat-flow-state-sigil"><Crown size={26} aria-hidden="true" /></div><strong>{MONSTERS[presentation.dungeon.boss].name}</strong><p>Boss ready. Engage it from the Zone Boss section in World Navigation.</p><span className="combat-flow-state-action">USE ZONE BOSS CONTROLS</span></section>
  if (presentation.mode === 'encounter-delay') return <EncounterDelayTimeline dungeonId={presentation.dungeon.id} dungeonName={presentation.dungeon.name} encounterDelayMs={presentation.dungeon.encounterDelayMs} threatCleared={combat.threatCleared} threatRequired={presentation.threatRequired} bossApproaching={presentation.threatRequired <= combat.threatCleared} sequence={sequence} sequenceIndex={combat.dungeonSequenceIndex} />

  const currentAction = presentation.enemyCurrentAction
  const cycleId = `${combat.enemyInstanceKey ?? 'enemy'}:${presentation.currentPatternOriginId ?? ''}:${presentation.currentStepId ?? ''}:${presentation.currentActionId ?? 'basic'}:${combat.enemyNextActionIndex}`
  return <section className={`combat-flow-panel${combat.inBossFight ? ' is-boss-fight' : ''}`} style={{ '--enemy-accent': presentation.enemy?.color } as React.CSSProperties}>
    <header className="combat-flow-head"><span className="combat-flow-kicker">COMBAT FLOW</span><CombatGuardianIndicator /></header>
    {currentAction && <CurrentEnemyAction currentAction={currentAction} basicDamage={presentation.enemy?.basicAttackDamage ?? 0} actionTimeMs={presentation.enemyTimeline?.baseWorkMs ?? presentation.currentActionDurationMs} cycleId={cycleId} />}
    <div className="combat-flow-pattern"><div className="combat-subsection-label">ENEMY PATTERN</div><EnemyPatternRail pattern={presentation.pattern} enemy={presentation.enemy} currentStepIndex={presentation.currentStepIndex} currentStepId={presentation.currentStepId} currentActionId={presentation.currentActionId} currentPatternOriginId={presentation.currentPatternOriginId} /></div>
  </section>
}

function EncounterDelayTimeline({ dungeonId, dungeonName, encounterDelayMs, threatCleared, threatRequired, bossApproaching, sequence, sequenceIndex }: { dungeonId: DungeonId; dungeonName: string; encounterDelayMs: number; threatCleared: number; threatRequired: number; bossApproaching: boolean; sequence: import('../../game/types').MonsterId[] | null; sequenceIndex: number | null }) {
  const timing = useGameStore(useShallow((state) => ({ remainingWorkMs: state.combat.encounterTimerMs, paused: state.debug.combatPaused, timeScale: state.debug.combatTimeScale })))
  const rate = getCombatVisualRate(1, timing.paused, timing.timeScale)
  const snapshot = { cycleId: dungeonId, baseWorkMs: encounterDelayMs, remainingWorkMs: timing.remainingWorkMs, rate, blocked: timing.paused }
  const timelineRef = useCombatVisualTimeline(snapshot)
  const nextIndex = sequence ? Math.min(sequence.length, Math.max(0, sequenceIndex ?? 0)) : null
  const nextMonsterId = sequence && nextIndex !== null ? nextIndex < sequence.length ? sequence[nextIndex] : DUNGEONS[dungeonId].boss : null
  const nextMonsterName = nextMonsterId ? MONSTERS[nextMonsterId]?.name : null
  return <section className={`combat-flow-panel is-encounter-delay${bossApproaching ? ' is-boss-approaching' : ''}${sequence ? ' is-sequence-delay' : ''}`}><CombatGuardianIndicator /><div className="combat-flow-delay-head"><div className="combat-flow-delay-label"><TimerReset size={13} aria-hidden="true" /> NEXT ENCOUNTER</div><span className="combat-flow-state-mark">INCOMING</span></div><CombatTimelineReadout timelineRef={timelineRef} mode="remaining" className="combat-flow-delay" fallback={formatTime(timing.remainingWorkMs)} /><CombatActionProgress {...snapshot} timelineRef={timelineRef} /><div className="combat-flow-delay-context"><span>{sequence && nextIndex !== null ? `DUNGEON RUN · ${nextIndex + 1} / ${sequence.length + 1}` : `Searching the ${dungeonName}...`}</span>{sequence && nextMonsterName ? <span>NEXT · {nextMonsterName}</span> : <span>THREAT {formatNumber(threatCleared)} / {formatNumber(threatRequired)}</span>}{!sequence && bossApproaching && <strong>BOSS APPROACHING</strong>}</div></section>
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

function CurrentEnemyAction({ currentAction, basicDamage, actionTimeMs, cycleId }: { currentAction: NonNullable<ReturnType<typeof getCombatFlowPresentation>['enemyCurrentAction']>; basicDamage: number; actionTimeMs: number; cycleId: string }) {
  const action = currentAction.action ?? (currentAction.basic ? buildBasicAttackPresentation(basicDamage, actionTimeMs) : null)
  return <GameTooltip block wide placement="bottom" accent={currentAction.special ? 'warning' : 'neutral'} content={action ? <EnemyActionTooltip action={action} /> : undefined}><div className={`combat-flow-current-action${currentAction.special ? ' is-special' : ''} combat-current-action-${currentAction.iconKind}`}><div className="combat-flow-current-action-head"><div className="combat-flow-subhead"><span className={`combat-flow-current-action-icon combat-pattern-icon-${currentAction.iconKind}`}><EnemyPatternIcon kind={currentAction.iconKind} /></span><span className="combat-subsection-label">CURRENT ACTION</span><strong>{currentAction.label}</strong></div></div><EnemyActionTimeline cycleId={cycleId} actionTimeMs={actionTimeMs} />{currentAction.action ? <div className="combat-flow-effects">{currentAction.action.effects.map((effect, index) => <CombatEffectRow key={`${effect.label}-${index}`} effect={effect} />)}</div> : currentAction.basic ? <div className="combat-flow-effects"><CombatEffectRow effect={currentAction.basic} /></div> : null}</div></GameTooltip>
}

function EnemyActionTimeline({ cycleId, actionTimeMs }: { cycleId: string; actionTimeMs: number }) {
  const timing = useGameStore(useShallow((state) => {
    const current = getCurrentEnemyActionTiming(state)
    const blocked = Boolean(current?.blocked || state.debug.combatPaused || state.debug.freezeEnemyActions)
    return { baseWorkMs: current?.baseWorkMs ?? actionTimeMs, remainingWorkMs: current?.remainingWorkMs ?? actionTimeMs, rate: current?.rate ?? 0, blocked, timeScale: state.debug.combatTimeScale }
  }))
  const rate = getCombatVisualRate(timing.rate, timing.blocked, timing.timeScale)
  const snapshot = { cycleId, baseWorkMs: timing.baseWorkMs, remainingWorkMs: timing.remainingWorkMs, rate, blocked: timing.blocked }
  const timelineRef = useCombatVisualTimeline(snapshot)
  return <div className="combat-flow-current-action-clock"><CombatTimelineReadout timelineRef={timelineRef} mode="eta" className="combat-flow-current-action-eta ui-time" fallback={timing.blocked ? 'PAUSED' : formatTime(Math.max(0, timing.remainingWorkMs) / Math.max(0.0001, rate))} /><CombatActionProgress {...snapshot} timelineRef={timelineRef} /></div>
}
