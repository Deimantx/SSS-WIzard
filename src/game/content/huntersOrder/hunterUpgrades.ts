import type { HunterRankId } from '../../types'
import { getHunterUpgradeCosts } from './hunterUpgradeCosts'

export const HUNTER_UPGRADE_CATEGORIES = ['control', 'efficiency', 'rewards', 'harvest', 'intelligence'] as const
export type HunterUpgradeCategory = typeof HUNTER_UPGRADE_CATEGORIES[number]
const define = (id: string, name: string, category: HunterUpgradeCategory, requiredStanding: `${HunterRankId}-${1 | 2 | 3 | 4 | 5}`, maxRank: number, type: string, amount = 0, rankAmounts?: number[]) => {
  const rank = requiredStanding.slice(0, requiredStanding.lastIndexOf('-')) as HunterRankId
  const descriptions: Record<string, string> = {
    'negotiated-rerolls': 'Reduce the Hunter Mark cost to refresh unpinned Contract offers.', 'order-privilege': 'Reduce the Hunter Mark cost to abandon an active Contract.', 'extended-trails': 'Add permanent Target Block slots for quarry excluded from future offers.',
    'pinned-orders': 'Pin selected board offers so they survive a Board refresh.', 'dispatch-directives': 'Choose a preferred Contract archetype and influence its appearance on the Board.', 'contract-recall': 'Keep valid unchosen offers when a Contract completes, then refill remaining slots.',
    'trail-kit': 'Reduce kill requirements for every supported Contract archetype.', 'exact-quarry-briefing': 'Reduce kill requirements on single-monster assignments.', 'family-cull-orders': 'Reduce kill requirements on Family Contracts.', 'alignment-pursuit-orders': 'Reduce kill requirements on Alignment Contracts.', 'ground-patrol-orders': 'Reduce kill requirements on Ground Patrol Contracts.', 'prestigious-preparation': 'Reduce kill requirements on Prestigious Contracts. All reductions share a 25% cap.',
    'marked-quarry': 'Increase Hunter Reputation earned from completed Contracts.', 'routine-commendation': 'Increase Reputation from Routine Contracts.', 'special-commendation': 'Increase Reputation from Special Contracts.', 'prestige-recognition': 'Increase Reputation from Prestigious Contracts.', 'deep-pockets': 'Earn additional Hunter Marks for each completed Contract.', 'broad-assignment-pay': 'Earn additional Marks from Family, Alignment, and Ground Patrol Contracts.',
    'resonant-claim': 'Increase Resonance from quarry that can advance the active Contract.', 'essence-claim': 'Increase Life Essence from authorized Contract quarry.', 'fragment-rights': 'Improve normal material drop chance multiplicatively for authorized quarry.', 'sigil-claim': 'Improve Sigil drop chance multiplicatively for authorized quarry.', 'resonant-completion': 'Grant a Resonance bonus when a Contract is completed.', 'essence-completion': 'Grant deterministic Life Essence when a Contract is completed.',
    'hunt-forecast': 'Unlock kill-rate and completion-time estimates when recent combat telemetry supports them.', 'board-forecast': 'Show reward per kill, Marks, and eligible quarry count on Board offers.', 'quarry-memory': 'Remember the last selected eligible quarry separately for each Hunting Ground.', 'ground-survey': 'Spread Board offers across multiple unlocked Hunting Grounds when alternatives exist.', 'priority-dispatch': 'Select a preferred Hunting Ground and influence its share of Board offers.', 'master-dossier': 'Reveal limited identity and contract metadata for undiscovered eligible quarry.',
  }
  return { id, name, category, requiredStanding, requiredRank: rank, maxRank, markCosts: getHunterUpgradeCosts(rank, maxRank), description: descriptions[id] ?? name, effect: rankAmounts ? { type, rankAmounts } : { type, amount } }
}

