import { useState } from 'react'
import { Button, Card, Progress } from '../../components/ui'
import { isBossMonster, MONSTERS } from '../../game/data/monsters'
import { STATUS_DEFINITIONS, STATUS_ORDER } from '../../game/content/statuses'
import type { MonsterId, StatusId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

export function DeveloperCombat() {
  const [statusId, setStatusId] = useState<StatusId>('burning')
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
  const forceSpecial = useGameStore((state) => state.forceEnemySpecial)
  const clearPlayer = useGameStore((state) => state.clearPlayerStatuses)
  const clearEnemy = useGameStore((state) => state.clearEnemyStatuses)
  const enemy = combat.enemyId ? MONSTERS[combat.enemyId] : null
  return <div className="developer-tab-grid"><Card title="Combat state"><div className="developer-summary-grid"><Summary label="Active" value={combat.active ? 'Yes' : 'No'} /><Summary label="Dungeon" value={combat.dungeonId ?? '-'} /><Summary label="Enemy" value={enemy?.name ?? 'None'} /><Summary label="Enemy HP" value={combat.enemyId ? `${Math.floor(combat.enemyHp)} / ${combat.enemyMaxHp}` : '-'} /><Summary label="Player Barrier" value={combat.playerBarrier} /><Summary label="Enemy Barrier" value={combat.enemyBarrier} /><Summary label="Threat" value={combat.threatCleared} /><Summary label="Telegraph" value={combat.enemyTelegraphActionId ?? 'None'} /></div>{combat.enemyId && <Progress value={combat.enemyHp / combat.enemyMaxHp * 100} tone="red" label="Enemy HP" right={`${Math.floor(combat.enemyHp)} HP`} />}</Card><Card title="Encounter controls"><div className="button-row"><Button onClick={enter}>Enter Whispering Woods</Button><Button variant="secondary" onClick={leave}>Leave Dungeon</Button><Button variant="danger" onClick={kill} disabled={!combat.enemyId}>Kill current enemy</Button></div><NumberField label="Threat cleared" value={combat.threatCleared} onChange={setThreat} /><div className="developer-button-grid">{(Object.keys(MONSTERS) as MonsterId[]).map((id) => <Button key={id} variant={isBossMonster(MONSTERS[id]) ? 'danger' : 'ghost'} onClick={() => spawn(id)}>Spawn {MONSTERS[id].name}</Button>)}</div><div className="button-row"><Button variant="secondary" onClick={() => setHp(25)} disabled={!combat.enemyId}>Set enemy HP 25%</Button><Button variant="secondary" onClick={() => setHp(100)} disabled={!combat.enemyId}>Restore enemy HP</Button><Button variant="ghost" onClick={clearPlayer}>Clear player statuses</Button><Button variant="ghost" onClick={clearEnemy}>Clear enemy statuses</Button></div></Card><Card title="Universal status tester"><label className="developer-number-field">Status<select aria-label="Status to apply" value={statusId} onChange={(event) => setStatusId(event.target.value as StatusId)}>{STATUS_ORDER.map((id) => <option key={id} value={id}>{STATUS_DEFINITIONS[id].name}</option>)}</select></label><p className="muted">{STATUS_DEFINITIONS[statusId].description}</p><div className="button-row"><Button onClick={() => applyPlayer(statusId)}>Apply to player</Button><Button onClick={() => applyEnemy(statusId)}>Apply to enemy</Button></div></Card><Card title="Barrier and special testers"><div className="button-row"><NumberField label="Player Barrier" value={combat.playerBarrier} onChange={setPlayerBarrier} /><Button variant="ghost" onClick={clearPlayerBarrier}>Clear player Barrier</Button></div><div className="button-row"><NumberField label="Enemy Barrier" value={combat.enemyBarrier} onChange={setEnemyBarrier} /><Button variant="ghost" onClick={clearEnemyBarrier}>Clear enemy Barrier</Button></div>{enemy && <div className="developer-button-grid">{Object.values(enemy.specialAttacks).map((special) => <Button key={special.id} variant="secondary" onClick={() => forceSpecial(special.id)}>Resolve {special.name}</Button>)}</div>}</Card></div>
}
