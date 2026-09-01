import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { MONSTERS } from '../../game/content/monsters'
import type { ActionPattern } from '../../game/systems/combat/combatTypes'
import { EnemyPatternRail } from './EnemyPatternRail'

describe('EnemyPatternRail', () => {
  it('renders long patterns as readable icon-only, accessible nodes', () => {
    const pattern: ActionPattern = { id: 'long-pattern', steps: Array.from({ length: 12 }, (_, index) => ({ id: `step-${index}`, type: 'basic' as const })) }
    const { container } = render(<TooltipProvider><EnemyPatternRail pattern={pattern} enemy={MONSTERS['grove-sentinel']} currentStepIndex={2} currentStepId={null} currentActionId={null} currentPatternOriginId="long-pattern" /></TooltipProvider>)

    expect(screen.getAllByRole('button')).toHaveLength(12)
    expect(screen.getByRole('button', { name: 'Basic Attack, basic attack, current action' })).toBeTruthy()
    expect(screen.queryByText('Basic Attack', { selector: 'strong' })).toBeNull()
    const rail = container.querySelector('.combat-flow-pattern-rail')
    const sequence = rail?.querySelector('.combat-pattern-sequence')
    expect(sequence?.parentElement).toBe(rail)
    expect(sequence?.querySelectorAll('.combat-pattern-node-wrap')).toHaveLength(12)
  })

  it('exposes the authored action through the shared tooltip on focus', async () => {
    const pattern: ActionPattern = { id: 'special-pattern', steps: [{ id: 'root-crush-step', type: 'action', actionId: 'root-crush' }] }
    render(<TooltipProvider><EnemyPatternRail pattern={pattern} enemy={MONSTERS['grove-sentinel']} currentStepIndex={0} currentStepId="root-crush-step" currentActionId="root-crush" currentPatternOriginId="special-pattern" /></TooltipProvider>)

    screen.getByRole('button', { name: 'Root Crush, direct damage, current action' }).focus()
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip.textContent).toContain('Root Crush')
    expect(tooltip.textContent).toContain('ACTION TIME')
    expect(tooltip.textContent).toContain('Physical Damage')
    expect(tooltip.textContent).toContain('Target: Player')
  })

  it('keeps a committed old-Pattern action visible while the selected Pattern is still next', () => {
    const pattern = MONSTERS['corrupted-greatbear'].actionPatterns.corrupted
    const { container } = render(<TooltipProvider><EnemyPatternRail pattern={pattern} enemy={MONSTERS['corrupted-greatbear']} currentStepIndex={2} currentStepId="crushing-maul-step" currentActionId="crushing-maul" currentPatternOriginId="default" /></TooltipProvider>)

    expect(screen.getByText('CURRENT ACTION')).toBeTruthy()
    expect(screen.getByText('NEXT PATTERN')).toBeTruthy()
    expect(screen.getByText('Crushing Maul')).toBeTruthy()
    expect(container.querySelectorAll('[aria-current="step"]')).toHaveLength(0)
    expect(container.querySelector('.combat-pattern-transition')).toBeTruthy()
    expect(container.querySelector('.combat-pattern-node.is-next')).toBe(container.querySelectorAll('.combat-pattern-node')[0])
  })
})
