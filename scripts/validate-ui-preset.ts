import fs from 'node:fs'
import path from 'node:path'
import { validateUiPreset } from '../src/ui/layout-editor/uiEditorStorage'

const presetPath = path.resolve(process.cwd(), process.argv[2] ?? 'src/ui/presets/default-ui.json')

function readJsonString(source: string, start: number): [string, number] | null {
  let value = ''
  let escaped = false
  for (let index = start + 1; index < source.length; index += 1) {
    const character = source[index]
    if (escaped) { value += character; escaped = false; continue }
    if (character === '\\') { value += character; escaped = true; continue }
    if (character === '"') return [value, index]
    value += character
  }
  return null
}

function findDuplicateJsonKeys(source: string) {
  const objectKeys: Array<Set<string> | null> = []
  const duplicates: string[] = []
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    if (character === '"') {
      const parsed = readJsonString(source, index)
      if (!parsed) break
      const [key, end] = parsed
      let cursor = end + 1
      while (/\s/.test(source[cursor] ?? '')) cursor += 1
      const currentObject = objectKeys[objectKeys.length - 1]
      if (source[cursor] === ':' && currentObject) {
        if (currentObject.has(key)) duplicates.push(key)
        currentObject.add(key)
      }
      index = end
    } else if (character === '{') objectKeys.push(new Set<string>())
    else if (character === '[') objectKeys.push(null)
    else if (character === '}' || character === ']') objectKeys.pop()
  }
  return [...new Set(duplicates)]
}

try {
  const source = fs.readFileSync(presetPath, 'utf8')
  const duplicateKeys = findDuplicateJsonKeys(source)
  const value: unknown = JSON.parse(source)
  const report = validateUiPreset(value)
  for (const issue of report.issues) console.log(`${issue.severity.padEnd(7)} ${issue.path}: ${issue.message}`)
  if (duplicateKeys.length) console.error(`ERROR   duplicate config keys: ${duplicateKeys.join(', ')}`)
  console.log(`${report.valid && !duplicateKeys.length ? 'VALID' : 'INVALID'} ${presetPath} · ${report.validChanges} supported changes`)
  if (!report.valid || duplicateKeys.length) process.exitCode = 1
} catch (error) {
  console.error(`ERROR   ${presetPath}: ${error instanceof Error ? error.message : 'unable to read preset'}`)
  process.exitCode = 1
}
