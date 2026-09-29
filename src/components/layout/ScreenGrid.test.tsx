import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ScreenGrid } from './ScreenGrid'

describe('ScreenGrid responsive styles', () => {
  it('separates generated mobile declarations so stacked panels can size to content', () => {
    render(<ScreenGrid screen="guild" panels={[{ id: 'guild-header', content: <div /> }, { id: 'guild-tabs', content: <div /> }]} />)
    const responsiveCss = document.querySelector('style[data-screen-grid-responsive="guild"]')?.textContent ?? ''

    expect(responsiveCss).toContain('height:auto !important;max-height:none !important;')
    expect(responsiveCss).toContain('overflow:visible !important}')
  })
})
