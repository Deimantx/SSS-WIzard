import { clamp } from '../../game/utils'
import type { DebugOverrides, GameState } from '../../game/types'

export const createDefaultDebugOverrides = (): DebugOverrides => ({ bonusManaRegenFlat: 0, bonusMaxManaFlat: 0, bonusMaxFocusFlat: 0, allowManaOverCap: false, allowFocusOverCap: false, ignoreEchoLimit: false })
export const sanitizeDebugNumber = (value: number) => Number.isFinite(value) ? clamp(value, 0, 1_000_000_000) : 0
export const resetDebugState = (state: GameState) => { state.debug = createDefaultDebugOverrides() }
