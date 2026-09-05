import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { DeveloperArtificing } from './DeveloperArtificing'
describe('Developer Artificing', () => {
  beforeEach(() => useGameStore.getState().resetSave())
  it('lists 27 Equipment recipes with independent visibility and normal craft rules', () => {
    render(<DeveloperArtificing />)
    expect(screen.getByText('27 Equipment recipes')).toBeTruthy()
    expect(screen.queryByText('Assign one Echo')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'SHOW LOCKED EQUIPMENT RECIPES' }))
    fireEvent.click(screen.getByRole('button', { name: 'GRANT MISSING' }))
    expect(useGameStore.getState().debug.showLockedArtificingRecipes).toBe(true)
    expect(useGameStore.getState().debug.showLockedTransmutationRecipes).toBe(false)
    expect((screen.getByRole('button', { name: 'CRAFT ONCE' }) as HTMLButtonElement).disabled).toBe(true)
    expect(useGameStore.getState().inventory['fire-fragment']).toBe(48)
    fireEvent.click(screen.getByRole('button', { name: 'GRANT MISSING' }))
    expect(useGameStore.getState().inventory['fire-fragment']).toBe(48)
    fireEvent.click(screen.getByRole('button', { name: 'GRANT OUTPUT (CHEAT)' }))
    expect(useGameStore.getState().inventory['ember-staff']).toBe(1)
  })
})
