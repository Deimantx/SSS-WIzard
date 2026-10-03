import { MONSTERS } from '../../content/monsters'
import { resolveEnemyPowerBreakdown } from './enemyPower'
import type { MonsterDefinition } from '../../content/monsters/monsterTypes'
import type { CombatEffect } from './combatTypes'
import type { MonsterId, WorldTierId } from '../../types'
import { WORLD_TIERS } from '../../content/world-tier/worldTiers'
import { getMonsterDamageProfile } from '../../content/monsters/monsterTypes'
import { resolveWorldTierEnemyProfile } from '../world-tier/worldTierRuntime'
import { STATUS_DEFINITIONS } from '../../content/statuses/statuses'
import { TRAIT_DEFINITIONS } from '../../content/traits/traits'
import { ELITE_ZONE_AFFIXES } from '../../content/elite-affixes'
import { COMBAT_LOCATIONS, COMBAT_LOCATION_ORDER, type CombatLocationType } from '../../content/combat-locations'
import { EXPANSION_MONSTERS } from '../../content/monsters/expansionMonsters'

export const COMBAT_V2_AUDIT_MONSTER_IDS: readonly MonsterId[] = [
  'stonewake-gravel-wisp', 'stonewake-rootback-crawler', 'stonewake-shardhide-golem', 'stonewake-stonebound-warden', 'heartstone-colossus',
  'galecrest-zephyr-wisp', 'galecrest-gale-imp', 'galecrest-razorwing', 'galecrest-stormcaller-adept', 'tempest-roc',
  'tideglass-tide-wisp', 'tideglass-reef-crawler', 'tideglass-current-serpent', 'tideglass-drowned-channeler', 'deepwater-oracle',
  'emberfall-ember-wisp', 'emberfall-ashling', 'emberfall-flame-hound', 'emberfall-ashen-adept', 'pyre-guardian',
  'forest-wisp', 'thornling', 'dewbound-sprite', 'cinder-moth', 'stone-root', 'grove-sentinel', 'tempest-stag', 'forest-heart',
  'cavefang-wolf', 'razorclaw-lynx', 'corrupted-dire-wolf', 'bonehide-boar', 'moonblind-jackal', 'den-stalker', 'corrupted-greatbear',
  'ashen-tracker', 'gloamfang-stalker', 'runehorn-brute', 'veilwing-harrier', 'cinderback-mauler', 'gloomroot-hexer', 'nightglass-alpha',
  'restless-skeleton', 'grave-wraith', 'fallen-acolyte', 'archmage-edrin-shade',
  'rift-wolf', 'arcane-scavenger', 'withered-watcher', 'warded-husk', 'corrupted-elemental-gatekeeper',
  'drowned-acolyte', 'reliquary-slime', 'mist-wraith', 'rune-leech', 'tidefang-serpent', 'brinebound-sentinel', 'abyssal-archivist', 'drowned-keeper',
  'cinder-hound', 'ash-cultist', 'fire-elemental', 'lava-eel', 'emberwing-harrier', 'charred-warden', 'pyre-colossus', 'flamebound-revenant',
  'thorn-maw', 'rootbound-stalker', 'briar-sprite', 'moss-carapace', 'sporeback-brute', 'vinebound-reaver', 'scarwood-behemoth', 'rootscar-ancient',
  'arcane-binder', 'rift-archer', 'remnant-marauder', 'broken-construct', 'crossroads-keeper',
  'graveglass-shade', 'bone-shardling', 'silent-mourner', 'crypt-guardian', 'epitaph-weaver', 'tombglass-reaver', 'ossuary-oracle', 'graveglass-behemoth',
  'volt-wisp', 'gale-scribe', 'charged-seeker', 'thundercoil-serpent', 'static-armor', 'stormbound-curator', 'tempest-engine', 'storm-archivist',
  'starbound-eye', 'astral-husk', 'orbiting-fragment', 'lenskeeper-remnant', 'comet-wraith', 'voidglass-custodian', 'zenith-horror', 'fallen-astromancer',
  'meridian-warden', 'fractured-channeler', 'arc-surge-horror', 'linebreaker-shade', 'meridian-splitter',
  'name-eater', 'bound-echo', 'hollow-liturgist', 'whisper-archivist', 'nameless-cantor', 'oathless-confessor', 'unwritten-hierophant', 'unspoken-prelate',
  'sigil-guardian', 'black-seal-parasite', 'vault-devourer', 'inkbound-specter', 'sealbound-custodian', 'blackscript-colossus', 'voidseal-arbiter', 'sigil-warden',
  'gatebound-remnant', 'black-rift-stalker', 'portalbound-acolyte', 'sealbreaker-construct', 'black-gatekeeper',
  ...Object.keys(EXPANSION_MONSTERS) as MonsterId[],
]

