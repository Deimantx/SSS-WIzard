import type { PortalShardId } from './content/darkPortal/portalShards'

export type SchoolId = 'fire' | 'water' | 'earth' | 'air'
export type ElementId = SchoolId
export type ScreenId = 'home' | 'combat' | 'schools' | 'inventory' | 'equipment' | 'collection' | 'bestiary' | 'tower-channeling' | 'tower-focus' | 'tower-research' | 'tower-transmutation' | 'tower-artificing' | 'tower-summoning' | 'tower-dark-portal' | 'guild' | 'settings'
export type ActivityStatus = 'running' | 'mana-limited' | 'paused' | 'waiting-mana' | 'waiting-focus' | 'completed' | 'locked' | 'recovering'

/**
 * Canonical item IDs grouped by authored ownership. Keep this list aligned
 * with src/game/content/items/shared, act0, and act1.
 */
export type ItemId =
  // Shared / global materials
  | 'fire-fragment'
  | 'water-fragment'
  | 'earth-fragment'
  | 'air-fragment'
  | 'prismatic-fragment'
  | 'artifact-essence'
  | 'life-essence'
  // Act 0 — Artifacts
  | 'ember-staff'
  | 'tideglass-wand'
  | 'stoneheart-scepter'
  | 'windthread-wand'
  | 'wispweave-robe'
  | 'wispveil-hood'
  // Act 0 — Whispering Woods
  | 'windthread-charm'
  | 'grovekeeper-mantle'
  | 'wispglass-earring'
  | 'wispbound-ring'
  | 'heartseed-necklace'
  // Act 0 — Howling Den
  | 'predator-hide-mantle'
  | 'fangwire-earring'
  | 'howling-signet'
  | 'greatbear-heartstone'
  // Act 0 — Abandoned Catacombs
  | 'ossuary-mantle'
  | 'mourning-glass-earring'
  | 'gravebinder-ring'
  | 'soulglass-amulet'
  | 'edrins-signet'
  | 'black-portal-shard'
  // Act 1 — Artifacts
  | 'galeshard-staff'
  | 'reliquary-scepter'
  | 'pyrebound-staff'
  | 'rootheart-scepter'
  // Act 1 — Fractured Approach
  | 'galeglass-earring'
  | 'riftwind-ring'
  | 'waystone-pendant'
  | 'fractured-ward-mantle'
  | 'gatekeeper-sigil'
  // Act 1 — Flooded Reliquary
  | 'mistglass-earring'
  | 'reliquary-ring'
  | 'drowned-chain-pendant'
  | 'keepers-tide-seal'
  // Act 1 — Ashen Watch
  | 'cinderwire-earring'
  | 'ashbrand-ring'
  | 'emberwatch-mantle'
  | 'revenant-emberstone'
  // Act 1 — Rootscar Hollow
  | 'briar-earring'
  | 'rootbound-ring'
  | 'mossguard-mantle'
  | 'ancient-heart-knot'
  // Act 1 — Crossroads of Ruin
  | 'wayfarer-earring'
  | 'crossroads-signet'
  | 'confluence-pendant'
  | 'keepers-roadseal'
  // Act 1 — Graveglass Hollow
  | 'graveglass-earring'
  | 'shardbone-ring'
  | 'mourner-veil-mantle'
  | 'behemoth-heartshard'
  // Act 1 — Stormvault Gallery
  | 'voltglass-earring'
  | 'stormcoil-ring'
  | 'gale-scribe-pendant'
  | 'archivists-conductor'
  // Act 1 — Starfallen Observatory
  | 'starfall-ring'
  | 'lenskeeper-earring'
  | 'astral-pendant'
  | 'fallen-astromancer-lens'
  // Act 1 — Broken Meridian
  | 'meridian-ring'
  | 'linebreaker-earring'
  | 'fractured-conduit-pendant'
  | 'leyline-mantle'
  | 'splitters-meridian-core'
  // Act 1 — Hall of Unbound Names
  | 'nameless-ring'
  | 'whisper-earring'
  | 'unbound-seal-pendant'
  | 'prelates-unspoken-seal'
  // Act 1 — Vault of the Black Sigil
  | 'black-sigil-ring'
  | 'inkbound-earring'
  | 'vaultseal-mantle'
  | 'wardens-black-sigil'
  // Act 1 — Black Gate
  | 'gatebound-ring'
  | 'portal-echo-earring'
  | 'blackgate-pendant'
  | 'voidward-mantle'
  | 'black-gatekeepers-seal'

