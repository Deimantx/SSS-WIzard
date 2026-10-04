import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { resolveCombatCurrencyRewardRange } from '../../game/systems/loot/combatCurrencyRewards'
import { resolveEnemyResonanceReward } from '../../game/systems/resonance/resonanceRuntime'
import { getNonZeroResonanceEntries } from '../../game/presentation/resonance/resonancePresentation'
import { formatDropQuantity } from '../../game/systems/bestiary/bestiarySelectors'
import { MONSTER_IDS } from '../../game/content/monsters'
import { resolveCombatLootContext } from '../../game/systems/loot/universalLootRuntime'
import { BestiaryInspector } from './BestiaryInspector'

const renderInspector = (monsterId: Parameters<typeof BestiaryInspector>[0]['monsterId'], discovered = true, crystalSystemUnlocked = false) => {
  const state = createInitialState()
  state.progress.discoveredMonsters = discovered && monsterId ? [monsterId] : []
  state.progress.bossKillsByBoss['meridian-splitter'] = crystalSystemUnlocked ? 1 : 0
  useGameStore.setState(state)
  return render(<TooltipProvider><BestiaryInspector monsterId={monsterId} progress={state.progress} /></TooltipProvider>)
}

describe('BestiaryResonanceYield', () => {
  beforeEach(() => useGameStore.setState(createInitialState()))

  it('shows scaled Resonance separately for a discovered boss', () => {
    renderInspector('forest-heart')

    expect(screen.getByText('RESONANCE YIELD')).toBeTruthy()
    expect(screen.getByText('Earth Resonance')).toBeTruthy()
    const resolved = resolveEnemyResonanceReward('forest-heart')
    getNonZeroResonanceEntries(resolved.finalYield).forEach(({ amount }) => expect(screen.getByText(`+${amount.toLocaleString('en-US')}`)).toBeTruthy())
    expect(screen.getByText('Life Essence')).toBeTruthy()
    expect(screen.getByText('Artifact Essence')).toBeTruthy()
    expect(screen.getByText('GUARANTEED REWARDS')).toBeTruthy()
    expect(document.querySelector('.bestiary-loot-list')).toBeTruthy()
    expect(document.querySelector('.bestiary-resonance-section')?.compareDocumentPosition(document.querySelector('.bestiary-loot-list') as Node) === Node.DOCUMENT_POSITION_FOLLOWING).toBe(true)
  })

  it('shows guaranteed Essence ranges from canonical enemy Power', () => {
    renderInspector('forest-wisp')
    const canonicalLife = resolveCombatCurrencyRewardRange('forest-wisp', 'life-essence')
    const canonicalArtifact = resolveCombatCurrencyRewardRange('forest-wisp', 'artifact-essence')
    const lootList = document.querySelector('.bestiary-loot-list') as HTMLElement
    expect(lootList.textContent).toContain(formatDropQuantity(canonicalLife.finalMin, canonicalLife.finalMax))
    expect(lootList.textContent).toContain(formatDropQuantity(canonicalArtifact.finalMin, canonicalArtifact.finalMax))
    expect(lootList.textContent).toContain('GUARANTEED')

    expect(lootList.textContent).toContain('GUARANTEED')
  })

  it('renders multiple types from the single canonical reward profile', () => {
    renderInspector('graveglass-shade')
    const canonical = resolveEnemyResonanceReward('graveglass-shade')
    getNonZeroResonanceEntries(canonical.finalYield).forEach(({ amount }) => expect(screen.getByText(`+${amount.toLocaleString('en-US')}`)).toBeTruthy())


  })

  it('shows an explicit empty state for an enemy without Resonance', () => {
    renderInspector('meridian-warden')
    expect(screen.getByText('No Resonance reward.')).toBeTruthy()
  })

  it('keeps undiscovered dossier details private', () => {
    renderInspector('forest-wisp', false)
    expect(screen.getByText('UNDISCOVERED CREATURE')).toBeTruthy()
    expect(screen.queryByText('RESONANCE YIELD')).toBeNull()
  })

  it('does not show an active Crystal Cache chance before the Crystal System unlock', () => {
    const eligibleMonster = MONSTER_IDS.find((id) => resolveCombatLootContext(id).lootTier.tier >= 10)
    expect(eligibleMonster).toBeDefined()
    if (!eligibleMonster) return

    const lockedView = renderInspector(eligibleMonster)
    const lockedRow = screen.getByText('Tier 1 Crystal Cache').closest('.bestiary-loot-row')
    expect(lockedRow?.textContent).toContain('LOCKED — Defeat Meridian Splitter')
    expect(lockedRow?.textContent).not.toMatch(/\d+(?:\.\d+)?%/)

    lockedView.unmount()
    renderInspector(eligibleMonster, true, true)
    const unlockedRow = screen.getByText('Tier 1 Crystal Cache').closest('.bestiary-loot-row')
    expect(unlockedRow?.textContent).toMatch(/\d+(?:\.\d+)?%/)
  })
})