export interface CombatV2ContentAuditRow {
  id: MonsterId; name: string; group: CombatV2AuditGroupId; location: string; locationType: CombatLocationType; order: number; boss: boolean; affinity: string; damageProfile: string[]; power: number; hp: number; defense: number; basicDamage: number; basicIntervalMs: number; basicDps: number; zoneAffix: string | null
  maxRepeatableDirectCoefficient: number; dotTotalCoefficient: number; periodicDamageCoefficient: number; periodicHealPercent: number
  repeatableHealPercent: number; repeatableBarrierPercent: number; onceOnlyHealPercent: number; onceOnlyBarrierPercent: number
  repeatableSustainPercent: number; onceOnlySustainPercent: number
  defaultFlatPeriodicDamageCount: number; defaultFlatPeriodicHealCount: number; defaultFlatPeriodicCount: number; genericActionDescriptionCount: number; genericEquippedTraitCount: number
  maxControlMs: number; patternCycleMs: number; warnings: string[]
}

export const COMBAT_V2_AUDIT_GROUPS = [
  { id: 'all', label: 'All Combat V2' },
  { id: 'combat-zone', label: 'Combat Zones' },
  { id: 'elite-zone', label: 'Elite Zones' },
  { id: 'hunting-ground', label: 'Hunting Grounds' },
  { id: 'dungeon', label: 'Dungeons' },
] as const
export type CombatV2AuditGroupId = typeof COMBAT_V2_AUDIT_GROUPS[number]['id']

