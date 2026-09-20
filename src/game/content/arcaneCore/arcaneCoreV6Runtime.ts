import type { ArcaneCoreV6ImplementationCategory, ArcaneCoreResolvedEffects, EquipmentStats } from '../../types'
import type { CombatCondition, CombatModifier } from '../../systems/combat/combatTypes'
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

const categoryFor = (entry: ArcaneCoreV6CatalogEntry): ArcaneCoreV6ImplementationCategory => {
  if (entry.type.includes('STAT')) return STATIC_EFFECTS[entry.mechanicId]?.some((effect) => effect.type === 'modifier') ? 'STATIC_MODIFIER' : 'STATIC_STAT'
  if (entry.type.includes('LOADOUT')) return 'LOADOUT'
  if (entry.type.includes('MANUAL')) return 'MANUAL_QUEUE'
  if (entry.type.includes('CONVERSION')) return 'RESOURCE_CONVERSION'
  if (entry.type.includes('CYCLE')) return 'CAST_COMMIT'
  if (entry.type.includes('CONDITION')) return 'CAST_MODIFIER'
  if (entry.type.includes('SURVIVAL') || /Death|Undying|Aegis|Immortal|Fortress/i.test(entry.name)) return 'SURVIVAL'
  if (/delay|timer|stasis|timeline|lockdown|time/i.test(entry.description)) return 'TIMELINE'
  return entry.type.includes('TRIGGER') ? 'COMBAT_EVENT' : 'ENCOUNTER_LIFECYCLE'
}

export interface ArcaneCoreV6ImplementationDefinition {
  mechanicId: string
  displayName: string
  category: ArcaneCoreV6ImplementationCategory
  staticEffects: StaticEffect[]
  handlerId: string
}

export const getArcaneCoreV6ImplementationDefinition = (entry: ArcaneCoreV6CatalogEntry): ArcaneCoreV6ImplementationDefinition => ({
  mechanicId: entry.mechanicId,
  displayName: entry.name,
  category: categoryFor(entry),
  staticEffects: STATIC_EFFECTS[entry.mechanicId] ?? [],
  handlerId: `arcane-core-v6:${categoryFor(entry).toLowerCase()}`,
})

export const ARCANE_CORE_V6_IMPLEMENTATION_REGISTRY = Object.fromEntries(
  Object.values(ARCANE_CORE_V6_CATALOG).flatMap((rings) => Object.values(rings).flatMap((entries) => entries.map((entry) => [entry.mechanicId, getArcaneCoreV6ImplementationDefinition(entry)]))),
) as Record<string, ArcaneCoreV6ImplementationDefinition>

export const getArcaneCoreV6CatalogEntries = () => Object.values(ARCANE_CORE_V6_CATALOG).flatMap((rings) => Object.values(rings).flatMap((entries) => entries))

/** Fails loudly when a catalog entry has no structured stat or runtime handler. */
export const validateArcaneCoreV6ImplementationCoverage = () => getArcaneCoreV6CatalogEntries().flatMap((entry) => {
  const implementation = ARCANE_CORE_V6_IMPLEMENTATION_REGISTRY[entry.mechanicId]
  if (!implementation) return [`${entry.branch}/Ring ${entry.ring}/${entry.slot} ${entry.mechanicId} ${entry.name} has no V6 runtime implementation`]
  if (entry.type.includes('STAT') && implementation.staticEffects.length === 0) return [`${entry.branch}/Ring ${entry.ring}/${entry.slot} ${entry.mechanicId} ${entry.name} has no structured stat implementation`]
  if (!entry.type.includes('STAT') && !implementation.handlerId) return [`${entry.branch}/Ring ${entry.ring}/${entry.slot} ${entry.mechanicId} ${entry.name} has no V6 runtime handler`]
  return []
})

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
