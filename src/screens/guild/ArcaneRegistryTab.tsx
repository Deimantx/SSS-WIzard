import { useEffect, useMemo, useRef, useState } from 'react'
import { Archive, Search } from 'lucide-react'
import { ArchiveItemTile, Button, Card, FilterBar, GameTooltip, SearchInput, SelectMenu, Status } from '../../components/ui'
import { ItemIcon } from '../../components/ui/item'
import { ARCANE_REGISTRY_SETS } from '../../game/content/guild/registry/registrySets'
import { GUILD_STANDINGS, isGuildStandingAtLeast } from '../../game/content/guild/guildStandings'
import { getArcaneRegistryCategories, getArcaneRegistryEntries, getArcaneRegistrySummary, isArcaneRegistryEntryAvailable } from '../../game/systems/guild/arcaneRegistry'
import { useGameStore } from '../../store/gameStore'
import { useSmartScrollState } from '../../ui/game-feel/useSmartScrollState'
import type { ItemId } from '../../game/types'

type RegistryStatus = 'All' | 'Ready' | 'Registered' | 'Unregistered' | 'Undiscovered'
const categories = [{ value: 'All', label: 'ALL' }, ...getArcaneRegistryCategories().map((category) => ({ value: category, label: category.toUpperCase() }))]
const statuses = [
  { value: 'All', label: 'ALL' },
  { value: 'Ready', label: 'READY' },
  { value: 'Registered', label: 'REGISTERED' },
  { value: 'Unregistered', label: 'UNREGISTERED' },
  { value: 'Undiscovered', label: 'UNDISCOVERED' },
]

