import { describe, expect, it } from 'vitest'
import { ITEMS } from './items/items'
import { MONSTERS, validateMonsterDefinitions } from './monsters'
import { validateItemDefinitions } from './items/items'
import type { ItemDefinition, ItemId } from '../types'
import type { MonsterDefinition } from './monsters'

describe('authored combat stat validation', () => {
  it('rejects non-finite and out-of-range equipment stats', () => {
    const itemId = 'invalid-combat-stats' as ItemId
    const item = {
      ...ITEMS['wispwood-wand'],
      id: itemId,
      stats: {
        defense: -1,
        critChance: 1.01,
        critDamage: -1,
        blockChance: 0.76,
        manaCostReductionPct: 0.81,
        focusEfficiencyPct: 0.81,
        resistances: { fire: 0.76, void: 0 },
        spellPower: Number.NaN,
      },
    } as ItemDefinition
    const errors = validateItemDefinitions({ [itemId]: item })
    expect(errors).toEqual(expect.arrayContaining([
      `${itemId}: invalid equipment stat defense`,
      `${itemId}: invalid equipment stat critChance`,
      `${itemId}: invalid equipment stat critDamage`,
      `${itemId}: invalid equipment stat blockChance`,
      `${itemId}: invalid equipment stat manaCostReductionPct`,
      `${itemId}: invalid equipment stat focusEfficiencyPct`,
      `${itemId}: invalid fire resistance`,
      `${itemId}: invalid void resistance`,
      `${itemId}: non-finite equipment stat spellPower`,
    ]))
  })

  it('rejects invalid optional monster combat stats and resistance keys', () => {
    const monsterId = 'invalid-combat-monster' as MonsterDefinition['id']
    const monster = {
      ...MONSTERS['forest-wisp'],
      id: monsterId,
      defense: -1,
      critChance: 1.01,
      critDamage: 5.01,
      blockChance: 0.76,
      resistances: { fire: 0.76, void: 0 },
    } as MonsterDefinition
    const errors = validateMonsterDefinitions({ [monsterId]: monster })
    expect(errors).toEqual(expect.arrayContaining([
      `${monsterId}: invalid defense`,
      `${monsterId}: invalid crit chance`,
      `${monsterId}: invalid crit damage`,
      `${monsterId}: invalid block chance`,
      `${monsterId}: invalid fire resistance`,
      `${monsterId}: invalid void resistance`,
    ]))
  })
})
