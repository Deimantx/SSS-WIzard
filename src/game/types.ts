import type { PortalShardId } from './content/dark-portal/portalShards'
import type { ResonanceState } from './content/resonance/resonance'
import type { ElementId as CombatElementId } from './content/elements/elements'
export type { ResonanceState, ResonanceType, ResonanceYield } from './content/resonance/resonance'
import type { WorldTierId, WorldTierState } from './content/world-tier/worldTiers'
import type { CombatLocationId } from './content/combat-locations/combatLocationIds'
import type { DamageType, ModifierKey } from './systems/combat/combatTypes'
export type { WorldTierDefinition, WorldTierId, WorldTierState } from './content/world-tier/worldTiers'

export type SchoolId = 'fire' | 'water' | 'earth' | 'air'
export type ElementId = SchoolId
export type ScreenId = 'home' | 'combat' | 'schools' | 'inventory' | 'equipment' | 'arcane-core' | 'crystals' | 'collection' | 'bestiary' | 'tower-channeling' | 'tower-acolytes' | 'tower-research' | 'tower-transmutation' | 'tower-artificing' | 'tower-summoning' | 'tower-dark-portal' | 'arcane-guild' | 'hunters-order' | 'settings'
export type ActivityStatus = 'running' | 'flux-limited' | 'paused' | 'waiting-flux' | 'waiting-mana' | 'completed' | 'locked' | 'recovering'

export type ChronicleChapterId = 'first-frontier' | 'shattered-frontier'
export type ChronicleTrack = 'main' | 'combat' | 'magic' | 'tower' | 'guild' | 'region' | 'equipment'
export type ChronicleObjectiveId =
  | 'm1-choose-school' | 'm1a-enter-elemental-counter-zone' | 'm1b-exploit-elemental-weakness'
  | 'm2-first-blood' | 'm2a-elemental-frontier' | 'm2b-equip-elemental-ward' | 'm2c-test-elemental-ward' | 'm2d-defeat-elemental-boss'
  | 'm3-heart-of-the-woods' | 'm4-break-the-den' | 'm5-fallen-archmage'
  | 'c1-enter-whispering-woods' | 'c2-auto-cast'
  | 'mg1-strengthen-artifact' | 'mg2-expand-spellbook' | 'mg3-four-spell-arsenal'
  | 't1-channeling-acolyte' | 't2-shape-resonance' | 't3-study-the-fragment' | 't4-answer-verdant-circle' | 't5-read-a-sigil'
  | 'g1-join-verdant-circle' | 'g2-first-guild-contract' | 'g3-guild-apprentice' | 'g4-hunters-calling' | 'g5-first-hunt-contract' | 'g6-arcane-service' | 'g7-professional-standing' | 'g8-guild-rank-two' | 'g9-restore-guild-archive' | 'g10-first-registry-set' | 'g11-invest-in-the-guild' | 'g12-enter-gloamridge' | 'g13-accept-a-hunt' | 'g14-hunter-training'
  | 'sf-m1-cross-fractured-approach' | 'sf-m2-elemental-gatekeeper' | 'sf-m3-bind-guardian' | 'sf-m3a-stabilize-elemental-scar' | 'sf-m3b-enter-crossroads' | 'sf-m3c-crossroads-keeper' | 'sf-m3d-stabilize-shattered-meridian' | 'sf-m4-reach-meridian' | 'sf-m5-meridian-splitter' | 'sf-m5a-break-black-sigil-reach' | 'sf-m5b-enter-black-gate' | 'sf-m5c-black-gatekeeper' | 'sf-m6-world-tier-two' | 'sf-c1-world-tier-three' | 'sf-c2-world-tier-four' | 'sf-c3-world-tier-five'
  | 'sf-bind-guardian' | 'sf-fight-together' | 'sf-socket-first-crystal' | 'sf-step-into-harder-world'
  | `sigil-${string}`
