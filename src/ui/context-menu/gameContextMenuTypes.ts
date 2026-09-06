import type { LucideIcon } from 'lucide-react'

export type GameContextMenuTone = 'normal' | 'accent' | 'warning' | 'danger'
export interface GameContextMenuAction { id: string; label: string; icon?: LucideIcon; disabled?: boolean; disabledReason?: string; tone?: GameContextMenuTone; onSelect: () => void }
export interface GameContextMenuSection { id: string; actions: GameContextMenuAction[] }
export interface GameContextMenuHeader { title: string; meta?: string; icon?: React.ReactNode }
export interface GameContextMenuOpenOptions { header?: GameContextMenuHeader; sections: GameContextMenuSection[]; anchor?: HTMLElement; x?: number; y?: number }
