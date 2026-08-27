import type { Layout } from 'react-grid-layout'

export interface ChannelingExpandedState {
  manaCore: boolean
  echoes: boolean
}

export const CHANNELING_EXPANDED_HEIGHTS = {
  manaCore: 7,
  echoes: 5,
} as const

/**
 * Expands the rendered Channeling panels without changing the saved editor
 * layout. The lower panel follows the tallest expanded panel so it cannot be
 * covered by the additional breakdown content.
 */
export function getChannelingExpandedLayout(layout: Layout, expanded: ChannelingExpandedState): Layout {
  const next = layout.map((item) => ({ ...item }))
  const manaCore = next.find((item) => item.i === 'channeling-mana-core')
  const echoes = next.find((item) => item.i === 'channeling-echoes')
  const pillars = next.find((item) => item.i === 'channeling-pillars')

  if (manaCore && expanded.manaCore) manaCore.h += CHANNELING_EXPANDED_HEIGHTS.manaCore
  if (echoes && expanded.echoes) echoes.h += CHANNELING_EXPANDED_HEIGHTS.echoes

  if (pillars) {
    const topPanelBottom = Math.max(
      manaCore ? manaCore.y + manaCore.h : pillars.y,
      echoes ? echoes.y + echoes.h : pillars.y,
    )
    if (pillars.y < topPanelBottom) pillars.y = topPanelBottom
  }

  return next
}
