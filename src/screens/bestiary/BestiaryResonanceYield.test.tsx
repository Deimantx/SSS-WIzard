import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import type { WorldTierId } from '../../game/types'
import { resolveCombatCurrencyRewardRange } from '../../game/systems/loot/combatCurrencyRewards'
import { resolveEnemyResonanceReward } from '../../game/systems/resonance/resonanceRuntime'
import { getNonZeroResonanceEntries } from '../../game/presentation/resonance/resonancePresentation'
import { formatDropQuantity } from '../../game/systems/bestiary/bestiarySelectors'
import { MONSTER_IDS } from '../../game/content/monsters'
import { resolveCombatLootContext } from '../../game/systems/loot/universalLootRuntime'
import { BestiaryInspector } from './BestiaryInspector'

const renderInspector = (monsterId: Parameters<typeof BestiaryInspector>[0]['monsterId'], worldTier: WorldTierId = 1, discovered = true, crystalSystemUnlocked = false) => {
  const state = createInitialState()
  state.progress.discoveredMonsters = discovered && monsterId ? [monsterId] : []
  state.progress.bossKillsByBoss['meridian-splitter'] = crystalSystemUnlocked ? 1 : 0
  state.worldTier.current = worldTier
  state.worldTier.highestUnlocked = Math.max(worldTier, 2) as WorldTierId
  useGameStore.setState(state)
  return render(<TooltipProvider><BestiaryInspector monsterId={monsterId} progress={state.progress} /></TooltipProvider>)
}

describe('BestiaryResonanceYield', () => {
  beforeEach(() => useGameStore.setState(createInitialState()))

  it('shows scaled Resonance separately for a discovered boss', () => {
    renderInspector('forest-heart')

    expect(screen.getByText('RESONANCE YIELD')).toBeTruthy()
    expect(screen.getByText('Earth Resonance')).toBeTruthy()
    const resolved = resolveEnemyResonanceReward('forest-heart', 1)
    getNonZeroResonanceEntries(resolved.finalYield).forEach(({ amount }) => expect(screen.getByText(`+${amount.toLocaleString('en-US')}`)).toBeTruthy())
    expect(screen.getByText('Life Essence')).toBeTruthy()
    expect(screen.getByText('Artifact Essence')).toBeTruthy()
    expect(screen.getByText('GUARANTEED REWARDS')).toBeTruthy()
    expect(document.querySelector('.bestiary-loot-list')).toBeTruthy()
    expect(document.querySelector('.bestiary-resonance-section')?.compareDocumentPosition(document.querySelector('.bestiary-loot-list') as Node) === Node.DOCUMENT_POSITION_FOLLOWING).toBe(true)
  })

  it('shows guaranteed dynamic Essence ranges and updates them with World Tier', () => {
    renderInspector('forest-wisp', 1)
    const wt1Life = resolveCombatCurrencyRewardRange('forest-wisp', 'life-essence', 1)
    const wt1Artifact = resolveCombatCurrencyRewardRange('forest-wisp', 'artifact-essence', 1)
    const wt1Loot = document.querySelector('.bestiary-loot-list') as HTMLElement
    expect(wt1Loot.textContent).toContain(formatDropQuantity(wt1Life.finalMin, wt1Life.finalMax))
    expect(wt1Loot.textContent).toContain(formatDropQuantity(wt1Artifact.finalMin, wt1Artifact.finalMax))
    expect(wt1Loot.textContent).toContain('GUARANTEED')

    act(() => { useGameStore.getState().setWorldTier(2) })
    const wt2Life = resolveCombatCurrencyRewardRange('forest-wisp', 'life-essence', 2)
    const wt2Artifact = resolveCombatCurrencyRewardRange('forest-wisp', 'artifact-essence', 2)
    const wt2Loot = document.querySelector('.bestiary-loot-list') as HTMLElement
    expect(wt2Loot.textContent).toContain(formatDropQuantity(wt2Life.finalMin, wt2Life.finalMax))
    expect(wt2Loot.textContent).toContain(formatDropQuantity(wt2Artifact.finalMin, wt2Artifact.finalMax))
  })

  it('renders multiple types and reacts to the current World Tier', () => {
    renderInspector('graveglass-shade', 1)
    expect(screen.getByText('WT1')).toBeTruthy()
    const wt1 = resolveEnemyResonanceReward('graveglass-shade', 1)
    getNonZeroResonanceEntries(wt1.finalYield).forEach(({ amount }) => expect(screen.getByText(`+${amount.toLocaleString('en-US')}`)).toBeTruthy())

    act(() => { useGameStore.getState().setWorldTier(2) })
    expect(screen.getByText('WT2')).toBeTruthy()
    const wt2 = resolveEnemyResonanceReward('graveglass-shade', 2)
    getNonZeroResonanceEntries(wt2.finalYield).forEach(({ amount }) => expect(screen.getByText(`+${amount.toLocaleString('en-US')}`)).toBeTruthy())
  })

  it('shows an explicit empty state for an enemy without Resonance', () => {
    renderInspector('meridian-warden')
    expect(screen.getByText('No Resonance reward.')).toBeTruthy()
  })

  it('keeps undiscovered dossier details private', () => {
    renderInspector('forest-wisp', 1, false)
    expect(screen.getByText('UNDISCOVERED CREATURE')).toBeTruthy()
    expect(screen.queryByText('RESONANCE YIELD')).toBeNull()
  })

  it('does not show an active Crystal Cache chance before the Crystal System unlock', () => {
    const eligibleMonster = MONSTER_IDS.find((id) => resolveCombatLootContext(id, 1).lootTier.tier >= 10)
    expect(eligibleMonster).toBeDefined()
    if (!eligibleMonster) return

    const lockedView = renderInspector(eligibleMonster)
    const lockedRow = screen.getByText('Tier 1 Crystal Cache').closest('.bestiary-loot-row')
    expect(lockedRow?.textContent).toContain('LOCKED — Defeat Meridian Splitter')
    expect(lockedRow?.textContent).not.toMatch(/\d+(?:\.\d+)?%/)

    lockedView.unmount()
    renderInspector(eligibleMonster, 1, true, true)
    const unlockedRow = screen.getByText('Tier 1 Crystal Cache').closest('.bestiary-loot-row')
    expect(unlockedRow?.textContent).toMatch(/\d+(?:\.\d+)?%/)
  })
})
