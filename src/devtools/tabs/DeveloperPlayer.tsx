import { Button, Card } from '../../components/ui'
import { useGameStore } from '../../store/gameStore'
import { NumberField } from './DeveloperTabPrimitives'

export function DeveloperPlayer() {
  const player = useGameStore((state) => state.player)
  const setPlayer = useGameStore((state) => state.setPlayer)
  const update = (key: keyof typeof player, value: number) => setPlayer({ [key]: value } as Partial<typeof player>)
  return <div className="developer-tab-grid"><Card title="Player values"><div className="developer-form-grid"><NumberField label="Current HP" value={player.health} onChange={(value) => update('health', value)} /><NumberField label="Base Max HP" value={player.baseMaxHealth} onChange={(value) => update('baseMaxHealth', value)} /><NumberField label="Current Mana" value={player.mana} onChange={(value) => update('mana', value)} /><NumberField label="Base Max Mana" value={player.baseMaxMana} onChange={(value) => update('baseMaxMana', value)} /><NumberField label="Base Max Focus" value={player.baseMaxFocus} onChange={(value) => update('baseMaxFocus', value)} /></div><div className="button-row"><Button variant={player.godMode ? 'success' : 'secondary'} onClick={() => setPlayer({ godMode: !player.godMode })}>{player.godMode ? 'God Mode ON' : 'God Mode OFF'}</Button></div></Card><Card title="Quick recovery"><div className="developer-button-grid"><Button onClick={() => setPlayer({ health: player.maxHealth })}>Heal to Full</Button><Button onClick={() => setPlayer({ mana: player.maxMana })}>Fill Mana</Button><Button variant="secondary" onClick={() => setPlayer({ health: player.maxHealth, mana: player.maxMana })}>Refill HP + Mana</Button><Button variant="secondary" onClick={() => setPlayer({ baseMaxFocus: 100 })}>Set Focus 100</Button><Button variant="secondary" onClick={() => setPlayer({ baseMaxFocus: 140 })}>Set Focus 140</Button></div></Card></div>
}
