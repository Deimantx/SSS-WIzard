import { BALANCE, SCHOOL_LEVEL_XP } from '../../src/game/core/balance/balance'
import * as CombatBalance from '../../src/game/core/balance/combatStats'
import * as CombatTiming from '../../src/game/core/balance/combatTiming'
import { getItemRecipeUses, getItemSourceInfo, getMonsterDungeon } from '../../src/game/content/contentRelations'
import { DUNGEONS, DUNGEON_ORDER } from '../../src/game/content/dungeons/dungeons'
import { EQUIPMENT_BOSS_RELIC_IDS, EQUIPMENT_BY_DUNGEON } from '../../src/game/content/equipment/equipmentSets'
import { ITEMS, getResearchableItemIds } from '../../src/game/content/items/items'
import { MONSTERS, MONSTER_IDS, isBossMonster } from '../../src/game/content/monsters'
import { CHANNELING_DISCOVERIES } from '../../src/game/content/channeling/channelingDiscoveries'
import { MANA_PILLARS, MANA_PILLAR_IDS, PILLAR_LEVEL_COSTS } from '../../src/game/content/channeling/manaPillars'
import { FOCUS_IMPROVEMENT } from '../../src/game/content/focus/focusImprovement'
import { GUILD_REQUESTS } from '../../src/game/content/guild/guildRequests'
import { RECIPES, RECIPE_ORDER } from '../../src/game/content/recipes/recipes'
import { SCHOOLS } from '../../src/game/content/schools/schools'
import { SPELLS } from '../../src/game/content/spells/spells'
import { STATUS_DEFINITIONS, STATUS_ORDER } from '../../src/game/content/statuses/statuses'
import { TRAIT_DEFINITIONS } from '../../src/game/content/traits/traits'
import {
  formatActionPattern,
  formatAutoCastCondition,
  formatCombatEffect,
  formatCombatModifier,
  formatCombatRule,
  formatDuration,
  formatEquipmentEffectSummary,
  formatItemStats,
  formatNumber,
  formatPercent,
  formatReadableId,
  formatRecipeUnlock,
  formatSignedPercent,
} from '../../src/game/content/presentation/balanceFormatters'
import { getAutoCastFocusCostForRank } from '../../src/game/systems/spells'
import type { ItemDefinition, ItemId, SchoolId } from '../../src/game/types'
import { bullets, cleanDocument, idLine, section, table } from './markdown'

export interface BalancingDocumentInfo {
  stableIds: string[]
  runtimeSources: string[]
}

export interface BalancingDocumentBuild {
  docs: Map<string, string>
  documentInfo: Record<string, BalancingDocumentInfo>
  registries: Record<string, { count: number; ids: string[]; documents: string[]; runtimeSources: string[] }>
}

const docs = new Map<string, string>()
const documentInfo: Record<string, BalancingDocumentInfo> = {}
const lineBreak = String.fromCharCode(10)
const block = (...parts: Array<string | readonly string[]>) => parts.flatMap((part) => Array.isArray(part) ? [...part] : [part]).join(lineBreak)
const listOrNone = (items: readonly string[]) => items.length ? items.join(', ') : 'None'
const settingLabel = (key: string) => formatReadableId(key).replace(/ Ms$/, '')
const itemName = (itemId: string) => ITEMS[itemId as ItemId]?.name ?? formatReadableId(itemId)
const dungeonFileName = (id: string) => id === 'whispering-woods' ? 'Whispering_Woods' : id === 'howling-den' ? 'Howling_Den' : 'Abandoned_Catacombs'
const addDoc = (path: string, contents: string, stableIds: readonly string[], runtimeSources: readonly string[]) => {
  docs.set(path, cleanDocument(contents))
  documentInfo[path] = { stableIds: [...stableIds], runtimeSources: [...runtimeSources] }
}
const balanceValue = (key: string, value: unknown): string => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value !== 'number') return String(value)
  if (key.endsWith('Ms') || key.toLowerCase().includes('duration')) return formatDuration(value)
  if (key.toLowerCase().includes('chance') || key.endsWith('Pct') || key.toLowerCase().includes('percent')) return formatPercent(value)
  return formatNumber(value)
}
const balanceRows = (group: Record<string, unknown>, prefix: string) => Object.entries(group).map(([key, value]) => [prefix + '.' + key, settingLabel(key), balanceValue(key, value)])
const sourceText = (item: ItemDefinition) => getItemSourceInfo(item.id).relations.map((relation) => relation.label + ' (' + relation.detail + ')')
const itemStatBullets = (item: ItemDefinition) => bullets(formatItemStats(item))
const materialIds = Object.keys(ITEMS).filter((id) => ITEMS[id as ItemId].kind === 'material') as ItemId[]
const itemIds = Object.keys(ITEMS) as ItemId[]
const equipmentIds = Object.values(EQUIPMENT_BY_DUNGEON).flat()
const spellIds = Object.keys(SPELLS)
const traitIds = Object.keys(TRAIT_DEFINITIONS)
const statusIds = [...STATUS_ORDER]
const recipeIngredients = (recipe: typeof RECIPES[typeof RECIPE_ORDER[number]]) => recipe.ingredients.map((entry) => itemName(entry.itemId) + ' x' + entry.quantity).join(', ') || 'None'
const traitOwners = (traitId: string) => MONSTER_IDS.filter((id) => MONSTERS[id].traitIds.includes(traitId as never)).map((id) => MONSTERS[id].name)

addDoc('README.md', block(
  '# SSS Wizard balancing workbook',
  '',
  'This folder is a human-readable review surface for authored game values. It is organized by design topic so a designer can compare items, enemies, spells, progression, and economy without reading implementation data.',
  '',
  'TypeScript remains the live game source. Markdown is never loaded by the game. To request a balance change, name the document, stable ID, field, proposed value, and reason. Keep stable IDs unchanged.',
  '',
  'The export is manual. Use npm run balancing:export to create missing files. Use npm run balancing:export -- --force only when intentionally refreshing the snapshot. Technical provenance and coverage metadata live in the _System folder.',
  '',
  '## Workbook map',
  '',
  '- Combat: player values, global rules, formulas, statuses, traits, and damage types.',
  '- Dungeons and enemies: progression, quick comparisons, and one readable file per dungeon.',
  '- Items and production: item index, materials, equipment, drops, recipes, and crafting economy.',
  '- Progression and magic: Research, Channeling, Focus, Guild, unlocks, schools, and spells.',
  '- Economy: item values and current activity timings.',
), [], ['scripts/export-balancing-docs.ts', 'src/game/content'])

