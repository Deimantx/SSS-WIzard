import type { ArtifactId, EquipmentStats, ItemDefinition, ItemId, MonsterId, RecipeUnlockCondition } from '../../types'
import type { CombatModifier, CombatTriggerRule } from '../../systems/combat/combatTypes'
import { createCombatValidationContext, validateCombatProvider } from '../../systems/combat/combatEffectValidation'
import { STATUS_DEFINITIONS } from '../statuses/statuses'

export interface ArtifactForgeDefinition { ingredients: { itemId: ItemId; quantity: number }[] }
export interface ArtifactLevelUpgradeDefinition { fromLevel: number; toLevel: number; ingredients: { itemId: ItemId; quantity: number }[]; unlock?: RecipeUnlockCondition }
export interface ArtifactBranchDefinition { id: string; name: string; description?: string }
export interface ArtifactNodeDefinition {
  id: string
  artifactId: ArtifactId
  name: string
  type: 'minor' | 'major' | 'capstone'
  branch: string
  pointCost: number
  requiresLevel: number
  prerequisites?: string[]
  catalyst?: { itemId: ItemId; quantity: number }
  requiresBossKill?: MonsterId
  stats?: EquipmentStats
  combat?: { modifiers?: CombatModifier[]; rules?: CombatTriggerRule[] }
}
export interface ArtifactDefinition {
  id: ArtifactId
  itemId: ItemId
  tier: number
  maxLevel: number
  coreStatsByLevel: Record<number, EquipmentStats>
  forge: ArtifactForgeDefinition
  upgrades: ArtifactLevelUpgradeDefinition[]
  branches: ArtifactBranchDefinition[]
  nodes: ArtifactNodeDefinition[]
}

export const ARTIFACT_LEVEL_BANDS = [
  { maxLevel: 4, unlock: { type: 'always' } },
  { maxLevel: 7, unlock: { type: 'boss-kill', bossId: 'forest-heart' } },
  { maxLevel: 10, unlock: { type: 'boss-kill', bossId: 'corrupted-greatbear' } },
] as const satisfies readonly { maxLevel: number; unlock: RecipeUnlockCondition }[]

/** Act 1 Artifact gates carry progression forward instead of reusing Act 0 bosses. */
export const ACT1_ARTIFACT_LEVEL_BANDS = [
  { maxLevel: 4, unlock: { type: 'always' } },
  { maxLevel: 7, unlock: { type: 'boss-kill', bossId: 'crossroads-keeper' } },
  { maxLevel: 10, unlock: { type: 'boss-kill', bossId: 'meridian-splitter' } },
] as const satisfies readonly { maxLevel: number; unlock: RecipeUnlockCondition }[]

export const ACT1_ARTIFACT_IDS: readonly ArtifactId[] = [
  'galeshard-staff', 'reliquary-scepter', 'pyrebound-staff', 'rootheart-scepter',
  'convergence-robe', 'waystone-circlet',
]

export const getArtifactLevelBands = (id: ArtifactId) => ACT1_ARTIFACT_IDS.includes(id) ? ACT1_ARTIFACT_LEVEL_BANDS : ARTIFACT_LEVEL_BANDS

const upgrade = (fromLevel: number, ingredients: ArtifactLevelUpgradeDefinition['ingredients'], unlock?: RecipeUnlockCondition) => ({ fromLevel, toLevel: fromLevel + 1, ingredients, ...(unlock ? { unlock } : {}) })
const emberNodes: ArtifactNodeDefinition[] = [
  { id: 'arcane-kindling', artifactId: 'ember-staff', name: 'Arcane Kindling', type: 'minor', branch: 'shared', pointCost: 1, requiresLevel: 2, combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.05, originSourceKinds: ['spell'], damageTypes: ['fire'] }] } },
  { id: 'cinder-memory', artifactId: 'ember-staff', name: 'Cinder Memory', type: 'minor', branch: 'burning', pointCost: 1, requiresLevel: 3, prerequisites: ['arcane-kindling'], combat: { modifiers: [{ key: 'damage-over-time-percent', value: 0.1 }] } },
  { id: 'lingering-flame', artifactId: 'ember-staff', name: 'Lingering Flame', type: 'minor', branch: 'burning', pointCost: 1, requiresLevel: 4, prerequisites: ['cinder-memory'], combat: { modifiers: [{ key: 'status-duration-dealt-percent', value: 0.1 }] } },
  { id: 'heartfed-embers', artifactId: 'ember-staff', name: 'Heartfed Embers', type: 'major', branch: 'burning', pointCost: 1, requiresLevel: 4, prerequisites: ['lingering-flame'], requiresBossKill: 'forest-heart', combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.1, originSourceKinds: ['spell'], damageTypes: ['fire'], condition: { type: 'target-has-status', statusId: 'burning' } }] } },
  { id: 'charred-continuance', artifactId: 'ember-staff', name: 'Charred Continuance', type: 'minor', branch: 'burning', pointCost: 1, requiresLevel: 6, prerequisites: ['heartfed-embers'], combat: { modifiers: [{ key: 'damage-over-time-percent', value: 0.1 }] } },
  { id: 'corrupted-combustion', artifactId: 'ember-staff', name: 'Corrupted Combustion', type: 'major', branch: 'burning', pointCost: 1, requiresLevel: 7, prerequisites: ['charred-continuance'], requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [{ key: 'damage-over-time-percent', value: 0.15, originSourceKinds: ['spell'], damageTypes: ['fire'] }] } },
  { id: 'edrins-blackflame', artifactId: 'ember-staff', name: "Edrin's Blackflame", type: 'capstone', branch: 'burning', pointCost: 2, requiresLevel: 10, prerequisites: ['corrupted-combustion'], requiresBossKill: 'archmage-edrin-shade', combat: { modifiers: [{ key: 'damage-over-time-percent', value: 0.25, originSourceKinds: ['spell'], damageTypes: ['fire'] }] } },
  { id: 'focused-flame', artifactId: 'ember-staff', name: 'Focused Flame', type: 'minor', branch: 'direct-fire', pointCost: 1, requiresLevel: 3, prerequisites: ['arcane-kindling'], combat: { modifiers: [{ key: 'crit-chance', value: 0.03, originSourceKinds: ['spell'], damageTypes: ['fire'], sourceTags: ['direct'] }] } },
  { id: 'flame-precision', artifactId: 'ember-staff', name: 'Flame Precision', type: 'minor', branch: 'direct-fire', pointCost: 1, requiresLevel: 4, prerequisites: ['focused-flame'], combat: { modifiers: [{ key: 'crit-damage', value: 0.15, originSourceKinds: ['spell'], damageTypes: ['fire'], sourceTags: ['direct'] }] } },
  { id: 'heartfire-focus', artifactId: 'ember-staff', name: 'Heartfire Focus', type: 'major', branch: 'direct-fire', pointCost: 1, requiresLevel: 4, prerequisites: ['flame-precision'], requiresBossKill: 'forest-heart', combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.1, originSourceKinds: ['spell'], damageTypes: ['fire'], sourceTags: ['direct'], condition: { type: 'target-has-status', statusId: 'burning' } }] } },
  { id: 'blazing-tempo', artifactId: 'ember-staff', name: 'Blazing Tempo', type: 'minor', branch: 'direct-fire', pointCost: 1, requiresLevel: 6, prerequisites: ['heartfire-focus'], stats: { cooldownRecoveryPct: 0.1 } },
  { id: 'corrupted-burst', artifactId: 'ember-staff', name: 'Corrupted Burst', type: 'major', branch: 'direct-fire', pointCost: 1, requiresLevel: 7, prerequisites: ['blazing-tempo'], requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.15, originSourceKinds: ['spell'], damageTypes: ['fire'], sourceTags: ['direct'], condition: { type: 'target-has-status-tag', tag: 'debuff' } }] } },
  { id: 'edrins-inferno', artifactId: 'ember-staff', name: "Edrin's Inferno", type: 'capstone', branch: 'direct-fire', pointCost: 2, requiresLevel: 10, prerequisites: ['corrupted-burst'], requiresBossKill: 'archmage-edrin-shade', combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.25, originSourceKinds: ['spell'], damageTypes: ['fire'], sourceTags: ['direct'], condition: { type: 'target-has-status', statusId: 'burning' } }] } },
]

const emberStats: Record<number, EquipmentStats> = { 1: { spellPower: 16 }, 2: { spellPower: 20 }, 3: { spellPower: 24 }, 4: { spellPower: 29 }, 5: { spellPower: 35 }, 6: { spellPower: 41 }, 7: { spellPower: 48 }, 8: { spellPower: 56 }, 9: { spellPower: 65 }, 10: { spellPower: 75 } }

