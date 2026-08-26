import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { RECIPES } from '../../../game/content/recipes/recipes'
import { resetAppearance } from '../../../ui/preferences/uiPreferencesStore'
import { RecipeDetail } from './RecipeDetail'

describe('RecipeDetail screen preferences', () => {
  beforeEach(() => { resetAppearance() })

  it('persists the Used In accordion state across remounts', () => {
    const view = render(<RecipeDetail recipe={RECIPES['fire-fragment']} />)
    fireEvent.click(screen.getByRole('button', { name: /USED IN/ }))
    expect(screen.getByRole('button', { name: /USED IN/ }).getAttribute('aria-expanded')).toBe('false')
    view.unmount()

    render(<RecipeDetail recipe={RECIPES['fire-fragment']} />)

    expect(screen.getByRole('button', { name: /USED IN/ }).getAttribute('aria-expanded')).toBe('false')
  })
})
