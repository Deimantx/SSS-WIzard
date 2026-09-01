export interface DeveloperToolsViewport { width: number; height: number }
export interface DeveloperToolsGeometry { x: number; y: number; width: number; height: number; minimized: boolean }

export const DEVELOPER_TOOLS_GEOMETRY_KEY = 'sss-wizard-devtools-window-v2'
export const DEVELOPER_TOOLS_MIN_WIDTH = 520
export const DEVELOPER_TOOLS_MIN_HEIGHT = 380

const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
const viewportOf = (): DeveloperToolsViewport => ({ width: typeof window === 'undefined' ? 1280 : window.innerWidth, height: typeof window === 'undefined' ? 800 : window.innerHeight })

export const getDefaultDeveloperGeometry = (viewport: DeveloperToolsViewport = viewportOf()): DeveloperToolsGeometry => {
  const width = Math.min(1050, Math.max(260, viewport.width - 24))
  const height = Math.min(720, Math.max(220, viewport.height - 24))
  return { x: Math.max(12, Math.min(80, viewport.width - width - 12)), y: Math.max(12, Math.min(80, viewport.height - height - 12)), width, height, minimized: false }
}
export const getDefaultDeveloperToolsGeometry = getDefaultDeveloperGeometry

export const sanitizeDeveloperToolsGeometry = (value: unknown, viewport: DeveloperToolsViewport = viewportOf()): DeveloperToolsGeometry => {
  const fallback = getDefaultDeveloperGeometry(viewport)
  if (!value || typeof value !== 'object') return fallback
  const candidate = value as Partial<DeveloperToolsGeometry>
  return clampDeveloperToolsGeometry({
    x: finite(candidate.x) ? candidate.x! : fallback.x,
    y: finite(candidate.y) ? candidate.y! : fallback.y,
    width: finite(candidate.width) ? candidate.width! : fallback.width,
    height: finite(candidate.height) ? candidate.height! : fallback.height,
    minimized: typeof candidate.minimized === 'boolean' ? candidate.minimized : fallback.minimized,
  }, viewport)
}

export const clampDeveloperToolsGeometry = (geometry: DeveloperToolsGeometry, viewport: DeveloperToolsViewport = viewportOf()): DeveloperToolsGeometry => {
  const minWidth = Math.min(DEVELOPER_TOOLS_MIN_WIDTH, Math.max(260, viewport.width - 24))
  const minHeight = Math.min(DEVELOPER_TOOLS_MIN_HEIGHT, Math.max(220, viewport.height - 24))
  const width = Math.max(minWidth, Math.min(Math.max(minWidth, viewport.width - 24), geometry.width))
  const height = Math.max(minHeight, Math.min(Math.max(minHeight, viewport.height - 24), geometry.height))
  return {
    ...geometry,
    width,
    height,
    x: Math.max(12, Math.min(Math.max(12, viewport.width - width - 12), geometry.x)),
    y: Math.max(12, Math.min(Math.max(12, viewport.height - height - 12), geometry.y)),
  }
}

export const loadDeveloperToolsGeometry = (): DeveloperToolsGeometry => {
  if (typeof localStorage === 'undefined') return getDefaultDeveloperGeometry()
  try { return sanitizeDeveloperToolsGeometry(JSON.parse(localStorage.getItem(DEVELOPER_TOOLS_GEOMETRY_KEY) ?? 'null')) }
  catch { return getDefaultDeveloperGeometry() }
}

export const saveDeveloperToolsGeometry = (geometry: DeveloperToolsGeometry) => {
  if (typeof localStorage === 'undefined') return
  try { localStorage.setItem(DEVELOPER_TOOLS_GEOMETRY_KEY, JSON.stringify({ x: geometry.x, y: geometry.y, width: geometry.width, height: geometry.height, minimized: geometry.minimized })) } catch { /* Storage is optional. */ }
}
