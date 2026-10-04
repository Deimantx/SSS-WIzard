import type { CombatLocationId, EquipmentPosition, GameState, GuildCommissionObjective, HunterRankId, HunterUpgradeId, ItemId, MonsterId, ResearchSlotId, SchoolId, TransmutationRecipeId } from '../../game/types'

export type PersistedInventoryV3 = Partial<Record<ItemId, number>>
export type PersistedEquipmentV3 = Record<EquipmentPosition, ItemId | null>

export interface PersistedResearchJobV3 {
  itemId: ItemId
  targetSchoolId: SchoolId
  requestedQuantity: number
  remainingQuantity: number
  progressMs: number
  acolyteAssigned?: boolean
  echoesAssigned?: number
  status: 'prepared' | 'running' | 'flux-limited' | 'waiting-flux' | 'mana-limited' | 'waiting-mana' | 'level-cap' | 'protected' | 'missing-item'
}
export interface PersistedResearchV3 { slots: Record<ResearchSlotId, PersistedResearchJobV3 | null> }
export interface PersistedTransmutationV3 {
  jobs: Partial<Record<TransmutationRecipeId, { acolyteAssigned?: boolean; progressMs: number; echoesAssigned?: number }>>
}
export type PersistedActivitiesV3 = Omit<GameState['activities'], 'research' | 'transmutation'> & {
  research: PersistedResearchV3
  transmutation: PersistedTransmutationV3
}

export type PersistedHunterTargetV3 =
  | { type: 'monster' | 'boss'; monsterId: MonsterId }
  | { type: 'ground'; groundId: CombatLocationId }
  | { type: 'family'; familyId: string }
  | { type: 'alignment'; alignmentId: string }

export interface PersistedHunterContractV3 {
  id: string
  huntingGroundId?: CombatLocationId
  targetSpec: PersistedHunterTargetV3
  target: number
  progress: number
  tier: 'routine' | 'special' | 'prestigious'
  reputationReward: number
  marksReward: number
}

export interface PersistedHunterOrderV3 {
  reputation: number
  rankId: HunterRankId
  hunterMarks: number
  totalContractsAccepted: number
  activeContract: PersistedHunterContractV3 | null
  availableContracts: PersistedHunterContractV3[]
  pinnedContractIds?: string[]
  preferredContractType?: 'monster' | 'family' | 'alignment' | 'ground' | 'boss' | null
  preferredHuntingGroundId?: CombatLocationId | null
  lastSelectedQuarryByGround?: Partial<Record<CombatLocationId, MonsterId>>
  blockedTargets: MonsterId[]
  purchasedUpgrades: Partial<Record<HunterUpgradeId, number>>
  totalContractsCompleted: number
  totalHunterKills: number
  generationCount: number
  rngState: number
  monsterHunterStats: Partial<Record<MonsterId, { contractKills: number; contractsCompleted: number; marksEarned: number }>>
}

export interface PersistedGuildCommissionV3 {
  id: string
  templateId: string
  category: 'supply' | 'channeling' | 'production' | 'research' | 'transmutation' | 'mixed'
  quality: 'routine' | 'special' | 'prestigious'
  objectives: GuildCommissionObjective[]
  reputationReward: number
  advancementPointReward: number
}

export interface PersistedArcaneGuildV3 {
  projects: Record<string, Partial<Record<ItemId, number>>>
  completedProjectIds: string[]
  activeCommissionChain: { id: string; stageIndex: number; stageProgress: number } | null
  availableCommissions: PersistedGuildCommissionV3[]
  activeCommission: PersistedGuildCommissionV3 | null
  generationCount: number
  completedCommissions: number
  freeRefreshes: number
  rngState: number
  completedChainIds: string[]
}

export type PersistedProgressV3 = Omit<GameState['progress'], 'huntersOrder' | 'arcaneGuild'> & {
  huntersOrder: PersistedHunterOrderV3
  arcaneGuild: PersistedArcaneGuildV3
}

/** Explicit combat checkpoint allowlist. The deterministic mid-combat checkpoint stays
 * intact across reloads; UI event log and later runtime-only fields do not enter saves. */