const LOCATION_BY_ID: Record<string, string> = Object.fromEntries(Object.entries({
  'stonewake-hollow': ['stonewake-gravel-wisp', 'stonewake-rootback-crawler', 'stonewake-shardhide-golem', 'stonewake-stonebound-warden', 'heartstone-colossus'],
  'galecrest-heights': ['galecrest-zephyr-wisp', 'galecrest-gale-imp', 'galecrest-razorwing', 'galecrest-stormcaller-adept', 'tempest-roc'],
  'tideglass-caverns': ['tideglass-tide-wisp', 'tideglass-reef-crawler', 'tideglass-current-serpent', 'tideglass-drowned-channeler', 'deepwater-oracle'],
  'emberfall-basin': ['emberfall-ember-wisp', 'emberfall-ashling', 'emberfall-flame-hound', 'emberfall-ashen-adept', 'pyre-guardian'],
  'whispering-woods': ['forest-wisp', 'thornling', 'dewbound-sprite', 'cinder-moth', 'stone-root', 'grove-sentinel', 'tempest-stag', 'forest-heart'],
  'howling-den': ['cavefang-wolf', 'razorclaw-lynx', 'corrupted-dire-wolf', 'bonehide-boar', 'moonblind-jackal', 'den-stalker', 'corrupted-greatbear'],
  'hunters-ground': ['ashen-tracker', 'gloamfang-stalker', 'runehorn-brute', 'veilwing-harrier', 'cinderback-mauler', 'gloomroot-hexer', 'nightglass-alpha'],
  'abandoned-catacombs': ['restless-skeleton', 'grave-wraith', 'fallen-acolyte', 'archmage-edrin-shade'],
  'fractured-approach': ['rift-wolf', 'arcane-scavenger', 'withered-watcher', 'warded-husk', 'corrupted-elemental-gatekeeper'],
  'flooded-reliquary': ['drowned-acolyte', 'reliquary-slime', 'mist-wraith', 'rune-leech', 'tidefang-serpent', 'brinebound-sentinel', 'abyssal-archivist', 'drowned-keeper'],
  'ashen-watch': ['cinder-hound', 'ash-cultist', 'fire-elemental', 'lava-eel', 'emberwing-harrier', 'charred-warden', 'pyre-colossus', 'flamebound-revenant'],
  'rootscar-hollow': ['thorn-maw', 'rootbound-stalker', 'briar-sprite', 'moss-carapace', 'sporeback-brute', 'vinebound-reaver', 'scarwood-behemoth', 'rootscar-ancient'],
  'crossroads-of-ruin': ['arcane-binder', 'rift-archer', 'remnant-marauder', 'broken-construct', 'crossroads-keeper'],
  'graveglass-hollow': ['graveglass-shade', 'bone-shardling', 'silent-mourner', 'crypt-guardian', 'epitaph-weaver', 'tombglass-reaver', 'ossuary-oracle', 'graveglass-behemoth'],
  'stormvault-gallery': ['volt-wisp', 'gale-scribe', 'charged-seeker', 'thundercoil-serpent', 'static-armor', 'stormbound-curator', 'tempest-engine', 'storm-archivist'],
  'starfallen-observatory': ['starbound-eye', 'astral-husk', 'orbiting-fragment', 'lenskeeper-remnant', 'comet-wraith', 'voidglass-custodian', 'zenith-horror', 'fallen-astromancer'],
  'broken-meridian': ['meridian-warden', 'fractured-channeler', 'arc-surge-horror', 'linebreaker-shade', 'meridian-splitter'],
  'hall-of-unbound-names': ['name-eater', 'bound-echo', 'hollow-liturgist', 'whisper-archivist', 'nameless-cantor', 'oathless-confessor', 'unwritten-hierophant', 'unspoken-prelate'],
  'vault-of-the-black-sigil': ['sigil-guardian', 'black-seal-parasite', 'vault-devourer', 'inkbound-specter', 'sealbound-custodian', 'blackscript-colossus', 'voidseal-arbiter', 'sigil-warden'],
  'black-gate': ['gatebound-remnant', 'black-rift-stalker', 'portalbound-acolyte', 'sealbreaker-construct', 'black-gatekeeper'],
}).flatMap(([location, ids]) => (ids as string[]).map((id) => [id, location])))
COMBAT_LOCATION_ORDER.forEach((locationId) => {
  const location = COMBAT_LOCATIONS[locationId]
  ;[...location.monsterPool, ...(location.bossId ? [location.bossId] : [])].forEach((monsterId) => { LOCATION_BY_ID[monsterId] = locationId })
})

const collectAuthoredEffects = (monster: MonsterDefinition, affixId?: keyof typeof ELITE_ZONE_AFFIXES) => [
  ...Object.values(monster.actions).flatMap((action) => (action.effects ?? []).map((effect) => ({ effect, onceOnly: false, sourceName: action.name }))),
  ...monster.traitIds.flatMap((traitId) => (TRAIT_DEFINITIONS[traitId]?.rules ?? []).flatMap((rule) => rule.effects.map((effect) => ({ effect, onceOnly: rule.oncePerEncounter === true, sourceName: TRAIT_DEFINITIONS[traitId]?.name ?? traitId })))),
  ...(affixId ? (ELITE_ZONE_AFFIXES[affixId]?.rules ?? []).flatMap((rule) => rule.effects.map((effect) => ({ effect, onceOnly: rule.oncePerEncounter === true, sourceName: ELITE_ZONE_AFFIXES[affixId]?.name ?? affixId }))) : []),
]
const sourceBasicCoefficient = (value: unknown) => value && typeof value === 'object' && 'type' in value && value.type === 'source-basic-damage-percent' && 'value' in value && typeof value.value === 'number' ? value.value : 0
const sourceHealthCoefficient = (value: unknown, maxHealth: number) => {
  if (!value || typeof value !== 'object' || !('type' in value) || !('value' in value) || typeof value.value !== 'number') return 0
  if (value.type === 'source-max-health-percent') return value.value
  if (value.type === 'flat') return maxHealth > 0 ? value.value / maxHealth : 0
  return 0
}
const isGenericActionDescription = (monster: MonsterDefinition, action: MonsterDefinition['actions'][string]) => {
  const description = action.description?.trim()
  if (!description) return true
  const normalized = description.toLowerCase().replace(/\s+/g, ' ')
  const generic = `${monster.name} uses ${action.name}.`.toLowerCase()
  return normalized === generic || /changes the fight through its authored effect|has no authored combat effect/i.test(normalized)
}