addDoc('BALANCE_OVERVIEW.md', block(
  '# Balance overview',
  '',
  'This is the starting page for the balancing workbook. Use the index below for the design area you want to review.',
  '',
  '## Coverage at a glance',
  '',
  table(['Domain', 'Authored entries', 'Primary review file'], [
    ['Items', itemIds.length, 'Items/Item_Index.md'],
    ['Equipment', equipmentIds.length, 'Items/Equipment files'],
    ['Monsters', MONSTER_IDS.length, 'Enemies/Enemy_Index.md'],
    ['Dungeons', DUNGEON_ORDER.length, 'Dungeons/Dungeon_Progression.md'],
    ['Recipes', RECIPE_ORDER.length, 'Transmutation/Recipes.md'],
    ['Spells', spellIds.length, 'Magic/Spell_Index.md'],
    ['Statuses', statusIds.length, 'Combat/Status_Effects.md'],
    ['Traits', traitIds.length, 'Combat/Traits_And_Special_Attacks.md'],
  ]),
  '',
  '## Workbook index',
  '',
  '- Combat: Player Base Stats, Global Combat Values, Combat Formulas, Status Effects, Traits and Special Attacks, Damage Types and Resistances.',
  '- Dungeons: Dungeon Progression.',
  '- Enemies: Enemy Index, plus one file per dungeon.',
  '- Items: Item Index, Materials, Boss Relics, plus one equipment file per dungeon.',
  '- Loot and Transmutation: Monster Drops, Boss Drops, Recipes, Crafting Economy.',
  '- Progression: Progression Overview, Research XP, Magic School XP, Channeling, Focus, Guild Progression, Unlock Progression.',
  '- Magic: Spell Index, one file per school, Magic Schools, Auto-Cast and Focus.',
  '- Economy: Item Values, Current Progression Timings.',
), [], ['src/game/core/balance', 'src/game/content'])

addDoc('Combat/Player_Base_Stats.md', block(
  '# Player base stats',
  '',
  'These are the authored starting values used before equipment, progression, and combat modifiers are applied.',
  '',
  table(['Stable setting ID', 'Designer label', 'Value'], balanceRows(BALANCE.player as unknown as Record<string, unknown>, 'player')),
  '',
  'Basic Attack interval is authored in milliseconds and shown above as a readable duration. Chance values are shown as percentages.',
), Object.keys(BALANCE.player).map((key) => 'player.' + key), ['src/game/core/balance/balance.ts'])

const combatBoundRows = [
  ['min resistance', formatSignedPercent(CombatBalance.MIN_RESISTANCE), 'Lowest ordinary resistance value'],
  ['max resistance', formatSignedPercent(CombatBalance.MAX_RESISTANCE), 'Highest ordinary resistance before immunity'],
  ['default enemy Defense', CombatBalance.DEFAULT_ENEMY_DEFENSE, 'Fallback Defense for an enemy without an override'],
  ['default enemy Critical Strike chance', formatPercent(CombatBalance.DEFAULT_ENEMY_CRIT_CHANCE), 'Fallback chance'],
  ['default enemy Critical Strike damage', formatNumber(CombatBalance.DEFAULT_ENEMY_CRIT_DAMAGE_MULTIPLIER) + 'x', 'Fallback multiplier'],
  ['default combat speed', formatNumber(CombatBalance.DEFAULT_COMBAT_SPEED_MULTIPLIER) + 'x', 'Normal action speed'],
  ['Defense curve constant', CombatBalance.DEFENSE_K, 'Constant in the Defense reduction formula'],
  ['maximum Defense reduction', formatPercent(CombatBalance.MAX_DEFENSE_REDUCTION), 'Reduction cap'],
  ['maximum Block chance', formatPercent(CombatBalance.MAX_BLOCK_CHANCE), 'Block chance cap'],
  ['Block damage reduction', formatPercent(CombatBalance.BLOCK_DAMAGE_REDUCTION), 'Damage removed by a successful Block'],
  ['maximum Critical Strike chance', formatPercent(CombatBalance.MAX_CRIT_CHANCE), 'Critical Strike chance cap'],
  ['minimum Critical Strike damage', formatNumber(CombatBalance.MIN_CRIT_DAMAGE_MULTIPLIER) + 'x', 'Multiplier floor'],
  ['maximum Critical Strike damage', formatNumber(CombatBalance.MAX_CRIT_DAMAGE_MULTIPLIER) + 'x', 'Multiplier cap'],
]
addDoc('Combat/Global_Combat_Values.md', block(
  '# Global combat values',
  '',
  '## Core settings',
  '',
  table(['Stable setting ID', 'Designer label', 'Value'], Object.entries(BALANCE).filter(([key]) => key !== 'player').flatMap(([group, values]) => balanceRows(values as unknown as Record<string, unknown>, group))),
  '',
  '## Combat bounds and defaults',
  '',
  table(['Rule', 'Value', 'Meaning'], combatBoundRows),
  '',
  '## Action timing limits',
  '',
  table(['Setting', 'Value'], Object.entries(CombatTiming).filter(([, value]) => typeof value === 'number').map(([key, value]) => [settingLabel(key), key.endsWith('MS') ? formatDuration(value) : formatNumber(value)])),
), Object.entries(BALANCE).filter(([key]) => key !== 'player').flatMap(([group, values]) => Object.keys(values as object).map((key) => group + '.' + key)), ['src/game/core/balance/balance.ts', 'src/game/core/balance/combatStats.ts', 'src/game/core/balance/combatTiming.ts'])

