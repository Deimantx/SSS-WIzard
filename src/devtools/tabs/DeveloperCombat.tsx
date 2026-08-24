import { Button, Card, Progress } from '../../components/ui'
import { MONSTERS } from '../../game/data/monsters'
import type { MonsterId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

export function DeveloperCombat() {
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const enter = useGameStore((state) => state.enterDungeon)
  const leave = useGameStore((state) => state.leaveDungeon)
  const setThreat = useGameStore((state) => state.setThreat)
  const spawn = useGameStore((state) => state.spawnDebugEnemy)
  const kill = useGameStore((state) => state.killCurrentEnemy)
  const setHp = useGameStore((state) => state.setEnemyHealthPercent)
  const clearPlayer = useGameStore((state) => state.clearPlayerStatuses)
  const clearEnemy = useGameStore((state) => state.clearEnemyStatuses)
  return <div className="developer-tab-grid"><Card title="Combat state"><div className="developer-summary-grid"><Summary label="Active" value={combat.active ? 'Yes' : 'No'} /><Summary label="Dungeon" value={combat.dungeonId ?? '-'} /><Summary label="Enemy" value={combat.enemyId ? MONSTERS[combat.enemyId].name : 'None'} /><Summary label="Enemy HP" value={combat.enemyId ? `${Math.floor(combat.enemyHp)} / ${combat.enemyMaxHp}` : '-'} /><Summary label="Barrier" value={combat.enemyBarrier} /><Summary label="Threat" value={combat.threatCleared} /><Summary label="Telegraph" value={combat.enemyTelegraphActionId ?? 'None'} /><Summary label="Auto Hunt" value={progress.autoHuntBossByDungeon['whispering-woods'] ? 'On' : 'Off'} /></div>{combat.enemyId && <Progress value={combat.enemyHp / combat.enemyMaxHp * 100} tone="red" label="Enemy HP" right={`${Math.floor(combat.enemyHp)} HP`} />}</Card><Card title="Encounter controls"><div className="button-row"><Button onClick={enter}>Enter Whispering Woods</Button><Button variant="secondary" onClick={leave}>Leave Dungeon</Button><Button variant="danger" onClick={kill} disabled={!combat.enemyId}>Kill current enemy</Button></div><NumberField label="Threat cleared" value={combat.threatCleared} onChange={setThreat} /><div className="developer-button-grid">{(['forest-wisp', 'thornling', 'stone-root', 'grove-sentinel', 'forest-heart'] as MonsterId[]).map((id) => <Button key={id} variant={MONSTERS[id].boss ? 'danger' : 'ghost'} onClick={() => spawn(id)}>Spawn {MONSTERS[id].name}</Button>)}</div><div className="button-row"><Button variant="secondary" onClick={() => setHp(25)} disabled={!combat.enemyId}>Set enemy HP 25%</Button><Button variant="secondary" onClick={() => setHp(100)} disabled={!combat.enemyId}>Restore enemy HP</Button><Button variant="ghost" onClick={clearPlayer}>Clear player statuses</Button><Button variant="ghost" onClick={clearEnemy}>Clear enemy statuses</Button></div></Card></div>
}
