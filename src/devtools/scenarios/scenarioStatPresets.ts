import { useGameStore } from '../../store/gameStore'

/** Shared, intentionally finite tester bonuses; no invulnerability or infinite-resource flags. */
export const SCENARIO_PLAYER_PRESETS = {
  'test-ready': { maxHealthFlat: 150, maxManaFlat: 50, healthRegenFlat: 2, manaRegenFlat: 5, spellPowerPercent: 0.35 },
} as const

export const applyTestReadyPlayerPreset = () => {
  let state = useGameStore.getState()
  state.resetDebugOverrides()
  const preset = SCENARIO_PLAYER_PRESETS['test-ready']
  for (const [key, value] of Object.entries(preset)) state.setDebugPlayerStatValue(`core.${key}`, value)
  state = useGameStore.getState()
  state.setPlayer({ health: state.player.maxHealth, mana: state.player.maxMana })
  state.clearPlayerStatuses()
  state.clearPlayerBarrier()
  state.setDebugPlayerImmortal(false)
  state.setDebugInfiniteMana(false)
  return state
}
