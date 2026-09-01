import type { DebugOverrides } from '../game/types'

export interface ActiveDebugOverride {
  id: string
  label: string
  group: 'combat' | 'resource' | 'system'
  tone: 'warning' | 'danger'
}

export const getActiveDebugOverrides = (debug: DebugOverrides): ActiveDebugOverride[] => {
  const active: ActiveDebugOverride[] = []
  const add = (id: string, label: string, group: ActiveDebugOverride['group'] = 'combat', tone: ActiveDebugOverride['tone'] = 'warning') => active.push({ id, label, group, tone })
  if (debug.playerImmortal) add('player-immortal', 'PLAYER IMMORTAL', 'combat', 'danger')
  if (debug.enemyImmortal) add('enemy-immortal', 'ENEMY IMMORTAL', 'combat', 'danger')
  if (debug.infiniteMana) add('infinite-mana', 'INFINITE MANA', 'resource')
  if (debug.ignoreSpellCooldowns) add('ignore-cooldowns', 'IGNORE COOLDOWNS', 'combat')
  if (debug.disablePlayerBasicAttack) add('basic-attack-off', 'BASIC ATTACK OFF', 'combat')
  if (debug.disableAutoCast) add('auto-cast-off', 'AUTO-CAST OFF', 'combat')
  if (debug.freezePlayerActions) add('player-frozen', 'PLAYER FROZEN', 'combat')
  if (debug.freezeEnemyActions) add('enemy-frozen', 'ENEMY FROZEN', 'combat')
  if (debug.combatPaused) add('combat-paused', 'COMBAT PAUSED', 'combat', 'danger')
  if (debug.combatTimeScale !== 1) add('combat-speed', `COMBAT ×${debug.combatTimeScale}`, 'combat')
  if (debug.bonusManaRegenFlat || debug.bonusMaxManaFlat || debug.bonusMaxFocusFlat || debug.allowManaOverCap || debug.allowFocusOverCap || debug.ignoreEchoLimit || debug.transmutationEchoCapacityOverride !== null) add('resource-overrides', 'RESOURCE OVERRIDES', 'resource')
  return active
}

export const hasActiveDebugOverrides = (debug: DebugOverrides) => getActiveDebugOverrides(debug).length > 0
