import { describe, expect, it } from 'vitest'
import type { MonsterId } from '../../../types'
import { MONSTERS } from '../index'
import { makeAct1Monster, type Act1MonsterSpec } from './act1MonsterFactory'
import { FRACTURED_APPROACH_MONSTERS } from './fracturedApproach'

const fracturedApproachSource = import.meta.glob('./fracturedApproach.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>

describe('Act 1 monster factory authoring types', () => {
  it('requires explicit identity and target Power for Combat V2 specs', () => {
    const valid: Act1MonsterSpec = { dungeonId: 'graveglass-hollow', id: 'graveglass-shade', combatV2: true, primaryAffinity: 'water', basicAttackElement: 'water', targetPower: 5700, name: 'Test', subtitle: 'Test', hp: 100, damage: 10, defense: 5, specials: [{ id: 'action-one', name: 'Action One', damage: [{ type: 'water', coefficient: 1 }] }, { id: 'action-two', name: 'Action Two', damage: [{ type: 'water', coefficient: 1 }] }] }
    expect(makeAct1Monster(valid).primaryAffinity).toBe('water')

    // @ts-expect-error Combat V2 identity and target Power are mandatory.
    const invalid: Act1MonsterSpec = { dungeonId: 'graveglass-hollow', id: 'graveglass-shade', combatV2: true, name: 'Test', subtitle: 'Test', hp: 100, damage: 10, defense: 5, specials: [] }
    expect(invalid).toBeDefined()
  })

  it('authors Fractured Approach through the shared V2 factory without legacy conversion', () => {
    const monsters = FRACTURED_APPROACH_MONSTERS
    expect(Object.keys(monsters)).toHaveLength(5)
    for (const [id, monster] of Object.entries(monsters) as [MonsterId, typeof MONSTERS[MonsterId]][]) {
      expect(monster.primaryAffinity, id).toBeDefined()
      expect(monster.basicAttackElement, id).toBe(monster.primaryAffinity)
      expect(monster.actionPatterns.default.steps.length, id).toBeGreaterThan(0)
    }
    expect(Object.values(fracturedApproachSource)[0]).not.toMatch(/applyCombatV2Profile/)
  })
})