export type ChronicleEventId = 'first-fragment-transmuted' | 'first-research-batch-completed' | 'first-guardian-combat-completed' | 'first-wt2-kill' | 'first-wt3-kill' | 'first-wt4-kill' | 'first-wt5-kill' | 'first-sigil-earned' | 'first-elemental-weakness-hit' | 'elemental-tutorial-zones-opened' | 'first-elemental-ward-equipped' | 'first-elemental-ward-mitigation' | 'first-elemental-tutorial-boss-defeated' | 'starting-counter-zone-entered'
export type GuildRankId = 'outsider' | 'initiate' | 'apprentice' | 'adept' | 'magister' | 'circle-master'
export type GuildRequestKind = 'donation' | 'dungeon-kills' | 'monster-kills' | 'boss-kill'
export type GuildSkillNodeId =
  | 'hunter-arcane-quarry' | 'hunter-resonant-pursuit' | 'hunter-trophy-hunter'
  | 'quartermaster-careful-harvest' | 'quartermaster-relic-appraisal' | 'quartermaster-cache-appraisal'
  | 'tower-leyline-assistance' | 'tower-efficient-arrays' | 'tower-expanded-quarters'
  | 'guild-peer-review' | 'guild-resonance-etching' | 'guild-calibrated-rota'
  | 'major-favored-contractor' | 'major-efficient-procurement' | 'major-arcane-efficiency' | 'major-guild-connections' | 'major-coordination' | 'major-grand-standing'
  | 'scholarship-measured-inquiry' | 'scholarship-peer-review' | 'scholarship-structured-methodology' | 'scholarship-archive-cross-reference' | 'scholarship-faculty-mentorship' | 'scholarship-scholarly-discipline'
  | 'transmutation-efficient-arrays' | 'transmutation-resonance-handling' | 'transmutation-stable-catalysis' | 'transmutation-production-discipline' | 'transmutation-conversion-discipline' | 'transmutation-precision-arrays'
  | 'tower-leyline-assistance-v4' | 'tower-flux-reservoir-methods' | 'tower-channeling-rota' | 'tower-acolyte-coordination' | 'tower-scheduling' | 'tower-channeling-faculty'
  | 'service-faculty-letters' | 'service-efficient-delivery' | 'service-registry-stewardship' | 'service-project-logistics' | 'service-study-coordination' | 'service-commission-office-practice'
  | 'major-expanded-quarters' | 'major-project-stewardship'

export interface ChronicleProgressState {
  completedObjectiveIds: ChronicleObjectiveId[]
  grantedUnlockRewardIds: ChronicleObjectiveId[]
  eventFlags: Partial<Record<ChronicleEventId, boolean>>
}

