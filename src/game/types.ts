export type SchoolId = 'fire' | 'water' | 'earth' | 'air'
export type ElementId = SchoolId
export type ScreenId = 'home' | 'combat' | 'schools' | 'inventory' | 'equipment' | 'collection' | 'bestiary' | 'tower-channeling' | 'tower-focus' | 'tower-research' | 'tower-transmutation' | 'guild' | 'settings'
export type ActivityStatus = 'running' | 'mana-limited' | 'paused' | 'waiting-mana' | 'waiting-focus' | 'completed' | 'locked' | 'recovering'

export type ItemId =
  | 'fire-fragment'
  | 'water-fragment'
  | 'earth-fragment'
  | 'air-fragment'
  | 'prismatic-fragment'
  | 'wisp-essence'
  | 'grove-bark'
  | 'heartseed'
  | 'life-essence'
  | 'apprentice-wand'
  | 'ember-staff'
  | 'tide-focus'
  | 'stoneweave-robe'
  | 'windthread-charm'

export type SpellId = 'fire-bolt' | 'ignite' | 'fireball' | 'water-ward' | 'flow-mend' | 'frostbite' | 'earth-spike' | 'stoneguard' | 'fortify' | 'air-lance' | 'quickening' | 'shock-spark'
export type SpellPresetId = string
export type MonsterId = 'forest-wisp' | 'thornling' | 'stone-root' | 'grove-sentinel' | 'forest-heart' | 'cavefang-wolf' | 'razorclaw-lynx' | 'corrupted-dire-wolf' | 'corrupted-greatbear' | 'restless-skeleton' | 'grave-wraith' | 'fallen-acolyte' | 'archmage-edrin-shade'
export type BestiaryCategory = 'monster' | 'boss'
export type DungeonId = 'whispering-woods' | 'howling-den' | 'abandoned-catacombs'
export type EquipmentItemSlot = 'weapon' | 'offhand' | 'armor' | 'helmet' | 'cape' | 'amulet' | 'ring'
export type EquipmentPosition = 'weapon' | 'offhand' | 'armor' | 'helmet' | 'cape' | 'amulet' | 'ring1' | 'ring2'
/** @deprecated Use EquipmentItemSlot for item metadata or EquipmentPosition for loadout state. */
export type EquipmentSlot = EquipmentItemSlot
/** Legacy authored category kept for save/content compatibility. */
export type ItemCategory = 'elemental' | 'material' | 'monster-loot' | 'equipment' | 'boss-loot'
export type InventoryCategory = 'material' | 'loot' | 'equipment' | 'special'
export type InventoryMaterialSubtype = 'elemental' | 'creature' | 'ore' | 'refined' | 'arcane'
export type SpellType = 'damage' | 'heal' | 'barrier' | 'dot' | 'buff'
import type { ActiveStatus, CombatEffect, StatusId, TraitDefinition } from './systems/combat/combatTypes'
export type { ActionPattern, ActionStep, ActiveStatus, CombatActionDefinition, CombatCondition, CombatConditionContext, CombatEffect, CombatEvent, CombatEventSink, CombatModifier, CombatSource, CombatTag, DamageType, EffectTarget, Magnitude, ModifierKey, StatusId, StatusDefinition, TraitDefinition, TraitId } from './systems/combat/combatTypes'
export type ManaPillarId = 'leyline-conduit' | 'arcane-reservoir' | 'mana-resonance' | 'astral-expansion' | 'echo-attunement'
export type ChannelingDiscoveryId = 'stable-leyline' | 'echo-resonance' | 'deep-reservoir'
export type RecipeId = 'fire-fragment' | 'water-fragment' | 'earth-fragment' | 'air-fragment' | 'prismatic-fragment' | 'ember-staff' | 'tide-focus' | 'stoneweave-robe' | 'windthread-charm'
export type RecipeCategory = 'elemental' | 'material' | 'equipment' | 'special'
export type RecipeUnlockCondition = { type: 'always' } | { type: 'first-dungeon-boss-kill' }

export type AutoCastCondition = { type: 'always' } | { type: 'health-below'; percent: number } | { type: 'barrier-below'; value: number }
export interface EquipmentStats {
  basicDamage?: number
  spellPower?: number
  maxHealth?: number
  maxMana?: number
  manaRegen?: number
  maxFocus?: number
  barrierReceived?: number
  defense?: number
  critChance?: number
  critDamage?: number
  basicAttackSpeedPct?: number
  blockChance?: number
  cooldownRecoveryPct?: number
  healingDonePct?: number
  barrierPowerPct?: number
  damageOverTimePct?: number
  statusDurationPct?: number
  manaCostReductionPct?: number
  focusEfficiencyPct?: number
  fireSpellDamagePct?: number
  waterBarrierPct?: number
  earthSpellDamagePct?: number
  airSpellDamagePct?: number
  resistances?: Partial<Record<import('./systems/combat/combatTypes').DamageType, number>>
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
  attackTags?: import('./systems/combat/combatTypes').CombatTag[]
  damageType?: import('./systems/combat/combatTypes').DamageType
  stats?: EquipmentStats
  /** Optional universal combat provider for equipped item effects. */
  combat?: {
    modifiers?: import('./systems/combat/combatTypes').CombatModifier[]
    rules?: import('./systems/combat/combatTypes').CombatTriggerRule[]
  }
  researchSchool?: SchoolId
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
  type: SpellType
  effects: CombatEffect[]
  autoCondition?: AutoCastCondition
}

