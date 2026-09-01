import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { executeCombatEffects, damageEnemy, damagePlayer, getCombatDamagePreview } from './effectResolver'
import { applyStatus, tickStatuses } from './statusRuntime'
import { applyBarrier, finishEnemy, resolveCombatDeaths, spawnEnemy } from './combatRuntime'
import { clearCurrentEnemyAction, forceResolveEnemyAction, startEnemyAction } from './actionRuntime'
import { runCombatTriggers } from './triggerRuntime'
import { migrateSave } from '../../../persistence/migrations'
import type { CombatSource, GameState, TraitDefinition, TraitId } from '../../types'
import { advanceGameState } from '../simulation/advanceGameState'
import { tickBarriers } from './barrierRuntime'
import { castSpellAction } from '../../../store/actions/combatActions'
import { MONSTERS } from '../../content/monsters'
import { TRAIT_DEFINITIONS } from '../../content/traits'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import { SPELLS } from '../../content/spells/spells'
import { getEnemySkillActionRate, getPlayerBasicAttackRate } from './actionRuntime'
import { getTimedActionState } from './actionTiming'
import { getSpellEquipmentBonusPreview } from '../spells/spellEquipmentPreview'

const playerSpell: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'test-spell', school: 'fire', tags: ['spell', 'magic'] }
const enemyAttack = (state: GameState): CombatSource => ({ actor: 'enemy', kind: 'basic-attack', sourceId: 'test-attack', sourceMonsterId: state.combat.enemyId ?? undefined, sourceInstanceKey: state.combat.enemyInstanceKey ?? undefined, tags: ['basic-attack', 'direct'] })
const stateWithEnemy = (enemyId: Parameters<typeof spawnEnemy>[1] = 'forest-wisp') => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  spawnEnemy(state, enemyId)
  return state
}

const withTemporaryTrait = (trait: TraitDefinition, test: () => void) => {
  const monster = MONSTERS['forest-wisp']
  const traitId = trait.id as TraitId
  const registry = TRAIT_DEFINITIONS as Record<string, TraitDefinition>
  const original = registry[trait.id]
  registry[trait.id] = trait
  monster.traitIds.push(traitId)
  try { test() } finally {
    monster.traitIds.pop()
    if (original) registry[trait.id] = original
    else delete registry[trait.id]
  }
}

describe('universal combat effects', () => {
  it('resolves damage, healing, barriers, mana, delay, and cooldowns', () => {
    const state = stateWithEnemy()
    state.combat.playerBarrier = 10
    damagePlayer(state, 15, enemyAttack(state))
    expect(state.combat.playerBarrier).toBe(0)
    expect(state.player.health).toBe(95)
    state.player.health = 99
    executeCombatEffects(state, [{ type: 'heal', target: 'self', magnitude: { type: 'flat', value: 20 } }, { type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 25 } }, { type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: 100 } }, { type: 'modify-action-timer', target: 'self', action: 'basic-attack', amountMs: 700 }, { type: 'modify-cooldown', target: 'self', spellId: 'fire-bolt', amountMs: -2000 }], playerSpell)
    expect(state.player.health).toBe(state.player.maxHealth)
    expect(state.combat.playerBarrier).toBe(25)
    expect(state.player.mana).toBe(state.player.maxMana)
    expect(state.combat.playerAttackTimerMs).toBe(2900)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(0)
  })

  it('uses one damage pipeline for enemy barriers, overflow, resistances, and source tags', () => {
    const state = stateWithEnemy('thornling')
    state.combat.enemyBarrier = 5
    const dealt = damageEnemy(state, 10, 'basic')
    expect(dealt).toBe(3.5)
    expect(state.combat.enemyBarrier).toBe(0)
    expect(state.combat.enemyHp).toBe(60.5)
    expect(state.combat.log).toContain('Barrier breaks.')
  })
})

