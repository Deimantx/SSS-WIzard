import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetAppearance } from '../../../ui/preferences/uiPreferencesStore'
import { RecipeLibrary } from './RecipeLibrary'

describe('RecipeLibrary screen preferences', () => {
  beforeEach(() => { resetAppearance() })

  it('persists its filter while search remains temporary', () => {
    const view = render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'EQUIPMENT' }))
    fireEvent.change(screen.getByPlaceholderText('Search recipes...'), { target: { value: 'ember' } })
    expect(screen.getByText('Ember Staff')).toBeTruthy()
    view.unmount()

    render(<RecipeLibrary selectedRecipeId="fire-fragment" onSelect={vi.fn()} />)

    expect(screen.getByRole('tab', { name: 'EQUIPMENT' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText('Ember Staff')).toBeTruthy()
    expect(screen.queryByText('Fire Fragment')).toBeNull()
  })
})
