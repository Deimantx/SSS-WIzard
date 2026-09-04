import type { ItemDefinition } from '../../types'

export interface TransmutationRecipeCardMeta {
  badges: string[]
  tier: number | null
}

const MATERIAL_SUBTYPE_LABELS: Record<NonNullable<ItemDefinition['materialSubtype']>, string> = {
  elemental: 'ELEMENTAL',
  creature: 'CREATURE',
  ore: 'ORE',
  refined: 'REFINED',
  arcane: 'ARCANE',
}

/** Human-readable card metadata; runtime IDs and authored values stay outside the screen component. */
export function getTransmutationRecipeCardMeta(item: ItemDefinition): TransmutationRecipeCardMeta {
  if (item.kind === 'equipment') {
    const badges = [item.equipmentSlot?.toUpperCase() ?? 'EQUIPMENT']
    if (item.weaponHands) badges.push(`${item.weaponHands}H`)
    if (item.equipmentPresentation) badges.push(item.equipmentPresentation.toUpperCase())
    return { badges, tier: null }
  }

  const tier = item.materialTier ?? null
  const subtype = item.materialSubtype ? MATERIAL_SUBTYPE_LABELS[item.materialSubtype] : 'MATERIAL'
  return { badges: [tier === null ? 'MATERIAL' : `T${tier}`, subtype], tier }
}
