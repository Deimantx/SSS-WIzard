import { describe, expect, it } from 'vitest'
import { ITEMS } from '../../content/items/items'
import { getTransmutationRecipeCardMeta } from './transmutationRecipeCardPresentation'

describe('Transmutation recipe card metadata', () => {
  it('presents authored material tiers and human classifications', () => {
    expect(getTransmutationRecipeCardMeta(ITEMS['fire-fragment']).badges).toEqual(['T1', 'ELEMENTAL'])
    expect(getTransmutationRecipeCardMeta(ITEMS['prismatic-fragment']).badges).toEqual(['T1', 'ARCANE'])
  })

  it('presents the authored Weapon slot without handedness metadata', () => {
    expect(getTransmutationRecipeCardMeta(ITEMS['tideglass-wand'])).toMatchObject({ badges: ['WEAPON'], tier: null })
    expect(getTransmutationRecipeCardMeta(ITEMS['ember-staff'])).toMatchObject({ badges: ['WEAPON'], tier: null })
  })
})
