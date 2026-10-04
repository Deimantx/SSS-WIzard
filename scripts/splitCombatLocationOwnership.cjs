const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const sourceFiles = [
  'src/game/content/combat-locations/first-frontier/locations.ts',
  'src/game/content/combat-locations/elemental-scar/locations.ts',
  'src/game/content/combat-locations/shattered-meridian/locations.ts',
  'src/game/content/combat-locations/black-sigil-reach/locations.ts',
]
const buckets = { 'combat-zones': [], 'elite-zones': [], 'hunting-grounds': [], dungeons: [] }
const matchingBrace = (text, start) => {
  let depth = 0
  let quote = null
  let escaped = false
  for (let index = start; index < text.length; index += 1) {
    const char = text[index]
    if (quote) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) quote = null
      continue
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue }
    if (char === '{') depth += 1
    if (char === '}' && --depth === 0) return index
  }
  return -1
}
for (const relative of sourceFiles) {
  const text = fs.readFileSync(path.join(root, relative), 'utf8')
  const propertyPattern = /^ {4}("([^"]+)"|'([^']+)'|([\w-]+))\s*:\s*\{/gm
  for (const match of text.matchAll(propertyPattern)) {
    const key = match[2] ?? match[3] ?? match[4]
    const brace = text.indexOf('{', match.index + match[0].length - 1)
    const end = matchingBrace(text, brace)
    if (end < 0) throw new Error(`Unclosed location object in ${relative}: ${key}`)
    const object = text.slice(brace, end + 1)
    const category = object.match(/"type"\s*:\s*"([^"]+)"/)?.[1]
    if (!category) throw new Error(`Missing location type in ${relative}: ${key}`)
    const bucket = category === 'combat-zone' ? 'combat-zones' : category === 'elite-zone' ? 'elite-zones' : category === 'hunting-ground' ? 'hunting-grounds' : category === 'dungeon' ? 'dungeons' : null
    if (!bucket) throw new Error(`Unknown location type ${category}`)
    buckets[bucket].push(`${JSON.stringify(key)}: ${object},`)
  }
}

const declarations = {
  'combat-zones': 'combatZoneLocations',
  'elite-zones': 'eliteZoneLocations',
  'hunting-grounds': 'huntingGroundLocations',
  dungeons: 'dungeonLocations',
}
for (const [directory, entries] of Object.entries(buckets)) {
  const folder = path.join(root, `src/game/content/combat-locations/${directory}`)
  fs.mkdirSync(folder, { recursive: true })
  const output = `import type { CombatLocationDefinition, CombatLocationId } from '../worldNavigationTypes'\n\nexport const ${declarations[directory]} = {\n${entries.map((entry) => `  ${entry}`).join('\n')}\n} satisfies Partial<Record<CombatLocationId, CombatLocationDefinition>>\n`
  fs.writeFileSync(path.join(folder, 'locations.ts'), output)
}