const material = (itemId: ItemId, quantity: number) => ({ itemId, quantity })

const ELEMENTAL_UPGRADE_COSTS = [
  [50, 10], [100, 20], [200, 40], [300, 60], [500, 100],
  [750, 150], [1000, 200], [1650, 300], [2750, 500],
] as const
const PRISMATIC_UPGRADE_COSTS = [
  [2, 10], [4, 20], [7, 40], [10, 60], [15, 100],
  [20, 150], [28, 200], [38, 300], [50, 500],
] as const
const upgradeUnlock = (artifactId: ArtifactId, fromLevel: number): RecipeUnlockCondition | undefined => {
  const bands = getArtifactLevelBands(artifactId)
  const band = bands.find((entry, index) => fromLevel + 1 <= entry.maxLevel && fromLevel + 1 > (bands[index - 1]?.maxLevel ?? 0))
  return band?.unlock.type === 'always' ? undefined : band?.unlock
}
const createUpgradeCurve = (artifactId: ArtifactId, fragment: ItemId, costs: readonly (readonly [number, number])[]) =>
  costs.map(([fragmentQuantity, essenceQuantity], index) =>
    upgrade(index + 1, [material(fragment, fragmentQuantity), material('artifact-essence', essenceQuantity)], upgradeUnlock(artifactId, index + 1)),
  )
const act1UpgradeCosts = [
  [40, 15], [70, 25], [120, 40], [180, 60], [260, 80],
  [360, 110], [500, 150], [700, 220], [1000, 300],
] as const
const emberUpgrades = createUpgradeCurve('ember-staff', 'fire-fragment', ELEMENTAL_UPGRADE_COSTS)
const tideglassUpgrades = createUpgradeCurve('tideglass-wand', 'water-fragment', ELEMENTAL_UPGRADE_COSTS)
const stoneheartUpgrades = createUpgradeCurve('stoneheart-scepter', 'earth-fragment', ELEMENTAL_UPGRADE_COSTS)
const windthreadUpgrades = createUpgradeCurve('windthread-wand', 'air-fragment', ELEMENTAL_UPGRADE_COSTS)
const wispweaveUpgrades = createUpgradeCurve('wispweave-robe', 'prismatic-fragment', PRISMATIC_UPGRADE_COSTS)
const wispveilUpgrades = createUpgradeCurve('wispveil-hood', 'prismatic-fragment', PRISMATIC_UPGRADE_COSTS)
const galeshardUpgrades = createUpgradeCurve('galeshard-staff', 'air-fragment', act1UpgradeCosts)

const tideglassStats: Record<number, EquipmentStats> = { 1: { spellPower: 15 }, 2: { spellPower: 19 }, 3: { spellPower: 23 }, 4: { spellPower: 28 }, 5: { spellPower: 34 }, 6: { spellPower: 40 }, 7: { spellPower: 47 }, 8: { spellPower: 55 }, 9: { spellPower: 63 }, 10: { spellPower: 72 } }
const stoneheartStats: Record<number, EquipmentStats> = { 1: { spellPower: 14 }, 2: { spellPower: 18 }, 3: { spellPower: 22 }, 4: { spellPower: 27 }, 5: { spellPower: 32 }, 6: { spellPower: 38 }, 7: { spellPower: 44 }, 8: { spellPower: 51 }, 9: { spellPower: 59 }, 10: { spellPower: 67 } }
const windthreadStats: Record<number, EquipmentStats> = { 1: { spellPower: 15 }, 2: { spellPower: 19 }, 3: { spellPower: 23 }, 4: { spellPower: 28 }, 5: { spellPower: 34 }, 6: { spellPower: 41 }, 7: { spellPower: 48 }, 8: { spellPower: 56 }, 9: { spellPower: 64 }, 10: { spellPower: 73 } }
const wispweaveStats: Record<number, EquipmentStats> = { 1: { maxHealth: 20, defense: 4 }, 2: { maxHealth: 24, defense: 5 }, 3: { maxHealth: 29, defense: 6 }, 4: { maxHealth: 35, defense: 7 }, 5: { maxHealth: 42, defense: 8 }, 6: { maxHealth: 50, defense: 10 }, 7: { maxHealth: 59, defense: 12 }, 8: { maxHealth: 69, defense: 14 }, 9: { maxHealth: 80, defense: 16 }, 10: { maxHealth: 92, defense: 19 } }
const wispveilStats: Record<number, EquipmentStats> = { 1: { maxHealth: 10, defense: 2 }, 2: { maxHealth: 12, defense: 3 }, 3: { maxHealth: 15, defense: 4 }, 4: { maxHealth: 18, defense: 5 }, 5: { maxHealth: 22, defense: 6 }, 6: { maxHealth: 26, defense: 7 }, 7: { maxHealth: 31, defense: 8 }, 8: { maxHealth: 36, defense: 10 }, 9: { maxHealth: 42, defense: 12 }, 10: { maxHealth: 49, defense: 14 } }
const galeshardStats: Record<number, EquipmentStats> = { 1: { spellPower: 90 }, 2: { spellPower: 93 }, 3: { spellPower: 96 }, 4: { spellPower: 99 }, 5: { spellPower: 102 }, 6: { spellPower: 106 }, 7: { spellPower: 109 }, 8: { spellPower: 112 }, 9: { spellPower: 115 }, 10: { spellPower: 118 } }

const spellDamage = (value: number, school: 'water' | 'earth' | 'air', sourceTags?: CombatModifier['sourceTags']): CombatModifier => ({ key: 'spell-damage-percent', value, originSourceKinds: ['spell'], damageTypes: [school], ...(sourceTags ? { sourceTags } : {}) })
const directSpellDamage = (value: number, school: 'water' | 'earth' | 'air', condition?: CombatModifier['condition']): CombatModifier => ({ ...spellDamage(value, school, ['direct']), ...(condition ? { condition } : {}) })
const barrierPower = (value: number, school: 'water' | 'earth' | 'air') => ({ key: 'barrier-power-percent' as const, value, originSourceKinds: ['spell' as const], damageTypes: [school] })
const bossRule = (id: string, condition: NonNullable<CombatTriggerRule['condition']>, value: number, cooldownMs?: number): CombatTriggerRule => ({ id, event: 'on-hp-threshold', condition, oncePerEncounter: true, ...(cooldownMs ? { cooldownMs } : {}), effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value } }] })

