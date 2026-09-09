import type { ArtifactId, EquipmentStats, ItemDefinition, ItemId, MonsterId } from '../../types'
import type { CombatModifier, CombatTriggerRule } from '../../systems/combat/combatTypes'
import { createCombatValidationContext, validateCombatProvider } from '../../systems/combat/combatEffectValidation'
import { STATUS_DEFINITIONS } from '../statuses/statuses'

export interface ArtifactForgeDefinition { ingredients: { itemId: ItemId; quantity: number }[] }
export interface ArtifactLevelUpgradeDefinition { fromLevel: number; toLevel: number; ingredients: { itemId: ItemId; quantity: number }[] }
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

const upgrade = (fromLevel: number, ingredients: ArtifactLevelUpgradeDefinition['ingredients']) => ({ fromLevel, toLevel: fromLevel + 1, ingredients })
const emberNodes: ArtifactNodeDefinition[] = [
  { id: 'arcane-kindling', artifactId: 'ember-staff', name: 'Arcane Kindling', type: 'minor', branch: 'shared', pointCost: 1, requiresLevel: 2, combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.05, originSourceKinds: ['spell'], damageTypes: ['fire'] }] } },
  { id: 'cinder-memory', artifactId: 'ember-staff', name: 'Cinder Memory', type: 'minor', branch: 'burning', pointCost: 1, requiresLevel: 3, prerequisites: ['arcane-kindling'], combat: { modifiers: [{ key: 'damage-over-time-percent', value: 0.1 }] } },
  { id: 'lingering-flame', artifactId: 'ember-staff', name: 'Lingering Flame', type: 'minor', branch: 'burning', pointCost: 1, requiresLevel: 4, prerequisites: ['cinder-memory'], combat: { modifiers: [{ key: 'status-duration-dealt-percent', value: 0.1 }] } },
  { id: 'heartfed-embers', artifactId: 'ember-staff', name: 'Heartfed Embers', type: 'major', branch: 'burning', pointCost: 1, requiresLevel: 4, prerequisites: ['lingering-flame'], catalyst: { itemId: 'heartseed', quantity: 1 }, requiresBossKill: 'forest-heart', combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.1, originSourceKinds: ['spell'], damageTypes: ['fire'], condition: { type: 'target-has-status', statusId: 'burning' } }] } },
  { id: 'charred-continuance', artifactId: 'ember-staff', name: 'Charred Continuance', type: 'minor', branch: 'burning', pointCost: 1, requiresLevel: 6, prerequisites: ['heartfed-embers'], combat: { modifiers: [{ key: 'damage-over-time-percent', value: 0.1 }] } },
  { id: 'corrupted-combustion', artifactId: 'ember-staff', name: 'Corrupted Combustion', type: 'major', branch: 'burning', pointCost: 1, requiresLevel: 7, prerequisites: ['charred-continuance'], catalyst: { itemId: 'greatbear-core', quantity: 1 }, requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [{ key: 'damage-over-time-percent', value: 0.15, originSourceKinds: ['spell'], damageTypes: ['fire'] }] } },
  { id: 'edrins-blackflame', artifactId: 'ember-staff', name: "Edrin's Blackflame", type: 'capstone', branch: 'burning', pointCost: 2, requiresLevel: 10, prerequisites: ['corrupted-combustion'], catalyst: { itemId: 'edrin-remnant', quantity: 1 }, requiresBossKill: 'archmage-edrin-shade', combat: { modifiers: [{ key: 'damage-over-time-percent', value: 0.25, originSourceKinds: ['spell'], damageTypes: ['fire'] }] } },
  { id: 'focused-flame', artifactId: 'ember-staff', name: 'Focused Flame', type: 'minor', branch: 'direct-fire', pointCost: 1, requiresLevel: 3, prerequisites: ['arcane-kindling'], combat: { modifiers: [{ key: 'crit-chance', value: 0.03, originSourceKinds: ['spell'], damageTypes: ['fire'], sourceTags: ['direct'] }] } },
  { id: 'flame-precision', artifactId: 'ember-staff', name: 'Flame Precision', type: 'minor', branch: 'direct-fire', pointCost: 1, requiresLevel: 4, prerequisites: ['focused-flame'], combat: { modifiers: [{ key: 'crit-damage', value: 0.15, originSourceKinds: ['spell'], damageTypes: ['fire'], sourceTags: ['direct'] }] } },
  { id: 'heartfire-focus', artifactId: 'ember-staff', name: 'Heartfire Focus', type: 'major', branch: 'direct-fire', pointCost: 1, requiresLevel: 4, prerequisites: ['flame-precision'], catalyst: { itemId: 'heartseed', quantity: 1 }, requiresBossKill: 'forest-heart', combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.1, originSourceKinds: ['spell'], damageTypes: ['fire'], sourceTags: ['direct'], condition: { type: 'target-has-status', statusId: 'burning' } }] } },
  { id: 'blazing-tempo', artifactId: 'ember-staff', name: 'Blazing Tempo', type: 'minor', branch: 'direct-fire', pointCost: 1, requiresLevel: 6, prerequisites: ['heartfire-focus'], stats: { cooldownRecoveryPct: 0.1 } },
  { id: 'corrupted-burst', artifactId: 'ember-staff', name: 'Corrupted Burst', type: 'major', branch: 'direct-fire', pointCost: 1, requiresLevel: 7, prerequisites: ['blazing-tempo'], catalyst: { itemId: 'greatbear-core', quantity: 1 }, requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.15, originSourceKinds: ['spell'], damageTypes: ['fire'], sourceTags: ['direct'], condition: { type: 'target-has-status-tag', tag: 'debuff' } }] } },
  { id: 'edrins-inferno', artifactId: 'ember-staff', name: "Edrin's Inferno", type: 'capstone', branch: 'direct-fire', pointCost: 2, requiresLevel: 10, prerequisites: ['corrupted-burst'], catalyst: { itemId: 'edrin-remnant', quantity: 1 }, requiresBossKill: 'archmage-edrin-shade', combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.25, originSourceKinds: ['spell'], damageTypes: ['fire'], sourceTags: ['direct'], condition: { type: 'target-has-status', statusId: 'burning' } }] } },
]

