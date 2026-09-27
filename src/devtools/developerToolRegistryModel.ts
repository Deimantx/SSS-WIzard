import type { DeveloperToolsTab } from './developerToolIds'

export type DeveloperWorkspaceId = 'dashboard' | 'player' | 'magic' | 'tower' | 'equipment' | 'combat' | 'progression' | 'system'

export interface DeveloperWorkspaceDefinition {
  id: DeveloperWorkspaceId
  label: string
  eyebrow: string
  description: string
}

export interface DeveloperToolMetadata {
  id: DeveloperToolsTab
  workspace: DeveloperWorkspaceId
  label: string
  description: string
  keywords: string[]
}

export const DEVELOPER_WORKSPACES: readonly DeveloperWorkspaceDefinition[] = [
  { id: 'dashboard', label: 'Dashboard', eyebrow: 'COMMAND', description: 'Orient quickly, prepare a test state, and review the current session.' },
  { id: 'player', label: 'Player', eyebrow: 'PLAYER', description: 'Inspect the resolved character sheet and progression core.' },
  { id: 'magic', label: 'Magic', eyebrow: 'MAGIC', description: 'Test spells, schools, and resonance resources.' },
  { id: 'tower', label: 'Tower', eyebrow: 'TOWER', description: 'Exercise acolytes, channeling, research, and production systems.' },
  { id: 'equipment', label: 'Equipment', eyebrow: 'EQUIPMENT', description: 'Inspect inventory, artifacts, crystals, and sigils.' },
  { id: 'combat', label: 'Combat', eyebrow: 'COMBAT', description: 'Prepare encounters, inspect effects, and measure combat.' },
  { id: 'progression', label: 'Progression', eyebrow: 'PROGRESSION', description: 'Inspect chronicles and progression evidence.' },
  { id: 'system', label: 'System', eyebrow: 'SYSTEM', description: 'Review saves, diagnostics, and UI tuning.' },
]

