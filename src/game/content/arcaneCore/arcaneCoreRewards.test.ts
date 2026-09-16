import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { finishEnemy, spawnEnemy } from '../../systems/combat/combatRuntime'
import { getArcaneCoreReward } from './arcaneCoreRewards'

describe('Arcane Core rewards', () => {
  it('awards small Essence from normal kills and repeatable boss rewards', () => {
    expect(getArcaneCoreReward('whispering-woods')).toEqual({ corePoints: 1, normalEssence: 1, bossEssence: 10 })
  })

  it('awards normal Essence and boss Core Points through combat resolution', () => {
    const normal = createInitialState()
    normal.combat.active = true
    normal.combat.dungeonId = 'whispering-woods'
    spawnEnemy(normal, 'forest-wisp')
    finishEnemy(normal)
    expect(normal.arcaneCore).toMatchObject({ corePoints: 0, arcaneEssence: 1 })

    const boss = createInitialState()
    boss.combat.active = true
    boss.combat.dungeonId = 'whispering-woods'
    spawnEnemy(boss, 'forest-heart')
    finishEnemy(boss)
    expect(boss.arcaneCore).toMatchObject({ corePoints: 1, arcaneEssence: 10 })
  })
})
