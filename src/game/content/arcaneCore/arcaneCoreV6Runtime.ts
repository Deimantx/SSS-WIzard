import type { ArcaneCoreV6ImplementationCategory, ArcaneCoreResolvedEffects, EquipmentStats } from '../../types'
import type { CombatCondition, CombatModifier, CombatTrigger } from '../../systems/combat/combatTypes'
import type { ArcaneCoreV6CatalogEntry } from './arcaneCoreV6Catalog'
import { ARCANE_CORE_V6_CATALOG } from './arcaneCoreV6Catalog'
import { modifier } from './arcaneCoreNodeFactory'

type StaticEffect =
  | { type: 'stat'; key: Exclude<keyof EquipmentStats, 'resistances'>; perRank: number }
  | { type: 'modifier'; key: CombatModifier['key']; perRank: number; actor?: CombatModifier['actor']; condition?: CombatCondition }

const mechanicId = (branch: ArcaneCoreV6CatalogEntry['branch'], ring: number, slot: ArcaneCoreV6CatalogEntry['slot']) => `${branch}:r${ring}:${slot}`
const stat = (key: Exclude<keyof EquipmentStats, 'resistances'>, perRank: number): StaticEffect => ({ type: 'stat', key, perRank })
const staticModifier = (key: CombatModifier['key'], perRank: number, options: Pick<Extract<StaticEffect, { type: 'modifier' }>, 'actor' | 'condition'> = {}): StaticEffect => ({ type: 'modifier', key, perRank, ...options })

