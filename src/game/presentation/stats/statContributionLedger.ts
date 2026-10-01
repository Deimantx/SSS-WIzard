import { BALANCE } from '../../core/balance/balance'
import { DEFENSE_K, MAX_CRIT_CHANCE, MAX_CRIT_DAMAGE_MULTIPLIER, MAX_DEFENSE_REDUCTION, MAX_RESISTANCE, MIN_CRIT_DAMAGE_MULTIPLIER, MIN_RESISTANCE } from '../../core/balance/combatStats'
import { ITEMS } from '../../content/items/items'
import { ARCANE_CORE_NODES } from '../../content/arcane-core/arcaneCoreBranches'
import { getCrystalVariantName, getCrystalVariantStats } from '../../content/crystals/crystals'
import { getPlayerBuildStaticStats } from '../../core/equipment/equipmentStats'
import { getPlayerCombatStats, getPlayerSheetCombatStats } from '../../systems/combat/combatStats'
import { getCombatModifierContributions } from '../../systems/combat/modifiers'
import { getPlayerManaCapacityBreakdown, getPlayerManaRegenBreakdown } from '../../systems/mana/playerMana'
import { getArcaneCoreResolvedEffects } from '../../systems/arcane-core/arcaneCoreProgression'
import { getArcaneCoreManaRegenMultiplier } from '../../systems/arcane-core/arcaneCoreRuntime'
import { getEquippedSigils, getEquippedSigilSetCounts, resolveSigilStatsForInstance } from '../../systems/sigils/sigilRuntime'
import { getSigilSetBonuses } from '../../content/sigils/sigilSets'
import { getActiveArtifactCombatProviders, getArtifactEffectiveStats, isArtifactItem } from '../../systems/artifacts/artifactProgression'
import { SIGIL_SETS } from '../../content/sigils/sigilSets'
import { getSigilSlotRoman } from '../sigils/sigilEquipmentReadModel'
import { getEquipmentStatLabel } from '../equipment/equipmentStatPresentation'
import { getEquipmentStatSnapshot } from '../equipment/equipmentReadModel'
import type { DamageType, EquipmentStats, GameState, SigilSetId } from '../../types'

export type StatContributionSourceType = 'base' | 'equipment' | 'artifact' | 'arcane-core' | 'crystal' | 'sigil' | 'sigil-set' | 'guild' | 'progression' | 'trait' | 'status' | 'combat-condition' | 'debug' | 'other'
export type StatContributionOperation = 'base' | 'flat' | 'add-percent' | 'multiplier' | 'derived' | 'cap' | 'conditional'
export interface StatContribution { id: string; statKey: string; sourceType: StatContributionSourceType; sourceId: string | null; sourceLabel: string; operation: StatContributionOperation; value: number; active: boolean; temporary: boolean; description?: string }
export interface StatBreakdown { statKey: string; label: string; baseValue: number; permanent: StatContribution[]; temporary: StatContribution[]; beforeCaps?: number; finalValue: number; cap?: { min?: number; max?: number; applied: boolean }; formulaLabel?: string }
export type StatBreakdownMode = 'sheet' | 'live'
export type PlayerBreakdownStatKey = 'maxHealth' | 'healthRegen' | 'maxMana' | 'manaRegen' | 'spellPower' | 'critChance' | 'critDamageMultiplier' | 'damageOverTimeBonus' | 'statusDurationBonus' | 'defense' | 'damageReduction' | 'cooldownRecovery' | 'healingDoneBonus' | 'barrierPowerBonus' | 'manaCostReduction' | 'fireSpellDamage' | 'airSpellDamage' | 'barrierReceivedFlat' | 'negativeStatusDurationReceived' | `resistance-${DamageType}`
export const PLAYER_BREAKDOWN_STAT_KEYS: readonly PlayerBreakdownStatKey[] = ['maxHealth', 'healthRegen', 'maxMana', 'manaRegen', 'spellPower', 'critChance', 'critDamageMultiplier', 'damageOverTimeBonus', 'statusDurationBonus', 'defense', 'damageReduction', 'cooldownRecovery', 'healingDoneBonus', 'barrierPowerBonus', 'manaCostReduction', 'fireSpellDamage', 'airSpellDamage', 'barrierReceivedFlat', 'negativeStatusDurationReceived', 'resistance-physical', 'resistance-arcane', 'resistance-fire', 'resistance-water', 'resistance-earth', 'resistance-air']
export interface StatContributionProvider { id: string; collect(state: GameState, statKey: PlayerBreakdownStatKey): StatContribution[] }

