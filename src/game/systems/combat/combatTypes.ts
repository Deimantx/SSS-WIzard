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

export interface DamageComponent {
  damageType: DamageType
  magnitude: Magnitude
}

export interface CombatDamageComponentEvent {
  damageType: DamageType
  raw: number
  amount: number
  healthDamage: number
  barrierAbsorbed: number
  immune: boolean
}

/** Transient resolution state. Never serialize this into GameState/save data. */
export interface CombatResolutionContext {
  cascadeId: number
  /** Rules that passed non-random eligibility and have already attempted this cascade. */
  attemptedRuleKeys: Set<string>
  executedRuleKeys: Set<string>
  hitSequence?: number
}

let nextCascadeId = 0
export const createCombatResolutionContext = (): CombatResolutionContext => ({
  cascadeId: ++nextCascadeId,
  attemptedRuleKeys: new Set<string>(),
  executedRuleKeys: new Set<string>(),
  hitSequence: 0,
})

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

export type CombatActionPhase = 'start' | 'resolve'
export type CombatStatusPhase = 'apply' | 'remove' | 'expire'
export type CombatFailureReason = 'unknown' | 'locked' | 'stunned' | 'inactive' | 'no-target' | 'cooldown' | 'mana'
export type CombatAlertPriority = 'critical' | 'important' | 'info'

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
  originSourceKind?: CombatSource['kind']
  originTags?: CombatTag[]
  originSchool?: SchoolId
  /** Equipment/provider instance identity, such as ring1 or ring2. */
  providerInstanceKey?: string
  sourceMonsterId?: MonsterId
  sourceInstanceKey?: string
  originMonsterId?: MonsterId
  originInstanceKey?: string
  statusInstanceKey?: string
  ruleId?: string
  spellId?: SpellId
  actionId?: string
  actionPhase?: CombatActionPhase
  traitId?: TraitId
  statusId?: StatusId
  statusPhase?: CombatStatusPhase
  itemId?: ItemId
  damageType?: DamageType
  /** All damage types represented by one Hit. */
  damageTypes?: DamageType[]
  /** Final per-component breakdown for one Hit; total event fields remain summed once. */
  damageComponents?: CombatDamageComponentEvent[]
  hitId?: string
  amount?: number
  attemptedAmount?: number
  effectiveAmount?: number
  overheal?: number
  healthDamage?: number
  barrierAbsorbed?: number
  critical?: boolean
  critChance?: number
  critMultiplier?: number
  blocked?: boolean
  blockChance?: number
  blockReduction?: number
  blockedAmount?: number
  /** Actual barrier capacity granted by this event. Replacements report the new capacity. */
  barrierGranted?: number
  barrierMode?: 'add' | 'replace'
  barrierBefore?: number
  barrierAfter?: number
  durationMs?: number | null
  stacks?: number
  failure?: CombatFailureReason
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

export interface CombatAlertObserver {
  beginRun: (dungeonId: DungeonId) => void
  advance: (deltaMs: number, state: import('../../types').GameState) => void
  consume: (event: CombatEvent) => void
  clear: () => void
}

/** @deprecated Use CombatEvent. Kept for existing log-focused callers. */
export type CombatUiEventSink = CombatEventSink