addDoc('Combat/Combat_Formulas.md', block(
  '# Combat formulas',
  '',
  'These formulas describe the live combat order in designer language. The exact named settings are listed in the other Combat workbook pages.',
  '',
  '## Player sheet',
  '',
  '- Max Health = authored base Max Health + equipment Max Health.',
  '- Max Mana = Channeling capacity after equipment and progression bonuses.',
  '- Max Focus = authored capacity plus Focus improvements and other permanent bonuses.',
  '- Spell Power = authored base Spell Power + equipment and combat modifiers.',
  '- Basic Attack damage = authored base Basic Attack damage + equipment Basic Attack damage.',
  '- Basic Attack speed multiplier = clamp(1 + speed modifiers, 0.1, 10).',
  '- Basic Attack interval = authored Basic Attack interval / Basic Attack speed multiplier.',
  '- Critical Strike chance = clamp(base chance + modifiers, 0, the Critical Strike cap).',
  '- Critical Strike damage = clamp(base multiplier + modifiers, 1x, the Critical Strike damage cap).',
  '- Defense = max(0, authored Defense + flat Defense modifiers).',
  '- Defense reduction = min(the Defense reduction cap, Defense / (Defense + the Defense curve constant)).',
  '- Mana cost = max(1, ceil(base cost x (1 - Mana cost reduction))).',
  '- Focus cost = max(1, ceil(base cost x (1 - Focus efficiency))).',
  '',
  '## Damage order',
  '',
  '1. Resolve the authored magnitude.',
  '2. Apply source damage modifiers.',
  '3. Apply Basic Attack, Spell, Melee, Ranged, and Damage over Time modifiers that match.',
  '4. Apply the direct-hit Critical Strike multiplier when the hit can critically strike.',
  "5. Apply the opponent's damage-taken modifiers.",
  '6. Apply Defense reduction to direct damage.',
  '7. Apply resistance: max(0, amount x (1 - resistance)).',
  '8. Apply Block reduction when the Block roll succeeds.',
  '9. Absorb damage with Barrier, then apply the remainder to Health.',
  '',
  'Damage over Time and other non-direct effects do not roll Critical Strike or Block. A multi-part direct hit shares one Critical Strike roll and one Block roll. Immunity is checked before damage is applied. Negative resistance increases damage through the same resistance expression.',
  '',
  '## Timing and statuses',
  '',
  'Authored action and status durations use milliseconds in code and are shown as seconds or minutes here. The simulation update interval is ' + formatDuration(BALANCE.tickMs) + '. Status stacking, cleansing, dispelling, control, and periodic effects are listed in Status Effects.',
), [], ['src/game/systems/combat', 'src/game/core/balance'])

addDoc('Combat/Damage_Types_And_Resistances.md', block(
  '# Damage types and resistances',
  '',
  '## Damage types',
  '',
  table(['Damage type', 'Meaning'], [['physical', 'Physical damage'], ['arcane', 'Arcane damage'], ['fire', 'Fire school damage'], ['water', 'Water school damage'], ['earth', 'Earth damage'], ['air', 'Air school damage']]),
  '',
  '## Resistance rules',
  '',
  '- Ordinary resistance is limited to ' + formatSignedPercent(CombatBalance.MIN_RESISTANCE) + ' through ' + formatSignedPercent(CombatBalance.MAX_RESISTANCE) + '.',
  '- Immunity is authored separately from resistance and prevents that damage type from being applied.',
  '- Mitigated amount = max(0, resolved amount x (1 - resistance)).',
  '',
  '## Authored enemy resistance overview',
  '',
  table(['Enemy', 'Name', 'Physical', 'Arcane', 'Fire', 'Water', 'Earth', 'Air', 'Immunities'], MONSTER_IDS.map((id) => {
    const monster = MONSTERS[id]
    const resistance = monster.resistances ?? {}
    return [id, monster.name, formatSignedPercent(resistance.physical ?? 0), formatSignedPercent(resistance.arcane ?? 0), formatSignedPercent(resistance.fire ?? 0), formatSignedPercent(resistance.water ?? 0), formatSignedPercent(resistance.earth ?? 0), formatSignedPercent(resistance.air ?? 0), listOrNone((monster.damageImmunities ?? []).map(formatReadableId))]
  })),
), [], ['src/game/core/balance/combatStats.ts', 'src/game/content/monsters'])

addDoc('Combat/Status_Effects.md', block(
  '# Status effects',
  '',
  'Each authored status is expanded below so a designer can review its duration, stacking, flags, modifiers, and periodic work.',
  '',
  statusIds.map((id) => {
    const status = STATUS_DEFINITIONS[id]
    return section(status.name, block(
      idLine(status.id),
      '',
      '**Classification:** ' + formatReadableId(status.classification),
      '**Tags:** ' + listOrNone(status.tags.map(formatReadableId)),
      '**Default duration:** ' + formatDuration(status.defaultDurationMs),
      '**Stacking:** ' + formatReadableId(status.stacking.mode) + (status.stacking.maxStacks ? ', up to ' + status.stacking.maxStacks + ' stacks' : '') + (status.stacking.maxDurationMs ? ', maximum ' + formatDuration(status.stacking.maxDurationMs) : ''),
      '**Cleanseable:** ' + (status.cleanseable ? 'Yes' : 'No'),
      '**Dispellable:** ' + (status.dispellable ? 'Yes' : 'No'),
      '**Prevents normal actions:** ' + (status.preventsAction ? 'Yes' : 'No'),
      '',
      status.description,
      '',
      '### Modifiers',
      '',
      bullets((status.modifiers ?? []).map(formatCombatModifier)),
      '',
      '### Periodic work',
      '',
      status.periodic ? 'Every ' + formatDuration(status.periodic.intervalMs) + ': ' + status.periodic.effects.map((effect) => formatCombatEffect(effect, { statusHolder: true })).join('; ') : 'None',
      '',
      '### Trigger rules',
      '',
      bullets((status.triggers ?? []).map(formatCombatRule)),
    ))
  }),
), statusIds, ['src/game/content/statuses/statuses.ts', 'src/game/systems/combat/combatTypes.ts'])

