import type { PortalShardId } from './content/darkPortal/portalShards'
import type { ResonanceState } from './content/resonance/resonance'
export type { ResonanceState, ResonanceType, ResonanceYield } from './content/resonance/resonance'
import type { WorldTierId, WorldTierState } from './content/world-tier/worldTiers'
export type { WorldTierDefinition, WorldTierId, WorldTierState } from './content/world-tier/worldTiers'

export type SchoolId = 'fire' | 'water' | 'earth' | 'air'
export type ElementId = SchoolId
export type ScreenId = 'home' | 'combat' | 'schools' | 'inventory' | 'equipment' | 'arcane-core' | 'crystals' | 'collection' | 'bestiary' | 'tower-channeling' | 'tower-focus' | 'tower-research' | 'tower-transmutation' | 'tower-artificing' | 'tower-summoning' | 'tower-dark-portal' | 'guild' | 'settings'
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
  | 'tier-1-crystal-cache'
  // Act 0 — Artifacts
  | 'ember-staff'
  | 'tideglass-wand'
  | 'stoneheart-scepter'
  | 'windthread-wand'
  | 'wispweave-robe'
  | 'wispveil-hood'
  // Act 0 — Whispering Woods
  // Act 0 — Howling Den
  // Act 0 — Abandoned Catacombs
  | 'black-portal-shard'
  // Act 1 — Artifacts
  | 'galeshard-staff'
  | 'reliquary-scepter'
  | 'pyrebound-staff'
  | 'rootheart-scepter'
  | 'convergence-robe'
  | 'waystone-circlet'
  // Act 1 — Fractured Approach
  // Act 1 — Flooded Reliquary
  // Act 1 — Ashen Watch
  // Act 1 — Rootscar Hollow
  // Act 1 — Crossroads of Ruin
  // Act 1 — Graveglass Hollow
  // Act 1 — Stormvault Gallery
  // Act 1 — Starfallen Observatory
  // Act 1 — Broken Meridian
  // Act 1 — Hall of Unbound Names
  // Act 1 — Vault of the Black Sigil
  // Act 1 — Black Gate

export type StoryEventId = 'edrin-dark-portal-discovery'

export type CanonicalSpellId =
  | 'fire-bolt' | 'searing-touch' | 'flame-burst' | 'kindling' | 'firestorm' | 'combustion' | 'inferno' | 'execution-flame'
  | 'water-bolt' | 'mending-waters' | 'frost-touch' | 'regeneration' | 'frozen-current' | 'cleansing-tide' | 'deep-freeze' | 'healing-tide'
  | 'stone-shard' | 'stone-skin' | 'earthen-barrier' | 'harden' | 'rockfall' | 'rend-armor' | 'tremors' | 'living-mountain'
  | 'wind-blade' | 'lightning-spark' | 'gust' | 'chain-lightning' | 'tailwind' | 'static-charge' | 'thunderstrike' | 'eye-of-the-storm'
