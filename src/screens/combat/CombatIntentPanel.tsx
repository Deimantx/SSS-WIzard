import { Clock3, ShieldAlert } from 'lucide-react'
import { MONSTERS } from '../../game/content/monsters'
import { buildCombatActionPresentation, formatCombatEffect } from '../../game/presentation/combat'
import { getCurrentEnemyActionStep, getEnemyAction, getEnemyActionPattern } from '../../game/systems/combat/actionRuntime'
import { useGameStore } from '../../store/gameStore'
import { formatTime } from '../../game/utils'
import { GameTooltip, Progress, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { EnemyPatternRail } from './EnemyPatternRail'

export function CombatIntentPanel() {
  const state = useGameStore((current) => current)
  const view = (() => {
    const combat = state.combat
    const enemy = combat.enemyId ? MONSTERS[combat.enemyId] : null
    const pattern = enemy ? getEnemyActionPattern(state) : undefined
    const nextStep = enemy ? getCurrentEnemyActionStep(state) : undefined
    const activeAction = enemy ? getEnemyAction(state, combat.enemyTelegraphActionId) : undefined
    const nextAction = nextStep?.type === 'action' ? enemy?.actions[nextStep.actionId] : undefined
    const currentIndex = pattern?.steps.length ? Math.max(0, combat.enemyActionIndex) % pattern.steps.length : -1
    const activeOriginMatchesCurrent = !combat.enemyTelegraphPatternId || combat.enemyTelegraphPatternId === combat.enemyActionPatternId
    return { combat, enemy, pattern, activeAction, nextAction, nextStep, currentIndex, activeOriginMatchesCurrent }
  })()
  const { combat, enemy, pattern, activeAction, nextAction, nextStep, currentIndex, activeOriginMatchesCurrent } = view
  if (!combat.active) return <section className="combat-intent-panel is-idle"><div className="combat-intent-kicker">COMBAT STAGE</div><ShieldAlert size={30} aria-hidden="true" /><strong>AT THE TOWER</strong><p>No active encounter. Choose a Dungeon from the Atlas to begin.</p></section>
  if (!enemy) return <section className="combat-intent-panel is-delay"><div className="combat-intent-kicker">NEXT ENCOUNTER</div><strong className="combat-intent-title">{formatTime(combat.encounterTimerMs)}</strong><Progress value={Math.max(0, Math.min(100, (1 - combat.encounterTimerMs / 5000) * 100))} tone="time" label="Encounter progress" /><p>The Dungeon is searching for another threat.</p></section>
  const action = activeAction ?? nextAction
  const actionPresentation = action ? buildCombatActionPresentation(action) : null
  const active = Boolean(activeAction)
  const total = activeAction?.telegraphMs ?? 0
  const remaining = active ? combat.enemyTelegraphMs : combat.enemyActionTimerMs
  const basicPresentation = !actionPresentation && nextStep?.type === 'basic' ? formatCombatEffect({ type: 'deal-damage', target: 'opponent', damageType: 'physical', magnitude: { type: 'flat', value: enemy.basicAttackDamage } }, { actor: 'enemy', kind: 'basic-attack' }) : null
  return <section className={`combat-intent-panel${active ? ' is-telegraphing' : ''}`} style={{ '--enemy-accent': enemy.color } as React.CSSProperties}><header className="combat-intent-head"><div><span className="combat-intent-kicker">ENEMY INTENT</span><h2>{active ? action?.name : 'NEXT ACTION'}</h2></div><Status tone={active ? 'warning' : 'neutral'}>{active ? 'Telegraphing' : 'Recovery'}</Status></header><div className="combat-intent-countdown"><Clock3 size={17} aria-hidden="true" /><strong className="ui-time">{formatTime(remaining)}</strong><span>{active ? 'until resolution' : 'on enemy clock'}</span></div><Progress value={active && total > 0 ? (1 - combat.enemyTelegraphMs / total) * 100 : active ? 100 : 0} tone="warning" label={active ? 'Telegraph progress' : 'Recovery progress'} right={active ? formatTime(combat.enemyTelegraphMs) : formatTime(combat.enemyActionTimerMs)} />{actionPresentation ? <GameTooltip block wide={active} placement="bottom" accent="warning" content={<ActionTooltip action={actionPresentation} />}><div className="combat-intent-effects"><span className="combat-subsection-label">{active ? 'WHAT HAPPENS' : 'ACTION EFFECTS'}</span>{actionPresentation.effects.map((effect, index) => <div className="combat-effect-line" key={`${effect.label}-${index}`}><strong>{effect.label}</strong><small>{effect.detail}</small></div>)}</div></GameTooltip> : basicPresentation ? <div className="combat-intent-effects"><span className="combat-subsection-label">BASIC ATTACK</span><div className="combat-effect-line"><strong>{basicPresentation.label}</strong><small>{basicPresentation.detail}</small></div></div> : null}<div className="combat-intent-pattern"><div className="combat-subsection-label">ACTION SEQUENCE</div><EnemyPatternRail pattern={pattern} enemy={enemy} currentIndex={currentIndex} activeStepId={combat.enemyTelegraphStepId} activeAction={combat.enemyTelegraphActionId} activeOriginMatchesCurrent={activeOriginMatchesCurrent} /></div><div className="combat-intent-latest"><span>LATEST</span><strong>{combat.log[0] ?? 'Combat events will appear here.'}</strong></div></section>
}

function ActionTooltip({ action }: { action: ReturnType<typeof buildCombatActionPresentation> }) { return <TooltipContent title={action.name} description={action.description}><div className="tooltip-section"><small>TELEGRAPH</small><p>{(action.telegraphMs / 1000).toFixed(1)}s</p></div>{action.recoveryMs !== undefined && <div className="tooltip-section"><small>RECOVERY</small><p>{(action.recoveryMs / 1000).toFixed(1)}s</p></div>}<div className="tooltip-section"><small>EFFECTS</small>{action.effects.map((effect) => <p key={`${effect.label}-${effect.detail}`}>{effect.label} · {effect.detail}</p>)}</div></TooltipContent> }
