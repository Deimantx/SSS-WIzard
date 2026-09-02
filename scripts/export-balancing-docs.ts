import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BALANCE, SCHOOL_LEVEL_XP } from '../src/game/core/balance/balance'
import * as CombatBalance from '../src/game/core/balance/combatStats'
import * as CombatTiming from '../src/game/core/balance/combatTiming'
import { DUNGEONS, DUNGEON_ORDER, getDungeonUnlockRequirement } from '../src/game/content/dungeons/dungeons'
import { EQUIPMENT_BOSS_RELIC_IDS, EQUIPMENT_BY_DUNGEON } from '../src/game/content/equipment/equipmentSets'
import { getItemRecipeUses, getItemSourceInfo, getMonsterDungeon } from '../src/game/content/contentRelations'
import { ITEMS } from '../src/game/content/items/items'
import { MONSTERS, MONSTER_IDS, isBossMonster } from '../src/game/content/monsters'
import { RECIPES, RECIPE_ORDER } from '../src/game/content/recipes/recipes'
import { SCHOOLS } from '../src/game/content/schools/schools'
import { SPELLS } from '../src/game/content/spells/spells'
import { STATUS_DEFINITIONS, STATUS_ORDER } from '../src/game/content/statuses/statuses'
import { TRAIT_DEFINITIONS } from '../src/game/content/traits/traits'
import { CHANNELING_DISCOVERIES } from '../src/game/content/channeling/channelingDiscoveries'
import { MANA_PILLARS, MANA_PILLAR_IDS, PILLAR_LEVEL_COSTS } from '../src/game/content/channeling/manaPillars'
import { FOCUS_IMPROVEMENT } from '../src/game/content/focus/focusImprovement'
import { GUILD_REQUESTS } from '../src/game/content/guild/guildRequests'
import { RANK_ONE_TOWER_UPGRADE_COSTS } from '../src/game/content/tower/rankOneUpgradeCosts'
import { getResearchableItemIds } from '../src/game/content/items/items'
import { getAutoCastFocusCostForRank } from '../src/game/systems/spells'
import type { ItemId, SchoolId } from '../src/game/types'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '..')
const docsRoot = resolve(repositoryRoot, 'Docs', 'Balancing')
const force = process.argv.includes('--force')
const snapshotCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).trim()
const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: repositoryRoot, encoding: 'utf8' }).trim().length > 0

const notDefined = '[NOT DEFINED IN RUNTIME]'
const value = (input: unknown): string => {
  if (input === undefined || input === null) return notDefined
  if (typeof input === 'boolean') return input ? 'true' : 'false'
  if (typeof input === 'number') return Number.isFinite(input) ? String(input) : notDefined
  return String(input).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>')
}
const nullableValue = (input: unknown) => input === null ? 'null' : value(input)
const json = (input: unknown) => JSON.stringify(input, null, 2).replace(/\|/g, '\\|')
const table = (headers: readonly string[], rows: readonly (readonly unknown[])[]) => [
  `| ${headers.join(' | ')} |`,
  `| ${headers.map(() => '---').join(' | ')} |`,
  ...rows.map((row) => `| ${row.map(value).join(' | ')} |`),
].join('\n')
const duration = (input: unknown) => typeof input === 'number' ? `${input} ms (${input / 1000} s)` : value(input)
const percent = (input: unknown) => typeof input === 'number' ? `${input * 100}% (runtime fraction ${input})` : value(input)
const link = (name: string, path: string) => `[${name}](${path})`
const owner = (monsterId: string) => Object.values(MONSTERS).filter((monster) => monster.traitIds.includes(monsterId as never)).map((monster) => monster.id).join(', ') || notDefined
const actionRows = (monsterId: string) => Object.values(MONSTERS[monsterId as keyof typeof MONSTERS].actions).map((action) => [action.id, action.name, duration(action.actionTimeMs), action.tags?.join(', ') ?? notDefined, action.description, json(action.effects)])
const monsterRows = (ids: readonly string[]) => ids.map((id) => {
  const monster = MONSTERS[id as keyof typeof MONSTERS]
  const dungeon = getMonsterDungeon(id as never)
  return [monster.id, monster.name, monster.bestiaryCategory, dungeon?.dungeonName ?? notDefined, monster.maxHealth, monster.basicAttackDamage, duration(monster.basicAttackTimeMs), monster.defense ?? CombatBalance.DEFAULT_ENEMY_DEFENSE, json(monster.resistances ?? {}), monster.traitIds.join(', ') || notDefined]
})
const itemStats = (itemId: ItemId) => json(ITEMS[itemId].stats ?? {})
const itemRelations = (itemId: ItemId) => getItemSourceInfo(itemId).relations.map((relation) => `${relation.kind}:${relation.id} (${relation.detail})`).join('<br>') || notDefined
const effectSummary = (effects: readonly unknown[]) => json(effects)

