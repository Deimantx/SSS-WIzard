import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useGameStore } from '../../store/gameStore'
import { dismissGameTooltips } from '../../components/ui/tooltip/Tooltip'
import { GameContextMenu } from './GameContextMenu'
import type { GameContextMenuOpenOptions } from './gameContextMenuTypes'

type ContextValue = { openContextMenu: (options: GameContextMenuOpenOptions) => void; closeContextMenu: () => void }
const Context = createContext<ContextValue | null>(null)
export function GameContextMenuProvider({ children }: { children: ReactNode }) {
  const screen = useGameStore((state) => state.ui.screen)
  const [menu, setMenu] = useState<(GameContextMenuOpenOptions & { x: number; y: number }) | null>(null)
  const closeContextMenu = () => setMenu(null)
  const openContextMenu = (options: GameContextMenuOpenOptions) => {
    dismissGameTooltips()
    const rect = options.anchor?.getBoundingClientRect()
    setMenu({ ...options, x: options.x ?? rect?.left ?? 8, y: options.y ?? rect?.bottom ?? 8 })
  }
  useEffect(() => { closeContextMenu() }, [screen])
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') closeContextMenu() }
    const outside = (event: MouseEvent) => { if (menu && !(event.target as Element | null)?.closest('.game-context-menu')) closeContextMenu() }
    const close = () => closeContextMenu()
    window.addEventListener('keydown', escape); window.addEventListener('mousedown', outside); window.addEventListener('resize', close); window.addEventListener('scroll', close, true)
    return () => { window.removeEventListener('keydown', escape); window.removeEventListener('mousedown', outside); window.removeEventListener('resize', close); window.removeEventListener('scroll', close, true) }
  }, [menu])
  const value = useMemo(() => ({ openContextMenu, closeContextMenu }), [])
  return <Context.Provider value={value}>{children}{menu && <GameContextMenu {...menu} onClose={closeContextMenu} />}</Context.Provider>
}
export const useGameContextMenu = () => useContext(Context) ?? { openContextMenu: () => undefined, closeContextMenu: () => undefined }
