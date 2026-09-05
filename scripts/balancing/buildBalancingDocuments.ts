import { BALANCE } from '../../src/game/core/balance/balance'
import { SCHOOL_MAX_LEVEL, getSchoolTotalXpForLevel, getSchoolXpToNext } from '../../src/game/core/balance/schoolXpCurve'
import * as CombatBalance from '../../src/game/core/balance/combatStats'
import * as CombatTiming from '../../src/game/core/balance/combatTiming'
import { getItemDropSources, getItemRecipeUses, getMonsterDungeon } from '../../src/game/content/contentRelations'
import { DUNGEONS, DUNGEON_ORDER } from '../../src/game/content/dungeons/dungeons'
import { EQUIPMENT_BOSS_RELIC_IDS, EQUIPMENT_BY_DUNGEON } from '../../src/game/content/equipment/equipmentSets'
import { CHANNELING_DISCOVERIES } from '../../src/game/content/channeling/channelingDiscoveries'
import { MANA_PILLARS, MANA_PILLAR_IDS, PILLAR_LEVEL_COSTS } from '../../src/game/content/channeling/manaPillars'
import { FOCUS_IMPROVEMENT } from '../../src/game/content/focus/focusImprovement'
import { GUILD_REQUESTS } from '../../src/game/content/guild/guildRequests'
import { ITEMS, getResearchableItemIds } from '../../src/game/content/items/items'
import { MONSTERS, MONSTER_IDS, isBossMonster } from '../../src/game/content/monsters'
import { ARTIFICING_RECIPES, ARTIFICING_RECIPE_ORDER } from '../../src/game/content/recipes/artificingRecipes'
import { TRANSMUTATION_RECIPES, TRANSMUTATION_RECIPE_ORDER } from '../../src/game/content/recipes/transmutationRecipes'
import { RECIPES, RECIPE_ORDER } from '../../src/game/content/recipes/recipes'
import { SCHOOLS } from '../../src/game/content/schools/schools'
import { SPELLS } from '../../src/game/content/spells/spells'
import { STATUS_DEFINITIONS, STATUS_ORDER } from '../../src/game/content/statuses/statuses'
import { TRAIT_DEFINITIONS } from '../../src/game/content/traits/traits'
import {
  formatAutoCastCondition,
  formatCompactCombatEffect,
  formatCompactCombatRule,
  formatCompactEquipmentSpecial,
  formatCompactPattern,
  formatCompactTrait,
  formatCombatCondition,
  formatCombatEffect,
  formatCombatModifier,
  formatDuration,
  formatNumber,
  formatPercent,
  formatReadableId,
  formatRecipeUnlock,
  formatSignedPercent,
} from '../../src/game/content/presentation/balanceFormatters'
import { getAutoCastFocusCostForRank } from '../../src/game/systems/spells'
import type { CombatEffect, CombatModifier } from '../../src/game/systems/combat/combatTypes'
import type { ItemDefinition, ItemId, SchoolId } from '../../src/game/types'
import { cleanDocument, table } from './markdown'

export interface BalancingDocumentInfo {
  stableIds: string[]
  runtimeSources: string[]
}

export interface BalancingDocumentBuild {
  docs: Map<string, string>
  documentInfo: Record<string, BalancingDocumentInfo>
  registries: Record<string, { count: number; ids: string[]; documents: string[]; runtimeSources: string[] }>
  invariants: { recipes: number; equipment: number; equipmentRecipeCoverage: number; directEquipmentLoot: number }
  canonicalLocations: Record<string, string>
  mirrors: Record<string, string>
}

const dash = '—'
const newline = String.fromCharCode(10)
const docs = new Map<string, string>()
const documentInfo: Record<string, BalancingDocumentInfo> = {}
const block = (...parts: Array<string | readonly string[]>) => parts.flatMap((part) => Array.isArray(part) ? [...part] : [part]).join(newline)
const nameWithId = (name: string, id: string) => `${name} (${id})`
const itemName = (itemId: string) => ITEMS[itemId as ItemId]?.name ?? formatReadableId(itemId)
const itemWithId = (itemId: string) => nameWithId(itemName(itemId), itemId)
const monsterWithId = (monsterId: string) => nameWithId(MONSTERS[monsterId]?.name ?? formatReadableId(monsterId), monsterId)
const dungeonFileName = (id: string) => id === 'whispering-woods' ? 'Whispering_Woods' : id === 'howling-den' ? 'Howling_Den' : 'Abandoned_Catacombs'
const listOrDash = (items: readonly string[]) => items.length ? items.join(', ') : dash
const formatFlatBonus = (value: number | undefined) => value === undefined ? dash : `${value > 0 ? '+' : ''}${formatNumber(value)}`
const formatPercentBonus = (value: number | undefined) => value === undefined ? dash : formatSignedPercent(value)
const readableSlot = (slot: string | undefined) => slot ? formatReadableId(slot) : dash
const sellValue = (item: ItemDefinition) => item.sellValue === null ? dash : formatNumber(item.sellValue)
const sourceText = (item: ItemDefinition) => item.source || dash
const formatHumanInteger = (value: number) => Math.round(value).toLocaleString('en-US')
const materialTierLabel = (item: ItemDefinition) => item.materialTier === undefined ? dash : `T${item.materialTier}`

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
const balanceRows = (group: Record<string, unknown>) => Object.entries(group).map(([key, value]) => [formatReadableId(key).replace(/ Ms$/, ''), balanceValue(key, value)])
const materialIds = Object.keys(ITEMS).filter((id) => ITEMS[id as ItemId].kind === 'material') as ItemId[]
const itemIds = Object.keys(ITEMS) as ItemId[]
const equipmentIds = Object.values(EQUIPMENT_BY_DUNGEON).flat()
const spellIds = Object.keys(SPELLS)
const traitIds = Object.keys(TRAIT_DEFINITIONS)
const statusIds = [...STATUS_ORDER]
const damageTypes = ['physical', 'arcane', 'fire', 'water', 'earth', 'air'] as const
const enemyCoreColumns = ['Enemy', 'Type', 'HP', 'Basic Dmg', 'Attack', 'DEF', 'Crit', 'Crit Dmg', 'Block', 'Phys Res', 'Arc Res', 'Fire Res', 'Water Res', 'Earth Res', 'Air Res', 'Damage Immune', 'Status Immune'] as const
const equipmentStatColumns = ['Item', 'Slot', 'Hands', 'HP', 'Mana', 'Mana Regen', 'Focus', 'Spell Power', 'Basic Dmg', 'Basic AS', 'Crit', 'Crit Dmg', 'DEF', 'Block', 'Phys Res', 'Arc Res', 'Fire Res', 'Water Res', 'Earth Res', 'Air Res', 'CDR', 'Mana Cost', 'Status Dur', 'Neg Status Dur', 'Healing', 'Barrier', 'DoT', 'Fire Spell', 'Water Spell', 'Earth Spell', 'Air Spell', 'Special Effect', 'Sell'] as const

const getResistance = (monster: typeof MONSTERS[string], damageType: string) => monster.resistances?.[damageType as keyof typeof monster.resistances] ?? 0
const formatDamageImmunities = (monster: typeof MONSTERS[string]) => listOrDash((monster.damageImmunities ?? []).map(formatReadableId))
const formatStatusImmunities = (monster: typeof MONSTERS[string]) => listOrDash([
  ...(monster.statusImmunities ?? []).map((id) => STATUS_DEFINITIONS[id]?.name ?? formatReadableId(id)),
  ...(monster.statusTagImmunities ?? []).map((tag) => `${formatReadableId(tag)} statuses`),
])
const formatImmunities = (monster: typeof MONSTERS[string]) => listOrDash([
  ...(monster.damageImmunities ?? []).map(formatReadableId),
  ...(monster.statusImmunities ?? []).map((id) => STATUS_DEFINITIONS[id]?.name ?? formatReadableId(id)),
  ...(monster.statusTagImmunities ?? []).map((tag) => `${formatReadableId(tag)} statuses`),
])

export const buildEnemyCoreRow = (monsterId: string) => {
  const monster = MONSTERS[monsterId]
  return [
    monsterWithId(monsterId),
    isBossMonster(monster) ? 'Boss' : 'Normal',
    formatNumber(monster.maxHealth),
    formatNumber(monster.basicAttackDamage),
    formatDuration(monster.basicAttackTimeMs),
    formatNumber(monster.defense ?? CombatBalance.DEFAULT_ENEMY_DEFENSE),
    formatPercent(monster.critChance ?? CombatBalance.DEFAULT_ENEMY_CRIT_CHANCE),
    formatPercent(monster.critDamage ?? CombatBalance.DEFAULT_ENEMY_CRIT_DAMAGE_MULTIPLIER),
    formatPercent(monster.blockChance ?? 0),
    ...damageTypes.map((damageType) => formatSignedPercent(getResistance(monster, damageType))),
    formatDamageImmunities(monster),
    formatStatusImmunities(monster),
  ]
}

