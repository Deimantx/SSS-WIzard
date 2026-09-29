import type { DamageType, ModifierKey } from '../../game/systems/combat/combatTypes'

export type PlayerStatPresetField = { id: string; label: string; path: string; kind: 'flat' | 'percent'; group: 'Core' | 'Offensive' | 'Defensive' | 'Sustain / Control' | 'Elemental'; element?: DamageType }
const core = (id: string, label: string, kind: 'flat' | 'percent' = 'flat'): PlayerStatPresetField => ({ id, label, path: `core.${id}`, kind, group: 'Core' })
const modifier = (path: ModifierKey, label: string, group: PlayerStatPresetField['group'], kind: 'flat' | 'percent' = 'percent'): PlayerStatPresetField => ({ id: path, label, path: `modifiers.${path}`, kind, group })

export const PLAYER_STAT_FIELD_REGISTRY: readonly PlayerStatPresetField[] = [
  core('maxHealthFlat', 'Max Health Flat'), core('maxHealthPercent', 'Max Health %', 'percent'), core('healthRegenFlat', 'Health Regen'),
  core('maxManaFlat', 'Max Mana Flat'), core('maxManaPercent', 'Max Mana %', 'percent'), core('manaRegenFlat', 'Mana Regen Flat'), core('manaRegenPercent', 'Mana Regen %', 'percent'),
  core('spellPowerFlat', 'Spell Power Flat'), core('spellPowerPercent', 'Spell Power %', 'percent'), core('manaCostReductionPercent', 'Mana Cost Reduction', 'percent'),
  modifier('damage-dealt-percent', 'Damage Dealt %', 'Offensive'), modifier('spell-damage-percent', 'Spell Damage %', 'Offensive'),
  modifier('crit-chance', 'Crit Chance', 'Offensive'), modifier('crit-damage', 'Crit Damage', 'Offensive'), modifier('damage-over-time-percent', 'DoT Damage', 'Offensive'),
  modifier('cooldown-recovery-percent', 'Cooldown Recovery', 'Offensive'), modifier('spell-cast-time-percent', 'Spell Cast Time', 'Offensive'),
  modifier('defense-flat', 'Defense Flat', 'Defensive', 'flat'), modifier('defense-percent', 'Defense %', 'Defensive'), modifier('damage-taken-percent', 'Damage Taken', 'Defensive'),
  modifier('healing-done-percent', 'Healing Done', 'Sustain / Control'), modifier('healing-received-percent', 'Healing Received', 'Sustain / Control'),
  modifier('barrier-power-percent', 'Barrier Power', 'Sustain / Control'), modifier('barrier-received-flat', 'Barrier Received Flat', 'Sustain / Control', 'flat'), modifier('barrier-received-percent', 'Barrier Received %', 'Sustain / Control'),
  modifier('status-duration-dealt-percent', 'Status Duration Dealt', 'Sustain / Control'), modifier('status-duration-received-percent', 'Status Duration Received', 'Sustain / Control'), modifier('control-duration-received-percent', 'Control Duration Received', 'Sustain / Control'),
  ...(['physical', 'arcane', 'fire', 'water', 'earth', 'air'] as const).map((element) => ({ id: `spell-${element}`, label: `${element[0].toUpperCase()}${element.slice(1)} Spell Damage %`, path: `spellDamageByType.${element}`, kind: 'percent' as const, group: 'Elemental' as const, element })),
  ...(['physical', 'arcane', 'fire', 'water', 'earth', 'air'] as const).map((element) => ({ id: `resistance-${element}`, label: `${element[0].toUpperCase()}${element.slice(1)} Resistance %`, path: `resistanceByType.${element}`, kind: 'percent' as const, group: 'Elemental' as const, element })),
]

export const PLAYER_STAT_PRESET_GROUPS = ['Core', 'Offensive', 'Defensive', 'Sustain / Control', 'Elemental'] as const
