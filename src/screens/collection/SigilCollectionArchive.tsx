import { useEffect, useState } from 'react'
import { Button, GameTooltip } from '../../components/ui'
import { SIGIL_QUALITIES } from '../../game/content/sigils/sigilQualities'
import { SIGIL_SETS, SIGIL_SET_IDS } from '../../game/content/sigils/sigilSets'
import { SIGIL_TIERS } from '../../game/content/sigils/sigilTiers'
import { SIGIL_TRAITS, SIGIL_TRAIT_IDS } from '../../game/content/sigils/sigilTraits'
import type { GameState, SigilSetId } from '../../game/types'
import { DUNGEONS } from '../../game/content/combat-locations/dungeons/dungeons'
import { getSigilRegionSetPool } from '../../game/content/sigils/sigilDropPools'
import { useGameStore } from '../../store/gameStore'
import { setUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { isArtificingUnlocked } from '../../game/systems/artificing/artificingSelectors'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'

export function SigilCollectionArchive({ state, deepLinkedSetId = null }: { state: GameState; deepLinkedSetId?: SigilSetId | null }) {
  const discovery = state.sigils.discovery
  const [selectedSetId, setSelectedSetId] = useState<SigilSetId | null>(deepLinkedSetId)
  useEffect(() => { if (deepLinkedSetId) setSelectedSetId(deepLinkedSetId) }, [deepLinkedSetId])

  const discoveredSets = SIGIL_SET_IDS.filter((setId) => discovery.discoveredSets[setId]).length
  const discoveredTraits = Object.keys(discovery.discoveredTraits).length
  const selectedSet = selectedSetId ? SIGIL_SETS[selectedSetId] : null
  const sourceLocations = selectedSetId ? Object.values(DUNGEONS).filter((dungeon) => getSigilRegionSetPool(dungeon.id).includes(selectedSetId)) : []
  const openEquipment = () => {
    setNavigationIntent({ openSigilVault: true, equipmentSigilInstanceId: null, equipmentSigilSlot: null })
    useGameStore.getState().setScreen('equipment')
  }
  const openForge = () => {
    setUiPreferences({ screenState: { artificing: { mode: 'sigils' } } })
    useGameStore.getState().setScreen('tower-artificing')
  }

  return <div className="sigil-collection-archive">
    {isArtificingUnlocked(state) && <div className="sigil-collection-actions"><Button variant="primary" onClick={openEquipment}>OPEN SIGIL EQUIPMENT</Button><Button variant="secondary" onClick={openForge}>OPEN SIGIL FORGE</Button></div>}
    <div className="sigil-collection-metrics">
      <span><b>{discoveredSets}</b> / {SIGIL_SET_IDS.length}<small>SETS DISCOVERED</small></span>
      <span><b>{Object.keys(discovery.qualitiesFound).length}</b> / {SIGIL_QUALITIES.length}<small>QUALITIES FOUND</small></span>
      <span><b>{discoveredTraits}</b> / {SIGIL_TRAIT_IDS.length}<small>TRAITS DISCOVERED</small></span>
      <span><b>{Object.keys(discovery.tiersFound).length}</b> / {SIGIL_TIERS.length}<small>TIERS REACHED</small></span>
    </div>
    <div className="sigil-collection-set-grid">{SIGIL_SET_IDS.map((setId) => {
      const set = SIGIL_SETS[setId]
      const discovered = Boolean(discovery.discoveredSets[setId])
      const bestQuality = discovery.bestQualityBySet[setId]
      const bestTier = discovery.bestTierBySet[setId]
      return <GameTooltip key={setId} block content={discovered ? `${set.description} · Best ${bestQuality ?? 'Common'} · Tier ${bestTier ?? 1}` : 'Discover this Set from Combat to archive it.'}>
        <article role="button" tabIndex={0} aria-pressed={selectedSetId === setId} onClick={() => setSelectedSetId(setId)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedSetId(setId) }} className={`sigil-collection-set ${discovered ? 'discovered' : 'undiscovered'} ${selectedSetId === setId ? 'selected' : ''}`}>
          <span className="eyebrow">{set.piecesRequired}-PIECE SET</span><h3>{discovered ? set.name : 'Undiscovered Set'}</h3><p>{discovered ? set.description : 'The archive has no record yet.'}</p>
          <div>{discovered && <><b>{bestQuality?.toUpperCase() ?? 'COMMON'} · T{bestTier ?? 1}</b><small>{Object.values(discovery.discoveredSlotsBySet[setId] ?? {}).filter(Boolean).length} / 6 slots</small></>}</div>
        </article>
      </GameTooltip>
    })}</div>
    {selectedSet && <section className="sigil-collection-source-selector" aria-label={`${selectedSet.name} source locations`}>
      <div><span className="eyebrow">SOURCE LOCATIONS</span><h2>{selectedSet.name} Set</h2><p>{selectedSet.description}</p></div>
      <div className="sigil-source-location-list">{sourceLocations.map((dungeon) => <Button key={dungeon.id} variant="ghost" onClick={() => { setNavigationIntent({ combatLocationId: dungeon.id }); useGameStore.getState().setScreen('combat') }}>{dungeon.name}</Button>)}</div>
    </section>}
    <details className="sigil-collection-traits"><summary>Trait archive · {discoveredTraits} / {SIGIL_TRAIT_IDS.length}</summary><div>{Object.values(SIGIL_TRAITS).map((trait) => <span key={trait.id} className={discovery.discoveredTraits[trait.id] ? 'found' : ''}>{discovery.discoveredTraits[trait.id] ? trait.name : 'Unknown Trait'}</span>)}</div></details>
  </div>
}
