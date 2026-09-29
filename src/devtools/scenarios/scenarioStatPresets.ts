import { useGameStore } from '../../store/gameStore'
import { PLAYER_STAT_FIELD_REGISTRY } from '../playerStats/playerStatFieldRegistry'
import type { ScenarioReadyPreset } from './scenarioReadyPresetStore'

export const applyTestReadyPlayerPreset = (preset: ScenarioReadyPreset) => {
  let state = useGameStore.getState()
  // TEST READY owns only the Player Stat Lab section and its explicit run flags.
  state.resetDebugPlayerStats()
  for (const field of PLAYER_STAT_FIELD_REGISTRY) {
    const value = preset.stats[field.path] ?? 0
    if (value !== 0) useGameStore.getState().setDebugPlayerStatValue(field.path, value)
  }
  state = useGameStore.getState()
  state.setDebugPlayerImmortal(preset.godMode)
  state.setDebugInfiniteMana(preset.infiniteMana)
  if (preset.clearStatuses) state.clearPlayerStatuses()
  if (preset.clearBarrier) state.clearPlayerBarrier()
  state = useGameStore.getState()
  const player = { ...(preset.refillHealth ? { health: state.player.maxHealth } : {}), ...(preset.refillMana ? { mana: state.player.maxMana } : {}) }
  if (Object.keys(player).length) state.setPlayer(player)
  return useGameStore.getState()
}
