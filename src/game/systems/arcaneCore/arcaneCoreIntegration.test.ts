import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { recalculateDerivedStats } from '../../engine'
import { advanceChanneling, getManaRegenBreakdown } from '../../engine/channelingEngine'
import { getEquipmentPreview, getEquipmentStatSnapshot } from '../../presentation/equipment/equipmentReadModel'
import { getEffectiveSpellStatusDurationPreview } from '../../presentation/spells/effectiveSpellPresentation'
import { SPELLS } from '../../content/spells/spells'
import { applyArcaneCorePreset } from './arcaneCorePresets'
import { beginArcaneCoreSpellCast, getArcaneCoreCooldownPulseReduction } from './arcaneCoreRuntime'
import { getArcaneCoreStaticStats, purchaseArcaneCoreNode, refundArcaneCoreNode, setArcaneCoreLevel } from './arcaneCoreProgression'
import { addEquipmentStats } from '../../core/equipment/equipmentStatAggregation'
import { castSpellAction, castSpellInternal } from '../../engine/spellEngine'
import { applyStatus, damagePlayer, spawnEnemy } from '../combat/combatRuntime'
import { getCombatModifierContributions, getCombatModifiers } from '../combat/modifiers'
import { getCooldownRecoveryMultiplier, getEffectiveFocusCost, getEffectiveManaCost, getPlayerCombatStats, getPlayerSheetCombatStats } from '../combat/combatStats'
import { getSpellAutoCastFocusCost, getSpellPresetFocusBreakdown } from '../spells'
import { getSpellPowerBreakdown } from '../spells/spellPower'
import type { CombatSource, GameState } from '../../types'

const spellSource: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'integration-spell', school: 'fire', tags: ['spell', 'magic', 'fire', 'direct'] }
const enemySource: CombatSource = { actor: 'enemy', kind: 'action', sourceId: 'integration-enemy', tags: ['direct'] }
const activeEnemySource = (state: GameState): CombatSource => ({ ...enemySource, sourceMonsterId: state.combat.enemyId ?? undefined, sourceInstanceKey: state.combat.enemyInstanceKey ?? undefined })

const stateWithPoints = (): GameState => {
  const state = createInitialState()
  state.arcaneCore = setArcaneCoreLevel(state.arcaneCore, 161)
  recalculateDerivedStats(state)
  return state
}

const purchasePath = (state: GameState, nodeIds: string[]) => {
  nodeIds.forEach((nodeId) => {
    const result = purchaseArcaneCoreNode(state.arcaneCore, nodeId)
    if (!result.ok) throw new Error(`Could not purchase ${nodeId}: ${result.reason}`)
    state.arcaneCore = result.state
    recalculateDerivedStats(state)
  })
}

const refundRoot = (state: GameState, nodeId: string) => {
  const result = refundArcaneCoreNode(state.arcaneCore, nodeId)
  if (!result.ok) throw new Error(`Could not refund ${nodeId}: ${result.reason}`)
  state.arcaneCore = result.state
  recalculateDerivedStats(state)
}

