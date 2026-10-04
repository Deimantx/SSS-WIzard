import { LockKeyhole, Flame, Droplets, Wind, Mountain, Sparkles } from 'lucide-react'
import { GameTooltip, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import type { CombatLocationViewModel } from '../../../game/presentation/combat/combatWorldNavigationTypes'
import { CombatLocationIcon } from './CombatLocationIcon'
import type { ElementId } from '../../../game/content/elements/elements'

const elementIcons = { fire: Flame, water: Droplets, air: Wind, earth: Mountain, arcane: Sparkles }

export function CombatLocationCard({ location, selected, onSelect }: { location: CombatLocationViewModel; selected: boolean; onSelect: () => void }) {
  const locked = location.state === 'locked'
  const tooltip = locked && location.unlockText
    ? <TooltipContent title="Location locked" description={location.unlockText} />
    : <TooltipContent title={location.name} description={`Tier ${location.tier} · ${location.typeLabel} · ${location.statusLabel}`} />

  return <GameTooltip block content={tooltip} accent={locked ? 'neutral' : location.state === 'boss-ready' ? 'warning' : 'elemental'}>
    <button type="button" className={`combat-location-card is-${location.state}${selected ? ' is-selected' : ''}`} aria-pressed={selected} aria-label={`${location.name}, ${location.typeLabel}, ${location.statusLabel}`} data-location-id={location.id} onClick={onSelect}>
      <span className="combat-location-card-icon" aria-hidden="true"><CombatLocationIcon type={location.type} /></span>
      <span className="combat-location-card-copy"><strong>{location.name}</strong><small><span>T{location.tier} · {location.typeLabel}</span>{location.progressionType === 'combat-zone' && location.primaryElement && <span className="combat-location-element-badge">{(() => { const ElementIcon = elementIcons[location.primaryElement as ElementId]; return <ElementIcon size={10} aria-hidden="true" /> })()}{location.primaryElement.toUpperCase()}</span>}</small></span>
      <Status tone={location.state === 'locked' ? 'locked' : location.state === 'completed' ? 'success' : location.state === 'boss-ready' ? 'warning' : 'active'}>{location.statusLabel}</Status>
      {location.state === 'locked' && <LockKeyhole className="combat-location-card-lock" size={13} aria-hidden="true" />}
    </button>
  </GameTooltip>
}
