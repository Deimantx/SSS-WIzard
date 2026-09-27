import { SPELLS } from '../../content/spells/spells'
import { SIGIL_SETS, getSigilSetBonusCount } from '../../content/sigils/sigilSets'
import { SIGIL_TRAITS } from '../../content/sigils/sigilTraits'
import type { GameState, SigilTraitId } from '../../types'
import type { CombatConditionContext, CombatEffect, CombatEventSink, CombatModifier, CombatResolutionContext, CombatSource, CombatTrigger, CombatTriggerRule } from '../combat/combatTypes'
import { nextCombatRandom } from '../combat/combatRng'
import { getActiveSigilTraitIds, getEquippedSigilSetCounts, getEquippedSigils } from './sigilRuntime'

export interface ActiveSigilCombatProvider {
  id: string
  name: string
  traitId?: SigilTraitId
  modifiers: CombatModifier[]
  rules: CombatTriggerRule[]
}

const directSpell: Pick<CombatModifier, 'sourceKinds' | 'sourceTags'> = { sourceKinds: ['spell'], sourceTags: ['direct'] }
const rule = (id: string, event: CombatTriggerRule['event'], effects: CombatEffect[], condition?: CombatTriggerRule['condition'], extra: Omit<CombatTriggerRule, 'id' | 'event' | 'effects' | 'condition'> = {}): CombatTriggerRule => ({ id, event, effects, ...(condition ? { condition } : {}), ...extra })

export const getActiveSigilCombatProviders = (state: GameState): ActiveSigilCombatProvider[] => {
  const counts = getEquippedSigilSetCounts(state)
  const providers: ActiveSigilCombatProvider[] = []
  const addSet = (setId: keyof typeof SIGIL_SETS) => {
    const definition = SIGIL_SETS[setId]
    if (!definition || getSigilSetBonusCount(setId, counts[setId] ?? 0) <= 0) return
    if (setId === 'predator' && !state.combat.inBossFight) return
    const modifiers: CombatModifier[] = []
    if (setId === 'predator') modifiers.push({ key: 'damage-dealt-percent', value: 0.15, ...directSpell })
    providers.push({ id: `set:${setId}`, name: `${definition.name} Set`, modifiers, rules: [] })
  }
  ;(Object.keys(SIGIL_SETS) as Array<keyof typeof SIGIL_SETS>).forEach(addSet)

  const activeTraitIds = getActiveSigilTraitIds(state)
  activeTraitIds.forEach((traitId, traitIndex) => {
    const definition = SIGIL_TRAITS[traitId]
    if (!definition) return
    const modifiers: CombatModifier[] = []
    const rules: CombatTriggerRule[] = []
    if (traitId === 'execution-mark') modifiers.push({ key: 'damage-dealt-percent', value: 0.08, ...directSpell, condition: { type: 'target-hp-below-percent', percent: 25 } })
    if (traitId === 'predatory-rhythm' && state.combat.sigilRuntime.predatorCriticalStacks > 0) modifiers.push({ key: 'damage-dealt-percent', value: 0.02 * state.combat.sigilRuntime.predatorCriticalStacks, ...directSpell })
    if (traitId === 'second-skin' && !state.combat.sigilRuntime.secondSkinUsed) modifiers.push({ key: 'damage-taken-percent', value: -0.10, sourceTags: ['direct'] })
    if (traitId === 'lingering-bind') modifiers.push({ key: 'status-duration-dealt-percent', value: 0.12, originSourceKinds: ['spell'], statusTags: ['control'] })
    if (traitId === 'last-ward') rules.push(rule('last-ward', 'on-hp-threshold', [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.08 }, mode: 'replace-if-stronger', durationMs: null }], { type: 'self-hp-below-percent', percent: 30 }, { oncePerEncounter: true, ui: { name: 'Last Ward', description: 'A ward forms as life falls below 30%.' } }))
    providers.push({ id: `trait:${traitId}:${traitIndex}`, name: definition.name, traitId, modifiers, rules })
  })
  return providers
}

const sigilSource = (id: string): CombatSource => ({ actor: 'player', kind: 'equipment', sourceId: id, tags: ['equipment', 'trait'] })
const scaleEffect = (effect: CombatEffect, factor: number): CombatEffect => {
  if (effect.type === 'deal-damage') return { ...effect, components: effect.components.map((component) => ({ ...component, magnitude: component.magnitude.type === 'flat' ? { type: 'flat', value: component.magnitude.value * factor } : component.magnitude })) }
  if (effect.type === 'heal' || effect.type === 'gain-barrier') return { ...effect, magnitude: effect.magnitude.type === 'flat' ? { type: 'flat', value: effect.magnitude.value * factor } : effect.magnitude }
  return effect
}
const reduceLongestCooldown = (state: GameState, amountMs: number) => {
  const target = Object.entries(state.combat.spellCooldowns).sort(([, left], [, right]) => right - left)[0]
  if (target) state.combat.spellCooldowns[target[0] as keyof typeof state.combat.spellCooldowns] = Math.max(0, target[1] - amountMs)
}

