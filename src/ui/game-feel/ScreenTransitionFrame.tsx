import type { ReactNode } from 'react'

export function ScreenTransitionFrame({ screen, children }: { screen: string; children: ReactNode }) {
  return <div className="game-screen-transition" data-screen={screen} data-screen-entry="true">{children}</div>
}
