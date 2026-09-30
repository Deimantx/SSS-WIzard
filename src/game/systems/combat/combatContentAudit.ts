import { MONSTERS } from '../../content/monsters'
import { resolveEnemyPowerBreakdown } from './enemyPower'
import type { MonsterDefinition } from '../../content/monsters/monsterTypes'
import type { MonsterId } from '../../types'
import type { WorldTierId } from '../../types'
import { getMonsterDamageProfile } from '../../content/monsters/monsterTypes'
import { resolveWorldTierEnemyProfile } from '../world-tier/worldTierRuntime'
import { STATUS_DEFINITIONS } from '../../content/statuses/statuses'
import { TRAIT_DEFINITIONS } from '../../content/traits/traits'

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
]

export interface CombatV2ContentAuditRow {
  id: MonsterId; name: string; location: string; affinity: string; damageProfile: string[]; power: number; hp: number; basicDamage: number; basicIntervalMs: number; basicDps: number
  maxRepeatableDirectCoefficient: number; dotTotalCoefficient: number; repeatableHealPercent: number; repeatableBarrierPercent: number; onceOnlyHealPercent: number; onceOnlyBarrierPercent: number; physicalComponentCount: number; defaultFlatPeriodicCount: number; maxControlMs: number; patternCycleMs: number; warnings: string[]
}

const LOCATIONS: Record<string, string> = {
  'stonewake-hollow': 'Stonewake Hollow', 'galecrest-heights': 'Galecrest Heights', 'tideglass-caverns': 'Tideglass Caverns', 'emberfall-basin': 'Emberfall Basin',
  'whispering-woods': 'Whispering Woods', 'howling-den': 'Howling Den', 'hunters-ground': 'Gloamridge', 'abandoned-catacombs': 'Abandoned Catacombs',
  'fractured-approach': 'Fractured Approach', 'flooded-reliquary': 'Flooded Reliquary', 'ashen-watch': 'Ashen Watch', 'rootscar-hollow': 'Rootscar Hollow', 'crossroads-of-ruin': 'Crossroads of Ruin',
}
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
}).flatMap(([location, ids]) => (ids as string[]).map((id) => [id, location])))

const collectEffects = (monster: MonsterDefinition) => [
  ...Object.values(monster.actions).flatMap((action) => action.effects ?? []),
  ...monster.traitIds.flatMap((traitId) => TRAIT_DEFINITIONS[traitId]?.rules?.flatMap((rule) => rule.effects) ?? []),
]
const collectTraitEffects = (monster: MonsterDefinition, onceOnly: boolean) => monster.traitIds.flatMap((traitId) => TRAIT_DEFINITIONS[traitId]?.rules?.filter((rule) => onceOnly ? rule.oncePerEncounter === true : rule.oncePerEncounter !== true).flatMap((rule) => rule.effects) ?? [])
const sourceBasicCoefficient = (value: unknown) => value && typeof value === 'object' && 'type' in value && value.type === 'source-basic-damage-percent' && 'value' in value && typeof value.value === 'number' ? value.value : 0
const sourceHealthCoefficient = (value: unknown) => value && typeof value === 'object' && 'type' in value && value.type === 'source-max-health-percent' && 'value' in value && typeof value.value === 'number' ? value.value : 0
const maximumEffectCoefficient = (effects: ReturnType<typeof collectEffects>, kind: 'damage' | 'heal' | 'barrier') => Math.max(0, ...effects.flatMap((effect) => {
  if (kind === 'damage' && effect.type === 'deal-damage') return [effect.components.reduce((sum, component) => sum + sourceBasicCoefficient(component.magnitude), 0)]
  if (kind === 'heal' && effect.type === 'heal') return [sourceHealthCoefficient(effect.magnitude)]
  if (kind === 'barrier' && effect.type === 'gain-barrier') return [sourceHealthCoefficient(effect.magnitude)]
  return []
}))

