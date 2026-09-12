import type { ReactNode } from 'react'
import type { ScreenId } from '../../game/types'

export interface ScreenGridPanel {
  id: string
  content: ReactNode
}

/**
 * Static production layout for screen panels. Geometry belongs to CSS; this
 * component intentionally has no editing, persistence, measurement, or
 * runtime layout state.
 */
export function ScreenGrid({ screen, panels }: { screen: ScreenId; panels: ScreenGridPanel[] }) {
  return (
    <div className={`screen-grid screen-grid-${screen}`}>
      {panels.map(({ id, content }) => (
        <div
          className={[
            'screen-grid-panel',
            `screen-grid-${screen}-panel-${id}`,
            `screen-grid-panel-${id}`,
          ].join(' ')}
          key={id}
        >
          <div className="screen-grid-panel-content">{content}</div>
        </div>
      ))}
    </div>
  )
}
