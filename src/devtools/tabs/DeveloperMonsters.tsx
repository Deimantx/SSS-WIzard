import { useEffect, useMemo, useState } from 'react'
import { Button, Card, FilterBar, Status, type FilterOption } from '../../components/ui'
import { DUNGEONS, DUNGEON_ORDER } from '../../game/content/dungeons/dungeons'
import { MONSTERS, MONSTER_IDS, isBossMonster } from '../../game/content/monsters'
import { getMonsterDungeon } from '../../game/content/contentRelations'
import { getTraitDefinition } from '../../game/content/traits/traits'
import type { DungeonId, MonsterId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { DeveloperBrowser, DeveloperBrowserLayout, DeveloperSection } from '../components/DeveloperBrowser'
import { NumberField } from './DeveloperTabPrimitives'

type MonsterFilter = 'all' | 'normal' | 'boss' | DungeonId
const FILTERS: readonly FilterOption<MonsterFilter>[] = [
  { value: 'all', label: 'ALL' }, { value: 'normal', label: 'NORMAL' }, { value: 'boss', label: 'BOSSES' },
  ...DUNGEON_ORDER.map((id) => ({ value: id, label: DUNGEONS[id].name.toUpperCase() })),
]

export function DeveloperMonsters() {
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const spawn = useGameStore((state) => state.spawnDebugEnemy)
  const setHealth = useGameStore((state) => state.setEnemyHealthPercent)
  const setBarrier = useGameStore((state) => state.setEnemyBarrier)
  const setThreat = useGameStore((state) => state.setThreat)
  const kill = useGameStore((state) => state.killCurrentEnemy)
  const clearStatuses = useGameStore((state) => state.clearEnemyStatuses)
  const forceAction = useGameStore((state) => state.forceEnemyAction)
  const startAction = useGameStore((state) => state.startEnemyAction)
  const resolveAction = useGameStore((state) => state.resolveCurrentEnemyAction)
  const advanceAction = useGameStore((state) => state.advanceEnemyAction)
  const setPattern = useGameStore((state) => state.setEnemyActionPattern)
  const next = useGameStore((state) => state.fastResolveDebugEnemies)
  const jumpBoss = useGameStore((state) => state.jumpDebugToBoss)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<MonsterFilter>('all')
  const [selected, setSelected] = useState<MonsterId | null>('forest-wisp')
  const [healthPercent, setHealthPercent] = useState(50)
  const [barrier, setBarrierValue] = useState(0)
  const options = useMemo(() => MONSTER_IDS.filter((id) => {
    const monster = MONSTERS[id]
    const dungeon = getMonsterDungeon(id)
    const traitText = monster.traitIds.map((traitId) => `${traitId} ${getTraitDefinition(traitId)?.name ?? ''} ${getTraitDefinition(traitId)?.description ?? ''}`).join(' ')
    const actionText = Object.values(monster.actions).map((action) => `${action.id} ${action.name} ${action.description}`).join(' ')
    const text = `${id} ${monster.name} ${monster.subtitle} ${dungeon?.dungeonName ?? ''} ${traitText} ${actionText}`.toLowerCase()
    return text.includes(query.trim().toLowerCase()) && (filter === 'all' || filter === monster.bestiaryCategory || filter === dungeon?.dungeonId)
  }), [filter, query])
  const selectedMonster = selected ? MONSTERS[selected] : null
  useEffect(() => { if (options.length === 0) setSelected(null); else if (!selected || !options.includes(selected)) setSelected(options[0]) }, [options, selected])

  return <div className="developer-tab-stack"><Card title="Monster browser" className="developer-browser-card"><div className="developer-filter-stack"><label>Search monsters<input aria-label="Search monsters" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, ID, trait, special..." /></label><div className="developer-filter-label">DUNGEON / TYPE<FilterBar options={FILTERS} value={filter} onChange={setFilter} ariaLabel="Developer monster filter" /></div></div><DeveloperBrowserLayout browser={<><div className="developer-browser-heading"><strong>{options.length} authored monsters</strong><small>MONSTERS and DUNGEONS are the runtime source.</small></div><DeveloperBrowser items={options.map((id) => { const monster = MONSTERS[id]; const dungeon = getMonsterDungeon(id); const kills = progress.lifetimeKillsByMonster[id] ?? 0; const bossKills = progress.bossKillsByBoss[id] ?? 0; return { id, label: monster.name, icon: monster.ui?.portraitIcon ?? '◆', accent: monster.color, meta: `${id} · ${dungeon?.dungeonName ?? 'Unassigned'} · ${monster.maxHealth} HP · ${kills} kills${isBossMonster(monster) ? ` · ${bossKills} boss kills` : ''}`, status: isBossMonster(monster) ? <Status tone="warning">BOSS</Status> : <Status>MONSTER</Status> } })} selectedId={selected} onSelect={(id) => setSelected(id as MonsterId)} emptyMessage="No matching monsters." /></>} inspector={selectedMonster && selected ? <><div className="developer-inspector-title"><span className="developer-browser-icon" style={{ color: selectedMonster.color }}>{selectedMonster.ui?.portraitIcon ?? '◆'}</span><div><h2>{selectedMonster.name}</h2><code>{selected}</code></div><Status tone={isBossMonster(selectedMonster) ? 'warning' : 'neutral'}>{isBossMonster(selectedMonster) ? 'BOSS' : 'NORMAL'}</Status></div><DeveloperSection title="Combat stats"><div className="developer-detail-grid"><span>HP<strong>{selectedMonster.maxHealth}</strong></span><span>BASIC DAMAGE<strong>{selectedMonster.basicAttackDamage}</strong></span><span>BASIC TIME<strong>{selectedMonster.basicAttackTimeMs} ms</strong></span><span>DEFENSE<strong>{selectedMonster.defense ?? 'default'}</strong></span><span>CRIT<strong>{selectedMonster.critChance ?? 'default'}</strong></span><span>BLOCK<strong>{selectedMonster.blockChance ?? 'default'}</strong></span><span>XP REWARD<strong>[NOT DEFINED IN RUNTIME]</strong></span><span>KILLS<strong>{progress.lifetimeKillsByMonster[selected] ?? 0}</strong></span><span>BOSS KILLS<strong>{progress.bossKillsByBoss[selected] ?? 0}</strong></span></div><p className="muted">{selectedMonster.subtitle}</p></DeveloperSection><DeveloperSection title="Dungeon and defenses"><p className="developer-relation-line">{getMonsterDungeon(selected)?.dungeonName ?? 'No dungeon relation'} · {getMonsterDungeon(selected)?.role ?? 'unassigned'}</p><div className="developer-stat-list">{Object.entries(selectedMonster.resistances ?? {}).map(([type, value]) => <span key={type}><small>{type} resistance</small><strong>{value}</strong></span>)}{selectedMonster.damageImmunities?.map((type) => <span key={`immune-${type}`}><small>immune to</small><strong>{type}</strong></span>)}{selectedMonster.statusImmunities?.map((type) => <span key={`status-${type}`}><small>status immune</small><strong>{type}</strong></span>)}{selectedMonster.statusTagImmunities?.map((type) => <span key={`tag-${type}`}><small>tag immune</small><strong>{type}</strong></span>)}</div></DeveloperSection><DeveloperSection title="Traits, actions and patterns"><div className="developer-relation-list">{selectedMonster.traitIds.map((id) => <span key={id}><strong>{id}</strong><small>authored trait</small></span>)}{Object.values(selectedMonster.actions).map((action) => <span key={action.id}><strong>{action.name}</strong><small>{action.id} · {action.actionTimeMs} ms · {action.description}</small></span>)}</div><pre className="developer-json">{JSON.stringify(selectedMonster.actionPatterns, null, 2)}</pre></DeveloperSection><DeveloperSection title="Loot table"><div className="developer-relation-list">{selectedMonster.loot.map((drop) => <span key={drop.itemId}><strong>{drop.itemId}</strong><small>{drop.min}–{drop.max} · {(drop.chance * 100).toFixed(2)}% chance</small></span>)}</div></DeveloperSection><DeveloperSection title="Combat Lab actions"><div className="button-row"><Button onClick={() => spawn(selected)}>Spawn selected</Button><Button variant="secondary" onClick={() => setHealth(healthPercent)}>Set HP %</Button><Button variant="danger" onClick={kill} disabled={combat.enemyId !== selected}>Kill current</Button><Button variant="secondary" onClick={() => clearStatuses()} disabled={!combat.enemyId}>Clear Enemy Statuses</Button><Button variant="secondary" onClick={() => next(1, getMonsterDungeon(selected)?.dungeonId)}>Next enemy</Button>{isBossMonster(selectedMonster) && <Button variant="secondary" onClick={() => jumpBoss(getMonsterDungeon(selected)?.dungeonId)}>Jump to boss</Button>}</div><div className="developer-form-grid"><NumberField label="Enemy HP percent" value={healthPercent} onChange={(value) => setHealthPercent(Math.max(1, Math.min(100, Math.floor(value))))} /><NumberField label="Enemy Barrier" value={barrier} onChange={(value) => setBarrierValue(Math.max(0, Math.floor(value)))} /><NumberField label="Threat cleared" value={combat.threatCleared} onChange={(value) => setThreat(Math.max(0, Math.floor(value)))} /></div><div className="button-row"><Button variant="secondary" onClick={() => setBarrier(barrier)} disabled={!combat.enemyId}>Set Enemy Barrier</Button>{Object.values(selectedMonster.actions).map((action) => <Button key={action.id} variant="ghost" onClick={() => forceAction(action.id)} disabled={combat.enemyId !== selected}>{`Force ${action.name}`}</Button>)}{Object.values(selectedMonster.actions).map((action) => <Button key={`start-${action.id}`} variant="ghost" onClick={() => startAction(action.id)} disabled={combat.enemyId !== selected}>{`Start ${action.name}`}</Button>)}<Button variant="ghost" onClick={advanceAction} disabled={combat.enemyId !== selected}>Advance Action</Button><Button variant="ghost" onClick={() => setPattern(selectedMonster.defaultActionPatternId)} disabled={combat.enemyId !== selected}>Reset Pattern</Button><Button variant="ghost" onClick={resolveAction} disabled={combat.enemyId !== selected}>Resolve Action</Button></div></DeveloperSection></> : <div className="developer-browser-empty"><strong>No matching monsters</strong><small>Change the search or filter.</small></div>} /></Card></div>
}
