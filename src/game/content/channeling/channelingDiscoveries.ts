import type { ChannelingDiscoveryId } from '../../types'

export interface ChannelingDiscoveryDefinition {
  id: ChannelingDiscoveryId
  name: string
  description: string
  conditionDescription: string
  rewardDescription: string
}

export const CHANNELING_DISCOVERIES: readonly ChannelingDiscoveryDefinition[] = [
  { id: 'stable-leyline', name: 'Stable Leyline', description: 'The tower’s natural current settles into a reliable rhythm.', conditionDescription: 'Generate 2,500 Mana through Channeling.', rewardDescription: '+1 Natural Mana Regeneration / second.' },
  { id: 'echo-resonance', name: 'Echo Resonance', description: 'Five Arcane Echoes sustain a resonant harmonic.', conditionDescription: 'Maintain 5 Arcane Echoes simultaneously for 120 seconds.', rewardDescription: 'Arcane Echo Mana generation +10%.' },
  { id: 'deep-reservoir', name: 'Deep Reservoir', description: 'The tower learns to hold a deeper reserve of condensed leyline power.', conditionDescription: 'Reach 225 Maximum Mana.', rewardDescription: '+25 Max Mana.' },
]

export const CHANNELING_DISCOVERY_PLACEHOLDERS = Array.from({ length: 6 }, (_, index) => ({ id: `undiscovered-${index + 1}`, name: '???', description: 'Undiscovered', conditionDescription: 'An undiscovered principle of Channeling.', rewardDescription: '' }))
