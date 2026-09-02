import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { DUNGEONS, DUNGEON_ORDER, isDungeonUnlocked } from './dungeons'
import { MONSTERS, validateMonsterDefinitions } from '../monsters'
import { STATUS_DEFINITIONS } from '../statuses'
import { TRAIT_DEFINITIONS } from '../traits'
import type { CombatSource } from '../../types'
import { damageEnemy, finishEnemy, spawnEnemy, spawnNextEnemy } from '../../systems/combat/combatRuntime'
import { calculateCombatDamage } from '../../systems/combat/effectResolver'
import { resolveMonsterBaseMagnitudePreview } from '../../presentation/combat'

const labels = (monsterId: keyof typeof MONSTERS, patternId = 'default') => MONSTERS[monsterId].actionPatterns[patternId].steps.map((step) => step.type === 'basic' ? 'Basic' : MONSTERS[monsterId].actions[step.actionId].name)
const playerSpell: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'content-test', tags: ['spell', 'magic'] }

describe('first three dungeon content', () => {
  it('authors the stable dungeon order, pools, bosses, unlocks, and delay', () => {
    expect(DUNGEON_ORDER).toEqual(['whispering-woods', 'howling-den', 'abandoned-catacombs'])
    expect(DUNGEONS['whispering-woods'].monsterPool).toEqual(['forest-wisp', 'thornling', 'stone-root', 'grove-sentinel'])
    expect(DUNGEONS['whispering-woods'].boss).toBe('forest-heart')
    expect(DUNGEONS['howling-den'].boss).toBe('corrupted-greatbear')
    expect(DUNGEONS['abandoned-catacombs'].boss).toBe('archmage-edrin-shade')
    expect(Object.values(DUNGEONS).every((dungeon) => dungeon.encounterDelayMs === 5000)).toBe(true)
    const state = createInitialState()
    expect(isDungeonUnlocked(DUNGEONS['whispering-woods'], state.progress)).toBe(true)
    expect(isDungeonUnlocked(DUNGEONS['howling-den'], state.progress)).toBe(false)
    state.progress.bossKillsByBoss['forest-heart'] = 1
    expect(isDungeonUnlocked(DUNGEONS['howling-den'], state.progress)).toBe(true)
    expect(isDungeonUnlocked(DUNGEONS['abandoned-catacombs'], state.progress)).toBe(false)
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    expect(isDungeonUnlocked(DUNGEONS['abandoned-catacombs'], state.progress)).toBe(true)
  })

  it('keeps all authored monster records and exact action sequences', () => {
    expect(Object.keys(MONSTERS)).toHaveLength(13)
    expect(validateMonsterDefinitions()).toEqual([])
    expect(labels('cavefang-wolf')).toEqual(['Basic', 'Basic', 'Pounce'])
    expect(labels('razorclaw-lynx')).toEqual(['Basic', 'Rending Claws', 'Basic'])
    expect(labels('corrupted-dire-wolf')).toEqual(['Basic', 'Arcane Bite', 'Basic', 'Basic', 'Corrupted Howl'])
    expect(labels('corrupted-greatbear')).toEqual(['Basic', 'Basic', 'Crushing Maul', 'Basic', 'Groundbreaker'])
    expect(labels('corrupted-greatbear', 'corrupted')).toEqual(['Basic', 'Corrupted Roar', 'Crushing Maul', 'Basic', 'Basic', 'Arcane Rampage'])
    expect(labels('restless-skeleton')).toEqual(['Basic', 'Basic', 'Bone Cleaver'])
    expect(labels('grave-wraith')).toEqual(['Basic', 'Chilling Touch', 'Basic', 'Basic', 'Fade'])
    expect(labels('fallen-acolyte')).toEqual(['Grave Bolt', 'Basic', 'Soul Drain', 'Basic', 'Basic', 'Death Ward', 'Basic'])
    expect(labels('archmage-edrin-shade')).toEqual(['Gravefire', 'Basic', 'Frostbind', 'Arcane Ward', 'Basic', 'Soul Drain'])
    expect(labels('archmage-edrin-shade', 'unbound')).toEqual(['Basic', 'Gravefire', 'Frostbind', 'Soul Drain', 'Basic', 'Final Incantation'])
    expect(MONSTERS['corrupted-dire-wolf'].actions['arcane-bite'].effects.map((effect) => effect.type === 'deal-damage' ? effect.components : effect.type)).toEqual([
      [{ damageType: 'physical', magnitude: { type: 'source-basic-damage-percent', value: 0.7 } }, { damageType: 'arcane', magnitude: { type: 'source-basic-damage-percent', value: 0.7 } }],
    ])
    expect(Object.values(MONSTERS).every((monster) => monster.loot.some((drop) => drop.itemId === 'life-essence'))).toBe(true)
  })

  it('uses source scaling for all current Monster numerical Action output', () => {
    Object.values(MONSTERS).forEach((monster) => Object.values(monster.actions).forEach((action) => action.effects.forEach((effect) => {
      if (effect.type === 'deal-damage' && !effect.tags?.includes('dot')) effect.components.forEach((component) => expect(component.magnitude.type).toBe('source-basic-damage-percent'))
      if (effect.type === 'heal') expect(effect.magnitude.type).toBe('source-max-health-percent')
      if (effect.type === 'gain-barrier') expect(effect.magnitude.type).toBe('source-max-health-percent')
      if (effect.type === 'apply-status' && effect.periodicEffects) effect.periodicEffects.forEach((periodicEffect) => {
        if (periodicEffect.type === 'deal-damage') periodicEffect.components.forEach((component) => expect(component.magnitude.type).toBe('source-basic-damage-percent'))
      })
    })))
    const ancientGrowth = TRAIT_DEFINITIONS['grove-sentinel-ancient-growth'].rules?.[0].effects[0]
    expect(ancientGrowth).toMatchObject({ type: 'gain-barrier', magnitude: { type: 'source-max-health-percent', value: 2 / 9 } })
  })

  it('keeps converted current raw outputs close to their previous authored values', () => {
    const expected: Array<[keyof typeof MONSTERS, string, number, number]> = [
      ['forest-wisp', 'arc-spark', 0, 12], ['thornling', 'thorn-lash', 0, 10], ['stone-root', 'root-slam', 0, 18.15],
      ['grove-sentinel', 'root-crush', 0, 20.25], ['grove-sentinel', 'verdant-guard', 0, 60], ['forest-heart', 'heart-pulse', 0, 24],
      ['forest-heart', 'root-prison', 0, 16], ['forest-heart', 'rejuvenating-sap', 0, 60], ['cavefang-wolf', 'pounce', 0, 18],
      ['razorclaw-lynx', 'rending-claws', 0, 13.75], ['corrupted-dire-wolf', 'arcane-bite', 0, 9.8], ['corrupted-greatbear', 'crushing-maul', 0, 34.1],
      ['corrupted-greatbear', 'groundbreaker', 0, 26.4], ['corrupted-greatbear', 'arcane-rampage', 0, 44], ['restless-skeleton', 'bone-cleaver', 0, 27.75],
      ['grave-wraith', 'chilling-touch', 0, 18.2], ['fallen-acolyte', 'grave-bolt', 0, 24], ['fallen-acolyte', 'soul-drain', 0, 18],
      ['fallen-acolyte', 'soul-drain', 1, 19.8], ['fallen-acolyte', 'death-ward', 0, 45.1], ['archmage-edrin-shade', 'gravefire', 0, 28],
      ['archmage-edrin-shade', 'frostbind', 0, 24], ['archmage-edrin-shade', 'arcane-ward', 0, 70.2], ['archmage-edrin-shade', 'soul-drain', 0, 24],
      ['archmage-edrin-shade', 'soul-drain', 1, 29.9], ['archmage-edrin-shade', 'final-incantation', 0, 70],
    ]
    expected.forEach(([monsterId, actionId, effectIndex, amount]) => {
      const effect = MONSTERS[monsterId].actions[actionId].effects[effectIndex]
      const magnitude = 'magnitude' in effect ? effect.magnitude : effect.type === 'deal-damage' ? effect.components[0]?.magnitude : undefined
      if (!magnitude) throw new Error(`Expected a magnitude for ${monsterId}/${actionId}`)
      expect(resolveMonsterBaseMagnitudePreview(MONSTERS[monsterId], magnitude)).toBeCloseTo(amount, 4)
    })
  })

  it('authors Bleeding and Spectral Fade with their required lifecycle rules', () => {
    expect(STATUS_DEFINITIONS.bleeding).toMatchObject({ classification: 'debuff', tags: ['debuff', 'dot', 'physical'], defaultDurationMs: 8000, stacking: { mode: 'refresh' }, cleanseable: true, dispellable: false, periodic: { intervalMs: 2000 } })
    expect(STATUS_DEFINITIONS.bleeding.periodic?.effects[0]).toMatchObject({ type: 'deal-damage', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 4 } }] })
    expect(STATUS_DEFINITIONS['spectral-fade']).toMatchObject({ classification: 'buff', defaultDurationMs: 5000, stacking: { mode: 'strongest' }, cleanseable: false, dispellable: true })
    expect(STATUS_DEFINITIONS['spectral-fade'].modifiers).toContainEqual({ key: 'damage-taken-percent', value: -0.25 })
    expect(TRAIT_DEFINITIONS['corrupted-greatbear-unstable-corruption'].rules?.[0].effects).toHaveLength(2)
    expect(TRAIT_DEFINITIONS['archmage-edrin-unbound-spirit'].rules?.[0].effects).toHaveLength(2)
  })

  it('uses canonical resistances and crosses each boss phase once', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'howling-den'
    spawnEnemy(state, 'corrupted-greatbear')
    damageEnemy(state, 500, 'spell')
    expect(state.combat.enemyActionPatternId).toBe('corrupted')
    expect(state.combat.enemyStatuses.some((status) => status.statusId === 'haste')).toBe(true)
    const firstPattern = state.combat.enemyActionPatternId
    damageEnemy(state, 1, 'spell')
    expect(state.combat.enemyActionPatternId).toBe(firstPattern)

    const edrin = createInitialState()
    edrin.combat.active = true
    edrin.combat.dungeonId = 'abandoned-catacombs'
    spawnEnemy(edrin, 'archmage-edrin-shade')
    damageEnemy(edrin, 700, 'spell')
    expect(edrin.combat.enemyActionPatternId).toBe('unbound')
    expect(edrin.combat.enemyStatuses.some((status) => status.statusId === 'haste')).toBe(true)

    const wraith = createInitialState()
    wraith.combat.active = true
    wraith.combat.dungeonId = 'abandoned-catacombs'
    spawnEnemy(wraith, 'grave-wraith')
    expect(calculateCombatDamage(wraith, 100, 'physical', playerSpell, 'enemy').resolvedBeforeBarrier).toBe(50)
    expect(calculateCombatDamage(wraith, 100, 'fire', playerSpell, 'enemy').resolvedBeforeBarrier).toBe(125)
  })

  it('queues the selected dungeon boss through the generic Auto Hunt path', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'howling-den'
    state.combat.threatCleared = 24
    state.progress.autoHuntBossUnlocked = true
    state.progress.autoHuntBossByDungeon['howling-den'] = true
    spawnEnemy(state, 'cavefang-wolf')
    finishEnemy(state)
    expect(state.combat.pendingBossId).toBe('corrupted-greatbear')
    spawnNextEnemy(state)
    expect(state.combat.enemyId).toBe('corrupted-greatbear')
    expect(state.combat.inBossFight).toBe(true)
  })
})
