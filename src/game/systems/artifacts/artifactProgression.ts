import { ARTIFACTS, isArtifactId, type ArtifactDefinition, type ArtifactMinorNodeDefinition, type ArtifactResolvedEffects } from '../../content/artifacts/artifacts'
import { SPELLS } from '../../content/spells/spells'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { grantItem } from '../inventory/itemAcquisition'
import { spendResonanceBundle } from '../resonance/resonanceRuntime'
import { RESONANCE_METADATA, type ResonanceType } from '../../content/resonance/resonance'
import type { ArtifactId, ArtifactProgressState, EquipmentStats, GameState, ItemId } from '../../types'
import { addEquipmentStats } from '../../core/equipment/equipmentStatAggregation'
import { scaleMagnitude, type CombatConditionContext, type CombatEffect, type CombatEventSink, type CombatResolutionContext, type CombatSource, type CombatTrigger } from '../combat/combatTypes'

const EMPTY: ArtifactProgressState = { minorRanks: {} }
export const getArtifactDefinition = (id: ArtifactId) => ARTIFACTS[id]
export const isArtifactItem = (id: ItemId): id is ArtifactId => isArtifactId(id)
export const getArtifactProgress = (state: Pick<GameState, 'artifactProgress'>, id: ArtifactId) => state.artifactProgress?.[id] ?? EMPTY
const getNode = (id: ArtifactId, nodeId: string) => ARTIFACTS[id]?.minorNodes.find((node) => node.id === nodeId)
export const getArtifactMinorRank = (state: Pick<GameState, 'artifactProgress'>, artifactId: ArtifactId, nodeId: string) => Math.max(0, Math.min(10, Math.floor(getArtifactProgress(state, artifactId).minorRanks[nodeId] ?? 0)))
export const getArtifactTotalInvestedRanks = (state: Pick<GameState, 'artifactProgress'>, artifactId: ArtifactId) => ARTIFACTS[artifactId]?.minorNodes.reduce((total, node) => total + getArtifactMinorRank(state, artifactId, node.id), 0) ?? 0
export const getArtifactMaxInvestedRanks = (artifactId: ArtifactId) => (ARTIFACTS[artifactId]?.minorNodes.length ?? 0) * 10
export const getArtifactUnlockedMajorMilestones = (state: Pick<GameState, 'artifactProgress'>, artifactId: ArtifactId) => (ARTIFACTS[artifactId]?.majorMilestones ?? []).filter((major) => getArtifactTotalInvestedRanks(state, artifactId) >= major.unlockAtTotalRanks)
export const getArtifactNextMajorMilestone = (state: Pick<GameState, 'artifactProgress'>, artifactId: ArtifactId) => (ARTIFACTS[artifactId]?.majorMilestones.find((major) => getArtifactTotalInvestedRanks(state, artifactId) < major.unlockAtTotalRanks) ?? null)
export const getArtifactCompletionPercent = (state: Pick<GameState, 'artifactProgress'>, artifactId: ArtifactId) => { const max = getArtifactMaxInvestedRanks(artifactId); return max > 0 ? getArtifactTotalInvestedRanks(state, artifactId) / max : 0 }
export const getArtifactRankCost = (artifactId: ArtifactId, nodeId: string, nextRank = 1) => getNode(artifactId, nodeId)?.rankCosts[nextRank - 1] ?? null

const addEffects = (target: EquipmentStats, resolved?: ArtifactResolvedEffects) => addEquipmentStats(target, resolved?.stats)
const getActiveEffects = (state: Pick<GameState, 'artifactProgress'>, artifactId: ArtifactId) => {
  const definition = ARTIFACTS[artifactId]
  if (!definition) return [] as Array<{ name: string; effects: ArtifactResolvedEffects }>
  const active: Array<{ name: string; effects: ArtifactResolvedEffects }> = [{ name: 'Rank 0 Baseline', effects: definition.baseline }]
  definition.minorNodes.forEach((node) => { for (let rank = 1; rank <= getArtifactMinorRank(state, artifactId, node.id); rank += 1) active.push({ name: `${node.name} · Rank ${rank}`, effects: node.rankEffects[rank - 1] }) })
  getArtifactUnlockedMajorMilestones(state, artifactId).forEach((major) => active.push({ name: major.name, effects: major.effects }))
  return active
}
type ArtifactCombatModifier = NonNullable<NonNullable<ArtifactResolvedEffects['combat']>['modifiers']>[number]

const artifactModifierIdentity = (modifier: ArtifactCombatModifier) => JSON.stringify({ ...modifier, value: undefined })

