import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { BALANCE } from '../../game/core/balance/balance'
import { MAX_CRIT_CHANCE } from '../../game/core/balance/combatStats'
import { getEquipmentStatSnapshot } from '../../game/presentation/equipment/equipmentReadModel'
import { useGameStore } from '../../store/gameStore'
import { formatResourceAmount } from '../../game/presentation/resources/resourcePresentation'
import { getDeveloperPlayerStatLab, PLAYER_STAT_LAB_DAMAGE_TYPES } from '../playerStatLabReadModel'
import { NumberField, Summary } from './DeveloperTabPrimitives'

const percent = (value: number) => `${(value * 100).toFixed(1)}%`
const formatResolvedStat = (label: string, value: number) => {
  if (['Crit Chance', 'Crit Damage', 'Mana Cost Reduction', 'Healing Done', 'Barrier Power'].includes(label)) return percent(value)
  if (label === 'Cooldown Recovery') return `${value.toFixed(2)}x`
  return Number(value.toFixed(2))
}
const ELEMENT_LABELS = { physical: 'Physical', arcane: 'Arcane', fire: 'Fire', water: 'Water', earth: 'Earth', air: 'Air' } as const
const OFFENSE_FIELDS = [
  ['damage-dealt-percent', 'Damage Dealt'], ['spell-damage-percent', 'Spell Damage'], ['crit-chance', 'Critical Chance (pp)'],
  ['crit-damage', 'Critical Damage (pp)'], ['damage-over-time-percent', 'Damage over Time'], ['cooldown-recovery-percent', 'Cooldown Recovery'], ['spell-cast-time-percent', 'Spell Cast Time'],
] as const
const DEFENSE_FIELDS = [['defense-flat', 'Defense Flat'], ['defense-percent', 'Defense (%)'], ['damage-taken-percent', 'Damage Taken (%)']] as const
const SUSTAIN_FIELDS = [
  ['healing-done-percent', 'Healing Done'], ['healing-received-percent', 'Healing Received'], ['barrier-power-percent', 'Barrier Power'],
  ['barrier-received-flat', 'Barrier Received Flat'], ['barrier-received-percent', 'Barrier Received (%)'], ['status-duration-dealt-percent', 'Status Duration Dealt'],
  ['status-duration-received-percent', 'Status Duration Received'], ['control-duration-received-percent', 'Control Duration Received'],
] as const
const SECTION_BY_PATH = {
  core: ['maxHealthFlat', 'maxHealthPercent', 'healthRegenFlat', 'maxManaFlat', 'maxManaPercent', 'manaRegenFlat', 'manaRegenPercent', 'spellPowerFlat', 'spellPowerPercent', 'manaCostReductionPercent'],
  offense: [...OFFENSE_FIELDS.map(([key]) => `modifiers.${key}`), ...PLAYER_STAT_LAB_DAMAGE_TYPES.map((type) => `spellDamageByType.${type}`)],
  defense: [...DEFENSE_FIELDS.map(([key]) => `modifiers.${key}`), ...PLAYER_STAT_LAB_DAMAGE_TYPES.map((type) => `resistanceByType.${type}`)],
  sustain: SUSTAIN_FIELDS.map(([key]) => `modifiers.${key}`),
} as const

