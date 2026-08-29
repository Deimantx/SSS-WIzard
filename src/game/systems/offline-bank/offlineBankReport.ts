import { isBossMonster, MONSTERS } from '../../content/monsters'
import { ITEMS } from '../../content/items/items'
import type { ChannelingDiscoveryId, GameState, ItemId, MonsterId, RecipeId, SchoolId, SpellId } from '../../types'

export interface OfflineBankReport {
  durationMs: number
  bankBeforeMs: number
  bankAfterMs: number
  combat: { killsTotal: number; killsByMonster: Partial<Record<MonsterId, number>>; bossKills: Partial<Record<MonsterId, number>>; playerDeaths: number; loot: Partial<Record<ItemId, number>> }
  production: { transmutation: Partial<Record<ItemId, number>>; craftsByRecipe: Partial<Record<RecipeId, number>> }
  research: { researchedItems: Partial<Record<ItemId, number>>; xpBySchool: Partial<Record<SchoolId, number>>; levelBefore: Partial<Record<SchoolId, number>>; levelAfter: Partial<Record<SchoolId, number>>; stoppedAtCap?: boolean }
  consumption: { research: Partial<Record<ItemId, number>>; transmutation: Partial<Record<ItemId, number>> }
  netInventory: Partial<Record<ItemId, number>>
  progression: { spellsUnlocked: SpellId[]; discoveriesUnlocked: ChannelingDiscoveryId[]; guildUnlocked: boolean; guildRankBefore?: GameState['progress']['guildRank']; guildRankAfter?: GameState['progress']['guildRank']; levelCapBefore?: number; levelCapAfter?: number; notableEvents: string[] }
  endingState: { health: number; maxHealth: number; mana: number; maxMana: number }
}

export interface SimulationReportCollector {
  readonly report: OfflineBankReport
  recordKill: (monsterId: MonsterId) => void
  recordLoot: (itemId: ItemId, quantity: number) => void
  recordPlayerDeath: () => void
  recordTransmutation: (recipeId: RecipeId, output: ItemId, quantity: number, ingredients: { itemId: ItemId; quantity: number }[]) => void
  recordResearch: (itemId: ItemId, schoolId: SchoolId, xp: number) => void
  recordResearchStoppedAtCap: () => void
  recordDiscovery: (id: ChannelingDiscoveryId) => void
  recordNotable: (event: string) => void
  finalize: (state: GameState) => OfflineBankReport
}

const add = <K extends string>(record: Partial<Record<K, number>>, key: K, amount: number) => { if (!amount) return; record[key] = (record[key] ?? 0) + amount }
const cloneInventory = (state: GameState) => ({ ...state.inventory })

export function createOfflineBankReportCollector(state: GameState, durationMs: number, bankBeforeMs: number): SimulationReportCollector {
  const inventoryBefore = cloneInventory(state)
  const touchedItems = new Set<ItemId>()
  const progressionBefore = { spells: new Set(Object.keys(state.progress.spellRanks) as SpellId[]), discoveries: Object.entries(state.progress.channeling.discoveries).filter(([, value]) => value).map(([id]) => id as ChannelingDiscoveryId), guildUnlocked: state.progress.guildUnlocked, guildRank: state.progress.guildRank, levelCap: state.progress.magicLevelCap }
  const levelBefore = Object.fromEntries((Object.keys(state.schools) as SchoolId[]).map((id) => [id, state.schools[id].level])) as Partial<Record<SchoolId, number>>
  const report: OfflineBankReport = {
    durationMs, bankBeforeMs, bankAfterMs: bankBeforeMs,
    combat: { killsTotal: 0, killsByMonster: {}, bossKills: {}, playerDeaths: 0, loot: {} },
    production: { transmutation: {}, craftsByRecipe: {} },
    research: { researchedItems: {}, xpBySchool: {}, levelBefore, levelAfter: {}, stoppedAtCap: false },
    consumption: { research: {}, transmutation: {} }, netInventory: {},
    progression: { spellsUnlocked: [], discoveriesUnlocked: [], guildUnlocked: false, notableEvents: [] },
    endingState: { health: state.player.health, maxHealth: state.player.maxHealth, mana: state.player.mana, maxMana: state.player.maxMana },
  }
  const touch = (itemId: ItemId) => { touchedItems.add(itemId) }
  const recordNotable = (event: string) => { if (event && !report.progression.notableEvents.includes(event)) report.progression.notableEvents.push(event) }
  return {
    report,
    recordKill: (monsterId) => { report.combat.killsTotal += 1; add(report.combat.killsByMonster, monsterId, 1); if (isBossMonster(MONSTERS[monsterId])) add(report.combat.bossKills, monsterId, 1) },
    recordLoot: (itemId, quantity) => { touch(itemId); add(report.combat.loot, itemId, quantity) },
    recordPlayerDeath: () => { report.combat.playerDeaths += 1 },
    recordTransmutation: (recipeId, output, quantity, ingredients) => { touch(output); add(report.production.craftsByRecipe, recipeId, quantity); add(report.production.transmutation, output, quantity); ingredients.forEach((ingredient) => { touch(ingredient.itemId); add(report.consumption.transmutation, ingredient.itemId, ingredient.quantity) }) },
    recordResearch: (itemId, schoolId, xp) => { touch(itemId); add(report.research.researchedItems, itemId, 1); add(report.research.xpBySchool, schoolId, xp); add(report.consumption.research, itemId, 1) },
    recordResearchStoppedAtCap: () => { report.research.stoppedAtCap = true },
    recordDiscovery: (id) => { if (!report.progression.discoveriesUnlocked.includes(id)) report.progression.discoveriesUnlocked.push(id) },
    recordNotable,
    finalize: (current) => {
      report.bankAfterMs = Math.max(0, current.offlineBankMs)
      report.endingState = { health: current.player.health, maxHealth: current.player.maxHealth, mana: current.player.mana, maxMana: current.player.maxMana }
      ;(Object.keys(ITEMS) as ItemId[]).forEach((id) => { const delta = (current.inventory[id] ?? 0) - (inventoryBefore[id] ?? 0); if (delta || touchedItems.has(id)) report.netInventory[id] = delta })
      report.progression.spellsUnlocked = (Object.keys(current.progress.spellRanks) as SpellId[]).filter((id) => !progressionBefore.spells.has(id))
      report.progression.discoveriesUnlocked = (Object.entries(current.progress.channeling.discoveries).filter(([id, value]) => value && !progressionBefore.discoveries.includes(id as ChannelingDiscoveryId)).map(([id]) => id as ChannelingDiscoveryId))
      report.progression.guildUnlocked = !progressionBefore.guildUnlocked && current.progress.guildUnlocked
      if (progressionBefore.guildRank !== current.progress.guildRank) { report.progression.guildRankBefore = progressionBefore.guildRank; report.progression.guildRankAfter = current.progress.guildRank }
      if (progressionBefore.levelCap !== current.progress.magicLevelCap) { report.progression.levelCapBefore = progressionBefore.levelCap; report.progression.levelCapAfter = current.progress.magicLevelCap }
      if (report.progression.guildUnlocked) recordNotable('Guild unlocked')
      if (report.progression.levelCapAfter) recordNotable(`Magic School cap increased to ${report.progression.levelCapAfter}`)
      report.research.levelAfter = Object.fromEntries((Object.keys(current.schools) as SchoolId[]).map((id) => [id, current.schools[id].level])) as Partial<Record<SchoolId, number>>
      return report
    },
  }
}
