import { MONSTERS, isBossMonster } from '../monsters'
import { ABANDONED_CATACOMBS_DUNGEON, HOWLING_DEN_DUNGEON, WHISPERING_WOODS_DUNGEON } from './act0'
import { ACT1_DUNGEONS } from './act1'
import type { DungeonId, GameState, MonsterId } from '../../types'

export type DungeonUnlockCondition =
  | { type: 'always' }
  | { type: 'boss-kill'; bossId: MonsterId }
  | { type: 'all-boss-kills'; bossIds: MonsterId[] }

export interface DungeonDefinition {
  id: DungeonId
  name: string
  monsterPool: MonsterId[]
  threatRequired: number
  boss: MonsterId
  encounterDelayMs: number
  encounterSequence?: MonsterId[]
  unlock?: DungeonUnlockCondition
  completesTutorial?: boolean
  ui?: { description: string }
}

const ACT0_DUNGEONS = [WHISPERING_WOODS_DUNGEON, HOWLING_DEN_DUNGEON, ABANDONED_CATACOMBS_DUNGEON] as const
export const DUNGEON_ORDER: DungeonId[] = [...ACT0_DUNGEONS, ...ACT1_DUNGEONS].map((dungeon) => dungeon.id)
export const DUNGEONS: Record<DungeonId, DungeonDefinition> = Object.fromEntries([...ACT0_DUNGEONS, ...ACT1_DUNGEONS].map((dungeon) => [dungeon.id, dungeon])) as Record<DungeonId, DungeonDefinition>

export const isDungeonUnlocked = (dungeon: DungeonDefinition, progress: Pick<GameState['progress'], 'bossKillsByBoss'>) => {
  const unlock = dungeon.unlock ?? { type: 'always' as const }
  if (unlock.type === 'always') return true
  if (unlock.type === 'boss-kill') return (progress.bossKillsByBoss[unlock.bossId] ?? 0) >= 1
  return unlock.bossIds.every((bossId) => (progress.bossKillsByBoss[bossId] ?? 0) >= 1)
}

export const isDungeonCompleted = (dungeonId: DungeonId, progress: GameState['progress']) => (progress.bossKillsByBoss[DUNGEONS[dungeonId].boss] ?? 0) >= 1

export const isTutorialCompleted = (progress: GameState['progress']) => {
  const tutorialDungeon = DUNGEON_ORDER.map((id) => DUNGEONS[id]).find((dungeon) => dungeon.completesTutorial)
  return tutorialDungeon ? isDungeonCompleted(tutorialDungeon.id, progress) : false
}

export const getDungeonUnlockRequirement = (dungeon: DungeonDefinition) => {
  const unlock = dungeon.unlock ?? { type: 'always' as const }
  if (unlock.type === 'always') return null
  if (unlock.type === 'boss-kill') return `Defeat ${MONSTERS[unlock.bossId]?.name ?? unlock.bossId}`
  const names = unlock.bossIds.map((bossId) => MONSTERS[bossId]?.name ?? bossId)
  return `Defeat ${names.slice(0, -1).join(', ')}${names.length > 1 ? `, and ${names[names.length - 1]}` : names[0]}`
}

export const validateDungeonDefinitions = (content: Record<DungeonId, DungeonDefinition> = DUNGEONS, order: readonly DungeonId[] = DUNGEON_ORDER) => {
  const errors: string[] = []
  order.forEach((dungeonId) => {
    const dungeon = content[dungeonId]
    if (!dungeon) { errors.push(`${dungeonId}: missing dungeon definition`); return }
    if (!Number.isInteger(dungeon.threatRequired) || dungeon.threatRequired <= 0) errors.push(`${dungeon.id}: threatRequired must be a positive integer`)
    if (!Number.isFinite(dungeon.encounterDelayMs) || dungeon.encounterDelayMs <= 0) errors.push(`${dungeon.id}: encounterDelayMs must be positive`)
    dungeon.monsterPool.forEach((monsterId) => { if (!MONSTERS[monsterId]) errors.push(`${dungeon.id}: unknown monster ${monsterId}`); else if (isBossMonster(MONSTERS[monsterId])) errors.push(`${dungeon.id}: normal pool may not contain boss ${monsterId}`) })
    if (dungeon.encounterSequence) {
      if (dungeon.encounterSequence.length === 0) errors.push(`${dungeon.id}: encounterSequence must not be empty`)
      dungeon.encounterSequence.forEach((monsterId) => {
        if (!MONSTERS[monsterId]) errors.push(`${dungeon.id}: sequence references unknown monster ${monsterId}`)
        else if (isBossMonster(MONSTERS[monsterId])) errors.push(`${dungeon.id}: sequence may not contain boss ${monsterId}`)
        if (!dungeon.monsterPool.includes(monsterId)) errors.push(`${dungeon.id}: sequence monster ${monsterId} is not in monsterPool`)
      })
      if (dungeon.encounterSequence.includes(dungeon.boss)) errors.push(`${dungeon.id}: boss must not be duplicated in encounterSequence`)
    }
    if (!MONSTERS[dungeon.boss]) errors.push(`${dungeon.id}: unknown boss ${dungeon.boss}`)
    if (dungeon.monsterPool.includes(dungeon.boss)) errors.push(`${dungeon.id}: boss must not be in the normal monster pool`)
    if (dungeon.unlock?.type === 'boss-kill' && (!MONSTERS[dungeon.unlock.bossId] || !isBossMonster(MONSTERS[dungeon.unlock.bossId]))) errors.push(`${dungeon.id}: unlock boss must be a known boss monster`)
    if (dungeon.unlock?.type === 'all-boss-kills') dungeon.unlock.bossIds.forEach((bossId) => { if (!MONSTERS[bossId] || !isBossMonster(MONSTERS[bossId])) errors.push(`${dungeon.id}: unlock boss must be a known boss monster: ${bossId}`) })
  })
  const extraIds = Object.keys(content).filter((id) => !order.includes(id as DungeonId))
  extraIds.forEach((id) => errors.push(`${id}: dungeon is missing from DUNGEON_ORDER`))
  if (errors.length && import.meta.env.DEV) console.error(`[dungeons] ${errors.join('; ')}`)
  return errors
}

export const chooseMonster = (pool: MonsterId[], rng: () => number = () => 0) => pool[Math.floor(Math.max(0, Math.min(0.999999, rng())) * pool.length)]
