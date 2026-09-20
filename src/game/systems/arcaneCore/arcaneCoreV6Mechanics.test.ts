import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_BRANCHES } from '../../content/arcaneCore/arcaneCoreBranches'
import { createInitialState } from '../../../store/initialState'
import { applyStatus } from '../combat/statusRuntime'
import { getCombatModifiers } from '../combat/modifiers'
import { getCombatSpellAutoCastFocusCost } from '../combat/combatStats'
import { executeCombatEffects } from '../combat/effectResolver'
import { getEquipmentStats } from '../../core/equipment/equipmentStats'
import type { CombatSource } from '../combat/combatTypes'
import { processArcaneCoreV6CombatEvent, recordArcaneCoreV6CriticalResult, getArcaneCoreV6CastModifiers, tryConsumeArcaneCoreV6Survival } from './arcaneCoreV6Runtime'
import { resetArcaneCoreCombatRuntime, resetArcaneCoreEncounterRuntime } from './arcaneCoreRuntime'

const node = (branch: 'power' | 'vitality' | 'focus' | 'control', name: string, major = false) => ARCANE_CORE_BRANCHES.find((entry) => entry.id === branch)!.nodes.find((candidate) => candidate.name === name && (candidate.nodeType === 'major') === major)!
const playerSpell: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'test-spell', school: 'fire', tags: ['spell', 'magic', 'fire'] }
const enemyAction: CombatSource = { actor: 'enemy', kind: 'action', sourceId: 'test-action', sourceMonsterId: 'forest-wisp', tags: ['special'] }

