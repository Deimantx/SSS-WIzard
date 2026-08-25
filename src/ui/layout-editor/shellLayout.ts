import type { TopbarLayout, TopbarRegionId } from './layoutEditorTypes'

export const TOPBAR_REGION_IDS: readonly TopbarRegionId[] = ['topbar-breadcrumb', 'topbar-health', 'topbar-mana', 'topbar-focus', 'topbar-utilities']
export const TOPBAR_RESOURCE_IDS: readonly TopbarRegionId[] = ['topbar-health', 'topbar-mana', 'topbar-focus']

export const TOPBAR_WIDTH_LIMITS: Record<TopbarRegionId, { min: number; max: number }> = {
  'topbar-breadcrumb': { min: 120, max: 320 },
  'topbar-health': { min: 130, max: 280 },
  'topbar-mana': { min: 300, max: 900 },
  'topbar-focus': { min: 150, max: 320 },
  'topbar-utilities': { min: 0, max: 420 },
}

const orderWithResources = (order: readonly TopbarRegionId[]) => {
  const resources = TOPBAR_RESOURCE_IDS.filter((id) => order.includes(id))
  return ['topbar-breadcrumb', ...resources, 'topbar-utilities'] as TopbarRegionId[]
}

export const DEFAULT_TOPBAR_LAYOUT: TopbarLayout = {
  order: ['topbar-breadcrumb', 'topbar-health', 'topbar-mana', 'topbar-focus', 'topbar-utilities'],
  widths: { 'topbar-breadcrumb': 180, 'topbar-health': 160, 'topbar-mana': 600, 'topbar-focus': 190, 'topbar-utilities': 0 },
}

export const TOPBAR_PRESETS: Record<'mana-focused' | 'balanced' | 'compact', TopbarLayout> = {
  'mana-focused': { order: [...DEFAULT_TOPBAR_LAYOUT.order], widths: { ...DEFAULT_TOPBAR_LAYOUT.widths } },
  balanced: { order: [...DEFAULT_TOPBAR_LAYOUT.order], widths: { ...DEFAULT_TOPBAR_LAYOUT.widths, 'topbar-health': 190, 'topbar-mana': 420, 'topbar-focus': 220 } },
  compact: { order: [...DEFAULT_TOPBAR_LAYOUT.order], widths: { ...DEFAULT_TOPBAR_LAYOUT.widths, 'topbar-breadcrumb': 150, 'topbar-health': 140, 'topbar-mana': 340, 'topbar-focus': 160 } },
}

export function clampTopbarLayout(value: Partial<TopbarLayout> | null | undefined): TopbarLayout {
  const sourceWidths: Partial<Record<TopbarRegionId, number>> = value?.widths ?? {}
  const widths = Object.fromEntries(TOPBAR_REGION_IDS.map((id) => {
    const limit = TOPBAR_WIDTH_LIMITS[id]
    const raw = typeof sourceWidths[id] === 'number' && Number.isFinite(sourceWidths[id]) ? sourceWidths[id] : DEFAULT_TOPBAR_LAYOUT.widths[id]
    return [id, Math.max(limit.min, Math.min(limit.max, Math.round(raw)))]
  })) as TopbarLayout['widths']
  widths['topbar-utilities'] = 0
  const order = orderWithResources(value?.order ?? DEFAULT_TOPBAR_LAYOUT.order)
  return { order, widths }
}

export function topbarLayoutPresetName(layout: TopbarLayout): 'mana-focused' | 'balanced' | 'compact' | 'custom' {
  for (const [name, preset] of Object.entries(TOPBAR_PRESETS) as ['mana-focused' | 'balanced' | 'compact', TopbarLayout][]) {
    if (TOPBAR_REGION_IDS.every((id) => layout.widths[id] === preset.widths[id]) && layout.order.join('|') === preset.order.join('|')) return name
  }
  return 'custom'
}

export function moveTopbarResource(layout: TopbarLayout, regionId: TopbarRegionId, direction: -1 | 1): TopbarLayout {
  if (!TOPBAR_RESOURCE_IDS.includes(regionId)) return clampTopbarLayout(layout)
  const resources = TOPBAR_RESOURCE_IDS.filter((id) => layout.order.includes(id))
  const index = resources.indexOf(regionId)
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= resources.length) return clampTopbarLayout(layout)
  const nextResources = [...resources]
  nextResources.splice(index, 1)
  nextResources.splice(nextIndex, 0, regionId)
  return clampTopbarLayout({ ...layout, order: ['topbar-breadcrumb', ...nextResources, 'topbar-utilities'] })
}
