import { describe, expect, it } from 'vitest'
import { DEFAULT_LAYOUTS } from './defaultLayouts'
import { getPanelDefinitions } from './panelRegistry'
import { getRequiredGridRows, gridRowsToPixels, pixelsToGridRows, rectanglesOverlap, resolvePanelAutoFlowLayout, stackPanelLayout, validateNoPanelOverlap } from './runtimePanelLayout'
import type { PanelDefinition } from './layoutEditorTypes'

const definition = (id: string, heightMode: PanelDefinition['heightMode'] = 'content', minH = 1): PanelDefinition => ({ id, screen: 'home', label: id, defaultLayout: { x: 0, y: 0, w: 12, h: minH }, minH, heightMode })
const item = (i: string, x: number, y: number, w: number, h: number) => ({ i, x, y, w, h })

describe('runtime panel auto-flow', () => {
  it('treats edge-touching rectangles as non-overlapping', () => {
    expect(rectanglesOverlap(item('a', 0, 0, 4, 2), item('b', 4, 0, 4, 2))).toBe(false)
    expect(rectanglesOverlap(item('a', 0, 0, 4, 2), item('b', 0, 2, 4, 1))).toBe(false)
    expect(rectanglesOverlap(item('a', 0, 0, 4, 2), item('b', 3, 1, 4, 2))).toBe(true)
  })

  it('converts pixel heights at exact and subpixel boundaries', () => {
    expect(gridRowsToPixels(1)).toBe(30)
    expect(pixelsToGridRows(30)).toBe(1)
    expect(pixelsToGridRows(30.01)).toBe(2)
    expect(pixelsToGridRows(73.99)).toBe(2)
    expect(getRequiredGridRows(30, 4)).toBe(4)
  })

  it('grows a content panel and cascades only horizontally intersecting panels', () => {
    const layout = [item('top', 0, 0, 6, 2), item('side', 6, 0, 6, 2), item('lower', 0, 2, 12, 2)]
    const resolved = resolvePanelAutoFlowLayout(layout, { top: 6 }, [definition('top'), definition('side'), definition('lower')])
    expect(resolved.find((entry) => entry.i === 'top')?.h).toBe(6)
    expect(resolved.find((entry) => entry.i === 'side')?.y).toBe(0)
    expect(resolved.find((entry) => entry.i === 'lower')?.y).toBe(6)
    expect(validateNoPanelOverlap(resolved)).toBe(true)
  })

  it('resolves corrupt saved overlap, full-width cascades, and simultaneous growth deterministically', () => {
    const layout = [item('a', 0, 0, 12, 2), item('b', 0, 1, 12, 2), item('c', 0, 2, 12, 2)]
    const resolved = resolvePanelAutoFlowLayout(layout, { a: 5, b: 4 }, [definition('a'), definition('b'), definition('c')])
    expect(resolved.map((entry) => [entry.i, entry.y, entry.h])).toEqual([['a', 0, 5], ['b', 5, 4], ['c', 9, 2]])
    expect(validateNoPanelOverlap(resolved)).toBe(true)
  })

  it('keeps the Transmutation detail/output and library/focus seams separated', () => {
    const layout = [
      item('transmutation-recipes', 0, 0, 7, 6),
      item('transmutation-focus', 0, 4, 7, 2),
      item('transmutation-detail', 7, 0, 5, 4),
      item('transmutation-output-preview', 7, 4, 5, 4),
    ]
    const definitions = [
      definition('transmutation-recipes', 'bounded-scroll', 4),
      definition('transmutation-focus', 'bounded-scroll', 2),
      definition('transmutation-detail', 'content', 4),
      definition('transmutation-output-preview', 'content', 4),
    ]
    const resolved = resolvePanelAutoFlowLayout(layout, { 'transmutation-recipes': 10, 'transmutation-detail': 8 }, definitions)
    expect(resolved.find((entry) => entry.i === 'transmutation-focus')?.y).toBe(6)
    expect(resolved.find((entry) => entry.i === 'transmutation-output-preview')?.y).toBe(8)
    expect(validateNoPanelOverlap(resolved)).toBe(true)
  })

  it('keeps bounded-scroll panels at their saved height', () => {
    const layout = [item('library', 0, 0, 6, 4), item('detail', 6, 0, 6, 2)]
    const resolved = resolvePanelAutoFlowLayout(layout, { library: 40, detail: 5 }, [definition('library', 'bounded-scroll'), definition('detail')])
    expect(resolved.find((entry) => entry.i === 'library')?.h).toBe(4)
    expect(resolved.find((entry) => entry.i === 'detail')?.h).toBe(5)
    expect(validateNoPanelOverlap(resolved)).toBe(true)
  })

  it('keeps Transmutation Focus bounded with a usable minimum height', () => {
    expect(getPanelDefinitions('tower-transmutation').find((panel) => panel.id === 'transmutation-focus')).toMatchObject({ heightMode: 'bounded-scroll', minH: 8 })
    expect(DEFAULT_LAYOUTS['tower-transmutation']['transmutation-focus'].h).toBe(15)
  })

  it('shifts locked runtime geometry while preserving the saved base object', () => {
    const saved = [item('growing', 0, 0, 12, 2), { ...item('locked', 0, 2, 12, 2), static: true }]
    const resolved = resolvePanelAutoFlowLayout(saved, { growing: 6 }, [definition('growing'), definition('locked')])
    expect(resolved.find((entry) => entry.i === 'locked')?.y).toBe(6)
    expect(saved.find((entry) => entry.i === 'locked')?.y).toBe(2)
    expect(validateNoPanelOverlap(resolved)).toBe(true)
  })

  it('allows hidden panels to be omitted from normal runtime blockers and collapses toward saved geometry', () => {
    const visibleOnly = [item('top', 0, 0, 12, 2), item('lower', 0, 2, 12, 2)]
    const definitions = [definition('top'), definition('lower')]
    const expanded = resolvePanelAutoFlowLayout(visibleOnly, { top: 8 }, definitions)
    const collapsed = resolvePanelAutoFlowLayout(visibleOnly, { top: 2 }, definitions)
    expect(expanded.find((entry) => entry.i === 'lower')?.y).toBe(8)
    expect(collapsed.find((entry) => entry.i === 'lower')?.y).toBe(2)
    expect(validateNoPanelOverlap(expanded)).toBe(true)
  })

  it('stacks narrow layouts using effective heights', () => {
    const stacked = stackPanelLayout([item('a', 4, 20, 4, 3), item('b', 0, 0, 8, 7)])
    expect(stacked.map((entry) => [entry.x, entry.y, entry.w, entry.h])).toEqual([[0, 0, 12, 3], [0, 3, 12, 7]])
    expect(validateNoPanelOverlap(stacked)).toBe(true)
  })

  it('keeps every authored default screen layout collision-free', () => {
    for (const screen of Object.keys(DEFAULT_LAYOUTS) as Array<keyof typeof DEFAULT_LAYOUTS>) {
      const layout = Object.entries(DEFAULT_LAYOUTS[screen]).map(([i, value]) => ({ i, ...value }))
      expect(validateNoPanelOverlap(resolvePanelAutoFlowLayout(layout, {}, getPanelDefinitions(screen)))).toBe(true)
    }
  })

  it('keeps every panel collision-free when its natural requirement grows', () => {
    for (const screen of Object.keys(DEFAULT_LAYOUTS) as Array<keyof typeof DEFAULT_LAYOUTS>) {
      const base = Object.entries(DEFAULT_LAYOUTS[screen]).map(([i, value]) => ({ i, ...value }))
      for (const panel of getPanelDefinitions(screen)) {
        const resolved = resolvePanelAutoFlowLayout(base, { [panel.id]: (panel.defaultLayout.h ?? 1) + 8 }, getPanelDefinitions(screen))
        expect(validateNoPanelOverlap(resolved), `${screen}/${panel.id}`).toBe(true)
      }
    }
  })
})