describe('authored status runtime', () => {
  it('applies, refreshes, ticks, expires, and retains Burning source', () => {
    const state = stateWithEnemy()
    applyStatus(state, 'enemy', 'burning', playerSpell)
    expect(state.combat.enemyStatuses[0]).toMatchObject({ statusId: 'burning', source: playerSpell, remainingMs: 5000 })
    const first = state.combat.enemyStatuses[0]
    tickStatuses(state, 1000, executeCombatEffects)
    expect(state.combat.enemyHp).toBe(39)
    applyStatus(state, 'enemy', 'burning', playerSpell)
    expect(state.combat.enemyStatuses[0]).toMatchObject({ remainingMs: 5000, source: playerSpell })
    expect(first.statusId).toBe('burning')
    tickStatuses(state, 5000, executeCombatEffects)
    expect(state.combat.enemyStatuses).toHaveLength(0)
  })

  it('uses authored modifiers and stack caps without status-ID checks in damage code', () => {
    const state = stateWithEnemy()
    for (let index = 0; index < 6; index += 1) applyStatus(state, 'enemy', 'shock', playerSpell)
    expect(state.combat.enemyStatuses[0].stacks).toBe(5)
    executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', damageType: 'air', magnitude: { type: 'flat', value: 10 }, tags: ['spell'] }], { ...playerSpell, school: 'air' })
    expect(state.combat.enemyHp).toBe(32)
    applyStatus(state, 'player', 'quickening', { actor: 'player', kind: 'spell', sourceId: 'quickening', tags: ['spell'] })
    expect(getTimedActionState(1200, 1200, getPlayerBasicAttackRate(state)).etaMs).toBe(960)
  })

  it('ticks a holder-relative Regeneration and supports cleanse, dispel, and Stun', () => {
    const state = stateWithEnemy()
    state.player.health = 50
    applyStatus(state, 'player', 'regeneration', { actor: 'player', kind: 'spell', sourceId: 'regen', tags: ['spell'] })
    applyStatus(state, 'player', 'burning', { actor: 'enemy', kind: 'action', sourceId: 'burn', tags: ['special'] })
    applyStatus(state, 'player', 'stunned', { actor: 'enemy', kind: 'action', sourceId: 'stun', tags: ['special'] })
    tickStatuses(state, 1000, executeCombatEffects)
    expect(state.player.health).toBe(50)
    expect(state.combat.playerStatuses.some((status) => status.statusId === 'burning')).toBe(true)
    expect(state.combat.playerStatuses.some((status) => status.statusId === 'stunned')).toBe(true)
  })

  it('preserves a status applied by a periodic effect', () => {
    const original = STATUS_DEFINITIONS.quickening.periodic
    STATUS_DEFINITIONS.quickening.periodic = { intervalMs: 1000, effects: [{ type: 'apply-status', target: 'self', statusId: 'haste' }] }
    try {
      const state = stateWithEnemy()
      applyStatus(state, 'player', 'quickening', playerSpell)
      tickStatuses(state, 1000, executeCombatEffects)
      expect(state.combat.playerStatuses.map((status) => status.statusId)).toEqual(['quickening', 'haste'])
    } finally {
      STATUS_DEFINITIONS.quickening.periodic = original
    }
  })

  it('does not resurrect a status removed by an earlier periodic effect', () => {
    const original = STATUS_DEFINITIONS.quickening.periodic
    STATUS_DEFINITIONS.quickening.periodic = { intervalMs: 1000, effects: [{ type: 'remove-status', target: 'self', statusId: 'vulnerable' }] }
    try {
      const state = stateWithEnemy()
      applyStatus(state, 'player', 'quickening', playerSpell)
      applyStatus(state, 'player', 'vulnerable', enemyAttack(state))
      tickStatuses(state, 1000, executeCombatEffects)
      expect(state.combat.playerStatuses.map((status) => status.statusId)).toEqual(['quickening'])
    } finally {
      STATUS_DEFINITIONS.quickening.periodic = original
    }
  })

  it('preserves the live list after a periodic cleanse', () => {
    const original = STATUS_DEFINITIONS.quickening.periodic
    STATUS_DEFINITIONS.quickening.periodic = { intervalMs: 1000, effects: [{ type: 'cleanse', target: 'self', mode: 'all' }] }
    try {
      const state = stateWithEnemy()
      applyStatus(state, 'player', 'quickening', playerSpell)
      applyStatus(state, 'player', 'burning', enemyAttack(state))
      tickStatuses(state, 1000, executeCombatEffects)
      expect(state.combat.playerStatuses.map((status) => status.statusId)).toEqual(['quickening'])
    } finally {
      STATUS_DEFINITIONS.quickening.periodic = original
    }
  })
})

