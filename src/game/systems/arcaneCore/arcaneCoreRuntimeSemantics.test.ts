import { describe, expect, it } from 'vitest'
import { castSpellInternal } from '../../engine/spellEngine'
import { createInitialState } from '../../../store/initialState'
import { getArcaneCoreDynamicManaRegen, beginArcaneCoreSpellCast } from './arcaneCoreRuntime'
import { getCombatSpellAutoCastFocusCost, getPlayerCombatStats, getPlayerSheetCombatStats } from '../combat/combatStats'
import { getCombatModifierContributions, getCombatModifiers } from '../combat/modifiers'
import { damagePlayer, executeCombatEffects } from '../combat/effectResolver'
import { applyStatus } from '../combat/statusRuntime'
import { runCombatTriggers } from '../combat/triggerRuntime'
import { getSpellCombatSource } from '../spells/spellSource'
import type { CombatSource } from '../combat/combatTypes'

const playerSource: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'test-spell', tags: ['spell', 'magic'] }
const enemySource: CombatSource = { actor: 'enemy', kind: 'basic-attack', sourceId: 'test-enemy-attack', sourceMonsterId: 'forest-wisp', sourceInstanceKey: 'forest-wisp:test', tags: ['basic-attack', 'direct'] }

const combatState = () => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.enemyId = 'forest-wisp'
  state.combat.enemyInstanceKey = 'forest-wisp:test'
  state.combat.enemyHp = 1000
  state.combat.enemyMaxHp = 1000
  state.combat.enemyCurrentStepId = 'test-action'
  state.combat.enemyActionTimerMs = 1000
  state.player.health = state.player.maxHealth
  state.player.mana = state.player.maxMana
  return state
}

const withNodes = (nodeId: string, rank: number) => {
  const state = combatState()
  state.arcaneCore.nodes[nodeId] = { rank }
  return state
}

const applyEnemyStatuses = (state: ReturnType<typeof combatState>, statuses: Array<'burning' | 'shock' | 'vulnerable' | 'chilled' | 'stunned'>) => {
  statuses.forEach((statusId) => applyStatus(state, 'enemy', statusId, enemySource))
}

const enemyDamageModifier = (state: ReturnType<typeof combatState>, key: 'damage-dealt-percent' | 'damage-taken-percent') => getCombatModifiers(state, 'enemy', key, { source: enemySource })