/** Shared current-state aggregation for runtime consumers and Artifact Path presentation. */
export const mergeArtifactResolvedEffects = (effects: readonly ArtifactResolvedEffects[]): ArtifactResolvedEffects => {
  const stats = effects.reduce<EquipmentStats>((total, entry) => addEffects(total, entry), {})
  const modifiers = new Map<string, ArtifactCombatModifier>()
  const rules = effects.flatMap((entry) => entry.combat?.rules ?? [])
  const special = effects.flatMap((entry) => entry.special ?? [])

  effects.flatMap((entry) => entry.combat?.modifiers ?? []).forEach((modifier) => {
    const key = artifactModifierIdentity(modifier)
    const prior = modifiers.get(key)
    modifiers.set(key, { ...modifier, value: (prior?.value ?? 0) + modifier.value })
  })

  return {
    ...(Object.keys(stats).length ? { stats } : {}),
    ...(modifiers.size || rules.length ? { combat: { ...(modifiers.size ? { modifiers: [...modifiers.values()] } : {}), ...(rules.length ? { rules } : {}) } } : {}),
    ...(special.length ? { special } : {}),
  }
}

/** The Artifact's actual contribution: Rank 0 baseline plus purchased Minors and unlocked Majors. */
export const getArtifactCurrentResolvedEffects = (state: Pick<GameState, 'artifactProgress'>, artifactId: ArtifactId) => mergeArtifactResolvedEffects(getActiveEffects(state, artifactId).map(({ effects }) => effects))

export const getArtifactEffectiveStats = (state: Pick<GameState, 'artifactProgress'>, id: ArtifactId) => {
  return getArtifactCurrentResolvedEffects(state, id).stats ?? {}
}
export interface ActiveArtifactCombatProvider { name: string; modifiers: NonNullable<NonNullable<ArtifactResolvedEffects['combat']>['modifiers']>; rules: NonNullable<NonNullable<ArtifactResolvedEffects['combat']>['rules']>; special: NonNullable<ArtifactResolvedEffects['special']> }
export const getActiveArtifactCombatProviders = (state: Pick<GameState, 'artifactProgress'>, id: ArtifactId): ActiveArtifactCombatProvider[] => getActiveEffects(state, id).map(({ name, effects }) => ({ name, modifiers: effects.combat?.modifiers ?? [], rules: effects.combat?.rules ?? [], special: effects.special ?? [] })).filter((provider) => provider.modifiers.length > 0 || provider.rules.length > 0 || provider.special.length > 0)

export const getActiveArtifactSpecialEffects = (state: Pick<GameState, 'artifactProgress' | 'equipment'>) => Object.values(state.equipment).flatMap((itemId) => itemId && isArtifactId(itemId) ? getActiveArtifactCombatProviders(state, itemId).flatMap((provider) => provider.special.map((special) => ({ name: provider.name, special }))) : [])

export const getArtifactSpellCritDamageBonus = (state: Pick<GameState, 'artifactProgress' | 'equipment'>, school: string) => getActiveArtifactSpecialEffects(state).filter(({ special }) => special.type === 'critical-air-damage' && school === 'air').reduce((total, { special }) => total + (special.type === 'critical-air-damage' ? special.damagePercent : 0), 0)
export const getArtifactPreCastDamageMultiplier = (state: GameState, school: string) => {
  const runtime = state.combat.arcaneCoreRuntime; const now = runtime.elapsedMs ?? 0; let multiplier = 1
  getActiveArtifactSpecialEffects(state).forEach(({ special }) => {
    if (special.type === 'first-spell-after-idle' && (runtime.artifactLastSpellAtMs === undefined || now - runtime.artifactLastSpellAtMs >= special.idleMs)) multiplier *= 1 + special.damageIncrease
  })
  return multiplier
}
export const getArtifactPreCastManaMultiplier = (state: GameState, currentFreeFocus: number) => {
  const runtime = state.combat.arcaneCoreRuntime; const changed = runtime.artifactFreeFocusSnapshot !== undefined && runtime.artifactFreeFocusSnapshot !== currentFreeFocus; runtime.artifactFreeFocusSnapshot = currentFreeFocus
  if (!changed) return 1
  return getActiveArtifactSpecialEffects(state).reduce((multiplier, { special }) => special.type === 'first-spell-after-focus-change' ? multiplier * (1 - special.manaReduction) : multiplier, 1)
}

