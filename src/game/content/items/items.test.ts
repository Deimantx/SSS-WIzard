import { describe, expect, it } from 'vitest'
import type { ItemId } from '../../types'
import { ACT0_ITEMS } from './act0'
import { ACT1_ITEMS } from './act1'
import { ITEMS, validateItemDefinitions } from './items'
import { mergeItemRegistries } from './shared/itemAuthoring'
import { SHARED_ITEMS } from './shared/universalItems'

const ITEM_IDS: readonly ItemId[] = [
  // Shared / global materials
  'fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment', 'prismatic-fragment', 'artifact-essence', 'life-essence',
  // Act 0 — Artifacts and dungeons
  'ember-staff', 'tideglass-wand', 'stoneheart-scepter', 'windthread-wand', 'wispweave-robe', 'wispveil-hood',
  'windthread-charm', 'grovekeeper-mantle', 'wispglass-earring', 'wispbound-ring', 'heartseed-necklace',
  'predator-hide-mantle', 'fangwire-earring', 'howling-signet', 'greatbear-heartstone',
  'ossuary-mantle', 'mourning-glass-earring', 'gravebinder-ring', 'soulglass-amulet', 'edrins-signet', 'black-portal-shard',
  // Act 1 — Artifacts and dungeons
  'galeshard-staff', 'reliquary-scepter', 'pyrebound-staff', 'rootheart-scepter',
  'galeglass-earring', 'riftwind-ring', 'waystone-pendant', 'fractured-ward-mantle', 'gatekeeper-sigil',
  'mistglass-earring', 'reliquary-ring', 'drowned-chain-pendant', 'keepers-tide-seal',
  'cinderwire-earring', 'ashbrand-ring', 'emberwatch-mantle', 'revenant-emberstone',
  'briar-earring', 'rootbound-ring', 'mossguard-mantle', 'ancient-heart-knot',
  'wayfarer-earring', 'crossroads-signet', 'confluence-pendant', 'keepers-roadseal',
  'graveglass-earring', 'shardbone-ring', 'mourner-veil-mantle', 'behemoth-heartshard',
  'voltglass-earring', 'stormcoil-ring', 'gale-scribe-pendant', 'archivists-conductor',
  'starfall-ring', 'lenskeeper-earring', 'astral-pendant', 'fallen-astromancer-lens',
  'meridian-ring', 'linebreaker-earring', 'fractured-conduit-pendant', 'leyline-mantle', 'splitters-meridian-core',
  'nameless-ring', 'whisper-earring', 'unbound-seal-pendant', 'prelates-unspoken-seal',
  'black-sigil-ring', 'inkbound-earring', 'vaultseal-mantle', 'wardens-black-sigil',
  'gatebound-ring', 'portal-echo-earring', 'blackgate-pendant', 'voidward-mantle', 'black-gatekeepers-seal',
]

describe('items content architecture', () => {
  it('keeps every gameplay ItemId in the canonical runtime registry', () => {
    ITEM_IDS.forEach((itemId) => expect(ITEMS[itemId]).toBeDefined())
    expect(Object.keys(ITEMS)).toHaveLength(ITEM_IDS.length)
  })

  it('rejects duplicate authored IDs during registry merge', () => {
    expect(() => mergeItemRegistries(SHARED_ITEMS, SHARED_ITEMS)).toThrow('Duplicate authored ItemId')
  })

  it('keeps shared, Act 0, and Act 1 ownership IDs unique', () => {
    const authoredIds = [...Object.keys(SHARED_ITEMS), ...Object.keys(ACT0_ITEMS), ...Object.keys(ACT1_ITEMS)]
    expect(new Set(authoredIds).size).toBe(authoredIds.length)
    expect(authoredIds).toHaveLength(ITEM_IDS.length)
  })

  it('keeps representative item ownership in the Act 0 and Act 1 registries', () => {
    expect(ACT0_ITEMS['heartseed-necklace']).toBeDefined()
    expect(ACT0_ITEMS['edrins-signet']).toBeDefined()
    expect(ACT1_ITEMS['gatekeeper-sigil']).toBeDefined()
    expect(ACT1_ITEMS['mistglass-earring']).toBeDefined()
    expect(ACT1_ITEMS['black-gatekeepers-seal']).toBeDefined()
    expect(ACT0_ITEMS['gatekeeper-sigil']).toBeUndefined()
    expect(ACT1_ITEMS['heartseed-necklace']).toBeUndefined()
  })

  it('validates all canonical item definitions', () => {
    expect(validateItemDefinitions()).toEqual([])
  })
})
