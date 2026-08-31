import { MONSTERS, isBossMonster } from '../monsters'
import type { DungeonId, GameState, MonsterId } from '../../types'

export type DungeonUnlockCondition = { type: 'always' } | { type: 'boss-kill'; bossId: MonsterId }

export interface DungeonDefinition {
  id: DungeonId
  name: string
  monsterPool: MonsterId[]
  threatRequired: number
  boss: MonsterId
  encounterDelayMs: number
  unlock?: DungeonUnlockCondition
  completesTutorial?: boolean
  ui?: { description: string }
}

export const DUNGEON_ORDER: DungeonId[] = ['whispering-woods', 'howling-den', 'abandoned-catacombs']

export const DUNGEONS: Record<DungeonId, DungeonDefinition> = {
  'whispering-woods': { id: 'whispering-woods', name: 'Whispering Woods', monsterPool: ['forest-wisp', 'thornling', 'stone-root', 'grove-sentinel'], threatRequired: 20, boss: 'forest-heart', encounterDelayMs: 5000, unlock: { type: 'always' }, ui: { description: 'A restless grove where living roots and arcane wisps guard the Forest Heart.' } },
  'howling-den': { id: 'howling-den', name: 'Howling Den', monsterPool: ['cavefang-wolf', 'razorclaw-lynx', 'corrupted-dire-wolf'], threatRequired: 25, boss: 'corrupted-greatbear', encounterDelayMs: 5000, unlock: { type: 'boss-kill', bossId: 'forest-heart' }, ui: { description: 'A predator-haunted den twisted by unstable magic.' } },
  'abandoned-catacombs': { id: 'abandoned-catacombs', name: 'Abandoned Catacombs', monsterPool: ['restless-skeleton', 'grave-wraith', 'fallen-acolyte'], threatRequired: 30, boss: 'archmage-edrin-shade', encounterDelayMs: 5000, unlock: { type: 'boss-kill', bossId: 'corrupted-greatbear' }, completesTutorial: true, ui: { description: 'A dead mage’s tomb-complex where spirits and forgotten magic still linger.' } },
}

export const isDungeonUnlocked = (dungeon: DungeonDefinition, progress: Pick<GameState, 'progress'>['progress']) => {
  const unlock = dungeon.unlock ?? { type: 'always' as const }
  return unlock.type === 'always' || (progress.bossKillsByBoss[unlock.bossId] ?? 0) >= 1
}

export const isDungeonCompleted = (dungeonId: DungeonId, progress: GameState['progress']) => (progress.bossKillsByBoss[DUNGEONS[dungeonId].boss] ?? 0) >= 1

export const isTutorialCompleted = (progress: GameState['progress']) => {
  const tutorialDungeon = DUNGEON_ORDER.map((id) => DUNGEONS[id]).find((dungeon) => dungeon.completesTutorial)
  return tutorialDungeon ? isDungeonCompleted(tutorialDungeon.id, progress) : false
}

export const getDungeonUnlockRequirement = (dungeon: DungeonDefinition) => {
  const unlock = dungeon.unlock ?? { type: 'always' as const }
  return unlock.type === 'always' ? null : `Defeat ${MONSTERS[unlock.bossId]?.name ?? unlock.bossId}`
}

export const validateDungeonDefinitions = () => {
  const errors: string[] = []
  DUNGEON_ORDER.forEach((dungeonId) => {
    const dungeon = DUNGEONS[dungeonId]
    if (!dungeon) { errors.push(`${dungeonId}: missing dungeon definition`); return }
    if (!Number.isInteger(dungeon.threatRequired) || dungeon.threatRequired <= 0) errors.push(`${dungeon.id}: threatRequired must be a positive integer`)
    if (!Number.isFinite(dungeon.encounterDelayMs) || dungeon.encounterDelayMs <= 0) errors.push(`${dungeon.id}: encounterDelayMs must be positive`)
    dungeon.monsterPool.forEach((monsterId) => { if (!MONSTERS[monsterId]) errors.push(`${dungeon.id}: unknown monster ${monsterId}`) })
    if (!MONSTERS[dungeon.boss]) errors.push(`${dungeon.id}: unknown boss ${dungeon.boss}`)
    if (dungeon.monsterPool.includes(dungeon.boss)) errors.push(`${dungeon.id}: boss must not be in the normal monster pool`)
    if (dungeon.unlock?.type === 'boss-kill' && (!MONSTERS[dungeon.unlock.bossId] || !isBossMonster(MONSTERS[dungeon.unlock.bossId]))) errors.push(`${dungeon.id}: unlock boss must be a known boss monster`)
  })
  const extraIds = Object.keys(DUNGEONS).filter((id) => !DUNGEON_ORDER.includes(id as DungeonId))
  extraIds.forEach((id) => errors.push(`${id}: dungeon is missing from DUNGEON_ORDER`))
  if (errors.length && import.meta.env.DEV) console.error(`[dungeons] ${errors.join('; ')}`)
  return errors
}

validateDungeonDefinitions()

export const chooseMonster = (pool: MonsterId[], rng: () => number = Math.random) => pool[Math.floor(Math.max(0, Math.min(0.999999, rng())) * pool.length)]
