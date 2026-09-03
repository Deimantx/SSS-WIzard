import { clamp } from '../../game/utils'
import type { DebugOverrides, GameState } from '../../game/types'

export const COMBAT_TIME_SCALES = [0.25, 0.5, 1, 2, 5, 10] as const
export type CombatTimeScale = typeof COMBAT_TIME_SCALES[number]

export const createDefaultDebugOverrides = (): DebugOverrides => ({
  bonusManaRegenFlat: 0,
  bonusMaxManaFlat: 0,
  bonusMaxFocusFlat: 0,
  allowManaOverCap: false,
  allowFocusOverCap: false,
  ignoreEchoLimit: false,
  transmutationEchoCapacityOverride: null,
  showLockedTransmutationRecipes: false,
  playerImmortal: false,
  enemyImmortal: false,
  infiniteMana: false,
  ignoreSpellCooldowns: false,
  disablePlayerBasicAttack: false,
  disableAutoCast: false,
  freezePlayerActions: false,
  freezeEnemyActions: false,
  combatPaused: false,
  combatTimeScale: 1,
})
export const sanitizeDebugNumber = (value: number) => Number.isFinite(value) ? clamp(value, 0, 1_000_000_000) : 0
export const sanitizeCombatTimeScale = (value: number): CombatTimeScale => COMBAT_TIME_SCALES.includes(value as CombatTimeScale) ? value as CombatTimeScale : 1
export const resetDebugState = (state: GameState) => { state.debug = createDefaultDebugOverrides() }
export const resetCombatDebugState = (state: GameState) => {
  state.debug.playerImmortal = false
  state.debug.enemyImmortal = false
  state.debug.infiniteMana = false
  state.debug.ignoreSpellCooldowns = false
  state.debug.disablePlayerBasicAttack = false
  state.debug.disableAutoCast = false
  state.debug.freezePlayerActions = false
  state.debug.freezeEnemyActions = false
  state.debug.combatPaused = false
  state.debug.combatTimeScale = 1
}
