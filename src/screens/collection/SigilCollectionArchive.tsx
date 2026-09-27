import { GameTooltip } from '../../components/ui'
import { SIGIL_SETS, SIGIL_SET_IDS } from '../../game/content/sigils/sigilSets'
import { SIGIL_TRAITS } from '../../game/content/sigils/sigilTraits'
import type { GameState } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { setUiPreferences } from '../../ui/preferences/uiPreferencesStore'

export function SigilCollectionArchive({ state }: { state: GameState }) {
  const discovery = state.sigils.discovery
  const discoveredSets = SIGIL_SET_IDS.filter((setId) => discovery.discoveredSets[setId]).length
  const discoveredTraits = Object.keys(discovery.discoveredTraits).length
  return <div className="sigil-collection-archive"><div className="sigil-collection-metrics"><span><b>{discoveredSets}</b> / 12<small>SETS DISCOVERED</small></span><span><b>{Object.keys(discovery.qualitiesFound).length}</b> / 4<small>QUALITIES FOUND</small></span><span><b>{discoveredTraits}</b> / 14<small>TRAITS DISCOVERED</small></span><span><b>{Object.keys(discovery.tiersFound).length}</b> / 2<small>TIERS REACHED</small></span></div><div className="sigil-collection-set-grid">{SIGIL_SET_IDS.map((setId) => { const set = SIGIL_SETS[setId]; const discovered = Boolean(discovery.discoveredSets[setId]); const bestQuality = discovery.bestQualityBySet[setId]; return <GameTooltip key={setId} block content={discovered ? `${set.description} · Best ${bestQuality ?? 'Common'}` : 'Discover this Set from Combat to archive it.'}><article className={`sigil-collection-set ${discovered ? 'discovered' : 'undiscovered'}`}><span className="eyebrow">{set.piecesRequired}-PIECE SET</span><h3>{discovered ? set.name : 'Undiscovered Set'}</h3><p>{discovered ? set.description : 'The archive has no record yet.'}</p><div>{discovered && <><b>{bestQuality?.toUpperCase() ?? 'COMMON'}</b><small>{Object.values(discovery.discoveredSlotsBySet[setId] ?? {}).filter(Boolean).length} / 6 slots</small></>}</div></article></GameTooltip> })}</div><details className="sigil-collection-traits"><summary>Trait archive · {discoveredTraits} / {Object.keys(SIGIL_TRAITS).length}</summary><div>{Object.values(SIGIL_TRAITS).map((trait) => <span key={trait.id} className={discovery.discoveredTraits[trait.id] ? 'found' : ''}>{discovery.discoveredTraits[trait.id] ? trait.name : 'Unknown Trait'}</span>)}</div></details><button className="sigil-collection-open" onClick={() => { setUiPreferences({ screenState: { artificing: { mode: 'sigils' } } }); useGameStore.getState().setScreen('tower-artificing') }}>OPEN ARTIFICING · SIGILS</button></div>
}
