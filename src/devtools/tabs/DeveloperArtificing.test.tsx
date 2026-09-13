import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { DeveloperArtificing } from './DeveloperArtificing'
describe('Developer Artificing', () => {
  beforeEach(() => useGameStore.getState().resetSave())
  it('lists only the six current starter Artifact recipes', () => {
    render(<DeveloperArtificing />)
    expect(screen.getByText('6 / 6 Artifact recipes')).toBeTruthy()
    expect(screen.queryByText('Assign one Echo')).toBeNull()
    const browser = document.querySelector('.developer-browser-list') as HTMLElement
    expect(browser.textContent).toContain('Ember Staff')
    expect(browser.textContent).toContain('Wispveil Hood')
    expect(browser.textContent).not.toContain('Wispglass Earring')
    expect(browser.textContent).not.toContain('Fangwire Earring')
  })
})
