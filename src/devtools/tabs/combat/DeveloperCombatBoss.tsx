import { useMemo, useState } from 'react'
import { Button, Card, Progress, SelectMenu, Status } from '../../../components/ui'
import { DUNGEONS, DUNGEON_ORDER, hasBossEncounter } from '../../../game/content/dungeons/dungeons'
import { isBossMonster, MONSTERS } from '../../../game/content/monsters'
import { formatDuration, formatReadableId } from '../../../game/content/presentation/balanceFormatters'
import { getCurrentEnemyActionStep, getEnemyAction } from '../../../game/systems/combat/actionRuntime'
import { getCurrentEnemyActionTiming } from '../../../game/systems/combat/actionTiming'
import { getMonsterTraits } from '../../../game/systems/combat/traitRuntime'
import type { DungeonId } from '../../../game/types'
import { useDeveloperGameStore as useGameStore } from '../../developerSandbox'
import { NumberField, Summary } from '../DeveloperTabPrimitives'

export function DeveloperCombatBoss() {
  const [selectedDungeonId, setSelectedDungeonId] = useState<DungeonId>('whispering-woods')
  const [customPercent, setCustomPercent] = useState(50)
  const state = useGameStore()
  const { combat, progress } = state
  const currentEnemy = combat.enemyId ? MONSTERS[combat.enemyId] : null
  const dungeon = DUNGEONS[combat.dungeonId ?? selectedDungeonId]
  const bossId = hasBossEncounter(dungeon) ? dungeon.boss : null
  const boss = bossId ? MONSTERS[bossId] : null
  const currentStep = currentEnemy ? getCurrentEnemyActionStep(state) : undefined
  const currentAction = currentEnemy ? getEnemyAction(state, combat.enemyCurrentActionId) : undefined
  const actionTiming = useMemo(() => getCurrentEnemyActionTiming(state), [state])
  const { setEnemyHealthPercent: setHp, restartDebugBoss: restart, jumpDebugToBoss: jump, resetEnemyActionPattern: resetPattern, resetEnemyActionCursor: resetCursor, resetCombatRuleRuntime: resetRules, clearEnemyStatuses: clearStatuses, clearEnemyBarrier: clearBarrier } = state
  const isBossActive = Boolean(currentEnemy && isBossMonster(currentEnemy))
  const applyPercent = (percent: number) => setHp(percent)
  const actionEta = !actionTiming ? '-' : actionTiming.etaMs === null ? 'Paused' : formatDuration(Math.max(0, actionTiming.etaMs))
  return <div className="developer-tab-grid">
    <Card title={boss ? 'Boss information' : 'Boss controls unavailable'}><div className="developer-summary-grid"><Summary label="Dungeon" value={dungeon.name} /><Summary label="Boss" value={boss?.name ?? 'Bossless location'} /><Summary label="Boss kills" value={bossId ? progress.bossKillsByBoss[bossId] ?? 0 : '—'} /><Summary label="Current target" value={currentEnemy?.name ?? 'None'} /><Summary label="Action" value={currentStep?.type === 'basic' ? 'Basic Attack' : currentAction?.name ?? '-'} /><Summary label="Pattern" value={formatReadableId(combat.enemyActionPatternId ?? '-')} /><Summary label="Action ETA" value={actionEta} /></div>{isBossActive && <Progress value={combat.enemyHp / Math.max(1, combat.enemyMaxHp) * 100} tone="red" label="Boss HP" right={`${Math.floor(combat.enemyHp)} / ${Math.floor(combat.enemyMaxHp)}`} />}{boss && boss.traitIds.length > 0 && <p className="muted">Traits: {getMonsterTraits(boss).map((trait) => trait.name).join(' · ')}</p>}</Card>
    <Card title="Boss setup"><div className="developer-number-field"><span>Debug boss dungeon</span><SelectMenu options={DUNGEON_ORDER.map((id) => ({ value: id, label: DUNGEONS[id].name }))} ariaLabel="Boss dungeon" value={selectedDungeonId} onChange={setSelectedDungeonId} /></div><div className="button-row"><Button variant="secondary" onClick={() => jump(selectedDungeonId)} disabled={!bossId}>Jump / Engage Boss</Button><Button variant="secondary" onClick={restart} disabled={!bossId}>Restart Current Boss</Button><Button variant="ghost" onClick={resetPattern} disabled={!isBossActive}>Reset Action Pattern</Button><Button variant="ghost" onClick={resetCursor} disabled={!isBossActive}>Reset Pattern Position</Button><Button variant="ghost" onClick={resetRules} disabled={!isBossActive}>Reset Special Rules</Button></div><p className="developer-debug-note"><Status tone="warning">NO REWARDS</Status> Jump and restart only set up an encounter; they do not increment boss kills.</p></Card>
    <Card title="Boss HP controls"><div className="button-row">{[100, 75, 50, 25, 10].map((percent) => <Button key={percent} variant="secondary" onClick={() => applyPercent(percent)} disabled={!combat.enemyId}>{percent}%</Button>)}<Button variant="danger" onClick={() => applyPercent(100 / Math.max(1, combat.enemyMaxHp))} disabled={!combat.enemyId}>1 HP</Button></div><NumberField label="Custom HP %" value={customPercent} onChange={(value) => { const next = Math.max(0, Math.min(100, value)); setCustomPercent(next); applyPercent(next) }} /></Card>
    <Card title="Boss cleanup"><div className="button-row"><Button variant="ghost" onClick={clearStatuses} disabled={!isBossActive}>Clear Enemy Statuses</Button><Button variant="ghost" onClick={clearBarrier} disabled={!isBossActive}>Clear Enemy Barrier</Button></div></Card>
  </div>
}
