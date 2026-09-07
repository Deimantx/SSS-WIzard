import type { ArtifactId, EquipmentStats, ItemId, MonsterId } from '../../types'
import type { CombatModifier, CombatTriggerRule } from '../../systems/combat/combatTypes'

export interface ArtifactForgeDefinition { ingredients: { itemId: ItemId; quantity: number }[] }
export interface ArtifactLevelUpgradeDefinition { fromLevel: number; toLevel: number; ingredients: { itemId: ItemId; quantity: number }[] }
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
  nodes: ArtifactNodeDefinition[]
}

const upgrade = (fromLevel: number, ingredients: ArtifactLevelUpgradeDefinition['ingredients']) => ({ fromLevel, toLevel: fromLevel + 1, ingredients })
const fire = (value: number) => ({ itemId: 'fire-fragment' as ItemId, quantity: value })
const emberNodes: ArtifactNodeDefinition[] = [
  { id: 'arcane-kindling', artifactId: 'ember-staff', name: 'Arcane Kindling', type: 'minor', branch: 'shared', pointCost: 1, requiresLevel: 2, combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.05, originSourceKinds: ['spell'], damageTypes: ['fire'] }] } },
  { id: 'cinder-memory', artifactId: 'ember-staff', name: 'Cinder Memory', type: 'minor', branch: 'burning', pointCost: 1, requiresLevel: 3, prerequisites: ['arcane-kindling'], combat: { modifiers: [{ key: 'damage-over-time-percent', value: 0.1 }] } },
  { id: 'lingering-flame', artifactId: 'ember-staff', name: 'Lingering Flame', type: 'minor', branch: 'burning', pointCost: 1, requiresLevel: 4, prerequisites: ['cinder-memory'], combat: { modifiers: [{ key: 'status-duration-dealt-percent', value: 0.1 }] } },
  { id: 'heartfed-embers', artifactId: 'ember-staff', name: 'Heartfed Embers', type: 'major', branch: 'burning', pointCost: 1, requiresLevel: 4, prerequisites: ['lingering-flame'], catalyst: { itemId: 'heartseed', quantity: 1 }, requiresBossKill: 'forest-heart', combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.1, originSourceKinds: ['spell'], damageTypes: ['fire'], condition: { type: 'target-has-status-tag', tag: 'debuff' } }] } },
  { id: 'charred-continuance', artifactId: 'ember-staff', name: 'Charred Continuance', type: 'minor', branch: 'burning', pointCost: 1, requiresLevel: 6, prerequisites: ['heartfed-embers'], combat: { modifiers: [{ key: 'damage-over-time-percent', value: 0.1 }] } },
  { id: 'corrupted-combustion', artifactId: 'ember-staff', name: 'Corrupted Combustion', type: 'major', branch: 'burning', pointCost: 1, requiresLevel: 7, prerequisites: ['charred-continuance'], catalyst: { itemId: 'greatbear-core', quantity: 1 }, requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [{ key: 'damage-over-time-percent', value: 0.15, originSourceKinds: ['spell'], damageTypes: ['fire'] }] } },
  { id: 'edrins-blackflame', artifactId: 'ember-staff', name: "Edrin's Blackflame", type: 'capstone', branch: 'burning', pointCost: 2, requiresLevel: 10, prerequisites: ['corrupted-combustion'], catalyst: { itemId: 'edrin-remnant', quantity: 1 }, requiresBossKill: 'archmage-edrin-shade', combat: { modifiers: [{ key: 'damage-over-time-percent', value: 0.25, originSourceKinds: ['spell'], damageTypes: ['fire'] }] } },
  { id: 'focused-flame', artifactId: 'ember-staff', name: 'Focused Flame', type: 'minor', branch: 'direct-fire', pointCost: 1, requiresLevel: 3, prerequisites: ['arcane-kindling'], combat: { modifiers: [{ key: 'crit-chance', value: 0.03, originSourceKinds: ['spell'], damageTypes: ['fire'], sourceTags: ['direct'] }] } },
  { id: 'flame-precision', artifactId: 'ember-staff', name: 'Flame Precision', type: 'minor', branch: 'direct-fire', pointCost: 1, requiresLevel: 4, prerequisites: ['focused-flame'], combat: { modifiers: [{ key: 'crit-damage', value: 0.15, originSourceKinds: ['spell'], damageTypes: ['fire'], sourceTags: ['direct'] }] } },
  { id: 'heartfire-focus', artifactId: 'ember-staff', name: 'Heartfire Focus', type: 'major', branch: 'direct-fire', pointCost: 1, requiresLevel: 4, prerequisites: ['flame-precision'], catalyst: { itemId: 'heartseed', quantity: 1 }, requiresBossKill: 'forest-heart', combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.1, originSourceKinds: ['spell'], damageTypes: ['fire'], sourceTags: ['direct'], condition: { type: 'target-has-status-tag', tag: 'debuff' } }] } },
  { id: 'blazing-tempo', artifactId: 'ember-staff', name: 'Blazing Tempo', type: 'minor', branch: 'direct-fire', pointCost: 1, requiresLevel: 6, prerequisites: ['heartfire-focus'], stats: { cooldownRecoveryPct: 0.1 } },
  { id: 'corrupted-burst', artifactId: 'ember-staff', name: 'Corrupted Burst', type: 'major', branch: 'direct-fire', pointCost: 1, requiresLevel: 7, prerequisites: ['blazing-tempo'], catalyst: { itemId: 'greatbear-core', quantity: 1 }, requiresBossKill: 'corrupted-greatbear', combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.15, originSourceKinds: ['spell'], damageTypes: ['fire'], sourceTags: ['direct'], condition: { type: 'target-has-status-tag', tag: 'debuff' } }] } },
  { id: 'edrins-inferno', artifactId: 'ember-staff', name: "Edrin's Inferno", type: 'capstone', branch: 'direct-fire', pointCost: 2, requiresLevel: 10, prerequisites: ['corrupted-burst'], catalyst: { itemId: 'edrin-remnant', quantity: 1 }, requiresBossKill: 'archmage-edrin-shade', combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.25, originSourceKinds: ['spell'], damageTypes: ['fire'], sourceTags: ['direct'], condition: { type: 'target-has-status-tag', tag: 'debuff' } }] } },
]

