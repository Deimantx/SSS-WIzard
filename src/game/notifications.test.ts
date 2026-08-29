import { describe, expect, it } from 'vitest'
import { pushNotification } from './engine'
import { createInitialState } from '../store/initialState'
import { assignTransmutationEchoAction } from '../store/actions/transmutationActions'

describe('notification policy', () => {
  it('keeps important manual action warnings', () => {
    const state = createInitialState()

    assignTransmutationEchoAction(state, 'ember-staff')

    expect(state.notifications[0]?.text).toBe('Defeat the first dungeon boss to unlock this recipe.')
  })

  it('keeps important warnings while rate limiting a semantic warning key', () => {
    const state = createInitialState()

    pushNotification(state, 'Not enough free Focus.', 'warning', { key: 'transmutation-no-focus', cooldownMs: 1_500 })
    pushNotification(state, 'Focus is still unavailable.', 'warning', { key: 'transmutation-no-focus', cooldownMs: 1_500 })

    expect(state.notifications).toHaveLength(1)
    expect(state.notifications[0].tone).toBe('warning')
  })
})