const traitText = (traitId: string) => {
  const trait = TRAIT_DEFINITIONS[traitId]
  return trait ? `${trait.name}: ${formatCompactTrait(trait)}` : formatReadableId(traitId)
}
export const buildEnemyTraitRow = (monsterId: string) => {
  const monster = MONSTERS[monsterId]
  const traits = monster.traitIds.map(traitText)
  const patterns = Object.values(monster.actionPatterns)
  const defaultPattern = monster.actionPatterns[monster.defaultActionPatternId]
  const alternatePatterns = patterns.filter((pattern) => pattern.id !== monster.defaultActionPatternId)
  const rules = monster.traitIds.flatMap((traitId) => TRAIT_DEFINITIONS[traitId]?.rules ?? [])
  return [monsterWithId(monsterId), traits[0] ?? dash, traits[1] ?? dash, listOrDash(rules.map(formatCompactCombatRule)), defaultPattern ? formatCompactPattern(defaultPattern, monster.actions) : dash, listOrDash(alternatePatterns.map((pattern) => `${formatReadableId(pattern.id)}: ${formatCompactPattern(pattern, monster.actions)}`))]
}

const actionEffects = (action: { effects: CombatEffect[] }, predicate: (effect: CombatEffect) => boolean) => action.effects.filter(predicate).map((effect) => formatCompactCombatEffect(effect)).join(' + ')
const actionDamageTypes = (action: { effects: CombatEffect[] }) => [...new Set(action.effects.flatMap((effect) => effect.type === 'deal-damage' ? effect.components.map((component) => formatReadableId(component.damageType)) : []))].join(' + ') || dash
const actionDurations = (action: { effects: CombatEffect[] }) => action.effects.flatMap((effect) => {
  if (effect.type === 'apply-status') return [effect.durationMs ?? STATUS_DEFINITIONS[effect.statusId]?.defaultDurationMs]
  if (effect.type === 'gain-barrier') return [effect.durationMs]
  return []
}).filter((value): value is number => typeof value === 'number').map(formatDuration).join(', ') || dash
const actionPatternNote = (monster: typeof MONSTERS[string], actionId: string) => Object.values(monster.actionPatterns).flatMap((pattern) => {
  const positions = pattern.steps.flatMap((step, index) => step.type === 'action' && step.actionId === actionId ? [index + 1] : [])
  return positions.length ? [`${formatReadableId(pattern.id)}: step ${positions.join(', ')}`] : []
}).join('; ') || dash
export const buildEnemyActionRows = (monsterIds: readonly string[]) => monsterIds.flatMap((monsterId) => {
  const monster = MONSTERS[monsterId]
  return Object.values(monster.actions).map((action) => [monsterWithId(monsterId), nameWithId(action.name, action.id), formatDuration(action.actionTimeMs), actionEffects(action, (effect) => effect.type === 'deal-damage') || dash, actionDamageTypes(action), actionEffects(action, (effect) => effect.type !== 'deal-damage') || dash, actionDurations(action), dash, actionPatternNote(monster, action.id)])
})
export const buildEnemyLootRows = (monsterIds: readonly string[]) => monsterIds.flatMap((monsterId) => {
  const monster = MONSTERS[monsterId]
  return monster.loot.map((drop) => [monsterWithId(monsterId), itemWithId(drop.itemId), formatNumber(drop.min), formatNumber(drop.max), formatPercent(drop.chance), formatNumber(((drop.min + drop.max) / 2) * drop.chance)])
})

const dropRowsForItem = (itemId: ItemId) => getItemDropSources(itemId).map((drop) => ({ ...drop, average: (drop.min + drop.max) / 2, expected: ((drop.min + drop.max) / 2) * drop.chance }))
const modifierValue = (item: ItemDefinition, key: CombatModifier['key'], damageType?: string) => {
  const values = (item.combat?.modifiers ?? []).filter((modifier) => modifier.key === key && (!damageType || modifier.damageTypes?.includes(damageType as never))).map((modifier) => modifier.value)
  return values.length ? values.reduce((sum, value) => sum + value, 0) : undefined
}
const equipmentResistance = (item: ItemDefinition, damageType: string) => item.stats?.resistances?.[damageType as keyof NonNullable<ItemDefinition['stats']>['resistances']]
const equipmentCrafting = (itemId: string) => ARTIFICING_RECIPES[itemId as keyof typeof ARTIFICING_RECIPES]
const equipmentRecipeCoverage = equipmentIds.filter((itemId) => Object.values(ARTIFICING_RECIPES).filter((recipe) => recipe.output.itemId === itemId && recipe.output.quantity === 1).length === 1).length
const directEquipmentLoot = MONSTER_IDS.reduce((count, monsterId) => count + MONSTERS[monsterId].loot.filter((drop) => ITEMS[drop.itemId]?.kind === 'equipment').length, 0)
const balancingInvariants = { recipes: RECIPE_ORDER.length, equipment: equipmentIds.length, equipmentRecipeCoverage, directEquipmentLoot }

export const buildEquipmentStatRow = (itemId: string) => {
  const item = ITEMS[itemId as ItemId]
  const stats = item.stats ?? {}
  return [itemWithId(itemId), readableSlot(item.equipmentSlot), item.weaponHands ? `${item.weaponHands}H` : dash, formatFlatBonus(stats.maxHealth), formatFlatBonus(stats.maxMana), formatFlatBonus(stats.manaRegen), formatFlatBonus(stats.maxFocus), formatFlatBonus(stats.spellPower), formatFlatBonus(stats.basicDamage), formatPercentBonus(stats.basicAttackSpeedPct), formatPercentBonus(stats.critChance), formatPercentBonus(stats.critDamage), formatFlatBonus(stats.defense), formatPercentBonus(stats.blockChance), ...damageTypes.map((damageType) => formatPercentBonus(equipmentResistance(item, damageType))), formatPercentBonus(stats.cooldownRecoveryPct), stats.manaCostReductionPct === undefined ? dash : formatSignedPercent(-stats.manaCostReductionPct), formatPercentBonus(stats.statusDurationPct), formatPercentBonus(modifierValue(item, 'status-duration-received-percent')), formatPercentBonus(stats.healingDonePct), formatPercentBonus(stats.barrierPowerPct), formatPercentBonus(stats.damageOverTimePct), ...(['fire', 'water', 'earth', 'air'] as const).map((damageType) => formatPercentBonus(modifierValue(item, 'spell-damage-percent', damageType))), formatCompactEquipmentSpecial(item) || dash, sellValue(item)]
}

const ingredientCells = (recipe: { ingredients: readonly { itemId: ItemId; quantity: number }[] }, max = 5) => Array.from({ length: max }, (_, index) => {
  const ingredient = recipe.ingredients[index]
  return ingredient ? [itemWithId(ingredient.itemId), formatNumber(ingredient.quantity)] : [dash, dash]
}).flat()
export const buildEquipmentCraftingRow = (itemId: string) => {
  const recipe = equipmentCrafting(itemId)
  return recipe ? [itemWithId(itemId), ...ingredientCells(recipe), formatRecipeUnlock(recipe.unlock)] : [itemWithId(itemId), ...ingredientCells({ ingredients: [] }), dash]
}
const recipeColumns = ['Recipe', 'Output Qty', 'Time', 'Mana', 'Ingredient 1', 'Qty 1', 'Ingredient 2', 'Qty 2', 'Ingredient 3', 'Qty 3', 'Ingredient 4', 'Qty 4', 'Ingredient 5', 'Qty 5', 'Unlock']
const recipeRows = (recipeIds: readonly string[]) => recipeIds.map((id) => { const recipe = TRANSMUTATION_RECIPES[id as keyof typeof TRANSMUTATION_RECIPES]; return [nameWithId(recipe.name, recipe.id), formatNumber(recipe.output.quantity), formatDuration(recipe.baseDurationMs), formatNumber(recipe.manaCost), ...ingredientCells(recipe), formatRecipeUnlock(recipe.unlock)] })

