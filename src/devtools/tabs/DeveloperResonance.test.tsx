import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { DeveloperResonance } from './DeveloperResonance'
import { aggregateResonanceBundle, resolveEnemyResonanceReward } from '../../game/systems/resonance/resonanceRuntime'
import { formatResonanceAmount, getNonZeroResonanceEntries } from '../../game/presentation/resonance/resonancePresentation'
import { RESONANCE_TYPES } from '../../game/content/resonance/resonance'

describe('Developer Resonance tab', () => {
  beforeEach(() => { useGameStore.setState(createInitialState()) })

  it('renders every Resonance balance and routes controls through store actions', () => {
    render(<DeveloperResonance />)
    expect(screen.getByText('Fire Resonance')).toBeTruthy()
    expect(screen.getByText('Water Resonance')).toBeTruthy()
    expect(screen.getByText('Earth Resonance')).toBeTruthy()
    expect(screen.getByText('Air Resonance')).toBeTruthy()
    expect(screen.getByText('Arcane Resonance')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: '+100' })[0])
    expect(useGameStore.getState().resonance.fire).toBe(100)
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '3.9' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'SET' })[0])
    expect(useGameStore.getState().resonance.fire).toBe(3)
    fireEvent.click(screen.getAllByRole('button', { name: 'CLEAR' })[0])
    expect(useGameStore.getState().resonance.fire).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: 'GRANT TEST BUNDLE' }))
    expect(useGameStore.getState().resonance).toEqual(Object.fromEntries(RESONANCE_TYPES.map((type) => [type, 100])))
    fireEvent.click(screen.getByRole('button', { name: 'CLEAR ALL' }))
    expect(useGameStore.getState().resonance).toEqual(Object.fromEntries(RESONANCE_TYPES.map((type) => [type, 0])))
  })

  it('previews 100 authored kills without changing the profile', () => {
    render(<DeveloperResonance />)
    const before = { ...useGameStore.getState().resonance }
    fireEvent.click(screen.getByRole('button', { name: 'Batch preview enemy' }))
    fireEvent.click(screen.getByRole('option', { name: 'Stone Root' }))
    fireEvent.click(screen.getByRole('button', { name: 'SIMULATE' }))
    const preview = aggregateResonanceBundle(resolveEnemyResonanceReward('stone-root').finalYield, 100)
    getNonZeroResonanceEntries(preview).forEach(({ amount }) => expect(screen.getByText(formatResonanceAmount(amount))).toBeTruthy())
    expect(useGameStore.getState().resonance).toEqual(before)
  })
})
