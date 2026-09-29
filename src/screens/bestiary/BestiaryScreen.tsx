import { useEffect, useMemo, useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { Button, Card, GameTooltip } from '../../components/ui'
import { useGameStore } from '../../store/gameStore'
import type { DungeonId, MonsterId } from '../../game/types'
import { DUNGEONS, hasBossEncounter } from '../../game/content/dungeons/dungeons'
import { getBestiaryEntriesByCategory, getBestiarySearchText, getBestiaryMetadataFilterOptions, getBestiaryCompletion, matchesBestiaryMetadataFilter, type BestiaryCategoryFilter, type BestiaryMetadataFilter } from '../../game/systems/bestiary/bestiarySelectors'
import { BestiaryIndex } from './BestiaryIndex'
import { BestiaryInspector } from './BestiaryInspector'
import { BestiarySummary } from './BestiarySummary'
import { clearAttention, useProfileAttention } from '../../ui/attention/attentionStore'
import { getActiveProfileId } from '../../profiles/profileSessionStore'
import { InspectorTransition } from '../../ui/game-feel/InspectorTransition'
import { MONSTERS } from '../../game/content/monsters'
import { HUNTER_EXCLUSIVE_MONSTER_IDS } from '../../game/content/monsters/huntersOrder'
import { setNavigationIntent, useNavigationIntent } from '../../ui/navigation/navigationIntent'
import { openHunterContractInCombat } from '../../ui/navigation/hunterContractNavigation'
import { getHunterContractCombatPresentation } from '../../game/presentation/huntersOrder/hunterContractCombatPresentation'

export function BestiaryScreen({ embedded = false, context = 'archive' }: { embedded?: boolean; context?: 'archive' | 'hunter' } = {}) {
  const progress = useGameStore((state) => state.progress)
  const gameState = useGameStore()
  const setScreen = useGameStore((state) => state.setScreen)
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

  const contractView = getHunterContractCombatPresentation(gameState)
  const hunterContext = context === 'hunter'
  const huntFromBestiary = (monsterId: MonsterId) => openHunterContractInCombat(gameState, setScreen, monsterId)
  const index = <BestiaryIndex progress={progress} scopeIds={scopeIds ?? undefined} search={search} category={category} metadataFilter={metadataFilter} metadataFilterOptions={metadataFilterOptions} onMetadataFilter={setMetadataFilter} onSearch={setSearch} onCategory={setCategory} selected={selected} newEntries={new Set(attention.unseenMonsters)} hunterContext={hunterContext} onSelect={(monsterId) => { clearAttention(getActiveProfileId(), 'monster', monsterId); setSelected(monsterId) }} />
  const inspector = <InspectorTransition identity={selected} accent={selected ? MONSTERS[selected]?.color : undefined} fill><BestiaryInspector monsterId={selected} progress={progress} hunterContext={hunterContext} onHuntInGloamridge={huntFromBestiary} /></InspectorTransition>
  return <div className={`screen-content bestiary-screen ${embedded ? 'bestiary-embedded' : ''}`}>{!embedded && <div className="screen-header"><div><div className="eyebrow">FIELD ARCHIVE · BESTIARY</div><h1>Know what waits beyond the tower.</h1><p>Encounter a creature once to record its statistics, traits, attack patterns and loot table permanently.</p>{scopedDungeonId && DUNGEONS[scopedDungeonId] && <div className="bestiary-area-scope"><MapPin size={13} aria-hidden="true" /><strong>AREA: {DUNGEONS[scopedDungeonId].name.toUpperCase()}</strong><GameTooltip content="Remove the current area filter and show all discovered creatures."><Button variant="ghost" ariaLabel="Clear Bestiary area scope" onClick={() => setScopedDungeonId(null)}><X size={13} aria-hidden="true" /> CLEAR</Button></GameTooltip></div>}</div></div>}<ScreenGrid screen="bestiary" panels={[{ id: 'bestiary-summary', content: embedded ? <HunterBestiarySummary progress={progress} gameState={gameState} setScreen={setScreen} presentation={contractView} /> : <BestiarySummary progress={progress} /> }, { id: 'bestiary-index', content: index }, { id: 'bestiary-inspector', content: inspector }]} /></div>
}

function HunterBestiarySummary({ progress, gameState, setScreen, presentation }: { progress: ReturnType<typeof useGameStore.getState>["progress"]; gameState: ReturnType<typeof useGameStore.getState>; setScreen: ReturnType<typeof useGameStore.getState>['setScreen']; presentation: ReturnType<typeof getHunterContractCombatPresentation> }) {
  const completion = getBestiaryCompletion({ progress })
  const known = HUNTER_EXCLUSIVE_MONSTER_IDS.filter((id) => progress.discoveredMonsters.includes(id)).length
  return <Card title="FIELD INTELLIGENCE" className="bestiary-summary hunter-bestiary-summary"><section className="bestiary-hunter-summary" aria-label="Hunter quarry overview"><div><span>DISCOVERED</span><strong>{completion.discovered} / {completion.total}</strong></div><div><span>TOTAL DEFEATS</span><strong>{completion.totalDefeats.toLocaleString()}</strong></div><div><span>HUNTER QUARRY</span><strong>{known} / {HUNTER_EXCLUSIVE_MONSTER_IDS.length} known</strong></div><div className="is-contract"><span>ACTIVE CONTRACT</span><strong>{presentation.active ? `${presentation.label} · ${presentation.progress} / ${presentation.target}` : 'None'}</strong>{presentation.active ? <GameTooltip content="Open Gloamridge with a matching quarry selected. Combat will not start until you press Hunt Target."><Button variant="ghost" onClick={() => openHunterContractInCombat(gameState, setScreen)}>OPEN GLOAMRIDGE</Button></GameTooltip> : <GameTooltip content="Accept a Hunt Contract before hunting Hunter quarry."><Button variant="ghost" onClick={() => setScreen('hunters-order')}>OPEN CONTRACTS</Button></GameTooltip>}</div></section></Card>
}