const FIELDS: Partial<Record<PlayerBreakdownStatKey, readonly string[]>> = { maxHealth: ['maxHealth', 'maxHealthPct'], healthRegen: ['healthRegen'], maxMana: ['maxMana', 'maxManaPct'], manaRegen: ['manaRegen'], spellPower: ['spellPower', 'spellPowerPct'], critChance: ['critChance'], critDamageMultiplier: ['critDamage'], damageOverTimeBonus: ['damageOverTimePct'], statusDurationBonus: ['statusDurationPct'], defense: ['defense'], cooldownRecovery: ['cooldownRecoveryPct'], healingDoneBonus: ['healingDonePct'], barrierPowerBonus: ['barrierPowerPct'], manaCostReduction: ['manaCostReductionPct'] }
const PERCENT_FIELDS = new Set(['maxHealthPct', 'maxManaPct', 'spellPowerPct', 'critChance', 'critDamage', 'damageOverTimePct', 'statusDurationPct', 'cooldownRecoveryPct', 'healingDonePct', 'barrierPowerPct', 'manaCostReductionPct'])
const safe = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0
const entry = (statKey: PlayerBreakdownStatKey, sourceType: StatContributionSourceType, sourceId: string | null, sourceLabel: string, operation: StatContributionOperation, value: number, temporary = false, description?: string): StatContribution => ({ id: `${sourceType}:${sourceId ?? sourceLabel}:${statKey}:${operation}`, statKey, sourceType, sourceId, sourceLabel, operation, value, active: Math.abs(value) > 1e-7, temporary, ...(description ? { description } : {}) })

function bundle(stats: EquipmentStats | undefined, statKey: PlayerBreakdownStatKey, sourceType: StatContributionSourceType, sourceId: string, sourceLabel: string): StatContribution[] {
  const fields = FIELDS[statKey] ?? (statKey.startsWith('resistance-') ? [statKey] : [])
  return fields.flatMap((field) => {
    const value = field.startsWith('resistance-') ? safe(stats?.resistances?.[field.slice(11) as DamageType]) : safe((stats as Record<string, unknown> | undefined)?.[field])
    if (!value) return []
    return [entry(statKey, sourceType, sourceId, sourceLabel, PERCENT_FIELDS.has(field) || field.startsWith('resistance-') ? 'add-percent' : 'flat', value)]
  })
}

const equipmentItemProvider: StatContributionProvider = { id: 'equipment-items', collect: (state, key) => Object.values(state.equipment).flatMap((itemId) => {
  if (!itemId || !ITEMS[itemId]) return []
  const artifact = isArtifactItem(itemId)
  return bundle(artifact ? getArtifactEffectiveStats(state, itemId) : ITEMS[itemId].stats, key, artifact ? 'artifact' : 'equipment', itemId, ITEMS[itemId].name)
}) }
const arcaneCoreProvider: StatContributionProvider = { id: 'arcane-core-nodes', collect: (state, key) => ARCANE_CORE_NODES.flatMap((node) => bundle(getArcaneCoreResolvedEffects(state.arcaneCore, node).stats, key, 'arcane-core', node.id, node.name)) }
const crystalProvider: StatContributionProvider = { id: 'equipped-crystals', collect: (state, key) => state.crystals.equippedSlots.flatMap((id, slot) => id ? bundle(getCrystalVariantStats(id), key, 'crystal', `${id}:${slot}`, getCrystalVariantName(id)) : []) }
const sigilProvider: StatContributionProvider = { id: 'equipped-sigils', collect: (state, key) => getEquippedSigils(state).flatMap((sigil) => bundle(resolveSigilStatsForInstance(sigil), key, 'sigil', sigil.instanceId, `${SIGIL_SETS[sigil.setId].name} Sigil ${getSigilSlotRoman(sigil.slot)}`)) }
const sigilSetProvider: StatContributionProvider = { id: 'sigil-set-bonuses', collect: (state, key) => Object.entries(getEquippedSigilSetCounts(state)).flatMap(([id, count]) => {
  if (!count) return []
  const setId = id as SigilSetId
  const bonuses = getSigilSetBonuses({ [setId]: count })
  return bundle(bonuses, key, 'sigil-set', setId, `${SIGIL_SETS[setId].name} - ${count}/${SIGIL_SETS[setId].piecesRequired}`)
}) }
const progressionProvider: StatContributionProvider = { id: 'progression', collect: (state, key) => key === 'maxMana' ? Object.entries(state.progress.permanentManaBonuses).flatMap(([id, value]) => safe(value) > 0 ? [entry(key, id === 'guild-apprentice' ? 'guild' : 'progression', id, id === 'guild-apprentice' ? 'Guild Apprentice Training' : id === 'forest-heart' ? 'Forest Heart Blessing' : 'Permanent Mana Bonus', 'flat', safe(value))] : []) : [] }
const debugProvider: StatContributionProvider = { id: 'debug', collect: (state, key) => {
  if (key === 'maxMana' && state.debug.playerStats.maxManaFlat) return [entry(key, 'debug', 'max-mana', 'Developer Max Mana Override', 'flat', safe(state.debug.playerStats.maxManaFlat))]
  if (key === 'manaRegen' && state.debug.playerStats.manaRegenFlat) return [entry(key, 'debug', 'mana-regen', 'Developer Mana Regen Override', 'flat', safe(state.debug.playerStats.manaRegenFlat))]
  return []
} }

