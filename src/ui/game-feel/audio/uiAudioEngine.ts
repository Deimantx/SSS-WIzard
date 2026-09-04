import { getUiPreferences } from '../../preferences/uiPreferencesStore'

export type UiSoundName = 'hover' | 'click' | 'confirm' | 'error' | 'success' | 'item-gain' | 'equip' | 'focus' | 'craft' | 'unlock' | 'loot' | 'loot-discovery'

type SoundVoice = { frequency: number; duration: number; gain: number; type: OscillatorType; delay?: number }

const SOUND_VOICES: Record<UiSoundName, readonly SoundVoice[]> = {
  hover: [{ frequency: 520, duration: 0.045, gain: 0.045, type: 'sine' }],
  click: [{ frequency: 190, duration: 0.055, gain: 0.08, type: 'triangle' }],
  confirm: [{ frequency: 310, duration: 0.07, gain: 0.1, type: 'triangle' }, { frequency: 465, duration: 0.11, gain: 0.08, type: 'sine', delay: 0.035 }],
  error: [{ frequency: 180, duration: 0.11, gain: 0.1, type: 'sawtooth' }, { frequency: 135, duration: 0.14, gain: 0.07, type: 'triangle', delay: 0.05 }],
  success: [{ frequency: 360, duration: 0.09, gain: 0.09, type: 'sine' }, { frequency: 540, duration: 0.15, gain: 0.1, type: 'sine', delay: 0.06 }],
  'item-gain': [{ frequency: 430, duration: 0.08, gain: 0.075, type: 'sine' }, { frequency: 650, duration: 0.12, gain: 0.065, type: 'sine', delay: 0.05 }],
  equip: [{ frequency: 235, duration: 0.08, gain: 0.085, type: 'triangle' }, { frequency: 470, duration: 0.16, gain: 0.08, type: 'sine', delay: 0.055 }],
  focus: [{ frequency: 300, duration: 0.13, gain: 0.08, type: 'sine' }, { frequency: 390, duration: 0.16, gain: 0.065, type: 'sine', delay: 0.08 }],
  craft: [{ frequency: 390, duration: 0.09, gain: 0.085, type: 'triangle' }, { frequency: 585, duration: 0.15, gain: 0.1, type: 'sine', delay: 0.055 }],
  unlock: [{ frequency: 410, duration: 0.12, gain: 0.09, type: 'sine' }, { frequency: 615, duration: 0.16, gain: 0.09, type: 'sine', delay: 0.07 }, { frequency: 820, duration: 0.2, gain: 0.075, type: 'sine', delay: 0.15 }],
  loot: [{ frequency: 470, duration: 0.07, gain: 0.065, type: 'sine' }, { frequency: 700, duration: 0.1, gain: 0.045, type: 'sine', delay: 0.04 }],
  'loot-discovery': [{ frequency: 470, duration: 0.08, gain: 0.075, type: 'sine' }, { frequency: 700, duration: 0.12, gain: 0.07, type: 'sine', delay: 0.045 }, { frequency: 940, duration: 0.16, gain: 0.055, type: 'sine', delay: 0.11 }],
}

let context: AudioContext | null = null
let masterGain: GainNode | null = null
let audioUnsupported = false

export const normalizeUiSoundVolume = (volume: number) => Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0

const getContextConstructor = () => {
  if (typeof window === 'undefined') return null
  return window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? null
}

export const isUiAudioAvailable = () => {
  if (audioUnsupported) return false
  const available = Boolean(getContextConstructor())
  if (!available) audioUnsupported = true
  return available
}

export const getUiAudioContext = () => {
  if (context) return context
  if (audioUnsupported) return null
  const Context = getContextConstructor()
  if (!Context) { audioUnsupported = true; return null }
  try {
    context = new Context()
    masterGain = context.createGain()
    masterGain.gain.value = 0
    masterGain.connect(context.destination)
    return context
  } catch {
    audioUnsupported = true
    context = null
    masterGain = null
    return null
  }
}

export const unlockUiAudio = () => {
  if (typeof document === 'undefined' || document.hidden) return false
  const preferences = getUiPreferences()
  if (!preferences.uiSounds || normalizeUiSoundVolume(preferences.uiSoundVolume) <= 0) return false
  const audio = getUiAudioContext()
  if (!audio) return false
  if (audio.state === 'suspended') void audio.resume().catch(() => undefined)
  return true
}

export const playUiSound = (name: UiSoundName) => {
  if (typeof document === 'undefined' || document.hidden) return false
  const preferences = getUiPreferences()
  const volume = normalizeUiSoundVolume(preferences.uiSoundVolume)
  if (!preferences.uiSounds || volume <= 0) return false
  const audio = getUiAudioContext()
  const destination = masterGain
  if (!audio || !destination) return false
  if (audio.state === 'suspended') void audio.resume().catch(() => undefined)
  const now = audio.currentTime
  destination.gain.cancelScheduledValues(now)
  destination.gain.setValueAtTime(volume * 0.42, now)
  destination.gain.linearRampToValueAtTime(0, now + 0.42)
  SOUND_VOICES[name].forEach((voice) => {
    const start = now + (voice.delay ?? 0)
    const end = start + voice.duration
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = voice.type
    oscillator.frequency.setValueAtTime(voice.frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.linearRampToValueAtTime(voice.gain, start + Math.min(0.018, voice.duration * 0.25))
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    oscillator.connect(gain)
    gain.connect(destination)
    oscillator.addEventListener('ended', () => { oscillator.disconnect(); gain.disconnect() }, { once: true })
    oscillator.start(start)
    oscillator.stop(end + 0.01)
  })
  return true
}

export const resetUiAudioForTests = () => {
  if (context) void context.close().catch(() => undefined)
  context = null
  masterGain = null
  audioUnsupported = false
}
