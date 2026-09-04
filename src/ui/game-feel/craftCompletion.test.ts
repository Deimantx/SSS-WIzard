import { describe, expect, it } from 'vitest'
import { didTransmutationCycleWrap } from './craftCompletion'

describe('transmutation craft completion detection', () => {
  it('ignores hydration and ordinary progress but catches a running cycle wrap', () => {
    expect(didTransmutationCycleWrap({ previousProgress: null, currentProgress: 200, durationMs: 6000, echoes: 1, running: true })).toBe(false)
    expect(didTransmutationCycleWrap({ previousProgress: 1000, currentProgress: 3000, durationMs: 6000, echoes: 1, running: true })).toBe(false)
    expect(didTransmutationCycleWrap({ previousProgress: 5600, currentProgress: 200, durationMs: 6000, echoes: 1, running: true })).toBe(true)
    expect(didTransmutationCycleWrap({ previousProgress: 5600, currentProgress: 200, durationMs: 6000, echoes: 0, running: true })).toBe(false)
  })
})