/** Legacy IDs remain type-compatible only so old persisted callers can be normalized. */
export type LegacySpellId = 'ignite' | 'fireball' | 'water-ward' | 'flow-mend' | 'frostbite' | 'earth-spike' | 'stoneguard' | 'fortify' | 'air-lance' | 'quickening' | 'shock-spark'
export type SpellId = CanonicalSpellId | LegacySpellId
export type SpellPresetId = string
export type MonsterId = 'forest-wisp' | 'thornling' | 'dewbound-sprite' | 'cinder-moth' | 'stone-root' | 'grove-sentinel' | 'tempest-stag' | 'forest-heart' | 'cavefang-wolf' | 'razorclaw-lynx' | 'corrupted-dire-wolf' | 'bonehide-boar' | 'moonblind-jackal' | 'den-stalker' | 'corrupted-greatbear' | 'restless-skeleton' | 'grave-wraith' | 'fallen-acolyte' | 'archmage-edrin-shade' | 'warded-husk' | 'rift-wolf' | 'arcane-scavenger' | 'withered-watcher' | 'corrupted-elemental-gatekeeper' | 'tidefang-serpent' | 'brinebound-sentinel' | 'abyssal-archivist' | 'emberwing-harrier' | 'charred-warden' | 'pyre-colossus' | 'sporeback-brute' | 'vinebound-reaver' | 'scarwood-behemoth'
  | 'drowned-acolyte' | 'reliquary-slime' | 'mist-wraith' | 'rune-leech' | 'drowned-keeper'
  | 'cinder-hound' | 'ash-cultist' | 'fire-elemental' | 'lava-eel' | 'flamebound-revenant'
  | 'thorn-maw' | 'rootbound-stalker' | 'briar-sprite' | 'moss-carapace' | 'rootscar-ancient'
  | 'remnant-marauder' | 'arcane-binder' | 'broken-construct' | 'rift-archer' | 'crossroads-keeper'
  | 'graveglass-shade' | 'bone-shardling' | 'silent-mourner' | 'crypt-guardian' | 'graveglass-behemoth'
  | 'epitaph-weaver' | 'tombglass-reaver' | 'ossuary-oracle'
  | 'volt-wisp' | 'static-armor' | 'gale-scribe' | 'charged-seeker' | 'storm-archivist'
  | 'thundercoil-serpent' | 'stormbound-curator' | 'tempest-engine'
  | 'starbound-eye' | 'astral-husk' | 'orbiting-fragment' | 'lenskeeper-remnant' | 'fallen-astromancer'
  | 'comet-wraith' | 'voidglass-custodian' | 'zenith-horror'
  | 'meridian-warden' | 'fractured-channeler' | 'arc-surge-horror' | 'linebreaker-shade' | 'meridian-splitter'
  | 'name-eater' | 'bound-echo' | 'hollow-liturgist' | 'whisper-archivist' | 'nameless-cantor' | 'oathless-confessor' | 'unwritten-hierophant' | 'unspoken-prelate'
  | 'sigil-guardian' | 'black-seal-parasite' | 'vault-devourer' | 'inkbound-specter' | 'sealbound-custodian' | 'blackscript-colossus' | 'voidseal-arbiter' | 'sigil-warden'
  | 'gatebound-remnant' | 'black-rift-stalker' | 'portalbound-acolyte' | 'sealbreaker-construct' | 'black-gatekeeper'
export type CrystalGroupId = 'destruction' | 'bastion' | 'flow' | 'precision'
export type CrystalFamilyId =
  | 'force' | 'ruin' | 'torment' | 'cataclysm'
  | 'vitality' | 'bulwark' | 'renewal' | 'ward'
  | 'reservoir' | 'current' | 'concentration' | 'frugality'
  | 'keen-sight' | 'tempo' | 'control' | 'discipline'
export type CrystalTier = 1 | 2 | 3 | 4 | 5
export type CrystalVariantId = `${CrystalFamilyId}-t${CrystalTier}`
export type CrystalPresetId = 'crystal-preset-1' | 'crystal-preset-2' | 'crystal-preset-3'
export interface CrystalPreset {
  id: CrystalPresetId
  name: string
  slots: Array<CrystalVariantId | null>
}
export interface CrystalState {
  dust: number
  owned: Partial<Record<CrystalVariantId, number>>
  equippedSlots: Array<CrystalVariantId | null>
  unlockedSlots: number
  presets: CrystalPreset[]
  selectedPresetId: CrystalPresetId | null
  rngState: number
}

export type GuardianId = 'fire-guardian' | 'water-guardian' | 'earth-guardian' | 'air-guardian'
export type BestiaryCategory = 'monster' | 'boss'
export type DungeonId = 'whispering-woods' | 'howling-den' | 'abandoned-catacombs' | 'fractured-approach' | 'flooded-reliquary' | 'ashen-watch' | 'rootscar-hollow' | 'crossroads-of-ruin' | 'graveglass-hollow' | 'stormvault-gallery' | 'starfallen-observatory' | 'broken-meridian' | 'hall-of-unbound-names' | 'vault-of-the-black-sigil' | 'black-gate'
export type EquipmentItemSlot = 'weapon' | 'armor' | 'helmet'
export type EquipmentPosition = 'weapon' | 'armor' | 'head'
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
  | 'convergence-robe'
  | 'waystone-circlet'
