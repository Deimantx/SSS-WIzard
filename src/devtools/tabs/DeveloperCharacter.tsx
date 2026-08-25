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
  const addMana = useGameStore((state) => state.addMana)
  const setOverCap = useGameStore((state) => state.setDebugAllowManaOverCap)
  const setRegenBonus = useGameStore((state) => state.setDebugManaRegenBonus)
  const setManaBonus = useGameStore((state) => state.setDebugMaxManaBonus)
  const update = (key: keyof typeof player, value: number) => setPlayer({ [key]: value } as Partial<typeof player>)
  const regen = getManaRegenBreakdown({ activities, progress, equipment, debug })

  return <div className="developer-tab-grid">
    <Card title="Player values">
      <div className="developer-summary-grid">
        <Summary label="Current Mana" value={player.mana} />
        <Summary label="Base Max Mana" value={player.baseMaxMana} />
        <Summary label="Final Max Mana" value={player.maxMana} />
        <Summary label="Developer Max Mana Bonus" value={debug.bonusMaxManaFlat} />
        <Summary label="Current Mana Regen" value={`+${regen.total}/s`} />
        <Summary label="Developer Mana Regen Bonus" value={`+${debug.bonusManaRegenFlat}/s`} />
        <Summary label="Final Max Focus" value={player.maxFocus} />
      </div>
      <div className="developer-form-grid">
        <NumberField label="Current Health" value={player.health} onChange={(value) => update('health', value)} />
        <NumberField label="Base Max Health" value={player.baseMaxHealth} onChange={(value) => update('baseMaxHealth', value)} />
        <NumberField label="Current Mana" value={player.mana} onChange={(value) => update('mana', value)} />
        <NumberField label="Base Max Mana" value={player.baseMaxMana} onChange={(value) => update('baseMaxMana', value)} />
      </div>
    </Card>
    <Card title="Mana controls" className="developer-debug-card">
      <label className="developer-check-row"><input type="checkbox" checked={debug.allowManaOverCap} onChange={(event) => setOverCap(event.target.checked)} /> Allow Mana over cap</label>
      <p className="developer-debug-note">Allows current Mana and Mana regeneration to exceed Max Mana for testing.</p>
      <div className="developer-button-grid">
        <Button onClick={() => addMana(100)}>Add 100 Mana</Button>
        <Button onClick={() => addMana(10_000)}>Add 10,000 Mana</Button>
        <Button variant="secondary" onClick={() => setPlayer({ mana: player.maxMana })}>Fill to Max</Button>
        <Button variant="ghost" onClick={() => setPlayer({ mana: 0 })}>Set 0</Button>
      </div>
      <div className="developer-debug-note"><Status tone={debug.allowManaOverCap ? 'warning' : 'neutral'}>{debug.allowManaOverCap ? 'DANGEROUS OVERRIDE ACTIVE' : 'CAP ENFORCED'}</Status><span>Disabling the override immediately clamps current Mana to Max Mana.</span></div>
    </Card>
    <Card title="Resource controls">
      <div className="developer-button-grid">
        <Button onClick={() => setPlayer({ health: player.maxHealth })}>Heal to Max</Button>
        <Button variant="secondary" onClick={() => setPlayer({ health: Math.max(0, player.health - 25) })}>Damage by 25</Button>
        <Button variant={player.godMode ? 'success' : 'secondary'} onClick={() => setPlayer({ godMode: !player.godMode })}>{player.godMode ? 'God Mode ON' : 'God Mode OFF'}</Button>
      </div>
    </Card>
    <Card title="Temporary Mana overrides" className="developer-debug-card">
      <div className="developer-form-grid">
        <NumberField label="Developer Mana Regen Bonus /s" value={debug.bonusManaRegenFlat} onChange={setRegenBonus} />
        <NumberField label="Developer Max Mana Bonus" value={debug.bonusMaxManaFlat} onChange={setManaBonus} />
      </div>
      <div className="developer-debug-note"><Status tone={debug.bonusManaRegenFlat || debug.bonusMaxManaFlat ? 'warning' : 'neutral'}>{debug.bonusManaRegenFlat || debug.bonusMaxManaFlat ? 'ACTIVE' : 'INACTIVE'}</Status><span>These values test runtime calculations and are not permanent progression.</span></div>
    </Card>
  </div>
}