/**
 * Canonical item IDs grouped by authored ownership. Keep this list aligned
 * with the material, special-item, and Artifact item registries.
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
  // Tier 1 Artifact Equipment
  | 'ember-staff'
  | 'tideglass-wand'
  | 'stoneheart-scepter'
  | 'windthread-wand'
  | 'wispweave-robe'
  | 'wispveil-hood'
  // First Frontier — Whispering Woods
  // First Frontier — Howling Den
  // First Frontier — Abandoned Catacombs
  | 'black-portal-shard'
  // Tier 2 Artifact Equipment
  | 'galeshard-staff'
  | 'reliquary-scepter'
  | 'pyrebound-staff'
  | 'rootheart-scepter'
  | 'convergence-robe'
  | 'waystone-circlet'
  // Regional Progression — Fractured Approach
  // Regional Progression — Flooded Reliquary
  // Regional Progression — Ashen Watch
  // Regional Progression — Rootscar Hollow
  // Regional Progression — Crossroads of Ruin
  // Regional Progression — Graveglass Hollow
  // Regional Progression — Stormvault Gallery
  // Regional Progression — Starfallen Observatory
  // Regional Progression — Broken Meridian
  // Regional Progression — Hall of Unbound Names
  // Regional Progression — Vault of the Black Sigil
  // Regional Progression — Black Gate

export type StoryEventId = 'edrin-dark-portal-discovery'

export type CanonicalSpellId =
  | 'fire-bolt' | 'searing-touch' | 'flame-burst' | 'kindling' | 'firestorm' | 'combustion' | 'inferno' | 'execution-flame'
  | 'water-bolt' | 'mending-waters' | 'frost-touch' | 'regeneration' | 'frozen-current' | 'cleansing-tide' | 'deep-freeze' | 'healing-tide'
  | 'stone-shard' | 'stone-skin' | 'earthen-barrier' | 'harden' | 'rockfall' | 'rend-armor' | 'tremors' | 'living-mountain'
  | 'wind-blade' | 'lightning-spark' | 'gust' | 'chain-lightning' | 'tailwind' | 'static-charge' | 'thunderstrike' | 'eye-of-the-storm'
  | 'fire-ward' | 'water-ward' | 'air-ward' | 'earth-ward'
/** Legacy IDs remain type-compatible only so old persisted callers can be normalized. */
export type LegacySpellId = 'ignite' | 'fireball' | 'water-ward' | 'flow-mend' | 'frostbite' | 'earth-spike' | 'stoneguard' | 'fortify' | 'air-lance' | 'quickening' | 'shock-spark'
export type SpellId = CanonicalSpellId | LegacySpellId
export type SpellPresetId = string
export type MonsterId = 'forest-wisp' | 'thornling' | 'dewbound-sprite' | 'cinder-moth' | 'stone-root' | 'grove-sentinel' | 'tempest-stag' | 'forest-heart' | 'cavefang-wolf' | 'razorclaw-lynx' | 'corrupted-dire-wolf' | 'bonehide-boar' | 'moonblind-jackal' | 'den-stalker' | 'corrupted-greatbear' | 'restless-skeleton' | 'grave-wraith' | 'fallen-acolyte' | 'archmage-edrin-shade' | 'warded-husk' | 'rift-wolf' | 'arcane-scavenger' | 'withered-watcher' | 'corrupted-elemental-gatekeeper' | 'tidefang-serpent' | 'brinebound-sentinel' | 'abyssal-archivist' | 'emberwing-harrier' | 'charred-warden' | 'pyre-colossus' | 'sporeback-brute' | 'vinebound-reaver' | 'scarwood-behemoth' | 'ashen-tracker' | 'gloamfang-stalker' | 'runehorn-brute' | 'veilwing-harrier' | 'cinderback-mauler' | 'gloomroot-hexer' | 'nightglass-alpha'
  | 'stonewake-gravel-wisp' | 'stonewake-rootback-crawler' | 'stonewake-shardhide-golem' | 'stonewake-stonebound-warden' | 'heartstone-colossus'
  | 'galecrest-zephyr-wisp' | 'galecrest-gale-imp' | 'galecrest-razorwing' | 'galecrest-stormcaller-adept' | 'tempest-roc'
  | 'tideglass-tide-wisp' | 'tideglass-reef-crawler' | 'tideglass-current-serpent' | 'tideglass-drowned-channeler' | 'deepwater-oracle'
  | 'emberfall-ember-wisp' | 'emberfall-ashling' | 'emberfall-flame-hound' | 'emberfall-ashen-adept' | 'pyre-guardian'
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
export type { CombatLocationId }
export type EquipmentItemSlot = 'weapon' | 'armor' | 'helmet'
export type EquipmentPosition = 'weapon' | 'armor' | 'head'
/** Permanent Artifact Equipment identifiers. */
export type ArtifactId =
  // First Frontier Artifacts
  | 'ember-staff'
  | 'tideglass-wand'
  | 'stoneheart-scepter'
  | 'windthread-wand'
  | 'wispweave-robe'
  | 'wispveil-hood'
  // Regional Progression Artifacts
  | 'galeshard-staff'
  | 'reliquary-scepter'
  | 'pyrebound-staff'
  | 'rootheart-scepter'
  | 'convergence-robe'
  | 'waystone-circlet'
