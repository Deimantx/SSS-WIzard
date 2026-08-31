import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { CombatResource } from './CombatResource'

describe('CombatResource V3.7 feedback', () => {
  it('shows a damage trail when Health drops', () => {
    const view = render(<TooltipProvider><CombatResource icon={null} label="HP" value="75 / 100" currentValue={100} maxValue={100} percent={100} tone="health" /></TooltipProvider>)
    view.rerender(<TooltipProvider><CombatResource icon={null} label="HP" value="75 / 100" currentValue={75} maxValue={100} percent={75} tone="health" /></TooltipProvider>)
    expect(document.querySelector('.combat-resource')?.className).toContain('is-feedback-damage')
    expect(document.querySelector('.combat-resource-trail')).toBeTruthy()
  })

  it('distinguishes a Barrier break from a normal Barrier change', () => {
    const view = render(<TooltipProvider><CombatResource icon={null} label="BARRIER" value="20" currentValue={20} maxValue={100} percent={20} tone="barrier" /></TooltipProvider>)
    view.rerender(<TooltipProvider><CombatResource icon={null} label="BARRIER" value="0" currentValue={0} maxValue={100} percent={0} tone="barrier" /></TooltipProvider>)
    expect(document.querySelector('.combat-resource')?.className).toContain('is-feedback-barrier-break')
  })
})
