import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { clearCombatDefeat, combatDefeatSink, useCombatDefeatStore } from '../../game/ui/combatDefeatStore'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { DefeatSummaryModal } from './DefeatSummaryModal'

describe('DefeatSummaryModal', () => {
  beforeEach(() => { clearCombatDefeat(); useGameStore.getState().hydrateState(createInitialState()) })

  it('opens with enemy identity, summary totals, and the final typed event', () => {
    combatDefeatSink.push({ source: { kind: 'system' }, dungeonId: 'whispering-woods', target: 'player', targetMonsterId: 'forest-wisp', category: 'death', sourceId: 'player-defeated', timestampMs: 100 })
    render(<TooltipProvider><DefeatSummaryModal /></TooltipProvider>)
    expect(screen.getByRole('dialog', { name: 'DEFEAT SUMMARY' })).toBeTruthy()
    expect(screen.getByText('FOREST WISP DEFEATED')).toBeTruthy()
    expect(screen.getByText('YOUR WIZARD WAS DEFEATED')).toBeTruthy()
  })

  it('returns to the inactive Tower state without auto-retry', async () => {
    const user = userEvent.setup()
    combatDefeatSink.push({ source: { kind: 'system' }, dungeonId: 'whispering-woods', target: 'player', targetMonsterId: 'forest-wisp', category: 'death', sourceId: 'player-defeated' })
    render(<TooltipProvider><DefeatSummaryModal /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: 'RETURN TO TOWER' }))
    expect(useCombatDefeatStore.getState().snapshot).toBeNull()
    expect(useGameStore.getState().combat.active).toBe(false)
    expect(useGameStore.getState().combat.enemyId).toBeNull()
  })
})
