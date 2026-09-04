import { describe, expect, it } from 'vitest'
import { getLiveVisibilityTransition } from './liveVisibility'

describe('same-document visibility lifecycle', () => {
  it('pauses on hidden and requests only a safety save', () => {
    expect(getLiveVisibilityTransition(true, 3_600_000, 100)).toEqual({ hidden: true, lastFrame: 100, shouldSaveSafetyAnchor: true })
  })

  it('resumes with a fresh tick anchor without an Offline Bank credit', () => {
    const transition = getLiveVisibilityTransition(false, 3_600_000, 100)
    expect(transition).toEqual({ hidden: false, lastFrame: 3_600_000, shouldSaveSafetyAnchor: false })
    expect(transition).not.toHaveProperty('offlineElapsed')
  })
})