export type EquipmentBuildTag = 'spell' | 'basic-attack' | 'hybrid' | 'crit' | 'status' | 'dot' | 'barrier' | 'defense' | 'sustain' | 'mana' | 'healing' | 'fire' | 'water' | 'earth' | 'air'
export type EquipmentBudgetProfileId = 'standard' | 'signature' | 'boss'
/** @deprecated Use EquipmentItemSlot for item metadata or EquipmentPosition for loadout state. */
/** Legacy authored category kept for save/content compatibility. */
export type ItemCategory = 'elemental' | 'material' | 'monster-loot' | 'equipment' | 'boss-loot'
export type InventoryCategory = 'material' | 'loot' | 'equipment' | 'special'
export type InventoryMaterialSubtype = 'elemental' | 'creature' | 'herb' | 'ore' | 'refined' | 'arcane'
export type SpellType = 'damage' | 'heal' | 'barrier' | 'dot' | 'buff' | 'debuff' | 'hybrid'
import type { ActiveStatus, CombatEffect, StatusId, TraitDefinition } from './systems/combat/combatTypes'
import type { SigilSetId } from './content/sigils/sigilSets'
import type { SigilQuality } from './content/sigils/sigilQualities'
import type { SigilStatId } from './content/sigils/sigilStats'
import type { SigilTier } from './content/sigils/sigilTiers'
import type { SigilTraitId } from './content/sigils/sigilTraits'
export type { SigilSetId } from './content/sigils/sigilSets'
export type { SigilQuality } from './content/sigils/sigilQualities'
export type { SigilStatId } from './content/sigils/sigilStats'
export type { SigilTier } from './content/sigils/sigilTiers'
export type { SigilTraitId } from './content/sigils/sigilTraits'
export type { ActionPattern, ActionStep, ActiveStatus, CombatActionDefinition, CombatCondition, CombatConditionContext, CombatDamageComponentEvent, CombatEffect, CombatEvent, CombatEventSink, CombatModifier, CombatResolutionContext, CombatSource, CombatTag, DamageComponent, DamageType, EffectTarget, Magnitude, ModifierKey, StatusId, StatusDefinition, TraitDefinition, TraitId } from './systems/combat/combatTypes'
export type ManaPillarId = 'leyline-conduit' | 'arcane-reservoir' | 'mana-resonance' | 'astral-expansion' | 'echo-attunement'
export type TransmutationArrayId = 'temporal-array' | 'conservation-array' | 'replication-array' | 'flux-refinement-array' | 'resonance-stability-array'
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
  | { type: 'location-monster-kills'; locationId: CombatLocationId; count?: number }
  | { type: 'location-unlocked'; locationId: CombatLocationId }
  /** @deprecated V1-V23 compatibility for external callers and old authored data. */
  | { type: 'first-dungeon-boss-kill' }

export type AutoCastCondition =
  | { type: 'always' }
  | { type: 'health-below'; percent: number }
  | { type: 'barrier-below'; value: number }
  | { type: 'self-status-missing'; statusId: StatusId }
  | { type: 'target-status-missing'; statusId: StatusId }
  | { type: 'self-has-cleanseable-debuff' }
  | { type: 'elemental-ward-expiring'; element: CombatElementId; sourceId: string; remainingMs: number }
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
  resistances?: Partial<Record<import('./systems/combat/combatTypes').DamageType, number>>
}

export type SigilSlot = 1 | 2 | 3 | 4 | 5 | 6

export interface SigilSecondaryState {
  statId: SigilStatId
  rolls: Array<{ quality01: number; rank: number }>
}

export interface SigilRollHistoryEntry {
  rank: number
  kind: 'new-secondary' | 'improve-secondary' | 'trait'
  statId?: SigilStatId
  traitId?: SigilTraitId
  rollQuality01?: number
}

export interface SigilInstance {
  instanceId: string
  tier: SigilTier
  quality: SigilQuality
  setId: SigilSetId
  slot: SigilSlot
  rank: number
  mainStatId: SigilStatId
  secondaries: SigilSecondaryState[]
  traitIds: SigilTraitId[]
  rollHistory: SigilRollHistoryEntry[]
  locked: boolean
}

export interface SigilDiscoveryState {
  discoveredSets: Partial<Record<SigilSetId, boolean>>
  discoveredSlotsBySet: Partial<Record<SigilSetId, Partial<Record<SigilSlot, boolean>>>>
  bestQualityBySet: Partial<Record<SigilSetId, SigilQuality>>
  bestTierBySet: Partial<Record<SigilSetId, SigilTier>>
  discoveredTraits: Partial<Record<SigilTraitId, boolean>>
  qualitiesFound: Partial<Record<SigilQuality, boolean>>
  tiersFound: Partial<Record<SigilTier, boolean>>
}

