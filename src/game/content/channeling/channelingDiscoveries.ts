import type { ChannelingDiscoveryId } from '../../types'

export interface ChannelingDiscoveryDefinition {
  id: ChannelingDiscoveryId
  name: string
  description: string
  conditionDescription: string
  rewardDescription: string
}

export const CHANNELING_DISCOVERIES: readonly ChannelingDiscoveryDefinition[] = [
  { id: 'stable-leyline', name: 'Stable Leyline', description: 'The tower’s natural current settles into a reliable rhythm.', conditionDescription: 'Generate 2,500 Arcane Flux.', rewardDescription: '+5% Arcane Flux production.' },
  { id: 'echo-resonance', name: 'Harmonic Workforce', description: 'A staffed channeling chamber sustains a resonant harmonic.', conditionDescription: 'Maintain 3 Channeling Acolytes simultaneously for 120 seconds.', rewardDescription: '+10% Channeling Acolyte output.' },
  { id: 'deep-reservoir', name: 'Deep Reservoir', description: 'The tower learns to hold a deeper reserve of stored leyline power.', conditionDescription: 'Reach 1,500 Maximum Arcane Flux capacity.', rewardDescription: '+250 Max Arcane Flux.' },
]

export const CHANNELING_DISCOVERY_PLACEHOLDERS = Array.from({ length: 6 }, (_, index) => ({ id: `undiscovered-${index + 1}`, name: '???', description: 'Undiscovered', conditionDescription: 'An undiscovered principle of Channeling.', rewardDescription: '' }))