describe('Arcane Core V4 runtime semantics', () => {
  it('evaluates Control self-status modifiers on the enemy, not the player', () => {
    const suppression = withNodes('control-r1-suppression', 5)
    expect(enemyDamageModifier(suppression, 'damage-dealt-percent')).toBe(0)
    applyEnemyStatuses(suppression, ['burning'])
    expect(enemyDamageModifier(suppression, 'damage-dealt-percent')).toBe(-0.025)

    const playerOnly = withNodes('control-r1-suppression', 5)
    applyStatus(playerOnly, 'player', 'burning', playerSource)
    expect(enemyDamageModifier(playerOnly, 'damage-dealt-percent')).toBe(0)

    const presence = withNodes('control-r1-debilitating-presence', 5)
    applyEnemyStatuses(presence, ['chilled'])
    expect(enemyDamageModifier(presence, 'damage-dealt-percent')).toBe(-0.025)
    expect(enemyDamageModifier(presence, 'damage-taken-percent')).toBe(0)
  })

  it('requires the enemy itself to have enough negative statuses for layered suppression and Dominion', () => {
    const deep = withNodes('control-r3-deep-suppression', 5)
    expect(enemyDamageModifier(deep, 'damage-dealt-percent')).toBe(0)
    applyEnemyStatuses(deep, ['burning', 'shock'])
    expect(enemyDamageModifier(deep, 'damage-dealt-percent')).toBe(-0.0375)

    const absolute = withNodes('control-r4-absolute-suppression', 5)
    applyEnemyStatuses(absolute, ['burning', 'shock'])
    expect(enemyDamageModifier(absolute, 'damage-dealt-percent')).toBe(0)
    applyStatus(absolute, 'enemy', 'vulnerable', enemySource)
    expect(enemyDamageModifier(absolute, 'damage-dealt-percent')).toBe(-0.05)

    const dominion = withNodes('control-r3-dominion', 1)
    applyEnemyStatuses(dominion, ['burning', 'shock'])
    expect(enemyDamageModifier(dominion, 'damage-dealt-percent')).toBe(0)
    expect(enemyDamageModifier(dominion, 'damage-taken-percent')).toBe(0)
    applyStatus(dominion, 'enemy', 'vulnerable', enemySource)
    expect(enemyDamageModifier(dominion, 'damage-dealt-percent')).toBe(-0.05)
    expect(getCombatModifierContributions(dominion, 'enemy', 'damage-taken-percent', { source: enemySource }).find((entry) => entry.sourceId === 'control-r3-dominion')?.value).toBe(0.1)
  })

  it('delays Control Pressure, Disruption Mastery, and Arcane Lock actions', () => {
    const pressure = withNodes('control-r1-control-pressure', 5)
    executeCombatEffects(pressure, [{ type: 'apply-status', target: 'opponent', statusId: 'burning' }], playerSource)
    expect(pressure.combat.enemyActionTimerMs).toBe(1000)
    executeCombatEffects(pressure, [{ type: 'apply-status', target: 'opponent', statusId: 'chilled' }], playerSource)
    expect(pressure.combat.enemyActionTimerMs).toBe(1100)
    const pressureAfterCooldown = pressure.combat.enemyActionTimerMs
    executeCombatEffects(pressure, [{ type: 'apply-status', target: 'opponent', statusId: 'stunned' }], playerSource)
    expect(pressure.combat.enemyActionTimerMs).toBe(pressureAfterCooldown)

    const disruption = withNodes('control-r4-disruption-mastery', 5)
    executeCombatEffects(disruption, [{ type: 'apply-status', target: 'opponent', statusId: 'chilled' }], playerSource)
    expect(disruption.combat.enemyActionTimerMs).toBe(1125)

    const lock = withNodes('control-r4-arcane-lock', 1)
    executeCombatEffects(lock, [{ type: 'apply-status', target: 'opponent', statusId: 'chilled' }], playerSource)
    expect(lock.combat.enemyActionTimerMs).toBe(1250)
    executeCombatEffects(lock, [{ type: 'apply-status', target: 'opponent', statusId: 'stunned' }], playerSource)
    expect(lock.combat.enemyActionTimerMs).toBe(1250)
    expect(enemyDamageModifier(lock, 'damage-taken-percent')).toBe(0.1)
  })

  it('uses status application event tags and source spell identity for Control procs', () => {
    const flow = withNodes('control-r3-controlled-flow', 5)
    flow.player.mana = 10
    executeCombatEffects(flow, [{ type: 'apply-status', target: 'opponent', statusId: 'burning' }], playerSource)
    expect(flow.player.mana).toBe(10)
    executeCombatEffects(flow, [{ type: 'apply-status', target: 'opponent', statusId: 'chilled' }], playerSource)
    expect(flow.player.mana).toBe(13)
    executeCombatEffects(flow, [{ type: 'apply-status', target: 'opponent', statusId: 'stunned' }], playerSource)
    expect(flow.player.mana).toBe(13)

    const feedback = withNodes('control-r2-spell-feedback', 5)
    feedback.combat.spellCooldowns['fire-bolt'] = 5000
    feedback.combat.spellCooldowns.ignite = 5000
    executeCombatEffects(feedback, [{ type: 'apply-status', target: 'opponent', statusId: 'burning' }], getSpellCombatSource('fire-bolt'))
    expect(feedback.combat.spellCooldowns['fire-bolt']).toBe(4800)
    expect(feedback.combat.spellCooldowns.ignite).toBe(5000)
  })

  it('requires actual Mana spent for Controlled Expenditure', () => {
    const paid = withNodes('focus-r2-controlled-expenditure', 5)
    paid.progress.spellRanks['fire-bolt'] = 1
    paid.player.mana = 100
    expect(castSpellInternal(paid, 'fire-bolt', true)).toBe(true)
    expect(paid.player.mana).toBe(73)

    const free = withNodes('focus-r2-controlled-expenditure', 5)
    free.arcaneCore.nodes['focus-r4-arcane-efficiency'] = { rank: 1 }
    free.progress.spellRanks['fire-bolt'] = 1
    free.combat.arcaneCoreRuntime.spellCastCount = 4
    free.player.mana = 100
    expect(castSpellInternal(free, 'fire-bolt', true)).toBe(true)
    expect(free.player.mana).toBe(100)
  })

  it('requires no Barrier for Reactive Ward and only adds conditional Recovery Under Fire regen below 50%', () => {
    const ward = withNodes('vitality-r3-reactive-ward', 5)
    damagePlayer(ward, 10, enemySource)
    expect(ward.combat.playerBarrier).toBeGreaterThan(0)

    const alreadyWarded = withNodes('vitality-r3-reactive-ward', 5)
    alreadyWarded.combat.playerBarrier = 100
    damagePlayer(alreadyWarded, 10, enemySource)
    expect(alreadyWarded.combat.playerBarrier).toBeLessThan(100)
    expect(alreadyWarded.combat.playerBarrier).toBeGreaterThan(0)

    const recovery = withNodes('vitality-r3-recovery-under-fire', 5)
    const base = getPlayerSheetCombatStats(recovery).healthRegen
    recovery.player.health = recovery.player.maxHealth * 0.7
    expect(getPlayerCombatStats(recovery).healthRegen).toBe(base)
    recovery.player.health = recovery.player.maxHealth * 0.4
    expect(getPlayerCombatStats(recovery).healthRegen).toBe(base + 1)
  })

  it('keeps direct damaging spell filters and damaging-spell counters precise', () => {
    const recoil = withNodes('power-r2-arcane-recoil', 5)
    recoil.progress.spellRanks['flow-mend'] = 1
    recoil.progress.spellRanks['fire-bolt'] = 1
    recoil.player.health = 1
    recoil.combat.playerAttackTimerMs = 1000
    expect(castSpellInternal(recoil, 'flow-mend', true)).toBe(true)
    expect(recoil.combat.playerAttackTimerMs).toBe(1000)
    expect(castSpellInternal(recoil, 'fire-bolt', true)).toBe(true)
    expect(recoil.combat.playerAttackTimerMs).toBe(880)

    const crit = withNodes('power-r2-critical-feedback', 5)
    crit.combat.spellCooldowns['fire-bolt'] = 5000
    runCombatTriggers(crit, 'player', 'on-spell-hit', { source: { ...playerSource, sourceId: 'fire-bolt', tags: ['spell', 'direct'] }, eventTarget: 'enemy', critical: true }, (state, effects, source, depth, uiEvents, resolution) => executeCombatEffects(state, effects, source, depth, uiEvents, resolution))
    expect(crit.combat.spellCooldowns['fire-bolt']).toBe(4850)
    const dotCrit = withNodes('power-r2-critical-feedback', 5)
    dotCrit.combat.spellCooldowns['fire-bolt'] = 5000
    runCombatTriggers(dotCrit, 'player', 'on-spell-hit', { source: { ...playerSource, sourceId: 'fire-bolt', tags: ['spell', 'dot'] }, eventTarget: 'enemy', critical: true }, (state, effects, source, depth, uiEvents, resolution) => executeCombatEffects(state, effects, source, depth, uiEvents, resolution))
    expect(dotCrit.combat.spellCooldowns['fire-bolt']).toBe(5000)

    const momentum = withNodes('power-r3-arcane-momentum', 1)
    momentum.combat.arcaneCoreRuntime.spellCastCount = 3
    momentum.combat.arcaneCoreRuntime.damagingSpellCount = 3
    expect(beginArcaneCoreSpellCast(momentum, false).damageMultiplier).toBe(1)
    expect(momentum.combat.arcaneCoreRuntime.damagingSpellCount).toBe(3)
    expect(beginArcaneCoreSpellCast(momentum, true).damageMultiplier).toBe(1.05)
    expect(momentum.combat.arcaneCoreRuntime.damagingSpellCount).toBe(4)
  })

  it('keeps Focus efficiency combat-only and live with the current Core state', () => {
    const state = withNodes('focus-r1-auto-cast-efficiency', 5)
    expect(getCombatSpellAutoCastFocusCost(state, 100)).toBe(95)
    expect(getArcaneCoreDynamicManaRegen(state)).toBe(0)
  })
})