addDoc('Combat/Traits_And_Special_Attacks.md', block(
  '# Traits and special attacks',
  '',
  'Traits are expanded below. Special actions live with their owning enemy in the dungeon files.',
  '',
  traitIds.map((id) => {
    const trait = TRAIT_DEFINITIONS[id]
    return section(trait.name, block(
      idLine(trait.id),
      '',
      '**Owners:** ' + listOrNone(traitOwners(trait.id)),
      '',
      trait.description,
      '',
      '### Modifiers',
      '',
      bullets((trait.modifiers ?? []).map(formatCombatModifier)),
      '',
      '### Trigger rules',
      '',
      bullets((trait.rules ?? []).map(formatCombatRule)),
    ))
  }),
), traitIds, ['src/game/content/traits/traits.ts', 'src/game/systems/combat/combatTypes.ts'])

addDoc('Dungeons/Dungeon_Progression.md', block(
  '# Dungeon progression',
  '',
  table(['Dungeon', 'Name', 'Threat required', 'Boss', 'Encounter delay', 'Unlock', 'Tutorial milestone'], DUNGEON_ORDER.map((id) => {
    const dungeon = DUNGEONS[id]
    return [id, dungeon.name, dungeon.threatRequired, MONSTERS[dungeon.boss].name + ' (' + dungeon.boss + ')', formatDuration(dungeon.encounterDelayMs), dungeon.unlock?.type === 'boss-kill' ? 'Defeat ' + MONSTERS[dungeon.unlock.bossId].name : 'Available from the start', dungeon.completesTutorial ? 'Yes' : 'No']
  })),
), DUNGEON_ORDER, ['src/game/content/dungeons/dungeons.ts'])

for (const dungeonId of DUNGEON_ORDER) {
  const dungeon = DUNGEONS[dungeonId]
  addDoc('Dungeons/' + dungeonFileName(dungeonId) + '.md', block(
    '# ' + dungeon.name,
    '',
    idLine(dungeon.id),
    '',
    dungeon.ui?.description ?? 'No description authored.',
    '',
    table(['Setting', 'Value'], [
      ['Threat required', dungeon.threatRequired],
      ['Boss', MONSTERS[dungeon.boss].name + ' (' + dungeon.boss + ')'],
      ['Encounter delay', formatDuration(dungeon.encounterDelayMs)],
      ['Unlock', dungeon.unlock?.type === 'boss-kill' ? 'Defeat ' + MONSTERS[dungeon.unlock.bossId].name : 'Available from the start'],
      ['Tutorial milestone', dungeon.completesTutorial ? 'Yes' : 'No'],
    ]),
    '',
    '## Normal encounter pool',
    '',
    table(['Enemy ID', 'Name', 'Role'], dungeon.monsterPool.map((id) => [id, MONSTERS[id].name, 'Normal'])),
    '',
    'Boss: ' + MONSTERS[dungeon.boss].name + ' (' + dungeon.boss + ')',
  ), [], ['src/game/content/dungeons/dungeons.ts'])
}

const monsterQuickRows = (ids: readonly string[]) => ids.map((id) => {
  const monster = MONSTERS[id]
  const dungeon = getMonsterDungeon(id as never)
  return [id, monster.name, isBossMonster(monster) ? 'Boss' : 'Normal', dungeon?.dungeonName ?? 'None', monster.maxHealth, monster.basicAttackDamage, formatDuration(monster.basicAttackTimeMs), monster.defense ?? CombatBalance.DEFAULT_ENEMY_DEFENSE]
})
const monsterDetails = (ids: readonly string[]) => ids.map((id) => {
  const monster = MONSTERS[id]
  const traits = monster.traitIds.map((traitId) => {
    const trait = TRAIT_DEFINITIONS[traitId]
    return (trait?.name ?? formatReadableId(traitId)) + ': ' + (trait?.description ?? 'No description authored.')
  })
  const actions = Object.values(monster.actions).map((action) => section(action.name, block(
    idLine(action.id),
    '',
    '**Action time:** ' + formatDuration(action.actionTimeMs),
    '**Tags:** ' + listOrNone((action.tags ?? []).map(formatReadableId)),
    '',
    action.description,
    '',
    '**What it does:** ' + action.effects.map(formatCombatEffect).join('; '),
  ), 4)).join(lineBreak + lineBreak)
  const patterns = Object.values(monster.actionPatterns).map((pattern) => '**' + pattern.id + ':** ' + formatActionPattern(pattern, monster.actions))
  const loot = monster.loot.map((drop) => [drop.itemId, itemName(drop.itemId), drop.min + '-' + drop.max, formatPercent(drop.chance)])
  return section(monster.name + ' (' + monster.id + ')', block(
    monster.subtitle,
    '',
    '### Stats',
    '',
    table(['Stat', 'Value'], [
      ['Role', isBossMonster(monster) ? 'Boss' : 'Normal'],
      ['Max Health', monster.maxHealth],
      ['Basic Attack damage', monster.basicAttackDamage],
      ['Basic Attack time', formatDuration(monster.basicAttackTimeMs)],
      ['Defense', monster.defense ?? CombatBalance.DEFAULT_ENEMY_DEFENSE],
      ['Critical Strike chance', formatPercent(monster.critChance ?? CombatBalance.DEFAULT_ENEMY_CRIT_CHANCE)],
      ['Critical Strike damage', formatNumber(monster.critDamage ?? CombatBalance.DEFAULT_ENEMY_CRIT_DAMAGE_MULTIPLIER) + 'x'],
      ['Block chance', formatPercent(monster.blockChance ?? 0)],
      ['Resistances', Object.entries(monster.resistances ?? {}).map(([type, value]) => formatReadableId(type) + ' ' + formatSignedPercent(value)).join(', ') || 'None'],
      ['Damage immunities', listOrNone((monster.damageImmunities ?? []).map(formatReadableId))],
      ['Status immunities', listOrNone((monster.statusImmunities ?? []).map((statusId) => STATUS_DEFINITIONS[statusId]?.name ?? formatReadableId(statusId)))],
    ]),
    '',
    '### Traits',
    '',
    bullets(traits),
    '',
    '### Action patterns',
    '',
    bullets(patterns),
    '',
    '### Special actions',
    '',
    actions || 'None',
    '',
    '### Loot',
    '',
    table(['Item ID', 'Item', 'Quantity', 'Chance'], loot),
  ), 3)
}).join(lineBreak + lineBreak)

