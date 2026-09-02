import { Button, Card, Status } from '../../components/ui'
import { getManaRegenBreakdown } from '../../game/engine/channelingEngine'
import { useGameStore } from '../../store/gameStore'
import { getSpellPowerBreakdown } from '../../game/systems/spells/spellPower'
import { getPlayerCombatStats } from '../../game/systems/combat/combatStats'
import { getEquipmentStatSnapshot } from '../../screens/equipment/equipmentPreview'
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
  const setImmortal = useGameStore((state) => state.setDebugPlayerImmortal)
  const damagePlayerForDebug = useGameStore((state) => state.damagePlayerForDebug)
  const update = (key: keyof typeof player, value: number) => setPlayer({ [key]: value } as Partial<typeof player>)
  const regen = getManaRegenBreakdown({ activities, progress, equipment, debug })
  const spellPower = getSpellPowerBreakdown({ equipment })
  const resolvedCombat = getPlayerCombatStats(useGameStore((state) => state))
  const effectiveEquipment = getEquipmentStatSnapshot(useGameStore((state) => state), equipment)
  const combatRngState = useGameStore((state) => state.combat.combatRngState)

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
        <Summary label="Spell Power Base" value={spellPower.base} />
        <Summary label="Spell Power Equipment" value={spellPower.equipment} />
        <Summary label="Spell Power Total" value={spellPower.total} />
      </div>
      <div className="developer-form-grid">
        <NumberField label="Current Health" value={player.health} onChange={(value) => update('health', value)} />
        <NumberField label="Base Max Health" value={player.baseMaxHealth} onChange={(value) => update('baseMaxHealth', value)} />
        <NumberField label="Current Mana" value={player.mana} onChange={(value) => update('mana', value)} />
        <NumberField label="Base Max Mana" value={player.baseMaxMana} onChange={(value) => update('baseMaxMana', value)} />
      </div>
    </Card>
    <Card title="Resolved combat stats" className="developer-debug-card">
      <div className="developer-summary-grid">
        <Summary label="Spell Power" value={resolvedCombat.spellPower} />
        <Summary label="Max HP" value={resolvedCombat.maxHealth} />
        <Summary label="Max Mana" value={resolvedCombat.maxMana} />
        <Summary label="Max Focus" value={resolvedCombat.maxFocus} />
        <Summary label="Mana Regen" value={`${resolvedCombat.manaRegen}/s`} />
        <Summary label="Basic Damage" value={resolvedCombat.basicAttackDamage} />
        <Summary label="Basic Speed" value={`${resolvedCombat.basicAttackSpeedMultiplier.toFixed(2)}x`} />
        <Summary label="Crit Chance" value={`${Math.round(resolvedCombat.critChance * 100)}%`} />
        <Summary label="Crit Damage" value={`${Math.round(resolvedCombat.critDamageMultiplier * 100)}%`} />
        <Summary label="Defense" value={resolvedCombat.defense} />
        <Summary label="Block Chance" value={`${Math.round(resolvedCombat.blockChance * 100)}%`} />
        <Summary label="DoT Bonus" value={`${Math.round(resolvedCombat.damageOverTimeBonus * 100)}%`} />
        <Summary label="Status Duration" value={`${Math.round(resolvedCombat.statusDurationBonus * 100)}%`} />
        <Summary label="Cooldown Recovery" value={`${resolvedCombat.cooldownRecovery.toFixed(2)}x`} />
        <Summary label="Healing Done" value={`${Math.round(resolvedCombat.healingDoneBonus * 100)}%`} />
        <Summary label="Barrier Power" value={`${Math.round(resolvedCombat.barrierPowerBonus * 100)}%`} />
        <Summary label="Mana Cost Reduction" value={`${Math.round(resolvedCombat.manaCostReduction * 100)}%`} />
        <Summary label="Focus Efficiency" value={`${Math.round(resolvedCombat.focusEfficiency * 100)}%`} />
        <Summary label="Fire Spell Damage" value={`${Math.round(effectiveEquipment.fireSpellDamage * 100)}%`} />
        <Summary label="Air Spell Damage" value={`${Math.round(effectiveEquipment.airSpellDamage * 100)}%`} />
        <Summary label="Water Barrier Power" value={`${Math.round(effectiveEquipment.waterBarrierPower * 100)}%`} />
        <Summary label="Barrier Received" value={`+${effectiveEquipment.barrierReceivedFlat}`} />
        <Summary label="Received Negative Status" value={`${Math.round(effectiveEquipment.negativeStatusDurationReceived * 100)}%`} />
        {Object.entries(resolvedCombat.resistances).map(([type, value]) => <Summary key={type} label={`${type[0].toUpperCase()}${type.slice(1)} Resistance`} value={`${Math.round((value ?? 0) * 100)}%`} />)}
        <Summary label="Combat RNG State" value={combatRngState} />
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
        <Button variant="secondary" onClick={() => damagePlayerForDebug(25)}>Damage by 25</Button>
        <Button variant={debug.playerImmortal ? 'success' : 'secondary'} onClick={() => setImmortal(!debug.playerImmortal)}>{debug.playerImmortal ? 'Player Immortal ON' : 'Player Immortal OFF'}</Button>
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