/** Structured authored V6 stat mechanics keyed by stable branch/ring/slot identity. */
const STATIC_EFFECTS: Record<string, StaticEffect[]> = {
  [mechanicId('power', 1, 'S1')]: [stat('spellPowerPct', 0.001)], [mechanicId('power', 1, 'S2')]: [staticModifier('spell-damage-percent', 0.0025)],
  [mechanicId('power', 2, 'S1')]: [stat('critChance', 0.0015)], [mechanicId('power', 2, 'S2')]: [stat('critDamage', 0.015)],
  [mechanicId('power', 3, 'S1')]: [stat('spellPowerPct', 0.002)], [mechanicId('power', 3, 'S2')]: [staticModifier('spell-damage-percent', 0.005)],
  [mechanicId('power', 4, 'S1')]: [stat('cooldownRecoveryPct', 0.005)], [mechanicId('power', 4, 'S2')]: [stat('spellPowerPct', 0.003)],
  [mechanicId('power', 5, 'S1')]: [stat('damageOverTimePct', 0.015)], [mechanicId('power', 5, 'S2')]: [stat('spellPowerPct', 0.004)],
  [mechanicId('power', 6, 'S1')]: [stat('spellPowerPct', 0.005)], [mechanicId('power', 6, 'S2')]: [staticModifier('action-speed-percent', 0.005)],
  [mechanicId('power', 7, 'S1')]: [stat('spellPowerPct', 0.0065)], [mechanicId('power', 7, 'S2')]: [stat('critDamage', 0.04)],
  [mechanicId('power', 8, 'S1')]: [stat('spellPowerPct', 0.008)], [mechanicId('power', 8, 'S2')]: [stat('critChance', 0.005)],

  [mechanicId('vitality', 1, 'S1')]: [stat('maxHealthPct', 0.005)], [mechanicId('vitality', 1, 'S2')]: [stat('defense', 1)],
  [mechanicId('vitality', 2, 'S1')]: [staticModifier('damage-taken-percent', -0.0025)], [mechanicId('vitality', 2, 'S2')]: [stat('healthRegen', 0.2)],
  [mechanicId('vitality', 3, 'S1')]: [stat('barrierPowerPct', 0.01)], [mechanicId('vitality', 3, 'S2')]: [stat('healingDonePct', 0.01)],
  [mechanicId('vitality', 4, 'S1')]: [stat('maxHealthPct', 0.0125)], [mechanicId('vitality', 4, 'S2')]: [stat('defense', 3)],
  [mechanicId('vitality', 5, 'S1')]: [stat('defense', 2.5)], [mechanicId('vitality', 5, 'S2')]: [stat('barrierPowerPct', 0.015)],
  [mechanicId('vitality', 6, 'S1')]: [stat('healthRegen', 0.5)], [mechanicId('vitality', 6, 'S2')]: [staticModifier('healing-received-percent', 0.015)],
  [mechanicId('vitality', 7, 'S1')]: [stat('maxHealthPct', 0.02)], [mechanicId('vitality', 7, 'S2')]: [stat('healthRegen', 0.75)],
  [mechanicId('vitality', 8, 'S1')]: [stat('defense', 4)], [mechanicId('vitality', 8, 'S2')]: [stat('barrierPowerPct', 0.02)],

  [mechanicId('focus', 1, 'S1')]: [stat('maxManaPct', 0.005)], [mechanicId('focus', 1, 'S2')]: [staticModifier('mana-regen-percent', 0.01)],
  [mechanicId('focus', 2, 'S1')]: [stat('manaCostReductionPct', 0.0035)], [mechanicId('focus', 2, 'S2')]: [stat('maxFocus', 1)],
  [mechanicId('focus', 3, 'S1')]: [stat('maxManaPct', 0.01)], [mechanicId('focus', 3, 'S2')]: [stat('focusEfficiencyPct', 0.01)],
  [mechanicId('focus', 4, 'S1')]: [staticModifier('mana-regen-percent', 0.025)], [mechanicId('focus', 4, 'S2')]: [stat('manaCostReductionPct', 0.0065)],
  [mechanicId('focus', 5, 'S1')]: [stat('maxFocus', 1)], [mechanicId('focus', 5, 'S2')]: [stat('focusEfficiencyPct', 0.0125)],
  [mechanicId('focus', 6, 'S1')]: [stat('maxManaPct', 0.0175)], [mechanicId('focus', 6, 'S2')]: [staticModifier('mana-regen-percent', 0.04)],
  [mechanicId('focus', 7, 'S1')]: [stat('maxFocus', 1)], [mechanicId('focus', 7, 'S2')]: [stat('manaCostReductionPct', 0.0125)],
  [mechanicId('focus', 8, 'S1')]: [staticModifier('mana-regen-percent', 0.06)], [mechanicId('focus', 8, 'S2')]: [stat('maxFocus', 1)],

  [mechanicId('control', 1, 'S1')]: [stat('cooldownRecoveryPct', 0.005)], [mechanicId('control', 1, 'S2')]: [staticModifier('action-speed-percent', 0.0025)],
  [mechanicId('control', 2, 'S1')]: [stat('statusDurationPct', 0.015)], [mechanicId('control', 2, 'S2')]: [staticModifier('damage-dealt-percent', -0.005, { actor: 'enemy', condition: { type: 'self-negative-status-count-at-least', count: 1 } })],
  [mechanicId('control', 3, 'S1')]: [stat('cooldownRecoveryPct', 0.01)], [mechanicId('control', 3, 'S2')]: [stat('statusDurationPct', 0.02)],
  [mechanicId('control', 4, 'S1')]: [staticModifier('action-speed-percent', 0.006)], [mechanicId('control', 4, 'S2')]: [stat('statusDurationPct', 0.025)],
  [mechanicId('control', 5, 'S1')]: [stat('cooldownRecoveryPct', 0.015)], [mechanicId('control', 5, 'S2')]: [staticModifier('action-speed-percent', 0.0075)],
  [mechanicId('control', 6, 'S1')]: [stat('cooldownRecoveryPct', 0.0175)], [mechanicId('control', 6, 'S2')]: [staticModifier('action-speed-percent', 0.01)],
  [mechanicId('control', 7, 'S1')]: [stat('statusDurationPct', 0.05)], [mechanicId('control', 7, 'S2')]: [staticModifier('action-speed-percent', 0.0125)],
  [mechanicId('control', 8, 'S1')]: [stat('cooldownRecoveryPct', 0.025)], [mechanicId('control', 8, 'S2')]: [staticModifier('action-speed-percent', 0.015)],
}

export interface ArcaneCoreV6ImplementationDefinition {
  mechanicId: string
  displayName: string
  category: ArcaneCoreV6ImplementationCategory
  staticEffects: StaticEffect[]
  /** Structured runtime contract consumed by the V6 family adapters. */
  behavior?: ArcaneCoreV6RuntimeBehavior
}

