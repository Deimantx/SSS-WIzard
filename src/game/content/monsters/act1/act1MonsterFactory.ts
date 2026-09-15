import type { CombatEffect, DamageType, DungeonId, MonsterId, StatusId, TraitId } from '../../../types'
import { action, applyStatus, basic, drainMana, gainBarrier, scaledDirectDamage, scaledDot, scaledHeal, scaledMultiDamage, withDungeonLoot, type MonsterDefinition } from '../monsterTypes'

type Special = { id: string; name: string; damage?: Array<{ type: DamageType; coefficient: number }>; status?: { id: StatusId; target?: 'self' | 'opponent'; stacks?: number }; dot?: { statusId: StatusId; damageType: DamageType; coefficient: number; durationMs: number }; barrier?: number; heal?: number; manaDrain?: number }
export type Act1MonsterSpec = { dungeonId: DungeonId; id: MonsterId; name: string; subtitle: string; hp: number; damage: number; defense: number; time?: number; resistances?: Partial<Record<DamageType, number>>; trait: TraitId; icon?: MonsterDefinition['ui']; color?: string; specials: Special[]; boss?: boolean; lifeEssence?: { min: number; max: number } }

const specialEffects = (special: Special): CombatEffect[] => [
  ...(special.damage?.length ? [special.damage.length === 1 ? scaledDirectDamage(special.damage[0].type, special.damage[0].coefficient) : scaledMultiDamage(special.damage.map(({ type, coefficient }) => ({ damageType: type, coefficient })))] : []),
  ...(special.dot ? [scaledDot(special.dot.statusId, special.dot.damageType, special.dot.coefficient, special.dot.durationMs)] : special.status ? [applyStatus(special.status.id, special.status.target ?? 'opponent', undefined, special.status.stacks)] : []),
  ...(special.barrier ? [gainBarrier({ type: 'source-max-health-percent', value: special.barrier })] : []),
  ...(special.heal ? [scaledHeal(special.heal)] : []),
  ...(special.manaDrain ? [drainMana(special.manaDrain)] : []),
]

export const makeAct1Monster = (spec: Act1MonsterSpec): MonsterDefinition => {
  const actions: MonsterDefinition['actions'] = Object.fromEntries(spec.specials.map((special, index) => [special.id, {
    id: special.id, name: special.name, actionTimeMs: 1800 + index * 180, description: `${spec.name} uses ${special.name}.`, effects: specialEffects(special), tags: ['special'] as const,
  }]))
  const steps = spec.specials.length > 3
    ? spec.specials.flatMap((special, index) => [action(`${special.id}-step`, special.id), ...(index === spec.specials.length - 1 ? [] : [basic(`basic-${index + 1}`)])])
    : [basic('basic-1'), action(`${spec.specials[0].id}-step`, spec.specials[0].id), basic('basic-2'), action(`${spec.specials[1].id}-step`, spec.specials[1].id)]
  return {
    id: spec.id, bestiaryCategory: spec.boss ? 'boss' : 'monster', name: spec.name, subtitle: spec.subtitle, maxHealth: spec.hp, basicAttackDamage: spec.damage, basicAttackTimeMs: spec.time ?? 2300, defense: spec.defense,
    resistances: spec.resistances, color: spec.color ?? '#9b8dbd', ui: spec.icon ?? { portraitIcon: spec.boss ? 'boss' : 'guardian' }, traitIds: [spec.trait],
    actions, actionPatterns: { default: { id: 'default', steps } }, defaultActionPatternId: 'default', loot: withDungeonLoot(spec.dungeonId!, spec.boss ? 'boss' : 'normal', spec.lifeEssence),
  }
}

// Dungeon is kept on the authored spec so each record remains easy to audit.
