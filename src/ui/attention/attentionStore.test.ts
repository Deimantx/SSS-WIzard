import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clearAttention, clearProfileAttention, getProfileAttention, hasUnseenAttention, markAttention } from './attentionStore'

describe('profile-scoped discovery attention', () => {
  beforeEach(() => {
    window.localStorage.clear()
    clearProfileAttention('profile-1')
    clearProfileAttention('profile-2')
  })

  afterEach(() => window.localStorage.clear())

  it('keeps unseen content isolated between profiles and clears exact viewed entries', () => {
    markAttention('profile-1', 'item', 'fire-fragment')
    markAttention('profile-1', 'item', 'water-fragment')
    markAttention('profile-2', 'item', 'air-fragment')

    expect(getProfileAttention('profile-1').unseenItems).toEqual(['fire-fragment', 'water-fragment'])
    expect(getProfileAttention('profile-2').unseenItems).toEqual(['air-fragment'])
    expect(hasUnseenAttention(getProfileAttention('profile-1'), 'inventory')).toBe(true)

    clearAttention('profile-1', 'item', 'fire-fragment')

    expect(getProfileAttention('profile-1').unseenItems).toEqual(['water-fragment'])
    expect(getProfileAttention('profile-2').unseenItems).toEqual(['air-fragment'])
  })

  it('persists and removes a profile attention record independently', () => {
    markAttention('profile-1', 'monster', 'grove-sentinel')
    expect(JSON.parse(window.localStorage.getItem('sss-wizard-profile-attention-v1:profile-1') ?? '{}').unseenMonsters).toEqual(['grove-sentinel'])

    clearProfileAttention('profile-1')

    expect(getProfileAttention('profile-1').unseenMonsters).toEqual([])
    expect(window.localStorage.getItem('sss-wizard-profile-attention-v1:profile-1')).toBeNull()
  })
})
