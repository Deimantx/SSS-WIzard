import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { GameContextMenuProvider } from '../../ui/context-menu/GameContextMenuProvider'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { useGameStore } from '../../store/gameStore'
import { createInitialState } from '../../store/initialState'
import { BestiaryScreen } from './BestiaryScreen'

const renderBestiary = () => render(<TooltipProvider><GameContextMenuProvider><BestiaryScreen /></GameContextMenuProvider></TooltipProvider>)

describe('Bestiary combat navigation intent', () => {
  beforeEach(() => {
    useGameStore.setState(createInitialState())
    setNavigationIntent({ combatDungeonId: null, combatMonsterId: null })
  })

  it('selects the exact discovered target supplied by Combat', () => {
    const state = createInitialState()
    state.progress.discoveredMonsters = ['tempest-stag']
    useGameStore.setState(state)
    setNavigationIntent({ combatDungeonId: 'whispering-woods', combatMonsterId: 'tempest-stag' })
    renderBestiary()

    expect(screen.getByRole('heading', { name: 'Tempest Stag' })).toBeTruthy()
    expect(screen.getByText('AREA: WHISPERING WOODS')).toBeTruthy()
  })

  it('keeps an exact undiscovered target selected as an undiscovered dossier', () => {
    setNavigationIntent({ combatDungeonId: 'whispering-woods', combatMonsterId: 'tempest-stag' })
    renderBestiary()

    expect(screen.getByText('UNDISCOVERED CREATURE')).toBeTruthy()
    expect(screen.getByText('AREA: WHISPERING WOODS')).toBeTruthy()
  })

  it('shows boss mechanic and phase detail only after discovery', () => {
    const state = createInitialState()
    state.progress.discoveredMonsters = ['forest-heart']
    useGameStore.setState(state)
    setNavigationIntent({ combatMonsterId: 'forest-heart' })
    renderBestiary()

    expect(screen.getByText('BOSS MECHANICS')).toBeTruthy()
    expect(screen.getByText('Below 50% HP')).toBeTruthy()
    expect(screen.getAllByText('Rapid Regrow').length).toBeGreaterThan(0)
    expect(screen.getByText('PHASES / ROTATIONS')).toBeTruthy()
    expect(screen.getAllByText('Overgrown').length).toBeGreaterThan(0)
  })

  it('does not expose boss mechanics for an undiscovered target', () => {
    setNavigationIntent({ combatMonsterId: 'forest-heart' })
    renderBestiary()

    expect(screen.queryByText('BOSS MECHANICS')).toBeNull()
    expect(screen.queryByText('Rapid Regrow')).toBeNull()
  })
})
