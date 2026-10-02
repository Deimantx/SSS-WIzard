import { describe, expect, it } from 'vitest'
import { buildCombatStatusDetailPresentation } from './combatStatusDetailPresentation'

describe('combat status detail presentation', () => {
  it('describes source-element periodic damage and its duration total', () => {
    const detail = buildCombatStatusDetailPresentation('bleeding')
    expect(detail.periodic?.effects).toContain('4 source-element damage per tick')
    expect(detail.periodic?.totalEffects).toContain('16 source-element damage over the full duration')
  })
})