export interface SchoolState { xp: number; level: number }
export interface PlayerState {
  health: number
  maxHealth: number
  mana: number
  maxMana: number
  maxFocus: number
  baseMaxHealth: number
  baseMaxMana: number
  baseMaxFocus: number
  /** @deprecated Compatibility-only legacy field. Runtime immortality lives in GameState.debug. */
  godMode: boolean
}
export interface ChannelingActivity { echoesAssigned: number }
export type ResearchSlotId = 'research-1' | 'research-2' | 'research-3' | 'research-4'
export type ResearchJobStatus = 'prepared' | 'running' | 'mana-limited' | 'waiting-mana' | 'level-cap' | 'protected' | 'missing-item'
export type ResearchStatus = ResearchJobStatus
export interface ResearchJobState {
  itemId: ItemId
  targetSchoolId: SchoolId
  requestedQuantity: number
  remainingQuantity: number
  progressMs: number
  echoesAssigned: number
  status: ResearchJobStatus
}
/**
 * Research is persisted as fixed prepared slots. The optional fields below are
 * read-only compatibility inputs for pre-V9 saves and old external callers;
 * they are never authoritative and are omitted from fresh saves.
 */
export interface ResearchActivity {
  slots: Record<ResearchSlotId, ResearchJobState | null>
  /** @deprecated V8 compatibility only. */
  running?: boolean
  /** @deprecated V8 compatibility only. */
  itemId?: ItemId | null
  /** @deprecated V8 compatibility only. */
  targetSchoolId?: SchoolId | null
  /** @deprecated V8 compatibility only. */
  requestedQuantity?: number
  /** @deprecated V8 compatibility only. */
  remainingQuantity?: number
  /** @deprecated V8 compatibility only. */
  progressMs?: number
  /** @deprecated V8 compatibility only. */
  durationPerItemMs?: number
  /** @deprecated V8 compatibility only. */
  xpPerItem?: number
  /** @deprecated V8 compatibility only. */
  manaPerItem?: number
  /** @deprecated V8 compatibility only. */
  focusCost?: number
  /** @deprecated V8 compatibility only. */
  status?: ResearchStatus | 'idle' | 'paused' | 'waiting-focus' | 'completed'
}
export interface TransmutationJobState { echoesAssigned: number; progressMs: number }
export interface TransmutationActivity { jobs: Partial<Record<RecipeId, TransmutationJobState>> }
export interface ActivitiesState {
  channeling: ChannelingActivity
  research: ResearchActivity
  transmutation: TransmutationActivity
  autoCast: Record<SpellId, boolean>
}
export interface SpellPreset {
  id: SpellPresetId
  name: string
  spellIds: SpellId[]
}
export interface SpellPresetState {
  presets: SpellPreset[]
  lastAppliedPresetId: SpellPresetId | null
}
export interface CombatState {
  active: boolean
  dungeonId: DungeonId | null
  enemyId: MonsterId | null
  /** Monotonic deterministic identity for the currently spawned encounter. */
  enemyInstanceSerial: number
  /** `enemy:<serial>` while an enemy is alive; null during encounter downtime. */
  enemyInstanceKey: string | null
  enemyHp: number
  enemyMaxHp: number
  enemyBarrier: number
  playerBarrier: number
  enemyBarrierRemainingMs: number | null
  playerBarrierRemainingMs: number | null
  enemyActionPatternId: string | null
  enemyNextActionIndex: number
  enemyCurrentStepId: string | null
  enemyCurrentActionId: string | null
  enemyCurrentActionPatternId: string | null
  enemyActionTimerMs: number
  enemyActionDurationMs: number
  triggeredRuleIds: string[]
  ruleCooldowns: Record<string, number>
  pendingBossId: MonsterId | null
  playerAttackTimerMs: number
  playerAttackDurationMs: number
  encounterTimerMs: number
  spellCooldowns: Record<SpellId, number>
  /** Runtime Auto-Cast starvation latch; persisted harmlessly with combat state. */
  autoCastManaStarvedSpells: SpellId[]
  playerStatuses: ActiveStatus[]
  enemyStatuses: ActiveStatus[]
  threatCleared: number
  inBossFight: boolean
  log: string[]
  lastDamageDealt: number
  lastDamageTaken: number
  /** Persisted deterministic PRNG state used by Combat Crit, Block and encounters. */
  combatRngState: number
}
export interface ProgressState {
  magicLevelCap: number
  spellRanks: Partial<Record<SpellId, import('./systems/spells/spellProgression').SpellRank>>
  discoveredMonsters: MonsterId[]
  discoveredItems: ItemId[]
  lifetimeKills: number
  firstBossKill: boolean
  /** Legacy pre-three-dungeon milestone; historically represented the Forest Heart main-boss clear. */
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
  focusImprovement: FocusImprovementState
  lifetimeKillsByMonster: Partial<Record<MonsterId, number>>
  bossKillsByBoss: Partial<Record<MonsterId, number>>
  autoHuntBossByDungeon: Record<DungeonId, boolean>
  channeling: ChannelingProgress
}

export interface FocusImprovementState {
  rank: number
  level: number
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
  spellPresets: SpellPresetState
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
  playerImmortal: boolean
  enemyImmortal: boolean
  infiniteMana: boolean
  ignoreSpellCooldowns: boolean
  disablePlayerBasicAttack: boolean
  disableAutoCast: boolean
  freezePlayerActions: boolean
  freezeEnemyActions: boolean
  combatPaused: boolean
  combatTimeScale: number
}
export interface NotificationItem { id: string; text: string; tone: 'info' | 'success' | 'warning'; key?: string; createdAt?: number }
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

export type ActivityTelemetryStatus = 'running' | 'mana-limited' | 'waiting-mana' | 'waiting-materials' | 'paused' | 'combat'
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
