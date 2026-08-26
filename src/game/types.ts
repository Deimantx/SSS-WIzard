export type SchoolId = 'fire' | 'water' | 'earth' | 'air'
export type ElementId = SchoolId
export type ScreenId = 'home' | 'combat' | 'schools' | 'inventory' | 'equipment' | 'collection' | 'tower-channeling' | 'tower-focus' | 'tower-research' | 'tower-transmutation' | 'guild' | 'settings'
export type ActivityStatus = 'running' | 'paused' | 'waiting-mana' | 'waiting-focus' | 'completed' | 'locked' | 'recovering'

export type ItemId =
  | 'fire-fragment'
  | 'water-fragment'
  | 'earth-fragment'
  | 'air-fragment'
  | 'wisp-essence'
  | 'grove-bark'
  | 'heartseed'
  | 'life-essence'
  | 'apprentice-wand'
  | 'ember-staff'
  | 'tide-focus'
  | 'stoneweave-robe'
  | 'windthread-charm'

export type SpellId = 'fire-bolt' | 'water-ward' | 'earth-spike' | 'air-lance' | 'ignite' | 'flow-mend' | 'stoneguard' | 'quickening'
export type MonsterId = 'forest-wisp' | 'thornling' | 'stone-root' | 'grove-sentinel' | 'forest-heart'
export type DungeonId = 'whispering-woods'
export type EquipmentItemSlot = 'weapon' | 'offhand' | 'armor' | 'helmet' | 'cape' | 'amulet' | 'ring'
export type EquipmentPosition = 'weapon' | 'offhand' | 'armor' | 'helmet' | 'cape' | 'amulet' | 'ring1' | 'ring2'
/** @deprecated Use EquipmentItemSlot for item metadata or EquipmentPosition for loadout state. */
export type EquipmentSlot = EquipmentItemSlot
/** Legacy authored category kept for save/content compatibility. */
export type ItemCategory = 'elemental' | 'monster-loot' | 'equipment' | 'boss-loot'
export type InventoryCategory = 'material' | 'loot' | 'equipment' | 'special'
export type InventoryMaterialSubtype = 'elemental' | 'creature' | 'ore' | 'refined' | 'arcane'
export type SpellType = 'damage' | 'heal' | 'barrier' | 'dot' | 'buff'
export type StatusId = 'barrier' | 'thorn-wound' | 'burning' | 'attack-delay' | 'quickening'
export type ManaPillarId = 'leyline-conduit' | 'arcane-reservoir' | 'mana-resonance' | 'astral-expansion' | 'echo-attunement'
export type ChannelingDiscoveryId = 'stable-leyline' | 'echo-resonance' | 'deep-reservoir'
export type RecipeId = 'fire-fragment' | 'water-fragment' | 'earth-fragment' | 'air-fragment' | 'ember-staff' | 'tide-focus' | 'stoneweave-robe' | 'windthread-charm'
export type RecipeCategory = 'elemental' | 'material' | 'equipment' | 'special'
export type RecipeUnlockCondition = { type: 'always' } | { type: 'first-grove-sentinel-kill' }

export type AutoCastCondition = { type: 'always' } | { type: 'health-below'; percent: number } | { type: 'barrier-below'; value: number }
export type SpellEffect =
  | { type: 'damage'; amount: number }
  | { type: 'heal'; amount: number }
  | { type: 'barrier'; amount: number }
  | { type: 'dot'; statusId: StatusId; durationMs: number; damagePerTick: number; tickMs: number }
  | { type: 'buff'; statusId: StatusId; durationMs: number; value: number }

export interface EquipmentStats {
  basicDamage?: number
  maxHealth?: number
  maxMana?: number
  manaRegen?: number
  maxFocus?: number
  barrierReceived?: number
  fireSpellDamagePct?: number
  waterBarrierPct?: number
  earthSpellDamagePct?: number
  airSpellDamagePct?: number
}

export interface ItemDefinition {
  id: ItemId
  name: string
  description: string
  icon: string
  image?: string
  color: string
  kind: 'material' | 'equipment'
  category: ItemCategory
  /** Player-facing Vault classification. This is based on item function, not drop source. */
  inventoryCategory: InventoryCategory
  materialSubtype?: InventoryMaterialSubtype
  source: string
  sourceNavigation?: ScreenId
  /** Optional authored chain for future refined-material presentations. */
  processingChain?: ItemId[]
  sellValue: number | null
  canDestroy: boolean
  actionRestrictionReason?: string
  equipmentSlot?: EquipmentItemSlot
  /** Only authored for Weapon items. */
  weaponHands?: 1 | 2
  stats?: EquipmentStats
  researchSchool?: SchoolId
  researchXp?: number
  lockedByDefault?: boolean
}

export interface SpellDefinition {
  id: SpellId
  name: string
  school: SchoolId
  description: string
  unlockLevel: number
  manaCost: number
  cooldownMs: number
  autoCastFocus: number
  type: SpellType
  effect: SpellEffect
  damage?: number
  barrier?: number
  autoCondition?: AutoCastCondition
}

export interface MonsterActionStep {
  id: string
  name: string
  kind: 'basic' | 'special'
  specialAttackId?: string
}

export interface SpecialAttackDefinition {
  id: string
  name: string
  telegraphMs: number
  description: string
  effect: 'damage' | 'damage-thorn' | 'damage-delay' | 'barrier' | 'heal'
  amount: number
  delayMs?: number
}

