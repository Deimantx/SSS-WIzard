import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildBalancingDocuments } from './balancing/buildBalancingDocuments'
import { cleanDocument } from './balancing/markdown'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '..')
const docsRoot = resolve(repositoryRoot, 'Docs', 'Balancing')
const force = process.argv.includes('--force')
const snapshotCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).trim()
const statusText = execFileSync('git', ['status', '--porcelain'], { cwd: repositoryRoot, encoding: 'utf8' }).trim()
const balancing = buildBalancingDocuments()

const systemDocs = new Map<string, string>([
  ['_System/README.md', cleanDocument([
    '# Balancing system metadata',
    '',
    'This folder contains technical provenance for the human-readable balancing workbook.',
    '',
    '- TypeScript content and systems are the executable source of truth.',
    '- Markdown is a manual review surface; the game does not parse it.',
    '- The manifest records the export snapshot, authored IDs, document paths, runtime source mappings, and registry counts.',
    '- Normal content pages intentionally omit raw serialized objects and implementation-only field names.',
    '- Run the coverage command after exporting to verify that every authored content ID remains represented.',
    '',
    'The human pages are protected by default. Use the export command without --force to create missing files only. Use --force when intentionally regenerating a snapshot and accept that it replaces generated pages.',
  ].join(String.fromCharCode(10)))],
  ['_System/balance-manifest.json', ''],
])

const manifest = {
  schemaVersion: 1,
  snapshot: {
    commit: snapshotCommit,
    workingTreeDirty: statusText.length > 0,
    generatedAtUtc: new Date().toISOString(),
  },
  runtimePolicy: {
    sourceOfTruth: 'TypeScript runtime content and systems',
    markdownIsRuntimeInput: false,
    exporterMode: 'manual',
  },
  registries: balancing.registries,
  documents: balancing.documentInfo,
}
systemDocs.set('_System/balance-manifest.json', JSON.stringify(manifest, null, 2) + String.fromCharCode(10))

const outputs = new Map([...balancing.docs.entries(), ...systemDocs.entries()])
const ensureSafeToWrite = () => {
  const existing = [...outputs.keys()]
    .map((relativePath) => resolve(docsRoot, relativePath))
    .filter(existsSync)
  if (existing.length > 0 && !force) {
    throw new Error('Balancing docs already exist. Refusing to overwrite without --force: ' + existing.join(', '))
  }
}

ensureSafeToWrite()
for (const [relativePath, contents] of outputs) {
  const target = resolve(docsRoot, relativePath)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, contents, 'utf8')
}

console.log('Exported ' + balancing.docs.size + ' human balancing documents and ' + systemDocs.size + ' technical metadata files from runtime HEAD ' + snapshotCommit + (statusText.length > 0 ? ' (working tree dirty).' : '.'))
