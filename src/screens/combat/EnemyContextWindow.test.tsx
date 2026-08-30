import userEvent from '@testing-library/user-event'
import { act, render, screen, waitFor } from '@testing-library/react'
import { useRef, useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import type { EnemyContextMode } from './EnemyContextWindow'
import { EnemyContextWindow } from './EnemyContextWindow'

function ContextHarness() {
  const [mode, setMode] = useState<EnemyContextMode | null>(null)
  const anchorRef = useRef<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  return <>
    <section ref={anchorRef}>Underlying combat UI <button ref={triggerRef} type="button" onClick={() => setMode((current) => current === 'intel' ? null : 'intel')}>Open Intel</button></section>
    {mode && <EnemyContextWindow mode={mode} anchorRef={anchorRef} triggerRef={triggerRef} selectedDungeonId="whispering-woods" onModeChange={setMode} onClose={() => setMode(null)} />}
  </>
}

describe('EnemyContextWindow', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().preset('combat')
  })

  it('switches Intel and Loot in place without modal body locking', async () => {
    const user = userEvent.setup()
    render(<TooltipProvider><ContextHarness /></TooltipProvider>)

    await user.click(screen.getByRole('button', { name: 'Open Intel' }))
    expect(screen.getByRole('dialog', { name: 'Enemy Intel' })).toBeTruthy()
    expect(document.body.classList.contains('modal-open')).toBe(false)

    await user.click(screen.getByRole('tab', { name: 'LOOT' }))
    expect(screen.getByRole('dialog', { name: 'Enemy Loot' })).toBeTruthy()
    expect(screen.getByText('CURRENT ENEMY DROPS')).toBeTruthy()
  })

  it('closes from the same trigger, Escape, and outside interaction', async () => {
    const user = userEvent.setup()
    render(<TooltipProvider><ContextHarness /></TooltipProvider>)

    await user.click(screen.getByRole('button', { name: 'Open Intel' }))
    await user.click(screen.getByRole('button', { name: 'Open Intel' }))
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Open Intel' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Open Intel' }))
    await user.click(document.body)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes when the current enemy disappears during an open context window', async () => {
    const user = userEvent.setup()
    render(<TooltipProvider><ContextHarness /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: 'Open Intel' }))
    expect(screen.getByRole('dialog', { name: 'Enemy Intel' })).toBeTruthy()
    act(() => useGameStore.setState({ combat: { ...useGameStore.getState().combat, enemyId: null } }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
