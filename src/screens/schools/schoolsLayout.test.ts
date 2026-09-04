import { describe, expect, it } from 'vitest'
import type { Layout } from 'react-grid-layout'
import { getAdaptiveSchoolsLayout } from './schoolsLayout'

const baseLayout: Layout = [
  { i: 'schools-browser', x: 0, y: 0, w: 7, h: 18 },
  { i: 'schools-inspector', x: 7, y: 0, w: 5, h: 18 },
  { i: 'schools-presets', x: 0, y: 18, w: 12, h: 6 },
]

describe('adaptive Schools layout', () => {
  it('extends the Inspector and pushes Presets below it when content exceeds the base height', () => {
    const expanded = getAdaptiveSchoolsLayout(baseLayout, 1000)

    expect(expanded.find((item) => item.i === 'schools-inspector')).toMatchObject({ h: 24 })
    expect(expanded.find((item) => item.i === 'schools-presets')).toMatchObject({ y: 24 })
    expect(expanded.find((item) => item.i === 'schools-browser')).toMatchObject({ y: 0, h: 18 })
  })

  it('returns the saved layout when the selected spell fits the base Inspector height', () => {
    expect(getAdaptiveSchoolsLayout(baseLayout, 650)).toEqual(baseLayout)
  })
})
