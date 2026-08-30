import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import { SPELLS } from '../../content/spells/spells'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import { getTraitDefinitions } from '../../content/traits'
import type { CombatLogEntry, DamageType } from '../../systems/combat/combatTypes'

export interface CombatLogPresentation {
  sourceLabel: string
  actionLabel: string
  message: string
  result?: string
  semanticClass: string
  actionClass: string
  accessibilityText: string
  timeLabel: string
  tooltip?: { title: string; description: string }
}

const damageLabel = (damageType?: DamageType) => `${damageType ? damageType.toUpperCase() : 'PHYSICAL'} DAMAGE`
const targetLabel = (entry: CombatLogEntry) => {
  if (entry.target === 'player') return 'Your Wizard'
  if (entry.target !== 'enemy') return undefined
  const monsterId = entry.targetMonsterId ?? (entry.source.kind === 'enemy' ? entry.source.monsterId : undefined)
  return monsterId ? MONSTERS[monsterId]?.name ?? 'Enemy' : 'Enemy'
}
const sourceLabel = (entry: CombatLogEntry) => entry.source.kind === 'player' ? 'Your Wizard' : entry.source.kind === 'enemy' ? MONSTERS[entry.source.monsterId]?.name ?? 'Enemy' : 'System'
const sourceSubject = (entry: CombatLogEntry) => entry.source.kind === 'enemy' ? MONSTERS[entry.source.monsterId]?.name ?? 'Enemy' : entry.source.kind === 'player' ? 'Your Wizard' : 'System'

export const formatCombatLogTime = (entry: CombatLogEntry, newestTimestampMs = entry.timestampMs) => `${(Math.max(0, newestTimestampMs - entry.timestampMs) / 1000).toFixed(1)}s`

export function presentCombatLogEntry(entry: CombatLogEntry, newestTimestampMs = entry.timestampMs): CombatLogPresentation {
  const target = targetLabel(entry)
  const source = sourceSubject(entry)
  const spell = entry.spellId ? SPELLS[entry.spellId] : undefined
  const monster = entry.source.kind === 'enemy' ? MONSTERS[entry.source.monsterId] : undefined
  const action = entry.actionId && monster ? monster.actions[entry.actionId] : undefined
  const status = entry.statusId ? STATUS_DEFINITIONS[entry.statusId] : undefined
  const trait = entry.traitId ? getTraitDefinitions([entry.traitId])[0] : undefined
  const item = entry.itemId ? ITEMS[entry.itemId] : undefined
  const actionLabel = spell?.name ?? action?.name ?? trait?.name ?? status?.name ?? item?.name ?? categoryLabel(entry.category)
  const direction = target ? ` → ${target}` : ''
  let message = `${actionLabel}${direction}`
  let result: string | undefined
  let semanticClass = `log-${entry.category}`
  let actionClass = `log-action-${entry.category}`

  if (entry.category === 'death') {
    message = entry.target === 'player' ? 'YOUR WIZARD WAS DEFEATED' : `${entry.targetMonsterId ? MONSTERS[entry.targetMonsterId]?.name.toUpperCase() : source.toUpperCase()} DEFEATED`
    semanticClass = 'log-system'
    actionClass = 'log-action-death'
  } else if (entry.category === 'loot') {
    message = item ? `${item.name.toUpperCase()} ×${entry.amount ?? 0}` : 'LOOT ACQUIRED'
    semanticClass = 'log-loot'
    actionClass = 'log-action-loot'
  } else if (entry.category === 'pattern') {
    message = 'PATTERN SHIFT'
    result = entry.sourceId ? categoryLabel(entry.sourceId) : undefined
    semanticClass = 'log-system'
    actionClass = 'log-action-pattern'
  } else if (entry.category === 'trait') {
    message = `${actionLabel.toUpperCase()} TRIGGERED`
    result = entry.amount ? `+${formatNumber(entry.amount)} EFFECT` : undefined
    semanticClass = 'log-trait'
  } else if (entry.damageType || entry.healthDamage !== undefined) {
    const resolvedDamage = entry.amount ?? entry.healthDamage ?? 0
    result = `${formatNumber(resolvedDamage)} ${damageLabel(entry.damageType)}`
    if (entry.barrierAbsorbed) result += ` · ${formatNumber(entry.barrierAbsorbed)} absorbed`
    if (entry.barrierAbsorbed && entry.healthDamage !== undefined && entry.healthDamage !== resolvedDamage) result += ` · ${formatNumber(entry.healthDamage)} HP`
    semanticClass = `log-damage-${entry.damageType ?? 'physical'}`
  } else if (entry.category === 'heal') {
    result = `+${formatNumber(entry.amount ?? 0)} HP`
    semanticClass = 'log-heal'
  } else if (entry.category === 'barrier') {
    result = `+${formatNumber(entry.amount ?? 0)} BARRIER${entry.durationMs ? ` · ${formatDuration(entry.durationMs)}` : ''}`
    semanticClass = 'log-barrier'
  } else if (entry.category === 'status') {
    result = `${status?.name ?? 'STATUS'} applied${entry.durationMs ? ` · ${formatDuration(entry.durationMs)}` : ''}${entry.stacks && entry.stacks > 1 ? ` · ${entry.stacks} stacks` : ''}`
    semanticClass = status?.classification === 'buff' ? 'log-buff' : status?.tags.includes('dot') ? 'log-dot' : status?.tags.includes('control') ? 'log-control' : 'log-debuff'
  } else if (entry.category === 'system') {
    message = entry.source.kind === 'enemy' ? `${source.toUpperCase()} EVENT` : entry.sourceId === 'encounter-start' ? `${entry.targetMonsterId ? MONSTERS[entry.targetMonsterId]?.name.toUpperCase() : 'ENEMY'} ENTERED` : message
    semanticClass = 'log-system'
  }

  const full = [source, message, result].filter(Boolean).join('. ')
  return { sourceLabel: sourceLabel(entry), actionLabel, message, result, semanticClass, actionClass, accessibilityText: `${full}.`, timeLabel: formatCombatLogTime(entry, newestTimestampMs), tooltip: spell ? { title: spell.name, description: spell.description } : action ? { title: action.name, description: action.description } : status ? { title: status.name, description: status.description } : trait ? { title: trait.name, description: trait.description } : undefined }
}

function categoryLabel(category: string) { return category.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function formatNumber(value: number) { return Math.round(value).toLocaleString() }
function formatDuration(value: number) { return `${(Math.max(0, value) / 1000).toFixed(1)}s` }
