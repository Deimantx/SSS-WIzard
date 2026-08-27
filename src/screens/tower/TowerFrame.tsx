import type { ReactNode } from 'react'

export function TowerFrame({ eyebrow, title, description, className = '', children }: { eyebrow: string; title: string; description: string; className?: string; children: ReactNode }) {
  return <div className={`screen-content ${className}`.trim()}><div className="screen-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div></div>{children}</div>
}
