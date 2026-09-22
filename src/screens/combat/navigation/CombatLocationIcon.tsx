import { Castle, Crown, Gem, MapPin, Shield, Swords } from 'lucide-react'
import type { CombatLocationType } from '../../../game/content/world-navigation'

/** One semantic icon contract shared by the location browser and inspector. */
export const COMBAT_LOCATION_ICONS = {
  'combat-zone': MapPin,
  'elite-zone': Shield,
  'special-zone': Gem,
  dungeon: Crown,
  tower: Castle,
} as const

export function CombatLocationIcon({ type, size = 16 }: { type: CombatLocationType; size?: number }) {
  const Icon = COMBAT_LOCATION_ICONS[type]
  return <Icon size={size} />
}
