import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { DeveloperDiagnostics } from './DeveloperDiagnostics'
import { DeveloperMonsters } from './DeveloperMonsters'
import { DeveloperSpells } from './DeveloperSpells'
import { DeveloperStatuses } from './DeveloperStatuses'

describe('Developer content browsers', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('filters monsters by dungeon and keeps the selected inspector runtime-backed', () => {
    const rendered = render(<DeveloperMonsters />)
    fireEvent.click(screen.getByRole('tab', { name: 'HOWLING DEN' }))
    expect(screen.getAllByText('Cavefang Wolf').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Corrupted Greatbear').length).toBeGreaterThan(0)
    expect(screen.queryByText('Forest Wisp')).toBeNull()
    fireEvent.click(screen.getByRole('option', { name: /Corrupted Greatbear/ }))
    expect(screen.getByText('Combat stats')).toBeTruthy()
    expect(screen.getByText('900')).toBeTruthy()
    expect(rendered.container.querySelector('pre')).toBeNull()
    expect(rendered.container.textContent).toContain('5%')
    expect(rendered.container.textContent).toContain('Default pattern')
    expect(rendered.container.textContent).toContain('Life Essence')
    expect(rendered.container.textContent).not.toContain('NOT DEFINED IN RUNTIME')
  })

  it('filters statuses by authored classification and exposes real apply actions', () => {
    const rendered = render(<DeveloperStatuses />)
    fireEvent.click(screen.getByRole('tab', { name: 'BUFFS' }))
    expect(screen.getAllByText('Quickening').length).toBeGreaterThan(0)
    expect(screen.queryByText('Burning')).toBeNull()
    fireEvent.click(screen.getByRole('option', { name: /Quickening/ }))
    expect(screen.getByRole('button', { name: 'Apply to player' })).toBeTruthy()
    expect(rendered.container.querySelector('pre')).toBeNull()
    expect(rendered.container.textContent).toContain('6 s')
    expect(rendered.container.textContent).toContain('25% Basic Attack speed')
  })

  it('filters spells by school and shows the authored mana/cooldown inspector', () => {
    const rendered = render(<DeveloperSpells />)
    fireEvent.click(screen.getByRole('tab', { name: 'FIRE' }))
    expect(screen.getAllByText('Fire Bolt').length).toBeGreaterThan(0)
    expect(screen.queryByText('Water Ward')).toBeNull()
    fireEvent.click(screen.getByRole('option', { name: /Fire Bolt/ }))
    expect(screen.getByText('12')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cast selected' })).toBeTruthy()
    expect(rendered.container.querySelector('pre')).toBeNull()
    expect(rendered.container.textContent).toContain('3.5 s')
    expect(rendered.container.textContent).toContain('60% of Spell Power Fire damage')
    expect(rendered.container.textContent).not.toContain('runtime registry')
  })

  it('keeps raw technical snapshots collapsed in Advanced Diagnostics', () => {
    const rendered = render(<DeveloperDiagnostics copy={async () => undefined} />)
    const advancedSections = [...rendered.container.querySelectorAll('details')]
    expect(advancedSections.length).toBeGreaterThanOrEqual(2)
    expect(advancedSections.every((section) => !section.hasAttribute('open'))).toBe(true)
    expect(rendered.container.textContent).toContain('CONTENT VALIDATION')
  })
})
