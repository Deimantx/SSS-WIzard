export const HUNTER_UPGRADES = [
  { id: 'trail-kit', name: 'Trail Kit', description: 'Reduce Hunt Contract kill targets by 3%, 3%, then 4% per rank. Boss targets are unaffected.', requiredRank: 'tracker', maxRank: 3, markCosts: [3, 5, 8], effect: { type: 'target-reduction-percent', rankAmounts: [0.03, 0.03, 0.04] } },
  { id: 'marked-quarry', name: 'Marked Quarry', description: 'Earn 10% more Hunter Reputation from completed contracts per rank.', requiredRank: 'scout', maxRank: 3, markCosts: [5, 8, 12], effect: { type: 'reputation-bonus', amount: 0.1 } },
  { id: 'extended-trails', name: 'Extended Trails', description: 'Add one Hunter target block slot per rank.', requiredRank: 'stalker', maxRank: 2, markCosts: [6, 10], effect: { type: 'block-slots', amount: 1 } },
  { id: 'deep-pockets', name: 'Deep Pockets', description: 'Earn 1 additional Hunter Mark from completed contracts per rank.', requiredRank: 'warden', maxRank: 3, markCosts: [7, 11, 16], effect: { type: 'bonus-marks', amount: 1 } },
  { id: 'contract-portfolio', name: 'Contract Portfolio', description: 'Add one Hunt Contract choice to each board per rank.', requiredRank: 'scout', maxRank: 3, markCosts: [5, 8, 12], effect: { type: 'contract-choices', amount: 1 } },
  { id: 'negotiated-rerolls', name: 'Negotiated Rerolls', description: 'Reduce the Hunter Mark cost of refreshing the Contract board by one per rank.', requiredRank: 'veteran', maxRank: 3, markCosts: [7, 11, 16], effect: { type: 'reroll-cost-reduction', amount: 1 } },
  { id: 'order-privilege', name: 'Order Privilege', description: 'Reduce the Hunter Mark cost of skipping a Contract by one per rank.', requiredRank: 'warden', maxRank: 3, markCosts: [8, 12, 18], effect: { type: 'skip-cost-reduction', amount: 1 } },
] as const
