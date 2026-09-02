import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '../ui/tooltip/Tooltip'
import { MONSTERS } from '../../game/content/monsters'
import { EnemyPatternPreview } from './EnemyPatternPreview'

describe('EnemyPatternPreview', () => {
  it('renders authored steps, arrows and a static repeat marker', () => {
    const monster = MONSTERS['grove-sentinel']
    const { container } = render(<TooltipProvider><EnemyPatternPreview monster={monster} pattern={monster.actionPatterns.default} /></TooltipProvider>)
    expect(container.querySelectorAll('.enemy-pattern-preview-node')).toHaveLength(monster.actionPatterns.default.steps.length)
    expect(container.querySelectorAll('.enemy-pattern-preview-arrow')).toHaveLength(monster.actionPatterns.default.steps.length - 1)
    expect(container.querySelector('.enemy-pattern-preview-repeat')).toBeTruthy()
    expect(container.querySelector('[aria-current]')).toBeNull()
    expect(screen.queryByText('NEXT PATTERN')).toBeNull()
  })
})