const galeshardNodes: ArtifactNodeDefinition[] = [
  { id: 'fractured-current', artifactId: 'galeshard-staff', name: 'Fractured Current', type: 'minor', branch: 'shared', pointCost: 1, requiresLevel: 2, combat: { modifiers: [spellDamage(0.05, 'air')] } },
  { id: 'swift-gale', artifactId: 'galeshard-staff', name: 'Swift Gale', type: 'minor', branch: 'gale-tempo', pointCost: 1, requiresLevel: 3, prerequisites: ['fractured-current'], combat: { modifiers: [{ key: 'cooldown-recovery-percent', value: 0.05 }] } },
  { id: 'wind-reserve', artifactId: 'galeshard-staff', name: 'Wind Reserve', type: 'minor', branch: 'gale-tempo', pointCost: 1, requiresLevel: 4, prerequisites: ['swift-gale'], stats: { maxMana: 10 } },
  { id: 'gatekeeper-current', artifactId: 'galeshard-staff', name: 'Crossroads Current', type: 'major', branch: 'gale-tempo', pointCost: 1, requiresLevel: 4, prerequisites: ['wind-reserve'], requiresBossKill: 'crossroads-keeper', combat: { modifiers: [spellDamage(0.1, 'air')] } },
  { id: 'airborne-tempo', artifactId: 'galeshard-staff', name: 'Airborne Tempo', type: 'minor', branch: 'gale-tempo', pointCost: 1, requiresLevel: 6, prerequisites: ['gatekeeper-current'], combat: { modifiers: [{ key: 'cooldown-recovery-percent', value: 0.05 }] } },
  { id: 'fractured-velocity', artifactId: 'galeshard-staff', name: 'Fractured Velocity', type: 'major', branch: 'gale-tempo', pointCost: 1, requiresLevel: 7, prerequisites: ['airborne-tempo'], requiresBossKill: 'meridian-splitter', combat: { modifiers: [directSpellDamage(0.15, 'air')] } },
  { id: 'eye-of-the-gale', artifactId: 'galeshard-staff', name: 'Eye of the Gale', type: 'capstone', branch: 'gale-tempo', pointCost: 2, requiresLevel: 10, prerequisites: ['fractured-velocity'], requiresBossKill: 'meridian-splitter', combat: { modifiers: [spellDamage(0.2, 'air')] } },
  { id: 'razorwind', artifactId: 'galeshard-staff', name: 'Razorwind', type: 'minor', branch: 'storm-precision', pointCost: 1, requiresLevel: 3, prerequisites: ['fractured-current'], combat: { modifiers: [{ key: 'crit-chance', value: 0.03, originSourceKinds: ['spell'], damageTypes: ['air'], sourceTags: ['direct'] }] } },
  { id: 'storm-edge', artifactId: 'galeshard-staff', name: 'Storm Edge', type: 'minor', branch: 'storm-precision', pointCost: 1, requiresLevel: 4, prerequisites: ['razorwind'], combat: { modifiers: [{ key: 'crit-damage', value: 0.15, originSourceKinds: ['spell'], damageTypes: ['air'], sourceTags: ['direct'] }] } },
  { id: 'fractured-eye', artifactId: 'galeshard-staff', name: 'Fractured Eye', type: 'major', branch: 'storm-precision', pointCost: 1, requiresLevel: 4, prerequisites: ['storm-edge'], requiresBossKill: 'crossroads-keeper', combat: { modifiers: [directSpellDamage(0.1, 'air')] } },
  { id: 'swift-edge', artifactId: 'galeshard-staff', name: 'Swift Edge', type: 'minor', branch: 'storm-precision', pointCost: 1, requiresLevel: 6, prerequisites: ['fractured-eye'], combat: { modifiers: [{ key: 'crit-chance', value: 0.03, originSourceKinds: ['spell'], damageTypes: ['air'], sourceTags: ['direct'] }] } },
  { id: 'gatekeeper-focus', artifactId: 'galeshard-staff', name: 'Meridian Focus', type: 'major', branch: 'storm-precision', pointCost: 1, requiresLevel: 7, prerequisites: ['swift-edge'], requiresBossKill: 'meridian-splitter', combat: { modifiers: [{ key: 'cooldown-recovery-percent', value: 0.1 }] } },
  { id: 'stormbreak', artifactId: 'galeshard-staff', name: 'Stormbreak', type: 'capstone', branch: 'storm-precision', pointCost: 2, requiresLevel: 10, prerequisites: ['gatekeeper-focus'], requiresBossKill: 'meridian-splitter', combat: { modifiers: [directSpellDamage(0.2, 'air')] } },
]

const tideglassNodes: ArtifactNodeDefinition[] = [
  { id: 'flowing-conduit', artifactId: 'tideglass-wand', name: 'Flowing Conduit', type: 'minor', branch: 'shared', pointCost: 1, requiresLevel: 2, combat: { modifiers: [spellDamage(0.05, 'water')] } },
  { id: 'protective-current', artifactId: 'tideglass-wand', name: 'Protective Current', type: 'minor', branch: 'tidal-ward', pointCost: 1, requiresLevel: 3, prerequisites: ['flowing-conduit'], combat: { modifiers: [barrierPower(0.1, 'water')] } },
  { id: 'lingering-tide', artifactId: 'tideglass-wand', name: 'Lingering Tide', type: 'minor', branch: 'tidal-ward', pointCost: 1, requiresLevel: 4, prerequisites: ['protective-current'], combat: { modifiers: [{ key: 'status-duration-dealt-percent', value: 0.1, originSourceKinds: ['spell'], damageTypes: ['water'] }] } },
  { id: 'heartwater-shell', artifactId: 'tideglass-wand', name: 'Heartwater Shell', type: 'major', branch: 'tidal-ward', pointCost: 1, requiresLevel: 4, prerequisites: ['lingering-tide'], requiresBossKill: 'forest-heart', combat: { modifiers: [barrierPower(0.1, 'water')] } },
  { id: 'deep-reservoir', artifactId: 'tideglass-wand', name: 'Deep Reservoir', type: 'minor', branch: 'tidal-ward', pointCost: 1, requiresLevel: 6, prerequisites: ['heartwater-shell'], stats: { maxMana: 10 } },
  { id: 'greatbear-tidewall', artifactId: 'tideglass-wand', name: 'Greatbear Tidewall', type: 'major', branch: 'tidal-ward', pointCost: 1, requiresLevel: 7, prerequisites: ['deep-reservoir'], requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [barrierPower(0.15, 'water')] } },
  { id: 'edrins-abyssal-aegis', artifactId: 'tideglass-wand', name: "Edrin's Abyssal Aegis", type: 'capstone', branch: 'tidal-ward', pointCost: 2, requiresLevel: 10, prerequisites: ['greatbear-tidewall'], requiresBossKill: 'archmage-edrin-shade', combat: { modifiers: [barrierPower(0.25, 'water')] } },
  { id: 'cold-precision', artifactId: 'tideglass-wand', name: 'Cold Precision', type: 'minor', branch: 'frozen-current', pointCost: 1, requiresLevel: 3, prerequisites: ['flowing-conduit'], combat: { modifiers: [{ key: 'crit-chance', value: 0.03, originSourceKinds: ['spell'], damageTypes: ['water'], sourceTags: ['direct'] }] } },
  { id: 'deep-chill', artifactId: 'tideglass-wand', name: 'Deep Chill', type: 'minor', branch: 'frozen-current', pointCost: 1, requiresLevel: 4, prerequisites: ['cold-precision'], combat: { modifiers: [{ key: 'status-duration-dealt-percent', value: 0.1, originSourceKinds: ['spell'], damageTypes: ['water'] }] } },
  { id: 'heartfrost', artifactId: 'tideglass-wand', name: 'Heartfrost', type: 'major', branch: 'frozen-current', pointCost: 1, requiresLevel: 4, prerequisites: ['deep-chill'], requiresBossKill: 'forest-heart', combat: { modifiers: [directSpellDamage(0.1, 'water', { type: 'target-has-status', statusId: 'chilled' })] } },
  { id: 'accelerated-current', artifactId: 'tideglass-wand', name: 'Accelerated Current', type: 'minor', branch: 'frozen-current', pointCost: 1, requiresLevel: 6, prerequisites: ['heartfrost'], combat: { modifiers: [{ key: 'cooldown-recovery-percent', value: 0.1 }] } },
  { id: 'corrupted-undertow', artifactId: 'tideglass-wand', name: 'Corrupted Undertow', type: 'major', branch: 'frozen-current', pointCost: 1, requiresLevel: 7, prerequisites: ['accelerated-current'], requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [directSpellDamage(0.15, 'water', { type: 'target-has-status-tag', tag: 'debuff' })] } },
  { id: 'edrins-frozen-depth', artifactId: 'tideglass-wand', name: "Edrin's Frozen Depth", type: 'capstone', branch: 'frozen-current', pointCost: 2, requiresLevel: 10, prerequisites: ['corrupted-undertow'], requiresBossKill: 'archmage-edrin-shade', combat: { modifiers: [directSpellDamage(0.25, 'water', { type: 'target-has-status', statusId: 'chilled' })] } },
]