export interface SigilState {
  nextInstanceSequence: number
  storage: Record<string, SigilInstance>
  equipped: Record<SigilSlot, string | null>
  dust: number
  attunedSetId: SigilSetId | null
  highestSourcePowerDefeated: number
  lifetimeDrops: number
  firstDropPityKills: number
  highestRankEver: number
  secondaryRollsLifetime: number
  traitsUnlockedLifetime: number
  discovery: SigilDiscoveryState
  hasDefeatedWorldTier2Boss: boolean
  autoSalvage: Record<SigilQuality, boolean>
}

export type ArcaneCoreBranchId = 'power' | 'vitality' | 'mana' | 'control'
export type ArcaneCoreModifierKey = Exclude<keyof EquipmentStats, 'resistances'>
export type ArcaneCoreRingIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type ArcaneCoreNodeType = 'minor' | 'perk' | 'major'
export type ArcaneCoreMechanicCategory = 'STATIC_STAT' | 'STATIC_MODIFIER' | 'CAST_MODIFIER' | 'CAST_COMMIT' | 'COMBAT_EVENT' | 'STATUS_EVENT' | 'BARRIER_EVENT' | 'HEAL_EVENT' | 'KILL_EVENT' | 'SURVIVAL' | 'RESOURCE_CONVERSION' | 'TIMELINE' | 'LOADOUT' | 'MANUAL_QUEUE' | 'ENCOUNTER_LIFECYCLE'
export type ArcaneCoreSpecialEffect =
  | { type: 'nth-damaging-spell-bonus'; every: number; damageMultiplier: number }
  | { type: 'lethal-survival'; leaveAtHealth: number; oncePerDungeonRun: boolean }
  | { type: 'mana-overflow-to-barrier'; conversion: number; maxHealthPercentPerSecondCap: number }
  | { type: 'nth-spell-free'; every: number }
  | { type: 'nth-spell-cooldown-pulse'; every: number; cooldownReductionMs: number }
  | { type: 'arcane-core-mechanic'; mechanicId: string; displayName: string; rank: number; category: ArcaneCoreMechanicCategory }
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
  registryMode?: 'consume' | 'discover' | 'own'
  registryCategory?: string
  registryQuantity?: number
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
  baseMaxHealth: number
  baseMaxMana: number
  healthRegenTimerMs: number
}
export interface ChannelingActivity {
  acolytesAssigned?: number
  /** Historical save field; fresh runtime state uses acolytesAssigned. */
  echoesAssigned?: number
}
export type ResearchSlotId = 'research-1' | 'research-2' | 'research-3' | 'research-4'
export type ResearchJobStatus = 'prepared' | 'running' | 'flux-limited' | 'waiting-flux' | 'mana-limited' | 'waiting-mana' | 'level-cap' | 'protected' | 'missing-item'
export type ResearchStatus = ResearchJobStatus
export interface ResearchJobState {
  itemId: ItemId
  targetSchoolId: SchoolId
  requestedQuantity: number
  remainingQuantity: number
  progressMs: number
  acolyteAssigned?: boolean
  /** Historical save field; fresh runtime state uses acolyteAssigned. */
  echoesAssigned?: number
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
  /** @deprecated V8 compatibility only. */
  status?: ResearchStatus | 'idle' | 'paused' | 'completed'
}
export interface TransmutationJobState {
  acolyteAssigned?: boolean
  progressMs: number
  /** Historical save field; fresh runtime state uses acolyteAssigned. */
  echoesAssigned?: number
}
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
  | { type: 'elemental-ward-expiring'; element: CombatElementId; sourceId: string; remainingMs: number }

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
  locationId: CombatLocationId | null
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
  sigilRuntime: {
    spellCastCount: number
    predatorCriticalStacks: number
    predatorStacksExpireAtMs: number
    secondSkinUsed: boolean
    barrierReboundReadyAtMs?: number
    criticalFlowAvailableAtMs?: number
  }
  pendingBossId: MonsterId | null
  pendingPlayerSpellCast: PendingPlayerSpellCast | null
  /** One-slot manual intent. This is transient and is never restored from saves. */
  queuedPlayerSpellId: CanonicalSpellId | null
  /** Frozen combat deck for the current enemy encounter. */
  activeSpellLoadout: ActiveCombatSpellLoadout | null
  /** Spawn downtime countdown only. Never use as a gameplay clock. */
  encounterTimerMs: number
  /** Current deterministic step for sequence Dungeons; null outside sequence mode. */
  sequenceIndex: number | null
  spellCooldowns: Record<SpellId, number>
  /** Runtime Auto-Cast starvation latch; persisted harmlessly with combat state. */
  /** Deterministic transient counters for Arcane Core combat specials. */
  arcaneCoreRuntime: {
    /** Monotonic simulated milliseconds for Arcane Core timestamps and windows. */
    elapsedMs: number
    /** Run-global clock anchor for the current enemy; elapsedMs is never reset here. */
    encounterStartedAtMs?: number
    damagingSpellCount: number
    spellCastCount: number
    cooldownPulseSpellCount: number
    survivalInstinctUsed: boolean
    /** Runtime metadata used by Arcane Core AUTO/MANUAL and sequence primitives. */
    autoCastCount?: number
    lastCastOrigin?: 'auto' | 'manual-direct' | 'manual-queued' | null
    dualMindPreparedOrigin?: 'auto' | 'manual'
    dualMindPreparedUntilMs?: number
    lastSpellId?: CanonicalSpellId | null
    lastLoadoutSlotIndex?: number | null
    /** Successful casts since the last repeated spell/slot, used by sequence mechanics. */
    recentSpellSequence?: CanonicalSpellId[]
    recentDamagingSpellSequence?: CanonicalSpellId[]
    recentLoadoutSlotSequence?: number[]
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
    recentManaSpend?: Array<{ atMs: number; amount: number; sequence?: number }>
    manaSpendSequence?: number
    reservoirCycleTriggeredAtMs?: number
    reservoirCycleTriggeredSpendSequence?: number
    reservoirCycleReady?: boolean
    manaCollapseReady?: boolean
    manaCollapseLastAtMs?: number
    emergencyConversionReady?: boolean
    nextManaRestoreFlat?: number
    renewalLastAtMs?: number
    arcaneCoreEventLastAtMs?: Record<string, number>
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
    overchannelTriggeredAtMs?: number
    overchannelTriggeredSpendSequence?: number
    overchannelSpendFloorSequence?: number
    manaRegenDisabledUntilMs?: number
    nextHealingActionSpeedMultiplier?: number
    nextSelfTargetActionSpeedMultiplier?: number
    /** Arcane Core one-shot and timed combat windows. */
    recoveryWindowUntilMs?: number
    recoveryWindowMultiplier?: number
    reinforcedRecoveryUntilMs?: number
    reinforcedRecoveryMultiplier?: number
    stasisCollapseUntilMs?: number
    castLoadoutSlots?: number[]
    echoCharges?: number
    manualCharges?: number
    manualCastCount?: number
    consecutiveAutoCasts?: number
    consecutiveManualCasts?: number
    nextAutoRefundPercent?: number
    nextControlStatusDurationMultiplier?: number
    controlStatusApplications?: number
    lastDamageTakenAtMs?: number
    artifactSpellCount?: number
    artifactAirSpellCount?: number
    artifactLastSpellAtMs?: number
    artifactAfterHealWaterReady?: boolean
    artifactNextIdleDamageMultiplier?: number
    artifactManaShiftReady?: boolean
    artifactManaShiftLastAtMs?: number
  }
  playerStatuses: ActiveStatus[]
  enemyStatuses: ActiveStatus[]
  elementalDamageReductions: ElementalDamageReduction[]
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
  manaWasFullAtStart?: boolean
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
  guildRank: GuildRankId
  requestProgress: Record<string, number>
  guildReputation: number
  requestClaims: Record<string, boolean>
  guildPointsEarned: number
  guildSkillNodeRanks: Partial<Record<GuildSkillNodeId, number>>
  huntersOrder: HuntersOrderProgress
  arcaneRegistry: ArcaneRegistryProgress
  arcaneGuild: ArcaneGuildProgress
  chronicle: ChronicleProgressState
  permanentManaBonuses: Record<string, number>
  startingSchoolId: SchoolId | null
  tutorialStage: TutorialStage
  lifetimeKillsByMonster: Partial<Record<MonsterId, number>>
  bossKillsByBoss: Partial<Record<MonsterId, number>>
  autoHuntBossByLocation: Record<CombatLocationId, boolean>
  channeling: ChannelingProgress
  transmutation: TransmutationProgress
}