const readme = `# SSS Wizard balancing data

This directory is the human-editable balancing interface for the current game content. It is a readable snapshot of authored runtime values, grouped by design domain so a non-programmer can review and request explicit changes.

## Runtime and document semantics

- TypeScript content and systems remain the executable runtime source of truth.
- The game never loads these Markdown files. There is no production Markdown parser.
- These files are a snapshot/editing surface, not a second runtime registry.
- Values are copied from runtime without rebalance or normalization. Fractions, percentages, milliseconds, counts, and formulas are labeled explicitly.
- IDs are stable cross-reference keys, not ordinary balance fields. Do not rename an ID as a balancing change; request an explicit content migration if an ID must change.
- Values shown as **[NOT DEFINED IN RUNTIME]** do not have an authored runtime value. Do not infer one.
- Derived values are marked with **> Derived** and must not be treated as authored constants.

Snapshot commit: ${snapshotCommit}
Working tree was dirty when exported: **${dirty ? 'yes' : 'no'}**

## Owner editing rules

Edit the value in the row whose first column is the stable ID. Keep the ID and table shape intact. Use the existing unit (for example, 5000 ms, 5 s, or a precise runtime fraction). Do not add invented items, spells, statuses, monsters, recipes, dungeons, traits, drops, or balance values. Formatting-only changes are welcome but do not represent gameplay changes.

## Future Codex apply workflow

1. Tell Codex which balancing files were edited and ask it to apply the explicit values.
2. Codex reads the edited tables and compares them with the current runtime registries and this snapshot commit.
3. Codex reports every requested change by stable ID and field before changing code.
4. Codex applies only explicit values to the authoritative runtime content/balance module; it does not invent missing values or silently rebalance related fields.
5. Codex runs targeted tests, then one final full test suite and one final build.

If the Markdown value, ID, unit, or table structure conflicts with runtime, Codex must stop that field and report:

> **BALANCE SYNC CONFLICT** — file / id / field

The report must explain the runtime value, document value, and exact decision needed. A conflict is never resolved by guessing. Runtime-only additions and removed IDs are also reported rather than silently deleted from the docs.

## Export and coverage

The exporter is manual only; it is never imported by gameplay, startup, tests, saves, or build. It protects existing human edits unless explicitly forced:

~~~text
npx vite-node scripts/export-balancing-docs.ts
npx vite-node scripts/export-balancing-docs.ts --force
npx vite-node scripts/check-balancing-doc-coverage.ts
~~~

The first command creates missing documents and refuses to overwrite an existing snapshot. --force is an intentional snapshot regeneration and may replace human edits. Coverage checks stable IDs in the first column of the relevant tables; it is deliberately a small check, not a general Markdown parser.

## Index

${link('Balance overview', './BALANCE_OVERVIEW.md')}

- Combat: ${link('player base stats', './Combat/Player_Base_Stats.md')}, ${link('global values', './Combat/Global_Combat_Values.md')}, ${link('formulas', './Combat/Combat_Formulas.md')}, ${link('statuses', './Combat/Status_Effects.md')}, ${link('traits and specials', './Combat/Traits_And_Special_Attacks.md')}
- Dungeons: ${link('progression', './Dungeons/Dungeon_Progression.md')}, plus one file per authored dungeon
- Enemies: ${link('index', './Enemies/Enemy_Index.md')}, plus one file per dungeon
- Items: ${link('index', './Items/Item_Index.md')}, ${link('materials', './Items/Materials.md')}, ${link('boss relics', './Items/Boss_Relics.md')}, plus one equipment file per dungeon
- Loot and Transmutation: ${link('monster drops', './Loot/Monster_Drops.md')}, ${link('boss drops', './Loot/Boss_Drops.md')}, ${link('recipes', './Transmutation/Recipes.md')}, ${link('crafting economy', './Transmutation/Crafting_Economy.md')}
- Progression: ${link('overview', './Progression/Progression_Overview.md')}, ${link('Research XP', './Progression/Research_XP.md')}, ${link('school XP', './Progression/Magic_School_XP.md')}, Channeling, Focus, Guild, and unlock rules
- Magic: ${link('spell index', './Magic/Spell_Index.md')}, one file per school, and ${link('Auto-Cast and Focus', './Magic/AutoCast_And_Focus.md')}
- Economy: ${link('item values', './Economy/Item_Values.md')} and ${link('progression timings', './Economy/Current_Progression_Timings.md')}
`

const docs = new Map<string, string>()
docs.set('README.md', readme)
docs.set('BALANCE_OVERVIEW.md', `# Balance overview

Runtime snapshot: ${snapshotCommit}  
The game does not read this Markdown at runtime.

## Authored registry coverage

${table(['Registry', 'Runtime count', 'Documentation'], [
  ['Items', Object.keys(ITEMS).length, link('Item Index', './Items/Item_Index.md')],
  ['Equipment', Object.values(ITEMS).filter((item) => item.kind === 'equipment').length, link('equipment files', './Items/')],
  ['Monsters', MONSTER_IDS.length, link('Enemy Index', './Enemies/Enemy_Index.md')],
  ['Dungeons', DUNGEON_ORDER.length, link('Dungeon Progression', './Dungeons/Dungeon_Progression.md')],
  ['Recipes', RECIPE_ORDER.length, link('Recipes', './Transmutation/Recipes.md')],
  ['Spells', Object.keys(SPELLS).length, link('Spell Index', './Magic/Spell_Index.md')],
  ['Statuses', STATUS_ORDER.length, link('Status Effects', './Combat/Status_Effects.md')],
  ['Traits', Object.keys(TRAIT_DEFINITIONS).length, link('Traits and Specials', './Combat/Traits_And_Special_Attacks.md')],
])}

## Authoritative runtime modules

| Domain | Runtime source |
| --- | --- |
| Global/player/combat balance | src/game/core/balance |
| Items/equipment | src/game/content/items, src/game/content/equipment |
| Monsters/dungeons | src/game/content/monsters, src/game/content/dungeons |
| Spells/schools/statuses/traits | src/game/content and combat types |
| Recipes/research/channeling/focus/guild | src/game/content |
| Combat resolution | src/game/systems/combat |

> Derived: counts above are generated from the registries at export time. They are not tuning values.

## Balancing file map

### Combat
- ${link('Player Base Stats', './Combat/Player_Base_Stats.md')}
- ${link('Global Combat Values', './Combat/Global_Combat_Values.md')}
- ${link('Combat Formulas', './Combat/Combat_Formulas.md')}
- ${link('Status Effects', './Combat/Status_Effects.md')}
- ${link('Traits and Special Attacks', './Combat/Traits_And_Special_Attacks.md')}
- ${link('Damage Types and Resistances', './Combat/Damage_Types_And_Resistances.md')}

### Dungeons and Enemies
- ${link('Dungeon Progression', './Dungeons/Dungeon_Progression.md')}
${DUNGEON_ORDER.map((id) => `- ${link(DUNGEONS[id].name, `./Dungeons/${id === 'whispering-woods' ? 'Whispering_Woods' : id === 'howling-den' ? 'Howling_Den' : 'Abandoned_Catacombs'}.md`)}`).join('\n')}
- ${link('Enemy Index', './Enemies/Enemy_Index.md')}
${DUNGEON_ORDER.map((id) => `- ${link(`${DUNGEONS[id].name} enemies`, `./Enemies/${id === 'whispering-woods' ? 'Whispering_Woods' : id === 'howling-den' ? 'Howling_Den' : 'Abandoned_Catacombs'}.md`)}`).join('\n')}

### Items and production
- ${link('Item Index', './Items/Item_Index.md')}
- ${link('Materials', './Items/Materials.md')}
- ${link('Boss Relics', './Items/Boss_Relics.md')}
- ${link('Whispering Woods Equipment', './Items/Equipment_Whispering_Woods.md')}
- ${link('Howling Den Equipment', './Items/Equipment_Howling_Den.md')}
- ${link('Abandoned Catacombs Equipment', './Items/Equipment_Abandoned_Catacombs.md')}
- ${link('Monster Drops', './Loot/Monster_Drops.md')}
- ${link('Boss Drops', './Loot/Boss_Drops.md')}
- ${link('Recipes', './Transmutation/Recipes.md')}
- ${link('Crafting Economy', './Transmutation/Crafting_Economy.md')}

### Progression and Magic
- ${link('Progression Overview', './Progression/Progression_Overview.md')}
- ${link('Research XP', './Progression/Research_XP.md')}
- ${link('Magic School XP', './Progression/Magic_School_XP.md')}
- ${link('Channeling', './Progression/Channeling.md')}
- ${link('Focus', './Progression/Focus.md')}
- ${link('Guild Progression', './Progression/Guild_Progression.md')}
- ${link('Unlock Progression', './Progression/Unlock_Progression.md')}
- ${link('Spell Index', './Magic/Spell_Index.md')}
${(['Fire', 'Water', 'Earth', 'Air'] as const).map((school) => `- ${link(`${school} Spells`, `./Magic/${school}_Spells.md`)}`).join('\n')}
- ${link('Magic Schools', './Magic/Magic_Schools.md')}
- ${link('Auto-Cast and Focus', './Magic/AutoCast_And_Focus.md')}

### Economy
- ${link('Item Values', './Economy/Item_Values.md')}
- ${link('Current Progression Timings', './Economy/Current_Progression_Timings.md')}
`)

