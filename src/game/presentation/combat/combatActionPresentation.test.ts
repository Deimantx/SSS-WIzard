import { describe, expect, it } from 'vitest'
import { MONSTERS } from '../../content/monsters'
import { buildCombatActionPresentation } from './combatActionPresentation'

describe('combat action presentation', () => {
  it('keeps action effects structured for semantic UI rendering', () => {
    const presentation = buildCombatActionPresentation(MONSTERS['stone-root'].actions['root-slam'])
    expect(presentation.effects[0]).toMatchObject({ kind: 'damage', value: '18', damageType: 'physical', targetLabel: 'Player' })
    expect(presentation.effects[1]).toMatchObject({ kind: 'control', value: '+0.7s', targetLabel: 'Player', timeLabel: '0.7s' })
  })
})
