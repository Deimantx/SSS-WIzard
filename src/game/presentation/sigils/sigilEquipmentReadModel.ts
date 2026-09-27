import { SIGIL_SETS } from '../../content/sigils/sigilSets'
import { SIGIL_STAT_DEFINITIONS } from '../../content/sigils/sigilStats'
import { SIGIL_TRAITS } from '../../content/sigils/sigilTraits'
import { resolveSigilStatsForInstance } from '../../systems/sigils/sigilRuntime'
import type { SigilInstance, SigilStatId } from '../../types'

const roman = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const

export const getSigilSlotRoman = (slot: SigilInstance['slot']) => roman[slot - 1]

export const formatSigilStatValue = (statId: SigilStatId, value: number, signed = false) => {
  const isPercent = statId.endsWith('Pct') || statId === 'critChance' || statId === 'critDamage'
  const formatted = isPercent ? `${(value * 100).toFixed(1)}%` : Number.isInteger(value) ? Math.round(value).toLocaleString() : value.toFixed(1)
  return signed && value > 0 ? `+${formatted}` : formatted
}

export const getSigilStatEntries = (sigil: SigilInstance) => {
  const stats = resolveSigilStatsForInstance(sigil)
  return Object.entries(stats).filter((entry): entry is [SigilStatId, number] => entry[1] !== undefined && Number.isFinite(entry[1]))
}

export const getSigilSearchText = (sigil: SigilInstance) => [
  SIGIL_SETS[sigil.setId].name,
  sigil.quality,
  `tier ${sigil.tier}`,
  `slot ${getSigilSlotRoman(sigil.slot)}`,
  SIGIL_STAT_DEFINITIONS[sigil.mainStatId].label,
  ...sigil.secondaries.map(({ statId }) => SIGIL_STAT_DEFINITIONS[statId].label),
  ...sigil.traitIds.map((traitId) => SIGIL_TRAITS[traitId].name),
].join(' ').toLocaleLowerCase()
