import { MONSTERS, isBossMonster } from '../../monsters'
import { ABANDONED_CATACOMBS_DUNGEON, HOWLING_DEN_DUNGEON, HUNTERS_GROUND_DUNGEON, WHISPERING_WOODS_DUNGEON, STONEWAKE_HOLLOW_DUNGEON, GALECREST_HEIGHTS_DUNGEON, TIDEGLASS_CAVERNS_DUNGEON, EMBERFALL_BASIN_DUNGEON } from './first-frontier'
import { REGIONAL_DUNGEONS } from './regions'
import type { CombatLocationId, GameState, MonsterId } from '../../../types'

export type DungeonUnlockCondition =
  | { type: 'always' }
  | { type: 'boss-kill'; bossId: MonsterId }
  | { type: 'all-boss-kills'; bossIds: MonsterId[] }

interface DungeonBase {
  id: CombatLocationId
  name: string
  monsterPool: MonsterId[]
  encounterDelayMs: number
  encounterSequence?: MonsterId[]
  unlock?: DungeonUnlockCondition
  completesTutorial?: boolean
  ui?: { description: string }
}
export interface BossDungeonDefinition extends DungeonBase { boss: MonsterId; threatRequired: number }
export interface BosslessDungeonDefinition extends DungeonBase { boss: null; threatRequired: null }
export type DungeonDefinition = BossDungeonDefinition | BosslessDungeonDefinition

export const hasBossEncounter = (dungeon: DungeonDefinition): dungeon is BossDungeonDefinition => dungeon.boss !== null && dungeon.threatRequired !== null

const FIRST_FRONTIER_DUNGEONS = [WHISPERING_WOODS_DUNGEON, HOWLING_DEN_DUNGEON, HUNTERS_GROUND_DUNGEON, ABANDONED_CATACOMBS_DUNGEON, STONEWAKE_HOLLOW_DUNGEON, GALECREST_HEIGHTS_DUNGEON, TIDEGLASS_CAVERNS_DUNGEON, EMBERFALL_BASIN_DUNGEON] as const
export const DUNGEON_ORDER: CombatLocationId[] = [...FIRST_FRONTIER_DUNGEONS, ...REGIONAL_DUNGEONS].map((dungeon) => dungeon.id)
type DungeonRegistryEntry = (typeof FIRST_FRONTIER_DUNGEONS)[number] | (typeof REGIONAL_DUNGEONS)[number]
type DungeonRegistry = { [Dungeon in DungeonRegistryEntry as Dungeon['id']]: Dungeon & DungeonDefinition }
export const DUNGEONS = Object.fromEntries([...FIRST_FRONTIER_DUNGEONS, ...REGIONAL_DUNGEONS].map((dungeon) => [dungeon.id, dungeon])) as DungeonRegistry

export const isDungeonUnlocked = (dungeon: DungeonDefinition, progress: Pick<GameState['progress'], 'bossKillsByBoss'>) => {
  const unlock = dungeon.unlock ?? { type: 'always' as const }
  if (unlock.type === 'always') return true
  if (unlock.type === 'boss-kill') return (progress.bossKillsByBoss[unlock.bossId] ?? 0) >= 1
  return unlock.bossIds.every((bossId) => (progress.bossKillsByBoss[bossId] ?? 0) >= 1)
}

export const isDungeonCompleted = (locationId: CombatLocationId, progress: GameState['progress']) => {
  const dungeon = DUNGEONS[locationId]
  return hasBossEncounter(dungeon) && (progress.bossKillsByBoss[dungeon.boss] ?? 0) >= 1
}

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

export const validateDungeonDefinitions = (content: Record<CombatLocationId, DungeonDefinition> = DUNGEONS, order: readonly CombatLocationId[] = DUNGEON_ORDER) => {
  const errors: string[] = []
  order.forEach((locationId) => {
    const dungeon = content[locationId]
    if (!dungeon) { errors.push(`${locationId}: missing dungeon definition`); return }
    if (hasBossEncounter(dungeon)) {
      if (!Number.isInteger(dungeon.threatRequired) || (dungeon.threatRequired <= 0 && !dungeon.encounterSequence)) errors.push(`${dungeon.id}: threatRequired must be a positive integer unless the Dungeon uses a fixed sequence`)
      if (!MONSTERS[dungeon.boss]) errors.push(`${dungeon.id}: unknown boss ${dungeon.boss}`)
      if (dungeon.monsterPool.includes(dungeon.boss)) errors.push(`${dungeon.id}: boss must not be in the normal monster pool`)
    } else {
      const bossShape = dungeon as DungeonDefinition & { boss: MonsterId | null; threatRequired: number | null }
      if ((bossShape.boss === null) !== (bossShape.threatRequired === null)) errors.push(`${dungeon.id}: boss and threatRequired must both be authored or both be null`)
    }
    if (!Number.isFinite(dungeon.encounterDelayMs) || dungeon.encounterDelayMs <= 0) errors.push(`${dungeon.id}: encounterDelayMs must be positive`)
    dungeon.monsterPool.forEach((monsterId) => { if (!MONSTERS[monsterId]) errors.push(`${dungeon.id}: unknown monster ${monsterId}`); else if (isBossMonster(MONSTERS[monsterId])) errors.push(`${dungeon.id}: normal pool may not contain boss ${monsterId}`) })
    if (dungeon.encounterSequence) {
      if (dungeon.encounterSequence.length === 0) errors.push(`${dungeon.id}: encounterSequence must not be empty`)
      dungeon.encounterSequence.forEach((monsterId) => {
        if (!MONSTERS[monsterId]) errors.push(`${dungeon.id}: sequence references unknown monster ${monsterId}`)
        else if (isBossMonster(MONSTERS[monsterId])) errors.push(`${dungeon.id}: sequence may not contain boss ${monsterId}`)
        if (!dungeon.monsterPool.includes(monsterId)) errors.push(`${dungeon.id}: sequence monster ${monsterId} is not in monsterPool`)
      })
      if (dungeon.boss && dungeon.encounterSequence.includes(dungeon.boss)) errors.push(`${dungeon.id}: boss must not be duplicated in encounterSequence`)
    }
    if (dungeon.unlock?.type === 'boss-kill' && (!MONSTERS[dungeon.unlock.bossId] || !isBossMonster(MONSTERS[dungeon.unlock.bossId]))) errors.push(`${dungeon.id}: unlock boss must be a known boss monster`)
    if (dungeon.unlock?.type === 'all-boss-kills') dungeon.unlock.bossIds.forEach((bossId) => { if (!MONSTERS[bossId] || !isBossMonster(MONSTERS[bossId])) errors.push(`${dungeon.id}: unlock boss must be a known boss monster: ${bossId}`) })
  })
  const extraIds = Object.keys(content).filter((id) => !order.includes(id as CombatLocationId))
  extraIds.forEach((id) => errors.push(`${id}: dungeon is missing from DUNGEON_ORDER`))
  if (errors.length && import.meta.env.DEV) console.error(`[dungeons] ${errors.join('; ')}`)
  return errors
}

export const chooseMonster = (pool: MonsterId[], rng: () => number = () => 0) => pool[Math.floor(Math.max(0, Math.min(0.999999, rng())) * pool.length)]
