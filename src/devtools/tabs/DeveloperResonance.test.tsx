import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { DeveloperResonance } from './DeveloperResonance'

describe('Developer Resonance tab', () => {
  beforeEach(() => { useGameStore.setState(createInitialState()) })

  it('renders four balances and routes controls through store actions', () => {
    render(<DeveloperResonance />)
    expect(screen.getByText('Fire Resonance')).toBeTruthy()
    expect(screen.getByText('Water Resonance')).toBeTruthy()
    expect(screen.getByText('Earth Resonance')).toBeTruthy()
    expect(screen.getByText('Air Resonance')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: '+100' })[0])
    expect(useGameStore.getState().resonance.fire).toBe(100)
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '3.9' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'SET' })[0])
    expect(useGameStore.getState().resonance.fire).toBe(3)
    fireEvent.click(screen.getAllByRole('button', { name: 'CLEAR' })[0])
    expect(useGameStore.getState().resonance.fire).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: 'GRANT TEST BUNDLE' }))
    expect(useGameStore.getState().resonance).toEqual({ fire: 100, water: 100, earth: 100, air: 100 })
    fireEvent.click(screen.getByRole('button', { name: 'CLEAR ALL' }))
    expect(useGameStore.getState().resonance).toEqual({ fire: 0, water: 0, earth: 0, air: 0 })
  })

  it('previews 100 authored kills without changing the profile', () => {
    render(<DeveloperResonance />)
    const before = { ...useGameStore.getState().resonance }
    fireEvent.change(screen.getByRole('combobox', { name: 'Preview enemy' }), { target: { value: 'stone-root' } })
    fireEvent.click(screen.getByRole('button', { name: 'SIMULATE' }))
    expect(screen.getByText('400')).toBeTruthy()
    expect(useGameStore.getState().resonance).toEqual(before)
  })
})
