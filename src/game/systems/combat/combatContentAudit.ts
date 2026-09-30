import { MONSTERS } from '../../content/monsters'
import { resolveEnemyPowerBreakdown } from './enemyPower'
import type { MonsterDefinition } from '../../content/monsters/monsterTypes'
import type { MonsterId } from '../../types'
import { STATUS_DEFINITIONS } from '../../content/statuses/statuses'

export const COMBAT_V2_AUDIT_MONSTER_IDS: readonly MonsterId[] = [
  'stonewake-gravel-wisp', 'stonewake-rootback-crawler', 'stonewake-shardhide-golem', 'stonewake-stonebound-warden', 'heartstone-colossus',
  'galecrest-zephyr-wisp', 'galecrest-gale-imp', 'galecrest-razorwing', 'galecrest-stormcaller-adept', 'tempest-roc',
  'tideglass-tide-wisp', 'tideglass-reef-crawler', 'tideglass-current-serpent', 'tideglass-drowned-channeler', 'deepwater-oracle',
  'emberfall-ember-wisp', 'emberfall-ashling', 'emberfall-flame-hound', 'emberfall-ashen-adept', 'pyre-guardian',
  'forest-wisp', 'thornling', 'dewbound-sprite', 'cinder-moth', 'stone-root', 'grove-sentinel', 'tempest-stag', 'forest-heart',
  'cavefang-wolf', 'razorclaw-lynx', 'corrupted-dire-wolf', 'bonehide-boar', 'moonblind-jackal', 'den-stalker', 'corrupted-greatbear',
  'ashen-tracker', 'gloamfang-stalker', 'runehorn-brute', 'veilwing-harrier', 'cinderback-mauler', 'gloomroot-hexer', 'nightglass-alpha',
  'restless-skeleton', 'grave-wraith', 'fallen-acolyte', 'archmage-edrin-shade',
]

export interface CombatV2ContentAuditRow {
  id: MonsterId; name: string; location: string; affinity: string; power: number; hp: number; basicDamage: number; basicIntervalMs: number; basicDps: number
  maxRepeatableDirectCoefficient: number; dotTotalCoefficient: number; repeatableHealPercent: number; repeatableBarrierPercent: number; physicalComponentCount: number; maxControlMs: number; patternCycleMs: number; warnings: string[]
}

const LOCATIONS: Record<string, string> = {
  'stonewake-hollow': 'Stonewake Hollow', 'galecrest-heights': 'Galecrest Heights', 'tideglass-caverns': 'Tideglass Caverns', 'emberfall-basin': 'Emberfall Basin',
  'whispering-woods': 'Whispering Woods', 'howling-den': 'Howling Den', 'hunters-ground': 'Gloamridge', 'abandoned-catacombs': 'Abandoned Catacombs',
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
}).flatMap(([location, ids]) => (ids as string[]).map((id) => [id, location])))

const collectEffects = (monster: MonsterDefinition) => Object.values(monster.actions).flatMap((action) => action.effects ?? [])
const sourceBasicCoefficient = (value: unknown) => value && typeof value === 'object' && 'type' in value && value.type === 'source-basic-damage-percent' && 'value' in value && typeof value.value === 'number' ? value.value : 0
const sourceHealthCoefficient = (value: unknown) => value && typeof value === 'object' && 'type' in value && value.type === 'source-max-health-percent' && 'value' in value && typeof value.value === 'number' ? value.value : 0
const maximumEffectCoefficient = (monster: MonsterDefinition, kind: 'damage' | 'heal' | 'barrier') => Math.max(0, ...collectEffects(monster).flatMap((effect) => {
  if (kind === 'damage' && effect.type === 'deal-damage') return [effect.components.reduce((sum, component) => sum + sourceBasicCoefficient(component.magnitude), 0)]
  if (kind === 'heal' && effect.type === 'heal') return [sourceHealthCoefficient(effect.magnitude)]
  if (kind === 'barrier' && effect.type === 'gain-barrier') return [sourceHealthCoefficient(effect.magnitude)]
  return []
}))

export const buildCombatV2ContentAudit = (): CombatV2ContentAuditRow[] => COMBAT_V2_AUDIT_MONSTER_IDS.flatMap((id) => {
  const monster = MONSTERS[id]
  if (!monster) return []
  const power = resolveEnemyPowerBreakdown(id, 1)
  const effects = collectEffects(monster)
  const periodicEffects = effects.flatMap((effect) => effect.type === 'apply-status' ? (effect.periodicEffects ?? []).map((periodic) => ({ periodic, durationMs: effect.durationMs ?? 0, statusId: effect.statusId })) : [])
  const dotTotalCoefficient = periodicEffects.reduce((sum, entry) => {
    const intervalMs = STATUS_DEFINITIONS[entry.statusId]?.periodic?.intervalMs ?? 0
    const ticks = intervalMs > 0 ? Math.floor(entry.durationMs / intervalMs) : 0
    return entry.periodic.type === 'deal-damage' ? sum + entry.periodic.components.reduce((part, component) => part + sourceBasicCoefficient(component.magnitude) * ticks, 0) : sum
  }, 0)
  const physicalComponentCount = periodicEffects.reduce((sum, entry) => entry.periodic.type === 'deal-damage' ? sum + entry.periodic.components.filter((component) => component.damageType === 'physical').length : sum, 0) + effects.reduce((sum, effect) => effect.type === 'deal-damage' ? sum + effect.components.filter((component) => component.damageType === 'physical').length : sum, 0)
  const maxControlMs = effects.reduce((max, effect) => effect.type === 'apply-status' && STATUS_DEFINITIONS[effect.statusId]?.tags.includes('control') && typeof effect.durationMs === 'number' ? Math.max(max, effect.durationMs) : max, 0)
  const patternCycleMs = Object.values(monster.actionPatterns).reduce((max, pattern) => Math.max(max, pattern.steps.reduce((sum, step) => sum + (step.type === 'basic' ? monster.basicAttackTimeMs : monster.actions[step.actionId ?? '']?.actionTimeMs ?? 0), 0)), 0)
  const direct = maximumEffectCoefficient(monster, 'damage')
  const heal = maximumEffectCoefficient(monster, 'heal')
  const barrier = maximumEffectCoefficient(monster, 'barrier')
  const warnings: string[] = []
  if (direct > 3) warnings.push('Repeatable direct hit exceeds 3× Basic')
  if (dotTotalCoefficient > 2) warnings.push('Repeatable DoT exceeds 2× Basic')
  if (heal > 0.2) warnings.push('Repeatable healing exceeds 20% Max HP')
  if (barrier > 0.25) warnings.push('Repeatable Barrier exceeds 25% Max HP')
  if (maxControlMs > 5000 && ['whispering-woods', 'howling-den', 'hunters-ground', 'abandoned-catacombs'].includes(LOCATION_BY_ID[id])) warnings.push('Act 0 control exceeds 5 seconds')
  if (physicalComponentCount) warnings.push(`${physicalComponentCount} Physical damage component(s)`)
  return [{ id, name: monster.name, location: LOCATIONS[LOCATION_BY_ID[id]] ?? 'Unknown', affinity: monster.primaryAffinity ?? '—', power: power.power, hp: monster.maxHealth, basicDamage: monster.basicAttackDamage, basicIntervalMs: monster.basicAttackTimeMs, basicDps: power.basicDps, maxRepeatableDirectCoefficient: direct, dotTotalCoefficient, repeatableHealPercent: heal, repeatableBarrierPercent: barrier, physicalComponentCount, maxControlMs, patternCycleMs, warnings }]
})