export type EquipmentBuildTag = 'spell' | 'basic-attack' | 'hybrid' | 'crit' | 'status' | 'dot' | 'barrier' | 'defense' | 'sustain' | 'mana' | 'focus' | 'healing' | 'fire' | 'water' | 'earth' | 'air'
export type EquipmentBudgetProfileId = 'standard' | 'signature' | 'boss'
/** @deprecated Use EquipmentItemSlot for item metadata or EquipmentPosition for loadout state. */
/** Legacy authored category kept for save/content compatibility. */
export type ItemCategory = 'elemental' | 'material' | 'monster-loot' | 'equipment' | 'boss-loot'
export type InventoryCategory = 'material' | 'loot' | 'equipment' | 'special'
export type InventoryMaterialSubtype = 'elemental' | 'creature' | 'ore' | 'refined' | 'arcane'
export type SpellType = 'damage' | 'heal' | 'barrier' | 'dot' | 'buff' | 'debuff' | 'hybrid'
import type { ActiveStatus, CombatEffect, StatusId, TraitDefinition } from './systems/combat/combatTypes'
export type { ActionPattern, ActionStep, ActiveStatus, CombatActionDefinition, CombatCondition, CombatConditionContext, CombatDamageComponentEvent, CombatEffect, CombatEvent, CombatEventSink, CombatModifier, CombatResolutionContext, CombatSource, CombatTag, DamageComponent, DamageType, EffectTarget, Magnitude, ModifierKey, StatusId, StatusDefinition, TraitDefinition, TraitId } from './systems/combat/combatTypes'
export type ManaPillarId = 'leyline-conduit' | 'arcane-reservoir' | 'mana-resonance' | 'astral-expansion' | 'echo-attunement'
export type TransmutationArrayId = 'temporal-array' | 'conservation-array' | 'replication-array' | 'mana-refinement-array' | 'echo-stabilization-array'
export type ChannelingDiscoveryId = 'stable-leyline' | 'echo-resonance' | 'deep-reservoir'
export type RecipeId = TransmutationRecipeId | ArtificingRecipeId
export type TransmutationRecipeId = 'fire-fragment' | 'water-fragment' | 'earth-fragment' | 'air-fragment' | 'prismatic-fragment'
/** Artificing is reserved for permanent Artifact Equipment. Dungeon gear is combat loot. */
export type ArtificingRecipeId = ArtifactId
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

export type AutoCastCondition =
  | { type: 'always' }
  | { type: 'health-below'; percent: number }
  | { type: 'barrier-below'; value: number }
  | { type: 'self-status-missing'; statusId: StatusId }
  | { type: 'target-status-missing'; statusId: StatusId }
  | { type: 'self-has-cleanseable-debuff' }
  | { type: 'all'; conditions: AutoCastCondition[] }
export interface EquipmentStats {
  spellPowerPct?: number
  maxHealthPct?: number
  maxManaPct?: number
  spellPower?: number
  maxHealth?: number
  healthRegen?: number
  maxMana?: number
  manaRegen?: number
  maxFocus?: number
  defense?: number
  critChance?: number
  critDamage?: number
  cooldownRecoveryPct?: number
  healingDonePct?: number
  barrierPowerPct?: number
  damageOverTimePct?: number
  damageReductionPct?: number
  statusDurationPct?: number
  manaCostReductionPct?: number
  focusEfficiencyPct?: number
  resistances?: Partial<Record<import('./systems/combat/combatTypes').DamageType, number>>
}