const emberStats: Record<number, EquipmentStats> = { 1: { basicDamage: 5, spellPower: 16 }, 2: { basicDamage: 6, spellPower: 20 }, 3: { basicDamage: 7, spellPower: 24 }, 4: { basicDamage: 8, spellPower: 29 }, 5: { basicDamage: 9, spellPower: 35 }, 6: { basicDamage: 10, spellPower: 41 }, 7: { basicDamage: 11, spellPower: 48 }, 8: { basicDamage: 13, spellPower: 56 }, 9: { basicDamage: 15, spellPower: 65 }, 10: { basicDamage: 17, spellPower: 75 } }

const material = (itemId: ItemId, quantity: number) => ({ itemId, quantity })
const emberUpgrades = [
  upgrade(1, [material('fire-fragment', 50)]),
  upgrade(2, [material('fire-fragment', 100), material('wisp-essence', 10), material('thorn-fiber', 10), material('life-essence', 5)]),
  upgrade(3, [material('fire-fragment', 200), material('wisp-essence', 8), material('thorn-fiber', 8), material('rootstone-shard', 17), material('grove-bark', 17), material('life-essence', 25)]),
  upgrade(4, [material('fire-fragment', 300), material('predator-hide', 15), material('predator-fang', 15), material('prismatic-fragment', 5), material('life-essence', 50)]),
  upgrade(5, [material('fire-fragment', 500), material('predator-hide', 15), material('predator-fang', 15), material('corrupted-beast-essence', 15), material('predator-sinew', 15), material('prismatic-fragment', 9), material('life-essence', 88)]),
  upgrade(6, [material('fire-fragment', 750), material('predator-hide', 18), material('predator-fang', 18), material('corrupted-beast-essence', 32), material('predator-sinew', 32), material('prismatic-fragment', 14), material('life-essence', 150)]),
  upgrade(7, [material('fire-fragment', 1000), material('ossuary-remnant', 25), material('soul-residue', 25), material('prismatic-fragment', 20), material('life-essence', 200)]),
  upgrade(8, [material('fire-fragment', 1650), material('ossuary-remnant', 25), material('soul-residue', 25), material('graveglass-shard', 25), material('burial-cloth', 25), material('prismatic-fragment', 30), material('life-essence', 275)]),
  upgrade(9, [material('fire-fragment', 2750), material('ossuary-remnant', 45), material('soul-residue', 45), material('graveglass-shard', 70), material('burial-cloth', 70), material('prismatic-fragment', 45), material('life-essence', 375)]),
]
const tideglassUpgrades = [
  upgrade(1, [material('water-fragment', 50)]),
  upgrade(2, [material('water-fragment', 100), material('rootstone-shard', 10), material('grove-bark', 10), material('life-essence', 5)]),
  upgrade(3, [material('water-fragment', 200), material('wisp-essence', 17), material('thorn-fiber', 17), material('rootstone-shard', 8), material('grove-bark', 8), material('life-essence', 25)]),
  upgrade(4, [material('water-fragment', 300), material('corrupted-beast-essence', 15), material('predator-sinew', 15), material('prismatic-fragment', 5), material('life-essence', 50)]),
  upgrade(5, [material('water-fragment', 500), material('predator-hide', 15), material('predator-fang', 15), material('corrupted-beast-essence', 15), material('predator-sinew', 15), material('prismatic-fragment', 9), material('life-essence', 88)]),
  upgrade(6, [material('water-fragment', 750), material('predator-hide', 32), material('predator-fang', 32), material('corrupted-beast-essence', 18), material('predator-sinew', 18), material('prismatic-fragment', 14), material('life-essence', 150)]),
  upgrade(7, [material('water-fragment', 1000), material('graveglass-shard', 25), material('burial-cloth', 25), material('prismatic-fragment', 20), material('life-essence', 200)]),
  upgrade(8, [material('water-fragment', 1650), material('ossuary-remnant', 25), material('soul-residue', 25), material('graveglass-shard', 25), material('burial-cloth', 25), material('prismatic-fragment', 30), material('life-essence', 275)]),
  upgrade(9, [material('water-fragment', 2750), material('ossuary-remnant', 70), material('soul-residue', 70), material('graveglass-shard', 45), material('burial-cloth', 45), material('prismatic-fragment', 45), material('life-essence', 375)]),
]
const stoneheartUpgrades = [
  upgrade(1, [material('earth-fragment', 50)]),
  upgrade(2, [material('earth-fragment', 100), material('rootstone-shard', 10), material('grove-bark', 10), material('life-essence', 5)]),
  upgrade(3, [material('earth-fragment', 200), material('wisp-essence', 17), material('thorn-fiber', 17), material('rootstone-shard', 8), material('grove-bark', 8), material('life-essence', 25)]),
  upgrade(4, [material('earth-fragment', 300), material('predator-hide', 15), material('corrupted-beast-essence', 15), material('prismatic-fragment', 5), material('life-essence', 50)]),
  upgrade(5, [material('earth-fragment', 500), material('predator-hide', 15), material('predator-fang', 15), material('corrupted-beast-essence', 15), material('predator-sinew', 15), material('prismatic-fragment', 9), material('life-essence', 88)]),
  upgrade(6, [material('earth-fragment', 750), material('predator-hide', 18), material('predator-fang', 32), material('corrupted-beast-essence', 18), material('predator-sinew', 32), material('prismatic-fragment', 14), material('life-essence', 150)]),
  upgrade(7, [material('earth-fragment', 1000), material('ossuary-remnant', 25), material('graveglass-shard', 25), material('prismatic-fragment', 20), material('life-essence', 200)]),
  upgrade(8, [material('earth-fragment', 1650), material('ossuary-remnant', 25), material('soul-residue', 25), material('graveglass-shard', 25), material('burial-cloth', 25), material('prismatic-fragment', 30), material('life-essence', 275)]),
  upgrade(9, [material('earth-fragment', 2750), material('ossuary-remnant', 45), material('soul-residue', 70), material('graveglass-shard', 45), material('burial-cloth', 70), material('prismatic-fragment', 45), material('life-essence', 375)]),
]
const windthreadUpgrades = [
  upgrade(1, [material('air-fragment', 50)]),
  upgrade(2, [material('air-fragment', 100), material('wisp-essence', 10), material('thorn-fiber', 10), material('life-essence', 5)]),
  upgrade(3, [material('air-fragment', 200), material('wisp-essence', 8), material('thorn-fiber', 8), material('rootstone-shard', 17), material('grove-bark', 17), material('life-essence', 25)]),
  upgrade(4, [material('air-fragment', 300), material('predator-fang', 15), material('predator-sinew', 15), material('prismatic-fragment', 5), material('life-essence', 50)]),
  upgrade(5, [material('air-fragment', 500), material('predator-hide', 15), material('predator-fang', 15), material('corrupted-beast-essence', 15), material('predator-sinew', 15), material('prismatic-fragment', 9), material('life-essence', 88)]),
  upgrade(6, [material('air-fragment', 750), material('predator-hide', 32), material('predator-fang', 18), material('corrupted-beast-essence', 32), material('predator-sinew', 18), material('prismatic-fragment', 14), material('life-essence', 150)]),
  upgrade(7, [material('air-fragment', 1000), material('soul-residue', 25), material('burial-cloth', 25), material('prismatic-fragment', 20), material('life-essence', 200)]),
  upgrade(8, [material('air-fragment', 1650), material('ossuary-remnant', 25), material('soul-residue', 25), material('graveglass-shard', 25), material('burial-cloth', 25), material('prismatic-fragment', 30), material('life-essence', 275)]),
  upgrade(9, [material('air-fragment', 2750), material('ossuary-remnant', 70), material('soul-residue', 45), material('graveglass-shard', 70), material('burial-cloth', 45), material('prismatic-fragment', 45), material('life-essence', 375)]),
]
const wispweaveUpgrades = [
  upgrade(1, [material('wisp-essence', 7), material('thorn-fiber', 7), material('rootstone-shard', 6), material('grove-bark', 6), material('life-essence', 13)]),
  upgrade(2, [material('wisp-essence', 16), material('thorn-fiber', 16), material('rootstone-shard', 17), material('grove-bark', 17), material('life-essence', 25)]),
  upgrade(3, [material('wisp-essence', 30), material('thorn-fiber', 30), material('rootstone-shard', 30), material('grove-bark', 30), material('prismatic-fragment', 5), material('life-essence', 50)]),
  upgrade(4, [material('predator-hide', 13), material('predator-fang', 13), material('corrupted-beast-essence', 13), material('predator-sinew', 13), material('prismatic-fragment', 8), material('life-essence', 75)]),
  upgrade(5, [material('predator-hide', 25), material('predator-fang', 25), material('corrupted-beast-essence', 25), material('predator-sinew', 25), material('prismatic-fragment', 13), material('life-essence', 125)]),
  upgrade(6, [material('predator-hide', 42), material('predator-fang', 42), material('corrupted-beast-essence', 41), material('predator-sinew', 41), material('prismatic-fragment', 20), material('life-essence', 188)]),
  upgrade(7, [material('ossuary-remnant', 15), material('soul-residue', 15), material('graveglass-shard', 15), material('burial-cloth', 15), material('prismatic-fragment', 25), material('life-essence', 250)]),
  upgrade(8, [material('ossuary-remnant', 35), material('soul-residue', 35), material('graveglass-shard', 35), material('burial-cloth', 35), material('prismatic-fragment', 38), material('life-essence', 338)]),
  upgrade(9, [material('ossuary-remnant', 68), material('soul-residue', 68), material('graveglass-shard', 68), material('burial-cloth', 68), material('prismatic-fragment', 55), material('life-essence', 450)]),
]
const wispveilUpgrades = [
  upgrade(1, [material('wisp-essence', 7), material('thorn-fiber', 7), material('rootstone-shard', 6), material('grove-bark', 6), material('life-essence', 10)]),
  upgrade(2, [material('wisp-essence', 13), material('thorn-fiber', 13), material('rootstone-shard', 13), material('grove-bark', 13), material('prismatic-fragment', 5), material('life-essence', 20)]),
  upgrade(3, [material('wisp-essence', 26), material('thorn-fiber', 26), material('rootstone-shard', 27), material('grove-bark', 27), material('prismatic-fragment', 8), material('life-essence', 40)]),
  upgrade(4, [material('predator-hide', 10), material('predator-fang', 10), material('corrupted-beast-essence', 10), material('predator-sinew', 10), material('prismatic-fragment', 10), material('life-essence', 63)]),
  upgrade(5, [material('predator-hide', 16), material('predator-fang', 16), material('corrupted-beast-essence', 17), material('predator-sinew', 17), material('prismatic-fragment', 15), material('life-essence', 105)]),
  upgrade(6, [material('predator-hide', 28), material('predator-fang', 28), material('corrupted-beast-essence', 28), material('predator-sinew', 28), material('prismatic-fragment', 23), material('life-essence', 163)]),
  upgrade(7, [material('ossuary-remnant', 13), material('soul-residue', 13), material('graveglass-shard', 13), material('burial-cloth', 13), material('prismatic-fragment', 30), material('life-essence', 225)]),
  upgrade(8, [material('ossuary-remnant', 18), material('soul-residue', 18), material('graveglass-shard', 18), material('burial-cloth', 18), material('prismatic-fragment', 43), material('life-essence', 300)]),
  upgrade(9, [material('ossuary-remnant', 47), material('soul-residue', 47), material('graveglass-shard', 46), material('burial-cloth', 46), material('prismatic-fragment', 63), material('life-essence', 413)]),
]

