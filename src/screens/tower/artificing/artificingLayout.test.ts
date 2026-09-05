import { describe, expect, it } from 'vitest'
import { arrangeArtificingPanels } from './artificingLayout'
import { resolvePanelAutoFlowLayout, validateNoPanelOverlap } from '../../../ui/layout-editor/runtimePanelLayout'
import { getPanelDefinitions } from '../../../ui/layout-editor/panelRegistry'

describe('Artificing pinned panel placement', () => {
  it('follows measured Forge height instead of the taller catalog without changing saved geometry', () => {
    const saved = [
      { i: 'artificing-catalog', x: 0, y: 0, w: 7, h: 40 },
      { i: 'artificing-detail', x: 7, y: 0, w: 5, h: 40 },
      { i: 'artificing-pinned-recipe', x: 7, y: 40, w: 5, h: 9 },
    ]
    const prepared = arrangeArtificingPanels(saved)
    for (const height of [22, 35]) {
      const resolved = resolvePanelAutoFlowLayout(prepared, { 'artificing-detail': height }, getPanelDefinitions('tower-artificing'))
      expect(resolved.find(panel => panel.i === 'artificing-pinned-recipe')?.y).toBe(height)
      expect(validateNoPanelOverlap(resolved)).toBe(true)
    }
    expect(saved[1].h).toBe(40)
    expect(saved[2].y).toBe(40)
  })
})