export interface ArcaneCoreV6RuntimeBehavior {
  event: CombatTrigger
  operation: 'cast-cycle' | 'conditional-cast-modifier' | 'combat-event-trigger' | 'resource-conversion' | 'loadout-modifier' | 'manual-queue-modifier' | 'encounter-lifecycle' | 'timeline-control' | 'survival-guard'
  target: 'spell' | 'player' | 'enemy' | 'timeline'
  rankValues: readonly number[]
  cadence?: number
  cooldownMs?: number
  oncePerEncounter?: boolean
  oncePerDungeonRun?: boolean
}

const SURVIVAL_IDS = new Set([
  'vitality:r1:M', 'vitality:r4:M', 'vitality:r7:M', 'vitality:r2:S6', 'vitality:r3:S3', 'vitality:r4:S3', 'vitality:r4:S4', 'vitality:r4:S7', 'vitality:r4:S8', 'vitality:r7:S3', 'vitality:r7:S7', 'vitality:r8:S5',
])
const TIMELINE_IDS = new Set([
  'control:r1:S3', 'control:r1:S6', 'control:r1:S8', 'control:r1:M', 'control:r2:S7', 'control:r2:M', 'control:r3:S8', 'control:r4:S4', 'control:r4:S8', 'control:r5:S4', 'control:r5:S8', 'control:r5:M', 'control:r6:S5', 'control:r6:S6', 'control:r6:S7', 'control:r6:S8', 'control:r7:S3', 'control:r7:S4', 'control:r7:S8', 'control:r7:M', 'control:r8:S3', 'control:r8:S4', 'control:r8:S5', 'control:r8:S7', 'control:r8:M',
])

const categoryFor = (entry: ArcaneCoreV6CatalogEntry): ArcaneCoreV6ImplementationCategory => {
  if (entry.type.includes('STAT')) return STATIC_EFFECTS[entry.mechanicId]?.some((effect) => effect.type === 'modifier') ? 'STATIC_MODIFIER' : 'STATIC_STAT'
  if (SURVIVAL_IDS.has(entry.mechanicId)) return 'SURVIVAL'
  if (TIMELINE_IDS.has(entry.mechanicId)) return 'TIMELINE'
  if (entry.type.includes('LOADOUT')) return 'LOADOUT'
  if (entry.type.includes('MANUAL')) return 'MANUAL_QUEUE'
  if (entry.type.includes('CONVERSION')) return 'RESOURCE_CONVERSION'
  if (entry.type.includes('CYCLE')) return 'CAST_COMMIT'
  if (entry.type.includes('CONDITION')) return 'CAST_MODIFIER'
  if (entry.type.includes('TRIGGER')) return 'COMBAT_EVENT'
  return 'ENCOUNTER_LIFECYCLE'
}

const behaviorFor = (entry: ArcaneCoreV6CatalogEntry, category: ArcaneCoreV6ImplementationCategory): ArcaneCoreV6RuntimeBehavior | undefined => {
  if (category === 'STATIC_STAT' || category === 'STATIC_MODIFIER') return undefined
  if (category === 'SURVIVAL') return { event: 'on-damage-taken', operation: 'survival-guard', target: 'player', rankValues: [1, 2, 3, 4, 5], oncePerEncounter: entry.mechanicId !== 'vitality:r4:M' && entry.mechanicId !== 'vitality:r7:M', oncePerDungeonRun: entry.mechanicId === 'vitality:r4:M' || entry.mechanicId === 'vitality:r7:M' }
  if (category === 'TIMELINE') return { event: 'on-status-applied', operation: 'timeline-control', target: 'timeline', rankValues: [1, 2, 3, 4, 5], cooldownMs: entry.mechanicId === 'control:r2:M' ? 5000 : undefined }
  if (category === 'LOADOUT') return { event: 'on-spell-cast', operation: 'loadout-modifier', target: 'spell', rankValues: [1, 2, 3, 4, 5] }
  if (category === 'MANUAL_QUEUE') return { event: 'on-spell-cast', operation: 'manual-queue-modifier', target: 'spell', rankValues: [1, 2, 3, 4, 5] }
  if (category === 'RESOURCE_CONVERSION') return { event: 'on-spell-cast', operation: 'resource-conversion', target: 'player', rankValues: [1, 2, 3, 4, 5] }
  if (category === 'CAST_COMMIT') return { event: 'on-spell-cast', operation: 'cast-cycle', target: 'spell', rankValues: [1, 2, 3, 4, 5], cadence: entry.mechanicId.endsWith(':M') ? 4 : 3 }
  if (category === 'CAST_MODIFIER') return { event: 'on-spell-cast', operation: 'conditional-cast-modifier', target: 'spell', rankValues: [1, 2, 3, 4, 5] }
  if (category === 'COMBAT_EVENT') return { event: 'on-spell-hit', operation: 'combat-event-trigger', target: 'player', rankValues: [1, 2, 3, 4, 5] }
  return { event: 'on-combat-start', operation: 'encounter-lifecycle', target: 'player', rankValues: [1, 2, 3, 4, 5], oncePerEncounter: true }
}