const tideglassStats: Record<number, EquipmentStats> = { 1: { basicDamage: 5, spellPower: 15 }, 2: { basicDamage: 6, spellPower: 19 }, 3: { basicDamage: 7, spellPower: 23 }, 4: { basicDamage: 8, spellPower: 28 }, 5: { basicDamage: 9, spellPower: 34 }, 6: { basicDamage: 10, spellPower: 40 }, 7: { basicDamage: 11, spellPower: 47 }, 8: { basicDamage: 12, spellPower: 55 }, 9: { basicDamage: 14, spellPower: 63 }, 10: { basicDamage: 16, spellPower: 72 } }
const stoneheartStats: Record<number, EquipmentStats> = { 1: { basicDamage: 6, spellPower: 14 }, 2: { basicDamage: 7, spellPower: 18 }, 3: { basicDamage: 8, spellPower: 22 }, 4: { basicDamage: 9, spellPower: 27 }, 5: { basicDamage: 10, spellPower: 32 }, 6: { basicDamage: 11, spellPower: 38 }, 7: { basicDamage: 13, spellPower: 44 }, 8: { basicDamage: 15, spellPower: 51 }, 9: { basicDamage: 17, spellPower: 59 }, 10: { basicDamage: 19, spellPower: 67 } }
const windthreadStats: Record<number, EquipmentStats> = { 1: { basicDamage: 4, spellPower: 15 }, 2: { basicDamage: 5, spellPower: 19 }, 3: { basicDamage: 6, spellPower: 23 }, 4: { basicDamage: 7, spellPower: 28 }, 5: { basicDamage: 8, spellPower: 34 }, 6: { basicDamage: 9, spellPower: 41 }, 7: { basicDamage: 10, spellPower: 48 }, 8: { basicDamage: 11, spellPower: 56 }, 9: { basicDamage: 12, spellPower: 64 }, 10: { basicDamage: 14, spellPower: 73 } }
const wispweaveStats: Record<number, EquipmentStats> = { 1: { maxHealth: 20, defense: 4 }, 2: { maxHealth: 24, defense: 5 }, 3: { maxHealth: 29, defense: 6 }, 4: { maxHealth: 35, defense: 7 }, 5: { maxHealth: 42, defense: 8 }, 6: { maxHealth: 50, defense: 10 }, 7: { maxHealth: 59, defense: 12 }, 8: { maxHealth: 69, defense: 14 }, 9: { maxHealth: 80, defense: 16 }, 10: { maxHealth: 92, defense: 19 } }
const wispveilStats: Record<number, EquipmentStats> = { 1: { maxHealth: 10, defense: 2 }, 2: { maxHealth: 12, defense: 3 }, 3: { maxHealth: 15, defense: 4 }, 4: { maxHealth: 18, defense: 5 }, 5: { maxHealth: 22, defense: 6 }, 6: { maxHealth: 26, defense: 7 }, 7: { maxHealth: 31, defense: 8 }, 8: { maxHealth: 36, defense: 10 }, 9: { maxHealth: 42, defense: 12 }, 10: { maxHealth: 49, defense: 14 } }

