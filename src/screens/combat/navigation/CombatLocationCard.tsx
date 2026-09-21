import { Crown, Gem, LockKeyhole, MapPin, Shield } from 'lucide-react'
import { GameTooltip, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { COMBAT_LOCATION_TYPE_METADATA } from '../../../game/content/world-navigation'
import type { CombatLocationViewModel } from '../../../game/presentation/combat/combatWorldNavigationTypes'

const LOCATION_ICONS = {
  'combat-zone': MapPin,
  'elite-zone': Shield,
  'special-zone': Gem,
  dungeon: Shield,
  tower: Crown,
} as const

export function CombatLocationCard({ location, selected, onSelect }: { location: CombatLocationViewModel; selected: boolean; onSelect: () => void }) {
  const Icon = LOCATION_ICONS[location.type]
  const locked = location.state === 'locked'
  const tooltip = locked && location.unlockText
    ? <TooltipContent title="Location locked" description={location.unlockText} />
    : <TooltipContent title={location.name} description={`${location.typeLabel} · ${location.statusLabel}`} />

  return <GameTooltip block content={tooltip} accent={locked ? 'neutral' : location.state === 'boss-ready' ? 'warning' : 'elemental'}>
    <button type="button" className={`combat-location-card is-${location.state}${selected ? ' is-selected' : ''}`} aria-pressed={selected} aria-label={`${location.name}, ${location.typeLabel}, ${location.statusLabel}`} data-location-id={location.id} onClick={onSelect}>
      <span className="combat-location-card-icon" aria-hidden="true"><Icon size={16} /></span>
      <span className="combat-location-card-copy"><strong>{location.name}</strong><small>{COMBAT_LOCATION_TYPE_METADATA[location.type].label}</small></span>
      <Status tone={location.state === 'locked' ? 'locked' : location.state === 'completed' ? 'success' : location.state === 'boss-ready' ? 'warning' : 'active'}>{location.statusLabel}</Status>
      {location.state === 'locked' && <LockKeyhole className="combat-location-card-lock" size={13} aria-hidden="true" />}
    </button>
  </GameTooltip>
}