export const getArcaneCoreV6ImplementationDefinition = (entry: ArcaneCoreV6CatalogEntry): ArcaneCoreV6ImplementationDefinition => ({
  mechanicId: entry.mechanicId,
  displayName: entry.name,
  category: categoryFor(entry),
  staticEffects: STATIC_EFFECTS[entry.mechanicId] ?? [],
  behavior: behaviorFor(entry, categoryFor(entry)),
})

export const ARCANE_CORE_V6_IMPLEMENTATION_REGISTRY = Object.fromEntries(
  Object.values(ARCANE_CORE_V6_CATALOG).flatMap((rings) => Object.values(rings).flatMap((entries) => entries.map((entry) => [entry.mechanicId, getArcaneCoreV6ImplementationDefinition(entry)]))),
) as Record<string, ArcaneCoreV6ImplementationDefinition>

export const getArcaneCoreV6CatalogEntries = () => Object.values(ARCANE_CORE_V6_CATALOG).flatMap((rings) => Object.values(rings).flatMap((entries) => entries))

const SUPPORTED_OPERATIONS = new Set<ArcaneCoreV6RuntimeBehavior['operation']>(['cast-cycle', 'conditional-cast-modifier', 'combat-event-trigger', 'resource-conversion', 'loadout-modifier', 'manual-queue-modifier', 'encounter-lifecycle', 'timeline-control', 'survival-guard'])

/** Fails loudly when a catalog entry has no executable structured behavior. */
export const validateArcaneCoreV6ImplementationCoverage = () => getArcaneCoreV6CatalogEntries().flatMap((entry) => {
  const implementation = ARCANE_CORE_V6_IMPLEMENTATION_REGISTRY[entry.mechanicId]
  if (!implementation) return [`${entry.branch}/Ring ${entry.ring}/${entry.slot} ${entry.mechanicId} ${entry.name} has no V6 runtime implementation`]
  if (entry.type.includes('STAT') && implementation.staticEffects.length === 0) return [`${entry.branch}/Ring ${entry.ring}/${entry.slot} ${entry.mechanicId} ${entry.name} has no structured stat implementation`]
  if (!entry.type.includes('STAT') && (!implementation.behavior || !SUPPORTED_OPERATIONS.has(implementation.behavior.operation) || implementation.behavior.rankValues.length !== 5)) return [`${entry.branch}/Ring ${entry.ring}/${entry.slot} ${entry.mechanicId} ${entry.name} has no executable structured V6 behavior`]
  return []
}).concat(Object.keys(ARCANE_CORE_V6_IMPLEMENTATION_REGISTRY).filter((mechanicId) => !getArcaneCoreV6CatalogEntries().some((entry) => entry.mechanicId === mechanicId)).map((mechanicId) => `orphan V6 implementation ${mechanicId}`))

export const resolveArcaneCoreV6Effects = (entry: ArcaneCoreV6CatalogEntry, rank: number): ArcaneCoreResolvedEffects => {
  const safeRank = Math.max(1, Math.min(5, Math.floor(rank)))
  const implementation = getArcaneCoreV6ImplementationDefinition(entry)
  const stats: EquipmentStats = {}
  const modifiers: NonNullable<ArcaneCoreResolvedEffects['modifiers']> = []
  implementation.staticEffects.forEach((effect) => {
    if (effect.type === 'stat') stats[effect.key] = (stats[effect.key] ?? 0) + effect.perRank * safeRank
    else modifiers.push(modifier(effect.key, effect.perRank * safeRank, effect.condition, effect.actor))
  })
  return {
    ...(Object.keys(stats).length ? { stats } : {}),
    ...(modifiers.length ? { modifiers } : {}),
    special: [{ type: 'v6-mechanic', mechanicId: implementation.mechanicId, displayName: implementation.displayName, rank: safeRank, category: implementation.category }],
  }
}