const compactSpellEffects = (spellId: string) => SPELLS[spellId as keyof typeof SPELLS].effects
const spellEffectsOfType = (spellId: string, type: CombatEffect['type']) => compactSpellEffects(spellId).filter((effect) => effect.type === type)
const spellDamageText = (spellId: string) => spellEffectsOfType(spellId, 'deal-damage').map((effect) => formatCompactCombatEffect(effect)).join(' + ') || dash
const spellDamageType = (spellId: string) => [...new Set(spellEffectsOfType(spellId, 'deal-damage').flatMap((effect) => effect.type === 'deal-damage' ? effect.components.map((component) => formatReadableId(component.damageType)) : []))].join(' + ') || dash
const spellBarrierText = (spellId: string) => spellEffectsOfType(spellId, 'gain-barrier').map((effect) => formatCompactCombatEffect(effect)).join('; ') || dash
const spellHealText = (spellId: string) => spellEffectsOfType(spellId, 'heal').map((effect) => formatCompactCombatEffect(effect)).join('; ') || dash
const spellStatusEffects = (spellId: string) => spellEffectsOfType(spellId, 'apply-status')
const spellStatusText = (spellId: string) => spellStatusEffects(spellId).map((effect) => formatCompactCombatEffect(effect)).join('; ') || dash
const spellStatusDuration = (spellId: string) => spellStatusEffects(spellId).map((effect) => effect.type === 'apply-status' ? formatDuration(effect.durationMs ?? STATUS_DEFINITIONS[effect.statusId]?.defaultDurationMs) : dash).join('; ') || dash
const spellDotText = (spellId: string) => spellStatusEffects(spellId).flatMap((effect) => effect.type === 'apply-status' ? (effect.periodicEffects ?? []) : []).map((effect) => formatCompactCombatEffect(effect)).join('; ') || dash
export const buildSpellBalanceRow = (spellId: string) => {
  const spell = SPELLS[spellId as keyof typeof SPELLS]
  return [nameWithId(spell.name, spell.id), SCHOOLS[spell.school].name, 'Rank I', formatNumber(spell.unlockLevel), formatNumber(spell.manaCost), formatDuration(spell.cooldownMs), dash, spellDamageText(spellId), spellDamageType(spellId), spellBarrierText(spellId), spellHealText(spellId), spellStatusText(spellId), dash, spellStatusDuration(spellId), spellDotText(spellId), dash, `${formatReadableId(spell.type)}; Auto-Cast: ${formatAutoCastCondition(spell.autoCondition)}`]
}

const enemyIdsForDungeon = (dungeonId: string) => [...DUNGEONS[dungeonId as keyof typeof DUNGEONS].monsterPool, DUNGEONS[dungeonId as keyof typeof DUNGEONS].boss]
const recipeDungeon = (recipeId: string) => ARTIFICING_RECIPES[recipeId as keyof typeof ARTIFICING_RECIPES]?.sourceDungeonId

addDoc('README.md', block(
  '# SSS Wizard balancing workbook', '',
  'This is a spreadsheet-oriented review surface for authored game values. Open a topic, compare rows in the first tables, and edit the canonical table named in the system manifest.', '',
  'TypeScript remains the live game source. Markdown is never loaded by the game. Keep stable content IDs unchanged when proposing a balance edit.', '',
  'Use npm run balancing:export to create missing files. Use npm run balancing:export -- --force only when intentionally refreshing the snapshot. Technical provenance, canonical locations, mirrors, and coverage live in the _System folder.', '',
  '## Workbook map', '',
  '- Combat: player values, formulas, statuses, traits, and damage types.',
  '- Enemies: one comparison page per dungeon with combat, traits, actions, and loot sheets.',
  '- Items and production: item index, materials, equipment, drops, recipes, and crafting economy.',
  '- Progression and magic: Research, Channeling, Focus, Guild, unlocks, schools, and spells.',
  '- Economy: item values and current activity timings.',
), [], ['scripts/export-balancing-docs.ts', 'src/game/content'])
addDoc('BALANCE_OVERVIEW.md', block(
  '# Balance overview', '',
  'Start with the wide table for the system you want to compare. Detail notes are intentionally short and secondary to the sheets.', '',
  table(['Domain', 'Authored entries', 'Primary sheet'], [['Items', itemIds.length, 'Items/Item_Index.md'], ['Equipment', equipmentIds.length, 'Items/Equipment files'], ['Monsters', MONSTER_IDS.length, 'Enemies/Enemy_Index.md'], ['Dungeons', DUNGEON_ORDER.length, 'Dungeons/Dungeon_Progression.md'], ['Transmutation recipes', TRANSMUTATION_RECIPE_ORDER.length, 'Transmutation/Recipes.md'], ['Artificing recipes', ARTIFICING_RECIPE_ORDER.length, 'Artificing/Recipes.md'], ['Spells', spellIds.length, 'Magic/Spell_Index.md'], ['Statuses', statusIds.length, 'Combat/Status_Effects.md'], ['Traits', traitIds.length, 'Combat/Traits_And_Special_Attacks.md']]), '',
  '## Acquisition invariants', '',
  table(['Invariant', 'Current'], [['Recipes', balancingInvariants.recipes], ['Equipment', balancingInvariants.equipment], ['Equipment recipe coverage', `${balancingInvariants.equipmentRecipeCoverage}/${balancingInvariants.equipment}`], ['Direct Equipment loot', balancingInvariants.directEquipmentLoot]]), '',
  'Canonical editing locations and generated comparison mirrors are listed in _System/balance-manifest.json.',
), [], ['src/game/core/balance', 'src/game/content'])

addDoc('Combat/Player_Base_Stats.md', block('# Player base stats', '', table(['Setting', 'Value'], balanceRows(BALANCE.player as unknown as Record<string, unknown>))), Object.keys(BALANCE.player).map((key) => 'player.' + key), ['src/game/core/balance/balance.ts'])
const combatBoundRows = [['Minimum resistance', formatSignedPercent(CombatBalance.MIN_RESISTANCE), 'Ordinary resistance floor'], ['Maximum resistance', formatSignedPercent(CombatBalance.MAX_RESISTANCE), 'Ordinary resistance cap'], ['Default enemy Defense', formatNumber(CombatBalance.DEFAULT_ENEMY_DEFENSE), 'Fallback Defense'], ['Default enemy Crit', formatPercent(CombatBalance.DEFAULT_ENEMY_CRIT_CHANCE), 'Fallback chance'], ['Default enemy Crit Dmg', formatPercent(CombatBalance.DEFAULT_ENEMY_CRIT_DAMAGE_MULTIPLIER), 'Fallback multiplier'], ['Default combat speed', formatNumber(CombatBalance.DEFAULT_COMBAT_SPEED_MULTIPLIER) + 'x', 'Normal action speed'], ['Defense curve constant', formatNumber(CombatBalance.DEFENSE_K), 'Defense formula constant'], ['Maximum Defense reduction', formatPercent(CombatBalance.MAX_DEFENSE_REDUCTION), 'Reduction cap'], ['Maximum Block chance', formatPercent(CombatBalance.MAX_BLOCK_CHANCE), 'Block cap'], ['Block damage reduction', formatPercent(CombatBalance.BLOCK_DAMAGE_REDUCTION), 'Successful Block reduction'], ['Maximum Crit chance', formatPercent(CombatBalance.MAX_CRIT_CHANCE), 'Crit cap'], ['Minimum Crit Dmg', formatPercent(CombatBalance.MIN_CRIT_DAMAGE_MULTIPLIER), 'Crit multiplier floor'], ['Maximum Crit Dmg', formatPercent(CombatBalance.MAX_CRIT_DAMAGE_MULTIPLIER), 'Crit multiplier cap']]
addDoc('Combat/Global_Combat_Values.md', block('# Global combat values', '', '## Core values', '', table(['Setting', 'Value'], Object.entries(BALANCE).filter(([key]) => key !== 'player').flatMap(([, values]) => balanceRows(values as unknown as Record<string, unknown>))), '', '## Combat bounds', '', table(['Rule', 'Value', 'Use'], combatBoundRows), '', '## Action timing limits', '', table(['Setting', 'Value'], Object.entries(CombatTiming).filter(([, value]) => typeof value === 'number').map(([key, value]) => [formatReadableId(key), key.endsWith('MS') ? formatDuration(value) : formatNumber(value)]))), Object.entries(BALANCE).filter(([key]) => key !== 'player').flatMap(([group, values]) => Object.keys(values as object).map((key) => group + '.' + key)), ['src/game/core/balance/balance.ts', 'src/game/core/balance/combatStats.ts', 'src/game/core/balance/combatTiming.ts'])
addDoc('Combat/Combat_Formulas.md', block('# Combat formulas', '', 'These are short mechanic notes for rules that do not belong in an editable value sheet.', '', table(['Order', 'Calculation'], [['1', 'Resolve the authored magnitude.'], ['2', 'Apply matching source, attack, spell, school, and damage-over-time modifiers.'], ['3', 'Apply direct-hit Crit when the hit can critically strike.'], ['4', 'Apply the opponent damage-taken modifiers.'], ['5', 'Apply Defense reduction, resistance, and Block.'], ['6', 'Absorb damage with Barrier, then apply the remainder to Health.']]), '', 'Damage over Time and other non-direct effects do not roll Crit or Block. A multi-part direct hit shares one Crit roll and one Block roll. Immunity is checked before damage is applied.', '', table(['Timing', 'Value'], [['Simulation update interval', formatDuration(BALANCE.tickMs)], ['Basic Attack interval formula', 'Authored interval / final speed multiplier'], ['Mana cost floor', '1'], ['Focus cost floor', '1']])), [], ['src/game/systems/combat', 'src/game/core/balance'])
addDoc('Combat/Damage_Types_And_Resistances.md', block('# Damage types and resistances', '', table(['Damage Type', 'Meaning'], damageTypes.map((type) => [formatReadableId(type), `${formatReadableId(type)} damage`])), '', table(['Enemy', 'Physical', 'Arcane', 'Fire', 'Water', 'Earth', 'Air', 'Immunities'], MONSTER_IDS.map((id) => [monsterWithId(id), ...damageTypes.map((type) => formatSignedPercent(getResistance(MONSTERS[id], type))), formatImmunities(MONSTERS[id])]))), [], ['src/game/core/balance/combatStats.ts', 'src/game/content/monsters'])

