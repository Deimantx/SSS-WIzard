import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ITEMS } from '../../../game/content/items/items'
import type { ItemDefinition, ItemId } from '../../../game/types'
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

  it('shows universal combat mechanics from item.combat', () => {
    vi.useFakeTimers()
    render(<TooltipProvider><ItemTooltip itemId="ember-staff" owned={1}><button>Ember Staff</button></ItemTooltip></TooltipProvider>)
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Ember Staff' }))
    act(() => { vi.advanceTimersByTime(500) })
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.textContent).toContain('COMBAT EFFECTS')
    expect(tooltip.textContent).toContain('+20% Fire Spell Damage')
  })

  it('shows custom Equipment periodic Status potency in the Item Tooltip', () => {
    vi.useFakeTimers()
    const itemId = 'tooltip-custom-burning' as ItemId
    const item: ItemDefinition = {
      id: itemId,
      name: 'Custom Burning Charm',
      description: 'Test-only equipment.',
      icon: '◆',
      color: '#fff',
      kind: 'equipment',
      category: 'equipment',
      inventoryCategory: 'equipment',
      source: 'Tests',
      sellValue: 1,
      canDestroy: true,
      equipmentSlot: 'ring',
      combat: { rules: [{ id: 'custom-burning', event: 'on-spell-hit', effects: [{ type: 'apply-status', target: 'opponent', statusId: 'burning', durationMs: 6_000, periodicEffects: [{ type: 'deal-damage', target: 'self', components: [{ damageType: 'fire', magnitude: { type: 'spell-power', coefficient: 0.2 } }], tags: ['dot', 'fire'] }] }] }] },
    }
    ITEMS[itemId] = item
    try {
      render(<TooltipProvider><ItemTooltip itemId={itemId} owned={1}><button>Custom Burning Charm</button></ItemTooltip></TooltipProvider>)
      fireEvent.pointerEnter(screen.getByRole('button', { name: 'Custom Burning Charm' }))
      act(() => { vi.advanceTimersByTime(500) })
      const tooltip = screen.getByRole('tooltip')
      expect(tooltip.textContent).toContain('Apply Burning for 6.0s')
      expect(tooltip.textContent).toContain('120% Spell Power total Fire damage')
    } finally {
      delete ITEMS[itemId]
    }
  })
})
