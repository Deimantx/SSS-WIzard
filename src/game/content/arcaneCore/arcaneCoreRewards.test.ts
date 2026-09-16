import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { finishEnemy, spawnEnemy } from '../../systems/combat/combatRuntime'
import { getArcaneCoreReward } from './arcaneCoreRewards'

describe('Arcane Core rewards', () => {
  it('defines dungeon-scaled XP for normal and boss kills', () => {
    expect(getArcaneCoreReward('whispering-woods')).toEqual({ normalKillXp: 5, bossKillXp: 40 })
  })

  it('awards Arcane Core XP through normal and boss combat resolution', () => {
    const normal = createInitialState()
    normal.combat.active = true
    normal.combat.dungeonId = 'whispering-woods'
    spawnEnemy(normal, 'forest-wisp')
    finishEnemy(normal)
    expect(normal.arcaneCore.totalXp).toBe(5)

    const boss = createInitialState()
    boss.combat.active = true
    boss.combat.dungeonId = 'whispering-woods'
    spawnEnemy(boss, 'forest-heart')
    finishEnemy(boss)
    expect(boss.arcaneCore.totalXp).toBe(40)
  })
})
