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

  it('renders the equipment-aware Auto-Cast Focus summary without crashing', () => {
    const current = useGameStore.getState()
    useGameStore.setState({
      progress: { ...current.progress, spellRanks: { ...current.progress.spellRanks, 'fire-bolt': 1 } },
      activities: { ...current.activities, autoCast: { ...current.activities.autoCast, 'fire-bolt': true } },
      equipment: current.equipment,
      artifactProgress: current.artifactProgress,
    })
    const id = useGameStore.getState().createSpellPreset('Fire focus')
    useGameStore.getState().saveSpellPreset({ id, name: 'Fire focus', spellIds: ['fire-bolt'] })

    render(<TooltipProvider><SpellPresetSummary onManage={() => {}} /></TooltipProvider>)

    expect(screen.getByText('Fire focus')).toBeTruthy()
    expect(screen.getByText('1 Spells · 10 Focus', { selector: '.ui-focus' })).toBeTruthy()
  })
})