const spellDamage = (value: number, school: 'water' | 'earth' | 'air', sourceTags?: CombatModifier['sourceTags']): CombatModifier => ({ key: 'spell-damage-percent', value, originSourceKinds: ['spell'], damageTypes: [school], ...(sourceTags ? { sourceTags } : {}) })
const directSpellDamage = (value: number, school: 'water' | 'earth' | 'air', condition?: CombatModifier['condition']): CombatModifier => ({ ...spellDamage(value, school, ['direct']), ...(condition ? { condition } : {}) })
const barrierPower = (value: number, school: 'water' | 'earth' | 'air') => ({ key: 'barrier-power-percent' as const, value, originSourceKinds: ['spell' as const], damageTypes: [school] })
const bossRule = (id: string, condition: NonNullable<CombatTriggerRule['condition']>, value: number, cooldownMs?: number): CombatTriggerRule => ({ id, event: 'on-hp-threshold', condition, oncePerEncounter: true, ...(cooldownMs ? { cooldownMs } : {}), effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value } }] })

const tideglassNodes: ArtifactNodeDefinition[] = [
  { id: 'flowing-conduit', artifactId: 'tideglass-wand', name: 'Flowing Conduit', type: 'minor', branch: 'shared', pointCost: 1, requiresLevel: 2, combat: { modifiers: [spellDamage(0.05, 'water')] } },
  { id: 'protective-current', artifactId: 'tideglass-wand', name: 'Protective Current', type: 'minor', branch: 'tidal-ward', pointCost: 1, requiresLevel: 3, prerequisites: ['flowing-conduit'], combat: { modifiers: [barrierPower(0.1, 'water')] } },
  { id: 'lingering-tide', artifactId: 'tideglass-wand', name: 'Lingering Tide', type: 'minor', branch: 'tidal-ward', pointCost: 1, requiresLevel: 4, prerequisites: ['protective-current'], combat: { modifiers: [{ key: 'status-duration-dealt-percent', value: 0.1, originSourceKinds: ['spell'], damageTypes: ['water'] }] } },
  { id: 'heartwater-shell', artifactId: 'tideglass-wand', name: 'Heartwater Shell', type: 'major', branch: 'tidal-ward', pointCost: 1, requiresLevel: 4, prerequisites: ['lingering-tide'], catalyst: { itemId: 'heartseed', quantity: 1 }, requiresBossKill: 'forest-heart', combat: { modifiers: [barrierPower(0.1, 'water')] } },
  { id: 'deep-reservoir', artifactId: 'tideglass-wand', name: 'Deep Reservoir', type: 'minor', branch: 'tidal-ward', pointCost: 1, requiresLevel: 6, prerequisites: ['heartwater-shell'], stats: { maxMana: 10 } },
  { id: 'greatbear-tidewall', artifactId: 'tideglass-wand', name: 'Greatbear Tidewall', type: 'major', branch: 'tidal-ward', pointCost: 1, requiresLevel: 7, prerequisites: ['deep-reservoir'], catalyst: { itemId: 'greatbear-core', quantity: 1 }, requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [barrierPower(0.15, 'water')] } },
  { id: 'edrins-abyssal-aegis', artifactId: 'tideglass-wand', name: "Edrin's Abyssal Aegis", type: 'capstone', branch: 'tidal-ward', pointCost: 2, requiresLevel: 10, prerequisites: ['greatbear-tidewall'], catalyst: { itemId: 'edrin-remnant', quantity: 1 }, requiresBossKill: 'archmage-edrin-shade', combat: { modifiers: [barrierPower(0.25, 'water')] } },
  { id: 'cold-precision', artifactId: 'tideglass-wand', name: 'Cold Precision', type: 'minor', branch: 'frozen-current', pointCost: 1, requiresLevel: 3, prerequisites: ['flowing-conduit'], combat: { modifiers: [{ key: 'crit-chance', value: 0.03, originSourceKinds: ['spell'], damageTypes: ['water'], sourceTags: ['direct'] }] } },
  { id: 'deep-chill', artifactId: 'tideglass-wand', name: 'Deep Chill', type: 'minor', branch: 'frozen-current', pointCost: 1, requiresLevel: 4, prerequisites: ['cold-precision'], combat: { modifiers: [{ key: 'status-duration-dealt-percent', value: 0.1, originSourceKinds: ['spell'], damageTypes: ['water'] }] } },
  { id: 'heartfrost', artifactId: 'tideglass-wand', name: 'Heartfrost', type: 'major', branch: 'frozen-current', pointCost: 1, requiresLevel: 4, prerequisites: ['deep-chill'], catalyst: { itemId: 'heartseed', quantity: 1 }, requiresBossKill: 'forest-heart', combat: { modifiers: [directSpellDamage(0.1, 'water', { type: 'target-has-status', statusId: 'chilled' })] } },
  { id: 'accelerated-current', artifactId: 'tideglass-wand', name: 'Accelerated Current', type: 'minor', branch: 'frozen-current', pointCost: 1, requiresLevel: 6, prerequisites: ['heartfrost'], combat: { modifiers: [{ key: 'cooldown-recovery-percent', value: 0.1 }] } },
  { id: 'corrupted-undertow', artifactId: 'tideglass-wand', name: 'Corrupted Undertow', type: 'major', branch: 'frozen-current', pointCost: 1, requiresLevel: 7, prerequisites: ['accelerated-current'], catalyst: { itemId: 'greatbear-core', quantity: 1 }, requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [directSpellDamage(0.15, 'water', { type: 'target-has-status-tag', tag: 'debuff' })] } },
  { id: 'edrins-frozen-depth', artifactId: 'tideglass-wand', name: "Edrin's Frozen Depth", type: 'capstone', branch: 'frozen-current', pointCost: 2, requiresLevel: 10, prerequisites: ['corrupted-undertow'], catalyst: { itemId: 'edrin-remnant', quantity: 1 }, requiresBossKill: 'archmage-edrin-shade', combat: { modifiers: [directSpellDamage(0.25, 'water', { type: 'target-has-status', statusId: 'chilled' })] } },
]

