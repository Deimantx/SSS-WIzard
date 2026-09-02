import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { MONSTERS } from '../../game/content/monsters'
import { BestiaryStats } from './BestiaryStats'

describe('BestiaryStats', () => {
  it('keeps offensive rows in COMBAT STATS and defensive rows ordered in DEFENCES', () => {
    const { container } = render(<TooltipProvider><BestiaryStats monster={MONSTERS['archmage-edrin-shade']} /></TooltipProvider>)
    const sections = [...container.querySelectorAll('.bestiary-section')]
    const combat = sections.find((section) => section.textContent?.includes('COMBAT STATS'))
    const defences = sections.find((section) => section.textContent?.includes('DEFENCES'))
    const combatLabels = [...(combat?.querySelectorAll('.bestiary-stat-row') ?? [])].map((row) => row.querySelector('.bestiary-stat-row span')?.textContent)
    const defenceLabels = [...(defences?.querySelectorAll('.bestiary-defence-stat-row') ?? [])].map((row) => row.querySelector('span')?.textContent)

    expect(combatLabels).toEqual(['Max Health', 'Basic Attack Damage', 'Basic Attack Speed', 'Crit Chance', 'Crit Damage'])
    expect(combat?.textContent).not.toContain('Defense')
    expect(combat?.textContent).not.toContain('Damage Reduction')
    expect(defenceLabels).toEqual(['Defense', 'Damage Reduction', 'Fire', 'Water', 'Earth', 'Air'])
    expect(defences?.querySelector('.bestiary-defence-core-grid')?.children).toHaveLength(2)
  })

  it('places a nonzero Block Chance after Damage Reduction and before resistances', () => {
    const monster = { ...MONSTERS['archmage-edrin-shade'], blockChance: 0.25 }
    const { container } = render(<TooltipProvider><BestiaryStats monster={monster} /></TooltipProvider>)
    const defences = [...container.querySelectorAll('.bestiary-section')].find((section) => section.textContent?.includes('DEFENCES'))
    const labels = [...(defences?.querySelectorAll('.bestiary-defence-stat-row') ?? [])].map((row) => row.querySelector('span')?.textContent)
    expect(labels).toEqual(['Defense', 'Damage Reduction', 'Block Chance', 'Fire', 'Water', 'Earth', 'Air'])
  })
})
