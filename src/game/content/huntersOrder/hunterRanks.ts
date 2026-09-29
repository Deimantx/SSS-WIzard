import type { HunterRankId } from '../../types'
export interface HunterRankDefinition { id: HunterRankId; name: string; reputation: number; unlocks: readonly string[] }
export const HUNTER_RANKS: readonly HunterRankDefinition[] = [
  { id: 'tracker', name: 'Tracker', reputation: 0, unlocks: ['One random Routine assignment at a time', 'Trail Kit upgrade'] },
  { id: 'scout', name: 'Scout', reputation: 1250, unlocks: ['Three-choice Contract Board', 'Family Contracts', 'Special Contracts', 'Marked Quarry', 'Contract Portfolio'] },
  { id: 'stalker', name: 'Stalker', reputation: 4000, unlocks: ['Alignment Contracts', 'Extended Trails', 'Target Blocks'] },
  { id: 'warden', name: 'Warden', reputation: 9000, unlocks: ['Region Contracts', 'Deep Pockets', 'Order Privilege'] },
  { id: 'veteran', name: 'Veteran', reputation: 17500, unlocks: ['Prestigious Contracts', 'Negotiated Rerolls'] },
  { id: 'master-hunter', name: 'Master Hunter', reputation: 32500, unlocks: ['Nightglass Alpha Boss Contracts', 'Apex Hunt access'] },
]
