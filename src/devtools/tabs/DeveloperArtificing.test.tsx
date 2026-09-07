import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { DeveloperArtificing } from './DeveloperArtificing'
describe('Developer Artificing', () => {
  beforeEach(() => useGameStore.getState().resetSave())
  it('lists current Equipment recipes and exposes the canonical Earring filter', () => {
    render(<DeveloperArtificing />)
    expect(screen.getByText('21 / 21 Equipment recipes')).toBeTruthy()
    expect(screen.queryByText('Assign one Echo')).toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: 'EARRING' }))
    expect(screen.getByText('3 / 21 Equipment recipes')).toBeTruthy()
    const browser = document.querySelector('.developer-browser-list') as HTMLElement
    expect(browser.textContent).toContain('Wispglass Earring')
    expect(browser.textContent).toContain('Fangwire Earring')
    expect(browser.textContent).toContain('Mourning Glass Earring')
    fireEvent.click(screen.getByRole('tab', { name: 'WEAPON' }))
    expect(screen.getByText(/\/ 21 Equipment recipes/)).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: '2H' }))
    expect(screen.getByText(/\/ 21 Equipment recipes/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'SHOW LOCKED EQUIPMENT RECIPES' }))
    fireEvent.click(screen.getByRole('button', { name: 'GRANT MISSING' }))
    expect(useGameStore.getState().debug.showLockedArtificingRecipes).toBe(true)
    expect(useGameStore.getState().debug.showLockedTransmutationRecipes).toBe(false)
    expect((screen.getByRole('button', { name: 'CRAFT ONCE' }) as HTMLButtonElement).disabled).toBe(true)
    expect(useGameStore.getState().inventory['fire-fragment']).toBe(20)
    fireEvent.click(screen.getByRole('button', { name: 'GRANT MISSING' }))
    expect(useGameStore.getState().inventory['fire-fragment']).toBe(20)
    fireEvent.click(screen.getByRole('button', { name: 'GRANT OUTPUT (CHEAT)' }))
    expect(useGameStore.getState().inventory['ember-staff']).toBe(1)
  })
})
