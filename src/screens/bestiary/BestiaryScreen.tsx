import { useEffect, useMemo, useState } from 'react'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import { useGameStore } from '../../store/gameStore'
import type { MonsterId } from '../../game/types'
import { getBestiaryEntriesByCategory, getBestiarySearchText, type BestiaryCategoryFilter } from '../../game/systems/bestiary/bestiarySelectors'
import { BestiaryIndex } from './BestiaryIndex'
import { BestiaryInspector } from './BestiaryInspector'
import { BestiarySummary } from './BestiarySummary'

export function BestiaryScreen() {
  const progress = useGameStore((state) => state.progress)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<BestiaryCategoryFilter>('all')
  const [selected, setSelected] = useState<MonsterId | null>(null)
  const visibleIds = useMemo(() => getBestiaryEntriesByCategory(category).filter((monster) => {
    const discovered = progress.discoveredMonsters.includes(monster.id)
    return !search.trim() || discovered && getBestiarySearchText(monster).includes(search.trim().toLowerCase())
  }).map((monster) => monster.id), [progress, category, search])

  useEffect(() => {
    const discoveredVisibleId = visibleIds.find((monsterId) => progress.discoveredMonsters.includes(monsterId)) ?? null
    setSelected((current) => current && visibleIds.includes(current) ? current : discoveredVisibleId)
  }, [visibleIds.join('|'), progress.discoveredMonsters.join('|')])

  const index = <BestiaryIndex progress={progress} search={search} category={category} onSearch={setSearch} onCategory={setCategory} selected={selected} onSelect={setSelected} />
  const inspector = <BestiaryInspector monsterId={selected} progress={progress} />
  return <div className="screen-content bestiary-screen"><div className="screen-header"><div><div className="eyebrow">FIELD ARCHIVE · BESTIARY</div><h1>Know what waits beyond the tower.</h1><p>Encounter a creature once to record its statistics, traits, attack patterns and loot table permanently.</p></div></div><EditableGrid screen="bestiary" panels={[{ id: 'bestiary-summary', content: <BestiarySummary progress={progress} /> }, { id: 'bestiary-index', content: index }, { id: 'bestiary-inspector', content: inspector }]} /></div>
}