addDoc('Enemies/Enemy_Index.md', block(
  '# Enemy index',
  '',
  'Quick comparison of every authored enemy. Open a dungeon file for traits, action patterns, special actions, and loot.',
  '',
  table(['Enemy ID', 'Name', 'Role', 'Dungeon', 'Max Health', 'Basic Attack', 'Basic Attack time', 'Defense'], monsterQuickRows(MONSTER_IDS)),
), MONSTER_IDS, ['src/game/content/monsters', 'src/game/core/balance/combatStats.ts'])

for (const dungeonId of DUNGEON_ORDER) {
  const ids = [...DUNGEONS[dungeonId].monsterPool, DUNGEONS[dungeonId].boss]
  addDoc('Enemies/' + dungeonFileName(dungeonId) + '.md', block(
    '# ' + DUNGEONS[dungeonId].name + ' enemies',
    '',
    '## Quick comparison',
    '',
    table(['Enemy ID', 'Name', 'Role', 'Max Health', 'Basic Attack', 'Basic Attack time', 'Defense'], monsterQuickRows(ids).map((row) => [row[0], row[1], row[2], row[4], row[5], row[6], row[7]])),
    '',
    '## Enemy details',
    '',
    monsterDetails(ids),
  ), ids, ['src/game/content/monsters', 'src/game/core/balance/combatStats.ts'])
}

addDoc('Items/Item_Index.md', block(
  '# Item index',
  '',
  'Use this compact index to find every authored item. Equipment stats, crafting, and combat effects are expanded in the dungeon equipment files.',
  '',
  table(['Item ID', 'Name', 'Kind', 'Category', 'Source', 'Sell value', 'Can destroy'], itemIds.map((id) => {
    const item = ITEMS[id]
    return [id, item.name, item.kind, formatReadableId(item.category), item.source, item.sellValue === null ? 'Not sellable' : item.sellValue, item.canDestroy ? 'Yes' : 'No']
  })),
), itemIds, ['src/game/content/items/items.ts'])

addDoc('Items/Materials.md', block(
  '# Materials',
  '',
  materialIds.map((id) => {
    const item = ITEMS[id]
    const uses = getItemRecipeUses(id).map((recipe) => recipe.name)
    return section(item.name, block(
      idLine(item.id),
      '',
      '**Category:** ' + formatReadableId(item.category),
      '**Subtype:** ' + formatReadableId(item.materialSubtype ?? 'None'),
      '**Research school:** ' + (item.researchSchool ? SCHOOLS[item.researchSchool].name : 'None'),
      '**Source:** ' + item.source,
      '**Sell value:** ' + (item.sellValue === null ? 'Not sellable' : item.sellValue),
      '',
      item.description,
      '',
      '**Drop and source relationships:** ' + listOrNone(sourceText(item)),
      '**Used by:** ' + listOrNone(uses),
    ))
  }),
), materialIds, ['src/game/content/items/items.ts', 'src/game/content/contentRelations.ts'])

const equipmentDoc = (dungeonId: string, title: string) => {
  const ids = EQUIPMENT_BY_DUNGEON[dungeonId as keyof typeof EQUIPMENT_BY_DUNGEON]
  return {
    path: 'Items/Equipment_' + dungeonFileName(dungeonId) + '.md',
    ids,
    contents: block(
      '# ' + title + ' equipment',
      '',
      ids.map((id) => {
        const item = ITEMS[id]
        const recipe = RECIPES[id as keyof typeof RECIPES]
        return section(item.name, block(
          idLine(item.id),
          '',
          '**Slot:** ' + formatReadableId(item.equipmentSlot ?? 'None'),
          item.weaponHands ? '**Weapon hands:** ' + item.weaponHands : '',
          '**Source:** ' + item.source,
          '**Sell value:** ' + (item.sellValue === null ? 'Not sellable' : item.sellValue),
          '',
          item.description,
          '',
          '### Stats',
          '',
          itemStatBullets(item),
          '',
          '### Crafting',
          '',
          recipe ? block(
            'Output: ' + item.name + ' x' + recipe.output.quantity,
            'Duration: ' + formatDuration(recipe.baseDurationMs),
            'Mana cost: ' + recipe.manaCost,
            'Unlock: ' + formatRecipeUnlock(recipe.unlock),
            'Ingredients: ' + recipeIngredients(recipe),
          ) : 'No transmutation recipe authored.',
          '',
          '### Combat effects',
          '',
          bullets(formatEquipmentEffectSummary(item)),
        ))
      }),
    ),
  }
}
for (const entry of [
  ['whispering-woods', 'Whispering Woods'],
  ['howling-den', 'Howling Den'],
  ['abandoned-catacombs', 'Abandoned Catacombs'],
] as const) {
  const equipment = equipmentDoc(entry[0], entry[1])
  addDoc(equipment.path, equipment.contents, equipment.ids, ['src/game/content/items/items.ts', 'src/game/content/equipment/equipmentSets.ts', 'src/game/content/recipes/recipes.ts'])
}

addDoc('Items/Boss_Relics.md', block(
  '# Boss relics',
  '',
  EQUIPMENT_BOSS_RELIC_IDS.map((id) => {
    const item = ITEMS[id]
    const dungeon = Object.entries(EQUIPMENT_BY_DUNGEON).find(([, ids]) => ids.includes(id))?.[0] ?? 'None'
    return section(item.name, block(
      idLine(item.id),
      '',
      '**Dungeon set:** ' + dungeon,
      '**Direct source:** ' + item.source,
      '**Sell value:** ' + (item.sellValue === null ? 'Not sellable' : item.sellValue),
      '',
      '### Stats',
      '',
      itemStatBullets(item),
      '',
      '### Combat effects',
      '',
      bullets(formatEquipmentEffectSummary(item)),
    ))
  }),
), EQUIPMENT_BOSS_RELIC_IDS, ['src/game/content/items/items.ts', 'src/game/content/equipment/equipmentSets.ts'])

