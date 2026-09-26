import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { DeveloperCrystals } from './DeveloperCrystals'

describe('Developer Crystals tab', () => {
  beforeEach(() => useGameStore.setState(createInitialState()))

  it('exposes the dedicated status and fixture controls', () => {
    render(<DeveloperCrystals />)

    expect(screen.getByText('LOCKED')).toBeTruthy()
    expect(screen.getByText('5 / 15')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'UNLOCK CRYSTALS' }))
    expect(useGameStore.getState().progress.bossKillsByBoss['meridian-splitter']).toBe(1)
    expect(screen.getByText('UNLOCKED')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'OPEN CRYSTAL SCREEN' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('uses cache, dust, ownership, slot, and reset actions without duplicating progression controls', () => {
    render(<DeveloperCrystals />)

    fireEvent.click(screen.getByRole('button', { name: '+10 CACHES' }))
    expect(useGameStore.getState().inventory['tier-1-crystal-cache']).toBe(10)
    fireEvent.click(screen.getByRole('button', { name: 'CLEAR T1 CACHES' }))
    expect(useGameStore.getState().inventory['tier-1-crystal-cache']).toBe(0)

    const dust = screen.getByRole('spinbutton', { name: 'Dust amount' })
    fireEvent.change(dust, { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: 'SET DUST' }))
    expect(useGameStore.getState().crystals.dust).toBe(100)

    fireEvent.click(screen.getByRole('button', { name: 'GRANT' }))
    expect(useGameStore.getState().crystals.owned['force-t1']).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: 'REMOVE AVAILABLE' }))
    expect(useGameStore.getState().crystals.owned['force-t1']).toBe(0)

    const slots = screen.getByRole('spinbutton', { name: 'Unlocked slots' })
    fireEvent.change(slots, { target: { value: '3' } })
    expect(useGameStore.getState().crystals.unlockedSlots).toBe(5)

    useGameStore.getState().debugUnlockCrystals()
    fireEvent.click(screen.getByRole('button', { name: 'RESET CRYSTAL STATE' }))
    expect(useGameStore.getState().progress.bossKillsByBoss['meridian-splitter']).toBe(1)
  })

  it('clears newly locked equipped slots and recalculates derived stats', () => {
    const store = useGameStore.getState()
    store.debugSetCrystalUnlockedSlots(6)
    store.debugGrantCrystal('concentration-t1', 1)
    expect(useGameStore.getState().equipCrystal('concentration-t1', 5)).toBe(true)
    const boostedMana = useGameStore.getState().player.maxMana

    store.debugSetCrystalUnlockedSlots(5)

    expect(useGameStore.getState().crystals.equippedSlots[5]).toBeNull()
    expect(useGameStore.getState().player.maxMana).toBeLessThan(boostedMana)
  })
})
