import { describe, expect, it } from 'vitest'
import type { ActiveStatus } from '../../systems/combat/combatTypes'
import { getCombatStatusStructureSignature } from './combatStatusPresentation'

const status = (overrides: Partial<ActiveStatus> = {}): ActiveStatus => ({
  statusId: 'burning',
  holder: 'enemy',
  instanceKey: 'burning:source-1',
  source: { actor: 'player', kind: 'spell', sourceId: 'fire-bolt' },
  remainingMs: 4_000,
  initialDurationMs: 5_000,
  stacks: 1,
  ...overrides,
})

describe('combat status structure signature', () => {
  it('ignores countdown-only updates', () => {
    expect(getCombatStatusStructureSignature([status({ remainingMs: 3_000 })])).toBe(getCombatStatusStructureSignature([status({ remainingMs: 900 })]))
  })

  it('changes when status identity or visible stack structure changes', () => {
    const baseline = getCombatStatusStructureSignature([status()])
    expect(getCombatStatusStructureSignature([status({ stacks: 2 })])).not.toBe(baseline)
    expect(getCombatStatusStructureSignature([status({ instanceKey: 'burning:source-2' })])).not.toBe(baseline)
    expect(getCombatStatusStructureSignature([])).not.toBe(baseline)
  })
})
