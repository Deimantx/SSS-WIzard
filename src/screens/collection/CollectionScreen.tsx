import { useEffect, useMemo, useState } from 'react'
import { EditableGrid } from '../../ui/layout-editor/EditableGrid'
import { useGameStore } from '../../store/gameStore'
import type { ItemId } from '../../game/types'
import { CollectionLibrary } from './CollectionLibrary'
import { CollectionInspector } from './CollectionInspector'
import { CollectionSummary } from './CollectionSummary'
import { getCollectionVisibleItems, type CollectionCategoryFilter, type CollectionStatusFilter } from '../../game/systems/collection/collectionSelectors'
import { clearAttention, useProfileAttention } from '../../ui/attention/attentionStore'
import { getActiveProfileId } from '../../profiles/profileSessionStore'
import { InspectorTransition } from '../../ui/game-feel/InspectorTransition'

export function CollectionScreen() {
  const progress = useGameStore((state) => state.progress)
  const inventory = useGameStore((state) => state.inventory)
  const navigate = useGameStore((state) => state.setScreen)
  const attention = useProfileAttention(getActiveProfileId())
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CollectionCategoryFilter>('All')
  const [status, setStatus] = useState<CollectionStatusFilter>('All')
  const [selected, setSelected] = useState<ItemId | null>(null)
  const visibleIds = useMemo(() => getCollectionVisibleItems({ progress }, category, status, search), [progress, category, status, search])

  useEffect(() => {
    setSelected((current) => current && visibleIds.includes(current) ? current : visibleIds[0] ?? null)
  }, [visibleIds.join('|')])

  const library = <CollectionLibrary progress={progress} inventory={inventory} search={search} category={category} status={status} onSearch={setSearch} onCategory={setCategory} onStatus={setStatus} selected={selected} newItems={new Set(attention.unseenItems)} onSelect={(itemId) => { clearAttention(getActiveProfileId(), 'item', itemId); setSelected(itemId) }} />
  const inspector = <InspectorTransition identity={selected}><CollectionInspector itemId={selected} inventory={inventory} progress={progress} navigate={navigate} /></InspectorTransition>
  return <div className="screen-content collection-screen"><div className="screen-header"><div><div className="eyebrow">TOWER ARCHIVE · COLLECTION</div><h1>Every relic leaves a record.</h1><p>Discover materials, loot and equipment once, then keep their details permanently in the tower archive.</p></div></div><EditableGrid screen="collection" panels={[{ id: 'collection-summary', content: <CollectionSummary progress={progress} /> }, { id: 'collection-content', content: library }, { id: 'collection-inspector', content: inspector }]} /></div>
}
