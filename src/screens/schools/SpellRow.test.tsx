import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { GameContextMenuProvider } from '../../ui/context-menu/GameContextMenuProvider'
import { createInitialState } from '../../store/initialState'
import { SpellLoadoutDndProvider } from './SpellLoadoutDnd'
import { SpellRow } from './SpellRow'
import type { SpellBrowserSpellEntry } from './spellBrowserSelectors'

const entry: SpellBrowserSpellEntry = {
  kind: 'spell',
  id: 'fire-bolt',
  spellId: 'fire-bolt',
  school: 'fire',
  unlockLevel: 1,
  unlocked: true,
  rank: 1,
  tags: ['Damage'],
}

function renderSpellRow(rowEntry: SpellBrowserSpellEntry = entry) {
  const state = createInitialState()
  state.progress.spellRanks = { 'fire-bolt': 1 }
  return render(
    <TooltipProvider>
      <GameContextMenuProvider>
        <SpellLoadoutDndProvider onCommit={() => undefined}>
          <SpellRow entry={rowEntry} state={state} selected={false} equipped={false} newSpell={false} canEdit onSelect={vi.fn()} onEquip={vi.fn()} onRemove={vi.fn()} onConfigureAutomation={vi.fn()} />
        </SpellLoadoutDndProvider>
      </GameContextMenuProvider>
    </TooltipProvider>,
  )
}

describe('SpellRow tooltip runtime integration', () => {
  beforeEach(() => { window.localStorage.clear() })
  afterEach(() => { vi.useRealTimers() })

  it('shows the real Mana and semantic Damage tooltips from SpellRow hover targets', () => {
    vi.useFakeTimers()
    renderSpellRow()

    fireEvent.pointerEnter(screen.getByLabelText('Mana Cost: 30'))
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.getByRole('tooltip').textContent).toContain('Mana spent when the Spell successfully resolves.')

    fireEvent.pointerLeave(screen.getByLabelText('Mana Cost: 30'))
    act(() => { vi.advanceTimersByTime(70) })
    fireEvent.pointerEnter(screen.getByRole('img', { name: 'Direct Damage' }))
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.getByRole('tooltip').textContent).toContain('Deals immediate damage when the Spell resolves.')
  })

  it('shows the full spell tooltip from the main icon without arming library drag', () => {
    vi.useFakeTimers()
    renderSpellRow()

    const iconTarget = document.querySelector('.spell-row-icon-tooltip-target') as HTMLElement
    expect(iconTarget).toBeTruthy()
    expect(iconTarget.dataset.noDrag).toBe('true')
    expect(iconTarget.parentElement?.classList.contains('spell-row-main')).toBe(true)

    fireEvent.pointerEnter(iconTarget)
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.getByRole('tooltip').textContent).toContain('Fire Bolt')
    expect(screen.getByRole('tooltip').textContent).toContain('CORE CASTING')
    expect(screen.getByRole('tooltip').textContent).toContain('EFFECTS')
  })

  it('does not attach the rich tooltip to locked spell icons', () => {
    vi.useFakeTimers()
    renderSpellRow({ ...entry, unlocked: false, unlockLevel: 2 })

    expect(document.querySelector('.spell-row-icon-tooltip-target')).toBeNull()
    fireEvent.pointerEnter(document.querySelector('.spell-row-icon') as HTMLElement)
    act(() => { vi.advanceTimersByTime(300) })
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('dismisses a visible SpellRow tooltip when the custom context menu opens', () => {
    vi.useFakeTimers()
    renderSpellRow()

    fireEvent.pointerEnter(screen.getByLabelText('Mana Cost: 30'))
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.getByRole('tooltip')).toBeTruthy()

    fireEvent.contextMenu(screen.getByRole('article'), { clientX: 100, clientY: 100 })
    expect(screen.getByRole('menu')).toBeTruthy()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
