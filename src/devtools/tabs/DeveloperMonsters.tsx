import { useEffect, useMemo, useState } from 'react'
import { Button, Card, FilterBar, Status, type FilterOption } from '../../components/ui'
import { DUNGEONS, DUNGEON_ORDER } from '../../game/content/dungeons/dungeons'
import { getMonsterDungeon } from '../../game/content/contentRelations'
import { ITEMS } from '../../game/content/items/items'
import { MONSTERS, MONSTER_IDS, isBossMonster } from '../../game/content/monsters'
import { getTraitDefinition } from '../../game/content/traits/traits'
import { formatCombatEffect, formatCombatModifier, formatDuration, formatPercent, formatReadableId } from '../../game/content/presentation/balanceFormatters'
import type { DamageType, DungeonId, MonsterId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { DeveloperAdvancedSection, DeveloperBrowser, DeveloperBrowserLayout, DeveloperSection } from '../components/DeveloperBrowser'
import { getDeveloperMonsterView } from '../developerReadModels'
import { NumberField } from './DeveloperTabPrimitives'

type MonsterFilter = 'all' | 'normal' | 'boss' | DungeonId
const DAMAGE_TYPES: readonly DamageType[] = ['physical', 'arcane', 'fire', 'water', 'earth', 'air']
const FILTERS: readonly FilterOption<MonsterFilter>[] = [{ value: 'all', label: 'ALL' }, { value: 'normal', label: 'NORMAL' }, { value: 'boss', label: 'BOSSES' }, ...DUNGEON_ORDER.map((id) => ({ value: id, label: DUNGEONS[id].name.toUpperCase() }))]

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
    const traitText = monster.traitIds.map((traitId) => `${getTraitDefinition(traitId)?.name ?? ''} ${getTraitDefinition(traitId)?.description ?? ''}`).join(' ')
    const actionText = Object.values(monster.actions).map((action) => `${action.name} ${action.description}`).join(' ')
    const text = `${monster.name} ${monster.subtitle} ${dungeon?.dungeonName ?? ''} ${traitText} ${actionText}`.toLowerCase()
    return text.includes(query.trim().toLowerCase()) && (filter === 'all' || filter === monster.bestiaryCategory || filter === dungeon?.dungeonId)
  }), [filter, query])
  const selectedMonster = selected ? MONSTERS[selected] : null
  useEffect(() => { if (options.length === 0) setSelected(null); else if (!selected || !options.includes(selected)) setSelected(options[0]) }, [options, selected])

  return <div className="developer-tab-stack"><Card title="Monster browser" className="developer-browser-card"><div className="developer-filter-stack"><label>Search monsters<input aria-label="Search monsters" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, dungeon, trait, special..." /></label><div className="developer-filter-label">DUNGEON / TYPE<FilterBar options={FILTERS} value={filter} onChange={setFilter} ariaLabel="Developer monster filter" /></div></div><DeveloperBrowserLayout browser={<><div className="developer-browser-heading"><strong>{options.length} authored monsters</strong><small>Inspect resolved combat values, readable effects, encounter patterns, and loot.</small></div><DeveloperBrowser items={options.map((id) => { const monster = MONSTERS[id]; const dungeon = getMonsterDungeon(id); const kills = progress.lifetimeKillsByMonster[id] ?? 0; const bossKills = progress.bossKillsByBoss[id] ?? 0; return { id, label: monster.name, icon: monster.ui?.portraitIcon ?? '◆', accent: monster.color, meta: `${dungeon?.dungeonName ?? 'Unassigned'} · ${monster.maxHealth} HP · ${kills} kills${isBossMonster(monster) ? ` · ${bossKills} boss kills` : ''}`, status: isBossMonster(monster) ? <Status tone="warning">BOSS</Status> : <Status>MONSTER</Status> } })} selectedId={selected} onSelect={(id) => setSelected(id as MonsterId)} emptyMessage="No matching monsters." /></>} inspector={selectedMonster && selected ? <MonsterInspector monsterId={selected} healthPercent={healthPercent} setHealthPercent={setHealthPercent} barrier={barrier} setBarrierValue={setBarrierValue} combat={combat} spawn={spawn} setHealth={setHealth} setBarrier={setBarrier} setThreat={setThreat} kill={kill} clearStatuses={clearStatuses} forceAction={forceAction} startAction={startAction} resolveAction={resolveAction} advanceAction={advanceAction} setPattern={setPattern} next={next} jumpBoss={jumpBoss} /> : <div className="developer-browser-empty"><strong>No matching monsters</strong><small>Change the search or filter.</small></div>} /></Card></div>
}