const statusModifier = (statusId: string, key: CombatModifier['key']) => { const values = (STATUS_DEFINITIONS[statusId].modifiers ?? []).filter((modifier) => modifier.key === key).map((modifier) => modifier.value); return values.length ? formatSignedPercent(values.reduce((sum, value) => sum + value, 0)) : dash }
const statusPeriodicDamage = (statusId: string) => STATUS_DEFINITIONS[statusId].periodic?.effects.filter((effect) => effect.type === 'deal-damage').map(formatCompactCombatEffect).join('; ') || dash
const statusDamageType = (statusId: string) => [...new Set((STATUS_DEFINITIONS[statusId].periodic?.effects ?? []).flatMap((effect) => effect.type === 'deal-damage' ? effect.components.map((component) => formatReadableId(component.damageType)) : []))].join(' + ') || dash
export const buildStatusRow = (statusId: string) => {
  const status = STATUS_DEFINITIONS[statusId]
  const speed = (status.modifiers ?? []).filter((modifier) => modifier.key === 'basic-attack-speed-percent' || modifier.key === 'action-speed-percent').map(formatCombatModifier).join('; ') || dash
  const healing = (status.modifiers ?? []).filter((modifier) => modifier.key === 'healing-done-percent' || modifier.key === 'healing-received-percent').map(formatCombatModifier).join('; ') || dash
  const barrier = (status.modifiers ?? []).filter((modifier) => modifier.key === 'barrier-power-percent' || modifier.key === 'barrier-received-flat' || modifier.key === 'barrier-received-percent').map(formatCombatModifier).join('; ') || dash
  return [nameWithId(status.name, status.id), formatReadableId(status.classification), status.classification === 'buff' ? 'Buff' : status.classification === 'debuff' ? 'Debuff' : 'Neutral', formatDuration(status.defaultDurationMs), status.periodic ? formatDuration(status.periodic.intervalMs) : dash, status.stacking.maxStacks ? formatNumber(status.stacking.maxStacks) : dash, statusPeriodicDamage(statusId), statusDamageType(statusId), speed, statusModifier(statusId, 'damage-taken-percent'), statusModifier(statusId, 'damage-dealt-percent'), statusModifier(statusId, 'defense-flat'), healing, barrier, status.preventsAction || status.tags.includes('control') ? 'Control' : dash, status.cleanseable ? 'Yes' : 'No', status.dispellable ? 'Yes' : 'No', [status.description, `Stacking: ${formatReadableId(status.stacking.mode)}`, status.preventsAction ? 'Prevents normal actions' : ''].filter(Boolean).join('; ')]
}
addDoc('Combat/Status_Effects.md', block('# Status effects', '', table(['Status', 'Type', 'Buff / Debuff', 'Duration', 'Tick', 'Max Stacks', 'Damage / Tick', 'Damage Type', 'Speed', 'Damage Taken', 'Damage Dealt', 'Defense', 'Healing', 'Barrier', 'Control', 'Cleanse?', 'Dispel?', 'Notes'], statusIds.map(buildStatusRow))), statusIds, ['src/game/content/statuses/statuses.ts', 'src/game/systems/combat/combatTypes.ts'])

const traitTrigger = (trait: typeof TRAIT_DEFINITIONS[string]) => trait.rules?.map(formatCompactCombatRule).join('; ') || dash
const traitThreshold = (trait: typeof TRAIT_DEFINITIONS[string]) => trait.rules?.map((rule) => rule.condition ? formatCombatCondition(rule.condition) : '').filter(Boolean).join('; ') || dash
const traitEffect = (trait: typeof TRAIT_DEFINITIONS[string]) => [trait.description, ...(trait.rules ?? []).flatMap((rule) => rule.effects.map(formatCompactCombatEffect))].join('; ')
const traitValues = (trait: typeof TRAIT_DEFINITIONS[string]) => [...(trait.modifiers ?? []).map(formatCombatModifier), ...(trait.rules ?? []).flatMap((rule) => rule.effects.map(formatCompactCombatEffect))].join('; ') || dash
addDoc('Combat/Traits_And_Special_Attacks.md', block('# Traits and special attacks', '', '## Traits', '', table(['Trait', 'Used By', 'Trigger', 'Threshold', 'Effect', 'Value', 'Cooldown', 'Once?'], traitIds.map((id) => { const trait = TRAIT_DEFINITIONS[id]; const rules = trait.rules ?? []; return [nameWithId(trait.name, trait.id), listOrDash(MONSTER_IDS.filter((monsterId) => MONSTERS[monsterId].traitIds.includes(id as never)).map(monsterWithId)), traitTrigger(trait), traitThreshold(trait), traitEffect(trait), traitValues(trait), listOrDash(rules.filter((rule) => rule.cooldownMs).map((rule) => formatDuration(rule.cooldownMs))), rules.some((rule) => rule.oncePerEncounter) ? 'Yes' : 'No'] })), '', '## Special Actions', '', table(['Action', 'Used By', 'Cast', 'Damage', 'Type', 'Status', 'Duration', 'Other Effect', 'Pattern Position'], buildEnemyActionRows(MONSTER_IDS).map((row) => [row[1], row[0], row[2], row[3], row[4], row[5], row[6], row[5], row[8]]))), traitIds, ['src/game/content/traits/traits.ts', 'src/game/content/monsters', 'src/game/systems/combat/combatTypes.ts'])

addDoc('Dungeons/Dungeon_Progression.md', block('# Dungeon progression', '', table(['Dungeon', 'Unlock Requirement', 'Normal Enemies', 'Boss', 'Threat / Requirement', 'Completion Unlock', 'Major Reward'], DUNGEON_ORDER.map((id) => { const dungeon = DUNGEONS[id]; const unlock = dungeon.unlock?.type === 'boss-kill' ? `Defeat ${monsterWithId(dungeon.unlock.bossId)}` : 'Available from the start'; return [nameWithId(dungeon.name, id), unlock, listOrDash(dungeon.monsterPool.map(monsterWithId)), monsterWithId(dungeon.boss), formatNumber(dungeon.threatRequired), dungeon.unlock?.type === 'boss-kill' ? `Unlock ${dungeon.name}` : 'Guild + first progression markers', dungeon.completesTutorial ? 'Raise School cap' : 'Dungeon completion'] }))), DUNGEON_ORDER, ['src/game/content/dungeons/dungeons.ts'])
for (const dungeonId of DUNGEON_ORDER) { const dungeon = DUNGEONS[dungeonId]; addDoc('Dungeons/' + dungeonFileName(dungeonId) + '.md', block('# ' + dungeon.name, '', table(['Setting', 'Value'], [['Dungeon', nameWithId(dungeon.name, dungeon.id)], ['Threat / Requirement', formatNumber(dungeon.threatRequired)], ['Boss', monsterWithId(dungeon.boss)], ['Encounter delay', formatDuration(dungeon.encounterDelayMs)], ['Unlock', dungeon.unlock?.type === 'boss-kill' ? `Defeat ${monsterWithId(dungeon.unlock.bossId)}` : 'Available from the start']]), '', '## Normal Enemies', '', table(['Enemy', 'Type'], dungeon.monsterPool.map((id) => [monsterWithId(id), 'Normal']))), [], ['src/game/content/dungeons/dungeons.ts']) }