export type ArcaneCoreBranchId = 'power' | 'vitality' | 'focus' | 'control'
export type ArcaneCoreModifierKey = Exclude<keyof EquipmentStats, 'resistances'>
export type ArcaneCoreRingIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type ArcaneCoreNodeType = 'minor' | 'perk' | 'major'
export type ArcaneCoreV6ImplementationCategory = 'STATIC_STAT' | 'STATIC_MODIFIER' | 'CAST_MODIFIER' | 'CAST_COMMIT' | 'COMBAT_EVENT' | 'STATUS_EVENT' | 'BARRIER_EVENT' | 'HEAL_EVENT' | 'KILL_EVENT' | 'SURVIVAL' | 'RESOURCE_CONVERSION' | 'TIMELINE' | 'LOADOUT' | 'MANUAL_QUEUE' | 'ENCOUNTER_LIFECYCLE'
export type ArcaneCoreSpecialEffect =
  | { type: 'nth-damaging-spell-bonus'; every: number; damageMultiplier: number }
  | { type: 'lethal-survival'; leaveAtHealth: number; oncePerDungeonRun: boolean }
  | { type: 'mana-overflow-to-barrier'; conversion: number; maxHealthPercentPerSecondCap: number }
  | { type: 'nth-spell-free'; every: number }
  | { type: 'reserved-focus-spell-power'; spellPowerPerReservedFocus: number }
  | { type: 'free-focus-mana-regen'; manaRegenPerFreeFocus: number }
  | { type: 'nth-spell-cooldown-pulse'; every: number; cooldownReductionMs: number }
  | { type: 'v6-mechanic'; mechanicId: string; displayName: string; rank: number; category: ArcaneCoreV6ImplementationCategory }
