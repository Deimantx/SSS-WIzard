import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '../ui/tooltip/Tooltip'
import { SigilBulkSalvageModal } from './SigilBulkSalvageModal'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { generateSigil } from '../../game/systems/sigils/sigilGeneration'
import { getSigilSalvageValue } from '../../game/systems/sigils/sigilRuntime'

describe('SigilBulkSalvageModal', () => {
  it('selects a preset, previews authored dust, and requires a final confirmation', () => {
    const state = createInitialState()
    const common = generateSigil({ state, locationId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 1, forcedQuality: 'common', rng: () => .5 })
    generateSigil({ state, locationId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 2, forcedQuality: 'legendary', rng: () => .5 })
    useGameStore.setState(state)
    const close = () => undefined
    render(<TooltipProvider><SigilBulkSalvageModal open onClose={close} /></TooltipProvider>)

    fireEvent.click(screen.getByRole('button', { name: /^COMMON$/ }))
    expect(screen.getByText('1 SIGIL SELECTED')).toBeTruthy()
    expect(screen.getByText(`+${getSigilSalvageValue(common).toLocaleString()} SIGIL DUST`)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'SALVAGE 1 SIGIL' }))
    expect(screen.getByRole('dialog', { name: 'CONFIRM SALVAGE' }).textContent).toContain('CONFIRM SALVAGE')
    fireEvent.click(screen.getByRole('button', { name: 'CONFIRM SALVAGE' }))
    expect(useGameStore.getState().sigils.storage[common.instanceId]).toBeUndefined()
    expect(useGameStore.getState().sigils.dust).toBe(getSigilSalvageValue(common))
  })

  it('filters the stored browser with its themed quality picker', () => {
    const state = createInitialState()
    generateSigil({ state, locationId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 1, forcedQuality: 'common', rng: () => .5 })
    generateSigil({ state, locationId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 2, forcedQuality: 'legendary', rng: () => .5 })
    useGameStore.setState(state)
    render(<TooltipProvider><SigilBulkSalvageModal open onClose={() => undefined} /></TooltipProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Filter by Quality' }))
    fireEvent.click(screen.getByRole('option', { name: 'Legendary' }))
    expect(screen.getByText('1 VISIBLE')).toBeTruthy()
    expect(document.querySelectorAll('.sigil-bulk-grid .sigil-card')).toHaveLength(1)
  })
})