const SPECIAL: Partial<Record<PlayerBreakdownStatKey, { key: import('../../systems/combat/combatTypes').ModifierKey; context?: { damageType?: 'fire' | 'air'; statusTags?: import('../../systems/combat/combatTypes').CombatTag[]; originSourceKind?: import('../../systems/combat/combatTypes').CombatSource['kind']; sourceTags?: import('../../systems/combat/combatTypes').CombatTag[] } }>> = {
  fireSpellDamage: { key: 'spell-damage-percent', context: { damageType: 'fire', originSourceKind: 'spell', sourceTags: ['direct'] } }, airSpellDamage: { key: 'spell-damage-percent', context: { damageType: 'air', originSourceKind: 'spell', sourceTags: ['direct'] } }, barrierReceivedFlat: { key: 'barrier-received-flat' }, negativeStatusDurationReceived: { key: 'status-duration-received-percent', context: { statusTags: ['debuff'] } },
}
const MODIFIERS: Partial<Record<PlayerBreakdownStatKey, import('../../systems/combat/combatTypes').ModifierKey>> = { manaRegen: 'mana-regen-percent', healthRegen: 'health-regen-flat', critChance: 'crit-chance', critDamageMultiplier: 'crit-damage', damageOverTimeBonus: 'damage-over-time-percent', statusDurationBonus: 'status-duration-dealt-percent', defense: 'defense-flat', cooldownRecovery: 'cooldown-recovery-percent', healingDoneBonus: 'healing-done-percent', barrierPowerBonus: 'barrier-power-percent' }
const specializedProvider: StatContributionProvider = { id: 'equipment-combat-effects', collect: (state, key) => ['fireSpellDamage', 'airSpellDamage', 'barrierReceivedFlat', 'negativeStatusDurationReceived'].includes(key) ? getSpecializedEquipmentContributions(state, key as 'fireSpellDamage' | 'airSpellDamage' | 'barrierReceivedFlat' | 'negativeStatusDurationReceived') : [] }
const PERMANENT_PROVIDERS: readonly StatContributionProvider[] = [equipmentItemProvider, specializedProvider, arcaneCoreProvider, crystalProvider, sigilProvider, sigilSetProvider, progressionProvider, debugProvider]
export const STAT_CONTRIBUTION_PROVIDERS = PERMANENT_PROVIDERS

