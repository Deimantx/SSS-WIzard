export const DEVELOPER_TOOL_IDS = [
  'quick', 'scenarios', 'offline-bank', 'character', 'arcane-core', 'spells', 'schools', 'resonance',
  'acolytes', 'channeling', 'research', 'transmutation', 'artificing', 'summoning', 'inventory', 'artifacts',
  'crystals', 'sigils', 'combat', 'world-tier', 'monsters', 'statuses', 'progression', 'chronicles', 'guild',
  'archive', 'story-portal', 'save', 'diagnostics', 'ui-tuning', 'settings',
] as const

export type DeveloperToolsTab = typeof DEVELOPER_TOOL_IDS[number]