addDoc('Enemies/Enemy_Index.md', block('# Enemy index', '', 'Global comparison sheet. The dungeon pages are the canonical editing locations for the same core values, traits, actions, and loot.', '', table(['Enemy', 'Dungeon', 'Type', ...enemyCoreColumns.slice(2, 15)], MONSTER_IDS.map((id) => { const core = buildEnemyCoreRow(id); const dungeon = getMonsterDungeon(id as never); return [core[0], dungeon?.dungeonName ?? dash, core[1], ...core.slice(2, 15)] }))), MONSTER_IDS, ['src/game/content/monsters', 'src/game/core/balance/combatStats.ts'])
for (const dungeonId of DUNGEON_ORDER) { const ids = enemyIdsForDungeon(dungeonId); const dungeon = DUNGEONS[dungeonId]; addDoc('Enemies/' + dungeonFileName(dungeonId) + '.md', block('# ' + dungeon.name + ' enemies', '', '## Core Combat Stats', '', table([...enemyCoreColumns], ids.map(buildEnemyCoreRow)), '', '## Traits & Patterns', '', table(['Enemy', 'Trait 1', 'Trait 2', 'Phase / Trigger', 'Default Pattern', 'Alt Pattern'], ids.map(buildEnemyTraitRow)), '', '## Special Actions', '', table(['Enemy', 'Action', 'Cast', 'Damage', 'Damage Type', 'Status / Effect', 'Duration', 'Delay', 'Pattern Note'], buildEnemyActionRows(ids)), '', '## Loot', '', table(['Enemy', 'Item', 'Min', 'Max', 'Chance', 'Est. Qty / Kill'], buildEnemyLootRows(ids)), '', 'Boss mechanics are represented by the Core Combat Stats, Traits & Patterns, and Special Actions sheets above.'), ids, ['src/game/content/monsters', 'src/game/core/balance/combatStats.ts']) }

addDoc('Items/Item_Index.md', block('# Item index', '', table(['Item', 'ID', 'Type', 'Subtype / Slot', 'Dungeon / Tier', 'Source', 'Sell', 'Destroy'], itemIds.map((id) => { const item = ITEMS[id]; const origin = Object.entries(EQUIPMENT_BY_DUNGEON).find(([, ids]) => ids.includes(id))?.[0]; return [item.name, id, item.kind === 'equipment' ? 'Equipment' : 'Material', item.kind === 'equipment' ? readableSlot(item.equipmentSlot) : formatReadableId(item.materialSubtype ?? item.category), origin ? DUNGEONS[origin].name : dash, sourceText(item), sellValue(item), item.canDestroy ? 'Yes' : 'No'] }))), itemIds, ['src/game/content/items/items.ts', 'src/game/content/equipment/equipmentSets.ts'])
const materialDropRows = materialIds.flatMap((id) => dropRowsForItem(id))
addDoc('Items/Materials.md', block('# Materials', '', table(['Material', 'Type', 'Dungeon / Tier', 'Primary Source', 'Min Drop', 'Max Drop', 'Chance Range', 'Sell', 'Recipes Using'], materialIds.map((id) => { const item = ITEMS[id]; const drops = dropRowsForItem(id); const chances = drops.map((drop) => drop.chance).sort((a, b) => a - b); const chanceRange = chances.length ? chances.length === 1 ? formatPercent(chances[0]) : `${formatPercent(chances[0])}–${formatPercent(chances[chances.length - 1])}` : dash; return [itemWithId(id), formatReadableId(item.materialSubtype ?? item.category), listOrDash([...new Set(drops.map((drop) => drop.dungeonName))]), sourceText(item), drops.length ? formatNumber(Math.min(...drops.map((drop) => drop.min))) : dash, drops.length ? formatNumber(Math.max(...drops.map((drop) => drop.max))) : dash, chanceRange, sellValue(item), formatNumber(getItemRecipeUses(id).length)] })), '', '> Comparison view — edit drop quantities and chances in the dungeon enemy Loot sheets.', '', '## Drop Sources', '', table(['Material', 'Enemy', 'Dungeon', 'Min', 'Max', 'Chance', 'Est. Qty / Kill'], materialDropRows.map((drop) => [itemWithId(drop.itemId), monsterWithId(drop.monsterId), drop.dungeonName, formatNumber(drop.min), formatNumber(drop.max), formatPercent(drop.chance), formatNumber(drop.expected)]))), materialIds, ['src/game/content/items/items.ts', 'src/game/content/contentRelations.ts', 'src/game/content/monsters'])

const equipmentCraftingColumns = ['Item', 'Ingredient 1', 'Qty 1', 'Ingredient 2', 'Qty 2', 'Ingredient 3', 'Qty 3', 'Ingredient 4', 'Qty 4', 'Ingredient 5', 'Qty 5', 'Unlock']
for (const [dungeonId, ids] of Object.entries(EQUIPMENT_BY_DUNGEON)) { addDoc('Items/Equipment_' + dungeonFileName(dungeonId) + '.md', block('# ' + DUNGEONS[dungeonId].name + ' equipment', '', '## Stats & Effects', '', table([...equipmentStatColumns], ids.map(buildEquipmentStatRow)), '', '## Crafting', '', '> Comparison view — edit recipe costs in `Artificing/Recipes.md`.', '', table(equipmentCraftingColumns, ids.map(buildEquipmentCraftingRow))), ids, ['src/game/content/items/items.ts', 'src/game/content/equipment/equipmentSets.ts', 'src/game/content/recipes/recipes.ts']) }
const recipeForEquipment = (itemId: ItemId) => Object.values(ARTIFICING_RECIPES).find((recipe) => recipe.output.itemId === itemId)
const bossForRecipe = (recipe: typeof RECIPES[typeof RECIPE_ORDER[number]] | undefined, itemId: ItemId) => { const origin = Object.entries(EQUIPMENT_BY_DUNGEON).find(([, ids]) => ids.includes(itemId))?.[0]; return recipe?.unlock.type === 'boss-kill' ? recipe.unlock.bossId : origin ? DUNGEONS[origin].boss : undefined }
const signatureMaterialForRecipe = (recipe: typeof RECIPES[typeof RECIPE_ORDER[number]] | undefined) => recipe?.ingredients.find((ingredient) => ITEMS[ingredient.itemId]?.category === 'boss-loot')
addDoc('Items/Boss_Relics.md', block('# Boss-signature equipment', '', 'Identity grouping only — these Equipment items are crafted through Artificing from boss/signature materials and never drop as finished items.', '', table(['Item', 'Associated Boss', 'Signature Material', 'Material Drop Rate', 'Material Required', 'Craft Mode', 'Slot', 'Special Effect'], EQUIPMENT_BOSS_RELIC_IDS.map((id) => { const item = ITEMS[id]; const recipe = recipeForEquipment(id); const bossId = bossForRecipe(recipe, id); const signatureMaterial = signatureMaterialForRecipe(recipe); const materialDrop = signatureMaterial && bossId ? dropRowsForItem(signatureMaterial.itemId).find((drop) => drop.monsterId === bossId) : undefined; return [itemWithId(id), bossId ? monsterWithId(bossId) : dash, signatureMaterial ? itemWithId(signatureMaterial.itemId) : dash, materialDrop ? formatPercent(materialDrop.chance) : dash, signatureMaterial ? formatNumber(signatureMaterial.quantity) : dash, recipe ? 'Manual, immediate' : dash, readableSlot(item.equipmentSlot), formatCompactEquipmentSpecial(item) || dash] }))), EQUIPMENT_BOSS_RELIC_IDS, ['src/game/content/items/items.ts', 'src/game/content/equipment/equipmentSets.ts', 'src/game/content/recipes/recipes.ts', 'src/game/content/monsters'])

const globalLootRows = (monsterIds: readonly string[]) => monsterIds.flatMap((monsterId) => { const dungeon = getMonsterDungeon(monsterId as never); return MONSTERS[monsterId].loot.map((drop) => [dungeon?.dungeonName ?? dash, monsterWithId(monsterId), isBossMonster(MONSTERS[monsterId]) ? 'Yes' : 'No', itemWithId(drop.itemId), formatNumber(drop.min), formatNumber(drop.max), formatPercent(drop.chance), formatNumber((drop.min + drop.max) / 2), formatNumber(((drop.min + drop.max) / 2) * drop.chance)]) })
const signatureMaterialIds = new Set(EQUIPMENT_BOSS_RELIC_IDS.flatMap((id) => recipeForEquipment(id)?.ingredients.filter((ingredient) => ITEMS[ingredient.itemId]?.category === 'boss-loot').map((ingredient) => ingredient.itemId) ?? []))
addDoc('Loot/Monster_Drops.md', block('# Monster drops', '', '> Comparison view — edit Min, Max, and Chance in the dungeon enemy Loot sheets.', '', table(['Dungeon', 'Enemy', 'Boss?', 'Item', 'Min', 'Max', 'Chance', 'Avg Drop', 'Est. Qty / Kill'], globalLootRows(MONSTER_IDS.filter((id) => !isBossMonster(MONSTERS[id]))))), MONSTER_IDS.filter((id) => !isBossMonster(MONSTERS[id])), ['src/game/content/monsters', 'src/game/content/contentRelations.ts'])
addDoc('Loot/Boss_Drops.md', block('# Boss drops', '', '> Comparison view — edit Min, Max, and Chance in the owning dungeon enemy Loot sheet. Finished Equipment is never included; boss rows contain materials only.', '', table(['Dungeon', 'Enemy', 'Boss?', 'Item', 'Min', 'Max', 'Chance', 'Avg Drop', 'Est. Qty / Kill', 'Signature Material?', 'Progression Item?'], globalLootRows(DUNGEON_ORDER.map((id) => DUNGEONS[id].boss)).map((row) => [...row, signatureMaterialIds.has(String(row[3]).match(/\(([^)]+)\)$/)?.[1] ?? '') ? 'Yes' : 'No', String(row[3]).includes('heartseed') ? 'Yes' : 'No']))), DUNGEON_ORDER.map((id) => DUNGEONS[id].boss), ['src/game/content/monsters', 'src/game/content/dungeons/dungeons.ts'])