const BOSS_REPEATABLE_SUSTAIN_BUDGET = 0.3
const BOSS_ONCE_SUSTAIN_BUDGET = 0.3

export const buildCombatV2ContentAudit = (worldTier: WorldTierId = 1): CombatV2ContentAuditRow[] => COMBAT_V2_AUDIT_MONSTER_IDS.flatMap((id) => {
  const monster = MONSTERS[id]
  if (!monster) return []
  const power = resolveEnemyPowerBreakdown(id, worldTier)
  const profile = resolveWorldTierEnemyProfile(id, worldTier)
  const affixId = monster.bestiaryCategory === 'boss' ? undefined : COMBAT_LOCATIONS[LOCATION_BY_ID[id] as keyof typeof COMBAT_LOCATIONS]?.zoneAffixId
  const locationDefinition = COMBAT_LOCATIONS[LOCATION_BY_ID[id] as keyof typeof COMBAT_LOCATIONS]
  const dungeon = locationDefinition?.id ? COMBAT_LOCATIONS[locationDefinition.id] : undefined
  const normalOrder = dungeon ? [...(dungeon.encounterSequence ?? dungeon.monsterPool)].indexOf(id) + 1 : 0
  const targetOrder = locationDefinition?.targetMetadata?.[id]?.order ?? (normalOrder > 0 ? normalOrder : dungeon?.boss === id ? (dungeon.encounterSequence ?? dungeon.monsterPool).length + 1 : 0)
  const authored = collectAuthoredEffects(monster, affixId)
  const periodic = authored.flatMap(({ effect, onceOnly, sourceName }) => effect.type === 'apply-status' ?
    (effect.periodicEffects ?? STATUS_DEFINITIONS[effect.statusId]?.periodic?.effects ?? []).map((periodicEffect) => ({
      effect: periodicEffect,
      onceOnly,
      sourceName,
      statusId: effect.statusId,
      durationMs: effect.durationMs ?? STATUS_DEFINITIONS[effect.statusId]?.defaultDurationMs ?? 0,
      fromDefault: effect.periodicEffects === undefined,
    })) : [])
  const ticksFor = (statusId: string, durationMs: number) => {
    const interval = STATUS_DEFINITIONS[statusId as keyof typeof STATUS_DEFINITIONS]?.periodic?.intervalMs ?? 0
    return interval > 0 ? Math.floor(durationMs / interval) : 0
  }
  let periodicDamageCoefficient = 0
  let periodicHealPercent = 0
  let repeatablePeriodicHealPercent = 0
  let onceOnlyPeriodicHealPercent = 0
  let defaultFlatPeriodicDamageCount = 0
  let defaultFlatPeriodicHealCount = 0
  periodic.forEach((entry) => {
    const ticks = ticksFor(entry.statusId, entry.durationMs)
    if (entry.effect.type === 'deal-damage') {
      periodicDamageCoefficient += entry.effect.components.reduce((sum, component) => sum + sourceBasicCoefficient(component.magnitude) * ticks, 0)
      if (entry.fromDefault) defaultFlatPeriodicDamageCount += entry.effect.components.filter((component) => component.magnitude.type === 'flat').length
    } else if (entry.effect.type === 'heal') {
      const amount = sourceHealthCoefficient(entry.effect.magnitude, monster.maxHealth) * ticks
      periodicHealPercent += amount
      if (entry.onceOnly) onceOnlyPeriodicHealPercent += amount
      else repeatablePeriodicHealPercent += amount
      if (entry.fromDefault && entry.effect.magnitude.type === 'flat') defaultFlatPeriodicHealCount += 1
    }
  })
  const repeatable = authored.filter((entry) => !entry.onceOnly)
  const onceOnly = authored.filter((entry) => entry.onceOnly)
  const maximumDirectCoefficient = (entries: typeof authored) => Math.max(0, ...entries.flatMap(({ effect }) => effect.type === 'deal-damage' ? [effect.components.reduce((sum, component) => sum + sourceBasicCoefficient(component.magnitude), 0)] : []))
  const sumMagnitudePercent = (entries: typeof authored, type: 'heal' | 'gain-barrier') => entries.reduce((sum, { effect }) => effect.type === type ? sum + sourceHealthCoefficient(effect.magnitude, monster.maxHealth) : sum, 0)
  const repeatableHealPercent = sumMagnitudePercent(repeatable, 'heal') + repeatablePeriodicHealPercent
  const repeatableBarrierPercent = sumMagnitudePercent(repeatable, 'gain-barrier')
  const onceOnlyHealPercent = sumMagnitudePercent(onceOnly, 'heal') + onceOnlyPeriodicHealPercent
  const onceOnlyBarrierPercent = sumMagnitudePercent(onceOnly, 'gain-barrier')
  const repeatableSustainPercent = repeatableHealPercent + repeatableBarrierPercent
  const onceOnlySustainPercent = onceOnlyHealPercent + onceOnlyBarrierPercent
  const maxControlMs = authored.reduce((max, { effect }) => effect.type === 'apply-status' && STATUS_DEFINITIONS[effect.statusId]?.tags.includes('control') ? Math.max(max, effect.durationMs ?? STATUS_DEFINITIONS[effect.statusId]?.defaultDurationMs ?? 0) : max, 0)
  const patternCycleMs = Object.values(monster.actionPatterns).reduce((max, pattern) => Math.max(max, pattern.steps.reduce((sum, step) => sum + (step.type === 'basic' ? monster.basicAttackTimeMs : monster.actions[step.actionId ?? '']?.actionTimeMs ?? 0), 0)), 0)
  const warnings: string[] = []
  const genericActionDescriptionCount = Object.values(monster.actions).filter((action) => isGenericActionDescription(monster, action)).length
  for (const action of Object.values(monster.actions)) if (isGenericActionDescription(monster, action)) warnings.push(`Generic or missing action description: ${action.name}`)
  const genericEquippedTraitCount = monster.traitIds.filter((traitId) => /distinct regional progression combat trait shaping this creature/i.test(TRAIT_DEFINITIONS[traitId]?.description ?? '')).length
  if (genericEquippedTraitCount) warnings.push(`${genericEquippedTraitCount} generic equipped Trait(s)`)
  if (maximumDirectCoefficient(repeatable) > 3) warnings.push('Repeatable direct hit exceeds 3× Basic')
  if (periodicDamageCoefficient > 2) warnings.push('Repeatable DoT exceeds 2× Basic')
  if (repeatableHealPercent > 0.2) warnings.push('Repeatable healing exceeds 20% Max HP')
  if (repeatableBarrierPercent > 0.25) warnings.push('Repeatable Barrier exceeds 25% Max HP')
  if (onceOnlyHealPercent > 0.25) warnings.push('One-time healing exceeds 25% Max HP')
  if (onceOnlyBarrierPercent > 0.3) warnings.push('One-time Barrier exceeds 30% Max HP')
  if (monster.bestiaryCategory === 'boss' && repeatableSustainPercent > BOSS_REPEATABLE_SUSTAIN_BUDGET) warnings.push(`Repeatable sustain exceeds ${(BOSS_REPEATABLE_SUSTAIN_BUDGET * 100).toFixed(0)}% Max Health budget`)
  if (monster.bestiaryCategory === 'boss' && onceOnlySustainPercent > BOSS_ONCE_SUSTAIN_BUDGET) warnings.push(`One-transition sustain exceeds ${(BOSS_ONCE_SUSTAIN_BUDGET * 100).toFixed(0)}% Max Health budget`)
  if (maxControlMs > 5000) warnings.push('Authored control exceeds 5 seconds')
  if (!monster.primaryAffinity) warnings.push('Missing explicit primary affinity')
  if (!monster.basicAttackElement) warnings.push('Missing explicit Basic Attack element')
  if (defaultFlatPeriodicDamageCount) warnings.push(`${defaultFlatPeriodicDamageCount} default flat periodic damage payload(s)`)
  if (defaultFlatPeriodicHealCount) warnings.push(`${defaultFlatPeriodicHealCount} default flat periodic healing payload(s)`)
  const defaultFlatPeriodicCount = defaultFlatPeriodicDamageCount + defaultFlatPeriodicHealCount
  return [{ id, name: monster.name, group: locationDefinition?.type ?? 'combat-zone', location: locationDefinition?.name ?? 'Unknown', locationType: locationDefinition?.type ?? 'combat-zone', order: targetOrder, boss: monster.bestiaryCategory === 'boss', affinity: monster.primaryAffinity ?? '—', damageProfile: getMonsterDamageProfile(monster), power: power.power, hp: profile.maxHealth, defense: profile.defense, basicDamage: profile.basicAttackDamage, basicIntervalMs: monster.basicAttackTimeMs, basicDps: power.basicDps, zoneAffix: locationDefinition?.zoneAffixId ? ELITE_ZONE_AFFIXES[locationDefinition.zoneAffixId]?.name ?? locationDefinition.zoneAffixId : null,
    maxRepeatableDirectCoefficient: maximumDirectCoefficient(repeatable), dotTotalCoefficient: periodicDamageCoefficient, periodicDamageCoefficient, periodicHealPercent,
    repeatableHealPercent, repeatableBarrierPercent, onceOnlyHealPercent, onceOnlyBarrierPercent, repeatableSustainPercent, onceOnlySustainPercent,
    defaultFlatPeriodicDamageCount, defaultFlatPeriodicHealCount, defaultFlatPeriodicCount, genericActionDescriptionCount, genericEquippedTraitCount, maxControlMs, patternCycleMs, warnings }]
})

export const buildCombatV2GlobalAudit = (worldTier: WorldTierId = 1) => {
  const rows = buildCombatV2ContentAudit(worldTier)
  return {
    implicitAffinityCount: rows.filter((row) => !MONSTERS[row.id]?.primaryAffinity).length,
    defaultFlatPeriodicDamageCount: rows.reduce((sum, row) => sum + row.defaultFlatPeriodicDamageCount, 0),
    defaultFlatPeriodicHealCount: rows.reduce((sum, row) => sum + row.defaultFlatPeriodicHealCount, 0),
    genericActionDescriptionCount: rows.reduce((sum, row) => sum + row.genericActionDescriptionCount, 0),
    genericEquippedTraitCount: rows.reduce((sum, row) => sum + row.genericEquippedTraitCount, 0),
  }
}

export const buildCombatV2MonsterWorldTierComparison = (monsterId: MonsterId) => Object.values(WORLD_TIERS).map(({ id: worldTier }) => {
  const profile = resolveWorldTierEnemyProfile(monsterId, worldTier)
  return { monsterId, worldTier, power: resolveEnemyPowerBreakdown(monsterId, worldTier).power, hp: profile.maxHealth, basicDamage: profile.basicAttackDamage, defense: profile.defense }
})
