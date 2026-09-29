import type { DungeonId, EquipmentPosition, GameState, GuildCommissionObjective, HunterRankId, HunterUpgradeId, ItemId, MonsterId, ResearchSlotId, SchoolId, TransmutationRecipeId, WorldTierId } from '../../game/types'

export type PersistedInventoryV1 = Partial<Record<ItemId, number>>
export type PersistedEquipmentV1 = Record<EquipmentPosition, ItemId | null>
export interface PersistedWorldV1 { current: WorldTierId; highestUnlocked: WorldTierId }

export interface PersistedResearchJobV1 {
  itemId: ItemId
  targetSchoolId: SchoolId
  requestedQuantity: number
  remainingQuantity: number
  progressMs: number
  acolyteAssigned?: boolean
  echoesAssigned?: number
  status: 'prepared' | 'running' | 'flux-limited' | 'waiting-flux' | 'mana-limited' | 'waiting-mana' | 'level-cap' | 'protected' | 'missing-item'
}
export interface PersistedResearchV1 { slots: Record<ResearchSlotId, PersistedResearchJobV1 | null> }
export interface PersistedTransmutationV1 {
  jobs: Partial<Record<TransmutationRecipeId, { acolyteAssigned?: boolean; progressMs: number; echoesAssigned?: number }>>
}
export type PersistedActivitiesV1 = Omit<GameState['activities'], 'research' | 'transmutation'> & {
  research: PersistedResearchV1
  transmutation: PersistedTransmutationV1
}

export type PersistedHunterTargetV1 =
  | { type: 'monster' | 'boss'; monsterId: MonsterId }
  | { type: 'region'; dungeonId: DungeonId }
  | { type: 'family'; familyId: string }
  | { type: 'alignment'; alignmentId: string }

export interface PersistedHunterContractV1 {
  id: string
  huntingGroundId?: DungeonId
  targetSpec: PersistedHunterTargetV1
  target: number
  progress: number
  tier: 'routine' | 'special' | 'prestigious'
  reputationReward: number
  marksReward: number
}

export interface PersistedHunterOrderV1 {
  reputation: number
  rankId: HunterRankId
  hunterMarks: number
  totalContractsAccepted: number
  activeContract: PersistedHunterContractV1 | null
  availableContracts: PersistedHunterContractV1[]
  pinnedContractIds?: string[]
  preferredContractType?: 'monster' | 'family' | 'alignment' | 'region' | 'boss' | null
  preferredHuntingGroundId?: DungeonId | null
  lastSelectedQuarryByGround?: Partial<Record<DungeonId, MonsterId>>
  blockedTargets: MonsterId[]
  purchasedUpgrades: Partial<Record<HunterUpgradeId, number>>
  totalContractsCompleted: number
  totalHunterKills: number
  generationCount: number
  rngState: number
  monsterHunterStats: Partial<Record<MonsterId, { contractKills: number; contractsCompleted: number; marksEarned: number }>>
}

export interface PersistedGuildCommissionV1 {
  id: string
  templateId: string
  category: 'supply' | 'channeling' | 'production' | 'research' | 'transmutation' | 'mixed'
  quality: 'routine' | 'special' | 'prestigious'
  objectives: GuildCommissionObjective[]
  reputationReward: number
  advancementPointReward: number
}

export interface PersistedArcaneGuildV1 {
  projects: Record<string, Partial<Record<ItemId, number>>>
  completedProjectIds: string[]
  activeCommissionChain: { id: string; stageIndex: number; stageProgress: number } | null
  availableCommissions: PersistedGuildCommissionV1[]
  activeCommission: PersistedGuildCommissionV1 | null
  generationCount: number
  completedCommissions: number
  freeRefreshes: number
  rngState: number
  completedChainIds: string[]
}

export type PersistedProgressV1 = Omit<GameState['progress'], 'huntersOrder' | 'arcaneGuild'> & {
  huntersOrder: PersistedHunterOrderV1
  arcaneGuild: PersistedArcaneGuildV1
}

/** Explicit combat checkpoint allowlist. The deterministic mid-combat checkpoint stays
 * intact across reloads; UI event log and later runtime-only fields do not enter saves. */
export type PersistedCombatStateV1 = Pick<GameState['combat'],
  | 'active' | 'dungeonId' | 'enemyId' | 'targetEnemyId' | 'enemyWorldTier'
  | 'enemyInstanceSerial' | 'enemyInstanceKey' | 'enemyHp' | 'enemyMaxHp'
  | 'enemyBarrier' | 'playerBarrier' | 'enemyBarrierRemainingMs' | 'playerBarrierRemainingMs'
  | 'enemyActionPatternId' | 'enemyNextActionIndex' | 'enemyCurrentStepId' | 'enemyCurrentActionId'
  | 'enemyCurrentActionPatternId' | 'enemyActionTimerMs' | 'enemyActionDurationMs' | 'triggeredRuleIds'
  | 'ruleCooldowns' | 'sigilRuntime' | 'pendingBossId' | 'pendingPlayerSpellCast' | 'queuedPlayerSpellId'
  | 'activeSpellLoadout' | 'encounterTimerMs' | 'dungeonSequenceIndex' | 'spellCooldowns'
  | 'arcaneCoreRuntime' | 'playerStatuses' | 'enemyStatuses' | 'threatCleared' | 'inBossFight'
  | 'lastDamageDealt' | 'lastDamageTaken' | 'combatRngState' | 'guardian'
>

export const PERSISTED_COMBAT_FIELDS_V1 = [
  'active', 'dungeonId', 'enemyId', 'targetEnemyId', 'enemyWorldTier', 'enemyInstanceSerial', 'enemyInstanceKey',
  'enemyHp', 'enemyMaxHp', 'enemyBarrier', 'playerBarrier', 'enemyBarrierRemainingMs', 'playerBarrierRemainingMs',
  'enemyActionPatternId', 'enemyNextActionIndex', 'enemyCurrentStepId', 'enemyCurrentActionId', 'enemyCurrentActionPatternId',
  'enemyActionTimerMs', 'enemyActionDurationMs', 'triggeredRuleIds', 'ruleCooldowns', 'sigilRuntime', 'pendingBossId',
  'pendingPlayerSpellCast', 'queuedPlayerSpellId', 'activeSpellLoadout', 'encounterTimerMs', 'dungeonSequenceIndex',
  'spellCooldowns', 'arcaneCoreRuntime', 'playerStatuses', 'enemyStatuses', 'threatCleared', 'inBossFight',
  'lastDamageDealt', 'lastDamageTaken', 'combatRngState', 'guardian',
] as const satisfies readonly (keyof PersistedCombatStateV1)[]

/** Purpose-built V2 document. Runtime UI, debug state, and notifications have no fields here. */
export interface PersistedGameStateV1 {
  schemaVersion: 2
  savedAt: number
  player: Pick<GameState['player'], 'health' | 'mana' | 'baseMaxHealth' | 'baseMaxMana' | 'healthRegenTimerMs'>
  schools: GameState['schools']
  currencies: GameState['currencies']
  resonance: GameState['resonance']
  tower: GameState['tower']
  worldTier: PersistedWorldV1
  inventory: PersistedInventoryV1
  crystals: GameState['crystals']
  protectedItems: GameState['protectedItems']
  equipment: PersistedEquipmentV1
  arcaneCore: GameState['arcaneCore']
  artifactProgress: GameState['artifactProgress']
  sigils: GameState['sigils']
  guardians: GameState['guardians']
  activities: PersistedActivitiesV1
  combat: PersistedCombatStateV1
  progress: PersistedProgressV1
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
