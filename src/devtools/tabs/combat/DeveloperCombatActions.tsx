import { useState } from 'react'
import { Button, Card, Progress } from '../../../components/ui'
import { MONSTERS } from '../../../game/content/monsters'
import { ITEMS } from '../../../game/content/items/items'
import { EQUIPMENT_POSITIONS } from '../../../game/core/equipment'
import { getCurrentEnemyActionStep, getEnemyAction, getNextEnemyActionStep } from '../../../game/systems/combat/actionRuntime'
import { getCurrentEnemyActionRate, getPlayerBasicAttackRate } from '../../../game/systems/combat/actionRuntime'
import { actorCannotAct } from '../../../game/systems/combat/statusRuntime'
import { getMonsterTraits } from '../../../game/systems/combat/traitRuntime'
import { getRuleRuntimeKey } from '../../../game/systems/combat/triggerRuntime'
import { useGameStore } from '../../../store/gameStore'
import { Summary } from '../DeveloperTabPrimitives'

export function DeveloperCombatActions() {
  const [selectedActionId, setSelectedActionId] = useState('')
  const [selectedPatternId, setSelectedPatternId] = useState('')
  const combat = useGameStore((state) => state.combat)
  const equipment = useGameStore((state) => state.equipment)
  const enemy = combat.enemyId ? MONSTERS[combat.enemyId] : null
  const debug = useGameStore((state) => state.debug)
  const start = useGameStore((state) => state.startEnemyAction)
  const force = useGameStore((state) => state.forceEnemyAction)
  const resolve = useGameStore((state) => state.resolveCurrentEnemyAction)
  const advance = useGameStore((state) => state.advanceEnemyAction)
  const setPattern = useGameStore((state) => state.setEnemyActionPattern)
  const resetPattern = useGameStore((state) => state.resetEnemyActionPattern)
  const resetCursor = useGameStore((state) => state.resetEnemyActionCursor)
  const resetRules = useGameStore((state) => state.resetCombatRuleRuntime)
  const actionId = enemy ? selectedActionId && enemy.actions[selectedActionId] ? selectedActionId : Object.keys(enemy.actions)[0] ?? '' : ''
  const patternId = enemy ? selectedPatternId && enemy.actionPatterns[selectedPatternId] ? selectedPatternId : combat.enemyActionPatternId ?? enemy.defaultActionPatternId : ''
  const currentStep = enemy ? getCurrentEnemyActionStep(useGameStore.getState()) : undefined
  const nextStep = enemy ? getNextEnemyActionStep(useGameStore.getState()) : undefined
  const currentAction = enemy ? getEnemyAction(useGameStore.getState(), combat.enemyCurrentActionId) : undefined
  const nextLabel = nextStep?.type === 'basic' ? 'Basic Attack' : nextStep ? enemy?.actions[nextStep.actionId]?.name ?? nextStep.actionId : '-'
  const progress = combat.enemyActionDurationMs > 0 ? Math.max(0, Math.min(100, (1 - combat.enemyActionTimerMs / combat.enemyActionDurationMs) * 100)) : 0
  const selectedPattern = enemy?.actionPatterns[patternId]
  const inPattern = Boolean(selectedPattern?.steps.some((step) => step.type === 'action' && step.actionId === actionId))
  const playerRate = getPlayerBasicAttackRate(useGameStore.getState())
  const enemyRate = getCurrentEnemyActionRate(useGameStore.getState())
  const playerProgress = combat.playerAttackDurationMs > 0 ? Math.max(0, Math.min(100, (1 - combat.playerAttackTimerMs / combat.playerAttackDurationMs) * 100)) : 0
  return <div className="developer-tab-grid">
    <Card title="Action inspector"><div className="developer-summary-grid"><Summary label="Player Basic" value="Current timed lane" /><Summary label="Player base work" value={`${Math.max(0, Math.floor(combat.playerAttackDurationMs))}ms`} /><Summary label="Player remaining work" value={`${Math.max(0, Math.floor(combat.playerAttackTimerMs))}ms`} /><Summary label="Player rate" value={`${playerRate.toFixed(2)}×`} /><Summary label="Player progress" value={`${Math.round(playerProgress)}%`} /><Summary label="Player blocked" value={actorCannotAct(useGameStore.getState(), 'player') ? 'Yes' : 'No'} /><Summary label="Current enemy" value={enemy?.name ?? '-'} /><Summary label="Pattern" value={combat.enemyActionPatternId ?? '-'} /><Summary label="Pattern index" value={combat.enemyNextActionIndex} /><Summary label="Current step" value={combat.enemyCurrentStepId ?? '-'} /><Summary label="Active action" value={currentAction?.name ?? (currentStep?.type === 'basic' ? 'Basic Attack' : '-')} /><Summary label="Origin pattern" value={combat.enemyCurrentActionPatternId ?? '-'} /><Summary label="Next step" value={nextLabel} /><Summary label="Enemy base work" value={`${Math.max(0, Math.floor(combat.enemyActionDurationMs))}ms`} /><Summary label="Enemy remaining work" value={`${Math.max(0, Math.floor(combat.enemyActionTimerMs))}ms`} /><Summary label="Enemy rate" value={`${enemyRate.toFixed(2)}×`} /><Summary label="Enemy progress" value={`${Math.round(progress)}%`} /><Summary label="Enemy blocked" value={actorCannotAct(useGameStore.getState(), 'enemy') ? 'Yes' : 'No'} /></div>{debug.freezeEnemyActions && <p className="developer-warning">Enemy actions are frozen. Timers will not advance; Force Resolve and Advance remain available.</p>}{enemy && <Progress value={progress} label="Action progress" right={`${Math.round(progress)}%`} />}</Card>
    <Card title="Force enemy actions"><label className="developer-number-field">Selected action<select aria-label="Action to inspect" value={actionId} onChange={(event) => setSelectedActionId(event.target.value)}>{Object.values(enemy?.actions ?? {}).map((action) => <option key={action.id} value={action.id}>{action.name}</option>)}</select></label>{enemy && <div className="button-row"><Button onClick={() => start(actionId)} disabled={!actionId || Boolean(combat.enemyCurrentStepId)}>Start Selected Action</Button><Button variant="secondary" onClick={() => force(actionId)} disabled={!actionId || Boolean(combat.enemyCurrentStepId)}>Force Action</Button><Button variant="secondary" onClick={resolve} disabled={!combat.enemyCurrentStepId}>Force Resolve Active</Button><Button variant="ghost" onClick={advance} disabled={Boolean(combat.enemyCurrentStepId)}>Advance to Next Step</Button></div>}</Card>
    <Card title="Pattern controls"><label className="developer-number-field">Pattern<select aria-label="Pattern to set" value={patternId} onChange={(event) => setSelectedPatternId(event.target.value)}>{Object.values(enemy?.actionPatterns ?? {}).map((pattern) => <option key={pattern.id} value={pattern.id}>{pattern.id}</option>)}</select></label><div className="button-row"><Button onClick={() => setPattern(patternId)} disabled={!enemy}>Set Pattern</Button><Button variant="secondary" onClick={resetPattern} disabled={!enemy}>Reset Pattern to Default</Button><Button variant="ghost" onClick={resetCursor} disabled={!enemy}>Reset Pattern Index</Button></div></Card>
    <Card title="Trait / rule runtime"><div className="button-row"><Button variant="ghost" onClick={resetRules} disabled={!enemy}>Reset Trait / Rule Runtime</Button></div>{enemy ? getMonsterTraits(enemy).map((trait) => <div key={trait.id} className="developer-trait-inspector"><strong>{trait.name}</strong><small>{trait.id}</small><span>{trait.description}</span><span>Modifiers: {trait.modifiers?.length ?? 0} · Rules: {trait.rules?.length ?? 0}</span>{trait.rules?.map((rule) => { const key = getRuleRuntimeKey('enemy', 'trait', trait.id, rule.id); return <div key={rule.id} className="developer-trait-rule"><span>{rule.id} · {rule.event}</span><span>Priority {rule.priority ?? 0} · Cooldown {rule.cooldownMs ?? 0}ms · Remaining {combat.ruleCooldowns[key] ?? 0}ms</span><span>Once per encounter: {rule.oncePerEncounter ? 'Yes' : 'No'} · Fired: {combat.triggeredRuleIds.includes(key) ? 'Yes' : 'No'}</span></div> })}</div>) : <p className="muted">No active enemy traits.</p>}</Card>
    <Card title="Equipment combat providers"><div className="developer-equipment-provider-list">{EQUIPMENT_POSITIONS.map((position) => { const itemId = combat.active ? equipment[position] : null; const item = itemId ? ITEMS[itemId] : undefined; if (!item?.combat) return null; return <div className="developer-equipment-provider" key={position}><strong>{item.name}</strong><small>{position} · {item.id}</small><span>Modifiers: {item.combat.modifiers?.length ?? 0} · Rules: {item.combat.rules?.length ?? 0}</span>{item.combat.rules?.map((rule) => { const key = getRuleRuntimeKey('player', 'equipment', item.id, rule.id, position); return <div className="developer-trait-rule" key={rule.id}><span>{rule.id} · {rule.event}</span><span>Cooldown {rule.cooldownMs ?? 0}ms · Remaining {combat.ruleCooldowns[key] ?? 0}ms</span><span>Once per encounter: {rule.oncePerEncounter ? 'Yes' : 'No'} · Fired: {combat.triggeredRuleIds.includes(key) ? 'Yes' : 'No'}</span></div> })}</div> })}</div>{!EQUIPMENT_POSITIONS.some((position) => { const itemId = combat.active ? equipment[position] : null; return Boolean(itemId && ITEMS[itemId]?.combat) }) && <p className="muted">No equipped Combat providers.</p>}</Card>
  </div>
}
