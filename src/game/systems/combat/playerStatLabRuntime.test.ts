import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { BALANCE } from '../../core/balance/balance'
import { castSpellAction } from '../../../store/actions/combatActions'
import { resolvePlayerSpellCast } from '../../engine/spellEngine'
import { SPELLS } from '../../content/spells/spells'
import { recalculateDerivedStats } from '../../engine'
import { getPlayerCombatStats, getCritChance, getCritDamageMultiplier, getCooldownRecoveryMultiplier, getDamageOverTimeBonus, getDefense, getEffectiveManaCost, getManaCostReduction } from './combatStats'
import { getCombatModifierContributions, getCombatModifiers, getResistance } from './modifiers'
import { executeCombatEffects } from './effectResolver'
import { applyStatus, resolveStatusDuration } from './statusRuntime'
import { createCombatTestState } from './testCombatState'
import { getEffectiveSpellCastTimeMs } from '../spells/spellCastTiming'
import { spawnEnemy } from './combatRuntime'
import type { CombatSource } from './combatTypes'
import { damagePlayer } from './effectResolver'
import { tickStatuses } from './statusRuntime'

const playerSpell: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'lab-test', school: 'fire', tags: ['spell', 'magic', 'direct'] }
const enemyAction: CombatSource = { actor: 'enemy', kind: 'action', sourceId: 'lab-test-attack', tags: ['special'] }