const artifactRuntime = (state: GameState) => state.combat.arcaneCoreRuntime
const artifactEffectSource = (name: string): CombatSource => ({ actor: 'player', kind: 'equipment', sourceId: name, tags: ['equipment', 'special'] })
const scaleArtifactEffect = (effect: CombatEffect, multiplier: number): CombatEffect => {
  if (effect.type === 'deal-damage') return { ...effect, components: effect.components.map((component) => ({ ...component, magnitude: scaleMagnitude(component.magnitude, multiplier) })) }
  if (effect.type === 'heal' || effect.type === 'gain-barrier') return { ...effect, magnitude: scaleMagnitude(effect.magnitude, multiplier) }
  return effect
}
const executeArtifactEffects = (state: GameState, effects: CombatEffect[], source: CombatSource, executeEffects: (state: GameState, effects: CombatEffect[], source: CombatSource, depth?: number, uiEvents?: CombatEventSink, resolution?: CombatResolutionContext) => void, depth: number, uiEvents?: CombatEventSink, resolution?: CombatResolutionContext) => executeEffects(state, effects, source, depth + 1, uiEvents, resolution)

/** Resolves Artifact `special` payloads at combat boundaries; presentation is never the execution path. */
export const processArtifactSpecialCombatEvent = (state: GameState, actor: 'player' | 'enemy', event: CombatTrigger, context: CombatConditionContext, executeEffects: (state: GameState, effects: CombatEffect[], source: CombatSource, depth?: number, uiEvents?: CombatEventSink, resolution?: CombatResolutionContext) => void, depth: number, uiEvents?: CombatEventSink, resolution?: CombatResolutionContext) => {
  if (actor !== 'player') return
  const runtime = artifactRuntime(state); const now = runtime.elapsedMs ?? 0; const active = getActiveArtifactSpecialEffects(state)
  if (event === 'on-spell-cast' && context.source?.kind === 'spell') {
    runtime.artifactSpellCount = (runtime.artifactSpellCount ?? 0) + 1
    if (context.source.school === 'air') runtime.artifactAirSpellCount = (runtime.artifactAirSpellCount ?? 0) + 1
    active.forEach(({ name, special }) => {
      if (special.type === 'nth-spell-refund' && (runtime.artifactSpellCount ?? 0) % special.every === 0) executeArtifactEffects(state, [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'source-max-mana-percent', value: special.manaPercent } }], artifactEffectSource(name), executeEffects, depth, uiEvents, resolution)
      if (special.type === 'air-spell-repeat' && context.source?.school === 'air' && (runtime.artifactAirSpellCount ?? 0) % special.every === 0) {
        const spell = SPELLS[context.source.sourceId as import('../../types').SpellId]
        if (spell) executeArtifactEffects(state, spell.effects.map((effect) => scaleArtifactEffect(effect, special.effectiveness)), context.source, executeEffects, depth, uiEvents, resolution)
      }
    })
    runtime.artifactLastSpellAtMs = now
  }
  if (event === 'on-heal' || event === 'on-heal-received') active.forEach(({ special }) => { if (special.type === 'after-heal-water-damage') runtime.artifactAfterHealWaterReady = true })
  if (event === 'on-barrier-broken') active.forEach(({ name, special }) => { if (special.type === 'barrier-break') executeArtifactEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'source-max-health-percent', value: special.barrierMaxHealthPercent }, mode: 'add', durationMs: null }], artifactEffectSource(name), executeEffects, depth, uiEvents, resolution) })
  if (event === 'on-barrier-gained') active.forEach(({ name, special }) => { if (special.type === 'barrier-gain-mana') executeArtifactEffects(state, [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'source-max-health-percent', value: special.maxHealthPercent } }], artifactEffectSource(name), executeEffects, depth, uiEvents, resolution) })
  if (event === 'on-damage-taken') active.forEach(({ name, special }) => {
    if (special.type === 'lethal-barrier' && (context.currentHp ?? 1) <= 0) { state.player.health = 1; executeArtifactEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'source-max-health-percent', value: special.barrierMaxHealthPercent }, mode: 'replace', durationMs: null }], artifactEffectSource(name), executeEffects, depth, uiEvents, resolution) }
    if (special.type === 'hp-threshold-barrier-status-immunity' && (context.currentHpPercent ?? 100) <= special.threshold * 100) executeArtifactEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'source-max-health-percent', value: special.barrierMaxHealthPercent }, mode: 'replace', durationMs: special.durationMs }], artifactEffectSource(name), executeEffects, depth, uiEvents, resolution)
    if (special.type === 'heal-on-hp-threshold' && (context.currentHpPercent ?? 100) <= special.threshold * 100) executeArtifactEffects(state, [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: special.maxHealthPercent } }], artifactEffectSource(name), executeEffects, depth, uiEvents, resolution)
  })
  if (event === 'on-status-applied' && context.statusId === 'burning' && context.eventTarget === 'enemy') active.forEach(({ name, special }) => {
    if (special.type === 'burn-refresh-detonation') executeArtifactEffects(state, [{ type: 'detonate-status', target: 'opponent', statusId: 'burning', multiplier: special.damagePercent, consume: false }], artifactEffectSource(name), executeEffects, depth, uiEvents, resolution)
  })
  if (event === 'on-spell-hit' && context.critical && context.source?.school === 'air') active.forEach(({ special }) => { if (special.type === 'critical-next-cooldown' && special.school === 'air' && context.source?.sourceId) state.combat.spellCooldowns[context.source.sourceId as import('../../types').SpellId] = Math.max(0, (state.combat.spellCooldowns[context.source.sourceId as import('../../types').SpellId] ?? 0) * (1 - special.reduction)) })
}