describe('Arcane Core V6 structured mechanics', () => {
  it('maps Echo Efficiency nodes to combat AUTO Focus reservation only', () => {
    const state = createInitialState()
    state.arcaneCore.nodes[node('focus', 'Echo Efficiency').id] = { rank: 5 }
    state.arcaneCore.nodes[node('focus', 'Echo Efficiency II').id] = { rank: 5 }
    expect(getEquipmentStats(state).focusEfficiencyPct).toBeCloseTo(0.1125)
    expect(getCombatSpellAutoCastFocusCost(state, 100)).toBe(89)
  })

  it('applies Suppression only to a debuffed enemy damage source', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.enemyId = 'forest-wisp'
    state.combat.enemyHp = state.combat.enemyMaxHp = 10_000
    state.arcaneCore.nodes[node('control', 'Suppression').id] = { rank: 1 }
    expect(getCombatModifiers(state, 'enemy', 'damage-dealt-percent')).toBe(0)
    applyStatus(state, 'enemy', 'burning', playerSpell)
    expect(getCombatModifiers(state, 'enemy', 'damage-dealt-percent')).toBeCloseTo(-0.005)
    expect(getCombatModifiers(state, 'player', 'damage-taken-percent')).toBe(0)
  })

  it('keeps Critical Feedback on a stable mechanic id and enforces its ICD', () => {
    const state = createInitialState()
    state.arcaneCore.nodes[node('power', 'Critical Feedback').id] = { rank: 1 }
    state.combat.spellCooldowns['fire-bolt'] = 1_000
    recordArcaneCoreV6CriticalResult(state, true)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(970)
    state.combat.arcaneCoreRuntime.elapsedMs = 500
    recordArcaneCoreV6CriticalResult(state, true)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(970)
    state.combat.arcaneCoreRuntime.elapsedMs = 750
    recordArcaneCoreV6CriticalResult(state, true)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(940)
  })

  it('turns a failed direct crit into a typed next-damaging-spell token', () => {
    const state = createInitialState()
    state.arcaneCore.nodes[node('power', 'Second Chance').id] = { rank: 1 }
    recordArcaneCoreV6CriticalResult(state, false)
    const modifiers = getArcaneCoreV6CastModifiers(state, { origin: 'auto', spellId: 'fire-bolt', loadoutSlotIndex: 0, damaging: true, manaCost: 30, maxMana: 100, playerMana: 100, enemyHealthPercent: 100 }, true)
    expect(modifiers.critChanceBonus).toBeCloseTo(0.002)
  })

  it('converts Overheal Ward excess healing into a bounded barrier', () => {
    const state = createInitialState()
    state.player.health = state.player.maxHealth - 10
    state.arcaneCore.nodes[node('vitality', 'Overheal Ward').id] = { rank: 1 }
    processArcaneCoreV6CombatEvent(state, 'player', 'on-heal', { eventTarget: 'player', changedActor: 'player', amount: 10, attemptedAmount: 30, overheal: 20 }, executeCombatEffects)
    expect(state.combat.playerBarrier).toBeCloseTo(2)
  })

  it('preserves the player with Refuse Death and creates its barrier', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.enemyId = 'forest-wisp'
    state.combat.enemyHp = state.combat.enemyMaxHp = 10_000
    state.arcaneCore.nodes[node('vitality', 'Refuse Death', true).id] = { rank: 1 }
    executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: state.player.maxHealth * 2 } }], tags: ['direct'] }], enemyAction)
    expect(state.player.health).toBe(1)
    expect(state.combat.playerBarrier).toBeCloseTo(state.player.maxHealth * 0.1)
  })

  it('keeps next-enemy tokens through encounter reset and consumes them once', () => {
    const state = createInitialState()
    state.arcaneCore.nodes[node('power', 'Chain Reaction', true).id] = { rank: 1 }
    processArcaneCoreV6CombatEvent(state, 'player', 'on-damage-dealt', { eventTarget: 'enemy', changedActor: 'enemy', sourceTags: ['dot'], healthDamage: 10, currentHp: 0 })
    state.combat.arcaneCoreRuntime.elapsedMs = 1_000
    resetArcaneCoreEncounterRuntime(state)
    expect(state.combat.arcaneCoreRuntime.chainReactionReady).toBe(true)
    const context = { origin: 'auto' as const, spellId: 'fire-bolt' as const, loadoutSlotIndex: 0, damaging: true, manaCost: 30, maxMana: 100, playerMana: 100, enemyHealthPercent: 100 }
    expect(getArcaneCoreV6CastModifiers(state, context, false).damageMultiplier).toBeCloseTo(1.4)
    expect(state.combat.arcaneCoreRuntime.chainReactionReady).toBe(false)
    expect(getArcaneCoreV6CastModifiers(state, context, false).damageMultiplier).toBe(1)
  })

  it('preserves a second next-enemy representative, Victory Momentum', () => {
    const state = createInitialState()
    state.arcaneCore.nodes[node('power', 'Victory Momentum').id] = { rank: 1 }
    processArcaneCoreV6CombatEvent(state, 'player', 'on-kill', { eventTarget: 'enemy', changedActor: 'enemy' })
    resetArcaneCoreEncounterRuntime(state)
    const modifiers = getArcaneCoreV6CastModifiers(state, { origin: 'auto', spellId: 'fire-bolt', loadoutSlotIndex: 0, damaging: true, manaCost: 30, maxMana: 100, playerMana: 100, enemyHealthPercent: 100 }, false)
    expect(modifiers.actionSpeedMultiplier).toBeCloseTo(1.01)
    expect(state.combat.arcaneCoreRuntime.victoryMomentumReady).toBe(false)
  })

  it('keeps dungeon survival used flags across enemies but resets them for a new run', () => {
    const state = createInitialState()
    state.arcaneCore.nodes[node('vitality', 'Immortal Guard', true).id] = { rank: 1 }
    expect(tryConsumeArcaneCoreV6Survival(state)).toBe('immortal-guard')
    resetArcaneCoreEncounterRuntime(state)
    expect(tryConsumeArcaneCoreV6Survival(state)).toBeNull()
    resetArcaneCoreCombatRuntime(state)
    expect(tryConsumeArcaneCoreV6Survival(state)).toBe('immortal-guard')
  })

  it('resets encounter survival while keeping the V6 clock run-global', () => {
    const state = createInitialState()
    state.arcaneCore.nodes[node('vitality', 'Refuse Death', true).id] = { rank: 1 }
    state.combat.arcaneCoreRuntime.elapsedMs = 4_000
    expect(tryConsumeArcaneCoreV6Survival(state)).toBe('refuse-death')
    resetArcaneCoreEncounterRuntime(state)
    expect(state.combat.arcaneCoreRuntime.elapsedMs).toBe(4_000)
    expect(state.combat.arcaneCoreRuntime.encounterStartedAtMs).toBe(4_000)
    expect(tryConsumeArcaneCoreV6Survival(state)).toBe('refuse-death')
  })
})
