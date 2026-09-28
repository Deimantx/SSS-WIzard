export const HUNTER_UPGRADES = [
  { id: 'trail-kit', name: 'Trail Kit', description: 'Reduce Hunt Contract kill targets by one per rank.', requiredRank: 'tracker', maxRank: 3, markCosts: [6, 12, 20], effect: { type: 'target-reduction', amount: 1 } },
  { id: 'marked-quarry', name: 'Marked Quarry', description: 'Earn 10% more Hunter Reputation from completed contracts per rank.', requiredRank: 'scout', maxRank: 3, markCosts: [10, 18, 30], effect: { type: 'reputation-bonus', amount: 0.1 } },
  { id: 'extended-trails', name: 'Extended Trails', description: 'Add one Hunter target block slot per rank.', requiredRank: 'stalker', maxRank: 2, markCosts: [12, 24], effect: { type: 'block-slots', amount: 1 } },
  { id: 'deep-pockets', name: 'Deep Pockets', description: 'Earn 1 additional Hunter Mark from completed contracts per rank.', requiredRank: 'warden', maxRank: 3, markCosts: [14, 24, 36], effect: { type: 'bonus-marks', amount: 1 } },
  { id: 'contract-portfolio', name: 'Contract Portfolio', description: 'Add one Hunt Contract choice to each board per rank.', requiredRank: 'scout', maxRank: 3, markCosts: [10, 20, 35], effect: { type: 'contract-choices', amount: 1 } },
  { id: 'negotiated-rerolls', name: 'Negotiated Rerolls', description: 'Reduce the Hunter Mark cost of refreshing the Contract board by one per rank.', requiredRank: 'veteran', maxRank: 3, markCosts: [14, 28, 44], effect: { type: 'reroll-cost-reduction', amount: 1 } },
  { id: 'order-privilege', name: 'Order Privilege', description: 'Reduce the Hunter Mark cost of skipping a Contract by one per rank.', requiredRank: 'warden', maxRank: 3, markCosts: [16, 32, 50], effect: { type: 'skip-cost-reduction', amount: 1 } },
] as const
