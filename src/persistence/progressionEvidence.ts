import { CHANNELING_DISCOVERIES } from '../game/content/channeling/channelingDiscoveries'
import { ITEMS } from '../game/content/items/items'
import { isBossMonster, MONSTERS } from '../game/content/monsters'
import { SCHOOLS } from '../game/content/schools/schools'
import { SPELLS } from '../game/content/spells/spells'
import { getPortalShardDefinitions } from '../game/content/darkPortal/portalShards'
import type { GameState, ItemId, MonsterId, SchoolId, SpellId } from '../game/types'

/**
 * Save-safety evidence only. These values describe permanent or cumulative
 * progression and intentionally exclude consumable resources and temporary
 * runtime streaks.
 */
export interface ProgressionEvidence {
  schoolXp: Record<SchoolId, number>
  schoolLevels: Record<SchoolId, number>
  bossKills: Record<MonsterId, number>
  lifetimeKills: Record<MonsterId, number>
  spellRanks: Record<SpellId, number>
  unlockedSpellCount: number
  completedDiscoveries: number
  discoveryFlags: Record<string, boolean>
  levelCap: number
  guildRank: number
  permanentFlags: Record<string, boolean>
  discoveredItems: Record<ItemId, boolean>
  discoveredMonsters: Record<MonsterId, boolean>
  permanentManaBonuses: Record<string, number>
  channelingManaGenerated: number
  recoveredPortalShards: Record<string, boolean>
}

const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
const booleanRecord = (keys: readonly string[], values: readonly string[]) => Object.fromEntries(keys.map((key) => [key, values.includes(key)])) as Record<string, boolean>
const guildRanks: Record<GameState['progress']['guildRank'], number> = { outsider: 0, initiate: 1, apprentice: 2, adept: 3, magister: 4, 'circle-master': 5 }

export const getProgressionEvidence = (state: Pick<GameState, 'schools' | 'progress' | 'darkPortal'>): ProgressionEvidence => {
  const schoolIds = Object.keys(SCHOOLS) as SchoolId[]
  const monsterIds = Object.keys(MONSTERS) as MonsterId[]
  const spellIds = Object.keys(SPELLS) as SpellId[]
  const itemIds = Object.keys(ITEMS) as ItemId[]
  const discoveredItems = state.progress.discoveredItems ?? []
  const discoveredMonsters = state.progress.discoveredMonsters ?? []
  const recoveredPortalShards = Object.fromEntries(getPortalShardDefinitions().map(({ id }) => [id, Boolean(state.darkPortal?.recoveredShards?.includes(id))]))
  const discoveryFlags = Object.fromEntries(CHANNELING_DISCOVERIES.map(({ id }) => [id, Boolean(state.progress.channeling?.discoveries?.[id])]))
  const permanentFlags = {
    firstBossKill: Boolean(state.progress.firstBossKill),
    firstMainBossKill: Boolean(state.progress.firstMainBossKill),
    guildUnlocked: Boolean(state.progress.guildUnlocked),
    emberStaffUnlocked: Boolean(state.progress.emberStaffUnlocked),
    forestHeartUnlocked: Boolean(state.progress.forestHeartUnlocked),
    autoHuntBossUnlocked: Boolean(state.progress.autoHuntBossUnlocked),
    ...booleanRecord(Object.keys(state.progress.autoHuntBossByDungeon ?? {}), Object.entries(state.progress.autoHuntBossByDungeon ?? {}).filter(([, unlocked]) => unlocked).map(([id]) => id)),
  }
  return {
    schoolXp: Object.fromEntries(schoolIds.map((id) => [id, finite(state.schools[id]?.xp)])) as Record<SchoolId, number>,
    schoolLevels: Object.fromEntries(schoolIds.map((id) => [id, finite(state.schools[id]?.level)])) as Record<SchoolId, number>,
    bossKills: Object.fromEntries(monsterIds.filter((id) => isBossMonster(MONSTERS[id])).map((id) => [id, finite(state.progress.bossKillsByBoss?.[id])])) as Record<MonsterId, number>,
    lifetimeKills: Object.fromEntries(monsterIds.map((id) => [id, finite(state.progress.lifetimeKillsByMonster?.[id])])) as Record<MonsterId, number>,
    spellRanks: Object.fromEntries(spellIds.map((id) => [id, finite(state.progress.spellRanks?.[id])])) as Record<SpellId, number>,
    unlockedSpellCount: spellIds.filter((id) => finite(state.progress.spellRanks?.[id]) > 0).length,
    completedDiscoveries: Object.values(discoveryFlags).filter(Boolean).length,
    discoveryFlags,
    levelCap: finite(state.progress.magicLevelCap),
    guildRank: guildRanks[state.progress.guildRank] ?? 0,
    permanentFlags,
    discoveredItems: Object.fromEntries(itemIds.map((id) => [id, discoveredItems.includes(id)])) as Record<ItemId, boolean>,
    discoveredMonsters: Object.fromEntries(monsterIds.map((id) => [id, discoveredMonsters.includes(id)])) as Record<MonsterId, boolean>,
    permanentManaBonuses: Object.fromEntries(Object.entries(state.progress.permanentManaBonuses ?? {}).map(([id, value]) => [id, finite(value)])),
    channelingManaGenerated: finite(state.progress.channeling?.totalManaGenerated),
    recoveredPortalShards,
  }
}

