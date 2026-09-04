import { Search } from 'lucide-react'
import { Card, FilterBar, SearchInput, type FilterOption } from '../../components/ui'
import { BESTIARY_CATEGORIES, BESTIARY_CATEGORY_LABELS, getBestiaryEntries, getBestiaryEntriesByCategory, getBestiarySearchText, type BestiaryCategoryFilter } from '../../game/systems/bestiary/bestiarySelectors'
import type { GameState, MonsterId } from '../../game/types'
import { BestiaryEntryCard } from './BestiaryEntryCard'
import { useRef } from 'react'
import { useSmartScrollState } from '../../ui/game-feel/useSmartScrollState'

const categories: FilterOption<BestiaryCategoryFilter>[] = BESTIARY_CATEGORIES.map((value) => ({ value, label: value === 'all' ? 'ALL' : BESTIARY_CATEGORY_LABELS[value].toUpperCase() }))

interface BestiaryIndexProps {
  progress: GameState['progress']
  search: string
  category: BestiaryCategoryFilter
  onSearch: (value: string) => void
  onCategory: (value: BestiaryCategoryFilter) => void
  selected: MonsterId | null
  newEntries?: ReadonlySet<MonsterId>
  onSelect: (monsterId: MonsterId) => void
}

export function BestiaryIndex({ progress, search, category, onSearch, onCategory, selected, newEntries = new Set<MonsterId>(), onSelect }: BestiaryIndexProps) {
  const entryGridRef = useRef<HTMLDivElement>(null)
  const entries = getBestiaryEntriesByCategory(category).filter((monster) => {
    const discovered = progress.discoveredMonsters.includes(monster.id)
    return !search.trim() || discovered && getBestiarySearchText(monster).includes(search.trim().toLowerCase())
  })
  useSmartScrollState(entryGridRef, { dependencies: [entries.map((monster) => monster.id).join('|'), category, search] })
  return <Card title="BESTIARY INDEX" className="bestiary-index"><div className="archive-search bestiary-search"><Search size={15} aria-hidden="true" /><SearchInput ariaLabel="Search Bestiary" value={search} onChange={onSearch} placeholder="Search discovered creatures..." /></div><FilterBar options={categories} value={category} onChange={onCategory} ariaLabel="Bestiary categories" />{entries.length === 0 ? <div className="bestiary-empty"><strong>No discovered creatures match this view.</strong><span>Encounter a creature in combat to record it.</span></div> : <div ref={entryGridRef} className="archive-entry-grid bestiary-entry-grid smart-scroll-region">{entries.map((monster) => <BestiaryEntryCard key={monster.id} monster={monster} progress={progress} selected={selected === monster.id} newEntry={newEntries.has(monster.id)} onSelect={() => onSelect(monster.id)} />)}</div>}<small className="bestiary-index-note">Showing {entries.length} of {getBestiaryEntries().length} entries</small></Card>
}