const stoneheartNodes: ArtifactNodeDefinition[] = [
  { id: 'stone-channel', artifactId: 'stoneheart-scepter', name: 'Stone Channel', type: 'minor', branch: 'shared', pointCost: 1, requiresLevel: 2, combat: { modifiers: [spellDamage(0.05, 'earth')] } },
  { id: 'stone-skin', artifactId: 'stoneheart-scepter', name: 'Stone Skin', type: 'minor', branch: 'living-bastion', pointCost: 1, requiresLevel: 3, prerequisites: ['stone-channel'], stats: { defense: 5 } },
  { id: 'earthen-reserve', artifactId: 'stoneheart-scepter', name: 'Earthen Reserve', type: 'minor', branch: 'living-bastion', pointCost: 1, requiresLevel: 4, prerequisites: ['stone-skin'], stats: { maxHealth: 10 } },
  { id: 'heartroot-bulwark', artifactId: 'stoneheart-scepter', name: 'Heartroot Bulwark', type: 'major', branch: 'living-bastion', pointCost: 1, requiresLevel: 4, prerequisites: ['earthen-reserve'], requiresBossKill: 'forest-heart', combat: { modifiers: [{ key: 'defense-flat', value: 5, condition: { type: 'self-has-barrier' } }] } },
  { id: 'regrowing-stone', artifactId: 'stoneheart-scepter', name: 'Regrowing Stone', type: 'minor', branch: 'living-bastion', pointCost: 1, requiresLevel: 6, prerequisites: ['heartroot-bulwark'], stats: { healthRegen: 1 } },
  { id: 'greatbear-foundation', artifactId: 'stoneheart-scepter', name: 'Greatbear Foundation', type: 'major', branch: 'living-bastion', pointCost: 1, requiresLevel: 7, prerequisites: ['regrowing-stone'], requiresBossKill: 'corrupted-greatbear', stats: { resistances: { physical: 0.1 } } },
  { id: 'edrins-immortal-earth', artifactId: 'stoneheart-scepter', name: "Edrin's Immortal Earth", type: 'capstone', branch: 'living-bastion', pointCost: 2, requiresLevel: 10, prerequisites: ['greatbear-foundation'], requiresBossKill: 'archmage-edrin-shade', combat: { rules: [bossRule('immortal-earth', { type: 'self-hp-below-percent', percent: 35 }, 60)] } },
  { id: 'heavy-channel', artifactId: 'stoneheart-scepter', name: 'Heavy Channel', type: 'minor', branch: 'crushing-earth', pointCost: 1, requiresLevel: 3, prerequisites: ['stone-channel'], combat: { modifiers: [spellDamage(0.05, 'earth')] } },
  { id: 'fracture-point', artifactId: 'stoneheart-scepter', name: 'Fracture Point', type: 'minor', branch: 'crushing-earth', pointCost: 1, requiresLevel: 4, prerequisites: ['heavy-channel'], combat: { modifiers: [{ key: 'crit-chance', value: 0.03, originSourceKinds: ['spell'], damageTypes: ['earth'], sourceTags: ['direct'] }] } },
  { id: 'heartstone-impact', artifactId: 'stoneheart-scepter', name: 'Heartstone Impact', type: 'major', branch: 'crushing-earth', pointCost: 1, requiresLevel: 4, prerequisites: ['fracture-point'], requiresBossKill: 'forest-heart', combat: { modifiers: [directSpellDamage(0.1, 'earth', { type: 'target-has-status-tag', tag: 'debuff' })] } },
  { id: 'crushing-momentum', artifactId: 'stoneheart-scepter', name: 'Crushing Momentum', type: 'minor', branch: 'crushing-earth', pointCost: 1, requiresLevel: 6, prerequisites: ['heartstone-impact'], combat: { modifiers: [{ key: 'crit-damage', value: 0.15, originSourceKinds: ['spell'], damageTypes: ['earth'], sourceTags: ['direct'] }] } },
  { id: 'corrupted-fault', artifactId: 'stoneheart-scepter', name: 'Corrupted Fault', type: 'major', branch: 'crushing-earth', pointCost: 1, requiresLevel: 7, prerequisites: ['crushing-momentum'], requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [directSpellDamage(0.15, 'earth', { type: 'target-has-status-tag', tag: 'control' })] } },
  { id: 'edrins-world-break', artifactId: 'stoneheart-scepter', name: "Edrin's World Break", type: 'capstone', branch: 'crushing-earth', pointCost: 2, requiresLevel: 10, prerequisites: ['corrupted-fault'], requiresBossKill: 'archmage-edrin-shade', combat: { modifiers: [directSpellDamage(0.25, 'earth', { type: 'target-has-status-tag', tag: 'debuff' })] } },
]

const windthreadNodes: ArtifactNodeDefinition[] = [
  { id: 'wind-channel', artifactId: 'windthread-wand', name: 'Wind Channel', type: 'minor', branch: 'shared', pointCost: 1, requiresLevel: 2, combat: { modifiers: [spellDamage(0.05, 'air')] } },
  { id: 'quickened-thought', artifactId: 'windthread-wand', name: 'Quickened Thought', type: 'minor', branch: 'tempest-tempo', pointCost: 1, requiresLevel: 3, prerequisites: ['wind-channel'], combat: { modifiers: [{ key: 'cooldown-recovery-percent', value: 0.05 }] } },
  { id: 'efficient-current', artifactId: 'windthread-wand', name: 'Efficient Current', type: 'minor', branch: 'tempest-tempo', pointCost: 1, requiresLevel: 4, prerequisites: ['quickened-thought'], stats: { manaCostReductionPct: 0.05 } },
  { id: 'heartwind-rhythm', artifactId: 'windthread-wand', name: 'Heartwind Rhythm', type: 'major', branch: 'tempest-tempo', pointCost: 1, requiresLevel: 4, prerequisites: ['efficient-current'], requiresBossKill: 'forest-heart', combat: { modifiers: [{ key: 'cooldown-recovery-percent', value: 0.05 }] } },
  { id: 'sustained-flow', artifactId: 'windthread-wand', name: 'Sustained Flow', type: 'minor', branch: 'tempest-tempo', pointCost: 1, requiresLevel: 6, prerequisites: ['heartwind-rhythm'], stats: { manaRegen: 2 } },
  { id: 'greatbear-stormheart', artifactId: 'windthread-wand', name: 'Greatbear Stormheart', type: 'major', branch: 'tempest-tempo', pointCost: 1, requiresLevel: 7, prerequisites: ['sustained-flow'], requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [{ ...spellDamage(0.15, 'air'), condition: { type: 'self-mana-above-percent', percent: 50 } }] } },
  { id: 'edrins-endless-tempest', artifactId: 'windthread-wand', name: "Edrin's Endless Tempest", type: 'capstone', branch: 'tempest-tempo', pointCost: 2, requiresLevel: 10, prerequisites: ['greatbear-stormheart'], requiresBossKill: 'archmage-edrin-shade', combat: { modifiers: [{ ...spellDamage(0.25, 'air'), condition: { type: 'self-mana-above-percent', percent: 50 } }] } },
  { id: 'charged-aim', artifactId: 'windthread-wand', name: 'Charged Aim', type: 'minor', branch: 'storm-precision', pointCost: 1, requiresLevel: 3, prerequisites: ['wind-channel'], combat: { modifiers: [{ key: 'crit-chance', value: 0.03, originSourceKinds: ['spell'], damageTypes: ['air'], sourceTags: ['direct'] }] } },
  { id: 'storm-edge', artifactId: 'windthread-wand', name: 'Storm Edge', type: 'minor', branch: 'storm-precision', pointCost: 1, requiresLevel: 4, prerequisites: ['charged-aim'], combat: { modifiers: [{ key: 'crit-damage', value: 0.15, originSourceKinds: ['spell'], damageTypes: ['air'], sourceTags: ['direct'] }] } },
  { id: 'heartstorm', artifactId: 'windthread-wand', name: 'Heartstorm', type: 'major', branch: 'storm-precision', pointCost: 1, requiresLevel: 4, prerequisites: ['storm-edge'], requiresBossKill: 'forest-heart', combat: { modifiers: [directSpellDamage(0.1, 'air', { type: 'target-has-status-tag', tag: 'debuff' })] } },
  { id: 'pressure-spike', artifactId: 'windthread-wand', name: 'Pressure Spike', type: 'minor', branch: 'storm-precision', pointCost: 1, requiresLevel: 6, prerequisites: ['heartstorm'], combat: { modifiers: [spellDamage(0.05, 'air')] } },
  { id: 'corrupted-lightning', artifactId: 'windthread-wand', name: 'Corrupted Lightning', type: 'major', branch: 'storm-precision', pointCost: 1, requiresLevel: 7, prerequisites: ['pressure-spike'], requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [directSpellDamage(0.15, 'air', { type: 'target-has-status-tag', tag: 'debuff' })] } },
  { id: 'edrins-sky-rend', artifactId: 'windthread-wand', name: "Edrin's Sky Rend", type: 'capstone', branch: 'storm-precision', pointCost: 2, requiresLevel: 10, prerequisites: ['corrupted-lightning'], requiresBossKill: 'archmage-edrin-shade', combat: { modifiers: [directSpellDamage(0.25, 'air', { type: 'target-has-status-tag', tag: 'debuff' })] } },
]