export interface ProgressionRegressionDetail {
  field: string
  key?: string
  previous: number | boolean
  candidate: number | boolean
}

export interface ProgressionRegressionResult {
  catastrophic: boolean
  details: ProgressionRegressionDetail[]
  /** Readable compatibility output retained for existing save diagnostics. */
  reasons: string[]
}

const compareNumbers = (field: string, previous: number, candidate: number, details: ProgressionRegressionDetail[], reasons: string[], key?: string) => {
  if (candidate < previous) {
    details.push({ field, ...(key ? { key } : {}), previous, candidate })
    reasons.push(`${key ? `${field}.${key}` : field} decreased (${previous} \u2192 ${candidate})`)
  }
}

const compareNumberRecord = (field: string, previous: Record<string, number>, candidate: Record<string, number>, details: ProgressionRegressionDetail[], reasons: string[]) => {
  for (const key of new Set([...Object.keys(previous), ...Object.keys(candidate)])) compareNumbers(field, finite(previous[key]), finite(candidate[key]), details, reasons, key)
}

const compareBooleanRecord = (field: string, previous: Record<string, boolean>, candidate: Record<string, boolean>, details: ProgressionRegressionDetail[], reasons: string[]) => {
  for (const key of new Set([...Object.keys(previous), ...Object.keys(candidate)])) {
    if (previous[key] && !candidate[key]) {
      details.push({ field, key, previous: true, candidate: false })
      reasons.push(`${field}.${key} was completed, but is now incomplete`)
    }
  }
}

/** Detects an impossible permanent progression regression between two states. */
export const detectCatastrophicProgressRegression = (previous: GameState, candidate: GameState): ProgressionRegressionResult => {
  const before = getProgressionEvidence(previous)
  const after = getProgressionEvidence(candidate)
  const details: ProgressionRegressionDetail[] = []
  const reasons: string[] = []
  compareNumberRecord('schoolXp', before.schoolXp, after.schoolXp, details, reasons)
  compareNumberRecord('schoolLevels', before.schoolLevels, after.schoolLevels, details, reasons)
  compareNumberRecord('bossKills', before.bossKills, after.bossKills, details, reasons)
  compareNumberRecord('lifetimeKills', before.lifetimeKills, after.lifetimeKills, details, reasons)
  compareNumberRecord('spellRanks', before.spellRanks, after.spellRanks, details, reasons)
  compareNumbers('unlockedSpellCount', before.unlockedSpellCount, after.unlockedSpellCount, details, reasons)
  compareNumbers('completedDiscoveries', before.completedDiscoveries, after.completedDiscoveries, details, reasons)
  compareBooleanRecord('discoveryFlags', before.discoveryFlags, after.discoveryFlags, details, reasons)
  compareNumbers('levelCap', before.levelCap, after.levelCap, details, reasons)
  compareNumbers('guildRank', before.guildRank, after.guildRank, details, reasons)
  compareBooleanRecord('permanentFlags', before.permanentFlags, after.permanentFlags, details, reasons)
  compareBooleanRecord('discoveredItems', before.discoveredItems, after.discoveredItems, details, reasons)
  compareBooleanRecord('discoveredMonsters', before.discoveredMonsters, after.discoveredMonsters, details, reasons)
  compareBooleanRecord('recoveredPortalShards', before.recoveredPortalShards, after.recoveredPortalShards, details, reasons)
  compareNumberRecord('permanentManaBonuses', before.permanentManaBonuses, after.permanentManaBonuses, details, reasons)
  compareNumbers('channelingManaGenerated', before.channelingManaGenerated, after.channelingManaGenerated, details, reasons)
  return { catastrophic: details.length > 0, details, reasons }
}

export interface ProgressionEvidenceSummary {
  schoolXp: number
  schoolLevels: number
  bossKills: number
  lifetimeKills: number
  spellRanks: number
  unlockedSpellCount: number
  completedDiscoveries: number
  levelCap: number
  guildRank: number
}

export const summarizeProgressionEvidence = (evidence: ProgressionEvidence): ProgressionEvidenceSummary => ({
  schoolXp: Object.values(evidence.schoolXp).reduce((sum, value) => sum + value, 0),
  schoolLevels: Object.values(evidence.schoolLevels).reduce((sum, value) => sum + value, 0),
  bossKills: Object.values(evidence.bossKills).reduce((sum, value) => sum + value, 0),
  lifetimeKills: Object.values(evidence.lifetimeKills).reduce((sum, value) => sum + value, 0),
  spellRanks: Object.values(evidence.spellRanks).reduce((sum, value) => sum + value, 0),
  unlockedSpellCount: evidence.unlockedSpellCount,
  completedDiscoveries: evidence.completedDiscoveries,
  levelCap: evidence.levelCap,
  guildRank: evidence.guildRank,
})
