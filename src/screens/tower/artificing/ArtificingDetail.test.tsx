import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip/Tooltip'
import { ARTIFICING_RECIPES } from '../../../game/content/recipes/artificingRecipes'
import { useGameStore } from '../../../store/gameStore'
import { ArtificingDetail } from './ArtificingDetail'

describe('Artificing detail ownership labels', () => {
  beforeEach(() => {
    useGameStore.getState().resetSave()
    const current = useGameStore.getState()
    useGameStore.setState({ progress: { ...current.progress, lifetimeKillsByMonster: { ...current.progress.lifetimeKillsByMonster, 'forest-wisp': 1 } } })
  })

  it('uses binary ownership text for a forged Artifact', () => {
    const current = useGameStore.getState()
    useGameStore.setState({ inventory: { ...current.inventory, 'ember-staff': 1 }, artifactProgress: { ...current.artifactProgress, 'ember-staff': { level: 3, allocatedNodeIds: [], attunedNodeIds: [] } } })
    render(<TooltipProvider><ArtificingDetail recipe={ARTIFICING_RECIPES['ember-staff']} /></TooltipProvider>)

    expect(screen.getByText('OWNED')).toBeTruthy()
    expect(screen.queryByText('OWNED 1')).toBeNull()
  })

  it('keeps numeric ownership text for repeatable Equipment', () => {
    const current = useGameStore.getState()
    useGameStore.setState({ inventory: { ...current.inventory, 'windthread-charm': 3 } })
    render(<TooltipProvider><ArtificingDetail recipe={ARTIFICING_RECIPES['windthread-charm']} /></TooltipProvider>)

    expect(screen.getByText('OWNED 3')).toBeTruthy()
  })
})