export interface SchoolState { xp: number; level: number }
export interface PlayerState { health: number; maxHealth: number; mana: number; maxMana: number; maxFocus: number; baseMaxHealth: number; baseMaxMana: number; baseMaxFocus: number; godMode: boolean }
export interface ChannelingActivity { echoesAssigned: number }
export type ResearchStatus = 'idle' | 'running' | 'paused' | 'waiting-mana' | 'waiting-focus' | 'level-cap' | 'missing-item' | 'completed'
export interface ResearchActivity { running: boolean; itemId: ItemId | null; targetSchoolId: SchoolId | null; requestedQuantity: number; remainingQuantity: number; progressMs: number; durationPerItemMs: number; xpPerItem: number; manaPerItem: number; focusCost: number; status: ResearchStatus }
export interface TransmutationJobState { echoesAssigned: number; progressMs: number }
export interface TransmutationActivity { jobs: Partial<Record<RecipeId, TransmutationJobState>> }
export interface ActivitiesState {
  channeling: ChannelingActivity
  research: ResearchActivity
  transmutation: TransmutationActivity
  autoCast: Record<SpellId, boolean>
}
export interface StatusEffect { id: StatusId; remainingMs: number; value: number; tickIntervalMs?: number; nextTickMs?: number }
export interface CombatState {
  active: boolean
  dungeonId: DungeonId | null
  enemyId: MonsterId | null
  enemyHp: number
  enemyMaxHp: number
  enemyBarrier: number
  enemyActionIndex: number
  enemyActionTimerMs: number
  enemyIntervalMs: number
  enemyTelegraphMs: number
  enemyTelegraphActionId: string | null
  enemySpecialUsed: Record<string, boolean>
  pendingBossId: 'grove-sentinel' | null
  playerAttackTimerMs: number
  enemyAttackTimerMs: number
  encounterTimerMs: number
  spellCooldowns: Record<SpellId, number>
  playerStatuses: StatusEffect[]
  enemyStatuses: StatusEffect[]
  threatCleared: number
  inBossFight: boolean
  log: string[]
  lastDamageDealt: number
  lastDamageTaken: number
}
export interface ProgressState {
  magicLevelCap: number
  unlockedSpells: SpellId[]
  discoveredMonsters: MonsterId[]
  lifetimeKills: number
  firstBossKill: boolean
  firstMainBossKill: boolean
  guildUnlocked: boolean
  emberStaffUnlocked: boolean
  forestHeartUnlocked: boolean
  autoHuntBossUnlocked: boolean
  guildRank: 'outsider' | 'initiate' | 'apprentice'
  requestProgress: Record<string, number>
  guildReputation: number
  requestClaims: Record<string, boolean>
  permanentFocusBonuses: Record<string, number>
  lifetimeKillsByMonster: Partial<Record<MonsterId, number>>
  bossKillsByBoss: Partial<Record<'grove-sentinel' | 'forest-heart', number>>
  autoHuntBossByDungeon: Record<DungeonId, boolean>
  channeling: ChannelingProgress
}

export interface ChannelingProgress {
  pillars: Record<ManaPillarId, ManaPillarState>
  totalManaGenerated: number
  fiveEchoSustainMs: number
  discoveries: Record<ChannelingDiscoveryId, boolean>
}

export interface ManaPillarState {
  rank: number
  level: number
}
/** Gameplay UI state. Layout editing and developer tools are transient UI chrome outside the save. */
export interface UiState { screen: ScreenId }
export interface GameState {
  saveVersion: number
  player: PlayerState
  schools: Record<SchoolId, SchoolState>
  currencies: { gold: number }
  inventory: Partial<Record<ItemId, number>>
  protectedItems: Partial<Record<ItemId, boolean>>
  equipment: Record<EquipmentPosition, ItemId | null>
  activities: ActivitiesState
  combat: CombatState
  progress: ProgressState
  ui: UiState
  offlineBankMs: number
  lastSavedAt: number
  notifications: NotificationItem[]
  debug: DebugOverrides
}
export interface DebugOverrides {
  bonusManaRegenFlat: number
  bonusMaxManaFlat: number
  bonusMaxFocusFlat: number
  allowManaOverCap: boolean
  allowFocusOverCap: boolean
  ignoreEchoLimit: boolean
  transmutationEchoCapacityOverride: number | null
}
export interface NotificationItem { id: string; text: string; tone: 'info' | 'success' | 'warning' }
export interface FocusReservation {
  id: string
  sourceType: 'autocast' | 'research' | 'transmutation' | 'channeling'
  sourceId: string
  amount: number
  label: string
}

export type ManaFlowState = 'surplus' | 'balanced' | 'deficit'
export interface ManaDemandSource {
  id: string
  label: string
  manaPerSecond: number
  estimated?: boolean
}
export interface ManaFlowBreakdown {
  production: number
  demand: number
  net: number
  state: ManaFlowState
  demandSources: ManaDemandSource[]
  etaMs: number | null
  etaKind: 'full' | 'empty' | 'starved' | null
}

export type ActivityTelemetryStatus = 'running' | 'waiting-mana' | 'waiting-materials' | 'paused' | 'combat' | 'recovery'
export interface ActivityMetric {
  label: string
  value: string
  tone?: 'neutral' | 'positive' | 'negative' | 'warning'
}
export interface ActivityBar {
  label: string
  value: string
  percent: number
  tone?: ActivityMetric['tone']
}
export interface ActivityTelemetry {
  id: 'combat' | 'research' | 'transmutation'
  label: string
  subtitle?: string
  screen: ScreenId
  status: ActivityTelemetryStatus
  progressPercent?: number
  remainingMs?: number
  bars?: ActivityBar[]
  collapsedSummary?: string
  metrics: ActivityMetric[]
  accent: 'red' | 'orange' | 'violet' | 'gold'
}
