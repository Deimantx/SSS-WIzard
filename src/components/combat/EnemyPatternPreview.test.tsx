import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '../ui/tooltip/Tooltip'
import { MONSTERS } from '../../game/content/monsters'
import { EnemyPatternPreview } from './EnemyPatternPreview'

describe('EnemyPatternPreview', () => {
  it('renders authored steps as the shared icon-only rail with a repeat marker', () => {
    const monster = MONSTERS['grove-sentinel']
    const { container } = render(<TooltipProvider><EnemyPatternPreview monster={monster} pattern={monster.actionPatterns.default} /></TooltipProvider>)
    expect(container.querySelectorAll('.combat-pattern-node')).toHaveLength(monster.actionPatterns.default.steps.length)
    expect(container.querySelectorAll('.combat-pattern-arrow')).toHaveLength(monster.actionPatterns.default.steps.length - 1)
    expect(container.querySelector('.combat-pattern-repeat')).toBeTruthy()
    expect(container.querySelectorAll('.combat-pattern-node span')).toHaveLength(0)
    expect(container.querySelector('[aria-current]')).toBeNull()
    expect(screen.queryByText('NEXT PATTERN')).toBeNull()
  })

  it('keeps each authored pattern compact while exposing action details through focus tooltips', async () => {
    const monster = MONSTERS['corrupted-greatbear']
    const patterns = Object.values(monster.actionPatterns)
    const { container } = render(<TooltipProvider>{patterns.map((pattern) => <EnemyPatternPreview key={pattern.id} monster={monster} pattern={pattern} />)}</TooltipProvider>)
    expect(container.querySelectorAll('.bestiary-pattern-preview')).toHaveLength(patterns.length)
    expect(container.querySelectorAll('.combat-pattern-rail')).toHaveLength(patterns.length)
    expect(container.querySelectorAll('.combat-pattern-node')).toHaveLength(patterns.reduce((total, pattern) => total + pattern.steps.length, 0))
    expect(screen.getByText('Default')).toBeTruthy()
    expect(screen.getByText('Corrupted')).toBeTruthy()

    screen.getByRole('button', { name: 'Corrupted Roar, debuff' }).focus()
    expect((await screen.findByRole('tooltip')).textContent).toContain('Corrupted Roar')
  })
})
