import type { DebugOverrides } from '../game/types'

export interface ActiveDebugOverride {
  id: string
  key: keyof DebugOverrides
  label: string
  group: 'combat' | 'resource' | 'progression' | 'system'
  tone: 'warning' | 'danger'
}

type DebugOverrideDefinition = {
  key: keyof DebugOverrides
  label: string | ((value: DebugOverrides[keyof DebugOverrides]) => string)
  group: ActiveDebugOverride['group']
  tone?: ActiveDebugOverride['tone']
  active: (value: DebugOverrides[keyof DebugOverrides]) => boolean
}

// Exhaustive by design: a new runtime override must get an explicit label and
// active-state rule before the presentation compiles.
export const DEBUG_OVERRIDE_KEYS = [
  'playerStats', 'allowManaOverCap', 'showLockedTransmutationRecipes', 'showLockedArtificingRecipes',
  'playerImmortal', 'enemyImmortal', 'infiniteMana', 'ignoreSpellCooldowns', 'disableAutoCast', 'freezePlayerActions',
  'freezeEnemyActions', 'combatPaused', 'combatTimeScale', 'artifactFreeRankPurchase', 'artifactIgnoreOwnership',
  'arcaneCoreFreeCosts', 'arcaneCoreIgnorePrerequisites', 'bonusAcolytes', 'acolyteTotalOverride', 'ignoreAcolyteLimit', 'arcaneFluxCapacityOverride',
] as const satisfies readonly (keyof DebugOverrides)[]

const definitions: readonly DebugOverrideDefinition[] = [
  { key: 'playerStats', label: 'PLAYER STAT LAB', group: 'combat', active: (value) => Object.values(value as object).some((entry) => typeof entry === 'number' ? entry !== 0 : Object.values(entry as object).some((nested) => typeof nested === 'number' && nested !== 0)) },
  { key: 'allowManaOverCap', label: 'MANA OVERCAP', group: 'resource', active: Boolean },
  { key: 'showLockedTransmutationRecipes', label: 'SHOW LOCKED TRANSMUTATION', group: 'system', active: Boolean },
  { key: 'showLockedArtificingRecipes', label: 'SHOW LOCKED ARTIFICING', group: 'system', active: Boolean },
  { key: 'playerImmortal', label: 'PLAYER IMMORTAL', group: 'combat', tone: 'danger', active: Boolean },
  { key: 'enemyImmortal', label: 'ENEMY IMMORTAL', group: 'combat', tone: 'danger', active: Boolean },
  { key: 'infiniteMana', label: 'INFINITE MANA', group: 'resource', active: Boolean },
  { key: 'ignoreSpellCooldowns', label: 'IGNORE COOLDOWNS', group: 'combat', active: Boolean },
  { key: 'disableAutoCast', label: 'AUTO-CAST OFF', group: 'combat', active: Boolean },
  { key: 'freezePlayerActions', label: 'PLAYER FROZEN', group: 'combat', active: Boolean },
  { key: 'freezeEnemyActions', label: 'ENEMY FROZEN', group: 'combat', active: Boolean },
  { key: 'combatPaused', label: 'COMBAT PAUSED', group: 'combat', tone: 'danger', active: Boolean },
  { key: 'combatTimeScale', label: (value) => `COMBAT x${value}`, group: 'combat', active: (value) => value !== 1 },
  { key: 'artifactFreeRankPurchase', label: 'FREE ARTIFACT RANKS', group: 'progression', active: Boolean },
  { key: 'artifactIgnoreOwnership', label: 'IGNORE ARTIFACT OWNERSHIP', group: 'progression', active: Boolean },
  { key: 'arcaneCoreFreeCosts', label: 'FREE ARCANE CORE', group: 'progression', active: Boolean },
  { key: 'arcaneCoreIgnorePrerequisites', label: 'IGNORE ARCANE GATES', group: 'progression', active: Boolean },
  { key: 'bonusAcolytes', label: (value) => `+${value} DEV ACOLYTES`, group: 'resource', active: (value) => value !== 0 },
  { key: 'acolyteTotalOverride', label: (value) => `ACOLYTE TOTAL ${value}`, group: 'resource', active: (value) => value !== null },
  { key: 'ignoreAcolyteLimit', label: 'IGNORE ACOLYTE LIMIT', group: 'resource', active: Boolean },
  { key: 'arcaneFluxCapacityOverride', label: (value) => `FLUX CAPACITY ${value}`, group: 'resource', active: (value) => value !== null },
]

const definitionKeys = definitions.map((definition) => definition.key)
if (definitionKeys.length !== DEBUG_OVERRIDE_KEYS.length || DEBUG_OVERRIDE_KEYS.some((key) => !definitionKeys.includes(key))) throw new Error('Debug override presentation is not exhaustive.')

export const getActiveDebugOverrides = (debug: DebugOverrides): ActiveDebugOverride[] => definitions.flatMap((definition) => {
  const value = debug[definition.key]
  if (!definition.active(value)) return []
  return [{ id: String(definition.key), key: definition.key, label: typeof definition.label === 'function' ? definition.label(value) : definition.label, group: definition.group, tone: definition.tone ?? 'warning' }]
})

export const hasActiveDebugOverrides = (debug: DebugOverrides) => getActiveDebugOverrides(debug).length > 0