export type ArtifactRankPurchaseFailure = 'artifact-not-owned' | 'unknown-minor-node' | 'rank-maxed' | 'insufficient-artifact-essence' | 'insufficient-fragment' | 'insufficient-prismatic-fragment' | 'insufficient-resonance'
export interface ArtifactRankPurchaseRequirement {
  kind: 'item' | 'resonance'
  id: ItemId | ResonanceType
  label: string
  owned: number
  required: number
  sufficient: boolean
}
export interface ArtifactRankPurchaseEligibility {
  canPurchase: boolean
  nextRank: number | null
  cost: ArtifactDefinition['minorNodes'][number]['rankCosts'][number] | null
  requirements: ArtifactRankPurchaseRequirement[]
  failureReason: ArtifactRankPurchaseFailure | null
}
export type ArtifactRankPurchaseResult = { ok: true; newRank: number; totalInvestedRanks: number } | { ok: false; reason: ArtifactRankPurchaseFailure }
const hasArtifactOwnership = (state: Pick<GameState, 'inventory' | 'artifactProgress'>, artifactId: ArtifactId) => (state.inventory[artifactId] ?? 0) > 0 && Boolean(state.artifactProgress?.[artifactId])
const ensureProgress = (state: GameState, artifactId: ArtifactId) => state.artifactProgress[artifactId] ??= { minorRanks: {} }
export const getArtifactRankPurchaseEligibility = (state: Pick<GameState, 'inventory' | 'artifactProgress' | 'resonance' | 'debug'>, artifactId: ArtifactId, nodeId: string, options?: { free?: boolean }): ArtifactRankPurchaseEligibility => {
  const definition = ARTIFACTS[artifactId]
  const node = getNode(artifactId, nodeId)
  if (!definition || !node) return { canPurchase: false, nextRank: null, cost: null, requirements: [], failureReason: 'unknown-minor-node' }
  if (!state.debug.artifactIgnoreOwnership && !hasArtifactOwnership(state, artifactId)) return { canPurchase: false, nextRank: null, cost: null, requirements: [], failureReason: 'artifact-not-owned' }
  const rank = getArtifactMinorRank(state, artifactId, nodeId)
  if (rank >= node.maxRank) return { canPurchase: false, nextRank: null, cost: null, requirements: [], failureReason: 'rank-maxed' }
  const cost = node.rankCosts[rank]
  const requirements: ArtifactRankPurchaseRequirement[] = [
    { kind: 'item', id: 'artifact-essence', label: 'Artifact Essence', owned: state.inventory['artifact-essence'] ?? 0, required: cost.artifactEssence, sufficient: (state.inventory['artifact-essence'] ?? 0) >= cost.artifactEssence },
  ]
  if (cost.fragment) requirements.push({ kind: 'item', id: cost.fragment.itemId, label: 'Fragment', owned: state.inventory[cost.fragment.itemId] ?? 0, required: cost.fragment.quantity, sufficient: (state.inventory[cost.fragment.itemId] ?? 0) >= cost.fragment.quantity })
  if (cost.prismaticFragment) requirements.push({ kind: 'item', id: 'prismatic-fragment', label: 'Prismatic Fragment', owned: state.inventory['prismatic-fragment'] ?? 0, required: cost.prismaticFragment, sufficient: (state.inventory['prismatic-fragment'] ?? 0) >= cost.prismaticFragment })
  Object.entries(cost.resonance).forEach(([type, amount]) => {
    const resonanceType = type as ResonanceType
    const required = amount ?? 0
    requirements.push({ kind: 'resonance', id: resonanceType, label: RESONANCE_METADATA[resonanceType].label, owned: state.resonance[resonanceType] ?? 0, required, sufficient: (state.resonance[resonanceType] ?? 0) >= required })
  })
  const bypassCost = options?.free === true || (options?.free === undefined && state.debug.artifactFreeRankPurchase)
  const failureReason = bypassCost ? null : requirements.find((requirement) => !requirement.sufficient)?.kind === 'resonance'
    ? 'insufficient-resonance'
    : requirements.find((requirement) => !requirement.sufficient)?.id === 'artifact-essence'
      ? 'insufficient-artifact-essence'
      : requirements.find((requirement) => !requirement.sufficient)?.id === 'prismatic-fragment'
        ? 'insufficient-prismatic-fragment'
        : requirements.some((requirement) => !requirement.sufficient) ? 'insufficient-fragment' : null
  return { canPurchase: failureReason === null, nextRank: rank + 1, cost, requirements, failureReason }
}