const lootRows = (ids: readonly string[]) => ids.flatMap((monsterId) => MONSTERS[monsterId].loot.map((drop) => [
  monsterId,
  MONSTERS[monsterId].name,
  drop.itemId,
  itemName(drop.itemId),
  drop.min + '-' + drop.max,
  formatPercent(drop.chance),
]))
addDoc('Loot/Monster_Drops.md', block(
  '# Monster drops',
  '',
  'Chance is shown as a percentage. Quantity is the inclusive minimum-to-maximum amount from one successful drop entry.',
  '',
  DUNGEON_ORDER.map((dungeonId) => section(DUNGEONS[dungeonId].name, table(['Enemy ID', 'Enemy', 'Item ID', 'Item', 'Quantity', 'Chance'], lootRows(DUNGEONS[dungeonId].monsterPool)))),
), MONSTER_IDS.filter((id) => !isBossMonster(MONSTERS[id])), ['src/game/content/monsters'])
addDoc('Loot/Boss_Drops.md', block(
  '# Boss drops',
  '',
  DUNGEON_ORDER.map((dungeonId) => {
    const bossId = DUNGEONS[dungeonId].boss
    return section(DUNGEONS[dungeonId].name, table(['Boss ID', 'Boss', 'Item ID', 'Item', 'Quantity', 'Chance'], lootRows([bossId])))
  }),
), DUNGEON_ORDER.map((id) => DUNGEONS[id].boss), ['src/game/content/monsters', 'src/game/content/dungeons/dungeons.ts'])

addDoc('Transmutation/Recipes.md', block(
  '# Transmutation recipes',
  '',
  'Each row describes one output cycle. Ingredient quantities are consumed for one authored output.',
  '',
  table(['Recipe ID', 'Recipe', 'Output', 'Category', 'Duration', 'Mana cost', 'Ingredients', 'Unlock'], RECIPE_ORDER.map((id) => {
    const recipe = RECIPES[id]
    return [id, recipe.name, itemName(recipe.output.itemId) + ' x' + recipe.output.quantity, formatReadableId(recipe.category), formatDuration(recipe.baseDurationMs), recipe.manaCost, recipeIngredients(recipe), formatRecipeUnlock(recipe.unlock)]
  })),
  '',
  'Transmutation is the single item-creation system. Dev Tools grants use the normal acquisition path.',
), RECIPE_ORDER, ['src/game/content/recipes/recipes.ts'])
addDoc('Transmutation/Crafting_Economy.md', block(
  '# Crafting economy',
  '',
  'These comparisons are derived for planning and do not add new runtime values.',
  '',
  table(['Recipe ID', 'Output', 'Ingredient count', 'Duration', 'Mana cost', 'Output per hour'], RECIPE_ORDER.map((id) => {
    const recipe = RECIPES[id]
    return [id, itemName(recipe.output.itemId) + ' x' + recipe.output.quantity, recipe.ingredients.reduce((total, ingredient) => total + ingredient.quantity, 0), formatDuration(recipe.baseDurationMs), recipe.manaCost, formatNumber(recipe.output.quantity * 3_600_000 / recipe.baseDurationMs) + ' output/hour']
  })),
  '',
  'Output per hour assumes one continuously assigned Echo, with no missing ingredients, unlock gates, Mana shortage, or downtime.',
), RECIPE_ORDER, ['src/game/content/recipes/recipes.ts'])

addDoc('Progression/Research_XP.md', block(
  '# Research XP',
  '',
  '## Research settings',
  '',
  table(['Stable setting ID', 'Setting', 'Value'], balanceRows(BALANCE.research as unknown as Record<string, unknown>, 'research')),
  '',
  '## Researchable items',
  '',
  table(['Item ID', 'Item', 'Research school', 'Matching XP', 'Other-school XP'], getResearchableItemIds().map((id) => [id, ITEMS[id].name, SCHOOLS[ITEMS[id].researchSchool!].name, BALANCE.research.matchingXp, BALANCE.research.nonMatchingXp])),
  '',
  '## Activity reference',
  '',
  'One research cycle takes ' + formatDuration(BALANCE.research.durationPerItemMs) + ', costs ' + BALANCE.research.manaCostPerItem + ' Mana, and grants ' + BALANCE.research.matchingXp + ' XP with the matching school or ' + BALANCE.research.nonMatchingXp + ' XP with another school.',
), getResearchableItemIds(), ['src/game/core/balance/balance.ts', 'src/game/content/items/items.ts', 'src/game/content/schools/schools.ts'])

addDoc('Progression/Magic_School_XP.md', block(
  '# Magic School XP',
  '',
  'School XP follows this authored curve:',
  '',
  '**XP needed to start level N:** N x 20 XP.',
  '',
  table(['Level', 'XP to start level'], Array.from({ length: 20 }, (_, index) => [index + 1, SCHOOL_LEVEL_XP(index + 1)])),
  '',
  'The starting school cap is ' + BALANCE.schoolProgression.startingCap + '; after the tutorial milestone it becomes ' + BALANCE.schoolProgression.tutorialCompleteCap + '.',
  '',
  '## Auto-Cast Focus reference',
  '',
  table(['Rank', 'Focus cost'], Array.from({ length: 8 }, (_, index) => [index + 1, getAutoCastFocusCostForRank(index + 1)])),
), ['SCHOOL_LEVEL_XP'].concat(Object.keys(BALANCE.schoolProgression).map((key) => 'schoolProgression.' + key)), ['src/game/core/balance/balance.ts', 'src/game/systems/spells'])

