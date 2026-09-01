import { useState } from 'react'
import { Button, Card, Progress } from '../../components/ui'
import { DUNGEONS, DUNGEON_ORDER } from '../../game/content/dungeons/dungeons'
import { isBossMonster, MONSTERS } from '../../game/content/monsters'
import { STATUS_DEFINITIONS, STATUS_ORDER } from '../../game/content/statuses'
import { getCurrentEnemyActionStep, getEnemyAction, getNextEnemyActionStep } from '../../game/systems/combat/actionRuntime'
import { getMonsterTraits } from '../../game/systems/combat/traitRuntime'
import { getRuleRuntimeKey } from '../../game/systems/combat/triggerRuntime'
import { resolveCombatSourceLabel } from '../../game/presentation/combat/combatSourcePresentation'
import type { DungeonId, MonsterId, StatusId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

export function DeveloperCombat() {
  const [statusId, setStatusId] = useState<StatusId>('burning')
  const [selectedActionId, setSelectedActionId] = useState('')
  const [selectedPatternId, setSelectedPatternId] = useState('')
  const [selectedDungeonId, setSelectedDungeonId] = useState<DungeonId>('whispering-woods')
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
  const resolveCurrent = useGameStore((state) => state.resolveCurrentEnemyAction)
  const advance = useGameStore((state) => state.advanceEnemyAction)
  const setPattern = useGameStore((state) => state.setEnemyActionPattern)
  const resetPattern = useGameStore((state) => state.resetEnemyActionPattern)
  const resetCursor = useGameStore((state) => state.resetEnemyActionCursor)
  const resetRuleRuntime = useGameStore((state) => state.resetCombatRuleRuntime)
  const clearPlayer = useGameStore((state) => state.clearPlayerStatuses)
  const clearEnemy = useGameStore((state) => state.clearEnemyStatuses)
  const enemy = combat.enemyId ? MONSTERS[combat.enemyId] : null
  const actionId = enemy ? selectedActionId && enemy.actions[selectedActionId] ? selectedActionId : Object.keys(enemy.actions)[0] ?? '' : ''
  const patternId = enemy ? selectedPatternId && enemy.actionPatterns[selectedPatternId] ? selectedPatternId : combat.enemyActionPatternId ?? enemy.defaultActionPatternId : ''
  const currentStep = enemy ? getCurrentEnemyActionStep(useGameStore.getState()) : undefined
  const nextStep = enemy ? getNextEnemyActionStep(useGameStore.getState()) : undefined
  const currentAction = enemy ? getEnemyAction(useGameStore.getState(), combat.enemyCurrentActionId) : undefined
  const currentKind = currentStep?.type === 'basic' ? 'Basic Attack' : currentAction?.name ?? '-'
  const nextStepLabel = nextStep?.type === 'basic' ? 'Basic Attack' : nextStep ? enemy?.actions[nextStep.actionId]?.name ?? nextStep.actionId : '-'
  const progressPercent = combat.enemyActionDurationMs > 0 ? Math.max(0, Math.min(100, (1 - combat.enemyActionTimerMs / combat.enemyActionDurationMs) * 100)) : 0
  const selectedPattern = enemy?.actionPatterns[patternId]
  const selectedActionInPattern = Boolean(selectedPattern?.steps.some((step) => step.type === 'action' && step.actionId === actionId))

  return <div className="developer-tab-grid">
    <Card title="Combat state"><div className="developer-summary-grid"><Summary label="Active" value={combat.active ? 'Yes' : 'No'} /><Summary label="Dungeon" value={combat.dungeonId ?? '-'} /><Summary label="Enemy" value={enemy?.name ?? 'None'} /><Summary label="Enemy HP" value={combat.enemyId ? `${Math.floor(combat.enemyHp)} / ${combat.enemyMaxHp}` : '-'} /><Summary label="Player Barrier" value={combat.playerBarrier} /><Summary label="Enemy Barrier" value={combat.enemyBarrier} /><Summary label="Threat" value={combat.threatCleared} /><Summary label="Auto Hunt" value={combat.dungeonId && progress.autoHuntBossByDungeon[combat.dungeonId] ? 'Boss enabled' : 'Normal loop'} /><Summary label="Pattern" value={combat.enemyActionPatternId ?? 'None'} /><Summary label="Next index" value={combat.enemyNextActionIndex} /><Summary label="Current action" value={currentKind} /></div>{combat.enemyId && <Progress value={combat.enemyHp / combat.enemyMaxHp * 100} tone="red" label="Enemy HP" right={`${Math.floor(combat.enemyHp)} HP`} />}</Card>
    <Card title="Encounter controls"><label className="developer-number-field">Dungeon<select aria-label="Dungeon to enter" value={selectedDungeonId} onChange={(event) => setSelectedDungeonId(event.target.value as DungeonId)}>{DUNGEON_ORDER.map((id) => <option key={id} value={id}>{DUNGEONS[id].name}</option>)}</select></label><p className="muted">Debug spawns use the selected dungeon context.</p><div className="button-row"><Button onClick={() => enter(selectedDungeonId)}>Enter selected dungeon</Button><Button variant="secondary" onClick={leave}>Leave Dungeon</Button><Button variant="danger" onClick={kill} disabled={!combat.enemyId}>Kill current enemy</Button></div><NumberField label="Threat cleared" value={combat.threatCleared} onChange={setThreat} /><div className="developer-button-grid">{(Object.keys(MONSTERS) as MonsterId[]).map((id) => <Button key={id} variant={isBossMonster(MONSTERS[id]) ? 'danger' : 'ghost'} onClick={() => spawn(id, selectedDungeonId)}>Spawn {MONSTERS[id].name}</Button>)}</div><div className="button-row"><Button variant="secondary" onClick={() => setHp(25)} disabled={!combat.enemyId}>Set enemy HP 25%</Button><Button variant="secondary" onClick={() => setHp(100)} disabled={!combat.enemyId}>Restore enemy HP</Button><Button variant="ghost" onClick={clearPlayer}>Clear player statuses</Button><Button variant="ghost" onClick={clearEnemy}>Clear enemy statuses</Button></div></Card>
    <Card title="Action inspector"><div className="developer-summary-grid"><Summary label="Current enemy" value={enemy?.name ?? '-'} /><Summary label="Selected pattern" value={combat.enemyActionPatternId ?? '-'} /><Summary label="Current step" value={combat.enemyCurrentStepId ?? '-'} /><Summary label="Current action" value={currentAction?.name ?? (currentStep?.type === 'basic' ? 'Basic Attack' : '-')} /><Summary label="Origin pattern" value={combat.enemyCurrentActionPatternId ?? '-'} /><Summary label="Next step" value={nextStepLabel} /><Summary label="Remaining" value={`${Math.max(0, Math.floor(combat.enemyActionTimerMs))}ms`} /><Summary label="Duration" value={`${Math.max(0, Math.floor(combat.enemyActionDurationMs))}ms`} /><Summary label="Progress" value={`${Math.round(progressPercent)}%`} /></div>{enemy && <><label className="developer-number-field">Selected Action<select aria-label="Action to inspect" value={actionId} onChange={(event) => setSelectedActionId(event.target.value)}>{Object.values(enemy.actions).map((action) => <option key={action.id} value={action.id}>{action.name}</option>)}</select></label><div className="button-row"><Button onClick={() => startAction(actionId)} disabled={!actionId || Boolean(combat.enemyCurrentStepId)}>{selectedActionInPattern ? 'Start Selected Action' : 'Start Standalone Action'}</Button><Button variant="secondary" onClick={() => forceAction(actionId)} disabled={!actionId || Boolean(combat.enemyCurrentStepId)}>Resolve Selected Action</Button><Button variant="secondary" onClick={resolveCurrent} disabled={!combat.enemyCurrentStepId}>Resolve Current Action</Button><Button variant="ghost" onClick={advance} disabled={Boolean(combat.enemyCurrentStepId)}>Start Next Step</Button></div>{!selectedActionInPattern && <small className="muted">Standalone action testing leaves the selected Pattern cursor unchanged.</small>}<label className="developer-number-field">Pattern<select aria-label="Pattern to set" value={patternId} onChange={(event) => setSelectedPatternId(event.target.value)}>{Object.values(enemy.actionPatterns).map((pattern) => <option key={pattern.id} value={pattern.id}>{pattern.id}</option>)}</select></label><div className="button-row"><Button onClick={() => setPattern(patternId)}>Set Pattern</Button><Button variant="secondary" onClick={resetPattern}>Reset Pattern to default</Button><Button variant="ghost" onClick={resetCursor}>Reset Pattern cursor</Button></div></>}</Card>
    <Card title="Active enemy Traits"><div className="button-row"><Button variant="ghost" onClick={resetRuleRuntime} disabled={!combat.enemyId}>Reset Combat Rule Runtime</Button></div>{enemy ? getMonsterTraits(enemy).map((trait) => <div key={trait.id} className="developer-trait-inspector"><strong>{trait.name}</strong><small>{trait.id}</small><span>{trait.description}</span><span>Modifiers: {trait.modifiers?.length ?? 0} · Rules: {trait.rules?.length ?? 0}</span>{trait.rules?.map((rule) => { const key = getRuleRuntimeKey('enemy', 'trait', trait.id, rule.id); return <div key={rule.id} className="developer-trait-rule"><span>{rule.id} · {rule.event}</span><span>Priority {rule.priority ?? 0} · Cooldown {rule.cooldownMs ?? 0}ms · Remaining {combat.ruleCooldowns[key] ?? 0}ms</span><span>Once per encounter: {rule.oncePerEncounter ? 'Yes' : 'No'} · Fired: {combat.triggeredRuleIds.includes(key) ? 'Yes' : 'No'}</span></div> })}</div>) : <p className="muted">No authored traits.</p>}</Card>
    <Card title="Universal status tester"><label className="developer-number-field">Status<select aria-label="Status to apply" value={statusId} onChange={(event) => setStatusId(event.target.value as StatusId)}>{STATUS_ORDER.map((id) => <option key={id} value={id}>{STATUS_DEFINITIONS[id].name}</option>)}</select></label><p className="muted">{STATUS_DEFINITIONS[statusId].description}</p><div className="button-row"><Button onClick={() => applyPlayer(statusId)}>Apply to player</Button><Button onClick={() => applyEnemy(statusId)}>Apply to enemy</Button></div></Card>
    <Card title="Raw status instances"><RawStatusInstances statuses={[...combat.playerStatuses.map((status) => ({ actor: 'player' as const, status })), ...combat.enemyStatuses.map((status) => ({ actor: 'enemy' as const, status }))]} /></Card>
    <Card title="Barrier tester"><div className="button-row"><NumberField label="Player Barrier" value={combat.playerBarrier} onChange={setPlayerBarrier} /><Button variant="ghost" onClick={clearPlayerBarrier}>Clear player Barrier</Button></div><div className="button-row"><NumberField label="Enemy Barrier" value={combat.enemyBarrier} onChange={setEnemyBarrier} /><Button variant="ghost" onClick={clearEnemyBarrier}>Clear enemy Barrier</Button></div></Card>
  </div>
}

function RawStatusInstances({ statuses }: { statuses: Array<{ actor: 'player' | 'enemy'; status: import('../../game/types').ActiveStatus }> }) {
  if (!statuses.length) return <p className="muted">No active status instances.</p>
  return <div className="developer-status-instance-list">{statuses.map(({ actor, status }) => {
    const definition = STATUS_DEFINITIONS[status.statusId]
    const periodic = status.periodicEffects ?? definition?.periodic?.effects
    const periodicLabel = periodic?.length ? periodic.map((effect) => effect.type === 'deal-damage' && effect.magnitude.type === 'flat' ? `${effect.damageType} ${effect.magnitude.value}/tick` : effect.type).join(', ') : '-'
    return <div className="developer-status-instance" key={`${actor}:${status.statusId}:${status.instanceKey}`}><strong>{definition?.name ?? status.statusId}</strong><span>Actor: {actor} · Status ID: {status.statusId}</span><span>Instance Key: {status.instanceKey}</span><span>Source: {resolveCombatSourceLabel(status.source)} · Origin: {status.source.originSourceId ?? status.source.sourceId ?? '-'}</span><span>Remaining: {status.remainingMs === null ? '∞' : `${Math.max(0, Math.floor(status.remainingMs))}ms`} · Next tick: {status.nextTickMs === undefined ? '-' : `${Math.max(0, Math.floor(status.nextTickMs))}ms`}</span><span>Stacks: {status.stacks} · Periodic: {periodicLabel}</span></div>
  })}</div>
}
