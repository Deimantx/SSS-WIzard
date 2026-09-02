import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ITEMS } from '../src/game/content/items/items'
import { EQUIPMENT_BY_DUNGEON } from '../src/game/content/equipment/equipmentSets'
import { DUNGEON_ORDER } from '../src/game/content/dungeons/dungeons'
import { MONSTER_IDS } from '../src/game/content/monsters'
import { RECIPES, RECIPE_ORDER } from '../src/game/content/recipes/recipes'
import { SPELLS } from '../src/game/content/spells/spells'
import { STATUS_ORDER } from '../src/game/content/statuses/statuses'
import { TRAIT_DEFINITIONS } from '../src/game/content/traits/traits'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const docsRoot = resolve(repositoryRoot, 'Docs', 'Balancing')
const escaped = (id: string) => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const firstColumn = (id: string) => new RegExp(`^\\|\\s*${escaped(id)}\\s*\\|`, 'm')
const read = (relativePath: string) => readFileSync(resolve(docsRoot, relativePath), 'utf8')
const idsIn = (relativePath: string, ids: readonly string[]) => {
  const source = read(relativePath)
  return ids.filter((id) => !firstColumn(id).test(source))
}
const equipmentIds = Object.values(EQUIPMENT_BY_DUNGEON).flat()
const checks: Array<[string, string, readonly string[]]> = [
  ['Items', 'Items/Item_Index.md', Object.keys(ITEMS)],
  ['Equipment', 'Items/Equipment_Whispering_Woods.md', EQUIPMENT_BY_DUNGEON['whispering-woods']],
  ['Equipment', 'Items/Equipment_Howling_Den.md', EQUIPMENT_BY_DUNGEON['howling-den']],
  ['Equipment', 'Items/Equipment_Abandoned_Catacombs.md', EQUIPMENT_BY_DUNGEON['abandoned-catacombs']],
  ['Boss relics', 'Items/Boss_Relics.md', ['heartseed-necklace', 'greatbear-heartstone', 'edrins-signet']],
  ['Monsters', 'Enemies/Enemy_Index.md', MONSTER_IDS],
  ['Recipes', 'Transmutation/Recipes.md', RECIPE_ORDER],
  ['Spells', 'Magic/Spell_Index.md', Object.keys(SPELLS)],
  ['Statuses', 'Combat/Status_Effects.md', STATUS_ORDER],
  ['Traits', 'Combat/Traits_And_Special_Attacks.md', Object.keys(TRAIT_DEFINITIONS)],
  ['Dungeons', 'Dungeons/Dungeon_Progression.md', DUNGEON_ORDER],
]
const missing: string[] = []
for (const [domain, path, ids] of checks) {
  try {
    const absent = idsIn(path, ids)
    absent.forEach((id) => missing.push(`${domain}: ${path} is missing first-column ID ${id}`))
    console.log(`${domain}: ${ids.length - absent.length} / ${ids.length} documented in ${path}`)
  } catch (error) {
    missing.push(`${domain}: unable to read ${path}: ${String(error)}`)
  }
}
if (equipmentIds.length !== new Set(equipmentIds).size) missing.push('Equipment: duplicate ID across authored equipment sets')
if (missing.length > 0) {
  console.error('\nBalancing doc coverage failed:')
  missing.forEach((message) => console.error(`- ${message}`))
  process.exitCode = 1
} else {
  console.log('Balancing doc coverage passed: every checked stable ID is present in a first column.')
}