const stoneheartNodes: ArtifactNodeDefinition[] = [
  { id: 'stone-channel', artifactId: 'stoneheart-scepter', name: 'Stone Channel', type: 'minor', branch: 'shared', pointCost: 1, requiresLevel: 2, combat: { modifiers: [spellDamage(0.05, 'earth')] } },
  { id: 'stone-skin', artifactId: 'stoneheart-scepter', name: 'Stone Skin', type: 'minor', branch: 'living-bastion', pointCost: 1, requiresLevel: 3, prerequisites: ['stone-channel'], stats: { defense: 5 } },
  { id: 'earthen-reserve', artifactId: 'stoneheart-scepter', name: 'Earthen Reserve', type: 'minor', branch: 'living-bastion', pointCost: 1, requiresLevel: 4, prerequisites: ['stone-skin'], stats: { maxHealth: 10 } },
  { id: 'heartroot-bulwark', artifactId: 'stoneheart-scepter', name: 'Heartroot Bulwark', type: 'major', branch: 'living-bastion', pointCost: 1, requiresLevel: 4, prerequisites: ['earthen-reserve'], catalyst: { itemId: 'heartseed', quantity: 1 }, requiresBossKill: 'forest-heart', combat: { modifiers: [{ key: 'defense-flat', value: 5, condition: { type: 'self-has-barrier' } }] } },
  { id: 'regrowing-stone', artifactId: 'stoneheart-scepter', name: 'Regrowing Stone', type: 'minor', branch: 'living-bastion', pointCost: 1, requiresLevel: 6, prerequisites: ['heartroot-bulwark'], stats: { healthRegen: 1 } },
  { id: 'greatbear-foundation', artifactId: 'stoneheart-scepter', name: 'Greatbear Foundation', type: 'major', branch: 'living-bastion', pointCost: 1, requiresLevel: 7, prerequisites: ['regrowing-stone'], catalyst: { itemId: 'greatbear-core', quantity: 1 }, requiresBossKill: 'corrupted-greatbear', stats: { resistances: { physical: 0.1 } } },
  { id: 'edrins-immortal-earth', artifactId: 'stoneheart-scepter', name: "Edrin's Immortal Earth", type: 'capstone', branch: 'living-bastion', pointCost: 2, requiresLevel: 10, prerequisites: ['greatbear-foundation'], catalyst: { itemId: 'edrin-remnant', quantity: 1 }, requiresBossKill: 'archmage-edrin-shade', combat: { rules: [bossRule('immortal-earth', { type: 'self-hp-below-percent', percent: 35 }, 60)] } },
  { id: 'heavy-channel', artifactId: 'stoneheart-scepter', name: 'Heavy Channel', type: 'minor', branch: 'crushing-earth', pointCost: 1, requiresLevel: 3, prerequisites: ['stone-channel'], combat: { modifiers: [spellDamage(0.05, 'earth')] } },
  { id: 'fracture-point', artifactId: 'stoneheart-scepter', name: 'Fracture Point', type: 'minor', branch: 'crushing-earth', pointCost: 1, requiresLevel: 4, prerequisites: ['heavy-channel'], combat: { modifiers: [{ key: 'crit-chance', value: 0.03, originSourceKinds: ['spell'], damageTypes: ['earth'], sourceTags: ['direct'] }] } },
  { id: 'heartstone-impact', artifactId: 'stoneheart-scepter', name: 'Heartstone Impact', type: 'major', branch: 'crushing-earth', pointCost: 1, requiresLevel: 4, prerequisites: ['fracture-point'], catalyst: { itemId: 'heartseed', quantity: 1 }, requiresBossKill: 'forest-heart', combat: { modifiers: [directSpellDamage(0.1, 'earth', { type: 'target-has-status-tag', tag: 'debuff' })] } },
  { id: 'crushing-momentum', artifactId: 'stoneheart-scepter', name: 'Crushing Momentum', type: 'minor', branch: 'crushing-earth', pointCost: 1, requiresLevel: 6, prerequisites: ['heartstone-impact'], combat: { modifiers: [{ key: 'crit-damage', value: 0.15, originSourceKinds: ['spell'], damageTypes: ['earth'], sourceTags: ['direct'] }] } },
  { id: 'corrupted-fault', artifactId: 'stoneheart-scepter', name: 'Corrupted Fault', type: 'major', branch: 'crushing-earth', pointCost: 1, requiresLevel: 7, prerequisites: ['crushing-momentum'], catalyst: { itemId: 'greatbear-core', quantity: 1 }, requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [directSpellDamage(0.15, 'earth', { type: 'target-has-status-tag', tag: 'control' })] } },
  { id: 'edrins-world-break', artifactId: 'stoneheart-scepter', name: "Edrin's World Break", type: 'capstone', branch: 'crushing-earth', pointCost: 2, requiresLevel: 10, prerequisites: ['corrupted-fault'], catalyst: { itemId: 'edrin-remnant', quantity: 1 }, requiresBossKill: 'archmage-edrin-shade', combat: { modifiers: [directSpellDamage(0.25, 'earth', { type: 'target-has-status-tag', tag: 'debuff' })] } },
]

