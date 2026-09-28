import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { DeveloperProgression } from './DeveloperProgression'

describe('Developer progression tester actions', () => {
  beforeEach(() => useGameStore.setState(createInitialState()))
  it('uses shared progression services to unlock and prepare Guild and Hunter test state', async () => {
    const user = userEvent.setup()
    render(<TooltipProvider><DeveloperProgression /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: 'Unlock Arcane Guild' }))
    expect(useGameStore.getState().progress.guildUnlocked).toBe(true)
    expect(useGameStore.getState().progress.arcaneGuild.availableCommissions.length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: '+5 Advancement Points' }))
    expect(useGameStore.getState().progress.guildPointsEarned).toBe(5)
    await user.click(screen.getByRole('button', { name: 'Unlock Hunter’s Order' }))
    expect(useGameStore.getState().progress.bossKillsByBoss['corrupted-greatbear']).toBe(1)
    expect(useGameStore.getState().progress.huntersOrder.availableContracts).toHaveLength(3)
  })
})
