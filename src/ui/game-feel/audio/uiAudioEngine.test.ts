import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetAllUiPreferences, setUiPreferences } from '../../preferences/uiPreferencesStore'
import { isUiAudioAvailable, normalizeUiSoundVolume, playUiSound, resetUiAudioForTests, unlockUiAudio } from './uiAudioEngine'

describe('synthetic UI audio engine', () => {
  const originalAudioContext = window.AudioContext

  beforeEach(() => { resetAllUiPreferences(); resetUiAudioForTests() })
  afterEach(() => {
    resetUiAudioForTests()
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: originalAudioContext })
  })

  it('normalizes volume without allowing invalid output levels', () => {
    expect(normalizeUiSoundVolume(-1)).toBe(0)
    expect(normalizeUiSoundVolume(0.35)).toBe(0.35)
    expect(normalizeUiSoundVolume(3)).toBe(1)
    expect(normalizeUiSoundVolume(Number.NaN)).toBe(0)
  })

  it('is silent and safe when audio is unsupported, disabled, or muted', () => {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined })
    expect(isUiAudioAvailable()).toBe(false)
    expect(playUiSound('click')).toBe(false)
    setUiPreferences({ uiSounds: false })
    expect(unlockUiAudio()).toBe(false)
    setUiPreferences({ uiSounds: true, uiSoundVolume: 0 })
    expect(playUiSound('success')).toBe(false)
  })

  it('does not leak a rejected resume promise from a locked context', async () => {
    const param = () => ({ value: 0, setValueAtTime() {}, cancelScheduledValues() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} })
    class FakeAudioContext {
      state: AudioContextState = 'suspended'
      currentTime = 0
      destination = {}
      createGain() { return { gain: param(), connect() {}, disconnect() {} } }
      createOscillator() { return { type: 'sine' as OscillatorType, frequency: param(), connect() {}, disconnect() {}, addEventListener() {}, start() {}, stop() {} } }
      resume() { return Promise.reject(new Error('gesture required')) }
      close() { return Promise.resolve() }
    }
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext })
    expect(unlockUiAudio()).toBe(true)
    expect(playUiSound('click')).toBe(true)
    await Promise.resolve()
  })
})