describe('Arcane Core V2 integration', () => {
  it('keeps static Wizard stats, runtime stats, and Equipment read-model stats in parity through purchase/refund', () => {
    const cases: Array<{ path: string[]; expected: number; read: (state: GameState) => { sheet: number; runtime: number; snapshot: number } }> = [
      { path: ['vitality-a1'], expected: 10, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).maxHealth, runtime: getPlayerCombatStats(state).maxHealth, snapshot: getEquipmentStatSnapshot(state, state.equipment).maxHealth }) },
      { path: ['focus-a1'], expected: 10, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).maxMana, runtime: getPlayerCombatStats(state).maxMana, snapshot: getEquipmentStatSnapshot(state, state.equipment).maxMana }) },
      { path: ['focus-b1'], expected: 0.25, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).manaRegen, runtime: getPlayerCombatStats(state).manaRegen, snapshot: getEquipmentStatSnapshot(state, state.equipment).manaRegen }) },
      { path: ['focus-d1'], expected: 1, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).maxFocus, runtime: getPlayerCombatStats(state).maxFocus, snapshot: getEquipmentStatSnapshot(state, state.equipment).maxFocus }) },
      { path: ['power-a1'], expected: 3, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).spellPower, runtime: getPlayerCombatStats(state).spellPower, snapshot: getEquipmentStatSnapshot(state, state.equipment).spellPower }) },
      { path: ['power-a1', 'power-a2'], expected: 3, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).basicAttackDamage, runtime: getPlayerCombatStats(state).basicAttackDamage, snapshot: getEquipmentStatSnapshot(state, state.equipment).basicDamage }) },
      { path: ['power-b1'], expected: 0.01, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).critChance, runtime: getPlayerCombatStats(state).critChance, snapshot: getEquipmentStatSnapshot(state, state.equipment).critChance }) },
      { path: ['power-b1', 'power-b2'], expected: 0.04, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).critDamageMultiplier, runtime: getPlayerCombatStats(state).critDamageMultiplier, snapshot: getEquipmentStatSnapshot(state, state.equipment).critDamageMultiplier }) },
      { path: ['power-c1'], expected: 0.01, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).cooldownRecovery, runtime: getPlayerCombatStats(state).cooldownRecovery, snapshot: getEquipmentStatSnapshot(state, state.equipment).cooldownRecovery }) },
      { path: ['power-c1', 'power-c2'], expected: 0.02, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).basicAttackSpeedMultiplier, runtime: getPlayerCombatStats(state).basicAttackSpeedMultiplier, snapshot: getEquipmentStatSnapshot(state, state.equipment).basicAttackSpeedMultiplier }) },
      { path: ['vitality-b1'], expected: 2, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).defense, runtime: getPlayerCombatStats(state).defense, snapshot: getEquipmentStatSnapshot(state, state.equipment).defense }) },
      { path: ['vitality-b1', 'vitality-b2'], expected: 0.01, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).blockChance, runtime: getPlayerCombatStats(state).blockChance, snapshot: getEquipmentStatSnapshot(state, state.equipment).blockChance }) },
      { path: ['vitality-c1'], expected: 0.04, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).barrierPowerBonus, runtime: getPlayerCombatStats(state).barrierPowerBonus, snapshot: getEquipmentStatSnapshot(state, state.equipment).barrierPowerBonus }) },
      { path: ['vitality-d1', 'vitality-d2'], expected: 0.03, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).healingDoneBonus, runtime: getPlayerCombatStats(state).healingDoneBonus, snapshot: getEquipmentStatSnapshot(state, state.equipment).healingDoneBonus }) },
      { path: ['power-d1'], expected: 0.02, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).damageOverTimeBonus, runtime: getPlayerCombatStats(state).damageOverTimeBonus, snapshot: getEquipmentStatSnapshot(state, state.equipment).damageOverTimeBonus }) },
      { path: ['control-b1'], expected: 0.03, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).statusDurationBonus, runtime: getPlayerCombatStats(state).statusDurationBonus, snapshot: getEquipmentStatSnapshot(state, state.equipment).statusDurationBonus }) },
      { path: ['focus-c1'], expected: 0.01, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).manaCostReduction, runtime: getPlayerCombatStats(state).manaCostReduction, snapshot: getEquipmentStatSnapshot(state, state.equipment).manaCostReduction }) },
      { path: ['focus-d1', 'focus-d2', 'focus-d3', 'focus-d4', 'focus-d5'], expected: 0.01, read: (state) => ({ sheet: getPlayerSheetCombatStats(state).focusEfficiency, runtime: getPlayerCombatStats(state).focusEfficiency, snapshot: getEquipmentStatSnapshot(state, state.equipment).focusEfficiency }) },
    ]

    cases.forEach(({ path, expected, read }) => {
      const state = stateWithPoints()
      const before = read(state)
      purchasePath(state, path)
      const after = read(state)
      expect(after.sheet).toBeCloseTo(before.sheet + expected)
      expect(after.runtime).toBeCloseTo(after.sheet)
      expect(after.snapshot).toBeCloseTo(after.sheet)
      refundRoot(state, path[0]!)
      const refunded = read(state)
      expect(refunded.sheet).toBeCloseTo(before.sheet)
      expect(refunded.runtime).toBeCloseTo(before.runtime)
      expect(refunded.snapshot).toBeCloseTo(before.snapshot)
    })
  })

  it('keeps effective Mana/Focus costs, cooldowns, and status-duration previews on the same Core values', () => {
    const state = stateWithPoints()
    const baseManaCost = getEffectiveManaCost(state, 100)
    purchasePath(state, ['focus-c1', 'focus-c2', 'focus-c3', 'focus-c4', 'focus-c5', 'focus-c6', 'focus-c7', 'focus-c8', 'focus-c9', 'focus-c10'])
    expect(getEffectiveManaCost(state, 100)).toBe(Math.ceil(baseManaCost * 0.95))

    const baseCooldown = SPELLS['fire-bolt'].cooldownMs
    const cooldownState = stateWithPoints()
    purchasePath(cooldownState, ['power-c1'])
    expect(getCooldownRecoveryMultiplier(cooldownState)).toBeCloseTo(1.01)
    const statusState = stateWithPoints()
    purchasePath(statusState, ['control-b1', 'control-b2'])
    const igniteEffect = SPELLS.ignite.effects[1] as Extract<typeof SPELLS.ignite.effects[number], { type: 'apply-status' }>
    expect(getEffectiveSpellStatusDurationPreview(statusState, 'ignite', igniteEffect).effective).toBe(6_360)
    expect(baseCooldown / getCooldownRecoveryMultiplier(cooldownState)).toBeCloseTo(baseCooldown / 1.01)

    const focusState = stateWithPoints()
    focusState.progress.spellRanks['fire-bolt'] = 8
    const baseFocusCost = getEffectiveFocusCost(focusState, 80)
    purchasePath(focusState, ['focus-d1', 'focus-d2', 'focus-d3', 'focus-d4', 'focus-d5', 'focus-d6', 'focus-d7', 'focus-d8', 'focus-d9', 'focus-d10'])
    expect(getEffectiveFocusCost(focusState, 80)).toBe(Math.ceil(baseFocusCost * 0.93))
    expect(getSpellAutoCastFocusCost(focusState, 'fire-bolt')).toBe(Math.ceil(80 * 0.93))
    expect(getSpellPresetFocusBreakdown({ ...focusState, player: { maxFocus: focusState.player.maxFocus } }).maxFocus).toBe(focusState.player.maxFocus)
  })

  it('applies Arcane Core status conditions only when their status predicates are true', () => {
    const state = stateWithPoints()
    state.combat.active = true
    spawnEnemy(state, 'forest-wisp')
    purchasePath(state, ['control-b1', 'control-b2', 'control-b3'])
    expect(getCombatModifiers(state, 'player', 'damage-dealt-percent', { source: spellSource })).toBe(0)
    applyStatus(state, 'enemy', 'vulnerable', spellSource)
    const pressure = getCombatModifierContributions(state, 'player', 'damage-dealt-percent', { source: spellSource }).find((entry) => entry.sourceId === 'control-b3')
    expect(pressure).toMatchObject({ value: 0.04, sourceName: 'Status Pressure' })
    state.combat.enemyStatuses = []
    expect(getCombatModifierContributions(state, 'player', 'damage-dealt-percent', { source: spellSource }).some((entry) => entry.sourceId === 'control-b3')).toBe(false)

    const suppression = stateWithPoints()
    suppression.combat.active = true
    spawnEnemy(suppression, 'forest-wisp')
    purchasePath(suppression, ['control-b1', 'control-b2', 'control-b3', 'control-b4', 'control-b5', 'control-b6'])
    applyStatus(suppression, 'enemy', 'vulnerable', spellSource)
    expect(getCombatModifierContributions(suppression, 'enemy', 'damage-dealt-percent', { source: activeEnemySource(suppression) }).find((entry) => entry.sourceId === 'control-b6')).toMatchObject({ value: -0.03, sourceName: 'Suppression' })

    const layered = stateWithPoints()
    layered.combat.active = true
    spawnEnemy(layered, 'forest-wisp')
    purchasePath(layered, ['control-b1', 'control-b2', 'control-b3', 'control-b4', 'control-b5', 'control-b6', 'control-b7', 'control-b8'])
    applyStatus(layered, 'enemy', 'vulnerable', spellSource)
    applyStatus(layered, 'enemy', 'chilled', spellSource)
    expect(getCombatModifierContributions(layered, 'enemy', 'damage-taken-percent').find((entry) => entry.sourceId === 'control-b8')).toMatchObject({ value: 0.05, sourceName: 'Layered Control' })

    const vulnerability = stateWithPoints()
    vulnerability.combat.active = true
    spawnEnemy(vulnerability, 'forest-wisp')
    purchasePath(vulnerability, ['control-d1', 'control-d2', 'control-d3', 'control-d4', 'control-d5', 'control-d6', 'control-d7', 'control-d8'])
    applyStatus(vulnerability, 'enemy', 'chilled', spellSource)
    expect(getCombatModifierContributions(vulnerability, 'player', 'damage-dealt-percent', { source: spellSource }).some((entry) => entry.sourceId === 'control-d8')).toBe(false)
    vulnerability.combat.enemyStatuses = []
    applyStatus(vulnerability, 'enemy', 'vulnerable', spellSource)
    expect(getCombatModifierContributions(vulnerability, 'player', 'damage-dealt-percent', { source: spellSource }).find((entry) => entry.sourceId === 'control-d8')).toMatchObject({ value: 0.08, sourceName: 'Vulnerability Exploit' })
  })

  it('keeps dynamic Focus effects, Arcane Efficiency, overflow, and Survival Instinct on the runtime path', () => {
    const focused = stateWithPoints()
    focused.progress.spellRanks['fire-bolt'] = 1
    focused.activities.autoCast['fire-bolt'] = true
    purchasePath(focused, ['focus-d1', 'focus-d2', 'focus-d3'])
    const focusedPower = getSpellPowerBreakdown(focused)
    expect(focusedPower.equipment).toBeCloseTo(2.5)
    purchasePath(focused, ['focus-d4', 'focus-d5', 'focus-d6'])
    expect(getManaRegenBreakdown(focused).total).toBeGreaterThan(getManaRegenBreakdown({ ...focused, arcaneCore: { totalXp: focused.arcaneCore.totalXp, nodes: {} } }).total)

    const efficiency = stateWithPoints()
    efficiency.combat.active = true
    efficiency.debug.ignoreSpellCooldowns = true
    efficiency.debug.enemyImmortal = true
    efficiency.progress.spellRanks['fire-bolt'] = 1
    efficiency.player.mana = 0
    spawnEnemy(efficiency, 'forest-wisp')
    purchasePath(efficiency, ['focus-c1', 'focus-c2', 'focus-c3', 'focus-c4', 'focus-c5', 'focus-c6', 'focus-c7', 'focus-c8', 'focus-c9', 'focus-c10'])
    expect(castSpellAction(efficiency, 'fire-bolt')).toBe(false)
    expect(efficiency.combat.arcaneCoreRuntime.spellCastCount).toBe(0)
    efficiency.player.mana = getEffectiveManaCost(efficiency, SPELLS['fire-bolt'].manaCost) * 4
    for (let index = 0; index < 4; index += 1) expect(castSpellInternal(efficiency, 'fire-bolt', true)).toBe(true)
    expect(efficiency.player.mana).toBe(1)
    expect(castSpellInternal(efficiency, 'fire-bolt', true)).toBe(true)
    expect(efficiency.player.mana).toBe(1)
    expect(efficiency.combat.arcaneCoreRuntime.spellCastCount).toBe(5)

    const overflow = stateWithPoints()
    overflow.combat.active = true
    purchasePath(overflow, ['focus-b1', 'focus-b2', 'focus-b3', 'focus-b4', 'focus-b5', 'focus-b6', 'focus-b7', 'focus-b8', 'focus-b9', 'focus-b10'])
    overflow.player.mana = overflow.player.maxMana
    advanceChanneling(overflow, 10_000)
    expect(overflow.combat.playerBarrier).toBeGreaterThan(0)

    const survival = stateWithPoints()
    survival.combat.active = true
    purchasePath(survival, ['vitality-a1', 'vitality-a2', 'vitality-a3', 'vitality-a4', 'vitality-a5', 'vitality-a6', 'vitality-a7', 'vitality-a8', 'vitality-a9', 'vitality-a10'])
    spawnEnemy(survival, 'forest-wisp')
    survival.player.health = 1
    damagePlayer(survival, 999_999, activeEnemySource(survival))
    expect(survival.player.health).toBe(1)
    damagePlayer(survival, 999_999, activeEnemySource(survival))
    expect(survival.player.health).toBe(0)

    const pulse = stateWithPoints()
    purchasePath(pulse, ['control-a1', 'control-a2', 'control-a3', 'control-a4', 'control-a5', 'control-a6', 'control-a7', 'control-a8', 'control-a9'])
    for (let index = 0; index < 9; index += 1) beginArcaneCoreSpellCast(pulse, false)
    const tenth = beginArcaneCoreSpellCast(pulse, false)
    expect(tenth.cooldownPulse).toBe(true)
    expect(getArcaneCoreCooldownPulseReduction(pulse)).toBe(500)
  })

  it('keeps Arcane Core preset switching reactive and equipment deltas item-only', () => {
    const state = stateWithPoints()
    state.progress.spellRanks['fire-bolt'] = 1
    state.activities.autoCast['fire-bolt'] = true
    const baseline = getPlayerSheetCombatStats(state).spellPower
    const presetA = { nodes: { 'focus-d1': { purchased: true as const }, 'focus-d2': { purchased: true as const }, 'focus-d3': { purchased: true as const } } }
    const presetB = { nodes: { 'focus-d1': { purchased: true as const } } }
    const loadedA = applyArcaneCorePreset(state.arcaneCore, presetA)
    expect(loadedA.ok).toBe(true)
    if (!loadedA.ok) return
    state.arcaneCore = loadedA.state
    recalculateDerivedStats(state)
    expect(getPlayerSheetCombatStats(state).spellPower).toBeCloseTo(baseline + 2.5)
    expect(getSpellPowerBreakdown(state).equipment).toBeCloseTo(2.5)

    const previewState = { ...state, inventory: { ...state.inventory, 'ember-staff': 1 } }
    const withCorePreview = getEquipmentPreview(previewState, 'ember-staff', 'weapon')
    const withoutCorePreview = getEquipmentPreview({ ...previewState, arcaneCore: { totalXp: 0, nodes: {} } }, 'ember-staff', 'weapon')
    expect(withCorePreview.impact.spellPower).toBe(withoutCorePreview.impact.spellPower)

    const loadedB = applyArcaneCorePreset(state.arcaneCore, presetB)
    expect(loadedB.ok).toBe(true)
    if (!loadedB.ok) return
    state.arcaneCore = loadedB.state
    recalculateDerivedStats(state)
    expect(getSpellPowerBreakdown(state).equipment).toBe(0)
  })

  it('merges malformed stat bundles safely and keeps resistance entries additive', () => {
    const target: import('../../types').EquipmentStats = {}
    addEquipmentStats(target, { maxHealth: 3, manaRegen: Number.NaN, resistances: { fire: 0.1 } })
    addEquipmentStats(target, { maxHealth: Number.POSITIVE_INFINITY, resistances: { fire: 0.2, water: 0.1 } })
    expect(target.maxHealth).toBe(3)
    expect(target.manaRegen).toBe(0)
    expect(target.resistances?.fire).toBeCloseTo(0.3)
    expect(target.resistances?.water).toBeCloseTo(0.1)
    expect(getArcaneCoreStaticStats({ nodes: {} })).toEqual({})
  })
})
