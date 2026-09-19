import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { finishEnemy } from '../../systems/combat/combatRuntime'
import { getArcaneCoreReward } from './arcaneCoreRewards'

describe('Arcane Core rewards', () => {
  it('defines dungeon-scaled Arcane Point rewards for normal and boss kills', () => {
    expect(getArcaneCoreReward('whispering-woods')).toEqual({ normalKillPoints: 1, bossKillPoints: 8 })
  })

  it('awards direct Arcane Points through normal and boss combat resolution', () => {
    const normal = createInitialState()
    normal.combat.active = true
    normal.combat.dungeonId = 'whispering-woods'
    normal.combat.enemyId = 'forest-wisp'
    finishEnemy(normal)
    expect(normal.arcaneCore.totalPointsEarned).toBe(1)

    const boss = createInitialState()
    boss.combat.active = true
    boss.combat.dungeonId = 'whispering-woods'
    boss.combat.enemyId = 'forest-heart'
    finishEnemy(boss)
    expect(boss.arcaneCore.totalPointsEarned).toBe(8)
  })
})
