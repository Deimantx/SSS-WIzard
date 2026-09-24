import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ITEMS } from '../../../game/content/items/items'
import type { ItemDefinition, ItemId } from '../../../game/types'
import { useGameStore } from '../../../store/gameStore'
import { TooltipProvider } from '../tooltip/Tooltip'
import { ItemTooltip } from './ItemTooltip'

describe('equipment Item Tooltip presentation', () => {
  afterEach(() => vi.useRealTimers())

  it('keeps reused material tooltips compact while retaining Source', () => {
    vi.useFakeTimers()
    const itemId = 'fire-fragment' as ItemId
    render(<TooltipProvider><ItemTooltip itemId={itemId} owned={7}><button>Fire Fragment</button></ItemTooltip></TooltipProvider>)
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Fire Fragment' }))
    act(() => { vi.advanceTimersByTime(500) })
    const tooltip = screen.getByRole('tooltip')

    expect(tooltip.textContent).toContain('SOURCE')
    expect(tooltip.textContent).toContain('Transmutation')
    expect(tooltip.textContent).not.toContain('USED IN')
    expect(tooltip.textContent).not.toContain('Prismatic Fragment')
    expect(tooltip.textContent).not.toContain('Ember Staff')
    expect(tooltip.textContent).not.toContain('Wispwood Wand')
  })

  it('retains compact Transmutation recipe context', () => {
    vi.useFakeTimers()
    render(<TooltipProvider><ItemTooltip itemId="fire-fragment" owned={7} recipeContext={{ status: 'ACTIVE', baseDurationMs: 6_000, manaCost: 15, outputQuantity: 1, ingredients: [] }}><button>Fire Fragment recipe</button></ItemTooltip></TooltipProvider>)
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Fire Fragment recipe' }))
    act(() => { vi.advanceTimersByTime(500) })
    const tooltip = screen.getByRole('tooltip')

    expect(tooltip.textContent).toContain('RECIPE')
    expect(tooltip.textContent).toContain('ACTIVE')
    expect(tooltip.textContent).toContain('Base time')
    expect(tooltip.textContent).toContain('Mana')
    expect(tooltip.textContent).toContain('Output')
  })

  it('uses explicit Artifact tooltip overrides over global progression', () => {
    vi.useFakeTimers()
    const previous = useGameStore.getState().artifactProgress
    useGameStore.setState({ artifactProgress: { 'ember-staff': { minorRanks: {} } } })
    try {
      render(<TooltipProvider><ItemTooltip itemId="ember-staff" owned={0} effectiveStats={{ spellPower: 16 }} artifactRanks={1} artifactMaxRanks={50}><button>Ember Staff preview</button></ItemTooltip></TooltipProvider>)
      fireEvent.pointerEnter(screen.getByRole('button', { name: 'Ember Staff preview' }))
      act(() => { vi.advanceTimersByTime(500) })
      const tooltip = screen.getByRole('tooltip')
      expect(tooltip.textContent).toContain('RANKS 1 / 50')
      expect(tooltip.textContent).toContain('Spell Power+16')
      expect(tooltip.textContent).not.toContain('Basic Attack')
      expect(tooltip.textContent).not.toContain('RANKS 50 / 50')
    } finally {
      useGameStore.setState({ artifactProgress: previous })
    }
  })

  it('shows current Ember Staff baseline stats', () => {
    vi.useFakeTimers()
    const previous = useGameStore.getState().artifactProgress
    useGameStore.setState({ artifactProgress: { 'ember-staff': { minorRanks: {} } } })
    try {
      render(<TooltipProvider><ItemTooltip itemId="ember-staff" owned={1}><button>Ember Staff max</button></ItemTooltip></TooltipProvider>)
      fireEvent.pointerEnter(screen.getByRole('button', { name: 'Ember Staff max' }))
      act(() => { vi.advanceTimersByTime(500) })
      const tooltip = screen.getByRole('tooltip')
      expect(tooltip.textContent).toContain('RANKS 0 / 50')
      expect(tooltip.textContent).toContain('Spell Power+15')
    } finally {
      useGameStore.setState({ artifactProgress: previous })
    }
  })

  it('shows current Artifact stats without a legacy accessory layer', () => {
    vi.useFakeTimers()
    const previous = useGameStore.getState().artifactProgress
    useGameStore.setState({ artifactProgress: {} })
    try {
      render(<TooltipProvider><ItemTooltip itemId="wispveil-hood" owned={1}><button>Wispveil Hood</button></ItemTooltip></TooltipProvider>)
      fireEvent.pointerEnter(screen.getByRole('button', { name: 'Wispveil Hood' }))
      act(() => { vi.advanceTimersByTime(500) })
      const tooltip = screen.getByRole('tooltip')
      expect(tooltip.textContent).toContain('RANKS 0 / 50')
      expect(tooltip.textContent).toContain('Spell Power+15')
    } finally {
      useGameStore.setState({ artifactProgress: previous })
    }
  })

  it('shows custom Equipment periodic Status potency in the Item Tooltip', () => {
    vi.useFakeTimers()
    const itemId = 'tooltip-custom-burning' as ItemId
    const item: ItemDefinition = {
      id: itemId,
      name: 'Custom Burning Weapon',
      description: 'Test-only equipment.',
      icon: '◆',
      color: '#fff',
      kind: 'equipment',
      category: 'equipment',
      inventoryCategory: 'equipment',
      source: 'Tests',
      sellValue: 1,
      canDestroy: true,
      equipmentSlot: 'weapon',
      combat: { rules: [{ id: 'custom-burning', event: 'on-spell-hit', effects: [{ type: 'apply-status', target: 'opponent', statusId: 'burning', durationMs: 6_000, periodicEffects: [{ type: 'deal-damage', target: 'self', components: [{ damageType: 'fire', magnitude: { type: 'spell-power', coefficient: 0.2 } }], tags: ['dot', 'fire'] }] }] }] },
    }
    ITEMS[itemId] = item
    try {
      render(<TooltipProvider><ItemTooltip itemId={itemId} owned={1}><button>Custom Burning Weapon</button></ItemTooltip></TooltipProvider>)
      fireEvent.pointerEnter(screen.getByRole('button', { name: 'Custom Burning Weapon' }))
      act(() => { vi.advanceTimersByTime(500) })
      const tooltip = screen.getByRole('tooltip')
      expect(tooltip.textContent).toContain('Apply Burning for 6.0s')
      expect(tooltip.textContent).toContain('120% Spell Power total Fire damage')
    } finally {
      delete ITEMS[itemId]
    }
  })
})