docs.set('Combat/Global_Combat_Values.md', `# Global combat values

Snapshot: ${snapshotCommit}. Runtime values are shown as authored; percentage-like fields remain their exact runtime fractions.

## BALANCE

${table(['ID / path', 'Runtime value'], Object.entries(BALANCE).flatMap(([group, entries]) => Object.entries(entries).map(([key, entry]) => [`BALANCE.${group}.${key}`, typeof entry === 'object' ? json(entry) : entry])))}

## Combat bounds and defaults

${table(['ID', 'Runtime value', 'Meaning'], [
  ['MIN_RESISTANCE', CombatBalance.MIN_RESISTANCE, 'Canonical lower bound for ordinary resistance'],
  ['MAX_RESISTANCE', CombatBalance.MAX_RESISTANCE, 'Canonical upper bound for ordinary resistance'],
  ['DEFAULT_ENEMY_DEFENSE', CombatBalance.DEFAULT_ENEMY_DEFENSE, 'Enemy defense fallback'],
  ['DEFAULT_ENEMY_CRIT_CHANCE', CombatBalance.DEFAULT_ENEMY_CRIT_CHANCE, 'Enemy crit chance fallback; runtime fraction'],
  ['DEFAULT_ENEMY_CRIT_DAMAGE_MULTIPLIER', CombatBalance.DEFAULT_ENEMY_CRIT_DAMAGE_MULTIPLIER, 'Enemy crit multiplier fallback'],
  ['DEFAULT_COMBAT_SPEED_MULTIPLIER', CombatBalance.DEFAULT_COMBAT_SPEED_MULTIPLIER, 'Default action-speed multiplier'],
  ['DEFENSE_K', CombatBalance.DEFENSE_K, 'Defense reduction curve constant'],
  ['MAX_DEFENSE_REDUCTION', CombatBalance.MAX_DEFENSE_REDUCTION, 'Defense reduction cap; runtime fraction'],
  ['MAX_BLOCK_CHANCE', CombatBalance.MAX_BLOCK_CHANCE, 'Block chance cap; runtime fraction'],
  ['BLOCK_DAMAGE_REDUCTION', CombatBalance.BLOCK_DAMAGE_REDUCTION, 'Blocked damage reduction; runtime fraction'],
  ['MAX_CRIT_CHANCE', CombatBalance.MAX_CRIT_CHANCE, 'Crit chance cap; runtime fraction'],
  ['MIN_CRIT_DAMAGE_MULTIPLIER', CombatBalance.MIN_CRIT_DAMAGE_MULTIPLIER, 'Crit multiplier lower bound'],
  ['MAX_CRIT_DAMAGE_MULTIPLIER', CombatBalance.MAX_CRIT_DAMAGE_MULTIPLIER, 'Crit multiplier cap'],
])}

## Action timing bounds

${table(['ID', 'Runtime value', 'Unit'], Object.entries(CombatTiming).filter(([key, entry]) => typeof entry === 'number').map(([key, entry]) => [key, entry, key.endsWith('MS') || key === 'MAX_ACTION_WORK_MS' ? 'ms' : 'multiplier/rate']))}
`)