function MonsterInspector({ monsterId, healthPercent, setHealthPercent, barrier, setBarrierValue, combat, spawn, setHealth, setBarrier, setThreat, kill, clearStatuses, forceAction, startAction, resolveAction, advanceAction, setPattern, next, jumpBoss }: { monsterId: MonsterId; healthPercent: number; setHealthPercent: (value: number) => void; barrier: number; setBarrierValue: (value: number) => void; combat: ReturnType<typeof useGameStore.getState>['combat']; spawn: ReturnType<typeof useGameStore.getState>['spawnDebugEnemy']; setHealth: ReturnType<typeof useGameStore.getState>['setEnemyHealthPercent']; setBarrier: ReturnType<typeof useGameStore.getState>['setEnemyBarrier']; setThreat: ReturnType<typeof useGameStore.getState>['setThreat']; kill: ReturnType<typeof useGameStore.getState>['killCurrentEnemy']; clearStatuses: ReturnType<typeof useGameStore.getState>['clearEnemyStatuses']; forceAction: ReturnType<typeof useGameStore.getState>['forceEnemyAction']; startAction: ReturnType<typeof useGameStore.getState>['startEnemyAction']; resolveAction: ReturnType<typeof useGameStore.getState>['resolveCurrentEnemyAction']; advanceAction: ReturnType<typeof useGameStore.getState>['advanceEnemyAction']; setPattern: ReturnType<typeof useGameStore.getState>['setEnemyActionPattern']; next: ReturnType<typeof useGameStore.getState>['fastResolveDebugEnemies']; jumpBoss: ReturnType<typeof useGameStore.getState>['jumpDebugToBoss'] }) {
  const monster = MONSTERS[monsterId]
  const dungeon = getMonsterDungeon(monsterId)
  const state = useGameStore()
  const view = getDeveloperMonsterView(state, monsterId)
  return <>
    <div className="developer-inspector-title"><span className="developer-browser-icon" style={{ color: monster.color }}>{monster.ui?.portraitIcon ?? '◆'}</span><div><h2>{view.name}</h2><small className="muted">{view.dungeon} · {view.role}</small></div><Status tone={isBossMonster(monster) ? 'warning' : 'neutral'}>{isBossMonster(monster) ? 'BOSS' : 'NORMAL'}</Status></div>
    <DeveloperSection title="Combat stats"><div className="developer-detail-grid"><span>MAX HEALTH<strong>{view.maxHealth}</strong></span><span>BASIC DAMAGE<strong>{view.basicDamage}</strong></span><span>BASIC ATTACK<strong>{view.attackTime}</strong></span><span>DEFENSE<strong>{view.defense}</strong></span><span>CRITICAL CHANCE<strong>{formatPercent(view.critChance)}</strong></span><span>CRITICAL DAMAGE<strong>{formatPercent(view.critDamage)}</strong></span><span>BLOCK CHANCE<strong>{formatPercent(view.blockChance)}</strong></span><span>NORMAL KILLS<strong>{view.kills}</strong></span><span>BOSS KILLS<strong>{view.bossKills}</strong></span></div><p className="muted">{monster.subtitle}</p></DeveloperSection>
    <DeveloperSection title="Dungeon and defenses"><p className="developer-relation-line"><strong>{dungeon?.dungeonName ?? 'No dungeon relation'}</strong> · {dungeon?.role === 'boss' ? 'Boss encounter' : 'Normal encounter'}</p><div className="developer-stat-list">{DAMAGE_TYPES.map((type) => <span key={type}><small>{formatReadableId(type)} resistance</small><strong>{formatPercent(monster.resistances?.[type] ?? 0)}</strong></span>)}{monster.damageImmunities?.map((type) => <span key={`immune-${type}`}><small>Damage immunity</small><strong>{formatReadableId(type)}</strong></span>)}{monster.statusImmunities?.map((type) => <span key={`status-${type}`}><small>Status immunity</small><strong>{formatReadableId(type)}</strong></span>)}{monster.statusTagImmunities?.map((type) => <span key={`tag-${type}`}><small>Status tag immunity</small><strong>{formatReadableId(type)}</strong></span>)}</div></DeveloperSection>
    <DeveloperSection title="Traits and specials"><div className="developer-relation-list">{monster.traitIds.map((id) => { const trait = getTraitDefinition(id); return <span key={id}><strong>{trait?.name ?? formatReadableId(id)}</strong><small>{trait?.description ?? 'No description available.'}</small>{trait?.modifiers?.map((modifier) => <small key={`${id}-${modifier.key}`}>{formatCombatModifier(modifier)}</small>)}{trait?.rules?.map((rule) => <small key={rule.id}>{rule.effects.map((effect) => formatCombatEffect(effect)).join('; ')}</small>)}</span> })}</div></DeveloperSection>
    <DeveloperSection title="Encounter actions"><div className="developer-relation-list">{Object.values(monster.actions).map((action) => <span key={action.id}><strong>{action.name}</strong><small>{action.description} · action time: {formatDuration(action.actionTimeMs)}</small><small>{action.effects.map((effect) => formatCombatEffect(effect)).join('; ') || 'No direct effect.'}</small></span>)}</div><div className="developer-relation-list">{view.patternNames.map((pattern) => <span key={pattern.name}><strong>{pattern.name} pattern</strong><small>{pattern.steps.join(' → ')}</small></span>)}</div></DeveloperSection>
    <DeveloperSection title="Loot"><div className="developer-relation-list">{monster.loot.map((drop) => <span key={drop.itemId}><strong>{ITEMS[drop.itemId]?.name ?? formatReadableId(drop.itemId)}</strong><small>{drop.min}–{drop.max} items · {formatPercent(drop.chance)} chance</small></span>)}</div></DeveloperSection>
    <DeveloperSection title="Combat Lab actions"><div className="button-row"><Button onClick={() => spawn(monsterId, dungeon?.dungeonId)}>Spawn selected</Button><Button variant="secondary" onClick={() => setHealth(healthPercent)}>Set HP %</Button><Button variant="danger" onClick={kill} disabled={combat.enemyId !== monsterId}>Kill current</Button><Button variant="secondary" onClick={clearStatuses} disabled={!combat.enemyId}>Clear enemy statuses</Button><Button variant="secondary" onClick={() => next(1, dungeon?.dungeonId)}>Next enemy</Button>{isBossMonster(monster) && <Button variant="secondary" onClick={() => jumpBoss(dungeon?.dungeonId)}>Jump to boss</Button>}</div><div className="developer-form-grid"><NumberField label="Enemy HP percent" value={healthPercent} onChange={(value) => setHealthPercent(Math.max(1, Math.min(100, Math.floor(value))))} /><NumberField label="Enemy Barrier" value={barrier} onChange={(value) => setBarrierValue(Math.max(0, Math.floor(value)))} /><NumberField label="Threat cleared" value={combat.threatCleared} onChange={(value) => setThreat(Math.max(0, Math.floor(value)))} /></div><div className="button-row"><Button variant="secondary" onClick={() => setBarrier(barrier)} disabled={!combat.enemyId}>Set enemy barrier</Button>{Object.values(monster.actions).map((action) => <Button key={action.id} variant="ghost" onClick={() => forceAction(action.id)} disabled={combat.enemyId !== monsterId}>{`Force ${action.name}`}</Button>)}{Object.values(monster.actions).map((action) => <Button key={`start-${action.id}`} variant="ghost" onClick={() => startAction(action.id)} disabled={combat.enemyId !== monsterId}>{`Start ${action.name}`}</Button>)}<Button variant="ghost" onClick={advanceAction} disabled={combat.enemyId !== monsterId}>Advance action</Button><Button variant="ghost" onClick={() => setPattern(monster.defaultActionPatternId)} disabled={combat.enemyId !== monsterId}>Reset pattern</Button><Button variant="ghost" onClick={resolveAction} disabled={combat.enemyId !== monsterId}>Resolve action</Button></div></DeveloperSection>
    <DeveloperAdvancedSection title="Advanced monster details"><span>Content identifier: <code>{monster.id}</code></span><span>Default pattern identifier: <code>{monster.defaultActionPatternId}</code></span></DeveloperAdvancedSection>
  </>
}
