export type DeveloperToolsMode = 'workspace' | 'docked'

export interface DeveloperToolsViewport { width: number; height: number }

export interface DeveloperToolsGeometry {
  mode: DeveloperToolsMode
  dockedX: number
  dockedY: number
  dockedWidth: number
  dockedHeight: number
}

export const DEVELOPER_TOOLS_GEOMETRY_KEY = 'sss-wizard-devtools-window-v3'
export const DEVELOPER_TOOLS_LEGACY_GEOMETRY_KEY = 'sss-wizard-devtools-window-v2'
export const DEVELOPER_TOOLS_MIN_WIDTH = 560
export const DEVELOPER_TOOLS_MIN_HEIGHT = 440

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const viewportOf = (): DeveloperToolsViewport => ({ width: typeof window === 'undefined' ? 1280 : window.innerWidth, height: typeof window === 'undefined' ? 800 : window.innerHeight })

export const getDefaultDeveloperGeometry = (viewport: DeveloperToolsViewport = viewportOf()): DeveloperToolsGeometry => {
  const dockedWidth = Math.min(640, Math.max(300, viewport.width - 24))
  const dockedHeight = Math.min(560, Math.max(300, viewport.height - 24))
  return {
    mode: 'workspace',
    dockedX: Math.max(12, viewport.width - dockedWidth - 18),
    dockedY: 18,
    dockedWidth,
    dockedHeight,
  }
}

export const getDefaultDeveloperToolsGeometry = getDefaultDeveloperGeometry

const readMode = (value: unknown, fallback: DeveloperToolsMode): DeveloperToolsMode => value === 'docked' || value === 'workspace' ? value : fallback

export const sanitizeDeveloperToolsGeometry = (value: unknown, viewport: DeveloperToolsViewport = viewportOf()): DeveloperToolsGeometry => {
  const fallback = getDefaultDeveloperGeometry(viewport)
  if (!value || typeof value !== 'object') return fallback
  const candidate = value as Partial<DeveloperToolsGeometry> & { x?: unknown; y?: unknown; width?: unknown; height?: unknown; minimized?: unknown }
  const legacy = finite(candidate.x) || finite(candidate.y) || finite(candidate.width) || finite(candidate.height)
  const legacyMode = candidate.minimized === true ? 'docked' : fallback.mode
  return clampDeveloperToolsGeometry({
    mode: readMode(candidate.mode, legacy ? legacyMode : fallback.mode),
    dockedX: finite(candidate.dockedX) ? candidate.dockedX : finite(candidate.x) ? candidate.x : fallback.dockedX,
    dockedY: finite(candidate.dockedY) ? candidate.dockedY : finite(candidate.y) ? candidate.y : fallback.dockedY,
    dockedWidth: finite(candidate.dockedWidth) ? candidate.dockedWidth : finite(candidate.width) ? candidate.width : fallback.dockedWidth,
    dockedHeight: finite(candidate.dockedHeight) ? candidate.dockedHeight : finite(candidate.height) ? candidate.height : fallback.dockedHeight,
  }, viewport)
}

export const clampDeveloperToolsGeometry = (geometry: DeveloperToolsGeometry, viewport: DeveloperToolsViewport = viewportOf()): DeveloperToolsGeometry => {
  const minWidth = Math.min(DEVELOPER_TOOLS_MIN_WIDTH, Math.max(300, viewport.width - 24))
  const minHeight = Math.min(DEVELOPER_TOOLS_MIN_HEIGHT, Math.max(300, viewport.height - 24))
  const maxWidth = Math.max(minWidth, viewport.width - 24)
  const maxHeight = Math.max(minHeight, viewport.height - 24)
  const dockedWidth = Math.max(minWidth, Math.min(maxWidth, geometry.dockedWidth))
  const dockedHeight = Math.max(minHeight, Math.min(maxHeight, geometry.dockedHeight))
  return {
    mode: geometry.mode === 'docked' ? 'docked' : 'workspace',
    dockedWidth,
    dockedHeight,
    dockedX: Math.max(12, Math.min(Math.max(12, viewport.width - dockedWidth - 12), geometry.dockedX)),
    dockedY: Math.max(12, Math.min(Math.max(12, viewport.height - dockedHeight - 12), geometry.dockedY)),
  }
}

export const loadDeveloperToolsGeometry = (): DeveloperToolsGeometry => {
  if (typeof localStorage === 'undefined') return getDefaultDeveloperGeometry()
  try {
    const saved = localStorage.getItem(DEVELOPER_TOOLS_GEOMETRY_KEY)
    if (saved) return sanitizeDeveloperToolsGeometry(JSON.parse(saved))
    // V2's expanded x/y/width/height are useful docked geometry. The old
    // minimized flag is only used to choose docked mode; its compact position is discarded.
    const legacy = localStorage.getItem(DEVELOPER_TOOLS_LEGACY_GEOMETRY_KEY)
    return legacy ? sanitizeDeveloperToolsGeometry(JSON.parse(legacy)) : getDefaultDeveloperGeometry()
  } catch {
    return getDefaultDeveloperGeometry()
  }
}

export const saveDeveloperToolsGeometry = (geometry: DeveloperToolsGeometry) => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(DEVELOPER_TOOLS_GEOMETRY_KEY, JSON.stringify({ mode: geometry.mode, dockedX: geometry.dockedX, dockedY: geometry.dockedY, dockedWidth: geometry.dockedWidth, dockedHeight: geometry.dockedHeight }))
  } catch { /* Storage is optional. */ }
}