docs.set('Combat/Combat_Formulas.md', `# Combat formulas

These formulas are documented from the current runtime systems. They are written for designers to understand; changing a formula requires a code change and targeted runtime tests.

## Player sheet

~~~text
Max Health = player.baseMaxHealth + equipment.maxHealth
Max Mana = channeling capacity total (including equipment and authored amplification)
Max Focus = Focus capacity breakdown total
Spell Power = base spell power + authored equipment/combat modifiers
Basic Attack Damage = BALANCE.player.basicAttackDamage + equipment.basicDamage
Basic Attack Speed Multiplier = clamp(1 + basicAttackSpeed modifiers, 0.1, 10)
Basic Attack Interval = BALANCE.player.basicAttackIntervalMs / Basic Attack Speed Multiplier
Crit Chance = clamp(base crit chance + modifiers, 0, MAX_CRIT_CHANCE)
Crit Damage Multiplier = clamp(base crit damage + modifiers, 1, MAX_CRIT_DAMAGE_MULTIPLIER)
Defense = max(0, base defense + defense-flat modifiers)
Defense Reduction = min(MAX_DEFENSE_REDUCTION, Defense / (Defense + DEFENSE_K))
Effective Mana Cost = max(1, ceil(base cost × (1 - manaCostReductionPct)))
Effective Focus Cost = max(1, ceil(base cost × (1 - focusEfficiencyPct)))
~~~

## Damage resolution order

~~~text
raw magnitude
→ source damage-dealt modifiers
→ Basic Attack / Spell / Melee / Ranged / DoT modifiers as applicable
→ critical multiplier for direct damage
→ target damage-taken modifiers
→ defense reduction for direct damage
→ resistance: max(0, amount × (1 - resistance))
→ block reduction for direct damage when the block roll succeeds
→ barrier absorption
→ remaining health damage
~~~

Runtime details: DoT and other non-direct effects do not roll crit or block; direct hits share one crit/block roll across multi-component hits. Immunity is resolved before damage is applied. Negative resistance increases damage through the same 1 - resistance expression.

## Timing and status rules

- Authored action and status durations are milliseconds. The simulation tick is ${BALANCE.tickMs} ms.
- Status periodic intervals and payloads are authored in [Status Effects](./Status_Effects.md); application can snapshot a source-specific periodic payload.
- Status duration, stacking, cleanse, dispel, and action prevention are defined per status and executed by the combat status runtime.
- A status with defaultDurationMs: null is indefinite until removed or replaced by runtime rules.
`)

docs.set('Combat/Status_Effects.md', `# Status effects

All rows come from STATUS_DEFINITIONS. Durations and periodic intervals are milliseconds. Modifier values use exact runtime fractions.

${table(['Status ID', 'Name', 'Classification', 'Tags', 'Default duration', 'Stacking', 'Cleanse', 'Dispel', 'Prevents action', 'Modifiers', 'Periodic', 'Triggers'], STATUS_ORDER.map((id) => { const status = STATUS_DEFINITIONS[id]; return [id, status.name, status.classification, status.tags.join(', '), status.defaultDurationMs === null ? 'indefinite (null)' : duration(status.defaultDurationMs), json(status.stacking), status.cleanseable, status.dispellable, status.preventsAction ?? false, json(status.modifiers ?? []), status.periodic ? `${duration(status.periodic.intervalMs)}<br>${effectSummary(status.periodic.effects)}` : notDefined, json(status.triggers ?? [])] }))}

## Status authoring notes

Status IDs are stable references used by spells, monster actions, traits, equipment, saves, and telemetry. Application-time overrides are runtime mechanics and are not a second status registry.
`)

docs.set('Combat/Traits_And_Special_Attacks.md', `# Traits and special attacks

## Authored traits

${table(['Trait ID', 'Owner monster IDs', 'Name', 'Description', 'Modifiers', 'Rules'], Object.values(TRAIT_DEFINITIONS).map((trait) => [trait.id, owner(trait.id), trait.name, trait.description, json(trait.modifiers ?? []), json(trait.rules ?? [])]))}

## Special action definition shape

Monster special actions are documented in each dungeon enemy file. Each row keeps the action ID, name, duration, tags, description, and exact effect graph. Action pattern steps are included as JSON below each monster so pattern IDs and step order remain visible.
`)

docs.set('Combat/Damage_Types_And_Resistances.md', `# Damage types and resistances

## Damage types

${table(['Damage type ID', 'Runtime meaning'], [['physical', 'Physical damage'], ['arcane', 'Arcane damage'], ['fire', 'Fire school damage'], ['water', 'Water school damage'], ['earth', 'Earth damage'], ['air', 'Air school damage']])}

## Resistance rules

${table(['Rule ID', 'Runtime value'], [['MIN_RESISTANCE', CombatBalance.MIN_RESISTANCE], ['MAX_RESISTANCE', CombatBalance.MAX_RESISTANCE], ['Immunity', 'Authored separately as monster.damageImmunities; not a resistance value'], ['Mitigation', 'max(0, resolved damage × (1 - resistance))']])}

## Authored monster resistance overview

${table(['Monster ID', 'Name', 'Physical', 'Arcane', 'Fire', 'Water', 'Earth', 'Air', 'Immunities'], MONSTER_IDS.map((id) => { const resistance = MONSTERS[id].resistances ?? {}; return [id, MONSTERS[id].name, resistance.physical ?? 0, resistance.arcane ?? 0, resistance.fire ?? 0, resistance.water ?? 0, resistance.earth ?? 0, resistance.air ?? 0, MONSTERS[id].damageImmunities?.join(', ') ?? notDefined] }))}
`)

const dungeonProgressionDoc = `# Dungeon progression

${table(['Dungeon ID', 'Name', 'Threat required', 'Boss ID', 'Encounter delay', 'Unlock condition', 'Normal pool', 'Tutorial completion'], DUNGEON_ORDER.map((id) => { const dungeon = DUNGEONS[id]; return [id, dungeon.name, dungeon.threatRequired, dungeon.boss, duration(dungeon.encounterDelayMs), json(dungeon.unlock ?? { type: 'always' }), dungeon.monsterPool.join(', '), dungeon.completesTutorial ?? false] }))}

Dungeon descriptions and set relationships are repeated in the per-dungeon documents for human navigation; the registry above is the authoritative ID index.
`
docs.set('Dungeons/Dungeon_Progression.md', dungeonProgressionDoc)