function baseValueFor(state: GameState, key: PlayerBreakdownStatKey): number {
  switch (key) { case 'maxHealth': return state.player.baseMaxHealth; case 'healthRegen': return BALANCE.player.healthRegenPerSecond; case 'maxMana': return state.player.baseMaxMana; case 'manaRegen': return BALANCE.mana.baseRegenPerSecond; case 'spellPower': return BALANCE.player.baseSpellPower; case 'critChance': return BALANCE.player.baseCritChance; case 'critDamageMultiplier': return BALANCE.player.baseCritDamage; case 'defense': return BALANCE.player.baseDefense; case 'cooldownRecovery': return 1; default: return 0 }
}
function canonicalValue(state: GameState, key: PlayerBreakdownStatKey, mode: StatBreakdownMode): number {
  if (key.startsWith('resistance-')) return getPlayerSheetCombatStats(state).resistances[key.slice(11) as DamageType] ?? 0
  const snapshot = getEquipmentStatSnapshot(state, state.equipment)
  if (key === 'fireSpellDamage' || key === 'airSpellDamage' || key === 'barrierReceivedFlat' || key === 'negativeStatusDurationReceived') return snapshot[key]
  const stats = mode === 'live' ? getPlayerCombatStats(state) : getPlayerSheetCombatStats(state)
  const values: Partial<Record<PlayerBreakdownStatKey, number>> = { maxHealth: stats.maxHealth, healthRegen: stats.healthRegen, maxMana: stats.maxMana, manaRegen: stats.manaRegen, spellPower: stats.spellPower, critChance: stats.critChance, critDamageMultiplier: stats.critDamageMultiplier, damageOverTimeBonus: stats.damageOverTimeBonus, statusDurationBonus: stats.statusDurationBonus, defense: stats.defense, damageReduction: stats.defenseReduction, cooldownRecovery: stats.cooldownRecovery, healingDoneBonus: stats.healingDoneBonus, barrierPowerBonus: stats.barrierPowerBonus, manaCostReduction: stats.manaCostReduction }
  return values[key] ?? 0
}
function uncapped(state: GameState, key: PlayerBreakdownStatKey): number | undefined {
  const stats = getPlayerBuildStaticStats(state)
  if (key === 'critChance') return BALANCE.player.baseCritChance + safe(stats.critChance)
  if (key === 'critDamageMultiplier') return BALANCE.player.baseCritDamage + safe(stats.critDamage)
  if (key === 'manaCostReduction') return safe(stats.manaCostReductionPct)
  if (key.startsWith('resistance-')) return safe(stats.resistances?.[key.slice(11) as DamageType])
  if (key === 'damageReduction') { const defense = Math.max(0, BALANCE.player.baseDefense + safe(stats.defense)); return defense / (defense + DEFENSE_K) }
  return undefined
}
function capFor(key: PlayerBreakdownStatKey): StatBreakdown['cap'] | undefined {
  if (key === 'critChance') return { min: 0, max: MAX_CRIT_CHANCE, applied: false }
  if (key === 'critDamageMultiplier') return { min: MIN_CRIT_DAMAGE_MULTIPLIER, max: MAX_CRIT_DAMAGE_MULTIPLIER, applied: false }
  if (key === 'manaCostReduction') return { min: 0, max: .8, applied: false }
  if (key.startsWith('resistance-')) return { min: MIN_RESISTANCE, max: MAX_RESISTANCE, applied: false }
  if (key === 'damageReduction') return { min: 0, max: MAX_DEFENSE_REDUCTION, applied: false }
  return undefined
}
function formulaFor(key: PlayerBreakdownStatKey): string | undefined {
  if (key === 'maxHealth') return '(Base Health + flat sources) * (1 + percent sources)'
  if (key === 'maxMana') return 'floor((Base Mana + flat + permanent + developer) * (1 + percent))'
  if (key === 'spellPower') return 'max(0, Base Spell Power + flat sources) * (1 + percent sources)'
  if (key === 'defense') return 'max(0, Base Defense + flat sources)'
  if (key === 'damageReduction') return 'Defense / (Defense + K), subject to the Defense Reduction cap.'
  if (key === 'manaRegen') return 'max(0, (base + flat sources) * combat effects * Arcane Core multiplier)'
  return undefined
}
function temporaryContributions(state: GameState, key: PlayerBreakdownStatKey): StatContribution[] {
  if (!state.combat.active || SPECIAL[key]) return []
  const modifierKey = MODIFIERS[key]
  if (!modifierKey) return []
  return getCombatModifierContributions(state, 'player', modifierKey, {}, 'active').flatMap((source) => {
    if (source.sourceType === 'equipment-stats') return []
    const sourceType: StatContributionSourceType = source.sourceType === 'status' ? 'status' : source.modifier.condition ? 'combat-condition' : source.sourceType === 'sigil' ? 'sigil' : source.sourceType === 'trait' ? 'trait' : source.sourceType === 'equipment' ? 'equipment' : source.sourceType === 'artifact' ? 'artifact' : source.sourceType === 'arcane-core' ? 'arcane-core' : 'other'
    return [entry(key, sourceType, source.sourceId ?? null, source.sourceName ?? 'Combat effect', source.modifier.condition ? 'conditional' : key === 'healthRegen' || key === 'defense' ? 'flat' : 'add-percent', source.value, true, undefined)]
  })
}