export const DEVELOPER_TOOL_METADATA: readonly DeveloperToolMetadata[] = [
  { id: 'quick', workspace: 'dashboard', label: 'Quick Setup', description: 'Prepare a known testing state and manage Offline Bank fixtures.', keywords: ['setup', 'scenario', 'fixture', 'offline'] },
  { id: 'scenarios', workspace: 'dashboard', label: 'Scenarios', description: 'Run authored, explicit testing scenarios.', keywords: ['scenario', 'fixture', 'prepare'] },
  { id: 'offline-bank', workspace: 'dashboard', label: 'Offline Bank', description: 'Add, set, and clear banked simulation time.', keywords: ['offline', 'bank', 'time'] },
  { id: 'character', workspace: 'player', label: 'Character', description: 'Inspect resolved combat values and player overrides.', keywords: ['player', 'stats', 'character'] },
  { id: 'arcane-core', workspace: 'player', label: 'Arcane Core', description: 'Test branches, rings, gates, and node ranks.', keywords: ['arcane', 'core', 'nodes', 'rings'] },
  { id: 'spells', workspace: 'magic', label: 'Spells & Schools', description: 'Browse spells and switch to school progression.', keywords: ['spells', 'schools', 'magic'] },
  { id: 'schools', workspace: 'magic', label: 'Schools', description: 'Inspect authored school levels and experience.', keywords: ['schools', 'magic', 'xp'] },
  { id: 'resonance', workspace: 'magic', label: 'Resonance', description: 'Inspect and manipulate resonance resources.', keywords: ['resonance', 'resources'] },
  { id: 'acolytes', workspace: 'tower', label: 'Acolytes', description: 'Inspect roster capacity and assignment totals.', keywords: ['acolytes', 'roster', 'assignments'] },
  { id: 'channeling', workspace: 'tower', label: 'Channeling', description: 'Test channeling assignments and Mana Pillars.', keywords: ['channeling', 'flux', 'pillars'] },
  { id: 'research', workspace: 'tower', label: 'Research', description: 'Prepare research jobs and inspect their read models.', keywords: ['research', 'school', 'jobs'] },
  { id: 'transmutation', workspace: 'tower', label: 'Transmutation', description: 'Browse recipes, ingredients, and production actions.', keywords: ['transmutation', 'recipes', 'production'] },
  { id: 'artificing', workspace: 'tower', label: 'Artificing', description: 'Inspect and exercise equipment acquisition recipes.', keywords: ['artificing', 'crafting', 'recipes'] },
  { id: 'summoning', workspace: 'tower', label: 'Summoning', description: 'Inspect Guardian runtime state and activation.', keywords: ['summoning', 'guardians', 'tower'] },
  { id: 'inventory', workspace: 'equipment', label: 'Inventory & Equipment', description: 'Browse owned items and equipment relationships.', keywords: ['inventory', 'equipment', 'items'] },
  { id: 'artifacts', workspace: 'equipment', label: 'Artifacts', description: 'Test artifact paths, ranks, and milestones.', keywords: ['artifacts', 'rank', 'path'] },
  { id: 'crystals', workspace: 'equipment', label: 'Crystals', description: 'Inspect crystal slots, dust, and generators.', keywords: ['crystals', 'dust', 'slots'] },
  { id: 'sigils', workspace: 'equipment', label: 'Sigils', description: 'Generate, inspect, enhance, and simulate sigils.', keywords: ['sigils', 'generator', 'traits', 'drop'] },
  { id: 'combat', workspace: 'combat', label: 'Combat Lab', description: 'Run live combat, encounters, bosses, actions, effects, and telemetry.', keywords: ['combat', 'lab', 'encounter', 'boss', 'telemetry'] },
  { id: 'world-tier', workspace: 'combat', label: 'World Tier', description: 'Inspect world tier definitions and progression.', keywords: ['world', 'tier', 'combat'] },
  { id: 'monsters', workspace: 'combat', label: 'Enemies', description: 'Inspect authored monsters and deep-link into Combat Lab.', keywords: ['monsters', 'enemies', 'bestiary'] },
  { id: 'statuses', workspace: 'combat', label: 'Effects', description: 'Inspect active combat effects and status definitions.', keywords: ['statuses', 'effects', 'barrier'] },
  { id: 'progression', workspace: 'progression', label: 'Overview', description: 'Inspect broad progression state.', keywords: ['progression', 'guild'] },
  { id: 'chronicles', workspace: 'progression', label: 'Chronicles', description: 'Inspect objective and event progression.', keywords: ['chronicles', 'objectives', 'story'] },
  { id: 'guild', workspace: 'progression', label: 'Guild', description: 'Test Guild ranks, reputation, contracts, and skills.', keywords: ['guild', 'contracts', 'reputation', 'skills'] },
  { id: 'archive', workspace: 'progression', label: 'Archive', description: 'Inspect discovery evidence for items, creatures, and sigils.', keywords: ['archive', 'collection', 'discovery', 'bestiary'] },
  { id: 'story-portal', workspace: 'progression', label: 'Story / Portal', description: 'Inspect story events and Dark Portal progression.', keywords: ['story', 'portal', 'shards'] },
  { id: 'save', workspace: 'system', label: 'Save & Profile', description: 'Inspect profile saves and controlled reset actions.', keywords: ['save', 'profile', 'reset'] },
  { id: 'diagnostics', workspace: 'system', label: 'Diagnostics', description: 'Inspect save health, content validation, and performance.', keywords: ['diagnostics', 'health', 'performance'] },
  { id: 'ui-tuning', workspace: 'system', label: 'UI Tuning', description: 'Inspect developer-only UI tuning drafts.', keywords: ['ui', 'tuning', 'layout'] },
  { id: 'settings', workspace: 'system', label: 'Developer Settings', description: 'Configure developer-session presentation preferences.', keywords: ['settings', 'technical ids'] },
]

export const getDeveloperToolMetadata = (id: DeveloperToolsTab) => DEVELOPER_TOOL_METADATA.find((tool) => tool.id === id)
export const getDeveloperWorkspace = (id: DeveloperToolsTab): DeveloperWorkspaceId => getDeveloperToolMetadata(id)?.workspace ?? 'dashboard'
export const getDefaultDeveloperTool = (workspace: DeveloperWorkspaceId): DeveloperToolsTab => DEVELOPER_TOOL_METADATA.find((tool) => tool.workspace === workspace)?.id ?? 'quick'
