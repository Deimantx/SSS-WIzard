import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildBalancingDocuments } from './balancing/buildBalancingDocuments'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const docsRoot = resolve(repositoryRoot, 'Docs', 'Balancing')
const balancing = buildBalancingDocuments()
const read = (relativePath: string) => readFileSync(resolve(docsRoot, relativePath), 'utf8')
const missing: string[] = []
const forbiddenArtifacts = ['<br>', '"event":', '"target":', '"magnitude":', 'sourceKinds', 'condition', 'runtime fraction', 'BALANCE.', '[NOT DEFINED IN RUNTIME]', '{}', '[]']

if (balancing.invariants.directEquipmentLoot !== 0) missing.push(`invariant: ${balancing.invariants.directEquipmentLoot} finished Equipment loot entries remain`)
if (balancing.invariants.equipmentRecipeCoverage !== balancing.invariants.equipment) missing.push(`invariant: Equipment recipe coverage is ${balancing.invariants.equipmentRecipeCoverage}/${balancing.invariants.equipment}`)
console.log('Recipes: ' + balancing.invariants.recipes)
console.log('Equipment recipe coverage: ' + balancing.invariants.equipmentRecipeCoverage + '/' + balancing.invariants.equipment)
console.log('Direct Equipment loot: ' + balancing.invariants.directEquipmentLoot)

for (const [domain, registry] of Object.entries(balancing.registries)) {
  try {
    const documentedText = registry.documents.map(read).join('\n')
    const absent = registry.ids.filter((id) => !documentedText.includes(id))
    absent.forEach((id) => missing.push(domain + ': stable ID is missing from its documented pages: ' + id))
    console.log(domain + ': ' + (registry.ids.length - absent.length) + ' / ' + registry.ids.length + ' documented')
  } catch (error) {
    missing.push(domain + ': unable to read one of its documented pages: ' + String(error))
  }
}

for (const relativePath of Object.keys(balancing.documentInfo).filter((path) => !path.startsWith('_System/'))) {
  const source = read(relativePath)
  forbiddenArtifacts.forEach((artifact) => {
    if (source.includes(artifact)) missing.push('format: forbidden artifact ' + artifact + ' found in ' + relativePath)
  })
  if (/\b(true|false)\b/.test(source)) missing.push('format: boolean literal found in ' + relativePath)
}

try {
  const manifest = JSON.parse(read('_System/balance-manifest.json')) as {
    registries?: Record<string, { count?: number; ids?: string[] }>
    invariants?: Record<string, number>
  }
  for (const [domain, registry] of Object.entries(balancing.registries)) {
    const entry = manifest.registries?.[domain]
    if (!entry || entry.count !== registry.count || JSON.stringify(entry.ids) !== JSON.stringify(registry.ids)) {
      missing.push('manifest: registry metadata is stale for ' + domain)
    }
  }
  for (const [key, value] of Object.entries(balancing.invariants)) {
    if (manifest.invariants?.[key] !== value) missing.push('manifest: invariant metadata is stale for ' + key)
  }
} catch (error) {
  missing.push('manifest: unable to read _System/balance-manifest.json: ' + String(error))
}

if (missing.length > 0) {
  console.error('\nBalancing doc coverage failed:')
  missing.forEach((message) => console.error('- ' + message))
  process.exitCode = 1
} else {
  console.log('Balancing doc coverage passed: every authored stable ID is represented and the manifest matches runtime registries.')
}