export const getPlayerStatBreakdown = (state: GameState, statKey: PlayerBreakdownStatKey, mode: StatBreakdownMode = 'sheet'): StatBreakdown => {
  const permanent = [entry(statKey, 'base', null, 'Base Character Value', 'base', baseValueFor(state, statKey)), ...PERMANENT_PROVIDERS.flatMap((provider) => provider.collect(state, statKey))].filter((source) => source.active)
  if (statKey === 'maxHealth') { const pct = safe(getPlayerBuildStaticStats(state).maxHealthPct); if (pct) permanent.push(entry(statKey, 'other', 'max-health-percent', 'Maximum Health Scaling', 'add-percent', pct)) }
  if (statKey === 'maxMana') { const mana = getPlayerManaCapacityBreakdown(state); if (mana.equipmentPercent) permanent.push(entry(statKey, 'other', 'mana-capacity-percent', 'Equipment Mana Capacity', 'add-percent', mana.equipmentPercent)) }
  if (statKey === 'spellPower') { const pct = safe(getPlayerBuildStaticStats(state).spellPowerPct); if (pct) permanent.push(entry(statKey, 'other', 'spell-power-percent', 'Spell Power Scaling', 'add-percent', pct)) }
  if (statKey === 'damageReduction') permanent.push(entry(statKey, 'other', 'derived-defense', 'Defense Rating', 'derived', canonicalValue(state, 'defense', 'sheet'), false, formulaFor(statKey)))
  if (statKey === 'manaRegen') { const coreMultiplier = getArcaneCoreManaRegenMultiplier(state); if (coreMultiplier !== 1) permanent.push(entry(statKey, 'arcane-core', 'emergency-flow', 'Emergency Flow', 'multiplier', coreMultiplier, true)) }
  const temporary = mode === 'live' ? temporaryContributions(state, statKey) : []
  const raw = uncapped(state, statKey); const cap = capFor(statKey)
  if (cap && raw !== undefined) cap.applied = Math.abs(Math.max(cap.min ?? -Infinity, Math.min(cap.max ?? Infinity, raw)) - raw) > 1e-7
  return { statKey, label: getEquipmentStatLabel(statKey), baseValue: baseValueFor(state, statKey), permanent, temporary, ...(cap?.applied && raw !== undefined ? { beforeCaps: raw } : {}), finalValue: canonicalValue(state, statKey, mode), ...(cap ? { cap } : {}), ...(formulaFor(statKey) ? { formulaLabel: formulaFor(statKey) } : {}) }
}
export const getAllPlayerStatBreakdowns = (state: GameState, mode: StatBreakdownMode = 'sheet'): Record<PlayerBreakdownStatKey, StatBreakdown> => Object.fromEntries(PLAYER_BREAKDOWN_STAT_KEYS.map((key) => [key, getPlayerStatBreakdown(state, key, mode)])) as Record<PlayerBreakdownStatKey, StatBreakdown>

export const getSpecializedEquipmentContributions = (state: GameState, statKey: 'fireSpellDamage' | 'airSpellDamage' | 'barrierReceivedFlat' | 'negativeStatusDurationReceived'): StatContribution[] => {
  const descriptor = SPECIAL[statKey]!
  return Object.values(state.equipment).flatMap((itemId) => {
    if (!itemId) return []
    const artifactProviders = isArtifactItem(itemId) ? getActiveArtifactCombatProviders(state, itemId) : []
    const itemModifiers = ITEMS[itemId]?.combat?.modifiers?.map((modifier) => ({ modifier, provider: ITEMS[itemId].name })) ?? []
    const modifiers = [...itemModifiers, ...artifactProviders.flatMap((provider) => provider.modifiers.map((modifier) => ({ modifier, provider: provider.name })))]
    return modifiers.flatMap(({ modifier, provider }) => {
      if (modifier.key !== descriptor.key || modifier.condition) return []
      if (descriptor.context?.damageType && !modifier.damageTypes?.includes(descriptor.context.damageType)) return []
      if (descriptor.context?.originSourceKind && !modifier.originSourceKinds?.includes(descriptor.context.originSourceKind)) return []
      if (descriptor.context?.sourceTags?.some((tag) => !modifier.sourceTags?.includes(tag))) return []
      if (descriptor.context?.statusTags?.some((tag) => !modifier.statusTags?.includes(tag))) return []
      return [entry(statKey, isArtifactItem(itemId) ? 'artifact' : 'equipment', itemId, provider, 'add-percent', safe(modifier.value))]
    })
  })
}
