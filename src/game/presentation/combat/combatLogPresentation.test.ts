import { describe, expect, it } from 'vitest'
import { presentCombatLogEntry } from './combatLogPresentation'
import type { CombatLogEntry } from '../../systems/combat/combatTypes'

const spellDamageEntry: CombatLogEntry = {
  id: 1,
  sequence: 1,
  timestampMs: 1_000,
  source: { kind: 'player' },
  target: 'enemy',
  targetMonsterId: 'forest-wisp',
  category: 'spell',
  spellId: 'fire-bolt',
  damageType: 'fire',
  amount: 22,
  healthDamage: 17,
  barrierAbsorbed: 5,
}

describe('presentCombatLogEntry', () => {
  it('keeps the authored spell and captured enemy identity in the readable row', () => {
    const presentation = presentCombatLogEntry(spellDamageEntry, 2_000)

    expect(presentation.sourceLabel).toBe('Your Wizard')
    expect(presentation.actionLabel).toBe('Fire Bolt')
    expect(presentation.message).toContain('Fire Bolt')
    expect(presentation.message).toContain('Forest Wisp')
    expect(presentation.result).toContain('22 FIRE DAMAGE')
    expect(presentation.result).toContain('5 absorbed')
    expect(presentation.result).toContain('17 HP')
    expect(presentation.semanticClass).toBe('log-damage-fire')
    expect(presentation.timeLabel).toBe('1.0s')
  })
})
