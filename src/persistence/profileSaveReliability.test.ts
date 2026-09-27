import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../store/initialState'
import { profileSaveKey } from '../profiles/profileKeys'
import { getProfileStorageFootprint, saveProfileGame } from './profileSaveManager'

describe('profile save reliability diagnostics', () => {
  beforeEach(() => localStorage.clear())

  it('classifies quota failures and preserves the previous primary', () => {
    const previous = createInitialState()
    expect(saveProfileGame('slot-1', previous, { savedAt: 100 }).ok).toBe(true)
    const primaryKey = profileSaveKey('slot-1')
    const primaryBefore = localStorage.getItem(primaryKey)
    const originalSetItem = Storage.prototype.setItem
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === primaryKey && value !== primaryBefore) throw new DOMException('Quota exceeded', 'QuotaExceededError')
      return originalSetItem.call(this, key, value)
    })
    try {
      const candidate = createInitialState()
      candidate.currencies.gold = 1
      const result = saveProfileGame('slot-1', candidate, { savedAt: 200 })
      expect(result.ok).toBe(false)
      expect(result.kind).toBe('quota')
      expect(localStorage.getItem(primaryKey)).toBe(primaryBefore)
    } finally { spy.mockRestore() }
  })

  it('reports candidate and stored footprint attribution', () => {
    const state = createInitialState()
    expect(saveProfileGame('slot-1', state, { savedAt: 100 }).ok).toBe(true)
    const footprint = getProfileStorageFootprint('slot-1', state)
    expect(footprint.candidateBytes).toBeGreaterThan(0)
    expect(footprint.primaryBytes).toBeGreaterThan(0)
    expect(footprint.sigilCount).toBe(0)
  })
})
