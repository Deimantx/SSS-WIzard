import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import type { CombatActNodeViewModel } from './combatActNavigationTypes'
import { CombatAreaInspector } from './CombatAreaInspector'

const createNode = (overrides: Partial<CombatActNodeViewModel> = {}): CombatActNodeViewModel => ({
  id: 'howling-den',
  actId: 'act-0',
  x: 0,
  y: 0,
  kind: 'main',
  dungeonId: 'howling-den',
  tierLabel: 'T1 · DUNGEON',
  recommendedLevel: null,
  chapterId: null,
  state: 'available',
  statusLabel: 'AVAILABLE',
  unlockText: null,
  encounters: [],
  boss: null,
  threatRequired: 25,
  threatCleared: 0,
  normalKills: 0,
  bossClears: 0,
  name: 'Howling Den',
  description: 'A predator-haunted den twisted by unstable magic.',
  ...overrides,
})

const renderInspector = (node: CombatActNodeViewModel, onEnter = vi.fn()) => render(
  <TooltipProvider>
    <CombatAreaInspector node={node} combatActive activeDungeonId="whispering-woods" onLoot={() => undefined} onBestiary={() => undefined} onEnter={onEnter} />
  </TooltipProvider>,
)

describe('CombatAreaInspector dungeon entry', () => {
  it('keeps another unlocked dungeon enterable during an active run', () => {
    const onEnter = vi.fn()
    renderInspector(createNode(), onEnter)

    const button = screen.getByRole('button', { name: 'ENTER COMBAT' })
    expect(button.hasAttribute('disabled')).toBe(false)
    expect(screen.queryByRole('button', { name: /LEAVE CURRENT/ })).toBeNull()

    fireEvent.click(button)
    expect(onEnter).toHaveBeenCalledTimes(1)
  })

  it('keeps the active dungeon on a return action', () => {
    renderInspector(createNode({ id: 'whispering-woods', dungeonId: 'whispering-woods', name: 'Whispering Woods', state: 'active', statusLabel: 'ACTIVE' }))

    expect(screen.getByRole('button', { name: 'RETURN TO COMBAT' }).hasAttribute('disabled')).toBe(false)
  })

  it('keeps locked routes disabled', () => {
    renderInspector(createNode({ state: 'locked', statusLabel: 'LOCKED', unlockText: 'Defeat Forest Heart' }))

    expect(screen.getByRole('button', { name: 'ROUTE LOCKED' }).hasAttribute('disabled')).toBe(true)
  })
})
