import type { CombatLocationGroupViewModel } from '../../../game/presentation/combat/combatWorldNavigationTypes'
import { CombatLocationCard } from './CombatLocationCard'

export function CombatLocationBrowser({ groups, selectedLocationId, onSelect }: { groups: CombatLocationGroupViewModel[]; selectedLocationId: string | null; onSelect: (locationId: string) => void }) {
  return <section className="combat-location-browser" aria-label="Locations">
    <header className="combat-location-browser-head"><div><span className="combat-subsection-label">LOCATIONS</span><p>Select a destination to inspect it before entering.</p></div><span className="combat-location-browser-count">{groups.reduce((count, group) => count + group.locations.length, 0)} LOCATIONS</span></header>
    <div className="combat-location-groups">
      {groups.map((group) => <section className={`combat-location-group combat-location-group-${group.type}`} key={group.type}>
        <header><span>{group.label}</span><small>{group.locations.length}</small></header>
        <div className="combat-location-card-list">{group.locations.map((location) => <CombatLocationCard key={location.id} location={location} selected={location.id === selectedLocationId} onSelect={() => onSelect(location.id)} />)}</div>
      </section>)}
    </div>
  </section>
}

