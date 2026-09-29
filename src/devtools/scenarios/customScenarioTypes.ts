import type { GameState, ScreenId } from '../../game/types'

export const DEVELOPER_SCENARIO_SCHEMA_VERSION = 1 as const
export const DEVELOPER_SCENARIO_DB_NAME = 'sss-wizard-dev-scenarios'
export const DEVELOPER_SCENARIO_DB_VERSION = 1
export const DEVELOPER_SCENARIO_STORE = 'scenarios'

export interface DeveloperScenarioSummary {
  hunterRankLabel: string
  hunterReputation: number
  guildRankLabel: string
  guildReputation: number
  activeDungeonLabel: string | null
  activeEnemyLabel: string | null
  inventoryItemCount: number
  spellPresetCount: number
  offlineBankMs: number
  combatActive: boolean
}

export interface DeveloperScenarioSnapshot {
  gameState: GameState
  viewContext: { screen: ScreenId }
  summary: DeveloperScenarioSummary
}

export interface DeveloperScenarioRecord {
  id: string
  name: string
  description: string
  tags: string[]
  createdAt: number
  updatedAt: number
  sourceAppVersion: string
  scenarioSchemaVersion: typeof DEVELOPER_SCENARIO_SCHEMA_VERSION
  snapshot: DeveloperScenarioSnapshot
}

export type DeveloperScenarioDraft = Pick<DeveloperScenarioRecord, 'name' | 'description' | 'tags'>
