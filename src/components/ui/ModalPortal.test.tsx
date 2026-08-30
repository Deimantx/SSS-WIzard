import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { ModalPortal } from './ModalPortal'

describe('ModalPortal', () => {
  it('portals above normal content, locks the body, traps focus, and restores focus', async () => {
    const user = userEvent.setup()
    function Fixture() {
      const [open, setOpen] = useState(false)
      return <><button onClick={() => setOpen(true)}>Open manager</button><ModalPortal open={open} onClose={() => setOpen(false)} backdropClassName="test-backdrop" surfaceClassName="test-surface" ariaLabel="Preset Manager"><button onClick={() => setOpen(false)}>Close manager</button><button>Second action</button></ModalPortal></>
    }
    render(<Fixture />)
    const opener = screen.getByRole('button', { name: 'Open manager' })
    await user.click(opener)
    const dialog = screen.getByRole('dialog', { name: 'Preset Manager' })
    expect(dialog.parentElement?.className).toBe('test-backdrop')
    expect(dialog.parentElement?.parentElement).toBe(document.body)
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close manager' }))
    await user.keyboard('{Tab}{Tab}')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close manager' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Preset Manager' })).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(opener)
  })
})
