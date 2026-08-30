import { CHANNELING_DISCOVERIES } from '../game/content/channeling/channelingDiscoveries'
import { ITEMS } from '../game/content/items/items'
import { isBossMonster, MONSTERS } from '../game/content/monsters'
import { SCHOOLS } from '../game/content/schools/schools'
import { SPELLS } from '../game/content/spells/spells'
import type { GameState, ItemId, MonsterId, SchoolId, SpellId } from '../game/types'

/**
 * Save-safety evidence only. These values describe permanent or cumulative
 * progression and intentionally exclude consumable resources.
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
  guildReputationLifetime: number
  permanentFlags: Record<string, boolean>
  discoveredItems: Record<ItemId, boolean>
  discoveredMonsters: Record<MonsterId, boolean>
  permanentFocusBonuses: Record<string, number>
  focusImprovementRank: number
  focusImprovementLevel: number
  channelingManaGenerated: number
  channelingSustainMs: number
}

const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
const booleanRecord = (keys: readonly string[], values: readonly string[]) => Object.fromEntries(keys.map((key) => [key, values.includes(key)])) as Record<string, boolean>
const guildRanks = { outsider: 0, initiate: 1, apprentice: 2 } as const

export const getProgressionEvidence = (state: Pick<GameState, 'schools' | 'progress'>): ProgressionEvidence => {
  const schoolIds = Object.keys(SCHOOLS) as SchoolId[]
  const monsterIds = Object.keys(MONSTERS) as MonsterId[]
  const spellIds = Object.keys(SPELLS) as SpellId[]
  const itemIds = Object.keys(ITEMS) as ItemId[]
  const discoveredItems = state.progress.discoveredItems ?? []
  const discoveredMonsters = state.progress.discoveredMonsters ?? []
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
    guildReputationLifetime: finite(state.progress.guildReputation),
    permanentFlags,
    discoveredItems: Object.fromEntries(itemIds.map((id) => [id, discoveredItems.includes(id)])) as Record<ItemId, boolean>,
    discoveredMonsters: Object.fromEntries(monsterIds.map((id) => [id, discoveredMonsters.includes(id)])) as Record<MonsterId, boolean>,
    permanentFocusBonuses: Object.fromEntries(Object.entries(state.progress.permanentFocusBonuses ?? {}).map(([id, value]) => [id, finite(value)])),
    focusImprovementRank: finite(state.progress.focusImprovement?.rank),
    focusImprovementLevel: finite(state.progress.focusImprovement?.level),
    channelingManaGenerated: finite(state.progress.channeling?.totalManaGenerated),
    channelingSustainMs: finite(state.progress.channeling?.fiveEchoSustainMs),
  }
}

const compareNumbers = (label: string, previous: number, candidate: number, reasons: string[]) => {
  if (candidate < previous) reasons.push(`${label} decreased (${previous} → ${candidate})`)
}

const compareNumberRecord = (label: string, previous: Record<string, number>, candidate: Record<string, number>, reasons: string[]) => {
  for (const key of new Set([...Object.keys(previous), ...Object.keys(candidate)])) compareNumbers(`${label}.${key}`, finite(previous[key]), finite(candidate[key]), reasons)
}

const compareBooleanRecord = (label: string, previous: Record<string, boolean>, candidate: Record<string, boolean>, reasons: string[]) => {
  for (const key of new Set([...Object.keys(previous), ...Object.keys(candidate)])) {
    if (previous[key] && !candidate[key]) reasons.push(`${label}.${key} was completed, but is now incomplete`)
  }
}

/** Detects an impossible permanent progression regression between two states. */
export const detectCatastrophicProgressRegression = (previous: GameState, candidate: GameState) => {
  const before = getProgressionEvidence(previous)
  const after = getProgressionEvidence(candidate)
  const reasons: string[] = []
  compareNumberRecord('schoolXp', before.schoolXp, after.schoolXp, reasons)
  compareNumberRecord('schoolLevels', before.schoolLevels, after.schoolLevels, reasons)
  compareNumberRecord('bossKills', before.bossKills, after.bossKills, reasons)
  compareNumberRecord('lifetimeKills', before.lifetimeKills, after.lifetimeKills, reasons)
  compareNumberRecord('spellRanks', before.spellRanks, after.spellRanks, reasons)
  compareNumbers('unlockedSpellCount', before.unlockedSpellCount, after.unlockedSpellCount, reasons)
  compareNumbers('completedDiscoveries', before.completedDiscoveries, after.completedDiscoveries, reasons)
  compareBooleanRecord('discoveryFlags', before.discoveryFlags, after.discoveryFlags, reasons)
  compareNumbers('levelCap', before.levelCap, after.levelCap, reasons)
  compareNumbers('guildRank', before.guildRank, after.guildRank, reasons)
  compareNumbers('guildReputationLifetime', before.guildReputationLifetime, after.guildReputationLifetime, reasons)
  compareBooleanRecord('permanentFlags', before.permanentFlags, after.permanentFlags, reasons)
  compareBooleanRecord('discoveredItems', before.discoveredItems, after.discoveredItems, reasons)
  compareBooleanRecord('discoveredMonsters', before.discoveredMonsters, after.discoveredMonsters, reasons)
  compareNumberRecord('permanentFocusBonuses', before.permanentFocusBonuses, after.permanentFocusBonuses, reasons)
  compareNumbers('focusImprovementRank', before.focusImprovementRank, after.focusImprovementRank, reasons)
  compareNumbers('focusImprovementLevel', before.focusImprovementLevel, after.focusImprovementLevel, reasons)
  compareNumbers('channelingManaGenerated', before.channelingManaGenerated, after.channelingManaGenerated, reasons)
  compareNumbers('channelingSustainMs', before.channelingSustainMs, after.channelingSustainMs, reasons)
  return { catastrophic: reasons.length > 0, reasons }
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
  guildReputationLifetime: number
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
  guildReputationLifetime: evidence.guildReputationLifetime,
})
