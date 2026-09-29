import { useState } from 'react'
import { Button, Card, GameTooltip, SelectMenu, Status, Toggle } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { DUNGEONS, DUNGEON_ORDER, hasBossEncounter, isDungeonUnlocked } from '../../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../../game/content/monsters'
import { getCombatEncounterMode, getCombatLocationByDungeonId } from '../../../game/content/world-navigation'
import type { DungeonId } from '../../../game/types'
import { useDeveloperGameStore as useGameStore } from '../../developerSandbox'
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
  const bossId = hasBossEncounter(dungeon) ? dungeon.boss : null
  const activeSelectedRun = combat.active && combat.dungeonId === selectedDungeonId
  const sequenceStep = sequenceMode && activeSelectedRun && combat.dungeonSequenceIndex !== null
    ? Math.min(sequenceTotal, combat.dungeonSequenceIndex + 1)
    : null
  const bossControlTooltip = <TooltipContent title={sequenceMode ? 'Sequence Dungeon' : 'Bossless Location'} description={sequenceMode ? 'This location advances through fixed authored steps. Threat progress and Boss-ready jumps do not apply.' : `${dungeon.name} has no Boss encounter. Threat progress and Boss-ready controls do not apply.`} />

  return <div className="developer-tab-grid">
    <Card title={sequenceMode ? 'Sequence run setup' : 'Location setup'}>
      <div className="developer-number-field"><span>Selected Location</span><SelectMenu options={DUNGEON_ORDER.map((id) => ({ value: id, label: DUNGEONS[id].name }))} ariaLabel="Location to enter" value={selectedDungeonId} onChange={setSelectedDungeonId} /></div>
      <div className="developer-summary-grid"><Summary label="Unlock" value={unlocked ? 'Unlocked' : 'Locked (debug actions still allowed)'} />{sequenceMode ? <Summary label="Run" value={sequenceStep ? `Step ${sequenceStep} / ${sequenceTotal}` : `${sequenceTotal} fixed steps`} /> : hasBossEncounter(dungeon) ? <Summary label="Threat" value={`${formatNumber(combat.threatCleared)} / ${formatNumber(threatRequired)}`} /> : <Summary label="Combat model" value="Bossless location" />}<Summary label={sequenceMode ? 'Final Boss' : 'Boss'} value={bossId ? MONSTERS[bossId].name : 'None'} /><Summary label={sequenceMode ? 'Steps' : 'Normal pool'} value={sequenceMode ? sequenceTotal : dungeon.monsterPool.length} /></div>
      <div className="button-row"><Button onClick={() => enter(selectedDungeonId)}>Enter selected location</Button><Button variant="secondary" onClick={leave}>Leave {sequenceMode ? 'Run' : 'Location'}</Button><Button variant="danger" onClick={kill} disabled={!combat.enemyId}>Kill Current · Normal Resolution</Button><Button variant="ghost" onClick={despawn} disabled={!combat.enemyId}>Despawn Current · No Rewards</Button></div>
      <p className="developer-debug-note"><Status tone="warning">PROGRESSION</Status> Kill and Fast Resolve use normal reward/progression resolution and change the current profile state.</p>
    </Card>
    <Card title={sequenceMode ? 'Fast resolve sequence steps' : 'Fast resolve normal enemies'} className="developer-danger-card">
      <div className="button-row"><Button variant="secondary" onClick={() => fastResolve(1, selectedDungeonId, stopAtBossReady)}>Fast Resolve 1</Button><Button variant="secondary" onClick={() => fastResolve(5, selectedDungeonId, stopAtBossReady)}>Fast Resolve 5</Button><Button variant="secondary" onClick={() => fastResolve(20, selectedDungeonId, stopAtBossReady)}>Fast Resolve 20</Button><Button variant="secondary" onClick={() => fastResolve(100, selectedDungeonId, stopAtBossReady)}>Fast Resolve 100</Button></div>
      <div className="developer-form-grid"><NumberField label="Custom N (1–1000)" value={customCount} onChange={(value) => setCustomCount(Math.max(1, Math.min(1000, Math.floor(value))))} /><Toggle label={hasBossEncounter(dungeon) && !sequenceMode ? 'Stop when boss is ready' : 'Boss-ready stop unavailable'} description={sequenceMode ? 'Sequence runs advance through their authored encounters without a Boss-ready stop.' : hasBossEncounter(dungeon) ? 'Stop normal encounters when this location reaches its authored Boss threshold.' : 'Bossless locations have no Boss-ready state; fast resolve continues through requested targets.'} checked={stopAtBossReady} onChange={setStopAtBossReady} disabled={!hasBossEncounter(dungeon) || sequenceMode} className="developer-check-row" /></div>
      <div className="button-row"><Button onClick={() => fastResolve(customCount, selectedDungeonId, stopAtBossReady)}>Fast Resolve Custom</Button><Button variant="danger" disabled={sequenceMode || !bossId} tooltip={sequenceMode || !bossId ? bossControlTooltip : undefined} onClick={() => clearToBoss(selectedDungeonId)}>Clear to Boss</Button><Button variant="secondary" disabled={sequenceMode || !bossId} tooltip={sequenceMode || !bossId ? bossControlTooltip : undefined} onClick={() => jumpBoss(selectedDungeonId)}>Jump to Boss</Button></div>
      <p className="muted">Fast Resolve skips encounter delays, never simulates damage, and never kills the boss. {sequenceMode ? 'Sequence runs advance through fixed steps; use Fast Resolve to move through the authored route.' : 'Enemy Immortal does not block these forced developer kills.'}</p>
    </Card>
    <Card title="Spawn authored encounters"><div className="developer-button-grid">{dungeon.monsterPool.map((id) => <Button key={id} variant="ghost" onClick={() => spawn(id, selectedDungeonId)}>Spawn {MONSTERS[id].name}</Button>)}</div>{bossId && <div className="developer-button-grid developer-boss-list"><Button variant="danger" onClick={() => spawn(bossId, selectedDungeonId)}>Spawn Boss · {MONSTERS[bossId].name}</Button></div>}<p className="muted">Spawning replaces the current encounter without rewards. Boss actions are kept separate from normal monsters.</p></Card>
  </div>
}
