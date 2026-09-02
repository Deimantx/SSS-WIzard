import { describe, expect, it } from 'vitest'
import { MONSTERS } from '../../content/monsters'
import { createInitialState } from '../../../store/initialState'
import { forceResolveEnemyAction } from './actionRuntime'
import { executeCombatEffects } from './effectResolver'
import { resolveMagnitude } from './magnitude'
import { spawnEnemy } from './combatRuntime'

const enemySource = (state: ReturnType<typeof createInitialState>, sourceId: string) => ({
  actor: 'enemy' as const,
  kind: 'action' as const,
  sourceId,
  sourceMonsterId: state.combat.enemyId ?? undefined,
  sourceInstanceKey: state.combat.enemyInstanceKey ?? undefined,
})

describe('scaled enemy action output', () => {
  it('resolves direct damage from the Monster Basic Attack Damage baseline', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    spawnEnemy(state, 'forest-heart')
    const source = enemySource(state, 'heart-pulse')
    const effect = MONSTERS['forest-heart'].actions['heart-pulse'].effects[0]
    const magnitude = 'magnitude' in effect ? effect.magnitude : effect.type === 'deal-damage' ? effect.components[0]?.magnitude : undefined
    if (!magnitude) throw new Error('Expected Heart Pulse damage magnitude')
    expect(resolveMagnitude(state, magnitude, source, 'player')).toBe(24)

    const original = MONSTERS['forest-heart'].basicAttackDamage
    try {
      MONSTERS['forest-heart'].basicAttackDamage = 30
      expect(resolveMagnitude(state, magnitude, source, 'player')).toBe(36)
    } finally {
      MONSTERS['forest-heart'].basicAttackDamage = original
    }
  })

  it('resolves healing and Barrier from the current Monster Max Health', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    spawnEnemy(state, 'forest-heart')
    const source = enemySource(state, 'rejuvenating-sap')
    const heal = MONSTERS['forest-heart'].actions['rejuvenating-sap'].effects[0]
    if (!('magnitude' in heal)) throw new Error('Expected Rejuvenating Sap magnitude')
    expect(resolveMagnitude(state, heal.magnitude, source, 'enemy')).toBe(60)
    state.combat.enemyMaxHp = 800
    expect(resolveMagnitude(state, heal.magnitude, source, 'enemy')).toBe(80)

    const barrierState = createInitialState()
    barrierState.combat.active = true
    barrierState.combat.dungeonId = 'whispering-woods'
    spawnEnemy(barrierState, 'grove-sentinel')
    const barrier = MONSTERS['grove-sentinel'].actions['verdant-guard'].effects[0]
    if (!('magnitude' in barrier)) throw new Error('Expected Verdant Guard magnitude')
    expect(resolveMagnitude(barrierState, barrier.magnitude, enemySource(barrierState, 'verdant-guard'), 'enemy')).toBeCloseTo(60, 6)
  })

  it('snapshots a scaled DoT so later Monster stat changes do not rewrite it', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'howling-den'
    spawnEnemy(state, 'razorclaw-lynx')
    state.combat.enemyCurrentStepId = null
    expect(forceResolveEnemyAction(state, 'rending-claws', executeCombatEffects)).toBe(true)
    const bleeding = state.combat.playerStatuses.find((status) => status.statusId === 'bleeding')
    const tick = bleeding?.periodicEffects?.[0]
    expect(tick).toMatchObject({ components: [{ magnitude: { type: 'flat', value: 3.9875 } }] })

    const original = MONSTERS['razorclaw-lynx'].basicAttackDamage
    try {
      MONSTERS['razorclaw-lynx'].basicAttackDamage = 40
      expect(bleeding?.periodicEffects?.[0]).toMatchObject({ components: [{ magnitude: { type: 'flat', value: 3.9875 } }] })
    } finally {
      MONSTERS['razorclaw-lynx'].basicAttackDamage = original
    }
  })
})