describe('combat save compatibility', () => {
  it('converts legacy Barrier and action-delay statuses without losing the remaining status source', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 11, combat: { ...initial.combat, playerBarrierRemainingMs: null, playerStatuses: [{ id: 'barrier', remainingMs: 9000, value: 22 }, { id: 'attack-delay', remainingMs: 700, value: 700 }, { id: 'burning', remainingMs: 4000, value: 5, tickIntervalMs: 1000, nextTickMs: 500 }], enemySpecialUsed: {} } } as any)
    expect(migrated.combat.playerBarrier).toBe(22)
    expect(migrated.combat.playerBarrierRemainingMs).toBe(9000)
    expect(migrated.combat.playerAttackTimerMs).toBe(migrated.combat.playerAttackDurationMs + 700)
    expect(migrated.combat.playerStatuses).toHaveLength(1)
    expect(migrated.combat.playerStatuses[0]).toMatchObject({ statusId: 'burning' })
  })
})

describe('data-driven monster mechanics', () => {
  it('composes Thorn Lash and Root Slam effects', () => {
    const thornling = stateWithEnemy('thornling')
    clearCurrentEnemyAction(thornling)
    forceResolveEnemyAction(thornling, 'thorn-lash', executeCombatEffects)
    expect(thornling.player.health).toBe(90)
    expect(thornling.combat.playerStatuses[0].statusId).toBe('thorn-wound')
    const root = stateWithEnemy('stone-root')
    clearCurrentEnemyAction(root)
    expect(root.combat.enemyBarrier).toBe(14)
    forceResolveEnemyAction(root, 'root-slam', executeCombatEffects)
    expect(root.player.health).toBe(82)
    expect(root.combat.playerAttackTimerMs).toBe(2900)
  })

  it('fires authored threshold rules once per encounter', () => {
    const sentinel = stateWithEnemy('grove-sentinel')
    damageEnemy(sentinel, 220, 'spell')
    expect(sentinel.combat.enemyBarrier).toBe(80)
    damageEnemy(sentinel, 10, 'spell')
    expect(sentinel.combat.enemyBarrier).toBe(70)
    expect(sentinel.combat.triggeredRuleIds).toEqual(['enemy:trait:grove-sentinel-ancient-growth:grove-sentinel-ancient-growth-threshold'])
    const heart = stateWithEnemy('forest-heart')
    damageEnemy(heart, 310, 'spell')
    expect(heart.combat.enemyStatuses[0]).toMatchObject({ statusId: 'haste', remainingMs: null })
    expect(getTimedActionState(2400, 2400, getEnemySkillActionRate(heart)).etaMs).toBeCloseTo(2400 / 1.15)
  })
})