for (const dungeonId of DUNGEON_ORDER) {
  const dungeon = DUNGEONS[dungeonId]
  docs.set(`Dungeons/${dungeonId === 'whispering-woods' ? 'Whispering_Woods' : dungeonId === 'howling-den' ? 'Howling_Den' : 'Abandoned_Catacombs'}.md`, `# ${dungeon.name}

**Dungeon ID:** ${dungeon.id}  
**Description:** ${dungeon.ui?.description ?? notDefined}

${table(['Field ID', 'Runtime value'], [['threatRequired', dungeon.threatRequired], ['boss', dungeon.boss], ['encounterDelayMs', duration(dungeon.encounterDelayMs)], ['unlock', json(dungeon.unlock ?? { type: 'always' })], ['completesTutorial', dungeon.completesTutorial ?? false]])}

## Normal encounter pool

${table(['Monster ID', 'Name', 'Role'], dungeon.monsterPool.map((id) => [id, MONSTERS[id].name, 'normal']))}

Boss: ${dungeon.boss} — ${MONSTERS[dungeon.boss].name}
`)
}

docs.set('Enemies/Enemy_Index.md', `# Enemy index

${table(['Monster ID', 'Name', 'Role', 'Dungeon', 'HP', 'Basic damage', 'Basic attack time', 'Defense', 'Resistances', 'Trait IDs', 'XP reward'], monsterRows(MONSTER_IDS).map((row) => [...row, notDefined]))}

All loot entries, actions, special effects, and action patterns are expanded in the dungeon files below.
`)

for (const dungeonId of DUNGEON_ORDER) {
  const dungeon = DUNGEONS[dungeonId]
  const ids = [...dungeon.monsterPool, dungeon.boss]
  const name = dungeonId === 'whispering-woods' ? 'Whispering_Woods' : dungeonId === 'howling-den' ? 'Howling_Den' : 'Abandoned_Catacombs'
  docs.set(`Enemies/${name}.md`, `# ${dungeon.name} enemies

${table(['Monster ID', 'Name', 'Role', 'HP', 'Basic damage', 'Basic attack time', 'Defense', 'Crit chance', 'Crit damage', 'Block chance', 'Resistances', 'Status immunities', 'XP reward'], monsterRows(ids).map((row) => { const monster = MONSTERS[row[0] as keyof typeof MONSTERS]; return [row[0], row[1], row[2], row[4], row[5], row[6], row[7], monster.critChance ?? CombatBalance.DEFAULT_ENEMY_CRIT_CHANCE, monster.critDamage ?? CombatBalance.DEFAULT_ENEMY_CRIT_DAMAGE_MULTIPLIER, monster.blockChance ?? 0, row[8], monster.statusImmunities?.join(', ') ?? notDefined, notDefined] }))}

${ids.map((id) => { const monster = MONSTERS[id]; return `## ${monster.name} (${id})

${monster.subtitle}

### Traits

${monster.traitIds.map((traitId) => `- ${traitId}: ${TRAIT_DEFINITIONS[traitId]?.description ?? notDefined}`).join('\n') || '- None authored'}

### Actions

${table(['Action ID', 'Name', 'Action time', 'Tags', 'Description', 'Exact effects'], actionRows(id))}

### Action patterns

~~~json
${json(monster.actionPatterns)}
~~~

### Loot

${table(['Item ID', 'Min', 'Max', 'Chance (runtime fraction)', 'Chance (%)'], monster.loot.map((drop) => [drop.itemId, drop.min, drop.max, drop.chance, percent(drop.chance)]))}
` }).join('\n')}
`)
}

docs.set('Items/Item_Index.md', `# Item index

Stats are exact authored runtime values. Percentage fields are stored as runtime fractions (for example 0.1 means 10%). Source relationships are derived from equipment sets, monster loot tables, and recipe outputs; the exporter does not parse the player-facing source text.

${table(['Item ID', 'Name', 'Kind', 'Category', 'Inventory category', 'Material subtype', 'Equipment slot', 'Weapon hands', 'Stats', 'Source label', 'Derived relationships', 'Sell value', 'Can destroy'], Object.keys(ITEMS).map((id) => { const item = ITEMS[id as ItemId]; return [id, item.name, item.kind, item.category, item.inventoryCategory, item.materialSubtype ?? notDefined, item.equipmentSlot ?? notDefined, item.weaponHands ?? notDefined, itemStats(id as ItemId), item.source, itemRelations(id as ItemId), nullableValue(item.sellValue), item.canDestroy] }))}
`)

const equipmentFile = (dungeonId: string, title: string) => {
  const ids = EQUIPMENT_BY_DUNGEON[dungeonId as keyof typeof EQUIPMENT_BY_DUNGEON]
  return `# ${title} equipment

${table(['Equipment ID', 'Name', 'Slot', 'Hands', 'Stats', 'Combat modifiers', 'Combat rules', 'Origin relation', 'Recipe ID'], ids.map((id) => { const item = ITEMS[id]; return [id, item.name, item.equipmentSlot, item.weaponHands ?? notDefined, itemStats(id), json(item.combat?.modifiers ?? []), json(item.combat?.rules ?? []), getItemSourceInfo(id).relations.filter((relation) => relation.kind === 'dungeon').map((relation) => relation.id).join(', ') || notDefined, RECIPES[id as keyof typeof RECIPES] ? id : notDefined] }))}

Boss relic membership is documented separately in [Boss Relics](./Boss_Relics.md); the item remains in its authored dungeon set here.
`
}
docs.set('Items/Equipment_Whispering_Woods.md', equipmentFile('whispering-woods', 'Whispering Woods'))
docs.set('Items/Equipment_Howling_Den.md', equipmentFile('howling-den', 'Howling Den'))
docs.set('Items/Equipment_Abandoned_Catacombs.md', equipmentFile('abandoned-catacombs', 'Abandoned Catacombs'))

