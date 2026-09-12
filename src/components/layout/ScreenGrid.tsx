import type { CSSProperties, ReactNode } from 'react'
import type { ScreenId } from '../../game/types'
import {
  getPanelLayout,
  getScreenLayout,
  type ResponsiveScreenLayout,
  type ScreenLayoutDefinition,
  type ScreenLayoutSize,
  type ScreenPanelLayout,
} from '../../ui/layout/screenPanelLayouts'

export interface ScreenGridPanel {
  id: string
  content: ReactNode
}

const warnedMissingLayouts = new Set<string>()

function warnMissingLayout(screen: ScreenId, panelId: string) {
  if (!import.meta.env.DEV) return

  const key = `${screen}:${panelId}`
  if (warnedMissingLayouts.has(key)) return

  warnedMissingLayouts.add(key)
  console.warn(`[ScreenGrid] Missing panel layout for screen="${screen}" panel="${panelId}". Using a safe full-width fallback.`)
}

function cssSize(value: ScreenLayoutSize | number | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined
  return typeof value === 'number' ? `${value}px` : value
}

function gridRow(layout: ScreenPanelLayout): string | undefined {
  if (layout.rowStart === undefined) {
    return layout.rowSpan === undefined ? undefined : `auto / span ${layout.rowSpan}`
  }

  if (layout.rowStart === 'auto') return layout.rowSpan === undefined ? 'auto' : `auto / span ${layout.rowSpan}`
  return `${layout.rowStart} / span ${layout.rowSpan ?? 1}`
}

function getScreenStyle(layout: ScreenLayoutDefinition): CSSProperties {
  return {
    gridTemplateColumns: `repeat(${layout.screen.columns}, minmax(0, 1fr))`,
    columnGap: `${layout.screen.columnGap}px`,
    rowGap: `${layout.screen.rowGap}px`,
    minWidth: cssSize(layout.screen.minWidth),
    maxWidth: cssSize(layout.screen.maxWidth),
    alignItems: layout.screen.alignItems,
  }
}

function getPanelStyle(layout: ScreenPanelLayout): CSSProperties {
  return {
    order: layout.order,
    gridColumn: `${layout.columnStart} / span ${layout.columnSpan}`,
    gridRow: gridRow(layout),
    minWidth: cssSize(layout.minWidth),
    width: cssSize(layout.preferredWidth),
    maxWidth: cssSize(layout.maxWidth),
    minHeight: cssSize(layout.minHeight),
    height: cssSize(layout.preferredHeight),
    maxHeight: cssSize(layout.maxHeight),
    alignSelf: layout.alignSelf,
    justifySelf: layout.justifySelf,
    overflow: layout.overflow,
  }
}

function important(value: string | number): string {
  return `${value} !important`
}

function responsiveScreenDeclarations(responsive: ResponsiveScreenLayout): string {
  const declarations: string[] = []
  if (responsive.columns !== undefined) declarations.push(`grid-template-columns:${important(`repeat(${responsive.columns}, minmax(0, 1fr))`)}`)
  if (responsive.columnGap !== undefined) declarations.push(`column-gap:${important(`${responsive.columnGap}px`)}`)
  if (responsive.rowGap !== undefined) declarations.push(`row-gap:${important(`${responsive.rowGap}px`)}`)
  if (responsive.minWidth !== undefined) declarations.push(`min-width:${important(cssSize(responsive.minWidth) ?? '0px')}`)
  if (responsive.maxWidthOverride !== undefined) declarations.push(`max-width:${important(cssSize(responsive.maxWidthOverride) ?? 'none')}`)
  if (responsive.alignItems !== undefined) declarations.push(`align-items:${important(responsive.alignItems)}`)
  return declarations.join('')
}

function responsivePanelDeclarations(layout: ScreenPanelLayout): string {
  return [
    `order:${important(layout.order)}`,
    `grid-column:${important(`${layout.columnStart} / span ${layout.columnSpan}`)}`,
    `grid-row:${important(gridRow(layout) ?? 'auto')}`,
    `min-width:${important(cssSize(layout.minWidth) ?? '0px')}`,
    `width:${important(cssSize(layout.preferredWidth) ?? 'auto')}`,
    `max-width:${important(cssSize(layout.maxWidth) ?? 'none')}`,
    `min-height:${important(cssSize(layout.minHeight) ?? '0px')}`,
    `height:${important(cssSize(layout.preferredHeight) ?? 'auto')}`,
    `max-height:${important(cssSize(layout.maxHeight) ?? 'none')}`,
    `align-self:${important(layout.alignSelf ?? 'stretch')}`,
    `justify-self:${important(layout.justifySelf ?? 'stretch')}`,
    `overflow:${important(layout.overflow ?? 'visible')}`,
  ].join('')
}

function getResponsiveCss(screen: ScreenId, layout: ScreenLayoutDefinition, panels: ScreenGridPanel[]): string {
  if (!layout.responsive) return ''

  return Object.values(layout.responsive).filter(Boolean).map((responsive) => {
    if (!responsive) return ''

    const screenSelector = `.screen-grid-${screen}`
    const screenDeclarations = responsiveScreenDeclarations(responsive)
    const rules = screenDeclarations ? `${screenSelector}{${screenDeclarations}}` : ''
    const panelRules = panels.map(({ id }, index) => {
      const basePanel = getPanelLayout(screen, id, index + 1)
      const responsivePanel = responsive.panels[id]
      const mergedPanel = responsivePanel ? { ...basePanel, ...responsivePanel } : basePanel
      return `.screen-grid-${screen}-panel-${id}{${responsivePanelDeclarations(mergedPanel)}}`
    }).join('')

    return `@media (max-width: ${responsive.maxWidth}px){${rules}${panelRules}}`
  }).join('')
}

/**
 * Production screen layout renderer. Outer panel geometry is sourced from
 * screenPanelLayouts.ts; this component intentionally has no editing,
 * persistence, measurement, or runtime layout state.
 */
export function ScreenGrid({ screen, panels }: { screen: ScreenId; panels: ScreenGridPanel[] }) {
  const screenLayout = getScreenLayout(screen)
  const responsiveCss = getResponsiveCss(screen, screenLayout, panels)

  return (
    <>
      <div className={`screen-grid screen-grid-${screen}`} style={getScreenStyle(screenLayout)}>
        {panels.map(({ id, content }, index) => {
          if (!screenLayout.panels[id]) warnMissingLayout(screen, id)
          const panelLayout = getPanelLayout(screen, id, index + 1)

          return (
            <div
              className={[
                'screen-grid-panel',
                `screen-grid-${screen}-panel-${id}`,
                `screen-grid-panel-${id}`,
              ].join(' ')}
              key={id}
              style={getPanelStyle(panelLayout)}
            >
              <div className="screen-grid-panel-content">{content}</div>
            </div>
          )
        })}
      </div>
      {responsiveCss && <style data-screen-grid-responsive={screen}>{responsiveCss}</style>}
    </>
  )
}