export type StoryEventId = 'edrin-dark-portal-discovery'

export type SpellId = 'fire-bolt' | 'ignite' | 'fireball' | 'water-ward' | 'flow-mend' | 'frostbite' | 'earth-spike' | 'stoneguard' | 'fortify' | 'air-lance' | 'quickening' | 'shock-spark'
export type SpellPresetId = string
export type MonsterId = 'forest-wisp' | 'thornling' | 'stone-root' | 'grove-sentinel' | 'forest-heart' | 'cavefang-wolf' | 'razorclaw-lynx' | 'corrupted-dire-wolf' | 'corrupted-greatbear' | 'restless-skeleton' | 'grave-wraith' | 'fallen-acolyte' | 'archmage-edrin-shade' | 'warded-husk' | 'rift-wolf' | 'arcane-scavenger' | 'withered-watcher' | 'corrupted-elemental-gatekeeper'
  | 'drowned-acolyte' | 'reliquary-slime' | 'mist-wraith' | 'rune-leech' | 'drowned-keeper'
  | 'cinder-hound' | 'ash-cultist' | 'fire-elemental' | 'lava-eel' | 'flamebound-revenant'
  | 'thorn-maw' | 'rootbound-stalker' | 'briar-sprite' | 'moss-carapace' | 'rootscar-ancient'
  | 'remnant-marauder' | 'arcane-binder' | 'broken-construct' | 'rift-archer' | 'crossroads-keeper'
  | 'graveglass-shade' | 'bone-shardling' | 'silent-mourner' | 'crypt-guardian' | 'graveglass-behemoth'
  | 'volt-wisp' | 'static-armor' | 'gale-scribe' | 'charged-seeker' | 'storm-archivist'
  | 'starbound-eye' | 'astral-husk' | 'orbiting-fragment' | 'lenskeeper-remnant' | 'fallen-astromancer'
  | 'meridian-warden' | 'fractured-channeler' | 'arc-surge-horror' | 'linebreaker-shade' | 'meridian-splitter'
  | 'name-eater' | 'bound-echo' | 'hollow-liturgist' | 'whisper-archivist' | 'unspoken-prelate'
  | 'sigil-guardian' | 'black-seal-parasite' | 'vault-devourer' | 'inkbound-specter' | 'sigil-warden'
  | 'gatebound-remnant' | 'black-rift-stalker' | 'portalbound-acolyte' | 'sealbreaker-construct' | 'black-gatekeeper'
export type GuardianId = 'fire-guardian' | 'water-guardian' | 'earth-guardian' | 'air-guardian'
export type BestiaryCategory = 'monster' | 'boss'
export type DungeonId = 'whispering-woods' | 'howling-den' | 'abandoned-catacombs' | 'fractured-approach' | 'flooded-reliquary' | 'ashen-watch' | 'rootscar-hollow' | 'crossroads-of-ruin' | 'graveglass-hollow' | 'stormvault-gallery' | 'starfallen-observatory' | 'broken-meridian' | 'hall-of-unbound-names' | 'vault-of-the-black-sigil' | 'black-gate'
export type EquipmentItemSlot = 'weapon' | 'armor' | 'helmet' | 'cape' | 'amulet' | 'earring' | 'ring'
export type EquipmentPosition = 'weapon' | 'armor' | 'head' | 'cape' | 'necklace' | 'earring1' | 'earring2' | 'ring1' | 'ring2'
/** Permanent Artifacts grouped by authored Act ownership. */
export type ArtifactId =
  // Act 0 Artifacts
  | 'ember-staff'
  | 'tideglass-wand'
  | 'stoneheart-scepter'
  | 'windthread-wand'
  | 'wispweave-robe'
  | 'wispveil-hood'
  // Act 1 Artifacts
  | 'galeshard-staff'
  | 'reliquary-scepter'
  | 'pyrebound-staff'
  | 'rootheart-scepter'
