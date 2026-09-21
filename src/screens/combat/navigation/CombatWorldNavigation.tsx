import { ChevronRight, LockKeyhole, Map, MapPinned } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Card, GameTooltip } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { COMBAT_CONTINENTS, COMBAT_LOCATIONS, COMBAT_REGIONS, type CombatContinentId, type CombatLocationId, type CombatRegionId } from '../../../game/content/world-navigation'
import { buildCombatWorldNavigationViewModel, getFirstCombatLocationId, getFirstCombatRegionId, getInitialCombatLocationId } from '../../../game/presentation/combat/combatWorldNavigationReadModel'
import type { CombatLocationViewModel } from '../../../game/presentation/combat/combatWorldNavigationTypes'
import { useGameStore } from '../../../store/gameStore'
import { CombatLocationBrowser } from './CombatLocationBrowser'
import { CombatLocationInspector } from './CombatLocationInspector'
import { CombatLocationLootModal } from './CombatLocationLootModal'

type Selection = { continentId: CombatContinentId | null; regionId: CombatRegionId | null; locationId: CombatLocationId | null }

export function CombatWorldNavigation({ onSelectLocation, onEnterLocation, onBestiary, onReturnToCombat }: { onSelectLocation: (locationId: CombatLocationId) => void; onEnterLocation: (locationId: CombatLocationId) => void; onBestiary: (location: CombatLocationViewModel) => void; onReturnToCombat: () => void }) {
  const { progress, combat, lastEnteredDungeonId } = useGameStore(useShallow((state) => ({ progress: state.progress, combat: state.combat, lastEnteredDungeonId: state.ui.lastEnteredCombatDungeonId })))
  const [selection, setSelection] = useState<Selection>(() => {
    const initialLocationId = getInitialCombatLocationId({ combat, lastEnteredDungeonId, progress })
    const location = COMBAT_LOCATIONS[initialLocationId]
    return { continentId: location ? COMBAT_REGIONS[location.regionId]?.continentId ?? 'continent-1' : 'continent-1', regionId: location?.regionId ?? 'first-frontier', locationId: initialLocationId }
  })
  const viewModel = buildCombatWorldNavigationViewModel({ progress, combat, selectedContinentId: selection.continentId, selectedRegionId: selection.regionId, selectedLocationId: selection.locationId })
  const [lootLocation, setLootLocation] = useState<CombatLocationViewModel | null>(null)

  useEffect(() => {
    const selected = viewModel.selectedLocation
    const nextSelection = { continentId: viewModel.selectedContinent.id, regionId: viewModel.selectedRegion.id, locationId: selected?.id ?? null }
    if (selection.continentId !== nextSelection.continentId || selection.regionId !== nextSelection.regionId || selection.locationId !== nextSelection.locationId) setSelection(nextSelection)
  }, [selection.continentId, selection.locationId, selection.regionId, viewModel.selectedContinent.id, viewModel.selectedLocation?.id, viewModel.selectedRegion.id])

  const selectContinent = (continentId: CombatContinentId) => {
    const continent = viewModel.continents.find((entry) => entry.id === continentId)
    if (!continent || continent.state === 'locked') return
    const regionId = getFirstCombatRegionId(continentId, progress)
    const region = regionId ? viewModel.regions.find((entry) => entry.id === regionId) : undefined
    const locationId = region ? getFirstCombatLocationId(region.id, progress) : null
    setSelection({ continentId, regionId: region?.id ?? null, locationId })
    if (locationId) onSelectLocation(locationId)
  }
  const selectRegion = (regionId: CombatRegionId) => {
    const region = viewModel.regions.find((entry) => entry.id === regionId)
    if (!region || region.state === 'locked') return
    const locationId = getFirstCombatLocationId(regionId, progress)
    setSelection({ continentId: viewModel.selectedContinent.id, regionId, locationId })
    if (locationId) onSelectLocation(locationId)
  }
  const selectLocation = (locationId: CombatLocationId) => {
    const location = COMBAT_LOCATIONS[locationId]
    if (!location) return
    setSelection({ continentId: viewModel.selectedContinent.id, regionId: location.regionId, locationId })
    onSelectLocation(locationId)
  }
  const enterSelectedLocation = () => {
    const location = viewModel.selectedLocation
    if (!location || !location.dungeonId || location.state === 'locked' || location.state === 'prototype') return
    selectLocation(location.id)
    if (location.id === viewModel.activeLocationId) onReturnToCombat()
    else onEnterLocation(location.id)
  }

  return <Card title="WORLD NAVIGATION" className="combat-world-navigation" action={<span className="combat-world-navigation-meta">{viewModel.breadcrumb.toUpperCase()}</span>}>
    <div className="combat-world-navigation-intro"><div><p>Browse the world hierarchy, then inspect a Location before entering it.</p>{viewModel.activeLocation && <span className="combat-world-active-run"><MapPinned size={13} aria-hidden="true" /> ACTIVE RUN: <strong>{viewModel.activeLocation.name}</strong> · {viewModel.activeLocation.typeLabel}</span>}</div><span className="combat-world-navigation-path"><Map size={14} aria-hidden="true" /> {viewModel.selectedRegion.locationCount} LOCATIONS IN REGION</span></div>
    <nav className="combat-world-selector-stack" aria-label="World hierarchy">
      <SelectorRow label="CONTINENT" icon={<Map size={13} aria-hidden="true" />}>
        {viewModel.continents.map((continent) => <SelectorButton key={continent.id} selected={continent.id === viewModel.selectedContinent.id} disabled={continent.state === 'locked'} label={continent.name} locked={continent.state === 'locked'} unlockText={continent.unlockText} onClick={() => selectContinent(continent.id)} />)}
      </SelectorRow>
      <SelectorRow label="REGION" icon={<ChevronRight size={13} aria-hidden="true" />}>
        {viewModel.regions.map((region) => <SelectorButton key={region.id} selected={region.id === viewModel.selectedRegion.id} disabled={region.state === 'locked'} label={region.name} locked={region.state === 'locked'} unlockText={region.unlockText} onClick={() => selectRegion(region.id)} />)}
      </SelectorRow>
    </nav>
    <div className="combat-world-navigation-body"><CombatLocationBrowser groups={viewModel.selectedRegion.groups} selectedLocationId={viewModel.selectedLocation?.id ?? null} onSelect={selectLocation} /><CombatLocationInspector location={viewModel.selectedLocation} activeLocationId={viewModel.activeLocationId} combatActive={combat.active} onLoot={() => viewModel.selectedLocation && setLootLocation(viewModel.selectedLocation)} onBestiary={() => viewModel.selectedLocation && onBestiary(viewModel.selectedLocation)} onEnter={enterSelectedLocation} /></div>
    {lootLocation && <CombatLocationLootModal location={lootLocation} onClose={() => setLootLocation(null)} />}
  </Card>
}

function SelectorRow({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return <div className="combat-world-selector-row"><div className="combat-world-selector-label"><span>{icon}</span>{label}</div><div className="combat-world-selector-strip">{children}</div></div>
}

function SelectorButton({ selected, disabled, label, locked, unlockText, onClick }: { selected: boolean; disabled: boolean; label: string; locked: boolean; unlockText: string | null; onClick: () => void }) {
  const button = <button type="button" className={`combat-world-selector-button${selected ? ' is-selected' : ''}${locked ? ' is-locked' : ''}`} aria-selected={selected} disabled={disabled} onClick={onClick}><span>{label}</span>{locked && <LockKeyhole size={13} aria-hidden="true" />}</button>
  return locked && unlockText ? <GameTooltip block content={<TooltipContent title={`${label} locked`} description={unlockText} />}>{button}</GameTooltip> : button
}
