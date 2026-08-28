import type { SchoolId } from '../../types'

export type DamageType = 'physical' | 'arcane' | 'fire' | 'water' | 'earth' | 'air'

export type CombatTag =
  | 'basic-attack'
  | 'spell'
  | 'weapon'
  | 'equipment'
  | 'melee'
  | 'ranged'
  | 'magic'
  | 'direct'
  | 'heal'
  | 'dot'
  | 'hot'
  | 'status'
  | 'special'
  | 'trait'
  | 'buff'
  | 'debuff'
  | 'control'
  | 'barrier'
  | DamageType

export interface CombatSource {
  actor: 'player' | 'enemy'
  kind: 'basic-attack' | 'spell' | 'weapon' | 'status' | 'trait' | 'special-attack' | 'equipment' | 'system'
  sourceId?: string
  /** Original authored source when a status tick derives from another effect. */
  originSourceId?: string
  school?: SchoolId
  tags?: CombatTag[]
}

export type EffectTarget = 'self' | 'opponent'

export type Magnitude =
  | { type: 'flat'; value: number }
  | { type: 'source-max-health-percent'; value: number }
  | { type: 'target-max-health-percent'; value: number }
  | { type: 'source-basic-damage-percent'; value: number }
  | { type: 'school-level'; base: number; perLevel: number; school: SchoolId }
  | { type: 'target-missing-health-percent'; value: number }

export type ResourceId = 'mana'

export type StatusId =
  | 'burning'
  | 'quickening'
  | 'thorn-wound'
  | 'chilled'
  | 'regeneration'
  | 'fortified'
  | 'shock'
  | 'staggered'
  | 'vulnerable'
  | 'purified'
  | 'haste'
  | 'stunned'

export type CombatEffect =
  | { type: 'deal-damage'; target: EffectTarget; damageType: DamageType; magnitude: Magnitude; tags?: CombatTag[]; school?: SchoolId }
  | { type: 'heal'; target: EffectTarget; magnitude: Magnitude; tags?: CombatTag[] }
  | { type: 'gain-barrier'; target: EffectTarget; magnitude: Magnitude; mode?: 'add' | 'replace'; durationMs?: number | null; tags?: CombatTag[] }
  | { type: 'restore-resource'; target: EffectTarget; resource: ResourceId; magnitude: Magnitude; tags?: CombatTag[] }
  | { type: 'drain-resource'; target: EffectTarget; resource: ResourceId; magnitude: Magnitude; tags?: CombatTag[] }
  | { type: 'apply-status'; target: EffectTarget; statusId: StatusId; durationMs?: number | null; stacks?: number; tags?: CombatTag[] }
  | { type: 'remove-status'; target: EffectTarget; statusId: StatusId }
  | { type: 'cleanse'; target: EffectTarget; mode: 'one' | 'all' | 'tag'; tag?: CombatTag }
  | { type: 'dispel'; target: EffectTarget; mode: 'one' | 'all' | 'tag'; tag?: CombatTag }
  | { type: 'modify-action-timer'; target: EffectTarget; amountMs: number; action: 'basic-attack' | 'current' }
  | { type: 'modify-cooldown'; target: EffectTarget; amountMs: number; spellId?: string }
  | { type: 'interrupt'; target: EffectTarget }

export type ModifierKey =
  | 'damage-dealt-percent'
  | 'damage-taken-percent'
  | 'basic-attack-damage-percent'
  | 'basic-attack-speed-percent'
  | 'spell-damage-percent'
  | 'melee-damage-percent'
  | 'ranged-damage-percent'
  | 'healing-done-percent'
  | 'healing-received-percent'
  | 'barrier-power-percent'
  | 'barrier-received-percent'
  | 'mana-regen-percent'
  | 'cooldown-recovery-percent'
  | 'control-duration-received-percent'
  | 'status-duration-dealt-percent'
  | 'status-duration-received-percent'

export interface StatusModifier {
  key: ModifierKey
  value: number
  sourceTags?: CombatTag[]
  damageTypes?: DamageType[]
  statusTags?: CombatTag[]
  perStack?: boolean
}

export type CombatTrigger =
  | 'on-combat-start'
  | 'on-basic-attack-hit'
  | 'on-spell-hit'
  | 'on-damage-dealt'
  | 'on-damage-taken'
  | 'on-barrier-broken'
  | 'on-status-applied'
  | 'on-hp-threshold'
  | 'on-special-resolve'
  | 'on-heal'
  | 'on-kill'

export type CombatCondition =
  | { type: 'always' }
  | { type: 'self-hp-below-percent'; percent: number }
  | { type: 'target-hp-below-percent'; percent: number }
  | { type: 'self-has-status'; statusId: StatusId }
  | { type: 'target-has-status'; statusId: StatusId }
  | { type: 'self-has-barrier' }
  | { type: 'target-has-barrier' }
  | { type: 'source-has-tag'; tag: CombatTag }
  | { type: 'status-stack-at-least'; statusId: StatusId; stacks: number }
  | { type: 'all'; conditions: CombatCondition[] }
  | { type: 'any'; conditions: CombatCondition[] }
  | { type: 'not'; condition: CombatCondition }

export interface CombatTriggerRule {
  id: string
  event: CombatTrigger
  condition?: CombatCondition
  effects: CombatEffect[]
  oncePerEncounter?: boolean
}

export interface TraitDefinition {
  id: string
  name: string
  description: string
  modifiers?: StatusModifier[]
  rules?: CombatTriggerRule[]
}

export interface ActiveStatus {
  statusId: StatusId
  holder: 'player' | 'enemy'
  source: CombatSource
  remainingMs: number | null
  stacks: number
  nextTickMs?: number
  appliedAt?: number
}

export interface StatusDefinition {
  id: StatusId
  name: string
  description: string
  classification: 'buff' | 'debuff' | 'neutral'
  tags: CombatTag[]
  defaultDurationMs: number | null
  stacking: {
    mode: 'replace' | 'refresh' | 'extend' | 'stacks' | 'strongest'
    maxStacks?: number
    maxDurationMs?: number
  }
  modifiers?: StatusModifier[]
  periodic?: { intervalMs: number; effects: CombatEffect[] }
  triggers?: CombatTriggerRule[]
  preventsAction?: boolean
  cleanseable: boolean
  dispellable: boolean
  ui?: { shortDescription?: string; icon?: string }
}

export interface SpecialAttackDefinition {
  id: string
  name: string
  telegraphMs: number
  description: string
  effects: CombatEffect[]
  tags?: CombatTag[]
  interruptible?: boolean
}
