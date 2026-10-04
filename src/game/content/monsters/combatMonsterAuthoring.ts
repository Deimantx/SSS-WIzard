import type { ActionStep, CombatEffect, CombatTag, DamageType, CombatLocationId, MonsterId, StatusId, TraitId } from '../../types'
import type { ElementId } from '../elements/elements'
import { action, applyStatus, basic, drainMana, gainBarrier, scaledDirectDamage, scaledDot, scaledHeal, scaledMultiDamage, type MonsterDefinition } from './monsterTypes'
import { STATUS_DEFINITIONS } from '../statuses/statuses'
import { deriveBasicDamageForTargetPower } from './monsterTypes'

export type CombatMonsterSpecial = { id: string; name: string; description?: string; actionTimeMs?: number; tags?: CombatTag[]; damage?: Array<{ type: DamageType; coefficient: number }>; hitCount?: number; status?: { id: StatusId; target?: 'self' | 'opponent'; stacks?: number }; dot?: { statusId: StatusId; damageType: DamageType; coefficient: number; durationMs: number }; barrier?: number; heal?: number; manaDrain?: number; delayOpponentMs?: number; detonateStatus?: { statusId: StatusId; multiplier: number; consume?: boolean } }
type Special = CombatMonsterSpecial
type CombatMonsterBase = { locationId: CombatLocationId; id: MonsterId; name: string; subtitle: string; hp: number; damage: number; defense: number; time?: number; resistances?: Partial<Record<DamageType, number>>; resonanceYield?: MonsterDefinition['resonanceYield']; icon?: MonsterDefinition['ui']; color?: string; specials: Special[]; boss?: boolean; patternSteps?: ActionStep[]; actionPatterns?: MonsterDefinition['actionPatterns']; defaultActionPatternId?: string }
export type CombatMonsterSpec = CombatMonsterBase & { combatV2: true; primaryAffinity: ElementId; basicAttackElement: ElementId; targetPower: number; trait?: TraitId; combatV2Traits?: TraitId[] }

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
  if (special.delayOpponentMs) tags.add('debuff')
  return [...tags]
}

const describeSpecial = (special: Special): string => {
  const clauses: string[] = []
  if (special.damage?.length) {
    const coefficient = special.damage.reduce((sum, hit) => sum + hit.coefficient, 0)
    const elements = [...new Set(special.damage.map((hit) => hit.type))].join(' and ')
    clauses.push(`deals ${coefficient.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}\u00d7 Basic ${elements} damage${special.hitCount && special.hitCount > 1 ? ' across ' + special.hitCount + ' hits' : ''}`)
  }
  if (special.dot) clauses.push(`applies ${STATUS_DEFINITIONS[special.dot.statusId]?.name ?? special.dot.statusId} for ${special.dot.durationMs / 1000} seconds (${special.dot.coefficient}× Basic damage over time)`)
  if (special.status) clauses.push(`${special.status.target === 'self' ? 'grants itself' : 'applies'} ${STATUS_DEFINITIONS[special.status.id]?.name ?? special.status.id}`)
  if (special.barrier) clauses.push(`raises a Barrier equal to ${Math.round(special.barrier * 100)}% of Max Health`)
  if (special.heal) clauses.push(`restores ${Math.round(special.heal * 100)}% of Max Health`)
  if (special.manaDrain) clauses.push(`drains ${special.manaDrain} Mana`)
  if (special.delayOpponentMs) clauses.push(`delays the opponent's current action by ${special.delayOpponentMs} ms`)
  if (special.detonateStatus) clauses.push(`detonates ${STATUS_DEFINITIONS[special.detonateStatus.statusId]?.name ?? special.detonateStatus.statusId} for ${special.detonateStatus.multiplier}× damage`)
  return clauses.length ? `${special.name} ${clauses.join(' and ')}.` : `${special.name} has no authored combat effect.`
}

const specialEffects = (special: Special): CombatEffect[] => [
  ...(special.damage?.length ? [{ ...(special.damage.length === 1 ? scaledDirectDamage(special.damage[0].type, special.damage[0].coefficient) : scaledMultiDamage(special.damage.map(({ type, coefficient }) => ({ damageType: type, coefficient })))), ...(special.hitCount && special.hitCount > 1 ? { hitCount: special.hitCount } : {}) }] : []),
  ...(special.dot ? [scaledDot(special.dot.statusId, special.dot.damageType, special.dot.coefficient, special.dot.durationMs)] : special.status ? [applyStatus(special.status.id, special.status.target ?? 'opponent', undefined, special.status.stacks)] : []),
  ...(special.barrier ? [gainBarrier({ type: 'source-max-health-percent', value: special.barrier })] : []),
  ...(special.heal ? [scaledHeal(special.heal)] : []),
  ...(special.manaDrain ? [drainMana(special.manaDrain)] : []),
  ...(special.delayOpponentMs ? [{ type: 'modify-action-timer' as const, target: 'opponent' as const, amountMs: special.delayOpponentMs, action: 'current' as const }] : []),
  ...(special.detonateStatus ? [{ type: 'detonate-status' as const, target: 'opponent' as const, statusId: special.detonateStatus.statusId, multiplier: special.detonateStatus.multiplier, consume: special.detonateStatus.consume }] : []),
]

export const makeCombatMonster = (spec: CombatMonsterSpec): MonsterDefinition => {
  const actions: MonsterDefinition['actions'] = Object.fromEntries(spec.specials.map((special, index) => [special.id, {
    id: special.id, name: special.name, actionTimeMs: special.actionTimeMs ?? 1800 + index * 180, description: special.description ?? describeSpecial(special), effects: specialEffects(special), tags: special.tags ?? getSpecialTags(special),
  }]))
  const steps = spec.patternSteps ?? (spec.specials.length > 3
    ? spec.specials.flatMap((special, index) => [action(`${special.id}-step`, special.id), ...(index === spec.specials.length - 1 ? [] : [basic(`basic-${index + 1}`)])])
    : [basic('basic-1'), action(`${spec.specials[0].id}-step`, spec.specials[0].id), basic('basic-2'), action(`${spec.specials[1].id}-step`, spec.specials[1].id)])
  const basicAttackDamage = deriveBasicDamageForTargetPower({ maxHealth: spec.hp, defense: spec.defense, basicAttackTimeMs: spec.time ?? 2300, targetPower: spec.targetPower })
  return {
    id: spec.id, bestiaryCategory: spec.boss ? 'boss' : 'monster', name: spec.name, subtitle: spec.subtitle, primaryAffinity: spec.primaryAffinity, basicAttackElement: spec.basicAttackElement, maxHealth: spec.hp, basicAttackDamage, basicAttackTimeMs: spec.time ?? 2300, defense: spec.defense,
    resistances: spec.resistances, resonanceYield: spec.resonanceYield, color: spec.color ?? '#9b8dbd', ui: spec.icon ?? { portraitIcon: spec.boss ? 'boss' : 'guardian' }, traitIds: spec.combatV2Traits ?? (spec.trait ? [spec.trait] : []),
    actions, actionPatterns: spec.actionPatterns ?? { default: { id: 'default', steps } }, defaultActionPatternId: spec.defaultActionPatternId ?? 'default', loot: [],
  }
}
