import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InspectorTransition } from './InspectorTransition'

describe('InspectorTransition', () => {
  it('keeps same-identity updates stable while replacing changed identities', () => {
    const { container, rerender } = render(<InspectorTransition identity="fire" accent="#ff7b54" fill><span>Fire</span></InspectorTransition>)
    const firstNode = container.firstElementChild

    expect(firstNode?.classList.contains('inspector-transition')).toBe(true)
    expect(firstNode?.classList.contains('fill-bounded')).toBe(true)
    expect(firstNode?.getAttribute('data-inspector-identity')).toBe('fire')
    expect(firstNode?.getAttribute('data-inspector-fill')).toBe('true')
    expect((firstNode as HTMLElement).style.getPropertyValue('--inspector-accent')).toBe('#ff7b54')

    rerender(<InspectorTransition identity="fire" accent="#ff7b54" fill><span>Updated</span></InspectorTransition>)
    expect(container.firstElementChild).toBe(firstNode)

    rerender(<InspectorTransition identity="water" accent="#63c9ff" fill><span>Water</span></InspectorTransition>)
    expect(container.firstElementChild).not.toBe(firstNode)
    expect(container.firstElementChild?.getAttribute('data-inspector-identity')).toBe('water')
  })
})