addDoc('Progression/Channeling.md', block(
  '# Channeling',
  '',
  '## Channeling settings',
  '',
  table(['Stable setting ID', 'Setting', 'Value'], balanceRows(BALANCE.channeling as unknown as Record<string, unknown>, 'channeling')),
  '',
  '## Mana pillars',
  '',
  MANA_PILLAR_IDS.map((id) => {
    const pillar = MANA_PILLARS[id]
    const value = pillar.effect.includes('percent') ? pillar.valuePerLevel + '%' : String(pillar.valuePerLevel)
    return section(pillar.name, block(
      idLine(pillar.id),
      '',
      pillar.description,
      '',
      '**Effect:** ' + pillar.effectLabel,
      '**Value per level:** ' + value,
      '**Maximum level:** ' + pillar.maxLevel,
      '**Required fragments:** ' + pillar.fragmentRequirements.map(itemName).join(', '),
    ))
  }),
  '',
  '## Rank I level costs',
  '',
  table(['Level', 'Primary fragment', 'Life Essence'], Object.entries(PILLAR_LEVEL_COSTS).map(([level, cost]) => [level, cost.fragment, cost.lifeEssence])),
  '',
  '## Discoveries',
  '',
  CHANNELING_DISCOVERIES.map((discovery) => section(discovery.name, block(
    idLine(discovery.id),
    '',
    discovery.description,
    '',
    '**Unlock:** ' + discovery.conditionDescription,
    '**Reward:** ' + discovery.rewardDescription,
  ))),
), MANA_PILLAR_IDS.concat(CHANNELING_DISCOVERIES.map((discovery) => discovery.id)), ['src/game/core/balance/balance.ts', 'src/game/content/channeling'])

addDoc('Progression/Focus.md', block(
  '# Focus',
  '',
  '## Focus settings',
  '',
  table(['Stable setting ID', 'Setting', 'Value'], balanceRows(BALANCE.focus as unknown as Record<string, unknown>, 'focus')),
  '',
  '## Focus Capacity improvement',
  '',
  idLine(FOCUS_IMPROVEMENT.id),
  '',
  FOCUS_IMPROVEMENT.description,
  '',
  '**Maximum level:** ' + FOCUS_IMPROVEMENT.maxLevel,
  '**Focus per level:** ' + FOCUS_IMPROVEMENT.focusPerLevel,
  '',
  table(['Level', 'Primary fragment', 'Life Essence'], Object.entries(PILLAR_LEVEL_COSTS).map(([level, cost]) => [level, cost.fragment, cost.lifeEssence])),
  '',
  'Focus reservations and current capacity are derived live from the Focus selectors; this page lists authored inputs only.',
), Object.keys(BALANCE.focus).map((key) => 'focus.' + key).concat(FOCUS_IMPROVEMENT.id), ['src/game/core/balance/balance.ts', 'src/game/content/focus/focusImprovement.ts', 'src/game/content/tower/rankOneUpgradeCosts.ts'])

addDoc('Progression/Guild_Progression.md', block(
  '# Guild progression',
  '',
  Object.values(GUILD_REQUESTS).map((request) => section(request.name, block(
    idLine(request.id),
    '',
    request.description,
    '',
    '**Activity:** ' + formatReadableId(request.kind),
    '**Item:** ' + ('itemId' in request ? itemName(request.itemId) : 'None'),
    '**Required amount:** ' + ('target' in request ? request.target : 'None'),
    '**Reputation reward:** ' + request.reputation,
  ))),
  '',
  'Guild rank, reputation, and live request progress are profile state rather than authored balance values.',
), Object.keys(GUILD_REQUESTS), ['src/game/content/guild/guildRequests.ts'])

addDoc('Progression/Progression_Overview.md', block(
  '# Progression overview',
  '',
  table(['Dungeon', 'Unlock', 'Boss'], DUNGEON_ORDER.map((id) => {
    const dungeon = DUNGEONS[id]
    return [dungeon.name, dungeon.unlock?.type === 'boss-kill' ? 'Defeat ' + MONSTERS[dungeon.unlock.bossId].name : 'Available from the start', MONSTERS[dungeon.boss].name + ' (' + dungeon.boss + ')']
  })),
  '',
  '## Persisted milestones',
  '',
  bullets([
    'firstBossKill - first dungeon boss milestone',
    'firstMainBossKill - legacy Forest Heart milestone',
    'guildUnlocked - Guild feature gate',
    'emberStaffUnlocked - Ember Staff progression marker',
    'forestHeartUnlocked - Forest Heart progression marker',
    'autoHuntBossUnlocked - boss auto-hunt gate',
    'magicLevelCap - current school level ceiling (' + BALANCE.schoolProgression.startingCap + ' initially, ' + BALANCE.schoolProgression.tutorialCompleteCap + ' after the tutorial)',
  ]),
), DUNGEON_ORDER, ['src/game/content/dungeons/dungeons.ts', 'src/game/core/balance/balance.ts'])

const unlockIds = DUNGEON_ORDER.map((id) => 'dungeon:' + id).concat(RECIPE_ORDER.filter((id) => RECIPES[id].unlock.type !== 'always').map((id) => 'recipe:' + id))
addDoc('Progression/Unlock_Progression.md', block(
  '# Unlock progression',
  '',
  table(['Unlock ID', 'Requirement', 'Related content'], DUNGEON_ORDER.map((id) => {
    const dungeon = DUNGEONS[id]
    return ['dungeon:' + id, dungeon.unlock?.type === 'boss-kill' ? 'Defeat ' + MONSTERS[dungeon.unlock.bossId].name : 'Available from the start', dungeon.name]
  }).concat(RECIPE_ORDER.filter((id) => RECIPES[id].unlock.type !== 'always').map((id) => {
    const recipe = RECIPES[id]
    return ['recipe:' + id, formatRecipeUnlock(recipe.unlock), recipe.name]
  }))),
  '',
  'Spell unlock levels are listed in Spell Index; school caps are listed in Magic School XP.',
), unlockIds, ['src/game/content/dungeons/dungeons.ts', 'src/game/content/recipes/recipes.ts'])

const spellEffectText = (spellId: string) => SPELLS[spellId as keyof typeof SPELLS].effects.map(formatCombatEffect).join('; ')
addDoc('Magic/Spell_Index.md', block(
  '# Spell index',
  '',
  table(['Spell ID', 'Spell', 'School', 'Type', 'Unlock level', 'Mana cost', 'Cooldown', 'What it does', 'Auto-Cast'], spellIds.map((id) => {
    const spell = SPELLS[id as keyof typeof SPELLS]
    return [id, spell.name, SCHOOLS[spell.school].name, formatReadableId(spell.type), spell.unlockLevel, spell.manaCost, formatDuration(spell.cooldownMs), spellEffectText(id), formatAutoCastCondition(spell.autoCondition)]
  })),
), spellIds, ['src/game/content/spells/spells.ts'])

