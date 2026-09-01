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

  it('marks context-layer menus so a drawer can sit below its portal options', async () => {
    const user = userEvent.setup()
    render(<SelectMenu options={[{ value: 'small', label: 'Small' }, { value: 'large', label: 'Large' }]} value="small" onChange={() => undefined} ariaLabel="Text size" portalLayer="context" />)
    await user.click(screen.getByRole('button', { name: 'Text size' }))
    expect(screen.getByRole('listbox', { name: 'Text size' }).className).toContain('is-context-dropdown')
  })

  it('renders the shared SVG chevron and rotates it when opened', async () => {
    const user = userEvent.setup()
    const options = [
      { value: 'new', label: 'New Preset' },
      { value: 'saved', label: 'Saved Preset' },
    ] as const
    const { container } = render(<SelectMenu options={options} value="new" onChange={() => undefined} ariaLabel="Preset" />)
    const trigger = screen.getByRole('button', { name: 'Preset' })
    const chevron = container.querySelector('.select-menu-chevron')

    expect(chevron?.getAttribute('aria-hidden')).toBe('true')
    expect(chevron?.querySelector('svg')).toBeTruthy()
    expect(chevron?.textContent).toBe('')
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    await user.click(trigger)

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('.select-menu')?.classList.contains('is-open')).toBe(true)
    expect(screen.getByRole('option', { name: 'New Preset' })).toBeTruthy()
  })
})
