import type { CombatLocationViewModel } from '../../../game/presentation/combat/combatWorldNavigationTypes'
import { CombatLocationCard } from './CombatLocationCard'

export function CombatLocationBrowser({ locations, selectedLocationId, onSelect }: { locations: CombatLocationViewModel[]; selectedLocationId: string | null; onSelect: (locationId: string) => void }) {
  return <section className="combat-location-browser" aria-label="Locations">
    <header className="combat-location-browser-head"><div><span className="combat-subsection-label">LOCATIONS</span><p>Choose a location.</p></div></header>
    {locations.length ? <div className="combat-location-card-list">{locations.map((location) => <CombatLocationCard key={location.id} location={location} selected={location.id === selectedLocationId} onSelect={() => onSelect(location.id)} />)}</div> : <div className="combat-location-filter-empty"><strong>NO MATCHING LOCATIONS</strong><span>Clear the element filter or choose another location type.</span></div>}
  </section>
}
