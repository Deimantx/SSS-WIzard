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
    await user.click(screen.getByRole('button', { name: 'Accept Deliver 8 Life Essence' }))
    expect(useGameStore.getState().progress.arcaneGuild.activeCommission).not.toBeNull()
    await user.click(screen.getByRole('button', { name: '+5 Advancement Points' }))
    expect(useGameStore.getState().progress.guildPointsEarned).toBe(5)
    await user.click(screen.getByRole('button', { name: 'Unlock Hunter’s Order' }))
    expect(useGameStore.getState().progress.bossKillsByBoss['corrupted-greatbear']).toBe(1)
    expect(useGameStore.getState().progress.huntersOrder.availableContracts).toHaveLength(3)
  })

  it('exposes forced board fixtures, authored Hunter upgrades, and Apex-ready Gloamridge state', async () => {
    const user = userEvent.setup()
    render(<TooltipProvider><DeveloperProgression /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: 'Force Special' }))
    expect(useGameStore.getState().progress.arcaneGuild.availableCommissions.length).toBeGreaterThan(0)
    expect(useGameStore.getState().progress.arcaneGuild.availableCommissions[0]?.quality).toBe('special')
    await user.click(screen.getByText('Force an authored Commission template'))
    await user.click(screen.getByRole('button', { name: 'Force Produce Water Fragments' }))
    expect(useGameStore.getState().progress.arcaneGuild.availableCommissions[0]?.templateId).toBe('produce-water-fragments')
    await user.click(screen.getByRole('button', { name: 'Grant Nightglass Boss Contract' }))
    expect(useGameStore.getState().progress.huntersOrder.availableContracts[0]?.targetSpec).toEqual({ type: 'boss', monsterId: 'nightglass-alpha' })
    expect(useGameStore.getState().progress.huntersOrder.rankId).toBe('master-hunter')
    await user.click(screen.getByRole('button', { name: 'Set Gloamridge Apex Threat' }))
    expect(useGameStore.getState().combat.dungeonId).toBe('hunters-ground')
    expect(useGameStore.getState().combat.threatCleared).toBeGreaterThanOrEqual(16000)
    await user.click(screen.getByText('Rank and archetype fixtures'))
    await user.click(screen.getByText('Grant an upgrade without rank or Mark requirements'))
    await user.click(screen.getByRole('button', { name: /Grant Trail Kit/ }))
    expect(useGameStore.getState().progress.huntersOrder.purchasedUpgrades['trail-kit']).toBe(1)
    expect(document.querySelector('select, input[type="checkbox"], input[type="radio"], [title]')).toBeNull()
  })
})