export function ArcaneRegistryTab() {
  const state = useGameStore()
  const guildUnlocked = state.progress.guildUnlocked
  const entries = useMemo(() => getArcaneRegistryEntries(), [])
  const sources = useMemo(() => [...new Set(entries.map(({ item }) => item.source))].sort((a, b) => a.localeCompare(b)), [entries])
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState<RegistryStatus>('All')
  const [search, setSearch] = useState('')
  const [setFilter, setSetFilter] = useState('All')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [selected, setSelected] = useState<ItemId | null>(null)
  const registryScrollRef = useRef<HTMLDivElement>(null)
  const inspectorScrollRef = useRef<HTMLDivElement>(null)
  const entryIsKnown = (itemId: ItemId) => state.progress.discoveredItems.includes(itemId)
    || Boolean(state.progress.arcaneRegistry.registeredEntries[itemId])
    || (state.inventory[itemId] ?? 0) > 0
    || Object.values(state.equipment).some((equippedId) => equippedId === itemId)
  const registeredFor = (itemId: ItemId) => Boolean(state.progress.arcaneRegistry.registeredEntries[itemId])
  const readyFor = (itemId: ItemId) => entryIsKnown(itemId) && isArcaneRegistryEntryAvailable(state, itemId)
  const visible = entries.filter(({ item, category: entryCategory }) => {
    const known = entryIsKnown(item.id)
    const registered = registeredFor(item.id)
    const ready = known && isArcaneRegistryEntryAvailable(state, item.id)
    if (category !== 'All' && entryCategory !== category) return false
    if (setFilter !== 'All' && !ARCANE_REGISTRY_SETS.find((set) => set.id === setFilter)?.entryIds.includes(item.id)) return false
    if (sourceFilter !== 'All' && item.source !== sourceFilter) return false
    if (status === 'Ready' && !ready) return false
    if (status === 'Registered' && !registered) return false
    if (status === 'Unregistered' && (!known || registered)) return false
    if (status === 'Undiscovered' && known) return false
    const query = search.trim().toLowerCase()
    if (query && (!known || !`${item.name} ${item.description} ${item.source} ${entryCategory}`.toLowerCase().includes(query))) return false
    return true
  })
  const visibleIdKey = visible.map(({ item }) => item.id).join('|')
  useSmartScrollState(registryScrollRef, { dependencies: [visibleIdKey, category, status, search, setFilter, sourceFilter] })
  const visibleSelected = selected && visible.some(({ item }) => item.id === selected)
  useEffect(() => {
    if (visibleSelected) return
    setSelected(visible[0]?.item.id ?? null)
  }, [visibleIdKey, selected, visibleSelected])
  const selectedEntry = selected && visibleSelected ? visible.find(({ item }) => item.id === selected) : undefined
  useSmartScrollState(inspectorScrollRef, { resetKey: selectedEntry?.item.id })
  const item = selectedEntry?.item
  const isKnown = item ? entryIsKnown(item.id) : false
  const registered = item ? registeredFor(item.id) : false
  const available = item ? isArcaneRegistryEntryAvailable(state, item.id) : false
  const owned = item ? state.inventory[item.id] ?? 0 : 0
  const modeLabel = selectedEntry?.mode === 'own' ? 'Register from ownership · item retained' : selectedEntry?.mode === 'discover' ? 'Register from discovery · item retained' : `Consumes ${selectedEntry?.quantity ?? 1} item${selectedEntry?.quantity === 1 ? '' : 's'}`
  const sets = ARCANE_REGISTRY_SETS.filter((set) => !item || set.entryIds.includes(item.id))
  const summary = getArcaneRegistrySummary(state)

  return <section className="arcane-registry-view">
    {!guildUnlocked && <Status tone="warning">Browsing only · defeat the Forest Heart to unlock registration.</Status>}
    <header className="registry-summary-rail" aria-label="Registry completion">
      <div className="registry-summary-primary"><Archive size={17} aria-hidden="true" /><div><span>ARCANE REGISTRY</span><strong>{summary.percent}% recorded</strong></div></div>
      <div><span>REGISTERED</span><strong>{summary.registered} / {summary.total}</strong></div>
      <div><span>COMPLETED SETS</span><strong>{summary.completeSets} / {summary.totalSets}</strong></div>
      <div><span>READY TO RECORD</span><strong>{entries.filter(({ item }) => isArcaneRegistryEntryAvailable(state, item.id)).length}</strong></div>
    </header>
    <div className="registry-layout">
      <Card className="registry-library">
        <div className="registry-library-head"><div><span className="registry-kicker">GUILD ARCHIVE</span><h2>Registry Catalog</h2></div><span className="registry-count">{visible.length} / {entries.length} entries</span></div>
        <label className="archive-search registry-search"><Search size={15} aria-hidden="true" /><SearchInput ariaLabel="Search Arcane Registry" value={search} onChange={setSearch} placeholder="Search revealed entries" /></label>
        <div className="registry-filter-group"><span>CATEGORY</span><FilterBar options={categories} value={category} onChange={setCategory} ariaLabel="Registry categories" /></div>
        <div className="registry-filter-group"><span>STATUS</span><FilterBar options={statuses} value={status} onChange={(value) => setStatus(value as RegistryStatus)} ariaLabel="Registry status" /></div>
        <div className="registry-select-filters"><SelectMenu ariaLabel="Filter Registry by Set" value={setFilter} options={[{ value: 'All', label: 'All Sets' }, ...ARCANE_REGISTRY_SETS.map((set) => { const complete = state.progress.arcaneRegistry.completedSetIds.includes(set.id); const required = GUILD_STANDINGS.find((entry) => entry.id === set.minimumStandingId); const unlocked = isGuildStandingAtLeast(state.progress.guildReputation, set.minimumStandingId); return { value: set.id, label: `${complete ? 'Complete' : unlocked ? 'In progress' : `Locked · ${required?.name}`} · ${set.name}` } })]} onChange={setSetFilter} /><SelectMenu ariaLabel="Filter Registry by Source" value={sourceFilter} options={[{ value: 'All', label: 'All Sources' }, ...sources.map((source) => ({ value: source, label: source }))]} onChange={setSourceFilter} /></div>
        {visible.length ? <div ref={registryScrollRef} className="archive-entry-grid registry-entry-grid smart-scroll-region">
          {visible.map(({ item: entryItem, category: entryCategory, quantity }, tileIndex) => {
            const known = entryIsKnown(entryItem.id)
            const registeredEntry = registeredFor(entryItem.id)
            const ready = known && isArcaneRegistryEntryAvailable(state, entryItem.id)
            const ownedCount = state.inventory[entryItem.id] ?? 0
            const tileStatus = registeredEntry ? 'Registered' : ready ? 'Ready to register' : ownedCount > 0 ? `Owned ${ownedCount.toLocaleString()}` : known ? 'Discovered' : 'Undiscovered'
            return <GameTooltip block key={entryItem.id} content={known ? `${entryItem.name} · ${entryCategory} · ${tileStatus}` : 'Undiscovered Registry Entry · acquire or discover it to reveal its record.'}>
              <ArchiveItemTile
                className={`registry-entry-tile ${registeredEntry ? 'registered' : ready ? 'ready' : ''}${setFilter !== 'All' ? ' in-selected-set' : ''}`}
                art={known ? <ItemIcon itemId={entryItem.id} size="tile" /> : <span className="archive-item-tile-question">?</span>}
                title={known ? entryItem.name : '???'}
                secondary={tileStatus}
                ariaLabel={known ? `${entryItem.name}, ${tileStatus}${selected === entryItem.id ? ', selected' : ''}` : `Undiscovered Registry Entry, catalog position ${tileIndex + 1}`}
                selected={selected === entryItem.id}
                hidden={!known}
                mark={registeredEntry ? 'registered' : ready ? 'ready' : !known ? 'unknown' : undefined}
                onSelect={() => setSelected(entryItem.id)}
              />
            </GameTooltip>
          })}
        </div> : <div className="registry-empty"><strong>No entries match this view.</strong><span>Change a filter or acquire items to reveal Registry records.</span></div>}
      </Card>

      <Card className="registry-inspector">
        {item && selectedEntry ? <div ref={inspectorScrollRef} className="registry-inspector-scroll smart-scroll-region">
          <span className="registry-kicker">REGISTRY RECORD</span>
          {isKnown ? <>
            <div className="registry-item-hero"><ItemIcon itemId={item.id} size="large" /><div><h2>{item.name}</h2><span>{selectedEntry.category}</span></div></div>
            <p className="registry-description">{item.description}</p>
            <div className="registry-facts"><div><span>Registration</span><strong>{registered ? <Status tone="success">Registered</Status> : available ? <Status tone="warning">Ready · {modeLabel}</Status> : 'Not ready'}</strong></div><div><span>Owned</span><strong>{owned.toLocaleString()}</strong></div><div><span>Source</span><strong>{item.source}</strong></div></div>
          <div className="registry-set-section"><span className="registry-kicker">RELATED SETS · {ARCANE_REGISTRY_SETS.length} CATALOGED</span>{sets.length ? sets.map((set) => { const complete = state.progress.arcaneRegistry.completedSetIds.includes(set.id); const count = set.entryIds.filter((id) => Boolean(state.progress.arcaneRegistry.registeredEntries[id])).length; const required = GUILD_STANDINGS.find((entry) => entry.id === set.minimumStandingId); const unlocked = isGuildStandingAtLeast(state.progress.guildReputation, set.minimumStandingId); return <div className={`registry-set-row ${complete ? 'complete' : ''}${!unlocked ? ' locked' : ''}`} key={set.id}><div><strong>{set.name}</strong><small>{set.description}</small><small>{!unlocked ? `LOCKED · REQUIRES ${required?.name.toUpperCase() ?? set.minimumStandingId}` : complete ? 'Complete' : 'In progress'} · Reward +{set.reputationReward} REP and +{set.advancementPointsReward} AP</small></div><b>{count} / {set.entryIds.length}</b></div> }) : <p className="registry-description">This entry is not part of a current Registry Set.</p>}</div>
            <GameTooltip content={!guildUnlocked ? 'Defeat the Forest Heart to unlock Registry registration.' : registered ? 'This entry is permanently recorded.' : available ? `${modeLabel}. Completing a set grants Guild Reputation and Advancement Points.` : selectedEntry.mode === 'own' ? 'Acquire or equip this unique item to record it without consuming it.' : selectedEntry.mode === 'discover' ? 'Discover this item first. Registration preserves the item.' : `Acquire ${selectedEntry.quantity} item${selectedEntry.quantity === 1 ? '' : 's'} to register it.`}>
              <Button variant="primary" disabled={!guildUnlocked || registered || !available} onClick={() => state.registerArcaneRegistryEntry(item.id)}>{registered ? 'Registered' : !guildUnlocked ? 'Guild Locked' : available ? 'Register Item' : 'Registration unavailable'}</Button>
            </GameTooltip>
          </> : <div className="registry-inspector-undiscovered"><span>?</span><strong>Undiscovered Registry Entry</strong><p>Acquire or discover this item to reveal its record.</p></div>}
        </div> : <div className="registry-empty"><strong>{visible.length ? 'Select a Registry entry' : 'No entry selected'}</strong><span>{visible.length ? 'Choose a tile to inspect its registration requirements.' : 'Change a filter to browse other records.'}</span></div>}
      </Card>
    </div>
  </section>
}
