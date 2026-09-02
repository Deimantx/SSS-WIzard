import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../../store/gameStore'
import { DeveloperCombatStatus } from './DeveloperCombatStatus'

describe('DeveloperCombatStatus Equipment fixtures', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useGameStore.getState().resetSave()
  })

  it('does not fire Living Seed when Developer Tools only sets Player HP', () => {
    const store = useGameStore.getState()
    store.addItem('heartseed-necklace', 1)
    store.equipItem('heartseed-necklace', 'amulet')
    store.spawnDebugEnemy('forest-wisp', 'whispering-woods')
    store.setPlayer({ health: Math.floor(store.player.maxHealth * 0.25) })

    const state = useGameStore.getState()
    expect(state.combat.playerBarrier).toBe(0)
    expect(state.combat.triggeredRuleIds).not.toContain('player:equipment:amulet:heartseed-necklace:living-seed')
  })

  it('crosses Living Seed threshold through real damage and records its runtime trigger', () => {
    render(<DeveloperCombatStatus />)

    fireEvent.click(screen.getByRole('button', { name: 'Living Seed threshold' }))

    const state = useGameStore.getState()
    expect(state.equipment.amulet).toBe('heartseed-necklace')
    expect(state.combat.enemyId).toBe('forest-wisp')
    expect(state.player.health).toBeLessThanOrEqual(state.player.maxHealth * 0.3)
    expect(state.combat.playerBarrier).toBe(20)
    expect(state.combat.triggeredRuleIds).toContain('player:equipment:amulet:heartseed-necklace:living-seed')
  })

  it('crosses Unyielding threshold through real damage and records its runtime trigger', () => {
    render(<DeveloperCombatStatus />)

    fireEvent.click(screen.getByRole('button', { name: 'Unyielding threshold' }))

    const state = useGameStore.getState()
    expect(state.equipment.amulet).toBe('greatbear-heartstone')
    expect(state.combat.enemyId).toBe('forest-wisp')
    expect(state.player.health).toBeLessThanOrEqual(state.player.maxHealth * 0.35)
    expect(state.combat.playerBarrier).toBe(40)
    expect(state.combat.triggeredRuleIds).toContain('player:equipment:amulet:greatbear-heartstone:unyielding')
  })
})