describe('Player Stat Lab runtime coverage', () => {
  it('uses the real core stat resolvers for HP, Mana, regeneration, and Spell Power', () => {
    const state = createInitialState()
    state.debug.playerStats.maxHealthFlat = 50
    state.debug.playerStats.maxHealthPercent = 0.2
    state.debug.playerStats.healthRegenFlat = 3
    state.debug.playerStats.maxManaFlat = 20
    state.debug.playerStats.maxManaPercent = 0.5
    state.debug.playerStats.manaRegenFlat = 4
    state.debug.playerStats.manaRegenPercent = 0.5
    state.debug.playerStats.spellPowerFlat = 40
    state.debug.playerStats.spellPowerPercent = 0.25
    recalculateDerivedStats(state)

    const stats = getPlayerCombatStats(state)
    expect(state.player.maxHealth).toBe((100 + 50) * 1.2)
    expect(stats.maxHealth).toBe(state.player.maxHealth)
    expect(stats.healthRegen).toBe(BALANCE.player.healthRegenPerSecond + 3)
    expect(state.player.maxMana).toBe(Math.floor((state.player.baseMaxMana + 20) * 1.5))
    expect(stats.maxMana).toBe(state.player.maxMana)
    expect(stats.manaRegen).toBeCloseTo((BALANCE.mana.baseRegenPerSecond + 4) * 1.5)
    expect(stats.spellPower).toBeCloseTo((BALANCE.player.baseSpellPower + 40) * 1.25)
  })

  it('resolves offense modifiers in the live combat formulas', () => {
    const state = createCombatTestState()
    state.debug.playerStats.modifiers['crit-chance'] = 0.2
    state.debug.playerStats.modifiers['crit-damage'] = 0.3
    state.debug.playerStats.modifiers['damage-over-time-percent'] = 0.5
    state.debug.playerStats.modifiers['cooldown-recovery-percent'] = 0.5
    state.debug.playerStats.modifiers['spell-cast-time-percent'] = -0.25
    state.debug.playerStats.modifiers['damage-dealt-percent'] = 0.2
    state.debug.playerStats.modifiers['spell-damage-percent'] = 0.3

    expect(getCritChance(state, 'player')).toBeCloseTo(0.25)
    expect(getCritDamageMultiplier(state, 'player')).toBeCloseTo(1.8)
    expect(getDamageOverTimeBonus(state, 'player', playerSpell)).toBeCloseTo(0.5)
    expect(getCooldownRecoveryMultiplier(state)).toBeCloseTo(1.5)
    expect(getEffectiveSpellCastTimeMs(state, 'fire-bolt')).toBe(750)
    expect(getCombatModifiers(state, 'player', 'damage-dealt-percent', { source: playerSpell })).toBeCloseTo(0.2)
    expect(getCombatModifiers(state, 'player', 'spell-damage-percent', { source: playerSpell, damageType: 'fire' })).toBeCloseTo(0.3)
  })

  it('keeps per-element Spell Damage isolated and scales real DoT ticks', () => {
    const combatState = () => {
      const state = createCombatTestState()
      state.combat.active = true
      state.combat.locationId = 'whispering-woods'
      spawnEnemy(state, 'forest-wisp')
      return state
    }
    const baseline = combatState()
    const fireBoosted = combatState()
    const waterBaseline = combatState()
    const waterWithFireBoost = combatState()
    fireBoosted.debug.playerStats.spellDamageByType.fire = 0.5
    waterWithFireBoost.debug.playerStats.spellDamageByType.fire = 0.5
    const fireHit = [{ type: 'deal-damage' as const, target: 'opponent' as const, components: [{ damageType: 'fire' as const, magnitude: { type: 'flat' as const, value: 10 } }], tags: ['spell' as const, 'direct' as const] }]
    const waterHit = [{ type: 'deal-damage' as const, target: 'opponent' as const, components: [{ damageType: 'water' as const, magnitude: { type: 'flat' as const, value: 10 } }], tags: ['spell' as const, 'direct' as const] }]
    const fireSource = playerSpell
    const waterSource: CombatSource = { ...playerSpell, school: 'water' }
    executeCombatEffects(baseline, fireHit, fireSource)
    executeCombatEffects(fireBoosted, fireHit, fireSource)
    const baselineFireDamage = baseline.combat.enemyMaxHp - baseline.combat.enemyHp
    executeCombatEffects(baseline, waterHit, waterSource)
    executeCombatEffects(waterWithFireBoost, waterHit, waterSource)
    expect(fireBoosted.combat.enemyMaxHp - fireBoosted.combat.enemyHp).toBeCloseTo(baselineFireDamage * 1.5)
    executeCombatEffects(waterBaseline, waterHit, waterSource)
    expect(waterWithFireBoost.combat.enemyHp).toBeCloseTo(waterBaseline.combat.enemyHp)

    const dotBaseline = createCombatTestState()
    const dotBoosted = createCombatTestState()
    dotBaseline.combat.active = true
    dotBoosted.combat.active = true
    dotBaseline.combat.locationId = 'whispering-woods'
    dotBoosted.combat.locationId = 'whispering-woods'
    spawnEnemy(dotBaseline, 'forest-wisp')
    spawnEnemy(dotBoosted, 'forest-wisp')
    dotBoosted.debug.playerStats.modifiers['damage-over-time-percent'] = 0.5
    applyStatus(dotBaseline, 'enemy', 'burning', playerSpell)
    applyStatus(dotBoosted, 'enemy', 'burning', playerSpell)
    const beforeBaseline = dotBaseline.combat.enemyHp
    const beforeBoosted = dotBoosted.combat.enemyHp
    tickStatuses(dotBaseline, 1_000, executeCombatEffects)
    tickStatuses(dotBoosted, 1_000, executeCombatEffects)
    expect((beforeBaseline - beforeBoosted)).toBeCloseTo(0)
    expect(beforeBoosted - dotBoosted.combat.enemyHp).toBeCloseTo((beforeBaseline - dotBaseline.combat.enemyHp) * 1.5)
  })

  it('resolves flat/percent Defense, incoming damage, and each authored resistance type', () => {
    const state = createCombatTestState()
    state.debug.playerStats.modifiers['defense-flat'] = 20
    state.debug.playerStats.modifiers['defense-percent'] = 0.5
    state.debug.playerStats.modifiers['damage-taken-percent'] = -0.2
    expect(getDefense(state, 'player')).toBeCloseTo((BALANCE.player.baseDefense + 20) * 1.5)
    expect(getCombatModifiers(state, 'player', 'damage-taken-percent')).toBeCloseTo(-0.2)

    const types = ['physical', 'arcane', 'fire', 'water', 'earth', 'air'] as const
    types.forEach((type, index) => {
      state.debug.playerStats.resistanceByType[type] = (index + 1) / 100
      expect(getResistance(state, 'player', type)).toBeCloseTo((index + 1) / 100)
    })
    expect(getResistance(state, 'player', 'fire')).not.toBe(getResistance(state, 'player', 'physical'))

    const baseIncoming = createCombatTestState()
    const fireResistIncoming = createCombatTestState()
    const physicalResistIncoming = createCombatTestState()
    fireResistIncoming.debug.playerStats.resistanceByType.fire = 0.25
    physicalResistIncoming.debug.playerStats.resistanceByType.physical = 0.25
    const incoming = (target: 'physical' | 'fire') => [{ type: 'deal-damage' as const, target: 'opponent' as const, components: [{ damageType: target, magnitude: { type: 'flat' as const, value: 20 } }] }]
    ;[baseIncoming, fireResistIncoming, physicalResistIncoming].forEach((target) => { target.combat.active = true; target.combat.locationId = 'whispering-woods'; spawnEnemy(target, 'forest-wisp') })
    const sourceFor = (target: ReturnType<typeof createCombatTestState>): CombatSource => ({ actor: 'enemy', kind: 'action', sourceId: 'lab-incoming', sourceMonsterId: target.combat.enemyId ?? undefined, sourceInstanceKey: target.combat.enemyInstanceKey ?? undefined, school: 'fire', tags: ['special'] })
    const beforeFire = fireResistIncoming.player.health
    const beforePhysical = physicalResistIncoming.player.health
    executeCombatEffects(baseIncoming, incoming('fire'), sourceFor(baseIncoming))
    const baseFireLoss = baseIncoming.player.maxHealth - baseIncoming.player.health
    executeCombatEffects(fireResistIncoming, incoming('fire'), sourceFor(fireResistIncoming))
    executeCombatEffects(baseIncoming, incoming('physical'), sourceFor(baseIncoming))
    executeCombatEffects(physicalResistIncoming, incoming('fire'), sourceFor(physicalResistIncoming))
    expect(beforeFire - fireResistIncoming.player.health).toBeLessThan(baseFireLoss)
    expect(beforePhysical - physicalResistIncoming.player.health).toBeCloseTo(baseFireLoss)

    const takenBaseline = createCombatTestState()
    const takenReduced = createCombatTestState()
    ;[takenBaseline, takenReduced].forEach((target) => { target.combat.active = true; target.combat.locationId = 'whispering-woods'; spawnEnemy(target, 'forest-wisp') })
    takenReduced.debug.playerStats.modifiers['damage-taken-percent'] = -0.2
    const enemyFor = (target: ReturnType<typeof createCombatTestState>): CombatSource => ({ actor: 'enemy', kind: 'action', sourceId: 'lab-damage-taken', sourceMonsterId: target.combat.enemyId ?? undefined, sourceInstanceKey: target.combat.enemyInstanceKey ?? undefined, tags: ['special'] })
    const baselineBefore = takenBaseline.player.health
    const reducedBefore = takenReduced.player.health
    damagePlayer(takenBaseline, 20, enemyFor(takenBaseline))
    damagePlayer(takenReduced, 20, enemyFor(takenReduced))
    expect(reducedBefore - takenReduced.player.health).toBeCloseTo((baselineBefore - takenBaseline.player.health) * 0.8)
  })

  it('applies healing, barrier, and status-duration bonuses through effect runtime', () => {
    const state = createCombatTestState()
    state.player.health = 30
    state.debug.playerStats.modifiers['healing-done-percent'] = 0.5
    state.debug.playerStats.modifiers['healing-received-percent'] = 0.5
    executeCombatEffects(state, [{ type: 'heal', target: 'self', magnitude: { type: 'flat', value: 20 } }], playerSpell)
    expect(state.player.health).toBe(75)

    state.debug.playerStats.modifiers['barrier-power-percent'] = 0.5
    state.debug.playerStats.modifiers['barrier-received-flat'] = 10
    state.debug.playerStats.modifiers['barrier-received-percent'] = 0.5
    executeCombatEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 20 }, mode: 'add', durationMs: null }], playerSpell)
    expect(state.combat.playerBarrier).toBe(55)

    state.debug.playerStats.modifiers['status-duration-dealt-percent'] = 1
    state.debug.playerStats.modifiers['status-duration-received-percent'] = -0.25
    state.debug.playerStats.modifiers['control-duration-received-percent'] = -0.5
    state.combat.active = true
    state.combat.locationId = 'whispering-woods'
    spawnEnemy(state, 'forest-wisp')
    applyStatus(state, 'enemy', 'burning', playerSpell)
    expect(state.combat.enemyStatuses[0]?.remainingMs).toBe(10_000)
    expect(resolveStatusDuration(state, 'player', 'stunned', 4_000, enemyAction)).toBe(1_000)
    expect(resolveStatusDuration(state, 'player', 'burning', 4_000, enemyAction)).toBe(3_000)
  })

  it('spends the canonical reduced cost on an actual completed spell cast', () => {
    const state = createCombatTestState()
    const originalManaCost = SPELLS['fire-bolt'].manaCost
    try {
      SPELLS['fire-bolt'].manaCost = 40
      state.combat.active = true
      state.combat.locationId = 'whispering-woods'
      state.combat.enemyId = 'forest-wisp'
      state.combat.enemyInstanceKey = 'lab-fire-bolt'
      state.combat.enemyHp = 1000
      state.combat.enemyMaxHp = 1000
      state.combat.activeSpellLoadout = { presetId: null, presetName: 'Stat Lab Cast', slots: [{ spellId: 'fire-bolt', autoCast: false }], signature: 'fire-bolt:0' }
      state.progress.spellRanks['fire-bolt'] = 1
      state.player.mana = 100
      state.debug.playerStats.manaCostReductionPercent = 0.5

      expect(getManaCostReduction(state)).toBe(0.5)
      expect(getEffectiveManaCost(state, 40)).toBe(20)
      expect(castSpellAction(state, 'fire-bolt')).toBe(true)
      expect(state.combat.pendingPlayerSpellCast?.manaCostSnapshot).toBe(20)
      expect(resolvePlayerSpellCast(state)).toBe(true)
      expect(state.player.mana).toBe(80)
    } finally {
      SPELLS['fire-bolt'].manaCost = originalManaCost
    }
  })

  it('labels active combat contributions as the Player Stat Lab debug source', () => {
    const state = createCombatTestState()
    state.debug.playerStats.modifiers['damage-dealt-percent'] = 0.25
    const contributions = getCombatModifierContributions(state, 'player', 'damage-dealt-percent')

    expect(contributions).toContainEqual(expect.objectContaining({ sourceType: 'debug', sourceName: 'Player Stat Lab', value: 0.25 }))
  })
})