const windthreadNodes: ArtifactNodeDefinition[] = [
  { id: 'wind-channel', artifactId: 'windthread-wand', name: 'Wind Channel', type: 'minor', branch: 'shared', pointCost: 1, requiresLevel: 2, combat: { modifiers: [spellDamage(0.05, 'air')] } },
  { id: 'quickened-thought', artifactId: 'windthread-wand', name: 'Quickened Thought', type: 'minor', branch: 'tempest-tempo', pointCost: 1, requiresLevel: 3, prerequisites: ['wind-channel'], combat: { modifiers: [{ key: 'cooldown-recovery-percent', value: 0.05 }] } },
  { id: 'efficient-current', artifactId: 'windthread-wand', name: 'Efficient Current', type: 'minor', branch: 'tempest-tempo', pointCost: 1, requiresLevel: 4, prerequisites: ['quickened-thought'], stats: { manaCostReductionPct: 0.05 } },
  { id: 'heartwind-rhythm', artifactId: 'windthread-wand', name: 'Heartwind Rhythm', type: 'major', branch: 'tempest-tempo', pointCost: 1, requiresLevel: 4, prerequisites: ['efficient-current'], catalyst: { itemId: 'heartseed', quantity: 1 }, requiresBossKill: 'forest-heart', combat: { modifiers: [{ key: 'cooldown-recovery-percent', value: 0.05 }] } },
  { id: 'sustained-flow', artifactId: 'windthread-wand', name: 'Sustained Flow', type: 'minor', branch: 'tempest-tempo', pointCost: 1, requiresLevel: 6, prerequisites: ['heartwind-rhythm'], stats: { manaRegen: 2 } },
  { id: 'greatbear-stormheart', artifactId: 'windthread-wand', name: 'Greatbear Stormheart', type: 'major', branch: 'tempest-tempo', pointCost: 1, requiresLevel: 7, prerequisites: ['sustained-flow'], catalyst: { itemId: 'greatbear-core', quantity: 1 }, requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [{ ...spellDamage(0.15, 'air'), condition: { type: 'self-mana-above-percent', percent: 50 } }] } },
  { id: 'edrins-endless-tempest', artifactId: 'windthread-wand', name: "Edrin's Endless Tempest", type: 'capstone', branch: 'tempest-tempo', pointCost: 2, requiresLevel: 10, prerequisites: ['greatbear-stormheart'], catalyst: { itemId: 'edrin-remnant', quantity: 1 }, requiresBossKill: 'archmage-edrin-shade', combat: { modifiers: [{ ...spellDamage(0.25, 'air'), condition: { type: 'self-mana-above-percent', percent: 50 } }] } },
  { id: 'charged-aim', artifactId: 'windthread-wand', name: 'Charged Aim', type: 'minor', branch: 'storm-precision', pointCost: 1, requiresLevel: 3, prerequisites: ['wind-channel'], combat: { modifiers: [{ key: 'crit-chance', value: 0.03, originSourceKinds: ['spell'], damageTypes: ['air'], sourceTags: ['direct'] }] } },
  { id: 'storm-edge', artifactId: 'windthread-wand', name: 'Storm Edge', type: 'minor', branch: 'storm-precision', pointCost: 1, requiresLevel: 4, prerequisites: ['charged-aim'], combat: { modifiers: [{ key: 'crit-damage', value: 0.15, originSourceKinds: ['spell'], damageTypes: ['air'], sourceTags: ['direct'] }] } },
  { id: 'heartstorm', artifactId: 'windthread-wand', name: 'Heartstorm', type: 'major', branch: 'storm-precision', pointCost: 1, requiresLevel: 4, prerequisites: ['storm-edge'], catalyst: { itemId: 'heartseed', quantity: 1 }, requiresBossKill: 'forest-heart', combat: { modifiers: [directSpellDamage(0.1, 'air', { type: 'target-has-status-tag', tag: 'debuff' })] } },
  { id: 'pressure-spike', artifactId: 'windthread-wand', name: 'Pressure Spike', type: 'minor', branch: 'storm-precision', pointCost: 1, requiresLevel: 6, prerequisites: ['heartstorm'], combat: { modifiers: [spellDamage(0.05, 'air')] } },
  { id: 'corrupted-lightning', artifactId: 'windthread-wand', name: 'Corrupted Lightning', type: 'major', branch: 'storm-precision', pointCost: 1, requiresLevel: 7, prerequisites: ['pressure-spike'], catalyst: { itemId: 'greatbear-core', quantity: 1 }, requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [directSpellDamage(0.15, 'air', { type: 'target-has-status-tag', tag: 'debuff' })] } },
  { id: 'edrins-sky-rend', artifactId: 'windthread-wand', name: "Edrin's Sky Rend", type: 'capstone', branch: 'storm-precision', pointCost: 2, requiresLevel: 10, prerequisites: ['corrupted-lightning'], catalyst: { itemId: 'edrin-remnant', quantity: 1 }, requiresBossKill: 'archmage-edrin-shade', combat: { modifiers: [directSpellDamage(0.25, 'air', { type: 'target-has-status-tag', tag: 'debuff' })] } },
]

