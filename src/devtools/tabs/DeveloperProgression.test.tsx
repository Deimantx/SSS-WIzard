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
    useGameStore.setState((state) => ({ progress: { ...state.progress, discoveredItems: ['life-essence'] } }))
    const user = userEvent.setup()
    render(<TooltipProvider><DeveloperProgression /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: 'Unlock Arcane Guild' }))
    expect(useGameStore.getState().progress.guildUnlocked).toBe(true)
    expect(useGameStore.getState().progress.arcaneGuild.availableCommissions.length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /Accept .*Life Essence/ }))
    expect(useGameStore.getState().progress.arcaneGuild.activeCommission).not.toBeNull()
    await user.click(screen.getByRole('button', { name: '+5 Advancement Points' }))
    expect(useGameStore.getState().progress.guildPointsEarned).toBe(5)
    await user.click(screen.getByRole('button', { name: 'Unlock Hunter’s Order' }))
    expect(useGameStore.getState().progress.bossKillsByBoss['corrupted-greatbear']).toBe(1)
    expect(useGameStore.getState().progress.huntersOrder.availableContracts).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Issue Starter Contract' }))
    expect(useGameStore.getState().progress.huntersOrder.activeContract?.targetSpec.type).toBe('monster')
  })

  it('exposes forced board fixtures, authored Hunter upgrades, and Master Quarry contract fixture', async () => {
    const user = userEvent.setup()
    render(<TooltipProvider><DeveloperProgression /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: 'Force Special' }))
    expect(useGameStore.getState().progress.arcaneGuild.availableCommissions.length).toBeGreaterThan(0)
    expect(useGameStore.getState().progress.arcaneGuild.availableCommissions[0]?.quality).toBe('special')
    await user.click(screen.getByText('Force an authored Commission template'))
    await user.click(screen.getByRole('button', { name: 'Force Produce Water Fragments' }))
    expect(useGameStore.getState().progress.arcaneGuild.availableCommissions[0]?.templateId).toBe('produce-water-fragments')
    await user.click(screen.getByRole('button', { name: 'Grant Nightglass Contract' }))
    expect(useGameStore.getState().progress.huntersOrder.availableContracts[0]?.targetSpec).toEqual({ type: 'monster', monsterId: 'nightglass-alpha' })
    expect(useGameStore.getState().progress.huntersOrder.rankId).toBe('master-hunter')
    await user.click(screen.getByText('Standing and board fixtures'))
    await user.click(screen.getByRole('button', { name: 'Generate 3-slot Board' }))
    expect(useGameStore.getState().progress.huntersOrder.availableContracts).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: 'MAX SELECTED' }))
    expect(useGameStore.getState().progress.huntersOrder.purchasedUpgrades['negotiated-rerolls']).toBeGreaterThan(0)
    expect(document.querySelector('select, input[type="checkbox"], input[type="radio"], [title]')).toBeNull()
  })
})
