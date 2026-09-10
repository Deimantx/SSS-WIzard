import type { DungeonId } from '../../../game/types'
import type { WorldRegionSlot } from '../combatNavigationTypes'

export const REGION_ATLAS_STAGE = { width: 1000, height: 460 } as const
export const WORLD_ATLAS_STAGE = { width: 1000, height: 620 } as const

export const REGION_WAYPOINT_LAYOUT: Record<DungeonId, { x: number; y: number }> = {
  'whispering-woods': { x: 180, y: 145 },
  'howling-den': { x: 500, y: 260 },
  'abandoned-catacombs': { x: 820, y: 145 },
}

export const WORLD_REGION_SLOT_LAYOUT: Record<WorldRegionSlot, { x: number; y: number }> = {
  north: { x: 500, y: 115 },
  west: { x: 185, y: 310 },
  center: { x: 500, y: 310 },
  east: { x: 815, y: 310 },
  south: { x: 500, y: 505 },
}

export const WORLD_REGION_PLATE_BOUNDS = { width: 260, height: 142 } as const

const REGION_WAYPOINT_BOUNDS = { width: 240, height: 132 } as const
const MIN_LAYOUT_GAP = 24

interface AtlasRectangle {
  id: string
  left: number
  right: number
  top: number
  bottom: number
}

const getRectangles = (layout: Record<string, { x: number; y: number }>, size: { width: number; height: number }): AtlasRectangle[] => Object.entries(layout).map(([id, position]) => ({
  id,
  left: position.x - size.width / 2,
  right: position.x + size.width / 2,
  top: position.y - size.height / 2,
  bottom: position.y + size.height / 2,
}))

const validateAtlasLayout = (name: string, layout: Record<string, { x: number; y: number }>, size: { width: number; height: number }, stage: { width: number; height: number }) => {
  const rectangles = getRectangles(layout, size)
  const issues: string[] = []
  for (const rectangle of rectangles) {
    if (rectangle.left < MIN_LAYOUT_GAP || rectangle.right > stage.width - MIN_LAYOUT_GAP || rectangle.top < MIN_LAYOUT_GAP || rectangle.bottom > stage.height - MIN_LAYOUT_GAP) {
      issues.push(`${rectangle.id} is outside the safe ${name} stage bounds`)
    }
  }
  for (let firstIndex = 0; firstIndex < rectangles.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < rectangles.length; secondIndex += 1) {
      const first = rectangles[firstIndex]
      const second = rectangles[secondIndex]
      const horizontalOverlap = first.left < second.right + MIN_LAYOUT_GAP && first.right + MIN_LAYOUT_GAP > second.left
      const verticalOverlap = first.top < second.bottom + MIN_LAYOUT_GAP && first.bottom + MIN_LAYOUT_GAP > second.top
      if (horizontalOverlap && verticalOverlap) issues.push(`${first.id} overlaps ${second.id}`)
    }
  }
  return issues
}

if (import.meta.env.DEV) {
  const issues = [
    ...validateAtlasLayout('Region', REGION_WAYPOINT_LAYOUT, REGION_WAYPOINT_BOUNDS, REGION_ATLAS_STAGE),
    ...validateAtlasLayout('World', WORLD_REGION_SLOT_LAYOUT, WORLD_REGION_PLATE_BOUNDS, WORLD_ATLAS_STAGE),
  ]
  if (issues.length > 0) console.warn(`[combat-navigation] Atlas layout: ${issues.join('; ')}`)
}