const materialIds = Object.keys(ITEMS).filter((id) => ITEMS[id as ItemId].kind === 'material') as ItemId[]
docs.set('Items/Materials.md', `# Materials

${table(['Material ID', 'Name', 'Category', 'Subtype', 'Research school', 'Drop/source relationships', 'Recipe uses', 'Sell value'], materialIds.map((id) => { const item = ITEMS[id]; return [id, item.name, item.category, item.materialSubtype ?? notDefined, item.researchSchool ?? notDefined, itemRelations(id), getItemRecipeUses(id).map((recipe) => recipe.id).join(', ') || notDefined, item.sellValue ?? notDefined] }))}

Drop chances and quantity ranges are authoritative in [Monster Drops](../Loot/Monster_Drops.md) and [Boss Drops](../Loot/Boss_Drops.md), keyed by monster ID and item ID.
`)
docs.set('Items/Boss_Relics.md', `# Boss relics

${table(['Equipment ID', 'Name', 'Dungeon set', 'Direct source relationships', 'Stats', 'Combat rules', 'Sell value'], EQUIPMENT_BOSS_RELIC_IDS.map((id) => { const item = ITEMS[id]; return [id, item.name, Object.entries(EQUIPMENT_BY_DUNGEON).find(([, ids]) => ids.includes(id))?.[0] ?? notDefined, getItemSourceInfo(id).relations.filter((relation) => relation.kind === 'monster').map((relation) => relation.id).join(', ') || notDefined, itemStats(id), json(item.combat?.rules ?? []), nullableValue(item.sellValue)] }))}
`)

const lootTableDoc = `# Monster drops

Every authored monster loot entry is listed. Chance is shown both as the exact runtime fraction and a percentage; min/max are inclusive authored quantities.

${DUNGEON_ORDER.map((dungeonId) => { const dungeon = DUNGEONS[dungeonId]; const ids = [...dungeon.monsterPool, dungeon.boss]; return `## ${dungeon.name}

${table(['Monster ID', 'Monster', 'Role', 'Item ID', 'Min', 'Max', 'Chance (fraction)', 'Chance (%)', 'Acquisition note'], ids.flatMap((monsterId) => MONSTERS[monsterId].loot.map((drop) => [monsterId, MONSTERS[monsterId].name, isBossMonster(MONSTERS[monsterId]) ? 'boss' : 'normal', drop.itemId, drop.min, drop.max, drop.chance, percent(drop.chance), 'Central combat loot resolution; item acquisition updates inventory and discovery'])))}
` }).join('\n')}
`
docs.set('Loot/Monster_Drops.md', lootTableDoc)
docs.set('Loot/Boss_Drops.md', `# Boss drops

Every authored boss loot entry is listed separately so direct boss rewards are easy to find.

${DUNGEON_ORDER.map((dungeonId) => { const dungeon = DUNGEONS[dungeonId]; const bossId = dungeon.boss; const boss = MONSTERS[bossId]; return `## ${dungeon.name}

${table(['Boss ID', 'Boss', 'Item ID', 'Min', 'Max', 'Chance (fraction)', 'Chance (%)'], boss.loot.map((drop) => [bossId, boss.name, drop.itemId, drop.min, drop.max, drop.chance, percent(drop.chance)]))}
` }).join('\n')}
`)

docs.set('Transmutation/Recipes.md', `# Recipes

Durations are milliseconds. Ingredient quantities are per one authored output unless the runtime definition says otherwise.

${table(['Recipe ID', 'Name', 'Output item', 'Output quantity', 'Category', 'Duration', 'Mana cost', 'Ingredients', 'Unlock', 'Description'], RECIPE_ORDER.map((id) => { const recipe = RECIPES[id]; return [id, recipe.name, recipe.output.itemId, recipe.output.quantity, recipe.category, duration(recipe.baseDurationMs), recipe.manaCost, recipe.ingredients.map((ingredient) => `${ingredient.itemId} × ${ingredient.quantity}`).join('<br>') || 'None', recipe.unlock.type, recipe.description ?? notDefined] }))}

Transmutation remains the single item-creation system. The Dev Tools “Grant Missing Ingredients” action must use the central acquisition helper, not a second crafting queue.
`)
docs.set('Transmutation/Crafting_Economy.md', `# Crafting economy

These are authored per-cycle costs and durations. The estimates are derived for comparison and are not additional runtime constants.

${table(['Recipe ID', 'Output', 'Ingredient count', 'Duration', 'Mana cost', 'Output per hour at one Echo'], RECIPE_ORDER.map((id) => { const recipe = RECIPES[id]; return [id, `${recipe.output.itemId} × ${recipe.output.quantity}`, recipe.ingredients.reduce((total, ingredient) => total + ingredient.quantity, 0), duration(recipe.baseDurationMs), recipe.manaCost, `${(recipe.output.quantity * 3_600_000 / recipe.baseDurationMs).toFixed(2)} output/hour` ] }))}

> Derived: output/hour assumes one continuously assigned Echo and does not account for missing ingredients, unlocks, Mana availability, or activity downtime.
`)