const wispweaveNodes: ArtifactNodeDefinition[] = [
  { id: 'reinforced-weave', artifactId: 'wispweave-robe', name: 'Reinforced Weave', type: 'minor', branch: 'shared', pointCost: 1, requiresLevel: 2, stats: { maxHealth: 5 } },
  { id: 'hardened-thread', artifactId: 'wispweave-robe', name: 'Hardened Thread', type: 'minor', branch: 'living-bastion', pointCost: 1, requiresLevel: 3, prerequisites: ['reinforced-weave'], stats: { defense: 4 } },
  { id: 'vital-weave', artifactId: 'wispweave-robe', name: 'Vital Weave', type: 'minor', branch: 'living-bastion', pointCost: 1, requiresLevel: 4, prerequisites: ['hardened-thread'], stats: { maxHealth: 10 } },
  { id: 'heartseed-lining', artifactId: 'wispweave-robe', name: 'Heartseed Lining', type: 'major', branch: 'living-bastion', pointCost: 1, requiresLevel: 4, prerequisites: ['vital-weave'], requiresBossKill: 'forest-heart', stats: { healthRegen: 1 } },
  { id: 'stonebound-cloth', artifactId: 'wispweave-robe', name: 'Stonebound Cloth', type: 'minor', branch: 'living-bastion', pointCost: 1, requiresLevel: 6, prerequisites: ['heartseed-lining'], stats: { resistances: { physical: 0.05 } } },
  { id: 'greatbear-weave', artifactId: 'wispweave-robe', name: 'Greatbear Weave', type: 'major', branch: 'living-bastion', pointCost: 1, requiresLevel: 7, prerequisites: ['stonebound-cloth'], requiresBossKill: 'corrupted-greatbear', stats: { defense: 10 } },
  { id: 'edrins-deathless-weave', artifactId: 'wispweave-robe', name: "Edrin's Deathless Weave", type: 'capstone', branch: 'living-bastion', pointCost: 2, requiresLevel: 10, prerequisites: ['greatbear-weave'], requiresBossKill: 'archmage-edrin-shade', combat: { rules: [bossRule('deathless-weave', { type: 'self-hp-below-percent', percent: 35 }, 75)] } },
  { id: 'mana-thread', artifactId: 'wispweave-robe', name: 'Mana Thread', type: 'minor', branch: 'arcane-weave', pointCost: 1, requiresLevel: 3, prerequisites: ['reinforced-weave'], stats: { maxMana: 10 } },
  { id: 'ward-stitching', artifactId: 'wispweave-robe', name: 'Ward Stitching', type: 'minor', branch: 'arcane-weave', pointCost: 1, requiresLevel: 4, prerequisites: ['mana-thread'], combat: { modifiers: [{ key: 'barrier-power-percent', value: 0.1 }] } },
  { id: 'heartseed-channel', artifactId: 'wispweave-robe', name: 'Heartseed Channel', type: 'major', branch: 'arcane-weave', pointCost: 1, requiresLevel: 4, prerequisites: ['ward-stitching'], requiresBossKill: 'forest-heart', combat: { modifiers: [{ key: 'barrier-received-flat', value: 10 }] } },
  { id: 'restorative-weave', artifactId: 'wispweave-robe', name: 'Restorative Weave', type: 'minor', branch: 'arcane-weave', pointCost: 1, requiresLevel: 6, prerequisites: ['heartseed-channel'], combat: { modifiers: [{ key: 'healing-done-percent', value: 0.05 }] } },
  { id: 'greatbear-arcana', artifactId: 'wispweave-robe', name: 'Greatbear Arcana', type: 'major', branch: 'arcane-weave', pointCost: 1, requiresLevel: 7, prerequisites: ['restorative-weave'], requiresBossKill: 'corrupted-greatbear', stats: { resistances: { fire: 0.1, water: 0.1, earth: 0.1, air: 0.1 } } },
  { id: 'edrins-soulweave', artifactId: 'wispweave-robe', name: "Edrin's Soulweave", type: 'capstone', branch: 'arcane-weave', pointCost: 2, requiresLevel: 10, prerequisites: ['greatbear-arcana'], requiresBossKill: 'archmage-edrin-shade', combat: { rules: [{ id: 'soulweave', event: 'on-barrier-broken', cooldownMs: 30_000, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 40 } }] }] } },
]

const wispveilNodes: ArtifactNodeDefinition[] = [
  { id: 'arcane-sight', artifactId: 'wispveil-hood', name: 'Arcane Sight', type: 'minor', branch: 'shared', pointCost: 1, requiresLevel: 2, stats: { maxMana: 5 } },
  { id: 'deep-focus', artifactId: 'wispveil-hood', name: 'Deep Focus', type: 'minor', branch: 'arcane-insight', pointCost: 1, requiresLevel: 3, prerequisites: ['arcane-sight'], stats: { maxMana: 10 } },
  { id: 'lingering-thought', artifactId: 'wispveil-hood', name: 'Lingering Thought', type: 'minor', branch: 'arcane-insight', pointCost: 1, requiresLevel: 4, prerequisites: ['deep-focus'], combat: { modifiers: [{ key: 'status-duration-dealt-percent', value: 0.1 }] } },
  { id: 'heartmind', artifactId: 'wispveil-hood', name: 'Heartmind', type: 'major', branch: 'arcane-insight', pointCost: 1, requiresLevel: 4, prerequisites: ['lingering-thought'], requiresBossKill: 'forest-heart', stats: { manaRegen: 1 } },
  { id: 'rapid-thought', artifactId: 'wispveil-hood', name: 'Rapid Thought', type: 'minor', branch: 'arcane-insight', pointCost: 1, requiresLevel: 6, prerequisites: ['heartmind'], combat: { modifiers: [{ key: 'cooldown-recovery-percent', value: 0.05 }] } },
  { id: 'greatbear-clarity', artifactId: 'wispveil-hood', name: 'Greatbear Clarity', type: 'major', branch: 'arcane-insight', pointCost: 1, requiresLevel: 7, prerequisites: ['rapid-thought'], requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [{ key: 'status-duration-received-percent', value: -0.1, statusTags: ['debuff'] }] } },
  { id: 'edrins-forbidden-insight', artifactId: 'wispveil-hood', name: "Edrin's Forbidden Insight", type: 'capstone', branch: 'arcane-insight', pointCost: 2, requiresLevel: 10, prerequisites: ['greatbear-clarity'], requiresBossKill: 'archmage-edrin-shade', stats: { cooldownRecoveryPct: 0.1, statusDurationPct: 0.1 } },
  { id: 'keen-sight', artifactId: 'wispveil-hood', name: 'Keen Sight', type: 'minor', branch: 'arcane-precision', pointCost: 1, requiresLevel: 3, prerequisites: ['arcane-sight'], stats: { critChance: 0.02 } },
  { id: 'spell-edge', artifactId: 'wispveil-hood', name: 'Spell Edge', type: 'minor', branch: 'arcane-precision', pointCost: 1, requiresLevel: 4, prerequisites: ['keen-sight'], stats: { critDamage: 0.1 } },
  { id: 'heartseeker', artifactId: 'wispveil-hood', name: 'Heartseeker', type: 'major', branch: 'arcane-precision', pointCost: 1, requiresLevel: 4, prerequisites: ['spell-edge'], requiresBossKill: 'forest-heart', stats: { spellPower: 5 } },
  { id: 'accelerated-casting', artifactId: 'wispveil-hood', name: 'Accelerated Casting', type: 'minor', branch: 'arcane-precision', pointCost: 1, requiresLevel: 6, prerequisites: ['heartseeker'], combat: { modifiers: [{ key: 'cooldown-recovery-percent', value: 0.05 }] } },
  { id: 'greatbear-focus', artifactId: 'wispveil-hood', name: 'Greatbear Focus', type: 'major', branch: 'arcane-precision', pointCost: 1, requiresLevel: 7, prerequisites: ['accelerated-casting'], requiresBossKill: 'corrupted-greatbear', stats: { critChance: 0.03 } },
  { id: 'edrins-perfect-moment', artifactId: 'wispveil-hood', name: "Edrin's Perfect Moment", type: 'capstone', branch: 'arcane-precision', pointCost: 2, requiresLevel: 10, prerequisites: ['greatbear-focus'], requiresBossKill: 'archmage-edrin-shade', stats: { critChance: 0.05, critDamage: 0.15 } },
]
const reliquaryStats: Record<number, EquipmentStats> = { 1: { spellPower: 90 }, 2: { spellPower: 93 }, 3: { spellPower: 96 }, 4: { spellPower: 99 }, 5: { spellPower: 102 }, 6: { spellPower: 106 }, 7: { spellPower: 109 }, 8: { spellPower: 112 }, 9: { spellPower: 115 }, 10: { spellPower: 117 } }
const pyreboundStats: Record<number, EquipmentStats> = { 1: { spellPower: 94 }, 2: { spellPower: 97 }, 3: { spellPower: 100 }, 4: { spellPower: 103 }, 5: { spellPower: 106 }, 6: { spellPower: 110 }, 7: { spellPower: 113 }, 8: { spellPower: 116 }, 9: { spellPower: 119 }, 10: { spellPower: 122 } }
const rootheartStats: Record<number, EquipmentStats> = { 1: { spellPower: 84 }, 2: { spellPower: 87 }, 3: { spellPower: 89 }, 4: { spellPower: 92 }, 5: { spellPower: 95 }, 6: { spellPower: 98 }, 7: { spellPower: 101 }, 8: { spellPower: 104 }, 9: { spellPower: 107 }, 10: { spellPower: 109 } }

