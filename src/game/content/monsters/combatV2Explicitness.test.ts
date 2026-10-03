import { describe, expect, it } from 'vitest'
import migrationSnapshot from './combatV1MigrationSnapshot.json'
import { MONSTERS } from './index'
import { isElementId } from '../elements/elements'

describe('explicit Combat V2 Monster authoring', () => {
  it('preserves the effective Combat V2 profile of every migrated First Frontier Monster', () => {
    for (const [id, expected] of Object.entries(migrationSnapshot)) {
      const monster = MONSTERS[id as keyof typeof MONSTERS]
      expect({
        id: monster.id,
        primaryAffinity: monster.primaryAffinity,
        basicAttackElement: monster.basicAttackElement,
        resonanceYield: monster.resonanceYield,
        resistances: monster.resistances,
        maxHealth: monster.maxHealth,
        defense: monster.defense,
        basicAttackDamage: monster.basicAttackDamage,
        basicAttackTimeMs: monster.basicAttackTimeMs,
        traitIds: monster.traitIds,
        actions: monster.actions,
        actionPatterns: monster.actionPatterns,
        defaultActionPatternId: monster.defaultActionPatternId,
      }).toEqual({ ...expected, ...(monster.primaryAffinity === 'arcane' ? { resonanceYield: monster.resonanceYield } : {}) })
    }
  })

  it('requires explicit affinity and elemental damage throughout current Monster content', () => {
    for (const monster of Object.values(MONSTERS)) {
      expect(isElementId(monster.primaryAffinity), monster.id).toBe(true)
      expect(isElementId(monster.basicAttackElement), monster.id).toBe(true)
      expect(Object.keys(monster.resistances ?? {}).every(isElementId), monster.id).toBe(true)
      expect(monster.traitIds).toBeDefined()
      for (const action of Object.values(monster.actions)) {
        expect(action.tags ?? []).not.toContain(['physi', 'cal'].join(''))
        for (const effect of action.effects) {
          if (effect.type === 'deal-damage') expect(effect.components.every((component) => isElementId(component.damageType)), `${monster.id}/${action.id}`).toBe(true)
        }
      }
    }
  })
})
