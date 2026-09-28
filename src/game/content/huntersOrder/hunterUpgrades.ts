export const HUNTER_UPGRADES = [
  { id: 'trail-kit', name: 'Trail Kit', description: 'Reduce Hunt Contract kill targets by one per rank.', maxRank: 3, markCosts: [6, 12, 20] },
  { id: 'marked-quarry', name: 'Marked Quarry', description: 'Earn 10% more Hunter Reputation from completed contracts per rank.', maxRank: 3, markCosts: [10, 18, 30] },
  { id: 'extended-trails', name: 'Extended Trails', description: 'Add one Hunter target block slot per rank.', maxRank: 2, markCosts: [12, 24] },
  { id: 'deep-pockets', name: 'Deep Pockets', description: 'Earn 1 additional Hunter Mark from completed contracts per rank.', maxRank: 3, markCosts: [14, 24, 36] },
] as const