export function DeveloperCharacter() {
  const state = useGameStore()
  const { player, debug, combat } = state
  const setPlayer = state.setPlayer
  const setValue = state.setDebugPlayerStatValue
  const setBarrier = state.setPlayerBarrierForDebug
  const resetLab = state.resetDebugPlayerStats
  const lab = getDeveloperPlayerStatLab(state)
  const effectiveEquipment = getEquipmentStatSnapshot(state, state.equipment)
  const active = lab.rawModifiers.length > 0 || Object.values(debug.playerStats).some((value) => typeof value === 'number' ? value !== 0 : Object.values(value).some((nested) => nested !== 0))
  const setCore = (key: string, value: number) => setValue(`core.${key}`, value)
  const setPercent = (path: string, value: number) => setValue(path, value / 100)
  const setModifier = (key: string, value: number) => setValue(`modifiers.${key}`, ['crit-chance', 'crit-damage'].includes(key) ? value / 100 : value / 100)
  const resetSection = (section: keyof typeof SECTION_BY_PATH) => SECTION_BY_PATH[section].forEach((path) => setValue(path, 0))
  const setHealthPercent = (value: number) => setPlayer({ health: Math.round(player.maxHealth * value / 100) })
  const setManaPercent = (value: number) => setPlayer({ mana: Math.round(player.maxMana * value / 100) })
  const coreField = (key: keyof typeof debug.playerStats, label: string, isPercent = false) => {
    const value = Number(debug.playerStats[key] ?? 0)
    return <NumberField key={key} label={label} value={isPercent ? value * 100 : value} onChange={(next) => isPercent ? setPercent(`core.${key}`, next) : setCore(key, next)} />
  }

  return <div className="developer-tab-grid developer-player-stat-lab">
    <Card title="Player Stat Lab" className={active ? 'developer-debug-card' : ''}>
      <div className="developer-stat-lab-heading"><div><p>Temporary player-only modifiers resolve through live character and combat systems.</p><GameTooltip content="Overrides are runtime-only, excluded from profile saves, and cleared by Reset All Debug Overrides."><Status tone={active ? 'warning' : 'neutral'}>{active ? 'STAT OVERRIDES ACTIVE' : 'BASE BUILD'}</Status></GameTooltip></div><Button variant="ghost" onClick={resetLab} disabled={!active}>Reset All Lab Bonuses</Button></div>
      <div className="developer-stat-lab-preset-row" aria-label="Player Stat Lab presets">
        <span>PRESETS</span>
        <Button variant="secondary" tooltip="Adds enough Crit Chance to reach the runtime cap." onClick={() => state.applyDebugPlayerStatPreset('crit-cap')}>Crit Cap</Button>
        <Button variant="secondary" tooltip="Adds 500 temporary Spell Power." onClick={() => state.applyDebugPlayerStatPreset('spell-power')}>+500 Spell Power</Button>
        <Button variant="secondary" tooltip="Adds 100% Cooldown Recovery and reduces Spell Cast Time by 50%." onClick={() => state.applyDebugPlayerStatPreset('fast-caster')}>Fast Caster</Button>
        <Button variant="secondary" tooltip="Adds 500 Max HP, 200 Defense, and 25% resistance to each damage type." onClick={() => state.applyDebugPlayerStatPreset('tank')}>Tank</Button>
        <Button variant="secondary" tooltip="Adds 100% Damage over Time and Status Duration dealt." onClick={() => state.applyDebugPlayerStatPreset('dot-status')}>DoT / Status</Button>
        <Button variant="secondary" tooltip="Adds 100% Healing Done, Healing Received, Barrier Power, and Barrier Received." onClick={() => state.applyDebugPlayerStatPreset('healer-barrier')}>Healer / Barrier</Button>
        <Button variant="ghost" tooltip="Removes all Player Stat Lab bonuses." onClick={() => state.applyDebugPlayerStatPreset('clear')}>Clear</Button>
      </div>
      <div className="developer-player-stat-groups">
        <section className="developer-stat-section"><header><div><h3>Core resources</h3><span>Flat values add before percentage modifiers.</span></div><Button variant="ghost" onClick={() => resetSection('core')}>Reset section</Button></header><div className="developer-form-grid">
          {coreField('maxHealthFlat', 'Max HP Flat')}{coreField('maxHealthPercent', 'Max HP (%)', true)}{coreField('healthRegenFlat', 'Health Regen /s')}
          {coreField('maxManaFlat', 'Max Mana Flat')}{coreField('maxManaPercent', 'Max Mana (%)', true)}{coreField('manaRegenFlat', 'Mana Regen /s')}{coreField('manaRegenPercent', 'Mana Regen (%)', true)}
          {coreField('spellPowerFlat', 'Spell Power Flat')}{coreField('spellPowerPercent', 'Spell Power (%)', true)}{coreField('manaCostReductionPercent', 'Mana Cost Reduction (%)', true)}
        </div></section>
        <section className="developer-stat-section"><header><div><h3>Offense</h3><span>Signed values allowed. Crit inputs use percentage points.</span></div><Button variant="ghost" onClick={() => resetSection('offense')}>Reset section</Button></header><div className="developer-form-grid">
          {OFFENSE_FIELDS.map(([key, label]) => <NumberField key={key} label={label} value={(debug.playerStats.modifiers[key] ?? 0) * 100} onChange={(value) => setModifier(key, value)} />)}
          {PLAYER_STAT_LAB_DAMAGE_TYPES.map((type) => <NumberField key={type} label={`${ELEMENT_LABELS[type]} Spell Damage (%)`} value={(debug.playerStats.spellDamageByType[type] ?? 0) * 100} onChange={(value) => setPercent(`spellDamageByType.${type}`, value)} />)}
        </div></section>
        <section className="developer-stat-section"><header><div><h3>Defense</h3><span>Damage and resistance values are signed percentages.</span></div><Button variant="ghost" onClick={() => resetSection('defense')}>Reset section</Button></header><div className="developer-form-grid">
          {DEFENSE_FIELDS.map(([key, label]) => <NumberField key={key} label={label} value={key === 'defense-flat' ? debug.playerStats.modifiers[key] ?? 0 : (debug.playerStats.modifiers[key] ?? 0) * 100} onChange={(value) => key === 'defense-flat' ? setValue(`modifiers.${key}`, value) : setPercent(`modifiers.${key}`, value)} />)}
          {PLAYER_STAT_LAB_DAMAGE_TYPES.map((type) => <NumberField key={type} label={`${ELEMENT_LABELS[type]} Resistance (%)`} value={(debug.playerStats.resistanceByType[type] ?? 0) * 100} onChange={(value) => setPercent(`resistanceByType.${type}`, value)} />)}
        </div></section>
        <section className="developer-stat-section"><header><div><h3>Sustain & status</h3><span>Adjust healing, barriers, and status timing.</span></div><Button variant="ghost" onClick={() => resetSection('sustain')}>Reset section</Button></header><div className="developer-form-grid">
          {SUSTAIN_FIELDS.map(([key, label]) => <NumberField key={key} label={label} value={key === 'barrier-received-flat' ? debug.playerStats.modifiers[key] ?? 0 : (debug.playerStats.modifiers[key] ?? 0) * 100} onChange={(value) => key === 'barrier-received-flat' ? setValue(`modifiers.${key}`, value) : setPercent(`modifiers.${key}`, value)} />)}
        </div><p className="developer-debug-note">Status definitions and active status browsing remain in Combat → Status Lab.</p></section>
      </div>
      <details className="developer-diagnostics"><summary>Advanced · raw scoped debug modifiers ({lab.rawModifiers.length})</summary><pre>{JSON.stringify(lab.rawModifiers, null, 2)}</pre></details>
    </Card>

    <Card title="Player values & live controls" className="developer-debug-card">
      <div className="developer-summary-grid"><Summary label="Current HP / Max" value={`${formatResourceAmount(player.health)} / ${formatResourceAmount(player.maxHealth)}`} /><Summary label="Current Mana / Max" value={`${formatResourceAmount(player.mana)} / ${formatResourceAmount(player.maxMana)}`} /><Summary label="Current Barrier" value={formatResourceAmount(combat.playerBarrier)} /><Summary label="Mana Regen" value={`${lab.resolved.manaRegen.toFixed(2)}/s`} /></div>
      <div className="developer-form-grid"><NumberField label="Current HP" min={0} max={player.maxHealth} value={player.health} onChange={(value) => setPlayer({ health: value })} /><NumberField label="Base Max HP" min={1} value={player.baseMaxHealth} onChange={(value) => { setPlayer({ baseMaxHealth: value }); }} /><NumberField label="Current Mana" min={0} value={player.mana} onChange={(value) => setPlayer({ mana: value })} /><NumberField label="Base Max Mana" min={1} value={player.baseMaxMana} onChange={(value) => { setPlayer({ baseMaxMana: value }); }} /><NumberField label="Current Barrier" min={0} value={combat.playerBarrier} onChange={setBarrier} /></div>
      <div className="developer-button-grid"><Button onClick={() => setPlayer({ health: player.maxHealth })}>Heal Max</Button><Button variant="secondary" onClick={() => setPlayer({ health: 1 })}>HP 1</Button><Button variant="secondary" onClick={() => state.damagePlayerForDebug(25)}>Damage 25</Button><Button variant="secondary" tooltip="Sets current barrier equal to your resolved Max HP." onClick={() => setBarrier(player.maxHealth)}>Barrier Fill</Button><Button variant="secondary" onClick={() => setBarrier(combat.playerBarrier + 100)}>Barrier +100</Button><Button variant="ghost" onClick={() => setBarrier(0)}>Clear Barrier</Button></div>
      <div className="developer-resource-shortcuts"><div role="group" aria-label="HP percentage shortcuts"><span>HP</span>{[1, 10, 25, 50, 100].map((value) => <Button key={value} variant="ghost" ariaLabel={`${value}% HP`} onClick={() => setHealthPercent(value)}>{value}%</Button>)}</div><div role="group" aria-label="Mana percentage shortcuts"><span>Mana</span>{[0, 10, 25, 50, 100].map((value) => <Button key={value} variant="ghost" ariaLabel={`${value}% Mana`} onClick={() => setManaPercent(value)}>{value}%</Button>)}</div><Button variant="ghost" onClick={() => setPlayer({ mana: 0 })}>Mana 0</Button></div>
    </Card>

    <Card title="Equipment / sheet stats" className="developer-debug-card"><div className="developer-summary-grid">
      <Summary label="Spell Power" value={effectiveEquipment.spellPower} /><Summary label="Max HP" value={effectiveEquipment.maxHealth} /><Summary label="Max Mana" value={formatResourceAmount(effectiveEquipment.maxMana)} /><Summary label="Mana Regen" value={`${effectiveEquipment.manaRegen.toFixed(2)}/s`} />
      <Summary label="Crit Chance" value={percent(effectiveEquipment.critChance)} /><Summary label="Crit Damage" value={percent(effectiveEquipment.critDamageMultiplier)} /><Summary label="Defense" value={effectiveEquipment.defense} /><Summary label="DoT Bonus" value={percent(effectiveEquipment.damageOverTimeBonus)} />
      <Summary label="Cooldown Recovery" value={`${effectiveEquipment.cooldownRecovery.toFixed(2)}x`} /><Summary label="Healing Done" value={percent(effectiveEquipment.healingDoneBonus)} /><Summary label="Barrier Power" value={percent(effectiveEquipment.barrierPowerBonus)} /><Summary label="Mana Cost Reduction" value={percent(effectiveEquipment.manaCostReduction)} />
    </div><p className="developer-debug-note">Authored equipment/build snapshot; temporary combat status effects are excluded.</p></Card>

    <Card title="Resolved live combat stats" className="developer-debug-card"><div className="developer-stat-ledger"><div className="developer-stat-ledger-head"><span>STAT</span><span>REAL BUILD</span><span>DEV BONUS</span><span>RESOLVED</span></div>
      {([
        ['Max HP', lab.build.maxHealth, lab.resolved.maxHealth], ['HP Regen /s', lab.build.healthRegen, lab.resolved.healthRegen], ['Max Mana', lab.build.maxMana, lab.resolved.maxMana], ['Mana Regen /s', lab.build.manaRegen, lab.resolved.manaRegen], ['Spell Power', lab.build.spellPower, lab.resolved.spellPower], ['Mana Cost Reduction', lab.build.manaCostReduction, lab.resolved.manaCostReduction], ['Defense', lab.build.defense, lab.resolved.defense], ['Crit Chance', lab.build.critChance, lab.resolved.critChance], ['Crit Damage', lab.build.critDamageMultiplier, lab.resolved.critDamageMultiplier], ['Cooldown Recovery', lab.build.cooldownRecovery, lab.resolved.cooldownRecovery], ['Healing Done', lab.build.healingDoneBonus, lab.resolved.healingDoneBonus], ['Barrier Power', lab.build.barrierPowerBonus, lab.resolved.barrierPowerBonus],
      ] as [string, number, number][]).map(([label, build, resolved]) => <div className="developer-stat-ledger-row" key={label}><span>{label}</span><b>{formatResolvedStat(label, build)}</b><b>{formatResolvedStat(label, resolved - build)}</b><b>{formatResolvedStat(label, resolved)}</b></div>)}
      {lab.metrics.map((metric) => <div className="developer-stat-ledger-row" key={metric.id}><span>{metric.label}</span><b>{metric.id === 'barrier-received-flat' ? formatResolvedStat('Barrier Received Flat', metric.build) : percent(metric.build)}</b><b>{metric.id === 'barrier-received-flat' ? formatResolvedStat('Barrier Received Flat', metric.resolved - metric.build) : percent(metric.resolved - metric.build)}</b><b>{metric.id === 'barrier-received-flat' ? formatResolvedStat('Barrier Received Flat', metric.resolved) : percent(metric.resolved)}</b></div>)}
      <div className="developer-stat-ledger-element-head"><strong>Elemental modifiers / resistance</strong><small>Context-matched against each damage type</small></div>
      {lab.elemental.map((entry) => <div className="developer-stat-ledger-row" key={entry.type}><span>{ELEMENT_LABELS[entry.type]}</span><b>Spell {percent(entry.spellBuild)} / Resist {percent(entry.resistanceBuild)}</b><b>Spell {percent(entry.spellResolved - entry.spellBuild)} / Resist {percent(entry.resistanceResolved - entry.resistanceBuild)}</b><b>Spell {percent(entry.spellResolved)} / Resist {percent(entry.resistanceResolved)}</b></div>)}
    </div><p className="developer-debug-note">Resolved values feed actual spell damage, cost, healing, barrier, defense, resistance, status, and cast timing.</p><div className="developer-debug-note"><Status tone={debug.playerImmortal ? 'warning' : 'neutral'}>{debug.playerImmortal ? 'IMMORTAL ACTIVE' : 'NORMAL SURVIVAL'}</Status><span>Base health regen: {BALANCE.player.healthRegenPerSecond}/s. Crit cap: {percent(MAX_CRIT_CHANCE)}.</span></div></Card>
  </div>
}
