import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../store/initialState'
import { GameContextMenuProvider } from '../../ui/context-menu/GameContextMenuProvider'
import { SpellLoadoutDndProvider } from './SpellLoadoutDnd'
import { SpellRow } from './SpellRow'
import type { SpellBrowserEntry } from './spellBrowserSelectors'

const renderSpellRow = ({ equipped = false, canEdit = true, unlocked = true }: { equipped?: boolean; canEdit?: boolean; unlocked?: boolean } = {}) => {
  const state = createInitialState()
  state.progress.spellRanks = unlocked ? { 'fire-bolt': 1 } : {}
  const entry: SpellBrowserEntry = { kind: 'spell', id: 'fire-bolt', spellId: 'fire-bolt', school: 'fire', unlockLevel: 2, unlocked, rank: unlocked ? 1 : null, tags: unlocked ? ['Damage'] : [] }
  const onConfigureAutomation = vi.fn()
  const view = render(
    <TooltipProvider>
      <GameContextMenuProvider>
        <SpellLoadoutDndProvider onCommit={vi.fn()}>
          <SpellRow entry={entry} state={state} selected={false} equipped={equipped} newSpell={false} canEdit={canEdit} onSelect={vi.fn()} onEquip={vi.fn()} onRemove={vi.fn()} onConfigureAutomation={onConfigureAutomation} />
        </SpellLoadoutDndProvider>
      </GameContextMenuProvider>
    </TooltipProvider>,
  )
  return { ...view, onConfigureAutomation }
}

describe('Magic Schools spell context actions', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('offers automation configuration for an equipped Spell', () => {
    const { container, onConfigureAutomation } = renderSpellRow({ equipped: true })

    fireEvent.contextMenu(container.querySelector('.spell-row') as HTMLElement, { clientX: 20, clientY: 20 })

    expect(screen.getByRole('menuitem', { name: 'Configure Automation' })).toBeTruthy()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Configure Automation' }))
    expect(onConfigureAutomation).toHaveBeenCalledWith('fire-bolt')
  })

  it('offers Add instead of Configure Automation for an unequipped Spell', () => {
    const { container } = renderSpellRow()

    fireEvent.contextMenu(container.querySelector('.spell-row') as HTMLElement, { clientX: 20, clientY: 20 })

    expect(screen.getByRole('menuitem', { name: 'Add to Combat Loadout' })).toBeTruthy()
    expect(screen.queryByRole('menuitem', { name: 'Configure Automation' })).toBeNull()
  })

  it('limits a locked Spell to inspection', () => {
    const { container } = renderSpellRow({ unlocked: false })

    fireEvent.contextMenu(container.querySelector('.spell-row') as HTMLElement, { clientX: 20, clientY: 20 })

    expect(screen.getByRole('menuitem', { name: 'Inspect Spell' })).toBeTruthy()
    expect(screen.queryByRole('menuitem', { name: 'Add to Combat Loadout' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: 'Configure Automation' })).toBeNull()
  })
})