describe('post-implementation combat audit regressions', () => {
  it('resolves a player death from a status tick before starting another action', () => {
    const state = stateWithEnemy()
    state.player.health = 1
    state.combat.playerAttackTimerMs = 0
    applyStatus(state, 'player', 'burning', enemyAttack(state))

    advanceGameState(state, 1000, { mode: 'live' })

    expect(state.combat.active).toBe(false)
    expect(state.combat.enemyId).toBeNull()
    expect(state.combat.playerStatuses).toEqual([])
  })

  it('resets Spell cooldowns on genuine defeat and starts re-entry ready', () => {
    const state = stateWithEnemy()
    state.progress.spellRanks.stoneguard = 1
    state.combat.spellCooldowns.stoneguard = 16_000
    state.player.health = 0

    expect(resolveCombatDeaths(state)).toBe(true)
    expect(state.combat.active).toBe(false)
    expect(state.combat.spellCooldowns).toEqual({})

    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.player.health = 1
    state.player.mana = state.player.maxMana
    spawnEnemy(state, 'forest-wisp')
    expect(castSpellAction(state, 'stoneguard')).toBe(true)
  })

  it('does not reset Spell cooldowns when God Mode prevents defeat', () => {
    const state = stateWithEnemy()
    state.combat.spellCooldowns.stoneguard = 16_000
    state.player.health = 0
    state.player.godMode = true

    expect(resolveCombatDeaths(state)).toBe(false)
    expect(state.combat.active).toBe(true)
    expect(state.combat.spellCooldowns.stoneguard).toBe(16_000)
  })

  it('blocks manual and automatic spell casts while Stunned without spending resources', () => {
    const state = stateWithEnemy()
    state.progress.spellRanks = { 'fire-bolt': 1 }
    state.player.mana = 50
      applyStatus(state, 'player', 'stunned', enemyAttack(state))
    expect(castSpellAction(state, 'fire-bolt')).toBe(false)
    expect(state.player.mana).toBe(50)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(0)
    expect(state.notifications.some((notification) => notification.text === 'Cannot cast while Stunned.')).toBe(true)

    state.notifications = []
    state.debug.bonusManaRegenFlat = -5
    state.activities.autoCast['fire-bolt'] = true
    state.combat.spellCooldowns['fire-bolt'] = 1000
    state.combat.playerAttackTimerMs = 500
    advanceGameState(state, 1000, { mode: 'live' })
    expect(state.player.mana).toBe(50)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(0)
    expect(state.combat.playerAttackTimerMs).toBe(500)
  })

  it('replaces temporary player barriers, expires them, and continues them during encounter delay', () => {
    const state = stateWithEnemy()
    executeCombatEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 20 } }], playerSpell)
    executeCombatEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 10 } }], playerSpell)
    expect(state.combat.playerBarrier).toBe(30)
    expect(state.combat.playerBarrierRemainingMs).toBeNull()

    executeCombatEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 25 }, mode: 'replace', durationMs: 9000 }], playerSpell)
    executeCombatEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 40 }, mode: 'replace', durationMs: 9000 }], playerSpell)
    expect(state.combat.playerBarrier).toBe(40)
    expect(state.combat.playerBarrierRemainingMs).toBe(9000)
    tickBarriers(state, 8999)
    expect(state.combat.playerBarrierRemainingMs).toBe(1)
    tickBarriers(state, 1)
    expect(state.combat.playerBarrier).toBe(0)
    expect(state.combat.playerBarrierRemainingMs).toBeNull()

    executeCombatEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 40 }, mode: 'replace', durationMs: 9000 }], playerSpell)
    const remaining = state.combat.playerBarrierRemainingMs
    if (remaining === null) throw new Error('Expected a timed player Barrier')
    state.combat.enemyHp = 0
    state.combat.enemyId = 'forest-wisp'
    // The normal finish path starts an encounter delay; active Dungeon time
    // continues to age temporary combat state there.
    finishEnemy(state)
    advanceGameState(state, 1000, { mode: 'live' })
    expect(state.combat.playerBarrierRemainingMs).toBe(remaining - 1000)
  })

  it('scopes Tide Focus to Water-aligned player Barriers', () => {
    const waterSource: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'water-barrier-test', school: 'water', tags: ['spell', 'magic', 'water'] }
    const earthSource: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'earth-barrier-test', school: 'earth', tags: ['spell', 'magic', 'earth'] }

    const baseWater = stateWithEnemy()
    executeCombatEffects(baseWater, SPELLS['water-ward'].effects, waterSource)
    expect(baseWater.combat.playerBarrier).toBe(70)

    const tideWater = stateWithEnemy()
    tideWater.equipment.offhand = 'tide-focus'
    executeCombatEffects(tideWater, SPELLS['water-ward'].effects, waterSource)
    expect(tideWater.combat.playerBarrier).toBe(97)

    const tideEarth = stateWithEnemy()
    tideEarth.equipment.offhand = 'tide-focus'
    executeCombatEffects(tideEarth, SPELLS.stoneguard.effects, earthSource)
    expect(tideEarth.combat.playerBarrier).toBe(150)
  })

  it('keeps generic flat Barrier Received bonuses independent of Water scope', () => {
    const waterSource: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'water-barrier-test', school: 'water', tags: ['spell', 'water'] }
    const earthSource: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'earth-barrier-test', school: 'earth', tags: ['spell', 'earth'] }

    const water = stateWithEnemy()
    water.equipment.armor = 'stoneweave-robe'
    executeCombatEffects(water, SPELLS['water-ward'].effects, waterSource)
    expect(water.combat.playerBarrier).toBe(80)

    const earth = stateWithEnemy()
    earth.equipment.armor = 'stoneweave-robe'
    executeCombatEffects(earth, SPELLS.stoneguard.effects, earthSource)
    expect(earth.combat.playerBarrier).toBe(140)
  })

  it('keeps the Water Barrier equipment preview aligned with runtime scope', () => {
    const state = stateWithEnemy()
    state.equipment.offhand = 'tide-focus'

    expect(getSpellEquipmentBonusPreview(state, 'water-ward')).toMatchObject({ totalPercent: 0.2, current: [expect.objectContaining({ itemId: 'tide-focus' })] })
    expect(getSpellEquipmentBonusPreview(state, 'stoneguard')).toMatchObject({ totalPercent: 0, current: [] })

    const waterSource: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'water-ward', school: 'water', tags: ['spell', 'magic', 'water'] }
    const earthSource: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'stoneguard', school: 'earth', tags: ['spell', 'magic', 'earth'] }
    executeCombatEffects(state, SPELLS['water-ward'].effects, waterSource)
    expect(state.combat.playerBarrier).toBe(97)
    state.combat.playerBarrier = 0
    executeCombatEffects(state, SPELLS.stoneguard.effects, earthSource)
    expect(state.combat.playerBarrier).toBe(150)
  })

  it('keeps authored barrier duration and effect tags explicit', () => {
    const state = stateWithEnemy()
    applyBarrier(state, 12)
    expect(state.combat.playerBarrier).toBe(12)
    expect(state.combat.playerBarrierRemainingMs).toBe(9000)
    expect(SPELLS['water-ward'].effects[0]).toMatchObject({ type: 'gain-barrier', mode: 'replace', durationMs: 9000 })
    expect(SPELLS.stoneguard.effects[0]).toMatchObject({ type: 'gain-barrier', mode: 'replace', durationMs: 9000 })
    expect(STATUS_DEFINITIONS.haste.tags).toEqual(['buff'])
    expect(STATUS_DEFINITIONS.quickening.tags).toEqual(['buff', 'air'])
    expect(MONSTERS['forest-heart'].actions['rejuvenating-sap'].tags).toEqual(['special', 'heal', 'direct'])
    expect(TRAIT_DEFINITIONS['stone-rooted-shell'].rules?.[0].effects[0]).toMatchObject({ type: 'gain-barrier', mode: 'add', durationMs: null })
  })

  it('dispatches damage-dealt only to the source actor', () => {
    const trait = { id: 'audit-damage-owner', name: 'Audit Damage Owner', description: 'Test trait.', rules: [{ id: 'audit-damage-owner-rule', event: 'on-damage-dealt' as const, effects: [{ type: 'gain-barrier' as const, target: 'self' as const, magnitude: { type: 'flat' as const, value: 1 } }] }] }
    withTemporaryTrait(trait, () => {
      const state = stateWithEnemy()
      damageEnemy(state, 1, 'spell')
      expect(state.combat.enemyBarrier).toBe(0)
      damagePlayer(state, 1, enemyAttack(state))
      expect(state.combat.enemyBarrier).toBe(1)
    })
  })

  it('applies Purified only to harmful status durations', () => {
    const state = stateWithEnemy()
    applyStatus(state, 'player', 'purified', { actor: 'player', kind: 'system', sourceId: 'test' })
    const burning = applyStatus(state, 'player', 'burning', enemyAttack(state))
    const regeneration = applyStatus(state, 'player', 'regeneration', { actor: 'player', kind: 'system', sourceId: 'test' })
    expect(burning?.remainingMs).toBe(2500)
    expect(regeneration?.remainingMs).toBe(6000)
  })

  it('modifies the committed enemy action timer without resolving recursively', () => {
    const state = stateWithEnemy()
    state.combat.enemyActionDurationMs = 2000
    state.combat.enemyActionTimerMs = 2000
    executeCombatEffects(state, [{ type: 'modify-action-timer', target: 'opponent', action: 'current', amountMs: -500 }], playerSpell)
    expect(state.combat.enemyActionTimerMs).toBe(1500)
    expect(state.combat.enemyActionDurationMs).toBe(2000)
  })

  it('applies Basic-specific timer changes only to a committed enemy Basic', () => {
    const basic = stateWithEnemy()
    const basicTimer = basic.combat.enemyActionTimerMs
    executeCombatEffects(basic, [{ type: 'modify-action-timer', target: 'opponent', action: 'basic-attack', amountMs: 500 }], playerSpell)
    expect(basic.combat.enemyActionTimerMs).toBe(basicTimer + 500)

    const skill = stateWithEnemy()
    clearCurrentEnemyAction(skill)
    skill.combat.enemyNextActionIndex = 2
    startEnemyAction(skill, 'arc-spark', executeCombatEffects)
    const skillTimer = skill.combat.enemyActionTimerMs
    executeCombatEffects(skill, [{ type: 'modify-action-timer', target: 'opponent', action: 'basic-attack', amountMs: 500 }], playerSpell)
    expect(skill.combat.enemyActionTimerMs).toBe(skillTimer)
    executeCombatEffects(skill, [{ type: 'modify-action-timer', target: 'opponent', action: 'current', amountMs: -500 }], playerSpell)
    expect(skill.combat.enemyActionTimerMs).toBe(skillTimer - 500)
  })

  it('does not create a fake enemy timer when no enemy action is committed', () => {
    const state = stateWithEnemy()
    clearCurrentEnemyAction(state)
    executeCombatEffects(state, [{ type: 'modify-action-timer', target: 'opponent', action: 'basic-attack', amountMs: 500 }], playerSpell)
    executeCombatEffects(state, [{ type: 'modify-action-timer', target: 'opponent', action: 'current', amountMs: 500 }], playerSpell)
    expect(state.combat.enemyCurrentStepId).toBeNull()
    expect(state.combat.enemyActionTimerMs).toBe(0)
    expect(state.combat.enemyActionDurationMs).toBe(0)
  })

  it('produces identical periodic results for one large tick and many small ticks', () => {
    const large = stateWithEnemy()
    const small = stateWithEnemy()
    large.player.health = 50
    small.player.health = 50
    applyStatus(large, 'enemy', 'burning', playerSpell)
    applyStatus(small, 'enemy', 'burning', playerSpell)
    applyStatus(large, 'enemy', 'thorn-wound', playerSpell)
    applyStatus(small, 'enemy', 'thorn-wound', playerSpell)
    applyStatus(large, 'player', 'regeneration', { actor: 'player', kind: 'system', sourceId: 'regen' })
    applyStatus(small, 'player', 'regeneration', { actor: 'player', kind: 'system', sourceId: 'regen' })
    tickStatuses(large, 5000, executeCombatEffects)
    for (let index = 0; index < 5; index += 1) tickStatuses(small, 1000, executeCombatEffects)
    expect(large.combat.enemyHp).toBe(small.combat.enemyHp)
    expect(large.player.health).toBe(small.player.health)
    expect(large.combat.enemyStatuses.map((status) => [status.statusId, status.remainingMs])).toEqual(small.combat.enemyStatuses.map((status) => [status.statusId, status.remainingMs]))
  })

  it('uses only the authored melee or ranged weapon tag', () => {
    const modifiers = STATUS_DEFINITIONS.quickening.modifiers ?? []
    const original = [...modifiers]
    modifiers.push({ key: 'melee-damage-percent', value: 0.5 })
    try {
      const melee = stateWithEnemy()
      applyStatus(melee, 'player', 'quickening', playerSpell)
      executeCombatEffects(melee, [{ type: 'deal-damage', target: 'opponent', damageType: 'physical', magnitude: { type: 'flat', value: 10 }, tags: ['direct'] }], { actor: 'player', kind: 'weapon', sourceId: 'melee', tags: ['weapon', 'melee'] })
      const ranged = stateWithEnemy()
      applyStatus(ranged, 'player', 'quickening', playerSpell)
      executeCombatEffects(ranged, [{ type: 'deal-damage', target: 'opponent', damageType: 'physical', magnitude: { type: 'flat', value: 10 }, tags: ['direct'] }], { actor: 'player', kind: 'weapon', sourceId: 'ranged', tags: ['weapon', 'ranged'] })
      expect(melee.combat.enemyHp).toBe(29)
      expect(ranged.combat.enemyHp).toBe(34)
    } finally {
      STATUS_DEFINITIONS.quickening.modifiers = original
    }
  })

  it('does not apply spell equipment multipliers to periodic Burning ticks', () => {
    const plain = stateWithEnemy()
    const equipped = stateWithEnemy()
    equipped.equipment.weapon = 'ember-staff'
    applyStatus(plain, 'enemy', 'burning', playerSpell)
    applyStatus(equipped, 'enemy', 'burning', playerSpell)
    tickStatuses(plain, 1000, executeCombatEffects)
    tickStatuses(equipped, 1000, executeCombatEffects)
    expect(equipped.combat.enemyHp).toBe(plain.combat.enemyHp - 1)
  })

  it('uses the canonical damage calculation for preview and resolution', () => {
    const state = stateWithEnemy()
    state.equipment.weapon = 'ember-staff'
    const source: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'fire-bolt', school: 'fire', tags: ['spell', 'magic'] }
    const preview = getCombatDamagePreview(state, 10, source, 'enemy', 'fire')
    executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', damageType: 'fire', school: 'fire', magnitude: { type: 'flat', value: 10 } }], source)
    expect(state.combat.enemyHp).toBe(44 - preview.healthDamage)
  })

  it('fires HP threshold rules only when health crosses downward', () => {
    const trait = { id: 'audit-threshold-owner', name: 'Audit Threshold Owner', description: 'Test trait.', rules: [{ id: 'audit-threshold-rule', event: 'on-hp-threshold' as const, condition: { type: 'self-hp-below-percent' as const, percent: 50 }, effects: [{ type: 'gain-barrier' as const, target: 'self' as const, magnitude: { type: 'flat' as const, value: 5 } }] }] }
    withTemporaryTrait(trait, () => {
      const state = stateWithEnemy()
      damageEnemy(state, 25, 'spell')
      expect(state.combat.enemyBarrier).toBe(5)
      damageEnemy(state, 1, 'spell')
      expect(state.combat.enemyBarrier).toBe(4)
    })
  })

  it('runs status-owned triggers with status source metadata and emits on-heal', () => {
    const original = STATUS_DEFINITIONS.quickening.triggers
    STATUS_DEFINITIONS.quickening.triggers = [{ id: 'audit-status-heal', event: 'on-heal', effects: [{ type: 'apply-status', target: 'self', statusId: 'haste' }] }]
    try {
      const state = stateWithEnemy()
      state.player.health = 90
      applyStatus(state, 'player', 'quickening', playerSpell)
      executeCombatEffects(state, [{ type: 'heal', target: 'self', magnitude: { type: 'flat', value: 1 }, tags: ['heal', 'direct'] }], playerSpell)
      const haste = state.combat.playerStatuses.find((status) => status.statusId === 'haste')
      expect(haste?.source).toMatchObject({ kind: 'status', sourceId: 'quickening' })
    } finally {
      STATUS_DEFINITIONS.quickening.triggers = original
    }
  })

  it('runs player status combat-start rules once per spawned encounter', () => {
    const original = STATUS_DEFINITIONS.quickening.triggers
    STATUS_DEFINITIONS.quickening.triggers = [{
      id: 'audit-player-combat-start',
      event: 'on-combat-start',
      oncePerEncounter: true,
      effects: [
        { type: 'apply-status', target: 'self', statusId: 'haste' },
        { type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 5 }, mode: 'add', durationMs: null },
      ],
    }]
    try {
      const state = createInitialState()
      state.combat.active = true
      state.combat.dungeonId = 'whispering-woods'
      applyStatus(state, 'player', 'quickening', playerSpell)

      spawnEnemy(state, 'forest-wisp')
      expect(state.combat.playerBarrier).toBe(5)
      expect(state.combat.playerStatuses.find((status) => status.statusId === 'haste')?.source).toMatchObject({ kind: 'status', sourceId: 'quickening', tags: ['status', 'buff', 'air'] })

      runCombatTriggers(state, 'player', 'on-combat-start', { source: { actor: 'player', kind: 'system', sourceId: 'combat-start' }, eventTarget: 'enemy' }, executeCombatEffects)
      expect(state.combat.playerBarrier).toBe(5)

      spawnEnemy(state, 'thornling')
      expect(state.combat.playerBarrier).toBe(10)
      expect(state.combat.triggeredRuleIds).toContain('player:status:quickening:audit-player-combat-start')
    } finally {
      STATUS_DEFINITIONS.quickening.triggers = original
    }
  })
})
