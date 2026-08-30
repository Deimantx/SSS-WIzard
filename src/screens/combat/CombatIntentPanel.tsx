import { Clock3, Heart, Shield, ShieldAlert, Sparkles, Swords, TimerReset } from 'lucide-react'
import { useMemo } from 'react'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../game/content/monsters'
import { buildCombatActionPresentation, formatCombatEffect, type CombatActionPresentation, type CombatEffectPresentation } from '../../game/presentation/combat'
import { getCurrentEnemyActionStep, getEnemyAction, getEnemyActionPattern } from '../../game/systems/combat/actionRuntime'
import type { DungeonId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { formatTime } from '../../game/utils'
import { GameTooltip, Progress, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { EnemyPatternRail } from './EnemyPatternRail'

export function CombatIntentPanel({ selectedDungeonId }: { selectedDungeonId: DungeonId }) {
  const active = useGameStore((state) => state.combat.active)
  const enemyId = useGameStore((state) => state.combat.enemyId)
  const dungeonId = useGameStore((state) => state.combat.dungeonId)
  const threatCleared = useGameStore((state) => state.combat.threatCleared)
  const inBossFight = useGameStore((state) => state.combat.inBossFight)
  const encounterTimerMs = useGameStore((state) => state.combat.encounterTimerMs)
  const enemyTelegraphMs = useGameStore((state) => state.combat.enemyTelegraphMs)
  const enemyActionTimerMs = useGameStore((state) => state.combat.enemyActionTimerMs)
  const enemyActionRecoveryMs = useGameStore((state) => state.combat.enemyActionRecoveryMs)
  const enemyActionIndex = useGameStore((state) => state.combat.enemyActionIndex)
  const enemyActionPatternId = useGameStore((state) => state.combat.enemyActionPatternId)
  const enemyTelegraphActionId = useGameStore((state) => state.combat.enemyTelegraphActionId)
  const enemyTelegraphStepId = useGameStore((state) => state.combat.enemyTelegraphStepId)
  const enemyTelegraphPatternId = useGameStore((state) => state.combat.enemyTelegraphPatternId)
  const latestLog = useGameStore((state) => state.combat.log[0])
  const dungeon = DUNGEONS[active ? dungeonId ?? selectedDungeonId : selectedDungeonId]
  const enemy = enemyId ? MONSTERS[enemyId] : null
  const bossReady = active && !enemy && !inBossFight && threatCleared >= dungeon.threatRequired
  const pattern = useMemo(() => enemy ? getEnemyActionPattern(useGameStore.getState()) : undefined, [enemyId, enemyActionPatternId])
  const nextStep = useMemo(() => enemy ? getCurrentEnemyActionStep(useGameStore.getState()) : undefined, [enemyId, enemyActionPatternId, enemyActionIndex])
  const activeAction = useMemo(() => enemy ? getEnemyAction(useGameStore.getState(), enemyTelegraphActionId) : undefined, [enemyId, enemyTelegraphActionId])
  const nextAction = useMemo(() => nextStep?.type === 'action' && enemy ? enemy.actions[nextStep.actionId] : undefined, [enemy, nextStep])
  const action = activeAction ?? nextAction
  const actionPresentation = useMemo(() => action ? buildCombatActionPresentation(action) : null, [action])
  const basicPresentation = useMemo(() => !actionPresentation && nextStep?.type === 'basic' && enemy
    ? formatCombatEffect({ type: 'deal-damage', target: 'opponent', damageType: 'physical', magnitude: { type: 'flat', value: enemy.basicAttackDamage } }, { actor: 'enemy', kind: 'basic-attack' })
    : null, [actionPresentation, enemy, nextStep])

  if (!active) return <section className="combat-intent-panel is-idle"><div className="combat-intent-kicker">AT THE TOWER</div><ShieldAlert size={30} aria-hidden="true" /><strong>READY TO ENTER</strong><h2>{dungeon.name}</h2><p>{dungeon.ui?.description ?? 'Choose a route from the Dungeon Atlas to begin.'}</p></section>
  if (!enemy && bossReady) return <section className="combat-intent-panel is-boss-ready"><div className="combat-intent-kicker">BOSS ENCOUNTER</div><ShieldAlert size={30} aria-hidden="true" /><strong>BOSS READY</strong><h2>{MONSTERS[dungeon.boss].name}</h2><p>The route is clear. Engage the Boss from the Run Bar when ready.</p></section>
  if (!enemy) return <section className="combat-intent-panel is-delay"><div className="combat-intent-kicker">NEXT ENCOUNTER</div><strong className="combat-intent-title">{formatTime(encounterTimerMs)}</strong><Progress value={Math.max(0, Math.min(100, (1 - encounterTimerMs / Math.max(1, dungeon.encounterDelayMs)) * 100))} tone="time" label="Encounter progress" /><p>The Dungeon is searching for another threat.</p></section>

  const currentIndex = pattern?.steps.length ? Math.max(0, enemyActionIndex) % pattern.steps.length : -1
  const activeTelegraph = Boolean(activeAction)
  const recoveryProgress = 1 - enemyActionTimerMs / Math.max(1, enemyActionRecoveryMs)
  const activeOriginMatchesCurrent = !enemyTelegraphPatternId || enemyTelegraphPatternId === enemyActionPatternId

  return <section className={`combat-intent-panel${activeTelegraph ? ' is-telegraphing' : ''}`} style={{ '--enemy-accent': enemy.color } as React.CSSProperties}>
    <header className="combat-intent-head"><div><span className="combat-intent-kicker">{activeTelegraph ? 'ENEMY INTENT' : 'NEXT ACTION'}</span><h2>{action?.name ?? (nextStep?.type === 'basic' ? 'Basic Attack' : 'Preparing…')}</h2></div><Status tone={activeTelegraph ? 'warning' : 'neutral'}>{activeTelegraph ? 'Telegraphing' : 'Recovery'}</Status></header>
    <div className="combat-intent-countdown"><Clock3 size={17} aria-hidden="true" /><strong className="ui-time">{formatTime(activeTelegraph ? enemyTelegraphMs : enemyActionTimerMs)}</strong><span>{activeTelegraph ? 'until resolution' : 'until next action'}</span></div>
    <Progress value={activeTelegraph && action?.telegraphMs ? Math.max(0, Math.min(100, (1 - enemyTelegraphMs / action.telegraphMs) * 100)) : Math.max(0, Math.min(100, recoveryProgress * 100))} tone={activeTelegraph ? 'warning' : 'time'} label={activeTelegraph ? 'Telegraph progress' : 'Recovery progress'} />
    {actionPresentation ? <GameTooltip block wide={activeTelegraph} placement="bottom" accent={activeTelegraph ? 'warning' : 'elemental'} content={<ActionTooltip action={actionPresentation} />}><div className="combat-intent-effects"><span className="combat-subsection-label">{activeTelegraph ? 'WHAT HAPPENS' : 'ACTION EFFECTS'}</span>{actionPresentation.effects.map((effect, index) => <CombatEffectRow key={`${effect.label}-${index}`} effect={effect} />)}</div></GameTooltip> : basicPresentation ? <div className="combat-intent-effects"><span className="combat-subsection-label">BASIC ATTACK</span><CombatEffectRow effect={basicPresentation} /></div> : null}
    <div className="combat-intent-pattern"><div className="combat-subsection-label">ACTION SEQUENCE</div><EnemyPatternRail pattern={pattern} enemy={enemy} currentIndex={currentIndex} activeStepId={enemyTelegraphStepId} activeAction={enemyTelegraphActionId} activeOriginMatchesCurrent={activeOriginMatchesCurrent} /></div>
    <div className="combat-intent-latest"><span>LATEST</span><strong>{latestLog ?? 'Combat events will appear here.'}</strong></div>
  </section>
}

function CombatEffectRow({ effect }: { effect: CombatEffectPresentation }) {
  return <div className={`combat-effect-line effect-kind-${effect.kind}`}><span className="combat-effect-icon"><IntentEffectIcon kind={effect.kind} /></span><div><strong>{effect.value && effect.kind === 'damage' ? `${effect.value} ${effect.label}` : effect.label}</strong>{effect.value && effect.kind !== 'damage' && <b>{effect.value}</b>}<small>{[effect.detail, effect.timeLabel].filter(Boolean).join(' · ')}</small></div></div>
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
