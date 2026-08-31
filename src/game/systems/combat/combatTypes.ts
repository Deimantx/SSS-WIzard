import type { DungeonId, ItemId, MonsterId, SchoolId, SpellId } from '../../types'

export type DamageType = 'physical' | 'arcane' | 'fire' | 'water' | 'earth' | 'air'

export type TraitId =
  | 'forest-wisp-flicker'
  | 'thornling-barkskin'
  | 'stone-rooted-shell'
  | 'grove-sentinel-ancient-growth'
  | 'forest-heart-living-core'
  | 'cavefang-wolf-predator-instinct'
  | 'razorclaw-lynx-relentless-hunter'
  | 'corrupted-dire-wolf-arcane-corruption'
  | 'corrupted-greatbear-thick-hide'
  | 'corrupted-greatbear-unstable-corruption'
  | 'restless-skeleton-brittle-bones'
  | 'grave-wraith-ethereal-form'
  | 'fallen-acolyte-grave-channeling'
  | 'archmage-edrin-arcane-remnant'
  | 'archmage-edrin-unbound-spirit'

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

export type CombatLogCategory =
  | 'basic-attack'
  | 'spell'
  | 'enemy-action'
  | 'damage'
  | 'heal'
  | 'barrier'
  | 'status'
  | 'trait'
  | 'death'
  | 'loot'
  | 'pattern'
  | 'system'

export type CombatLogSource =
  | { kind: 'player' }
  | { kind: 'enemy'; monsterId: MonsterId }
  | { kind: 'system' }

export interface CombatEvent {
  source: CombatLogSource
  sourceKind?: CombatSource['kind']
  target?: 'player' | 'enemy'
  targetMonsterId?: MonsterId
  dungeonId?: DungeonId
  category: CombatLogCategory
  sourceId?: string
  originSourceId?: string
  ruleId?: string
  spellId?: SpellId
  actionId?: string
  traitId?: TraitId
  statusId?: StatusId
  itemId?: ItemId
  damageType?: DamageType
  amount?: number
  attemptedAmount?: number
  effectiveAmount?: number
  overheal?: number
  healthDamage?: number
  barrierAbsorbed?: number
  /** Actual barrier capacity granted by this event. Replacements report the new capacity. */
  barrierGranted?: number
  barrierMode?: 'add' | 'replace'
  barrierBefore?: number
  barrierAfter?: number
  durationMs?: number | null
  stacks?: number
  timestampMs?: number
}

export type CombatLogEvent = CombatEvent

export interface CombatLogEntry extends CombatEvent {
  id: number
  sequence: number
  timestampMs: number
}

export interface CombatEventSink {
  push: (event: CombatEvent) => void
}

/** @deprecated Use CombatEvent. Kept for existing log-focused callers. */
export type CombatUiEventSink = CombatEventSink

export interface CombatSource {
  actor: 'player' | 'enemy'
  kind: 'basic-attack' | 'spell' | 'weapon' | 'status' | 'trait' | 'action' | 'equipment' | 'system'
  sourceId?: string
  /** Original authored source when a status tick derives from another effect. */
  originSourceId?: string
  /** Rule that produced this source, when the source came from a triggered rule. */
  ruleId?: string
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
  | 'bleeding'
  | 'spectral-fade'
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
  | { type: 'set-action-pattern'; target: EffectTarget; patternId: string }

export type ModifierKey =
  | 'damage-dealt-percent'
  | 'damage-taken-percent'
  | 'basic-attack-damage-percent'
  | 'basic-attack-speed-percent'
  | 'action-speed-percent'
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

export interface CombatModifier {
  key: ModifierKey
  value: number
  sourceTags?: CombatTag[]
  damageTypes?: DamageType[]
  statusTags?: CombatTag[]
  perStack?: boolean
  condition?: CombatCondition
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
  | 'on-action-start'
  | 'on-action-resolve'
  | 'on-heal'
  | 'on-heal-received'
  | 'on-barrier-gained'
  | 'on-status-removed'
  | 'on-status-expired'
  | 'on-kill'

export type CombatCondition =
  | { type: 'always' }
  | { type: 'self-hp-below-percent'; percent: number }
  | { type: 'target-hp-below-percent'; percent: number }
  | { type: 'self-has-status'; statusId: StatusId }
  | { type: 'target-has-status'; statusId: StatusId }
  | { type: 'self-has-barrier' }
  | { type: 'target-has-barrier' }
  | { type: 'self-hp-above-percent'; percent: number }
  | { type: 'target-hp-above-percent'; percent: number }
  | { type: 'self-status-stacks-at-least'; statusId: StatusId; stacks: number }
  | { type: 'target-status-stacks-at-least'; statusId: StatusId; stacks: number }
  | { type: 'self-barrier-at-least'; value: number }
  | { type: 'self-barrier-at-most'; value: number }
  | { type: 'target-barrier-at-least'; value: number }
  | { type: 'target-barrier-at-most'; value: number }
  | { type: 'source-has-tag'; tag: CombatTag }
  | { type: 'event-status-is'; statusId: StatusId }
  | { type: 'event-status-has-tag'; tag: CombatTag }
  | { type: 'event-action-is'; actionId: string }
  | { type: 'event-action-has-tag'; tag: CombatTag }
  | { type: 'source-is-self' }
  | { type: 'source-is-opponent' }
  | { type: 'all'; conditions: CombatCondition[] }
  | { type: 'any'; conditions: CombatCondition[] }
  | { type: 'not'; condition: CombatCondition }

export interface CombatTriggerRule {
  id: string
  event: CombatTrigger
  condition?: CombatCondition
  effects: CombatEffect[]
  oncePerEncounter?: boolean
  cooldownMs?: number
  priority?: number
}

export interface TraitDefinition {
  id: string
  name: string
  description: string
  modifiers?: CombatModifier[]
  rules?: CombatTriggerRule[]
  ui?: { shortDescription?: string; icon?: string; category?: string }
}

export interface CombatConditionContext {
  source?: CombatSource
  sourceTags?: CombatTag[]
  /** The actor affected by an event, when the event has an affected actor. */
  eventTarget?: 'player' | 'enemy'
  /** The actor whose HP/barrier/status changed for this event. */
  changedActor?: 'player' | 'enemy'
  amount?: number
  healthDamage?: number
  barrierDamage?: number
  damageType?: DamageType
  previousHp?: number
  currentHp?: number
  previousHpPercent?: number
  currentHpPercent?: number
  previousBarrier?: number
  currentBarrier?: number
  barrierGained?: number
  statusId?: StatusId
  /** Tags belonging to the Status involved in an apply/remove/expiry event. */
  eventStatusTags?: CombatTag[]
  /** Identity of the Action involved in an Action lifecycle event. */
  actionId?: string
  actionStepId?: string
  actionPatternId?: string
  eventActionTags?: CombatTag[]
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
  modifiers?: CombatModifier[]
  periodic?: { intervalMs: number; effects: CombatEffect[] }
  triggers?: CombatTriggerRule[]
  preventsAction?: boolean
  cleanseable: boolean
  dispellable: boolean
  ui?: { shortDescription?: string; icon?: string }
}

export interface CombatActionDefinition {
  id: string
  name: string
  description: string
  telegraphMs: number
  /** Optional recovery override after this Action resolves. */
  recoveryMs?: number
  effects: CombatEffect[]
  tags?: CombatTag[]
}

export type ActionStep =
  | { id: string; type: 'basic' }
  | { id: string; type: 'action'; actionId: string }

export interface ActionPattern {
  id: string
  steps: ActionStep[]
}