export type GuildCommissionCategory = 'supply' | 'channeling' | 'production' | 'research' | 'transmutation' | 'mixed'
export type GuildCommissionQuality = 'routine' | 'special' | 'prestigious'
export type GuildCommissionObjective =
  | { kind: 'item-supply'; itemId: ItemId; target: number; progress: number }
  | { kind: 'resonance-supply'; resonanceType: keyof ResonanceState; target: number; progress: number }
  | { kind: 'channeling'; metric: 'arcane-flux'; target: number; progress: number }
  | { kind: 'production'; itemId: ItemId; target: number; progress: number }
  | { kind: 'research'; schoolId?: SchoolId; target: number; progress: number }
  | { kind: 'transmutation'; recipeId?: TransmutationRecipeId; target: number; progress: number }
export type GuildCommissionObjectiveDefinition<T = GuildCommissionObjective> = T extends GuildCommissionObjective ? Omit<T, 'progress'> : never
export interface GuildCommissionState {
  id: string
  templateId: string
  category: GuildCommissionCategory
  quality: GuildCommissionQuality
  objectives: GuildCommissionObjective[]
  reputationReward: number
  advancementPointReward: number
}
export interface ElementalDamageReduction {
  element: CombatElementId
  reduction: number
  sourceId: string
  expiresAt?: number
  durationMs?: number
}
export interface GuildCommissionChainState { id: string; stageIndex: number; stageProgress: number }
export interface ArcaneGuildProgress {
  projects: Record<string, Partial<Record<ItemId, number>>>
  completedProjectIds: string[]
  activeCommissionChain: GuildCommissionChainState | null
  availableCommissions: GuildCommissionState[]
  activeCommission: GuildCommissionState | null
  generationCount: number
  completedCommissions: number
  freeRefreshes: number
  rngState: number
  completedChainIds: string[]
}