export interface ArcaneCoreResolvedEffects {
  stats?: EquipmentStats
  modifiers?: import('./systems/combat/combatTypes').CombatModifier[]
  rules?: import('./systems/combat/combatTypes').CombatTriggerRule[]
  special?: ArcaneCoreSpecialEffect[]
}
export interface ArcaneCoreNodeDefinition {
  id: string
  branchId: ArcaneCoreBranchId
  ring: ArcaneCoreRingIndex
  angleDeg: number
  name: string
  description: string
  nodeType: ArcaneCoreNodeType
  maxRank: number
  rankCost: number
  resolveEffects: (rank: number) => ArcaneCoreResolvedEffects
}
export interface ArcaneCoreBranchDefinition {
  id: ArcaneCoreBranchId
  name: string
  description: string
  accent: string
  nodes: ArcaneCoreNodeDefinition[]
}
export interface ArcaneCoreNodeProgress {
  rank: number
}
export interface ArcaneCoreState {
  /** Optional only for compile-time compatibility with historical test fixtures; fresh and migrated saves always define it. */
  totalPointsEarned?: number
  /** Authored Arcane Core node/effect schema marker. Older saves omit this field. */
  arcaneCoreVersion?: number
  nodes: Partial<Record<string, ArcaneCoreNodeProgress>>
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
  id: CanonicalSpellId
  name: string
  school: SchoolId
  description: string
  unlockLevel: number
  manaCost: number
  castTimeMs: number
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
export interface ArtifactProgressState { minorRanks: Partial<Record<string, number>> }
export interface ActivitiesState {
  channeling: ChannelingActivity
  research: ResearchActivity
  transmutation: TransmutationActivity
  artificing: ArtificingActivity
  autoCast: Record<SpellId, boolean>
  /** Ordered Auto-Cast source of truth. The boolean record is compatibility/UI projection. */
  autoCastPriority: CanonicalSpellId[]
}
export interface SpellPresetSlot {
  spellId: CanonicalSpellId
  autoCast: boolean
  /** Optional for legacy saves; runtime normalizes missing rules to a safe default. */
  automation?: SpellAutomationConfig
}

export type SpellAutomationTargetRule = 'current-enemy' | 'self'

export type SpellAutomationCondition =
  | { type: 'always' }
  | { type: 'player-hp'; operator: 'below' | 'above'; percent: number }
  | { type: 'enemy-hp'; operator: 'below' | 'above'; percent: number }
  | { type: 'mana'; operator: 'below' | 'above'; percent: number }
  | { type: 'player-buff'; operator: 'missing' | 'has' | 'remaining-below'; effectId: StatusId; seconds?: number }
  | { type: 'enemy-debuff'; operator: 'missing' | 'has' | 'remaining-below'; effectId: StatusId; seconds?: number }
  | { type: 'boss'; operator: 'is' | 'is-not' }
  /** Compatibility conditions used by authored spell defaults from older saves. */
  | { type: 'player-barrier-below'; value: number }
  | { type: 'player-has-cleanseable-debuff' }

export interface SpellAutomationConfig {
  conditions: SpellAutomationCondition[]
  targetRule: SpellAutomationTargetRule
}
export interface SpellPreset {
  id: SpellPresetId
  name: string
  slots: SpellPresetSlot[]
}
export interface SpellPresetState {
  presets: SpellPreset[]
  selectedPresetId: SpellPresetId | null
}
export interface ActiveCombatSpellLoadout {
  presetId: SpellPresetId | null
  presetName: string
  slots: SpellPresetSlot[]
  signature: string
}
export interface CombatState {
  active: boolean
  dungeonId: DungeonId | null
  enemyId: MonsterId | null
  /** Authored normal encounter target for targeted Locations; null for random-pool runs. */
  targetEnemyId: MonsterId | null
  /** World Tier captured when the current enemy spawned. */
  enemyWorldTier: WorldTierId | null
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
  pendingPlayerSpellCast: PendingPlayerSpellCast | null
  /** One-slot manual intent. This is transient and is never restored from saves. */
  queuedPlayerSpellId: CanonicalSpellId | null
  /** Frozen combat deck for the current enemy encounter. */
  activeSpellLoadout: ActiveCombatSpellLoadout | null
  /** Spawn downtime countdown only. Never use as a gameplay clock. */
  encounterTimerMs: number
  /** Current deterministic step for sequence Dungeons; null outside sequence mode. */
  dungeonSequenceIndex: number | null
  spellCooldowns: Record<SpellId, number>
  /** Runtime Auto-Cast starvation latch; persisted harmlessly with combat state. */
  /** Deterministic transient counters for Arcane Core combat specials. */
  arcaneCoreRuntime: {
    /** Monotonic simulated milliseconds for V6 timestamps and windows. */
    elapsedMs: number
    /** Run-global clock anchor for the current enemy; elapsedMs is never reset here. */
    encounterStartedAtMs?: number
    damagingSpellCount: number
    spellCastCount: number
    cooldownPulseSpellCount: number
    survivalInstinctUsed: boolean
    /** Runtime metadata used by V6 AUTO/MANUAL and sequence primitives. */
    autoCastCount?: number
    lastCastOrigin?: 'auto' | 'manual-direct' | 'manual-queued'
    lastSpellId?: CanonicalSpellId | null
    lastLoadoutSlotIndex?: number | null
    differentSpellStreak?: number
    /** Independent no-repeat sequences used by the V7 Power branch. */
    spellSequenceStreak?: number
    aggressiveRotationStreak?: number
    sovereignSequenceStreak?: number
    alternatingCastStreak?: number
    enemyDamagingSpellCount?: number
    nextDamageMultiplier?: number
    /** Damage reserved for the first qualifying damaging Spell against the next enemy. */
    nextEnemyDamageMultiplier?: number
    nextEffectivenessMultiplier?: number
    nextActionSpeedMultiplier?: number
    nextManaRefundPercent?: number
    nextCritChanceBonus?: number
    nextCritDamageBonus?: number
    nextGuaranteedCrit?: boolean
    failedCritStreak?: number
    lastSuccessfulCastAtMs?: number
    nextLowCostDamageMultiplier?: number
    costBandHistory?: Array<'low' | 'high' | 'overcharged' | 'extreme'>
    lastWordUsed?: boolean
    sovereigntyCharges?: number
    nextNonCritDamageMultiplier?: number
    criticalFeedbackLastAtMs?: number
    criticalRecoveryLastAtMs?: number
    ruinStacks?: number
    chainReactionReady?: boolean
    burstWindowReady?: boolean
    arcaneOverloadReady?: boolean
    arcaneEchoReady?: boolean
    cataclysmUsed?: boolean
    limitBreakUsed?: boolean
    singularityUntilMs?: number
    recentManaSpend?: Array<{ atMs: number; amount: number }>
    nextManaRestoreFlat?: number
    renewalLastAtMs?: number
    v7EventLastAtMs?: Record<string, number>
    refuseDeathUsed?: boolean
    lastSurvivalToken?: 'refuse-death' | 'immortal-guard' | 'undying'
    barrierMemoryMultiplier?: number
    barrierMemoryUntilMs?: number
    arcaneAegisLastAtMs?: number
    immortalGuardUsed?: boolean
    immortalGuardUntilMs?: number
    undyingUntilMs?: number
    secondWindUsed?: boolean
    refuseDeathThresholdUsed?: boolean
    deepBreathingUsed?: boolean
    controlledTempoUsed?: boolean
    overflowCharges?: number
    singularityUsed?: boolean
    perfectTimingUntilMs?: number
    temporalFractureCount?: number
    stolenTimeStacks?: number
    totalEnemyDelayMs?: number
    timelineDelayCreditMs?: number
    absoluteStasisUsed?: boolean
    absoluteStasisUntilMs?: number
    victoryMomentumReady?: boolean
    ruinTransferReady?: boolean
    ruinTransferMultiplier?: number
    apotheosisUntilMs?: number
    overchannelUntilMs?: number
    manaRegenDisabledUntilMs?: number
    nextHealingActionSpeedMultiplier?: number
    nextSelfTargetActionSpeedMultiplier?: number
    /** V7 one-shot and timed combat windows. */
    recoveryWindowUntilMs?: number
    recoveryWindowMultiplier?: number
    reinforcedRecoveryUntilMs?: number
    reinforcedRecoveryMultiplier?: number
    stasisCollapseUntilMs?: number
    castLoadoutSlots?: number[]
    echoCharges?: number
    manualCharges?: number
    manualCastCount?: number
    differentLoadoutSlotStreak?: number
    consecutiveAutoCasts?: number
    consecutiveManualCasts?: number
    lastCastAtFullMana?: boolean
    nextAutoRefundPercent?: number
    lastManaBand?: number
    nextControlStatusDurationMultiplier?: number
    controlStatusApplications?: number
    lastDamageTakenAtMs?: number
    artifactSpellCount?: number
    artifactAirSpellCount?: number
    artifactLastSpellAtMs?: number
    artifactAfterHealWaterReady?: boolean
    artifactNextIdleDamageMultiplier?: number
    artifactFreeFocusSnapshot?: number
  }
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
export interface PendingPlayerSpellCast {
  spellId: CanonicalSpellId
  targetInstanceKey: string | null
  remainingWorkMs: number
  castWorkMs: number
  manaCostSnapshot: number
  arcaneCoreFree: boolean
  castWorkMultiplier: number
  castOrigin?: 'auto' | 'manual-direct' | 'manual-queued'
  loadoutSlotIndex?: number | null
  arcaneCoreActionSpeedMultiplier?: number
  arcaneCoreManaCostMultiplier?: number
  arcaneCoreEffectivenessMultiplier?: number
  arcaneCoreCritChanceBonus?: number
  arcaneCoreCritDamageBonus?: number
  arcaneCoreGuaranteedCrit?: boolean
  castWasGust?: boolean
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
export interface UiState {
  screen: ScreenId
  /** The last dungeon the player successfully entered, not a world browse selection. */
  lastEnteredCombatDungeonId?: DungeonId
}
export interface GameState {
  saveVersion: number
  player: PlayerState
  schools: Record<SchoolId, SchoolState>
  currencies: { gold: number }
  resonance: ResonanceState
  worldTier: WorldTierState
  inventory: Partial<Record<ItemId, number>>
  crystals: CrystalState
  protectedItems: Partial<Record<ItemId, boolean>>
  equipment: Record<EquipmentPosition, ItemId | null>
  arcaneCore: ArcaneCoreState
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
  disableAutoCast: boolean
  freezePlayerActions: boolean
  freezeEnemyActions: boolean
  combatPaused: boolean
  combatTimeScale: number
  /** Artifact-only tester controls. These values are reset on load and excluded from saves. */
  artifactFreeRankPurchase: boolean
  artifactIgnoreOwnership: boolean
  arcaneCoreFreeCosts: boolean
  arcaneCoreIgnorePrerequisites: boolean
}
export interface NotificationItem { id: string; text: string; tone: 'info' | 'success' | 'warning'; key?: string; createdAt?: number }
export interface FocusReservation {
  id: string
  sourceType: 'combat' | 'research' | 'transmutation' | 'channeling'
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