export const purchaseArtifactMinorRank = (state: GameState, artifactId: ArtifactId, nodeId: string, options?: { free?: boolean }): ArtifactRankPurchaseResult => {
  const eligibility = getArtifactRankPurchaseEligibility(state, artifactId, nodeId, options)
  if (!eligibility.canPurchase) return { ok: false, reason: eligibility.failureReason ?? 'unknown-minor-node' }
  const node = getNode(artifactId, nodeId)!
  const currentRank = getArtifactMinorRank(state, artifactId, nodeId)
  const cost = eligibility.cost!
  const bypassCost = options?.free === true || (options?.free === undefined && state.debug.artifactFreeRankPurchase)
  if (!bypassCost) {
    state.inventory['artifact-essence'] = Math.max(0, (state.inventory['artifact-essence'] ?? 0) - cost.artifactEssence)
    if (cost.fragment) state.inventory[cost.fragment.itemId] = Math.max(0, (state.inventory[cost.fragment.itemId] ?? 0) - cost.fragment.quantity)
    if (cost.prismaticFragment) state.inventory['prismatic-fragment'] = Math.max(0, (state.inventory['prismatic-fragment'] ?? 0) - cost.prismaticFragment)
    spendResonanceBundle(state.resonance, cost.resonance)
  }
  const progress = ensureProgress(state, artifactId); progress.minorRanks[nodeId] = currentRank + 1
  return { ok: true, newRank: currentRank + 1, totalInvestedRanks: getArtifactTotalInvestedRanks(state, artifactId) }
}

export const debugSetArtifactMinorRank = (state: GameState, artifactId: ArtifactId, nodeId: string, rank: number) => { if (!ARTIFACTS[artifactId] || !getNode(artifactId, nodeId)) return false; const progress = ensureProgress(state, artifactId); progress.minorRanks[nodeId] = Math.max(0, Math.min(10, Math.floor(rank))); return true }
export const debugAdjustArtifactMinorRank = (state: GameState, artifactId: ArtifactId, nodeId: string, delta: number) => debugSetArtifactMinorRank(state, artifactId, nodeId, getArtifactMinorRank(state, artifactId, nodeId) + delta)
export const debugMaxArtifactMinorNode = (state: GameState, artifactId: ArtifactId, nodeId: string) => debugSetArtifactMinorRank(state, artifactId, nodeId, 10)
export const debugResetArtifactMinorNode = (state: GameState, artifactId: ArtifactId, nodeId: string) => debugSetArtifactMinorRank(state, artifactId, nodeId, 0)
export const debugMaxArtifact = (state: GameState, artifactId: ArtifactId) => { const definition = ARTIFACTS[artifactId]; if (!definition) return false; definition.minorNodes.forEach((node) => debugSetArtifactMinorRank(state, artifactId, node.id, 10)); return true }
export const debugResetArtifact = (state: GameState, artifactId: ArtifactId) => { const definition = ARTIFACTS[artifactId]; if (!definition) return false; state.artifactProgress[artifactId] = { minorRanks: {} }; return true }
export const debugMaxOwnedArtifacts = (state: GameState) => Object.keys(ARTIFACTS).forEach((id) => { if ((state.inventory[id as ArtifactId] ?? 0) > 0) debugMaxArtifact(state, id as ArtifactId) })
export const debugGrantAllArtifacts = (state: GameState) => Object.keys(ARTIFACTS).forEach((id) => { if ((state.inventory[id as ArtifactId] ?? 0) < 1) grantItem(state, id as ArtifactId, 1) })
export const debugResetAllArtifactRanks = (state: GameState) => Object.keys(ARTIFACTS).forEach((id) => debugResetArtifact(state, id as ArtifactId))
export const completeArtifactForge = (state: GameState, id: ArtifactId) => { if (state.artifactProgress?.[id] || (state.inventory[id] ?? 0) > 0) return false; state.artifactProgress[id] = { minorRanks: {} }; grantItem(state, id, 1); return true }
