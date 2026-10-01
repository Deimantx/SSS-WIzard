import { Crosshair, Crown, MapPin, Shield } from 'lucide-react'
import type { CombatLocationType } from '../../../game/content/combat-locations'

/** One semantic icon contract shared by the location browser and inspector. */
export const COMBAT_LOCATION_ICONS = {
  'combat-zone': MapPin,
  'elite-zone': Shield,
  'hunting-ground': Crosshair,
  dungeon: Crown,
} as const

export function CombatLocationIcon({ type, size = 16 }: { type: CombatLocationType; size?: number }) {
  const Icon = COMBAT_LOCATION_ICONS[type]
  return <Icon size={size} />
}