export const HUNTER_UPGRADES = [
  define('negotiated-rerolls', 'Negotiated Rerolls', 'control', 'scout-2', 3, 'reroll-cost-reduction', 1),
  define('order-privilege', 'Order Privilege', 'control', 'warden-1', 3, 'skip-cost-reduction', 1),
  define('extended-trails', 'Extended Trails', 'control', 'stalker-1', 3, 'block-slots', 1),
  define('pinned-orders', 'Pinned Orders', 'control', 'scout-4', 2, 'pin-slots', 1),
  define('dispatch-directives', 'Dispatch Directives', 'control', 'stalker-5', 3, 'dispatch-directives', 1),
  define('contract-recall', 'Contract Recall', 'control', 'veteran-4', 3, 'contract-recall', 1),
  define('trail-kit', 'Trail Kit', 'efficiency', 'tracker-1', 5, 'target-reduction-percent', 0.02),
  define('exact-quarry-briefing', 'Exact Quarry Briefing', 'efficiency', 'tracker-3', 3, 'monster-target-reduction-percent', 0.02),
  define('family-cull-orders', 'Family Cull Orders', 'efficiency', 'scout-5', 3, 'family-target-reduction-percent', 0.02),
  define('alignment-pursuit-orders', 'Alignment Pursuit Orders', 'efficiency', 'stalker-2', 3, 'alignment-target-reduction-percent', 0.02),
  define('ground-patrol-orders', 'Ground Patrol Orders', 'efficiency', 'warden-2', 3, 'region-target-reduction-percent', 0.02),
  define('prestigious-preparation', 'Prestigious Preparation', 'efficiency', 'veteran-2', 3, 'prestigious-target-reduction-percent', 0.02),
  define('marked-quarry', 'Marked Quarry', 'rewards', 'scout-1', 5, 'reputation-bonus', 0.08),
  define('routine-commendation', 'Routine Commendation', 'rewards', 'tracker-5', 3, 'routine-reputation-bonus', 0.05),
  define('special-commendation', 'Special Commendation', 'rewards', 'scout-3', 3, 'special-reputation-bonus', 0.07),
  define('prestige-recognition', 'Prestige Recognition', 'rewards', 'veteran-1', 3, 'prestigious-reputation-bonus', 0.10),
  define('deep-pockets', 'Deep Pockets', 'rewards', 'stalker-3', 5, 'bonus-marks', 1),
  define('broad-assignment-pay', 'Broad Assignment Pay', 'rewards', 'warden-5', 3, 'broad-bonus-marks', 1),
  define('resonant-claim', 'Resonant Claim', 'harvest', 'stalker-4', 5, 'resonance-yield', 0.05),
  define('essence-claim', 'Essence Claim', 'harvest', 'warden-3', 5, 'essence-yield', 0.05),
  define('fragment-rights', 'Fragment Rights', 'harvest', 'veteran-3', 3, 'item-drop-multiplier', 0.05),
  define('sigil-claim', 'Sigil Claim', 'harvest', 'master-hunter-2', 3, 'sigil-drop-multiplier', 0.03),
  define('resonant-completion', 'Resonant Completion', 'harvest', 'master-hunter-3', 3, 'completion-resonance', 1),
  define('essence-completion', 'Essence Completion', 'harvest', 'master-hunter-4', 3, 'completion-essence', 1),
  define('hunt-forecast', 'Hunt Forecast', 'intelligence', 'tracker-2', 1, 'hunt-forecast'),
  define('board-forecast', 'Board Forecast', 'intelligence', 'scout-2', 1, 'board-forecast'),
  define('quarry-memory', 'Quarry Memory', 'intelligence', 'scout-4', 1, 'quarry-memory'),
  define('ground-survey', 'Ground Survey', 'intelligence', 'warden-4', 3, 'ground-survey'),
  define('priority-dispatch', 'Priority Dispatch', 'intelligence', 'veteran-5', 3, 'priority-dispatch'),
  define('master-dossier', 'Master Dossier', 'intelligence', 'master-hunter-1', 1, 'master-dossier'),
] as const

export type HunterUpgradeId = typeof HUNTER_UPGRADES[number]['id']
