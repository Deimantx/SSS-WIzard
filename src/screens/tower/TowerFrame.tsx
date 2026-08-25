import type { ReactNode } from 'react'

export function TowerFrame({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <div className="screen-content"><div className="screen-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div></div>{children}</div>
}
