import type { HunterRankId } from '../../types'

export interface HunterStandingDefinition {
  id: `${HunterRankId}-${1 | 2 | 3 | 4 | 5}`
  rankId: HunterRankId
  grade: 1 | 2 | 3 | 4 | 5
  name: string
  reputation: number
  unlocks: readonly string[]
}

const categories: readonly { id: HunterRankId; name: string; thresholds: readonly number[]; unlocks: readonly (readonly string[])[] }[] = [
  { id: 'tracker', name: 'Tracker', thresholds: [0, 250, 500, 750, 1000], unlocks: [['Hunter Order', 'Free Routine assignment', 'Trail Kit'], ['Hunt Forecast'], ['2-choice Board', 'Exact Quarry Briefing'], ['Pinned Orders'], ['Routine Commendation']] },
  { id: 'scout', name: 'Scout', thresholds: [1250, 1800, 2350, 2900, 3450], unlocks: [['Family Contracts', 'Marked Quarry'], ['Negotiated Rerolls', 'Board Forecast'], ['3-choice Board', 'Special Contracts', 'Special Commendation'], ['Quarry Memory'], ['Family Cull Orders']] },
  { id: 'stalker', name: 'Stalker', thresholds: [4000, 5000, 6000, 7000, 8000], unlocks: [['Alignment Contracts', 'Target Blocks', 'Extended Trails'], ['Alignment Pursuit Orders'], ['Deep Pockets'], ['Resonant Claim'], ['Dispatch Directives']] },
  { id: 'warden', name: 'Warden', thresholds: [9000, 10700, 12400, 14100, 15800], unlocks: [['Ground Patrol Contracts', 'Order Privilege'], ['Ground Patrol Orders'], ['Essence Claim'], ['Ground Survey'], ['Broad Assignment Pay']] },
  { id: 'veteran', name: 'Veteran', thresholds: [17500, 20500, 23500, 26500, 29500], unlocks: [['Prestigious Contracts', 'Prestige Recognition'], ['Prestigious Preparation'], ['Fragment Rights'], ['Contract Recall'], ['Priority Dispatch']] },
  { id: 'master-hunter', name: 'Master Hunter', thresholds: [32500, 38000, 43500, 49500, 56000], unlocks: [['Nightglass Alpha', 'Master Dossier'], ['Sigil Claim'], ['Resonant Completion'], ['Essence Completion'], ['Current Hunter Order cap']] },
]

export const HUNTER_STANDINGS: readonly HunterStandingDefinition[] = categories.flatMap((category) => category.thresholds.map((reputation, index) => ({
  id: `${category.id}-${index + 1}` as HunterStandingDefinition['id'], rankId: category.id, grade: (index + 1) as HunterStandingDefinition['grade'],
  name: `${category.name} ${['I', 'II', 'III', 'IV', 'V'][index]}`, reputation, unlocks: category.unlocks[index],
})))

/** Macro categories retain their historical thresholds and ids for save/caller compatibility. */
export interface HunterRankDefinition { id: HunterRankId; name: string; reputation: number; unlocks: readonly string[] }
export const HUNTER_RANKS: readonly HunterRankDefinition[] = categories.map((category) => ({ id: category.id, name: category.name, reputation: category.thresholds[0], unlocks: category.unlocks[0] }))
