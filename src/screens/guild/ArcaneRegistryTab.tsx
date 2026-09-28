import { useMemo, useState } from 'react'
import { Archive, Check, Search } from 'lucide-react'
import { Button, Card, FilterBar, GameTooltip, SearchInput, Status } from '../../components/ui'
import { ItemIcon } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import { ARCANE_REGISTRY_SETS } from '../../game/content/guild/registry/registrySets'
import { getArcaneRegistryCategories, getArcaneRegistryEntries, getArcaneRegistrySummary, isArcaneRegistryEntryAvailable } from '../../game/systems/guild/arcaneRegistry'
import { useGameStore } from '../../store/gameStore'
import type { ItemId } from '../../game/types'

const categories = [{ value: 'All', label: 'ALL' }, ...getArcaneRegistryCategories().map((category) => ({ value: category, label: category.toUpperCase() }))]
export function ArcaneRegistryTab() {
  const state = useGameStore()
  const guildUnlocked = state.progress.guildUnlocked
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const entries = useMemo(() => getArcaneRegistryEntries(), [])
  const [selected, setSelected] = useState<ItemId | null>(null)
  const knownEntries = entries.filter(({ item }) => state.progress.discoveredItems.includes(item.id) || Boolean(state.progress.arcaneRegistry.registeredEntries[item.id]) || (state.inventory[item.id] ?? 0) > 0 || Object.values(state.equipment).some((equipmentId) => equipmentId === item.id))
  const visible = knownEntries.filter(({ item, category: entryCategory }) => (category === 'All' || entryCategory === category) && (!search.trim() || `${item.name} ${item.description} ${item.source} ${entryCategory}`.toLowerCase().includes(search.trim().toLowerCase())))
  const summary = getArcaneRegistrySummary(state)
  const selectedEntry = selected ? knownEntries.find((entry) => entry.item.id === selected) : undefined
  const item = selectedEntry?.item
  const registered = Boolean(item && state.progress.arcaneRegistry.registeredEntries[item.id])
  const modeLabel = selectedEntry?.mode === 'own' ? 'Register from ownership (item retained)' : selectedEntry?.mode === 'discover' ? 'Register from discovery (item retained)' : `Consumes ${selectedEntry?.quantity ?? 1} item${selectedEntry?.quantity === 1 ? '' : 's'}`
  const available = Boolean(item && isArcaneRegistryEntryAvailable(state, item.id))
  const sets = ARCANE_REGISTRY_SETS.filter((set) => !item || set.entryIds.includes(item.id))
  return <section className="arcane-registry-view">
    {!guildUnlocked && <Status tone="warning">Browsing only - defeat the Forest Heart to unlock registration.</Status>}
    <header className="registry-summary-rail" aria-label="Registry completion"><div className="registry-summary-primary"><Archive size={18} /><div><span>ARCANE REGISTRY</span><strong>{summary.percent}% recorded</strong></div></div><div><span>REGISTERED</span><strong>{summary.registered} / {summary.total}</strong></div><div><span>COMPLETED SETS</span><strong>{summary.completeSets} / {summary.totalSets}</strong></div></header>
    <div className="registry-layout">
      <Card className="registry-library"><div className="registry-library-head"><div><span className="registry-kicker">GUILD ARCHIVE</span><h2>Items to register</h2></div><span className="registry-count">{visible.length} entries</span></div><div className="registry-search"><Search size={14} /><SearchInput ariaLabel="Search Arcane Registry" value={search} onChange={setSearch} placeholder="Find an item or source" /></div><FilterBar options={categories} value={category} onChange={setCategory} ariaLabel="Registry categories" /><div className="registry-entry-list">{visible.map(({ item: entryItem, category: entryCategory, quantity }) => {
        const isRegistered = Boolean(state.progress.arcaneRegistry.registeredEntries[entryItem.id])
        const owned = state.inventory[entryItem.id] ?? 0
        return <GameTooltip key={entryItem.id} block content={`${entryItem.name} · ${entryCategory} · ${isRegistered ? 'Registered' : isArcaneRegistryEntryAvailable(state, entryItem.id) ? `Ready to register · ${quantity} required` : 'Not ready to register'}`}><Button variant={selected === entryItem.id ? 'secondary' : 'ghost'} ariaPressed={selected === entryItem.id} className={`registry-entry-button ${isRegistered ? 'registered' : ''}`} onClick={() => setSelected(entryItem.id)}><ItemIcon itemId={entryItem.id} size="tile" /><span><strong>{entryItem.name}</strong><small>{entryCategory} · {isRegistered ? 'Registered' : `Owned ${owned.toLocaleString()}`}</small></span>{isRegistered && <Check size={14} className="registry-check" />}</Button></GameTooltip>
      })}</div>{visible.length === 0 && <div className="registry-empty">{knownEntries.length ? 'No entries match these filters.' : 'Discover or acquire an item to add it to the Registry library.'}</div>}</Card>
    <Card className="registry-inspector"><span className="registry-kicker">REGISTRY RECORD</span>{item ? <><div className="registry-item-hero"><ItemIcon itemId={item.id} size="large" /><div><h2>{item.name}</h2><span>{selectedEntry?.category}</span></div></div><p className="registry-description">{item.description}</p><div className="registry-facts"><div><span>Registration</span><strong>{registered ? 'Complete' : modeLabel}</strong></div><div><span>Owned</span><strong>{(state.inventory[item.id] ?? 0).toLocaleString()}</strong></div><div><span>Source</span><strong>{item.source}</strong></div></div><div className="registry-set-section"><span className="registry-kicker">RELATED SETS</span>{sets.length ? sets.map((set) => { const complete = state.progress.arcaneRegistry.completedSetIds.includes(set.id); const count = set.entryIds.filter((id) => Boolean(state.progress.arcaneRegistry.registeredEntries[id])).length; return <div className={`registry-set-row ${complete ? 'complete' : ''}`} key={set.id}><div><strong>{set.name}</strong><small>{set.description}</small></div><b>{count} / {set.entryIds.length}</b></div> }) : <p className="registry-description">This entry is not part of a current Registry Set.</p>}</div><GameTooltip content={!guildUnlocked ? 'Defeat the Forest Heart to unlock Registry registration.' : registered ? 'This entry is permanently recorded.' : available ? `${modeLabel}. Completing a set grants Guild Reputation and Advancement Points.` : selectedEntry?.mode === 'own' ? 'Acquire or equip this unique item to record it without consuming it.' : selectedEntry?.mode === 'discover' ? 'Discover this item first. Registration will preserve the item.' : `Acquire ${selectedEntry?.quantity ?? 1} item to register it.`}><Button variant="primary" disabled={!guildUnlocked || registered || !available} onClick={() => state.registerArcaneRegistryEntry(item.id)}>{registered ? 'Registered' : !guildUnlocked ? 'Guild Locked' : available ? 'Register Item' : 'Registration unavailable'}</Button></GameTooltip></> : <div className="registry-empty">Choose an item to inspect its requirements and Registry Sets.</div>}</Card>
    </div>
  </section>
}