const wispweaveNodes: ArtifactNodeDefinition[] = [
  { id: 'reinforced-weave', artifactId: 'wispweave-robe', name: 'Reinforced Weave', type: 'minor', branch: 'shared', pointCost: 1, requiresLevel: 2, stats: { maxHealth: 5 } },
  { id: 'hardened-thread', artifactId: 'wispweave-robe', name: 'Hardened Thread', type: 'minor', branch: 'living-bastion', pointCost: 1, requiresLevel: 3, prerequisites: ['reinforced-weave'], stats: { defense: 4 } },
  { id: 'vital-weave', artifactId: 'wispweave-robe', name: 'Vital Weave', type: 'minor', branch: 'living-bastion', pointCost: 1, requiresLevel: 4, prerequisites: ['hardened-thread'], stats: { maxHealth: 10 } },
  { id: 'heartseed-lining', artifactId: 'wispweave-robe', name: 'Heartseed Lining', type: 'major', branch: 'living-bastion', pointCost: 1, requiresLevel: 4, prerequisites: ['vital-weave'], catalyst: { itemId: 'heartseed', quantity: 1 }, requiresBossKill: 'forest-heart', stats: { healthRegen: 1 } },
  { id: 'stonebound-cloth', artifactId: 'wispweave-robe', name: 'Stonebound Cloth', type: 'minor', branch: 'living-bastion', pointCost: 1, requiresLevel: 6, prerequisites: ['heartseed-lining'], stats: { resistances: { physical: 0.05 } } },
  { id: 'greatbear-weave', artifactId: 'wispweave-robe', name: 'Greatbear Weave', type: 'major', branch: 'living-bastion', pointCost: 1, requiresLevel: 7, prerequisites: ['stonebound-cloth'], catalyst: { itemId: 'greatbear-core', quantity: 1 }, requiresBossKill: 'corrupted-greatbear', stats: { defense: 10 } },
  { id: 'edrins-deathless-weave', artifactId: 'wispweave-robe', name: "Edrin's Deathless Weave", type: 'capstone', branch: 'living-bastion', pointCost: 2, requiresLevel: 10, prerequisites: ['greatbear-weave'], catalyst: { itemId: 'edrin-remnant', quantity: 1 }, requiresBossKill: 'archmage-edrin-shade', combat: { rules: [bossRule('deathless-weave', { type: 'self-hp-below-percent', percent: 35 }, 75)] } },
  { id: 'mana-thread', artifactId: 'wispweave-robe', name: 'Mana Thread', type: 'minor', branch: 'arcane-weave', pointCost: 1, requiresLevel: 3, prerequisites: ['reinforced-weave'], stats: { maxMana: 10 } },
  { id: 'ward-stitching', artifactId: 'wispweave-robe', name: 'Ward Stitching', type: 'minor', branch: 'arcane-weave', pointCost: 1, requiresLevel: 4, prerequisites: ['mana-thread'], combat: { modifiers: [{ key: 'barrier-power-percent', value: 0.1 }] } },
  { id: 'heartseed-channel', artifactId: 'wispweave-robe', name: 'Heartseed Channel', type: 'major', branch: 'arcane-weave', pointCost: 1, requiresLevel: 4, prerequisites: ['ward-stitching'], catalyst: { itemId: 'heartseed', quantity: 1 }, requiresBossKill: 'forest-heart', combat: { modifiers: [{ key: 'barrier-received-flat', value: 10 }] } },
  { id: 'restorative-weave', artifactId: 'wispweave-robe', name: 'Restorative Weave', type: 'minor', branch: 'arcane-weave', pointCost: 1, requiresLevel: 6, prerequisites: ['heartseed-channel'], combat: { modifiers: [{ key: 'healing-done-percent', value: 0.05 }] } },
  { id: 'greatbear-arcana', artifactId: 'wispweave-robe', name: 'Greatbear Arcana', type: 'major', branch: 'arcane-weave', pointCost: 1, requiresLevel: 7, prerequisites: ['restorative-weave'], catalyst: { itemId: 'greatbear-core', quantity: 1 }, requiresBossKill: 'corrupted-greatbear', stats: { resistances: { fire: 0.1, water: 0.1, earth: 0.1, air: 0.1 } } },
  { id: 'edrins-soulweave', artifactId: 'wispweave-robe', name: "Edrin's Soulweave", type: 'capstone', branch: 'arcane-weave', pointCost: 2, requiresLevel: 10, prerequisites: ['greatbear-arcana'], catalyst: { itemId: 'edrin-remnant', quantity: 1 }, requiresBossKill: 'archmage-edrin-shade', combat: { rules: [{ id: 'soulweave', event: 'on-barrier-broken', cooldownMs: 30_000, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 40 } }] }] } },
]

