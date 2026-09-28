import { clamp } from '../../game/utils'
import type { DebugOverrides, GameState } from '../../game/types'
import type { DamageType, ModifierKey } from '../../game/systems/combat/combatTypes'

export const COMBAT_TIME_SCALES = [0.25, 0.5, 1, 2, 5, 10] as const
export type CombatTimeScale = typeof COMBAT_TIME_SCALES[number]

export const createDefaultPlayerStatOverrides = () => ({
  maxHealthFlat: 0, maxHealthPercent: 0, healthRegenFlat: 0,
  maxManaFlat: 0, maxManaPercent: 0, manaRegenFlat: 0, manaRegenPercent: 0,
  spellPowerFlat: 0, spellPowerPercent: 0, manaCostReductionPercent: 0,
  modifiers: {} as Partial<Record<ModifierKey, number>>,
  spellDamageByType: {} as Partial<Record<DamageType, number>>,
  resistanceByType: {} as Partial<Record<DamageType, number>>,
})

export const createDefaultDebugOverrides = (): DebugOverrides => ({
  playerStats: createDefaultPlayerStatOverrides(),
  allowManaOverCap: false,
  showLockedTransmutationRecipes: false,
  showLockedArtificingRecipes: false,
  playerImmortal: false,
  enemyImmortal: false,
  infiniteMana: false,
  ignoreSpellCooldowns: false,
  disableAutoCast: false,
  freezePlayerActions: false,
  freezeEnemyActions: false,
  combatPaused: false,
  combatTimeScale: 1,
  artifactFreeRankPurchase: false,
  artifactIgnoreOwnership: false,
  arcaneCoreFreeCosts: false,
  arcaneCoreIgnorePrerequisites: false,
  bonusAcolytes: 0,
  acolyteTotalOverride: null,
  ignoreAcolyteLimit: false,
  arcaneFluxCapacityOverride: null,
})
export const sanitizeDebugNumber = (value: number) => Number.isFinite(value) ? clamp(value, 0, 1_000_000_000) : 0
export const sanitizeCombatTimeScale = (value: number): CombatTimeScale => COMBAT_TIME_SCALES.includes(value as CombatTimeScale) ? value as CombatTimeScale : 1
export const resetDebugState = (state: GameState) => { state.debug = createDefaultDebugOverrides() }
export const resetCombatDebugState = (state: GameState) => {
  state.debug.playerStats = createDefaultPlayerStatOverrides()
  state.debug.playerImmortal = false
  state.debug.enemyImmortal = false
  state.debug.infiniteMana = false
  state.debug.ignoreSpellCooldowns = false
  state.debug.disableAutoCast = false
  state.debug.freezePlayerActions = false
  state.debug.freezeEnemyActions = false
  state.debug.combatPaused = false
  state.debug.combatTimeScale = 1
}
