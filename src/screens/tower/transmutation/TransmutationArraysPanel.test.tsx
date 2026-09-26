import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { TRANSMUTATION_ARRAY_IDS, TRANSMUTATION_ARRAYS } from '../../../game/content/transmutation/transmutationArrays'
import { useGameStore } from '../../../store/gameStore'
import { TransmutationArraysPanel } from './TransmutationArraysPanel'

const renderPanel = () => render(<TooltipProvider><TransmutationArraysPanel /></TooltipProvider>)

describe('Transmutation Arrays upgrade presentation', () => {
  beforeEach(() => {
    useGameStore.getState().resetSave()
  })

  it('renders the five canonical selectors as equal two-column cards without the legacy wide branch', () => {
    renderPanel()

    const selectors = document.querySelectorAll('.transmutation-array-selector')
    expect(selectors).toHaveLength(TRANSMUTATION_ARRAY_IDS.length)
    expect(document.querySelector('.transmutation-array-selector.is-wide')).toBeNull()
    expect(document.querySelector('.transmutation-array-selector-grid > .game-tooltip-trigger.is-wide')).toBeNull()
    expect(document.querySelector('.transmutation-array-selected-icon')).toBeNull()

    TRANSMUTATION_ARRAY_IDS.forEach((id) => {
      const definition = TRANSMUTATION_ARRAYS[id]
      const selector = screen.getByRole('button', { name: new RegExp(definition.name) })
      expect(selector.querySelector('.transmutation-array-selector-mark')).toBeTruthy()
      expect(selector.querySelectorAll('.transmutation-array-selector-levelbar i')).toHaveLength(10)
      expect(selector.textContent).toContain(`${id === 'temporal-array' || id === 'mana-refinement-array' ? 'PROCESS' : id === 'echo-stabilization-array' ? 'CONTROL' : 'YIELD'} · Lv 0 / 10`)
    })
  })

  it('uses the Pillars-style mastery header and marks mastered arrays', () => {
    act(() => { useGameStore.getState().forceSetTransmutationArrayLevel('temporal-array', 10) })
    renderPanel()

    expect(screen.getByText('RANK I MASTERY')).toBeTruthy()
    expect(screen.getByText('1 / 5')).toBeTruthy()
    expect(document.querySelectorAll('.transmutation-array-mastery-indicator')).toHaveLength(5)
    expect(document.querySelectorAll('.transmutation-array-mastery-indicator.filled')).toHaveLength(1)
    expect(document.querySelectorAll('.transmutation-array-selected .status.success')).toHaveLength(1)
    expect((screen.getByRole('button', { name: 'Rank I already mastered.' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('Further ranks are not yet available.')).toBeTruthy()
  })

  it('updates the selected inspector while preserving all five material requirements', () => {
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: /Conservation Array/ }))
    expect(screen.getByRole('heading', { name: 'Conservation Array' })).toBeTruthy()
    expect(screen.getByText('RANK I · YIELD ARRAY')).toBeTruthy()
    expect(screen.getByText('COST · OWNED / AVAILABLE / REQUIRED')).toBeTruthy()
    expect(document.querySelectorAll('.transmutation-array-requirements .item-requirement-tile')).toHaveLength(5)
    expect(screen.getByRole('button', { name: /Conservation Array/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: /Temporal Array/ }).getAttribute('aria-pressed')).toBe('false')
  })

  it('keeps Resonance Stabilization milestone progression distinct from per-level arrays', () => {
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: /Resonance Stabilization Array/ }))
    expect(screen.getByText('NEXT MILESTONE · Lv5')).toBeTruthy()
    expect(screen.getByText('+0 Acolyte capacity')).toBeTruthy()
    expect(screen.queryByText('+1 Acolyte capacity')).toBeNull()

    act(() => { useGameStore.getState().forceSetTransmutationArrayLevel('echo-stabilization-array', 5) })
    expect(screen.getByText('NEXT MILESTONE · Lv10')).toBeTruthy()
    expect(screen.getByText('+1 Acolyte capacity')).toBeTruthy()
  })
})