for (const schoolId of ['fire', 'water', 'earth', 'air'] as SchoolId[]) {
  const ids = spellIds.filter((id) => SPELLS[id as keyof typeof SPELLS].school === schoolId)
  addDoc('Magic/' + formatReadableId(schoolId).replace(/ /g, '_') + '_Spells.md', block(
    '# ' + SCHOOLS[schoolId].name + ' spells',
    '',
    idLine(schoolId),
    '',
    '**Tagline:** ' + SCHOOLS[schoolId].tagline,
    '**Fragment:** ' + itemName(SCHOOLS[schoolId].fragment) + ' (' + SCHOOLS[schoolId].fragment + ')',
    '',
    ids.map((id) => {
      const spell = SPELLS[id as keyof typeof SPELLS]
      return section(spell.name, block(
        idLine(spell.id),
        '',
        spell.description,
        '',
        '**Type:** ' + formatReadableId(spell.type),
        '**Unlock level:** ' + spell.unlockLevel,
        '**Mana cost:** ' + spell.manaCost,
        '**Cooldown:** ' + formatDuration(spell.cooldownMs),
        '**Auto-Cast:** ' + formatAutoCastCondition(spell.autoCondition),
        '',
        '**What it does:** ' + spellEffectText(id),
      ))
    }),
  ), ids, ['src/game/content/spells/spells.ts', 'src/game/content/schools/schools.ts'])
}

addDoc('Magic/Magic_Schools.md', block(
  '# Magic schools',
  '',
  Object.values(SCHOOLS).map((school) => section(school.name, block(
    idLine(school.id),
    '',
    '**Tagline:** ' + school.tagline,
    '**Fragment:** ' + itemName(school.fragment) + ' (' + school.fragment + ')',
  ))),
  '',
  'School XP and caps are documented in Magic School XP.',
), Object.keys(SCHOOLS), ['src/game/content/schools/schools.ts'])

addDoc('Magic/AutoCast_And_Focus.md', block(
  '# Auto-Cast and Focus',
  '',
  'Auto-Cast spends Focus while an enabled spell waits for its authored trigger.',
  '',
  table(['Spell ID', 'Spell', 'School', 'Auto-Cast trigger'], spellIds.map((id) => {
    const spell = SPELLS[id as keyof typeof SPELLS]
    return [id, spell.name, SCHOOLS[spell.school].name, formatAutoCastCondition(spell.autoCondition)]
  })),
  '',
  '## Rank Focus costs',
  '',
  table(['Rank', 'Focus cost'], Array.from({ length: 8 }, (_, index) => [index + 1, getAutoCastFocusCostForRank(index + 1)])),
), spellIds, ['src/game/content/spells/spells.ts', 'src/game/systems/spells'])

addDoc('Economy/Item_Values.md', block(
  '# Item values',
  '',
  table(['Item ID', 'Item', 'Sell value', 'Can destroy', 'Restriction'], itemIds.map((id) => {
    const item = ITEMS[id]
    return [id, item.name, item.sellValue === null ? 'Not sellable' : item.sellValue, item.canDestroy ? 'Yes' : 'No', item.actionRestrictionReason ?? 'None']
  })),
), itemIds, ['src/game/content/items/items.ts'])

addDoc('Economy/Current_Progression_Timings.md', block(
  '# Current progression timings',
  '',
  table(['Timing', 'Value', 'Meaning'], [
    ['Simulation update interval', formatDuration(BALANCE.tickMs), 'How often the simulation updates'],
    ['Dungeon encounter delay', formatDuration(BALANCE.dungeon.encounterDelayMs), 'Wait between normal encounters'],
    ['Research cycle', formatDuration(BALANCE.research.durationPerItemMs), 'Work time for one researched item before Echo speed'],
    ['Transmutation cycle', 'Per recipe', 'Each recipe lists its own authored duration'],
    ['Echo Resonance discovery', formatDuration(BALANCE.channeling.echoResonanceDurationMs), 'Time required by the discovery'],
  ]),
  '',
  'No completion estimate is made for content gated by player choices, combat outcomes, or available resources.',
), [], ['src/game/core/balance/balance.ts', 'src/game/content/recipes/recipes.ts'])

export const buildBalancingDocuments = (): BalancingDocumentBuild => {
  const registry = (ids: readonly string[], documents: readonly string[], runtimeSources: readonly string[]) => ({
    count: ids.length,
    ids: [...ids],
    documents: [...documents],
    runtimeSources: [...runtimeSources],
  })
  return {
    docs,
    documentInfo,
    registries: {
      items: registry(itemIds, ['Items/Item_Index.md', 'Items/Materials.md'], ['src/game/content/items/items.ts']),
      equipment: registry(equipmentIds, ['Items/Equipment_Whispering_Woods.md', 'Items/Equipment_Howling_Den.md', 'Items/Equipment_Abandoned_Catacombs.md'], ['src/game/content/items/items.ts', 'src/game/content/equipment/equipmentSets.ts']),
      monsters: registry(MONSTER_IDS, ['Enemies/Enemy_Index.md', 'Enemies/Whispering_Woods.md', 'Enemies/Howling_Den.md', 'Enemies/Abandoned_Catacombs.md'], ['src/game/content/monsters']),
      dungeons: registry(DUNGEON_ORDER, ['Dungeons/Dungeon_Progression.md'], ['src/game/content/dungeons/dungeons.ts']),
      recipes: registry(RECIPE_ORDER, ['Transmutation/Recipes.md', 'Transmutation/Crafting_Economy.md'], ['src/game/content/recipes/recipes.ts']),
      spells: registry(spellIds, ['Magic/Spell_Index.md', 'Magic/Fire_Spells.md', 'Magic/Water_Spells.md', 'Magic/Earth_Spells.md', 'Magic/Air_Spells.md'], ['src/game/content/spells/spells.ts']),
      statuses: registry(statusIds, ['Combat/Status_Effects.md'], ['src/game/content/statuses/statuses.ts']),
      traits: registry(traitIds, ['Combat/Traits_And_Special_Attacks.md'], ['src/game/content/traits/traits.ts']),
    },
  }
}
