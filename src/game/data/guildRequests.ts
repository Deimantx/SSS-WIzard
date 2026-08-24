export const GUILD_REQUESTS = {
  'arcane-supply': { id: 'arcane-supply', name: 'Arcane Supply', description: 'Donate Fire Fragments to light the guild hearth.', kind: 'donation' as const, itemId: 'fire-fragment' as const, target: 20, reputation: 50 },
  'clear-the-woods': { id: 'clear-the-woods', name: 'Clear the Woods', description: 'Defeat normal monsters in Whispering Woods.', kind: 'kills' as const, target: 30, reputation: 50 },
  'sentinel-breaker': { id: 'sentinel-breaker', name: 'Sentinel Breaker', description: 'Defeat Grove Sentinel twice.', kind: 'boss-kills' as const, target: 2, reputation: 75 },
}