export interface CombatSource {
  actor: 'player' | 'enemy'
  kind: 'basic-attack' | 'spell' | 'weapon' | 'status' | 'trait' | 'action' | 'equipment' | 'system'
  sourceId?: string
  /** Authored Monster that owns an Enemy source. */
  sourceMonsterId?: MonsterId
  /** Deterministic encounter identity for an Enemy source. */
  sourceInstanceKey?: string
  /** Original authored source when a status tick derives from another effect. */
  originSourceId?: string
  originMonsterId?: MonsterId
  originInstanceKey?: string
  /** Original source kind retained when a periodic tick becomes a status source. */
  originSourceKind?: CombatSource['kind']
  /** Tags from the authored source that caused a derived event. */
  originTags?: CombatTag[]
  /** School from the authored source that caused a derived event. */
  originSchool?: SchoolId
  /** Equipment/provider instance identity, such as ring1 or ring2. */
  providerInstanceKey?: string
  /** Stable identity of the status instance that produced a periodic event. */
  statusInstanceKey?: string
  /** Rule that produced this source, when the source came from a triggered rule. */
  ruleId?: string
  /** Authored status identity when this source is status-owned. */
  statusId?: StatusId
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
  | { type: 'spell-power'; coefficient: number }
  | { type: 'target-missing-health-percent'; value: number }

/** Pure linear scaling for authored total magnitudes such as periodic payloads. */
export const scaleMagnitude = (magnitude: Magnitude, factor: number): Magnitude => {
  const scale = Number.isFinite(factor) ? factor : 0
  switch (magnitude.type) {
    case 'flat': return { type: 'flat', value: magnitude.value * scale }
    case 'source-max-health-percent': return { type: 'source-max-health-percent', value: magnitude.value * scale }
    case 'target-max-health-percent': return { type: 'target-max-health-percent', value: magnitude.value * scale }
    case 'source-basic-damage-percent': return { type: 'source-basic-damage-percent', value: magnitude.value * scale }
    case 'spell-power': return { type: 'spell-power', coefficient: magnitude.coefficient * scale }
    case 'school-level': return { type: 'school-level', base: magnitude.base * scale, perLevel: magnitude.perLevel * scale, school: magnitude.school }
    case 'target-missing-health-percent': return { type: 'target-missing-health-percent', value: magnitude.value * scale }
  }
}

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
  | { type: 'deal-damage'; target: EffectTarget; components: DamageComponent[]; tags?: CombatTag[]; school?: SchoolId }
  | { type: 'heal'; target: EffectTarget; magnitude: Magnitude; tags?: CombatTag[] }
  | { type: 'gain-barrier'; target: EffectTarget; magnitude: Magnitude; mode?: 'add' | 'replace'; durationMs?: number | null; tags?: CombatTag[] }
  | { type: 'restore-resource'; target: EffectTarget; resource: ResourceId; magnitude: Magnitude; tags?: CombatTag[] }
  | { type: 'drain-resource'; target: EffectTarget; resource: ResourceId; magnitude: Magnitude; tags?: CombatTag[] }
  | { type: 'apply-status'; target: EffectTarget; statusId: StatusId; durationMs?: number | null; stacks?: number; periodicEffects?: CombatEffect[]; statusSourceKey?: string; modifierOverrides?: Partial<Record<ModifierKey, number>>; tags?: CombatTag[] }
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
  | 'barrier-received-flat'
  | 'barrier-received-percent'
  | 'mana-regen-percent'
  | 'cooldown-recovery-percent'
  | 'control-duration-received-percent'
  | 'status-duration-dealt-percent'
  | 'status-duration-received-percent'
  | 'defense-flat'
  | 'crit-chance'
  | 'crit-damage'
  | 'block-chance'
  | 'damage-over-time-percent'
  | 'resistance-percent'

export interface CombatModifier {
  key: ModifierKey
  value: number
  sourceKinds?: Array<CombatSource['kind']>
  sourceTags?: CombatTag[]
  originSourceKinds?: Array<CombatSource['kind']>
  originTags?: CombatTag[]
  statusIds?: StatusId[]
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
  | { type: 'event-damage-type-is'; damageType: DamageType }
  | { type: 'target-has-status-tag'; tag: CombatTag }
  | { type: 'event-target-is-self' }
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
  chance?: number
  priority?: number
  /** Neutral player-facing metadata for authored triggered effects. */
  ui?: { name?: string; description?: string }
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
  /** Damage types represented by the current Hit; type conditions use any-match semantics. */
  damageTypes?: DamageType[]
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
  /** Stable identity for this status application slot. */
  instanceKey: string
  source: CombatSource
  remainingMs: number | null
  /** Resolved duration used as the denominator for this application. */
  initialDurationMs: number | null
  stacks: number
  nextTickMs?: number
  appliedAt?: number
  /** Optional source-specific periodic payload snapshotted on application. */
  periodicEffects?: CombatEffect[]
  /** Application-time potency values override authored Status modifiers. */
  modifierOverrides?: Partial<Record<ModifierKey, number>>
}

export interface StatusDefinition {
  id: StatusId
  name: string
  description: string
  classification: 'buff' | 'debuff' | 'neutral'
  tags: CombatTag[]
  /** Defaults to single. Per-source allows independent source instances. */
  applicationPolicy?: 'single' | 'per-source'
  defaultDurationMs: number | null
  stacking: {
    mode: 'replace' | 'refresh' | 'extend' | 'stacks' | 'strongest'
    maxStacks?: number
    maxDurationMs?: number
  }
  /** Required for strongest statuses so potency comparison is explicit. */
  potencyKey?: ModifierKey
  /** Whether a larger or smaller effective modifier value is stronger. */
  potencyDirection?: 'higher' | 'lower'
  modifiers?: CombatModifier[]
  periodic?: { intervalMs: number; effects: CombatEffect[] }
  triggers?: CombatTriggerRule[]
  preventsAction?: boolean
  cleanseable: boolean
  dispellable: boolean
  ui?: { shortDescription?: string; icon?: string; alert?: CombatAlertPriority }
}

export interface CombatActionDefinition {
  id: string
  name: string
  description: string
  /** Base duration of the Action before its effects resolve. */
  actionTimeMs: number
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
