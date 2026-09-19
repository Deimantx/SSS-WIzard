import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { useGameStore } from '../../store/gameStore'
import { SpellPresetSummary } from './SpellPresetSummary'

describe('SpellPresetSummary', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('renders the selected ordered combat loadout and equipment-aware Focus summary', () => {
    const current = useGameStore.getState()
    useGameStore.setState({
      progress: { ...current.progress, spellRanks: { ...current.progress.spellRanks, 'fire-bolt': 1 } },
      equipment: current.equipment,
      artifactProgress: current.artifactProgress,
    })
    const id = useGameStore.getState().createSpellPreset('Fire focus')
    useGameStore.getState().saveSpellPreset({ id, name: 'Fire focus', slots: [{ spellId: 'fire-bolt', autoCast: true }] })
    useGameStore.getState().selectSpellPreset(id)

    render(<TooltipProvider><SpellPresetSummary onManage={() => {}} /></TooltipProvider>)

    expect(screen.getByText('Fire focus')).toBeTruthy()
    expect(screen.getByText('1 AUTO · 0 MANUAL · 10 Focus', { selector: '.ui-focus' })).toBeTruthy()
  })
})