export const processSigilSpecialCombatEvent = (state: GameState, actor: 'player' | 'enemy', event: CombatTrigger, context: CombatConditionContext, executeEffects: (state: GameState, effects: CombatEffect[], source: CombatSource, depth?: number, uiEvents?: CombatEventSink, resolution?: CombatResolutionContext) => void, depth: number, uiEvents?: CombatEventSink, resolution?: CombatResolutionContext) => {
  if (actor !== 'player') return
  const traits = new Set(getEquippedSigils(state).flatMap((sigil) => sigil.traitIds))
  const counts = getEquippedSigilSetCounts(state)
  const runtime = state.combat.sigilRuntime ?? (state.combat.sigilRuntime = { spellCastCount: 0, predatorCriticalStacks: 0, predatorStacksExpireAtMs: 0, secondSkinUsed: false })
  if (runtime.barrierReboundReadyAtMs && state.combat.arcaneCoreRuntime.elapsedMs >= runtime.barrierReboundReadyAtMs) {
    runtime.barrierReboundReadyAtMs = 0
    if (traits.has('barrier-rebound')) executeEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.05 }, mode: 'add', durationMs: null }], sigilSource('barrier-rebound'), depth + 1, uiEvents, resolution)
  }
  if (event === 'on-spell-cast' && context.source?.kind === 'spell') {
    runtime.spellCastCount += 1
    if (getSigilSetBonusCount('tempest', counts.tempest ?? 0) > 0 && runtime.spellCastCount % 5 === 0) reduceLongestCooldown(state, 300)
    if (traits.has('arcane-surge') && runtime.spellCastCount % 6 === 0) state.combat.arcaneCoreRuntime.nextEffectivenessMultiplier = Math.max(state.combat.arcaneCoreRuntime.nextEffectivenessMultiplier ?? 1, 1.15)
    if (traits.has('mana-echo') && runtime.spellCastCount % 8 === 0) executeEffects(state, [{ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'source-max-mana-percent', value: 0.04 } }], sigilSource('mana-echo'), depth + 1, uiEvents, resolution)
    if (getSigilSetBonusCount('echo', counts.echo ?? 0) > 0 && nextCombatRandom(state) < 0.08) {
      const spell = SPELLS[context.source.sourceId as keyof typeof SPELLS]
      if (spell) executeEffects(state, spell.effects.map((effect) => scaleEffect(effect, 0.35)), context.source, depth + 1, uiEvents, resolution)
    }
  }
  if (event === 'on-spell-hit' && context.critical && context.source?.tags?.includes('direct') && state.combat.inBossFight && traits.has('predatory-rhythm')) {
    runtime.predatorCriticalStacks = Math.min(3, runtime.predatorCriticalStacks + 1)
    runtime.predatorStacksExpireAtMs = state.combat.arcaneCoreRuntime.elapsedMs + 5000
  }
  if (runtime.predatorStacksExpireAtMs > 0 && state.combat.arcaneCoreRuntime.elapsedMs >= runtime.predatorStacksExpireAtMs) runtime.predatorCriticalStacks = 0
  if (event === 'on-spell-hit' && context.critical && traits.has('critical-flow')) reduceLongestCooldown(state, 150)
  if (event === 'on-damage-dealt' && traits.has('cinder-echo') && context.source?.statusId === 'burning' && (context.amount ?? 0) > 0 && nextCombatRandom(state) < 0.08) executeEffects(state, [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: context.damageType ?? 'fire', magnitude: { type: 'flat', value: (context.amount ?? 0) * 0.5 } }], tags: ['dot', 'trait'] }], sigilSource('cinder-echo'), depth + 1, uiEvents, resolution)
  if (event === 'on-status-applied' && context.eventTarget === 'enemy' && traits.has('tactical-pause')) reduceLongestCooldown(state, 150)
  if (event === 'on-heal' && context.source?.actor === 'player') {
    if (traits.has('restorative-echo') && context.source?.sourceId !== 'restorative-echo' && nextCombatRandom(state) < 0.08 && (context.amount ?? 0) > 0) executeEffects(state, [{ type: 'heal', target: 'self', magnitude: { type: 'flat', value: (context.amount ?? 0) * 0.35 } }], sigilSource('restorative-echo'), depth + 1, uiEvents, resolution)
    if (traits.has('overflowing-grace') && (context.overheal ?? 0) > 0) executeEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: Math.min(state.player.maxHealth * 0.08, (context.overheal ?? 0) * 0.25) }, mode: 'add', durationMs: null }], sigilSource('overflowing-grace'), depth + 1, uiEvents, resolution)
  }
  if (event === 'on-damage-taken' && context.source?.actor === 'enemy' && context.source.tags?.includes('direct')) runtime.secondSkinUsed = true
  if (event === 'on-barrier-broken' && traits.has('barrier-rebound')) runtime.barrierReboundReadyAtMs = state.combat.arcaneCoreRuntime.elapsedMs + 2000
}
