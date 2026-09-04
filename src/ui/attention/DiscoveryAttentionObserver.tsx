import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { markAttention } from './attentionStore'

export function DiscoveryAttentionObserver({ profileKey }: { profileKey: string | null }) {
  const discoveredItems = useGameStore((state) => state.progress.discoveredItems)
  const discoveredMonsters = useGameStore((state) => state.progress.discoveredMonsters)
  const previousProfile = useRef(profileKey)
  const previous = useRef<{ items: string[]; monsters: string[] } | null>(null)
  useEffect(() => {
    if (previousProfile.current !== profileKey) { previousProfile.current = profileKey; previous.current = null; return }
    const current = { items: [...discoveredItems], monsters: [...discoveredMonsters] }
    if (!previous.current) { previous.current = current; return }
    current.items.filter((id) => !previous.current!.items.includes(id)).forEach((id) => markAttention(profileKey, 'item', id))
    current.monsters.filter((id) => !previous.current!.monsters.includes(id)).forEach((id) => markAttention(profileKey, 'monster', id))
    previous.current = current
  }, [profileKey, discoveredItems, discoveredMonsters])
  return null
}