const createAct1WeaponArtifact = (id: ArtifactId, name: string, fragment: ItemId, tier: number, coreStatsByLevel: Record<number, EquipmentStats>): ArtifactDefinition => {
  const nodes: ArtifactNodeDefinition[] = [
    { id: `${id}-conduit`, artifactId: id, name: 'Resonant Conduit', type: 'minor', branch: 'resonance', pointCost: 1, requiresLevel: 2, stats: { spellPower: 5 } },
    { id: `${id}-tempo`, artifactId: id, name: 'Measured Current', type: 'minor', branch: 'resonance', pointCost: 1, requiresLevel: 3, prerequisites: [`${id}-conduit`], combat: { modifiers: [{ key: 'cooldown-recovery-percent', value: 0.05 }] } },
    { id: `${id}-reserve`, artifactId: id, name: 'Deep Reserve', type: 'minor', branch: 'resonance', pointCost: 1, requiresLevel: 4, prerequisites: [`${id}-tempo`], stats: { maxMana: 10 } },
    { id: `${id}-awakening`, artifactId: id, name: 'Dungeon Awakening', type: 'major', branch: 'resonance', pointCost: 1, requiresLevel: 4, prerequisites: [`${id}-reserve`], requiresBossKill: 'crossroads-keeper', stats: { spellPower: 8 } },
    { id: `${id}-focus`, artifactId: id, name: 'Focused Current', type: 'minor', branch: 'resonance', pointCost: 1, requiresLevel: 6, prerequisites: [`${id}-awakening`], combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.05 }] } },
    { id: `${id}-mastery`, artifactId: id, name: 'Mastery', type: 'major', branch: 'resonance', pointCost: 1, requiresLevel: 7, prerequisites: [`${id}-focus`], requiresBossKill: 'meridian-splitter', stats: { spellPower: 10 } },
    { id: `${id}-capstone`, artifactId: id, name: 'Perfect Resonance', type: 'capstone', branch: 'resonance', pointCost: 2, requiresLevel: 10, prerequisites: [`${id}-mastery`], requiresBossKill: 'meridian-splitter', stats: { spellPower: 15 } },
  ]
  return { id, itemId: id, tier, maxLevel: 10, coreStatsByLevel, forge: { ingredients: [material(fragment, 40), material('artifact-essence', 80)] }, upgrades: createUpgradeCurve(id, fragment, act1UpgradeCosts), branches: [{ id: 'resonance', name: 'Resonance', description: `${name} mastery.` }], nodes }
}
const convergenceRobeStats: Record<number, EquipmentStats> = {
  1: { maxHealth: 115, defense: 23 }, 2: { maxHealth: 119, defense: 23 }, 3: { maxHealth: 123, defense: 24 },
  4: { maxHealth: 127, defense: 24 }, 5: { maxHealth: 131, defense: 25 }, 6: { maxHealth: 135, defense: 25 },
  7: { maxHealth: 138, defense: 26 }, 8: { maxHealth: 141, defense: 26 }, 9: { maxHealth: 143, defense: 27 }, 10: { maxHealth: 145, defense: 27 },
}
const waystoneCircletStats: Record<number, EquipmentStats> = {
  1: { maxHealth: 61, defense: 17 }, 2: { maxHealth: 63, defense: 17 }, 3: { maxHealth: 65, defense: 17 },
  4: { maxHealth: 67, defense: 18 }, 5: { maxHealth: 69, defense: 18 }, 6: { maxHealth: 71, defense: 18 },
  7: { maxHealth: 73, defense: 19 }, 8: { maxHealth: 75, defense: 19 }, 9: { maxHealth: 77, defense: 20 }, 10: { maxHealth: 80, defense: 20 },
}
const convergenceRobeUpgrades = createUpgradeCurve('convergence-robe', 'prismatic-fragment', PRISMATIC_UPGRADE_COSTS)
const waystoneCircletUpgrades = createUpgradeCurve('waystone-circlet', 'prismatic-fragment', PRISMATIC_UPGRADE_COSTS)
const convergenceRobeNodes: ArtifactNodeDefinition[] = [
  { id: 'convergence-thread', artifactId: 'convergence-robe', name: 'Convergence Thread', type: 'minor', branch: 'shared', pointCost: 1, requiresLevel: 2, stats: { maxHealth: 12 } },
  { id: 'crossroads-ward', artifactId: 'convergence-robe', name: 'Crossroads Ward', type: 'minor', branch: 'crossroads-ward', pointCost: 1, requiresLevel: 3, prerequisites: ['convergence-thread'], stats: { defense: 2 } },
  { id: 'woven-reserve', artifactId: 'convergence-robe', name: 'Woven Reserve', type: 'minor', branch: 'crossroads-ward', pointCost: 1, requiresLevel: 4, prerequisites: ['crossroads-ward'], stats: { maxMana: 10 } },
  { id: 'keeper-shelter', artifactId: 'convergence-robe', name: 'Keeper Shelter', type: 'major', branch: 'crossroads-ward', pointCost: 1, requiresLevel: 4, prerequisites: ['woven-reserve'], requiresBossKill: 'crossroads-keeper', stats: { maxHealth: 20, defense: 2 } },
  { id: 'steady-loom', artifactId: 'convergence-robe', name: 'Steady Loom', type: 'minor', branch: 'crossroads-ward', pointCost: 1, requiresLevel: 6, prerequisites: ['keeper-shelter'], stats: { healthRegen: 1 } },
  { id: 'meridian-weave', artifactId: 'convergence-robe', name: 'Meridian Weave', type: 'major', branch: 'crossroads-ward', pointCost: 1, requiresLevel: 7, prerequisites: ['steady-loom'], requiresBossKill: 'meridian-splitter', stats: { defense: 3, maxHealth: 20 } },
  { id: 'unbroken-convergence', artifactId: 'convergence-robe', name: 'Unbroken Convergence', type: 'capstone', branch: 'crossroads-ward', pointCost: 2, requiresLevel: 10, prerequisites: ['meridian-weave'], requiresBossKill: 'meridian-splitter', stats: { maxHealth: 35, defense: 4 } },
  { id: 'arcane-lining', artifactId: 'convergence-robe', name: 'Arcane Lining', type: 'minor', branch: 'arcane-lining', pointCost: 1, requiresLevel: 3, prerequisites: ['convergence-thread'], stats: { maxMana: 8 } },
  { id: 'prismatic-stitch', artifactId: 'convergence-robe', name: 'Prismatic Stitch', type: 'minor', branch: 'arcane-lining', pointCost: 1, requiresLevel: 4, prerequisites: ['arcane-lining'], stats: { spellPower: 5 } },
  { id: 'keeper-attunement', artifactId: 'convergence-robe', name: 'Keeper Attunement', type: 'major', branch: 'arcane-lining', pointCost: 1, requiresLevel: 4, prerequisites: ['prismatic-stitch'], requiresBossKill: 'crossroads-keeper', stats: { maxMana: 12 } },
  { id: 'focused-weave', artifactId: 'convergence-robe', name: 'Focused Weave', type: 'minor', branch: 'arcane-lining', pointCost: 1, requiresLevel: 6, prerequisites: ['keeper-attunement'], stats: { spellPower: 7 } },
  { id: 'meridian-focus', artifactId: 'convergence-robe', name: 'Meridian Focus', type: 'major', branch: 'arcane-lining', pointCost: 1, requiresLevel: 7, prerequisites: ['focused-weave'], requiresBossKill: 'meridian-splitter', stats: { maxMana: 15 } },
  { id: 'convergent-aegis', artifactId: 'convergence-robe', name: 'Convergent Aegis', type: 'capstone', branch: 'arcane-lining', pointCost: 2, requiresLevel: 10, prerequisites: ['meridian-focus'], requiresBossKill: 'meridian-splitter', stats: { spellPower: 12, maxMana: 20 } },
]
const waystoneCircletNodes: ArtifactNodeDefinition[] = [
  { id: 'anchored-thought', artifactId: 'waystone-circlet', name: 'Anchored Thought', type: 'minor', branch: 'shared', pointCost: 1, requiresLevel: 2, stats: { maxMana: 8 } },
  { id: 'waystone-clarity', artifactId: 'waystone-circlet', name: 'Waystone Clarity', type: 'minor', branch: 'waystone-clarity', pointCost: 1, requiresLevel: 3, prerequisites: ['anchored-thought'], stats: { spellPower: 5 } },
  { id: 'quiet-focus', artifactId: 'waystone-circlet', name: 'Quiet Focus', type: 'minor', branch: 'waystone-clarity', pointCost: 1, requiresLevel: 4, prerequisites: ['waystone-clarity'], stats: { maxFocus: 4 } },
  { id: 'keeper-sight', artifactId: 'waystone-circlet', name: 'Keeper Sight', type: 'major', branch: 'waystone-clarity', pointCost: 1, requiresLevel: 4, prerequisites: ['quiet-focus'], requiresBossKill: 'crossroads-keeper', stats: { spellPower: 8 } },
  { id: 'stable-channel', artifactId: 'waystone-circlet', name: 'Stable Channel', type: 'minor', branch: 'waystone-clarity', pointCost: 1, requiresLevel: 6, prerequisites: ['keeper-sight'], stats: { manaRegen: 1 } },
  { id: 'meridian-sight', artifactId: 'waystone-circlet', name: 'Meridian Sight', type: 'major', branch: 'waystone-clarity', pointCost: 1, requiresLevel: 7, prerequisites: ['stable-channel'], requiresBossKill: 'meridian-splitter', stats: { spellPower: 10 } },
  { id: 'wayfinder-crown', artifactId: 'waystone-circlet', name: 'Wayfinder Crown', type: 'capstone', branch: 'waystone-clarity', pointCost: 2, requiresLevel: 10, prerequisites: ['meridian-sight'], requiresBossKill: 'meridian-splitter', stats: { spellPower: 15, maxFocus: 6 } },
  { id: 'crossroads-pulse', artifactId: 'waystone-circlet', name: 'Crossroads Pulse', type: 'minor', branch: 'crossroads-pulse', pointCost: 1, requiresLevel: 3, prerequisites: ['anchored-thought'], stats: { maxHealth: 12 } },
  { id: 'resonant-mark', artifactId: 'waystone-circlet', name: 'Resonant Mark', type: 'minor', branch: 'crossroads-pulse', pointCost: 1, requiresLevel: 4, prerequisites: ['crossroads-pulse'], stats: { critChance: 0.02 } },
  { id: 'keeper-resonance', artifactId: 'waystone-circlet', name: 'Keeper Resonance', type: 'major', branch: 'crossroads-pulse', pointCost: 1, requiresLevel: 4, prerequisites: ['resonant-mark'], requiresBossKill: 'crossroads-keeper', stats: { maxHealth: 18, maxMana: 8 } },
  { id: 'clear-signal', artifactId: 'waystone-circlet', name: 'Clear Signal', type: 'minor', branch: 'crossroads-pulse', pointCost: 1, requiresLevel: 6, prerequisites: ['keeper-resonance'], stats: { statusDurationPct: 0.05 } },
  { id: 'meridian-resonance', artifactId: 'waystone-circlet', name: 'Meridian Resonance', type: 'major', branch: 'crossroads-pulse', pointCost: 1, requiresLevel: 7, prerequisites: ['clear-signal'], requiresBossKill: 'meridian-splitter', stats: { maxHealth: 25, maxMana: 12 } },
  { id: 'anchored-meridian', artifactId: 'waystone-circlet', name: 'Anchored Meridian', type: 'capstone', branch: 'crossroads-pulse', pointCost: 2, requiresLevel: 10, prerequisites: ['meridian-resonance'], requiresBossKill: 'meridian-splitter', stats: { maxHealth: 35, defense: 4 } },
]