export type PersistedCombatStateV3 = Pick<GameState['combat'],
  | 'active' | 'locationId' | 'enemyId' | 'targetEnemyId'
  | 'enemyInstanceSerial' | 'enemyInstanceKey' | 'enemyHp' | 'enemyMaxHp'
  | 'enemyBarrier' | 'playerBarrier' | 'enemyBarrierRemainingMs' | 'playerBarrierRemainingMs'
  | 'enemyActionPatternId' | 'enemyNextActionIndex' | 'enemyCurrentStepId' | 'enemyCurrentActionId'
  | 'enemyCurrentActionPatternId' | 'enemyActionTimerMs' | 'enemyActionDurationMs' | 'triggeredRuleIds'
  | 'ruleCooldowns' | 'sigilRuntime' | 'pendingBossId' | 'pendingPlayerSpellCast' | 'queuedPlayerSpellId'
  | 'activeSpellLoadout' | 'encounterTimerMs' | 'sequenceIndex' | 'spellCooldowns'
  | 'arcaneCoreRuntime' | 'playerStatuses' | 'enemyStatuses' | 'threatCleared' | 'inBossFight'
  | 'lastDamageDealt' | 'lastDamageTaken' | 'combatRngState' | 'guardian' | 'elementalDamageReductions'
>

export const PERSISTED_COMBAT_FIELDS_V3 = [
  'active', 'locationId', 'enemyId', 'targetEnemyId', 'enemyInstanceSerial', 'enemyInstanceKey',
  'enemyHp', 'enemyMaxHp', 'enemyBarrier', 'playerBarrier', 'enemyBarrierRemainingMs', 'playerBarrierRemainingMs',
  'enemyActionPatternId', 'enemyNextActionIndex', 'enemyCurrentStepId', 'enemyCurrentActionId', 'enemyCurrentActionPatternId',
  'enemyActionTimerMs', 'enemyActionDurationMs', 'triggeredRuleIds', 'ruleCooldowns', 'sigilRuntime', 'pendingBossId',
  'pendingPlayerSpellCast', 'queuedPlayerSpellId', 'activeSpellLoadout', 'encounterTimerMs', 'sequenceIndex',
  'spellCooldowns', 'arcaneCoreRuntime', 'playerStatuses', 'enemyStatuses', 'threatCleared', 'inBossFight',
  'lastDamageDealt', 'lastDamageTaken', 'combatRngState', 'guardian', 'elementalDamageReductions',
] as const satisfies readonly (keyof PersistedCombatStateV3)[]

/** Purpose-built V3 document. Only the last combat location UI preference is persisted; transient UI is omitted. */
export interface PersistedGameStateV3 {
  schemaVersion: 3
  contentVersion?: number
  savedAt: number
  player: Pick<GameState['player'], 'health' | 'mana' | 'baseMaxHealth' | 'baseMaxMana' | 'healthRegenTimerMs'>
  schools: GameState['schools']
  currencies: GameState['currencies']
  resonance: GameState['resonance']
  tower: GameState['tower']
  inventory: PersistedInventoryV3
  crystals: GameState['crystals']
  protectedItems: GameState['protectedItems']
  equipment: PersistedEquipmentV3
  arcaneCore: GameState['arcaneCore']
  artifactProgress: GameState['artifactProgress']
  sigils: GameState['sigils']
  guardians: GameState['guardians']
  activities: PersistedActivitiesV3
  combat: PersistedCombatStateV3
  progress: PersistedProgressV3
  storyProgress: GameState['storyProgress']
  darkPortal: GameState['darkPortal']
  spellPresets: GameState['spellPresets']
  ui?: Pick<GameState['ui'], 'lastEnteredCombatLocationId'>
  offlineBankMs: number
}

export const PERSISTED_GAMEPLAY_FIELDS = [
  'player', 'schools', 'currencies', 'resonance', 'tower', 'inventory', 'crystals',
  'protectedItems', 'equipment', 'arcaneCore', 'artifactProgress', 'sigils', 'guardians', 'activities',
  'combat', 'progress', 'storyProgress', 'darkPortal', 'spellPresets', 'offlineBankMs',
] as const satisfies readonly (keyof PersistedGameStateV3)[]

export const PERSISTED_UI_FIELDS = ['lastEnteredCombatLocationId'] as const satisfies readonly (keyof GameState['ui'])[]
