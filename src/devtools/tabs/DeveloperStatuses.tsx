import { useEffect, useMemo, useState } from 'react'
import { Button, Card, FilterBar, Status, type FilterOption } from '../../components/ui'
import { formatDuration, formatReadableId } from '../../game/content/presentation/balanceFormatters'
import { STATUS_DEFINITIONS, STATUS_ORDER } from '../../game/content/statuses/statuses'
import type { ActiveStatus } from '../../game/systems/combat/combatTypes'
import type { StatusId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { DeveloperAdvancedSection, DeveloperBrowser, DeveloperBrowserLayout, DeveloperSection } from '../components/DeveloperBrowser'
import { getDeveloperStatusView } from '../developerReadModels'

type StatusFilter = 'all' | 'buff' | 'debuff' | 'control' | 'dot'
const FILTERS: readonly FilterOption<StatusFilter>[] = [{ value: 'all', label: 'ALL' }, { value: 'buff', label: 'BUFFS' }, { value: 'debuff', label: 'DEBUFFS' }, { value: 'control', label: 'CONTROL' }, { value: 'dot', label: 'DOT / HOT' }]

export function DeveloperStatuses() {
  const applyPlayer = useGameStore((state) => state.applyPlayerStatus)
  const applyEnemy = useGameStore((state) => state.applyEnemyStatus)
  const removePlayer = useGameStore((state) => state.removePlayerStatus)
  const removeEnemy = useGameStore((state) => state.removeEnemyStatus)
  const clearPlayer = useGameStore((state) => state.clearPlayerStatuses)
  const clearEnemy = useGameStore((state) => state.clearEnemyStatuses)
  const playerStatuses = useGameStore((state) => state.combat.playerStatuses)
  const enemyStatuses = useGameStore((state) => state.combat.enemyStatuses)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [selected, setSelected] = useState<StatusId | null>('burning')
  const options = useMemo(() => STATUS_ORDER.filter((id) => { const status = STATUS_DEFINITIONS[id]; return `${status.name} ${status.description} ${status.tags.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()) && (filter === 'all' || filter === status.classification || filter === 'control' && status.tags.includes('control') || filter === 'dot' && (status.tags.includes('dot') || status.tags.includes('hot'))) }), [filter, query])
  const selectedStatus = selected ? STATUS_DEFINITIONS[selected] : null
  useEffect(() => { if (options.length === 0) setSelected(null); else if (!selected || !options.includes(selected)) setSelected(options[0]) }, [options, selected])
  const playerCount = playerStatuses.filter((status) => status.statusId === selected).length
  const enemyCount = enemyStatuses.filter((status) => status.statusId === selected).length
  const applyPlayerThree = () => { if (selected) { applyPlayer(selected); applyPlayer(selected); applyPlayer(selected) } }
  const applyEnemyThree = () => { if (selected) { applyEnemy(selected); applyEnemy(selected); applyEnemy(selected) } }

  return <div className="developer-tab-stack"><Card title="Status browser" className="developer-browser-card"><div className="developer-filter-stack"><label>Search statuses<input aria-label="Search statuses" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, classification, effect..." /></label><div className="developer-filter-label">CLASSIFICATION / TAG<FilterBar options={FILTERS} value={filter} onChange={setFilter} ariaLabel="Developer status filter" /></div></div><DeveloperBrowserLayout browser={<><div className="developer-browser-heading"><strong>{options.length} authored statuses</strong><small>Inspect human-readable effects, duration, stacking, and active instances.</small></div><DeveloperBrowser items={options.map((id) => { const status = STATUS_DEFINITIONS[id]; return { id, label: status.name, icon: status.ui?.icon ?? '◇', meta: `${formatReadableId(status.classification)} · ${formatDuration(status.defaultDurationMs)}`, status: <Status tone={status.classification === 'debuff' ? 'warning' : 'success'}>{status.classification}</Status> } })} selectedId={selected} onSelect={(id) => setSelected(id as StatusId)} emptyMessage="No matching statuses." /></>} inspector={selectedStatus && selected ? <StatusInspector statusId={selected} playerStatuses={playerStatuses} enemyStatuses={enemyStatuses} playerCount={playerCount} enemyCount={enemyCount} applyPlayer={applyPlayer} applyEnemy={applyEnemy} applyPlayerThree={applyPlayerThree} applyEnemyThree={applyEnemyThree} removePlayer={removePlayer} removeEnemy={removeEnemy} clearPlayer={clearPlayer} clearEnemy={clearEnemy} /> : <div className="developer-browser-empty"><strong>No matching statuses</strong><small>Change the search or filter.</small></div>} /></Card></div>
}

function StatusInspector({ statusId, playerStatuses, enemyStatuses, playerCount, enemyCount, applyPlayer, applyEnemy, applyPlayerThree, applyEnemyThree, removePlayer, removeEnemy, clearPlayer, clearEnemy }: { statusId: StatusId; playerStatuses: ActiveStatus[]; enemyStatuses: ActiveStatus[]; playerCount: number; enemyCount: number; applyPlayer: (id: StatusId) => void; applyEnemy: (id: StatusId) => void; applyPlayerThree: () => void; applyEnemyThree: () => void; removePlayer: (id: StatusId) => void; removeEnemy: (id: StatusId) => void; clearPlayer: () => void; clearEnemy: () => void }) {
  const status = STATUS_DEFINITIONS[statusId]
  const state = useGameStore()
  const view = getDeveloperStatusView(state, statusId)
  const instances = (label: string, entries: ActiveStatus[]) => <div className="developer-relation-list">{entries.filter((entry) => entry.statusId === statusId).map((entry) => <span key={entry.instanceKey}><strong>{label} · {entry.stacks} {entry.stacks === 1 ? 'stack' : 'stacks'}</strong><small>{entry.remainingMs === null ? 'Indefinite duration' : `${formatDuration(entry.remainingMs)} remaining`} · source: {formatReadableId(entry.source.kind)}</small></span>)}{entries.every((entry) => entry.statusId !== statusId) && <span className="muted">No active instance.</span>}</div>
  return <>
    <div className="developer-inspector-title"><div><h2>{view.name}</h2><small className="muted">{view.classification} · {view.duration}</small></div><Status tone={status.classification === 'debuff' ? 'warning' : 'success'}>{status.classification.toUpperCase()}</Status></div>
    <DeveloperSection title="Status details"><p className="muted">{status.description}</p><div className="developer-detail-grid"><span>DURATION<strong>{view.duration}</strong></span><span>STACKING<strong>{view.stacking}</strong></span><span>CLEANSE<strong>{view.cleanseable}</strong></span><span>DISPEL<strong>{view.dispellable}</strong></span><span>PLAYER INSTANCES<strong>{view.playerInstances}</strong></span><span>ENEMY INSTANCES<strong>{view.enemyInstances}</strong></span></div><div className="developer-relation-list">{status.tags.map((tag) => <span key={tag}><strong>{formatReadableId(tag)}</strong><small>Status tag</small></span>)}</div></DeveloperSection>
    {view.modifiers.length > 0 && <DeveloperSection title="Effects"><div className="developer-relation-list">{view.modifiers.map((modifier) => <span key={modifier}><strong>Modifier</strong><small>{modifier}</small></span>)}</div></DeveloperSection>}
    {view.periodic.length > 0 && <DeveloperSection title="Ongoing effect"><div className="developer-detail-grid"><span>TICK INTERVAL<strong>{view.tickEvery}</strong></span><span>EFFECTS<strong>{view.periodic.length}</strong></span></div><div className="developer-relation-list">{view.periodic.map((effect, index) => <span key={`periodic-${index}`}><strong>Tick {index + 1}</strong><small>{effect}</small></span>)}</div></DeveloperSection>}
    {view.triggers.length > 0 && <DeveloperSection title="Special triggers"><div className="developer-relation-list">{view.triggers.map((rule) => <span key={rule}><strong>Special rule</strong><small>{rule}</small></span>)}</div></DeveloperSection>}
    <DeveloperSection title="Active instances"><h4 className="developer-subheading">Player</h4>{instances('Player', playerStatuses)}<h4 className="developer-subheading">Enemy</h4>{instances('Enemy', enemyStatuses)}</DeveloperSection>
    <DeveloperSection title="Combat Lab actions"><div className="button-row"><Button onClick={() => applyPlayer(statusId)}>Apply to player</Button><Button variant="secondary" onClick={() => applyEnemy(statusId)}>Apply to enemy</Button><Button variant="secondary" onClick={applyPlayerThree}>Apply 3 applications to player</Button><Button variant="secondary" onClick={applyEnemyThree}>Apply 3 applications to enemy</Button><Button variant="ghost" onClick={() => removePlayer(statusId)} disabled={playerCount === 0}>Remove from player</Button><Button variant="ghost" onClick={() => removeEnemy(statusId)} disabled={enemyCount === 0}>Remove from enemy</Button><Button variant="ghost" onClick={clearPlayer}>Clear player statuses</Button><Button variant="ghost" onClick={clearEnemy}>Clear enemy statuses</Button></div></DeveloperSection>
    <DeveloperAdvancedSection title="Advanced status details"><span>Content identifier: <code>{status.id}</code></span><span>Application policy: <code>{status.applicationPolicy ?? 'single'}</code></span></DeveloperAdvancedSection>
  </>
}
