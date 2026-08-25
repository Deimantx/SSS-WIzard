import { Button, Card, Status } from '../../components/ui'
import { getManaRegenBreakdown } from '../../game/engine/channelingEngine'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

export function DeveloperCharacter() {
  const player = useGameStore((state) => state.player)
  const debug = useGameStore((state) => state.debug)
  const activities = useGameStore((state) => state.activities)
  const progress = useGameStore((state) => state.progress)
  const equipment = useGameStore((state) => state.equipment)
  const setPlayer = useGameStore((state) => state.setPlayer)
  const setRegenBonus = useGameStore((state) => state.setDebugManaRegenBonus)
  const setManaBonus = useGameStore((state) => state.setDebugMaxManaBonus)
  const update = (key: keyof typeof player, value: number) => setPlayer({ [key]: value } as Partial<typeof player>)
  const regen = getManaRegenBreakdown({ activities, progress, equipment, debug })
  return <div className="developer-tab-grid">
    <Card title="Player values"><div className="developer-summary-grid"><Summary label="Final Max Health" value={player.maxHealth} /><Summary label="Final Max Mana" value={player.maxMana} /><Summary label="Current Mana Regen" value={`+${regen.total}/s`} /><Summary label="Final Max Focus" value={player.maxFocus} /></div><div className="developer-form-grid"><NumberField label="Current Health" value={player.health} onChange={(value) => update('health', value)} /><NumberField label="Base Max Health" value={player.baseMaxHealth} onChange={(value) => update('baseMaxHealth', value)} /><NumberField label="Current Mana" value={player.mana} onChange={(value) => update('mana', value)} /><NumberField label="Base Max Mana" value={player.baseMaxMana} onChange={(value) => update('baseMaxMana', value)} /></div></Card>
    <Card title="Resource controls"><div className="developer-button-grid"><Button onClick={() => setPlayer({ health: player.maxHealth })}>Heal to Max</Button><Button onClick={() => setPlayer({ health: Math.max(0, player.health - 25) })}>Damage by 25</Button><Button onClick={() => setPlayer({ mana: player.maxMana })}>Fill Mana</Button><Button onClick={() => setPlayer({ mana: player.mana + 100 })}>Add 100 Mana</Button><Button onClick={() => setPlayer({ mana: player.mana - 100 })}>Remove 100 Mana</Button><Button variant={player.godMode ? 'success' : 'secondary'} onClick={() => setPlayer({ godMode: !player.godMode })}>{player.godMode ? 'God Mode ON' : 'God Mode OFF'}</Button></div></Card>
    <Card title="Temporary Mana overrides" className="developer-debug-card"><div className="developer-form-grid"><NumberField label="Developer Mana Regen Bonus /s" value={debug.bonusManaRegenFlat} onChange={setRegenBonus} /><NumberField label="Developer Max Mana Bonus" value={debug.bonusMaxManaFlat} onChange={setManaBonus} /></div><div className="developer-debug-note"><Status tone={debug.bonusManaRegenFlat || debug.bonusMaxManaFlat ? 'warning' : 'neutral'}>{debug.bonusManaRegenFlat || debug.bonusMaxManaFlat ? 'ACTIVE' : 'INACTIVE'}</Status><span>These values test runtime calculations and are not permanent progression.</span></div></Card>
  </div>
}
