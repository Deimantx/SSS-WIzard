import { useMemo, useState } from 'react'
import { Button, Card, Progress } from '../../../components/ui'
import { MONSTERS } from '../../../game/content/monsters'
import { ITEMS } from '../../../game/content/items/items'
import { formatCombatModifier, formatCombatRule, formatDuration, formatReadableId } from '../../../game/content/presentation/balanceFormatters'
import { EQUIPMENT_POSITIONS } from '../../../game/core/equipment'
import { getCurrentEnemyActionStep, getEnemyAction, getNextEnemyActionStep } from '../../../game/systems/combat/actionRuntime'
import { getCurrentEnemyActionTiming, getPlayerBasicTiming } from '../../../game/systems/combat/actionTiming'
import { getMonsterTraits } from '../../../game/systems/combat/traitRuntime'
import { getRuleRuntimeKey } from '../../../game/systems/combat/triggerRuntime'
import { useGameStore } from '../../../store/gameStore'
import { Summary } from '../DeveloperTabPrimitives'
import { DeveloperAdvancedSection } from '../../components/DeveloperBrowser'

const etaLabel = (etaMs: number | null) => etaMs === null ? 'Paused' : formatDuration(Math.max(0, etaMs))

export function DeveloperCombatActions() {
  const [selectedActionId, setSelectedActionId] = useState('')
  const [selectedPatternId, setSelectedPatternId] = useState('')
  const state = useGameStore()
  const { combat, equipment, debug } = state
  const enemy = combat.enemyId ? MONSTERS[combat.enemyId] : null
  const { startEnemyAction: start, forceEnemyAction: force, resolveCurrentEnemyAction: resolve, advanceEnemyAction: advance, setEnemyActionPattern: setPattern, resetEnemyActionPattern: resetPattern, resetEnemyActionCursor: resetCursor, resetCombatRuleRuntime: resetRules } = state
  const playerTiming = useMemo(() => getPlayerBasicTiming(state), [state])
  const enemyTiming = useMemo(() => getCurrentEnemyActionTiming(state), [state])
  const actionId = enemy ? selectedActionId && enemy.actions[selectedActionId] ? selectedActionId : Object.keys(enemy.actions)[0] ?? '' : ''
  const patternId = enemy ? selectedPatternId && enemy.actionPatterns[selectedPatternId] ? selectedPatternId : combat.enemyActionPatternId ?? enemy.defaultActionPatternId : ''
  const currentStep = enemy ? getCurrentEnemyActionStep(state) : undefined
  const nextStep = enemy ? getNextEnemyActionStep(state) : undefined
  const currentAction = enemy ? getEnemyAction(state, combat.enemyCurrentActionId) : undefined
  const nextLabel = nextStep?.type === 'basic' ? 'Basic Attack' : nextStep ? enemy?.actions[nextStep.actionId]?.name ?? nextStep.actionId : '-'
  const progress = enemyTiming?.progress ?? 0
  return <div className="developer-tab-grid">
    <Card title="Action inspector">
      <div className="developer-summary-grid">
        <Summary label="Player Basic" value="Current timed lane" />
        <Summary label="Player base work" value={formatDuration(playerTiming.baseWorkMs)} />
        <Summary label="Player remaining work" value={formatDuration(playerTiming.remainingWorkMs)} />
        <Summary label="Player rate" value={`${playerTiming.rate.toFixed(2)}×`} />
        <Summary label="Player ETA" value={etaLabel(playerTiming.etaMs)} />
        <Summary label="Player progress" value={`${Math.round(playerTiming.progress)}%`} />
        <Summary label="Player blocked" value={playerTiming.blocked ? 'Yes' : 'No'} />
        <Summary label="Current enemy" value={enemy?.name ?? '-'} />
        <Summary label="Pattern" value={formatReadableId(combat.enemyActionPatternId ?? '-')} />
        <Summary label="Pattern position" value={combat.enemyNextActionIndex} />
        <Summary label="Current step" value={currentStep?.type === 'basic' ? 'Basic Attack' : currentAction?.name ?? '-'} />
        <Summary label="Active action" value={currentAction?.name ?? (currentStep?.type === 'basic' ? 'Basic Attack' : '-')} />
        <Summary label="Origin pattern" value={formatReadableId(combat.enemyCurrentActionPatternId ?? '-')} />
        <Summary label="Next step" value={nextLabel} />
        <Summary label="Enemy base work" value={enemyTiming ? formatDuration(enemyTiming.baseWorkMs) : '-'} />
        <Summary label="Enemy remaining work" value={enemyTiming ? formatDuration(enemyTiming.remainingWorkMs) : '-'} />
        <Summary label="Enemy rate" value={enemyTiming ? `${enemyTiming.rate.toFixed(2)}×` : '-'} />
        <Summary label="Enemy ETA" value={!enemyTiming ? '-' : etaLabel(enemyTiming.etaMs)} />
        <Summary label="Enemy progress" value={`${Math.round(progress)}%`} />
        <Summary label="Enemy blocked" value={!enemyTiming || enemyTiming.blocked ? 'Yes' : 'No'} />
      </div>
      {debug.freezeEnemyActions && <p className="developer-warning">Enemy actions are frozen. Timers will not advance; Force Resolve and Advance remain available.</p>}
      {enemy && <Progress value={progress} label="Action progress" right={`${Math.round(progress)}%`} />}
    </Card>
    <Card title="Force enemy actions"><label className="developer-number-field">Selected action<select aria-label="Action to inspect" value={actionId} onChange={(event) => setSelectedActionId(event.target.value)}>{Object.values(enemy?.actions ?? {}).map((action) => <option key={action.id} value={action.id}>{action.name}</option>)}</select></label>{enemy && <div className="button-row"><Button onClick={() => start(actionId)} disabled={!actionId || Boolean(combat.enemyCurrentStepId)}>Start Selected Action</Button><Button variant="secondary" onClick={() => force(actionId)} disabled={!actionId || Boolean(combat.enemyCurrentStepId)}>Force Action</Button><Button variant="secondary" onClick={resolve} disabled={!combat.enemyCurrentStepId}>Force Resolve Active</Button><Button variant="ghost" onClick={advance} disabled={Boolean(combat.enemyCurrentStepId)}>Advance to Next Step</Button></div>}</Card>
    <Card title="Pattern controls"><label className="developer-number-field">Pattern<select aria-label="Pattern to set" value={patternId} onChange={(event) => setSelectedPatternId(event.target.value)}>{Object.values(enemy?.actionPatterns ?? {}).map((pattern) => <option key={pattern.id} value={pattern.id}>{formatReadableId(pattern.id)}</option>)}</select></label><div className="button-row"><Button onClick={() => setPattern(patternId)} disabled={!enemy}>Set pattern</Button><Button variant="secondary" onClick={resetPattern} disabled={!enemy}>Reset pattern to default</Button><Button variant="ghost" onClick={resetCursor} disabled={!enemy}>Reset pattern position</Button></div></Card>
    <Card title="Traits and special rules"><div className="button-row"><Button variant="ghost" onClick={resetRules} disabled={!enemy}>Reset special rules</Button></div>{enemy ? getMonsterTraits(enemy).map((trait) => <div key={trait.id} className="developer-trait-inspector"><strong>{trait.name}</strong><span>{trait.description}</span>{trait.modifiers?.map((modifier) => <small key={modifier.key}>{formatCombatModifier(modifier)}</small>)}{trait.rules?.map((rule) => { const key = getRuleRuntimeKey('enemy', 'trait', trait.id, rule.id); return <div key={rule.id} className="developer-trait-rule"><span>{formatCombatRule(rule)}</span><span>Cooldown {formatDuration(rule.cooldownMs ?? 0)} · Remaining {formatDuration(combat.ruleCooldowns[key] ?? 0)}</span><span>{rule.oncePerEncounter ? 'Once per encounter' : 'Repeatable'} · {combat.triggeredRuleIds.includes(key) ? 'Fired' : 'Ready'}</span></div> })}</div>) : <p className="muted">No active enemy traits.</p>}</Card>
    <Card title="Equipment effects in play"><div className="developer-equipment-provider-list">{EQUIPMENT_POSITIONS.map((position) => { const itemId = combat.active ? equipment[position] : null; const item = itemId ? ITEMS[itemId] : undefined; if (!item?.combat) return null; return <div className="developer-equipment-provider" key={position}><strong>{item.name}</strong><small>{formatReadableId(position)} · {item.combat.modifiers?.length ?? 0} passive effects · {item.combat.rules?.length ?? 0} special rules</small>{item.combat.modifiers?.map((modifier) => <span key={modifier.key}>{formatCombatModifier(modifier)}</span>)}{item.combat.rules?.map((rule) => { const key = getRuleRuntimeKey('player', 'equipment', item.id, rule.id, position); return <div className="developer-trait-rule" key={rule.id}><span>{formatCombatRule(rule)}</span><span>Cooldown {formatDuration(rule.cooldownMs ?? 0)} · Remaining {formatDuration(combat.ruleCooldowns[key] ?? 0)}</span><span>{rule.oncePerEncounter ? 'Once per encounter' : 'Repeatable'} · {combat.triggeredRuleIds.includes(key) ? 'Fired' : 'Ready'}</span></div> })}</div> })}</div>{!EQUIPMENT_POSITIONS.some((position) => { const itemId = combat.active ? equipment[position] : null; return Boolean(itemId && ITEMS[itemId]?.combat) }) && <p className="muted">No equipped equipment effects.</p>}<DeveloperAdvancedSection title="Advanced action identifiers"><span>Internal action and rule runtime data is available in Advanced Diagnostics.</span></DeveloperAdvancedSection></Card>
  </div>
}
