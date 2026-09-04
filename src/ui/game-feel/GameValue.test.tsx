import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GameValue } from './GameValue'

describe('GameValue', () => {
  it('does not pulse on mount and identifies gains and losses', async () => {
    const view = render(<GameValue value={10} formatted="10" />)
    const value = screen.getByText('10')
    expect(value.className).not.toContain('value-changed')

    view.rerender(<GameValue value={12} formatted="12" />)
    await waitFor(() => expect(screen.getByText('12').className).toContain('value-increased'))

    view.rerender(<GameValue value={8} formatted="8" />)
    await waitFor(() => expect(screen.getByText('8').className).toContain('value-decreased'))
  })
})

