import type { CombatEffect, CombatTag, DamageType, DungeonId, MonsterId, StatusId, TraitId } from '../../../types'
import type { ElementId } from '../../elements/elements'
import { action, applyStatus, basic, drainMana, gainBarrier, scaledDirectDamage, scaledDot, scaledHeal, scaledMultiDamage, type MonsterDefinition } from '../monsterTypes'
import { DEFENSE_K, MAX_DEFENSE_REDUCTION } from '../../../core/balance/combatStats'
import { STATUS_DEFINITIONS } from '../../statuses/statuses'

type Special = { id: string; name: string; description?: string; actionTimeMs?: number; tags?: CombatTag[]; damage?: Array<{ type: DamageType; coefficient: number }>; status?: { id: StatusId; target?: 'self' | 'opponent'; stacks?: number }; dot?: { statusId: StatusId; damageType: DamageType; coefficient: number; durationMs: number }; barrier?: number; heal?: number; manaDrain?: number }
export type Act1MonsterSpec = { dungeonId: DungeonId; id: MonsterId; name: string; subtitle: string; hp: number; damage: number; targetPower?: number; primaryAffinity?: ElementId; basicAttackElement?: ElementId; combatV2?: boolean; defense: number; time?: number; resistances?: Partial<Record<DamageType, number>>; resonanceYield?: MonsterDefinition['resonanceYield']; trait: TraitId; combatV2Traits?: TraitId[]; icon?: MonsterDefinition['ui']; color?: string; specials: Special[]; boss?: boolean }

const getSpecialTags = (special: Special): CombatTag[] => {
  const tags = new Set<CombatTag>(['special'])
  special.damage?.forEach(({ type }) => { tags.add('direct'); tags.add(type as CombatTag) })
  if (special.dot) { tags.add('dot'); tags.add('debuff'); tags.add(special.dot.damageType as CombatTag) }
  if (special.status) {
    const status = STATUS_DEFINITIONS[special.status.id]
    status?.tags.forEach((tag) => tags.add(tag))
    if (special.status.target === 'self') tags.add('buff')
    else tags.add('debuff')
  }
  if (special.barrier) tags.add('barrier')
  if (special.heal) tags.add('heal')
  if (special.manaDrain) { tags.add('special'); tags.add('debuff') }
  return [...tags]
}

const describeSpecial = (special: Special): string => {
  const clauses: string[] = []
  if (special.damage?.length) {
    const coefficient = special.damage.reduce((sum, hit) => sum + hit.coefficient, 0)
    const elements = [...new Set(special.damage.map((hit) => hit.type))].join(' and ')
    clauses.push(`deals ${coefficient.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}× Basic ${elements} damage`)
  }
  if (special.dot) clauses.push(`applies ${STATUS_DEFINITIONS[special.dot.statusId]?.name ?? special.dot.statusId} for ${special.dot.durationMs / 1000} seconds (${special.dot.coefficient}× Basic damage over time)`)
  if (special.status) clauses.push(`${special.status.target === 'self' ? 'grants itself' : 'applies'} ${STATUS_DEFINITIONS[special.status.id]?.name ?? special.status.id}`)
  if (special.barrier) clauses.push(`raises a Barrier equal to ${Math.round(special.barrier * 100)}% of Max Health`)
  if (special.heal) clauses.push(`restores ${Math.round(special.heal * 100)}% of Max Health`)
  if (special.manaDrain) clauses.push(`drains ${special.manaDrain} Mana`)
  return clauses.length ? `${special.name} ${clauses.join(' and ')}.` : `${special.name} changes the fight through its authored effect.`
}

const specialEffects = (special: Special): CombatEffect[] => [
  ...(special.damage?.length ? [special.damage.length === 1 ? scaledDirectDamage(special.damage[0].type, special.damage[0].coefficient) : scaledMultiDamage(special.damage.map(({ type, coefficient }) => ({ damageType: type, coefficient })))] : []),
  ...(special.dot ? [scaledDot(special.dot.statusId, special.dot.damageType, special.dot.coefficient, special.dot.durationMs)] : special.status ? [applyStatus(special.status.id, special.status.target ?? 'opponent', undefined, special.status.stacks)] : []),
  ...(special.barrier ? [gainBarrier({ type: 'source-max-health-percent', value: special.barrier })] : []),
  ...(special.heal ? [scaledHeal(special.heal)] : []),
  ...(special.manaDrain ? [drainMana(special.manaDrain)] : []),
]

export const makeAct1Monster = (spec: Act1MonsterSpec): MonsterDefinition => {
  const actions: MonsterDefinition['actions'] = Object.fromEntries(spec.specials.map((special, index) => [special.id, {
    id: special.id, name: special.name, actionTimeMs: special.actionTimeMs ?? 1800 + index * 180, description: special.description ?? describeSpecial(special), effects: specialEffects(special), tags: special.tags ?? getSpecialTags(special),
  }]))
  const steps = spec.specials.length > 3
    ? spec.specials.flatMap((special, index) => [action(`${special.id}-step`, special.id), ...(index === spec.specials.length - 1 ? [] : [basic(`basic-${index + 1}`)])])
    : [basic('basic-1'), action(`${spec.specials[0].id}-step`, spec.specials[0].id), basic('basic-2'), action(`${spec.specials[1].id}-step`, spec.specials[1].id)]
  const defenseReduction = Math.min(MAX_DEFENSE_REDUCTION, spec.defense / (spec.defense + DEFENSE_K))
  const effectiveHealth = spec.hp / Math.max(0.01, 1 - defenseReduction)
  const basicAttackDamage = spec.targetPower === undefined ? spec.damage : (spec.targetPower / 10) ** 2 * Math.max(0.1, (spec.time ?? 2300) / 1000) / effectiveHealth
  return {
    id: spec.id, bestiaryCategory: spec.boss ? 'boss' : 'monster', name: spec.name, subtitle: spec.subtitle, primaryAffinity: spec.primaryAffinity, basicAttackElement: spec.basicAttackElement ?? spec.primaryAffinity, maxHealth: spec.hp, basicAttackDamage, basicAttackTimeMs: spec.time ?? 2300, defense: spec.defense,
    resistances: spec.resistances, resonanceYield: spec.resonanceYield, color: spec.color ?? '#9b8dbd', ui: spec.icon ?? { portraitIcon: spec.boss ? 'boss' : 'guardian' }, traitIds: spec.combatV2 ? (spec.combatV2Traits ?? []) : [spec.trait],
    actions, actionPatterns: { default: { id: 'default', steps } }, defaultActionPatternId: 'default', loot: [],
  }
}

// Dungeon is kept on the authored spec so each record remains easy to audit.
