import { useState } from 'react'
import { Button, Card, Progress } from '../../components/ui'
import { isBossMonster, MONSTERS } from '../../game/data/monsters'
import { STATUS_DEFINITIONS, STATUS_ORDER } from '../../game/content/statuses'
import { getCurrentEnemyActionStep, getEnemyAction } from '../../game/systems/combat/actionRuntime'
import { getMonsterTraits } from '../../game/systems/combat/traitRuntime'
import { getRuleRuntimeKey } from '../../game/systems/combat/triggerRuntime'
import type { MonsterId, StatusId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

export function DeveloperCombat() {
  const [statusId, setStatusId] = useState<StatusId>('burning')
  const [selectedActionId, setSelectedActionId] = useState('')
  const [selectedPatternId, setSelectedPatternId] = useState('')
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const enter = useGameStore((state) => state.enterDungeon)
  const leave = useGameStore((state) => state.leaveDungeon)
  const setThreat = useGameStore((state) => state.setThreat)
  const spawn = useGameStore((state) => state.spawnDebugEnemy)
  const kill = useGameStore((state) => state.killCurrentEnemy)
  const setHp = useGameStore((state) => state.setEnemyHealthPercent)
  const applyPlayer = useGameStore((state) => state.applyPlayerStatus)
  const applyEnemy = useGameStore((state) => state.applyEnemyStatus)
  const setPlayerBarrier = useGameStore((state) => state.setPlayerBarrier)
  const setEnemyBarrier = useGameStore((state) => state.setEnemyBarrier)
  const clearPlayerBarrier = useGameStore((state) => state.clearPlayerBarrier)
  const clearEnemyBarrier = useGameStore((state) => state.clearEnemyBarrier)
  const forceAction = useGameStore((state) => state.forceEnemyAction)
  const startAction = useGameStore((state) => state.startEnemyAction)
  const resolveActive = useGameStore((state) => state.resolveActiveEnemyAction)
  const interrupt = useGameStore((state) => state.interruptEnemyAction)
  const advance = useGameStore((state) => state.advanceEnemyAction)
  const setPattern = useGameStore((state) => state.setEnemyActionPattern)
  const resetPattern = useGameStore((state) => state.resetEnemyActionPattern)
  const resetIndex = useGameStore((state) => state.resetEnemyActionIndex)
  const resetRuleRuntime = useGameStore((state) => state.resetCombatRuleRuntime)
  const clearPlayer = useGameStore((state) => state.clearPlayerStatuses)
  const clearEnemy = useGameStore((state) => state.clearEnemyStatuses)
  const enemy = combat.enemyId ? MONSTERS[combat.enemyId] : null
  const actionId = enemy ? selectedActionId && enemy.actions[selectedActionId] ? selectedActionId : Object.keys(enemy.actions)[0] ?? '' : ''
  const patternId = enemy ? selectedPatternId && enemy.actionPatterns[selectedPatternId] ? selectedPatternId : combat.enemyActionPatternId ?? enemy.defaultActionPatternId : ''
  const currentStep = enemy ? getCurrentEnemyActionStep(useGameStore.getState()) : undefined
  const activeAction = enemy ? getEnemyAction(useGameStore.getState(), combat.enemyTelegraphActionId) : undefined
  const nextStepLabel = currentStep?.type === 'basic' ? 'Basic' : currentStep ? enemy?.actions[currentStep.actionId]?.name ?? currentStep.actionId : '-'

  return <div className="developer-tab-grid">
    <Card title="Combat state"><div className="developer-summary-grid"><Summary label="Active" value={combat.active ? 'Yes' : 'No'} /><Summary label="Dungeon" value={combat.dungeonId ?? '-'} /><Summary label="Enemy" value={enemy?.name ?? 'None'} /><Summary label="Enemy HP" value={combat.enemyId ? `${Math.floor(combat.enemyHp)} / ${combat.enemyMaxHp}` : '-'} /><Summary label="Player Barrier" value={combat.playerBarrier} /><Summary label="Enemy Barrier" value={combat.enemyBarrier} /><Summary label="Threat" value={combat.threatCleared} /><Summary label="Auto Hunt" value={progress.autoHuntBossByDungeon['whispering-woods'] ? 'Boss enabled' : 'Normal loop'} /><Summary label="Pattern" value={combat.enemyActionPatternId ?? 'None'} /><Summary label="Step index" value={combat.enemyActionIndex} /><Summary label="Telegraph" value={activeAction?.name ?? 'None'} /></div>{combat.enemyId && <Progress value={combat.enemyHp / combat.enemyMaxHp * 100} tone="red" label="Enemy HP" right={`${Math.floor(combat.enemyHp)} HP`} />}</Card>
    <Card title="Encounter controls"><div className="button-row"><Button onClick={enter}>Enter Whispering Woods</Button><Button variant="secondary" onClick={leave}>Leave Dungeon</Button><Button variant="danger" onClick={kill} disabled={!combat.enemyId}>Kill current enemy</Button></div><NumberField label="Threat cleared" value={combat.threatCleared} onChange={setThreat} /><div className="developer-button-grid">{(Object.keys(MONSTERS) as MonsterId[]).map((id) => <Button key={id} variant={isBossMonster(MONSTERS[id]) ? 'danger' : 'ghost'} onClick={() => spawn(id)}>Spawn {MONSTERS[id].name}</Button>)}</div><div className="button-row"><Button variant="secondary" onClick={() => setHp(25)} disabled={!combat.enemyId}>Set enemy HP 25%</Button><Button variant="secondary" onClick={() => setHp(100)} disabled={!combat.enemyId}>Restore enemy HP</Button><Button variant="ghost" onClick={clearPlayer}>Clear player statuses</Button><Button variant="ghost" onClick={clearEnemy}>Clear enemy statuses</Button></div></Card>
    <Card title="Action inspector"><div className="developer-summary-grid"><Summary label="Current enemy" value={enemy?.name ?? '-'} /><Summary label="Pattern ID" value={combat.enemyActionPatternId ?? '-'} /><Summary label="Pattern index" value={combat.enemyActionIndex} /><Summary label="Next step" value={nextStepLabel} /><Summary label="Active Action" value={activeAction?.name ?? '-'} /><Summary label="Step ID" value={combat.enemyTelegraphStepId ?? '-'} /><Summary label="Origin Pattern" value={combat.enemyTelegraphPatternId ?? '-'} /><Summary label="Telegraph" value={`${Math.max(0, Math.floor(combat.enemyTelegraphMs))}ms`} /><Summary label="Recovery" value={`${Math.max(0, Math.floor(combat.enemyActionTimerMs))} / ${Math.max(0, Math.floor(combat.enemyActionRecoveryMs))}ms`} /><Summary label="Interruptible" value={activeAction ? activeAction.interruptible === false ? 'No' : 'Yes' : '-'} /></div>{enemy && <><label className="developer-number-field">Selected Action<select aria-label="Action to inspect" value={actionId} onChange={(event) => setSelectedActionId(event.target.value)}>{Object.values(enemy.actions).map((action) => <option key={action.id} value={action.id}>{action.name}</option>)}</select></label><div className="button-row"><Button onClick={() => startAction(actionId)} disabled={!actionId || Boolean(activeAction)}>Start selected Action</Button><Button variant="secondary" onClick={() => forceAction(actionId)} disabled={!actionId || Boolean(activeAction)}>Force Action</Button><Button variant="secondary" onClick={resolveActive} disabled={!activeAction}>Force Resolve active</Button><Button variant="danger" onClick={interrupt} disabled={!activeAction}>Interrupt active</Button><Button variant="ghost" onClick={advance} disabled={Boolean(activeAction)}>Advance to next Step</Button></div><label className="developer-number-field">Pattern<select aria-label="Pattern to set" value={patternId} onChange={(event) => setSelectedPatternId(event.target.value)}>{Object.values(enemy.actionPatterns).map((pattern) => <option key={pattern.id} value={pattern.id}>{pattern.id}</option>)}</select></label><div className="button-row"><Button onClick={() => setPattern(patternId)}>Set Pattern</Button><Button variant="secondary" onClick={resetPattern}>Reset Pattern to default</Button><Button variant="ghost" onClick={resetIndex}>Reset Pattern index</Button></div></>}</Card>
    <Card title="Active enemy Traits"><div className="button-row"><Button variant="ghost" onClick={resetRuleRuntime} disabled={!combat.enemyId}>Reset Combat Rule Runtime</Button></div>{enemy ? getMonsterTraits(enemy).map((trait) => <div key={trait.id} className="developer-trait-inspector"><strong>{trait.name}</strong><small>{trait.id}</small><span>{trait.description}</span><span>Modifiers: {trait.modifiers?.length ?? 0} · Rules: {trait.rules?.length ?? 0}</span>{trait.rules?.map((rule) => { const key = getRuleRuntimeKey('enemy', 'trait', trait.id, rule.id); return <div key={rule.id} className="developer-trait-rule"><span>{rule.id} · {rule.event}</span><span>Priority {rule.priority ?? 0} · Cooldown {rule.cooldownMs ?? 0}ms · Remaining {combat.ruleCooldowns[key] ?? 0}ms</span><span>Once per encounter: {rule.oncePerEncounter ? 'Yes' : 'No'} · Fired: {combat.triggeredRuleIds.includes(key) ? 'Yes' : 'No'}</span></div> })}</div>) : <p className="muted">No active enemy Traits.</p>}</Card>
    <Card title="Universal status tester"><label className="developer-number-field">Status<select aria-label="Status to apply" value={statusId} onChange={(event) => setStatusId(event.target.value as StatusId)}>{STATUS_ORDER.map((id) => <option key={id} value={id}>{STATUS_DEFINITIONS[id].name}</option>)}</select></label><p className="muted">{STATUS_DEFINITIONS[statusId].description}</p><div className="button-row"><Button onClick={() => applyPlayer(statusId)}>Apply to player</Button><Button onClick={() => applyEnemy(statusId)}>Apply to enemy</Button></div></Card>
    <Card title="Barrier tester"><div className="button-row"><NumberField label="Player Barrier" value={combat.playerBarrier} onChange={setPlayerBarrier} /><Button variant="ghost" onClick={clearPlayerBarrier}>Clear player Barrier</Button></div><div className="button-row"><NumberField label="Enemy Barrier" value={combat.enemyBarrier} onChange={setEnemyBarrier} /><Button variant="ghost" onClick={clearEnemyBarrier}>Clear enemy Barrier</Button></div></Card>
  </div>
}
