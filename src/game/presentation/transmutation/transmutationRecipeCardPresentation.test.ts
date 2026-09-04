import { describe, expect, it } from 'vitest'
import { ITEMS } from '../../content/items/items'
import { getTransmutationRecipeCardMeta } from './transmutationRecipeCardPresentation'

describe('Transmutation recipe card metadata', () => {
  it('presents authored material tiers and human classifications', () => {
    expect(getTransmutationRecipeCardMeta(ITEMS['fire-fragment']).badges).toEqual(['T1', 'ELEMENTAL'])
    expect(getTransmutationRecipeCardMeta(ITEMS['prismatic-fragment']).badges).toEqual(['T1', 'ARCANE'])
  })

  it('presents authored Equipment slot, hands, and offhand type without inventing a tier', () => {
    expect(getTransmutationRecipeCardMeta(ITEMS['wispwood-wand'])).toMatchObject({ badges: ['WEAPON', '1H'], tier: null })
    expect(getTransmutationRecipeCardMeta(ITEMS['ember-staff'])).toMatchObject({ badges: ['WEAPON', '2H'], tier: null })
    expect(getTransmutationRecipeCardMeta(ITEMS['soulward-focus'])).toMatchObject({ badges: ['OFFHAND', 'FOCUS'], tier: null })
  })
})
