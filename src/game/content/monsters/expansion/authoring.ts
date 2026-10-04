import type { CombatLocationId, MonsterId } from '../../../types'
import type { StatusId, TraitId } from '../../../systems/combat/combatTypes'
import type { ElementId } from '../../elements/elements'
import { makeCombatMonster, type CombatMonsterSpecial } from '../combatMonsterAuthoring'
import { action, basic, type MonsterDefinition } from '../monsterTypes'

export type AuthoredStep = string | 'basic'

export interface ExpansionMonsterStats {
  hp: number
  /** @deprecated Dead authoring field; basic damage is derived from targetPower. Retained until the balance audit removes it. */
  damage: number
  defense: number
  targetPower: number
  time?: number
}

export interface ExpansionNormalSpec extends ExpansionMonsterStats {
  id: MonsterId
  name: string
  subtitle: string
  locationId: CombatLocationId
  affinity: ElementId
  resonance: number
  specials: readonly [CombatMonsterSpecial, CombatMonsterSpecial]
  pattern: readonly AuthoredStep[]
  hunter?: NonNullable<MonsterDefinition['hunter']>
}

export type ExpansionNormalEntry = Omit<ExpansionNormalSpec, keyof ExpansionMonsterStats | 'locationId'>

export const provisionalExpansionStats = (locationDepth: number, rosterPosition: number): ExpansionMonsterStats => ({
  hp: 1800 + locationDepth * 850 + rosterPosition * 220,
  damage: 34 + locationDepth * 8 + rosterPosition * 4,
  defense: 12 + locationDepth * 3 + rosterPosition * 2,
  targetPower: 220 + locationDepth * 360 + rosterPosition * 28,
  time: 2300,
})

export const authorExpansionNormalAt = (locationId: CombatLocationId, locationDepth: number, rosterPosition: number, entry: ExpansionNormalEntry): MonsterDefinition => authorExpansionNormal({
  ...provisionalExpansionStats(locationDepth, rosterPosition),
  ...entry,
  locationId,
})

const actionPattern = (id: string, steps: readonly AuthoredStep[], actionIds: ReadonlySet<string>) => ({
  id,
  steps: steps.map((step, index) => step === 'basic'
    ? basic(`${id}-basic-${index + 1}`)
    : action(`${id}-action-${index + 1}`, actionIds.has(step) ? step : `${step}-special`)),
})

export const authorExpansionNormal = (spec: ExpansionNormalSpec): MonsterDefinition => {
  const actions = new Set(spec.specials.map(({ id }) => id))
  const steps = spec.pattern.map((step) => step === 'first' ? spec.specials[0].id : step === 'second' ? spec.specials[1].id : step)
  return {
    ...makeCombatMonster({
      combatV2: true, locationId: spec.locationId, id: spec.id, name: spec.name, subtitle: spec.subtitle,
      hp: spec.hp, damage: spec.damage, defense: spec.defense, time: spec.time ?? 2300, targetPower: spec.targetPower,
      primaryAffinity: spec.affinity, basicAttackElement: spec.affinity, resonanceYield: { [spec.affinity]: spec.resonance },
      specials: [...spec.specials], patternSteps: actionPattern('default', steps, actions).steps,
    }),
    ...(spec.hunter ? { hunter: spec.hunter } : {}),
  }
}

export interface ExpansionBossSpec extends ExpansionMonsterStats {
  id: MonsterId
  name: string
  subtitle: string
  locationId: CombatLocationId
  affinity: ElementId
  resonanceYield: MonsterDefinition['resonanceYield']
  traitId: TraitId
  phaseOneLabel: string
  phaseTwoLabel: string
  specials: readonly [CombatMonsterSpecial, CombatMonsterSpecial, CombatMonsterSpecial, CombatMonsterSpecial, CombatMonsterSpecial, CombatMonsterSpecial]
  phaseOne: readonly AuthoredStep[]
  phaseTwo: readonly AuthoredStep[]
}

const bossPattern = (id: string, steps: readonly AuthoredStep[]) => ({
  id,
  steps: steps.map((step, index) => step === 'basic' ? basic(`${id}-basic-${index + 1}`) : action(`${id}-action-${index + 1}`, step)),
})

export const authorExpansionBoss = (spec: ExpansionBossSpec): MonsterDefinition => {
  const secondPattern = 'phase-two'
  const specials = spec.specials.map((special, index) => ({ ...special, id: `skill-${index + 1}` })) as unknown as CombatMonsterSpecial[]
  return {
    ...makeCombatMonster({
      combatV2: true, locationId: spec.locationId, id: spec.id, name: spec.name, subtitle: spec.subtitle,
      hp: spec.hp, damage: spec.damage, defense: spec.defense, time: spec.time ?? 2300, targetPower: spec.targetPower,
      primaryAffinity: spec.affinity, basicAttackElement: spec.affinity, boss: true,
      resonanceYield: spec.resonanceYield, specials,
      combatV2Traits: [spec.traitId],
      actionPatterns: {
        'phase-one': bossPattern('phase-one', spec.phaseOne),
        'phase-two': bossPattern('phase-two', spec.phaseTwo),
      },
      defaultActionPatternId: 'phase-one',
    }),
    ui: { portraitIcon: 'boss', bestiary: { phaseLabels: { 'phase-one': spec.phaseOneLabel, 'phase-two': spec.phaseTwoLabel }, phaseOrder: ['phase-one', 'phase-two'] } },
  }
}

export const normalAction = (id: 'first-special' | 'second-special', name: string, options: Omit<CombatMonsterSpecial, 'id' | 'name'> = {}): CombatMonsterSpecial => ({ id, name, ...options })
export const bossAction = (name: string, options: Omit<CombatMonsterSpecial, 'id' | 'name'> = {}): CombatMonsterSpecial => ({ id: 'pending', name, ...options })
export const status = (id: StatusId, target: 'self' | 'opponent' = 'opponent') => ({ id, target })
export const hit = (type: ElementId, coefficient: number) => ({ type, coefficient })
