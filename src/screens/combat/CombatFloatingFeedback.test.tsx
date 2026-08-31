import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CombatFloatingFeedback } from './CombatFloatingFeedback'

describe('CombatFloatingFeedback', () => {
  it('keeps floating feedback bounded during repeated meaningful events', () => {
    const view = render(<CombatFloatingFeedback actor="enemy" health={100} barrier={0} resetKey="forest-wisp" />)
    for (const health of [80, 60, 40, 20, 10, 0]) view.rerender(<CombatFloatingFeedback actor="enemy" health={health} barrier={0} resetKey="forest-wisp" />)
    expect(document.querySelectorAll('.combat-floating-feedback-item').length).toBeLessThanOrEqual(6)
  })
})
