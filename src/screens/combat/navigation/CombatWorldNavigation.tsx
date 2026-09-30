import { Castle, Gem, PawPrint, Swords, Flame, Droplets, Wind, Mountain, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Card } from '../../../components/ui'
import { COMBAT_LOCATIONS, getCombatLocationByDungeonId, type CombatLocationId, type CombatZoneType } from '../../../game/content/world-navigation'
import { DUNGEONS } from '../../../game/content/dungeons/dungeons'
import { buildCombatWorldNavigationViewModel, getInitialCombatLocationId } from '../../../game/presentation/combat/combatWorldNavigationReadModel'
import type { CombatLocationViewModel } from '../../../game/presentation/combat/combatWorldNavigationTypes'
import type { MonsterId } from '../../../game/types'
import { setNavigationIntent, useNavigationIntent } from '../../../ui/navigation/navigationIntent'
import { useGameStore } from '../../../store/gameStore'
import { CombatLocationBrowser } from './CombatLocationBrowser'
import { CombatLocationInspector } from './CombatLocationInspector'
import { CombatLocationLootModal } from './CombatLocationLootModal'
import { CombatWorldTierControl } from '../CombatWorldTierControl'
import { ELEMENT_IDS, ELEMENT_DEFINITIONS, type ElementId } from '../../../game/content/elements/elements'
import { GameTooltip } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'

const zoneFilters: Array<{ id: CombatZoneType; label: string; Icon: typeof Swords }> = [
  { id: 'combat-zone', label: 'Combat Zones', Icon: Swords },
  { id: 'elite-zone', label: 'Elite Zones', Icon: Gem },
  { id: 'hunting-ground', label: 'Hunting Grounds', Icon: PawPrint },
  { id: 'dungeon', label: 'Dungeons', Icon: Castle },
]
const elementIcons = { fire: Flame, water: Droplets, air: Wind, earth: Mountain, arcane: Sparkles }