addDoc('Transmutation/Recipes.md', block('# Transmutation recipes', '', 'Continuous elemental/material production: Arcane Echo driven, Mana funded, repeatable, and Offline Bank compatible.', '', table(recipeColumns, recipeRows(TRANSMUTATION_RECIPE_ORDER))), TRANSMUTATION_RECIPE_ORDER, ['src/game/content/recipes/transmutationRecipes.ts'])
addDoc('Artificing/Recipes.md', block('# Artificing recipes', '', 'Manual Equipment crafting: one click creates one item immediately. No Mana, Echoes, timer, queue, repeat, or offline production.', '', ...DUNGEON_ORDER.flatMap(dungeonId => ['## ' + DUNGEONS[dungeonId].name, '', table(['Recipe', 'Slot', 'Dungeon', ...equipmentCraftingColumns.slice(1)], ARTIFICING_RECIPE_ORDER.filter(id => ARTIFICING_RECIPES[id].sourceDungeonId === dungeonId).map(id => { const recipe = ARTIFICING_RECIPES[id]; return [nameWithId(recipe.name, id), readableSlot(ITEMS[recipe.output.itemId].equipmentSlot), DUNGEONS[dungeonId].name, ...ingredientCells(recipe), formatRecipeUnlock(recipe.unlock)] })), ''])), ARTIFICING_RECIPE_ORDER, ['src/game/content/recipes/artificingRecipes.ts'])
const recipeMaterialCounts = (recipe: typeof RECIPES[typeof RECIPE_ORDER[number]]) => { const values = { monster: 0, elemental: 0, boss: 0 }; recipe.ingredients.forEach((ingredient) => { const item = ITEMS[ingredient.itemId]; if (item.category === 'elemental') values.elemental += ingredient.quantity; else if (item.category === 'boss-loot') values.boss += ingredient.quantity; else if (item.category === 'monster-loot') values.monster += ingredient.quantity }); return values }
const estimatedRecipeKills = (recipe: typeof RECIPES[typeof RECIPE_ORDER[number]]) => { const estimates = recipe.ingredients.flatMap((ingredient) => { const best = dropRowsForItem(ingredient.itemId).filter((drop) => drop.role === 'normal').sort((a, b) => b.expected - a.expected)[0]; return best && best.expected > 0 ? [ingredient.quantity / best.expected] : [] }); return estimates.length ? formatNumber(Math.max(...estimates)) : dash }
for (const domain of ['Transmutation', 'Artificing'] as const) {
  const ids = domain === 'Transmutation' ? TRANSMUTATION_RECIPE_ORDER : ARTIFICING_RECIPE_ORDER
  addDoc(domain + '/Crafting_Economy.md', block('# ' + domain + ' crafting economy', '', 'Derived comparison values are marked Est. and do not add runtime values.', '', table(['Recipe', 'Source', 'Monster Mats', 'Elemental Mats', 'Boss Mats', 'Total Items', ...(domain === 'Transmutation' ? ['Time'] : []), 'Est. Enemy Kills', 'Sell Value'], ids.map(id => {
    const recipe = RECIPES[id]; const counts = recipeMaterialCounts(recipe); const dungeon = recipeDungeon(id)
    return [nameWithId(recipe.name, id), dungeon ? DUNGEONS[dungeon].name : 'Transmutation', formatNumber(counts.monster), formatNumber(counts.elemental), formatNumber(counts.boss), formatNumber(recipe.ingredients.reduce((sum, ingredient) => sum + ingredient.quantity, 0)), ...('baseDurationMs' in recipe ? [formatDuration(recipe.baseDurationMs)] : []), estimatedRecipeKills(recipe), sellValue(ITEMS[recipe.output.itemId])]
  })), '', 'Est. Enemy Kills uses the best authored normal-monster expected quantity for each monster material and takes the largest ingredient estimate. It does not estimate target farm time.', '', domain === 'Artificing' ? 'Crafting is manual and immediate. Material sourcing, not a forge timer, determines acquisition pacing.' : 'Continuous production is Mana funded and Echo driven.'), ids, ['src/game/content/recipes/' + (domain === 'Artificing' ? 'artificingRecipes.ts' : 'transmutationRecipes.ts'), 'src/game/content/monsters', 'src/game/content/items/items.ts'])
}