const wispveilNodes: ArtifactNodeDefinition[] = [
  { id: 'arcane-sight', artifactId: 'wispveil-hood', name: 'Arcane Sight', type: 'minor', branch: 'shared', pointCost: 1, requiresLevel: 2, stats: { maxMana: 5 } },
  { id: 'deep-focus', artifactId: 'wispveil-hood', name: 'Deep Focus', type: 'minor', branch: 'arcane-insight', pointCost: 1, requiresLevel: 3, prerequisites: ['arcane-sight'], stats: { maxMana: 10 } },
  { id: 'lingering-thought', artifactId: 'wispveil-hood', name: 'Lingering Thought', type: 'minor', branch: 'arcane-insight', pointCost: 1, requiresLevel: 4, prerequisites: ['deep-focus'], combat: { modifiers: [{ key: 'status-duration-dealt-percent', value: 0.1 }] } },
  { id: 'heartmind', artifactId: 'wispveil-hood', name: 'Heartmind', type: 'major', branch: 'arcane-insight', pointCost: 1, requiresLevel: 4, prerequisites: ['lingering-thought'], catalyst: { itemId: 'heartseed', quantity: 1 }, requiresBossKill: 'forest-heart', stats: { manaRegen: 1 } },
  { id: 'rapid-thought', artifactId: 'wispveil-hood', name: 'Rapid Thought', type: 'minor', branch: 'arcane-insight', pointCost: 1, requiresLevel: 6, prerequisites: ['heartmind'], combat: { modifiers: [{ key: 'cooldown-recovery-percent', value: 0.05 }] } },
  { id: 'greatbear-clarity', artifactId: 'wispveil-hood', name: 'Greatbear Clarity', type: 'major', branch: 'arcane-insight', pointCost: 1, requiresLevel: 7, prerequisites: ['rapid-thought'], catalyst: { itemId: 'greatbear-core', quantity: 1 }, requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [{ key: 'status-duration-received-percent', value: -0.1, statusTags: ['debuff'] }] } },
  { id: 'edrins-forbidden-insight', artifactId: 'wispveil-hood', name: "Edrin's Forbidden Insight", type: 'capstone', branch: 'arcane-insight', pointCost: 2, requiresLevel: 10, prerequisites: ['greatbear-clarity'], catalyst: { itemId: 'edrin-remnant', quantity: 1 }, requiresBossKill: 'archmage-edrin-shade', stats: { cooldownRecoveryPct: 0.1, statusDurationPct: 0.1 } },
  { id: 'keen-sight', artifactId: 'wispveil-hood', name: 'Keen Sight', type: 'minor', branch: 'arcane-precision', pointCost: 1, requiresLevel: 3, prerequisites: ['arcane-sight'], stats: { critChance: 0.02 } },
  { id: 'spell-edge', artifactId: 'wispveil-hood', name: 'Spell Edge', type: 'minor', branch: 'arcane-precision', pointCost: 1, requiresLevel: 4, prerequisites: ['keen-sight'], stats: { critDamage: 0.1 } },
  { id: 'heartseeker', artifactId: 'wispveil-hood', name: 'Heartseeker', type: 'major', branch: 'arcane-precision', pointCost: 1, requiresLevel: 4, prerequisites: ['spell-edge'], catalyst: { itemId: 'heartseed', quantity: 1 }, requiresBossKill: 'forest-heart', stats: { spellPower: 5 } },
  { id: 'accelerated-casting', artifactId: 'wispveil-hood', name: 'Accelerated Casting', type: 'minor', branch: 'arcane-precision', pointCost: 1, requiresLevel: 6, prerequisites: ['heartseeker'], combat: { modifiers: [{ key: 'cooldown-recovery-percent', value: 0.05 }] } },
  { id: 'greatbear-focus', artifactId: 'wispveil-hood', name: 'Greatbear Focus', type: 'major', branch: 'arcane-precision', pointCost: 1, requiresLevel: 7, prerequisites: ['accelerated-casting'], catalyst: { itemId: 'greatbear-core', quantity: 1 }, requiresBossKill: 'corrupted-greatbear', stats: { critChance: 0.03 } },
  { id: 'edrins-perfect-moment', artifactId: 'wispveil-hood', name: "Edrin's Perfect Moment", type: 'capstone', branch: 'arcane-precision', pointCost: 2, requiresLevel: 10, prerequisites: ['greatbear-focus'], catalyst: { itemId: 'edrin-remnant', quantity: 1 }, requiresBossKill: 'archmage-edrin-shade', stats: { critChance: 0.05, critDamage: 0.15 } },
]
export const ARTIFACTS: Partial<Record<ArtifactId, ArtifactDefinition>> = {
  'ember-staff': {
    id: 'ember-staff', itemId: 'ember-staff', tier: 1, maxLevel: 10, coreStatsByLevel: emberStats,
    forge: { ingredients: [material('fire-fragment', 20), material('wisp-essence', 10), material('thorn-fiber', 10), material('grove-bark', 5), material('life-essence', 24)] },
    branches: [
      { id: 'burning', name: 'Burning', description: 'Persistent Fire damage and Burning.' },
      { id: 'direct-fire', name: 'Direct Fire', description: 'Direct Fire hits, Criticals, and spell tempo.' },
    ],
    upgrades: emberUpgrades, nodes: emberNodes,
  },
  'tideglass-wand': {
    id: 'tideglass-wand', itemId: 'tideglass-wand', tier: 1, maxLevel: 10, coreStatsByLevel: tideglassStats,
    forge: { ingredients: [material('water-fragment', 20), material('wisp-essence', 7), material('rootstone-shard', 8), material('grove-bark', 5), material('life-essence', 25)] },
    upgrades: tideglassUpgrades,
    branches: [
      { id: 'tidal-ward', name: 'Tidal Ward', description: 'Water Barrier strength, Mana, and defensive spell support.' },
      { id: 'frozen-current', name: 'Frozen Current', description: 'Direct Water damage, Chill interaction, and spell tempo.' },
    ],
    nodes: tideglassNodes,
  },
  'stoneheart-scepter': {
    id: 'stoneheart-scepter', itemId: 'stoneheart-scepter', tier: 1, maxLevel: 10, coreStatsByLevel: stoneheartStats,
    forge: { ingredients: [material('earth-fragment', 20), material('rootstone-shard', 10), material('grove-bark', 10), material('life-essence', 25)] },
    upgrades: stoneheartUpgrades,
    branches: [
      { id: 'living-bastion', name: 'Living Bastion', description: 'Defense, regeneration, resistance, and emergency Barrier.' },
      { id: 'crushing-earth', name: 'Crushing Earth', description: 'Heavy direct Earth Spell hits and conditional damage.' },
    ],
    nodes: stoneheartNodes,
  },
  'windthread-wand': {
    id: 'windthread-wand', itemId: 'windthread-wand', tier: 1, maxLevel: 10, coreStatsByLevel: windthreadStats,
    forge: { ingredients: [material('air-fragment', 20), material('wisp-essence', 5), material('thorn-fiber', 10), material('grove-bark', 5), material('life-essence', 25)] },
    upgrades: windthreadUpgrades,
    branches: [
      { id: 'tempest-tempo', name: 'Tempest Tempo', description: 'Cooldown, Mana efficiency, sustain, and high-Mana Air damage.' },
      { id: 'storm-precision', name: 'Storm Precision', description: 'Direct Air Critical damage and Debuff interaction.' },
    ],
    nodes: windthreadNodes,
  },
  'wispweave-robe': {
    id: 'wispweave-robe', itemId: 'wispweave-robe', tier: 1, maxLevel: 10, coreStatsByLevel: wispweaveStats,
    forge: { ingredients: [material('wisp-essence', 15), material('thorn-fiber', 15), material('grove-bark', 10), material('rootstone-shard', 10), material('life-essence', 25)] },
    upgrades: wispweaveUpgrades,
    branches: [
      { id: 'living-bastion', name: 'Living Bastion', description: 'Health, Defense, regeneration, and emergency survival.' },
      { id: 'arcane-weave', name: 'Arcane Weave', description: 'Mana, Barrier, Healing, and elemental resistance.' },
    ],
    nodes: wispweaveNodes,
  },
  'wispveil-hood': {
    id: 'wispveil-hood', itemId: 'wispveil-hood', tier: 1, maxLevel: 10, coreStatsByLevel: wispveilStats,
    forge: { ingredients: [material('wisp-essence', 10), material('thorn-fiber', 10), material('rootstone-shard', 5), material('grove-bark', 5), material('prismatic-fragment', 5), material('life-essence', 25)] },
    upgrades: wispveilUpgrades,
    branches: [
      { id: 'arcane-insight', name: 'Arcane Insight', description: 'Mana, Status Duration, cooldowns, and hostile-status protection.' },
      { id: 'arcane-precision', name: 'Arcane Precision', description: 'Critical chance, Critical damage, Spell Power, and casting speed.' },
    ],
    nodes: wispveilNodes,
  },
}
export const getArtifactDefinition = (itemId: ItemId) => ARTIFACTS[itemId]

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
        if (!(stats.basicDamage && stats.basicDamage > 0)) errors.push(`${definition.id}: weapon Artifact requires positive basicDamage at level ${level}`)
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