export function CombatWorldNavigation({ onSelectLocation, onEnterLocation, onHuntTarget, onBestiary, onReturnToCombat }: { onSelectLocation: (locationId: CombatLocationId) => void; onEnterLocation: (locationId: CombatLocationId, targetEnemyId?: MonsterId) => void; onHuntTarget: (locationId: CombatLocationId, targetEnemyId: MonsterId) => boolean; onBestiary: (location: CombatLocationViewModel, monsterId?: MonsterId | null) => void; onReturnToCombat: () => void }) {
  const { progress, combat, worldTier, lastEnteredDungeonId } = useGameStore(useShallow((state) => ({ progress: state.progress, combat: state.combat, worldTier: state.worldTier, lastEnteredDungeonId: state.ui.lastEnteredCombatDungeonId })))
  const navigationIntent = useNavigationIntent()
  const [selectedLocationId, setSelectedLocationId] = useState<CombatLocationId | null>(() => {
    const initialLocationId = getInitialCombatLocationId({ combat, lastEnteredDungeonId, progress })
    return initialLocationId
  })
  const initialType = COMBAT_LOCATIONS[selectedLocationId ?? 'whispering-woods']?.type
  const [selectedType, setSelectedType] = useState<CombatZoneType>(() => initialType === 'elite-zone' || initialType === 'hunting-ground' || initialType === 'dungeon' ? initialType : 'combat-zone')
  const [selectedElement, setSelectedElement] = useState<ElementId | null>(null)
  const viewModel = buildCombatWorldNavigationViewModel({ progress, combat, worldTier, selectedLocationId, selectedType })
  const visibleLocations = viewModel.allLocations.filter((location) => location.type === selectedType && (!selectedElement || location.elementsPresent.includes(selectedElement)))
  const [lootRequest, setLootRequest] = useState<{ location: CombatLocationViewModel; targetMonsterId: MonsterId | null } | null>(null)
  const [selectedTargetEnemyId, setSelectedTargetEnemyId] = useState<MonsterId | null>(null)
  const targetContextRef = useRef<{ locationId: CombatLocationId | null; activeTargetEnemyId: MonsterId | null }>({ locationId: null, activeTargetEnemyId: null })
  const preserveSelectedTargetForLocationRef = useRef<CombatLocationId | null>(null)

  useEffect(() => {
    const dungeonId = navigationIntent.combatDungeonId
    if (!dungeonId) return
    const location = getCombatLocationByDungeonId(dungeonId)
    const dungeon = DUNGEONS[dungeonId]
    if (location && dungeon) {
      setSelectedElement(null)
      setSelectedType(location.type as CombatZoneType)
      setSelectedLocationId(location.id)
      const target = navigationIntent.combatMonsterId
      const validTarget = target && dungeon.monsterPool.includes(target) && location.targetMetadata?.[target] ? target : null
      setSelectedTargetEnemyId(validTarget)
      preserveSelectedTargetForLocationRef.current = validTarget ? location.id : null
      onSelectLocation(location.id)
    }
    setNavigationIntent({ combatDungeonId: null, combatMonsterId: null })
  }, [navigationIntent.combatDungeonId, navigationIntent.combatMonsterId, onSelectLocation])

  useEffect(() => {
    const targeting = viewModel.selectedLocation?.targeting
    const locationId = viewModel.selectedLocation?.id ?? null
    const activeTargetEnemyId = targeting?.activeTargetEnemyId ?? null
    const previousContext = targetContextRef.current
    if (preserveSelectedTargetForLocationRef.current) {
      if (preserveSelectedTargetForLocationRef.current === locationId) preserveSelectedTargetForLocationRef.current = null
    } else if (previousContext.locationId !== locationId || previousContext.activeTargetEnemyId !== activeTargetEnemyId) setSelectedTargetEnemyId(activeTargetEnemyId)
    else if (selectedTargetEnemyId && targeting && !targeting.targets.some((target) => target.monsterId === selectedTargetEnemyId)) setSelectedTargetEnemyId(null)
    else if (!targeting) setSelectedTargetEnemyId(null)
    targetContextRef.current = { locationId, activeTargetEnemyId }
  }, [selectedTargetEnemyId, viewModel.selectedLocation?.id, viewModel.selectedLocation?.targeting?.activeTargetEnemyId, viewModel.selectedLocation?.targeting?.targets])

  const selectLocation = (locationId: CombatLocationId) => {
    const location = COMBAT_LOCATIONS[locationId]
    if (!location) return
    setSelectedType(location.type as CombatZoneType)
    setSelectedLocationId(locationId)
    setSelectedTargetEnemyId(null)
    onSelectLocation(locationId)
  }
  const selectType = (type: CombatZoneType) => {
    const locations = viewModel.allLocations.filter((location) => location.type === type && (!selectedElement || location.elementsPresent.includes(selectedElement)))
    const current = locations.find((location) => location.id === selectedLocationId)
    const next = current ?? locations.find((location) => location.state !== 'locked' && location.state !== 'prototype') ?? locations[0]
    setSelectedType(type)
    setSelectedLocationId(next?.id ?? null)
    setSelectedTargetEnemyId(null)
    if (next) onSelectLocation(next.id)
  }
  const selectElement = (element: ElementId) => {
    const nextFilter = selectedElement === element ? null : element
    setSelectedElement(nextFilter)
    const matches = viewModel.allLocations.filter((location) => location.type === selectedType && (!nextFilter || location.elementsPresent.includes(nextFilter)))
    const current = matches.find((location) => location.id === selectedLocationId)
    const next = current ?? matches.find((location) => location.state !== 'locked' && location.state !== 'prototype') ?? matches.find((location) => location.state === 'locked')
    setSelectedLocationId(next?.id ?? null)
    setSelectedTargetEnemyId(null)
    if (next) onSelectLocation(next.id)
  }
  const enterSelectedLocation = () => {
    const location = viewModel.selectedLocation
    if (!location || !location.dungeonId || location.state === 'locked' || location.state === 'prototype') return
    if (location.targeting) {
      const targetEnemyId = selectedTargetEnemyId
      if (!targetEnemyId) return
      onHuntTarget(location.id, targetEnemyId)
      return
    }
    if (location.id === viewModel.activeLocationId) onReturnToCombat()
    else onEnterLocation(location.id)
  }

  return <Card title="WORLD NAVIGATION" className="combat-world-navigation" action={<div className="combat-world-navigation-header-actions"><CombatWorldTierControl variant="embedded" /></div>}>
    <div className="combat-world-navigation-intro"><p>Browse locations by encounter type.</p></div>
    <nav className="combat-zone-type-filters" aria-label="Combat location type" role="tablist">
      {zoneFilters.map(({ id, label, Icon }) => <button key={id} type="button" role="tab" aria-selected={selectedType === id} className={`combat-zone-type-filter${selectedType === id ? ' is-selected' : ''}`} onClick={() => selectType(id)}><Icon size={15} aria-hidden="true" /><span>{label}</span></button>)}
    </nav>
    <nav className="combat-element-filters" aria-label="Element filter" role="group">
      {ELEMENT_IDS.map((element) => { const Icon = elementIcons[element]; const active = selectedElement === element; return <GameTooltip key={element} content={<TooltipContent title={`${ELEMENT_DEFINITIONS[element].name} locations`} description={active ? 'Click again to clear the element filter.' : `Show locations with ${ELEMENT_DEFINITIONS[element].name} enemies.`} />}><button type="button" className={`combat-element-filter${active ? ' is-selected' : ''}`} aria-pressed={active} onClick={() => selectElement(element)}><Icon size={14} aria-hidden="true" /><span>{ELEMENT_DEFINITIONS[element].name}</span></button></GameTooltip> })}
    </nav>
    <div className="combat-world-navigation-body"><CombatLocationBrowser locations={visibleLocations} selectedLocationId={visibleLocations.some((location) => location.id === selectedLocationId) ? selectedLocationId : null} onSelect={selectLocation} />{visibleLocations.length > 0 && viewModel.selectedLocation && visibleLocations.some((location) => location.id === viewModel.selectedLocation?.id) && <CombatLocationInspector location={viewModel.selectedLocation} activeLocationId={viewModel.activeLocationId} combatActive={combat.active} selectedTargetEnemyId={selectedTargetEnemyId} onSelectTarget={(enemyId) => { setSelectedTargetEnemyId(enemyId); const location = viewModel.selectedLocation; if (location?.type === 'hunting-ground' && location.dungeonId) useGameStore.getState().rememberHunterQuarry(enemyId, location.dungeonId) }} onLoot={() => { const location = viewModel.selectedLocation; if (!location || (location.targeting && !selectedTargetEnemyId)) return; setLootRequest({ location, targetMonsterId: location.targeting ? selectedTargetEnemyId : null }) }} onBestiary={() => viewModel.selectedLocation && onBestiary(viewModel.selectedLocation, viewModel.selectedLocation.targeting ? selectedTargetEnemyId : null)} onEnter={enterSelectedLocation} />}</div>
    {lootRequest && <CombatLocationLootModal location={lootRequest.location} targetMonsterId={lootRequest.targetMonsterId} onClose={() => setLootRequest(null)} />}
  </Card>
}
