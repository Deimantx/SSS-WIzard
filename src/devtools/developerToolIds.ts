export const DEVELOPER_TOOL_IDS = [
  'quick', 'scenarios', 'offline-bank', 'character', 'arcane-core', 'spells', 'resonance',
  'acolytes', 'channeling', 'research', 'transmutation', 'artificing', 'inventory', 'artifacts',
  'crystals', 'sigils', 'combat', 'combat-encounter', 'combat-boss', 'combat-actions', 'combat-balance', 'combat-telemetry', 'universal-loot-tiers', 'monsters', 'statuses', 'progression', 'chronicles',
  'magic-schools', 'save', 'diagnostics', 'ui-tuning',
] as const

export type DeveloperToolsTab = typeof DEVELOPER_TOOL_IDS[number]