export type EquipmentBuildTag = 'spell' | 'basic-attack' | 'hybrid' | 'crit' | 'status' | 'dot' | 'barrier' | 'defense' | 'sustain' | 'mana' | 'focus' | 'healing' | 'fire' | 'water' | 'earth' | 'air'
export type EquipmentBudgetProfileId = 'standard' | 'signature' | 'boss'
/** @deprecated Use EquipmentItemSlot for item metadata or EquipmentPosition for loadout state. */
export type EquipmentSlot = EquipmentItemSlot
/** Legacy authored category kept for save/content compatibility. */
export type ItemCategory = 'elemental' | 'material' | 'monster-loot' | 'equipment' | 'boss-loot'
export type InventoryCategory = 'material' | 'loot' | 'equipment' | 'special'
export type InventoryMaterialSubtype = 'elemental' | 'creature' | 'ore' | 'refined' | 'arcane'
export type SpellType = 'damage' | 'heal' | 'barrier' | 'dot' | 'buff'
import type { ActiveStatus, CombatEffect, StatusId, TraitDefinition } from './systems/combat/combatTypes'
export type { ActionPattern, ActionStep, ActiveStatus, CombatActionDefinition, CombatCondition, CombatConditionContext, CombatDamageComponentEvent, CombatEffect, CombatEvent, CombatEventSink, CombatModifier, CombatResolutionContext, CombatSource, CombatTag, DamageComponent, DamageType, EffectTarget, Magnitude, ModifierKey, StatusId, StatusDefinition, TraitDefinition, TraitId } from './systems/combat/combatTypes'
export type ManaPillarId = 'leyline-conduit' | 'arcane-reservoir' | 'mana-resonance' | 'astral-expansion' | 'echo-attunement'
export type TransmutationArrayId = 'temporal-array' | 'conservation-array' | 'replication-array' | 'mana-refinement-array' | 'echo-stabilization-array'
export type ChannelingDiscoveryId = 'stable-leyline' | 'echo-resonance' | 'deep-reservoir'
export type RecipeId = TransmutationRecipeId | ArtificingRecipeId
export type TransmutationRecipeId = 'fire-fragment' | 'water-fragment' | 'earth-fragment' | 'air-fragment' | 'prismatic-fragment'
export type ArtificingRecipeId = 'ember-staff' | 'tideglass-wand' | 'stoneheart-scepter' | 'windthread-wand' | 'wispweave-robe' | 'wispveil-hood' | 'galeshard-staff' | 'windthread-charm' | 'grovekeeper-mantle' | 'wispglass-earring' | 'wispbound-ring' | 'heartseed-necklace' | 'predator-hide-mantle' | 'fangwire-earring' | 'howling-signet' | 'greatbear-heartstone' | 'ossuary-mantle' | 'mourning-glass-earring' | 'gravebinder-ring' | 'soulglass-amulet' | 'edrins-signet' | 'galeglass-earring' | 'riftwind-ring' | 'waystone-pendant' | 'fractured-ward-mantle' | 'gatekeeper-sigil' | 'reliquary-scepter' | 'pyrebound-staff' | 'rootheart-scepter' | 'mistglass-earring' | 'reliquary-ring' | 'drowned-chain-pendant' | 'keepers-tide-seal' | 'cinderwire-earring' | 'ashbrand-ring' | 'emberwatch-mantle' | 'revenant-emberstone' | 'briar-earring' | 'rootbound-ring' | 'mossguard-mantle' | 'ancient-heart-knot' | 'wayfarer-earring' | 'crossroads-signet' | 'confluence-pendant' | 'keepers-roadseal' | 'graveglass-earring' | 'shardbone-ring' | 'mourner-veil-mantle' | 'behemoth-heartshard' | 'voltglass-earring' | 'stormcoil-ring' | 'gale-scribe-pendant' | 'archivists-conductor' | 'starfall-ring' | 'lenskeeper-earring' | 'astral-pendant' | 'fallen-astromancer-lens' | 'meridian-ring' | 'linebreaker-earring' | 'fractured-conduit-pendant' | 'leyline-mantle' | 'splitters-meridian-core' | 'nameless-ring' | 'whisper-earring' | 'unbound-seal-pendant' | 'prelates-unspoken-seal' | 'black-sigil-ring' | 'inkbound-earring' | 'vaultseal-mantle' | 'wardens-black-sigil' | 'gatebound-ring' | 'portal-echo-earring' | 'blackgate-pendant' | 'voidward-mantle' | 'black-gatekeepers-seal'
export type RecipeCategory = 'elemental' | 'material'
export type TransmutationCategoryFilter = 'all' | RecipeCategory
export type TransmutationTierFilter = 'all' | number
export type EquipmentPlayerTier = 1 | 2 | 3
export type ArtificingTierFilter = 'all' | EquipmentPlayerTier
export type ArtificingKindFilter = 'all' | 'artifact'
/** @deprecated Use TransmutationTierFilter. */
export type TransmutationMaterialTierFilter = TransmutationTierFilter
export type RecipeUnlockCondition =
  | { type: 'always' }
  | { type: 'boss-kill'; bossId: MonsterId; count?: number }
  | { type: 'monster-kill'; monsterId: MonsterId; count?: number }
  | { type: 'dungeon-monster-kills'; dungeonId: DungeonId; count?: number }
  | { type: 'dungeon-unlocked'; dungeonId: DungeonId }
  /** @deprecated V1-V23 compatibility for external callers and old authored data. */
  | { type: 'first-dungeon-boss-kill' }