const emberStats: Record<number, EquipmentStats> = { 1: { basicDamage: 5, spellPower: 16 }, 2: { basicDamage: 6, spellPower: 20 }, 3: { basicDamage: 7, spellPower: 24 }, 4: { basicDamage: 8, spellPower: 29 }, 5: { basicDamage: 9, spellPower: 35 }, 6: { basicDamage: 10, spellPower: 41 }, 7: { basicDamage: 11, spellPower: 48 }, 8: { basicDamage: 13, spellPower: 56 }, 9: { basicDamage: 15, spellPower: 65 }, 10: { basicDamage: 17, spellPower: 75 } }
export const ARTIFACTS: Partial<Record<ArtifactId, ArtifactDefinition>> = {
  'ember-staff': {
    id: 'ember-staff', itemId: 'ember-staff', tier: 1, maxLevel: 10, coreStatsByLevel: emberStats,
    forge: { ingredients: [fire(20), { itemId: 'wisp-essence', quantity: 20 }, { itemId: 'life-essence', quantity: 100 }] },
    upgrades: [upgrade(1, [fire(50)]), upgrade(2, [fire(100), { itemId: 'wisp-essence', quantity: 20 }, { itemId: 'life-essence', quantity: 20 }]), upgrade(3, [fire(200), { itemId: 'wisp-essence', quantity: 40 }, { itemId: 'grove-bark', quantity: 10 }, { itemId: 'life-essence', quantity: 100 }]), upgrade(4, [fire(300), { itemId: 'prismatic-fragment', quantity: 20 }, { itemId: 'predator-fang', quantity: 30 }, { itemId: 'life-essence', quantity: 200 }]), upgrade(5, [fire(500), { itemId: 'prismatic-fragment', quantity: 35 }, { itemId: 'predator-hide', quantity: 40 }, { itemId: 'corrupted-beast-essence', quantity: 20 }, { itemId: 'life-essence', quantity: 350 }]), upgrade(6, [fire(750), { itemId: 'prismatic-fragment', quantity: 55 }, { itemId: 'predator-fang', quantity: 60 }, { itemId: 'corrupted-beast-essence', quantity: 40 }, { itemId: 'life-essence', quantity: 600 }]), upgrade(7, [fire(1000), { itemId: 'prismatic-fragment', quantity: 80 }, { itemId: 'ossuary-remnant', quantity: 50 }, { itemId: 'life-essence', quantity: 800 }]), upgrade(8, [fire(1650), { itemId: 'prismatic-fragment', quantity: 120 }, { itemId: 'soul-residue', quantity: 70 }, { itemId: 'graveglass-shard', quantity: 30 }, { itemId: 'life-essence', quantity: 1100 }]), upgrade(9, [fire(2750), { itemId: 'prismatic-fragment', quantity: 180 }, { itemId: 'soul-residue', quantity: 100 }, { itemId: 'graveglass-shard', quantity: 50 }, { itemId: 'ossuary-remnant', quantity: 80 }, { itemId: 'life-essence', quantity: 1500 }])], nodes: emberNodes,
  },
}
export const getArtifactDefinition = (itemId: ItemId) => ARTIFACTS[itemId]
