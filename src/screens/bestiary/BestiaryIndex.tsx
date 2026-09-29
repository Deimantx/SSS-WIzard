import { Search } from 'lucide-react'
import { Card, FilterBar, GameTooltip, SearchInput, SelectMenu, type FilterOption, type SelectMenuOption } from '../../components/ui'
import { BESTIARY_CATEGORIES, BESTIARY_CATEGORY_LABELS, getBestiaryEntries, getBestiaryEntriesByCategory, getBestiarySearchText, matchesBestiaryMetadataFilter, type BestiaryCategoryFilter, type BestiaryMetadataFilter } from '../../game/systems/bestiary/bestiarySelectors'
import type { GameState, MonsterId } from '../../game/types'
import { BestiaryEntryCard } from './BestiaryEntryCard'
import { useRef } from 'react'
import { useSmartScrollState } from '../../ui/game-feel/useSmartScrollState'
import { getMonsterHunterContractRelation } from '../../game/presentation/huntersOrder/hunterContractCombatPresentation'

const categories: FilterOption<BestiaryCategoryFilter>[] = BESTIARY_CATEGORIES.map((value) => ({ value, label: value === 'all' ? 'ALL' : BESTIARY_CATEGORY_LABELS[value].toUpperCase() }))

interface BestiaryIndexProps {
  progress: GameState['progress']
  scopeIds?: ReadonlySet<MonsterId>
  search: string
  category: BestiaryCategoryFilter
  metadataFilter: BestiaryMetadataFilter
  metadataFilterOptions: readonly SelectMenuOption<BestiaryMetadataFilter>[]
  onMetadataFilter: (value: BestiaryMetadataFilter) => void
  onSearch: (value: string) => void
  onCategory: (value: BestiaryCategoryFilter) => void
  selected: MonsterId | null
  newEntries?: ReadonlySet<MonsterId>
  hunterContext?: boolean
  onSelect: (monsterId: MonsterId) => void
}

export function BestiaryIndex({ progress, scopeIds, search, category, metadataFilter, metadataFilterOptions, onMetadataFilter, onSearch, onCategory, selected, newEntries = new Set<MonsterId>(), hunterContext = false, onSelect }: BestiaryIndexProps) {
  const entryGridRef = useRef<HTMLDivElement>(null)
  const entries = getBestiaryEntriesByCategory(category).filter((monster) => {
    const discovered = progress.discoveredMonsters.includes(monster.id)
    return matchesBestiaryMetadataFilter(monster, progress, metadataFilter) && (!scopeIds || scopeIds.has(monster.id)) && (!search.trim() || discovered && getBestiarySearchText(monster).includes(search.trim().toLowerCase()))
  })
  useSmartScrollState(entryGridRef, { dependencies: [entries.map((monster) => monster.id).join('|'), category, metadataFilter, search] })
  const hasContract = Boolean(progress.huntersOrder.activeContract)
  return <Card title="BESTIARY INDEX" className="bestiary-index"><div className="archive-search bestiary-search"><Search size={15} aria-hidden="true" /><SearchInput ariaLabel="Search Bestiary" value={search} onChange={onSearch} placeholder="Search discovered creatures..." /></div><div className="bestiary-filter-row"><FilterBar options={categories} value={category} onChange={onCategory} ariaLabel="Bestiary categories" /><GameTooltip content="Filter the full Bestiary by location, Hunter metadata, Boss status, active-contract targets, or discovery state."><SelectMenu options={metadataFilterOptions} value={metadataFilter} onChange={onMetadataFilter} ariaLabel="Bestiary metadata filter" prefix="FILTER · " /></GameTooltip></div>{metadataFilter === 'contract-targets' && !hasContract ? <div className="bestiary-empty"><strong>No active Hunt Contract.</strong><span>Accept a Contract to see authorized quarry here.</span></div> : entries.length === 0 ? <div className="bestiary-empty"><strong>No creatures match this view.</strong><span>Change a filter or encounter a creature to reveal it.</span></div> : <div ref={entryGridRef} className="archive-entry-grid bestiary-entry-grid smart-scroll-region">{entries.map((monster) => { const relation = getMonsterHunterContractRelation({ progress }, monster.id, 'hunters-ground'); return <BestiaryEntryCard key={monster.id} monster={monster} progress={progress} selected={selected === monster.id} newEntry={newEntries.has(monster.id)} hunterRelation={hunterContext ? relation : undefined} onSelect={() => onSelect(monster.id)} /> })}</div>}<small className="bestiary-index-note">Showing {entries.length} of {getBestiaryEntries().length} entries</small></Card>
}