export type AutoCastCondition = { type: 'always' } | { type: 'health-below'; percent: number } | { type: 'barrier-below'; value: number }
export interface EquipmentStats {
  basicDamage?: number
  spellPower?: number
  maxHealth?: number
  healthRegen?: number
  maxMana?: number
  manaRegen?: number
  maxFocus?: number
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
  /** Authored material progression tier; equipment must not define this field. */
  materialTier?: number
  source: string
  sourceNavigation?: ScreenId
  /** Optional authored chain for future refined-material presentations. */
  processingChain?: ItemId[]
  sellValue: number | null
  canDestroy: boolean
  actionRestrictionReason?: string
  equipmentSlot?: EquipmentItemSlot
  /** Equipment-only reward power metadata; Materials must not define this field. */
  equipmentTier?: number
  /** Equipment-only build direction metadata; Materials must not define this field. */
  buildTags?: EquipmentBuildTag[]
  /** Equipment-only balancing guidance metadata; Materials must not define this field. */
  equipmentBudgetProfile?: EquipmentBudgetProfileId
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
  healthRegenTimerMs: number
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
export interface TransmutationActivity { jobs: Partial<Record<TransmutationRecipeId, TransmutationJobState>> }
export type ArtificingJob =
  | { kind: 'recipe'; recipeId: ArtificingRecipeId }
  | { kind: 'artifact-forge'; artifactId: ArtifactId }
export interface ArtificingActivity { activeJob: ArtificingJob | null; activeRecipeId?: ArtificingRecipeId | null; progressMs: number }
export interface ArtifactProgressState { level: number; allocatedNodeIds: string[]; attunedNodeIds: string[] }
export interface ActivitiesState {
  channeling: ChannelingActivity
  research: ResearchActivity
  transmutation: TransmutationActivity
  artificing: ArtificingActivity
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
  guardian: {
    activeGuardianId: GuardianId | null
    attackTimerMs: number
    suppressedForEncounter: boolean
  }
}
export interface GuardianProgressState { level: number; rank: number }
export interface GuardiansState {
  selectedGuardianId: GuardianId | null
  progress: Record<GuardianId, GuardianProgressState>
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
  transmutation: TransmutationProgress
}

export interface TransmutationProgress {
  arrays: Record<TransmutationArrayId, TransmutationArrayState>
}

export interface TransmutationArrayState {
  rank: number
  level: number
}

export interface StoryProgressState {
  pendingEventIds: StoryEventId[]
  completedEventIds: StoryEventId[]
}

export interface DarkPortalProgressState {
  recoveredShards: PortalShardId[]
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
  artifactProgress: Partial<Record<ArtifactId, ArtifactProgressState>>
  guardians: GuardiansState
  activities: ActivitiesState
  combat: CombatState
  progress: ProgressState
  storyProgress: StoryProgressState
  darkPortal: DarkPortalProgressState
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
  showLockedTransmutationRecipes: boolean
  showLockedArtificingRecipes: boolean
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
  /** Artifact-only tester controls. These values are reset on load and excluded from saves. */
  artifactBonusPointsByArtifact: Partial<Record<ArtifactId, number>>
  artifactIgnoreDungeonGate: boolean
  artifactIgnoreLevelCap: boolean
  artifactIgnoreNodePrerequisites: boolean
  artifactAllowBeyondLimit: boolean
  artifactFreeUpgrade: boolean
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