addDoc('Progression/Research_XP.md', block('# Research XP', '', '## Core Settings', '', table(['Setting', 'Value'], balanceRows(BALANCE.research as unknown as Record<string, unknown>)), '', '## Researchable Items', '', table(['Item', 'School', 'Matching XP', 'Other XP', 'Mana', 'Time', 'XP/min Match', 'XP/min Other'], getResearchableItemIds().map((id) => [itemWithId(id), SCHOOLS[ITEMS[id].researchSchool!].name, formatNumber(BALANCE.research.matchingXp), formatNumber(BALANCE.research.nonMatchingXp), formatNumber(BALANCE.research.manaCostPerItem), formatDuration(BALANCE.research.durationPerItemMs), formatNumber(BALANCE.research.matchingXp * 60_000 / BALANCE.research.durationPerItemMs), formatNumber(BALANCE.research.nonMatchingXp * 60_000 / BALANCE.research.durationPerItemMs)]))), getResearchableItemIds(), ['src/game/core/balance/balance.ts', 'src/game/content/items/items.ts', 'src/game/content/schools/schools.ts'])
const schoolLevels = Array.from({ length: SCHOOL_MAX_LEVEL }, (_, index) => index + 1)
export const buildSchoolXpRows = () => schoolLevels.map((level) => [level, getSchoolXpToNext(level) === null ? '— CAP' : formatHumanInteger(getSchoolXpToNext(level)!), formatHumanInteger(getSchoolTotalXpForLevel(level))])
const schoolMilestones = [2, 8, 16, 20, 40]
const derivedResearchTime = (level: number, echoes: number) => {
  const minutes = getSchoolTotalXpForLevel(level) * BALANCE.research.durationPerItemMs / BALANCE.research.matchingXp / echoes / 60_000
  if (minutes < 1) return `~${Math.round(minutes * 60)} s`
  if (minutes < 60) return `~${Number(minutes.toFixed(1))} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Number((minutes - hours * 60).toFixed(1))
  return `~${hours} h ${remainingMinutes} min`
}
addDoc('Progression/Magic_School_XP.md', block('# Magic school XP', '', '> Edit `XP to Next Level` when changing the curve. `Total XP to Reach This Level` is derived cumulative information.', '', '## Level Curve', '', table(['Level', 'XP to Next Level', 'Total XP to Reach This Level'], buildSchoolXpRows()), '', table(['Setting', 'Value'], [['Starting School cap', formatNumber(BALANCE.schoolProgression.startingCap)], ['Tutorial-complete School cap', formatNumber(BALANCE.schoolProgression.tutorialCompleteCap)], ['Maximum authored level', formatNumber(SCHOOL_MAX_LEVEL)]]), '', '## Milestone totals', '', table(['Milestone', 'Total XP'], schoolMilestones.map((level) => [`Level ${level}`, formatNumber(getSchoolTotalXpForLevel(level))])), '', '## Derived current Research pacing', '', `DERIVED — NOT A RUNTIME TARGET. Uses matching Research at ${formatNumber(BALANCE.research.matchingXp)} XP per item and ${formatDuration(BALANCE.research.durationPerItemMs)} per item; ignores material scarcity, Mana, Focus, downtime, and progression gates.`, '', table(['Milestone', 'Total XP', '1 Echo', '5 Echoes'], schoolMilestones.map((level) => [`Level ${level}`, formatNumber(getSchoolTotalXpForLevel(level)), derivedResearchTime(level, 1), derivedResearchTime(level, 5)])), '', '## School Sources', '', table(['School', 'XP Sources', 'Base XP Rate', 'Notes'], Object.values(SCHOOLS).map((school) => [school.name, 'Research and spell progression', dash, school.tagline]))), ['SCHOOL_XP_TO_NEXT', 'SCHOOL_MAX_LEVEL'].concat(Object.keys(BALANCE.schoolProgression).map((key) => 'schoolProgression.' + key)), ['src/game/core/balance/schoolXpCurve.ts', 'src/game/core/balance/balance.ts', 'src/game/systems/schools', 'src/game/systems/spells'])
addDoc('Progression/Channeling.md', block('# Channeling', '', '## Core Values', '', table(['Setting', 'Value'], balanceRows(BALANCE.channeling as unknown as Record<string, unknown>)), '', '## Discoveries', '', table(['Discovery', 'Unlock', 'Effect', 'Value', 'Cost'], CHANNELING_DISCOVERIES.map((discovery) => [nameWithId(discovery.name, discovery.id), discovery.conditionDescription, discovery.rewardDescription, dash, dash])), '', '## Mana Pillars', '', table(['Pillar', 'Level', 'Cost', 'Mana Bonus', 'Other Bonus'], MANA_PILLAR_IDS.flatMap((id) => { const pillar = MANA_PILLARS[id]; return Object.keys(PILLAR_LEVEL_COSTS).map((level) => { const costs = PILLAR_LEVEL_COSTS[Number(level) as keyof typeof PILLAR_LEVEL_COSTS]; return [nameWithId(pillar.name, id), level, `${costs.fragment} ${itemName(pillar.fragmentRequirements[0])} + ${costs.lifeEssence} Life Essence`, pillar.effect === 'flat-capacity' || pillar.effect === 'capacity-percent' ? `${pillar.valuePerLevel}${pillar.effect === 'capacity-percent' ? '%' : ''}` : dash, pillar.effect === 'flat-regen' || pillar.effect === 'passive-regen-percent' || pillar.effect === 'echo-percent' ? `${pillar.effectLabel}: ${pillar.valuePerLevel}${pillar.effect === 'flat-regen' ? '' : '%'}` : `${pillar.effectLabel}: ${pillar.valuePerLevel}`] }) }))), MANA_PILLAR_IDS.concat(CHANNELING_DISCOVERIES.map((discovery) => discovery.id)), ['src/game/core/balance/balance.ts', 'src/game/content/channeling'])

const focusCapacityRows = [['Starting capacity', formatNumber(BALANCE.focus.startingMax)], ['Forest Heart', formatNumber(BALANCE.focus.forestHeartBonus)], ['Guild Apprentice', formatNumber(BALANCE.focus.guildApprenticeBonus)], [FOCUS_IMPROVEMENT.name, formatNumber(FOCUS_IMPROVEMENT.focusPerLevel)]]
addDoc('Progression/Focus.md', block('# Focus', '', '## Capacity Sources', '', table(['Source', 'Unlock', 'Focus', 'Permanent?'], focusCapacityRows.map(([source, focus]) => [source, source === 'Starting capacity' ? 'Start' : source, focus, 'Yes'])), '', '## Focus Costs', '', table(['System', 'Action / Rank', 'Focus Cost'], [['Channeling', 'Arcane Echo', formatNumber(BALANCE.channeling.echoFocusCost)], ['Research', 'Echo assignment', formatNumber(BALANCE.research.echoFocusCost)], ['Transmutation', 'Echo assignment', formatNumber(BALANCE.transmutation.echoFocusCost)], ...Array.from({ length: 8 }, (_, index) => ['Auto-Cast', `Rank ${index + 1}`, formatNumber(getAutoCastFocusCostForRank((index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8))])]), '', `Focus Capacity upgrades reach ${FOCUS_IMPROVEMENT.maxLevel} levels at ${FOCUS_IMPROVEMENT.focusPerLevel} Focus per level.`), Object.keys(BALANCE.focus).map((key) => 'focus.' + key).concat(FOCUS_IMPROVEMENT.id), ['src/game/core/balance/balance.ts', 'src/game/content/focus/focusImprovement.ts', 'src/game/content/tower/rankOneUpgradeCosts.ts'])
addDoc('Progression/Guild_Progression.md', block('# Guild progression', '', '## Ranks', '', table(['Rank', 'Required Reputation', 'Other Requirement', 'Permanent Reward', 'Unlocks'], [['Outsider', '0', dash, dash, 'Guild unavailable until first Forest Heart clear'], ['Initiate', '0', 'First Forest Heart clear', dash, 'Guild requests'], ['Apprentice', '175', 'All authored requests complete', `+${BALANCE.focus.guildApprenticeBonus} Focus`, 'Promotion available']]), '', '## Requests', '', table(['Request', 'Required Rank', 'Item', 'Qty', 'Reputation', 'Other Reward', 'Repeatable?'], Object.values(GUILD_REQUESTS).map((request) => [nameWithId(request.name, request.id), 'Initiate', 'itemId' in request ? itemWithId(request.itemId) : dash, 'target' in request ? formatNumber(request.target) : dash, formatNumber(request.reputation), request.description, 'No']))), Object.keys(GUILD_REQUESTS), ['src/game/content/guild/guildRequests.ts', 'src/game/core/balance/balance.ts', 'src/store/actions/guildActions.ts'])
addDoc('Progression/Progression_Overview.md', block('# Progression overview', '', table(['System / Content', 'Unlock Type', 'Requirement', 'Value', 'Depends On', 'Unlocks'], [...DUNGEON_ORDER.map((id) => [nameWithId(DUNGEONS[id].name, id), 'Dungeon', DUNGEONS[id].unlock?.type === 'boss-kill' ? `Defeat ${monsterWithId(DUNGEONS[id].unlock.bossId)}` : 'Start', formatNumber(DUNGEONS[id].threatRequired), DUNGEONS[id].unlock?.type === 'boss-kill' ? DUNGEONS[id].unlock.bossId : dash, DUNGEONS[id].completesTutorial ? 'School cap' : 'Next dungeon']), ['Guild', 'Boss clear', 'Defeat Forest Heart', 'Initiate', 'forest-heart', 'Guild requests'], ['Magic School cap', 'Tutorial completion', 'Defeat Archmage Edrin’s Shade', formatNumber(BALANCE.schoolProgression.tutorialCompleteCap), 'archmage-edrin-shade', 'Higher school levels']])), DUNGEON_ORDER, ['src/game/content/dungeons/dungeons.ts', 'src/game/core/balance/balance.ts'])
const unlockIds = DUNGEON_ORDER.map((id) => 'dungeon:' + id).concat(RECIPE_ORDER.filter((id) => RECIPES[id].unlock.type !== 'always').map((id) => 'recipe:' + id))
addDoc('Progression/Unlock_Progression.md', block('# Unlock progression', '', table(['System / Content', 'Unlock Type', 'Requirement', 'Value', 'Depends On', 'Unlocks'], [...DUNGEON_ORDER.map((id) => [nameWithId(DUNGEONS[id].name, 'dungeon:' + id), 'Dungeon', DUNGEONS[id].unlock?.type === 'boss-kill' ? `Defeat ${monsterWithId(DUNGEONS[id].unlock.bossId)}` : 'Start', formatNumber(DUNGEONS[id].threatRequired), DUNGEONS[id].unlock?.type === 'boss-kill' ? DUNGEONS[id].unlock.bossId : dash, DUNGEONS[id].name]), ...RECIPE_ORDER.filter((id) => RECIPES[id].unlock.type !== 'always').map((id) => [nameWithId(RECIPES[id].name, 'recipe:' + id), 'Recipe', formatRecipeUnlock(RECIPES[id].unlock), dash, dash, itemWithId(RECIPES[id].output.itemId)])])), unlockIds, ['src/game/content/dungeons/dungeons.ts', 'src/game/content/recipes/recipes.ts'])

addDoc('Magic/Spell_Index.md', block('# Spell index', '', table(['Spell', 'School', 'Rank', 'Unlock Lv', 'Mana', 'Cooldown', 'Cast / Delay', 'Damage', 'Damage Type', 'Barrier', 'Heal', 'Status', 'Status Chance', 'Status Dur', 'DoT', 'Focus Cost', 'Special'], spellIds.map(buildSpellBalanceRow))), spellIds, ['src/game/content/spells/spells.ts', 'src/game/content/statuses/statuses.ts'])
for (const schoolId of ['fire', 'water', 'earth', 'air'] as SchoolId[]) { const ids = spellIds.filter((id) => SPELLS[id as keyof typeof SPELLS].school === schoolId); addDoc('Magic/' + formatReadableId(schoolId).replace(/ /g, '_') + '_Spells.md', block('# ' + SCHOOLS[schoolId].name + ' spells', '', table(['Spell', 'School', 'Rank', 'Unlock Lv', 'Mana', 'Cooldown', 'Cast / Delay', 'Damage', 'Damage Type', 'Barrier', 'Heal', 'Status', 'Status Chance', 'Status Dur', 'DoT', 'Focus Cost', 'Special'], ids.map(buildSpellBalanceRow))), ids, ['src/game/content/spells/spells.ts', 'src/game/content/schools/schools.ts', 'src/game/content/statuses/statuses.ts']) }
addDoc('Magic/Magic_Schools.md', block('# Magic schools', '', table(['School', 'ID', 'Fragment', 'Tagline'], Object.values(SCHOOLS).map((school) => [school.name, school.id, itemWithId(school.fragment), school.tagline]))), Object.keys(SCHOOLS), ['src/game/content/schools/schools.ts'])
addDoc('Magic/AutoCast_And_Focus.md', block('# Auto-Cast and Focus', '', table(['Spell', 'School', 'Auto-Cast trigger', 'Focus Cost'], spellIds.map((id) => { const spell = SPELLS[id as keyof typeof SPELLS]; return [nameWithId(spell.name, id), SCHOOLS[spell.school].name, formatAutoCastCondition(spell.autoCondition), 'Rank based'] })), '', table(['Rank', 'Focus cost'], Array.from({ length: 8 }, (_, index) => [index + 1, getAutoCastFocusCostForRank((index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8)]))), spellIds, ['src/game/content/spells/spells.ts', 'src/game/systems/spells'])

addDoc('Economy/Item_Values.md', block('# Item values', '', table(['Item', 'Type', 'Dungeon', 'Source', 'Sell', 'Craftable?', 'Boss Drop?', 'Destroy?'], itemIds.map((id) => { const item = ITEMS[id]; const origin = Object.entries(EQUIPMENT_BY_DUNGEON).find(([, ids]) => ids.includes(id))?.[0]; return [itemWithId(id), item.kind === 'equipment' ? 'Equipment' : 'Material', origin ? DUNGEONS[origin].name : dash, sourceText(item), sellValue(item), equipmentCrafting(id) ? 'Yes' : 'No', dropRowsForItem(id).some((drop) => drop.role === 'boss') ? 'Yes' : 'No', item.canDestroy ? 'Yes' : 'No'] }))), itemIds, ['src/game/content/items/items.ts', 'src/game/content/equipment/equipmentSets.ts', 'src/game/content/monsters'])
addDoc('Economy/Current_Progression_Timings.md', block('# Current progression timings', '', '## Research', '', table(['Activity', 'XP/min', 'Mana/min'], [['Matching Research', formatNumber(BALANCE.research.matchingXp * 60_000 / BALANCE.research.durationPerItemMs), formatNumber(BALANCE.research.manaCostPerItem * 60_000 / BALANCE.research.durationPerItemMs)], ['Other-school Research', formatNumber(BALANCE.research.nonMatchingXp * 60_000 / BALANCE.research.durationPerItemMs), formatNumber(BALANCE.research.manaCostPerItem * 60_000 / BALANCE.research.durationPerItemMs)]]), '', '## Crafting', '', table(['Recipe', 'Time'], RECIPE_ORDER.map((id) => [nameWithId(RECIPES[id].name, id), 'baseDurationMs' in RECIPES[id] ? formatDuration((RECIPES[id] as import('../../src/game/content/recipes/transmutationRecipes').TransmutationRecipeDefinition).baseDurationMs) : 'Manual, immediate'])), '', '## Material Acquisition', '', table(['Material', 'Best Current Source', 'Est. Qty / Kill', 'Est. Kills for Common Recipe'], materialIds.map((id) => { const best = dropRowsForItem(id).sort((a, b) => b.expected - a.expected)[0]; const commonUse = getItemRecipeUses(id).sort((a, b) => a.ingredients.length - b.ingredients.length)[0]; const required = commonUse?.ingredients.find((ingredient) => ingredient.itemId === id)?.quantity; return [itemWithId(id), best ? `${monsterWithId(best.monsterId)} — ${best.dungeonName}` : sourceText(ITEMS[id]), best ? formatNumber(best.expected) : dash, best && required ? formatNumber(required / best.expected) : dash] }))), [], ['src/game/core/balance/balance.ts', 'src/game/content/recipes/recipes.ts', 'src/game/content/monsters', 'src/game/content/items/items.ts'])

const materialDocument = docs.get('Items/Materials.md')
if (materialDocument) {
  const [materialTable, ...materialRemainder] = materialDocument.split('## Drop Sources')
  const materialLines = materialTable.split(newline).map((line) => {
    if (line.startsWith('| Material | Type |')) return line.replace('| Material | Type |', '| Material | Type | Material Tier |')
    if (!line.startsWith('|')) return line
    if (line.includes('---')) {
      const separatorCells = line.split('|')
      separatorCells.splice(3, 0, ' --- ')
      return separatorCells.join('|')
    }
    const itemId = line.match(/\(([^)]+)\)/)?.[1] as ItemId | undefined
    if (!itemId || !ITEMS[itemId]) return line
    const cells = line.split('|')
    cells.splice(3, 0, ` ${materialTierLabel(ITEMS[itemId])} `)
    return cells.join('|')
  })
  docs.set('Items/Materials.md', [materialLines.join(newline), ...materialRemainder].join('## Drop Sources'))
}

const schoolXpDocument = docs.get('Progression/Magic_School_XP.md')
if (schoolXpDocument) docs.set('Progression/Magic_School_XP.md', schoolXpDocument.replace(/\b\d{4,}\b/g, (value) => formatHumanInteger(Number(value))))

export const buildBalancingDocuments = (): BalancingDocumentBuild => {
  const registry = (ids: readonly string[], documents: readonly string[], runtimeSources: readonly string[]) => ({ count: ids.length, ids: [...ids], documents: [...documents], runtimeSources: [...runtimeSources] })
  return { docs, documentInfo, registries: { items: registry(itemIds, ['Items/Item_Index.md', 'Items/Materials.md'], ['src/game/content/items/items.ts']), equipment: registry(equipmentIds, ['Items/Equipment_Whispering_Woods.md', 'Items/Equipment_Howling_Den.md', 'Items/Equipment_Abandoned_Catacombs.md'], ['src/game/content/items/items.ts', 'src/game/content/equipment/equipmentSets.ts']), monsters: registry(MONSTER_IDS, ['Enemies/Enemy_Index.md', 'Enemies/Whispering_Woods.md', 'Enemies/Howling_Den.md', 'Enemies/Abandoned_Catacombs.md'], ['src/game/content/monsters']), dungeons: registry(DUNGEON_ORDER, ['Dungeons/Dungeon_Progression.md'], ['src/game/content/dungeons/dungeons.ts']), recipes: registry(RECIPE_ORDER, ['Transmutation/Recipes.md', 'Transmutation/Crafting_Economy.md', 'Artificing/Recipes.md', 'Artificing/Crafting_Economy.md'], ['src/game/content/recipes/transmutationRecipes.ts', 'src/game/content/recipes/artificingRecipes.ts']), spells: registry(spellIds, ['Magic/Spell_Index.md', 'Magic/Fire_Spells.md', 'Magic/Water_Spells.md', 'Magic/Earth_Spells.md', 'Magic/Air_Spells.md'], ['src/game/content/spells/spells.ts']), statuses: registry(statusIds, ['Combat/Status_Effects.md'], ['src/game/content/statuses/statuses.ts']), traits: registry(traitIds, ['Combat/Traits_And_Special_Attacks.md'], ['src/game/content/traits/traits.ts']) }, invariants: balancingInvariants, canonicalLocations: { 'monster stats': 'Enemies/{Dungeon}.md -> Core Combat Stats', 'monster traits and patterns': 'Enemies/{Dungeon}.md -> Traits & Patterns', 'monster special actions': 'Enemies/{Dungeon}.md -> Special Actions', 'monster loot': 'Enemies/{Dungeon}.md -> Loot', 'equipment stats': 'Items/Equipment_{Dungeon}.md -> Stats & Effects', 'equipment crafting': 'Artificing/Recipes.md', 'material drops': 'Enemies/{Dungeon}.md -> Loot', recipes: 'Transmutation/Recipes.md and Artificing/Recipes.md', spells: 'Magic/{School}_Spells.md', statuses: 'Combat/Status_Effects.md', traits: 'Combat/Traits_And_Special_Attacks.md -> Traits' }, mirrors: { 'Enemies/{Dungeon}.md -> Loot': 'Loot/Monster_Drops.md and Loot/Boss_Drops.md are generated comparison views.', 'Transmutation/Recipes.md': 'Transmutation/Crafting_Economy.md is a generated comparison view.', 'Artificing/Recipes.md': 'Items/Equipment_{Dungeon}.md -> Crafting and Artificing/Crafting_Economy.md are generated comparison views.', 'Enemies/{Dungeon}.md -> Core Combat Stats': 'Enemies/Enemy_Index.md is a generated cross-dungeon comparison.', 'Magic/{School}_Spells.md': 'Magic/Spell_Index.md is a generated global comparison.' } }
}
