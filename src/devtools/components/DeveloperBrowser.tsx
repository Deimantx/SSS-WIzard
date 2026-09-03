import type { ReactNode } from 'react'
import { GameTooltip } from '../../components/ui'

export interface DeveloperBrowserItem {
  id: string
  label: string
  icon?: ReactNode
  meta?: ReactNode
  status?: ReactNode
  accent?: string
}

export function DeveloperBrowser<T extends DeveloperBrowserItem>({ items, selectedId, onSelect, emptyMessage = 'No matching entries.' }: { items: readonly T[]; selectedId: string | null; onSelect: (id: string) => void; emptyMessage?: string }) {
  return <div className="developer-browser-list" role="listbox" aria-label="Developer content browser">
    {items.length === 0 ? <div className="developer-browser-empty">{emptyMessage}</div> : items.map((item) => {
      const row = <button type="button" role="option" aria-selected={selectedId === item.id} className={`developer-browser-row${selectedId === item.id ? ' active' : ''}`} onClick={() => onSelect(item.id)}>
        {item.icon && <span className="developer-browser-icon" style={item.accent ? { color: item.accent } : undefined}>{item.icon}</span>}
        <span className="developer-browser-copy"><strong>{item.label}</strong>{item.meta && <small>{item.meta}</small>}</span>
        {item.status && <span className="developer-browser-status">{item.status}</span>}
      </button>
      return item.meta ? <GameTooltip key={item.id} block content={`${item.label} · Select to inspect`}>{row}</GameTooltip> : <span key={item.id}>{row}</span>
    })}
  </div>
}

export function DeveloperBrowserLayout({ browser, inspector }: { browser: ReactNode; inspector: ReactNode }) {
  return <div className="developer-browser-layout"><section className="developer-browser-panel">{browser}</section><section className="developer-inspector-panel">{inspector}</section></div>
}

export function DeveloperSection({ title, children }: { title: string; children: ReactNode }) {
  return <div className="developer-inspector-section"><h3>{title}</h3>{children}</div>
}

export function DeveloperAdvancedSection({ title = 'Advanced details', children }: { title?: string; children: ReactNode }) {
  return <details className="developer-advanced-section"><summary>{title}</summary><div>{children}</div></details>
}
