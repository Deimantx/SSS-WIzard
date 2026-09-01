import { useState } from 'react'
import { Button, Card, Status } from '../../../components/ui'
import { DUNGEONS, DUNGEON_ORDER, isDungeonUnlocked } from '../../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../../game/content/monsters'
import type { DungeonId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'
import { NumberField, Summary } from '../DeveloperTabPrimitives'

export function DeveloperCombatEncounter() {
  const [selectedDungeonId, setSelectedDungeonId] = useState<DungeonId>('whispering-woods')
  const [customCount, setCustomCount] = useState(20)
  const [stopAtBossReady, setStopAtBossReady] = useState(true)
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const enter = useGameStore((state) => state.enterDungeon)
  const leave = useGameStore((state) => state.leaveDungeon)
  const setThreat = useGameStore((state) => state.setThreat)
  const spawn = useGameStore((state) => state.spawnDebugEnemy)
  const kill = useGameStore((state) => state.killCurrentEnemy)
  const despawn = useGameStore((state) => state.despawnDebugEnemy)
  const fastResolve = useGameStore((state) => state.fastResolveDebugEnemies)
  const clearToBoss = useGameStore((state) => state.clearDebugThreatToBoss)
  const jumpBoss = useGameStore((state) => state.jumpDebugToBoss)
  const dungeon = DUNGEONS[selectedDungeonId]
  const unlocked = isDungeonUnlocked(dungeon, progress)
  return <div className="developer-tab-grid">
    <Card title="Dungeon setup"><label className="developer-number-field">Selected Dungeon<select aria-label="Dungeon to enter" value={selectedDungeonId} onChange={(event) => setSelectedDungeonId(event.target.value as DungeonId)}>{DUNGEON_ORDER.map((id) => <option key={id} value={id}>{DUNGEONS[id].name}</option>)}</select></label><div className="developer-summary-grid"><Summary label="Unlock" value={unlocked ? 'Unlocked' : 'Locked (debug actions still allowed)'} /><Summary label="Threat" value={`${combat.threatCleared} / ${dungeon.threatRequired}`} /><Summary label="Boss" value={MONSTERS[dungeon.boss].name} /><Summary label="Normal pool" value={dungeon.monsterPool.length} /></div><div className="button-row"><Button onClick={() => enter(selectedDungeonId)}>Enter selected dungeon</Button><Button variant="secondary" onClick={leave}>Leave Dungeon</Button><Button variant="danger" onClick={kill} disabled={!combat.enemyId}>Kill Current · Normal Resolution</Button><Button variant="ghost" onClick={despawn} disabled={!combat.enemyId}>Despawn Current · No Rewards</Button></div><p className="developer-debug-note"><Status tone="warning">PROGRESSION</Status> Kill and Fast Resolve use normal reward/progression resolution and change the current profile state.</p></Card>
    <Card title="Fast resolve normal enemies" className="developer-danger-card"><div className="button-row"><Button variant="secondary" onClick={() => fastResolve(1, selectedDungeonId, stopAtBossReady)}>Fast Resolve 1</Button><Button variant="secondary" onClick={() => fastResolve(5, selectedDungeonId, stopAtBossReady)}>Fast Resolve 5</Button><Button variant="secondary" onClick={() => fastResolve(20, selectedDungeonId, stopAtBossReady)}>Fast Resolve 20</Button><Button variant="secondary" onClick={() => fastResolve(100, selectedDungeonId, stopAtBossReady)}>Fast Resolve 100</Button></div><div className="developer-form-grid"><NumberField label="Custom N (1–1000)" value={customCount} onChange={(value) => setCustomCount(Math.max(1, Math.min(1000, Math.floor(value))))} /><label className="developer-check-row"><input type="checkbox" checked={stopAtBossReady} onChange={(event) => setStopAtBossReady(event.target.checked)} /> Stop when boss is ready</label></div><div className="button-row"><Button onClick={() => fastResolve(customCount, selectedDungeonId, stopAtBossReady)}>Fast Resolve Custom</Button><Button variant="danger" onClick={() => clearToBoss(selectedDungeonId)}>Clear to Boss</Button><Button variant="secondary" onClick={() => jumpBoss(selectedDungeonId)}>Jump to Boss</Button></div><p className="muted">Fast Resolve skips encounter delays, never simulates damage, and never kills the boss. Enemy Immortal does not block these forced developer kills.</p></Card>
    <Card title="Spawn authored encounters"><div className="developer-button-grid">{dungeon.monsterPool.map((id) => <Button key={id} variant="ghost" onClick={() => spawn(id, selectedDungeonId)}>Spawn {MONSTERS[id].name}</Button>)}</div><div className="developer-button-grid developer-boss-list"><Button variant="danger" onClick={() => spawn(dungeon.boss, selectedDungeonId)}>Spawn Boss · {MONSTERS[dungeon.boss].name}</Button></div><p className="muted">Spawning replaces the current encounter without rewards. Boss actions are kept separate from normal monsters.</p></Card>
  </div>
}
