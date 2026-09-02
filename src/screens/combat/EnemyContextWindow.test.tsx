import userEvent from '@testing-library/user-event'
import { act, render, screen, waitFor } from '@testing-library/react'
import { useRef, useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import type { EnemyContextMode } from './EnemyContextWindow'
import { EnemyContextWindow, EnemyStatsContent, getEnemyContextPosition } from './EnemyContextWindow'

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

  it('anchors to the enemy card and clamps to a narrow viewport', () => {
    expect(getEnemyContextPosition({ left: 700, top: 80, width: 300 }, { width: 800, height: 600 })).toEqual({ top: 80, left: 484, width: 300, maxHeight: 504 })
    expect(getEnemyContextPosition({ left: 40, top: 560, width: 300 }, { width: 800, height: 600 })).toEqual({ top: 324, left: 40, width: 300, maxHeight: 260 })
    expect(getEnemyContextPosition({ left: 0, top: 0, width: 600 }, { width: 320, height: 240 })).toEqual({ top: 16, left: 16, width: 288, maxHeight: 208 })
  })

  it('keeps Defense and derived Damage Reduction visible in enemy stats', async () => {
    render(<TooltipProvider><EnemyStatsContent /></TooltipProvider>)
    expect(screen.getByText('Defense')).toBeTruthy()
    expect(screen.getByText('Damage Reduction')).toBeTruthy()
    expect(screen.getByText('0.36/s')).toBeTruthy()
    expect(screen.getByText('9.1%')).toBeTruthy()
    screen.getByText('Basic Attack Speed').parentElement!.focus()
    expect((await screen.findByRole('tooltip')).textContent).toContain('Current Basic Attack Time: 2.80s.')
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
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open Intel' }))

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
