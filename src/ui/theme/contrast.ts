const hex = (value: string) => {
  const normalized = value.replace('#', '').trim()
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null
  return [0, 2, 4].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16) / 255)
}

const luminance = (color: string) => {
  const rgb = hex(color)
  if (!rgb) return null
  return rgb.reduce((sum, channel, index) => { const linear = channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4; return sum + linear * [0.2126, 0.7152, 0.0722][index] }, 0)
}

export const contrastRatio = (foreground: string, background: string) => {
  const foregroundLuma = luminance(foreground)
  const backgroundLuma = luminance(background)
  if (foregroundLuma === null || backgroundLuma === null) return 0
  const light = Math.max(foregroundLuma, backgroundLuma)
  const dark = Math.min(foregroundLuma, backgroundLuma)
  return (light + 0.05) / (dark + 0.05)
}

export const assessThemeContrast = (colors: { background: string; panel: string; text: string; muted: string }) => ({ primaryBackground: contrastRatio(colors.text, colors.background), primaryPanel: contrastRatio(colors.text, colors.panel), mutedPanel: contrastRatio(colors.muted, colors.panel) })
export const hasReadableContrast = (colors: { background: string; panel: string; text: string; muted: string }) => { const result = assessThemeContrast(colors); return result.primaryBackground >= 4.5 && result.primaryPanel >= 4.5 && result.mutedPanel >= 3 }
