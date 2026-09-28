import type { HunterRankId } from '../../types'
export interface HunterRankDefinition { id: HunterRankId; name: string; reputation: number; unlocks: readonly string[] }
export const HUNTER_RANKS: readonly HunterRankDefinition[] = [
  { id: 'tracker', name: 'Tracker', reputation: 0, unlocks: ['Routine Contracts', 'Trail Kit upgrade'] },
  { id: 'scout', name: 'Scout', reputation: 250, unlocks: ['Family Contracts', 'Special Contracts', 'Marked Quarry', 'Contract Portfolio'] },
  { id: 'stalker', name: 'Stalker', reputation: 800, unlocks: ['Alignment Contracts', 'Extended Trails'] },
  { id: 'warden', name: 'Warden', reputation: 1800, unlocks: ['Region Contracts', 'Deep Pockets', 'Order Privilege'] },
  { id: 'veteran', name: 'Veteran', reputation: 3500, unlocks: ['Prestigious Contracts', 'Negotiated Rerolls'] },
  { id: 'master-hunter', name: 'Master Hunter', reputation: 6500, unlocks: ['Nightglass Alpha Boss Contracts', 'Apex Hunt access'] },
]
