import type { ScreenId } from '../../game/types'
import type { ThemeColors } from '../theme/themeTypes'

export interface AmbientProfile {
  id: string
  accentColor: string
  secondaryColor: string
  intensity: number
  fogOpacity: number
  vignetteOpacity: number
  particleSpeed: number
  biasX: string
  biasY: string
  driftDuration: number
}

/** Presentation-only atmosphere tuning. It does not describe gameplay state or balance. */
export const getAmbientProfile = (screen: ScreenId, colors: ThemeColors): AmbientProfile => {
  const base = { accentColor: colors.accent, secondaryColor: colors.secondary, intensity: 0.82, fogOpacity: 0.28, vignetteOpacity: 0.28, particleSpeed: 0.8, biasX: '76%', biasY: '12%', driftDuration: 18 }
  if (screen === 'home') return { ...base, id: 'home-calm', intensity: 0.7, fogOpacity: 0.24, vignetteOpacity: 0.24, particleSpeed: 0.55, biasX: '72%', biasY: '14%', driftDuration: 24 }
  if (screen === 'combat') return { ...base, id: 'combat-tense', accentColor: colors.danger, secondaryColor: colors.warning, intensity: 1.08, fogOpacity: 0.36, vignetteOpacity: 0.4, particleSpeed: 1.15, biasX: '68%', biasY: '22%', driftDuration: 13 }
  if (screen === 'tower-transmutation') return { ...base, id: 'transmutation-bloom', intensity: 1.02, fogOpacity: 0.38, vignetteOpacity: 0.27, particleSpeed: 0.92, biasX: '52%', biasY: '43%', driftDuration: 17 }
  if (screen === 'tower-research') return { ...base, id: 'research-cool', secondaryColor: '#72bfff', intensity: 0.9, fogOpacity: 0.3, vignetteOpacity: 0.25, particleSpeed: 0.72, biasX: '65%', biasY: '18%', driftDuration: 21 }
  if (screen === 'tower-channeling') return { ...base, id: 'channeling-pulse', accentColor: '#55aef4', secondaryColor: colors.accent, intensity: 0.98, fogOpacity: 0.34, vignetteOpacity: 0.26, particleSpeed: 1, biasX: '58%', biasY: '37%', driftDuration: 15 }
  if (screen === 'tower-focus') return { ...base, id: 'focus-low-noise', accentColor: colors.secondary, secondaryColor: colors.accent, intensity: 0.76, fogOpacity: 0.25, vignetteOpacity: 0.25, particleSpeed: 0.62, biasX: '50%', biasY: '30%', driftDuration: 23 }
  if (screen === 'schools') return { ...base, id: 'schools-neutral', intensity: 0.84, fogOpacity: 0.29, vignetteOpacity: 0.25, particleSpeed: 0.76, biasX: '70%', biasY: '18%', driftDuration: 19 }
  if (screen === 'settings') return { ...base, id: 'system-quiet', intensity: 0.5, fogOpacity: 0.18, vignetteOpacity: 0.2, particleSpeed: 0.35, biasX: '82%', biasY: '8%', driftDuration: 28 }
  return { ...base, id: `screen-${screen}` }
}