const ACT1_ARTIFACTS: Record<'reliquary-scepter' | 'pyrebound-staff' | 'rootheart-scepter' | 'convergence-robe' | 'waystone-circlet', ArtifactDefinition> = {
  'reliquary-scepter': createAct1WeaponArtifact('reliquary-scepter', 'Reliquary Scepter', 'water-fragment', 1.8, reliquaryStats),
  'pyrebound-staff': createAct1WeaponArtifact('pyrebound-staff', 'Pyrebound Staff', 'fire-fragment', 1.8, pyreboundStats),
  'rootheart-scepter': createAct1WeaponArtifact('rootheart-scepter', 'Rootheart Scepter', 'earth-fragment', 1.8, rootheartStats),
  'convergence-robe': { id: 'convergence-robe', itemId: 'convergence-robe', tier: 2, maxLevel: 10, coreStatsByLevel: convergenceRobeStats, forge: { ingredients: [material('prismatic-fragment', 40), material('artifact-essence', 80)] }, upgrades: convergenceRobeUpgrades, branches: [{ id: 'crossroads-ward', name: 'Crossroads Ward', description: 'Health, Defense, and survival through the convergence.' }, { id: 'arcane-lining', name: 'Arcane Lining', description: 'Mana and spell support woven into the ward.' }], nodes: convergenceRobeNodes },
  'waystone-circlet': { id: 'waystone-circlet', itemId: 'waystone-circlet', tier: 2, maxLevel: 10, coreStatsByLevel: waystoneCircletStats, forge: { ingredients: [material('prismatic-fragment', 40), material('artifact-essence', 80)] }, upgrades: waystoneCircletUpgrades, branches: [{ id: 'waystone-clarity', name: 'Waystone Clarity', description: 'Spell Power, Focus, and controlled casting.' }, { id: 'crossroads-pulse', name: 'Crossroads Pulse', description: 'Health, Mana, and flexible status support.' }], nodes: waystoneCircletNodes },
}

export const ARTIFACTS: Record<ArtifactId, ArtifactDefinition> = {
  ...ACT1_ARTIFACTS,
  'ember-staff': {
    id: 'ember-staff', itemId: 'ember-staff', tier: 1, maxLevel: 10, coreStatsByLevel: emberStats,
    forge: { ingredients: [material('fire-fragment', 20), material('artifact-essence', 20)] },
    branches: [
      { id: 'burning', name: 'Burning', description: 'Persistent Fire damage and Burning.' },
      { id: 'direct-fire', name: 'Direct Fire', description: 'Direct Fire hits, Criticals, and spell tempo.' },
    ],
    upgrades: emberUpgrades, nodes: emberNodes,
  },
  'tideglass-wand': {
    id: 'tideglass-wand', itemId: 'tideglass-wand', tier: 1, maxLevel: 10, coreStatsByLevel: tideglassStats,
    forge: { ingredients: [material('water-fragment', 20), material('artifact-essence', 20)] },
    upgrades: tideglassUpgrades,
    branches: [
      { id: 'tidal-ward', name: 'Tidal Ward', description: 'Water Barrier strength, Mana, and defensive spell support.' },
      { id: 'frozen-current', name: 'Frozen Current', description: 'Direct Water damage, Chill interaction, and spell tempo.' },
    ],
    nodes: tideglassNodes,
  },
  'stoneheart-scepter': {
    id: 'stoneheart-scepter', itemId: 'stoneheart-scepter', tier: 1, maxLevel: 10, coreStatsByLevel: stoneheartStats,
    forge: { ingredients: [material('earth-fragment', 20), material('artifact-essence', 20)] },
    upgrades: stoneheartUpgrades,
    branches: [
      { id: 'living-bastion', name: 'Living Bastion', description: 'Defense, regeneration, resistance, and emergency Barrier.' },
      { id: 'crushing-earth', name: 'Crushing Earth', description: 'Heavy direct Earth Spell hits and conditional damage.' },
    ],
    nodes: stoneheartNodes,
  },
  'windthread-wand': {
    id: 'windthread-wand', itemId: 'windthread-wand', tier: 1, maxLevel: 10, coreStatsByLevel: windthreadStats,
    forge: { ingredients: [material('air-fragment', 20), material('artifact-essence', 20)] },
    upgrades: windthreadUpgrades,
    branches: [
      { id: 'tempest-tempo', name: 'Tempest Tempo', description: 'Cooldown, Mana efficiency, sustain, and high-Mana Air damage.' },
      { id: 'storm-precision', name: 'Storm Precision', description: 'Direct Air Critical damage and Debuff interaction.' },
    ],
    nodes: windthreadNodes,
  },
  'wispweave-robe': {
    id: 'wispweave-robe', itemId: 'wispweave-robe', tier: 1, maxLevel: 10, coreStatsByLevel: wispweaveStats,
    forge: { ingredients: [material('prismatic-fragment', 5), material('artifact-essence', 20)] },
    upgrades: wispweaveUpgrades,
    branches: [
      { id: 'living-bastion', name: 'Living Bastion', description: 'Health, Defense, regeneration, and emergency survival.' },
      { id: 'arcane-weave', name: 'Arcane Weave', description: 'Mana, Barrier, Healing, and elemental resistance.' },
    ],
    nodes: wispweaveNodes,
  },
  'wispveil-hood': {
    id: 'wispveil-hood', itemId: 'wispveil-hood', tier: 1, maxLevel: 10, coreStatsByLevel: wispveilStats,
    forge: { ingredients: [material('prismatic-fragment', 5), material('artifact-essence', 20)] },
    upgrades: wispveilUpgrades,
    branches: [
      { id: 'arcane-insight', name: 'Arcane Insight', description: 'Mana, Status Duration, cooldowns, and hostile-status protection.' },
      { id: 'arcane-precision', name: 'Arcane Precision', description: 'Critical chance, Critical damage, Spell Power, and casting speed.' },
    ],
    nodes: wispveilNodes,
  },
  'galeshard-staff': {
    id: 'galeshard-staff', itemId: 'galeshard-staff', tier: 1.7, maxLevel: 10, coreStatsByLevel: galeshardStats,
    forge: { ingredients: [material('air-fragment', 40), material('artifact-essence', 80)] },
    upgrades: galeshardUpgrades,
    branches: [
      { id: 'gale-tempo', name: 'Gale Tempo', description: 'Air spell damage, cooldown recovery, and Mana.' },
      { id: 'storm-precision', name: 'Storm Precision', description: 'Direct Air critical chance, critical damage, and casting speed.' },
    ],
    nodes: galeshardNodes,
  },
}
export const isArtifactId = (itemId: ItemId): itemId is ArtifactId => Object.prototype.hasOwnProperty.call(ARTIFACTS, itemId)
export const getArtifactDefinition = (itemId: ItemId) => isArtifactId(itemId) ? ARTIFACTS[itemId] : undefined