docs.set('Combat/Player_Base_Stats.md', `# Player base stats

${table(['Balance ID', 'Runtime value', 'Unit / note'], Object.entries(BALANCE.player).map(([key, entry]) => [`BALANCE.player.${key}`, entry, key.endsWith('Ms') ? 'ms' : key.toLowerCase().includes('chance') || key.toLowerCase().includes('damage') && key === 'baseCritDamage' ? 'runtime value; see combat formula' : 'runtime value']))}

Player save state also persists current, derived, and compatibility fields. Derived runtime values should be inspected through the combat/equipment read models rather than copied into this authored-base table.
`)
docs.set('Progression/Magic_School_XP.md', `# Magic School XP

## Magic school XP

~~~text
SCHOOL_LEVEL_XP(level) = level × 20
School level start XP = the runtime helper getSchoolLevelStartXp(level)
~~~

${table(['Curve ID', 'Runtime formula / value'], [['SCHOOL_LEVEL_XP', 'level × 20'], ['getSchoolLevelStartXp', 'level 1 start = 0; runtime helper defines subsequent start XP']])}

## Rank-I auto-cast Focus reference

${table(['Rank', 'Focus cost'], [[1, getAutoCastFocusCostForRank(1)], [2, getAutoCastFocusCostForRank(2)], [3, getAutoCastFocusCostForRank(3)], [4, getAutoCastFocusCostForRank(4)], [5, getAutoCastFocusCostForRank(5)], [6, getAutoCastFocusCostForRank(6)], [7, getAutoCastFocusCostForRank(7)], [8, getAutoCastFocusCostForRank(8)]])}
`)
docs.set('Progression/Research_XP.md', `# Research XP

${table(['Balance ID', 'Runtime value', 'Unit'], Object.entries(BALANCE.research).map(([key, entry]) => [`BALANCE.research.${key}`, entry, key.endsWith('Ms') ? 'ms' : key.toLowerCase().includes('xp') ? 'XP/item' : 'runtime value']))}

## Researchable item registry

${table(['Item ID', 'Name', 'Authored research school', 'Matching XP', 'Non-matching XP'], getResearchableItemIds().map((id) => [id, ITEMS[id].name, ITEMS[id].researchSchool, BALANCE.research.matchingXp, BALANCE.research.nonMatchingXp]))}

## Research activity values

${table(['Activity ID', 'Duration per item', 'Mana per item', 'Matching XP', 'Non-matching XP', 'XP/minute at matching affinity'], [['research', duration(BALANCE.research.durationPerItemMs), BALANCE.research.manaCostPerItem, BALANCE.research.matchingXp, BALANCE.research.nonMatchingXp, `${(BALANCE.research.matchingXp * 60_000 / BALANCE.research.durationPerItemMs).toFixed(2)}`]])}
`)
docs.set('Progression/Channeling.md', `# Channeling

## Channeling constants

${table(['Balance ID', 'Runtime value'], Object.entries(BALANCE.channeling).map(([key, entry]) => [`BALANCE.channeling.${key}`, entry]))}

## Mana pillars

${table(['Pillar ID', 'Name', 'Effect', 'Effect label', 'Value per level', 'Max level', 'Fragment requirements', 'Level costs'], MANA_PILLAR_IDS.map((id) => { const pillar = MANA_PILLARS[id]; return [id, pillar.name, pillar.effect, pillar.effectLabel, pillar.valuePerLevel, pillar.maxLevel, pillar.fragmentRequirements.join(', '), json(PILLAR_LEVEL_COSTS)] }))}

## Discoveries

${table(['Discovery ID', 'Name', 'Condition', 'Reward'], CHANNELING_DISCOVERIES.map((discovery) => [discovery.id, discovery.name, discovery.conditionDescription, discovery.rewardDescription]))}
`)
docs.set('Progression/Focus.md', `# Focus

${table(['Balance / content ID', 'Runtime value'], Object.entries(BALANCE.focus).map(([key, entry]) => [`BALANCE.focus.${key}`, entry]))}

${table(['Content ID', 'Name', 'Levels', 'Focus per level', 'Upgrade costs'], [['focus-improvement', FOCUS_IMPROVEMENT.name, FOCUS_IMPROVEMENT.maxLevel, FOCUS_IMPROVEMENT.focusPerLevel, json(RANK_ONE_TOWER_UPGRADE_COSTS)]])}

Capacity breakdown and reservations are derived by the Focus runtime selectors. They must not be duplicated as authored constants here.
`)
docs.set('Progression/Guild_Progression.md', `# Guild progression

${table(['Request ID', 'Name', 'Kind', 'Item ID', 'Target amount', 'Reward / metadata'], Object.values(GUILD_REQUESTS).map((request) => [request.id, request.name, request.kind, 'itemId' in request ? request.itemId : notDefined, 'target' in request ? request.target : notDefined, json(request)]))}

Guild ranks, unlock flags, reputation, and request progress are persisted progression state. Their mutation remains in the Guild store actions.
`)

docs.set('Progression/Progression_Overview.md', `# Progression overview

The progression chain below is derived from the current dungeon unlock definitions and persisted progression flags. These rows describe the implemented gates; they are not a separate progression registry.

${table(['Dungeon ID', 'Name', 'Unlock condition', 'Boss ID', 'Boss kills recorded', 'Completed now'], DUNGEON_ORDER.map((id) => { const dungeon = DUNGEONS[id]; return [id, dungeon.name, getDungeonUnlockRequirement(dungeon) ?? 'Always unlocked', dungeon.boss, notDefined, notDefined] }))}

## Current persisted milestones

${table(['Progression ID', 'Current state meaning'], [
  ['firstBossKill', 'First dungeon boss milestone'],
  ['firstMainBossKill', 'Legacy Forest Heart milestone'],
  ['guildUnlocked', 'Guild feature unlocked'],
  ['emberStaffUnlocked', 'Ember Staff progression flag'],
  ['forestHeartUnlocked', 'Forest Heart progression flag'],
  ['autoHuntBossUnlocked', 'Boss auto-hunt feature unlocked'],
  ['magicLevelCap', 'Current Magic School level ceiling'],
])}

> Persisted state values are intentionally shown as runtime state markers here; use Dev Tools for the live values of the active profile.
`)

docs.set('Progression/Unlock_Progression.md', `# Unlock progression

${table(['Unlock ID', 'Runtime rule', 'Related content'], DUNGEON_ORDER.map((id) => { const dungeon = DUNGEONS[id]; return [`dungeon:${id}`, JSON.stringify(dungeon.unlock ?? { type: 'always' }), `${dungeon.name} → boss ${dungeon.boss}`] }).concat(RECIPE_ORDER.filter((id) => RECIPES[id].unlock.type !== 'always').map((id) => { const recipe = RECIPES[id]; return [`recipe:${id}`, JSON.stringify(recipe.unlock), recipe.name] })))}

Spell unlock levels are documented in [Spell Index](../Magic/Spell_Index.md); school caps are in [Magic School XP](./Magic_School_XP.md). No additional unlock system is inferred.
`)

