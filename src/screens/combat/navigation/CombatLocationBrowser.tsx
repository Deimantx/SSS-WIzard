import type { CombatLocationViewModel } from '../../../game/presentation/combat/combatWorldNavigationTypes'
import { CombatLocationCard } from './CombatLocationCard'

export function CombatLocationBrowser({ locations, selectedLocationId, onSelect }: { locations: CombatLocationViewModel[]; selectedLocationId: string | null; onSelect: (locationId: string) => void }) {
  return <section className="combat-location-browser" aria-label="Locations">
    <header className="combat-location-browser-head"><div><span className="combat-subsection-label">LOCATIONS</span><p>Select a destination to inspect it before entering.</p></div></header>
    <div className="combat-location-card-list">{locations.map((location) => <CombatLocationCard key={location.id} location={location} selected={location.id === selectedLocationId} onSelect={() => onSelect(location.id)} />)}</div>
  </section>
}
