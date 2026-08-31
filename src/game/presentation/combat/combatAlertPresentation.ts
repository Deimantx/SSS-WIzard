import { MONSTERS, isBossMonster } from '../../content/monsters'
import { SPELLS } from '../../content/spells/spells'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import { getTraitDefinition } from '../../content/traits'
import type { GameState } from '../../types'
import type { CombatAlertPriority, CombatEvent, CombatFailureReason } from '../../systems/combat/combatTypes'

export type CombatAlertCategory = 'enemy-action' | 'boss' | 'status' | 'trait' | 'resource' | 'barrier' | 'death' | 'system'

export interface CombatAlert {
  id: string
  dedupeKey: string
  priority: CombatAlertPriority
  category: CombatAlertCategory
  title: string
  detail: string
  icon?: string
  semantic: 'danger' | 'warning' | 'info' | 'success'
  createdAtMs: number
  expiresAtMs?: number
}

export interface CombatAlertSpec {
  dedupeKey: string
  priority: CombatAlertPriority
  category: CombatAlertCategory
  title: string
  detail: string
  icon?: string
  semantic: CombatAlert['semantic']
  durationMs?: number
}

const targetLabel = (event: CombatEvent) => event.target === 'player' ? 'Your Wizard' : event.target === 'enemy' ? 'the enemy' : 'the fight'
const sourceMonster = (event: CombatEvent) => event.source.kind === 'enemy' ? MONSTERS[event.source.monsterId] : undefined
const isBossEvent = (event: CombatEvent) => {
  const monster = sourceMonster(event) ?? (event.targetMonsterId ? MONSTERS[event.targetMonsterId] : undefined)
  return Boolean(monster && isBossMonster(monster))
}

const failureLabel = (failure?: CombatFailureReason) => failure === 'mana' ? 'insufficient Mana' : 'cast blocked'
const statusPriority = (statusId: CombatEvent['statusId']): CombatAlertPriority | undefined => {
  const definition = statusId ? STATUS_DEFINITIONS[statusId] : undefined
  if (!definition) return undefined
  if (definition.ui?.alert) return definition.ui.alert
  return definition.tags.includes('control') ? 'important' : undefined
}

/** Converts resolved events to attention-worthy UI alerts. Routine combat remains silent. */
export const createCombatAlertSpec = (event: CombatEvent): CombatAlertSpec | null => {
  if (event.failure === 'mana') {
    const spell = event.spellId ? SPELLS[event.spellId] : undefined
    return { dedupeKey: 'mana-starved', priority: 'important', category: 'resource', title: 'MANA STARVED', detail: `${spell?.name ?? 'Configured spell'} blocked by ${failureLabel(event.failure)}.`, icon: 'mana', semantic: 'warning', durationMs: 3_500 }
  }

  if (event.actionPhase === 'telegraph' && event.source.kind === 'enemy' && event.actionId && isBossEvent(event)) {
    const action = MONSTERS[event.source.monsterId]?.actions[event.actionId]
    if (!action) return null
    return { dedupeKey: `boss-action:${event.source.monsterId}:${action.id}`, priority: 'critical', category: 'boss', title: `BOSS: ${action.name.toUpperCase()}`, detail: action.description, icon: 'boss', semantic: 'danger', durationMs: 5_000 }
  }

  if (event.category === 'pattern' && event.source.kind === 'enemy' && isBossEvent(event)) {
    return { dedupeKey: `boss-pattern:${event.source.monsterId}:${event.sourceId ?? 'shift'}`, priority: 'critical', category: 'boss', title: 'BOSS PHASE SHIFT', detail: 'The enemy has changed its action pattern.', icon: 'phase', semantic: 'danger', durationMs: 5_000 }
  }

  if (event.category === 'trait') {
    const trait = event.traitId ? getTraitDefinition(event.traitId) : undefined
    if (!trait) return null
    return { dedupeKey: `trait:${trait.id}:${event.ruleId ?? 'trigger'}`, priority: isBossEvent(event) ? 'critical' : 'important', category: 'trait', title: `${trait.name.toUpperCase()} TRIGGERED`, detail: trait.description, icon: 'trait', semantic: isBossEvent(event) ? 'danger' : 'info', durationMs: 3_500 }
  }

  if (event.category === 'death') {
    const defeatedMonster = sourceMonster(event) ?? (event.targetMonsterId ? MONSTERS[event.targetMonsterId] : undefined)
    const defeated = event.target === 'player' ? 'YOUR WIZARD' : defeatedMonster?.name.toUpperCase() ?? 'ENEMY'
    return { dedupeKey: `death:${event.sourceId ?? event.target ?? 'combat'}`, priority: isBossEvent(event) ? 'critical' : 'important', category: 'death', title: `${defeated} DEFEATED`, detail: event.target === 'player' ? 'Recover in the Tower before entering a new run.' : 'Encounter resolved.', icon: 'death', semantic: event.target === 'player' ? 'danger' : 'success', durationMs: 5_000 }
  }

  if ((event.category === 'damage' || event.category === 'basic-attack' || event.category === 'spell' || event.category === 'enemy-action') && (event.barrierBefore ?? 0) > 0 && event.barrierAfter === 0) {
    return { dedupeKey: `barrier-break:${event.target ?? 'combat'}`, priority: 'important', category: 'barrier', title: 'BARRIER BROKEN', detail: `${targetLabel(event)} has lost its protective barrier.`, icon: 'barrier', semantic: 'warning', durationMs: 3_500 }
  }

  if (event.category === 'status' && event.statusId && event.statusPhase) {
    const priority = statusPriority(event.statusId)
    const status = STATUS_DEFINITIONS[event.statusId]
    if (!priority || !status) return null
    const verb = event.statusPhase === 'apply' ? 'APPLIED' : event.statusPhase === 'expire' ? 'EXPIRED' : 'REMOVED'
    return { dedupeKey: `status:${event.target ?? 'combat'}:${event.statusId}:${event.statusPhase}`, priority, category: 'status', title: `${status.name.toUpperCase()} ${verb}`, detail: `${status.description} Target: ${targetLabel(event)}.`, icon: status.ui?.icon ?? 'status', semantic: priority === 'critical' ? 'danger' : priority === 'important' ? 'warning' : 'info', durationMs: priority === 'critical' ? 5_000 : 3_500 }
  }

  return null
}

export const createCriticalHealthAlert = (state: GameState): CombatAlertSpec | null => {
  if (!state.combat.active || state.player.maxHealth <= 0 || state.player.health / state.player.maxHealth > 0.25) return null
  return { dedupeKey: 'critical-player-health', priority: 'critical', category: 'resource', title: 'CRITICAL HEALTH', detail: 'Your Wizard is below 25% Health.', icon: 'health', semantic: 'danger' }
}
