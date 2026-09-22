import { useState } from 'react'
import { Button, Card, GameTooltip, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { DUNGEONS, DUNGEON_ORDER, isDungeonUnlocked } from '../../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../../game/content/monsters'
import { getCombatEncounterMode, getCombatLocationByDungeonId } from '../../../game/content/world-navigation'
import type { DungeonId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'
import { NumberField, Summary } from '../DeveloperTabPrimitives'
import { resolveBossThreatRequirement } from '../../../game/systems/combat/combatThreat'
import { formatNumber } from '../../../game/utils'

export function DeveloperCombatEncounter() {
  const [selectedDungeonId, setSelectedDungeonId] = useState<DungeonId>('whispering-woods')
  const [customCount, setCustomCount] = useState(20)
  const [stopAtBossReady, setStopAtBossReady] = useState(true)
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const enter = useGameStore((state) => state.enterDungeon)
  const leave = useGameStore((state) => state.leaveDungeon)
  const spawn = useGameStore((state) => state.spawnDebugEnemy)
  const kill = useGameStore((state) => state.killCurrentEnemy)
  const despawn = useGameStore((state) => state.despawnDebugEnemy)
  const fastResolve = useGameStore((state) => state.fastResolveDebugEnemies)
  const clearToBoss = useGameStore((state) => state.clearDebugThreatToBoss)
  const jumpBoss = useGameStore((state) => state.jumpDebugToBoss)
  const dungeon = DUNGEONS[selectedDungeonId]
  const worldTier = useGameStore((state) => state.worldTier.current)
  const threatRequired = resolveBossThreatRequirement(dungeon.id, worldTier)
  const unlocked = isDungeonUnlocked(dungeon, progress)
  const sequenceMode = getCombatEncounterMode(getCombatLocationByDungeonId(selectedDungeonId)) === 'sequence'
  const sequenceTotal = (dungeon.encounterSequence?.length ?? 0) + 1
  const activeSelectedRun = combat.active && combat.dungeonId === selectedDungeonId
  const sequenceStep = sequenceMode && activeSelectedRun && combat.dungeonSequenceIndex !== null
    ? Math.min(sequenceTotal, combat.dungeonSequenceIndex + 1)
    : null
  const sequenceControlTooltip = <TooltipContent title="Sequence Dungeon" description="This location advances through fixed authored steps. Threat progress and Boss-ready jumps do not apply." />

  return <div className="developer-tab-grid">
    <Card title={sequenceMode ? 'Sequence run setup' : 'Location setup'}>
      <label className="developer-number-field">Selected Location<select aria-label="Location to enter" value={selectedDungeonId} onChange={(event) => setSelectedDungeonId(event.target.value as DungeonId)}>{DUNGEON_ORDER.map((id) => <option key={id} value={id}>{DUNGEONS[id].name}</option>)}</select></label>
      <div className="developer-summary-grid"><Summary label="Unlock" value={unlocked ? 'Unlocked' : 'Locked (debug actions still allowed)'} />{sequenceMode ? <Summary label="Run" value={sequenceStep ? `Step ${sequenceStep} / ${sequenceTotal}` : `${sequenceTotal} fixed steps`} /> : <Summary label="Threat" value={`${formatNumber(combat.threatCleared)} / ${formatNumber(threatRequired)}`} />}<Summary label={sequenceMode ? 'Final Boss' : 'Boss'} value={MONSTERS[dungeon.boss].name} /><Summary label={sequenceMode ? 'Steps' : 'Normal pool'} value={sequenceMode ? sequenceTotal : dungeon.monsterPool.length} /></div>
      <div className="button-row"><Button onClick={() => enter(selectedDungeonId)}>Enter selected location</Button><Button variant="secondary" onClick={leave}>Leave {sequenceMode ? 'Run' : 'Location'}</Button><Button variant="danger" onClick={kill} disabled={!combat.enemyId}>Kill Current · Normal Resolution</Button><Button variant="ghost" onClick={despawn} disabled={!combat.enemyId}>Despawn Current · No Rewards</Button></div>
      <p className="developer-debug-note"><Status tone="warning">PROGRESSION</Status> Kill and Fast Resolve use normal reward/progression resolution and change the current profile state.</p>
    </Card>
    <Card title={sequenceMode ? 'Fast resolve sequence steps' : 'Fast resolve normal enemies'} className="developer-danger-card">
      <div className="button-row"><Button variant="secondary" onClick={() => fastResolve(1, selectedDungeonId, stopAtBossReady)}>Fast Resolve 1</Button><Button variant="secondary" onClick={() => fastResolve(5, selectedDungeonId, stopAtBossReady)}>Fast Resolve 5</Button><Button variant="secondary" onClick={() => fastResolve(20, selectedDungeonId, stopAtBossReady)}>Fast Resolve 20</Button><Button variant="secondary" onClick={() => fastResolve(100, selectedDungeonId, stopAtBossReady)}>Fast Resolve 100</Button></div>
      <div className="developer-form-grid"><NumberField label="Custom N (1–1000)" value={customCount} onChange={(value) => setCustomCount(Math.max(1, Math.min(1000, Math.floor(value))))} /><GameTooltip content={sequenceControlTooltip}><label className="developer-check-row"><input type="checkbox" checked={stopAtBossReady} disabled={sequenceMode} onChange={(event) => setStopAtBossReady(event.target.checked)} /> Stop when boss is ready</label></GameTooltip></div>
      <div className="button-row"><Button onClick={() => fastResolve(customCount, selectedDungeonId, stopAtBossReady)}>Fast Resolve Custom</Button><Button variant="danger" disabled={sequenceMode} tooltip={sequenceMode ? sequenceControlTooltip : undefined} onClick={() => clearToBoss(selectedDungeonId)}>Clear to Boss</Button><Button variant="secondary" disabled={sequenceMode} tooltip={sequenceMode ? sequenceControlTooltip : undefined} onClick={() => jumpBoss(selectedDungeonId)}>Jump to Boss</Button></div>
      <p className="muted">Fast Resolve skips encounter delays, never simulates damage, and never kills the boss. {sequenceMode ? 'Sequence runs advance through fixed steps; use Fast Resolve to move through the authored route.' : 'Enemy Immortal does not block these forced developer kills.'}</p>
    </Card>
    <Card title="Spawn authored encounters"><div className="developer-button-grid">{dungeon.monsterPool.map((id) => <Button key={id} variant="ghost" onClick={() => spawn(id, selectedDungeonId)}>Spawn {MONSTERS[id].name}</Button>)}</div><div className="developer-button-grid developer-boss-list"><Button variant="danger" onClick={() => spawn(dungeon.boss, selectedDungeonId)}>Spawn Boss · {MONSTERS[dungeon.boss].name}</Button></div><p className="muted">Spawning replaces the current encounter without rewards. Boss actions are kept separate from normal monsters.</p></Card>
  </div>
}
