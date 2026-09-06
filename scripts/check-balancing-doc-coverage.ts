import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildBalancingDocuments } from './balancing/buildBalancingDocuments'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const docsRoot = resolve(root, 'Docs', 'Balancing')
const balancing = buildBalancingDocuments()
const read = (path: string) => readFileSync(resolve(docsRoot, path), 'utf8')
const failures: string[] = []
const expected = new Set([...balancing.docs.keys(), '_System/README.md', '_System/balance-manifest.json'])
const superseded = ['Combat/Combat_Formulas.md', 'Combat/Damage_Types_And_Resistances.md', 'Combat/Global_Combat_Values.md', 'Combat/Player_Base_Stats.md', 'Combat/Status_Effects.md', 'Combat/Traits_And_Special_Attacks.md', 'Dungeons/Dungeon_Progression.md', 'Enemies/Enemy_Index.md', 'Enemies/Whispering_Woods.md', 'Enemies/Howling_Den.md', 'Enemies/Abandoned_Catacombs.md', 'Loot/Monster_Drops.md', 'Loot/Boss_Drops.md', 'Items/Item_Index.md', 'Items/Materials.md', 'Items/Boss_Relics.md', 'Items/Equipment_Whispering_Woods.md', 'Items/Equipment_Howling_Den.md', 'Items/Equipment_Abandoned_Catacombs.md', 'Artificing/Recipes.md', 'Artificing/Crafting_Economy.md', 'Transmutation/Recipes.md', 'Transmutation/Crafting_Economy.md', 'Magic/Fire_Spells.md', 'Magic/Water_Spells.md', 'Magic/Earth_Spells.md', 'Magic/Air_Spells.md', 'Magic/Magic_Schools.md', 'Magic/Spell_Index.md', 'Magic/AutoCast_And_Focus.md', 'Progression/Progression_Overview.md', 'Progression/Unlock_Progression.md', 'Progression/Guild_Progression.md', 'Progression/Magic_School_XP.md', 'Progression/Research_XP.md', 'Economy/Item_Values.md', 'Economy/Current_Progression_Timings.md']
for (const path of expected) if (!existsSync(resolve(docsRoot, path))) failures.push('missing expected document: ' + path)
for (const path of superseded) if (existsSync(resolve(docsRoot, path))) failures.push('superseded managed document still exists: ' + path)

const validateTables = (path: string, source: string) => {
  const lines = source.split(/\r?\n/)
  for (let i = 0; i < lines.length - 1; i++) {
    if (!/^\|.*\|$/.test(lines[i]) || !/^\|(?:\s*:?-{3,}:?\s*\|)+$/.test(lines[i + 1])) continue
    const width = (line: string) => line.slice(1, -1).split('|').length
    const columns = width(lines[i])
    if (columns > 10) failures.push(`${path}: table has ${columns} columns (maximum 10)`)
    if (width(lines[i + 1]) !== columns) failures.push(`${path}: table separator width does not match header`)
    let row = i + 2
    while (row < lines.length && /^\|.*\|$/.test(lines[row])) {
      if (width(lines[row]) !== columns) failures.push(`${path}: table row ${row + 1} width does not match header`)
      row++
    }
    i = row - 1
  }
}

for (const [path, expectedText] of balancing.docs) {
  try {
    const actual = read(path)
    validateTables(path, actual)
    if (actual !== expectedText) failures.push(`${path}: differs from runtime-generated canonical document`)
    if (/\b(true|false)\b|<br>|"event":|"target":|"magnitude":|sourceKinds|BALANCE\.|\[NOT DEFINED IN RUNTIME\]/.test(actual)) failures.push(`${path}: contains raw implementation/boolean artifact`)
  } catch (error) { failures.push(`${path}: unable to read (${String(error)})`) }
}

for (const [domain, registry] of Object.entries(balancing.registries)) {
  try {
    const text = registry.documents.map(read).join('\n')
    const absent = registry.ids.filter((id) => !text.includes(id))
    absent.forEach((id) => failures.push(`${domain}: stable ID is missing: ${id}`))
    console.log(`${domain}: ${registry.ids.length - absent.length} / ${registry.ids.length} documented`)
  } catch (error) { failures.push(`${domain}: unable to read canonical page (${String(error)})`) }
}

try {
  const manifest = JSON.parse(read('_System/balance-manifest.json')) as { schemaVersion?: number; managedPaths?: string[]; mirrors?: unknown; registries?: typeof balancing.registries; invariants?: typeof balancing.invariants }
  if (manifest.schemaVersion !== 2) failures.push('manifest: schemaVersion must be 2')
  if (JSON.stringify(manifest.managedPaths) !== JSON.stringify([...expected].sort())) failures.push('manifest: managedPaths are stale')
  if (JSON.stringify(manifest.mirrors ?? {}) !== '{}') failures.push('manifest: numeric mirrors are not allowed')
  for (const [domain, registry] of Object.entries(balancing.registries)) if (JSON.stringify(manifest.registries?.[domain]) !== JSON.stringify(registry)) failures.push('manifest: registry metadata is stale for ' + domain)
  for (const [key, value] of Object.entries(balancing.invariants)) if (manifest.invariants?.[key] !== value) failures.push('manifest: invariant metadata is stale for ' + key)
} catch (error) { failures.push('manifest: unable to read or parse (' + String(error) + ')') }

if (failures.length) { console.error('\nBalancing doc coverage failed:'); failures.forEach((failure) => console.error('- ' + failure)); process.exitCode = 1 } else console.log('Balancing doc coverage passed: canonical documents, table shapes, IDs, and manifest are synchronized.')
