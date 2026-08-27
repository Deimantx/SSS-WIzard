import { DUNGEONS } from '../../content/dungeons/dungeons'
import { MONSTERS, isBossMonster, type MonsterDefinition } from '../../content/monsters/whisperingWoods'
import type { BestiaryCategory, GameState, MonsterId } from '../../types'

export const BESTIARY_CATEGORIES = ['all', 'monster', 'boss', 'special-boss'] as const
export type BestiaryCategoryFilter = typeof BESTIARY_CATEGORIES[number]

export const getBestiaryEntries = () => Object.values(MONSTERS)
export const getMonstersByBestiaryCategory = (category: BestiaryCategory) => getBestiaryEntries().filter((monster) => monster.bestiaryCategory === category)
export const getBestiaryEntriesByCategory = (category: BestiaryCategoryFilter) => category === 'all' ? getBestiaryEntries() : getMonstersByBestiaryCategory(category)

export const getMonsterDefeatCount = (state: Pick<GameState, 'progress'>, monsterId: MonsterId) => {
  const monster = MONSTERS[monsterId]
  return isBossMonster(monster) ? state.progress.bossKillsByBoss[monsterId] ?? 0 : state.progress.lifetimeKillsByMonster[monsterId] ?? 0
}

export const getMonsterLocations = (monsterId: MonsterId) => Object.values(DUNGEONS).filter((dungeon) => dungeon.monsterPool.includes(monsterId) || dungeon.boss === monsterId || dungeon.specialBosses?.includes(monsterId)).map((dungeon) => dungeon.name)

export const getBestiaryCompletion = (state: Pick<GameState, 'progress'>) => {
  const entries = getBestiaryEntries()
  const discovered = entries.filter((monster) => state.progress.discoveredMonsters.includes(monster.id)).length
  const categories = Object.fromEntries((['monster', 'boss', 'special-boss'] as const).map((category) => {
    const members = getMonstersByBestiaryCategory(category)
    return [category, { discovered: members.filter((monster) => state.progress.discoveredMonsters.includes(monster.id)).length, total: members.length }]
  })) as Record<BestiaryCategory, { discovered: number; total: number }>
  const totalDefeats = entries.reduce((sum, monster) => sum + getMonsterDefeatCount(state, monster.id), 0)
  return { discovered, total: entries.length, percent: entries.length === 0 ? 0 : Math.round(discovered / entries.length * 100), categories, totalDefeats }
}

export const getBestiarySearchText = (monster: MonsterDefinition) => [monster.name, monster.subtitle, ...monster.traits.map((trait) => `${trait.name} ${trait.description}`), ...Object.values(monster.specialAttacks).map((attack) => `${attack.name} ${attack.description}`)].join(' ').toLowerCase()

export const formatDropChance = (chance: number) => chance >= 1 ? 'Guaranteed' : `${Number((Math.max(0, chance) * 100).toFixed(1))}%`
export const formatDropQuantity = (min: number, max: number) => min === max ? `×${min}` : `×${min}–${max}`