export interface ArcaneRegistryProgress {
  registeredEntries: Partial<Record<ItemId, number>>
  completedSetIds: string[]
}

export type HunterRankId = 'tracker' | 'scout' | 'stalker' | 'warden' | 'veteran' | 'master-hunter'
export type HunterContractTier = 'routine' | 'special' | 'prestigious'
export type HunterStandingId = `${HunterRankId}-${1 | 2 | 3 | 4 | 5}`
export type HunterUpgradeId = 'negotiated-rerolls' | 'order-privilege' | 'extended-trails' | 'pinned-orders' | 'dispatch-directives' | 'contract-recall' | 'trail-kit' | 'exact-quarry-briefing' | 'family-cull-orders' | 'alignment-pursuit-orders' | 'ground-patrol-orders' | 'prestigious-preparation' | 'marked-quarry' | 'routine-commendation' | 'special-commendation' | 'prestige-recognition' | 'deep-pockets' | 'broad-assignment-pay' | 'resonant-claim' | 'essence-claim' | 'fragment-rights' | 'sigil-claim' | 'resonant-completion' | 'essence-completion' | 'hunt-forecast' | 'board-forecast' | 'quarry-memory' | 'ground-survey' | 'priority-dispatch' | 'master-dossier'
export type HunterContractTarget =
  | { type: 'monster'; monsterId: MonsterId }
  | { type: 'family'; familyId: string }
  | { type: 'region'; locationId: CombatLocationId }
  | { type: 'alignment'; alignmentId: string }
  | { type: 'boss'; monsterId: MonsterId }
