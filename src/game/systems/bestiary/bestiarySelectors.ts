import { COMBAT_LOCATIONS, hasBossEncounter } from '../../content/combat-locations/worldNavigation'
import { MONSTERS, isBossMonster, type MonsterDefinition } from '../../content/monsters'
import type { BestiaryCategory, CombatLocationId, GameState, MonsterId } from '../../types'
import { completionPercent } from '../archive/archiveSelectors'
import { getBestiaryActionSearchText, getBestiaryMechanicSearchText, getBestiaryResonanceSearchText, getBestiaryTraitSearchText } from '../../presentation/bestiary/bestiaryPresentation'
import { getSigilRegionSetPool } from '../../content/sigils/sigilDropPools'
import { SIGIL_SETS } from '../../content/sigils/sigilSets'
import { getEligibleHunterContractMembers } from '../hunters-order/huntersOrderRuntime'

export const BESTIARY_CATEGORIES = ['all', 'monster', 'boss'] as const
export type BestiaryCategoryFilter = typeof BESTIARY_CATEGORIES[number]
export type BestiaryMetadataFilter = 'all' | 'hunter-only' | 'boss' | 'discovered' | 'contract-targets' | `region:${string}` | `family:${string}` | `alignment:${string}` | `tier:${string}`
export interface BestiaryMetadataFilterOption { value: BestiaryMetadataFilter; label: string }
export const BESTIARY_CATEGORY_LABELS = { monster: 'Monsters', boss: 'Bosses' } as const satisfies Record<BestiaryCategory, string>
export const BESTIARY_ENTRY_CATEGORY_LABELS = { monster: 'Monster', boss: 'Boss' } as const satisfies Record<BestiaryCategory, string>

export const getBestiaryEntries = () => Object.values(MONSTERS)
export const getMonstersByBestiaryCategory = (category: BestiaryCategory) => getBestiaryEntries().filter((monster) => monster.bestiaryCategory === category)
export const getBestiaryEntriesByCategory = (category: BestiaryCategoryFilter) => category === 'all' ? getBestiaryEntries() : getMonstersByBestiaryCategory(category)

export const getBestiaryMetadataFilterOptions = (): BestiaryMetadataFilterOption[] => {
  const options: BestiaryMetadataFilterOption[] = [
    { value: 'all', label: 'All entries' },
    { value: 'hunter-only', label: 'Hunter-only' },
    { value: 'boss', label: 'Bosses' },
    { value: 'discovered', label: 'Discovered' },
    { value: 'contract-targets', label: 'Active Contract targets' },
  ]
  const hunterEntries = getBestiaryEntries().filter((monster) => monster.hunter)
  const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b))
  unique(getBestiaryEntries().flatMap((monster) => getMonsterLocationEntries(monster.id).map((location) => location.id))).forEach((id) => options.push({ value: `region:${id}`, label: `Region · ${COMBAT_LOCATIONS[id as keyof typeof COMBAT_LOCATIONS]?.name ?? id}` }))
  unique(hunterEntries.map((monster) => monster.hunter!.family)).forEach((family) => options.push({ value: `family:${family}`, label: `Family · ${family}` }))
  unique(hunterEntries.map((monster) => monster.hunter!.alignment)).forEach((alignment) => options.push({ value: `alignment:${alignment}`, label: `Alignment · ${alignment}` }))
  unique(hunterEntries.map((monster) => monster.hunter!.contractTier)).forEach((tier) => options.push({ value: `tier:${tier}`, label: `Contract Tier · ${tier}` }))
  return options
}

export const matchesBestiaryMetadataFilter = (monster: MonsterDefinition, progress: GameState['progress'], filter: BestiaryMetadataFilter) => {
  if (filter === 'all') return true
  if (filter === 'hunter-only') return Boolean(monster.hunter?.exclusive)
  if (filter === 'boss') return monster.bestiaryCategory === 'boss'
  if (filter === 'discovered') return progress.discoveredMonsters.includes(monster.id)
  if (filter === 'contract-targets') {
    const contract = progress.huntersOrder.activeContract
    const locationId = monster.hunter?.huntingGroundId as CombatLocationId | undefined
    return Boolean(contract && locationId && getEligibleHunterContractMembers({ progress }, contract, locationId).includes(monster.id))
  }
  const separator = filter.indexOf(':')
  const kind = filter.slice(0, separator)
  const value = filter.slice(separator + 1)
  if (kind === 'region') return getMonsterLocationEntries(monster.id).some((location) => location.id === value)
  if (kind === 'family') return monster.hunter?.family === value
  if (kind === 'alignment') return monster.hunter?.alignment === value
  if (kind === 'tier') return monster.hunter?.contractTier === value
  return false
}

export const getMonsterDefeatCount = (state: Pick<GameState, 'progress'>, monsterId: MonsterId) => {
  const monster = MONSTERS[monsterId]
  return isBossMonster(monster) ? state.progress.bossKillsByBoss[monsterId] ?? 0 : state.progress.lifetimeKillsByMonster[monsterId] ?? 0
}

export const formatDefeats = (count: number) => `${count.toLocaleString()} ${count === 1 ? 'defeat' : 'defeats'}`

export const getMonsterLocationEntries = (monsterId: MonsterId) => Object.values(COMBAT_LOCATIONS).filter((dungeon) => dungeon.monsterPool.includes(monsterId) || (hasBossEncounter(dungeon) && dungeon.boss === monsterId)).map((dungeon) => ({ id: dungeon.id, name: dungeon.name }))
export const getMonsterLocations = (monsterId: MonsterId) => getMonsterLocationEntries(monsterId).map((dungeon) => dungeon.name)

export const getBestiaryCompletion = (state: Pick<GameState, 'progress'>) => {
  const entries = getBestiaryEntries()
  const discovered = entries.filter((monster) => state.progress.discoveredMonsters.includes(monster.id)).length
  const categories = Object.fromEntries((['monster', 'boss'] as const).map((category) => {
    const members = getMonstersByBestiaryCategory(category)
    return [category, { discovered: members.filter((monster) => state.progress.discoveredMonsters.includes(monster.id)).length, total: members.length }]
  })) as Record<BestiaryCategory, { discovered: number; total: number }>
  const totalDefeats = entries.reduce((sum, monster) => sum + getMonsterDefeatCount(state, monster.id), 0)
  return { discovered, total: entries.length, percent: completionPercent(discovered, entries.length), categories, totalDefeats }
}

export const getBestiarySearchText = (monster: MonsterDefinition) => [monster.name, monster.subtitle, getBestiaryTraitSearchText(monster), getBestiaryActionSearchText(monster), getBestiaryMechanicSearchText(monster), getBestiaryResonanceSearchText(monster), ...getMonsterLocationEntries(monster.id).flatMap((location) => getSigilRegionSetPool(location.id).map((setId) => SIGIL_SETS[setId].name)), ...Object.values(monster.actionPatterns).flatMap((pattern) => [pattern.id, ...pattern.steps.map((step) => step.type === 'basic' ? 'Basic' : monster.actions[step.actionId]?.name ?? step.actionId)])].join(' ').toLowerCase()

export const formatDropChance = (chance: number) => chance >= 1 ? 'Guaranteed' : `${Number((Math.max(0, chance) * 100).toFixed(1))}%`
export const formatDropQuantity = (min: number, max: number) => min === max ? `×${min}` : `×${min}–${max}`
