import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SelectMenu } from './SelectMenu'

describe('SelectMenu', () => {
  it('supports selection, Escape, and outside-click dismissal', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<div><SelectMenu options={[{ value: 'all', label: 'All' }, { value: 'barrier', label: 'Barrier' }]} value="all" onChange={onChange} ariaLabel="Spell type filter" /><span data-testid="outside">Outside</span></div>)
    const trigger = screen.getByRole('button', { name: 'Spell type filter' })
    await user.click(trigger)
    expect(screen.getByRole('listbox', { name: 'Spell type filter' })).toBeTruthy()
    await user.click(screen.getByRole('option', { name: 'Barrier' }))
    expect(onChange).toHaveBeenCalledWith('barrier')
    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox', { name: 'Spell type filter' })).toBeNull()
    await user.click(screen.getByTestId('outside'))
    expect(screen.queryByRole('listbox', { name: 'Spell type filter' })).toBeNull()
  })
})