/** Structural checks for the shared Artifact foundation. Balance power is intentionally out of scope. */
export const validateArtifactDefinitions = (items: Record<string, ItemDefinition>, monsters?: Record<string, { id: string; bestiaryCategory?: string }>) => {
  const errors: string[] = []
  const combatValidationContext = createCombatValidationContext(STATUS_DEFINITIONS)
  Object.entries(ARTIFACTS).forEach(([key, definition]) => {
    if (!definition) return
    if (key !== definition.id || definition.itemId !== definition.id) errors.push(`${key}: Artifact key/id mismatch`)
    const item = items[definition.itemId]
    if (!item) errors.push(`${definition.id}: Artifact item is missing`)
    else {
      if (item.kind !== 'equipment') errors.push(`${definition.id}: Artifact item must be Equipment`)
      if (item.source !== 'Artificing') errors.push(`${definition.id}: Artifact item source must be Artificing`)
      if (item.stats !== undefined) errors.push(`${definition.id}: Artifact item must not define static stats`)
      if (item.combat !== undefined) errors.push(`${definition.id}: Artifact item must not define static combat effects`)
      if (item.sellValue !== null) errors.push(`${definition.id}: Artifact item must not be sellable`)
      if (item.canDestroy) errors.push(`${definition.id}: Artifact item must not be destroyable`)
      if (!['weapon', 'armor', 'helmet'].includes(item.equipmentSlot ?? '')) errors.push(`${definition.id}: Artifact slot is not supported`)
    }
    if (!Number.isFinite(definition.tier) || definition.tier <= 0) errors.push(`${definition.id}: tier must be finite and greater than 0`)
    if (!Number.isInteger(definition.maxLevel) || definition.maxLevel < 1) errors.push(`${definition.id}: maxLevel must be a positive integer`)
    for (let level = 1; level <= definition.maxLevel; level += 1) {
      const stats = definition.coreStatsByLevel[level]
      if (!stats) { errors.push(`${definition.id}: missing core stats for level ${level}`); continue }
      Object.entries(stats).forEach(([stat, value]) => {
        if (stat === 'resistances' && value && typeof value === 'object') Object.values(value).forEach((resistance) => { if (!Number.isFinite(resistance)) errors.push(`${definition.id}: non-finite core resistance at level ${level}`) })
        else if (!Number.isFinite(value)) errors.push(`${definition.id}: non-finite core stat ${stat} at level ${level}`)
      })
      if (item?.equipmentSlot === 'weapon') {
        if (!(stats.spellPower && stats.spellPower > 0)) errors.push(`${definition.id}: weapon Artifact requires positive spellPower at level ${level}`)
        if (!(stats.spellPower && stats.spellPower > 0)) errors.push(`${definition.id}: weapon Artifact requires positive spellPower at level ${level}`)
      }
      if (item?.equipmentSlot === 'armor' || item?.equipmentSlot === 'helmet') {
        if (!(stats.maxHealth && stats.maxHealth > 0)) errors.push(`${definition.id}: ${item.equipmentSlot} Artifact requires positive maxHealth at level ${level}`)
        if (!(stats.defense && stats.defense > 0)) errors.push(`${definition.id}: ${item.equipmentSlot} Artifact requires positive defense at level ${level}`)
      }
    }
    for (let fromLevel = 1; fromLevel < definition.maxLevel; fromLevel += 1) {
      const upgradeDefinition = definition.upgrades.find((upgradeEntry) => upgradeEntry.fromLevel === fromLevel && upgradeEntry.toLevel === fromLevel + 1)
      if (!upgradeDefinition) errors.push(`${definition.id}: missing upgrade ${fromLevel} to ${fromLevel + 1}`)
      if (upgradeDefinition?.unlock?.type === 'boss-kill' && monsters && !monsters[upgradeDefinition.unlock.bossId]) errors.push(`${definition.id}: unknown upgrade unlock boss ${upgradeDefinition.unlock.bossId}`)
    }
    const validateIngredients = (owner: string, ingredients: { itemId: ItemId; quantity: number }[]) => ingredients.forEach((ingredient) => {
      if (!items[ingredient.itemId]) errors.push(`${owner}: unknown ingredient ${ingredient.itemId}`)
      if (!Number.isInteger(ingredient.quantity) || ingredient.quantity <= 0) errors.push(`${owner}: ingredient quantity must be a positive integer`)
    })
    validateIngredients(`${definition.id}.forge`, definition.forge.ingredients)
    definition.upgrades.forEach((upgradeDefinition) => validateIngredients(`${definition.id}.upgrade.${upgradeDefinition.fromLevel}`, upgradeDefinition.ingredients))
    if (new Set(definition.branches.map((branch) => branch.id)).size !== definition.branches.length) errors.push(`${definition.id}: duplicate branch id`)
    const nodeIds = new Set<string>()
    definition.nodes.forEach((node) => {
      if (nodeIds.has(node.id)) errors.push(`${definition.id}: duplicate node id ${node.id}`)
      nodeIds.add(node.id)
      errors.push(...validateCombatProvider(node.combat, definition.id + '.' + node.id + '.combat', combatValidationContext))
      if (node.artifactId !== definition.id) errors.push(`${definition.id}/${node.id}: wrong artifactId`)
      if (!Number.isInteger(node.pointCost) || node.pointCost <= 0) errors.push(`${definition.id}/${node.id}: pointCost must be a positive integer`)
      if (!Number.isInteger(node.requiresLevel) || node.requiresLevel < 1 || node.requiresLevel > definition.maxLevel) errors.push(`${definition.id}/${node.id}: requiresLevel is outside Artifact levels`)
      if (node.branch !== 'shared' && !definition.branches.some((branch) => branch.id === node.branch)) errors.push(`${definition.id}/${node.id}: unknown branch ${node.branch}`)
      node.prerequisites?.forEach((prerequisite) => { if (prerequisite === node.id) errors.push(`${definition.id}/${node.id}: self prerequisite`); else if (!definition.nodes.some((candidate) => candidate.id === prerequisite)) errors.push(`${definition.id}/${node.id}: unknown prerequisite ${prerequisite}`) })
      if (node.catalyst) {
        if (!items[node.catalyst.itemId]) errors.push(`${definition.id}/${node.id}: unknown catalyst ${node.catalyst.itemId}`)
        if (!Number.isInteger(node.catalyst.quantity) || node.catalyst.quantity <= 0) errors.push(`${definition.id}/${node.id}: catalyst quantity must be a positive integer`)
      }
      if (node.requiresBossKill && monsters && !monsters[node.requiresBossKill]) errors.push(`${definition.id}/${node.id}: unknown boss ${node.requiresBossKill}`)
    })
    const visiting = new Set<string>(); const visited = new Set<string>()
    const visit = (nodeId: string) => { if (visiting.has(nodeId)) { errors.push(`${definition.id}: prerequisite cycle`); return }; if (visited.has(nodeId)) return; visiting.add(nodeId); definition.nodes.find((node) => node.id === nodeId)?.prerequisites?.forEach(visit); visiting.delete(nodeId); visited.add(nodeId) }
    definition.nodes.forEach((node) => visit(node.id))
  })
  return errors
}
