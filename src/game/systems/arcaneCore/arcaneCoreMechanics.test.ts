import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_BRANCHES } from '../../content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_MECHANICS } from '../../content/arcaneCore/arcaneCoreMechanics'
import { createInitialState } from '../../../store/initialState'
import { commitArcaneCoreSpellCast, getArcaneCoreCastModifiers, recordArcaneCoreCriticalResult, recordArcaneCoreCooldownCompletion } from './arcaneCoreMechanicRuntime'
import { executeCombatEffects } from '../combat/effectResolver'
import { applyStatus } from '../combat/statusRuntime'

describe('Arcane Core Arcane Core mechanic safety', () => {
  it('provides exact rank-aware, non-vague text for every dynamic node', () => {
    const forbidden = /\b(small|moderate|meaningful|bounded|slightly|brief bonus|resource benefit|payoff|benefit)\b/i
    expect(ARCANE_CORE_MECHANICS).toHaveLength(160)
    for (const definition of ARCANE_CORE_MECHANICS) {
      const rankOne = definition.describeRank(1).join(' ')
      const maximum = definition.describeRank(definition.nodeType === 'major' ? 1 : 5).join(' ')
      expect(rankOne).not.toMatch(forbidden)
      expect(maximum).not.toMatch(forbidden)
      if (definition.nodeType !== 'major' && !['Astral Reserved Power', 'Astral Open Mind', 'Limit Break'].includes(definition.name)) expect(rankOne, definition.name).not.toBe(maximum)
    }
  })

  it('keeps R1-R2 free-cast, lethal-save, hard-stasis, and guaranteed-crit effects out of authored resolvers', () => {
    const earlyNodes = ARCANE_CORE_BRANCHES.flatMap((branch) => branch.nodes.filter((node) => node.ring <= 2))
    const specialTypes = earlyNodes.flatMap((node) => node.resolveEffects(node.maxRank).special ?? []).map((effect) => effect.type)
    expect(specialTypes).not.toContain('nth-spell-free')
    expect(specialTypes).not.toContain('lethal-survival')
    expect(earlyNodes.some((node) => node.name === 'Perfect Precision' && /not guaranteed to Crit/i.test(node.description))).toBe(true)
    expect(earlyNodes.some((node) => node.name === 'Deep Breathing')).toBe(true)
  })

  it('turns Perfect Precision into a bounded Crit Chance bonus, never a guaranteed Crit', () => {
    const state = createInitialState()
    const node = ARCANE_CORE_BRANCHES.find((branch) => branch.id === 'power')!.nodes.find((entry) => entry.name === 'Perfect Precision')!
    state.arcaneCore.nodes[node.id] = { rank: 1 }
    state.combat.arcaneCoreRuntime.failedCritStreak = 2
    const modifiers = getArcaneCoreCastModifiers(state, { origin: 'auto', spellId: 'fire-bolt', loadoutSlotIndex: 0, damaging: true, nominalManaCost: 20, maxMana: 100, playerMana: 100, enemyHealthPercent: 100 }, true)
    expect(modifiers.critChanceBonus).toBeCloseTo(0.15)
    expect(modifiers.guaranteedCrit).toBe(false)
    recordArcaneCoreCriticalResult(state, false)
    expect(state.combat.arcaneCoreRuntime.failedCritStreak).toBe(0)
  })

  it('keeps the audited Arcane Core cast curves exact and prevents Limit Break from being inert', () => {
    const state = createInitialState()
    const power = ARCANE_CORE_BRANCHES.find((branch) => branch.id === 'power')!
    const openingVolley = power.nodes.find((entry) => entry.name === 'Opening Volley')!
    const limitBreak = power.nodes.find((entry) => entry.name === 'Limit Break')!
    state.arcaneCore.nodes[openingVolley.id] = { rank: 5 }
    state.arcaneCore.nodes[limitBreak.id] = { rank: 1 }
    const opening = getArcaneCoreCastModifiers(state, { origin: 'auto', spellId: 'fire-bolt', loadoutSlotIndex: 0, damaging: true, nominalManaCost: 10, maxMana: 100, playerMana: 100, enemyHealthPercent: 100 }, true)
    expect(opening.damageMultiplier).toBeCloseTo(1.05)
    const limit = getArcaneCoreCastModifiers(state, { origin: 'manual-direct', spellId: 'fire-bolt', loadoutSlotIndex: 0, damaging: true, nominalManaCost: 20, maxMana: 100, playerMana: 100, enemyHealthPercent: 100 }, true)
    expect(limit.manaRefundPercent).toBeCloseTo(0.25)
  })

  it('evaluates Deep Breathing only on an actual 25% Mana crossing', () => {
    const state = createInitialState()
    const node = ARCANE_CORE_BRANCHES.find((branch) => branch.id === 'mana')!.nodes.find((entry) => entry.name === 'Deep Breathing')!
    state.arcaneCore.nodes[node.id] = { rank: 1 }
    const modifiers = getArcaneCoreCastModifiers(state, { origin: 'auto', spellId: 'fire-bolt', loadoutSlotIndex: 0, damaging: true, nominalManaCost: 2, paidMana: 2, manaBeforeCost: 26, manaAfterCost: 24, maxMana: 100, playerMana: 26, enemyHealthPercent: 100 }, true)
    expect(modifiers.manaRestoreFlat).toBeCloseTo(10)
  })

  it('keeps Mana mode-change and low-Mana preparation effects on their intended next cast', () => {
    const state = createInitialState()
    const mana = ARCANE_CORE_BRANCHES.find((branch) => branch.id === 'mana')!
    const node = (name: string) => mana.nodes.find((entry) => entry.name === name)!
    state.arcaneCore.nodes[node('Manual Reservoir').id] = { rank: 1 }
    state.arcaneCore.nodes[node('Dual Mind').id] = { rank: 1 }
    state.arcaneCore.nodes[node('Astral Cascade').id] = { rank: 1 }
    state.arcaneCore.nodes[node('Emergency Conversion').id] = { rank: 1 }

    const autoContext = { origin: 'auto' as const, spellId: 'fire-bolt' as const, loadoutSlotIndex: 0, damaging: true, nominalManaCost: 20, maxMana: 100, playerMana: 100, enemyHealthPercent: 100 }
    commitArcaneCoreSpellCast(state, autoContext)
    const manual = commitArcaneCoreSpellCast(state, { ...autoContext, origin: 'manual-direct', playerMana: 80 })
    expect(manual.manaRestoreFlat).toBeCloseTo(1)

    state.combat.arcaneCoreRuntime.elapsedMs = 1_000
    const preparedAuto = getArcaneCoreCastModifiers(state, { ...autoContext, playerMana: 80 }, true)
    expect(preparedAuto.manaCostMultiplier).toBeCloseTo(0.92)
    expect(preparedAuto.actionSpeedMultiplier).toBeCloseTo(1.05)
    state.combat.arcaneCoreRuntime.elapsedMs = 6_001
    expect(getArcaneCoreCastModifiers(state, { ...autoContext, playerMana: 80 }, true).manaCostMultiplier).toBeCloseTo(1)
    delete state.arcaneCore.nodes[node('Dual Mind').id]

    commitArcaneCoreSpellCast(state, { ...autoContext, playerMana: 80 })
    commitArcaneCoreSpellCast(state, { ...autoContext, playerMana: 60 })
    commitArcaneCoreSpellCast(state, { ...autoContext, playerMana: 40 })
    const cascade = commitArcaneCoreSpellCast(state, { ...autoContext, origin: 'manual-direct', playerMana: 20 })
    expect(cascade.actionSpeedMultiplier).toBeCloseTo(1.02)

    state.combat.arcaneCoreRuntime.emergencyConversionReady = false
    const lowMana = commitArcaneCoreSpellCast(state, { ...autoContext, playerMana: 15, nominalManaCost: 2 })
    expect(lowMana.manaRestoreFlat).toBe(0)
    expect(state.combat.arcaneCoreRuntime.emergencyConversionReady).toBe(true)
    expect(getArcaneCoreCastModifiers(state, { ...autoContext, playerMana: 13 }, true).manaRestoreFlat).toBeCloseTo(1)
  })

  it('prepares Burst Window only when a positive cooldown crosses to zero', () => {
    const state = createInitialState()
    const node = ARCANE_CORE_BRANCHES.find((branch) => branch.id === 'power')!.nodes.find((entry) => entry.name === 'Burst Window')!
    state.arcaneCore.nodes[node.id] = { rank: 1 }
    recordArcaneCoreCooldownCompletion(state, 0, 0)
    expect(state.combat.arcaneCoreRuntime.burstWindowReady ?? false).toBe(false)
    recordArcaneCoreCooldownCompletion(state, 100, 0)
    expect(state.combat.arcaneCoreRuntime.burstWindowReady).toBe(true)
    const context = { origin: 'auto' as const, spellId: 'fire-bolt' as const, loadoutSlotIndex: 0, damaging: true, nominalManaCost: 20, maxMana: 100, playerMana: 100, enemyHealthPercent: 100 }
    expect(getArcaneCoreCastModifiers(state, context, true).damageMultiplier).toBeCloseTo(1.02)
    const committed = getArcaneCoreCastModifiers(state, context)
    expect(committed.damageMultiplier).toBeCloseTo(1.02)
    expect(state.combat.arcaneCoreRuntime.burstWindowReady).toBe(false)
  })

  it('resets the three no-repeat spell sequences at their authored boundaries', () => {
    const state = createInitialState()
    const node = ARCANE_CORE_BRANCHES.find((branch) => branch.id === 'power')!.nodes.find((entry) => entry.name === 'Spell Sequence')!
    state.arcaneCore.nodes[node.id] = { rank: 1 }
    const cast = (spellId: 'fire-bolt' | 'water-bolt' | 'wind-blade') => commitArcaneCoreSpellCast(state, { origin: 'auto', spellId, loadoutSlotIndex: 0, damaging: true, nominalManaCost: 20, maxMana: 100, playerMana: 100, enemyHealthPercent: 100 })
    cast('fire-bolt')
    cast('water-bolt')
    const third = cast('wind-blade')
    expect(third.damageMultiplier).toBeCloseTo(1.03)
    expect(state.combat.arcaneCoreRuntime.recentDamagingSpellSequence?.length).toBe(0)
  })

  it('applies Recovery Window and Reinforced Recovery additively to direct healing', () => {
    const heal = (recovery: number, reinforced: number, permanent = 0, elapsedMs = 1_000) => {
      const state = createInitialState()
      state.player.maxHealth = 1_000
      state.player.health = 500
      state.combat.arcaneCoreRuntime.elapsedMs = elapsedMs
      state.combat.arcaneCoreRuntime.recoveryWindowUntilMs = 3_000
      state.combat.arcaneCoreRuntime.recoveryWindowMultiplier = 1 + recovery
      state.combat.arcaneCoreRuntime.reinforcedRecoveryUntilMs = 3_000
      state.combat.arcaneCoreRuntime.reinforcedRecoveryMultiplier = 1 + reinforced
      if (permanent > 0) {
        const vitality = ARCANE_CORE_BRANCHES.find((branch) => branch.id === 'vitality')!
        for (const name of ['Restoration', 'Recovery Mastery', 'Renewal Restoration']) {
          const node = vitality.nodes.find((entry) => entry.name === name)!
          state.arcaneCore.nodes[node.id] = { rank: 5 }
        }
      }
      executeCombatEffects(state, [{ type: 'heal', target: 'self', magnitude: { type: 'flat', value: 100 } }], { actor: 'player', kind: 'spell', sourceId: 'test' })
      return state.player.health - 500
    }

    expect(heal(0.05, 0)).toBeCloseTo(105)
    expect(heal(0, 0.10)).toBeCloseTo(110)
    expect(heal(0.05, 0.10)).toBeCloseTo(115)
    expect(heal(0.05, 0.10, 0.10)).toBeCloseTo(125)
    expect(heal(0.05, 0, 0, 3_000)).toBeCloseTo(100)
  })

  it('applies Detonation Theory to the same qualifying Combustion cast only', () => {
    const makeState = () => {
      const state = createInitialState()
      state.combat.enemyId = 'forest-wisp'
      state.combat.enemyHp = 100
      state.combat.enemyMaxHp = 100
      const node = ARCANE_CORE_BRANCHES.find((branch) => branch.id === 'power')!.nodes.find((entry) => entry.name === 'Detonation Theory')!
      state.arcaneCore.nodes[node.id] = { rank: 1 }
      return state
    }
    const context = { origin: 'manual-direct' as const, spellId: 'combustion' as const, loadoutSlotIndex: 0, damaging: true, nominalManaCost: 75, maxMana: 100, playerMana: 100, enemyHealthPercent: 100 }
    const playerSpell = { actor: 'player' as const, kind: 'spell' as const, sourceId: 'fireball' }
    const enemySpell = { actor: 'enemy' as const, kind: 'action' as const, sourceId: 'enemy-burn' }

    const active = makeState()
    applyStatus(active, 'enemy', 'burning', playerSpell, { durationMs: 5_000 })
    expect(getArcaneCoreCastModifiers(active, context, true).damageMultiplier).toBeCloseTo(1.03)
    expect(getArcaneCoreCastModifiers(active, context).damageMultiplier).toBeCloseTo(1.03)

    const absent = makeState()
    expect(getArcaneCoreCastModifiers(absent, context, true).damageMultiplier).toBeCloseTo(1)

    const enemyOwned = makeState()
    applyStatus(enemyOwned, 'enemy', 'burning', enemySpell, { durationMs: 5_000 })
    expect(getArcaneCoreCastModifiers(enemyOwned, context, true).damageMultiplier).toBeCloseTo(1)

    const nonDamaging = makeState()
    applyStatus(nonDamaging, 'enemy', 'burning', playerSpell, {
      durationMs: 5_000,
      periodicEffects: [{ type: 'heal', target: 'self', magnitude: { type: 'flat', value: 1 } }],
    })
    expect(getArcaneCoreCastModifiers(nonDamaging, context, true).damageMultiplier).toBeCloseTo(1)
  })
})