export interface HunterContractState {
  id: string
  huntingGroundId?: CombatLocationId
  targetSpec: HunterContractTarget
  target: number
  progress: number
  tier: HunterContractTier
  reputationReward: number
  marksReward: number
}
export interface HuntersOrderProgress {
  reputation: number
  rankId: HunterRankId
  hunterMarks: number
  totalContractsAccepted: number
  activeContract: HunterContractState | null
  availableContracts: HunterContractState[]
  pinnedContractIds?: string[]
  preferredContractType?: HunterContractTarget['type'] | null
  preferredHuntingGroundId?: CombatLocationId | null
  lastSelectedQuarryByGround?: Partial<Record<CombatLocationId, MonsterId>>
  blockedTargets: MonsterId[]
  purchasedUpgrades: Record<string, number>
  totalContractsCompleted: number
  totalHunterKills: number
  generationCount: number
  rngState: number
  monsterHunterStats: Partial<Record<MonsterId, { contractKills: number; contractsCompleted: number; marksEarned: number }>>
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


export interface ChannelingProgress {
  pillars: Record<ManaPillarId, ManaPillarState>
  totalManaGenerated: number
  totalFluxGenerated?: number
  fiveEchoSustainMs: number
  discoveries: Record<ChannelingDiscoveryId, boolean>
}

export type TutorialStage = 'choose-school' | 'combat' | 'first-kill' | 'tower-work' | 'channeling' | 'transmutation' | 'research' | 'complete'

export interface TowerState {
  acolytes: {
    base: number
    permanentBonuses: Record<string, number>
  }
  resources: {
    arcaneFlux: number
  }
}

export interface ManaPillarState {
  rank: number
  level: number
}
/** Gameplay UI state. Layout editing and developer tools are transient UI chrome outside the save. */
export interface UiState {
  screen: ScreenId
  /** The last dungeon the player successfully entered, not a world browse selection. */
  lastEnteredCombatLocationId?: CombatLocationId
  /** One-shot destination for pre-embedded Collection / Bestiary save routes. */
  legacyArchiveRoute?: 'registry' | 'bestiary' | null
}
export interface GameState {
  saveVersion: number
  player: PlayerState
  schools: Record<SchoolId, SchoolState>
  currencies: { gold: number }
  resonance: ResonanceState
  tower: TowerState
  worldTier: WorldTierState
  inventory: Partial<Record<ItemId, number>>
  crystals: CrystalState
  protectedItems: Partial<Record<ItemId, boolean>>
  equipment: Record<EquipmentPosition, ItemId | null>
  arcaneCore: ArcaneCoreState
  artifactProgress: Partial<Record<ArtifactId, ArtifactProgressState>>
  sigils: SigilState
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
  playerStats: DebugPlayerStatOverrides
  allowManaOverCap: boolean
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
  bonusAcolytes: number
  acolyteTotalOverride: number | null
  ignoreAcolyteLimit: boolean
  arcaneFluxCapacityOverride: number | null
}
/** Transient Character Lab values. Modifier values use the runtime decimal convention (0.25 = 25%). */
export interface DebugPlayerStatOverrides {
  maxHealthFlat: number
  maxHealthPercent: number
  healthRegenFlat: number
  maxManaFlat: number
  maxManaPercent: number
  manaRegenFlat: number
  manaRegenPercent: number
  spellPowerFlat: number
  spellPowerPercent: number
  manaCostReductionPercent: number
  modifiers: Partial<Record<ModifierKey, number>>
  spellDamageByType: Partial<Record<DamageType, number>>
  resistanceByType: Partial<Record<DamageType, number>>
}
export interface NotificationItem { id: string; text: string; tone: 'info' | 'success' | 'warning'; key?: string; createdAt?: number }

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

export type ActivityTelemetryStatus = 'running' | 'flux-limited' | 'waiting-flux' | 'mana-limited' | 'waiting-mana' | 'waiting-materials' | 'paused' | 'combat'
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
