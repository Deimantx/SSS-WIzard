import type { HunterRankId } from '../../types'
export interface HunterRankDefinition { id: HunterRankId; name: string; reputation: number }
export const HUNTER_RANKS: readonly HunterRankDefinition[] = [
  { id: 'tracker', name: 'Tracker', reputation: 0 },
  { id: 'scout', name: 'Scout', reputation: 250 },
  { id: 'stalker', name: 'Stalker', reputation: 800 },
  { id: 'warden', name: 'Warden', reputation: 1800 },
  { id: 'veteran', name: 'Veteran', reputation: 3500 },
  { id: 'master-hunter', name: 'Master Hunter', reputation: 6500 },
]
