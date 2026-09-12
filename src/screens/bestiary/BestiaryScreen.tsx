import { useEffect, useMemo, useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { useGameStore } from '../../store/gameStore'
import type { DungeonId, MonsterId } from '../../game/types'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { getBestiaryEntriesByCategory, getBestiarySearchText, type BestiaryCategoryFilter } from '../../game/systems/bestiary/bestiarySelectors'
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
  const navigationIntent = useNavigationIntent()
  const [scopedDungeonId, setScopedDungeonId] = useState<DungeonId | null>(() => navigationIntent.combatDungeonId)
  const [selected, setSelected] = useState<MonsterId | null>(() => navigationIntent.combatMonsterId)
  const attention = useProfileAttention(getActiveProfileId())
  const scopeIds = useMemo(() => {
    if (!scopedDungeonId || !DUNGEONS[scopedDungeonId]) return null
    const dungeon = DUNGEONS[scopedDungeonId]
    return new Set<MonsterId>([...dungeon.monsterPool, dungeon.boss])
  }, [scopedDungeonId])
  const visibleIds = useMemo(() => getBestiaryEntriesByCategory(category).filter((monster) => {
    const discovered = progress.discoveredMonsters.includes(monster.id)
    return (!scopeIds || scopeIds.has(monster.id)) && (!search.trim() || discovered && getBestiarySearchText(monster).includes(search.trim().toLowerCase()))
  }).map((monster) => monster.id), [progress, category, scopeIds, search])

  useEffect(() => {
    const dungeonId = navigationIntent.combatDungeonId
    if (!dungeonId || !DUNGEONS[dungeonId]) return
    setScopedDungeonId(dungeonId)
    setNavigationIntent({ combatDungeonId: null, combatMonsterId: null })
  }, [navigationIntent.combatDungeonId])

  useEffect(() => {
    const discoveredVisibleId = visibleIds.find((monsterId) => progress.discoveredMonsters.includes(monsterId)) ?? null
    setSelected((current) => current && visibleIds.includes(current) ? current : discoveredVisibleId)
  }, [visibleIds.join('|'), progress.discoveredMonsters.join('|')])

  useEffect(() => {
    if (navigationIntent.combatMonsterId && visibleIds.includes(navigationIntent.combatMonsterId)) setSelected(navigationIntent.combatMonsterId)
  }, [navigationIntent.combatMonsterId, visibleIds.join('|')])

  const index = <BestiaryIndex progress={progress} scopeIds={scopeIds ?? undefined} search={search} category={category} onSearch={setSearch} onCategory={setCategory} selected={selected} newEntries={new Set(attention.unseenMonsters)} onSelect={(monsterId) => { clearAttention(getActiveProfileId(), 'monster', monsterId); setSelected(monsterId) }} />
  const inspector = <InspectorTransition identity={selected} accent={selected ? MONSTERS[selected]?.color : undefined} fill><BestiaryInspector monsterId={selected} progress={progress} /></InspectorTransition>
  return <div className="screen-content bestiary-screen"><div className="screen-header"><div><div className="eyebrow">FIELD ARCHIVE · BESTIARY</div><h1>Know what waits beyond the tower.</h1><p>Encounter a creature once to record its statistics, traits, attack patterns and loot table permanently.</p>{scopedDungeonId && DUNGEONS[scopedDungeonId] && <div className="bestiary-area-scope"><MapPin size={13} aria-hidden="true" /><strong>AREA: {DUNGEONS[scopedDungeonId].name.toUpperCase()}</strong><button type="button" aria-label="Clear Bestiary area scope" onClick={() => setScopedDungeonId(null)}><X size={13} aria-hidden="true" /> CLEAR</button></div>}</div></div><ScreenGrid screen="bestiary" panels={[{ id: 'bestiary-summary', content: <BestiarySummary progress={progress} /> }, { id: 'bestiary-index', content: index }, { id: 'bestiary-inspector', content: inspector }]} /></div>
}
