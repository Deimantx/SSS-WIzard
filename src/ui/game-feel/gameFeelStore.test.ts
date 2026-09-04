import { afterEach, describe, expect, it } from 'vitest'
import { clearGameFeelEvents, emitGameFeelEvent, getGameFeelEvents, MAX_ACTIVE_GAME_FEEL_EVENTS } from './gameFeelStore'

describe('game feel event store', () => {
  afterEach(() => clearGameFeelEvents())

  it('caps transient events without affecting gameplay state', () => {
    for (let index = 0; index < MAX_ACTIVE_GAME_FEEL_EVENTS + 3; index += 1) emitGameFeelEvent({ type: 'craft-complete', x: index, y: index })

    expect(getGameFeelEvents()).toHaveLength(MAX_ACTIVE_GAME_FEEL_EVENTS)
    expect(getGameFeelEvents()[0].x).toBe(3)
  })
})

