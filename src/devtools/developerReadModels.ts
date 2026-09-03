import { getMonsterDungeon } from '../game/content/contentRelations'
import { MONSTERS } from '../game/content/monsters'
import { SCHOOLS } from '../game/content/schools/schools'
import { SPELLS } from '../game/content/spells/spells'
import { STATUS_DEFINITIONS } from '../game/content/statuses/statuses'
import { formatAutoCastCondition, formatCombatEffect, formatCombatModifier, formatCombatRule, formatDuration, formatReadableId } from '../game/content/presentation/balanceFormatters'
import { DEFAULT_ENEMY_CRIT_CHANCE, DEFAULT_ENEMY_CRIT_DAMAGE_MULTIPLIER, DEFAULT_ENEMY_DEFENSE } from '../game/core/balance/combatStats'
import type { ActiveStatus } from '../game/systems/combat/combatTypes'
import type { GameState, MonsterId, SpellId, StatusId } from '../game/types'

export const getDeveloperSpellView = (state: Pick<GameState, 'progress' | 'activities'>, spellId: SpellId) => {
  const spell = SPELLS[spellId]
  const rank = state.progress.spellRanks[spellId] ?? null
  return {
    name: spell.name,
    school: SCHOOLS[spell.school].name,
    type: formatReadableId(spell.type),
    rank: rank ? `Rank ${rank}` : 'Locked',
    unlockLevel: spell.unlockLevel,
    manaCost: spell.manaCost,
    cooldown: formatDuration(spell.cooldownMs),
    autoCast: Boolean(state.activities.autoCast[spellId]),
    effects: spell.effects.map((effect) => formatCombatEffect(effect)),
    autoCastCondition: formatAutoCastCondition(spell.autoCondition),
  }
}

export const getDeveloperMonsterView = (state: Pick<GameState, 'progress'>, monsterId: MonsterId) => {
  const monster = MONSTERS[monsterId]
  const dungeon = getMonsterDungeon(monsterId)
  return {
    name: monster.name,
    dungeon: dungeon?.dungeonName ?? 'Unassigned',
    role: dungeon?.role === 'boss' ? 'Boss' : 'Normal enemy',
    maxHealth: monster.maxHealth,
    basicDamage: monster.basicAttackDamage,
    attackTime: formatDuration(monster.basicAttackTimeMs),
    defense: monster.defense ?? DEFAULT_ENEMY_DEFENSE,
    critChance: monster.critChance ?? DEFAULT_ENEMY_CRIT_CHANCE,
    critDamage: monster.critDamage ?? DEFAULT_ENEMY_CRIT_DAMAGE_MULTIPLIER,
    blockChance: monster.blockChance ?? 0,
    kills: state.progress.lifetimeKillsByMonster[monsterId] ?? 0,
    bossKills: state.progress.bossKillsByBoss[monsterId] ?? 0,
    patternNames: Object.values(monster.actionPatterns).map((pattern) => ({ name: formatReadableId(pattern.id), steps: pattern.steps.map((step) => step.type === 'basic' ? 'Basic Attack' : monster.actions[step.actionId]?.name ?? formatReadableId(step.actionId)) })),
  }
}

export const getDeveloperStatusView = (state: Pick<GameState, 'combat'>, statusId: StatusId) => {
  const status = STATUS_DEFINITIONS[statusId]
  const instances = [...state.combat.playerStatuses, ...state.combat.enemyStatuses].filter((entry: ActiveStatus) => entry.statusId === statusId)
  return {
    name: status.name,
    classification: formatReadableId(status.classification),
    duration: formatDuration(status.defaultDurationMs),
    stacking: `${formatReadableId(status.stacking.mode)}${status.stacking.maxStacks ? ` · up to ${status.stacking.maxStacks}` : ''}`,
    cleanseable: status.cleanseable ? 'Allowed' : 'Not allowed',
    dispellable: status.dispellable ? 'Allowed' : 'Not allowed',
    playerInstances: instances.filter((entry) => entry.holder === 'player').length,
    enemyInstances: instances.filter((entry) => entry.holder === 'enemy').length,
    modifiers: (status.modifiers ?? []).map(formatCombatModifier),
    periodic: (status.periodic?.effects ?? []).map((effect) => formatCombatEffect(effect, { statusHolder: true })),
    tickEvery: status.periodic ? formatDuration(status.periodic.intervalMs) : 'Not periodic',
    triggers: (status.triggers ?? []).map(formatCombatRule),
  }
}
