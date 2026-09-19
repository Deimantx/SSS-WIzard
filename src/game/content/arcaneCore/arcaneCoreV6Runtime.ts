import type { ArcaneCoreResolvedEffects, EquipmentStats } from '../../types'
import type { ArcaneCoreV6CatalogEntry } from './arcaneCoreV6Catalog'
import { modifier } from './arcaneCoreNodeFactory'

const firstNumber = (text: string) => Number(text.match(/[-+]?\d+(?:\.\d+)?/)?.[0] ?? 0)
const firstPercent = (text: string) => firstNumber(text) / 100

/**
 * Shared V6 authored-effect adapter. Stat nodes resolve to the existing
 * derived-stat/modifier pipeline; interaction-heavy nodes expose a typed,
 * inspectable primitive for the combat runtime to consume without a node-id
 * switchboard.
 */
export const resolveArcaneCoreV6Effects = (entry: ArcaneCoreV6CatalogEntry, rank: number): ArcaneCoreResolvedEffects => {
  const safeRank = Math.max(1, Math.min(5, Math.floor(rank)))
  const description = entry.description
  const effects: ArcaneCoreResolvedEffects = { special: [{ type: 'v6-generic', key: entry.name, value: safeRank, scope: `${entry.branch}:${entry.ring}:${entry.slot}` }] }
  if (!entry.type.includes('STAT')) return effects
  const stats: EquipmentStats = {}
  const perRank = firstPercent(description)
  if (description.includes('Spell Power')) stats.spellPowerPct = perRank * safeRank
  else if (description.includes('Max Health')) stats.maxHealthPct = perRank * safeRank
  else if (description.includes('Max Mana')) stats.maxManaPct = perRank * safeRank
  else if (description.includes('Crit Damage')) stats.critDamage = perRank * safeRank
  else if (description.includes('Crit Chance')) stats.critChance = description.includes('percentage points') || description.includes(' pp') ? firstNumber(description) / 100 * safeRank : perRank * safeRank
  else if (description.includes('Damage over Time')) stats.damageOverTimePct = perRank * safeRank
  else if (description.includes('Barrier Power')) stats.barrierPowerPct = perRank * safeRank
  else if (description.includes('Healing Done')) stats.healingDonePct = perRank * safeRank
  else if (description.includes('Healing Received')) effects.modifiers = [modifier('healing-received-percent', perRank * safeRank)]
  else if (description.includes('Status Duration')) stats.statusDurationPct = perRank * safeRank
  else if (description.includes('Spell Mana Cost')) stats.manaCostReductionPct = Math.abs(perRank) * safeRank
  else if (description.includes('Max Focus')) stats.maxFocus = firstNumber(description) * safeRank
  else if (description.includes('Defense')) stats.defense = firstNumber(description) * safeRank
  else if (description.includes('Health Regen')) stats.healthRegen = firstNumber(description) * safeRank
  else if (description.includes('Mana Regen') && !description.includes('%')) stats.manaRegen = firstNumber(description) * safeRank
  else if (description.includes('Cooldown Recovery')) stats.cooldownRecoveryPct = perRank * safeRank
  if (Object.keys(stats).length) effects.stats = stats
  if (description.includes('Action Speed')) effects.modifiers = [modifier('action-speed-percent', perRank * safeRank)]
  if (description.includes('Damage Taken')) effects.modifiers = [modifier('damage-taken-percent', perRank * safeRank)]
  if (description.includes('Damage Dealt')) effects.modifiers = [modifier('damage-dealt-percent', perRank * safeRank)]
  if (description.includes('Spell Damage')) effects.modifiers = [modifier('spell-damage-percent', perRank * safeRank, undefined, 'player')]
  if (description.includes('Mana Regen') && description.includes('%')) effects.modifiers = [modifier('mana-regen-percent', perRank * safeRank)]
  return effects
}