docs.set('Magic/Spell_Index.md', `# Spell index

${table(['Spell ID', 'Name', 'School', 'Type', 'Unlock level', 'Mana cost', 'Cooldown', 'Effects', 'Auto-cast condition'], Object.values(SPELLS).map((spell) => [spell.id, spell.name, spell.school, spell.type, spell.unlockLevel, spell.manaCost, duration(spell.cooldownMs), json(spell.effects), json(spell.autoCondition ?? null)]))}
`)
for (const schoolId of ['fire', 'water', 'earth', 'air'] as SchoolId[]) {
  const schoolFileName = `${schoolId[0].toUpperCase()}${schoolId.slice(1)}_Spells.md`
  docs.set(`Magic/${schoolFileName}`, `# ${SCHOOLS[schoolId].name} spells

**School ID:** ${schoolId}  
**Tagline:** ${SCHOOLS[schoolId].tagline}  
**Fragment ID:** ${SCHOOLS[schoolId].fragment}

${table(['Spell ID', 'Name', 'Type', 'Unlock level', 'Mana cost', 'Cooldown', 'Effects'], Object.values(SPELLS).filter((spell) => spell.school === schoolId).map((spell) => [spell.id, spell.name, spell.type, spell.unlockLevel, spell.manaCost, duration(spell.cooldownMs), json(spell.effects)]))}
`)
}
docs.set('Magic/Magic_Schools.md', `# Magic schools

${table(['School ID', 'Name', 'Fragment ID', 'Tagline', 'Runtime school metadata'], Object.values(SCHOOLS).map((school) => [school.id, school.name, school.fragment, school.tagline, json(school)]))}

School XP and unlock progression are documented in [Magic School XP](../Progression/Magic_School_XP.md); spell definitions remain in the [Spell Index](./Spell_Index.md).
`)
docs.set('Magic/AutoCast_And_Focus.md', `# Auto-Cast and Focus

Auto-Cast is a runtime activity that consumes Focus when a spell is enabled. The table shows the authored rank cost helper and the spell's current auto-cast condition.

${table(['Spell ID', 'Name', 'School', 'Rank-I Focus cost', 'Rank-II Focus cost', 'Rank-III Focus cost', 'Auto-cast condition'], Object.values(SPELLS).map((spell) => [spell.id, spell.name, spell.school, getAutoCastFocusCostForRank(1), getAutoCastFocusCostForRank(2), getAutoCastFocusCostForRank(3), json(spell.autoCondition ?? null)]))}

${table(['Rank', 'Focus cost'], [1, 2, 3, 4, 5, 6, 7, 8].map((rank) => [rank, getAutoCastFocusCostForRank(rank)]))}

Auto-Cast enablement, current assignment, and starvation state are live profile state. Use the Schools/Spells Dev Tools and Focus Dev Tools to test them.
`)

docs.set('Economy/Item_Values.md', `# Item values

Sell values are exact runtime values. A runtime null is shown as null (not sellable); an absent/undefined value is shown as **[NOT DEFINED IN RUNTIME]**.

${table(['Item ID', 'Name', 'Sell value', 'Can destroy', 'Restriction'], Object.keys(ITEMS).map((id) => { const item = ITEMS[id as ItemId]; return [id, item.name, nullableValue(item.sellValue), item.canDestroy, item.actionRestrictionReason ?? notDefined] }))}
`)
docs.set('Economy/Current_Progression_Timings.md', `# Current progression timings

These are the current authored durations and thresholds used by ongoing activities and dungeon progression.

${table(['Timing ID', 'Runtime value', 'Meaning'], [
  ['tickMs', duration(BALANCE.tickMs), 'Simulation update interval'],
  ['dungeon.encounterDelayMs', duration(BALANCE.dungeon.encounterDelayMs), 'Normal encounter delay'],
  ['research.durationPerItemMs', duration(BALANCE.research.durationPerItemMs), 'Research work per item before Echo speed'],
  ['transmutation.*.baseDurationMs', 'Per recipe; see Recipes', 'Transmutation duration is authored on each recipe'],
  ['channeling.echoResonanceDurationMs', duration(BALANCE.channeling.echoResonanceDurationMs), 'Echo Resonance discovery duration'],
  ['schoolProgression.startingCap', BALANCE.schoolProgression.startingCap, 'Initial Magic School level cap'],
  ['schoolProgression.tutorialCompleteCap', BALANCE.schoolProgression.tutorialCompleteCap, 'Cap after tutorial completion'],
])}

No completion time is estimated for content that is gated by player choices, combat outcomes, or resource availability.
`)

const ensureSafeToWrite = () => {
  const existing = [...docs.keys()].map((relativePath) => resolve(docsRoot, relativePath)).filter(existsSync)
  if (existing.length > 0 && !force) throw new Error(`Balancing docs already exist. Refusing to overwrite without --force: ${existing.join(', ')}`)
}
ensureSafeToWrite()
const documentHeader = `> Runtime snapshot: \`${snapshotCommit}\`  
> Generated from current game data.  
> Human-editable balancing document.`
for (const [relativePath, contents] of docs) {
  const target = resolve(docsRoot, relativePath)
  mkdirSync(dirname(target), { recursive: true })
  const body = contents.trim()
  const withHeader = body.replace(/^(# [^\n]+\n)/, `$1\n${documentHeader}\n`)
  writeFileSync(target, `${withHeader}\n`, 'utf8')
}
console.log(`Exported ${docs.size} balancing documents from runtime HEAD ${snapshotCommit}${dirty ? ' (working tree dirty)' : ''}.`)
