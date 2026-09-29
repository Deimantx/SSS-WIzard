import type { GameState } from '../../game/types'

/** Purpose-built V2 document. Runtime UI, debug state, and notifications have no fields here. */
export interface PersistedGameStateV1 {
  schemaVersion: 1
  savedAt: number
  player: Pick<GameState['player'], 'health' | 'mana' | 'baseMaxHealth' | 'baseMaxMana' | 'healthRegenTimerMs'>
  schools: GameState['schools']
  currencies: GameState['currencies']
  resonance: GameState['resonance']
  tower: GameState['tower']
  worldTier: GameState['worldTier']
  inventory: GameState['inventory']
  crystals: GameState['crystals']
  protectedItems: GameState['protectedItems']
  equipment: GameState['equipment']
  arcaneCore: GameState['arcaneCore']
  artifactProgress: GameState['artifactProgress']
  sigils: GameState['sigils']
  guardians: GameState['guardians']
  activities: GameState['activities']
  combat: Omit<GameState['combat'], 'log'>
  progress: GameState['progress']
  storyProgress: GameState['storyProgress']
  darkPortal: GameState['darkPortal']
  spellPresets: GameState['spellPresets']
  offlineBankMs: number
}

export const PERSISTED_GAMEPLAY_FIELDS = [
  'player', 'schools', 'currencies', 'resonance', 'tower', 'worldTier', 'inventory', 'crystals',
  'protectedItems', 'equipment', 'arcaneCore', 'artifactProgress', 'sigils', 'guardians', 'activities',
  'combat', 'progress', 'storyProgress', 'darkPortal', 'spellPresets', 'offlineBankMs',
] as const satisfies readonly (keyof PersistedGameStateV1)[]
