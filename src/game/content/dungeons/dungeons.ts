import type { DungeonId, MonsterId } from '../../types'

export interface DungeonDefinition {
  id: DungeonId
  name: string
  monsterPool: MonsterId[]
  threatRequired: number
  boss: 'grove-sentinel'
  specialBosses?: MonsterId[]
  encounterDelayMs: number
}

export const DUNGEONS: Record<DungeonId, DungeonDefinition> = {
  'whispering-woods': { id: 'whispering-woods', name: 'Whispering Woods', monsterPool: ['forest-wisp', 'thornling', 'stone-root'], threatRequired: 20, boss: 'grove-sentinel', specialBosses: ['forest-heart'], encounterDelayMs: 5000 },
}

export const chooseMonster = (pool: MonsterId[], rng: () => number = Math.random) => pool[Math.floor(Math.max(0, Math.min(0.999999, rng())) * pool.length)]
