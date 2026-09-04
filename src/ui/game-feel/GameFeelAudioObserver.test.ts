import { describe, expect, it } from 'vitest'
import { getGameFeelSound } from './GameFeelAudioObserver'

describe('Game Feel audio semantics', () => {
  it('keeps generic item gains and routine craft visuals silent', () => {
    expect(getGameFeelSound({ type: 'item-gain' })).toBeNull()
    expect(getGameFeelSound({ type: 'craft-complete' })).toBeNull()
    expect(getGameFeelSound({ type: 'craft-complete', sound: false })).toBeNull()
  })

  it('allows exactly the successful Equipment craft event to request one craft cue', () => {
    expect(getGameFeelSound({ type: 'craft-complete', sound: 'craft' })).toBe('craft')
  })

  it('retains dedicated semantic sounds for non-transmutation feedback', () => {
    expect(getGameFeelSound({ type: 'success' })).toBe('success')
    expect(getGameFeelSound({ type: 'equip' })).toBe('equip')
  })
})