export const buildCombatV2ContentAudit = (worldTier: WorldTierId = 1): CombatV2ContentAuditRow[] => COMBAT_V2_AUDIT_MONSTER_IDS.flatMap((id) => {
  const monster = MONSTERS[id]
  if (!monster) return []
  const power = resolveEnemyPowerBreakdown(id, worldTier)
  const profile = resolveWorldTierEnemyProfile(id, worldTier)
  const effects = collectEffects(monster)
  const periodicEffects = effects.flatMap((effect) => effect.type === 'apply-status' ? (effect.periodicEffects ?? STATUS_DEFINITIONS[effect.statusId]?.periodic?.effects ?? []).map((periodic) => ({ periodic, durationMs: effect.durationMs ?? STATUS_DEFINITIONS[effect.statusId]?.defaultDurationMs ?? 0, statusId: effect.statusId, fromDefault: effect.periodicEffects === undefined })) : [])
  const dotTotalCoefficient = periodicEffects.reduce((sum, entry) => {
    const intervalMs = STATUS_DEFINITIONS[entry.statusId]?.periodic?.intervalMs ?? 0
    const ticks = intervalMs > 0 ? Math.floor(entry.durationMs / intervalMs) : 0
    return entry.periodic.type === 'deal-damage' ? sum + entry.periodic.components.reduce((part, component) => part + sourceBasicCoefficient(component.magnitude) * ticks, 0) : sum
  }, 0)
  const physicalComponentCount = periodicEffects.reduce((sum, entry) => entry.periodic.type === 'deal-damage' ? sum + entry.periodic.components.filter((component) => component.damageType === 'physical').length : sum, 0) + effects.reduce((sum, effect) => effect.type === 'deal-damage' ? sum + effect.components.filter((component) => component.damageType === 'physical').length : sum, 0)
  const maxControlMs = effects.reduce((max, effect) => effect.type === 'apply-status' && STATUS_DEFINITIONS[effect.statusId]?.tags.includes('control') ? Math.max(max, effect.durationMs ?? STATUS_DEFINITIONS[effect.statusId]?.defaultDurationMs ?? 0) : max, 0)
  const patternCycleMs = Object.values(monster.actionPatterns).reduce((max, pattern) => Math.max(max, pattern.steps.reduce((sum, step) => sum + (step.type === 'basic' ? monster.basicAttackTimeMs : monster.actions[step.actionId ?? '']?.actionTimeMs ?? 0), 0)), 0)
  const repeatableEffects = [...Object.values(monster.actions).flatMap((action) => action.effects ?? []), ...collectTraitEffects(monster, false)]
  const onceOnlyEffects = collectTraitEffects(monster, true)
  const direct = maximumEffectCoefficient(repeatableEffects, 'damage')
  const heal = maximumEffectCoefficient(repeatableEffects, 'heal')
  const barrier = maximumEffectCoefficient(repeatableEffects, 'barrier')
  const onceOnlyHeal = maximumEffectCoefficient(onceOnlyEffects, 'heal')
  const onceOnlyBarrier = maximumEffectCoefficient(onceOnlyEffects, 'barrier')
  const warnings: string[] = []
  if (direct > 3) warnings.push('Repeatable direct hit exceeds 3× Basic')
  if (dotTotalCoefficient > 2) warnings.push('Repeatable DoT exceeds 2× Basic')
  if (heal > 0.2) warnings.push('Repeatable healing exceeds 20% Max HP')
  if (barrier > 0.25) warnings.push('Repeatable Barrier exceeds 25% Max HP')
  if (onceOnlyHeal > 0.25) warnings.push('One-time healing exceeds 25% Max HP')
  if (onceOnlyBarrier > 0.30) warnings.push('One-time Barrier exceeds 30% Max HP')
  if (maxControlMs > 5000 && ['whispering-woods', 'howling-den', 'hunters-ground', 'abandoned-catacombs'].includes(LOCATION_BY_ID[id])) warnings.push('Act 0 control exceeds 5 seconds')
  if (physicalComponentCount) warnings.push(`${physicalComponentCount} Physical damage component(s)`)
  if (!monster.primaryAffinity) warnings.push('Missing explicit primary affinity')
  if (!monster.basicAttackElement) warnings.push('Missing explicit Basic Attack element')
  const flatPeriodicCount = periodicEffects.reduce((count, entry) => count + (entry.fromDefault && entry.periodic.type === 'deal-damage' ? entry.periodic.components.filter((component) => component.magnitude.type === 'flat').length : 0), 0)
  if (flatPeriodicCount) warnings.push(`${flatPeriodicCount} flat periodic damage payload(s)`)
  return [{ id, name: monster.name, location: LOCATIONS[LOCATION_BY_ID[id]] ?? 'Unknown', affinity: monster.primaryAffinity ?? '—', damageProfile: getMonsterDamageProfile(monster), power: power.power, hp: profile.maxHealth, basicDamage: profile.basicAttackDamage, basicIntervalMs: monster.basicAttackTimeMs, basicDps: power.basicDps, maxRepeatableDirectCoefficient: direct, dotTotalCoefficient, repeatableHealPercent: heal, repeatableBarrierPercent: barrier, onceOnlyHealPercent: onceOnlyHeal, onceOnlyBarrierPercent: onceOnlyBarrier, physicalComponentCount, defaultFlatPeriodicCount: flatPeriodicCount, maxControlMs, patternCycleMs, warnings }]
})
