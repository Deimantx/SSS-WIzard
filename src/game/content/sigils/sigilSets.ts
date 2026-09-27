import type { EquipmentStats } from '../../types'

export type SigilSetId = 'arcane' | 'vital' | 'ward' | 'precision' | 'conduit' | 'restoration' | 'sage' | 'cinder' | 'tempest' | 'echo' | 'dominion' | 'predator'

export interface SigilSetDefinition {
  id: SigilSetId
  name: string
  piecesRequired: 2 | 4
  description: string
  staticStats?: EquipmentStats
  combatProvider?: 'tempest' | 'echo' | 'predator'
  collectionOrder: number
}

const twoPiece = (id: SigilSetId, name: string, description: string, staticStats: EquipmentStats, collectionOrder: number): SigilSetDefinition => ({ id, name, piecesRequired: 2, description, staticStats, collectionOrder })
const fourPiece = (id: SigilSetId, name: string, description: string, collectionOrder: number, combatProvider?: SigilSetDefinition['combatProvider'], staticStats?: EquipmentStats): SigilSetDefinition => ({ id, name, piecesRequired: 4, description, collectionOrder, combatProvider, staticStats })

export const SIGIL_SETS: Record<SigilSetId, SigilSetDefinition> = {
  arcane: twoPiece('arcane', 'Arcane', '+8% Spell Power', { spellPowerPct: .08 }, 1),
  vital: twoPiece('vital', 'Vital', '+12% Max Health', { maxHealthPct: .12 }, 2),
  ward: twoPiece('ward', 'Ward', '+12% Barrier Power', { barrierPowerPct: .12 }, 3),
  precision: twoPiece('precision', 'Precision', '+7.5% Critical Rate', { critChance: .075 }, 4),
  conduit: twoPiece('conduit', 'Conduit', '+12% Max Mana', { maxManaPct: .12 }, 5),
  restoration: twoPiece('restoration', 'Restoration', '+10% Healing Done', { healingDonePct: .1 }, 6),
  sage: twoPiece('sage', 'Sage', '+8% Mana Cost Reduction', { manaCostReductionPct: .08 }, 7),
  cinder: fourPiece('cinder', 'Cinder', '+25% Damage over Time', 8, undefined, { damageOverTimePct: .25 }),
  tempest: fourPiece('tempest', 'Tempest', 'Every 5th committed player spell reduces active spell cooldowns by 300ms.', 9, 'tempest'),
  echo: fourPiece('echo', 'Echo', 'Direct player spells have an 8% chance to echo at 35% effectiveness.', 10, 'echo'),
  dominion: fourPiece('dominion', 'Dominion', '+20% Status Duration', 11, undefined, { statusDurationPct: .2 }),
  predator: fourPiece('predator', 'Predator', '+15% outgoing player damage against bosses.', 12, 'predator'),
}

export const SIGIL_SET_IDS = Object.keys(SIGIL_SETS) as SigilSetId[]

export const getSigilSetBonusCount = (setId: SigilSetId, pieces: number) => {
  const definition = SIGIL_SETS[setId]
  return definition.piecesRequired === 2 ? Math.floor(pieces / 2) : pieces >= 4 ? 1 : 0
}

export const getSigilSetBonuses = (counts: Partial<Record<SigilSetId, number>>): EquipmentStats => {
  const total: EquipmentStats = {}
  Object.entries(counts).forEach(([rawId, pieces]) => {
    const set = SIGIL_SETS[rawId as SigilSetId]
    if (!set || !set.staticStats) return
    const copies = getSigilSetBonusCount(set.id, pieces ?? 0)
    Object.entries(set.staticStats).forEach(([key, value]) => {
      const statKey = key as keyof EquipmentStats
      total[statKey] = ((total[statKey] as number | undefined) ?? 0) + value * copies
    })
  })
  return total
}
