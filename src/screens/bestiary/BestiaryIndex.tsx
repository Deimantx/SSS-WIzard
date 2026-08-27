import { Search } from 'lucide-react'
import { Card, SearchInput } from '../../components/ui'
import { getBestiaryEntries, getBestiaryEntriesByCategory, getBestiarySearchText, type BestiaryCategoryFilter } from '../../game/systems/bestiary/bestiarySelectors'
import type { GameState, MonsterId } from '../../game/types'
import { BestiaryEntryCard } from './BestiaryEntryCard'

const categories: Array<{ value: BestiaryCategoryFilter; label: string }> = [{ value: 'all', label: 'All' }, { value: 'monster', label: 'Monsters' }, { value: 'boss', label: 'Bosses' }, { value: 'special-boss', label: 'Special Bosses' }]

export function BestiaryIndex({ progress, search, category, onSearch, onCategory, selected, onSelect }: { progress: GameState['progress']; search: string; category: BestiaryCategoryFilter; onSearch: (value: string) => void; onCategory: (value: BestiaryCategoryFilter) => void; selected: MonsterId | null; onSelect: (monsterId: MonsterId) => void }) {
  const entries = getBestiaryEntriesByCategory(category).filter((monster) => {
    const discovered = progress.discoveredMonsters.includes(monster.id)
    return !search.trim() || discovered && getBestiarySearchText(monster).includes(search.trim().toLowerCase())
  })
  return <Card title="BESTIARY INDEX" className="bestiary-index"><div className="bestiary-toolbar"><div className="bestiary-search"><Search size={15} aria-hidden="true" /><SearchInput value={search} onChange={onSearch} placeholder="Search discovered creatures..." /></div></div><div className="bestiary-category-bar" role="tablist" aria-label="Bestiary categories">{categories.map(({ value, label }) => <button type="button" role="tab" aria-selected={category === value} className={category === value ? 'active' : ''} key={value} onClick={() => onCategory(value)}>{label.toUpperCase()}</button>)}</div>{entries.length === 0 ? <div className="bestiary-empty"><strong>No discovered creatures match this view.</strong><span>Encounter a creature in combat to record it.</span></div> : <div className="bestiary-entry-grid">{entries.map((monster) => <BestiaryEntryCard key={monster.id} monster={monster} progress={progress} selected={selected === monster.id} onSelect={() => onSelect(monster.id)} />)}</div>}<small className="bestiary-index-note">{entries.length} of {getBestiaryEntries().length} authored creatures</small></Card>
}
