import type { DamageType, ModifierKey } from '../game/systems/combat/combatTypes'
import type { GameState } from '../game/types'
import { getPlayerCombatStats } from '../game/systems/combat/combatStats'
import { getCombatModifiers, getResistance } from '../game/systems/combat/modifiers'
import { createDefaultPlayerStatOverrides } from '../store/actions/debugActions'
import { recalculateDerivedStats } from '../game/engine'

export const PLAYER_STAT_LAB_DAMAGE_TYPES: readonly DamageType[] = ['arcane', 'fire', 'water', 'earth', 'air']

export const getDeveloperPlayerStatLab = (state: GameState) => {
  const buildState = { ...state, player: { ...state.player }, debug: { ...state.debug, playerStats: createDefaultPlayerStatOverrides() } }
  recalculateDerivedStats(buildState)
  const build = getPlayerCombatStats(buildState)
  const resolved = getPlayerCombatStats(state)
  const modifier = (key: ModifierKey, damageType?: DamageType) => ({
    build: getCombatModifiers(buildState, 'player', key, damageType ? { damageType } : {}),
    resolved: getCombatModifiers(state, 'player', key, damageType ? { damageType } : {}),
  })
  return {
    build,
    resolved,
    metrics: [
      { id: 'damage-dealt-percent', label: 'Damage Dealt', ...modifier('damage-dealt-percent') },
      { id: 'spell-damage-percent', label: 'Spell Damage', ...modifier('spell-damage-percent') },
      { id: 'crit-chance', label: 'Critical Chance', ...modifier('crit-chance') },
      { id: 'crit-damage', label: 'Critical Damage', ...modifier('crit-damage') },
      { id: 'damage-over-time-percent', label: 'Damage over Time', ...modifier('damage-over-time-percent') },
      { id: 'cooldown-recovery-percent', label: 'Cooldown Recovery', ...modifier('cooldown-recovery-percent') },
      { id: 'spell-cast-time-percent', label: 'Spell Cast Time', ...modifier('spell-cast-time-percent') },
      { id: 'damage-taken-percent', label: 'Damage Taken', ...modifier('damage-taken-percent') },
      { id: 'healing-done-percent', label: 'Healing Done', ...modifier('healing-done-percent') },
      { id: 'healing-received-percent', label: 'Healing Received', ...modifier('healing-received-percent') },
      { id: 'barrier-power-percent', label: 'Barrier Power', ...modifier('barrier-power-percent') },
      { id: 'barrier-received-percent', label: 'Barrier Received', ...modifier('barrier-received-percent') },
      { id: 'status-duration-dealt-percent', label: 'Status Duration Dealt', ...modifier('status-duration-dealt-percent') },
      { id: 'status-duration-received-percent', label: 'Status Duration Received', ...modifier('status-duration-received-percent') },
      { id: 'control-duration-received-percent', label: 'Control Duration Received', ...modifier('control-duration-received-percent') },
      { id: 'barrier-received-flat', label: 'Barrier Received Flat', ...modifier('barrier-received-flat') },
    ],
    elemental: PLAYER_STAT_LAB_DAMAGE_TYPES.map((type) => ({
      type,
      spellBuild: getCombatModifiers(buildState, 'player', 'spell-damage-percent', { damageType: type }),
      spellResolved: getCombatModifiers(state, 'player', 'spell-damage-percent', { damageType: type }),
      resistanceBuild: getResistance(buildState, 'player', type),
      resistanceResolved: getResistance(state, 'player', type),
    })),
    activeOverrides: [
      ...Object.entries(state.debug.playerStats).flatMap(([key, value]) => typeof value === 'number' && value !== 0 ? [{ key, value, actor: 'player' as const, section: 'core' as const }] : []),
      ...Object.entries(state.debug.playerStats.modifiers).filter(([, value]) => value !== 0).map(([key, value]) => ({ key, value, actor: 'player' })),
      ...Object.entries(state.debug.playerStats.spellDamageByType).filter(([, value]) => value !== 0).map(([damageType, value]) => ({ key: 'spell-damage-percent', value, actor: 'player', damageTypes: [damageType] })),
      ...Object.entries(state.debug.playerStats.resistanceByType).filter(([, value]) => value !== 0).map(([damageType, value]) => ({ key: 'resistance-percent', value, actor: 'player', damageTypes: [damageType] })),
    ],
  }
}
