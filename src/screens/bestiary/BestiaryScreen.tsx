import { useEffect, useMemo, useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { Button, GameTooltip } from '../../components/ui'
import { useGameStore } from '../../store/gameStore'
import type { DungeonId, MonsterId } from '../../game/types'
import { DUNGEONS, hasBossEncounter } from '../../game/content/dungeons/dungeons'
import { getBestiaryEntriesByCategory, getBestiarySearchText, getBestiaryMetadataFilterOptions, matchesBestiaryMetadataFilter, type BestiaryCategoryFilter, type BestiaryMetadataFilter } from '../../game/systems/bestiary/bestiarySelectors'
import { BestiaryIndex } from './BestiaryIndex'
import { BestiaryInspector } from './BestiaryInspector'
import { BestiarySummary } from './BestiarySummary'
import { clearAttention, useProfileAttention } from '../../ui/attention/attentionStore'
import { getActiveProfileId } from '../../profiles/profileSessionStore'
import { InspectorTransition } from '../../ui/game-feel/InspectorTransition'
import { MONSTERS } from '../../game/content/monsters'
import { setNavigationIntent, useNavigationIntent } from '../../ui/navigation/navigationIntent'

export function BestiaryScreen() {
  const progress = useGameStore((state) => state.progress)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<BestiaryCategoryFilter>('all')
  const [metadataFilter, setMetadataFilter] = useState<BestiaryMetadataFilter>('all')
  const metadataFilterOptions = useMemo(() => getBestiaryMetadataFilterOptions(), [])
  const navigationIntent = useNavigationIntent()
  const [scopedDungeonId, setScopedDungeonId] = useState<DungeonId | null>(() => navigationIntent.combatDungeonId)
  const [selected, setSelected] = useState<MonsterId | null>(() => navigationIntent.combatMonsterId)
  const attention = useProfileAttention(getActiveProfileId())
  const scopeIds = useMemo(() => {
    if (!scopedDungeonId || !DUNGEONS[scopedDungeonId]) return null
    const dungeon = DUNGEONS[scopedDungeonId]
    return new Set<MonsterId>([...dungeon.monsterPool, ...(hasBossEncounter(dungeon) ? [dungeon.boss] : [])])
  }, [scopedDungeonId])
  const visibleIds = useMemo(() => getBestiaryEntriesByCategory(category).filter((monster) => {
    const discovered = progress.discoveredMonsters.includes(monster.id)
    return matchesBestiaryMetadataFilter(monster, progress, metadataFilter) && (!scopeIds || scopeIds.has(monster.id)) && (!search.trim() || discovered && getBestiarySearchText(monster).includes(search.trim().toLowerCase()))
  }).map((monster) => monster.id), [progress, category, metadataFilter, scopeIds, search])

  useEffect(() => {
    const dungeonId = navigationIntent.combatDungeonId
    const requestedMonsterId = navigationIntent.combatMonsterId
    if (dungeonId && DUNGEONS[dungeonId]) {
      const dungeon = DUNGEONS[dungeonId]
      const validMonsterIds = new Set<MonsterId>([...dungeon.monsterPool, ...(hasBossEncounter(dungeon) ? [dungeon.boss] : [])])
      setScopedDungeonId(dungeonId)
      setSelected(requestedMonsterId && validMonsterIds.has(requestedMonsterId) ? requestedMonsterId : null)
      setNavigationIntent({ combatDungeonId: null, combatMonsterId: null })
      return
    }
    if (requestedMonsterId && visibleIds.includes(requestedMonsterId)) {
      setSelected(requestedMonsterId)
      setNavigationIntent({ combatMonsterId: null })
    }
  }, [navigationIntent.combatDungeonId, navigationIntent.combatMonsterId, visibleIds.join('|')])

  useEffect(() => {
    const discoveredVisibleId = visibleIds.find((monsterId) => progress.discoveredMonsters.includes(monsterId)) ?? null
    setSelected((current) => current && visibleIds.includes(current) ? current : discoveredVisibleId)
  }, [visibleIds.join('|'), progress.discoveredMonsters.join('|')])

  const index = <BestiaryIndex progress={progress} scopeIds={scopeIds ?? undefined} search={search} category={category} metadataFilter={metadataFilter} metadataFilterOptions={metadataFilterOptions} onMetadataFilter={setMetadataFilter} onSearch={setSearch} onCategory={setCategory} selected={selected} newEntries={new Set(attention.unseenMonsters)} onSelect={(monsterId) => { clearAttention(getActiveProfileId(), 'monster', monsterId); setSelected(monsterId) }} />
  const inspector = <InspectorTransition identity={selected} accent={selected ? MONSTERS[selected]?.color : undefined} fill><BestiaryInspector monsterId={selected} progress={progress} /></InspectorTransition>
  return <div className="screen-content bestiary-screen"><div className="screen-header"><div><div className="eyebrow">FIELD ARCHIVE · BESTIARY</div><h1>Know what waits beyond the tower.</h1><p>Encounter a creature once to record its statistics, traits, attack patterns and loot table permanently.</p>{scopedDungeonId && DUNGEONS[scopedDungeonId] && <div className="bestiary-area-scope"><MapPin size={13} aria-hidden="true" /><strong>AREA: {DUNGEONS[scopedDungeonId].name.toUpperCase()}</strong><GameTooltip content="Remove the current area filter and show all discovered creatures."><Button variant="ghost" ariaLabel="Clear Bestiary area scope" onClick={() => setScopedDungeonId(null)}><X size={13} aria-hidden="true" /> CLEAR</Button></GameTooltip></div>}</div></div><ScreenGrid screen="bestiary" panels={[{ id: 'bestiary-summary', content: <BestiarySummary progress={progress} /> }, { id: 'bestiary-index', content: index }, { id: 'bestiary-inspector', content: inspector }]} /></div>
}
