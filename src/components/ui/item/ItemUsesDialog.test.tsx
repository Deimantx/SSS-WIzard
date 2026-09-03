import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getVisibleItemUsesForTransmutation } from '../../../game/presentation/transmutation/transmutationUsedInReadModel'
import { ItemUsesDialog } from './ItemUsesDialog'

describe('ItemUsesDialog', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('groups uses, searches locally, and closes with Escape', () => {
    const onClose = vi.fn()
    const state = createInitialState()
    const uses = getVisibleItemUsesForTransmutation(state, 'fire-fragment')
    render(<ItemUsesDialog itemId="fire-fragment" uses={uses} open onClose={onClose} />)

    expect(screen.getByRole('dialog', { name: /FIRE FRAGMENT/ })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'TRANSMUTATION' })).toBeTruthy()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search uses' }), { target: { value: 'prismatic' } })
    expect(screen.getByText('Prismatic Fragment')).toBeTruthy()
    expect(screen.queryByText('Pillars of Mana')).toBeNull()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('selects a recipe row and closes the dialog', () => {
    const onClose = vi.fn()
    const onSelectRecipe = vi.fn()
    const uses = getVisibleItemUsesForTransmutation(createInitialState(), 'fire-fragment')
    render(<ItemUsesDialog itemId="fire-fragment" uses={uses} open onClose={onClose} onSelectRecipe={onSelectRecipe} />)

    fireEvent.click(screen.getByRole('button', { name: 'Select Prismatic Fragment' }))
    expect(onSelectRecipe).toHaveBeenCalledWith('prismatic-fragment')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
